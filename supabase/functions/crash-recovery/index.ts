import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CrashRecoveryRequest {
  organizationId: string;
  mode: 'check' | 'recover' | 'auto';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, mode = 'auto' }: CrashRecoveryRequest = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`[CRASH RECOVERY] Running ${mode} mode for org ${organizationId}`);

    // Find agents stuck in "working" state for too long (> 30 minutes)
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: staleAgents, error: fetchError } = await supabase
      .from('agent_states')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'working')
      .lt('last_action_at', staleThreshold);

    if (fetchError) {
      throw fetchError;
    }

    // Find failed execution tasks
    const { data: failedTasks } = await supabase
      .from('execution_tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'failed')
      .lt('retry_count', 3) // Only retry if under max retries
      .order('created_at', { ascending: false })
      .limit(10);

    if (mode === 'check') {
      return new Response(JSON.stringify({
        success: true,
        stale_agents: staleAgents?.length || 0,
        failed_tasks: failedTasks?.length || 0,
        details: {
          stale_agents: staleAgents?.map(a => ({
            agent_name: a.agent_name,
            current_task: a.current_task,
            last_action_at: a.last_action_at
          })),
          failed_tasks: failedTasks?.map(t => ({
            task_type: t.task_type,
            error: t.error_message,
            retry_count: t.retry_count
          }))
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recoveries = [];

    // Recover stale agents
    for (const agent of staleAgents || []) {
      console.log(`[CRASH RECOVERY] Resurrecting agent: ${agent.agent_name}`);
      
      // Reset agent state
      await supabase
        .from('agent_states')
        .update({
          status: 'idle',
          current_task: null,
          last_action: 'crash_recovery',
          last_action_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      // Log the recovery
      await supabase.from('agent_execution_logs').insert({
        organization_id: organizationId,
        action_type: 'crash_recovery',
        reasoning: `Agent ${agent.agent_name} was stuck in working state since ${agent.last_action_at}`,
        action_details: {
          agent_id: agent.id,
          agent_name: agent.agent_name,
          stale_task: agent.current_task
        },
        result: 'resurrected'
      });

      recoveries.push({
        type: 'agent',
        id: agent.id,
        name: agent.agent_name,
        action: 'reset_to_idle'
      });
    }

    // Retry failed tasks
    for (const task of failedTasks || []) {
      console.log(`[CRASH RECOVERY] Retrying task: ${task.task_type}`);
      
      await supabase
        .from('execution_tasks')
        .update({
          status: 'pending',
          retry_count: (task.retry_count || 0) + 1,
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      recoveries.push({
        type: 'task',
        id: task.id,
        task_type: task.task_type,
        action: 'retry_queued',
        retry_count: (task.retry_count || 0) + 1
      });
    }

    // Trigger self-healing if there were recoveries
    if (recoveries.length > 0) {
      await supabase.from('agent_execution_logs').insert({
        organization_id: organizationId,
        action_type: 'crash_recovery_summary',
        reasoning: `Recovered ${staleAgents?.length || 0} stale agents and ${failedTasks?.length || 0} failed tasks`,
        action_details: { recoveries },
        result: 'completed'
      });
    }

    console.log(`[CRASH RECOVERY] Complete: ${recoveries.length} items recovered`);

    return new Response(JSON.stringify({
      success: true,
      recovered: recoveries.length,
      details: recoveries
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Crash recovery error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
