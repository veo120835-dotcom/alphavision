// Cross-Industry Leverage Map - Find insights across industries

import { LeverageInsight } from './types';

interface IndustryConnection {
  source_industry: string;
  target_industry: string;
  connection_strength: number;
  shared_challenges: string[];
  transferable_strategies: string[];
}

interface LeverageOpportunity {
  insight: LeverageInsight;
  applicability_score: number;
  adaptation_required: 'minimal' | 'moderate' | 'significant';
  quick_start_actions: string[];
}

class CrossIndustryLeverageMapService {
  private insights: LeverageInsight[] = [];
  private industryConnections: IndustryConnection[] = [];

  private defaultConnections: IndustryConnection[] = [
    {
      source_industry: 'SaaS',
      target_industry: 'E-commerce',
      connection_strength: 0.7,
      shared_challenges: ['customer acquisition', 'churn reduction', 'pricing optimization'],
      transferable_strategies: ['freemium model', 'email marketing', 'subscription upselling'],
    },
    {
      source_industry: 'E-commerce',
      target_industry: 'SaaS',
      connection_strength: 0.7,
      shared_challenges: ['conversion optimization', 'customer lifetime value', 'retention'],
      transferable_strategies: ['A/B testing culture', 'urgency marketing', 'referral programs'],
    },
    {
      source_industry: 'Consulting',
      target_industry: 'Agency',
      connection_strength: 0.85,
      shared_challenges: ['client acquisition', 'project profitability', 'scaling services'],
      transferable_strategies: ['thought leadership', 'case study marketing', 'retainer models'],
    },
    {
      source_industry: 'FinTech',
      target_industry: 'InsurTech',
      connection_strength: 0.75,
      shared_challenges: ['regulatory compliance', 'trust building', 'digital onboarding'],
      transferable_strategies: ['gamification', 'mobile-first design', 'API partnerships'],
    },
    {
      source_industry: 'Healthcare',
      target_industry: 'Wellness',
      connection_strength: 0.6,
      shared_challenges: ['trust building', 'evidence-based marketing', 'recurring revenue'],
      transferable_strategies: ['outcome tracking', 'community building', 'practitioner partnerships'],
    },
  ];

  constructor() {
    this.industryConnections = [...this.defaultConnections];
    this.initializeDefaultInsights();
  }

  private initializeDefaultInsights(): void {
    this.insights = [
      {
        id: 'insight-1',
        source_industry: 'SaaS',
        applicable_industries: ['E-commerce', 'FinTech', 'EdTech'],
        insight: 'Cohort-based onboarding increases activation by 30-40%',
        leverage_mechanism: 'Social accountability and peer learning accelerate adoption',
        effort_to_apply: 'medium',
        expected_impact: 'significant',
        prerequisites: ['Email automation', 'User tracking'],
        implementation_steps: [
          'Define activation milestones',
          'Group users by signup date',
          'Create cohort-specific onboarding emails',
          'Add community element for cohorts',
          'Track cohort vs individual performance',
        ],
      },
      {
        id: 'insight-2',
        source_industry: 'E-commerce',
        applicable_industries: ['SaaS', 'Marketplace', 'D2C'],
        insight: 'Urgency-based pricing increases conversion by 15-25%',
        leverage_mechanism: 'Scarcity triggers faster decision-making',
        effort_to_apply: 'low',
        expected_impact: 'moderate',
        prerequisites: ['Dynamic pricing capability'],
        implementation_steps: [
          'Identify low-urgency conversion points',
          'Add time-limited offers',
          'Display countdown timers',
          'Track impact on conversion and perceived value',
        ],
      },
      {
        id: 'insight-3',
        source_industry: 'Consulting',
        applicable_industries: ['Agency', 'SaaS', 'Professional Services'],
        insight: 'Productized services increase margins by 40-60%',
        leverage_mechanism: 'Standardization reduces delivery cost while maintaining value perception',
        effort_to_apply: 'high',
        expected_impact: 'transformational',
        prerequisites: ['Documented processes', 'Defined scope templates'],
        implementation_steps: [
          'Analyze most common service requests',
          'Define fixed-scope packages',
          'Create standard deliverables',
          'Set fixed pricing',
          'Build automation where possible',
          'Train team on standardized delivery',
        ],
      },
      {
        id: 'insight-4',
        source_industry: 'FinTech',
        applicable_industries: ['SaaS', 'Marketplace', 'InsurTech'],
        insight: 'Progressive profiling increases form completion by 50%',
        leverage_mechanism: 'Reduced friction at each step maintains momentum',
        effort_to_apply: 'medium',
        expected_impact: 'significant',
        prerequisites: ['User data storage', 'Form builder flexibility'],
        implementation_steps: [
          'Map all data collection points',
          'Prioritize by necessity and timing',
          'Break into micro-forms',
          'Trigger collection at relevant moments',
          'Track completion rates by step',
        ],
      },
    ];
  }

  addInsight(insight: LeverageInsight): void {
    this.insights.push(insight);
  }

  addIndustryConnection(connection: IndustryConnection): void {
    this.industryConnections.push(connection);
  }

  findLeverageOpportunities(
    targetIndustry: string,
    currentChallenges: string[]
  ): LeverageOpportunity[] {
    const opportunities: LeverageOpportunity[] = [];

    const connectedIndustries = this.industryConnections
      .filter(c => c.target_industry.toLowerCase() === targetIndustry.toLowerCase())
      .sort((a, b) => b.connection_strength - a.connection_strength);

    const relevantInsights = this.insights.filter(insight => 
      insight.applicable_industries.some(i => 
        i.toLowerCase() === targetIndustry.toLowerCase()
      )
    );

    relevantInsights.forEach(insight => {
      const connection = connectedIndustries.find(c => 
        c.source_industry.toLowerCase() === insight.source_industry.toLowerCase()
      );

      const challengeOverlap = currentChallenges.filter(challenge =>
        connection?.shared_challenges.some(sc => 
          sc.toLowerCase().includes(challenge.toLowerCase()) ||
          challenge.toLowerCase().includes(sc.toLowerCase())
        )
      );

      const applicabilityScore = this.calculateApplicability(
        insight,
        connection?.connection_strength || 0.5,
        challengeOverlap.length
      );

      opportunities.push({
        insight,
        applicability_score: applicabilityScore,
        adaptation_required: this.determineAdaptation(insight, connection),
        quick_start_actions: insight.implementation_steps.slice(0, 2),
      });
    });

    return opportunities.sort((a, b) => b.applicability_score - a.applicability_score);
  }

  private calculateApplicability(
    insight: LeverageInsight,
    connectionStrength: number,
    challengeOverlapCount: number
  ): number {
    const effortMultiplier = { low: 1.2, medium: 1.0, high: 0.8 }[insight.effort_to_apply];
    const impactMultiplier = { minor: 0.5, moderate: 0.75, significant: 1.0, transformational: 1.25 }[insight.expected_impact];
    const overlapBonus = challengeOverlapCount * 10;

    return Math.min(100, (connectionStrength * 50 * effortMultiplier * impactMultiplier) + overlapBonus);
  }

  private determineAdaptation(
    insight: LeverageInsight,
    connection?: IndustryConnection
  ): 'minimal' | 'moderate' | 'significant' {
    if (!connection) return 'significant';

    if (connection.connection_strength >= 0.8) return 'minimal';
    if (connection.connection_strength >= 0.6) return 'moderate';
    return 'significant';
  }

  getInsightsBySourceIndustry(industry: string): LeverageInsight[] {
    return this.insights.filter(i => 
      i.source_industry.toLowerCase() === industry.toLowerCase()
    );
  }

  getIndustryConnections(industry: string): IndustryConnection[] {
    return this.industryConnections.filter(c =>
      c.source_industry.toLowerCase() === industry.toLowerCase() ||
      c.target_industry.toLowerCase() === industry.toLowerCase()
    );
  }

  getTransferableStrategies(sourceIndustry: string, targetIndustry: string): string[] {
    const connection = this.industryConnections.find(c =>
      c.source_industry.toLowerCase() === sourceIndustry.toLowerCase() &&
      c.target_industry.toLowerCase() === targetIndustry.toLowerCase()
    );

    return connection?.transferable_strategies || [];
  }
}

export const crossIndustryLeverageMapService = new CrossIndustryLeverageMapService();
