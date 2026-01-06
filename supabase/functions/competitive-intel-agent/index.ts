import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { organization_id, config } = await req.json();
    
    console.log(`[competitive-intel-agent] Running for org: ${organization_id}`);

    const actions: any[] = [];
    const signals: any[] = [];

    // 1. Analyze call transcripts for competitor mentions
    const { data: recentCalls, error: callError } = await supabase
      .from('call_analysis')
      .select('*, call_transcripts(*)')
      .eq('organization_id', organization_id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (callError) {
      console.error('[competitive-intel-agent] Error fetching calls:', callError);
    }

    // Track competitor mention frequency
    const competitorMentions: Record<string, number> = {};
    
    for (const call of (recentCalls || [])) {
      const mentions = call.competitor_mentions || [];
      for (const competitor of mentions) {
        competitorMentions[competitor] = (competitorMentions[competitor] || 0) + 1;
      }
    }

    // Create signals for frequently mentioned competitors
    for (const [competitor, count] of Object.entries(competitorMentions)) {
      if (count >= 3) {
        const severity = count >= 5 ? 'high' : 'medium';
        
        signals.push({
          organization_id,
          signal_type: 'competitor_mention',
          competitor_name: competitor,
          severity,
          source: 'call_analysis',
          details: { mention_count: count, period: '7_days' },
          response_required: count >= 5
        });

        actions.push({
          action_type: 'competitor_alert',
          decision: `Competitor "${competitor}" mentioned ${count} times in sales calls this week`,
          reasoning: count >= 5 
            ? 'High frequency suggests prospects are actively comparing. Differentiation strategy needed.'
            : 'Monitor competitor positioning and adjust messaging if trend continues.',
          target_entity_type: 'competitor',
          target_entity_id: null,
          confidence_score: Math.min(50 + count * 10, 95),
          was_auto_executed: true,
          requires_approval: false
        });
      }
    }

    // 2. Check differentiation score from market positions
    const { data: marketPosition } = await supabase
      .from('market_positions')
      .select('*')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (marketPosition) {
      const diffScore = marketPosition.differentiation_score || 50;
      
      if (diffScore < 40) {
        signals.push({
          organization_id,
          signal_type: 'positioning_change',
          competitor_name: null,
          severity: 'critical',
          source: 'market_positions',
          details: { 
            differentiation_score: diffScore,
            category: marketPosition.category_name 
          },
          response_required: true
        });

        actions.push({
          action_type: 'commoditization_warning',
          decision: `CRITICAL: Differentiation score dropped to ${diffScore}% - commoditization risk`,
          reasoning: 'Low differentiation means pricing power erosion. Must create unique positioning or risk margin compression.',
          target_entity_type: 'market_position',
          target_entity_id: marketPosition.id,
          confidence_score: 90,
          was_auto_executed: false,
          requires_approval: true
        });

        // Block new marketing spend when commoditized
        const { data: pendingMarketing } = await supabase
          .from('decisions')
          .select('id')
          .eq('organization_id', organization_id)
          .eq('decision_type', 'marketing_spend')
          .eq('status', 'pending');

        if (pendingMarketing && pendingMarketing.length > 0) {
          for (const decision of pendingMarketing) {
            await supabase
              .from('decisions')
              .update({
                blocked_by_agent: 'competitive-intel-agent',
                block_reason: 'Marketing spend blocked until differentiation improved. Current score: ' + diffScore
              })
              .eq('id', decision.id);
          }

          actions.push({
            action_type: 'block_marketing',
            decision: `Blocked ${pendingMarketing.length} marketing spend decision(s) due to low differentiation`,
            reasoning: 'Spending on marketing while commoditized is wasteful. Fix positioning first.',
            target_entity_type: 'decision',
            target_entity_id: pendingMarketing[0].id,
            confidence_score: 85,
            was_auto_executed: true,
            requires_approval: false
          });
        }
      }
    }

    // 3. Analyze anti-commoditization data
    const { data: antiCommodAnalysis } = await supabase
      .from('anti_commoditization_analyses')
      .select('*')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (antiCommodAnalysis) {
      const moatStrength = antiCommodAnalysis.moat_strength || 50;
      const uniquenessScore = antiCommodAnalysis.uniqueness_score || 50;
      
      if (moatStrength < 30 || uniquenessScore < 30) {
        signals.push({
          organization_id,
          signal_type: 'market_share_shift',
          competitor_name: null,
          severity: 'high',
          source: 'anti_commoditization_analyses',
          details: { 
            moat_strength: moatStrength,
            uniqueness_score: uniquenessScore,
            commoditization_risk: antiCommodAnalysis.commoditization_risk 
          },
          response_required: true
        });

        actions.push({
          action_type: 'moat_erosion',
          decision: `Economic moat weakening: strength ${moatStrength}%, uniqueness ${uniquenessScore}%`,
          reasoning: 'Without strong differentiation, pricing power will erode. Recommend IP creation or category design.',
          target_entity_type: 'analysis',
          target_entity_id: antiCommodAnalysis.id,
          confidence_score: 80,
          was_auto_executed: false,
          requires_approval: true
        });
      }
    }

    // 4. Check for pricing undercuts (from deal data)
    const { data: recentDeals } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('status', 'lost')
      .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const lostToPrice = (recentDeals || []).filter(d => 
      d.lost_reason?.toLowerCase().includes('price') || 
      d.lost_reason?.toLowerCase().includes('cheaper') ||
      d.lost_reason?.toLowerCase().includes('cost')
    );

    if (lostToPrice.length >= 3) {
      signals.push({
        organization_id,
        signal_type: 'pricing_undercut',
        competitor_name: null,
        severity: 'high',
        source: 'lost_deals',
        details: { 
          lost_to_price_count: lostToPrice.length,
          period: '30_days' 
        },
        response_required: true
      });

      actions.push({
        action_type: 'pricing_pressure',
        decision: `${lostToPrice.length} deals lost to pricing in last 30 days`,
        reasoning: 'Pattern indicates either value perception issues or genuine commoditization. Analyze win/loss patterns.',
        target_entity_type: 'pricing',
        target_entity_id: null,
        confidence_score: 75,
        was_auto_executed: false,
        requires_approval: true
      });
    }

    // 5. Insert all detected signals
    if (signals.length > 0) {
      const { error: signalError } = await supabase
        .from('competitive_signals')
        .insert(signals);

      if (signalError) {
        console.error('[competitive-intel-agent] Error inserting signals:', signalError);
      }
    }

    // 6. Log all actions
    for (const action of actions) {
      await supabase
        .from('autonomous_actions')
        .insert({
          organization_id,
          agent_type: 'competitive-intel',
          ...action
        });
    }

    console.log(`[competitive-intel-agent] Completed. Signals: ${signals.length}, Actions: ${actions.length}`);

    return new Response(JSON.stringify({
      success: true,
      signals_detected: signals.length,
      actions_taken: actions.length,
      competitor_mentions: competitorMentions,
      differentiation_score: marketPosition?.differentiation_score,
      details: {
        signals,
        actions
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[competitive-intel-agent] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
