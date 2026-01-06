import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getNextPayday(): Date {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Paydays are typically 1st and 15th
  if (currentDay < 15) {
    return new Date(currentYear, currentMonth, 15);
  } else {
    // Next month's 1st
    return new Date(currentYear, currentMonth + 1, 1);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, organization_id } = body;

    // Handle Stripe webhook for payment failures
    if (action === 'handle_payment_failure') {
      const { customer_email, customer_id, amount_due, currency, error_code, error_message, ltv_estimate } = body;

      // Determine recovery strategy
      let strategy = 'standard_retry';
      let nextRetry = new Date();

      if (error_code === 'insufficient_funds' || error_code === 'card_declined') {
        // Schedule for next payday
        strategy = 'payday_retry';
        nextRetry = getNextPayday();
      } else if (error_code === 'expired_card') {
        strategy = 'card_update_request';
        nextRetry.setDate(nextRetry.getDate() + 1);
      } else {
        // Standard 3-day retry
        nextRetry.setDate(nextRetry.getDate() + 3);
      }

      // Check if this is a high-value customer
      const amountInDollars = amount_due / 100;
      if (amountInDollars >= 500 || (ltv_estimate && ltv_estimate >= 5000)) {
        strategy = 'white_glove';
      }

      // Record the failure
      const { data: failure, error } = await supabase
        .from('payment_failures')
        .insert({
          organization_id,
          customer_email,
          customer_id,
          amount_due: amountInDollars,
          currency: currency || 'USD',
          error_code,
          error_message,
          ltv_estimate,
          recovery_strategy: strategy,
          next_retry_at: nextRetry.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Take immediate action based on strategy
      let actionTaken = '';

      if (strategy === 'white_glove') {
        // Alert human admin for high-value customers
        await supabase
          .from('approval_requests')
          .insert({
            organization_id,
            request_type: 'churn_risk',
            title: `High Value Payment Failed - ${customer_email}`,
            description: `Customer with $${amountInDollars} payment and estimated LTV of $${ltv_estimate || 'unknown'} has a failed payment. Immediate personal outreach recommended.`,
            amount: amountInDollars,
            status: 'pending',
            agent_recommendation: 'Call immediately to retain this customer'
          });
        actionTaken = 'White glove alert created';
      } else {
        // Generate AI email
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Write a friendly, non-threatening email about a payment issue.

SITUATION:
- Error: ${error_code}
- Amount: $${amountInDollars}
- Next retry scheduled: ${nextRetry.toDateString()}

STRATEGY: ${strategy}

If insufficient_funds: Be understanding, mention we'll try again on payday
If expired_card: Provide a secure link to update card
If other: Keep it casual, offer to help

Write a short email (under 100 words). Be human and helpful.
Include a subject line.

Format:
Subject: [subject]
Body: [body]`
                }]
              }],
              generationConfig: { temperature: 0.7 }
            })
          }
        );

        if (response.ok) {
          const result = await response.json();
          const emailText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          // Parse subject and body
          const subjectMatch = emailText.match(/Subject:\s*(.+)/i);
          const bodyMatch = emailText.match(/Body:\s*([\s\S]+)/i);

          if (subjectMatch && bodyMatch) {
            // Queue email (integrate with actual email service)
            actionTaken = `Email queued: "${subjectMatch[1]}"`;
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          failure_id: failure.id,
          strategy,
          next_retry: nextRetry.toISOString(),
          action_taken: actionTaken
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_failures') {
      const { data: failures, error } = await supabase
        .from('payment_failures')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('recovered', false)
        .order('next_retry_at', { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, failures }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'process_retries') {
      // Find failures ready for retry
      const now = new Date().toISOString();

      const { data: readyRetries, error } = await supabase
        .from('payment_failures')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('recovered', false)
        .lte('next_retry_at', now)
        .lt('retry_count', 5);

      if (error) throw error;

      const results: any[] = [];
      for (const failure of readyRetries || []) {
        // Here you would integrate with Stripe to retry the payment
        // For now, we simulate and update the record

        const newRetryDate = new Date();
        newRetryDate.setDate(newRetryDate.getDate() + 3);

        await supabase
          .from('payment_failures')
          .update({
            retry_count: failure.retry_count + 1,
            next_retry_at: newRetryDate.toISOString()
          })
          .eq('id', failure.id);

        results.push({
          failure_id: failure.id,
          customer_email: failure.customer_email,
          retry_number: failure.retry_count + 1
        });
      }

      return new Response(
        JSON.stringify({ success: true, retries_processed: results.length, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'mark_recovered') {
      const { failure_id } = body;

      await supabase
        .from('payment_failures')
        .update({ recovered: true })
        .eq('id', failure_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_stats') {
      const { data: all, error } = await supabase
        .from('payment_failures')
        .select('recovered, recovery_strategy, amount_due')
        .eq('organization_id', organization_id);

      if (error) throw error;

      const stats = {
        total_failures: all?.length || 0,
        recovered: all?.filter(f => f.recovered).length || 0,
        pending: all?.filter(f => !f.recovered).length || 0,
        total_at_risk: all?.filter(f => !f.recovered).reduce((sum, f) => sum + (f.amount_due || 0), 0) || 0,
        total_recovered: all?.filter(f => f.recovered).reduce((sum, f) => sum + (f.amount_due || 0), 0) || 0,
        by_strategy: {} as Record<string, number>
      };

      for (const f of all || []) {
        stats.by_strategy[f.recovery_strategy] = (stats.by_strategy[f.recovery_strategy] || 0) + 1;
      }

      return new Response(
        JSON.stringify({ success: true, stats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Churn Guard Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
