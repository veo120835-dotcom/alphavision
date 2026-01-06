import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * MODEL ROUTER - Intelligent Cost Optimization
 * Routes tasks to the most cost-effective model based on complexity analysis
 * 
 * Tiers:
 * - LITE (gemini-2.5-flash-lite): Simple classification, yes/no, short responses
 * - STANDARD (gemini-2.5-flash): Most tasks, balanced speed/quality
 * - PRO (gemini-2.5-pro): Complex reasoning, multi-step analysis, critical decisions
 */

const MODEL_TIERS = {
  lite: {
    model: 'google/gemini-2.5-flash-lite',
    costMultiplier: 0.25,
    maxTokens: 1000,
    description: 'Fast & cheap - classification, simple Q&A'
  },
  standard: {
    model: 'google/gemini-2.5-flash',
    costMultiplier: 1.0,
    maxTokens: 4000,
    description: 'Balanced - most general tasks'
  },
  pro: {
    model: 'google/gemini-2.5-pro',
    costMultiplier: 4.0,
    maxTokens: 8000,
    description: 'Premium - complex reasoning, high-stakes'
  }
};

// Tool-based complexity mappings (SIMPLE tools → LITE model, COMPLEX tools → PRO model)
const TOOL_COMPLEXITY = {
  simple: [
    'search_web', 'format_date', 'fetch_price', 'extract_data',
    'list_items', 'check_status', 'validate_input', 'lookup_record',
    'get_weather', 'fetch_stock', 'parse_json', 'format_currency'
  ],
  complex: [
    'generate_strategy', 'analyze_contract', 'architect_solution',
    'critique_content', 'evaluate_risk', 'negotiate_deal',
    'create_campaign', 'optimize_funnel', 'close_deal',
    'write_proposal', 'design_system', 'plan_roadmap'
  ]
};

// Task complexity indicators (keyword-based)
const COMPLEXITY_INDICATORS = {
  simple: [
    'classify', 'categorize', 'yes or no', 'true or false',
    'choose one', 'select', 'pick', 'is this', 'does this',
    'sentiment', 'positive or negative', 'spam', 'not spam'
  ],
  complex: [
    'analyze', 'strategy', 'plan', 'explain why', 'compare and contrast',
    'pros and cons', 'evaluate', 'recommend', 'optimize', 'refactor',
    'multi-step', 'reasoning', 'decision', 'calculate', 'predict',
    'synthesize', 'critique', 'design', 'architect'
  ],
  critical: [
    'financial', 'legal', 'high-value', 'closing', '$5000', '$10000',
    'contract', 'commitment', 'irreversible', 'critical', 'urgent',
    'executive', 'board', 'investor'
  ]
};

interface RouterRequest {
  messages: Array<{ role: string; content: string }>;
  taskType?: 'classification' | 'generation' | 'analysis' | 'conversation' | 'auto';
  forceModel?: 'lite' | 'standard' | 'pro';
  toolName?: string; // NEW: Tool-based routing
  systemPrompt?: string;
  responseFormat?: { type: string };
  metadata?: {
    dealValue?: number;
    isHighStakes?: boolean;
    requiresReasoning?: boolean;
  };
}

interface RouterResponse {
  result: any;
  routing: {
    selectedTier: 'lite' | 'standard' | 'pro';
    model: string;
    reason: string;
    complexityScore: number;
    estimatedCostSaving: string;
  };
}

function analyzeComplexity(
  messages: Array<{ role: string; content: string }>, 
  metadata?: RouterRequest['metadata'],
  toolName?: string
): {
  tier: 'lite' | 'standard' | 'pro';
  score: number;
  reason: string;
} {
  const fullText = messages.map(m => m.content).join(' ').toLowerCase();
  const wordCount = fullText.split(/\s+/).length;
  
  let score = 50; // Start neutral
  const reasons: string[] = [];
  
  // PRIORITY 1: Tool-based routing (if tool is specified, it takes precedence)
  if (toolName) {
    if (TOOL_COMPLEXITY.simple.includes(toolName)) {
      return {
        tier: 'lite',
        score: 20,
        reason: `Tool "${toolName}" classified as simple execution`
      };
    }
    if (TOOL_COMPLEXITY.complex.includes(toolName)) {
      return {
        tier: 'pro',
        score: 90,
        reason: `Tool "${toolName}" requires complex reasoning`
      };
    }
    reasons.push(`Tool "${toolName}" (unclassified)`);
  }
  
  // Check for simple indicators
  const simpleMatches = COMPLEXITY_INDICATORS.simple.filter(ind => fullText.includes(ind));
  if (simpleMatches.length > 0) {
    score -= simpleMatches.length * 15;
    reasons.push(`Simple task patterns: ${simpleMatches.slice(0, 3).join(', ')}`);
  }
  
  // Check for complex indicators
  const complexMatches = COMPLEXITY_INDICATORS.complex.filter(ind => fullText.includes(ind));
  if (complexMatches.length > 0) {
    score += complexMatches.length * 10;
    reasons.push(`Complex task patterns: ${complexMatches.slice(0, 3).join(', ')}`);
  }
  
  // Check for critical indicators
  const criticalMatches = COMPLEXITY_INDICATORS.critical.filter(ind => fullText.includes(ind));
  if (criticalMatches.length > 0) {
    score += 40;
    reasons.push(`High-stakes context detected`);
  }
  
  // Message length consideration
  if (wordCount < 50) {
    score -= 10;
    reasons.push('Short message');
  } else if (wordCount > 500) {
    score += 15;
    reasons.push('Long context');
  }
  
  // Conversation depth
  if (messages.length > 6) {
    score += 10;
    reasons.push('Deep conversation');
  }
  
  // Metadata overrides
  if (metadata?.isHighStakes) {
    score = Math.max(score, 85);
    reasons.push('Marked as high-stakes');
  }
  if (metadata?.dealValue && metadata.dealValue > 5000) {
    score = Math.max(score, 90);
    reasons.push(`High deal value: $${metadata.dealValue}`);
  }
  if (metadata?.requiresReasoning) {
    score = Math.max(score, 70);
    reasons.push('Requires reasoning');
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  // Determine tier
  let tier: 'lite' | 'standard' | 'pro';
  if (score < 35) {
    tier = 'lite';
  } else if (score < 75) {
    tier = 'standard';
  } else {
    tier = 'pro';
  }
  
  return {
    tier,
    score,
    reason: reasons.join('; ') || 'Default routing'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      messages, 
      taskType = 'auto',
      forceModel,
      toolName,
      systemPrompt,
      responseFormat,
      metadata 
    }: RouterRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determine routing
    let selectedTier: 'lite' | 'standard' | 'pro';
    let routingReason: string;
    let complexityScore: number;
    
    if (forceModel) {
      selectedTier = forceModel;
      routingReason = 'Forced by request';
      complexityScore = forceModel === 'lite' ? 20 : forceModel === 'standard' ? 50 : 85;
    } else if (taskType === 'classification') {
      selectedTier = 'lite';
      routingReason = 'Classification task → Lite model';
      complexityScore = 25;
    } else {
      // Pass toolName for tool-based routing
      const analysis = analyzeComplexity(messages, metadata, toolName);
      selectedTier = analysis.tier;
      routingReason = analysis.reason;
      complexityScore = analysis.score;
    }
    
    const modelConfig = MODEL_TIERS[selectedTier];
    
    console.log(`Model Router: ${selectedTier} (${modelConfig.model}) - Score: ${complexityScore} - ${routingReason}`);
    
    // Build request
    const requestMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;
    
    const requestBody: any = {
      model: modelConfig.model,
      messages: requestMessages,
    };
    
    if (responseFormat) {
      requestBody.response_format = responseFormat;
    }
    
    // Call the selected model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limited",
          routing: { selectedTier, model: modelConfig.model }
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Model API error:", response.status, errorText);
      throw new Error(`Model API error: ${response.status}`);
    }

    const aiData = await response.json();
    
    // Calculate cost savings estimate
    const standardCost = MODEL_TIERS.standard.costMultiplier;
    const actualCost = modelConfig.costMultiplier;
    const savingPercent = ((standardCost - actualCost) / standardCost * 100).toFixed(0);
    const estimatedCostSaving = actualCost < standardCost 
      ? `~${Math.abs(Number(savingPercent))}% cheaper than standard`
      : actualCost > standardCost 
        ? `${savingPercent}% premium for quality`
        : 'Standard pricing';

    const routerResponse: RouterResponse = {
      result: aiData,
      routing: {
        selectedTier,
        model: modelConfig.model,
        reason: routingReason,
        complexityScore,
        estimatedCostSaving
      }
    };

    return new Response(JSON.stringify(routerResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Model router error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
