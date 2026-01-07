import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerateQuoteRequest {
  contactId: string;
  conversationId?: string;
  productType: string;
  context?: Record<string, any>;
}

interface PricingRecommendationRequest {
  productType: string;
  customerSegment?: string;
  competitorPricing?: number;
  valueDrivers?: string[];
}

function calculateDynamicPrice(basePrice: number, factors: any): number {
  let finalPrice = basePrice;
  
  if (factors.urgency === 'high') {
    finalPrice *= 0.95;
  }
  
  if (factors.leadQuality > 80) {
    finalPrice *= 1.1;
  } else if (factors.leadQuality < 40) {
    finalPrice *= 0.9;
  }
  
  if (factors.competitorPrice) {
    const competitorAdjustment = factors.competitorPrice * 0.95;
    finalPrice = Math.min(finalPrice, competitorAdjustment);
  }
  
  if (factors.volumeDiscount) {
    finalPrice *= (1 - factors.volumeDiscount);
  }
  
  return Math.round(finalPrice * 100) / 100;
}

function generateLineItems(productType: string, context: any) {
  const baseItems = [
    {
      description: `${productType} - Base Package`,
      quantity: 1,
      unit_price: 1000,
      total: 1000,
    },
  ];

  if (context?.addOns) {
    context.addOns.forEach((addOn: string) => {
      baseItems.push({
        description: addOn,
        quantity: 1,
        unit_price: 200,
        total: 200,
      });
    });
  }

  return baseItems;
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

    if (path === 'generate-quote' && req.method === 'POST') {
      const body: GenerateQuoteRequest = await req.json();
      
      const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', body.contactId)
        .eq('organization_id', membership.organization_id)
        .maybeSingle();

      if (!contact) {
        throw new Error('Contact not found');
      }

      const { data: leadScore } = await supabase
        .from('lead_scores')
        .select('*')
        .eq('contact_id', body.contactId)
        .order('scored_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const basePrice = 1000;
      const pricingFactors = {
        urgency: leadScore?.urgency_score > 70 ? 'high' : 'normal',
        leadQuality: leadScore?.overall_score || 50,
        competitorPrice: body.context?.competitorPrice,
        volumeDiscount: body.context?.volumeDiscount || 0,
      };

      const dynamicPrice = calculateDynamicPrice(basePrice, pricingFactors);
      const lineItems = generateLineItems(body.productType, body.context);
      
      const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      const quoteNumber = `Q-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const { data: quotation, error } = await supabase
        .from('quotations')
        .insert({
          organization_id: membership.organization_id,
          contact_id: body.contactId,
          conversation_id: body.conversationId || null,
          quote_number: quoteNumber,
          title: `${body.productType} Proposal for ${contact.first_name} ${contact.last_name || ''}`,
          description: `Custom pricing based on your needs and current market conditions`,
          line_items: lineItems,
          subtotal,
          tax,
          total,
          currency: 'USD',
          status: 'draft',
          valid_until: validUntil,
          metadata: {
            pricing_factors: pricingFactors,
            lead_score: leadScore?.overall_score,
            ai_generated: true,
          },
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          success: true, 
          quotation,
          pricing_insights: {
            recommended_price: dynamicPrice,
            factors_applied: pricingFactors,
            lead_quality: leadScore?.overall_score || 'unknown',
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'price-recommendation' && req.method === 'POST') {
      const body: PricingRecommendationRequest = await req.json();
      
      const { data: recentDeals } = await supabase
        .from('deals')
        .select('amount, stage')
        .eq('organization_id', membership.organization_id)
        .eq('stage', 'won')
        .order('created_at', { ascending: false })
        .limit(50);

      const avgWonDealAmount = recentDeals && recentDeals.length > 0
        ? recentDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) / recentDeals.length
        : 1000;

      let recommendedPrice = avgWonDealAmount;

      if (body.customerSegment === 'enterprise') {
        recommendedPrice *= 1.5;
      } else if (body.customerSegment === 'smb') {
        recommendedPrice *= 0.8;
      }

      if (body.competitorPricing) {
        recommendedPrice = Math.min(recommendedPrice, body.competitorPricing * 0.95);
      }

      const pricingTiers = [
        {
          tier: 'economy',
          price: Math.round(recommendedPrice * 0.7 * 100) / 100,
          features: ['Basic features', 'Email support'],
        },
        {
          tier: 'standard',
          price: Math.round(recommendedPrice * 100) / 100,
          features: ['All basic features', 'Priority support', 'Advanced analytics'],
        },
        {
          tier: 'premium',
          price: Math.round(recommendedPrice * 1.5 * 100) / 100,
          features: ['All features', '24/7 support', 'Custom integrations', 'Dedicated account manager'],
        },
      ];

      return new Response(
        JSON.stringify({
          success: true,
          recommended_price: recommendedPrice,
          pricing_tiers: pricingTiers,
          market_insights: {
            avg_deal_size: avgWonDealAmount,
            sample_size: recentDeals?.length || 0,
            competitor_position: body.competitorPricing 
              ? (recommendedPrice < body.competitorPricing ? 'below' : 'above')
              : 'unknown',
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'list-quotes' && req.method === 'GET') {
      const status = url.searchParams.get('status');
      
      let query = supabase
        .from('quotations')
        .select('*, contacts(first_name, last_name, email)')
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: quotations, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, quotations }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'accept-quote' && req.method === 'POST') {
      const { quoteId } = await req.json();
      
      const { data: quotation, error } = await supabase
        .from('quotations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .eq('organization_id', membership.organization_id)
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('revenue_events')
        .insert({
          organization_id: membership.organization_id,
          event_type: 'quote_accepted',
          amount: quotation.total,
          currency: quotation.currency,
          source_type: 'quotation',
          source_id: quotation.id,
          conversation_id: quotation.conversation_id,
        });

      return new Response(
        JSON.stringify({ success: true, quotation }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Smart pricing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});