import type { BusinessContext, InboundFunnel, FunnelStageConfig, LeadScoringModel, NurturingSequence, HandoffCriteria, FunnelStage, ScoringFactor } from './types';

export class InboundFunnelDesigner {
  designFunnel(context: BusinessContext): InboundFunnel {
    const stages = this.configureFunnelStages(context);
    const leadScoring = this.buildLeadScoringModel(context);
    const nurturing = this.createNurturingSequences(context);
    const handoffCriteria = this.defineHandoffCriteria(context);

    return {
      stages,
      leadScoring,
      nurturing,
      handoffCriteria,
    };
  }

  private configureFunnelStages(context: BusinessContext): FunnelStageConfig[] {
    const isHighTouch = context.averageDealSize > 10000;

    const stages: FunnelStageConfig[] = [
      {
        stage: 'awareness',
        entryPoints: [
          'Organic search',
          'Social media',
          'Referral links',
          'Paid advertising',
          'Content syndication',
        ],
        content: [
          'Blog posts',
          'Social content',
          'Educational videos',
          'Industry reports',
          'Infographics',
        ],
        conversionActions: [
          'Newsletter signup',
          'Content download',
          'Webinar registration',
          'Free tool usage',
        ],
        targetConversion: 0.05,
      },
      {
        stage: 'consideration',
        entryPoints: [
          'Lead magnet download',
          'Webinar attendance',
          'Pricing page visit',
          'Demo request',
        ],
        content: [
          'Case studies',
          'Comparison guides',
          'ROI calculators',
          'Product videos',
          'Whitepapers',
        ],
        conversionActions: isHighTouch
          ? ['Demo request', 'Sales call booking', 'Free consultation']
          : ['Free trial signup', 'Freemium account', 'Demo request'],
        targetConversion: isHighTouch ? 0.15 : 0.25,
      },
      {
        stage: 'decision',
        entryPoints: isHighTouch
          ? ['Demo completed', 'Proposal sent', 'Trial started']
          : ['Trial started', 'Upgrade prompt', 'Checkout started'],
        content: [
          'Customer testimonials',
          'Implementation guides',
          'Pricing details',
          'Security/compliance docs',
          'Contract templates',
        ],
        conversionActions: isHighTouch
          ? ['Contract signed', 'PO issued', 'Payment received']
          : ['Subscription started', 'Payment completed'],
        targetConversion: isHighTouch ? 0.25 : 0.20,
      },
    ];

    // Add retention stage
    stages.push({
      stage: 'retention',
      entryPoints: [
        'Customer portal',
        'Support ticket',
        'Usage milestone',
        'Renewal period',
      ],
      content: [
        'Feature announcements',
        'Best practices guides',
        'Customer community',
        'Training resources',
        'Success stories',
      ],
      conversionActions: [
        'Renewal',
        'Expansion/upsell',
        'Referral submission',
        'Case study participation',
      ],
      targetConversion: 0.85, // Retention rate target
    });

    return stages;
  }

  private buildLeadScoringModel(context: BusinessContext): LeadScoringModel {
    const demographicFactors: ScoringFactor[] = [
      {
        factor: 'Company Size',
        weight: 25,
        conditions: context.averageDealSize > 10000
          ? [
              { value: '1000+ employees', points: 25 },
              { value: '100-999 employees', points: 20 },
              { value: '10-99 employees', points: 10 },
              { value: '<10 employees', points: 5 },
            ]
          : [
              { value: '10-99 employees', points: 25 },
              { value: '100-999 employees', points: 20 },
              { value: '<10 employees', points: 15 },
              { value: '1000+ employees', points: 10 },
            ],
      },
      {
        factor: 'Title/Role',
        weight: 20,
        conditions: [
          { value: 'C-Level/VP', points: 20 },
          { value: 'Director/Manager', points: 15 },
          { value: 'Individual Contributor', points: 10 },
          { value: 'Unknown', points: 5 },
        ],
      },
      {
        factor: 'Industry',
        weight: 15,
        conditions: [
          { value: 'Target industry', points: 15 },
          { value: 'Adjacent industry', points: 10 },
          { value: 'Other industry', points: 5 },
        ],
      },
      {
        factor: 'Geography',
        weight: 10,
        conditions: [
          { value: 'Primary market', points: 10 },
          { value: 'Secondary market', points: 7 },
          { value: 'Other', points: 3 },
        ],
      },
    ];

    const behavioralFactors: ScoringFactor[] = [
      {
        factor: 'Content Engagement',
        weight: 15,
        conditions: [
          { value: 'Downloaded 3+ resources', points: 15 },
          { value: 'Downloaded 1-2 resources', points: 10 },
          { value: 'Blog visitor only', points: 5 },
        ],
      },
      {
        factor: 'Website Activity',
        weight: 10,
        conditions: [
          { value: 'Pricing page + features (multiple visits)', points: 10 },
          { value: 'Pricing page visit', points: 7 },
          { value: 'Multiple page views', points: 5 },
          { value: 'Single page view', points: 2 },
        ],
      },
      {
        factor: 'Email Engagement',
        weight: 10,
        conditions: [
          { value: 'Clicked 3+ emails', points: 10 },
          { value: 'Clicked 1-2 emails', points: 7 },
          { value: 'Opened but no clicks', points: 3 },
        ],
      },
      {
        factor: 'High-Intent Actions',
        weight: 20,
        conditions: [
          { value: 'Demo/sales request', points: 20 },
          { value: 'Started trial', points: 18 },
          { value: 'Webinar attended (live)', points: 12 },
          { value: 'Webinar registered', points: 8 },
        ],
      },
    ];

    // MQL threshold: typically 40-60 points
    // SQL threshold: typically 70-80 points
    return {
      demographicFactors,
      behavioralFactors,
      mqThreshold: 45,
      sqlThreshold: 75,
    };
  }

  private createNurturingSequences(context: BusinessContext): NurturingSequence[] {
    const sequences: NurturingSequence[] = [];

    // New subscriber sequence
    sequences.push({
      name: 'New Subscriber Welcome',
      trigger: 'Newsletter signup or first content download',
      duration: '14 days',
      steps: [
        { day: 0, type: 'email', content: 'Welcome email with best content', goal: 'Set expectations, deliver value' },
        { day: 3, type: 'email', content: 'Educational resource related to signup topic', goal: 'Demonstrate expertise' },
        { day: 7, type: 'email', content: 'Case study or social proof', goal: 'Build credibility' },
        { day: 10, type: 'content', content: 'Invite to webinar or demo', goal: 'Move to consideration' },
        { day: 14, type: 'email', content: 'Summary + soft CTA', goal: 'Conversion opportunity' },
      ],
    });

    // Webinar attendee sequence
    sequences.push({
      name: 'Webinar Attendee Follow-up',
      trigger: 'Webinar attendance (live or replay)',
      duration: '10 days',
      steps: [
        { day: 0, type: 'email', content: 'Thank you + recording + slides', goal: 'Deliver promised value' },
        { day: 2, type: 'email', content: 'Key takeaways + additional resource', goal: 'Reinforce learning' },
        { day: 5, type: 'email', content: 'Related case study', goal: 'Show real-world application' },
        { day: 8, type: 'email', content: 'Invitation to demo/trial', goal: 'Convert to opportunity' },
      ],
    });

    // Trial user sequence (if applicable)
    if (context.averageDealSize < 20000) {
      sequences.push({
        name: 'Trial User Onboarding',
        trigger: 'Free trial signup',
        duration: '14 days',
        steps: [
          { day: 0, type: 'email', content: 'Getting started guide', goal: 'Activate user' },
          { day: 1, type: 'email', content: 'Quick win tutorial', goal: 'First value moment' },
          { day: 3, type: 'email', content: 'Feature highlight', goal: 'Expand usage' },
          { day: 7, type: 'email', content: 'Check-in + help offer', goal: 'Address blockers' },
          { day: 10, type: 'email', content: 'Success stories + upgrade benefits', goal: 'Prep for conversion' },
          { day: 13, type: 'email', content: 'Trial ending + special offer', goal: 'Convert to paid' },
        ],
      });
    }

    // Re-engagement sequence
    sequences.push({
      name: 'Re-engagement Campaign',
      trigger: 'No activity for 30+ days',
      duration: '21 days',
      steps: [
        { day: 0, type: 'email', content: 'We miss you + new feature/content', goal: 'Reactivate interest' },
        { day: 7, type: 'email', content: 'Industry update or trend', goal: 'Provide value' },
        { day: 14, type: 'email', content: 'Special offer or invitation', goal: 'Incentivize action' },
        { day: 21, type: 'email', content: 'Last chance / unsubscribe option', goal: 'Clean list or reactivate' },
      ],
    });

    return sequences;
  }

  private defineHandoffCriteria(context: BusinessContext): HandoffCriteria {
    const isHighTouch = context.averageDealSize > 10000;

    return {
      mqCriteria: [
        'Lead score reaches MQL threshold (45+ points)',
        'Demographic fit confirmed (right company size, industry, title)',
        'At least one content engagement action',
        'Email engagement (opened 2+ emails)',
      ],
      sqlCriteria: isHighTouch
        ? [
            'Lead score reaches SQL threshold (75+ points)',
            'High-intent action taken (demo request, pricing inquiry)',
            'Budget authority confirmed or implied',
            'Timeline indicated within 6 months',
            'Clear pain point identified',
          ]
        : [
            'Lead score reaches SQL threshold (75+ points)',
            'Trial signup or demo completed',
            'Pricing page visited multiple times',
            'High engagement during trial',
          ],
      handoffProcess: isHighTouch
        ? 'MQL assigned to SDR for qualification call → SQL passed to AE with full context → AE owns through close'
        : 'Automated qualification via trial behavior → High-intent flagged for sales touch → Self-serve conversion or sales assist',
      slaHours: isHighTouch ? 4 : 24,
    };
  }

  calculateFunnelMetrics(funnel: InboundFunnel, visitors: number): {
    stages: { stage: FunnelStage; volume: number; conversion: number }[];
    mqls: number;
    sqls: number;
    customers: number;
    overallConversion: number;
  } {
    let currentVolume = visitors;
    const stageMetrics: { stage: FunnelStage; volume: number; conversion: number }[] = [];

    for (const stage of funnel.stages) {
      const converted = Math.round(currentVolume * stage.targetConversion);
      stageMetrics.push({
        stage: stage.stage,
        volume: currentVolume,
        conversion: stage.targetConversion,
      });
      currentVolume = converted;
    }

    // Estimate MQLs and SQLs based on typical funnel math
    const mqls = Math.round(stageMetrics[1]?.volume * 0.4 || 0);
    const sqls = Math.round(mqls * 0.5);
    const customers = Math.round(sqls * stageMetrics[2]?.conversion || 0);
    const overallConversion = visitors > 0 ? customers / visitors : 0;

    return {
      stages: stageMetrics,
      mqls,
      sqls,
      customers,
      overallConversion,
    };
  }

  identifyFunnelLeaks(funnel: InboundFunnel): {
    stage: FunnelStage;
    issue: string;
    recommendation: string;
    impact: 'high' | 'medium' | 'low';
  }[] {
    const leaks: { stage: FunnelStage; issue: string; recommendation: string; impact: 'high' | 'medium' | 'low' }[] = [];

    for (const stage of funnel.stages) {
      // Check for low conversion targets
      if (stage.stage === 'awareness' && stage.targetConversion < 0.03) {
        leaks.push({
          stage: stage.stage,
          issue: 'Low awareness-to-lead conversion',
          recommendation: 'Improve CTAs, add more lead magnets, optimize landing pages',
          impact: 'high',
        });
      }

      if (stage.stage === 'consideration' && stage.targetConversion < 0.10) {
        leaks.push({
          stage: stage.stage,
          issue: 'Leads not progressing to sales-ready',
          recommendation: 'Improve nurturing, add more social proof, reduce friction to demo/trial',
          impact: 'high',
        });
      }

      if (stage.stage === 'decision' && stage.targetConversion < 0.15) {
        leaks.push({
          stage: stage.stage,
          issue: 'Low close rate',
          recommendation: 'Review objection handling, pricing, and sales process',
          impact: 'high',
        });
      }

      // Check for missing content
      if (stage.content.length < 3) {
        leaks.push({
          stage: stage.stage,
          issue: 'Limited content for this stage',
          recommendation: 'Develop more stage-appropriate content',
          impact: 'medium',
        });
      }
    }

    return leaks.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  }
}

export const inboundFunnelDesigner = new InboundFunnelDesigner();
