import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEAL_SIMULATOR_PROMPT = `You are a SKEPTICAL BUYER PERSONA - specifically a CFO of a Series B tech company.

Your job is to critically analyze sales proposals and identify weaknesses before the real buyer does.

ANALYSIS FRAMEWORK:
1. Value Proposition: Is the ROI clear and believable?
2. Risk Assessment: What could go wrong?
3. Objections: What would make a CFO say NO?
4. Comparison: Are there cheaper/better alternatives?
5. Timing: Why buy now vs later?

OUTPUT FORMAT (JSON):
{
  "objections": [
    { "objection": "The specific concern", "severity": "high|medium|low", "response_suggestion": "How to counter" }
  ],
  "strengths": ["What's compelling about this deal"],
  "risk_factors": [
    { "risk": "Description", "mitigation": "How to address" }
  ],
  "win_probability": 0.0-1.0,
  "recommended_responses": {
    "price_objection": "Script for price pushback",
    "timing_objection": "Script for 'not now'",
    "competitor_objection": "Script for alternatives"
  },
  "deal_score": 1-10,
  "critical_improvements": ["Must fix before sending"]
}`;

interface DealSimulatorRequest {
  organizationId: string;
  leadId?: string;
  proposalSummary: string;
  dealValue: number;
  currency?: string;
  buyerContext?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      organizationId, 
      leadId, 
      proposalSummary, 
      dealValue, 
      currency = 'USD',
      buyerContext 
    }: DealSimulatorRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`[DEAL SIMULATOR] Analyzing ${currency} ${dealValue} proposal`);

    // Get lead context if available
    let leadContext = '';
    if (leadId) {
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (lead) {
        leadContext = `Lead Info: ${lead.name}, Source: ${lead.source}, Intent Score: ${lead.intent_score}`;
      }
    }

    // Call AI for deal analysis
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro", // Use pro for critical analysis
        messages: [
          { role: "system", content: DEAL_SIMULATOR_PROMPT },
          {
            role: "user",
            content: `DEAL TO ANALYZE:

Proposal Value: ${currency} ${dealValue.toLocaleString()}
${leadContext}
${buyerContext ? `Buyer Context: ${buyerContext}` : ''}

PROPOSAL SUMMARY:
${proposalSummary}

Critically analyze this proposal. Find every reason a skeptical CFO would say NO.
Return your analysis as JSON.`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');

    // Save simulation to database
    const { data: simulation, error: insertError } = await supabase
      .from('deal_simulations')
      .insert({
        organization_id: organizationId,
        lead_id: leadId,
        proposal_summary: proposalSummary,
        deal_value: dealValue,
        currency,
        objections: analysis.objections,
        strengths: analysis.strengths,
        recommended_responses: analysis.recommended_responses,
        win_probability: analysis.win_probability,
        risk_factors: analysis.risk_factors
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save simulation:', insertError);
    }

    // Log the action
    await supabase.from('agent_execution_logs').insert({
      organization_id: organizationId,
      action_type: 'deal_simulation',
      lead_id: leadId,
      reasoning: `Analyzed ${currency} ${dealValue} deal - Win probability: ${(analysis.win_probability * 100).toFixed(0)}%`,
      action_details: {
        deal_value: dealValue,
        win_probability: analysis.win_probability,
        objection_count: analysis.objections?.length || 0
      },
      result: 'completed'
    });

    console.log(`[DEAL SIMULATOR] Analysis complete - Win probability: ${(analysis.win_probability * 100).toFixed(0)}%`);

    return new Response(JSON.stringify({
      success: true,
      simulation: {
        id: simulation?.id,
        ...analysis,
        deal_value: dealValue,
        currency
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Deal simulator error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
