import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IndustryScore {
  industry_code: string;
  industry_name: string;
  score: number;
  matched_patterns: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, website_content, website_url } = await req.json();

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: 'Missing organization_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Detecting industry for org ${organization_id}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all industry presets
    const { data: presets, error: presetsError } = await supabase
      .from('industry_presets')
      .select('*');

    if (presetsError || !presets) {
      console.error('Error fetching presets:', presetsError);
      return new Response(
        JSON.stringify({ error: 'Could not fetch industry presets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no website content provided, try to get it from org_knowledge
    let contentToAnalyze = website_content?.toLowerCase() || '';
    
    if (!contentToAnalyze) {
      const { data: knowledge } = await supabase
        .from('org_knowledge')
        .select('content')
        .eq('organization_id', organization_id)
        .limit(10);

      if (knowledge && knowledge.length > 0) {
        contentToAnalyze = knowledge.map(k => k.content).join(' ').toLowerCase();
      }
    }

    if (!contentToAnalyze) {
      return new Response(
        JSON.stringify({ 
          error: 'No content to analyze',
          detected_industry: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Score each industry based on pattern matches
    const industryScores: IndustryScore[] = presets.map(preset => {
      const patterns = preset.auto_detect_patterns || [];
      const matchedPatterns: string[] = [];
      let score = 0;

      for (const pattern of patterns) {
        const patternLower = pattern.toLowerCase();
        const regex = new RegExp(`\\b${patternLower}\\b`, 'gi');
        const matches = contentToAnalyze.match(regex);
        if (matches) {
          score += matches.length;
          if (!matchedPatterns.includes(pattern)) {
            matchedPatterns.push(pattern);
          }
        }
      }

      // Bonus for URL matching
      if (website_url) {
        const urlLower = website_url.toLowerCase();
        for (const pattern of patterns) {
          if (urlLower.includes(pattern.toLowerCase())) {
            score += 5;
            if (!matchedPatterns.includes(pattern)) {
              matchedPatterns.push(pattern);
            }
          }
        }
      }

      return {
        industry_code: preset.industry_code,
        industry_name: preset.industry_name,
        score,
        matched_patterns: matchedPatterns
      };
    });

    // Sort by score and get top match
    industryScores.sort((a, b) => b.score - a.score);
    
    const topMatch = industryScores[0];
    const confidence = topMatch.score > 0 
      ? Math.min(topMatch.score / 20, 1) 
      : 0;

    console.log(`Detected industry: ${topMatch.industry_name} (confidence: ${confidence})`);

    // Get full preset for detected industry
    const detectedPreset = presets.find(p => p.industry_code === topMatch.industry_code);

    // Optionally update business profile with detected industry
    if (topMatch.score > 5) { // Only update if reasonably confident
      const { error: updateError } = await supabase
        .from('business_profiles')
        .update({ industry: topMatch.industry_code })
        .eq('organization_id', organization_id);

      if (updateError) {
        console.log('Could not update business profile:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        detected_industry: topMatch.industry_code,
        industry_name: topMatch.industry_name,
        confidence,
        matched_patterns: topMatch.matched_patterns,
        preset: detectedPreset,
        all_scores: industryScores.slice(0, 5) // Top 5 for debugging
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Niche detection error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});