import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StyleMarkers {
  sentence_length_avg: number;
  formality_score: number;
  humor_markers: string[];
  signature_phrases: string[];
  greeting_style: string;
  closing_style: string;
  tone_keywords: string[];
  vocabulary_preferences: Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, organization_id, samples, sample_type } = await req.json();

    if (action === 'ingest_samples') {
      // Store training samples for processing
      const sampleRecords = samples.map((content: string) => ({
        organization_id,
        sample_type: sample_type || 'email',
        content,
        processed: false
      }));

      const { error } = await supabase
        .from('style_training_samples')
        .insert(sampleRecords);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, samples_added: samples.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'process_samples') {
      // Get unprocessed samples for this org
      const { data: unprocessed, error: fetchError } = await supabase
        .from('style_training_samples')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('processed', false)
        .limit(50);

      if (fetchError) throw fetchError;
      if (!unprocessed || unprocessed.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'No samples to process' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Combine samples for analysis
      const combinedContent = unprocessed.map(s => s.content).join('\n\n---SAMPLE BREAK---\n\n');

      const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analyze these communication samples from a business owner to extract their unique writing style.

SAMPLES:
${combinedContent}

Extract the following style markers in JSON format:
{
  "sentence_length_avg": <average words per sentence>,
  "formality_score": <0.0 to 1.0, where 0 is casual and 1 is formal>,
  "humor_markers": ["phrases or patterns that indicate humor"],
  "signature_phrases": ["unique phrases they use repeatedly"],
  "greeting_style": "their typical greeting pattern",
  "closing_style": "how they typically sign off",
  "tone_keywords": ["adjectives describing their tone"],
  "vocabulary_preferences": {
    "instead_of_X": "they_say_Y"
  }
}

Be specific and extract actual examples from the text.
Respond with ONLY the JSON object.`
              }]
            }],
            generationConfig: { temperature: 0.2 }
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze samples');
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      let styleMarkers: StyleMarkers;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        styleMarkers = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch (e) {
        console.error('Failed to parse style markers:', e);
        styleMarkers = {
          sentence_length_avg: 15,
          formality_score: 0.5,
          humor_markers: [],
          signature_phrases: [],
          greeting_style: 'Hi',
          closing_style: 'Best',
          tone_keywords: ['professional'],
          vocabulary_preferences: {}
        };
      }

      // Update or create style vector
      const { data: existing } = await supabase
        .from('style_vectors')
        .select('id, sample_count')
        .eq('organization_id', organization_id)
        .single();

      if (existing) {
        await supabase
          .from('style_vectors')
          .update({
            ...styleMarkers,
            source_type: unprocessed[0].sample_type,
            sample_count: (existing.sample_count || 0) + unprocessed.length,
            last_updated: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('style_vectors')
          .insert({
            organization_id,
            source_type: unprocessed[0].sample_type,
            ...styleMarkers,
            sample_count: unprocessed.length
          });
      }

      // Mark samples as processed
      await supabase
        .from('style_training_samples')
        .update({ processed: true, extracted_markers: styleMarkers })
        .in('id', unprocessed.map(s => s.id));

      return new Response(
        JSON.stringify({ success: true, style_markers: styleMarkers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'apply_style') {
      const { content, organization_id: orgId } = await req.json();

      // Get style vector
      const { data: styleVector, error } = await supabase
        .from('style_vectors')
        .select('*')
        .eq('organization_id', orgId)
        .single();

      if (error || !styleVector) {
        return new Response(
          JSON.stringify({ success: true, styled_content: content, applied: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Rewrite this content to match a specific writing style.

ORIGINAL CONTENT:
${content}

STYLE REQUIREMENTS:
- Average sentence length: ${styleVector.sentence_length_avg} words
- Formality level: ${styleVector.formality_score} (0=casual, 1=formal)
- Greeting style: "${styleVector.greeting_style}"
- Closing style: "${styleVector.closing_style}"
- Tone: ${(styleVector.tone_keywords || []).join(', ')}
- Try to incorporate signature phrases: ${(styleVector.signature_phrases || []).join(', ')}
- Vocabulary preferences: ${JSON.stringify(styleVector.vocabulary_preferences || {})}

Rewrite the content maintaining the same meaning but adopting this unique voice.
Return ONLY the rewritten content, no explanations.`
              }]
            }],
            generationConfig: { temperature: 0.7 }
          })
        }
      );

      if (!response.ok) {
        return new Response(
          JSON.stringify({ success: true, styled_content: content, applied: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await response.json();
      const styledContent = result.candidates?.[0]?.content?.parts?.[0]?.text || content;

      return new Response(
        JSON.stringify({ success: true, styled_content: styledContent, applied: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_style') {
      const { data: styleVector, error } = await supabase
        .from('style_vectors')
        .select('*')
        .eq('organization_id', organization_id)
        .single();

      return new Response(
        JSON.stringify({ success: true, style_vector: styleVector || null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Shadow Mode Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
