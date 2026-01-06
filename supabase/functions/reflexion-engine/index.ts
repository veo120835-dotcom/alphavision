import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REFLEXION_CRITIC_PROMPT = `ACT AS: Senior Lead Quality Controller.
TASK: Critique the provided output from the 'Creator' or 'Closer' agent.

CRITIQUE CRITERIA:
1. LOGIC: Does the response directly solve the user's specific pain point mentioned in the context?
2. CONVERSION: Is there a clear, low-friction Call to Action (CTA)?
3. HALLUCINATION: Does the output mention any features or prices not in our current database?
4. TONE: Is the response too 'bot-like'? If so, simplify the language to a 7th-grade reading level.
5. BRAND VOICE: Does it match the 'Professional Maverick' tone?
6. LENGTH: Is it mobile-friendly (under 3 sentences for DMs)?

OUTPUT FORMAT (JSON):
{
  "verdict": "PASS" | "FAIL",
  "score": 0-100,
  "issues": [
    { "category": "LOGIC|CONVERSION|HALLUCINATION|TONE|BRAND|LENGTH", "description": "...", "severity": "LOW|MEDIUM|HIGH" }
  ],
  "suggestions": ["..."],
  "fixed_output": "The improved version if FAIL, or null if PASS",
  "reasoning": "Explain why changes were made or why it passed"
}`;

const OPTIMIZER_PROMPT = `ACT AS: Response Optimizer Agent.
TASK: Take the critic's feedback and the original output, then produce a perfected version.

OPTIMIZATION RULES:
1. Address ALL issues identified by the critic
2. Maintain the core message and intent
3. Ensure mobile-friendly formatting (short sentences, line breaks)
4. Include exactly one clear CTA
5. Use power words that create urgency without being pushy
6. Read at a 7th-grade level maximum

OUTPUT: Return ONLY the optimized message text, nothing else.`;

interface ReflexionRequest {
  originalOutput: string;
  context: {
    leadData?: any;
    brandVoice?: string;
    validPrices?: number[];
    validFeatures?: string[];
    agentType: 'creator' | 'closer' | 'socialite';
  };
  maxIterations?: number;
}

interface ReflexionResult {
  finalOutput: string;
  iterations: number;
  passedOnIteration: number | null;
  critiques: Array<{
    iteration: number;
    verdict: string;
    score: number;
    issues: any[];
  }>;
  improvement: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalOutput, context, maxIterations = 3 }: ReflexionRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const critiques: ReflexionResult['critiques'] = [];
    let currentOutput = originalOutput;
    let passedOnIteration: number | null = null;
    let initialScore = 0;

    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      console.log(`Reflexion iteration ${iteration}/${maxIterations}`);

      // Step 1: Run the Critic
      const criticResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: REFLEXION_CRITIC_PROMPT },
            { 
              role: "user", 
              content: `AGENT TYPE: ${context.agentType}
BRAND VOICE: ${context.brandVoice || 'Professional Maverick'}
VALID FEATURES: ${context.validFeatures?.join(', ') || 'Not specified'}
VALID PRICES: ${context.validPrices?.join(', ') || 'Not specified'}
LEAD CONTEXT: ${JSON.stringify(context.leadData || {})}

OUTPUT TO CRITIQUE:
"""
${currentOutput}
"""` 
            }
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!criticResponse.ok) {
        throw new Error(`Critic API error: ${criticResponse.status}`);
      }

      const criticData = await criticResponse.json();
      const criticContent = criticData.choices?.[0]?.message?.content;
      
      let critique;
      try {
        critique = JSON.parse(criticContent);
      } catch {
        console.error("Failed to parse critic response:", criticContent);
        critique = { verdict: "PASS", score: 75, issues: [], reasoning: "Parse error, defaulting to pass" };
      }

      if (iteration === 1) {
        initialScore = critique.score;
      }

      critiques.push({
        iteration,
        verdict: critique.verdict,
        score: critique.score,
        issues: critique.issues || []
      });

      console.log(`Iteration ${iteration} critique:`, critique.verdict, critique.score);

      // If passed with 95%+ quality, we're done
      if (critique.verdict === "PASS" && critique.score >= 95) {
        passedOnIteration = iteration;
        break;
      }

      // If critic already fixed it, use that
      if (critique.fixed_output && critique.verdict === "FAIL") {
        currentOutput = critique.fixed_output;
      } else if (critique.verdict === "FAIL" && iteration < maxIterations) {
        // Step 2: Run the Optimizer
        const optimizerResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: OPTIMIZER_PROMPT },
              { 
                role: "user", 
                content: `ORIGINAL OUTPUT:
"""
${currentOutput}
"""

CRITIC FEEDBACK:
- Score: ${critique.score}/100
- Issues: ${JSON.stringify(critique.issues)}
- Suggestions: ${JSON.stringify(critique.suggestions)}

Please provide the optimized version that addresses all issues.` 
              }
            ],
          }),
        });

        if (optimizerResponse.ok) {
          const optimizerData = await optimizerResponse.json();
          const optimizedContent = optimizerData.choices?.[0]?.message?.content;
          if (optimizedContent) {
            currentOutput = optimizedContent.trim();
          }
        }
      }
    }

    const result: ReflexionResult = {
      finalOutput: currentOutput,
      iterations: critiques.length,
      passedOnIteration,
      critiques,
      improvement: critiques[critiques.length - 1]?.score - initialScore
    };

    console.log("Reflexion complete:", result.iterations, "iterations, improvement:", result.improvement);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Reflexion engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
