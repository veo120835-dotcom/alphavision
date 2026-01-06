import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DecisionWindowConfig {
  small: number;
  medium: number;
  large: number;
}

interface DealSizeThresholds {
  small: number;
  large: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { opportunity_id, organization_id, action } = await req.json();

    if (!opportunity_id || !organization_id) {
      throw new Error('opportunity_id and organization_id are required');
    }

    // Fetch opportunity
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('*, contact:contacts(*)')
      .eq('id', opportunity_id)
      .single();

    if (oppError || !opportunity) {
      throw new Error('Opportunity not found');
    }

    // Fetch or create deal decision record
    let { data: dealDecision } = await supabase
      .from('deal_decisions')
      .select('*')
      .eq('opportunity_id', opportunity_id)
      .single();

    // Handle different actions
    switch (action) {
      case 'initiate':
        return await initiateDeadline(supabase, opportunity, organization_id, dealDecision);
      
      case 'send_touch':
        return await sendTouch(supabase, opportunity, organization_id, dealDecision);
      
      case 'check_deadline':
        return await checkDeadline(supabase, opportunity, organization_id, dealDecision);
      
      case 'record_decision':
        const { decision, loss_reason } = await req.json();
        return await recordDecision(supabase, opportunity, organization_id, dealDecision, decision, loss_reason);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: unknown) {
    console.error('Decision deadline error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function initiateDeadline(
  supabase: any, 
  opportunity: any, 
  organization_id: string,
  existingDecision: any
) {
  if (existingDecision) {
    return new Response(JSON.stringify({
      message: 'Deadline already set',
      deal_decision: existingDecision
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Determine window based on deal size
  const windowDays = getWindowDays(opportunity.amount || 0);
  const proposalSentAt = new Date();
  const deadline = new Date(proposalSentAt.getTime() + windowDays * 24 * 60 * 60 * 1000);

  // Create deal decision record
  const { data: newDecision, error } = await supabase
    .from('deal_decisions')
    .insert({
      organization_id,
      opportunity_id: opportunity.id,
      proposal_sent_at: proposalSentAt.toISOString(),
      decision_deadline: deadline.toISOString(),
      window_days: windowDays,
      touches: [],
      touch_count: 0
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create decision record: ${error.message}`);
  }

  // Log the action
  await supabase.from('autonomous_actions').insert({
    organization_id,
    agent_type: 'decision_deadline',
    action_type: 'deadline_set',
    target_entity_type: 'opportunity',
    target_entity_id: opportunity.id,
    decision: `${windowDays}-day window`,
    reasoning: `Deal value $${opportunity.amount || 0} → ${windowDays}-day decision window`,
    confidence_score: 90,
    was_auto_executed: true,
    executed_at: new Date().toISOString()
  });

  return new Response(JSON.stringify({
    message: 'Decision deadline initiated',
    deal_decision: newDecision,
    window_days: windowDays,
    deadline: deadline.toISOString()
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function sendTouch(
  supabase: any,
  opportunity: any,
  organization_id: string,
  dealDecision: any
) {
  if (!dealDecision) {
    throw new Error('No decision deadline set. Call with action=initiate first.');
  }

  const touchCount = dealDecision.touch_count || 0;
  const MAX_TOUCHES = 3;

  if (touchCount >= MAX_TOUCHES) {
    return new Response(JSON.stringify({
      message: 'Max touches reached',
      touch_count: touchCount
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Determine which touch to send
  const touchType = getTouchType(touchCount);
  const emailTemplate = getEmailTemplate(touchType, opportunity, opportunity.contact);

  // Record the touch
  const touches = dealDecision.touches || [];
  touches.push({
    type: touchType,
    sent_at: new Date().toISOString(),
    opened: false,
    replied: false
  });

  await supabase
    .from('deal_decisions')
    .update({
      touches,
      touch_count: touchCount + 1
    })
    .eq('id', dealDecision.id);

  return new Response(JSON.stringify({
    message: 'Touch prepared',
    touch_number: touchCount + 1,
    touch_type: touchType,
    email_template: emailTemplate
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function checkDeadline(
  supabase: any,
  opportunity: any,
  organization_id: string,
  dealDecision: any
) {
  if (!dealDecision) {
    return new Response(JSON.stringify({
      message: 'No deadline set',
      expired: false
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (dealDecision.decision_made) {
    return new Response(JSON.stringify({
      message: 'Decision already made',
      decision: dealDecision.decision,
      expired: false
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const deadline = new Date(dealDecision.decision_deadline);
  const now = new Date();
  const expired = now > deadline;

  if (expired) {
    // Mark as no decision
    await supabase
      .from('deal_decisions')
      .update({
        decision_made: true,
        decision: 'no_decision',
        decision_at: now.toISOString()
      })
      .eq('id', dealDecision.id);

    // Update opportunity status
    await supabase
      .from('opportunities')
      .update({ status: 'closed_no_decision' })
      .eq('id', opportunity.id);

    // Log the action
    await supabase.from('autonomous_actions').insert({
      organization_id,
      agent_type: 'decision_deadline',
      action_type: 'deadline_expired',
      target_entity_type: 'opportunity',
      target_entity_id: opportunity.id,
      decision: 'no_decision',
      reasoning: `Deadline expired after ${dealDecision.touch_count} touches`,
      confidence_score: 100,
      was_auto_executed: true,
      executed_at: now.toISOString()
    });
  }

  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return new Response(JSON.stringify({
    message: expired ? 'Deadline expired' : 'Deadline active',
    expired,
    days_remaining: expired ? 0 : daysRemaining,
    deadline: deadline.toISOString()
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function recordDecision(
  supabase: any,
  opportunity: any,
  organization_id: string,
  dealDecision: any,
  decision: string,
  lossReason?: string
) {
  const now = new Date();

  if (dealDecision) {
    await supabase
      .from('deal_decisions')
      .update({
        decision_made: true,
        decision,
        decision_at: now.toISOString(),
        loss_reason: lossReason
      })
      .eq('id', dealDecision.id);
  }

  // Update opportunity
  const oppStatus = decision === 'won' ? 'closed_won' : 
                    decision === 'lost' ? 'closed_lost' : 'extended';
  
  await supabase
    .from('opportunities')
    .update({ 
      status: oppStatus,
      lost_reason: lossReason 
    })
    .eq('id', opportunity.id);

  return new Response(JSON.stringify({
    message: 'Decision recorded',
    decision,
    opportunity_status: oppStatus
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function getWindowDays(amount: number): number {
  const thresholds: DealSizeThresholds = { small: 5000, large: 25000 };
  const windows: DecisionWindowConfig = { small: 5, medium: 7, large: 14 };

  if (amount < thresholds.small) return windows.small;
  if (amount >= thresholds.large) return windows.large;
  return windows.medium;
}

function getTouchType(touchCount: number): string {
  switch (touchCount) {
    case 0: return 'recap';
    case 1: return 'cost_of_inaction';
    case 2: return 'close_loop';
    default: return 'close_loop';
  }
}

function getEmailTemplate(
  touchType: string, 
  opportunity: any, 
  contact: any
): { subject: string; body: string } {
  const firstName = contact?.first_name || 'there';
  const dealName = opportunity?.name || 'our proposal';
  const amount = opportunity?.amount ? `$${opportunity.amount.toLocaleString()}` : '';

  switch (touchType) {
    case 'recap':
      return {
        subject: `Quick recap: ${dealName}`,
        body: `Hi ${firstName},

I wanted to send a quick recap of what we discussed and the proposal I sent over.

Key points:
- [OUTCOME_1]
- [OUTCOME_2]
- [OUTCOME_3]

The investment is ${amount}, and we can get started [TIMELINE].

If you have any questions or want to discuss further, just reply to this email.

Looking forward to hearing from you.`
      };

    case 'cost_of_inaction':
      return {
        subject: `Thinking about timing`,
        body: `Hi ${firstName},

I was thinking about our conversation and wanted to share a perspective on timing.

[SPECIFIC_COST_OF_WAITING]

This isn't about pressure – it's about making sure the timing aligns with your goals.

Is there anything holding you back that we haven't addressed?`
      };

    case 'close_loop':
      return {
        subject: `Closing the loop`,
        body: `Hi ${firstName},

I want to be respectful of your time, so I'm closing the loop on this.

If the timing isn't right, that's completely fine. No hard feelings.

If you'd like to move forward, just let me know and I'll send over the next steps.

Either way, I wish you the best with [THEIR_GOAL].`
      };

    default:
      return { subject: '', body: '' };
  }
}
