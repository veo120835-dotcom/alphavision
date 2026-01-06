import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WinningChat {
  id: string;
  messages: any[];
  org_id: string;
  industry_type: string;
}

interface ExtractedPattern {
  objection: string;
  handler: string;
  success_indicator: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, industry_type } = await req.json();

    if (action === 'analyze_wins') {
      // Get all winning chats from last week
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const { data: wins, error: winsError } = await supabase
        .from('chats')
        .select(`
          id,
          messages,
          organization_id,
          organizations!inner(industry_type)
        `)
        .eq('outcome', 'deal_closed')
        .gte('created_at', lastWeek.toISOString());

      if (winsError) throw winsError;

      // Group by industry
      const industryPatterns: Record<string, any[]> = {};
      for (const win of wins || []) {
        const industry = (win.organizations as any)?.industry_type || 'general';
        if (!industryPatterns[industry]) {
          industryPatterns[industry] = [];
        }
        industryPatterns[industry].push(win);
      }

      // Extract patterns using AI
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
      const patternsExtracted: any[] = [];

      for (const [industry, chats] of Object.entries(industryPatterns)) {
        if (chats.length < 3) continue; // Need minimum sample size

        const chatSummaries = chats.slice(0, 10).map(c => 
          JSON.stringify(c.messages?.slice(-5) || [])
        ).join('\n---\n');

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Analyze these winning sales conversations from the ${industry} industry.
                  
Extract the TOP 3 most effective patterns:
1. Common objections and the responses that led to closing
2. Effective closing phrases
3. Trust-building techniques

For each pattern, provide:
- pattern_type: 'objection_handler' | 'closing_technique' | 'trust_builder'
- trigger: What customer said/did that triggered this
- response: The effective response
- success_rate_estimate: 0-100

Conversations:
${chatSummaries}

Respond in JSON array format only.`
                }]
              }],
              generationConfig: { temperature: 0.3 }
            })
          }
        );

        if (response.ok) {
          const result = await response.json();
          const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
          
          try {
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const patterns = JSON.parse(jsonMatch[0]);
              for (const pattern of patterns) {
                patternsExtracted.push({
                  industry_type: industry,
                  pattern_type: pattern.pattern_type,
                  insight: pattern.trigger,
                  suggested_prompt_fragment: pattern.response,
                  success_rate: pattern.success_rate_estimate,
                  sample_size: chats.length
                });
              }
            }
          } catch (e) {
            console.error('Failed to parse patterns:', e);
          }
        }
      }

      // Upsert to global_niche_wisdom
      if (patternsExtracted.length > 0) {
        const { error: insertError } = await supabase
          .from('global_niche_wisdom')
          .insert(patternsExtracted);

        if (insertError) console.error('Insert error:', insertError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          patterns_extracted: patternsExtracted.length,
          industries_analyzed: Object.keys(industryPatterns).length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'promote_handlers') {
      // Find handlers with >40% conversion across 50+ orgs
      const { data: handlers, error } = await supabase
        .from('objection_handlers')
        .select('*')
        .gte('org_count', 50)
        .eq('is_master', false);

      if (error) throw error;

      const promoted: string[] = [];
      for (const handler of handlers || []) {
        const conversionRate = handler.usage_count > 0 
          ? (handler.conversion_count / handler.usage_count) * 100 
          : 0;

        if (conversionRate >= 40) {
          await supabase
            .from('objection_handlers')
            .update({ is_master: true })
            .eq('id', handler.id);

          // Also add to global wisdom
          await supabase
            .from('global_niche_wisdom')
            .insert({
              industry_type: handler.industry_type,
              pattern_type: 'objection_handler',
              insight: handler.objection_pattern,
              suggested_prompt_fragment: handler.handler_text,
              success_rate: conversionRate,
              sample_size: handler.usage_count,
              promoted_to_master: true,
              confidence_score: Math.min(99, conversionRate + (handler.org_count / 10))
            });

          promoted.push(handler.id);
        }
      }

      return new Response(
        JSON.stringify({ success: true, promoted_count: promoted.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_wisdom') {
      // Get wisdom for a specific industry
      const { data: wisdom, error } = await supabase
        .from('global_niche_wisdom')
        .select('*')
        .eq('industry_type', industry_type || 'general')
        .order('confidence_score', { ascending: false })
        .limit(20);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, wisdom }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'record_usage') {
      const { handler_id, converted, org_id } = await req.json();

      // Increment usage count
      const { data: handler } = await supabase
        .from('objection_handlers')
        .select('*')
        .eq('id', handler_id)
        .single();

      if (handler) {
        const updates: any = {
          usage_count: (handler.usage_count || 0) + 1
        };

        if (converted) {
          updates.conversion_count = (handler.conversion_count || 0) + 1;
        }

        await supabase
          .from('objection_handlers')
          .update(updates)
          .eq('id', handler_id);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Hive Mind Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
