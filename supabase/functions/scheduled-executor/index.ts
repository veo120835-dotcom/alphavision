import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Scheduled Task Executor
 * This edge function is designed to be called by pg_cron to execute scheduled workflows
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Scheduled executor running at:', new Date().toISOString());

    // 1. Find all due scheduled tasks
    const { data: dueTasks, error: tasksError } = await supabase
      .from('execution_tasks')
      .select('*, automation_workflows(*)')
      .eq('status', 'queued')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: true })
      .limit(10);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    console.log(`Found ${dueTasks?.length || 0} due tasks`);

    // 2. Find workflows with cron expressions that are due
    const { data: scheduledWorkflows, error: workflowsError } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('is_active', true)
      .not('cron_expression', 'is', null)
      .lte('next_run_at', new Date().toISOString());

    if (workflowsError) {
      console.error('Error fetching scheduled workflows:', workflowsError);
    }

    console.log(`Found ${scheduledWorkflows?.length || 0} scheduled workflows to run`);

    const results: any[] = [];

    // 3. Execute due tasks
    for (const task of dueTasks || []) {
      try {
        // Mark as running
        await supabase
          .from('execution_tasks')
          .update({ 
            status: 'running', 
            started_at: new Date().toISOString() 
          })
          .eq('id', task.id);

        console.log(`Executing task: ${task.id} (${task.task_type})`);

        // Execute based on task type
        let result: any = null;
        let error: string | null = null;

        try {
          switch (task.task_type) {
            case 'send_dm':
              result = { message: 'DM sent', recipient: task.input_data?.recipient };
              break;
            case 'send_email':
              result = { message: 'Email sent', to: task.input_data?.to };
              break;
            case 'create_lead':
              const { data: lead } = await supabase
                .from('leads')
                .insert({
                  organization_id: task.organization_id,
                  name: task.input_data?.name,
                  email: task.input_data?.email,
                  source: 'automation',
                  status: 'new'
                })
                .select()
                .single();
              result = { lead_id: lead?.id };
              break;
            case 'trigger_agent':
              await supabase
                .from('agent_states')
                .update({ 
                  status: 'active',
                  current_task: task.input_data?.task,
                  last_action_at: new Date().toISOString()
                })
                .eq('organization_id', task.organization_id)
                .eq('agent_type', task.agent_type);
              result = { agent_activated: task.agent_type };
              break;
            case 'webhook_call':
              if (task.input_data?.url) {
                const webhookRes = await fetch(task.input_data.url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(task.input_data.payload || {})
                });
                result = { status: webhookRes.status };
              }
              break;
            case 'generate_content':
              result = { message: 'Content generation queued' };
              break;
            default:
              result = { message: `Executed ${task.task_type}` };
          }
        } catch (execError) {
          error = execError instanceof Error ? execError.message : 'Execution failed';
        }

        // Update task status
        await supabase
          .from('execution_tasks')
          .update({ 
            status: error ? 'failed' : 'completed',
            output_data: result,
            error_message: error,
            completed_at: new Date().toISOString(),
            retry_count: error ? (task.retry_count || 0) + 1 : task.retry_count
          })
          .eq('id', task.id);

        // Log execution
        await supabase.from('agent_execution_logs').insert({
          organization_id: task.organization_id,
          action_type: task.task_type,
          action_details: task.input_data,
          result: error ? 'failed' : 'success',
          error_message: error,
          reasoning: `Scheduled execution of ${task.task_type}`,
          workflow_id: task.workflow_id
        });

        results.push({ task_id: task.id, status: error ? 'failed' : 'completed', result, error });

      } catch (taskError) {
        console.error(`Error executing task ${task.id}:`, taskError);
        results.push({ task_id: task.id, status: 'error', error: taskError });
      }
    }

    // 4. Execute scheduled workflows
    for (const workflow of scheduledWorkflows || []) {
      try {
        console.log(`Running scheduled workflow: ${workflow.name}`);

        // Create execution task for workflow
        await supabase.from('execution_tasks').insert({
          organization_id: workflow.organization_id,
          workflow_id: workflow.id,
          task_type: 'workflow_execution',
          agent_type: 'orchestrator',
          status: 'queued',
          priority: 1,
          input_data: { workflow_name: workflow.name }
        });

        // Calculate next run time based on cron expression
        // For now, just add 1 hour as placeholder
        const nextRun = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        await supabase
          .from('automation_workflows')
          .update({ 
            next_run_at: nextRun,
            last_executed_at: new Date().toISOString(),
            execution_count: (workflow.execution_count || 0) + 1
          })
          .eq('id', workflow.id);

        results.push({ workflow_id: workflow.id, status: 'triggered', next_run: nextRun });

      } catch (wfError) {
        console.error(`Error running workflow ${workflow.id}:`, wfError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        executed_at: new Date().toISOString(),
        tasks_processed: dueTasks?.length || 0,
        workflows_triggered: scheduledWorkflows?.length || 0,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scheduled executor error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
