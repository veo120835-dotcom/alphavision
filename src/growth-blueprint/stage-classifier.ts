import type { BusinessIntake, BusinessStage, StageClassification } from './types';

interface StageIndicator {
  condition: (intake: BusinessIntake) => boolean;
  weight: number;
  description: string;
}

const STAGE_INDICATORS: Record<BusinessStage, StageIndicator[]> = {
  idea: [
    { condition: (i) => i.revenue_monthly === 0, weight: 3, description: 'No revenue yet' },
    { condition: (i) => i.customer_count === 0, weight: 3, description: 'No customers yet' },
    { condition: (i) => i.team_size === 1, weight: 1, description: 'Solo founder' },
  ],
  early: [
    { condition: (i) => i.revenue_monthly > 0 && i.revenue_monthly < 10000, weight: 2, description: 'Early revenue stage' },
    { condition: (i) => i.customer_count > 0 && i.customer_count < 20, weight: 2, description: 'First customers acquired' },
    { condition: (i) => i.team_size <= 3, weight: 1, description: 'Small founding team' },
    { condition: (i) => !i.churn_rate || i.churn_rate > 10, weight: 1, description: 'Still finding product-market fit' },
  ],
  growth: [
    { condition: (i) => i.revenue_monthly >= 10000 && i.revenue_monthly < 100000, weight: 2, description: 'Growing revenue' },
    { condition: (i) => i.customer_count >= 20 && i.customer_count < 200, weight: 2, description: 'Growing customer base' },
    { condition: (i) => i.revenue_trend === 'growing', weight: 2, description: 'Revenue trending upward' },
    { condition: (i) => i.team_size > 3 && i.team_size <= 15, weight: 1, description: 'Team scaling' },
  ],
  scaling: [
    { condition: (i) => i.revenue_monthly >= 100000 && i.revenue_monthly < 1000000, weight: 2, description: 'Significant revenue' },
    { condition: (i) => i.customer_count >= 200, weight: 2, description: 'Large customer base' },
    { condition: (i) => i.team_size > 15 && i.team_size <= 50, weight: 1, description: 'Scaling team' },
    { condition: (i) => i.churn_rate !== undefined && i.churn_rate < 5, weight: 2, description: 'Good retention' },
  ],
  mature: [
    { condition: (i) => i.revenue_monthly >= 1000000, weight: 3, description: 'Significant revenue scale' },
    { condition: (i) => i.team_size > 50, weight: 2, description: 'Large organization' },
    { condition: (i) => i.churn_rate !== undefined && i.churn_rate < 3, weight: 2, description: 'Excellent retention' },
    { condition: (i) => i.revenue_trend === 'stable', weight: 1, description: 'Stable mature business' },
  ],
};

const STAGE_CHALLENGES: Record<BusinessStage, string[]> = {
  idea: [
    'Validating the problem exists',
    'Finding initial customers',
    'Building MVP quickly',
    'Managing limited resources',
  ],
  early: [
    'Achieving product-market fit',
    'Finding repeatable sales process',
    'Managing founder burnout',
    'Deciding what NOT to build',
  ],
  growth: [
    'Scaling customer acquisition',
    'Hiring and onboarding effectively',
    'Maintaining quality at scale',
    'Building systems and processes',
  ],
  scaling: [
    'Maintaining culture during growth',
    'Building management layers',
    'Optimizing unit economics',
    'Preventing founder bottlenecks',
  ],
  mature: [
    'Avoiding complacency',
    'Finding new growth vectors',
    'Managing organizational complexity',
    'Fending off competition',
  ],
};

const NEXT_STAGE_REQUIREMENTS: Record<BusinessStage, string[]> = {
  idea: [
    'Get your first paying customer',
    'Validate problem-solution fit',
    'Build a working prototype',
  ],
  early: [
    'Reach $10K MRR',
    'Achieve <10% monthly churn',
    'Find repeatable acquisition channel',
  ],
  growth: [
    'Reach $100K MRR',
    'Build team to 15+ people',
    'Document core processes',
  ],
  scaling: [
    'Reach $1M+ MRR',
    'Establish professional management',
    'Achieve market leadership position',
  ],
  mature: [
    'Diversify revenue streams',
    'Enter new markets',
    'Consider strategic options (M&A, IPO)',
  ],
};

export class StageClassifierService {
  classifyStage(intake: BusinessIntake): StageClassification {
    const scores: Record<BusinessStage, { score: number; indicators: string[] }> = {
      idea: { score: 0, indicators: [] },
      early: { score: 0, indicators: [] },
      growth: { score: 0, indicators: [] },
      scaling: { score: 0, indicators: [] },
      mature: { score: 0, indicators: [] },
    };

    // Calculate scores for each stage
    for (const [stage, indicators] of Object.entries(STAGE_INDICATORS)) {
      for (const indicator of indicators) {
        if (indicator.condition(intake)) {
          scores[stage as BusinessStage].score += indicator.weight;
          scores[stage as BusinessStage].indicators.push(indicator.description);
        }
      }
    }

    // Find the stage with highest score
    let maxScore = 0;
    let classifiedStage: BusinessStage = 'early';
    let totalWeight = 0;

    for (const [stage, data] of Object.entries(scores)) {
      if (data.score > maxScore) {
        maxScore = data.score;
        classifiedStage = stage as BusinessStage;
      }
      // Calculate total possible weight for confidence
      totalWeight += STAGE_INDICATORS[stage as BusinessStage].reduce((sum, i) => sum + i.weight, 0);
    }

    // Calculate confidence (0-1)
    const confidence = Math.min(maxScore / (totalWeight / 5), 1);

    return {
      stage: classifiedStage,
      confidence: Math.round(confidence * 100) / 100,
      indicators: scores[classifiedStage].indicators,
      typical_challenges: STAGE_CHALLENGES[classifiedStage],
      next_stage_requirements: NEXT_STAGE_REQUIREMENTS[classifiedStage],
    };
  }

  getStageDescription(stage: BusinessStage): string {
    const descriptions: Record<BusinessStage, string> = {
      idea: 'Pre-revenue stage focused on validation and building MVP',
      early: 'First customers acquired, seeking product-market fit',
      growth: 'Found traction, focused on scaling acquisition',
      scaling: 'Proven model, building organization and processes',
      mature: 'Established business optimizing for efficiency and new opportunities',
    };
    return descriptions[stage];
  }

  getStageIcon(stage: BusinessStage): string {
    const icons: Record<BusinessStage, string> = {
      idea: '💡',
      early: '🌱',
      growth: '🚀',
      scaling: '📈',
      mature: '🏛️',
    };
    return icons[stage];
  }
}

export const stageClassifierService = new StageClassifierService();