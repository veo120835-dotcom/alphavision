import type { BusinessIntake, BusinessStage, KPITarget, GrowthRoadmap } from './types';

interface KPIDefinition {
  metric: string;
  applicableStages: BusinessStage[];
  getCurrentValue: (intake: BusinessIntake) => number;
  getTargetValue: (intake: BusinessIntake, stage: BusinessStage) => number;
  getLeadingIndicators: (intake: BusinessIntake) => string[];
  trackingFrequency: 'daily' | 'weekly' | 'monthly';
}

const KPI_DEFINITIONS: KPIDefinition[] = [
  {
    metric: 'Monthly Recurring Revenue',
    applicableStages: ['early', 'growth', 'scaling', 'mature'],
    getCurrentValue: (i) => i.revenue_monthly,
    getTargetValue: (i, s) => {
      const multipliers = { early: 2, growth: 1.5, scaling: 1.3, mature: 1.1, idea: 1 };
      return Math.round(i.revenue_monthly * multipliers[s]);
    },
    getLeadingIndicators: () => ['New deals in pipeline', 'Qualified leads', 'Demo bookings'],
    trackingFrequency: 'weekly',
  },
  {
    metric: 'Customer Count',
    applicableStages: ['idea', 'early', 'growth'],
    getCurrentValue: (i) => i.customer_count,
    getTargetValue: (i, s) => {
      const multipliers = { idea: 10, early: 2, growth: 1.5, scaling: 1.3, mature: 1.1 };
      return Math.round(i.customer_count * multipliers[s]);
    },
    getLeadingIndicators: () => ['Trial signups', 'Demo requests', 'Inbound inquiries'],
    trackingFrequency: 'weekly',
  },
  {
    metric: 'Monthly Churn Rate (%)',
    applicableStages: ['early', 'growth', 'scaling', 'mature'],
    getCurrentValue: (i) => i.churn_rate || 10,
    getTargetValue: (i) => {
      const current = i.churn_rate || 10;
      return Math.max(2, Math.round(current * 0.7));
    },
    getLeadingIndicators: () => ['NPS score', 'Support tickets', 'Feature usage', 'Login frequency'],
    trackingFrequency: 'monthly',
  },
  {
    metric: 'Revenue Per Employee',
    applicableStages: ['growth', 'scaling', 'mature'],
    getCurrentValue: (i) => Math.round(i.revenue_monthly / i.team_size),
    getTargetValue: (i) => Math.round((i.revenue_monthly / i.team_size) * 1.3),
    getLeadingIndicators: () => ['Productivity metrics', 'Process efficiency', 'Automation coverage'],
    trackingFrequency: 'monthly',
  },
  {
    metric: 'Lead-to-Customer Conversion Rate (%)',
    applicableStages: ['early', 'growth', 'scaling'],
    getCurrentValue: () => 10, // Assumed baseline
    getTargetValue: () => 15,
    getLeadingIndicators: () => ['Demo-to-close rate', 'Sales cycle length', 'Proposal acceptance'],
    trackingFrequency: 'weekly',
  },
  {
    metric: 'Customer Acquisition Cost',
    applicableStages: ['growth', 'scaling', 'mature'],
    getCurrentValue: (i) => Math.round(i.revenue_monthly * 0.3), // Estimated
    getTargetValue: (i) => Math.round(i.revenue_monthly * 0.2),
    getLeadingIndicators: () => ['Cost per lead', 'Sales efficiency', 'Channel performance'],
    trackingFrequency: 'monthly',
  },
  {
    metric: 'Net Promoter Score',
    applicableStages: ['early', 'growth', 'scaling', 'mature'],
    getCurrentValue: () => 30, // Assumed baseline
    getTargetValue: () => 50,
    getLeadingIndicators: () => ['Customer satisfaction surveys', 'Referral rate', 'Reviews'],
    trackingFrequency: 'monthly',
  },
  {
    metric: 'Cash Runway (Months)',
    applicableStages: ['idea', 'early', 'growth'],
    getCurrentValue: (i) => i.cash_runway_months || 6,
    getTargetValue: (i) => Math.max(12, (i.cash_runway_months || 6) + 6),
    getLeadingIndicators: () => ['Burn rate', 'Revenue growth', 'Receivables'],
    trackingFrequency: 'monthly',
  },
];

export class KPITargetSetter {
  /**
   * Generate KPI targets for a 90-day period
   */
  generateTargets(intake: BusinessIntake, stage: BusinessStage): KPITarget[] {
    const targets: KPITarget[] = [];
    const targetDate = this.getTargetDate(90);

    for (const def of KPI_DEFINITIONS) {
      if (!def.applicableStages.includes(stage)) continue;

      const currentValue = def.getCurrentValue(intake);
      const targetValue = def.getTargetValue(intake, stage);

      // Only include if there's a meaningful target
      if (targetValue > currentValue || def.metric.includes('Churn') || def.metric.includes('Cost')) {
        targets.push({
          metric: def.metric,
          current_value: currentValue,
          target_value: targetValue,
          target_date: targetDate,
          tracking_frequency: def.trackingFrequency,
          leading_indicators: def.getLeadingIndicators(intake),
        });
      }
    }

    return targets;
  }

  /**
   * Generate North Star metric for the stage
   */
  getNorthStarMetric(stage: BusinessStage): { metric: string; description: string } {
    const northStars: Record<BusinessStage, { metric: string; description: string }> = {
      idea: {
        metric: 'First 10 Paying Customers',
        description: 'Validate that people will pay for your solution',
      },
      early: {
        metric: 'Monthly Recurring Revenue',
        description: 'Prove repeatable revenue generation',
      },
      growth: {
        metric: 'Net Revenue Retention',
        description: 'Revenue from existing customers should grow',
      },
      scaling: {
        metric: 'Revenue Per Employee',
        description: 'Efficiency must scale with growth',
      },
      mature: {
        metric: 'Total Addressable Market Captured',
        description: 'Market share and expansion metrics',
      },
    };
    return northStars[stage];
  }

  /**
   * Calculate if current trajectory will hit targets
   */
  projectTrajectory(
    intake: BusinessIntake,
    targets: KPITarget[]
  ): Array<{ metric: string; projected: number; target: number; onTrack: boolean }> {
    return targets.map(target => {
      // Simple projection based on current trend
      let growthRate = 1;
      if (intake.revenue_trend === 'growing') growthRate = 1.1;
      else if (intake.revenue_trend === 'declining') growthRate = 0.9;

      // Project 3 months
      const projected = Math.round(target.current_value * Math.pow(growthRate, 3));
      const isChurnOrCost = target.metric.includes('Churn') || target.metric.includes('Cost');
      const onTrack = isChurnOrCost 
        ? projected <= target.target_value 
        : projected >= target.target_value;

      return {
        metric: target.metric,
        projected,
        target: target.target_value,
        onTrack,
      };
    });
  }

  /**
   * Get recommended weekly check-in metrics
   */
  getWeeklyMetrics(targets: KPITarget[]): KPITarget[] {
    return targets.filter(t => t.tracking_frequency === 'weekly' || t.tracking_frequency === 'daily');
  }

  /**
   * Calculate overall health score based on trajectory
   */
  calculateHealthScore(
    trajectories: Array<{ onTrack: boolean }>
  ): { score: number; status: 'healthy' | 'warning' | 'critical' } {
    const onTrackCount = trajectories.filter(t => t.onTrack).length;
    const total = trajectories.length;
    const percentage = total > 0 ? (onTrackCount / total) * 100 : 50;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (percentage < 50) status = 'critical';
    else if (percentage < 75) status = 'warning';

    return { score: Math.round(percentage), status };
  }

  private getTargetDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }
}

export const kpiTargetSetter = new KPITargetSetter();