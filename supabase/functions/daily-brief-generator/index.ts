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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { organization_id, user_id } = await req.json();
    
    console.log(`[daily-brief-generator] Generating brief for org: ${organization_id}`);

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Gather all autonomous actions from past 24h
    const { data: autonomousActions } = await supabase
      .from('autonomous_actions')
      .select('*')
      .eq('organization_id', organization_id)
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false });

    // 2. Gather pending approval requests
    const { data: pendingApprovals } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    // 3. Gather flagged risks
    const { data: activeThreats } = await supabase
      .from('business_threats')
      .select('*')
      .eq('organization_id', organization_id)
      .is('resolved_at', null)
      .order('detected_at', { ascending: false })
      .limit(5);

    const { data: activeFailureModes } = await supabase
      .from('failure_modes')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('status', 'active')
      .order('risk_score', { ascending: false })
      .limit(3);

    // 4. Gather competitive signals
    const { data: competitiveSignals } = await supabase
      .from('competitive_signals')
      .select('*')
      .eq('organization_id', organization_id)
      .gte('detected_at', yesterday)
      .eq('response_required', true);

    // 5. Gather opportunities
    const { data: opportunities } = await supabase
      .from('arbitrage_opportunities_queue')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('status', 'pending')
      .order('estimated_roi_percent', { ascending: false })
      .limit(3);

    // 6. Calculate revenue impact
    const autoExecutedActions = (autonomousActions || []).filter(a => a.was_auto_executed);
    const blockedActions = autoExecutedActions.filter(a => 
      a.action_type.includes('block') || a.action_type.includes('reject')
    );
    
    let protectedRevenue = 0;
    let savedTime = 0;
    
    for (const action of autoExecutedActions) {
      if (action.value_impact) {
        protectedRevenue += Math.abs(action.value_impact);
      }
      // Estimate 15 min saved per auto-handled decision
      savedTime += 15;
    }

    // 7. Build the brief sections
    const actionsRequired = (pendingApprovals || []).map(a => ({
      title: a.title,
      description: a.description,
      urgency: a.amount && a.amount > 10000 ? 'high' : 'medium',
      type: a.request_type
    }));

    const autoHandled = autoExecutedActions.slice(0, 10).map(a => ({
      action: a.decision,
      type: a.action_type,
      result: a.was_auto_executed ? 'completed' : 'pending'
    }));

    const risksFlagged = [
      ...(activeThreats || []).map(t => ({
        risk: t.description,
        severity: t.severity,
        source: 'threat_detection'
      })),
      ...(activeFailureModes || []).map(f => ({
        risk: f.description,
        severity: f.risk_score > 70 ? 'high' : 'medium',
        source: 'failure_mode'
      })),
      ...(competitiveSignals || []).map(s => ({
        risk: `Competitor signal: ${s.signal_type}`,
        severity: s.severity,
        source: 'competitive_intel'
      }))
    ];

    const opportunitiesList = (opportunities || []).map(o => ({
      title: o.title,
      estimated_value: o.estimated_revenue,
      confidence: o.confidence_score,
      expires: o.expires_at
    }));

    // 8. Generate AI summary if API key available
    let executiveSummary = '';
    let tomorrowsFocus = '';

    if (lovableApiKey) {
      try {
        const summaryPrompt = `Generate a concise 2-3 sentence executive summary for a business owner based on:
- ${autoExecutedActions.length} autonomous actions taken today
- ${blockedActions.length} potentially harmful actions blocked
- ${risksFlagged.length} active risks
- ${opportunitiesList.length} pending opportunities
- $${protectedRevenue} revenue protected
- ${savedTime} minutes of decision time saved

Key issues: ${risksFlagged.slice(0, 3).map(r => r.risk).join(', ') || 'None critical'}

Be direct, professional, and focus on what matters most.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are an executive assistant writing daily briefings. Be concise and action-oriented.' },
              { role: 'user', content: summaryPrompt }
            ],
            max_tokens: 200
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          executiveSummary = aiData.choices?.[0]?.message?.content || '';
        }

        // Generate tomorrow's focus
        const focusPrompt = `Based on these priorities, suggest ONE focus area for tomorrow in 15 words or less:
- Pending approvals: ${actionsRequired.length}
- Active risks: ${risksFlagged.length}
- Best opportunity: ${opportunitiesList[0]?.title || 'None pending'}`;

        const focusResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You suggest daily focus areas. Be specific and actionable.' },
              { role: 'user', content: focusPrompt }
            ],
            max_tokens: 50
          })
        });

        if (focusResponse.ok) {
          const focusData = await focusResponse.json();
          tomorrowsFocus = focusData.choices?.[0]?.message?.content || '';
        }
      } catch (aiError) {
        console.error('[daily-brief-generator] AI generation error:', aiError);
      }
    }

    // Fallback summaries
    if (!executiveSummary) {
      executiveSummary = `Today your AI handled ${autoExecutedActions.length} decisions autonomously, blocked ${blockedActions.length} risky actions, and protected ~$${protectedRevenue.toLocaleString()} in potential losses. ${actionsRequired.length > 0 ? `${actionsRequired.length} items require your attention.` : 'No immediate actions required.'}`;
    }

    if (!tomorrowsFocus) {
      if (actionsRequired.length > 0) {
        tomorrowsFocus = `Review and decide on ${actionsRequired.length} pending approval(s)`;
      } else if (opportunitiesList.length > 0) {
        tomorrowsFocus = `Evaluate opportunity: ${opportunitiesList[0].title}`;
      } else {
        tomorrowsFocus = 'Continue building - system running smoothly';
      }
    }

    // 9. Calculate recommended time allocation
    const timeAllocation: Record<string, number> = {
      'Strategic decisions': Math.min(actionsRequired.length * 15, 60),
      'Risk review': risksFlagged.length > 0 ? 30 : 0,
      'Opportunity evaluation': opportunitiesList.length > 0 ? 30 : 0,
      'System monitoring': 15,
      'Deep work': 180 // Remaining time for focused work
    };

    // 10. Build priority decisions for the brief
    const priorityDecisions = actionsRequired.map((a, i) => ({
      id: i + 1,
      title: a.title,
      description: a.description,
      urgency: a.urgency,
      estimatedTime: '10 min',
      recommendation: 'Review and approve'
    }));

    // 11. Build revenue alerts
    const revenueAlerts = [
      ...(blockedActions.length > 0 ? [{
        type: 'protected',
        message: `$${protectedRevenue.toLocaleString()} protected from blocked actions`,
        count: blockedActions.length
      }] : []),
      ...(opportunitiesList.length > 0 ? [{
        type: 'opportunity',
        message: `${opportunitiesList.length} revenue opportunities pending`,
        count: opportunitiesList.length
      }] : [])
    ];

    // 12. Upsert the daily brief
    const briefData = {
      organization_id,
      user_id,
      brief_date: today,
      executive_summary: executiveSummary,
      actions_required: actionsRequired,
      auto_handled: autoHandled,
      risks_flagged: risksFlagged,
      opportunities: opportunitiesList,
      revenue_impact: {
        protected: protectedRevenue,
        time_saved_minutes: savedTime,
        blocked_count: blockedActions.length,
        auto_executed_count: autoExecutedActions.length
      },
      priority_decisions: priorityDecisions,
      revenue_alerts: revenueAlerts,
      time_allocation: timeAllocation,
      recommended_focus: risksFlagged.length > 0 ? risksFlagged[0].risk : (opportunitiesList[0]?.title || 'Business as usual'),
      tomorrows_focus: tomorrowsFocus,
      generated_at: new Date().toISOString()
    };

    const { error: upsertError } = await supabase
      .from('daily_briefs')
      .upsert(briefData, { 
        onConflict: 'organization_id,user_id,brief_date' 
      });

    if (upsertError) {
      console.error('[daily-brief-generator] Error saving brief:', upsertError);
    }

    // 13. Update passive mode stats
    await supabase
      .from('passive_mode_state')
      .update({
        observations_today: autoExecutedActions.length,
        decisions_prepared: pendingApprovals?.length || 0,
        risks_flagged: risksFlagged.length,
        opportunities_queued: opportunitiesList.length,
        actions_auto_executed: autoExecutedActions.filter(a => a.was_auto_executed).length
      })
      .eq('organization_id', organization_id);

    console.log(`[daily-brief-generator] Brief generated successfully`);

    return new Response(JSON.stringify({
      success: true,
      brief: briefData,
      stats: {
        autonomous_actions: autoExecutedActions.length,
        blocked_actions: blockedActions.length,
        pending_approvals: pendingApprovals?.length || 0,
        active_risks: risksFlagged.length,
        opportunities: opportunitiesList.length,
        time_saved_minutes: savedTime,
        protected_revenue: protectedRevenue
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[daily-brief-generator] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
