import { supabase } from "@/integrations/supabase/client";

interface HealingResult {
  success: boolean;
  advice: string;
  taskType: string;
  errorPattern: string;
}

interface StrategyGuide {
  id: string;
  task_type: string;
  advice: string;
  confidence_score: number;
  times_applied: number;
}

/**
 * The "Doctor" - Analyzes agent failures and creates permanent healing rules
 */
export async function healAgentFailure(
  organizationId: string,
  taskType: string,
  errorLog: string,
  lastPrompt: string
): Promise<HealingResult> {
  console.log(`[🏥 DOCTOR] Analyzing failure for task: ${taskType}`);
  
  try {
    // Call the healing edge function (uses Lovable AI for diagnosis)
    const { data, error } = await supabase.functions.invoke('self-healer', {
      body: {
        organizationId,
        taskType,
        errorLog,
        lastPrompt
      }
    });

    if (error) {
      console.error('[🏥 DOCTOR] Healing failed:', error);
      return {
        success: false,
        advice: 'Unable to generate healing advice',
        taskType,
        errorPattern: errorLog
      };
    }

    console.log(`[🏥 DOCTOR] System patched! New rule added: "${data.advice}"`);
    
    return {
      success: true,
      advice: data.advice,
      taskType,
      errorPattern: errorLog
    };
  } catch (e) {
    console.error('[🏥 DOCTOR] Critical error:', e);
    return {
      success: false,
      advice: 'Healing system encountered an error',
      taskType,
      errorPattern: errorLog
    };
  }
}

/**
 * Fetches strategy guides for a task type before execution
 * The "Patient" reads these before acting
 */
export async function getStrategyGuides(
  organizationId: string,
  taskType: string
): Promise<StrategyGuide[]> {
  const { data, error } = await supabase
    .from('strategy_guide')
    .select('id, task_type, advice, confidence_score, times_applied')
    .eq('organization_id', organizationId)
    .eq('task_type', taskType)
    .order('confidence_score', { ascending: false });

  if (error) {
    console.error('[📋 STRATEGY] Failed to fetch guides:', error);
    return [];
  }

  return (data || []) as StrategyGuide[];
}

/**
 * Marks a strategy guide as applied (increases confidence)
 */
export async function applyStrategyGuide(guideId: string): Promise<void> {
  // First get current times_applied
  const { data: current } = await supabase
    .from('strategy_guide')
    .select('times_applied')
    .eq('id', guideId)
    .single();

  const newCount = (current?.times_applied || 0) + 1;

  const { error } = await supabase
    .from('strategy_guide')
    .update({
      times_applied: newCount,
      last_applied_at: new Date().toISOString()
    })
    .eq('id', guideId);

  if (error) {
    console.error('[📋 STRATEGY] Failed to update guide:', error);
  }
}

/**
 * Builds context string from strategy guides for agent prompts
 */
export function buildStrategyContext(guides: StrategyGuide[]): string {
  if (guides.length === 0) return '';

  const rules = guides
    .map((g, i) => `${i + 1}. ${g.advice} (confidence: ${(g.confidence_score * 100).toFixed(0)}%)`)
    .join('\n');

  return `
LEARNED STRATEGIES (Apply these rules to avoid past failures):
${rules}
`;
}
