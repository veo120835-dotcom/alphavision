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
    const { organizationId } = await req.json();
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`💰 Pricing Enforcer running for org: ${organizationId}`);

    // Get business config
    const { data: bizConfig } = await supabase
      .from('business_config')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    // Get agent config
    const { data: agentConfig } = await supabase
      .from('autonomous_agent_config')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('agent_type', 'pricing_enforcer')
      .single();

    const basePrice = bizConfig?.base_price || 0;
    const riskTolerance = agentConfig?.risk_tolerance || 'balanced';
    const maxDiscountPercent = riskTolerance === 'conservative' ? 5 : riskTolerance === 'balanced' ? 10 : 15;

    const results = {
      violations_found: 0,
      opportunities_found: 0,
      actions: [] as any[],
      recommendations: [] as any[]
    };

    // 1. Analyze recent revenue for discount patterns
    const { data: revenueEvents } = await supabase
      .from('revenue_events')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (revenueEvents && basePrice > 0) {
      for (const event of revenueEvents) {
        const discountPercent = ((basePrice - event.amount) / basePrice) * 100;
        
        if (discountPercent > maxDiscountPercent) {
          results.violations_found++;
          results.actions.push({
            type: 'discount_violation',
            event_id: event.id,
            discount_given: discountPercent.toFixed(1),
            max_allowed: maxDiscountPercent,
            revenue_lost: basePrice - event.amount
          });

          await supabase.from('autonomous_actions').insert({
            organization_id: organizationId,
            agent_type: 'pricing_enforcer',
            action_type: 'discount_violation',
            target_entity_type: 'revenue_event',
            target_entity_id: event.id,
            decision: 'violation_flagged',
            reasoning: `Discount of ${discountPercent.toFixed(1)}% exceeds max ${maxDiscountPercent}%`,
            confidence_score: 95,
            value_impact: basePrice - event.amount,
            was_auto_executed: true,
            executed_at: new Date().toISOString()
          });
        }
      }
    }

    // 2. Analyze demand signals for pricing opportunities
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const highIntentLeads = leads?.filter(l => (l.intent_score || 0) > 75) || [];
    const conversionRate = revenueEvents?.length ? (revenueEvents.length / (leads?.length || 1)) * 100 : 0;

    // If high demand and high conversion, suggest price increase
    if (highIntentLeads.length >= 5 && conversionRate > 30 && LOVABLE_API_KEY) {
      // Use AI to analyze pricing opportunity
      const analysisPrompt = `Analyze this pricing data and recommend if a price increase is warranted:
      
Current base price: $${basePrice}
High-intent leads (last 7 days): ${highIntentLeads.length}
Conversion rate: ${conversionRate.toFixed(1)}%
Total leads: ${leads?.length || 0}
Revenue events: ${revenueEvents?.length || 0}

Provide a JSON response with:
{
  "recommend_increase": boolean,
  "suggested_increase_percent": number (0-20),
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "reasoning": "string",
  "risk_factors": ["string"]
}`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a pricing optimization AI. Analyze data and provide recommendations." },
            { role: "user", content: analysisPrompt }
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const recommendation = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');
        
        if (recommendation.recommend_increase) {
          results.opportunities_found++;
          results.recommendations.push(recommendation);

          await supabase.from('autonomous_actions').insert({
            organization_id: organizationId,
            agent_type: 'pricing_enforcer',
            action_type: 'pricing_opportunity',
            decision: 'recommend_increase',
            reasoning: recommendation.reasoning,
            confidence_score: recommendation.confidence === 'HIGH' ? 90 : recommendation.confidence === 'MEDIUM' ? 70 : 50,
            value_impact: basePrice * (recommendation.suggested_increase_percent / 100),
            requires_approval: true,
            was_auto_executed: false,
            execution_result: recommendation
          });
        }
      }
    }

    // 3. Check for consistent underpricing
    const avgTransactionValue = revenueEvents?.reduce((sum, e) => sum + e.amount, 0) / (revenueEvents?.length || 1);
    
    if (basePrice > 0 && avgTransactionValue < basePrice * 0.85) {
      results.recommendations.push({
        type: 'consistent_underpricing',
        avg_transaction: avgTransactionValue,
        base_price: basePrice,
        gap_percent: ((basePrice - avgTransactionValue) / basePrice * 100).toFixed(1),
        action: 'Review sales team discounting practices'
      });
    }

    // Log the run
    await supabase.from('agent_execution_logs').insert({
      organization_id: organizationId,
      action_type: 'pricing_enforcement',
      reasoning: `Found ${results.violations_found} violations, ${results.opportunities_found} opportunities`,
      action_details: results,
      result: 'completed'
    });

    return new Response(JSON.stringify({
      success: true,
      ...results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Pricing enforcer error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
