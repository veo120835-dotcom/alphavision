import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL_SYSTEM_PROMPT = `You are an expert in judgment-based cold email copywriting.

You are NOT writing:
- Flattery emails ("I love your website...")
- Event-based emails ("Congrats on the funding...")
- Template personalization ("I noticed you're in {industry}...")
- Salesy or pushy messages

You ARE writing:
- Pattern diagnosis emails ("I noticed your positioning feels crowded...")
- Authority signals ("This pattern typically leads to...")
- Peer-to-peer tone, completely non-salesy
- Emails that demonstrate you understand their ACTUAL situation

RULES:
- Never start with "I" or flattery
- Never use "hope this finds you well" or similar
- No links in body
- No attachments
- No hard CTAs or calendar links
- Reference the PATTERN, not generic observations
- Sound like a peer who noticed something interesting
- Keep it under 150 words
- End with a soft, curiosity-driving closing

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "subject_line": "Short, curiosity-driving (no hype, no caps, no emojis)",
  "email_body": "Authority-based, pattern-focused email body",
  "closing_loop": "Soft CTA that creates intrigue without selling",
  "personalization_hooks": ["List of what makes this feel personal"],
  "confidence_score": 0.0-1.0
}`;

interface EmailRequest {
  diagnosisId: string;
  organizationId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { diagnosisId, organizationId } = await req.json() as EmailRequest;

    if (!diagnosisId || !organizationId) {
      return new Response(JSON.stringify({ error: 'diagnosisId and organizationId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the diagnosis
    const { data: diagnosis, error: diagnosisError } = await supabase
      .from('website_diagnoses')
      .select('*')
      .eq('id', diagnosisId)
      .eq('organization_id', organizationId)
      .single();

    if (diagnosisError || !diagnosis) {
      return new Response(JSON.stringify({ error: 'Diagnosis not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch business profile for context
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    // Fetch relevant industry preset
    const { data: industryPreset } = await supabase
      .from('industry_presets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle();

    // Fetch revenue pivots for closing loops
    const { data: revenuePivots } = await supabase
      .from('revenue_pivots')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .limit(3);

    // Build context for AI
    const context = {
      diagnosis: diagnosis.diagnosis_json,
      dominantPattern: diagnosis.dominant_pattern,
      primaryConstraint: diagnosis.primary_constraint,
      pressureSignals: diagnosis.pressure_signals,
      revenueStage: diagnosis.revenue_stage,
      businessName: businessProfile?.business_name || 'our company',
      founderName: businessProfile?.founder_name || '',
      expertise: businessProfile?.founder_expertise || [],
      closingLoopOptions: revenuePivots?.map(p => p.revenue_response) || [],
      industryContext: industryPreset?.sales_style || '',
    };

    console.log('Generating email with context:', JSON.stringify(context, null, 2));

    // Call Lovable AI for email generation
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: EMAIL_SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `Generate an authority-based cold email based on this website diagnosis:

DIAGNOSIS CONTEXT:
- Dominant Pattern: ${context.dominantPattern}
- Primary Constraint: ${context.primaryConstraint}
- Revenue Stage: ${context.revenueStage}
- Pressure Signals: ${context.pressureSignals?.join(', ')}
- Full Diagnosis: ${JSON.stringify(context.diagnosis)}

SENDER CONTEXT:
- Sender Name: ${context.founderName || 'The Operator'}
- Expertise Areas: ${context.expertise?.join(', ') || 'Business Strategy'}

CLOSING LOOP OPTIONS (pick one or create similar):
${context.closingLoopOptions?.join('\n') || 'If you\'re curious, I mapped out how similar operators have resolved this. Happy to share if useful.'}

Generate an email that:
1. Opens with an observation about their specific pattern (not flattery)
2. Names the constraint or friction this pattern creates
3. Positions the sender as someone who recognizes this pattern
4. Ends with a soft, non-salesy closing loop`
          }
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
    const emailText = aiData.choices?.[0]?.message?.content || '';
    
    console.log('Raw AI response:', emailText);

    // Parse the JSON response
    let emailData;
    try {
      const jsonMatch = emailText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        emailData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse AI email response',
        rawResponse: emailText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save the generated email
    const { data: savedEmail, error: saveError } = await supabase
      .from('authority_emails')
      .insert({
        organization_id: organizationId,
        diagnosis_id: diagnosisId,
        contact_id: diagnosis.contact_id,
        subject_line: emailData.subject_line,
        email_body: emailData.email_body,
        closing_loop: emailData.closing_loop,
        personalization_hooks: emailData.personalization_hooks || [],
        confidence_score: emailData.confidence_score || 0.75,
        status: 'draft',
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving email:', saveError);
      throw saveError;
    }

    // Update pattern performance tracking
    await supabase
      .from('pattern_performance')
      .upsert({
        organization_id: organizationId,
        dominant_pattern: diagnosis.dominant_pattern,
        primary_constraint: diagnosis.primary_constraint,
        emails_sent: 0,
      }, {
        onConflict: 'organization_id,dominant_pattern,primary_constraint'
      });

    console.log('Email saved:', savedEmail.id);

    return new Response(JSON.stringify({
      success: true,
      email: savedEmail
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in authority-email-generator:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});