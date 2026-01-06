import type { BusinessContext, ReferralProgram, IncentiveStructure, ReferralMechanics, TrackingConfig } from './types';

type ReferralType = 'customer' | 'partner' | 'affiliate';

export class ReferralEngine {
  designProgram(context: BusinessContext, type: ReferralType = 'customer'): ReferralProgram {
    const incentiveStructure = this.designIncentives(context, type);
    const mechanics = this.defineMechanics(context, type);
    const tracking = this.setupTracking(type);
    const projectedImpact = this.projectImpact(context, type, incentiveStructure);

    return {
      type,
      incentiveStructure,
      mechanics,
      tracking,
      projectedImpact,
    };
  }

  private designIncentives(context: BusinessContext, type: ReferralType): IncentiveStructure {
    switch (type) {
      case 'customer':
        return this.designCustomerIncentives(context);
      case 'partner':
        return this.designPartnerIncentives(context);
      case 'affiliate':
        return this.designAffiliateIncentives(context);
    }
  }

  private designCustomerIncentives(context: BusinessContext): IncentiveStructure {
    // Incentive value typically 10-25% of first year value
    const incentiveValue = Math.round(context.averageDealSize * 0.15);
    const isB2B = context.targetMarket === 'b2b';

    if (isB2B && context.averageDealSize > 10000) {
      // High-value B2B: account credits or cash
      return {
        referrerReward: { type: 'account_credit', value: incentiveValue },
        refereeReward: { type: 'discount', value: 0.10 }, // 10% discount
        tiers: [
          { threshold: 3, bonus: incentiveValue * 0.5 },
          { threshold: 5, bonus: incentiveValue },
          { threshold: 10, bonus: incentiveValue * 2 },
        ],
      };
    }

    if (isB2B) {
      // Mid-market B2B
      return {
        referrerReward: { type: 'account_credit', value: Math.min(incentiveValue, 500) },
        refereeReward: { type: 'extended_trial', value: 30 }, // 30 extra days
        tiers: [
          { threshold: 5, bonus: 250 },
          { threshold: 10, bonus: 500 },
        ],
      };
    }

    // B2C or low-value
    return {
      referrerReward: { type: 'account_credit', value: Math.min(incentiveValue, 50) },
      refereeReward: { type: 'discount', value: 0.15 }, // 15% off first purchase
      tiers: [
        { threshold: 5, bonus: 25 },
        { threshold: 10, bonus: 75 },
        { threshold: 25, bonus: 200 },
      ],
    };
  }

  private designPartnerIncentives(context: BusinessContext): IncentiveStructure {
    // Partners get recurring revenue share
    const revenueShare = context.averageDealSize > 10000 ? 0.15 : 0.20;

    return {
      referrerReward: { type: 'revenue_share', value: revenueShare },
      refereeReward: { type: 'discount', value: 0.10 },
      tiers: [
        { threshold: 5, bonus: 0.02 }, // +2% revenue share
        { threshold: 10, bonus: 0.05 }, // +5% revenue share
        { threshold: 25, bonus: 0.08 }, // +8% revenue share
      ],
    };
  }

  private designAffiliateIncentives(context: BusinessContext): IncentiveStructure {
    // Affiliates get one-time commissions
    const commission = context.averageDealSize > 1000 
      ? Math.min(context.averageDealSize * 0.20, 500)
      : context.averageDealSize * 0.25;

    return {
      referrerReward: { type: 'commission', value: commission },
      refereeReward: { type: 'discount', value: 0.10 },
      tiers: [
        { threshold: 10, bonus: commission * 0.1 },
        { threshold: 25, bonus: commission * 0.15 },
        { threshold: 50, bonus: commission * 0.20 },
      ],
    };
  }

  private defineMechanics(context: BusinessContext, type: ReferralType): ReferralMechanics {
    const isB2B = context.targetMarket === 'b2b';

    return {
      triggerPoints: this.defineTriggerPoints(type, isB2B),
      sharingMethods: this.defineSharingMethods(type, isB2B),
      conversionFlow: this.defineConversionFlow(context, type),
      qualificationCriteria: this.defineQualificationCriteria(context, type),
    };
  }

  private defineTriggerPoints(type: ReferralType, isB2B: boolean): string[] {
    const commonTriggers = [
      'Post-purchase/subscription confirmation',
      'After positive support interaction',
      'At value milestone (first success)',
      'During NPS survey (promoters only)',
    ];

    if (type === 'customer') {
      return [
        ...commonTriggers,
        'Account anniversary',
        'After upsell/expansion',
        isB2B ? 'After successful implementation' : 'After repeat purchase',
      ];
    }

    if (type === 'partner') {
      return [
        'Partner onboarding complete',
        'After first successful referral',
        'Quarterly partner review',
        'Partner event/webinar',
      ];
    }

    // Affiliate
    return [
      'Affiliate signup confirmation',
      'First conversion achieved',
      'Monthly performance email',
      'New product/feature launch',
    ];
  }

  private defineSharingMethods(type: ReferralType, isB2B: boolean): string[] {
    if (type === 'customer') {
      return isB2B
        ? [
            'Unique referral link',
            'Email introduction template',
            'LinkedIn sharing',
            'Personal referral code',
          ]
        : [
            'Unique referral link',
            'Social media sharing (Twitter, Facebook, Instagram)',
            'Email invite',
            'SMS/WhatsApp sharing',
            'In-app referral widget',
          ];
    }

    if (type === 'partner') {
      return [
        'Partner portal referral submission',
        'Co-branded landing pages',
        'Warm introduction process',
        'Partner referral link',
      ];
    }

    // Affiliate
    return [
      'Unique affiliate links',
      'Banner/creative assets',
      'Content templates',
      'API for custom integration',
    ];
  }

  private defineConversionFlow(context: BusinessContext, type: ReferralType): string {
    const isHighTouch = context.averageDealSize > 10000;

    if (type === 'customer') {
      return isHighTouch
        ? 'Referral link → Landing page → Demo request → Sales qualifies → Deal closes → Reward issued'
        : 'Referral link → Signup/trial → Conversion → Reward auto-issued';
    }

    if (type === 'partner') {
      return 'Partner submits referral → Sales validates → Deal registered → Sales process → Close → Commission calculated';
    }

    // Affiliate
    return 'Affiliate link click → Cookie set (30-90 days) → Signup → Conversion → Commission issued';
  }

  private defineQualificationCriteria(context: BusinessContext, type: ReferralType): string[] {
    const criteria: string[] = [
      'New customer (not existing or churned)',
      'Valid contact information',
      'Within attribution window',
    ];

    if (type === 'customer') {
      criteria.push(
        'Referred customer completes first payment',
        'Referrer account in good standing',
        context.averageDealSize > 5000 ? 'Minimum contract value requirement' : 'Completes trial or first purchase',
      );
    }

    if (type === 'partner') {
      criteria.push(
        'Partner registered and active',
        'No duplicate submissions',
        'Customer not already in pipeline',
        'Follows deal registration rules',
      );
    }

    if (type === 'affiliate') {
      criteria.push(
        'Valid affiliate agreement',
        'Complies with marketing guidelines',
        'No self-referrals',
        'Traffic from approved sources',
      );
    }

    return criteria;
  }

  private setupTracking(type: ReferralType): TrackingConfig {
    return {
      attribution: this.defineAttribution(type),
      metrics: this.defineMetrics(type),
      reporting: this.defineReporting(type),
    };
  }

  private defineAttribution(type: ReferralType): string {
    switch (type) {
      case 'customer':
        return 'First-touch: referral link click → 30-day cookie → conversion tracking';
      case 'partner':
        return 'Deal registration: partner submits lead → manual attribution by sales → 90-day window';
      case 'affiliate':
        return 'First-touch with 60-day cookie window → last-click fallback';
    }
  }

  private defineMetrics(type: ReferralType): string[] {
    const commonMetrics = [
      'Total referrals submitted',
      'Referral conversion rate',
      'Revenue from referrals',
      'Cost per acquisition (referral)',
    ];

    if (type === 'customer') {
      return [
        ...commonMetrics,
        'Active referrers (customers who refer)',
        'Referral participation rate',
        'Average referrals per referrer',
        'Referred customer LTV vs. average',
      ];
    }

    if (type === 'partner') {
      return [
        ...commonMetrics,
        'Active partners',
        'Revenue per partner',
        'Partner-sourced pipeline',
        'Partner deal close rate',
      ];
    }

    return [
      ...commonMetrics,
      'Active affiliates',
      'Earnings per click (EPC)',
      'Commission payout total',
      'Top affiliate performance',
    ];
  }

  private defineReporting(type: ReferralType): string {
    switch (type) {
      case 'customer':
        return 'Real-time dashboard for users showing referrals and rewards + monthly internal report';
      case 'partner':
        return 'Partner portal with pipeline visibility + quarterly business reviews + automated commission statements';
      case 'affiliate':
        return 'Affiliate dashboard with real-time stats + monthly payment reports + performance benchmarks';
    }
  }

  private projectImpact(context: BusinessContext, type: ReferralType, incentives: IncentiveStructure): number {
    // Estimate annual revenue impact from referral program
    const baseCustomers = context.budget / context.averageDealSize * 12; // Rough annual customer estimate
    
    let participationRate: number;
    let referralsPerParticipant: number;
    let conversionRate: number;

    switch (type) {
      case 'customer':
        participationRate = 0.15; // 15% of customers refer
        referralsPerParticipant = 2.5;
        conversionRate = 0.25; // 25% of referrals convert
        break;
      case 'partner':
        participationRate = 0.30; // 30% of partners are active
        referralsPerParticipant = 5;
        conversionRate = 0.40; // 40% of partner referrals convert
        break;
      case 'affiliate':
        participationRate = 0.10; // 10% of affiliates are active
        referralsPerParticipant = 10;
        conversionRate = 0.08; // 8% of affiliate leads convert
        break;
    }

    const referredCustomers = baseCustomers * participationRate * referralsPerParticipant * conversionRate;
    const referralRevenue = referredCustomers * context.averageDealSize;
    
    // Subtract costs
    const incentiveCost = referredCustomers * 
      (typeof incentives.referrerReward.value === 'number' 
        ? incentives.referrerReward.value 
        : context.averageDealSize * 0.15);

    return Math.round(referralRevenue - incentiveCost);
  }

  optimizeExistingProgram(currentProgram: ReferralProgram, metrics: {
    participationRate: number;
    conversionRate: number;
    avgReferralsPerUser: number;
  }): {
    issues: string[];
    recommendations: string[];
    projectedImprovement: number;
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let projectedImprovement = 0;

    // Participation rate analysis
    if (metrics.participationRate < 0.10) {
      issues.push('Low program participation rate');
      recommendations.push('Increase incentive visibility with in-app prompts');
      recommendations.push('Add referral prompt to post-purchase flow');
      recommendations.push('Consider increasing referrer rewards');
      projectedImprovement += 0.20;
    }

    // Conversion rate analysis
    if (metrics.conversionRate < 0.15) {
      issues.push('Low referral conversion rate');
      recommendations.push('Improve referred user landing experience');
      recommendations.push('Increase referee incentive to drive conversions');
      recommendations.push('Simplify signup flow for referred users');
      projectedImprovement += 0.25;
    }

    // Referrals per user
    if (metrics.avgReferralsPerUser < 2) {
      issues.push('Active referrers not referring enough');
      recommendations.push('Implement tiered rewards to encourage more referrals');
      recommendations.push('Make sharing easier with more share options');
      recommendations.push('Send reminder emails to past referrers');
      projectedImprovement += 0.15;
    }

    return {
      issues,
      recommendations,
      projectedImprovement: Math.round(projectedImprovement * currentProgram.projectedImpact),
    };
  }
}

export const referralEngine = new ReferralEngine();
