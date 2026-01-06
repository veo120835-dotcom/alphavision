import type { CompanyProfile, ValuationModel, ValuationAnalysis, FundingStage } from './types';

interface ComparableCompany {
  name: string;
  stage: FundingStage;
  industry: string;
  revenue: number;
  valuation: number;
  multiple: number;
}

const INDUSTRY_MULTIPLES: Record<string, { revenue: number; arr: number }> = {
  'saas': { revenue: 10, arr: 12 },
  'fintech': { revenue: 8, arr: 10 },
  'ai': { revenue: 15, arr: 18 },
  'healthtech': { revenue: 6, arr: 8 },
  'ecommerce': { revenue: 2, arr: 3 },
  'marketplace': { revenue: 4, arr: 5 },
  'consumer': { revenue: 3, arr: 4 },
  'enterprise': { revenue: 8, arr: 10 },
  'default': { revenue: 5, arr: 6 },
};

const STAGE_ADJUSTMENTS: Record<FundingStage, number> = {
  'pre-seed': 0.5,
  'seed': 0.7,
  'series-a': 0.9,
  'series-b': 1.0,
  'series-c': 1.1,
  'growth': 1.2,
  'pre-ipo': 1.3,
};

export class ValuationModelService {
  analyze(profile: CompanyProfile): ValuationAnalysis {
    const primaryValuation = this.calculateRevenueMultiple(profile);
    const alternativeModels = this.calculateAlternativeModels(profile);
    const recommendedRange = this.determineRecommendedRange(primaryValuation, alternativeModels);
    const negotiationStrategy = this.generateNegotiationStrategy(profile, recommendedRange);
    const dilutionAnalysis = this.analyzeDilution(profile, recommendedRange);

    return {
      primaryValuation,
      alternativeModels,
      recommendedRange,
      negotiationStrategy,
      dilutionAnalysis,
    };
  }

  private calculateRevenueMultiple(profile: CompanyProfile): ValuationModel {
    const industry = this.normalizeIndustry(profile.industry);
    const baseMultiple = INDUSTRY_MULTIPLES[industry]?.revenue || INDUSTRY_MULTIPLES.default.revenue;
    const stageAdjustment = STAGE_ADJUSTMENTS[profile.stage];
    const growthAdjustment = this.getGrowthAdjustment(profile.metrics.growth);
    const marginAdjustment = this.getMarginAdjustment(profile.metrics.grossMargin);

    const adjustedMultiple = baseMultiple * stageAdjustment * growthAdjustment * marginAdjustment;
    const baseValue = profile.metrics.revenue * adjustedMultiple;

    return {
      method: 'Revenue Multiple',
      value: baseValue,
      range: {
        low: baseValue * 0.7,
        mid: baseValue,
        high: baseValue * 1.4,
      },
      comparables: this.findComparables(profile, adjustedMultiple),
      assumptions: [
        { key: 'Base Multiple', value: `${baseMultiple}x (${industry} average)`, sensitivity: 0.3 },
        { key: 'Stage Adjustment', value: `${stageAdjustment}x (${profile.stage})`, sensitivity: 0.2 },
        { key: 'Growth Premium', value: `${growthAdjustment.toFixed(2)}x (${(profile.metrics.growth * 100).toFixed(0)}% growth)`, sensitivity: 0.25 },
        { key: 'Margin Adjustment', value: `${marginAdjustment.toFixed(2)}x (${(profile.metrics.grossMargin * 100).toFixed(0)}% margin)`, sensitivity: 0.15 },
      ],
      defensibility: this.assessDefensibility(profile, adjustedMultiple),
    };
  }

  private calculateAlternativeModels(profile: CompanyProfile): ValuationModel[] {
    const models: ValuationModel[] = [];

    // ARR Multiple (if SaaS)
    if (profile.metrics.arr || profile.metrics.mrr) {
      const arr = profile.metrics.arr || (profile.metrics.mrr! * 12);
      const industry = this.normalizeIndustry(profile.industry);
      const arrMultiple = INDUSTRY_MULTIPLES[industry]?.arr || INDUSTRY_MULTIPLES.default.arr;
      const adjustedMultiple = arrMultiple * STAGE_ADJUSTMENTS[profile.stage] * this.getGrowthAdjustment(profile.metrics.growth);
      const value = arr * adjustedMultiple;

      models.push({
        method: 'ARR Multiple',
        value,
        range: { low: value * 0.75, mid: value, high: value * 1.3 },
        comparables: [],
        assumptions: [
          { key: 'ARR Multiple', value: `${adjustedMultiple.toFixed(1)}x`, sensitivity: 0.3 },
          { key: 'Recurring Revenue', value: `$${arr.toLocaleString()}`, sensitivity: 0.2 },
        ],
        defensibility: 'ARR-based valuation is highly defensible for SaaS with predictable revenue.',
      });
    }

    // LTV-based Model
    const ltvValue = profile.metrics.ltv * profile.metrics.customers * 0.5;
    models.push({
      method: 'Customer LTV Model',
      value: ltvValue,
      range: { low: ltvValue * 0.6, mid: ltvValue, high: ltvValue * 1.2 },
      comparables: [],
      assumptions: [
        { key: 'Average LTV', value: `$${profile.metrics.ltv.toLocaleString()}`, sensitivity: 0.35 },
        { key: 'Customer Count', value: `${profile.metrics.customers}`, sensitivity: 0.25 },
        { key: 'Value Factor', value: '0.5x (risk-adjusted)', sensitivity: 0.2 },
      ],
      defensibility: 'LTV model works when you have proven retention and can defend LTV assumptions.',
    });

    // Comparable Transactions
    const compValue = this.estimateFromComparables(profile);
    if (compValue > 0) {
      models.push({
        method: 'Comparable Transactions',
        value: compValue,
        range: { low: compValue * 0.8, mid: compValue, high: compValue * 1.25 },
        comparables: this.findComparables(profile, compValue / profile.metrics.revenue),
        assumptions: [
          { key: 'Method', value: 'Based on recent comparable company valuations', sensitivity: 0.3 },
        ],
        defensibility: 'Strong if you have truly comparable recent transactions.',
      });
    }

    return models;
  }

  private normalizeIndustry(industry: string): string {
    const lower = industry.toLowerCase();
    for (const key of Object.keys(INDUSTRY_MULTIPLES)) {
      if (lower.includes(key)) return key;
    }
    return 'default';
  }

  private getGrowthAdjustment(growth: number): number {
    if (growth >= 0.50) return 1.5;
    if (growth >= 0.30) return 1.3;
    if (growth >= 0.20) return 1.15;
    if (growth >= 0.10) return 1.0;
    if (growth >= 0.05) return 0.85;
    if (growth >= 0) return 0.7;
    return 0.5;
  }

  private getMarginAdjustment(margin: number): number {
    if (margin >= 0.80) return 1.2;
    if (margin >= 0.70) return 1.1;
    if (margin >= 0.60) return 1.0;
    if (margin >= 0.50) return 0.9;
    return 0.8;
  }

  private findComparables(profile: CompanyProfile, multiple: number): ValuationModel['comparables'] {
    // In production, this would fetch real comparables
    const mockComparables: ComparableCompany[] = [
      { name: 'Similar Co A', stage: profile.stage, industry: profile.industry, revenue: profile.metrics.revenue * 1.2, valuation: 0, multiple: multiple * 1.1 },
      { name: 'Similar Co B', stage: profile.stage, industry: profile.industry, revenue: profile.metrics.revenue * 0.8, valuation: 0, multiple: multiple * 0.9 },
    ];

    return mockComparables.map(c => ({
      company: c.name,
      multiple: c.multiple,
      value: c.revenue * c.multiple,
    }));
  }

  private estimateFromComparables(profile: CompanyProfile): number {
    // Simplified comparable estimation
    const industryMultiple = INDUSTRY_MULTIPLES[this.normalizeIndustry(profile.industry)]?.revenue || 5;
    return profile.metrics.revenue * industryMultiple * STAGE_ADJUSTMENTS[profile.stage];
  }

  private determineRecommendedRange(primary: ValuationModel, alternatives: ValuationModel[]): { min: number; max: number } {
    const allValues = [primary.value, ...alternatives.map(a => a.value)];
    const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    
    return {
      min: Math.round(avg * 0.8),
      max: Math.round(avg * 1.25),
    };
  }

  private generateNegotiationStrategy(profile: CompanyProfile, range: { min: number; max: number }): string {
    const strategies: string[] = [];
    
    strategies.push(`Anchor at $${(range.max / 1000000).toFixed(1)}M, be prepared to settle around $${((range.min + range.max) / 2 / 1000000).toFixed(1)}M.`);
    
    if (profile.metrics.growth >= 0.20) {
      strategies.push('Lead with growth trajectory - high growth justifies premium valuation.');
    }
    
    if (profile.metrics.grossMargin >= 0.70) {
      strategies.push('Emphasize unit economics - strong margins indicate scalable business model.');
    }
    
    if (profile.metrics.churn <= 0.03) {
      strategies.push('Highlight retention metrics - low churn proves product-market fit.');
    }
    
    strategies.push('Create competitive tension if possible - multiple term sheets increase leverage.');
    
    return strategies.join(' ');
  }

  private analyzeDilution(profile: CompanyProfile, range: { min: number; max: number }): ValuationAnalysis['dilutionAnalysis'] {
    const estimatedRaise = this.estimateRaiseAmount(profile.stage);
    const midValuation = (range.min + range.max) / 2;
    const dilution = estimatedRaise / (midValuation + estimatedRaise);
    
    return {
      preMoneyOwnership: 1 - (profile.previousFunding?.length ? 0.2 * profile.previousFunding.length : 0),
      postMoneyOwnership: (1 - (profile.previousFunding?.length ? 0.2 * profile.previousFunding.length : 0)) * (1 - dilution),
      futureRoundImpact: dilution * 0.8, // Estimate future dilution
    };
  }

  private estimateRaiseAmount(stage: FundingStage): number {
    const amounts: Record<FundingStage, number> = {
      'pre-seed': 500000,
      'seed': 2500000,
      'series-a': 12000000,
      'series-b': 35000000,
      'series-c': 75000000,
      'growth': 150000000,
      'pre-ipo': 300000000,
    };
    return amounts[stage];
  }

  private assessDefensibility(profile: CompanyProfile, multiple: number): string {
    const factors: string[] = [];
    
    if (profile.metrics.growth >= 0.20) {
      factors.push('strong growth trajectory');
    }
    if (profile.metrics.grossMargin >= 0.70) {
      factors.push('healthy margins');
    }
    if (profile.metrics.churn <= 0.05) {
      factors.push('low churn indicating PMF');
    }
    
    if (factors.length >= 2) {
      return `Valuation is defensible based on ${factors.join(' and ')}. Multiple of ${multiple.toFixed(1)}x is within market range.`;
    }
    
    return `Valuation may face scrutiny. Focus on strengthening metrics before negotiating.`;
  }
}

export const valuationModelService = new ValuationModelService();
