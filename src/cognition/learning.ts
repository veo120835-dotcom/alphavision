/**
 * LEARNING LAYER
 * 
 * Policy updates, heuristics, and bias correction.
 * Enables continuous improvement through outcome analysis.
 */

import type {
  DecisionRecord,
  LearningEvent,
  LearningType,
  PolicyUpdate,
  BiasCorrection,
  ValidationResult,
  AgentObjective,
} from './types';

/**
 * Analyze decision outcomes and generate learning events
 */
export function analyzeOutcomes(decisions: DecisionRecord[]): LearningEvent[] {
  const events: LearningEvent[] = [];
  
  // Find patterns in successful decisions
  const successful = decisions.filter(d => d.outcome?.success);
  const failed = decisions.filter(d => d.outcome && !d.outcome.success);
  
  // Pattern discovery
  const patterns = discoverPatterns(successful);
  for (const pattern of patterns) {
    events.push({
      id: crypto.randomUUID(),
      type: 'pattern_discovered',
      source: successful[0],
      insight: pattern,
      confidence: calculatePatternConfidence(successful, pattern),
      applicability: 'general',
      createdAt: new Date(),
    });
  }
  
  // Bias detection
  const biases = detectBiases(decisions);
  for (const bias of biases) {
    events.push({
      id: crypto.randomUUID(),
      type: 'bias_detected',
      source: decisions[0],
      insight: `Bias detected: ${bias.type} - ${bias.description}`,
      confidence: bias.confidence,
      applicability: 'universal',
      createdAt: new Date(),
    });
  }
  
  // Objective calibration
  if (failed.length > 0) {
    const calibrations = calibrateObjectives(failed);
    for (const cal of calibrations) {
      events.push({
        id: crypto.randomUUID(),
        type: 'objective_calibrated',
        source: failed[0],
        insight: cal,
        confidence: 0.7,
        applicability: 'specific',
        createdAt: new Date(),
      });
    }
  }
  
  return events;
}

/**
 * Discover patterns in successful decisions
 */
function discoverPatterns(decisions: DecisionRecord[]): string[] {
  const patterns: string[] = [];
  
  if (decisions.length < 3) return patterns;
  
  // Check for common action types
  const actionCounts = new Map<string, number>();
  for (const d of decisions) {
    const action = d.selectedOption.action.toLowerCase();
    const key = action.split(' ')[0]; // First word
    actionCounts.set(key, (actionCounts.get(key) || 0) + 1);
  }
  
  for (const [action, count] of actionCounts) {
    if (count >= decisions.length * 0.5) {
      patterns.push(`Actions involving "${action}" have high success rate (${((count / decisions.length) * 100).toFixed(0)}%)`);
    }
  }
  
  // Check for common risk levels
  const lowRiskSuccess = decisions.filter(d => 
    d.context.riskAssessment.overallRisk === 'low'
  ).length;
  
  if (lowRiskSuccess > decisions.length * 0.7) {
    patterns.push('Low-risk decisions significantly outperform higher-risk alternatives');
  }
  
  // Check for reversibility preference
  const reversibleSuccess = decisions.filter(d =>
    d.selectedOption.reversibility === 'full'
  ).length;
  
  if (reversibleSuccess > decisions.length * 0.6) {
    patterns.push('Fully reversible actions show higher success rates');
  }
  
  return patterns;
}

/**
 * Calculate confidence in a discovered pattern
 */
function calculatePatternConfidence(decisions: DecisionRecord[], pattern: string): number {
  const sampleSize = decisions.length;
  
  // More data = higher confidence
  const sizeConfidence = Math.min(1, sampleSize / 50);
  
  // Higher success rate = higher confidence
  const successRate = decisions.filter(d => d.outcome?.success).length / sampleSize;
  
  // Lower regret = higher confidence
  const avgRegret = decisions.reduce((sum, d) => sum + (d.outcome?.regret || 0), 0) / sampleSize;
  const regretConfidence = 1 - Math.min(1, avgRegret);
  
  return (sizeConfidence + successRate + regretConfidence) / 3;
}

/**
 * Detect biases in decision making
 */
function detectBiases(decisions: DecisionRecord[]): Array<{
  type: string;
  description: string;
  confidence: number;
}> {
  const biases: Array<{ type: string; description: string; confidence: number }> = [];
  
  if (decisions.length < 10) return biases;
  
  // Overconfidence bias
  const overconfident = decisions.filter(d => {
    if (!d.outcome) return false;
    const expected = d.selectedOption.probability;
    const actual = d.outcome.success ? 1 : 0;
    return expected > 0.8 && actual === 0;
  });
  
  if (overconfident.length > decisions.length * 0.2) {
    biases.push({
      type: 'overconfidence',
      description: 'High-probability predictions failing more than expected',
      confidence: overconfident.length / decisions.length,
    });
  }
  
  // Loss aversion
  const riskyDecisions = decisions.filter(d => 
    d.context.riskAssessment.overallRisk === 'high' || 
    d.context.riskAssessment.overallRisk === 'critical'
  );
  
  if (riskyDecisions.length < decisions.length * 0.1) {
    biases.push({
      type: 'loss_aversion',
      description: 'System may be too conservative - very few high-risk decisions taken',
      confidence: 0.6,
    });
  }
  
  // Anchoring bias (always choosing first option)
  const firstOptionChosen = decisions.filter(d =>
    d.context.options[0]?.id === d.selectedOption.id
  );
  
  if (firstOptionChosen.length > decisions.length * 0.9) {
    biases.push({
      type: 'anchoring',
      description: 'First presented option chosen too frequently',
      confidence: firstOptionChosen.length / decisions.length,
    });
  }
  
  return biases;
}

/**
 * Calibrate objectives based on failed decisions
 */
function calibrateObjectives(failed: DecisionRecord[]): string[] {
  const calibrations: string[] = [];
  
  // Check if probability estimates were too optimistic
  const avgProbability = failed.reduce((sum, d) => sum + d.selectedOption.probability, 0) / failed.length;
  if (avgProbability > 0.7) {
    calibrations.push(`Probability estimates appear optimistic (avg ${(avgProbability * 100).toFixed(0)}% for failed decisions). Consider calibrating down by 15-20%.`);
  }
  
  // Check if upside estimates were too high
  const avgUpside = failed.reduce((sum, d) => sum + d.selectedOption.upside, 0) / failed.length;
  const avgActual = failed.reduce((sum, d) => sum + (d.outcome?.actualValue || 0), 0) / failed.length;
  
  if (avgUpside > avgActual * 1.5) {
    calibrations.push(`Upside estimates significantly exceed actual outcomes. Apply ${((avgUpside / avgActual - 1) * 100).toFixed(0)}% discount to future estimates.`);
  }
  
  return calibrations;
}

/**
 * Generate policy update from learning events
 */
export function generatePolicyUpdate(
  agentId: string,
  events: LearningEvent[],
  currentPolicy: string
): PolicyUpdate | null {
  // Only generate update if we have high-confidence learnings
  const highConfidence = events.filter(e => e.confidence > 0.7);
  if (highConfidence.length === 0) return null;
  
  const updates: string[] = [];
  
  for (const event of highConfidence) {
    if (event.type === 'pattern_discovered') {
      updates.push(`APPLY: ${event.insight}`);
    }
    if (event.type === 'bias_detected') {
      updates.push(`CORRECT: ${event.insight}`);
    }
    if (event.type === 'objective_calibrated') {
      updates.push(`CALIBRATE: ${event.insight}`);
    }
  }
  
  if (updates.length === 0) return null;
  
  const newPolicy = `${currentPolicy}\n\n## Learned Adjustments (${new Date().toISOString()})\n${updates.map(u => `- ${u}`).join('\n')}`;
  
  return {
    id: crypto.randomUUID(),
    agentId,
    previousPolicy: currentPolicy,
    newPolicy,
    trigger: highConfidence[0],
    validationResults: validatePolicyUpdate(newPolicy),
  };
}

/**
 * Validate a policy update before deployment
 */
function validatePolicyUpdate(newPolicy: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Check for contradictions
  results.push({
    testCase: 'no_contradictions',
    passed: !hasContradictions(newPolicy),
    notes: 'Policy should not contain conflicting rules',
  });
  
  // Check for completeness
  results.push({
    testCase: 'has_constraints',
    passed: newPolicy.includes('CONSTRAINT') || newPolicy.includes('APPLY'),
    notes: 'Policy should have actionable constraints',
  });
  
  // Check length (shouldn't grow unbounded)
  results.push({
    testCase: 'reasonable_length',
    passed: newPolicy.length < 10000,
    notes: 'Policy should not exceed reasonable length',
  });
  
  return results;
}

/**
 * Check for contradictions in policy
 */
function hasContradictions(policy: string): boolean {
  // Simple heuristic - check for opposing directives
  const lines = policy.toLowerCase().split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      if (
        (lines[i].includes('always') && lines[j].includes('never') &&
         lines[i].split(' ').some(w => lines[j].includes(w))) ||
        (lines[i].includes('increase') && lines[j].includes('decrease') &&
         lines[i].split(' ').some(w => lines[j].includes(w)))
      ) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Apply bias correction to agent objective
 */
export function applyBiasCorrection(
  objective: AgentObjective,
  correction: BiasCorrection
): AgentObjective {
  const updated = { ...objective };
  
  if (correction.biasType === 'overconfidence') {
    // Add constraint to reduce confidence
    updated.constraints = [
      ...updated.constraints,
      'Reduce probability estimates by 15% for high-confidence predictions',
    ];
  }
  
  if (correction.biasType === 'loss_aversion') {
    // Encourage more risk-taking
    updated.constraints = updated.constraints.filter(
      c => !c.includes('avoid risk') && !c.includes('minimize downside')
    );
  }
  
  if (correction.biasType === 'anchoring') {
    // Add constraint to consider alternatives
    updated.constraints = [
      ...updated.constraints,
      'Must evaluate at least 3 options before deciding',
    ];
  }
  
  return updated;
}

/**
 * Calculate regret for a decision
 */
export function calculateRegret(
  decision: DecisionRecord,
  actualOutcome: number,
  counterfactualOutcomes: Map<string, number>
): number {
  // Regret = best alternative outcome - actual outcome
  const alternatives = Array.from(counterfactualOutcomes.values());
  const bestAlternative = Math.max(...alternatives, 0);
  
  return Math.max(0, bestAlternative - actualOutcome);
}
