import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLOSER_PROMPT = `ACT AS: High-Ticket Conversion Specialist.
CONTEXT: You are managing a DM conversation inside GoHighLevel.

DIRECTIVES:
1. INTENT DETECTION: Analyze the lead's messages to determine if they are:
   - 'Curious' (Just exploring, no urgency)
   - 'Skeptical' (Has objections or doubts)
   - 'Ready' (Showing buying signals)
   - 'Warm' (Friendly but not actively buying)
   - 'Cold' (Unengaged or negative)

2. THE 'GAP' METHOD: Ask calibrated questions to identify the gap between where their business is and where they want to be:
   - "What's currently stopping you from [achieving their goal]?"
   - "Where do you see your business in 6 months if this problem persists?"

3. OBJECTION PRE-EMPTION: 
   - If they mention 'Time' → "Our system is fully autonomous - it works while you sleep"
   - If they mention 'Price' → Pivot to downsell asset
   - If they mention 'Trust' → Offer social proof or trial
   - If they mention 'Need to think' → Create scarcity with value

4. CLOSING: Once the gap is identified and intent is 'Ready':
   - High-ticket (>$1000): Offer booking link for call
   - Mid-ticket ($200-$1000): Direct payment link
   - Low-ticket (<$200): Immediate checkout link

RULE: Never use more than 3 sentences per message. Use mobile-friendly formatting.

OUTPUT FORMAT (JSON):
{
  "intent": "curious|skeptical|ready|warm|cold",
  "intent_score": 0-100,
  "recommended_action": "continue_nurturing|ask_gap_question|handle_objection|offer_booking|offer_payment|downsell|disengage",
  "response": "Your response message here (max 3 sentences)",
  "cta_type": "none|booking_link|payment_link|resource_link",
  "internal_notes": "Brief reasoning for this approach",
  "next_followup": "suggested timing for next message if no response"
}`;

interface CloserRequest {
  conversationHistory: Array<{ role: string; content: string }>;
  leadData: {
    id: string;
    name?: string;
    source?: string;
    qualification_data?: any;
    intent_score?: number;
  };
  productInfo: {
    highTicket: { name: string; price: number; bookingLink?: string };
    midTicket?: { name: string; price: number; paymentLink?: string };
    downsell: { name: string; price: number; paymentLink?: string };
  };
  organizationId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationHistory, leadData, productInfo, organizationId }: CloserRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch successful sales patterns from memory
    const { data: successPatterns } = await supabase
      .from('memory_items')
      .select('content')
      .eq('organization_id', organizationId)
      .eq('type', 'sales_pattern')
      .limit(5);

    // Build context with RAG
    const ragContext = successPatterns?.map(p => p.content).join('\n') || '';

    const systemPrompt = `${CLOSER_PROMPT}

SUCCESSFUL SALES PATTERNS FROM HISTORY:
${ragContext || 'No historical patterns available yet.'}

PRODUCT INFO:
- High-Ticket: ${productInfo.highTicket.name} at $${productInfo.highTicket.price}
- Downsell: ${productInfo.downsell.name} at $${productInfo.downsell.price}
${productInfo.midTicket ? `- Mid-Ticket: ${productInfo.midTicket.name} at $${productInfo.midTicket.price}` : ''}

LEAD DATA:
- Name: ${leadData.name || 'Unknown'}
- Source: ${leadData.source || 'Unknown'}
- Current Intent Score: ${leadData.intent_score || 'Not scored'}`;

    // Build conversation messages for routing
    const conversationMessages = conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // Determine deal value for model routing
    const dealValue = productInfo.highTicket.price;
    const isHighValue = dealValue > 5000;

    // Use Model Router for cost-efficient model selection
    const routerResponse = await fetch(`${SUPABASE_URL}/functions/v1/model-router`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        messages: conversationMessages,
        systemPrompt,
        responseFormat: { type: "json_object" },
        metadata: {
          dealValue,
          isHighStakes: isHighValue,
          requiresReasoning: true
        }
      }),
    });

    if (!routerResponse.ok) {
      if (routerResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Model Router error: ${routerResponse.status}`);
    }

    const routerData = await routerResponse.json();
    console.log(`Closer Agent using: ${routerData.routing.selectedTier} model for $${dealValue} deal`);
    
    const aiData = routerData.result;
    const closerOutput = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');

    // Now run through Reflexion Engine for quality control
    const reflexionResponse = await fetch(`${SUPABASE_URL}/functions/v1/reflexion-engine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        originalOutput: closerOutput.response,
        context: {
          agentType: 'closer',
          brandVoice: 'Professional Maverick',
          leadData,
          validPrices: [
            productInfo.highTicket.price,
            productInfo.midTicket?.price,
            productInfo.downsell.price
          ].filter(Boolean),
        },
        maxIterations: 2
      }),
    });

    let finalResponse = closerOutput.response;
    let reflexionData = null;

    if (reflexionResponse.ok) {
      reflexionData = await reflexionResponse.json();
      finalResponse = reflexionData.finalOutput;
    }

    // Log the agent action
    await supabase.from('agent_execution_logs').insert({
      organization_id: organizationId,
      lead_id: leadData.id,
      action_type: 'closer',
      reasoning: closerOutput.internal_notes,
      action_details: {
        intent: closerOutput.intent,
        intent_score: closerOutput.intent_score,
        recommended_action: closerOutput.recommended_action,
        cta_type: closerOutput.cta_type,
        reflexion: reflexionData ? {
          iterations: reflexionData.iterations,
          improvement: reflexionData.improvement
        } : null
      },
      result: 'generated'
    });

    // Update lead intent score
    if (closerOutput.intent_score) {
      await supabase
        .from('leads')
        .update({ 
          intent_score: closerOutput.intent_score,
          last_interaction_at: new Date().toISOString()
        })
        .eq('id', leadData.id);
    }

    return new Response(JSON.stringify({
      ...closerOutput,
      response: finalResponse,
      reflexion: reflexionData ? {
        improved: reflexionData.improvement > 0,
        iterations: reflexionData.iterations,
        improvement: reflexionData.improvement
      } : null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Closer agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
