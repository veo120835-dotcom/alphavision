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
    const { organizationId } = await req.json();
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`🔍 Waste Detector running for org: ${organizationId}`);

    // Get agent config
    const { data: agentConfig } = await supabase
      .from('autonomous_agent_config')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('agent_type', 'waste_detector')
      .single();

    const inactivityThresholdDays = agentConfig?.config?.inactivity_days || 30;
    const autoExecuteBelow = agentConfig?.requires_approval_above || 100;

    const results = {
      issues_found: 0,
      optimizations_created: 0,
      potential_monthly_savings: 0,
      categories: {
        unused_integrations: 0,
        stale_workflows: 0,
        redundant_data: 0,
        underutilized_features: 0
      },
      actions: [] as any[]
    };

    // 1. Check for unused integrations
    const { data: integrations } = await supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'connected');

    for (const integration of integrations || []) {
      const lastSync = integration.last_sync_at ? new Date(integration.last_sync_at) : null;
      const daysSinceSync = lastSync ? Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24)) : 999;

      if (daysSinceSync > inactivityThresholdDays) {
        results.issues_found++;
        results.categories.unused_integrations++;

        // Estimate monthly cost (placeholder - real implementation would check subscription data)
        const estimatedMonthlyCost = 50;
        results.potential_monthly_savings += estimatedMonthlyCost;

        await supabase.from('cashflow_optimizations').upsert({
          organization_id: organizationId,
          optimization_type: 'unused_integration',
          title: `Unused integration: ${integration.provider}`,
          description: `This integration hasn't synced data in ${daysSinceSync} days. Consider disconnecting to reduce complexity and potential costs.`,
          recommended_action: daysSinceSync > 60 ? 'Disconnect immediately' : 'Review usage and disconnect if unnecessary',
          estimated_monthly_savings: estimatedMonthlyCost,
          risk_level: 'low',
          status: 'pending',
          auto_executable: estimatedMonthlyCost < autoExecuteBelow
        }, { onConflict: 'id' });

        await supabase.from('autonomous_actions').insert({
          organization_id: organizationId,
          agent_type: 'waste_detector',
          action_type: 'unused_integration',
          target_entity_type: 'integration',
          target_entity_id: integration.id,
          decision: 'flagged_for_removal',
          reasoning: `Integration "${integration.provider}" inactive for ${daysSinceSync} days`,
          confidence_score: Math.min(95, 50 + daysSinceSync),
          value_impact: estimatedMonthlyCost * 12,
          requires_approval: true,
          was_auto_executed: false
        });

        results.actions.push({
          type: 'unused_integration',
          provider: integration.provider,
          days_inactive: daysSinceSync,
          estimated_savings: estimatedMonthlyCost
        });
        
        results.optimizations_created++;
      }
    }

    // 2. Check for stale automation workflows
    const { data: workflows } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    for (const workflow of workflows || []) {
      const lastExecuted = workflow.last_executed_at ? new Date(workflow.last_executed_at) : null;
      const daysSinceExecution = lastExecuted ? Math.floor((Date.now() - lastExecuted.getTime()) / (1000 * 60 * 60 * 24)) : 999;
      const executionCount = workflow.execution_count || 0;

      // Flag workflows that are active but never executed, or haven't run in a while
      if ((daysSinceExecution > 14 && executionCount === 0) || daysSinceExecution > 30) {
        results.issues_found++;
        results.categories.stale_workflows++;

        await supabase.from('autonomous_actions').insert({
          organization_id: organizationId,
          agent_type: 'waste_detector',
          action_type: 'stale_workflow',
          target_entity_type: 'automation_workflow',
          target_entity_id: workflow.id,
          decision: 'flagged_for_review',
          reasoning: executionCount === 0 
            ? `Workflow "${workflow.name}" created ${daysSinceExecution} days ago but never executed`
            : `Workflow "${workflow.name}" hasn't run in ${daysSinceExecution} days`,
          confidence_score: 70,
          requires_approval: true,
          was_auto_executed: false
        });

        results.actions.push({
          type: 'stale_workflow',
          name: workflow.name,
          days_inactive: daysSinceExecution,
          execution_count: executionCount,
          recommendation: executionCount === 0 ? 'Delete or fix trigger' : 'Review if still needed'
        });

        results.optimizations_created++;
      }
    }

    // 3. Check for duplicate or redundant data
    const { data: leads } = await supabase
      .from('leads')
      .select('email, phone, name')
      .eq('organization_id', organizationId)
      .not('email', 'is', null);

    // Find duplicates by email
    const emailCounts: Record<string, number> = {};
    for (const lead of leads || []) {
      if (lead.email) {
        emailCounts[lead.email.toLowerCase()] = (emailCounts[lead.email.toLowerCase()] || 0) + 1;
      }
    }

    const duplicateEmails = Object.entries(emailCounts).filter(([_, count]) => count > 1);
    if (duplicateEmails.length > 0) {
      results.issues_found++;
      results.categories.redundant_data++;

      const totalDuplicates = duplicateEmails.reduce((sum, [_, count]) => sum + count - 1, 0);

      await supabase.from('autonomous_actions').insert({
        organization_id: organizationId,
        agent_type: 'waste_detector',
        action_type: 'duplicate_data',
        decision: 'flagged_for_cleanup',
        reasoning: `Found ${duplicateEmails.length} duplicate email addresses affecting ${totalDuplicates} lead records`,
        confidence_score: 90,
        requires_approval: true,
        was_auto_executed: false,
        execution_result: { duplicate_count: duplicateEmails.length, affected_records: totalDuplicates }
      });

      results.actions.push({
        type: 'duplicate_leads',
        unique_duplicates: duplicateEmails.length,
        total_redundant_records: totalDuplicates,
        recommendation: 'Merge duplicate leads to improve data quality'
      });

      results.optimizations_created++;
    }

    // 4. Check for underutilized features
    const { data: agentLogs } = await supabase
      .from('agent_execution_logs')
      .select('action_type')
      .eq('organization_id', organizationId)
      .gte('executed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const actionTypeCounts: Record<string, number> = {};
    for (const log of agentLogs || []) {
      actionTypeCounts[log.action_type] = (actionTypeCounts[log.action_type] || 0) + 1;
    }

    // List of expected action types
    const expectedActions = ['sniper_outreach', 'dm_closing', 'content_generation', 'lead_enrichment', 'closer_agent'];
    const underutilizedFeatures = expectedActions.filter(action => !actionTypeCounts[action] || actionTypeCounts[action] < 5);

    if (underutilizedFeatures.length > 2) {
      results.issues_found++;
      results.categories.underutilized_features++;

      await supabase.from('autonomous_actions').insert({
        organization_id: organizationId,
        agent_type: 'waste_detector',
        action_type: 'underutilized_features',
        decision: 'recommend_activation',
        reasoning: `${underutilizedFeatures.length} revenue-generating features are underutilized: ${underutilizedFeatures.join(', ')}`,
        confidence_score: 75,
        requires_approval: true,
        was_auto_executed: false,
        execution_result: { features: underutilizedFeatures }
      });

      results.actions.push({
        type: 'underutilized_features',
        features: underutilizedFeatures,
        recommendation: 'Configure and activate these features for maximum ROI'
      });

      results.optimizations_created++;
    }

    // Log the run
    await supabase.from('agent_execution_logs').insert({
      organization_id: organizationId,
      action_type: 'waste_detection',
      reasoning: `Found ${results.issues_found} issues with potential monthly savings of $${results.potential_monthly_savings.toFixed(0)}`,
      action_details: results,
      result: 'completed'
    });

    return new Response(JSON.stringify({
      success: true,
      ...results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Waste detector error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
