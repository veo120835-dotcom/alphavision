/**
 * Client-Side Model Router
 * Routes tasks to appropriate AI models based on complexity analysis
 */

export const MODEL_TIERS = {
  // HIGH: For complex reasoning, planning, and critical analysis (The "Brain")
  HIGH_REASONING: "openai/gpt-5",
  
  // MID: Balanced (default)
  STANDARD: "google/gemini-2.5-flash",
  
  // LOW: For simple extraction, formatting, and keyword searches (The "Hands")
  FAST_EXECUTION: "google/gemini-2.5-flash-lite",
} as const;

export type ModelTier = keyof typeof MODEL_TIERS;
export type ComplexityLevel = 'SIMPLE' | 'STANDARD' | 'COMPLEX';

// Tool complexity mappings
const SIMPLE_TOOLS = [
  'search_web', 
  'format_date', 
  'fetch_price', 
  'extract_data',
  'list_items',
  'check_status',
  'validate_input'
];

const COMPLEX_TOOLS = [
  'generate_strategy', 
  'analyze_contract', 
  'architect_solution',
  'critique_content',
  'evaluate_risk',
  'negotiate_deal',
  'create_campaign',
  'optimize_funnel'
];

// Keyword-based complexity indicators
const COMPLEX_KEYWORDS = [
  'analyze', 'critique', 'plan', 'strategy', 'reasoning', 
  'implications', 'legal', 'negotiate', 'evaluate', 'architect',
  'optimize', 'comprehensive', 'detailed analysis', 'risk assessment'
];

const SIMPLE_KEYWORDS = [
  'extract', 'format', 'list', 'summary', 'check', 'find',
  'get', 'fetch', 'validate', 'count', 'search', 'lookup'
];

export class ModelRouter {
  /**
   * Analyzes the prompt and tool choice to determine optimal model
   */
  static route(prompt: string, toolName?: string): string {
    const complexity = this.assessComplexity(prompt, toolName);
    
    switch (complexity) {
      case 'COMPLEX':
        return MODEL_TIERS.HIGH_REASONING;
      case 'SIMPLE':
        return MODEL_TIERS.FAST_EXECUTION;
      default:
        return MODEL_TIERS.STANDARD;
    }
  }

  /**
   * Returns both model and complexity level for logging/debugging
   */
  static routeWithDetails(prompt: string, toolName?: string): { 
    model: string; 
    complexity: ComplexityLevel;
    reason: string;
  } {
    const complexity = this.assessComplexity(prompt, toolName);
    let reason = '';
    
    if (toolName) {
      if (SIMPLE_TOOLS.includes(toolName)) {
        reason = `Tool "${toolName}" is classified as simple execution`;
      } else if (COMPLEX_TOOLS.includes(toolName)) {
        reason = `Tool "${toolName}" requires complex reasoning`;
      }
    }
    
    if (!reason) {
      const matchedKeyword = this.findMatchingKeyword(prompt.toLowerCase());
      if (matchedKeyword) {
        reason = `Keyword "${matchedKeyword}" detected in prompt`;
      } else {
        reason = `Default routing based on prompt length (${prompt.length} chars)`;
      }
    }
    
    return {
      model: this.route(prompt, toolName),
      complexity,
      reason
    };
  }

  private static assessComplexity(prompt: string, toolName?: string): ComplexityLevel {
    const p = prompt.toLowerCase();

    // 1. Tool-Based Routing (Tools define complexity)
    if (toolName) {
      if (SIMPLE_TOOLS.includes(toolName)) return 'SIMPLE';
      if (COMPLEX_TOOLS.includes(toolName)) return 'COMPLEX';
    }

    // 2. Keyword Heuristics (Fallback if no tool is explicit)
    if (COMPLEX_KEYWORDS.some(kw => p.includes(kw))) return 'COMPLEX';
    if (SIMPLE_KEYWORDS.some(kw => p.includes(kw)) && p.length < 200) return 'SIMPLE';

    // 3. Length-based heuristic
    if (p.length > 1000) return 'COMPLEX'; // Long prompts usually need more reasoning
    if (p.length < 100) return 'SIMPLE';   // Short prompts are usually simple tasks

    return 'STANDARD';
  }

  private static findMatchingKeyword(prompt: string): string | null {
    for (const kw of COMPLEX_KEYWORDS) {
      if (prompt.includes(kw)) return kw;
    }
    for (const kw of SIMPLE_KEYWORDS) {
      if (prompt.includes(kw)) return kw;
    }
    return null;
  }

  /**
   * Get cost multiplier for the selected model
   */
  static getCostMultiplier(model: string): number {
    if (model === MODEL_TIERS.FAST_EXECUTION) return 0.25;
    if (model === MODEL_TIERS.STANDARD) return 1.0;
    if (model === MODEL_TIERS.HIGH_REASONING) return 3.0;
    return 1.0;
  }
}
