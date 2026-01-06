import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// Feature sets for each tier
const TIER_FEATURES: Record<string, Record<string, boolean>> = {
  standard: {
    email_sniper: true,
    closer_agent: false,
    voice_dialer: false,
    genetic_evolution: false
  },
  professional: {
    email_sniper: true,
    closer_agent: true,
    voice_dialer: false,
    genetic_evolution: false
  },
  enterprise: {
    email_sniper: true,
    closer_agent: true,
    voice_dialer: true,
    genetic_evolution: true
  }
};

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      customer: string;
      status: string;
      metadata?: {
        organization_id?: string;
        tenant_id?: string;
      };
      items?: {
        data: Array<{
          price: {
            id: string;
            metadata?: {
              tier?: string;
            };
          };
        }>;
      };
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!STRIPE_WEBHOOK_SECRET) {
      console.log('[Stripe] Webhook secret not configured - processing without verification');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Parse the event
    const body = await req.text();
    let event: StripeEvent;

    // In production, verify the webhook signature
    const signature = req.headers.get('stripe-signature');
    if (STRIPE_WEBHOOK_SECRET && signature) {
      // Stripe signature verification would go here
      // For now, we trust the payload
      console.log('[Stripe] Signature present, processing event');
    }

    event = JSON.parse(body);
    console.log(`[Stripe] Received event: ${event.type}`);

    const subscription = event.data.object;
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    const organizationId = subscription.metadata?.organization_id;
    const tenantId = subscription.metadata?.tenant_id;

    // Determine tier from price metadata
    const priceItem = subscription.items?.data?.[0];
    const tier = priceItem?.price?.metadata?.tier || 'standard';

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const status = subscription.status;
        const features = TIER_FEATURES[tier] || TIER_FEATURES.standard;

        // Update license_tenants if tenant_id is provided
        if (tenantId) {
          await supabase
            .from('license_tenants')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: status,
              current_tier: tier,
              features_enabled: features
            })
            .eq('id', tenantId);
        }

        // Log billing event
        if (organizationId) {
          await supabase.from('billing_events').insert({
            organization_id: organizationId,
            event_type: event.type,
            amount: 0, // Would come from invoice
            description: `Subscription ${status} - ${tier} tier`,
            metadata: { 
              subscription_id: subscriptionId,
              customer_id: customerId,
              tier
            }
          });
        }

        console.log(`[Stripe] Subscription ${subscriptionId} ${status} for tenant ${tenantId || 'unknown'}`);
        break;
      }

      case 'customer.subscription.deleted': {
        // Deactivate the tenant
        if (tenantId) {
          await supabase
            .from('license_tenants')
            .update({
              subscription_status: 'cancelled',
              features_enabled: { email_sniper: false }
            })
            .eq('id', tenantId);
        }

        if (organizationId) {
          await supabase.from('billing_events').insert({
            organization_id: organizationId,
            event_type: 'subscription_cancelled',
            amount: 0,
            description: `Subscription cancelled - ${tier} tier`,
            metadata: { 
              subscription_id: subscriptionId,
              customer_id: customerId
            }
          });
        }

        console.log(`[Stripe] Subscription ${subscriptionId} cancelled`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const amount = (invoice.amount_paid || 0) / 100; // Convert from cents

        if (organizationId) {
          await supabase.from('billing_events').insert({
            organization_id: organizationId,
            event_type: 'payment_succeeded',
            amount: amount,
            currency: invoice.currency?.toUpperCase() || 'USD',
            description: `Payment received for ${tier} subscription`,
            stripe_invoice_id: invoice.id,
            metadata: { 
              subscription_id: invoice.subscription,
              customer_id: customerId
            }
          });

          // Also log as revenue event
          await supabase.from('revenue_events').insert({
            organization_id: organizationId,
            amount: amount,
            currency: invoice.currency?.toUpperCase() || 'USD',
            source: 'stripe_subscription',
            description: `SaaS subscription - ${tier} tier`,
            metadata: {
              stripe_invoice_id: invoice.id,
              tier
            }
          });
        }

        console.log(`[Stripe] Payment of ${amount} received for ${customerId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;

        if (tenantId) {
          // Mark subscription as past_due
          await supabase
            .from('license_tenants')
            .update({
              subscription_status: 'past_due'
            })
            .eq('id', tenantId);
        }

        if (organizationId) {
          await supabase.from('billing_events').insert({
            organization_id: organizationId,
            event_type: 'payment_failed',
            amount: (invoice.amount_due || 0) / 100,
            description: `Payment failed for ${tier} subscription`,
            stripe_invoice_id: invoice.id,
            metadata: { 
              subscription_id: invoice.subscription,
              customer_id: customerId,
              failure_reason: invoice.last_payment_error?.message
            }
          });
        }

        console.log(`[Stripe] Payment failed for ${customerId}`);
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[Stripe Webhook] Error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
