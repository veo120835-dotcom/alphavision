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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { organization_id, template_ids, custom_variables } = await req.json();

    if (!organization_id) {
      throw new Error('organization_id is required');
    }

    // Fetch workflow templates to provision
    let templatesQuery = supabase
      .from('workflow_templates')
      .select('*')
      .eq('is_core_template', true);

    if (template_ids && template_ids.length > 0) {
      templatesQuery = templatesQuery.in('template_id', template_ids);
    }

    const { data: templates, error: templatesError } = await templatesQuery
      .order('priority', { ascending: false });

    if (templatesError) {
      throw new Error(`Failed to fetch templates: ${templatesError.message}`);
    }

    if (!templates || templates.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No templates to provision',
        provisioned: 0 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check which workflows already exist for this organization
    const { data: existingWorkflows } = await supabase
      .from('automation_workflows')
      .select('name')
      .eq('organization_id', organization_id);

    const existingNames = new Set(existingWorkflows?.map(w => w.name) || []);

    // Provision each template as an automation workflow
    const provisionedWorkflows = [];
    const skippedWorkflows = [];

    for (const template of templates) {
      // Skip if workflow with same name already exists
      if (existingNames.has(template.name)) {
        skippedWorkflows.push({
          template_id: template.template_id,
          name: template.name,
          reason: 'already_exists'
        });
        continue;
      }

      // Merge custom variables with template defaults
      const finalVariables = {
        ...template.template_variables,
        ...(custom_variables?.[template.template_id] || {})
      };

      // Create the automation workflow from template
      const workflowData = {
        organization_id,
        name: template.name,
        description: template.description,
        stage: 'active',
        trigger_type: template.trigger_event,
        trigger_config: {
          template_id: template.template_id,
          eligibility_gate: template.eligibility_gate,
          variables: finalVariables
        },
        actions: template.actions,
        is_active: true,
        execution_count: 0
      };

      const { data: workflow, error: workflowError } = await supabase
        .from('automation_workflows')
        .insert(workflowData)
        .select()
        .single();

      if (workflowError) {
        console.error(`Failed to provision ${template.name}:`, workflowError);
        skippedWorkflows.push({
          template_id: template.template_id,
          name: template.name,
          reason: 'insert_failed',
          error: workflowError.message
        });
        continue;
      }

      provisionedWorkflows.push({
        workflow_id: workflow.id,
        template_id: template.template_id,
        name: template.name,
        category: template.category
      });
    }

    // Log the provisioning action
    await supabase.from('autonomous_actions').insert({
      organization_id,
      agent_type: 'provisioning_engine',
      action_type: 'workspace_provisioned',
      decision: `Provisioned ${provisionedWorkflows.length} workflows, skipped ${skippedWorkflows.length}`,
      reasoning: `Templates deployed: ${provisionedWorkflows.map(w => w.template_id).join(', ')}`,
      confidence_score: 100,
      was_auto_executed: true,
      executed_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      message: 'Workspace provisioning complete',
      provisioned: provisionedWorkflows.length,
      skipped: skippedWorkflows.length,
      workflows: provisionedWorkflows,
      skipped_details: skippedWorkflows
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    console.error('Provisioning error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
