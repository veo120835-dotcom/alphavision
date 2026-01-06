import type { CompanyProfile, FundabilityScore, FundabilityGap, FundingStage } from './types';

interface StageBenchmarks {
  revenue: number;
  growth: number;
  customers: number;
  teamSize: number;
}

const STAGE_BENCHMARKS: Record<FundingStage, StageBenchmarks> = {
  'pre-seed': { revenue: 0, growth: 0, customers: 10, teamSize: 2 },
  'seed': { revenue: 100000, growth: 0.2, customers: 100, teamSize: 5 },
  'series-a': { revenue: 1000000, growth: 0.15, customers: 500, teamSize: 15 },
  'series-b': { revenue: 5000000, growth: 0.10, customers: 2000, teamSize: 50 },
  'series-c': { revenue: 20000000, growth: 0.08, customers: 10000, teamSize: 150 },
  'growth': { revenue: 50000000, growth: 0.05, customers: 50000, teamSize: 300 },
  'pre-ipo': { revenue: 100000000, growth: 0.03, customers: 100000, teamSize: 500 },
};

export class FundabilityScoreService {
  calculateScore(profile: CompanyProfile): FundabilityScore {
    const breakdown = this.calculateBreakdown(profile);
    const overall = this.calculateOverall(breakdown);
    const readiness = this.determineReadiness(overall, profile);
    const gaps = this.identifyGaps(profile, breakdown);
    const recommendations = this.generateRecommendations(gaps, profile);
    const timeline = this.estimateTimeline(readiness, gaps);

    return {
      overall,
      breakdown,
      readiness,
      recommendations,
      gaps,
      timeline,
    };
  }

  private calculateBreakdown(profile: CompanyProfile): FundabilityScore['breakdown'] {
    return {
      traction: this.scoreTraction(profile),
      team: this.scoreTeam(profile),
      market: this.scoreMarket(profile),
      product: this.scoreProduct(profile),
      financials: this.scoreFinancials(profile),
      timing: this.scoreTiming(profile),
    };
  }

  private scoreTraction(profile: CompanyProfile): number {
    const benchmarks = STAGE_BENCHMARKS[profile.stage];
    let score = 50;

    // Revenue vs benchmark
    if (profile.metrics.revenue >= benchmarks.revenue * 2) score += 25;
    else if (profile.metrics.revenue >= benchmarks.revenue) score += 15;
    else if (profile.metrics.revenue >= benchmarks.revenue * 0.5) score += 5;
    else score -= 15;

    // Growth rate
    if (profile.metrics.growth >= 0.20) score += 15;
    else if (profile.metrics.growth >= 0.10) score += 10;
    else if (profile.metrics.growth >= 0.05) score += 5;

    // Customer count
    if (profile.metrics.customers >= benchmarks.customers * 2) score += 10;
    else if (profile.metrics.customers >= benchmarks.customers) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private scoreTeam(profile: CompanyProfile): number {
    const benchmarks = STAGE_BENCHMARKS[profile.stage];
    let score = 50;

    // Team size appropriateness
    const sizeRatio = profile.teamSize / benchmarks.teamSize;
    if (sizeRatio >= 0.8 && sizeRatio <= 1.5) score += 20;
    else if (sizeRatio >= 0.5 && sizeRatio <= 2) score += 10;
    else score -= 10;

    // Efficiency (revenue per employee)
    const revenuePerEmployee = profile.metrics.revenue / Math.max(1, profile.teamSize);
    if (revenuePerEmployee >= 200000) score += 20;
    else if (revenuePerEmployee >= 100000) score += 10;
    else if (revenuePerEmployee >= 50000) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private scoreMarket(profile: CompanyProfile): number {
    let score = 60;

    // Industry attractiveness (simplified)
    const hotIndustries = ['ai', 'fintech', 'healthtech', 'climate', 'cybersecurity'];
    if (hotIndustries.some(i => profile.industry.toLowerCase().includes(i))) {
      score += 20;
    }

    // Growth trajectory suggests market demand
    if (profile.metrics.growth >= 0.15) score += 15;
    else if (profile.metrics.growth >= 0.08) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private scoreProduct(profile: CompanyProfile): number {
    let score = 50;

    // LTV/CAC ratio
    const ltvCacRatio = profile.metrics.ltv / Math.max(1, profile.metrics.cac);
    if (ltvCacRatio >= 5) score += 25;
    else if (ltvCacRatio >= 3) score += 15;
    else if (ltvCacRatio >= 2) score += 5;
    else score -= 10;

    // Low churn indicates product-market fit
    if (profile.metrics.churn <= 0.02) score += 20;
    else if (profile.metrics.churn <= 0.05) score += 10;
    else if (profile.metrics.churn <= 0.10) score += 0;
    else score -= 15;

    // Gross margin
    if (profile.metrics.grossMargin >= 0.80) score += 10;
    else if (profile.metrics.grossMargin >= 0.60) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private scoreFinancials(profile: CompanyProfile): number {
    let score = 50;

    // Runway (if available)
    if (profile.metrics.runway) {
      if (profile.metrics.runway >= 18) score += 25;
      else if (profile.metrics.runway >= 12) score += 15;
      else if (profile.metrics.runway >= 6) score += 5;
      else score -= 20;
    }

    // Gross margin
    if (profile.metrics.grossMargin >= 0.75) score += 15;
    else if (profile.metrics.grossMargin >= 0.50) score += 5;
    else score -= 10;

    // Burn efficiency
    if (profile.metrics.burnRate && profile.metrics.revenue) {
      const burnMultiple = profile.metrics.burnRate / (profile.metrics.revenue / 12);
      if (burnMultiple <= 1) score += 15;
      else if (burnMultiple <= 2) score += 5;
      else score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreTiming(profile: CompanyProfile): number {
    let score = 60;

    // Growth momentum
    if (profile.metrics.growth >= 0.15) score += 20;
    else if (profile.metrics.growth >= 0.08) score += 10;
    else if (profile.metrics.growth < 0) score -= 20;

    // Previous funding success
    if (profile.previousFunding && profile.previousFunding.length > 0) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateOverall(breakdown: FundabilityScore['breakdown']): number {
    const weights = {
      traction: 0.25,
      team: 0.15,
      market: 0.20,
      product: 0.20,
      financials: 0.10,
      timing: 0.10,
    };

    return Math.round(
      breakdown.traction * weights.traction +
      breakdown.team * weights.team +
      breakdown.market * weights.market +
      breakdown.product * weights.product +
      breakdown.financials * weights.financials +
      breakdown.timing * weights.timing
    );
  }

  private determineReadiness(overall: number, profile: CompanyProfile): FundabilityScore['readiness'] {
    if (overall >= 80 && profile.metrics.growth >= 0.10) return 'optimal';
    if (overall >= 65) return 'ready';
    if (overall >= 50) return 'early';
    return 'not-ready';
  }

  private identifyGaps(profile: CompanyProfile, breakdown: FundabilityScore['breakdown']): FundabilityGap[] {
    const gaps: FundabilityGap[] = [];
    const benchmarks = STAGE_BENCHMARKS[profile.stage];

    if (breakdown.traction < 60) {
      gaps.push({
        area: 'Traction',
        current: `$${profile.metrics.revenue.toLocaleString()} revenue, ${profile.metrics.customers} customers`,
        required: `$${benchmarks.revenue.toLocaleString()} revenue, ${benchmarks.customers} customers`,
        priority: breakdown.traction < 40 ? 'critical' : 'high',
        actionItems: [
          'Focus on customer acquisition channels with proven ROI',
          'Implement referral program to accelerate growth',
          'Consider strategic partnerships for distribution',
        ],
      });
    }

    if (breakdown.product < 60) {
      gaps.push({
        area: 'Product-Market Fit',
        current: `LTV/CAC: ${(profile.metrics.ltv / profile.metrics.cac).toFixed(1)}, Churn: ${(profile.metrics.churn * 100).toFixed(1)}%`,
        required: 'LTV/CAC > 3, Churn < 5%',
        priority: breakdown.product < 40 ? 'critical' : 'high',
        actionItems: [
          'Conduct customer interviews to identify value gaps',
          'Implement onboarding improvements to reduce early churn',
          'Develop features that drive expansion revenue',
        ],
      });
    }

    if (breakdown.financials < 60 && profile.metrics.runway && profile.metrics.runway < 12) {
      gaps.push({
        area: 'Financial Health',
        current: `${profile.metrics.runway} months runway`,
        required: '12+ months runway recommended before raise',
        priority: 'critical',
        actionItems: [
          'Reduce burn rate by focusing on essential spend',
          'Accelerate revenue timeline',
          'Consider bridge financing or revenue-based financing',
        ],
      });
    }

    return gaps;
  }

  private generateRecommendations(gaps: FundabilityGap[], profile: CompanyProfile): string[] {
    const recommendations: string[] = [];

    if (gaps.length === 0) {
      recommendations.push('Your fundability metrics are strong. Consider timing your raise with a significant milestone.');
      recommendations.push('Build relationships with target investors 3-6 months before you need capital.');
    } else {
      const criticalGaps = gaps.filter(g => g.priority === 'critical');
      if (criticalGaps.length > 0) {
        recommendations.push(`Address ${criticalGaps.length} critical gap(s) before approaching investors: ${criticalGaps.map(g => g.area).join(', ')}`);
      }

      if (profile.metrics.growth < 0.10) {
        recommendations.push('Focus on accelerating growth rate - this is the #1 factor investors evaluate.');
      }

      if (profile.metrics.churn > 0.05) {
        recommendations.push('Reduce churn to demonstrate product-market fit before raising.');
      }
    }

    return recommendations;
  }

  private estimateTimeline(readiness: FundabilityScore['readiness'], gaps: FundabilityGap[]): string {
    const criticalGaps = gaps.filter(g => g.priority === 'critical').length;
    const highGaps = gaps.filter(g => g.priority === 'high').length;

    switch (readiness) {
      case 'optimal':
        return 'Ready to raise now. Expect 2-4 month process.';
      case 'ready':
        return 'Can start fundraising in 1-2 months with minor improvements.';
      case 'early':
        return `Recommend ${3 + highGaps * 2} months of preparation before raising.`;
      case 'not-ready':
        return `Focus on fundamentals for ${6 + criticalGaps * 3} months before pursuing funding.`;
    }
  }

  getNextStageBenchmarks(currentStage: FundingStage): StageBenchmarks | null {
    const stages: FundingStage[] = ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'growth', 'pre-ipo'];
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex < stages.length - 1) {
      return STAGE_BENCHMARKS[stages[currentIndex + 1]];
    }
    return null;
  }
}

export const fundabilityScoreService = new FundabilityScoreService();
