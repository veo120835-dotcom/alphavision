import type { CompanyProfile, MnAReadiness, ValuationAnalysis } from './types';
import { valuationModelService } from './valuation-model';

interface AcquirerProfile {
  name: string;
  type: 'strategic' | 'financial';
  likelihood: number;
  rationale: string;
  estimatedMultiple: number;
}

export class MnAReadinessService {
  assess(profile: CompanyProfile): MnAReadiness {
    const score = this.calculateReadinessScore(profile);
    const readiness = this.determineReadinessLevel(score);
    const valuation = valuationModelService.analyze(profile);
    const attractiveness = this.assessAttractiveness(profile);
    const potentialAcquirers = this.identifyPotentialAcquirers(profile);
    const preparationSteps = this.generatePreparationSteps(profile, score);
    const timeline = this.estimateTimeline(readiness);
    const dealbreakers = this.identifyDealbreakers(profile);

    return {
      score,
      readiness,
      valuation,
      attractiveness,
      potentialAcquirers,
      preparationSteps,
      timeline,
      dealbreakers,
    };
  }

  private calculateReadinessScore(profile: CompanyProfile): number {
    let score = 0;
    const weights = {
      financials: 25,
      operations: 20,
      team: 15,
      legal: 15,
      market: 15,
      technology: 10,
    };

    // Financials (25 points)
    score += this.scoreFinancials(profile) * (weights.financials / 100);

    // Operations (20 points)
    score += this.scoreOperations(profile) * (weights.operations / 100);

    // Team (15 points)
    score += this.scoreTeam(profile) * (weights.team / 100);

    // Legal/Compliance (15 points) - simplified assessment
    score += 60 * (weights.legal / 100); // Assume baseline

    // Market position (15 points)
    score += this.scoreMarketPosition(profile) * (weights.market / 100);

    // Technology (10 points)
    score += this.scoreTechnology(profile) * (weights.technology / 100);

    return Math.round(score);
  }

  private scoreFinancials(profile: CompanyProfile): number {
    let score = 50;

    // Revenue trajectory
    if (profile.metrics.revenue >= 5000000) score += 15;
    else if (profile.metrics.revenue >= 1000000) score += 10;
    else if (profile.metrics.revenue >= 500000) score += 5;

    // Growth rate
    if (profile.metrics.growth >= 0.30) score += 15;
    else if (profile.metrics.growth >= 0.15) score += 10;
    else if (profile.metrics.growth >= 0.05) score += 5;

    // Margins
    if (profile.metrics.grossMargin >= 0.75) score += 10;
    else if (profile.metrics.grossMargin >= 0.60) score += 5;

    // Unit economics
    const ltvCac = profile.metrics.ltv / Math.max(1, profile.metrics.cac);
    if (ltvCac >= 4) score += 10;
    else if (ltvCac >= 3) score += 5;

    return Math.min(100, score);
  }

  private scoreOperations(profile: CompanyProfile): number {
    let score = 50;

    // Churn (retention)
    if (profile.metrics.churn <= 0.02) score += 20;
    else if (profile.metrics.churn <= 0.05) score += 10;
    else if (profile.metrics.churn > 0.10) score -= 15;

    // Customer concentration (approximated)
    if (profile.metrics.customers >= 100) score += 15;
    else if (profile.metrics.customers >= 50) score += 10;
    else if (profile.metrics.customers < 10) score -= 10;

    // Recurring revenue model (inferred from industry)
    if (profile.industry.toLowerCase().includes('saas')) score += 15;

    return Math.min(100, Math.max(0, score));
  }

  private scoreTeam(profile: CompanyProfile): number {
    let score = 60;

    // Team size appropriateness
    const revenuePerEmployee = profile.metrics.revenue / Math.max(1, profile.teamSize);
    if (revenuePerEmployee >= 200000) score += 20;
    else if (revenuePerEmployee >= 100000) score += 10;
    else if (revenuePerEmployee < 50000) score -= 10;

    // Team stability (bonus for right-sized team)
    if (profile.teamSize >= 10 && profile.teamSize <= 100) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private scoreMarketPosition(profile: CompanyProfile): number {
    let score = 50;

    // Growth indicates market pull
    if (profile.metrics.growth >= 0.20) score += 20;
    else if (profile.metrics.growth >= 0.10) score += 10;

    // Low churn indicates product-market fit
    if (profile.metrics.churn <= 0.03) score += 15;
    else if (profile.metrics.churn <= 0.05) score += 10;

    // Strong NPS (if available)
    if (profile.metrics.nps && profile.metrics.nps >= 50) score += 15;
    else if (profile.metrics.nps && profile.metrics.nps >= 30) score += 10;

    return Math.min(100, score);
  }

  private scoreTechnology(profile: CompanyProfile): number {
    // Simplified - would need more detailed tech assessment
    let score = 60;

    // Growing companies typically have better tech
    if (profile.metrics.growth >= 0.15) score += 15;
    
    // AI/tech companies get premium
    if (profile.industry.toLowerCase().includes('ai') || profile.industry.toLowerCase().includes('tech')) {
      score += 15;
    }

    return Math.min(100, score);
  }

  private determineReadinessLevel(score: number): MnAReadiness['readiness'] {
    if (score >= 80) return 'ready';
    if (score >= 65) return 'preparing';
    if (score >= 50) return 'early-stage';
    return 'not-ready';
  }

  private assessAttractiveness(profile: CompanyProfile): MnAReadiness['attractiveness'] {
    return [
      {
        factor: 'Revenue Quality',
        score: this.scoreRevenueQuality(profile),
        improvement: profile.metrics.churn > 0.05 
          ? 'Reduce churn to demonstrate sticky revenue'
          : 'Maintain current retention levels',
      },
      {
        factor: 'Growth Trajectory',
        score: Math.min(100, profile.metrics.growth * 400),
        improvement: profile.metrics.growth < 0.15
          ? 'Accelerate growth through new channels or expansion revenue'
          : 'Maintain growth momentum leading up to any transaction',
      },
      {
        factor: 'Market Position',
        score: this.scoreMarketPosition(profile),
        improvement: 'Build demonstrable competitive moat through IP, network effects, or brand',
      },
      {
        factor: 'Operational Efficiency',
        score: this.scoreOperations(profile),
        improvement: profile.metrics.customers < 50
          ? 'Diversify customer base to reduce concentration risk'
          : 'Document and systematize key operations',
      },
      {
        factor: 'Team & Culture',
        score: this.scoreTeam(profile),
        improvement: 'Ensure key employees have retention agreements and clear roles',
      },
    ];
  }

  private scoreRevenueQuality(profile: CompanyProfile): number {
    let score = 50;
    
    // Recurring revenue
    if (profile.metrics.arr || profile.metrics.mrr) score += 25;
    
    // Low churn
    if (profile.metrics.churn <= 0.03) score += 15;
    else if (profile.metrics.churn <= 0.05) score += 10;
    
    // Strong margins
    if (profile.metrics.grossMargin >= 0.75) score += 10;

    return Math.min(100, score);
  }

  private identifyPotentialAcquirers(profile: CompanyProfile): MnAReadiness['potentialAcquirers'] {
    const acquirers: AcquirerProfile[] = [];
    const industry = profile.industry.toLowerCase();

    // Strategic acquirers based on industry
    if (industry.includes('saas') || industry.includes('software')) {
      acquirers.push({
        name: 'Enterprise Software Giants',
        type: 'strategic',
        likelihood: 0.6,
        rationale: 'Looking to acquire point solutions to expand platform capabilities',
        estimatedMultiple: 8,
      });
      acquirers.push({
        name: 'Private Equity Roll-ups',
        type: 'financial',
        likelihood: 0.7,
        rationale: 'Consolidating fragmented software markets',
        estimatedMultiple: 5,
      });
    }

    if (industry.includes('fintech')) {
      acquirers.push({
        name: 'Traditional Financial Institutions',
        type: 'strategic',
        likelihood: 0.5,
        rationale: 'Acquiring technology capabilities rather than building',
        estimatedMultiple: 6,
      });
    }

    if (industry.includes('ai') || industry.includes('ml')) {
      acquirers.push({
        name: 'Big Tech Companies',
        type: 'strategic',
        likelihood: 0.4,
        rationale: 'Acqui-hiring AI talent and acquiring specialized capabilities',
        estimatedMultiple: 12,
      });
    }

    // Generic acquirers
    acquirers.push({
      name: 'Larger Competitors',
      type: 'strategic',
      likelihood: 0.5,
      rationale: 'Eliminating competition and acquiring customer base',
      estimatedMultiple: 4,
    });

    acquirers.push({
      name: 'Growth Equity / PE Firms',
      type: 'financial',
      likelihood: profile.metrics.revenue >= 5000000 ? 0.7 : 0.4,
      rationale: 'Platform investment or add-on to existing portfolio company',
      estimatedMultiple: 5,
    });

    return acquirers.sort((a, b) => b.likelihood - a.likelihood);
  }

  private generatePreparationSteps(profile: CompanyProfile, score: number): string[] {
    const steps: string[] = [];

    // Critical items for everyone
    steps.push('Create comprehensive data room with financials, contracts, and documentation');
    steps.push('Audit financial statements - consider getting reviewed or audited statements');
    
    // Based on specific weaknesses
    if (profile.metrics.churn > 0.05) {
      steps.push('Implement churn reduction initiatives before going to market');
    }

    if (profile.metrics.customers < 50) {
      steps.push('Diversify customer base to reduce concentration risk');
    }

    if (score < 70) {
      steps.push('Formalize key processes and document institutional knowledge');
      steps.push('Ensure all IP is properly assigned to the company');
    }

    // Team-related
    steps.push('Put retention packages in place for key employees');
    steps.push('Clarify org chart and key person dependencies');

    // Legal/compliance
    steps.push('Review and organize all material contracts');
    steps.push('Ensure compliance with all regulations (SOC 2, GDPR, etc.)');
    steps.push('Clean up cap table and resolve any outstanding equity issues');

    // Market positioning
    steps.push('Prepare growth story and strategic vision for potential acquirers');
    steps.push('Build relationships with potential acquirers before formal process');

    return steps;
  }

  private estimateTimeline(readiness: MnAReadiness['readiness']): string {
    switch (readiness) {
      case 'ready':
        return '3-6 months to close if actively marketing';
      case 'preparing':
        return '6-12 months: address gaps then 3-6 month process';
      case 'early-stage':
        return '12-18 months: significant preparation needed';
      case 'not-ready':
        return '18-24+ months: focus on building fundamental business value';
      default:
        return 'Assessment needed';
    }
  }

  private identifyDealbreakers(profile: CompanyProfile): string[] {
    const dealbreakers: string[] = [];

    if (profile.metrics.growth < 0) {
      dealbreakers.push('Declining revenue is a major red flag for most acquirers');
    }

    if (profile.metrics.churn > 0.15) {
      dealbreakers.push('Very high churn signals product-market fit issues');
    }

    if (profile.metrics.customers < 10 && profile.metrics.revenue > 500000) {
      dealbreakers.push('Extreme customer concentration creates acquisition risk');
    }

    if (profile.metrics.grossMargin < 0.40) {
      dealbreakers.push('Low gross margins limit acquirer interest and valuation');
    }

    // Common legal/structural issues
    dealbreakers.push('Unresolved IP ownership or disputes');
    dealbreakers.push('Material litigation or regulatory issues');
    dealbreakers.push('Key person dependency without retention agreements');

    return dealbreakers;
  }

  compareToMarket(profile: CompanyProfile): {
    percentile: number;
    strengths: string[];
    weaknesses: string[];
  } {
    const assessment = this.assess(profile);
    
    // Simplified market comparison
    const percentile = Math.min(95, Math.max(5, assessment.score));
    
    const strengths = assessment.attractiveness
      .filter(a => a.score >= 70)
      .map(a => a.factor);

    const weaknesses = assessment.attractiveness
      .filter(a => a.score < 60)
      .map(a => `${a.factor}: ${a.improvement}`);

    return { percentile, strengths, weaknesses };
  }
}

export const mnaReadinessService = new MnAReadinessService();
