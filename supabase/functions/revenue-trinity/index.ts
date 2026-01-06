import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RevenueAgentRequest {
  organizationId: string;
  agentType: 'upsell' | 'referral' | 'retention';
  trigger: {
    type: string;
    leadId?: string;
    customerId?: string;
    message?: string;
    eventData?: Record<string, unknown>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, agentType, trigger }: RevenueAgentRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch business configuration
    const { data: config, error: configError } = await supabase
      .from('business_config')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (configError || !config) {
      console.log('[REVENUE-TRINITY] No config found, using defaults');
    }

    // =========================
    // UPSELL AGENT
    // =========================
    if (agentType === 'upsell') {
      if (!config?.upsell_enabled) {
        return new Response(JSON.stringify({ 
          success: false, 
          reason: 'Upsell agent disabled' 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const UPSELL_PROMPT = `You are an expert upsell specialist. A customer just purchased the base product.

CONTEXT:
- Product: ${config?.product_name || 'Consulting Package'}
- Base Price: $${config?.base_price || 5000}
- Upsell: ${config?.upsell_name || 'Fast-Track Package'}
- Upsell Price: $${config?.upsell_price || 1000}
- Upsell Benefit: ${config?.upsell_pitch || 'Get results in half the time'}

TRIGGER: ${trigger.type}
${trigger.eventData ? `EVENT DATA: ${JSON.stringify(trigger.eventData)}` : ''}

YOUR TASK:
Generate a warm, non-pushy upsell message that:
1. Congratulates them on the purchase
2. Introduces the upsell as a "since you just signed up" opportunity
3. Highlights the key benefit
4. Offers a small discount for immediate action

OUTPUT FORMAT (JSON):
{
  "message": "The upsell message to send",
  "discount_offered": percentage or fixed amount,
  "urgency_type": "none|limited_time|limited_spots",
  "cta_text": "Button text for the upsell"
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
            { role: "system", content: UPSELL_PROMPT },
            { role: "user", content: "Generate the upsell message now." }
          ],
          response_format: { type: "json_object" }
        }),
      });

      const aiData = await aiResponse.json();
      const upsellOutput = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');

      // Log the action
      await supabase.from('agent_execution_logs').insert({
        organization_id: organizationId,
        lead_id: trigger.leadId,
        action_type: 'upsell_generated',
        reasoning: `Generated upsell for ${config?.upsell_name}`,
        action_details: {
          trigger: trigger.type,
          upsell_price: config?.upsell_price,
          output: upsellOutput
        },
        result: 'success'
      });

      return new Response(JSON.stringify({
        success: true,
        agent: 'upsell',
        ...upsellOutput,
        payment_link: config?.stripe_upsell_link
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================
    // REFERRAL AGENT
    // =========================
    if (agentType === 'referral') {
      if (!config?.referral_enabled) {
        return new Response(JSON.stringify({ 
          success: false, 
          reason: 'Referral agent disabled' 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const REFERRAL_PROMPT = `You are a referral specialist. A customer just expressed satisfaction or completed their project.

CONTEXT:
- Product: ${config?.product_name || 'Consulting Package'}
- Referral Bonus: $${config?.referral_bonus || 500} for the referrer
- Referral Discount: $${config?.referral_discount || 500} for the referred
- Base Pitch: ${config?.referral_pitch || 'Know someone who needs this?'}

TRIGGER: ${trigger.type}
${trigger.message ? `CUSTOMER MESSAGE: "${trigger.message}"` : ''}

YOUR TASK:
Generate a natural referral ask that:
1. Acknowledges their positive experience
2. Mentions the mutual benefit (bonus for them, discount for friend)
3. Makes it easy (just reply with an email)
4. Doesn't feel salesy

OUTPUT FORMAT (JSON):
{
  "message": "The referral ask message",
  "sentiment_detected": "positive|neutral|negative",
  "referral_likelihood": 0-100,
  "follow_up_timing": "When to follow up if no response"
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
            { role: "system", content: REFERRAL_PROMPT },
            { role: "user", content: "Generate the referral message now." }
          ],
          response_format: { type: "json_object" }
        }),
      });

      const aiData = await aiResponse.json();
      const referralOutput = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');

      await supabase.from('agent_execution_logs').insert({
        organization_id: organizationId,
        lead_id: trigger.leadId,
        action_type: 'referral_ask',
        reasoning: `Generated referral ask (likelihood: ${referralOutput.referral_likelihood}%)`,
        action_details: {
          trigger: trigger.type,
          sentiment: referralOutput.sentiment_detected,
          bonus: config?.referral_bonus
        },
        result: 'success'
      });

      return new Response(JSON.stringify({
        success: true,
        agent: 'referral',
        ...referralOutput
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================
    // RETENTION AGENT
    // =========================
    if (agentType === 'retention') {
      if (!config?.retention_enabled) {
        return new Response(JSON.stringify({ 
          success: false, 
          reason: 'Retention agent disabled' 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Detect cancellation intent
      const cancelKeywords = ['cancel', 'refund', 'pause', 'stop', 'unsubscribe', 'end'];
      const messageText = (trigger.message || '').toLowerCase();
      const hasCancelIntent = cancelKeywords.some(kw => messageText.includes(kw));

      const RETENTION_PROMPT = `You are a retention specialist. A customer has expressed cancellation intent.

CONTEXT:
- Product: ${config?.product_name || 'Consulting Package'}
- Save Offer Type: ${config?.save_offer_type || 'pause_billing'}
- Pause Duration: ${config?.save_offer_duration_days || 30} days
- Save Pitch: ${config?.save_offer_pitch || 'Let me pause your billing for a month'}

CUSTOMER MESSAGE: "${trigger.message || 'I want to cancel'}"

YOUR TASK:
1. Acknowledge their concern without being pushy
2. Identify the likely reason (price, time, not using, etc.)
3. Offer the save solution
4. Make it easy to accept

OUTPUT FORMAT (JSON):
{
  "message": "Your save attempt message",
  "detected_reason": "price|time|not_using|competitor|other",
  "save_offer_type": "pause|discount|downgrade|call",
  "save_likelihood": 0-100,
  "escalate_to_human": true/false
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
            { role: "system", content: RETENTION_PROMPT },
            { role: "user", content: "Generate the save message now." }
          ],
          response_format: { type: "json_object" }
        }),
      });

      const aiData = await aiResponse.json();
      const retentionOutput = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');

      await supabase.from('agent_execution_logs').insert({
        organization_id: organizationId,
        lead_id: trigger.leadId,
        action_type: 'retention_save',
        reasoning: `Save attempt: ${retentionOutput.detected_reason} (${retentionOutput.save_likelihood}% likely to save)`,
        action_details: {
          trigger: trigger.type,
          customer_message: trigger.message,
          detected_reason: retentionOutput.detected_reason,
          offer_type: retentionOutput.save_offer_type
        },
        result: 'save_attempt'
      });

      // If low save likelihood, create approval request
      if (retentionOutput.save_likelihood < 30 || retentionOutput.escalate_to_human) {
        await supabase.from('approval_requests').insert({
          organization_id: organizationId,
          lead_id: trigger.leadId,
          request_type: 'churn_risk',
          title: 'High Churn Risk - Manual Review Needed',
          description: `Customer reason: ${retentionOutput.detected_reason}. AI save likelihood: ${retentionOutput.save_likelihood}%`,
          agent_recommendation: retentionOutput.message,
          status: 'pending'
        });
      }

      return new Response(JSON.stringify({
        success: true,
        agent: 'retention',
        cancel_intent_detected: hasCancelIntent,
        ...retentionOutput
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid agent type' }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Revenue trinity error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});