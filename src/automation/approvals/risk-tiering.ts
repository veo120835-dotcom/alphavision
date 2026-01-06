// Risk Tiering System

import { RiskTier, ActionType } from '../types';

interface RiskFactor {
  name: string;
  weight: number;
  evaluate: (context: RiskContext) => number; // Returns 0-1
}

interface RiskContext {
  action_type: ActionType;
  action_details: Record<string, unknown>;
  user_id?: string;
  historical_success_rate?: number;
  monetary_value?: number;
  affected_records?: number;
  is_reversible?: boolean;
  time_sensitivity?: 'low' | 'medium' | 'high';
}

interface RiskAssessment {
  tier: RiskTier;
  score: number;
  factors: Array<{ name: string; score: number; contribution: number }>;
  recommendations: string[];
}

class RiskTieringService {
  private factors: RiskFactor[] = [];
  private thresholds = {
    low: 0.25,
    medium: 0.5,
    high: 0.75,
    critical: 1.0,
  };

  constructor() {
    this.initializeDefaultFactors();
  }

  private initializeDefaultFactors(): void {
    // Action type inherent risk
    this.addFactor({
      name: 'action_type_risk',
      weight: 0.3,
      evaluate: (context) => {
        const riskMap: Record<ActionType, number> = {
          'send_email': 0.2,
          'send_notification': 0.1,
          'create_task': 0.1,
          'update_record': 0.3,
          'call_api': 0.4,
          'execute_function': 0.5,
          'wait': 0.0,
          'branch': 0.0,
          'approve': 0.0,
          'place_order': 0.9,
          'cancel_order': 0.7,
          'adjust_position': 0.85,
        };
        return riskMap[context.action_type] || 0.5;
      },
    });

    // Monetary value risk
    this.addFactor({
      name: 'monetary_value',
      weight: 0.25,
      evaluate: (context) => {
        if (!context.monetary_value) return 0;
        const value = context.monetary_value;
        if (value < 100) return 0.1;
        if (value < 1000) return 0.3;
        if (value < 10000) return 0.6;
        if (value < 100000) return 0.8;
        return 1.0;
      },
    });

    // Affected scope
    this.addFactor({
      name: 'affected_scope',
      weight: 0.15,
      evaluate: (context) => {
        if (!context.affected_records) return 0.2;
        const records = context.affected_records;
        if (records === 1) return 0.1;
        if (records < 10) return 0.2;
        if (records < 100) return 0.4;
        if (records < 1000) return 0.7;
        return 1.0;
      },
    });

    // Reversibility
    this.addFactor({
      name: 'reversibility',
      weight: 0.15,
      evaluate: (context) => {
        if (context.is_reversible === true) return 0.1;
        if (context.is_reversible === false) return 0.9;
        // Default: assume partially reversible
        return 0.5;
      },
    });

    // Historical success rate
    this.addFactor({
      name: 'historical_performance',
      weight: 0.1,
      evaluate: (context) => {
        if (context.historical_success_rate === undefined) return 0.5;
        // Lower success rate = higher risk
        return 1 - context.historical_success_rate;
      },
    });

    // Time sensitivity
    this.addFactor({
      name: 'time_sensitivity',
      weight: 0.05,
      evaluate: (context) => {
        switch (context.time_sensitivity) {
          case 'high': return 0.8;
          case 'medium': return 0.5;
          case 'low': return 0.2;
          default: return 0.3;
        }
      },
    });
  }

  addFactor(factor: RiskFactor): void {
    this.factors.push(factor);
    this.normalizeWeights();
  }

  removeFactor(name: string): void {
    this.factors = this.factors.filter(f => f.name !== name);
    this.normalizeWeights();
  }

  private normalizeWeights(): void {
    const totalWeight = this.factors.reduce((sum, f) => sum + f.weight, 0);
    if (totalWeight > 0) {
      this.factors.forEach(f => {
        f.weight = f.weight / totalWeight;
      });
    }
  }

  assessRisk(context: RiskContext): RiskAssessment {
    const factorResults: Array<{ name: string; score: number; contribution: number }> = [];
    let totalScore = 0;

    this.factors.forEach(factor => {
      const score = factor.evaluate(context);
      const contribution = score * factor.weight;
      totalScore += contribution;

      factorResults.push({
        name: factor.name,
        score,
        contribution,
      });
    });

    const tier = this.scoreToTier(totalScore);
    const recommendations = this.generateRecommendations(factorResults, tier);

    return {
      tier,
      score: totalScore,
      factors: factorResults.sort((a, b) => b.contribution - a.contribution),
      recommendations,
    };
  }

  private scoreToTier(score: number): RiskTier {
    if (score <= this.thresholds.low) return 'low';
    if (score <= this.thresholds.medium) return 'medium';
    if (score <= this.thresholds.high) return 'high';
    return 'critical';
  }

  private generateRecommendations(
    factors: Array<{ name: string; score: number; contribution: number }>,
    tier: RiskTier
  ): string[] {
    const recommendations: string[] = [];

    // Top contributing factors
    const topFactors = factors.filter(f => f.contribution > 0.15);

    topFactors.forEach(factor => {
      switch (factor.name) {
        case 'monetary_value':
          recommendations.push('Consider reducing transaction size or splitting into smaller amounts');
          break;
        case 'affected_scope':
          recommendations.push('Consider targeting a smaller subset first as a test');
          break;
        case 'reversibility':
          recommendations.push('Ensure a rollback plan is in place before proceeding');
          break;
        case 'action_type_risk':
          recommendations.push('This action type has inherent risk - consider additional validation');
          break;
        case 'historical_performance':
          recommendations.push('Historical success rate is low - review and improve before automation');
          break;
      }
    });

    if (tier === 'critical') {
      recommendations.push('Critical risk level - manual review required before any automation');
    } else if (tier === 'high') {
      recommendations.push('High risk - consider running in paper/simulation mode first');
    }

    return recommendations;
  }

  setThresholds(thresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  getThresholds(): typeof this.thresholds {
    return { ...this.thresholds };
  }

  getFactors(): RiskFactor[] {
    return [...this.factors];
  }
}

export const riskTieringService = new RiskTieringService();
