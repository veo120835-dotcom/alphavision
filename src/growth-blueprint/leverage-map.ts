import type { BusinessIntake, LeveragePoint, LeverageType, BusinessStage, Bottleneck } from './types';

interface LeverageOpportunity {
  id: string;
  type: LeverageType;
  applicableStages: BusinessStage[];
  applicableBottlenecks: string[];
  condition: (intake: BusinessIntake) => boolean;
  title: string;
  description: string;
  impactPotential: (intake: BusinessIntake) => number;
  effort: 'low' | 'medium' | 'high';
  timeToImpact: number; // days
  dependencies: string[];
  resources: (intake: BusinessIntake) => string[];
}

const LEVERAGE_OPPORTUNITIES: LeverageOpportunity[] = [
  // Quick Wins
  {
    id: 'price_increase',
    type: 'quick_win',
    applicableStages: ['early', 'growth', 'scaling'],
    applicableBottlenecks: ['cash_crisis', 'low_conversion'],
    condition: () => true,
    title: 'Price Optimization',
    description: 'Test 20-50% price increase with new customers',
    impactPotential: (i) => i.customer_count > 50 ? 85 : 70,
    effort: 'low',
    timeToImpact: 7,
    dependencies: [],
    resources: () => ['Pricing strategy document', 'A/B testing tool'],
  },
  {
    id: 'reactivation_campaign',
    type: 'quick_win',
    applicableStages: ['growth', 'scaling', 'mature'],
    applicableBottlenecks: ['high_churn', 'low_leads'],
    condition: (i) => i.customer_count > 20,
    title: 'Customer Reactivation Campaign',
    description: 'Win back churned customers with targeted offers',
    impactPotential: () => 65,
    effort: 'low',
    timeToImpact: 14,
    dependencies: ['Customer list with emails'],
    resources: () => ['Email marketing tool', 'Win-back offer'],
  },
  {
    id: 'referral_program',
    type: 'quick_win',
    applicableStages: ['early', 'growth', 'scaling'],
    applicableBottlenecks: ['low_leads'],
    condition: (i) => i.customer_count > 10,
    title: 'Launch Referral Program',
    description: 'Turn happy customers into acquisition channel',
    impactPotential: () => 70,
    effort: 'medium',
    timeToImpact: 21,
    dependencies: ['Customer satisfaction measurement'],
    resources: () => ['Referral tracking system', 'Incentive structure'],
  },
  
  // Strategic
  {
    id: 'channel_expansion',
    type: 'strategic',
    applicableStages: ['growth', 'scaling'],
    applicableBottlenecks: ['low_leads'],
    condition: () => true,
    title: 'New Acquisition Channel',
    description: 'Add second scalable acquisition channel',
    impactPotential: () => 80,
    effort: 'high',
    timeToImpact: 60,
    dependencies: ['Primary channel at capacity'],
    resources: (i) => [
      'Budget for testing',
      i.primary_channel === 'paid_ads' ? 'Content marketing resources' : 'Paid ads budget',
    ],
  },
  {
    id: 'upsell_path',
    type: 'strategic',
    applicableStages: ['growth', 'scaling', 'mature'],
    applicableBottlenecks: ['low_conversion', 'high_churn'],
    condition: (i) => i.customer_count > 30,
    title: 'Create Upsell/Cross-sell Path',
    description: 'Increase revenue per customer through additional offerings',
    impactPotential: (i) => i.business_model === 'saas' ? 85 : 70,
    effort: 'medium',
    timeToImpact: 45,
    dependencies: ['Core product stable'],
    resources: () => ['Product expansion plan', 'Pricing tiers'],
  },
  {
    id: 'partnership_channel',
    type: 'strategic',
    applicableStages: ['growth', 'scaling', 'mature'],
    applicableBottlenecks: ['low_leads', 'competition_threat'],
    condition: (i) => i.revenue_monthly > 20000,
    title: 'Strategic Partnerships',
    description: 'Build partnership channel for distribution',
    impactPotential: () => 75,
    effort: 'high',
    timeToImpact: 90,
    dependencies: ['Clear partner value proposition'],
    resources: () => ['Partner program materials', 'Partner success resources'],
  },

  // Foundational
  {
    id: 'sales_process',
    type: 'foundational',
    applicableStages: ['early', 'growth'],
    applicableBottlenecks: ['low_conversion', 'pmf_missing'],
    condition: () => true,
    title: 'Systematize Sales Process',
    description: 'Document and optimize repeatable sales process',
    impactPotential: () => 80,
    effort: 'medium',
    timeToImpact: 30,
    dependencies: [],
    resources: () => ['CRM system', 'Sales playbook template'],
  },
  {
    id: 'onboarding_optimization',
    type: 'foundational',
    applicableStages: ['early', 'growth', 'scaling'],
    applicableBottlenecks: ['high_churn', 'low_conversion'],
    condition: () => true,
    title: 'Optimize Customer Onboarding',
    description: 'Reduce time-to-value for new customers',
    impactPotential: () => 75,
    effort: 'medium',
    timeToImpact: 45,
    dependencies: ['Customer journey mapped'],
    resources: () => ['Onboarding automation', 'Success metrics'],
  },
  {
    id: 'hire_key_role',
    type: 'foundational',
    applicableStages: ['growth', 'scaling'],
    applicableBottlenecks: ['team_constraint', 'ops_chaos'],
    condition: (i) => i.team_size > 3,
    title: 'Hire Key Leverage Role',
    description: 'Add role that unblocks founder and enables scale',
    impactPotential: () => 85,
    effort: 'high',
    timeToImpact: 60,
    dependencies: ['Role definition', 'Budget allocation'],
    resources: () => ['Job description', 'Hiring process', 'Onboarding plan'],
  },

  // Moonshots
  {
    id: 'new_market',
    type: 'moonshot',
    applicableStages: ['scaling', 'mature'],
    applicableBottlenecks: ['competition_threat'],
    condition: (i) => i.revenue_monthly > 100000,
    title: 'Enter Adjacent Market',
    description: 'Expand to new customer segment or geography',
    impactPotential: () => 90,
    effort: 'high',
    timeToImpact: 180,
    dependencies: ['Core market dominance', 'Resources for expansion'],
    resources: () => ['Market research', 'Local expertise', 'Expansion budget'],
  },
  {
    id: 'product_line_expansion',
    type: 'moonshot',
    applicableStages: ['scaling', 'mature'],
    applicableBottlenecks: [],
    condition: (i) => i.revenue_monthly > 50000,
    title: 'Launch New Product Line',
    description: 'Create new revenue stream with complementary product',
    impactPotential: () => 85,
    effort: 'high',
    timeToImpact: 120,
    dependencies: ['Strong core product', 'Customer insights'],
    resources: () => ['Product development team', 'Launch budget'],
  },
];

export class LeverageMapService {
  identifyLeveragePoints(
    intake: BusinessIntake,
    stage: BusinessStage,
    bottlenecks: Bottleneck[]
  ): LeveragePoint[] {
    const bottleneckIds = bottlenecks.map(b => b.id);
    const leveragePoints: LeveragePoint[] = [];

    for (const opp of LEVERAGE_OPPORTUNITIES) {
      // Check if applicable to current stage
      if (!opp.applicableStages.includes(stage)) continue;

      // Check condition
      if (!opp.condition(intake)) continue;

      // Calculate relevance based on bottleneck match
      const bottleneckRelevance = opp.applicableBottlenecks.length === 0 
        ? 0.5 
        : opp.applicableBottlenecks.some(b => bottleneckIds.includes(b)) ? 1 : 0.3;

      if (bottleneckRelevance < 0.3) continue;

      const impactPotential = Math.round(opp.impactPotential(intake) * bottleneckRelevance);

      leveragePoints.push({
        id: opp.id,
        type: opp.type,
        title: opp.title,
        description: opp.description,
        impact_potential: impactPotential,
        effort_required: opp.effort,
        time_to_impact_days: opp.timeToImpact,
        dependencies: opp.dependencies,
        resources_needed: opp.resources(intake),
      });
    }

    // Sort by impact potential / effort ratio
    const effortMultiplier = { low: 3, medium: 2, high: 1 };
    return leveragePoints.sort((a, b) => {
      const aScore = a.impact_potential * effortMultiplier[a.effort_required];
      const bScore = b.impact_potential * effortMultiplier[b.effort_required];
      return bScore - aScore;
    });
  }

  getTypeDescription(type: LeverageType): string {
    const descriptions: Record<LeverageType, string> = {
      quick_win: 'Immediate impact with minimal effort',
      strategic: 'Medium-term plays that compound',
      foundational: 'Investments that enable future growth',
      moonshot: 'High-risk, high-reward opportunities',
    };
    return descriptions[type];
  }

  getTypeIcon(type: LeverageType): string {
    const icons: Record<LeverageType, string> = {
      quick_win: '⚡',
      strategic: '🎯',
      foundational: '🏗️',
      moonshot: '🚀',
    };
    return icons[type];
  }
}

export const leverageMapService = new LeverageMapService();