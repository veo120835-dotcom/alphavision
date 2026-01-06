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

    const { action, campaign_id, contact_id, organization_id } = await req.json();
    console.log(`Campaign executor: ${action}`, { campaign_id, contact_id, organization_id });

    switch (action) {
      case 'process_scheduled': {
        // Get all enrollments that need processing
        const now = new Date().toISOString();
        const { data: enrollments, error: enrollError } = await supabase
          .from('campaign_enrollments')
          .select(`
            *,
            campaign:campaigns(*),
            contact:contacts(*)
          `)
          .eq('status', 'active')
          .lte('next_step_at', now)
          .limit(50);

        if (enrollError) throw enrollError;

        const results = [];
        for (const enrollment of enrollments || []) {
          try {
            const result = await processEnrollmentStep(supabase, enrollment);
            results.push({ enrollment_id: enrollment.id, success: true, result });
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            results.push({ enrollment_id: enrollment.id, success: false, error: errorMessage });
          }
        }

        return new Response(JSON.stringify({ processed: results.length, results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'enroll': {
        // Enroll a contact in a campaign
        const { data: campaign, error: campError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaign_id)
          .single();

        if (campError) throw campError;

        const { data: steps, error: stepsError } = await supabase
          .from('campaign_steps')
          .select('*')
          .eq('campaign_id', campaign_id)
          .order('step_number', { ascending: true })
          .limit(1);

        if (stepsError) throw stepsError;

        const firstStep = steps?.[0];
        const nextStepAt = firstStep?.delay_minutes 
          ? new Date(Date.now() + firstStep.delay_minutes * 60000).toISOString()
          : new Date().toISOString();

        const { data: enrollment, error: enrollError } = await supabase
          .from('campaign_enrollments')
          .insert({
            campaign_id,
            contact_id,
            status: 'active',
            current_step: 1,
            next_step_at: nextStepAt,
          })
          .select()
          .single();

        if (enrollError) throw enrollError;

        // Log enrollment event
        await supabase.from('campaign_events').insert({
          enrollment_id: enrollment.id,
          event_type: 'enrolled',
        });

        return new Response(JSON.stringify({ success: true, enrollment }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'stop': {
        const { enrollment_id, reason } = await req.json();
        
        const { error } = await supabase
          .from('campaign_enrollments')
          .update({ 
            status: 'stopped',
            stop_reason: reason,
            completed_at: new Date().toISOString()
          })
          .eq('id', enrollment_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Campaign executor error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processEnrollmentStep(supabase: any, enrollment: any) {
  const { campaign, contact } = enrollment;
  
  // Get current step
  const { data: steps, error: stepsError } = await supabase
    .from('campaign_steps')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('step_number', enrollment.current_step)
    .single();

  if (stepsError || !steps) {
    // No more steps, complete the enrollment
    await supabase
      .from('campaign_enrollments')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', enrollment.id);

    await supabase.from('campaign_events').insert({
      enrollment_id: enrollment.id,
      event_type: 'completed',
    });

    return { completed: true };
  }

  const step = steps;
  let actionResult = null;

  // Execute step based on type
  switch (step.step_type) {
    case 'email':
      actionResult = await sendEmail(supabase, contact, step);
      break;
    case 'sms':
      actionResult = await sendSMS(supabase, contact, step);
      break;
    case 'delay':
      actionResult = { delayed: true };
      break;
    case 'condition':
      actionResult = await evaluateCondition(supabase, contact, step);
      break;
  }

  // Log the event
  await supabase.from('campaign_events').insert({
    enrollment_id: enrollment.id,
    step_id: step.id,
    event_type: step.step_type,
    metadata: actionResult,
  });

  // Get next step
  const { data: nextStep } = await supabase
    .from('campaign_steps')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('step_number', enrollment.current_step + 1)
    .single();

  if (nextStep) {
    const nextStepAt = nextStep.delay_minutes
      ? new Date(Date.now() + nextStep.delay_minutes * 60000).toISOString()
      : new Date().toISOString();

    await supabase
      .from('campaign_enrollments')
      .update({
        current_step: enrollment.current_step + 1,
        next_step_at: nextStepAt,
      })
      .eq('id', enrollment.id);
  } else {
    // Complete enrollment
    await supabase
      .from('campaign_enrollments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', enrollment.id);
  }

  return { step: step.step_number, action: step.step_type, result: actionResult };
}

async function sendEmail(supabase: any, contact: any, step: any) {
  // Check if Resend API key is available
  const resendKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendKey) {
    console.log('Email would be sent (no RESEND_API_KEY configured):', {
      to: contact.email,
      subject: step.subject,
    });
    return { simulated: true, to: contact.email };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@alphavision.app',
        to: contact.email,
        subject: replaceVariables(step.subject, contact),
        html: replaceVariables(step.body, contact),
      }),
    });

    const result = await response.json();
    
    // Log the send
    await supabase.from('email_sends').insert({
      organization_id: contact.organization_id,
      contact_id: contact.id,
      template_id: step.template_id,
      provider: 'resend',
      status: response.ok ? 'sent' : 'failed',
      sent_at: new Date().toISOString(),
      meta: result,
    });

    return result;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Email send error:', err);
    return { error: errorMessage };
  }
}

async function sendSMS(supabase: any, contact: any, step: any) {
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!twilioSid || !twilioToken || !twilioPhone) {
    console.log('SMS would be sent (Twilio not configured):', {
      to: contact.phone,
      body: step.body,
    });
    return { simulated: true, to: contact.phone };
  }

  try {
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
          From: twilioPhone,
          To: contact.phone,
          Body: replaceVariables(step.body, contact),
        }),
      }
    );

    return await response.json();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('SMS send error:', err);
    return { error: errorMessage };
  }
}

async function evaluateCondition(supabase: any, contact: any, step: any) {
  const conditions = step.branch_conditions || {};
  // Simple condition evaluation - can be expanded
  return { evaluated: true, conditions };
}

function replaceVariables(text: string, contact: any): string {
  if (!text) return '';
  return text
    .replace(/\{\{first_name\}\}/g, contact.first_name || '')
    .replace(/\{\{last_name\}\}/g, contact.last_name || '')
    .replace(/\{\{email\}\}/g, contact.email || '')
    .replace(/\{\{phone\}\}/g, contact.phone || '')
    .replace(/\{\{company\}\}/g, contact.company || '');
}