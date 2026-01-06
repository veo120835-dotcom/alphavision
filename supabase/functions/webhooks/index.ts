import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyHmacSignature, verifyStripeSignature, validateTimestamp } from "../_shared/crypto.ts";

interface ToolCallback {
  action_id: string;
  status: 'succeeded' | 'failed';
  result: Record<string, unknown>;
  rollback?: {
    supported: boolean;
    instructions?: string;
    payload?: Record<string, unknown>;
  };
  logs?: Array<{
    ts: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    data?: Record<string, unknown>;
  }>;
}

interface WebhookPayload {
  provider: 'stripe' | 'ghl' | 'n8n';
  type: string;
  external_id?: string;
  org_id?: string;
  data: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestId = crypto.randomUUID();

    // n8n Tool Callback - POST /v1/tools/callback
    if (path === '/v1/tools/callback' && req.method === 'POST') {
      const orgId = req.headers.get('X-AV-Org-Id');
      const actionId = req.headers.get('X-AV-Action-Id');
      const timestamp = req.headers.get('X-AV-Timestamp');
      const nonce = req.headers.get('X-AV-Nonce');
      
      if (!orgId || !actionId) {
        return new Response(JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Missing required headers' } }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify timestamp is within 5 minutes
      if (!validateTimestamp(timestamp)) {
        return new Response(JSON.stringify({ error: { code: 'EXPIRED', message: 'Request expired or invalid timestamp' } }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const rawBody = await req.text();
      const signature = req.headers.get('X-AV-Signature');
      const webhookSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
      
      // Verify HMAC signature if secret is configured
      if (webhookSecret && signature && nonce && timestamp) {
        const isValid = await verifyHmacSignature(rawBody, timestamp, nonce, signature, webhookSecret);
        if (!isValid) {
          console.error('Invalid HMAC signature');
          return new Response(JSON.stringify({ error: { code: 'INVALID_SIGNATURE', message: 'Signature verification failed' } }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      const body: ToolCallback = JSON.parse(rawBody);

      // Update action status
      const { error: updateError } = await supabase
        .from('actions')
        .update({
          status: body.status,
          result: body.result,
          rollback_data: body.rollback?.payload,
          executed_at: new Date().toISOString()
        })
        .eq('id', actionId)
        .eq('organization_id', orgId);

      if (updateError) {
        console.error('Failed to update action:', updateError);
        throw updateError;
      }

      // Log execution
      if (body.logs && body.logs.length > 0) {
        for (const log of body.logs) {
          await supabase.from('agent_execution_logs').insert({
            organization_id: orgId,
            action_type: 'n8n_callback',
            result: log.level,
            reasoning: log.message,
            action_details: log.data
          });
        }
      }

      // Broadcast real-time update
      const channel = supabase.channel(`org:${orgId}`);
      await channel.send({
        type: 'broadcast',
        event: 'action_update',
        payload: {
          action_id: actionId,
          status: body.status,
          result_summary: typeof body.result === 'object' ? JSON.stringify(body.result).slice(0, 100) : String(body.result),
          updated_at: new Date().toISOString()
        }
      });

      console.log(`Action ${actionId} updated to ${body.status}`);

      return new Response(JSON.stringify({ ok: true, request_id: requestId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Stripe Webhook - POST /v1/webhooks/stripe
    if (path === '/v1/webhooks/stripe' && req.method === 'POST') {
      const rawBody = await req.text();
      const stripeSignature = req.headers.get('stripe-signature');
      const stripeSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
      
      // Verify Stripe signature if secret is configured
      if (stripeSecret && stripeSignature) {
        const isValid = await verifyStripeSignature(rawBody, stripeSignature, stripeSecret);
        if (!isValid) {
          console.error('Invalid Stripe signature');
          return new Response(JSON.stringify({ error: { code: 'INVALID_SIGNATURE', message: 'Stripe signature verification failed' } }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
      const body = JSON.parse(rawBody);
      
      // Normalize Stripe event
      const eventType = body.type;
      const data = body.data?.object || body;
      
      // Try to find org from metadata
      let orgId = data.metadata?.org_id;
      
      if (!orgId && data.customer) {
        // Look up org by Stripe customer ID
        const { data: billing } = await supabase
          .from('billing_events')
          .select('organization_id')
          .eq('metadata->>stripe_customer_id', data.customer)
          .limit(1)
          .single();
        orgId = billing?.organization_id;
      }

      if (orgId) {
        // Store as revenue event
        if (eventType === 'invoice.paid' || eventType === 'checkout.session.completed') {
          await supabase.from('revenue_events').insert({
            organization_id: orgId,
            event_type: eventType,
            amount: data.amount_paid ? data.amount_paid / 100 : data.amount_total / 100,
            currency: data.currency?.toUpperCase() || 'USD',
            external_transaction_id: data.id,
            payment_provider: 'stripe',
            metadata: { raw: data }
          });
        }

        // Store billing event
        await supabase.from('billing_events').insert({
          organization_id: orgId,
          event_type: eventType,
          amount: data.amount_paid ? data.amount_paid / 100 : (data.amount_total || 0) / 100,
          currency: data.currency?.toUpperCase() || 'USD',
          stripe_invoice_id: data.invoice || data.id,
          stripe_payment_intent_id: data.payment_intent,
          status: 'received',
          metadata: { stripe_event: body }
        });

        // Broadcast
        const channel = supabase.channel(`org:${orgId}`);
        await channel.send({
          type: 'broadcast',
          event: 'payment_received',
          payload: { type: eventType, amount: data.amount_paid / 100 }
        });
      }

      console.log(`Stripe webhook: ${eventType}`);
      return new Response(JSON.stringify({ received: true, request_id: requestId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GoHighLevel Webhook - POST /v1/webhooks/ghl
    if (path === '/v1/webhooks/ghl' && req.method === 'POST') {
      const body = await req.json();
      
      const orgId = body.locationId || body.org_id;
      const eventType = body.event || body.type;
      
      if (orgId) {
        // Map GHL events to our events
        let internalType = eventType;
        let leadId = body.contactId || body.leadId;

        // Handle lead events
        if (eventType?.includes('contact') || eventType?.includes('lead')) {
          // Update or create lead
          const leadData = {
            organization_id: orgId,
            external_id: leadId,
            name: body.fullName || body.firstName,
            email: body.email,
            phone: body.phone,
            source: 'ghl',
            platform: 'ghl',
            status: eventType.includes('created') ? 'new' : 'active',
            last_interaction_at: new Date().toISOString()
          };

          await supabase.from('leads').upsert(leadData, {
            onConflict: 'external_id'
          });
        }

        // Handle opportunity events
        if (eventType?.includes('opportunity')) {
          if (eventType.includes('won')) {
            await supabase.from('revenue_events').insert({
              organization_id: orgId,
              event_type: 'deal_closed',
              amount: body.monetaryValue || body.value,
              currency: 'USD',
              payment_provider: 'ghl',
              metadata: { ghl_event: body }
            });

            // Create outcome for attribution
            await supabase.from('decision_outcomes').insert({
              organization_id: orgId,
              outcome_type: 'revenue',
              outcome_description: `Deal closed: ${body.name || body.title}`,
              impact_score: body.monetaryValue || 0
            });
          }
        }

        // Broadcast
        const channel = supabase.channel(`org:${orgId}`);
        await channel.send({
          type: 'broadcast',
          event: 'ghl_event',
          payload: { type: eventType, data: body }
        });
      }

      console.log(`GHL webhook: ${eventType}`);
      return new Response(JSON.stringify({ received: true, request_id: requestId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generic n8n trigger endpoint - POST /v1/tools/trigger
    if (path === '/v1/tools/trigger' && req.method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Missing auth' } }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (!user) {
        return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: membership } = await supabase
        .from('memberships')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        return new Response(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'No org' } }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const body = await req.json();
      const actionId = crypto.randomUUID();

      // Create action record
      await supabase.from('actions').insert({
        id: actionId,
        organization_id: membership.organization_id,
        action_type: body.type || 'n8n_trigger',
        tool: body.workflow || 'custom',
        parameters: body.payload,
        status: 'queued'
      });

      // Call n8n if configured
      const n8nUrl = Deno.env.get('N8N_WEBHOOK_URL');
      if (n8nUrl) {
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = crypto.randomUUID();

        try {
          await fetch(n8nUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-AV-Org-Id': membership.organization_id,
              'X-AV-Action-Id': actionId,
              'X-AV-Timestamp': timestamp.toString(),
              'X-AV-Nonce': nonce
            },
            body: JSON.stringify({
              action_id: actionId,
              org_id: membership.organization_id,
              type: body.type,
              payload: body.payload,
              workflow: body.workflow
            })
          });
        } catch (e) {
          console.error('n8n trigger failed:', e);
        }
      }

      return new Response(JSON.stringify({
        action_id: actionId,
        status: 'queued',
        request_id: requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
