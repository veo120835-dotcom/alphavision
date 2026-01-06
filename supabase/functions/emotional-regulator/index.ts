import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PanicPattern {
  type: string;
  description: string;
  detected: boolean;
  severity: number;
  evidence: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { organization_id, config } = await req.json();
    
    console.log(`[emotional-regulator] Running for org: ${organization_id}`);

    const actions: any[] = [];
    const detectedPatterns: PanicPattern[] = [];

    // 1. Check decision velocity (decision fatigue detection)
    const { data: recentDecisions } = await supabase
      .from('decisions')
      .select('*')
      .eq('organization_id', organization_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const decisionCount = recentDecisions?.length || 0;
    
    if (decisionCount > 10) {
      detectedPatterns.push({
        type: 'decision_fatigue',
        description: `${decisionCount} decisions in 24 hours - decision fatigue risk`,
        detected: true,
        severity: Math.min(50 + (decisionCount - 10) * 5, 90),
        evidence: { decision_count: decisionCount, threshold: 10 }
      });

      actions.push({
        action_type: 'fatigue_warning',
        decision: `Decision fatigue detected: ${decisionCount} decisions today. Slowing down non-urgent items.`,
        reasoning: 'High decision volume degrades decision quality. Recommend batching or deferring non-critical choices.',
        target_entity_type: 'founder_state',
        target_entity_id: null,
        confidence_score: 75,
        was_auto_executed: false,
        requires_approval: false
      });

      // Log to founder state
      await supabase
        .from('founder_state_logs')
        .insert({
          organization_id,
          energy_level: 'low',
          confidence_level: 'medium',
          state_notes: `Decision fatigue alert: ${decisionCount} decisions in 24h`
        });
    }

    // 2. Check for panic buying (multiple tool/subscription purchases)
    const { data: recentPurchases } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('category', 'subscription')
      .gte('transaction_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const purchaseCount = recentPurchases?.length || 0;
    
    if (purchaseCount >= 3) {
      detectedPatterns.push({
        type: 'panic_buying',
        description: `${purchaseCount} new subscriptions in 7 days - shiny object syndrome`,
        detected: true,
        severity: 70,
        evidence: { purchase_count: purchaseCount, threshold: 3 }
      });

      // Block new subscription decisions
      const { data: pendingSubscriptions } = await supabase
        .from('decisions')
        .select('id')
        .eq('organization_id', organization_id)
        .ilike('decision_type', '%subscription%')
        .eq('status', 'pending');

      if (pendingSubscriptions && pendingSubscriptions.length > 0) {
        for (const decision of pendingSubscriptions) {
          await supabase
            .from('decisions')
            .update({
              blocked_by_agent: 'emotional-regulator',
              block_reason: `48h cooling-off period. ${purchaseCount} subscriptions added this week.`,
              cooling_off_until: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
            })
            .eq('id', decision.id);
        }

        actions.push({
          action_type: 'block_panic_purchase',
          decision: `Blocked ${pendingSubscriptions.length} subscription decision(s) - 48h cooling-off enforced`,
          reasoning: `${purchaseCount} subscriptions purchased in 7 days indicates shiny object syndrome. Enforcing pause.`,
          target_entity_type: 'decision',
          target_entity_id: pendingSubscriptions[0].id,
          confidence_score: 80,
          was_auto_executed: true,
          requires_approval: false
        });
      }

      // Create business threat
      await supabase
        .from('business_threats')
        .insert({
          organization_id,
          threat_type: 'shiny_object_syndrome',
          description: `${purchaseCount} new subscriptions in 7 days detected`,
          severity: 'medium',
          source: 'emotional-regulator',
          auto_blocked: true,
          block_reason: '48h cooling-off period enforced on new subscriptions'
        });
    }

    // 3. Check for scarcity decisions (major commitments after losing clients)
    const { data: recentLosses } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('status', 'lost')
      .gte('updated_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

    const { data: largePendingDecisions } = await supabase
      .from('decisions')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('status', 'pending')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Look for large decisions shortly after losses
    if ((recentLosses?.length || 0) > 0 && (largePendingDecisions?.length || 0) > 0) {
      for (const decision of largePendingDecisions || []) {
        const context = decision.context || {};
        const amount = context.amount || context.value || 0;
        
        if (amount > 5000) {
          detectedPatterns.push({
            type: 'scarcity_decision',
            description: `Large decision ($${amount}) within 48h of losing client`,
            detected: true,
            severity: 65,
            evidence: { 
              decision_amount: amount, 
              recent_losses: recentLosses?.length,
              decision_type: decision.decision_type
            }
          });

          await supabase
            .from('decisions')
            .update({
              blocked_by_agent: 'emotional-regulator',
              block_reason: 'Potential scarcity-driven decision. Review after 24h cooling-off.',
              cooling_off_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('id', decision.id);

          actions.push({
            action_type: 'block_scarcity_decision',
            decision: `Flagged $${amount} decision made within 48h of losing client`,
            reasoning: 'Large financial decisions made shortly after losses are often reactive. Enforcing cooling-off period.',
            target_entity_type: 'decision',
            target_entity_id: decision.id,
            confidence_score: 70,
            was_auto_executed: true,
            requires_approval: false
          });
        }
      }
    }

    // 4. Check for shiny object (new project mid-existing project)
    const { data: activeProjects } = await supabase
      .from('decisions')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('decision_type', 'project_start')
      .eq('status', 'approved')
      .is('completed_at', null);

    const { data: newProjectRequests } = await supabase
      .from('decisions')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('decision_type', 'project_start')
      .eq('status', 'pending');

    if ((activeProjects?.length || 0) >= 2 && (newProjectRequests?.length || 0) > 0) {
      for (const newProject of newProjectRequests || []) {
        detectedPatterns.push({
          type: 'shiny_object',
          description: `New project requested with ${activeProjects?.length} projects already active`,
          detected: true,
          severity: 60,
          evidence: { 
            active_projects: activeProjects?.length,
            new_project: newProject.context?.name || 'Unnamed'
          }
        });

        actions.push({
          action_type: 'shiny_object_warning',
          decision: `New project blocked - ${activeProjects?.length} projects already active`,
          reasoning: 'Starting new projects before completing existing ones fragments focus and reduces completion rate.',
          target_entity_type: 'decision',
          target_entity_id: newProject.id,
          confidence_score: 65,
          was_auto_executed: false,
          requires_approval: true
        });
      }
    }

    // 5. Check for overreaction patterns (rapid reversals)
    const { data: recentReversals } = await supabase
      .from('decisions')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('decision_type', 'reversal')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if ((recentReversals?.length || 0) >= 2) {
      detectedPatterns.push({
        type: 'overreaction',
        description: `${recentReversals?.length} decision reversals in 7 days`,
        detected: true,
        severity: 55,
        evidence: { reversal_count: recentReversals?.length }
      });

      actions.push({
        action_type: 'overreaction_alert',
        decision: `Pattern detected: ${recentReversals?.length} reversals this week`,
        reasoning: 'Frequent reversals indicate reactive decision-making. Recommend slowing decision pace.',
        target_entity_type: 'pattern',
        target_entity_id: null,
        confidence_score: 60,
        was_auto_executed: false,
        requires_approval: false
      });
    }

    // 6. Log all actions
    for (const action of actions) {
      await supabase
        .from('autonomous_actions')
        .insert({
          organization_id,
          agent_type: 'emotional-regulator',
          ...action
        });
    }

    // 7. Update immune system rules if new patterns detected
    for (const pattern of detectedPatterns) {
      if (pattern.severity >= 65) {
        // Check if rule exists
        const { data: existingRule } = await supabase
          .from('immune_system_rules')
          .select('id')
          .eq('organization_id', organization_id)
          .eq('rule_type', pattern.type)
          .single();

        if (!existingRule) {
          await supabase
            .from('immune_system_rules')
            .insert({
              organization_id,
              rule_type: pattern.type,
              rule_name: pattern.description,
              trigger_conditions: pattern.evidence,
              auto_action: 'block',
              severity: pattern.severity >= 70 ? 'high' : 'medium',
              is_active: true
            });
        }
      }
    }

    console.log(`[emotional-regulator] Completed. Patterns: ${detectedPatterns.length}, Actions: ${actions.length}`);

    return new Response(JSON.stringify({
      success: true,
      patterns_detected: detectedPatterns.length,
      actions_taken: actions.length,
      decision_velocity: decisionCount,
      details: {
        patterns: detectedPatterns,
        actions
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[emotional-regulator] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
