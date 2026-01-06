/**
 * Follow-Up Intelligence
 * Human-like intelligent follow-up system
 */

export interface FollowUpPlan {
  id: string;
  leadId: string;
  timestamp: Date;
  context: FollowUpContext;
  strategy: FollowUpStrategy;
  sequence: FollowUpSequence;
  intelligence: FollowUpIntelligence;
  status: PlanStatus;
}

export interface FollowUpContext {
  lastInteraction: Date;
  interactionCount: number;
  conversationStage: ConversationStage;
  leadTemperature: LeadTemperature;
  pendingActions: string[];
  openQuestions: string[];
  lastTouchType: string;
}

export type ConversationStage =
  | 'initial_contact'
  | 'discovery'
  | 'qualification'
  | 'presentation'
  | 'proposal'
  | 'negotiation'
  | 'closing'
  | 'post_close'
  | 'stalled';

export type LeadTemperature = 'hot' | 'warm' | 'cool' | 'cold' | 'ice';
export type PlanStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export interface FollowUpStrategy {
  approach: FollowUpApproach;
  tone: FollowUpTone;
  urgency: UrgencyLevel;
  persistence: PersistenceLevel;
  valueEmphasis: string[];
}

export type FollowUpApproach =
  | 'value_add'
  | 'check_in'
  | 'assumptive'
  | 'consultative'
  | 'direct_ask'
  | 'social_proof'
  | 'scarcity'
  | 'patience';

export type FollowUpTone =
  | 'professional'
  | 'friendly'
  | 'casual'
  | 'urgent'
  | 'empathetic'
  | 'challenging';

export type UrgencyLevel = 'high' | 'medium' | 'low' | 'none';
export type PersistenceLevel = 'aggressive' | 'moderate' | 'patient' | 'passive';

export interface FollowUpSequence {
  steps: FollowUpStep[];
  currentStep: number;
  adaptations: SequenceAdaptation[];
  exitConditions: ExitCondition[];
}

export interface FollowUpStep {
  id: string;
  order: number;
  timing: StepTiming;
  channel: string;
  message: MessageTemplate;
  purpose: string;
  expectedResponse: string;
  fallback?: string;
}

export interface StepTiming {
  daysAfterPrevious: number;
  optimalDayOfWeek?: number[];
  optimalTimeOfDay?: string;
  maxDelay: number;
}

export interface MessageTemplate {
  subject?: string;
  opening: string;
  body: string;
  callToAction: string;
  personalizationHooks: string[];
  attachments?: string[];
}

export interface SequenceAdaptation {
  trigger: string;
  action: 'accelerate' | 'decelerate' | 'pivot' | 'pause' | 'intensify';
  newStrategy?: Partial<FollowUpStrategy>;
}

export interface ExitCondition {
  condition: string;
  outcome: 'success' | 'failure' | 'defer';
  action: string;
}

export interface FollowUpIntelligence {
  silenceInterpretation: SilenceInterpretation;
  responseAnalysis: ResponseAnalysis;
  closeReadiness: CloseReadiness;
  nextBestAction: NextBestAction;
  warnings: IntelligenceWarning[];
}

export interface SilenceInterpretation {
  silenceDays: number;
  likelyReason: SilenceReason;
  confidence: number;
  recommendedAction: string;
  alternativeReasons: SilenceReason[];
}

export type SilenceReason =
  | 'busy'
  | 'evaluating'
  | 'internal_process'
  | 'lost_interest'
  | 'competitor'
  | 'budget_issue'
  | 'timing'
  | 'ghosting'
  | 'awaiting_internal'
  | 'unknown';

export interface ResponseAnalysis {
  lastResponseSentiment: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  responseLatencyTrend: 'faster' | 'stable' | 'slower';
  objectionSignals: string[];
  interestSignals: string[];
}

export interface CloseReadiness {
  score: number;
  signals: ReadinessSignal[];
  blockers: string[];
  recommendedCloseApproach: string;
  timing: 'now' | 'soon' | 'not_yet' | 'unlikely';
}

export interface ReadinessSignal {
  signal: string;
  weight: number;
  detected: boolean;
}

export interface NextBestAction {
  action: string;
  channel: string;
  timing: string;
  message: string;
  rationale: string;
  alternatives: string[];
}

export interface IntelligenceWarning {
  type: WarningType;
  message: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export type WarningType =
  | 'over_contact'
  | 'under_contact'
  | 'wrong_channel'
  | 'timing_issue'
  | 'tone_mismatch'
  | 'competitor_risk'
  | 'champion_risk'
  | 'deal_stalling';

export interface LeadInteraction {
  type: string;
  timestamp: Date;
  channel: string;
  direction: 'inbound' | 'outbound';
  content?: string;
  sentiment?: number;
  responseTime?: number;
  outcome?: string;
}

export interface FollowUpInput {
  leadId: string;
  interactions: LeadInteraction[];
  leadData: Record<string, unknown>;
  dealValue?: number;
  stage: ConversationStage;
}

class FollowUpIntelligenceSystem {
  private plans: Map<string, FollowUpPlan> = new Map();

  generateId(): string {
    return `fup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async createPlan(input: FollowUpInput): Promise<FollowUpPlan> {
    const context = this.analyzeContext(input);
    const intelligence = this.generateIntelligence(input, context);
    const strategy = this.determineStrategy(context, intelligence);
    const sequence = this.buildSequence(strategy, context, intelligence);

    const plan: FollowUpPlan = {
      id: this.generateId(),
      leadId: input.leadId,
      timestamp: new Date(),
      context,
      strategy,
      sequence,
      intelligence,
      status: 'active',
    };

    this.plans.set(plan.id, plan);
    return plan;
  }

  private analyzeContext(input: FollowUpInput): FollowUpContext {
    const interactions = input.interactions;
    const lastInteraction = interactions.length > 0
      ? interactions[interactions.length - 1].timestamp
      : new Date();

    const daysSinceContact = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);

    let temperature: LeadTemperature = 'warm';
    if (daysSinceContact < 2) temperature = 'hot';
    else if (daysSinceContact < 7) temperature = 'warm';
    else if (daysSinceContact < 30) temperature = 'cool';
    else if (daysSinceContact < 90) temperature = 'cold';
    else temperature = 'ice';

    // Analyze pending items from interactions
    const pendingActions: string[] = [];
    const openQuestions: string[] = [];

    interactions.slice(-5).forEach((i) => {
      if (i.content?.includes('?')) {
        openQuestions.push('Unanswered question detected');
      }
      if (i.content?.toLowerCase().includes('send') || i.content?.toLowerCase().includes('follow up')) {
        pendingActions.push('Promised follow-up item');
      }
    });

    return {
      lastInteraction,
      interactionCount: interactions.length,
      conversationStage: input.stage,
      leadTemperature: temperature,
      pendingActions,
      openQuestions,
      lastTouchType: interactions[interactions.length - 1]?.type || 'unknown',
    };
  }

  private generateIntelligence(input: FollowUpInput, context: FollowUpContext): FollowUpIntelligence {
    const silenceInterpretation = this.interpretSilence(input, context);
    const responseAnalysis = this.analyzeResponses(input);
    const closeReadiness = this.assessCloseReadiness(input, context);
    const nextBestAction = this.determineNextBestAction(context, silenceInterpretation, closeReadiness);
    const warnings = this.generateWarnings(context, responseAnalysis);

    return {
      silenceInterpretation,
      responseAnalysis,
      closeReadiness,
      nextBestAction,
      warnings,
    };
  }

  private interpretSilence(input: FollowUpInput, context: FollowUpContext): SilenceInterpretation {
    const daysSilent = (Date.now() - context.lastInteraction.getTime()) / (1000 * 60 * 60 * 24);

    let likelyReason: SilenceReason = 'busy';
    let confidence = 0.5;
    let recommendedAction = 'Send value-add follow-up';

    if (daysSilent < 3) {
      likelyReason = 'busy';
      confidence = 0.7;
      recommendedAction = 'Wait 1-2 more days';
    } else if (daysSilent < 7) {
      if (context.conversationStage === 'proposal') {
        likelyReason = 'evaluating';
        confidence = 0.6;
        recommendedAction = 'Check-in with value add';
      } else {
        likelyReason = 'busy';
        confidence = 0.5;
        recommendedAction = 'Send gentle reminder';
      }
    } else if (daysSilent < 14) {
      likelyReason = 'internal_process';
      confidence = 0.5;
      recommendedAction = 'Direct check-in on status';
    } else if (daysSilent < 30) {
      likelyReason = 'lost_interest';
      confidence = 0.4;
      recommendedAction = 'Re-engagement with new angle';
    } else {
      likelyReason = 'ghosting';
      confidence = 0.6;
      recommendedAction = 'Break-up email or fresh start';
    }

    // Adjust based on stage
    if (context.conversationStage === 'closing' && daysSilent > 3) {
      likelyReason = 'competitor';
      confidence = 0.5;
    }

    return {
      silenceDays: Math.floor(daysSilent),
      likelyReason,
      confidence,
      recommendedAction,
      alternativeReasons: ['busy', 'evaluating', 'timing'].filter((r) => r !== likelyReason) as SilenceReason[],
    };
  }

  private analyzeResponses(input: FollowUpInput): ResponseAnalysis {
    const recentInteractions = input.interactions.slice(-10);
    const inboundResponses = recentInteractions.filter((i) => i.direction === 'inbound');

    // Sentiment trend
    const sentiments = inboundResponses
      .filter((i) => i.sentiment !== undefined)
      .map((i) => i.sentiment!);
    const lastSentiment = sentiments[sentiments.length - 1] || 0.5;

    // Engagement trend
    const firstHalf = inboundResponses.slice(0, Math.floor(inboundResponses.length / 2));
    const secondHalf = inboundResponses.slice(Math.floor(inboundResponses.length / 2));
    
    let engagementTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (secondHalf.length > firstHalf.length * 1.2) engagementTrend = 'increasing';
    if (secondHalf.length < firstHalf.length * 0.8) engagementTrend = 'decreasing';

    // Response latency trend
    const latencies = inboundResponses
      .filter((i) => i.responseTime !== undefined)
      .map((i) => i.responseTime!);
    
    let responseLatencyTrend: 'faster' | 'stable' | 'slower' = 'stable';
    if (latencies.length >= 2) {
      const avgFirst = latencies.slice(0, Math.floor(latencies.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(latencies.length / 2);
      const avgSecond = latencies.slice(Math.floor(latencies.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(latencies.length / 2);
      if (avgSecond < avgFirst * 0.8) responseLatencyTrend = 'faster';
      if (avgSecond > avgFirst * 1.2) responseLatencyTrend = 'slower';
    }

    // Signal detection
    const allContent = inboundResponses.map((i) => i.content || '').join(' ').toLowerCase();
    const objectionSignals: string[] = [];
    const interestSignals: string[] = [];

    if (allContent.includes('price') || allContent.includes('cost') || allContent.includes('budget')) {
      objectionSignals.push('Price concern detected');
    }
    if (allContent.includes('time') || allContent.includes('busy')) {
      objectionSignals.push('Timing concern detected');
    }
    if (allContent.includes('competitor') || allContent.includes('other option')) {
      objectionSignals.push('Competitive evaluation');
    }

    if (allContent.includes('interested') || allContent.includes('tell me more')) {
      interestSignals.push('Explicit interest expressed');
    }
    if (allContent.includes('when') || allContent.includes('how soon')) {
      interestSignals.push('Timeline questions indicate readiness');
    }
    if (allContent.includes('implement') || allContent.includes('start')) {
      interestSignals.push('Implementation language detected');
    }

    return {
      lastResponseSentiment: lastSentiment,
      engagementTrend,
      responseLatencyTrend,
      objectionSignals,
      interestSignals,
    };
  }

  private assessCloseReadiness(input: FollowUpInput, context: FollowUpContext): CloseReadiness {
    const signals: ReadinessSignal[] = [
      { signal: 'Budget confirmed', weight: 0.2, detected: false },
      { signal: 'Decision maker engaged', weight: 0.2, detected: false },
      { signal: 'Timeline established', weight: 0.15, detected: false },
      { signal: 'Need acknowledged', weight: 0.15, detected: false },
      { signal: 'Competitor ruled out', weight: 0.1, detected: false },
      { signal: 'Internal buy-in', weight: 0.1, detected: false },
      { signal: 'Implementation discussed', weight: 0.1, detected: false },
    ];

    // Detect signals from data
    const content = input.interactions.map((i) => i.content || '').join(' ').toLowerCase();

    if (content.includes('budget') && content.includes('approved')) {
      signals.find((s) => s.signal === 'Budget confirmed')!.detected = true;
    }
    if (content.includes('when') || content.includes('timeline')) {
      signals.find((s) => s.signal === 'Timeline established')!.detected = true;
    }
    if (content.includes('need') || content.includes('problem')) {
      signals.find((s) => s.signal === 'Need acknowledged')!.detected = true;
    }

    const detectedSignals = signals.filter((s) => s.detected);
    const score = detectedSignals.reduce((sum, s) => sum + s.weight, 0);

    const blockers: string[] = [];
    if (!signals.find((s) => s.signal === 'Budget confirmed')?.detected) {
      blockers.push('Budget not confirmed');
    }
    if (context.leadTemperature === 'cold' || context.leadTemperature === 'ice') {
      blockers.push('Lead has gone cold');
    }

    let timing: CloseReadiness['timing'] = 'not_yet';
    if (score > 0.7) timing = 'now';
    else if (score > 0.5) timing = 'soon';
    else if (score < 0.3) timing = 'unlikely';

    return {
      score,
      signals,
      blockers,
      recommendedCloseApproach: score > 0.5 ? 'Direct close attempt' : 'Continue building value',
      timing,
    };
  }

  private determineNextBestAction(
    context: FollowUpContext,
    silence: SilenceInterpretation,
    readiness: CloseReadiness
  ): NextBestAction {
    let action = 'Send value-add email';
    let channel = 'email';
    let timing = '1-2 days';
    let message = 'Share relevant insight or resource';
    let rationale = 'Maintain engagement without pressure';

    // High readiness - go for close
    if (readiness.timing === 'now') {
      action = 'Request closing conversation';
      message = 'Suggest final call to address any questions and move forward';
      rationale = 'Multiple buying signals detected';
      timing = 'Today';
    }
    // Long silence - re-engage
    else if (silence.silenceDays > 14) {
      action = 'Send re-engagement email';
      message = 'Acknowledge time passed, offer fresh value angle';
      rationale = 'Extended silence requires pattern interrupt';
      timing = 'Immediately';
    }
    // Pending items
    else if (context.pendingActions.length > 0) {
      action = 'Fulfill pending promise';
      message = 'Deliver on previously committed follow-up item';
      rationale = 'Build trust by keeping commitments';
      timing = 'Today';
    }
    // Stage-appropriate action
    else {
      switch (context.conversationStage) {
        case 'discovery':
          action = 'Continue discovery conversation';
          message = 'Ask deeper qualification questions';
          break;
        case 'presentation':
          action = 'Schedule demonstration';
          message = 'Offer personalized demo or walkthrough';
          break;
        case 'proposal':
          action = 'Proposal follow-up';
          message = 'Check understanding and address questions';
          break;
        case 'negotiation':
          action = 'Address concerns';
          message = 'Proactively offer solutions to blockers';
          break;
      }
    }

    return {
      action,
      channel,
      timing,
      message,
      rationale,
      alternatives: ['Phone call', 'LinkedIn message', 'Wait another day'],
    };
  }

  private generateWarnings(context: FollowUpContext, analysis: ResponseAnalysis): IntelligenceWarning[] {
    const warnings: IntelligenceWarning[] = [];

    // Over-contact warning
    if (context.interactionCount > 10 && context.conversationStage === 'initial_contact') {
      warnings.push({
        type: 'over_contact',
        message: 'High touch count with limited stage progression',
        severity: 'medium',
        recommendation: 'Reduce frequency, increase value per touch',
      });
    }

    // Under-contact warning
    const daysSinceContact = (Date.now() - context.lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceContact > 14 && context.leadTemperature !== 'ice') {
      warnings.push({
        type: 'under_contact',
        message: 'Gap in communication may signal lost momentum',
        severity: 'high',
        recommendation: 'Re-engage with value-first approach',
      });
    }

    // Decreasing engagement warning
    if (analysis.engagementTrend === 'decreasing') {
      warnings.push({
        type: 'deal_stalling',
        message: 'Engagement declining over recent interactions',
        severity: 'high',
        recommendation: 'Change approach or re-qualify interest',
      });
    }

    // Competitor risk
    if (analysis.objectionSignals.some((s) => s.includes('Competitive'))) {
      warnings.push({
        type: 'competitor_risk',
        message: 'Competitive evaluation mentioned',
        severity: 'high',
        recommendation: 'Address differentiation proactively',
      });
    }

    return warnings;
  }

  private determineStrategy(context: FollowUpContext, intelligence: FollowUpIntelligence): FollowUpStrategy {
    let approach: FollowUpApproach = 'value_add';
    let tone: FollowUpTone = 'professional';
    let urgency: UrgencyLevel = 'medium';
    let persistence: PersistenceLevel = 'moderate';

    // Adjust based on temperature
    if (context.leadTemperature === 'hot') {
      approach = intelligence.closeReadiness.timing === 'now' ? 'direct_ask' : 'assumptive';
      urgency = 'high';
      persistence = 'aggressive';
    } else if (context.leadTemperature === 'cold' || context.leadTemperature === 'ice') {
      approach = 'value_add';
      tone = 'empathetic';
      urgency = 'low';
      persistence = 'patient';
    }

    // Adjust based on stage
    if (context.conversationStage === 'closing') {
      approach = 'direct_ask';
      urgency = 'high';
    } else if (context.conversationStage === 'discovery') {
      approach = 'consultative';
      tone = 'friendly';
    }

    return {
      approach,
      tone,
      urgency,
      persistence,
      valueEmphasis: ['ROI', 'time_savings', 'competitive_advantage'],
    };
  }

  private buildSequence(
    strategy: FollowUpStrategy,
    context: FollowUpContext,
    intelligence: FollowUpIntelligence
  ): FollowUpSequence {
    const steps: FollowUpStep[] = [];
    const baseDelay = strategy.persistence === 'aggressive' ? 2 : strategy.persistence === 'patient' ? 7 : 4;

    // Step 1: Initial follow-up
    steps.push({
      id: 'step_1',
      order: 1,
      timing: { daysAfterPrevious: 0, maxDelay: 2 },
      channel: 'email',
      message: {
        opening: this.getOpening(strategy.tone),
        body: intelligence.nextBestAction.message,
        callToAction: this.getCTA(strategy.approach),
        personalizationHooks: ['name', 'company', 'last_topic'],
      },
      purpose: 'Re-establish connection',
      expectedResponse: 'Engagement or reply',
    });

    // Step 2: Value add
    steps.push({
      id: 'step_2',
      order: 2,
      timing: { daysAfterPrevious: baseDelay, maxDelay: baseDelay + 2 },
      channel: 'email',
      message: {
        subject: 'Quick resource for you',
        opening: 'Thought this might be relevant...',
        body: 'Share industry insight or useful content',
        callToAction: 'Would love to hear your thoughts',
        personalizationHooks: ['industry', 'challenge_mentioned'],
      },
      purpose: 'Add value without asking',
      expectedResponse: 'Content engagement or reply',
    });

    // Step 3: Check-in
    steps.push({
      id: 'step_3',
      order: 3,
      timing: { daysAfterPrevious: baseDelay, maxDelay: baseDelay + 3 },
      channel: 'email',
      message: {
        subject: 'Quick check-in',
        opening: 'Hope all is well...',
        body: 'Wanted to see if you had any questions',
        callToAction: 'Happy to hop on a quick call if helpful',
        personalizationHooks: ['pending_question'],
      },
      purpose: 'Gentle progress check',
      expectedResponse: 'Status update or meeting',
    });

    // Step 4: Direct ask
    steps.push({
      id: 'step_4',
      order: 4,
      timing: { daysAfterPrevious: baseDelay * 1.5, maxDelay: baseDelay * 2 },
      channel: 'email',
      message: {
        subject: 'Should we connect?',
        opening: 'I wanted to reach out one more time...',
        body: 'Still interested in helping you achieve [goal]',
        callToAction: 'If the timing isn\'t right, just let me know',
        personalizationHooks: ['original_goal'],
      },
      purpose: 'Clear ask for direction',
      expectedResponse: 'Definitive response',
    });

    return {
      steps,
      currentStep: 0,
      adaptations: [
        {
          trigger: 'positive_response',
          action: 'accelerate',
        },
        {
          trigger: 'negative_response',
          action: 'pause',
        },
        {
          trigger: 'objection_raised',
          action: 'pivot',
          newStrategy: { approach: 'consultative' },
        },
      ],
      exitConditions: [
        { condition: 'meeting_booked', outcome: 'success', action: 'end_sequence' },
        { condition: 'explicit_no', outcome: 'failure', action: 'add_to_nurture' },
        { condition: 'unsubscribe', outcome: 'failure', action: 'remove_from_list' },
        { condition: 'sequence_complete', outcome: 'defer', action: 'schedule_future_attempt' },
      ],
    };
  }

  private getOpening(tone: FollowUpTone): string {
    const openings: Record<FollowUpTone, string> = {
      professional: 'I hope this message finds you well.',
      friendly: 'Hope you\'re having a great week!',
      casual: 'Hey! Quick note...',
      urgent: 'Wanted to follow up quickly...',
      empathetic: 'I know things can get busy...',
      challenging: 'I\'ll cut to the chase...',
    };
    return openings[tone];
  }

  private getCTA(approach: FollowUpApproach): string {
    const ctas: Record<FollowUpApproach, string> = {
      value_add: 'Thought you might find this useful',
      check_in: 'Would love to hear how things are going',
      assumptive: 'When would be a good time to continue our conversation?',
      consultative: 'What questions do you have?',
      direct_ask: 'Are you ready to move forward?',
      social_proof: 'Would you like me to connect you with a reference?',
      scarcity: 'Let me know if you want to secure your spot',
      patience: 'No rush - just here when you need me',
    };
    return ctas[approach];
  }

  getPlan(planId: string): FollowUpPlan | undefined {
    return this.plans.get(planId);
  }

  getStats(): {
    totalPlans: number;
    activePlans: number;
    avgStepsCompleted: number;
  } {
    const plans = Array.from(this.plans.values());
    const active = plans.filter((p) => p.status === 'active');

    return {
      totalPlans: plans.length,
      activePlans: active.length,
      avgStepsCompleted: plans.length > 0
        ? plans.reduce((sum, p) => sum + p.sequence.currentStep, 0) / plans.length
        : 0,
    };
  }
}

export const followUpIntelligence = new FollowUpIntelligenceSystem();
export { FollowUpIntelligenceSystem };
