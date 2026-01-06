import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentConfig {
  id: string;
  organization_id: string;
  agent_type: string;
  enabled: boolean;
  risk_tolerance: 'conservative' | 'balanced' | 'aggressive';
  auto_execute_threshold: number;
  requires_approval_above: number;
  max_daily_actions: number;
  last_run: string | null;
  total_actions_taken: number;
  config: Record<string, any>;
}

interface AgentResult {
  agent_type: string;
  actions_taken: number;
  actions_blocked: number;
  value_generated: number;
  errors: string[];
}

interface MarketContext {
  phase: string;
  aggressiveness: number;
}

interface NoInputModeState {
  is_enabled: boolean;
  alert_threshold: string;
  observations_today: number;
  decisions_prepared: number;
  risks_flagged: number;
  opportunities_queued: number;
  actions_auto_executed: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const targetOrgId = body.organizationId;
    const generateBrief = body.generateBrief ?? false;

    console.log("🤖 Autonomous Agent Runner starting...");

    // Get all organizations with autopilot enabled or specific org
    let orgsQuery = supabase.from('permission_contracts').select('organization_id, autonomy_level, settings');
    
    if (targetOrgId) {
      orgsQuery = orgsQuery.eq('organization_id', targetOrgId);
    }

    const { data: contracts, error: contractsError } = await orgsQuery;

    if (contractsError) {
      throw new Error(`Failed to fetch contracts: ${contractsError.message}`);
    }

    // Filter orgs with autonomy level >= 2 (Execute within caps)
    const eligibleOrgs = contracts?.filter(c => 
      (c.autonomy_level >= 2) || targetOrgId
    ) || [];

    console.log(`Found ${eligibleOrgs.length} eligible organizations`);

    const allResults: Record<string, AgentResult[]> = {};

    for (const contract of eligibleOrgs) {
      const orgId = contract.organization_id;
      console.log(`\n📊 Processing organization: ${orgId}`);

      // === PHASE 4: Get market timing context ===
      const marketContext = await getMarketContext(supabase, orgId);
      console.log(`📈 Market phase: ${marketContext.phase}, Aggressiveness: ${marketContext.aggressiveness}`);

      // === PHASE 5: Check no-input mode ===
      const noInputState = await getNoInputModeState(supabase, orgId);
      const isNoInputMode = noInputState?.is_enabled || false;
      console.log(`👁️ No-Input Mode: ${isNoInputMode ? 'ENABLED' : 'disabled'}`);

      // Get agent configs for this org
      const { data: agentConfigs } = await supabase
        .from('autonomous_agent_config')
        .select('*')
        .eq('organization_id', orgId)
        .eq('enabled', true);

      // If no configs exist, create defaults
      if (!agentConfigs || agentConfigs.length === 0) {
        const defaultAgents = [
          'pricing_enforcer', 'client_filter', 'meeting_enforcer', 'waste_detector',
          'failure_prevention', 'competitive_intel', 'emotional_regulator'
        ];
        
        for (const agentType of defaultAgents) {
          await supabase.from('autonomous_agent_config').upsert({
            organization_id: orgId,
            agent_type: agentType,
            enabled: true,
            risk_tolerance: 'balanced',
            auto_execute_threshold: 70,
            requires_approval_above: 1000,
            max_daily_actions: 50,
            config: {}
          }, { onConflict: 'organization_id,agent_type' });
        }
      }

      const orgResults: AgentResult[] = [];

      // Determine which agents to run
      const allAgentTypes = [
        'pricing_enforcer', 'client_filter', 'meeting_enforcer', 'waste_detector',
        'failure_prevention', 'competitive_intel', 'emotional_regulator'
      ];
      const agentTypes = agentConfigs?.map(c => c.agent_type) || allAgentTypes;

      for (const agentType of agentTypes) {
        const config = agentConfigs?.find(c => c.agent_type === agentType);
        
        if (config && !config.enabled) {
          console.log(`⏸️ Agent ${agentType} is disabled, skipping`);
          continue;
        }

        try {
          // Adjust thresholds based on market context and no-input mode
          const adjustedConfig = adjustConfigForContext(config, marketContext, isNoInputMode);
          
          const result = await runAgent(supabase, orgId, agentType, adjustedConfig, marketContext);
          orgResults.push(result);
          
          // Update last_run timestamp and counters
          await supabase
            .from('autonomous_agent_config')
            .update({ 
              last_run: new Date().toISOString(),
              total_actions_taken: (config?.total_actions_taken || 0) + result.actions_taken,
              total_value_generated: (config?.total_value_generated || 0) + result.value_generated
            })
            .eq('organization_id', orgId)
            .eq('agent_type', agentType);

        } catch (agentError) {
          console.error(`❌ Agent ${agentType} error:`, agentError);
          orgResults.push({
            agent_type: agentType,
            actions_taken: 0,
            actions_blocked: 0,
            value_generated: 0,
            errors: [agentError instanceof Error ? agentError.message : 'Unknown error']
          });
        }
      }

      allResults[orgId] = orgResults;

      // Update passive mode stats
      const totalActions = orgResults.reduce((sum, r) => sum + r.actions_taken, 0);
      const totalBlocked = orgResults.reduce((sum, r) => sum + r.actions_blocked, 0);
      
      if (noInputState) {
        await supabase
          .from('passive_mode_state')
          .update({
            observations_today: (noInputState.observations_today || 0) + totalActions,
            actions_auto_executed: (noInputState.actions_auto_executed || 0) + totalActions,
            risks_flagged: (noInputState.risks_flagged || 0) + totalBlocked
          })
          .eq('organization_id', orgId);
      }

      // Log the orchestration run
      await supabase.from('agent_execution_logs').insert({
        organization_id: orgId,
        action_type: 'autonomous_orchestration',
        reasoning: `Ran ${orgResults.length} autonomous agents (Market: ${marketContext.phase}, NoInput: ${isNoInputMode})`,
        action_details: { 
          results: orgResults,
          market_context: marketContext,
          no_input_mode: isNoInputMode
        },
        result: 'completed'
      });

      // Generate daily brief if requested
      if (generateBrief) {
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/daily-brief-generator`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ organization_id: orgId })
          });
          console.log(`📋 Daily brief generated for org ${orgId}`);
        } catch (briefError) {
          console.error(`Failed to generate daily brief:`, briefError);
        }
      }
    }

    console.log("\n✅ Autonomous Agent Runner completed");

    return new Response(JSON.stringify({
      success: true,
      organizations_processed: eligibleOrgs.length,
      results: allResults
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Autonomous runner error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// === MARKET TIMING INTEGRATION (Phase 4) ===
async function getMarketContext(supabase: any, orgId: string): Promise<MarketContext> {
  const { data: marketAnalysis } = await supabase
    .from('market_cycle_analysis')
    .select('market_phase, timing_recommendation')
    .eq('organization_id', orgId)
    .order('analysis_date', { ascending: false })
    .limit(1)
    .single();

  const phase = marketAnalysis?.market_phase || 'consolidation';
  
  // Adjust agent aggressiveness based on market phase
  const aggressiveness: Record<string, number> = {
    'growth': 1.5,      // More aggressive - push for revenue
    'expansion': 1.3,   // Moderately aggressive
    'consolidation': 1.0, // Neutral - standard operations
    'harvest': 0.8,     // Conservative - protect margins
    'pivot': 0.5        // Very conservative - minimize risk
  };

  return {
    phase,
    aggressiveness: aggressiveness[phase] || 1.0
  };
}

// === NO-INPUT MODE STATE (Phase 5) ===
async function getNoInputModeState(supabase: any, orgId: string): Promise<NoInputModeState | null> {
  const { data: passiveState } = await supabase
    .from('passive_mode_state')
    .select('*')
    .eq('organization_id', orgId)
    .single();

  return passiveState;
}

// Adjust agent config based on market context and no-input mode
function adjustConfigForContext(
  config: AgentConfig | null, 
  marketContext: MarketContext,
  isNoInputMode: boolean
): AgentConfig | null {
  if (!config) return null;

  const adjustedConfig = { ...config };
  
  // Market-based adjustments
  adjustedConfig.auto_execute_threshold = Math.round(
    (config.auto_execute_threshold || 70) / marketContext.aggressiveness
  );
  
  adjustedConfig.requires_approval_above = Math.round(
    (config.requires_approval_above || 1000) * marketContext.aggressiveness
  );

  // No-input mode adjustments - increase autonomy
  if (isNoInputMode) {
    adjustedConfig.auto_execute_threshold = Math.round(adjustedConfig.auto_execute_threshold * 0.7);
    adjustedConfig.requires_approval_above = Math.round(adjustedConfig.requires_approval_above * 2);
    adjustedConfig.max_daily_actions = (adjustedConfig.max_daily_actions || 50) * 2;
  }

  return adjustedConfig;
}

async function runAgent(
  supabase: any, 
  orgId: string, 
  agentType: string, 
  config: AgentConfig | null,
  marketContext: MarketContext
): Promise<AgentResult> {
  console.log(`🔄 Running agent: ${agentType} (market: ${marketContext.phase})`);
  
  const result: AgentResult = {
    agent_type: agentType,
    actions_taken: 0,
    actions_blocked: 0,
    value_generated: 0,
    errors: []
  };

  const riskTolerance = config?.risk_tolerance || 'balanced';
  const threshold = config?.auto_execute_threshold || 70;
  const maxApproval = config?.requires_approval_above || 1000;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  switch (agentType) {
    case 'pricing_enforcer':
      return await runPricingEnforcer(supabase, orgId, threshold, maxApproval, riskTolerance, marketContext);
    
    case 'client_filter':
      return await runClientFilter(supabase, orgId, threshold, config?.config, marketContext);
    
    case 'meeting_enforcer':
      return await runMeetingEnforcer(supabase, orgId, threshold, maxApproval);
    
    case 'waste_detector':
      return await runWasteDetector(supabase, orgId, threshold, maxApproval);
    
    case 'failure_prevention':
      // Call the dedicated edge function
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/failure-prevention-agent`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ organization_id: orgId, config })
        });
        const data = await response.json();
        return {
          agent_type: 'failure_prevention',
          actions_taken: data.actions_taken || 0,
          actions_blocked: data.decisions_blocked || 0,
          value_generated: 0,
          errors: data.success ? [] : [data.error || 'Unknown error']
        };
      } catch (e) {
        result.errors.push(e instanceof Error ? e.message : 'Failed to run failure prevention agent');
        return result;
      }
    
    case 'competitive_intel':
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/competitive-intel-agent`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ organization_id: orgId, config })
        });
        const data = await response.json();
        return {
          agent_type: 'competitive_intel',
          actions_taken: data.actions_taken || 0,
          actions_blocked: 0,
          value_generated: 0,
          errors: data.success ? [] : [data.error || 'Unknown error']
        };
      } catch (e) {
        result.errors.push(e instanceof Error ? e.message : 'Failed to run competitive intel agent');
        return result;
      }
    
    case 'emotional_regulator':
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/emotional-regulator`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ organization_id: orgId, config })
        });
        const data = await response.json();
        return {
          agent_type: 'emotional_regulator',
          actions_taken: data.actions_taken || 0,
          actions_blocked: data.patterns_detected || 0,
          value_generated: 0,
          errors: data.success ? [] : [data.error || 'Unknown error']
        };
      } catch (e) {
        result.errors.push(e instanceof Error ? e.message : 'Failed to run emotional regulator');
        return result;
      }
    
    default:
      result.errors.push(`Unknown agent type: ${agentType}`);
      return result;
  }
}

// ================== PRICING ENFORCER AGENT ==================
async function runPricingEnforcer(
  supabase: any, 
  orgId: string, 
  threshold: number,
  maxApproval: number,
  riskTolerance: string,
  marketContext: MarketContext
): Promise<AgentResult> {
  const result: AgentResult = {
    agent_type: 'pricing_enforcer',
    actions_taken: 0,
    actions_blocked: 0,
    value_generated: 0,
    errors: []
  };

  // Get business config for pricing rules
  const { data: bizConfig } = await supabase
    .from('business_config')
    .select('*')
    .eq('organization_id', orgId)
    .single();

  if (!bizConfig) {
    result.errors.push('No business config found');
    return result;
  }

  const basePrice = bizConfig.base_price || 0;
  // Adjust max discount based on market phase
  let maxDiscountPercent = riskTolerance === 'conservative' ? 5 : riskTolerance === 'balanced' ? 10 : 15;
  if (marketContext.phase === 'growth') maxDiscountPercent += 5; // More flexible in growth
  if (marketContext.phase === 'harvest') maxDiscountPercent -= 5; // Protect margins

  // Check recent revenue events for discount violations
  const { data: revenueEvents } = await supabase
    .from('revenue_events')
    .select('*')
    .eq('organization_id', orgId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  for (const event of revenueEvents || []) {
    if (basePrice > 0 && event.amount < basePrice * (1 - maxDiscountPercent / 100)) {
      // Discount violation detected
      const discountGiven = ((basePrice - event.amount) / basePrice * 100).toFixed(1);
      
      await supabase.from('autonomous_actions').insert({
        organization_id: orgId,
        agent_type: 'pricing_enforcer',
        action_type: 'discount_violation_flagged',
        target_entity_type: 'revenue_event',
        target_entity_id: event.id,
        decision: 'flagged',
        reasoning: `Discount of ${discountGiven}% exceeds maximum allowed ${maxDiscountPercent}%`,
        confidence_score: 95,
        value_impact: basePrice - event.amount,
        was_auto_executed: true,
        executed_at: new Date().toISOString()
      });
      
      result.actions_taken++;
      result.value_generated += basePrice - event.amount;
    }
  }

  // Check for underpricing opportunities
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', orgId)
    .eq('status', 'qualified')
    .gt('intent_score', 80);

  if (leads && leads.length > 0 && riskTolerance !== 'conservative') {
    // High-intent leads might accept higher pricing
    await supabase.from('autonomous_actions').insert({
      organization_id: orgId,
      agent_type: 'pricing_enforcer',
      action_type: 'pricing_opportunity',
      decision: 'recommend_premium_pricing',
      reasoning: `${leads.length} high-intent leads (score >80) detected. Consider premium pricing tier.`,
      confidence_score: 75,
      requires_approval: true,
      was_auto_executed: false
    });
    
    result.actions_taken++;
  }

  return result;
}

// ================== CLIENT FILTER AGENT ==================
async function runClientFilter(
  supabase: any, 
  orgId: string, 
  threshold: number,
  config: Record<string, any> | undefined,
  marketContext: MarketContext
): Promise<AgentResult> {
  const result: AgentResult = {
    agent_type: 'client_filter',
    actions_taken: 0,
    actions_blocked: 0,
    value_generated: 0,
    errors: []
  };

  // Adjust quality threshold based on market phase
  let qualityThreshold = config?.quality_threshold || 30;
  if (marketContext.phase === 'growth') qualityThreshold -= 10; // Accept more leads in growth
  if (marketContext.phase === 'harvest') qualityThreshold += 15; // Be more selective
  if (marketContext.phase === 'pivot') qualityThreshold -= 5; // Need learning data

  // Find unprocessed leads that should be filtered
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', orgId)
    .eq('status', 'new')
    .lt('intent_score', qualityThreshold);

  for (const lead of leads || []) {
    // Auto-reject low quality leads
    await supabase
      .from('leads')
      .update({ status: 'rejected' })
      .eq('id', lead.id);

    await supabase.from('autonomous_actions').insert({
      organization_id: orgId,
      agent_type: 'client_filter',
      action_type: 'auto_reject',
      target_entity_type: 'lead',
      target_entity_id: lead.id,
      decision: 'rejected',
      reasoning: `Lead quality score (${lead.intent_score || 0}) below threshold (${qualityThreshold})`,
      confidence_score: lead.intent_score || 0,
      was_auto_executed: true,
      executed_at: new Date().toISOString()
    });

    result.actions_taken++;
  }

  // Find high-quality leads to fast-track
  const { data: premiumLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', orgId)
    .eq('status', 'new')
    .gt('intent_score', 80);

  for (const lead of premiumLeads || []) {
    await supabase
      .from('leads')
      .update({ status: 'qualified', priority: 1 })
      .eq('id', lead.id);

    await supabase.from('autonomous_actions').insert({
      organization_id: orgId,
      agent_type: 'client_filter',
      action_type: 'fast_track',
      target_entity_type: 'lead',
      target_entity_id: lead.id,
      decision: 'fast_tracked',
      reasoning: `High-quality lead (score: ${lead.intent_score}) auto-qualified and prioritized`,
      confidence_score: lead.intent_score,
      was_auto_executed: true,
      executed_at: new Date().toISOString()
    });

    result.actions_taken++;
  }

  return result;
}

// ================== MEETING ENFORCER AGENT ==================
async function runMeetingEnforcer(
  supabase: any, 
  orgId: string, 
  threshold: number,
  maxApproval: number
): Promise<AgentResult> {
  const result: AgentResult = {
    agent_type: 'meeting_enforcer',
    actions_taken: 0,
    actions_blocked: 0,
    value_generated: 0,
    errors: []
  };

  // Get business config for hourly rate calculation
  const { data: bizConfig } = await supabase
    .from('business_config')
    .select('*')
    .eq('organization_id', orgId)
    .single();

  const idealDealValue = bizConfig?.ideal_deal_value || 5000;
  const impliedHourlyRate = idealDealValue / 10; // Assume 10 hours per deal

  // Check upcoming calendar events
  const { data: calendarEvents } = await supabase
    .from('calendar_events_sync')
    .select('*')
    .eq('organization_id', orgId)
    .gte('start_time', new Date().toISOString())
    .lte('start_time', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
    .eq('cancelled', false);

  for (const event of calendarEvents || []) {
    const durationHours = (event.duration_minutes || 60) / 60;
    const opportunityCost = durationHours * impliedHourlyRate;
    const isRevenueGenerating = event.is_revenue_generating || false;

    // If meeting is not revenue-generating and opportunity cost is high
    if (!isRevenueGenerating && opportunityCost > threshold) {
      // Check if this meeting type should be auto-declined
      const meetingType = event.event_type || 'general';
      const lowValueTypes = ['intro', 'networking', 'catch-up', 'coffee chat'];
      
      if (lowValueTypes.some(t => meetingType.toLowerCase().includes(t) || (event.title || '').toLowerCase().includes(t))) {
        await supabase.from('auto_declined_activities').insert({
          organization_id: orgId,
          activity_type: 'meeting',
          activity_description: event.title || 'Untitled meeting',
          estimated_opportunity_cost: opportunityCost,
          reason_declined: `Non-revenue meeting with opportunity cost of $${opportunityCost.toFixed(0)}`,
          alternative_suggested: 'Consider async communication or defer to lower-priority time slot',
          auto_declined: opportunityCost < maxApproval
        });

        await supabase.from('autonomous_actions').insert({
          organization_id: orgId,
          agent_type: 'meeting_enforcer',
          action_type: 'meeting_flagged',
          target_entity_type: 'calendar_event',
          target_entity_id: event.id,
          decision: opportunityCost < maxApproval ? 'auto_declined' : 'flagged_for_review',
          reasoning: `Meeting "${event.title}" has opportunity cost of $${opportunityCost.toFixed(0)} (${durationHours}h × $${impliedHourlyRate}/h)`,
          confidence_score: 80,
          value_impact: opportunityCost,
          was_auto_executed: opportunityCost < maxApproval,
          requires_approval: opportunityCost >= maxApproval,
          executed_at: opportunityCost < maxApproval ? new Date().toISOString() : null
        });

        if (opportunityCost < maxApproval) {
          result.actions_taken++;
          result.value_generated += opportunityCost;
        } else {
          result.actions_blocked++;
        }
      }
    }
  }

  return result;
}

// ================== WASTE DETECTOR AGENT ==================
async function runWasteDetector(
  supabase: any, 
  orgId: string, 
  threshold: number,
  maxApproval: number
): Promise<AgentResult> {
  const result: AgentResult = {
    agent_type: 'waste_detector',
    actions_taken: 0,
    actions_blocked: 0,
    value_generated: 0,
    errors: []
  };

  // Check for unused integrations
  const { data: integrations } = await supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', orgId)
    .eq('status', 'connected');

  for (const integration of integrations || []) {
    // Check last sync time
    const lastSync = integration.last_sync_at ? new Date(integration.last_sync_at) : null;
    const daysSinceSync = lastSync ? (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24) : 999;

    if (daysSinceSync > 30) {
      await supabase.from('cashflow_optimizations').insert({
        organization_id: orgId,
        optimization_type: 'unused_integration',
        title: `Unused integration: ${integration.provider}`,
        description: `Integration "${integration.provider}" hasn't synced in ${Math.floor(daysSinceSync)} days`,
        recommended_action: 'Review if this integration is still needed',
        status: 'pending',
        auto_executable: false
      });

      await supabase.from('autonomous_actions').insert({
        organization_id: orgId,
        agent_type: 'waste_detector',
        action_type: 'unused_integration_flagged',
        target_entity_type: 'integration',
        target_entity_id: integration.id,
        decision: 'flagged',
        reasoning: `Integration "${integration.provider}" inactive for ${Math.floor(daysSinceSync)} days`,
        confidence_score: 70,
        requires_approval: true,
        was_auto_executed: false
      });

      result.actions_taken++;
    }
  }

  // Check for stale automation workflows
  const { data: workflows } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  for (const workflow of workflows || []) {
    const lastExecuted = workflow.last_executed_at ? new Date(workflow.last_executed_at) : null;
    const daysSinceExecution = lastExecuted ? (Date.now() - lastExecuted.getTime()) / (1000 * 60 * 60 * 24) : 999;

    if (daysSinceExecution > 14 && workflow.execution_count === 0) {
      await supabase.from('autonomous_actions').insert({
        organization_id: orgId,
        agent_type: 'waste_detector',
        action_type: 'stale_workflow_flagged',
        target_entity_type: 'automation_workflow',
        target_entity_id: workflow.id,
        decision: 'flagged',
        reasoning: `Workflow "${workflow.name}" created but never executed in ${Math.floor(daysSinceExecution)} days`,
        confidence_score: 65,
        requires_approval: true,
        was_auto_executed: false
      });

      result.actions_taken++;
    }
  }

  return result;
}
