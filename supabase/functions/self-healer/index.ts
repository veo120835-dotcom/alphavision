import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DOCTOR_PROMPT = `You are the "Doctor" - a failure analysis specialist for an AI agent system.

Your job is to analyze agent failures and write PERMANENT rules that prevent the same failure from happening again.

ANALYSIS FRAMEWORK:
1. Root Cause: What exactly failed?
2. Pattern Recognition: Is this a common failure pattern?
3. Prevention Rule: What specific rule would prevent this?

RULE REQUIREMENTS:
- Be SPECIFIC and ACTIONABLE
- Apply to SIMILAR future tasks, not just this exact case
- Keep under 100 words
- Start with "When [condition], always [action]"

EXAMPLES:
- "When scraping LinkedIn, always use a 30-second timeout and rotate user agents"
- "When sending emails to new leads, always check spam score before sending"
- "When parsing dates, always normalize to ISO 8601 format first"`;

interface HealerRequest {
  organizationId: string;
  taskType: string;
  errorLog: string;
  lastPrompt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, taskType, errorLog, lastPrompt }: HealerRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`[🏥 DOCTOR] Analyzing failure for task: ${taskType}`);
    console.log(`[🏥 DOCTOR] Error: ${errorLog.substring(0, 200)}...`);

    // Check for existing similar rules to avoid duplicates
    const { data: existingRules } = await supabase
      .from('strategy_guide')
      .select('advice')
      .eq('organization_id', organizationId)
      .eq('task_type', taskType)
      .limit(5);

    const existingAdvice = existingRules?.map(r => r.advice).join('\n') || 'None';

    // Call Lovable AI for diagnosis
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro", // Use smartest model for diagnosis
        messages: [
          { role: "system", content: DOCTOR_PROMPT },
          {
            role: "user",
            content: `CRITICAL FAILURE ANALYSIS

Task Type: ${taskType}
Error Log: ${errorLog}
Last Action/Prompt: ${lastPrompt}

EXISTING RULES FOR THIS TASK (don't duplicate):
${existingAdvice}

Analyze this failure and generate a NEW prevention rule.
Return ONLY valid JSON: { "advice": "When X, always Y" }`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_healing_rule",
              description: "Create a prevention rule for this failure",
              parameters: {
                type: "object",
                properties: {
                  advice: {
                    type: "string",
                    description: "The prevention rule starting with 'When [condition], always [action]'"
                  },
                  confidence_score: {
                    type: "number",
                    description: "Confidence that this rule will prevent the failure (0.0 to 1.0)"
                  },
                  root_cause: {
                    type: "string",
                    description: "Brief description of what caused the failure"
                  }
                },
                required: ["advice", "confidence_score"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_healing_rule" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[🏥 DOCTOR] AI error:', errorText);
      throw new Error(`AI diagnosis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    // Extract the tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let healingRule;
    
    if (toolCall?.function?.arguments) {
      healingRule = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse content directly
      const content = aiData.choices?.[0]?.message?.content || '';
      healingRule = JSON.parse(content);
    }

    const advice = healingRule.advice || healingRule.rule || 'Check logs and retry with different parameters';
    const confidenceScore = healingRule.confidence_score || 0.8;

    // Save the new rule to the strategy_guide table
    const { error: insertError } = await supabase
      .from('strategy_guide')
      .insert({
        organization_id: organizationId,
        task_type: taskType,
        error_pattern: errorLog.substring(0, 500), // Truncate long errors
        advice: advice,
        confidence_score: confidenceScore
      });

    if (insertError) {
      console.error('[🏥 DOCTOR] Failed to save rule:', insertError);
      throw insertError;
    }

    // Log the healing action
    await supabase.from('agent_execution_logs').insert({
      organization_id: organizationId,
      action_type: 'self_healing',
      reasoning: `Failure in ${taskType}: ${errorLog.substring(0, 200)}`,
      action_details: {
        task_type: taskType,
        advice: advice,
        confidence: confidenceScore,
        root_cause: healingRule.root_cause
      },
      result: 'healed'
    });

    console.log(`[🏥 DOCTOR] System patched! New rule: "${advice}"`);

    return new Response(JSON.stringify({
      success: true,
      advice: advice,
      confidence_score: confidenceScore,
      root_cause: healingRule.root_cause
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[🏥 DOCTOR] Critical error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error",
      advice: "Manual review required"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
