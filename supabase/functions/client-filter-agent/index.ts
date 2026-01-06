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
    const { organizationId, leadId } = await req.json();
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`👥 Client Filter Agent running for org: ${organizationId}`);

    // Get agent config
    const { data: agentConfig } = await supabase
      .from('autonomous_agent_config')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('agent_type', 'client_filter')
      .single();

    const qualityThreshold = agentConfig?.config?.quality_threshold || 30;
    const premiumThreshold = agentConfig?.config?.premium_threshold || 80;

    const results = {
      leads_processed: 0,
      auto_rejected: 0,
      fast_tracked: 0,
      flagged_for_review: 0,
      actions: [] as any[]
    };

    // Build query for leads to process
    let leadsQuery = supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'new');

    if (leadId) {
      leadsQuery = leadsQuery.eq('id', leadId);
    } else {
      leadsQuery = leadsQuery.limit(50);
    }

    const { data: leads } = await leadsQuery;

    for (const lead of leads || []) {
      results.leads_processed++;

      // Calculate quality score if not present
      let qualityScore = lead.intent_score || 0;
      
      if (!qualityScore || qualityScore === 0) {
        // Calculate score based on available data
        qualityScore = 50; // Base score
        
        if (lead.email) qualityScore += 10;
        if (lead.phone) qualityScore += 10;
        if (lead.company) qualityScore += 5;
        if (lead.source === 'referral') qualityScore += 15;
        if (lead.source === 'organic') qualityScore += 10;
        if (lead.source === 'cold_outreach') qualityScore -= 10;

        // Update the lead with calculated score
        await supabase
          .from('leads')
          .update({ intent_score: qualityScore })
          .eq('id', lead.id);
      }

      // Decision logic
      if (qualityScore < qualityThreshold) {
        // AUTO-REJECT: Low quality lead
        await supabase
          .from('leads')
          .update({ status: 'rejected' })
          .eq('id', lead.id);

        await supabase.from('autonomous_actions').insert({
          organization_id: organizationId,
          agent_type: 'client_filter',
          action_type: 'auto_reject',
          target_entity_type: 'lead',
          target_entity_id: lead.id,
          decision: 'rejected',
          reasoning: `Quality score (${qualityScore}) below threshold (${qualityThreshold}). Missing: ${!lead.email ? 'email, ' : ''}${!lead.phone ? 'phone, ' : ''}${!lead.company ? 'company' : ''}`.replace(/, $/, ''),
          confidence_score: 100 - qualityScore,
          was_auto_executed: true,
          executed_at: new Date().toISOString()
        });

        results.auto_rejected++;
        results.actions.push({
          lead_id: lead.id,
          action: 'rejected',
          score: qualityScore,
          reason: 'Below quality threshold'
        });

      } else if (qualityScore >= premiumThreshold) {
        // FAST-TRACK: High quality lead
        await supabase
          .from('leads')
          .update({ 
            status: 'qualified',
            priority: 1
          })
          .eq('id', lead.id);

        await supabase.from('autonomous_actions').insert({
          organization_id: organizationId,
          agent_type: 'client_filter',
          action_type: 'fast_track',
          target_entity_type: 'lead',
          target_entity_id: lead.id,
          decision: 'fast_tracked',
          reasoning: `High quality lead (score: ${qualityScore}). Complete profile with high-intent signals.`,
          confidence_score: qualityScore,
          was_auto_executed: true,
          executed_at: new Date().toISOString()
        });

        results.fast_tracked++;
        results.actions.push({
          lead_id: lead.id,
          action: 'fast_tracked',
          score: qualityScore,
          reason: 'Premium quality lead'
        });

      } else {
        // MIDDLE GROUND: Flag for human review if AI available
        if (LOVABLE_API_KEY) {
          // Use AI to make a nuanced decision
          const analysisPrompt = `Analyze this lead and determine if they should be qualified or require more nurturing:

Lead Data:
- Name: ${lead.name || 'Unknown'}
- Email: ${lead.email || 'Not provided'}
- Company: ${lead.company || 'Not provided'}
- Source: ${lead.source || 'Unknown'}
- Quality Score: ${qualityScore}
- Notes: ${lead.notes || 'None'}

Respond with JSON:
{
  "decision": "qualify" | "nurture" | "review",
  "confidence": 0-100,
  "reasoning": "string",
  "next_action": "string"
}`;

          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: "You are a lead qualification AI. Be decisive but fair." },
                { role: "user", content: analysisPrompt }
              ],
              response_format: { type: "json_object" },
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const analysis = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');

            if (analysis.decision === 'qualify' && analysis.confidence >= 70) {
              await supabase
                .from('leads')
                .update({ status: 'qualified' })
                .eq('id', lead.id);

              await supabase.from('autonomous_actions').insert({
                organization_id: organizationId,
                agent_type: 'client_filter',
                action_type: 'ai_qualified',
                target_entity_type: 'lead',
                target_entity_id: lead.id,
                decision: 'qualified',
                reasoning: analysis.reasoning,
                confidence_score: analysis.confidence,
                was_auto_executed: true,
                executed_at: new Date().toISOString(),
                execution_result: analysis
              });

              results.fast_tracked++;
            } else {
              // Flag for review
              await supabase.from('autonomous_actions').insert({
                organization_id: organizationId,
                agent_type: 'client_filter',
                action_type: 'flagged_review',
                target_entity_type: 'lead',
                target_entity_id: lead.id,
                decision: 'needs_review',
                reasoning: analysis.reasoning || 'Requires human evaluation',
                confidence_score: analysis.confidence || 50,
                requires_approval: true,
                was_auto_executed: false,
                execution_result: analysis
              });

              results.flagged_for_review++;
            }
          }
        } else {
          results.flagged_for_review++;
        }

        results.actions.push({
          lead_id: lead.id,
          action: 'reviewed',
          score: qualityScore,
          reason: 'Middle quality - AI analyzed'
        });
      }
    }

    // Log the run
    await supabase.from('agent_execution_logs').insert({
      organization_id: organizationId,
      action_type: 'client_filtering',
      reasoning: `Processed ${results.leads_processed} leads: ${results.auto_rejected} rejected, ${results.fast_tracked} fast-tracked, ${results.flagged_for_review} flagged`,
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
    console.error("Client filter error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
