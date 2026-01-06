// Opportunity Scoring - Score and rank opportunities

import { DealOpportunity, OpportunityScore, DealType } from './types';

interface ScoringWeights {
  strategic_fit: number;
  financial_potential: number;
  execution_feasibility: number;
  time_sensitivity: number;
  relationship_strength: number;
}

interface OpportunityRanking {
  opportunity_id: string;
  title: string;
  score: number;
  rank: number;
  category: 'top_priority' | 'high_value' | 'quick_win' | 'develop' | 'monitor';
  key_factors: string[];
}

interface ScoringCriteria {
  name: string;
  weight: number;
  evaluate: (opportunity: DealOpportunity) => number;
  description: string;
}

class OpportunityScoringService {
  private defaultWeights: ScoringWeights = {
    strategic_fit: 0.25,
    financial_potential: 0.30,
    execution_feasibility: 0.20,
    time_sensitivity: 0.15,
    relationship_strength: 0.10,
  };

  private customWeights?: ScoringWeights;

  private scoringCriteria: ScoringCriteria[] = [
    {
      name: 'strategic_fit',
      weight: 25,
      evaluate: (opp) => this.evaluateStrategicFit(opp),
      description: 'Alignment with business goals and strategy',
    },
    {
      name: 'financial_potential',
      weight: 30,
      evaluate: (opp) => this.evaluateFinancialPotential(opp),
      description: 'Potential financial return',
    },
    {
      name: 'execution_feasibility',
      weight: 20,
      evaluate: (opp) => this.evaluateExecutionFeasibility(opp),
      description: 'Likelihood of successful execution',
    },
    {
      name: 'time_sensitivity',
      weight: 15,
      evaluate: (opp) => this.evaluateTimeSensitivity(opp),
      description: 'Urgency and time-bound nature',
    },
    {
      name: 'relationship_strength',
      weight: 10,
      evaluate: (opp) => this.evaluateRelationshipStrength(opp),
      description: 'Existing relationship and trust level',
    },
  ];

  setCustomWeights(weights: ScoringWeights): void {
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(total - 1) > 0.01) {
      throw new Error('Weights must sum to 1');
    }
    this.customWeights = weights;
  }

  scoreOpportunity(opportunity: DealOpportunity): OpportunityScore {
    const weights = this.customWeights || this.defaultWeights;

    const strategicFit = this.evaluateStrategicFit(opportunity);
    const financialPotential = this.evaluateFinancialPotential(opportunity);
    const executionFeasibility = this.evaluateExecutionFeasibility(opportunity);
    const timeSensitivity = this.evaluateTimeSensitivity(opportunity);
    const relationshipStrength = this.evaluateRelationshipStrength(opportunity);

    const weightedScore = 
      (strategicFit * weights.strategic_fit) +
      (financialPotential * weights.financial_potential) +
      (executionFeasibility * weights.execution_feasibility) +
      (timeSensitivity * weights.time_sensitivity) +
      (relationshipStrength * weights.relationship_strength);

    const riskPenalty = this.calculateRiskPenalty(opportunity);
    const riskAdjustedScore = weightedScore * (1 - riskPenalty);

    return {
      opportunity_id: opportunity.id,
      strategic_fit: strategicFit,
      financial_potential: financialPotential,
      execution_feasibility: executionFeasibility,
      risk_adjusted_score: Math.max(0, Math.min(100, riskAdjustedScore)),
      ranking: 0,
    };
  }

  private evaluateStrategicFit(opportunity: DealOpportunity): number {
    let score = 50;

    const highStrategicTypes: DealType[] = ['strategic', 'joint_venture', 'acquisition'];
    if (highStrategicTypes.includes(opportunity.type as DealType)) {
      score += 25;
    }

    if (opportunity.key_terms.length >= 4) {
      score += 15;
    } else if (opportunity.key_terms.length >= 2) {
      score += 8;
    }

    score += opportunity.probability * 0.1;

    return Math.min(100, score);
  }

  private evaluateFinancialPotential(opportunity: DealOpportunity): number {
    const valueTiers = [
      { threshold: 1000000, score: 100 },
      { threshold: 500000, score: 85 },
      { threshold: 100000, score: 70 },
      { threshold: 50000, score: 55 },
      { threshold: 10000, score: 40 },
      { threshold: 0, score: 25 },
    ];

    let baseScore = 25;
    for (const tier of valueTiers) {
      if (opportunity.value_estimate >= tier.threshold) {
        baseScore = tier.score;
        break;
      }
    }

    return baseScore * (opportunity.probability / 100);
  }

  private evaluateExecutionFeasibility(opportunity: DealOpportunity): number {
    let score = 60;

    const stageScores: Record<DealOpportunity['stage'], number> = {
      identified: -10,
      exploring: 0,
      negotiating: 10,
      closing: 20,
      closed: 30,
    };
    score += stageScores[opportunity.stage];

    score -= opportunity.risks.length * 6;

    if (opportunity.next_steps.length > 0) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private evaluateTimeSensitivity(opportunity: DealOpportunity): number {
    if (!opportunity.deadline) {
      return 50;
    }

    const daysUntilDeadline = (new Date(opportunity.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);

    if (daysUntilDeadline < 0) return 0;
    if (daysUntilDeadline < 7) return 100;
    if (daysUntilDeadline < 14) return 85;
    if (daysUntilDeadline < 30) return 70;
    if (daysUntilDeadline < 60) return 55;
    return 40;
  }

  private evaluateRelationshipStrength(opportunity: DealOpportunity): number {
    const stageRelationship: Record<DealOpportunity['stage'], number> = {
      identified: 30,
      exploring: 50,
      negotiating: 70,
      closing: 85,
      closed: 95,
    };

    return stageRelationship[opportunity.stage];
  }

  private calculateRiskPenalty(opportunity: DealOpportunity): number {
    const riskCount = opportunity.risks.length;
    return Math.min(0.4, riskCount * 0.08);
  }

  rankOpportunities(opportunities: DealOpportunity[]): OpportunityRanking[] {
    const scoredOpportunities = opportunities.map(opp => ({
      opportunity: opp,
      score: this.scoreOpportunity(opp),
    }));

    scoredOpportunities.sort((a, b) => 
      b.score.risk_adjusted_score - a.score.risk_adjusted_score
    );

    return scoredOpportunities.map((item, index) => {
      const category = this.categorizeOpportunity(item.score, item.opportunity);
      const keyFactors = this.identifyKeyFactors(item.score, item.opportunity);

      return {
        opportunity_id: item.opportunity.id,
        title: item.opportunity.title,
        score: item.score.risk_adjusted_score,
        rank: index + 1,
        category,
        key_factors: keyFactors,
      };
    });
  }

  private categorizeOpportunity(
    score: OpportunityScore,
    opportunity: DealOpportunity
  ): OpportunityRanking['category'] {
    const totalScore = score.risk_adjusted_score;

    if (totalScore >= 75) return 'top_priority';
    if (score.financial_potential >= 70) return 'high_value';
    if (score.execution_feasibility >= 70 && opportunity.value_estimate < 50000) return 'quick_win';
    if (totalScore >= 50) return 'develop';
    return 'monitor';
  }

  private identifyKeyFactors(score: OpportunityScore, opportunity: DealOpportunity): string[] {
    const factors: string[] = [];

    if (score.strategic_fit >= 70) factors.push('Strong strategic alignment');
    if (score.financial_potential >= 70) factors.push('High financial potential');
    if (score.execution_feasibility >= 70) factors.push('Highly feasible');
    if (opportunity.probability >= 70) factors.push('High probability');
    if (opportunity.risks.length === 0) factors.push('Low risk');
    if (opportunity.stage === 'closing') factors.push('Near completion');

    return factors.slice(0, 3);
  }

  compareOpportunities(oppA: DealOpportunity, oppB: DealOpportunity): {
    winner: string;
    margin: number;
    comparison: Record<string, { a: number; b: number; advantage: 'A' | 'B' | 'tie' }>;
  } {
    const scoreA = this.scoreOpportunity(oppA);
    const scoreB = this.scoreOpportunity(oppB);

    const comparison: Record<string, { a: number; b: number; advantage: 'A' | 'B' | 'tie' }> = {
      strategic_fit: {
        a: scoreA.strategic_fit,
        b: scoreB.strategic_fit,
        advantage: scoreA.strategic_fit > scoreB.strategic_fit ? 'A' : 
                   scoreB.strategic_fit > scoreA.strategic_fit ? 'B' : 'tie',
      },
      financial_potential: {
        a: scoreA.financial_potential,
        b: scoreB.financial_potential,
        advantage: scoreA.financial_potential > scoreB.financial_potential ? 'A' :
                   scoreB.financial_potential > scoreA.financial_potential ? 'B' : 'tie',
      },
      execution_feasibility: {
        a: scoreA.execution_feasibility,
        b: scoreB.execution_feasibility,
        advantage: scoreA.execution_feasibility > scoreB.execution_feasibility ? 'A' :
                   scoreB.execution_feasibility > scoreA.execution_feasibility ? 'B' : 'tie',
      },
      overall: {
        a: scoreA.risk_adjusted_score,
        b: scoreB.risk_adjusted_score,
        advantage: scoreA.risk_adjusted_score > scoreB.risk_adjusted_score ? 'A' :
                   scoreB.risk_adjusted_score > scoreA.risk_adjusted_score ? 'B' : 'tie',
      },
    };

    return {
      winner: scoreA.risk_adjusted_score >= scoreB.risk_adjusted_score ? oppA.id : oppB.id,
      margin: Math.abs(scoreA.risk_adjusted_score - scoreB.risk_adjusted_score),
      comparison,
    };
  }
}

export const opportunityScoringService = new OpportunityScoringService();
