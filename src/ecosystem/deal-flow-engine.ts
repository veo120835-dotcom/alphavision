// Deal Flow Engine - Manage partnership and deal pipeline

import { DealOpportunity, DealType, OpportunityScore } from './types';

interface DealPipeline {
  opportunities: DealOpportunity[];
  total_value: number;
  weighted_value: number;
  by_stage: Record<DealOpportunity['stage'], number>;
  by_type: Record<DealType, number>;
}

interface DealRecommendation {
  opportunity_id: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reasoning: string;
  suggested_next_step: string;
  deadline?: string;
}

class DealFlowEngineService {
  private opportunities: DealOpportunity[] = [];

  createOpportunity(opportunity: Omit<DealOpportunity, 'id' | 'created_at'>): DealOpportunity {
    const newOpportunity: DealOpportunity = {
      ...opportunity,
      id: `deal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    };

    this.opportunities.push(newOpportunity);
    return newOpportunity;
  }

  updateOpportunity(id: string, updates: Partial<DealOpportunity>): DealOpportunity | null {
    const index = this.opportunities.findIndex(o => o.id === id);
    if (index < 0) return null;

    this.opportunities[index] = {
      ...this.opportunities[index],
      ...updates,
    };

    return this.opportunities[index];
  }

  advanceStage(id: string): DealOpportunity | null {
    const opportunity = this.opportunities.find(o => o.id === id);
    if (!opportunity) return null;

    const stageOrder: DealOpportunity['stage'][] = [
      'identified', 'exploring', 'negotiating', 'closing', 'closed'
    ];

    const currentIndex = stageOrder.indexOf(opportunity.stage);
    if (currentIndex < stageOrder.length - 1) {
      opportunity.stage = stageOrder[currentIndex + 1];
      opportunity.probability = Math.min(95, opportunity.probability + 15);
    }

    return opportunity;
  }

  getPipeline(): DealPipeline {
    const byStage: Record<string, number> = {
      identified: 0,
      exploring: 0,
      negotiating: 0,
      closing: 0,
      closed: 0,
    };

    const byType: Record<string, number> = {
      partnership: 0,
      investment: 0,
      acquisition: 0,
      joint_venture: 0,
      licensing: 0,
    };

    let totalValue = 0;
    let weightedValue = 0;

    this.opportunities.forEach(opp => {
      byStage[opp.stage] = (byStage[opp.stage] || 0) + 1;
      byType[opp.type] = (byType[opp.type] || 0) + 1;
      totalValue += opp.value_estimate;
      weightedValue += opp.value_estimate * (opp.probability / 100);
    });

    return {
      opportunities: this.opportunities,
      total_value: totalValue,
      weighted_value: weightedValue,
      by_stage: byStage as Record<DealOpportunity['stage'], number>,
      by_type: byType as Record<DealType, number>,
    };
  }

  scoreOpportunity(id: string): OpportunityScore | null {
    const opportunity = this.opportunities.find(o => o.id === id);
    if (!opportunity) return null;

    const strategicFit = this.assessStrategicFit(opportunity);
    const financialPotential = this.assessFinancialPotential(opportunity);
    const executionFeasibility = this.assessExecutionFeasibility(opportunity);

    const riskFactor = opportunity.risks.length * 5;
    const riskAdjustedScore = (
      (strategicFit * 0.35) +
      (financialPotential * 0.35) +
      (executionFeasibility * 0.30)
    ) * (1 - riskFactor / 100);

    return {
      opportunity_id: id,
      strategic_fit: strategicFit,
      financial_potential: financialPotential,
      execution_feasibility: executionFeasibility,
      risk_adjusted_score: Math.max(0, riskAdjustedScore),
      ranking: this.calculateRanking(riskAdjustedScore),
    };
  }

  private assessStrategicFit(opportunity: DealOpportunity): number {
    let score = 50;

    const strategicTypes: DealType[] = ['strategic', 'joint_venture'];
    if (strategicTypes.includes(opportunity.type as DealType)) {
      score += 20;
    }

    if (opportunity.key_terms.length >= 3) {
      score += 15;
    }

    score += opportunity.probability * 0.15;

    return Math.min(100, score);
  }

  private assessFinancialPotential(opportunity: DealOpportunity): number {
    const valueScore = Math.min(50, opportunity.value_estimate / 10000);
    const probabilityScore = opportunity.probability * 0.5;

    return Math.min(100, valueScore + probabilityScore);
  }

  private assessExecutionFeasibility(opportunity: DealOpportunity): number {
    let score = 70;

    score -= opportunity.risks.length * 8;
    
    if (opportunity.next_steps.length === 0) {
      score -= 15;
    }

    if (opportunity.stage === 'negotiating' || opportunity.stage === 'closing') {
      score += 15;
    }

    if (opportunity.deadline) {
      const daysUntilDeadline = (new Date(opportunity.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilDeadline < 7) {
        score -= 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateRanking(score: number): number {
    const allScores = this.opportunities.map(o => {
      const scoreResult = this.scoreOpportunity(o.id);
      return scoreResult?.risk_adjusted_score || 0;
    }).sort((a, b) => b - a);

    return allScores.indexOf(score) + 1;
  }

  generateRecommendations(): DealRecommendation[] {
    const recommendations: DealRecommendation[] = [];

    this.opportunities.forEach(opportunity => {
      const rec = this.generateOpportunityRecommendation(opportunity);
      if (rec) recommendations.push(rec);
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private generateOpportunityRecommendation(opportunity: DealOpportunity): DealRecommendation | null {
    if (opportunity.stage === 'closed') return null;

    let action: string;
    let priority: DealRecommendation['priority'];
    let reasoning: string;
    let suggestedNextStep: string;

    if (opportunity.deadline) {
      const daysUntil = (new Date(opportunity.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntil < 3) {
        return {
          opportunity_id: opportunity.id,
          action: 'URGENT: Deadline approaching',
          priority: 'urgent',
          reasoning: `Only ${Math.round(daysUntil)} days until deadline`,
          suggested_next_step: opportunity.next_steps[0] || 'Complete required action immediately',
          deadline: opportunity.deadline,
        };
      }
    }

    switch (opportunity.stage) {
      case 'identified':
        action = 'Initiate exploration';
        priority = 'medium';
        reasoning = 'New opportunity needs initial engagement';
        suggestedNextStep = 'Schedule discovery call or meeting';
        break;
      case 'exploring':
        action = 'Deepen engagement';
        priority = opportunity.probability > 50 ? 'high' : 'medium';
        reasoning = 'Opportunity showing promise, needs advancement';
        suggestedNextStep = 'Propose concrete partnership terms';
        break;
      case 'negotiating':
        action = 'Close negotiations';
        priority = 'high';
        reasoning = 'Active negotiation requires attention';
        suggestedNextStep = opportunity.next_steps[0] || 'Address outstanding terms';
        break;
      case 'closing':
        action = 'Finalize deal';
        priority = 'urgent';
        reasoning = 'Deal is ready to close';
        suggestedNextStep = 'Complete documentation and signatures';
        break;
      default:
        return null;
    }

    return {
      opportunity_id: opportunity.id,
      action,
      priority,
      reasoning,
      suggested_next_step: suggestedNextStep,
    };
  }

  getOpportunitiesByStage(stage: DealOpportunity['stage']): DealOpportunity[] {
    return this.opportunities.filter(o => o.stage === stage);
  }

  getOpportunitiesByType(type: DealType): DealOpportunity[] {
    return this.opportunities.filter(o => o.type === type);
  }

  getTopOpportunities(limit: number = 5): DealOpportunity[] {
    return [...this.opportunities]
      .sort((a, b) => {
        const scoreA = this.scoreOpportunity(a.id)?.risk_adjusted_score || 0;
        const scoreB = this.scoreOpportunity(b.id)?.risk_adjusted_score || 0;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }
}

export const dealFlowEngineService = new DealFlowEngineService();
