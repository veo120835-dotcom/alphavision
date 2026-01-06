import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DIAGNOSIS_SYSTEM_PROMPT = `You are a business diagnostic engine.
Your job is to analyze website copy and infer business stage, constraints, and dominant patterns.
You do not write emails. You do not advise. You only diagnose.

TASK:
Analyze the provided website content using the following lenses:
- Clarity vs Impression
- Offer Structure
- Language Quality
- Credibility Signals
- Sales & Entry Signals

INFER (do not guess emotionally):
- Likely revenue stage
- Primary constraint (choose ONE)
- Where pressure shows up
- Dominant business pattern

OUTPUT FORMAT (STRICT JSON ONLY - no prose, no markdown):
{
  "clarity": "clear | mixed | vague",
  "offer_structure": "single | multiple | custom-heavy",
  "language_style": "outcome-driven | adjective-driven | mixed",
  "credibility_type": "judgment-based | credential-based | mixed",
  "sales_entry": "open | filtered | unclear",
  "revenue_stage": "early | mid | established",
  "primary_constraint": "positioning | pricing | offer | sales | authority | systems",
  "pressure_signals": ["string array of specific observations"],
  "dominant_pattern": "short, neutral, accurate description of the main pattern",
  "confidence": 0.0-1.0
}`;

interface DiagnosisRequest {
  organizationId: string;
  contactId?: string;
  websiteUrl?: string;
  pastedContent?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, contactId, websiteUrl, pastedContent } = await req.json() as DiagnosisRequest;

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'organizationId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!websiteUrl && !pastedContent) {
      return new Response(JSON.stringify({ error: 'Either websiteUrl or pastedContent is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let contentToAnalyze = pastedContent || '';
    const inputType = pastedContent ? 'paste' : 'url';

    // If URL provided, fetch and extract content
    if (websiteUrl && !pastedContent) {
      console.log(`Fetching website: ${websiteUrl}`);
      try {
        const response = await fetch(websiteUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AlphaVisionBot/1.0)',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch website: ${response.status}`);
        }

        const html = await response.text();
        
        // Extract text content - strip scripts, styles, nav, footer
        contentToAnalyze = html
          // Remove scripts and styles
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          // Remove nav and footer
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          // Remove HTML tags
          .replace(/<[^>]+>/g, ' ')
          // Clean up whitespace
          .replace(/\s+/g, ' ')
          .trim()
          // Limit length
          .slice(0, 15000);

        console.log(`Extracted ${contentToAnalyze.length} characters from website`);
      } catch (fetchError) {
        console.error('Error fetching website:', fetchError);
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch website content',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!contentToAnalyze || contentToAnalyze.length < 50) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient content to analyze',
        details: 'Website content is too short or could not be extracted'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Lovable AI for diagnosis
    console.log('Calling AI for diagnosis...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: DIAGNOSIS_SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this website content and provide a structured diagnosis:\n\n${contentToAnalyze}` }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const diagnosisText = aiData.choices?.[0]?.message?.content || '';
    
    console.log('Raw AI response:', diagnosisText);

    // Parse the JSON response
    let diagnosis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = diagnosisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        diagnosis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse AI diagnosis',
        rawResponse: diagnosisText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: savedDiagnosis, error: saveError } = await supabase
      .from('website_diagnoses')
      .insert({
        organization_id: organizationId,
        contact_id: contactId || null,
        website_url: websiteUrl || null,
        pasted_content: pastedContent || null,
        input_type: inputType,
        clarity: diagnosis.clarity,
        offer_structure: diagnosis.offer_structure,
        language_style: diagnosis.language_style,
        credibility_type: diagnosis.credibility_type,
        sales_entry: diagnosis.sales_entry,
        revenue_stage: diagnosis.revenue_stage,
        primary_constraint: diagnosis.primary_constraint,
        pressure_signals: diagnosis.pressure_signals || [],
        dominant_pattern: diagnosis.dominant_pattern,
        diagnosis_json: diagnosis,
        confidence_score: diagnosis.confidence || 0.75,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving diagnosis:', saveError);
      throw saveError;
    }

    console.log('Diagnosis saved:', savedDiagnosis.id);

    return new Response(JSON.stringify({
      success: true,
      diagnosis: savedDiagnosis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in website-diagnosis:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});