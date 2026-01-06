import type { CompanyProfile, PartnershipOpportunity } from './types';

type PartnershipType = 'distribution' | 'technology' | 'co-marketing' | 'integration' | 'reseller' | 'strategic';

interface PartnerCriteria {
  industries: string[];
  companySize: 'startup' | 'smb' | 'midmarket' | 'enterprise' | 'any';
  partnershipTypes: PartnershipType[];
  minSynergy: number;
}

interface PotentialPartner {
  name: string;
  type: PartnershipType;
  industry: string;
  description: string;
  synergies: string[];
  risks: string[];
  estimatedValue: number;
}

export class PartnershipOpportunityFinder {
  findOpportunities(profile: CompanyProfile, criteria?: Partial<PartnerCriteria>): PartnershipOpportunity[] {
    const partners = this.identifyPotentialPartners(profile, criteria);
    return this.scoreAndRankPartners(profile, partners);
  }

  private identifyPotentialPartners(profile: CompanyProfile, criteria?: Partial<PartnerCriteria>): PotentialPartner[] {
    const partners: PotentialPartner[] = [];
    const industry = profile.industry.toLowerCase();

    // Distribution Partners
    partners.push(...this.findDistributionPartners(profile, industry));
    
    // Technology Partners
    partners.push(...this.findTechnologyPartners(profile, industry));
    
    // Integration Partners
    partners.push(...this.findIntegrationPartners(profile, industry));
    
    // Co-marketing Partners
    partners.push(...this.findComarketingPartners(profile, industry));

    // Filter by criteria if provided
    if (criteria?.partnershipTypes) {
      return partners.filter(p => criteria.partnershipTypes!.includes(p.type));
    }

    return partners;
  }

  private findDistributionPartners(profile: CompanyProfile, industry: string): PotentialPartner[] {
    const partners: PotentialPartner[] = [];

    // Industry-specific distribution partners
    if (industry.includes('saas') || industry.includes('software')) {
      partners.push({
        name: 'AWS Marketplace',
        type: 'distribution',
        industry: 'cloud',
        description: 'List your product on AWS Marketplace for enterprise distribution',
        synergies: [
          'Access to enterprise buyers',
          'Simplified procurement',
          'Usage-based billing integration',
        ],
        risks: [
          'Revenue share (3-15%)',
          'Long approval process',
          'Marketplace competition',
        ],
        estimatedValue: profile.metrics.revenue * 0.3,
      });

      partners.push({
        name: 'Microsoft AppSource',
        type: 'distribution',
        industry: 'enterprise',
        description: 'Distribute through Microsoft\'s business application marketplace',
        synergies: [
          'Microsoft customer base access',
          'Co-sell opportunities',
          'Enterprise credibility',
        ],
        risks: [
          'Microsoft ecosystem lock-in expectations',
          'Certification requirements',
        ],
        estimatedValue: profile.metrics.revenue * 0.25,
      });
    }

    // Agency/Reseller partners
    partners.push({
      name: 'Industry Consultants & Agencies',
      type: 'reseller',
      industry: industry,
      description: 'Partner with consultants who serve your target market',
      synergies: [
        'Trusted advisor relationship with buyers',
        'Implementation support',
        'Ongoing revenue share',
      ],
      risks: [
        'Training and enablement costs',
        'Quality control challenges',
        'Channel conflict with direct sales',
      ],
      estimatedValue: profile.metrics.revenue * 0.4,
    });

    return partners;
  }

  private findTechnologyPartners(profile: CompanyProfile, industry: string): PotentialPartner[] {
    const partners: PotentialPartner[] = [];

    // Complementary technology partners
    partners.push({
      name: 'Complementary SaaS Platforms',
      type: 'technology',
      industry: industry,
      description: 'Build deep integrations with platforms your customers already use',
      synergies: [
        'Shared customer base',
        'Feature differentiation',
        'Joint value proposition',
      ],
      risks: [
        'Development resource commitment',
        'Dependency on partner roadmap',
        'API changes can break integration',
      ],
      estimatedValue: profile.metrics.revenue * 0.2,
    });

    // Data/AI partners
    if (industry.includes('ai') || industry.includes('data')) {
      partners.push({
        name: 'AI/ML Platform Partners',
        type: 'technology',
        industry: 'ai',
        description: 'Partner with AI infrastructure providers for enhanced capabilities',
        synergies: [
          'Access to advanced AI capabilities',
          'Technical credibility',
          'Joint innovation',
        ],
        risks: [
          'Technical dependency',
          'Pricing changes',
          'Competition risk if partner expands scope',
        ],
        estimatedValue: profile.metrics.revenue * 0.15,
      });
    }

    return partners;
  }

  private findIntegrationPartners(profile: CompanyProfile, industry: string): PotentialPartner[] {
    const partners: PotentialPartner[] = [];

    const commonIntegrations = [
      { name: 'Salesforce', category: 'CRM', value: 0.25 },
      { name: 'HubSpot', category: 'Marketing/Sales', value: 0.2 },
      { name: 'Slack', category: 'Communication', value: 0.1 },
      { name: 'Zapier', category: 'Automation', value: 0.15 },
    ];

    for (const integration of commonIntegrations) {
      partners.push({
        name: `${integration.name} Integration`,
        type: 'integration',
        industry: integration.category,
        description: `Build certified integration with ${integration.name}`,
        synergies: [
          `${integration.name} marketplace visibility`,
          'Customer workflow integration',
          'Reduced switching costs',
        ],
        risks: [
          'Development and maintenance costs',
          'API limitations',
          'Certification requirements',
        ],
        estimatedValue: profile.metrics.revenue * integration.value,
      });
    }

    return partners;
  }

  private findComarketingPartners(profile: CompanyProfile, industry: string): PotentialPartner[] {
    return [
      {
        name: 'Industry Media & Publications',
        type: 'co-marketing',
        industry: industry,
        description: 'Partner with industry publications for content and thought leadership',
        synergies: [
          'Audience access',
          'Brand credibility',
          'Content distribution',
        ],
        risks: [
          'Cost of sponsorships',
          'Limited direct attribution',
        ],
        estimatedValue: profile.metrics.revenue * 0.1,
      },
      {
        name: 'Complementary Solution Providers',
        type: 'co-marketing',
        industry: industry,
        description: 'Joint webinars, content, and events with non-competing solutions',
        synergies: [
          'Shared audience costs',
          'Combined value proposition',
          'Lead sharing',
        ],
        risks: [
          'Brand alignment',
          'Lead quality variance',
          'Coordination overhead',
        ],
        estimatedValue: profile.metrics.revenue * 0.12,
      },
    ];
  }

  private scoreAndRankPartners(profile: CompanyProfile, partners: PotentialPartner[]): PartnershipOpportunity[] {
    return partners.map((partner, index) => ({
      id: `partner-${index}`,
      partnerName: partner.name,
      type: partner.type,
      fitScore: this.calculateFitScore(profile, partner),
      potentialValue: partner.estimatedValue,
      synergies: partner.synergies,
      risks: partner.risks,
      approachStrategy: this.generateApproachStrategy(partner),
      dealStructure: this.suggestDealStructure(partner),
    })).sort((a, b) => b.fitScore - a.fitScore);
  }

  private calculateFitScore(profile: CompanyProfile, partner: PotentialPartner): number {
    let score = 60;

    // Value potential
    if (partner.estimatedValue > profile.metrics.revenue * 0.25) score += 15;
    else if (partner.estimatedValue > profile.metrics.revenue * 0.1) score += 10;

    // Risk adjustment
    score -= partner.risks.length * 3;

    // Synergy bonus
    score += Math.min(partner.synergies.length * 5, 20);

    // Type preference based on stage
    if (profile.stage === 'seed' || profile.stage === 'series-a') {
      if (partner.type === 'integration' || partner.type === 'technology') score += 10;
    } else {
      if (partner.type === 'distribution' || partner.type === 'reseller') score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateApproachStrategy(partner: PotentialPartner): string {
    switch (partner.type) {
      case 'distribution':
        return 'Apply to partner program, prepare case studies showing customer success, highlight unique value proposition';
      case 'technology':
        return 'Start with technical integration, demonstrate joint value, propose pilot program';
      case 'integration':
        return 'Build integration first, apply for marketplace listing, pursue co-marketing';
      case 'co-marketing':
        return 'Propose joint content or webinar, offer audience exchange, start with low-commitment collaboration';
      case 'reseller':
        return 'Create partner program with clear economics, provide training and enablement, start with 2-3 pilot partners';
      case 'strategic':
        return 'Executive outreach, propose strategic alignment meeting, develop long-term vision';
      default:
        return 'Research partner thoroughly, identify mutual benefits, propose pilot program';
    }
  }

  private suggestDealStructure(partner: PotentialPartner): string {
    switch (partner.type) {
      case 'distribution':
        return 'Revenue share 15-25%, minimum commitments, exclusive territory options';
      case 'reseller':
        return 'Wholesale discount 30-40%, deal registration protection, tiered partner levels';
      case 'technology':
        return 'Joint development agreement, IP ownership clarity, go-to-market commitment';
      case 'integration':
        return 'API access agreement, co-marketing commitment, customer success alignment';
      case 'co-marketing':
        return 'Lead sharing agreement, content co-creation, shared event costs';
      case 'strategic':
        return 'Strategic investment consideration, board observer rights, preferred vendor status';
      default:
        return 'Standard partnership agreement with clear KPIs and review periods';
    }
  }

  prioritizeOpportunities(opportunities: PartnershipOpportunity[], profile: CompanyProfile): PartnershipOpportunity[] {
    return opportunities
      .map(opp => ({
        ...opp,
        priorityScore: this.calculatePriorityScore(opp, profile),
      }))
      .sort((a, b) => (b as { priorityScore: number }).priorityScore - (a as { priorityScore: number }).priorityScore)
      .slice(0, 5);
  }

  private calculatePriorityScore(opportunity: PartnershipOpportunity, profile: CompanyProfile): number {
    let score = opportunity.fitScore;

    // Prioritize by potential value relative to current revenue
    const valueRatio = opportunity.potentialValue / profile.metrics.revenue;
    if (valueRatio > 0.3) score += 20;
    else if (valueRatio > 0.15) score += 10;

    // Prioritize lower risk opportunities for earlier stage companies
    if (profile.stage === 'seed' || profile.stage === 'pre-seed') {
      score -= opportunity.risks.length * 2;
    }

    // Boost integration partners if growth is strong (can leverage momentum)
    if (profile.metrics.growth > 0.15 && opportunity.type === 'integration') {
      score += 10;
    }

    return score;
  }
}

export const partnershipOpportunityFinder = new PartnershipOpportunityFinder();
