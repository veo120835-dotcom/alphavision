/**
 * Dormancy Classifier
 * Classifies leads by true abandonment reason and dormancy stage
 */

export interface DormancyClassification {
  leadId: string;
  dormancyStage: DormancyStage;
  primaryReason: AbandonmentReason;
  secondaryReasons: AbandonmentReason[];
  dormancyDepth: number;
  reactivationPotential: number;
  optimalReentryWindow: TimeWindow;
  riskFactors: DormancyRisk[];
  recommendedApproach: ApproachRecommendation;
  classifiedAt: Date;
}

export type DormancyStage = 
  | 'cooling'           // 1-7 days - still warm
  | 'dormant'           // 7-30 days - disengaged but recoverable
  | 'deep_dormant'      // 30-90 days - significant effort needed
  | 'hibernating'       // 90-180 days - requires special approach
  | 'fossilized';       // 180+ days - very low probability

export type AbandonmentReason =
  | 'price_shock'
  | 'timing_mismatch'
  | 'trust_deficit'
  | 'identity_misalignment'
  | 'fear_of_commitment'
  | 'competitor_distraction'
  | 'internal_politics'
  | 'budget_constraints'
  | 'decision_paralysis'
  | 'value_unclear'
  | 'authority_insufficient'
  | 'urgency_lacking'
  | 'overwhelm'
  | 'life_event'
  | 'ghosting_habit'
  | 'unknown';

export interface TimeWindow {
  optimalStart: Date;
  optimalEnd: Date;
  peakMoment: Date;
  reasoning: string;
}

export interface DormancyRisk {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
}

export interface ApproachRecommendation {
  strategy: ReentryStrategy;
  channel: CommunicationChannel;
  tone: CommunicationTone;
  intensity: 'soft' | 'moderate' | 'assertive';
  messageFraming: string;
  avoidances: string[];
}

export type ReentryStrategy =
  | 'value_reminder'
  | 'new_angle'
  | 'social_proof_injection'
  | 'scarcity_authentic'
  | 'relationship_rebuild'
  | 'problem_resurface'
  | 'success_story'
  | 'direct_ask'
  | 'soft_check_in'
  | 'permission_based';

export type CommunicationChannel =
  | 'email'
  | 'phone'
  | 'sms'
  | 'social_dm'
  | 'video_message'
  | 'direct_mail'
  | 'retargeting';

export type CommunicationTone =
  | 'professional'
  | 'warm'
  | 'casual'
  | 'authoritative'
  | 'empathetic'
  | 'curious'
  | 'direct';

export interface LeadBehaviorSignals {
  lastEngagement: Date;
  engagementHistory: EngagementEvent[];
  communicationPreferences: CommunicationPreference[];
  responsePatterns: ResponsePattern[];
  priceReactions: PriceReaction[];
  objectionHistory: string[];
}

export interface EngagementEvent {
  type: string;
  timestamp: Date;
  depth: number;
  sentiment: number;
}

export interface CommunicationPreference {
  channel: CommunicationChannel;
  preferenceScore: number;
  responseRate: number;
}

export interface ResponsePattern {
  dayOfWeek: number;
  timeOfDay: string;
  responseSpeed: number;
  engagementQuality: number;
}

export interface PriceReaction {
  pricePoint: number;
  reaction: 'positive' | 'neutral' | 'hesitant' | 'negative' | 'shock';
  context: string;
}

export interface ClassificationConfig {
  stageThresholds: {
    cooling: number;
    dormant: number;
    deepDormant: number;
    hibernating: number;
  };
  weights: {
    recency: number;
    engagement: number;
    intent: number;
    fit: number;
  };
}

export class DormancyClassifier {
  private config: ClassificationConfig;
  private reasonPatterns: Map<AbandonmentReason, ReasonPattern>;

  constructor(config?: Partial<ClassificationConfig>) {
    this.config = {
      stageThresholds: {
        cooling: 7,
        dormant: 30,
        deepDormant: 90,
        hibernating: 180
      },
      weights: {
        recency: 0.3,
        engagement: 0.25,
        intent: 0.25,
        fit: 0.2
      },
      ...config
    };
    this.reasonPatterns = this.initializeReasonPatterns();
  }

  private initializeReasonPatterns(): Map<AbandonmentReason, ReasonPattern> {
    const patterns = new Map<AbandonmentReason, ReasonPattern>();

    patterns.set('price_shock', {
      indicators: ['price_mentioned', 'budget_concern', 'comparison_shopping'],
      behaviorSignals: ['disengaged_after_pricing', 'asked_for_discount'],
      confidence: 0.85
    });

    patterns.set('timing_mismatch', {
      indicators: ['not_now', 'next_quarter', 'busy_period'],
      behaviorSignals: ['positive_but_delayed', 'calendar_conflicts'],
      confidence: 0.80
    });

    patterns.set('trust_deficit', {
      indicators: ['skeptical_questions', 'proof_requests', 'reference_asks'],
      behaviorSignals: ['shallow_engagement', 'avoided_commitment'],
      confidence: 0.75
    });

    patterns.set('identity_misalignment', {
      indicators: ['not_for_me', 'different_approach', 'cultural_mismatch'],
      behaviorSignals: ['discomfort_signals', 'value_conflicts'],
      confidence: 0.70
    });

    patterns.set('fear_of_commitment', {
      indicators: ['need_to_think', 'big_decision', 'risk_averse'],
      behaviorSignals: ['multiple_delays', 'approach_avoidance'],
      confidence: 0.75
    });

    patterns.set('decision_paralysis', {
      indicators: ['too_many_options', 'overwhelmed', 'analysis_paralysis'],
      behaviorSignals: ['extensive_research', 'no_decision_made'],
      confidence: 0.70
    });

    return patterns;
  }

  async classifyLead(
    leadId: string,
    signals: LeadBehaviorSignals,
    context: ClassificationContext
  ): Promise<DormancyClassification> {
    const dormancyStage = this.determineDormancyStage(signals.lastEngagement);
    const reasons = await this.identifyAbandonmentReasons(signals, context);
    const dormancyDepth = this.calculateDormancyDepth(signals, dormancyStage);
    const reactivationPotential = this.assessReactivationPotential(signals, reasons, dormancyStage);
    const optimalWindow = this.calculateOptimalReentryWindow(signals, dormancyStage, reasons);
    const risks = this.identifyRisks(signals, reasons, dormancyStage);
    const approach = this.recommendApproach(reasons, dormancyStage, signals, reactivationPotential);

    return {
      leadId,
      dormancyStage,
      primaryReason: reasons[0] || 'unknown',
      secondaryReasons: reasons.slice(1),
      dormancyDepth,
      reactivationPotential,
      optimalReentryWindow: optimalWindow,
      riskFactors: risks,
      recommendedApproach: approach,
      classifiedAt: new Date()
    };
  }

  private determineDormancyStage(lastEngagement: Date): DormancyStage {
    const daysSinceEngagement = Math.floor(
      (Date.now() - lastEngagement.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceEngagement <= this.config.stageThresholds.cooling) {
      return 'cooling';
    } else if (daysSinceEngagement <= this.config.stageThresholds.dormant) {
      return 'dormant';
    } else if (daysSinceEngagement <= this.config.stageThresholds.deepDormant) {
      return 'deep_dormant';
    } else if (daysSinceEngagement <= this.config.stageThresholds.hibernating) {
      return 'hibernating';
    }
    return 'fossilized';
  }

  private async identifyAbandonmentReasons(
    signals: LeadBehaviorSignals,
    context: ClassificationContext
  ): Promise<AbandonmentReason[]> {
    const reasonScores: Map<AbandonmentReason, number> = new Map();

    // Analyze price reactions
    if (signals.priceReactions.some(r => r.reaction === 'shock' || r.reaction === 'negative')) {
      reasonScores.set('price_shock', 0.9);
    }

    // Analyze objection history
    for (const objection of signals.objectionHistory) {
      const matchedReason = this.matchObjectionToReason(objection);
      if (matchedReason) {
        const currentScore = reasonScores.get(matchedReason) || 0;
        reasonScores.set(matchedReason, Math.min(currentScore + 0.3, 1));
      }
    }

    // Analyze engagement patterns
    const engagementDecline = this.analyzeEngagementDecline(signals.engagementHistory);
    if (engagementDecline.suddenDrop) {
      reasonScores.set('competitor_distraction', 0.6);
    }
    if (engagementDecline.gradualFade) {
      reasonScores.set('urgency_lacking', 0.5);
    }

    // Sort by score and return top reasons
    return Array.from(reasonScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([reason]) => reason);
  }

  private matchObjectionToReason(objection: string): AbandonmentReason | null {
    const objectionLower = objection.toLowerCase();

    const mappings: Array<{ keywords: string[]; reason: AbandonmentReason }> = [
      { keywords: ['expensive', 'cost', 'price', 'budget', 'afford'], reason: 'price_shock' },
      { keywords: ['later', 'timing', 'busy', 'not now', 'next'], reason: 'timing_mismatch' },
      { keywords: ['trust', 'guarantee', 'proof', 'results', 'skeptical'], reason: 'trust_deficit' },
      { keywords: ['not for me', 'different', 'approach', 'style'], reason: 'identity_misalignment' },
      { keywords: ['think about', 'decide', 'commitment', 'risk'], reason: 'fear_of_commitment' },
      { keywords: ['overwhelmed', 'options', 'confused', 'complicated'], reason: 'decision_paralysis' }
    ];

    for (const mapping of mappings) {
      if (mapping.keywords.some(kw => objectionLower.includes(kw))) {
        return mapping.reason;
      }
    }

    return null;
  }

  private analyzeEngagementDecline(history: EngagementEvent[]): EngagementDeclineAnalysis {
    if (history.length < 2) {
      return { suddenDrop: false, gradualFade: false, pattern: 'insufficient_data' };
    }

    const sorted = [...history].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const recentEngagements = sorted.slice(-5);
    
    const depths = recentEngagements.map(e => e.depth);
    const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
    
    const lastDepth = depths[depths.length - 1];
    const firstDepth = depths[0];

    return {
      suddenDrop: lastDepth < firstDepth * 0.3,
      gradualFade: avgDepth < firstDepth * 0.6 && lastDepth > firstDepth * 0.2,
      pattern: lastDepth < avgDepth ? 'declining' : 'stable'
    };
  }

  private calculateDormancyDepth(signals: LeadBehaviorSignals, stage: DormancyStage): number {
    const stageWeight: Record<DormancyStage, number> = {
      'cooling': 0.2,
      'dormant': 0.4,
      'deep_dormant': 0.6,
      'hibernating': 0.8,
      'fossilized': 1.0
    };

    const engagementFactor = this.calculateEngagementFactor(signals.engagementHistory);
    const responseFactor = this.calculateResponseFactor(signals.responsePatterns);

    return Math.min(1, stageWeight[stage] * 0.5 + (1 - engagementFactor) * 0.3 + (1 - responseFactor) * 0.2);
  }

  private calculateEngagementFactor(history: EngagementEvent[]): number {
    if (history.length === 0) return 0;
    const avgDepth = history.reduce((sum, e) => sum + e.depth, 0) / history.length;
    const avgSentiment = history.reduce((sum, e) => sum + e.sentiment, 0) / history.length;
    return (avgDepth + avgSentiment) / 2;
  }

  private calculateResponseFactor(patterns: ResponsePattern[]): number {
    if (patterns.length === 0) return 0;
    const avgQuality = patterns.reduce((sum, p) => sum + p.engagementQuality, 0) / patterns.length;
    const avgSpeed = patterns.reduce((sum, p) => sum + Math.min(1, 1 / (p.responseSpeed + 1)), 0) / patterns.length;
    return (avgQuality + avgSpeed) / 2;
  }

  private assessReactivationPotential(
    signals: LeadBehaviorSignals,
    reasons: AbandonmentReason[],
    stage: DormancyStage
  ): number {
    const stagePotential: Record<DormancyStage, number> = {
      'cooling': 0.9,
      'dormant': 0.7,
      'deep_dormant': 0.5,
      'hibernating': 0.3,
      'fossilized': 0.15
    };

    const reasonRecoverability: Record<AbandonmentReason, number> = {
      'timing_mismatch': 0.9,
      'budget_constraints': 0.7,
      'urgency_lacking': 0.8,
      'decision_paralysis': 0.75,
      'price_shock': 0.6,
      'trust_deficit': 0.5,
      'fear_of_commitment': 0.65,
      'competitor_distraction': 0.4,
      'identity_misalignment': 0.3,
      'internal_politics': 0.4,
      'value_unclear': 0.7,
      'authority_insufficient': 0.5,
      'overwhelm': 0.6,
      'life_event': 0.5,
      'ghosting_habit': 0.2,
      'unknown': 0.5
    };

    const baseScore = stagePotential[stage];
    const reasonScore = reasons.length > 0 ? reasonRecoverability[reasons[0]] : 0.5;
    const engagementBonus = this.calculateEngagementFactor(signals.engagementHistory) * 0.2;

    return Math.min(1, baseScore * 0.4 + reasonScore * 0.4 + engagementBonus);
  }

  private calculateOptimalReentryWindow(
    signals: LeadBehaviorSignals,
    stage: DormancyStage,
    reasons: AbandonmentReason[]
  ): TimeWindow {
    const now = new Date();
    const baseDelay = this.getBaseDelay(stage);
    
    // Adjust for reason
    const reasonDelay = this.getReasonDelay(reasons[0]);
    
    // Consider response patterns
    const bestDay = this.findBestDay(signals.responsePatterns);
    
    const optimalStart = new Date(now.getTime() + baseDelay + reasonDelay);
    const optimalEnd = new Date(optimalStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const peakMoment = this.adjustToOptimalDay(optimalStart, bestDay);

    return {
      optimalStart,
      optimalEnd,
      peakMoment,
      reasoning: `Based on ${stage} stage and ${reasons[0] || 'unknown'} reason, with historical response pattern preference for day ${bestDay}`
    };
  }

  private getBaseDelay(stage: DormancyStage): number {
    const delays: Record<DormancyStage, number> = {
      'cooling': 2 * 24 * 60 * 60 * 1000,
      'dormant': 5 * 24 * 60 * 60 * 1000,
      'deep_dormant': 14 * 24 * 60 * 60 * 1000,
      'hibernating': 30 * 24 * 60 * 60 * 1000,
      'fossilized': 60 * 24 * 60 * 60 * 1000
    };
    return delays[stage];
  }

  private getReasonDelay(reason: AbandonmentReason | undefined): number {
    if (!reason) return 0;
    const delays: Partial<Record<AbandonmentReason, number>> = {
      'timing_mismatch': 14 * 24 * 60 * 60 * 1000,
      'life_event': 30 * 24 * 60 * 60 * 1000,
      'budget_constraints': 21 * 24 * 60 * 60 * 1000
    };
    return delays[reason] || 0;
  }

  private findBestDay(patterns: ResponsePattern[]): number {
    if (patterns.length === 0) return 2; // Default to Tuesday
    return patterns.reduce((best, p) => 
      p.engagementQuality > (patterns.find(pat => pat.dayOfWeek === best)?.engagementQuality || 0)
        ? p.dayOfWeek 
        : best
    , 2);
  }

  private adjustToOptimalDay(date: Date, targetDay: number): Date {
    const result = new Date(date);
    const currentDay = result.getDay();
    const daysToAdd = (targetDay - currentDay + 7) % 7;
    result.setDate(result.getDate() + daysToAdd);
    return result;
  }

  private identifyRisks(
    signals: LeadBehaviorSignals,
    reasons: AbandonmentReason[],
    stage: DormancyStage
  ): DormancyRisk[] {
    const risks: DormancyRisk[] = [];

    if (stage === 'fossilized') {
      risks.push({
        type: 'extreme_dormancy',
        severity: 'critical',
        description: 'Lead has been inactive for 6+ months, memory of interaction likely faded',
        mitigation: 'Start fresh with re-introduction, avoid referencing old conversations'
      });
    }

    if (reasons.includes('trust_deficit')) {
      risks.push({
        type: 'trust_damage',
        severity: 'high',
        description: 'Previous interactions may have damaged trust',
        mitigation: 'Lead with proof and third-party validation before any ask'
      });
    }

    if (reasons.includes('ghosting_habit')) {
      risks.push({
        type: 'chronic_ghoster',
        severity: 'high',
        description: 'Lead has pattern of disappearing without explanation',
        mitigation: 'Set explicit micro-commitments and confirm each step'
      });
    }

    if (signals.objectionHistory.length > 5) {
      risks.push({
        type: 'objection_fatigue',
        severity: 'medium',
        description: 'Lead has raised many objections, may be exhausted',
        mitigation: 'Use completely fresh angle, avoid addressing old objections'
      });
    }

    return risks;
  }

  private recommendApproach(
    reasons: AbandonmentReason[],
    stage: DormancyStage,
    signals: LeadBehaviorSignals,
    potential: number
  ): ApproachRecommendation {
    const primaryReason = reasons[0] || 'unknown';
    
    const strategyMap: Partial<Record<AbandonmentReason, ReentryStrategy>> = {
      'price_shock': 'value_reminder',
      'timing_mismatch': 'soft_check_in',
      'trust_deficit': 'social_proof_injection',
      'identity_misalignment': 'new_angle',
      'fear_of_commitment': 'permission_based',
      'decision_paralysis': 'direct_ask',
      'value_unclear': 'success_story',
      'urgency_lacking': 'problem_resurface'
    };

    const preferredChannel = this.selectChannel(signals.communicationPreferences, stage);
    const tone = this.selectTone(primaryReason, stage);
    const intensity = potential > 0.7 ? 'moderate' : potential > 0.4 ? 'soft' : 'assertive';

    return {
      strategy: strategyMap[primaryReason] || 'soft_check_in',
      channel: preferredChannel,
      tone,
      intensity,
      messageFraming: this.generateFraming(primaryReason, stage),
      avoidances: this.generateAvoidances(reasons, signals)
    };
  }

  private selectChannel(preferences: CommunicationPreference[], stage: DormancyStage): CommunicationChannel {
    if (preferences.length > 0) {
      const best = preferences.reduce((a, b) => a.responseRate > b.responseRate ? a : b);
      if (best.responseRate > 0.3) return best.channel;
    }
    
    // Default based on stage
    if (stage === 'cooling' || stage === 'dormant') return 'email';
    if (stage === 'deep_dormant') return 'phone';
    return 'email';
  }

  private selectTone(reason: AbandonmentReason, stage: DormancyStage): CommunicationTone {
    if (reason === 'trust_deficit') return 'professional';
    if (reason === 'fear_of_commitment') return 'empathetic';
    if (stage === 'fossilized') return 'warm';
    if (stage === 'cooling') return 'casual';
    return 'professional';
  }

  private generateFraming(reason: AbandonmentReason, stage: DormancyStage): string {
    const framings: Partial<Record<AbandonmentReason, string>> = {
      'price_shock': 'Focus on ROI and outcomes, not features. Show value exceeds investment.',
      'timing_mismatch': 'Acknowledge their timing, check if circumstances changed.',
      'trust_deficit': 'Lead with proof, testimonials, and risk reversal.',
      'identity_misalignment': 'Reframe offer in terms that match their values and approach.',
      'fear_of_commitment': 'Offer smaller first step, reduce perceived risk.',
      'decision_paralysis': 'Simplify to one clear choice, remove options.',
      'value_unclear': 'Tell specific success story relevant to their situation.'
    };

    return framings[reason] || 'Open with genuine curiosity about their current situation.';
  }

  private generateAvoidances(reasons: AbandonmentReason[], signals: LeadBehaviorSignals): string[] {
    const avoidances: string[] = [];

    if (reasons.includes('price_shock')) {
      avoidances.push('Avoid mentioning price early');
      avoidances.push('Do not offer discounts proactively');
    }

    if (reasons.includes('trust_deficit')) {
      avoidances.push('Avoid making claims without proof');
      avoidances.push('Do not push for quick decisions');
    }

    if (signals.objectionHistory.length > 3) {
      avoidances.push('Avoid rehashing old objections');
    }

    avoidances.push('Do not reference their silence negatively');
    avoidances.push('Avoid guilt-based messaging');

    return avoidances;
  }
}

interface ReasonPattern {
  indicators: string[];
  behaviorSignals: string[];
  confidence: number;
}

interface ClassificationContext {
  industry: string;
  offerType: string;
  averageSalesCycle: number;
  competitiveLandscape: string;
}

interface EngagementDeclineAnalysis {
  suddenDrop: boolean;
  gradualFade: boolean;
  pattern: string;
}
