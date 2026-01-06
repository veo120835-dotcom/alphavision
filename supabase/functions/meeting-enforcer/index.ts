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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`📅 Meeting Enforcer running for org: ${organizationId}`);

    // Get business config for hourly rate
    const { data: bizConfig } = await supabase
      .from('business_config')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    // Get agent config
    const { data: agentConfig } = await supabase
      .from('autonomous_agent_config')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('agent_type', 'meeting_enforcer')
      .single();

    const idealDealValue = bizConfig?.ideal_deal_value || 5000;
    const impliedHourlyRate = idealDealValue / 10; // Assume 10 hours per deal
    const minMeetingROI = agentConfig?.config?.min_meeting_roi || 100;
    const autoDeclineThreshold = agentConfig?.requires_approval_above || 500;

    const results = {
      meetings_analyzed: 0,
      meetings_approved: 0,
      meetings_flagged: 0,
      meetings_auto_declined: 0,
      total_time_saved_hours: 0,
      total_opportunity_cost_avoided: 0,
      actions: [] as any[]
    };

    // Get upcoming calendar events (next 7 days)
    const { data: calendarEvents } = await supabase
      .from('calendar_events_sync')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('start_time', new Date().toISOString())
      .lte('start_time', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('cancelled', false);

    // Low-value meeting patterns
    const lowValuePatterns = [
      'intro call', 'introduction', 'catch up', 'coffee chat', 
      'networking', 'quick sync', 'touch base', 'check in',
      'brainstorm', 'general discussion', 'misc', 'other'
    ];

    // High-value meeting patterns
    const highValuePatterns = [
      'sales call', 'demo', 'proposal', 'closing', 'contract',
      'negotiation', 'decision', 'final review', 'onboarding',
      'strategy', 'planning', 'quarterly review'
    ];

    for (const event of calendarEvents || []) {
      results.meetings_analyzed++;

      const durationHours = (event.duration_minutes || 60) / 60;
      const opportunityCost = durationHours * impliedHourlyRate;
      const title = (event.title || '').toLowerCase();
      const eventType = (event.event_type || '').toLowerCase();

      // Determine meeting value
      let meetingValue: 'high' | 'medium' | 'low' = 'medium';
      let valueReasoning = '';

      // Check if marked as revenue-generating
      if (event.is_revenue_generating) {
        meetingValue = 'high';
        valueReasoning = 'Marked as revenue-generating';
      }
      // Check high-value patterns
      else if (highValuePatterns.some(p => title.includes(p) || eventType.includes(p))) {
        meetingValue = 'high';
        valueReasoning = 'Matches high-value meeting pattern';
      }
      // Check low-value patterns
      else if (lowValuePatterns.some(p => title.includes(p) || eventType.includes(p))) {
        meetingValue = 'low';
        valueReasoning = 'Matches low-value meeting pattern';
      }
      // Check duration - very short or very long meetings are flags
      else if (durationHours > 2) {
        meetingValue = 'low';
        valueReasoning = 'Excessively long meeting (>2 hours)';
      }
      else if (event.recurring && durationHours >= 1) {
        meetingValue = 'low';
        valueReasoning = 'Recurring 1+ hour meeting - high cumulative cost';
      }

      const action: any = {
        event_id: event.id,
        title: event.title,
        duration_hours: durationHours,
        opportunity_cost: opportunityCost,
        meeting_value: meetingValue,
        reasoning: valueReasoning
      };

      if (meetingValue === 'high') {
        results.meetings_approved++;
        action.decision = 'approved';
        
      } else if (meetingValue === 'low') {
        // Decide whether to auto-decline or flag for review
        const shouldAutoDecline = opportunityCost < autoDeclineThreshold && !event.recurring;

        if (shouldAutoDecline) {
          // Auto-decline
          await supabase.from('auto_declined_activities').insert({
            organization_id: organizationId,
            activity_type: 'meeting',
            activity_description: event.title || 'Untitled meeting',
            estimated_opportunity_cost: opportunityCost,
            reason_declined: valueReasoning,
            alternative_suggested: 'Consider async communication via Loom/email, or batch similar discussions',
            auto_declined: true
          });

          await supabase.from('autonomous_actions').insert({
            organization_id: organizationId,
            agent_type: 'meeting_enforcer',
            action_type: 'auto_decline',
            target_entity_type: 'calendar_event',
            target_entity_id: event.id,
            decision: 'auto_declined',
            reasoning: `${valueReasoning}. Opportunity cost: $${opportunityCost.toFixed(0)}`,
            confidence_score: 85,
            value_impact: opportunityCost,
            was_auto_executed: true,
            executed_at: new Date().toISOString()
          });

          results.meetings_auto_declined++;
          results.total_time_saved_hours += durationHours;
          results.total_opportunity_cost_avoided += opportunityCost;
          action.decision = 'auto_declined';

        } else {
          // Flag for review
          await supabase.from('autonomous_actions').insert({
            organization_id: organizationId,
            agent_type: 'meeting_enforcer',
            action_type: 'flagged_review',
            target_entity_type: 'calendar_event',
            target_entity_id: event.id,
            decision: 'needs_review',
            reasoning: `${valueReasoning}. High opportunity cost: $${opportunityCost.toFixed(0)}`,
            confidence_score: 70,
            value_impact: opportunityCost,
            requires_approval: true,
            was_auto_executed: false
          });

          results.meetings_flagged++;
          action.decision = 'flagged';
        }
      } else {
        // Medium value - use AI for nuanced decision if available
        if (LOVABLE_API_KEY && opportunityCost > minMeetingROI) {
          const analysisPrompt = `Analyze this meeting and determine its value:

Meeting: "${event.title}"
Duration: ${durationHours} hours
Event Type: ${event.event_type || 'Not specified'}
Recurring: ${event.recurring ? 'Yes' : 'No'}
Attendees: ${event.attendees_count || 'Unknown'}
Opportunity Cost: $${opportunityCost.toFixed(0)}
Implied Hourly Rate: $${impliedHourlyRate}

Provide JSON response:
{
  "recommendation": "keep" | "decline" | "shorten",
  "confidence": 0-100,
  "reasoning": "string",
  "alternative": "string if recommending decline/shorten"
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
                { role: "system", content: "You are a time management AI focused on maximizing revenue per hour." },
                { role: "user", content: analysisPrompt }
              ],
              response_format: { type: "json_object" },
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const analysis = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');

            if (analysis.recommendation === 'decline' && analysis.confidence >= 75) {
              await supabase.from('autonomous_actions').insert({
                organization_id: organizationId,
                agent_type: 'meeting_enforcer',
                action_type: 'ai_recommend_decline',
                target_entity_type: 'calendar_event',
                target_entity_id: event.id,
                decision: 'recommend_decline',
                reasoning: analysis.reasoning,
                confidence_score: analysis.confidence,
                value_impact: opportunityCost,
                requires_approval: true,
                was_auto_executed: false,
                execution_result: analysis
              });

              results.meetings_flagged++;
              action.decision = 'ai_flagged';
              action.ai_analysis = analysis;
            } else {
              results.meetings_approved++;
              action.decision = 'ai_approved';
            }
          }
        } else {
          results.meetings_approved++;
          action.decision = 'approved';
        }
      }

      results.actions.push(action);
    }

    // Log the run
    await supabase.from('agent_execution_logs').insert({
      organization_id: organizationId,
      action_type: 'meeting_enforcement',
      reasoning: `Analyzed ${results.meetings_analyzed} meetings: ${results.meetings_auto_declined} auto-declined, ${results.meetings_flagged} flagged, saved ${results.total_time_saved_hours.toFixed(1)}h ($${results.total_opportunity_cost_avoided.toFixed(0)})`,
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
    console.error("Meeting enforcer error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
