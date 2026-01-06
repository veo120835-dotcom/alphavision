/**
 * REASONING LAYER
 * 
 * Multi-step inference and constraint solving.
 * Converts perceived signals + world state into logical conclusions.
 */

import type { 
  StructuredSignal, 
  ReasoningContext, 
  InferenceChain, 
  InferenceStep,
  Constraint,
  Objective,
  WorldModelSnapshot 
} from './types';

/**
 * Build reasoning context from signals and world state
 */
export function buildReasoningContext(
  signals: StructuredSignal[],
  worldState: WorldModelSnapshot,
  constraints: Constraint[],
  objectives: Objective[]
): ReasoningContext {
  return {
    signals,
    worldState,
    constraints: prioritizeConstraints(constraints),
    objectives: prioritizeObjectives(objectives),
    priorDecisions: [], // Would be loaded from database
  };
}

/**
 * Perform multi-step inference on a reasoning context
 */
export function reason(context: ReasoningContext, question: string): InferenceChain {
  const steps: InferenceStep[] = [];
  
  // Step 1: Gather relevant evidence
  const evidence = gatherEvidence(context, question);
  steps.push({
    premise: 'Gather evidence relevant to the question',
    reasoning: `Found ${evidence.length} relevant data points`,
    evidence: evidence.slice(0, 5).map(e => JSON.stringify(e)),
    confidence: evidence.length > 0 ? 0.8 : 0.3,
  });
  
  // Step 2: Check constraints
  const constraintViolations = checkConstraints(context, evidence);
  steps.push({
    premise: 'Verify no constraints are violated',
    reasoning: constraintViolations.length === 0 
      ? 'All constraints satisfied'
      : `${constraintViolations.length} constraint(s) may be affected`,
    evidence: constraintViolations,
    confidence: constraintViolations.length === 0 ? 0.95 : 0.6,
  });
  
  // Step 3: Evaluate against objectives
  const objectiveAlignment = evaluateObjectives(context, evidence);
  steps.push({
    premise: 'Evaluate alignment with stated objectives',
    reasoning: `Objective alignment score: ${objectiveAlignment.score.toFixed(2)}`,
    evidence: objectiveAlignment.details,
    confidence: objectiveAlignment.score,
  });
  
  // Step 4: Synthesize conclusion
  const conclusion = synthesizeConclusion(steps, question);
  
  // Calculate overall confidence
  const avgConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;
  
  return {
    id: crypto.randomUUID(),
    steps,
    conclusion: conclusion.main,
    confidence: avgConfidence,
    alternativeConclusions: conclusion.alternatives,
  };
}

/**
 * Gather evidence from context relevant to a question
 */
function gatherEvidence(context: ReasoningContext, question: string): unknown[] {
  const evidence: unknown[] = [];
  const questionLower = question.toLowerCase();
  
  // Check signals for relevant data
  for (const signal of context.signals) {
    if (isRelevantSignal(signal, questionLower)) {
      evidence.push({
        type: signal.type,
        value: signal.value,
        confidence: signal.confidence,
      });
    }
  }
  
  // Check world state for relevant data
  if (questionLower.includes('revenue') || questionLower.includes('money')) {
    evidence.push({
      source: 'world_state',
      data: context.worldState.businessState,
    });
  }
  
  if (questionLower.includes('risk') || questionLower.includes('danger')) {
    evidence.push({
      source: 'world_state',
      data: context.worldState.riskState,
    });
  }
  
  if (questionLower.includes('runway') || questionLower.includes('cash')) {
    evidence.push({
      source: 'world_state',
      data: context.worldState.capitalState,
    });
  }
  
  return evidence;
}

/**
 * Check if a signal is relevant to the question
 */
function isRelevantSignal(signal: StructuredSignal, question: string): boolean {
  const relevanceMap: Record<string, string[]> = {
    'revenue_event': ['revenue', 'money', 'income', 'payment', 'sales'],
    'lead_activity': ['lead', 'prospect', 'customer', 'conversion'],
    'market_change': ['market', 'trend', 'industry', 'economy'],
    'competitor_action': ['competitor', 'competition', 'rival'],
    'founder_state': ['founder', 'energy', 'burnout', 'focus'],
    'client_sentiment': ['client', 'customer', 'satisfaction', 'feedback'],
    'risk_indicator': ['risk', 'danger', 'threat', 'warning'],
    'opportunity_detected': ['opportunity', 'chance', 'potential'],
  };
  
  const keywords = relevanceMap[signal.type] || [];
  return keywords.some(k => question.includes(k));
}

/**
 * Check if evidence violates any constraints
 */
function checkConstraints(context: ReasoningContext, evidence: unknown[]): string[] {
  const violations: string[] = [];
  
  for (const constraint of context.constraints) {
    if (constraint.type === 'hard') {
      // Check runway constraint
      if (constraint.rule.includes('runway') && context.worldState.capitalState.runwayMonths < 6) {
        violations.push(`Runway below minimum: ${context.worldState.capitalState.runwayMonths} months`);
      }
      
      // Check risk constraint
      if (constraint.rule.includes('risk') && context.worldState.riskState.overallRisk > 0.7) {
        violations.push(`Risk level too high: ${(context.worldState.riskState.overallRisk * 100).toFixed(0)}%`);
      }
    }
  }
  
  return violations;
}

/**
 * Evaluate how well evidence aligns with objectives
 */
function evaluateObjectives(
  context: ReasoningContext, 
  evidence: unknown[]
): { score: number; details: string[] } {
  const details: string[] = [];
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const objective of context.objectives) {
    const alignment = calculateObjectiveAlignment(objective, evidence, context.worldState);
    details.push(`${objective.metric}: ${(alignment * 100).toFixed(0)}% aligned`);
    totalScore += alignment * objective.weight;
    totalWeight += objective.weight;
  }
  
  return {
    score: totalWeight > 0 ? totalScore / totalWeight : 0.5,
    details,
  };
}

/**
 * Calculate how well evidence aligns with a single objective
 */
function calculateObjectiveAlignment(
  objective: Objective, 
  evidence: unknown[],
  worldState: WorldModelSnapshot
): number {
  // Simplified alignment calculation
  // In production, this would be more sophisticated
  
  if (objective.metric.includes('revenue')) {
    const current = worldState.businessState.revenueStreams.reduce((sum, r) => sum + r.mrr, 0);
    return Math.min(1, current / objective.target);
  }
  
  if (objective.metric.includes('runway')) {
    return Math.min(1, worldState.capitalState.runwayMonths / objective.target);
  }
  
  if (objective.metric.includes('risk')) {
    // Lower risk is better
    return 1 - worldState.riskState.overallRisk;
  }
  
  return 0.5; // Default neutral alignment
}

/**
 * Synthesize a conclusion from inference steps
 */
function synthesizeConclusion(
  steps: InferenceStep[], 
  question: string
): { main: string; alternatives: string[] } {
  const avgConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;
  const hasViolations = steps.some(s => s.evidence.some(e => 
    typeof e === 'string' && e.toLowerCase().includes('violation')
  ));
  
  if (hasViolations) {
    return {
      main: `Cannot proceed - constraint violations detected. Review required.`,
      alternatives: [
        'Modify approach to satisfy constraints',
        'Request exception approval',
        'Defer decision until constraints are met',
      ],
    };
  }
  
  if (avgConfidence > 0.8) {
    return {
      main: `High confidence recommendation available based on ${steps.length} inference steps.`,
      alternatives: [
        'Proceed with primary recommendation',
        'Gather additional evidence for validation',
      ],
    };
  }
  
  return {
    main: `Moderate confidence analysis complete. Human review recommended.`,
    alternatives: [
      'Proceed with caution',
      'Request additional data',
      'Escalate to human decision maker',
    ],
  };
}

/**
 * Prioritize constraints by type and source
 */
function prioritizeConstraints(constraints: Constraint[]): Constraint[] {
  return [...constraints].sort((a, b) => {
    // Hard constraints first
    if (a.type !== b.type) return a.type === 'hard' ? -1 : 1;
    // North star constraints highest priority
    const sourceOrder = ['north_star', 'regulatory', 'user', 'learned'];
    return sourceOrder.indexOf(a.source) - sourceOrder.indexOf(b.source);
  });
}

/**
 * Prioritize objectives by weight and time horizon
 */
function prioritizeObjectives(objectives: Objective[]): Objective[] {
  const horizonOrder = ['immediate', 'short', 'medium', 'long'];
  return [...objectives].sort((a, b) => {
    // Higher weight first
    if (a.weight !== b.weight) return b.weight - a.weight;
    // Shorter time horizon first
    return horizonOrder.indexOf(a.timeHorizon) - horizonOrder.indexOf(b.timeHorizon);
  });
}
