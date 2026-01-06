import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ORCHESTRATOR_PROMPT = `ACT AS: The Sovereign Business Architect (SBA).
GOAL: Orchestrate a swarm of specialized agents to maximize net revenue and follower growth.

CORE COGNITIVE LOOP (ReAct Framework):
1. PERCEPTION: Analyze current state:
   - GHL lead count and pipeline status
   - Last 24h social engagement metrics
   - Revenue targets vs actuals
   - Agent swarm status and recent actions

2. REASONING: Identify the single most impactful bottleneck:
   - Is it TRAFFIC (not enough leads coming in)?
   - Is it CONVERSION (leads not closing)?
   - Is it RETENTION (customers not staying)?
   - Is it CONTENT (not enough visibility)?

3. DELEGATION: Instruct the specific Worker Agent:
   - SCOUT: For research, prospecting, market intelligence
   - CREATOR: For content generation, viral assets
   - SOCIALITE: For engagement, DMs, community
   - CLOSER: For revenue generation, deal closing

4. VERIFICATION: Evaluate outputs before execution:
   - If quality >= 95%, approve for execution
   - If quality < 95%, send to Reflexion loop
   - Log reasoning for every decision

CONSTRAINTS:
- Never spend more than monthly_cap_ads in automated ad-spend
- Maintain brand voice consistency
- If lead value >$5,000, require Human-in-the-Loop approval
- Pause all aggressive actions if runway < 6 months

STATE MACHINE NODES:
- NODE_A: Check for new triggers (leads, DMs, mentions)
- NODE_B: Dispatch to appropriate agent (Scout/Creator/Socialite/Closer)
- NODE_C: Run Reflexion quality check
- NODE_D: Execute approved action
- NODE_E: Log outcome and update metrics

OUTPUT FORMAT (JSON):
{
  "perception": {
    "current_bottleneck": "traffic|conversion|retention|content",
    "bottleneck_severity": 1-10,
    "key_metrics": {...}
  },
  "reasoning": {
    "analysis": "Why this is the priority",
    "expected_impact": "What we expect to achieve",
    "risk_assessment": "What could go wrong"
  },
  "delegation": {
    "agent": "scout|creator|socialite|closer",
    "task": "Specific task description",
    "priority": 1-5,
    "deadline": "When this should complete",
    "success_criteria": ["How we know it worked"]
  },
  "verification": {
    "quality_threshold": 95,
    "reflexion_required": boolean,
    "human_approval_required": boolean,
    "reason": "Why approval is/isn't needed"
  },
  "next_state": "NODE_A|NODE_B|NODE_C|NODE_D|NODE_E",
  "internal_notes": "Strategic reasoning"
}`;

interface OrchestratorRequest {
  organizationId: string;
  trigger?: {
    type: 'new_lead' | 'dm_received' | 'mention' | 'scheduled' | 'manual';
    data: any;
  };
  currentState?: string;
  dryRun?: boolean; // Simulation mode - blocks real executions
}

// Simulation mode interceptor for safe testing
function simulateToolExecution(toolName: string, toolParams: any): { tool: string; output: string; simulated: boolean } {
  console.warn(`[SIMULATION] Blocked execution of: ${toolName}`);
  console.log(`[SIMULATION] Would have executed with params:`, JSON.stringify(toolParams, null, 2));
  
  return {
    tool: toolName,
    output: `[SIMULATION MODE] Action '${toolName}' was skipped safely. Assume success. Params: ${JSON.stringify(toolParams)}`,
    simulated: true
  };
}

// Self-healing: Call the Doctor when something fails
async function triggerSelfHealing(
  supabase: any,
  supabaseUrl: string,
  serviceRoleKey: string,
  organizationId: string,
  taskType: string,
  errorLog: string,
  lastPrompt: string
): Promise<void> {
  try {
    console.log(`[🏥 SELF-HEALING] Triggering Doctor for task: ${taskType}`);
    
    const healResponse = await fetch(`${supabaseUrl}/functions/v1/self-healer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        organizationId,
        taskType,
        errorLog,
        lastPrompt
      }),
    });

    if (healResponse.ok) {
      const result = await healResponse.json();
      console.log(`[🏥 SELF-HEALING] New rule added: "${result.advice}"`);
    }
  } catch (e) {
    console.error('[🏥 SELF-HEALING] Failed to trigger healing:', e);
  }
}

// Fetch strategy guides for context injection
async function getStrategyContext(supabase: any, organizationId: string, taskType: string): Promise<string> {
  const { data: guides } = await supabase
    .from('strategy_guide')
    .select('advice, confidence_score')
    .eq('organization_id', organizationId)
    .eq('task_type', taskType)
    .order('confidence_score', { ascending: false })
    .limit(5);

  if (!guides || guides.length === 0) return '';

  const rules = guides.map((g: any, i: number) => 
    `${i + 1}. ${g.advice} (confidence: ${(g.confidence_score * 100).toFixed(0)}%)`
  ).join('\n');

  return `\n\nLEARNED STRATEGIES FOR ${taskType.toUpperCase()}:\n${rules}\n`;
}

// Fetch active prompt version from database
async function getActivePrompt(supabase: any, organizationId: string, agentType: string): Promise<string | null> {
  const { data: prompt } = await supabase
    .from('prompt_versions')
    .select('prompt_content')
    .eq('organization_id', organizationId)
    .eq('agent_type', agentType)
    .eq('is_active', true)
    .single();

  return prompt?.prompt_content || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  let organizationId = '';

  try {
    const requestBody = await req.json();
    organizationId = requestBody.organizationId;
    const trigger = requestBody.trigger;
    const currentState = requestBody.currentState || 'NODE_A';
    const dryRun = requestBody.dryRun || false;
    
    if (dryRun) {
      console.log('[SIMULATION MODE] Dry run enabled - no real actions will be executed');
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Gather perception data
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get current metrics and business config
    const [
      { data: leads },
      { data: recentLogs },
      { data: agentStates },
      { data: permissionContract },
      { data: pendingApprovals },
      { data: businessConfig }
    ] = await Promise.all([
      supabase.from('leads').select('*').eq('organization_id', organizationId),
      supabase.from('agent_execution_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('executed_at', last24h.toISOString())
        .limit(50),
      supabase.from('agent_states')
        .select('*')
        .eq('organization_id', organizationId),
      supabase.from('permission_contracts')
        .select('*')
        .eq('organization_id', organizationId)
        .single(),
      supabase.from('approval_requests')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending'),
      supabase.from('business_config')
        .select('*')
        .eq('organization_id', organizationId)
        .single()
    ]);

    // Calculate pipeline metrics
    const pipelineMetrics = {
      total: leads?.length || 0,
      new: leads?.filter(l => l.status === 'new').length || 0,
      qualified: leads?.filter(l => l.status === 'qualified').length || 0,
      proposal: leads?.filter(l => l.status === 'proposal').length || 0,
      closed: leads?.filter(l => l.status === 'closed' || l.status === 'won').length || 0,
      averageIntentScore: leads?.length 
        ? leads.reduce((sum, l) => sum + (l.intent_score || 0), 0) / leads.length 
        : 0
    };

    // Build context for the orchestrator with dynamic business config
    const orchestratorContext = {
      currentState,
      trigger: trigger || { type: 'scheduled', data: {} },
      metrics: {
        pipeline: pipelineMetrics,
        recentActions: recentLogs?.length || 0,
        pendingApprovals: pendingApprovals?.length || 0
      },
      constraints: permissionContract ? {
        adCap: permissionContract.monthly_cap_ads,
        experimentCap: permissionContract.monthly_cap_experiments,
        riskPosture: permissionContract.risk_posture_business,
        runwayMinimum: permissionContract.runway_minimum
      } : {},
      agentStatus: agentStates?.map(a => ({
        name: a.agent_name,
        type: a.agent_type,
        status: a.status,
        currentTask: a.current_task
      })) || [],
      // DYNAMIC BUSINESS CONFIG - Injected from Admin Dashboard
      businessConfig: businessConfig ? {
        productName: businessConfig.product_name,
        basePrice: businessConfig.base_price,
        upsellPrice: businessConfig.upsell_price,
        downsellPrice: businessConfig.downsell_price,
        targetNiche: businessConfig.target_niche,
        systemPersona: businessConfig.system_persona,
        brandVoice: businessConfig.brand_voice,
        closingStyle: businessConfig.closing_style,
        idealDealValue: businessConfig.ideal_deal_value,
        upsellEnabled: businessConfig.upsell_enabled,
        referralEnabled: businessConfig.referral_enabled,
        retentionEnabled: businessConfig.retention_enabled
      } : null
    };

    console.log("Orchestrator context:", orchestratorContext);

    // Fetch active prompt from database (if exists), otherwise use default
    const activePrompt = await getActivePrompt(supabase, organizationId, 'orchestrator');
    const systemPrompt = activePrompt || ORCHESTRATOR_PROMPT;

    // Inject learned strategies for the current task type
    const taskType = trigger?.type || 'scheduled';
    const strategyContext = await getStrategyContext(supabase, organizationId, taskType);
    const enhancedPrompt = systemPrompt + strategyContext;

    // Use Model Router to determine optimal model based on task complexity
    const routerResponse = await fetch(`${SUPABASE_URL}/functions/v1/model-router`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { 
            role: "user", 
            content: `CURRENT CONTEXT:
${JSON.stringify(orchestratorContext, null, 2)}

Execute the cognitive loop and determine the next action.`
          }
        ],
        systemPrompt: enhancedPrompt,
        responseFormat: { type: "json_object" },
        metadata: {
          requiresReasoning: true,
          isHighStakes: orchestratorContext.metrics.pendingApprovals > 0 || orchestratorContext.metrics.pipeline.total > 50
        }
      }),
    });

    if (!routerResponse.ok) {
      throw new Error(`Model Router error: ${routerResponse.status}`);
    }

    const routerData = await routerResponse.json();
    console.log(`Model Router selected: ${routerData.routing.selectedTier} (${routerData.routing.reason})`);
    
    const aiData = routerData.result;
    const orchestratorOutput = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');

    // Log the orchestration decision (always log, even in dry run)
    const logEntry = {
      organization_id: organizationId,
      action_type: dryRun ? 'orchestrator_simulation' : 'orchestrator',
      reasoning: orchestratorOutput.reasoning?.analysis,
      action_details: {
        perception: orchestratorOutput.perception,
        delegation: orchestratorOutput.delegation,
        next_state: orchestratorOutput.next_state,
        dry_run: dryRun
      },
      result: dryRun ? 'simulated' : 'delegated'
    };
    
    await supabase.from('agent_execution_logs').insert(logEntry);

    // If delegation requires a specific agent, dispatch to it
    if (orchestratorOutput.delegation?.agent) {
      const agentType = orchestratorOutput.delegation.agent;
      
      // In DRY RUN mode, simulate the agent dispatch
      if (dryRun) {
        const simulatedResult = simulateToolExecution('dispatch_agent', {
          agentType,
          task: orchestratorOutput.delegation.task,
          priority: orchestratorOutput.delegation.priority
        });
        
        console.log('[SIMULATION] Agent dispatch simulated:', simulatedResult);
      } else {
        // REAL EXECUTION: Update or create agent state
        const { data: existingState } = await supabase
          .from('agent_states')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('agent_type', agentType)
          .single();

        if (existingState) {
          await supabase
            .from('agent_states')
            .update({
              status: 'working',
              current_task: orchestratorOutput.delegation.task,
              last_action_at: new Date().toISOString()
            })
            .eq('id', existingState.id);
        } else {
          await supabase.from('agent_states').insert({
            organization_id: organizationId,
            agent_name: `The ${agentType.charAt(0).toUpperCase() + agentType.slice(1)}`,
            agent_type: agentType,
            status: 'working',
            current_task: orchestratorOutput.delegation.task
          });
        }
      }

      // If human approval is required, create approval request
      if (orchestratorOutput.verification?.human_approval_required) {
        if (dryRun) {
          const simulatedApproval = simulateToolExecution('create_approval_request', {
            title: `${agentType.toUpperCase()} Agent Action`,
            description: orchestratorOutput.delegation.task
          });
          console.log('[SIMULATION] Approval request simulated:', simulatedApproval);
        } else {
          await supabase.from('approval_requests').insert({
            organization_id: organizationId,
            title: `${agentType.toUpperCase()} Agent Action`,
            description: orchestratorOutput.delegation.task,
            request_type: 'agent_action',
            agent_recommendation: orchestratorOutput.reasoning?.analysis,
            risk_assessment: {
              severity: orchestratorOutput.perception?.bottleneck_severity,
              reason: orchestratorOutput.verification?.reason
            }
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      orchestration: orchestratorOutput,
      context: orchestratorContext,
      simulation: dryRun
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Swarm orchestrator error:", e);
    
    // SELF-HEALING: Trigger the Doctor to analyze and fix the failure
    if (organizationId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await triggerSelfHealing(
        supabase,
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        organizationId,
        'orchestration',
        e instanceof Error ? e.message : 'Unknown error',
        'Swarm orchestrator main loop'
      );
    }
    
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error",
      self_healing_triggered: true
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
