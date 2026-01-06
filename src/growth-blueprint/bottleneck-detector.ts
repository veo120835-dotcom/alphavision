import type { BusinessIntake, Bottleneck, BottleneckCategory, BusinessStage } from './types';

interface BottleneckRule {
  id: string;
  category: BottleneckCategory;
  condition: (intake: BusinessIntake, stage: BusinessStage) => boolean;
  severity: (intake: BusinessIntake) => 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impactMultiplier: number;
  getEvidence: (intake: BusinessIntake) => string[];
  getActions: (intake: BusinessIntake, stage: BusinessStage) => string[];
}

const BOTTLENECK_RULES: BottleneckRule[] = [
  {
    id: 'low_leads',
    category: 'lead_generation',
    condition: (i, s) => s !== 'idea' && i.customer_count < 50 && i.main_challenges.includes('Not enough leads'),
    severity: (i) => i.revenue_trend === 'declining' ? 'critical' : 'high',
    title: 'Lead Generation Bottleneck',
    description: 'Your business is not generating enough qualified leads to sustain growth.',
    impactMultiplier: 0.9,
    getEvidence: (i) => [
      `Current customer count: ${i.customer_count}`,
      `Primary channel: ${i.primary_channel}`,
      'User identified lead generation as a challenge',
    ],
    getActions: (i) => [
      'Audit current acquisition channel performance',
      'Test 2-3 new acquisition channels',
      'Implement lead magnet strategy',
      `Optimize ${i.primary_channel} channel`,
    ],
  },
  {
    id: 'low_conversion',
    category: 'sales_conversion',
    condition: (i) => i.main_challenges.includes('Low conversion rates'),
    severity: (i) => i.revenue_trend === 'declining' ? 'critical' : 'high',
    title: 'Sales Conversion Bottleneck',
    description: 'Leads are not converting to customers at an acceptable rate.',
    impactMultiplier: 0.85,
    getEvidence: () => [
      'User identified low conversion as a challenge',
      'Indicates potential offer or sales process issues',
    ],
    getActions: (i, s) => {
      const actions = [
        'Review and optimize sales messaging',
        'Analyze drop-off points in sales process',
        'Test new pricing or offer structures',
      ];
      if (s === 'early') actions.push('Conduct customer interviews to understand objections');
      return actions;
    },
  },
  {
    id: 'high_churn',
    category: 'retention',
    condition: (i) => (i.churn_rate !== undefined && i.churn_rate > 8) || i.main_challenges.includes('High churn'),
    severity: (i) => (i.churn_rate && i.churn_rate > 15) ? 'critical' : 'high',
    title: 'Customer Retention Bottleneck',
    description: 'Too many customers are leaving, undermining growth efforts.',
    impactMultiplier: 0.95,
    getEvidence: (i) => {
      const evidence = ['User identified churn as a challenge'];
      if (i.churn_rate) evidence.push(`Current churn rate: ${i.churn_rate}%`);
      return evidence;
    },
    getActions: () => [
      'Implement churn prediction system',
      'Create customer success program',
      'Analyze churned customer patterns',
      'Improve onboarding experience',
    ],
  },
  {
    id: 'cash_crisis',
    category: 'capital',
    condition: (i) => (i.cash_runway_months !== undefined && i.cash_runway_months < 6) || i.main_challenges.includes('Cash flow'),
    severity: (i) => (i.cash_runway_months && i.cash_runway_months < 3) ? 'critical' : 'high',
    title: 'Capital & Cash Flow Bottleneck',
    description: 'Limited runway is constraining growth and creating existential risk.',
    impactMultiplier: 1.0,
    getEvidence: (i) => {
      const evidence = [];
      if (i.cash_runway_months) evidence.push(`Cash runway: ${i.cash_runway_months} months`);
      evidence.push('Financial constraints limiting strategic options');
      return evidence;
    },
    getActions: (i, s) => {
      const actions = [
        'Cut non-essential expenses immediately',
        'Accelerate receivables collection',
        'Explore bridge financing options',
      ];
      if (s === 'growth' || s === 'scaling') {
        actions.push('Prepare fundraising materials');
      }
      return actions;
    },
  },
  {
    id: 'team_constraint',
    category: 'team',
    condition: (i) => i.main_challenges.includes('Hiring/team issues'),
    severity: () => 'medium',
    title: 'Team & Talent Bottleneck',
    description: 'Difficulty hiring or team issues are slowing execution.',
    impactMultiplier: 0.7,
    getEvidence: () => [
      'User identified team issues as a challenge',
      'May indicate culture, compensation, or role clarity issues',
    ],
    getActions: (i, s) => {
      const actions = [
        'Document key roles and responsibilities',
        'Review compensation against market rates',
      ];
      if (s === 'growth' || s === 'scaling') {
        actions.push('Implement structured hiring process');
        actions.push('Consider fractional or contract talent');
      }
      return actions;
    },
  },
  {
    id: 'ops_chaos',
    category: 'operations',
    condition: (i) => i.main_challenges.includes('Scaling operations') || i.main_challenges.includes('Time management'),
    severity: (i) => i.team_size > 10 ? 'high' : 'medium',
    title: 'Operations Bottleneck',
    description: 'Lack of systems and processes is creating chaos and limiting scale.',
    impactMultiplier: 0.65,
    getEvidence: (i) => [
      `Team size: ${i.team_size}`,
      'Operational challenges identified',
      'May indicate founder bottleneck',
    ],
    getActions: () => [
      'Document top 3 repeated processes',
      'Implement project management system',
      'Create delegation framework',
      'Identify automation opportunities',
    ],
  },
  {
    id: 'pmf_missing',
    category: 'product_market_fit',
    condition: (i, s) => s === 'early' && (i.churn_rate === undefined || i.churn_rate > 10) && i.revenue_trend !== 'growing',
    severity: () => 'critical',
    title: 'Product-Market Fit Not Achieved',
    description: 'Signs indicate you haven\'t found true product-market fit yet.',
    impactMultiplier: 1.0,
    getEvidence: (i) => [
      `Revenue trend: ${i.revenue_trend}`,
      i.churn_rate ? `Churn rate: ${i.churn_rate}%` : 'Churn rate unknown',
      'Early stage without clear growth trajectory',
    ],
    getActions: () => [
      'Talk to 10 customers this week',
      'Identify your most successful customer segment',
      'Focus on one use case deeply',
      'Consider pivoting features or positioning',
    ],
  },
  {
    id: 'competition_threat',
    category: 'market_position',
    condition: (i) => i.main_challenges.includes('Competition'),
    severity: () => 'medium',
    title: 'Competitive Pressure',
    description: 'Competition is eroding market position or pricing power.',
    impactMultiplier: 0.6,
    getEvidence: () => [
      'User identified competition as a challenge',
      'May require differentiation strategy',
    ],
    getActions: () => [
      'Map competitor positioning',
      'Identify underserved customer segments',
      'Strengthen unique value proposition',
      'Consider strategic partnerships',
    ],
  },
];

export class BottleneckDetectorService {
  detectBottlenecks(intake: BusinessIntake, stage: BusinessStage): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    for (const rule of BOTTLENECK_RULES) {
      if (rule.condition(intake, stage)) {
        const severity = rule.severity(intake);
        const impactScore = this.calculateImpactScore(severity, rule.impactMultiplier);

        bottlenecks.push({
          id: rule.id,
          category: rule.category,
          severity,
          title: rule.title,
          description: rule.description,
          impact_score: impactScore,
          evidence: rule.getEvidence(intake),
          recommended_actions: rule.getActions(intake, stage),
        });
      }
    }

    // Sort by impact score (highest first)
    return bottlenecks.sort((a, b) => b.impact_score - a.impact_score);
  }

  private calculateImpactScore(severity: string, multiplier: number): number {
    const severityScores = {
      low: 25,
      medium: 50,
      high: 75,
      critical: 100,
    };
    return Math.round(severityScores[severity as keyof typeof severityScores] * multiplier);
  }

  getPrimaryBottleneck(intake: BusinessIntake, stage: BusinessStage): Bottleneck | null {
    const bottlenecks = this.detectBottlenecks(intake, stage);
    return bottlenecks.length > 0 ? bottlenecks[0] : null;
  }

  getCategoryDescription(category: BottleneckCategory): string {
    const descriptions: Record<BottleneckCategory, string> = {
      product_market_fit: 'Product-market fit issues',
      lead_generation: 'Not enough qualified leads',
      sales_conversion: 'Poor lead-to-customer conversion',
      operations: 'Operational inefficiencies',
      team: 'Team and talent constraints',
      capital: 'Cash and funding constraints',
      market_position: 'Competitive positioning issues',
      retention: 'Customer retention problems',
    };
    return descriptions[category];
  }
}

export const bottleneckDetectorService = new BottleneckDetectorService();