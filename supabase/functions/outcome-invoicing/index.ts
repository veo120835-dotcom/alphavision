import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      return new Response(
        JSON.stringify({ error: 'No organization found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orgId = membership.organization_id;

    if (req.method === 'POST') {
      const { outcome_id, attribution_data } = await req.json();

      const { data: outcome } = await supabase
        .from('decision_outcomes')
        .select('*, decision:decisions(*)')
        .eq('id', outcome_id)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!outcome) {
        return new Response(
          JSON.stringify({ error: 'Outcome not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const outcomeValue = parseFloat(String(outcome.actual_value || outcome.measured_value || 0));
      const feePercentage = 0.05;
      const invoiceAmount = outcomeValue * feePercentage;

      if (invoiceAmount < 1) {
        return new Response(
          JSON.stringify({
            message: 'Outcome value too small for invoicing',
            outcome_value: outcomeValue,
            fee_amount: invoiceAmount
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const invoiceNumber = `INV-OUT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          organization_id: orgId,
          invoice_number: invoiceNumber,
          status: 'draft',
          currency: 'USD',
          subtotal: invoiceAmount,
          total: invoiceAmount,
          due_date: new Date(Date.now() + 30 * 86400000).toISOString(),
          notes: `Outcome-based billing for: ${outcome.outcome_type}\nDecision ID: ${outcome.decision_id}\nAttribution confidence: ${attribution_data?.confidence || 'N/A'}`,
          metadata: {
            source: 'outcome_based',
            outcome_id: outcome.id,
            decision_id: outcome.decision_id,
            outcome_value: outcomeValue,
            fee_percentage: feePercentage,
            attribution_data
          }
        })
        .select()
        .maybeSingle();

      if (invoiceError) throw invoiceError;

      await supabase
        .from('revenue_events')
        .insert({
          organization_id: orgId,
          type: 'outcome_fee',
          amount: invoiceAmount,
          currency: 'USD',
          status: 'pending',
          source: 'outcome_invoicing',
          metadata: {
            invoice_id: invoice.id,
            outcome_id: outcome.id,
            decision_id: outcome.decision_id
          }
        });

      const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
      if (stripeSecret && invoiceAmount >= 10) {
        try {
          const stripeResponse = await fetch('https://api.stripe.com/v1/invoices', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeSecret}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              'customer': 'default_customer',
              'collection_method': 'send_invoice',
              'days_until_due': '30',
              'description': `Outcome-based fee: ${outcome.outcome_type}`,
              'metadata[alpha_vision_invoice_id]': invoice.id,
              'metadata[outcome_id]': outcome.id,
            }),
          });

          if (stripeResponse.ok) {
            const stripeInvoice = await stripeResponse.json();

            await supabase
              .from('invoices')
              .update({
                external_id: stripeInvoice.id,
                status: 'sent',
              })
              .eq('id', invoice.id);
          }
        } catch (stripeError) {
          console.error('Stripe invoice creation failed:', stripeError);
        }
      }

      return new Response(
        JSON.stringify({
          invoice,
          outcome_value: outcomeValue,
          fee_amount: invoiceAmount,
          fee_percentage: feePercentage,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, revenue_events(*)')
        .eq('organization_id', orgId)
        .eq('metadata->>source', 'outcome_based')
        .order('created_at', { ascending: false });

      return new Response(
        JSON.stringify({ invoices }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Outcome invoicing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
