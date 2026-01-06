/**
 * DECISION LAYER
 * 
 * Tradeoffs, prioritization, and kill rules.
 * Converts reasoning into actionable decisions with proper risk assessment.
 */

import type {
  InferenceChain,
  DecisionContext,
  DecisionOption,
  DecisionRecord,
  RiskAssessment,
  OpportunityCostAnalysis,
  Constraint,
  AutonomyLevel,
  DecisionOutcome,
} from './types';

/**
 * Build decision context from inference results
 */
export function buildDecisionContext(
  inference: InferenceChain,
  options: DecisionOption[],
  constraints: Constraint[]
): DecisionContext {
  return {
    inference,
    options: rankOptions(options),
    constraints,
    riskAssessment: assessRisk(options, constraints),
    opportunityCost: analyzeOpportunityCost(options),
  };
}

/**
 * Make a decision based on context
 */
export function decide(
  context: DecisionContext,
  agentId: string,
  organizationId: string,
  maxAutonomyLevel: AutonomyLevel
): DecisionRecord {
  // Select best option that doesn't violate constraints
  const validOptions = context.options.filter(opt => 
    !violatesConstraints(opt, context.constraints)
  );
  
  if (validOptions.length === 0) {
    // No valid options - escalate
    return createEscalationDecision(context, agentId, organizationId);
  }
  
  const selectedOption = validOptions[0]; // Already ranked
  const requiredAutonomy = determineRequiredAutonomy(selectedOption, context.riskAssessment);
  
  return {
    id: crypto.randomUUID(),
    agentId,
    organizationId,
    context,
    selectedOption,
    autonomyLevel: Math.min(requiredAutonomy, maxAutonomyLevel) as AutonomyLevel,
    reasoning: generateReasoning(context, selectedOption),
    createdAt: new Date(),
  };
}

/**
 * Rank options by expected value and risk
 */
function rankOptions(options: DecisionOption[]): DecisionOption[] {
  return [...options].sort((a, b) => {
    // Calculate expected value: upside * probability - downside * (1 - probability)
    const evA = a.upside * a.probability - a.downside * (1 - a.probability);
    const evB = b.upside * b.probability - b.downside * (1 - b.probability);
    
    // Adjust for reversibility
    const reversibilityBonus = { full: 1.2, partial: 1.0, none: 0.8 };
    const adjustedA = evA * reversibilityBonus[a.reversibility];
    const adjustedB = evB * reversibilityBonus[b.reversibility];
    
    return adjustedB - adjustedA;
  });
}

/**
 * Check if an option violates any hard constraints
 */
function violatesConstraints(option: DecisionOption, constraints: Constraint[]): boolean {
  for (const constraint of constraints) {
    if (constraint.type !== 'hard') continue;
    
    // Check common constraint patterns
    if (constraint.rule.includes('runway') && option.downside > 0.3) {
      return true; // High downside might threaten runway
    }
    
    if (constraint.rule.includes('reputation') && option.reversibility === 'none') {
      return true; // Irreversible actions risk reputation
    }
  }
  
  return false;
}

/**
 * Assess overall risk of decision options
 */
function assessRisk(options: DecisionOption[], constraints: Constraint[]): RiskAssessment {
  const factors = options.flatMap(opt => [
    {
      type: 'downside_exposure',
      likelihood: 1 - opt.probability,
      impact: opt.downside,
      description: `Option "${opt.action}" has ${((1 - opt.probability) * 100).toFixed(0)}% chance of ${opt.downside} downside`,
    },
    {
      type: 'irreversibility',
      likelihood: opt.reversibility === 'none' ? 0.8 : opt.reversibility === 'partial' ? 0.4 : 0.1,
      impact: 0.7,
      description: `Option "${opt.action}" is ${opt.reversibility} reversible`,
    },
  ]);
  
  const avgRisk = factors.reduce((sum, f) => sum + f.likelihood * f.impact, 0) / factors.length;
  
  return {
    overallRisk: avgRisk < 0.3 ? 'low' : avgRisk < 0.5 ? 'medium' : avgRisk < 0.7 ? 'high' : 'critical',
    factors,
    mitigations: generateMitigations(factors),
    killTriggers: generateKillTriggers(constraints),
  };
}

/**
 * Generate mitigation strategies for risk factors
 */
function generateMitigations(factors: RiskAssessment['factors']): RiskAssessment['mitigations'] {
  return factors
    .filter(f => f.likelihood * f.impact > 0.3)
    .map(f => ({
      riskFactorId: f.type,
      strategy: f.type === 'downside_exposure' 
        ? 'Set stop-loss threshold and monitor closely'
        : 'Document decision rationale for potential reversal',
      cost: 0.1,
      effectiveness: 0.7,
    }));
}

/**
 * Generate kill triggers from constraints
 */
function generateKillTriggers(constraints: Constraint[]): RiskAssessment['killTriggers'] {
  return constraints
    .filter(c => c.type === 'hard')
    .map(c => ({
      condition: c.rule,
      threshold: 0.9,
      action: 'stop' as const,
    }));
}

/**
 * Analyze opportunity cost of choosing one option over others
 */
function analyzeOpportunityCost(options: DecisionOption[]): OpportunityCostAnalysis {
  if (options.length < 2) {
    return {
      alternativesConsidered: [],
      foregoneValue: 0,
      confidence: 1,
      recommendation: 'Only one option available',
    };
  }
  
  const sorted = rankOptions(options);
  const best = sorted[0];
  const secondBest = sorted[1];
  
  const bestEV = best.upside * best.probability - best.downside * (1 - best.probability);
  const secondEV = secondBest.upside * secondBest.probability - secondBest.downside * (1 - secondBest.probability);
  
  return {
    alternativesConsidered: sorted.slice(1).map(o => o.action),
    foregoneValue: Math.max(0, secondEV - bestEV),
    confidence: sorted.length > 2 ? 0.8 : 0.9,
    recommendation: bestEV > secondEV * 1.2 
      ? 'Clear best option - proceed with confidence'
      : 'Options are close - consider additional factors',
  };
}

/**
 * Determine required autonomy level based on risk
 */
function determineRequiredAutonomy(option: DecisionOption, risk: RiskAssessment): AutonomyLevel {
  // High risk or irreversible = needs approval
  if (risk.overallRisk === 'critical' || option.reversibility === 'none') {
    return 1;
  }
  
  // Medium risk = execute with review
  if (risk.overallRisk === 'high' || option.reversibility === 'partial') {
    return 2;
  }
  
  // Low risk = autonomous within bounds
  return 3;
}

/**
 * Generate human-readable reasoning for decision
 */
function generateReasoning(context: DecisionContext, selected: DecisionOption): string {
  const parts: string[] = [
    `Selected action: "${selected.action}"`,
    `Expected outcome: ${selected.expectedOutcome}`,
    `Probability of success: ${(selected.probability * 100).toFixed(0)}%`,
    `Risk level: ${context.riskAssessment.overallRisk}`,
    `Reversibility: ${selected.reversibility}`,
  ];
  
  if (context.opportunityCost.foregoneValue > 0) {
    parts.push(`Opportunity cost: ${context.opportunityCost.foregoneValue.toFixed(2)}`);
  }
  
  return parts.join('\n');
}

/**
 * Create escalation decision when no valid options exist
 */
function createEscalationDecision(
  context: DecisionContext,
  agentId: string,
  organizationId: string
): DecisionRecord {
  return {
    id: crypto.randomUUID(),
    agentId,
    organizationId,
    context,
    selectedOption: {
      id: 'escalate',
      action: 'Escalate to human decision maker',
      expectedOutcome: 'Human review and decision',
      probability: 1,
      upside: 0,
      downside: 0,
      reversibility: 'full',
      timeToResult: 24,
    },
    autonomyLevel: 0,
    reasoning: 'No valid options available within constraints. Human review required.',
    createdAt: new Date(),
  };
}

/**
 * Record decision outcome for learning
 */
export function recordOutcome(
  decision: DecisionRecord,
  success: boolean,
  actualValue: number
): DecisionRecord {
  const expectedValue = decision.selectedOption.upside * decision.selectedOption.probability;
  
  const outcome: DecisionOutcome = {
    success,
    actualValue,
    expectedValue,
    regret: Math.max(0, expectedValue - actualValue),
    learnings: generateLearnings(decision, success, actualValue),
    recordedAt: new Date(),
  };
  
  return {
    ...decision,
    outcome,
  };
}

/**
 * Generate learnings from decision outcome
 */
function generateLearnings(
  decision: DecisionRecord,
  success: boolean,
  actualValue: number
): string[] {
  const learnings: string[] = [];
  
  if (success) {
    learnings.push(`Action "${decision.selectedOption.action}" succeeded as expected`);
  } else {
    learnings.push(`Action "${decision.selectedOption.action}" did not achieve expected outcome`);
    
    if (decision.context.riskAssessment.overallRisk === 'low') {
      learnings.push('Risk assessment may have been optimistic');
    }
  }
  
  const variance = Math.abs(actualValue - decision.selectedOption.upside * decision.selectedOption.probability);
  if (variance > 0.3) {
    learnings.push(`Significant variance (${(variance * 100).toFixed(0)}%) between expected and actual value`);
  }
  
  return learnings;
}
