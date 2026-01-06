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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, organization_id } = body;

    if (action === 'add_product') {
      const { product_name, my_price, my_cogs, min_margin_percent, competitor_url, competitor_selector } = body;

      const { data, error } = await supabase
        .from('pricing_intelligence')
        .insert({
          organization_id,
          product_name,
          my_price,
          my_cogs,
          min_margin_percent: min_margin_percent || 20,
          competitor_url,
          competitor_selector
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, product: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'scan_competitor_price') {
      const { product_id } = body;

      // Get product
      const { data: product, error } = await supabase
        .from('pricing_intelligence')
        .select('*')
        .eq('id', product_id)
        .single();

      if (error || !product) {
        throw new Error('Product not found');
      }

      if (!product.competitor_url) {
        return new Response(
          JSON.stringify({ success: false, error: 'No competitor URL configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch competitor page
      let competitorPrice: number | null = null;
      try {
        const response = await fetch(product.competitor_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (response.ok) {
          const html = await response.text();

          // Use AI to extract price
          const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
          const aiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `Extract the main product price from this webpage HTML.

Product we're looking for: ${product.product_name}
${product.competitor_selector ? `CSS selector hint: ${product.competitor_selector}` : ''}

HTML (first 8000 chars):
${html.substring(0, 8000)}

Return ONLY the numeric price (e.g., 199.99). If multiple prices, return the main/featured one.
If no price found, return "null".`
                  }]
                }],
                generationConfig: { temperature: 0.1 }
              })
            }
          );

          if (aiResponse.ok) {
            const result = await aiResponse.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const priceMatch = text.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
              competitorPrice = parseFloat(priceMatch[0].replace(',', ''));
            }
          }
        }
      } catch (fetchError) {
        console.error('Failed to fetch competitor page:', fetchError);
      }

      // Analyze and decide on action
      const previousPrice = product.competitor_price;
      const myPrice = product.my_price;
      const myCogs = product.my_cogs || 0;
      const minMarginPercent = product.min_margin_percent || 20;
      const minSafePrice = myCogs * (1 + minMarginPercent / 100);

      let priceAction = 'no_action';
      let recommendation = '';

      if (competitorPrice !== null) {
        if (competitorPrice < myPrice) {
          if (competitorPrice >= minSafePrice) {
            // Safe to match
            priceAction = 'match_price';
            recommendation = `Drop price to $${competitorPrice.toFixed(2)} to match competitor. Margin still safe at ${((competitorPrice - myCogs) / competitorPrice * 100).toFixed(1)}%.`;
          } else {
            // Unsafe to match
            priceAction = 'hold_price';
            recommendation = `Competitor at $${competitorPrice.toFixed(2)} is below your safe margin of $${minSafePrice.toFixed(2)}. Hold your price - they may be selling at a loss.`;
          }
        } else if (competitorPrice > myPrice) {
          priceAction = 'opportunity';
          recommendation = `You're $${(competitorPrice - myPrice).toFixed(2)} cheaper than competitor. Consider raising prices or emphasizing value.`;
        }

        // Create alert for significant changes
        if (previousPrice && Math.abs(competitorPrice - previousPrice) > previousPrice * 0.1) {
          await supabase.from('competitor_alerts').insert({
            organization_id: product.organization_id,
            alert_type: competitorPrice < previousPrice ? 'price_drop' : 'price_increase',
            severity: 'high',
            message: `${product.product_name}: Competitor price changed from $${previousPrice} to $${competitorPrice}`,
            recommendation
          });
        }

        // Update product
        await supabase
          .from('pricing_intelligence')
          .update({
            competitor_price: competitorPrice,
            price_action_taken: priceAction,
            last_checked: new Date().toISOString()
          })
          .eq('id', product_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          product_name: product.product_name,
          my_price: myPrice,
          competitor_price: competitorPrice,
          previous_competitor_price: previousPrice,
          min_safe_price: minSafePrice,
          action: priceAction,
          recommendation
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'scan_all') {
      // Scan all products for an org
      const { data: products, error } = await supabase
        .from('pricing_intelligence')
        .select('id')
        .eq('organization_id', organization_id);

      if (error) throw error;

      const results: any[] = [];
      for (const product of products || []) {
        try {
          const scanResponse = await fetch(req.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'scan_competitor_price',
              organization_id,
              product_id: product.id
            })
          });
          results.push(await scanResponse.json());
        } catch (e) {
          results.push({ product_id: product.id, error: 'Scan failed' });
        }
      }

      return new Response(
        JSON.stringify({ success: true, scanned: results.length, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_products') {
      const { data: products, error } = await supabase
        .from('pricing_intelligence')
        .select('*')
        .eq('organization_id', organization_id)
        .order('product_name');

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, products }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_my_price') {
      const { product_id, new_price } = body;

      await supabase
        .from('pricing_intelligence')
        .update({ my_price: new_price })
        .eq('id', product_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_price_history') {
      // This would require a separate history table for full implementation
      // For now, return current snapshot
      const { data: products, error } = await supabase
        .from('pricing_intelligence')
        .select('product_name, my_price, competitor_price, last_checked')
        .eq('organization_id', organization_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, history: products }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Price Surgeon Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
