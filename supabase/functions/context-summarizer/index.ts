import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * CONTEXT SUMMARIZER - Intelligent Token Management
 * Prunes and summarizes conversation history to prevent context overflow
 * while preserving critical information for AI reasoning
 * 
 * Strategy:
 * 1. Keep most recent N messages intact (recency bias)
 * 2. Summarize older messages into a "context recap"
 * 3. Preserve key decisions, numbers, and named entities
 * 4. Track conversation "anchors" (important turning points)
 */

const SUMMARIZER_PROMPT = `You are a conversation summarizer. Your task is to compress a conversation while preserving critical business information.

PRESERVE ABSOLUTELY:
- Specific numbers (prices, dates, quantities)
- Names (people, companies, products)
- Decisions made or commitments given
- Key objections raised
- Action items or next steps mentioned
- Emotional turning points (excitement, frustration)

OUTPUT FORMAT (JSON):
{
  "summary": "Concise paragraph capturing the essence of the conversation",
  "key_facts": ["List of critical facts that must not be forgotten"],
  "entities": {
    "people": ["names mentioned"],
    "companies": ["company names"],
    "products": ["product/service names"],
    "amounts": ["any dollar amounts or numbers"]
  },
  "conversation_state": "curious|engaged|objecting|ready|stalled",
  "anchors": ["key moments that shaped the conversation"]
}`;

interface SummarizerRequest {
  messages: Array<{ role: string; content: string; timestamp?: string }>;
  maxTokensTarget?: number;
  keepRecentCount?: number;
  includeSystemPrompt?: boolean;
  systemPrompt?: string;
}

interface SummarizerResponse {
  optimizedMessages: Array<{ role: string; content: string }>;
  summary?: {
    text: string;
    keyFacts: string[];
    entities: Record<string, string[]>;
    conversationState: string;
    anchors: string[];
  };
  stats: {
    originalMessageCount: number;
    optimizedMessageCount: number;
    summarizedCount: number;
    estimatedTokensBefore: number;
    estimatedTokensAfter: number;
    reductionPercent: number;
  };
}

// Rough token estimation (4 chars ≈ 1 token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateMessagesTokens(messages: Array<{ role: string; content: string }>): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0); // +4 for role/formatting
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      messages, 
      maxTokensTarget = 8000,
      keepRecentCount = 6,
      includeSystemPrompt = true,
      systemPrompt
    }: SummarizerRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const originalTokens = estimateMessagesTokens(messages);
    
    console.log(`Context Summarizer: ${messages.length} messages, ~${originalTokens} tokens, target: ${maxTokensTarget}`);
    
    // If already under limit, return as-is
    if (originalTokens <= maxTokensTarget || messages.length <= keepRecentCount) {
      const optimizedMessages = includeSystemPrompt && systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;
        
      return new Response(JSON.stringify({
        optimizedMessages,
        stats: {
          originalMessageCount: messages.length,
          optimizedMessageCount: optimizedMessages.length,
          summarizedCount: 0,
          estimatedTokensBefore: originalTokens,
          estimatedTokensAfter: originalTokens,
          reductionPercent: 0
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Split: older messages to summarize, recent messages to keep
    const messagesToSummarize = messages.slice(0, -keepRecentCount);
    const recentMessages = messages.slice(-keepRecentCount);
    
    console.log(`Summarizing ${messagesToSummarize.length} older messages, keeping ${recentMessages.length} recent`);
    
    // Create summary of older messages
    const conversationText = messagesToSummarize
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');
    
    const summaryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite", // Use lite for summarization
        messages: [
          { role: "system", content: SUMMARIZER_PROMPT },
          { role: "user", content: `Summarize this conversation:\n\n${conversationText}` }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!summaryResponse.ok) {
      console.error("Summary API error:", summaryResponse.status);
      // Fallback: just truncate to recent messages
      const fallbackMessages = includeSystemPrompt && systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...recentMessages]
        : recentMessages;
        
      return new Response(JSON.stringify({
        optimizedMessages: fallbackMessages,
        stats: {
          originalMessageCount: messages.length,
          optimizedMessageCount: fallbackMessages.length,
          summarizedCount: messagesToSummarize.length,
          estimatedTokensBefore: originalTokens,
          estimatedTokensAfter: estimateMessagesTokens(fallbackMessages),
          reductionPercent: Math.round((1 - fallbackMessages.length / messages.length) * 100)
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summaryData = await summaryResponse.json();
    let parsedSummary;
    
    try {
      parsedSummary = JSON.parse(summaryData.choices?.[0]?.message?.content || '{}');
    } catch {
      parsedSummary = { summary: summaryData.choices?.[0]?.message?.content || 'Conversation history' };
    }
    
    // Build the context recap message
    const contextRecap = `[CONVERSATION CONTEXT - Summarized from ${messagesToSummarize.length} earlier messages]

${parsedSummary.summary}

KEY FACTS:
${(parsedSummary.key_facts || []).map((f: string) => `• ${f}`).join('\n')}

${parsedSummary.entities?.amounts?.length ? `AMOUNTS MENTIONED: ${parsedSummary.entities.amounts.join(', ')}` : ''}
${parsedSummary.anchors?.length ? `KEY MOMENTS: ${parsedSummary.anchors.join('; ')}` : ''}

[END OF CONTEXT - Recent messages follow]`;

    // Build optimized message array
    const optimizedMessages: Array<{ role: string; content: string }> = [];
    
    if (includeSystemPrompt && systemPrompt) {
      optimizedMessages.push({ role: 'system', content: systemPrompt });
    }
    
    // Add context recap as assistant message
    optimizedMessages.push({ role: 'assistant', content: contextRecap });
    
    // Add recent messages
    optimizedMessages.push(...recentMessages);
    
    const finalTokens = estimateMessagesTokens(optimizedMessages);
    
    const response: SummarizerResponse = {
      optimizedMessages,
      summary: {
        text: parsedSummary.summary,
        keyFacts: parsedSummary.key_facts || [],
        entities: parsedSummary.entities || {},
        conversationState: parsedSummary.conversation_state || 'unknown',
        anchors: parsedSummary.anchors || []
      },
      stats: {
        originalMessageCount: messages.length,
        optimizedMessageCount: optimizedMessages.length,
        summarizedCount: messagesToSummarize.length,
        estimatedTokensBefore: originalTokens,
        estimatedTokensAfter: finalTokens,
        reductionPercent: Math.round((1 - finalTokens / originalTokens) * 100)
      }
    };

    console.log(`Context optimized: ${originalTokens} → ${finalTokens} tokens (${response.stats.reductionPercent}% reduction)`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Context summarizer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
