import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const PLATFORM_FEE_RATE = 0.10;

interface CreateOfferRequest {
  leadId: string;
  contactId?: string;
  title: string;
  description?: string;
  askingPrice: number;
  minimumPrice?: number;
  currency?: string;
  industry?: string;
  location?: string;
  qualityGuarantees?: string[];
  expiresInDays?: number;
}

interface CreateBidRequest {
  offerId: string;
  bidAmount: number;
  message?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      throw new Error('No organization found');
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(p => p).pop();

    if (path === 'list-offers' && req.method === 'GET') {
      const params = url.searchParams;
      const status = params.get('status') || 'active';
      const industry = params.get('industry');
      const minScore = params.get('minScore');
      
      let query = supabase
        .from('marketplace_offers')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (industry) {
        query = query.eq('industry', industry);
      }

      if (minScore) {
        query = query.gte('lead_quality_score', parseInt(minScore));
      }

      const { data: offers, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, offers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'create-offer' && req.method === 'POST') {
      const body: CreateOfferRequest = await req.json();
      
      const expiresAt = body.expiresInDays
        ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', body.leadId)
        .eq('organization_id', membership.organization_id)
        .maybeSingle();

      if (!lead) {
        throw new Error('Lead not found or access denied');
      }

      const leadAgeDays = Math.floor(
        (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const { data: offer, error } = await supabase
        .from('marketplace_offers')
        .insert({
          seller_org_id: membership.organization_id,
          lead_id: body.leadId,
          contact_id: body.contactId || null,
          title: body.title,
          description: body.description,
          asking_price: body.askingPrice,
          minimum_price: body.minimumPrice || body.askingPrice * 0.8,
          currency: body.currency || 'USD',
          industry: body.industry || lead.company,
          location: body.location,
          lead_age_days: leadAgeDays,
          quality_guarantees: body.qualityGuarantees || [],
          status: 'active',
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, offer }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'create-bid' && req.method === 'POST') {
      const body: CreateBidRequest = await req.json();
      
      const { data: offer } = await supabase
        .from('marketplace_offers')
        .select('*')
        .eq('id', body.offerId)
        .eq('status', 'active')
        .maybeSingle();

      if (!offer) {
        throw new Error('Offer not found or no longer active');
      }

      if (offer.seller_org_id === membership.organization_id) {
        throw new Error('Cannot bid on your own offer');
      }

      if (offer.minimum_price && body.bidAmount < offer.minimum_price) {
        throw new Error(`Bid must be at least ${offer.minimum_price} ${offer.currency}`);
      }

      const { data: bid, error } = await supabase
        .from('marketplace_bids')
        .insert({
          offer_id: body.offerId,
          bidder_org_id: membership.organization_id,
          bidder_user_id: user.id,
          bid_amount: body.bidAmount,
          currency: offer.currency,
          status: 'pending',
          message: body.message,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('marketplace_offers')
        .update({ bids_count: offer.bids_count + 1 })
        .eq('id', body.offerId);

      await supabase
        .from('notifications')
        .insert({
          organization_id: offer.seller_org_id,
          type: 'marketplace_bid',
          title: 'New Bid Received',
          message: `New bid of ${body.bidAmount} ${offer.currency} on "${offer.title}"`,
          severity: 'info',
          metadata: { offerId: body.offerId, bidId: bid.id },
        });

      return new Response(
        JSON.stringify({ success: true, bid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'accept-bid' && req.method === 'POST') {
      const { bidId } = await req.json();
      
      const { data: bid } = await supabase
        .from('marketplace_bids')
        .select('*, marketplace_offers(*)')
        .eq('id', bidId)
        .maybeSingle();

      if (!bid || bid.marketplace_offers.seller_org_id !== membership.organization_id) {
        throw new Error('Bid not found or access denied');
      }

      const platformFee = bid.bid_amount * PLATFORM_FEE_RATE;
      const sellerPayout = bid.bid_amount - platformFee;

      const { data: transfer, error: transferError } = await supabase
        .from('lead_transfers')
        .insert({
          offer_id: bid.offer_id,
          seller_org_id: bid.marketplace_offers.seller_org_id,
          buyer_org_id: bid.bidder_org_id,
          lead_id: bid.marketplace_offers.lead_id,
          contact_id: bid.marketplace_offers.contact_id,
          sale_price: bid.bid_amount,
          currency: bid.currency,
          platform_fee: platformFee,
          seller_payout: sellerPayout,
          status: 'pending',
        })
        .select()
        .single();

      if (transferError) throw transferError;

      await supabase
        .from('marketplace_bids')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', bidId);

      await supabase
        .from('marketplace_offers')
        .update({ 
          status: 'sold', 
          sold_at: new Date().toISOString(),
          buyer_org_id: bid.bidder_org_id,
          final_price: bid.bid_amount,
        })
        .eq('id', bid.offer_id);

      await supabase
        .from('marketplace_bids')
        .update({ status: 'rejected' })
        .eq('offer_id', bid.offer_id)
        .neq('id', bidId);

      await supabase
        .from('revenue_events')
        .insert({
          organization_id: membership.organization_id,
          event_type: 'lead_sold',
          amount: sellerPayout,
          currency: bid.currency,
          source_type: 'marketplace',
          source_id: transfer.id,
          lead_id: bid.marketplace_offers.lead_id,
        });

      return new Response(
        JSON.stringify({ success: true, transfer }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'my-offers' && req.method === 'GET') {
      const { data: offers, error } = await supabase
        .from('marketplace_offers')
        .select('*')
        .eq('seller_org_id', membership.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, offers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'my-bids' && req.method === 'GET') {
      const { data: bids, error } = await supabase
        .from('marketplace_bids')
        .select('*, marketplace_offers(*)')
        .eq('bidder_org_id', membership.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, bids }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Lead marketplace error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});