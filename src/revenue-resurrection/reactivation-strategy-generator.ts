/**
 * Reactivation Strategy Generator
 * Creates personalized resurrection strategies for cold leads
 */

export interface ReactivationStrategy {
  id: string;
  leadId: string;
  timestamp: Date;
  approach: StrategyApproach;
  sequence: ReactivationSequence;
  messaging: MessagingStrategy;
  timing: TimingStrategy;
  channels: ChannelStrategy;
  offers: OfferStrategy;
  successCriteria: SuccessCriteria;
}

export interface StrategyApproach {
  primary: ApproachType;
  secondary: ApproachType[];
  tone: ToneType;
  intensity: 'soft' | 'moderate' | 'assertive';
  personalLevel: 'high' | 'medium' | 'low';
}

export type ApproachType =
  | 'value_first'
  | 'relationship_repair'
  | 'new_information'
  | 'urgency_creation'
  | 'social_proof'
  | 'competitive_displacement'
  | 'fear_of_missing'
  | 'curiosity_hook'
  | 'direct_ask'
  | 'indirect_nurture';

export type ToneType =
  | 'professional'
  | 'friendly'
  | 'consultative'
  | 'challenging'
  | 'empathetic'
  | 'authoritative';

export interface ReactivationSequence {
  steps: SequenceStep[];
  totalDuration: number;
  branchingLogic: BranchingRule[];
  exitConditions: ExitCondition[];
}

export interface SequenceStep {
  order: number;
  action: StepAction;
  channel: string;
  timing: StepTiming;
  content: ContentTemplate;
  successMetric: string;
  fallbackAction?: StepAction;
}

export type StepAction =
  | 'send_email'
  | 'send_sms'
  | 'linkedin_connect'
  | 'linkedin_message'
  | 'phone_call'
  | 'voicemail_drop'
  | 'direct_mail'
  | 'retargeting_ad'
  | 'social_engagement'
  | 'referral_request'
  | 'value_content';

export interface StepTiming {
  delayFromPrevious: number;
  optimalDayOfWeek?: number[];
  optimalTimeOfDay?: string;
  avoidDates?: Date[];
}

export interface ContentTemplate {
  type: 'template' | 'ai_generated' | 'hybrid';
  templateId?: string;
  hooks: string[];
  callToAction: string;
  personalizationPoints: string[];
  proofElements: string[];
}

export interface BranchingRule {
  condition: string;
  action: 'continue' | 'skip' | 'branch' | 'exit';
  targetStep?: number;
  reason: string;
}

export interface ExitCondition {
  trigger: string;
  outcome: 'success' | 'failure' | 'defer';
  followUpAction?: string;
}

export interface MessagingStrategy {
  primaryHook: string;
  valueProposition: string;
  objectionPreemption: string[];
  proofPoints: string[];
  callToAction: string;
  urgencyElement?: string;
  riskReversal?: string;
}

export interface TimingStrategy {
  startDate: Date;
  optimalWindow: { dayOfWeek: number[]; timeRanges: string[] };
  avoidPeriods: string[];
  seasonalConsiderations: string[];
  eventTriggers: string[];
}

export interface ChannelStrategy {
  primaryChannel: string;
  secondaryChannels: string[];
  channelSequencing: 'parallel' | 'sequential' | 'responsive';
  channelPreferences: Record<string, number>;
}

export interface OfferStrategy {
  primaryOffer: OfferConfig;
  escalationOffers: OfferConfig[];
  valueAdditions: string[];
  riskReversals: string[];
}

export interface OfferConfig {
  type: 'discount' | 'bonus' | 'trial' | 'consultation' | 'content' | 'custom';
  value: string;
  expiration?: Date;
  conditions?: string[];
}

export interface SuccessCriteria {
  primaryGoal: string;
  secondaryGoals: string[];
  metrics: SuccessMetric[];
  timeframe: number;
}

export interface SuccessMetric {
  name: string;
  target: number;
  current: number;
  weight: number;
}

export interface LeadContext {
  leadId: string;
  deathCause: string;
  revivabilityScore: number;
  previousInteractions: number;
  lastContactDate: Date;
  leadValue: number;
  objections: string[];
  preferences: Record<string, unknown>;
  industry?: string;
  role?: string;
}

class ReactivationStrategyGenerator {
  private strategies: Map<string, ReactivationStrategy> = new Map();
  private templates: Map<string, ContentTemplate> = new Map();

  generateId(): string {
    return `strat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async generate(context: LeadContext): Promise<ReactivationStrategy> {
    const approach = this.determineApproach(context);
    const messaging = this.craftMessaging(context, approach);
    const timing = this.calculateTiming(context);
    const channels = this.selectChannels(context);
    const offers = this.designOffers(context);
    const sequence = this.buildSequence(context, approach, channels, timing);
    const successCriteria = this.defineSuccessCriteria(context);

    const strategy: ReactivationStrategy = {
      id: this.generateId(),
      leadId: context.leadId,
      timestamp: new Date(),
      approach,
      sequence,
      messaging,
      timing,
      channels,
      offers,
      successCriteria,
    };

    this.strategies.set(strategy.id, strategy);
    return strategy;
  }

  private determineApproach(context: LeadContext): StrategyApproach {
    const causeToApproach: Record<string, ApproachType> = {
      price_objection: 'value_first',
      timing_mismatch: 'indirect_nurture',
      trust_deficit: 'social_proof',
      identity_misalignment: 'new_information',
      fear_of_change: 'social_proof',
      competitor_chosen: 'competitive_displacement',
      internal_blockers: 'value_first',
      budget_freeze: 'indirect_nurture',
      poor_follow_up: 'relationship_repair',
      wrong_offer: 'new_information',
    };

    const primary = causeToApproach[context.deathCause] || 'value_first';

    // Select secondary approaches
    const secondaryOptions: ApproachType[] = ['curiosity_hook', 'new_information', 'value_first'];
    const secondary = secondaryOptions.filter((a) => a !== primary).slice(0, 2);

    // Determine tone based on context
    let tone: ToneType = 'professional';
    if (context.revivabilityScore > 0.7) tone = 'friendly';
    if (context.deathCause === 'trust_deficit') tone = 'consultative';
    if (context.leadValue > 10000) tone = 'authoritative';

    // Determine intensity
    const intensity: StrategyApproach['intensity'] =
      context.revivabilityScore > 0.6 ? 'moderate' : context.revivabilityScore > 0.4 ? 'soft' : 'soft';

    return {
      primary,
      secondary,
      tone,
      intensity,
      personalLevel: context.leadValue > 5000 ? 'high' : 'medium',
    };
  }

  private craftMessaging(context: LeadContext, approach: StrategyApproach): MessagingStrategy {
    const hooks: Record<ApproachType, string> = {
      value_first: 'I was thinking about a specific challenge you mentioned...',
      relationship_repair: 'I realized I may not have served you well last time...',
      new_information: 'Something changed that I thought you should know about...',
      urgency_creation: 'A time-sensitive opportunity came up that fits your situation...',
      social_proof: 'A client in your exact situation just achieved remarkable results...',
      competitive_displacement: 'I noticed some developments that might affect your current solution...',
      fear_of_missing: 'I wanted to make sure you didn\'t miss this before it\'s gone...',
      curiosity_hook: 'I found something unexpected when reviewing your situation...',
      direct_ask: 'I\'d like to understand what happened and if there\'s a path forward...',
      indirect_nurture: 'No agenda, just thought this might be valuable for you...',
    };

    const valueProps: Record<string, string> = {
      price_objection: 'The ROI breakdown shows 3x return within 90 days based on similar clients',
      timing_mismatch: 'Flexible implementation timeline that works around your schedule',
      trust_deficit: 'Backed by documented results from 50+ similar cases',
      competitor_chosen: 'Unique capabilities that complement rather than compete',
    };

    return {
      primaryHook: hooks[approach.primary],
      valueProposition: valueProps[context.deathCause] || 'Tailored solution for your specific needs',
      objectionPreemption: this.preemptObjections(context.objections),
      proofPoints: this.selectProofPoints(context),
      callToAction: this.craftCTA(approach, context),
      urgencyElement: context.revivabilityScore > 0.5 ? 'Limited availability this quarter' : undefined,
      riskReversal: context.leadValue > 5000 ? 'Full satisfaction guarantee with no lock-in' : undefined,
    };
  }

  private preemptObjections(objections: string[]): string[] {
    return objections.map((objection) => {
      if (objection.toLowerCase().includes('price')) {
        return 'Investment structured around measurable outcomes';
      }
      if (objection.toLowerCase().includes('time')) {
        return 'Streamlined process that respects your schedule';
      }
      if (objection.toLowerCase().includes('ready')) {
        return 'No pressure approach with value regardless of timing';
      }
      return `Addressed: ${objection}`;
    });
  }

  private selectProofPoints(context: LeadContext): string[] {
    const proofPoints: string[] = [];

    if (context.industry) {
      proofPoints.push(`${context.industry}-specific case study with quantified results`);
    }

    proofPoints.push('Third-party validation from recognized authority');
    proofPoints.push('Specific metrics from comparable client engagement');

    if (context.leadValue > 10000) {
      proofPoints.push('Executive testimonial from similar organization');
    }

    return proofPoints;
  }

  private craftCTA(approach: StrategyApproach, context: LeadContext): string {
    const ctas: Record<ApproachType, string> = {
      value_first: 'Would a quick analysis of your specific situation be helpful?',
      relationship_repair: 'Can we start fresh with a brief conversation?',
      new_information: 'Worth a 10-minute call to walk through the implications?',
      urgency_creation: 'Can you confirm your interest by Friday?',
      social_proof: 'Would you like me to connect you with this client directly?',
      competitive_displacement: 'Shall I show you a side-by-side comparison?',
      fear_of_missing: 'Should I reserve a spot for you before it fills?',
      curiosity_hook: 'Curious what you think about this?',
      direct_ask: 'What would need to change for this to make sense?',
      indirect_nurture: 'Happy to share more if useful',
    };

    return ctas[approach.primary];
  }

  private calculateTiming(context: LeadContext): TimingStrategy {
    const daysSinceContact = (Date.now() - context.lastContactDate.getTime()) / (1000 * 60 * 60 * 24);

    let startOffset = 7;
    if (daysSinceContact < 30) startOffset = 14;
    if (daysSinceContact > 180) startOffset = 3;

    return {
      startDate: new Date(Date.now() + startOffset * 24 * 60 * 60 * 1000),
      optimalWindow: {
        dayOfWeek: [1, 2, 3, 4], // Monday through Thursday
        timeRanges: ['09:00-11:00', '14:00-16:00'],
      },
      avoidPeriods: ['major_holidays', 'month_end', 'quarter_end'],
      seasonalConsiderations: this.getSeasonalConsiderations(context),
      eventTriggers: ['company_news', 'role_change', 'funding_announcement'],
    };
  }

  private getSeasonalConsiderations(context: LeadContext): string[] {
    const considerations: string[] = [];
    const month = new Date().getMonth();

    if (month === 11 || month === 0) {
      considerations.push('Holiday season - lighter touch recommended');
    }
    if (month >= 6 && month <= 7) {
      considerations.push('Summer period - decision makers may be unavailable');
    }
    if (month === 3 || month === 9) {
      considerations.push('Quarter start - good time for new initiatives');
    }

    return considerations;
  }

  private selectChannels(context: LeadContext): ChannelStrategy {
    let primaryChannel = 'email';
    const secondaryChannels: string[] = [];

    // High-value leads get multi-channel
    if (context.leadValue > 10000) {
      primaryChannel = 'phone_call';
      secondaryChannels.push('email', 'linkedin');
    } else if (context.leadValue > 5000) {
      primaryChannel = 'email';
      secondaryChannels.push('linkedin');
    }

    // Add based on death cause
    if (context.deathCause === 'poor_follow_up') {
      primaryChannel = 'phone_call';
    }
    if (context.deathCause === 'trust_deficit') {
      secondaryChannels.push('social_proof_content');
    }

    return {
      primaryChannel,
      secondaryChannels,
      channelSequencing: context.leadValue > 10000 ? 'parallel' : 'sequential',
      channelPreferences: {
        email: 1,
        phone_call: context.leadValue > 5000 ? 0.8 : 0.3,
        linkedin: 0.6,
        sms: 0.4,
      },
    };
  }

  private designOffers(context: LeadContext): OfferStrategy {
    const primaryOffer: OfferConfig = {
      type: 'consultation',
      value: 'Free strategy session (no pitch)',
    };

    // Customize based on death cause
    if (context.deathCause === 'price_objection') {
      primaryOffer.type = 'trial';
      primaryOffer.value = 'Risk-free pilot program';
    }

    const escalationOffers: OfferConfig[] = [
      {
        type: 'content',
        value: 'Exclusive industry report',
      },
      {
        type: 'discount',
        value: '20% off first engagement',
        expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        conditions: ['New clients only'],
      },
    ];

    return {
      primaryOffer,
      escalationOffers,
      valueAdditions: [
        'Complimentary audit',
        'Access to exclusive content',
        'Priority support',
      ],
      riskReversals: [
        'Money-back guarantee',
        'No long-term commitment required',
        'Cancel anytime policy',
      ],
    };
  }

  private buildSequence(
    context: LeadContext,
    approach: StrategyApproach,
    channels: ChannelStrategy,
    timing: TimingStrategy
  ): ReactivationSequence {
    const steps: SequenceStep[] = [];

    // Step 1: Initial outreach
    steps.push({
      order: 1,
      action: channels.primaryChannel === 'phone_call' ? 'phone_call' : 'send_email',
      channel: channels.primaryChannel,
      timing: { delayFromPrevious: 0, optimalDayOfWeek: timing.optimalWindow.dayOfWeek },
      content: {
        type: 'hybrid',
        hooks: [approach.primary],
        callToAction: 'soft_engagement',
        personalizationPoints: ['name', 'company', 'previous_interaction'],
        proofElements: ['case_study_reference'],
      },
      successMetric: 'response_received',
      fallbackAction: 'send_email',
    });

    // Step 2: Follow-up if no response
    steps.push({
      order: 2,
      action: 'send_email',
      channel: 'email',
      timing: { delayFromPrevious: 3 * 24 * 60 * 60 * 1000 },
      content: {
        type: 'hybrid',
        hooks: ['curiosity_hook', 'value_first'],
        callToAction: 'value_offer',
        personalizationPoints: ['specific_pain_point'],
        proofElements: ['social_proof'],
      },
      successMetric: 'email_opened',
    });

    // Step 3: LinkedIn touch
    if (channels.secondaryChannels.includes('linkedin')) {
      steps.push({
        order: 3,
        action: 'linkedin_message',
        channel: 'linkedin',
        timing: { delayFromPrevious: 4 * 24 * 60 * 60 * 1000 },
        content: {
          type: 'template',
          templateId: 'linkedin_reactivation',
          hooks: ['relationship_repair'],
          callToAction: 'connection_request',
          personalizationPoints: ['shared_connection', 'recent_activity'],
          proofElements: [],
        },
        successMetric: 'message_read',
      });
    }

    // Step 4: Value content
    steps.push({
      order: 4,
      action: 'value_content',
      channel: 'email',
      timing: { delayFromPrevious: 5 * 24 * 60 * 60 * 1000 },
      content: {
        type: 'template',
        templateId: 'value_content_delivery',
        hooks: ['new_information'],
        callToAction: 'content_engagement',
        personalizationPoints: ['industry', 'role'],
        proofElements: ['data_point', 'authority_reference'],
      },
      successMetric: 'content_downloaded',
    });

    // Step 5: Direct ask
    steps.push({
      order: 5,
      action: 'send_email',
      channel: 'email',
      timing: { delayFromPrevious: 7 * 24 * 60 * 60 * 1000 },
      content: {
        type: 'hybrid',
        hooks: ['direct_ask'],
        callToAction: 'meeting_request',
        personalizationPoints: ['all_previous_interactions'],
        proofElements: ['results_summary'],
      },
      successMetric: 'meeting_booked',
    });

    return {
      steps,
      totalDuration: 21,
      branchingLogic: [
        {
          condition: 'response_received',
          action: 'branch',
          targetStep: 5,
          reason: 'Skip to direct engagement on response',
        },
        {
          condition: 'unsubscribed',
          action: 'exit',
          reason: 'Respect opt-out',
        },
      ],
      exitConditions: [
        { trigger: 'meeting_booked', outcome: 'success', followUpAction: 'prepare_meeting' },
        { trigger: 'explicit_rejection', outcome: 'failure', followUpAction: 'add_to_long_nurture' },
        { trigger: 'sequence_complete_no_response', outcome: 'defer', followUpAction: 'schedule_retry_90_days' },
      ],
    };
  }

  private defineSuccessCriteria(context: LeadContext): SuccessCriteria {
    return {
      primaryGoal: 'Convert to sales conversation',
      secondaryGoals: ['Re-establish relationship', 'Update lead intelligence', 'Identify new opportunity'],
      metrics: [
        { name: 'Response rate', target: 0.3, current: 0, weight: 0.3 },
        { name: 'Meeting booked', target: 0.1, current: 0, weight: 0.5 },
        { name: 'Engagement score', target: 50, current: 0, weight: 0.2 },
      ],
      timeframe: 30,
    };
  }

  getStrategy(strategyId: string): ReactivationStrategy | undefined {
    return this.strategies.get(strategyId);
  }

  getStrategiesByLead(leadId: string): ReactivationStrategy[] {
    return Array.from(this.strategies.values()).filter((s) => s.leadId === leadId);
  }

  getStats(): {
    totalStrategies: number;
    approachDistribution: Record<string, number>;
    avgSequenceLength: number;
  } {
    const strategies = Array.from(this.strategies.values());
    const approachDistribution: Record<string, number> = {};

    strategies.forEach((s) => {
      approachDistribution[s.approach.primary] = (approachDistribution[s.approach.primary] || 0) + 1;
    });

    return {
      totalStrategies: strategies.length,
      approachDistribution,
      avgSequenceLength: strategies.length > 0
        ? strategies.reduce((sum, s) => sum + s.sequence.steps.length, 0) / strategies.length
        : 0,
    };
  }
}

export const reactivationStrategyGenerator = new ReactivationStrategyGenerator();
export { ReactivationStrategyGenerator };
