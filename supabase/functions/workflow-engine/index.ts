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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { record, table, type, old_record } = await req.json();
    const triggerEvent = `${table}.${type}`; // e.g., 'leads.INSERT', 'bookings.INSERT'
    
    console.log(`Workflow engine triggered: ${triggerEvent}`);

    if (!record?.organization_id) {
      console.log('No organization_id in record, skipping');
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find matching workflows for this organization and trigger
    const { data: workflows, error: wfError } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('organization_id', record.organization_id)
      .eq('is_active', true)
      .or(`trigger_type.eq.${triggerEvent},trigger_type.eq.${table}_${type}`);

    if (wfError) throw wfError;

    if (!workflows || workflows.length === 0) {
      console.log('No matching workflows found');
      return new Response(JSON.stringify({ workflows_found: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${workflows.length} matching workflows`);
    const results = [];

    for (const workflow of workflows) {
      try {
        // Check conditions
        if (!checkConditions(workflow.trigger_config, record)) {
          console.log(`Workflow ${workflow.name}: conditions not met`);
          continue;
        }

        // Create execution record
        const { data: execution } = await supabase
          .from('workflow_executions')
          .insert({
            organization_id: record.organization_id,
            workflow_id: workflow.id,
            trigger_event: triggerEvent,
            trigger_data: { record, old_record },
            status: 'running',
          })
          .select()
          .single();

        // Execute actions
        const actions = workflow.actions || [];
        const stepsExecuted = [];

        for (const action of actions) {
          try {
            const result = await executeAction(supabase, action, record, workflow);
            stepsExecuted.push({ action: action.type, success: true, result });
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            stepsExecuted.push({ action: action.type, success: false, error: errorMessage });
          }
        }

        // Update execution
        await supabase
          .from('workflow_executions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            steps_executed: stepsExecuted,
          })
          .eq('id', execution?.id);

        // Update workflow stats
        await supabase
          .from('automation_workflows')
          .update({
            last_executed_at: new Date().toISOString(),
            execution_count: (workflow.execution_count || 0) + 1,
          })
          .eq('id', workflow.id);

        results.push({ workflow_id: workflow.id, name: workflow.name, success: true, steps: stepsExecuted });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Workflow ${workflow.id} error:`, err);
        results.push({ workflow_id: workflow.id, name: workflow.name, success: false, error: errorMessage });
      }
    }

    return new Response(JSON.stringify({ 
      trigger: triggerEvent,
      workflows_executed: results.length,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Workflow engine error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function checkConditions(config: any, record: any): boolean {
  if (!config || !config.conditions) return true;

  for (const condition of config.conditions) {
    const { field, operator, value } = condition;
    const recordValue = record[field];

    switch (operator) {
      case 'equals':
        if (recordValue !== value) return false;
        break;
      case 'not_equals':
        if (recordValue === value) return false;
        break;
      case 'contains':
        if (!String(recordValue).includes(value)) return false;
        break;
      case 'greater_than':
        if (Number(recordValue) <= Number(value)) return false;
        break;
      case 'less_than':
        if (Number(recordValue) >= Number(value)) return false;
        break;
      case 'is_set':
        if (!recordValue) return false;
        break;
      case 'is_not_set':
        if (recordValue) return false;
        break;
    }
  }

  return true;
}

async function executeAction(supabase: any, action: any, record: any, workflow: any): Promise<any> {
  const { type, config } = action;

  switch (type) {
    case 'send_email': {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (!resendKey) {
        return { simulated: true, to: config.to || record.email };
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.from || 'noreply@alphavision.app',
          to: replaceVariables(config.to, record),
          subject: replaceVariables(config.subject, record),
          html: replaceVariables(config.body, record),
        }),
      });
      return await response.json();
    }

    case 'send_sms': {
      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (!twilioSid || !twilioToken) {
        return { simulated: true, to: config.to || record.phone };
      }

      const auth = btoa(`${twilioSid}:${twilioToken}`);
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: twilioPhone || '',
            To: replaceVariables(config.to, record),
            Body: replaceVariables(config.body, record),
          }),
        }
      );
      return await response.json();
    }

    case 'update_record': {
      const { table, updates } = config;
      const processedUpdates: any = {};
      for (const [key, value] of Object.entries(updates)) {
        processedUpdates[key] = replaceVariables(String(value), record);
      }

      const { error } = await supabase
        .from(table || 'leads')
        .update(processedUpdates)
        .eq('id', record.id);

      if (error) throw error;
      return { updated: true, table, updates: processedUpdates };
    }

    case 'create_task': {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          organization_id: record.organization_id,
          title: replaceVariables(config.title, record),
          description: replaceVariables(config.description, record),
          due_date: config.due_days 
            ? new Date(Date.now() + config.due_days * 86400000).toISOString()
            : null,
          priority: config.priority || 'medium',
          status: 'pending',
          related_to_type: config.related_type || 'lead',
          related_to_id: record.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { task_id: data?.id };
    }

    case 'add_tag': {
      // Find or create tag
      let { data: tag } = await supabase
        .from('tags')
        .select('id')
        .eq('organization_id', record.organization_id)
        .eq('name', config.tag_name)
        .single();

      if (!tag) {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({
            organization_id: record.organization_id,
            name: config.tag_name,
            category: config.category || 'workflow',
          })
          .select('id')
          .single();
        tag = newTag;
      }

      if (tag) {
        await supabase
          .from('tag_applications')
          .upsert({
            tag_id: tag.id,
            entity_type: config.entity_type || 'contact',
            entity_id: record.id,
          }, { onConflict: 'tag_id,entity_type,entity_id' });
      }

      return { tag_applied: config.tag_name };
    }

    case 'enroll_campaign': {
      await supabase
        .from('campaign_enrollments')
        .insert({
          campaign_id: config.campaign_id,
          contact_id: record.id,
          status: 'active',
          current_step: 1,
          next_step_at: new Date().toISOString(),
        });
      return { enrolled: config.campaign_id };
    }

    case 'webhook': {
      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.headers || {}),
        },
        body: JSON.stringify({
          event: workflow.trigger_type,
          data: record,
          timestamp: new Date().toISOString(),
        }),
      });
      return { status: response.status, ok: response.ok };
    }

    case 'ai_qualify': {
      // Use Lovable AI to score/qualify the lead
      const apiKey = Deno.env.get('LOVABLE_API_KEY');
      if (!apiKey) {
        return { simulated: true };
      }

      // Simple qualification based on data completeness
      let score = 50;
      if (record.email) score += 10;
      if (record.phone) score += 10;
      if (record.company) score += 15;
      if (record.intent_score) score = Math.min(100, score + record.intent_score / 2);

      await supabase
        .from('leads')
        .update({ intent_score: score })
        .eq('id', record.id);

      return { qualified: score >= 70, score };
    }

    default:
      return { unknown_action: type };
  }
}

function replaceVariables(text: string, record: any): string {
  if (!text) return '';
  
  let result = text;
  for (const [key, value] of Object.entries(record)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value || ''));
  }
  return result;
}