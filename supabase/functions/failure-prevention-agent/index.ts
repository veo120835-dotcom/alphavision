import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FailureMode {
  id: string;
  failure_type: string;
  risk_score: number;
  description: string;
  detection_criteria: any;
  prevention_action: string;
}

interface Decision {
  id: string;
  organization_id: string;
  decision_type: string;
  context: any;
  options: any;
  status: string;
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
    
    console.log(`[failure-prevention-agent] Running for org: ${organization_id}`);

    const actions: any[] = [];
    const autoExecuteThreshold = config?.auto_execute_threshold || 80;

    // 1. Fetch active failure modes for this organization
    const { data: failureModes, error: fmError } = await supabase
      .from('failure_modes')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('status', 'active');

    if (fmError) {
      console.error('[failure-prevention-agent] Error fetching failure modes:', fmError);
    }

    // 2. Fetch pending decisions
    const { data: pendingDecisions, error: decError } = await supabase
      .from('decisions')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('status', 'pending')
      .is('blocked_by_agent', null);

    if (decError) {
      console.error('[failure-prevention-agent] Error fetching decisions:', decError);
    }

    // 3. Fetch recent autonomous actions that might trigger failure modes
    const { data: recentActions, error: actError } = await supabase
      .from('autonomous_actions')
      .select('*')
      .eq('organization_id', organization_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .is('executed_at', null);

    // 4. Check each pending decision against failure modes
    const blockedDecisions: any[] = [];
    
    for (const decision of (pendingDecisions || [])) {
      for (const mode of (failureModes || [])) {
        const matchResult = checkDecisionAgainstFailureMode(decision, mode);
        
        if (matchResult.matches) {
          const shouldAutoBlock = mode.risk_score >= 70; // High risk = auto-block
          
          if (shouldAutoBlock) {
            // Auto-block this decision
            const { error: blockError } = await supabase
              .from('decisions')
              .update({
                blocked_by_agent: 'failure-prevention-agent',
                block_reason: `Matches failure mode: ${mode.failure_type}. ${mode.description}`,
                cooling_off_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              })
              .eq('id', decision.id);

            if (!blockError) {
              blockedDecisions.push({
                decision_id: decision.id,
                failure_mode: mode.failure_type,
                risk_score: mode.risk_score,
                reason: matchResult.reason
              });

              actions.push({
                action_type: 'block_decision',
                decision: `Blocked decision "${decision.decision_type}" due to failure mode: ${mode.failure_type}`,
                reasoning: matchResult.reason,
                target_entity_type: 'decision',
                target_entity_id: decision.id,
                confidence_score: mode.risk_score,
                was_auto_executed: true,
                requires_approval: false
              });
            }
          } else {
            // Create approval request for borderline cases
            actions.push({
              action_type: 'flag_risk',
              decision: `Flagged decision "${decision.decision_type}" for review - potential failure mode: ${mode.failure_type}`,
              reasoning: matchResult.reason,
              target_entity_type: 'decision',
              target_entity_id: decision.id,
              confidence_score: mode.risk_score,
              was_auto_executed: false,
              requires_approval: true
            });
          }
        }
      }
    }

    // 5. Check for sequencing violations (actions happening out of order)
    const sequencingViolations = await checkSequencingDiscipline(supabase, organization_id);
    
    for (const violation of sequencingViolations) {
      actions.push({
        action_type: 'sequencing_violation',
        decision: `Sequencing violation detected: ${violation.description}`,
        reasoning: violation.reasoning,
        target_entity_type: violation.entity_type,
        target_entity_id: violation.entity_id,
        confidence_score: violation.severity,
        was_auto_executed: violation.auto_blocked,
        requires_approval: !violation.auto_blocked
      });
    }

    // 6. Check capital allocation against runway
    const runwayCheck = await checkRunwaySafety(supabase, organization_id);
    
    if (runwayCheck.violation) {
      actions.push({
        action_type: 'runway_protection',
        decision: runwayCheck.message,
        reasoning: runwayCheck.reasoning,
        target_entity_type: 'capital',
        target_entity_id: null,
        confidence_score: 95,
        was_auto_executed: true,
        requires_approval: false
      });
    }

    // 7. Log all actions
    for (const action of actions) {
      await supabase
        .from('autonomous_actions')
        .insert({
          organization_id,
          agent_type: 'failure-prevention',
          ...action
        });
    }

    // 8. Update failure mode tracking
    if (blockedDecisions.length > 0) {
      for (const blocked of blockedDecisions) {
        await supabase
          .from('failure_modes')
          .update({
            occurrences: supabase.rpc('increment_occurrences'),
            last_occurrence: new Date().toISOString()
          })
          .eq('id', blocked.failure_mode_id);
      }
    }

    console.log(`[failure-prevention-agent] Completed. Actions: ${actions.length}, Blocked: ${blockedDecisions.length}`);

    return new Response(JSON.stringify({
      success: true,
      actions_taken: actions.length,
      decisions_blocked: blockedDecisions.length,
      sequencing_violations: sequencingViolations.length,
      runway_safe: !runwayCheck.violation,
      details: {
        blocked_decisions: blockedDecisions,
        sequencing_violations: sequencingViolations,
        runway_check: runwayCheck
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[failure-prevention-agent] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function checkDecisionAgainstFailureMode(decision: Decision, mode: FailureMode): { matches: boolean; reason: string } {
  const criteria = mode.detection_criteria || {};
  const context = decision.context || {};
  
  // Check decision type match
  if (criteria.decision_types && !criteria.decision_types.includes(decision.decision_type)) {
    return { matches: false, reason: '' };
  }
  
  // Check for specific patterns
  if (mode.failure_type === 'premature_scaling') {
    // Check if scaling decision without product-market fit indicators
    if (decision.decision_type === 'hiring' || decision.decision_type === 'expansion') {
      if (!context.product_market_fit_score || context.product_market_fit_score < 70) {
        return { 
          matches: true, 
          reason: `Scaling decision without sufficient product-market fit (score: ${context.product_market_fit_score || 'unknown'})` 
        };
      }
    }
  }
  
  if (mode.failure_type === 'cash_burn') {
    // Check if large expense during low runway
    if (context.amount && context.runway_months) {
      if (context.amount > 10000 && context.runway_months < 6) {
        return { 
          matches: true, 
          reason: `Large expense ($${context.amount}) during low runway (${context.runway_months} months)` 
        };
      }
    }
  }
  
  if (mode.failure_type === 'bad_client') {
    // Check if accepting client that matches bad patterns
    if (decision.decision_type === 'client_acceptance') {
      if (context.quality_score && context.quality_score < 40) {
        return { 
          matches: true, 
          reason: `Accepting low-quality client (score: ${context.quality_score})` 
        };
      }
    }
  }
  
  if (mode.failure_type === 'emotional_decision') {
    // Check for rapid decisions after negative events
    if (context.decision_velocity && context.recent_negative_event) {
      if (context.decision_velocity > 5) {
        return { 
          matches: true, 
          reason: `High decision velocity (${context.decision_velocity}) after negative event: ${context.recent_negative_event}` 
        };
      }
    }
  }
  
  return { matches: false, reason: '' };
}

async function checkSequencingDiscipline(supabase: any, organizationId: string): Promise<any[]> {
  const violations: any[] = [];
  
  // Check for scaling without fundamentals
  const { data: recentHiring } = await supabase
    .from('decisions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('decision_type', 'hiring')
    .eq('status', 'pending')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  
  if (recentHiring && recentHiring.length > 0) {
    // Check if there are unresolved churn issues
    const { data: churnAlerts } = await supabase
      .from('failure_modes')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('failure_type', 'high_churn')
      .eq('status', 'active');
    
    if (churnAlerts && churnAlerts.length > 0) {
      violations.push({
        description: 'Hiring while churn issues unresolved',
        reasoning: 'Cannot scale team while customer retention is problematic. Fix churn first.',
        entity_type: 'decision',
        entity_id: recentHiring[0].id,
        severity: 75,
        auto_blocked: true
      });
    }
  }
  
  // Check for marketing spend without conversion optimization
  const { data: marketingDecisions } = await supabase
    .from('decisions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('decision_type', 'marketing_spend')
    .eq('status', 'pending');
  
  if (marketingDecisions && marketingDecisions.length > 0) {
    const { data: conversionData } = await supabase
      .from('funnel_events')
      .select('conversion_rate')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!conversionData || conversionData.length === 0 || (conversionData[0]?.conversion_rate || 0) < 2) {
      violations.push({
        description: 'Marketing spend with low conversion rate',
        reasoning: 'Increasing marketing spend with conversion rate below 2% is inefficient. Optimize funnel first.',
        entity_type: 'decision',
        entity_id: marketingDecisions[0].id,
        severity: 60,
        auto_blocked: false
      });
    }
  }
  
  return violations;
}

async function checkRunwaySafety(supabase: any, organizationId: string): Promise<any> {
  // Get latest business twin data
  const { data: twinData } = await supabase
    .from('business_digital_twin')
    .select('burn_metrics, revenue_streams')
    .eq('organization_id', organizationId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();
  
  if (!twinData) {
    return { violation: false, message: 'No financial data available', reasoning: '' };
  }
  
  const burnMetrics = twinData.burn_metrics || {};
  const runwayMonths = burnMetrics.runway_months || 12;
  
  // Check pending capital allocations
  const { data: pendingAllocations } = await supabase
    .from('allocation_decisions')
    .select('requested_amount')
    .eq('organization_id', organizationId)
    .is('decision', null);
  
  const totalPending = (pendingAllocations || []).reduce((sum: number, a: any) => sum + (a.requested_amount || 0), 0);
  
  // If pending allocations would reduce runway below 6 months, block
  if (runwayMonths < 6) {
    return {
      violation: true,
      message: `Runway below 6-month safety threshold (${runwayMonths} months). All non-essential spending blocked.`,
      reasoning: 'Business survival requires maintaining minimum 6-month runway. Current runway is dangerously low.'
    };
  }
  
  // Calculate if pending allocations would breach threshold
  const monthlyBurn = burnMetrics.monthly_burn || 10000;
  const projectedRunway = runwayMonths - (totalPending / monthlyBurn);
  
  if (projectedRunway < 6 && totalPending > 0) {
    return {
      violation: true,
      message: `Pending allocations ($${totalPending}) would reduce runway to ${projectedRunway.toFixed(1)} months. Blocked.`,
      reasoning: 'Capital allocation would breach 6-month runway safety threshold.'
    };
  }
  
  return { violation: false, message: 'Runway safe', reasoning: '' };
}
