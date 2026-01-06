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
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === 'POST' && path.endsWith('/listings')) {
      const { lead_id, price, description, target_industries, target_locations } = await req.json();

      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead_id)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!lead) {
        return new Response(
          JSON.stringify({ error: 'Lead not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: listing, error: listingError } = await supabase
        .from('lead_listings')
        .insert({
          organization_id: orgId,
          lead_id: lead_id,
          price: price,
          currency: 'USD',
          status: 'active',
          description: description || `Quality lead: ${lead.company || lead.name}`,
          metadata: {
            lead_source: lead.source,
            lead_status: lead.status,
            lead_value: lead.value,
            target_industries,
            target_locations,
            listed_at: new Date().toISOString()
          }
        })
        .select()
        .maybeSingle();

      if (listingError) throw listingError;

      await supabase
        .from('leads')
        .update({ status: 'listed_marketplace' })
        .eq('id', lead_id);

      return new Response(
        JSON.stringify({ listing }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && path.includes('/purchase')) {
      const listingId = path.split('/').pop();
      const { payment_method_id } = await req.json();

      const { data: listing } = await supabase
        .from('lead_listings')
        .select('*, lead:leads(*), seller:organizations(id, name)')
        .eq('id', listingId)
        .eq('status', 'active')
        .maybeSingle();

      if (!listing) {
        return new Response(
          JSON.stringify({ error: 'Listing not found or not available' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (listing.organization_id === orgId) {
        return new Response(
          JSON.stringify({ error: 'Cannot purchase your own listing' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeSecret) {
        return new Response(
          JSON.stringify({ error: 'Payment processing not configured' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const platformFeePercentage = 0.15;
      const totalAmount = Math.round(listing.price * 100);
      const platformFee = Math.round(totalAmount * platformFeePercentage);
      const sellerAmount = totalAmount - platformFee;

      const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecret}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'amount': totalAmount.toString(),
          'currency': 'usd',
          'payment_method': payment_method_id,
          'confirm': 'true',
          'description': `Lead purchase from ${listing.seller.name}`,
          'metadata[listing_id]': listing.id,
          'metadata[lead_id]': listing.lead_id,
          'metadata[buyer_org_id]': orgId,
          'metadata[seller_org_id]': listing.organization_id,
          'application_fee_amount': platformFee.toString(),
        }),
      });

      const paymentIntent = await stripeResponse.json();

      if (!stripeResponse.ok || paymentIntent.status !== 'succeeded') {
        return new Response(
          JSON.stringify({
            error: 'Payment failed',
            details: paymentIntent.error || paymentIntent
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: transaction, error: txError } = await supabase
        .from('marketplace_transactions')
        .insert({
          listing_id: listing.id,
          buyer_org_id: orgId,
          seller_org_id: listing.organization_id,
          lead_id: listing.lead_id,
          price: listing.price,
          currency: 'USD',
          platform_fee: platformFee / 100,
          seller_payout: sellerAmount / 100,
          payment_intent_id: paymentIntent.id,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (txError) throw txError;

      await supabase
        .from('lead_listings')
        .update({
          status: 'sold',
          buyer_org_id: orgId,
          sold_at: new Date().toISOString()
        })
        .eq('id', listing.id);

      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          organization_id: orgId,
          name: listing.lead.name,
          email: listing.lead.email,
          phone: listing.lead.phone,
          company: listing.lead.company,
          title: listing.lead.title,
          status: 'new',
          source: 'marketplace_purchase',
          value: listing.lead.value,
          notes: `Purchased from marketplace. Original source: ${listing.lead.source}`,
          metadata: {
            marketplace_listing_id: listing.id,
            marketplace_transaction_id: transaction.id,
            original_seller_org_id: listing.organization_id,
            purchase_price: listing.price,
            purchased_at: new Date().toISOString()
          }
        })
        .select()
        .maybeSingle();

      if (leadError) throw leadError;

      await supabase
        .from('revenue_events')
        .insert([
          {
            organization_id: listing.organization_id,
            type: 'marketplace_sale',
            amount: sellerAmount / 100,
            currency: 'USD',
            status: 'completed',
            source: 'lead_marketplace',
            metadata: {
              transaction_id: transaction.id,
              listing_id: listing.id,
              buyer_org_id: orgId,
              platform_fee: platformFee / 100
            }
          },
          {
            organization_id: orgId,
            type: 'marketplace_purchase',
            amount: -listing.price,
            currency: 'USD',
            status: 'completed',
            source: 'lead_marketplace',
            metadata: {
              transaction_id: transaction.id,
              listing_id: listing.id,
              seller_org_id: listing.organization_id
            }
          }
        ]);

      return new Response(
        JSON.stringify({
          success: true,
          transaction,
          new_lead: newLead,
          payment_intent: paymentIntent.id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      const action = url.searchParams.get('action');

      if (action === 'browse') {
        const industry = url.searchParams.get('industry');
        const maxPrice = url.searchParams.get('max_price');
        const minQuality = url.searchParams.get('min_quality');

        let query = supabase
          .from('lead_listings')
          .select('*, lead:leads(*), seller:organizations(name)')
          .eq('status', 'active')
          .neq('organization_id', orgId);

        if (maxPrice) {
          query = query.lte('price', parseFloat(maxPrice));
        }

        const { data: listings } = await query.order('created_at', { ascending: false });

        return new Response(
          JSON.stringify({ listings }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'my-listings') {
        const { data: listings } = await supabase
          .from('lead_listings')
          .select('*, lead:leads(*)')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        return new Response(
          JSON.stringify({ listings }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'transactions') {
        const { data: purchases } = await supabase
          .from('marketplace_transactions')
          .select('*, listing:lead_listings(*), lead:leads(*)')
          .eq('buyer_org_id', orgId);

        const { data: sales } = await supabase
          .from('marketplace_transactions')
          .select('*, listing:lead_listings(*), lead:leads(*)')
          .eq('seller_org_id', orgId);

        return new Response(
          JSON.stringify({ purchases, sales }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Lead marketplace error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
