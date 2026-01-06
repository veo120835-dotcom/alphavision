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

    const { action, organization_id, competitor_id } = await req.json();

    if (action === 'add_competitor') {
      const { competitor_name, website_url, pricing_page_url, pricing_selector } = await req.json();

      const { data, error } = await supabase
        .from('competitor_profiles')
        .insert({
          organization_id,
          competitor_name,
          website_url,
          pricing_page_url,
          pricing_selector
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, competitor: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'scan_competitor') {
      // Get competitor profile
      const { data: competitor, error } = await supabase
        .from('competitor_profiles')
        .select('*')
        .eq('id', competitor_id)
        .single();

      if (error || !competitor) {
        throw new Error('Competitor not found');
      }

      // Fetch competitor's pricing page
      let priceFound: number | null = null;
      let offersFound: any = {};

      if (competitor.pricing_page_url) {
        try {
          const response = await fetch(competitor.pricing_page_url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (response.ok) {
            const html = await response.text();
            
            // Use AI to extract pricing info
            const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
            const aiResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: `Extract pricing information from this webpage HTML.

HTML (first 5000 chars):
${html.substring(0, 5000)}

Return JSON with:
{
  "main_price": <number or null>,
  "currency": "USD" or other,
  "pricing_tiers": [{"name": "tier", "price": 0}],
  "current_promotions": ["any discounts or promos mentioned"],
  "key_features": ["main selling points"]
}

Return ONLY valid JSON.`
                    }]
                  }],
                  generationConfig: { temperature: 0.1 }
                })
              }
            );

            if (aiResponse.ok) {
              const result = await aiResponse.json();
              const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
              try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const pricing = JSON.parse(jsonMatch[0]);
                  priceFound = pricing.main_price;
                  offersFound = pricing;
                }
              } catch (e) {
                console.error('Failed to parse pricing:', e);
              }
            }
          }
        } catch (fetchError) {
          console.error('Failed to fetch competitor page:', fetchError);
        }
      }

      // Check for price changes and create alerts
      const previousPrice = competitor.current_price;
      if (priceFound && previousPrice && priceFound !== previousPrice) {
        const changePercent = ((priceFound - previousPrice) / previousPrice) * 100;
        
        await supabase.from('competitor_alerts').insert({
          organization_id: competitor.organization_id,
          competitor_id: competitor.id,
          alert_type: changePercent < 0 ? 'price_drop' : 'price_increase',
          severity: Math.abs(changePercent) > 20 ? 'high' : 'medium',
          message: `${competitor.competitor_name} ${changePercent < 0 ? 'dropped' : 'raised'} price by ${Math.abs(changePercent).toFixed(1)}% (from $${previousPrice} to $${priceFound})`,
          recommendation: changePercent < 0 
            ? 'Consider matching or highlighting your value proposition'
            : 'Opportunity to maintain competitive pricing advantage'
        });
      }

      // Check for new promos
      if (offersFound.current_promotions?.length > 0) {
        await supabase.from('competitor_alerts').insert({
          organization_id: competitor.organization_id,
          competitor_id: competitor.id,
          alert_type: 'new_promo',
          severity: 'medium',
          message: `${competitor.competitor_name} running promotions: ${offersFound.current_promotions.join(', ')}`,
          recommendation: 'Consider creating a counter-offer or highlighting unique value'
        });
      }

      // Update competitor profile
      await supabase
        .from('competitor_profiles')
        .update({
          current_price: priceFound,
          current_offers: offersFound,
          last_checked_at: new Date().toISOString()
        })
        .eq('id', competitor_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          price: priceFound,
          offers: offersFound,
          previous_price: previousPrice
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'scan_all') {
      // Scan all competitors for an org
      const { data: competitors, error } = await supabase
        .from('competitor_profiles')
        .select('id')
        .eq('organization_id', organization_id);

      if (error) throw error;

      const results: any[] = [];
      for (const comp of competitors || []) {
        // Recursive call to scan each competitor
        const scanResult = await fetch(req.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'scan_competitor',
            organization_id,
            competitor_id: comp.id
          })
        });
        results.push(await scanResult.json());
      }

      return new Response(
        JSON.stringify({ success: true, scanned: results.length, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_alerts') {
      const { data: alerts, error } = await supabase
        .from('competitor_alerts')
        .select('*, competitor_profiles(competitor_name)')
        .eq('organization_id', organization_id)
        .eq('acknowledged', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, alerts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'acknowledge_alert') {
      const { alert_id } = await req.json();

      await supabase
        .from('competitor_alerts')
        .update({ acknowledged: true })
        .eq('id', alert_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Mystery Shopper Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
