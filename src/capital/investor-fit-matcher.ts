import type { CompanyProfile, InvestorProfile, InvestorMatch, InvestorType, FundingStage } from './types';

const SAMPLE_INVESTORS: InvestorProfile[] = [
  {
    id: 'inv-1',
    name: 'Sequoia Capital',
    type: 'vc',
    stages: ['seed', 'series-a', 'series-b'],
    checkSize: { min: 1000000, max: 50000000 },
    industries: ['saas', 'fintech', 'ai', 'consumer'],
    geographies: ['us', 'global'],
    thesisKeywords: ['market leader', 'category creator', 'network effects'],
    portfolioCompanies: ['Stripe', 'Airbnb', 'DoorDash'],
    leadRounds: true,
    boardSeats: true,
    valueAdd: ['recruiting', 'go-to-market', 'strategic planning'],
  },
  {
    id: 'inv-2',
    name: 'Y Combinator',
    type: 'vc',
    stages: ['pre-seed', 'seed'],
    checkSize: { min: 125000, max: 500000 },
    industries: ['saas', 'fintech', 'ai', 'consumer', 'healthtech', 'climate'],
    geographies: ['global'],
    thesisKeywords: ['technical founders', 'fast iteration', 'product-focused'],
    portfolioCompanies: ['Stripe', 'Airbnb', 'Dropbox', 'Coinbase'],
    leadRounds: false,
    boardSeats: false,
    valueAdd: ['network', 'brand', 'demo day'],
  },
  {
    id: 'inv-3',
    name: 'a]6z',
    type: 'vc',
    stages: ['seed', 'series-a', 'series-b', 'growth'],
    checkSize: { min: 2000000, max: 100000000 },
    industries: ['saas', 'fintech', 'ai', 'biotech', 'crypto'],
    geographies: ['us', 'global'],
    thesisKeywords: ['software eating world', 'platform', 'marketplace'],
    portfolioCompanies: ['GitHub', 'Slack', 'Coinbase'],
    leadRounds: true,
    boardSeats: true,
    valueAdd: ['recruiting', 'marketing', 'enterprise sales'],
  },
];

export class InvestorFitMatcher {
  private investors: InvestorProfile[] = SAMPLE_INVESTORS;

  findMatches(profile: CompanyProfile, options?: { minScore?: number; maxResults?: number }): InvestorMatch[] {
    const minScore = options?.minScore ?? 50;
    const maxResults = options?.maxResults ?? 10;

    const matches = this.investors
      .map(investor => this.calculateMatch(profile, investor))
      .filter(match => match.fitScore >= minScore)
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, maxResults);

    return matches;
  }

  private calculateMatch(profile: CompanyProfile, investor: InvestorProfile): InvestorMatch {
    const scores = {
      stage: this.scoreStageMatch(profile.stage, investor.stages),
      industry: this.scoreIndustryMatch(profile.industry, investor.industries),
      checkSize: this.scoreCheckSizeMatch(profile, investor.checkSize),
      thesis: this.scoreThesisMatch(profile, investor.thesisKeywords),
    };

    const fitScore = Math.round(
      scores.stage * 0.30 +
      scores.industry * 0.25 +
      scores.checkSize * 0.20 +
      scores.thesis * 0.25
    );

    const matchReasons = this.generateMatchReasons(profile, investor, scores);
    const concerns = this.identifyConcerns(profile, investor, scores);
    const approachStrategy = this.generateApproachStrategy(profile, investor, fitScore);
    const timing = this.determineTiming(profile, investor);

    return {
      investor,
      fitScore,
      matchReasons,
      concerns,
      approachStrategy,
      timing,
    };
  }

  private scoreStageMatch(companyStage: FundingStage, investorStages: FundingStage[]): number {
    if (investorStages.includes(companyStage)) return 100;

    const stages: FundingStage[] = ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'growth', 'pre-ipo'];
    const companyIndex = stages.indexOf(companyStage);
    
    for (const invStage of investorStages) {
      const invIndex = stages.indexOf(invStage);
      if (Math.abs(companyIndex - invIndex) === 1) return 60;
    }
    
    return 20;
  }

  private scoreIndustryMatch(companyIndustry: string, investorIndustries: string[]): number {
    const normalizedCompany = companyIndustry.toLowerCase();
    
    for (const industry of investorIndustries) {
      if (normalizedCompany.includes(industry) || industry.includes(normalizedCompany)) {
        return 100;
      }
    }

    // Partial match for related industries
    const industryRelations: Record<string, string[]> = {
      'saas': ['software', 'b2b', 'enterprise'],
      'fintech': ['payments', 'banking', 'insurance'],
      'healthtech': ['healthcare', 'medical', 'biotech'],
      'ai': ['ml', 'machine learning', 'artificial intelligence'],
    };

    for (const [key, related] of Object.entries(industryRelations)) {
      if (investorIndustries.includes(key) && related.some(r => normalizedCompany.includes(r))) {
        return 70;
      }
    }

    return 30;
  }

  private scoreCheckSizeMatch(profile: CompanyProfile, checkSize: { min: number; max: number }): number {
    const estimatedRaise = this.estimateRaiseAmount(profile);
    
    if (estimatedRaise >= checkSize.min && estimatedRaise <= checkSize.max) {
      return 100;
    }
    
    if (estimatedRaise < checkSize.min) {
      const ratio = estimatedRaise / checkSize.min;
      return Math.max(30, Math.round(ratio * 100));
    }
    
    if (estimatedRaise > checkSize.max) {
      const ratio = checkSize.max / estimatedRaise;
      return Math.max(30, Math.round(ratio * 100));
    }
    
    return 50;
  }

  private scoreThesisMatch(profile: CompanyProfile, thesisKeywords: string[]): number {
    let matches = 0;
    const profileText = `${profile.productDescription} ${profile.competitiveAdvantage}`.toLowerCase();
    
    for (const keyword of thesisKeywords) {
      if (profileText.includes(keyword.toLowerCase())) {
        matches++;
      }
    }
    
    if (matches === 0) return 40;
    return Math.min(100, 40 + (matches / thesisKeywords.length) * 60);
  }

  private estimateRaiseAmount(profile: CompanyProfile): number {
    const stageMultiples: Record<FundingStage, number> = {
      'pre-seed': 500000,
      'seed': 2000000,
      'series-a': 10000000,
      'series-b': 30000000,
      'series-c': 75000000,
      'growth': 150000000,
      'pre-ipo': 300000000,
    };
    
    return stageMultiples[profile.stage] || 5000000;
  }

  private generateMatchReasons(
    profile: CompanyProfile,
    investor: InvestorProfile,
    scores: Record<string, number>
  ): string[] {
    const reasons: string[] = [];
    
    if (scores.stage === 100) {
      reasons.push(`Actively invests at ${profile.stage} stage`);
    }
    
    if (scores.industry >= 70) {
      reasons.push(`Strong focus on ${profile.industry} sector`);
    }
    
    if (investor.leadRounds) {
      reasons.push('Can lead rounds and set terms');
    }
    
    if (investor.valueAdd.length > 0) {
      reasons.push(`Value-add: ${investor.valueAdd.slice(0, 2).join(', ')}`);
    }
    
    if (investor.portfolioCompanies.length > 0) {
      reasons.push(`Portfolio includes: ${investor.portfolioCompanies.slice(0, 2).join(', ')}`);
    }
    
    return reasons;
  }

  private identifyConcerns(
    profile: CompanyProfile,
    investor: InvestorProfile,
    scores: Record<string, number>
  ): string[] {
    const concerns: string[] = [];
    
    if (scores.stage < 60) {
      concerns.push(`May prefer ${investor.stages.join(' or ')} stage companies`);
    }
    
    if (scores.checkSize < 70) {
      concerns.push(`Check size range ($${(investor.checkSize.min / 1000000).toFixed(1)}M-$${(investor.checkSize.max / 1000000).toFixed(1)}M) may not align`);
    }
    
    if (scores.industry < 50) {
      concerns.push('Industry focus may not be a core thesis area');
    }
    
    if (investor.boardSeats && profile.stage === 'seed') {
      concerns.push('May want board seat which is early for your stage');
    }
    
    return concerns;
  }

  private generateApproachStrategy(
    profile: CompanyProfile,
    investor: InvestorProfile,
    fitScore: number
  ): string {
    if (fitScore >= 80) {
      return `Strong fit. Lead with your traction metrics and ${profile.competitiveAdvantage}. Request warm intro through portfolio founders.`;
    }
    
    if (fitScore >= 60) {
      return `Good fit with some gaps. Emphasize alignment with their thesis. Consider reaching out after achieving next milestone.`;
    }
    
    return `Moderate fit. Build relationship before pitching. Engage through content or events first.`;
  }

  private determineTiming(profile: CompanyProfile, investor: InvestorProfile): 'now' | 'soon' | 'later' {
    if (investor.stages.includes(profile.stage)) {
      if (profile.metrics.growth >= 0.10 && profile.metrics.runway && profile.metrics.runway >= 6) {
        return 'now';
      }
      return 'soon';
    }
    return 'later';
  }

  addCustomInvestor(investor: InvestorProfile): void {
    this.investors.push(investor);
  }

  filterByType(type: InvestorType): InvestorProfile[] {
    return this.investors.filter(inv => inv.type === type);
  }

  filterByStage(stage: FundingStage): InvestorProfile[] {
    return this.investors.filter(inv => inv.stages.includes(stage));
  }
}

export const investorFitMatcher = new InvestorFitMatcher();
