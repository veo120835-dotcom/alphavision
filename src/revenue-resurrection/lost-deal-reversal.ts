// Lost Deal Reversal System
// Strategic framework for recovering deals marked as lost

export interface LostDeal {
  id: string;
  leadId: string;
  originalOpportunityValue: number;
  lossDate: Date;
  stageWhenLost: string;
  competitorWon?: string;
  statedLossReason: string;
  inferredLossReason?: string;
  decisionMakers: DecisionMaker[];
  interactionHistory: Interaction[];
  proposalDetails?: ProposalDetails;
  competitiveContext: CompetitiveContext;
  relationshipStrength: RelationshipStrength;
}

export interface DecisionMaker {
  id: string;
  name: string;
  role: string;
  influence: 'primary' | 'secondary' | 'influencer' | 'blocker';
  sentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
  lastContact: Date;
  preferredChannel: string;
  keyMotivations: string[];
}

export interface Interaction {
  date: Date;
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'negotiation';
  outcome: 'positive' | 'neutral' | 'negative';
  notes: string;
  nextStepsAgreed?: string[];
}

export interface ProposalDetails {
  submittedDate: Date;
  value: number;
  terms: string[];
  keyDifferentiators: string[];
  weaknesses: string[];
  competitorComparison?: CompetitorComparison;
}

export interface CompetitorComparison {
  competitorName: string;
  theirPrice?: number;
  theirStrengths: string[];
  theirWeaknesses: string[];
  winProbability: number;
}

export interface CompetitiveContext {
  knownCompetitors: string[];
  competitorChosen?: string;
  reasonsForChoice: string[];
  marketConditions: string;
  budgetConstraints?: string;
}

export interface RelationshipStrength {
  overallScore: number; // 0-100
  trustLevel: 'high' | 'medium' | 'low' | 'broken';
  championsIdentified: boolean;
  executiveAccess: boolean;
  technicalValidated: boolean;
}

export interface ReversalOpportunity {
  dealId: string;
  reversalProbability: number;
  optimalTiming: TimingWindow;
  primaryStrategy: ReversalStrategy;
  alternativeStrategies: ReversalStrategy[];
  triggerEvents: TriggerEvent[];
  reentryApproach: ReentryApproach;
  riskFactors: RiskFactor[];
  estimatedValue: number;
  confidenceLevel: number;
}

export interface TimingWindow {
  earliestReentry: Date;
  optimalReentry: Date;
  latestReentry: Date;
  triggerConditions: string[];
  avoidPeriods: DateRange[];
}

export interface DateRange {
  start: Date;
  end: Date;
  reason: string;
}

export interface ReversalStrategy {
  id: string;
  name: string;
  approach: ReversalApproach;
  requiredConditions: string[];
  messaging: StrategicMessaging;
  targetContacts: string[];
  expectedOutcome: string;
  successProbability: number;
  timeToResult: number; // days
}

export type ReversalApproach = 
  | 'value_repositioning'
  | 'new_stakeholder_entry'
  | 'competitive_displacement'
  | 'changed_circumstances'
  | 'relationship_rebuild'
  | 'new_offer_structure'
  | 'executive_escalation'
  | 'reference_leverage'
  | 'pilot_proposal'
  | 'partnership_reframe';

export interface StrategicMessaging {
  openingHook: string;
  valueProposition: string;
  differentiator: string;
  callToAction: string;
  objectionPreemption: string[];
  proofElements: string[];
}

export interface TriggerEvent {
  type: TriggerType;
  description: string;
  monitoringMethod: string;
  expectedTimeline?: string;
  probability: number;
}

export type TriggerType = 
  | 'competitor_failure'
  | 'budget_cycle'
  | 'leadership_change'
  | 'strategic_shift'
  | 'regulatory_change'
  | 'expansion_announcement'
  | 'merger_acquisition'
  | 'technology_upgrade'
  | 'contract_renewal'
  | 'pain_point_escalation';

export interface ReentryApproach {
  channel: 'email' | 'phone' | 'linkedin' | 'referral' | 'event' | 'content';
  contactSequence: ContactStep[];
  escalationPath: EscalationStep[];
  fallbackStrategy: string;
}

export interface ContactStep {
  day: number;
  action: string;
  channel: string;
  message: string;
  expectedResponse: string;
  nextStepIfPositive: string;
  nextStepIfNegative: string;
}

export interface EscalationStep {
  trigger: string;
  action: string;
  owner: string;
  timeline: string;
}

export interface RiskFactor {
  factor: string;
  severity: 'high' | 'medium' | 'low';
  mitigation: string;
  likelihood: number;
}

export interface ReversalOutcome {
  dealId: string;
  attemptDate: Date;
  strategyUsed: string;
  result: 'won' | 'progressing' | 'rejected' | 'no_response';
  newOpportunityValue?: number;
  lessonsLearned: string[];
  feedbackForSystem: SystemFeedback;
}

export interface SystemFeedback {
  strategyEffectiveness: number;
  timingAccuracy: number;
  messagingResonance: number;
  contactApproachSuccess: boolean;
  unexpectedFactors: string[];
}

export class LostDealReversalSystem {
  private lostDeals: Map<string, LostDeal> = new Map();
  private reversalAttempts: Map<string, ReversalOutcome[]> = new Map();
  private successPatterns: ReversalPattern[] = [];

  analyzeLostDeal(deal: LostDeal): ReversalOpportunity {
    const reversalProbability = this.calculateReversalProbability(deal);
    const optimalTiming = this.determineOptimalTiming(deal);
    const strategies = this.generateStrategies(deal);
    const triggers = this.identifyTriggerEvents(deal);

    return {
      dealId: deal.id,
      reversalProbability,
      optimalTiming,
      primaryStrategy: strategies[0],
      alternativeStrategies: strategies.slice(1),
      triggerEvents: triggers,
      reentryApproach: this.designReentryApproach(deal, strategies[0]),
      riskFactors: this.assessRisks(deal),
      estimatedValue: this.calculateEstimatedValue(deal, reversalProbability),
      confidenceLevel: this.calculateConfidence(deal)
    };
  }

  private calculateReversalProbability(deal: LostDeal): number {
    let probability = 0.3; // Base probability

    // Relationship factors
    if (deal.relationshipStrength.trustLevel === 'high') probability += 0.15;
    if (deal.relationshipStrength.championsIdentified) probability += 0.1;
    if (deal.relationshipStrength.executiveAccess) probability += 0.1;

    // Loss reason factors
    const reversibleReasons = ['timing', 'budget', 'priority_shift', 'internal_politics'];
    if (reversibleReasons.some(r => deal.statedLossReason.toLowerCase().includes(r))) {
      probability += 0.15;
    }

    // Competitive factors
    if (deal.competitiveContext.competitorChosen) {
      // Competitor wins are harder to reverse
      probability -= 0.1;
    }

    // Time since loss
    const daysSinceLoss = (Date.now() - deal.lossDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLoss < 30) probability += 0.1;
    else if (daysSinceLoss > 180) probability -= 0.15;

    return Math.max(0, Math.min(1, probability));
  }

  private determineOptimalTiming(deal: LostDeal): TimingWindow {
    const now = new Date();
    const daysSinceLoss = (now.getTime() - deal.lossDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Calculate optimal reentry based on loss reason
    let optimalDays = 90; // Default 90 days
    
    if (deal.statedLossReason.toLowerCase().includes('budget')) {
      optimalDays = 120; // Wait for new budget cycle
    } else if (deal.statedLossReason.toLowerCase().includes('timing')) {
      optimalDays = 60;
    } else if (deal.competitiveContext.competitorChosen) {
      optimalDays = 180; // Wait for competitor issues to surface
    }

    const optimalDate = new Date(deal.lossDate.getTime() + optimalDays * 24 * 60 * 60 * 1000);
    
    return {
      earliestReentry: new Date(Math.max(now.getTime(), deal.lossDate.getTime() + 30 * 24 * 60 * 60 * 1000)),
      optimalReentry: optimalDate > now ? optimalDate : now,
      latestReentry: new Date(deal.lossDate.getTime() + 365 * 24 * 60 * 60 * 1000),
      triggerConditions: this.identifyTimingTriggers(deal),
      avoidPeriods: this.identifyAvoidPeriods(deal)
    };
  }

  private identifyTimingTriggers(deal: LostDeal): string[] {
    const triggers: string[] = [];
    
    if (deal.competitiveContext.competitorChosen) {
      triggers.push('Competitor renewal period approaching');
      triggers.push('Public news of competitor issues');
    }
    
    triggers.push('Fiscal year/quarter end');
    triggers.push('Leadership changes announced');
    triggers.push('Strategic initiative announcements');
    triggers.push('Industry event participation');
    
    return triggers;
  }

  private identifyAvoidPeriods(deal: LostDeal): DateRange[] {
    const periods: DateRange[] = [];
    
    // Avoid immediate post-loss period
    periods.push({
      start: deal.lossDate,
      end: new Date(deal.lossDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      reason: 'Too soon after loss - emotions still fresh'
    });

    // Avoid holiday periods
    const now = new Date();
    const year = now.getFullYear();
    periods.push({
      start: new Date(year, 11, 20),
      end: new Date(year + 1, 0, 5),
      reason: 'Holiday period - low response rates'
    });

    return periods;
  }

  private generateStrategies(deal: LostDeal): ReversalStrategy[] {
    const strategies: ReversalStrategy[] = [];

    // Value repositioning if they misunderstood value
    if (deal.relationshipStrength.trustLevel !== 'broken') {
      strategies.push(this.createValueRepositioningStrategy(deal));
    }

    // New stakeholder if original contacts were blockers
    if (deal.decisionMakers.some(dm => dm.sentiment === 'negative')) {
      strategies.push(this.createNewStakeholderStrategy(deal));
    }

    // Competitive displacement if competitor won
    if (deal.competitiveContext.competitorChosen) {
      strategies.push(this.createCompetitiveDisplacementStrategy(deal));
    }

    // Pilot proposal for risk-averse prospects
    strategies.push(this.createPilotProposalStrategy(deal));

    return strategies.sort((a, b) => b.successProbability - a.successProbability);
  }

  private createValueRepositioningStrategy(deal: LostDeal): ReversalStrategy {
    return {
      id: `vr_${deal.id}`,
      name: 'Value Repositioning',
      approach: 'value_repositioning',
      requiredConditions: [
        'Relationship not damaged',
        'Original proposal undervalued offering',
        'New proof points available'
      ],
      messaging: {
        openingHook: 'New insights from similar clients that changes the equation',
        valueProposition: 'Repositioned around their specific pain points',
        differentiator: 'Unique capability they may have overlooked',
        callToAction: '15-minute insight share',
        objectionPreemption: ['We understand timing was not right before'],
        proofElements: ['New case study', 'Updated ROI model', 'Peer reference']
      },
      targetContacts: deal.decisionMakers
        .filter(dm => dm.sentiment !== 'negative')
        .map(dm => dm.id),
      expectedOutcome: 'Re-opened conversation with new value angle',
      successProbability: 0.35,
      timeToResult: 45
    };
  }

  private createNewStakeholderStrategy(deal: LostDeal): ReversalStrategy {
    return {
      id: `ns_${deal.id}`,
      name: 'New Stakeholder Entry',
      approach: 'new_stakeholder_entry',
      requiredConditions: [
        'Additional stakeholders identifiable',
        'Problem affects multiple departments',
        'Original contact was not true decision maker'
      ],
      messaging: {
        openingHook: 'Insight relevant to their specific function',
        valueProposition: 'Department-specific value proposition',
        differentiator: 'Unique insight for their role',
        callToAction: 'Quick consultation on their specific challenge',
        objectionPreemption: ['No pressure approach', 'Fresh perspective'],
        proofElements: ['Role-specific case study', 'Peer testimonial']
      },
      targetContacts: ['new_stakeholder_research_required'],
      expectedOutcome: 'New internal champion identified',
      successProbability: 0.25,
      timeToResult: 60
    };
  }

  private createCompetitiveDisplacementStrategy(deal: LostDeal): ReversalStrategy {
    return {
      id: `cd_${deal.id}`,
      name: 'Competitive Displacement',
      approach: 'competitive_displacement',
      requiredConditions: [
        'Competitor chosen',
        'Implementation period passed',
        'Potential for competitor underperformance'
      ],
      messaging: {
        openingHook: 'Not here to second-guess - genuinely curious how things are going',
        valueProposition: 'Complementary capability or gap filler',
        differentiator: 'What we do differently',
        callToAction: 'Informal check-in',
        objectionPreemption: ['Respecting their decision', 'Future relationship focus'],
        proofElements: ['Competitive switch case study', 'Migration support']
      },
      targetContacts: deal.decisionMakers
        .filter(dm => dm.influence === 'primary')
        .map(dm => dm.id),
      expectedOutcome: 'Positioned for future consideration',
      successProbability: 0.2,
      timeToResult: 180
    };
  }

  private createPilotProposalStrategy(deal: LostDeal): ReversalStrategy {
    return {
      id: `pp_${deal.id}`,
      name: 'Pilot Proposal',
      approach: 'pilot_proposal',
      requiredConditions: [
        'Full commitment was the barrier',
        'Solution can be piloted',
        'Budget for smaller engagement exists'
      ],
      messaging: {
        openingHook: 'Smaller way to prove value before full commitment',
        valueProposition: 'Low-risk proof of concept',
        differentiator: 'Confidence in delivering results',
        callToAction: 'Explore a pilot scope',
        objectionPreemption: ['No long-term lock-in', 'Success-based expansion'],
        proofElements: ['Pilot success stories', 'Clear success metrics']
      },
      targetContacts: deal.decisionMakers.map(dm => dm.id),
      expectedOutcome: 'Pilot engagement initiated',
      successProbability: 0.3,
      timeToResult: 30
    };
  }

  private identifyTriggerEvents(deal: LostDeal): TriggerEvent[] {
    const triggers: TriggerEvent[] = [];

    if (deal.competitiveContext.competitorChosen) {
      triggers.push({
        type: 'competitor_failure',
        description: 'Signs of competitor underperformance or dissatisfaction',
        monitoringMethod: 'Social listening, industry news, contact check-ins',
        expectedTimeline: '6-12 months post-implementation',
        probability: 0.3
      });

      triggers.push({
        type: 'contract_renewal',
        description: 'Competitor contract renewal approaching',
        monitoringMethod: 'Timeline tracking from original loss date',
        expectedTimeline: '12-24 months',
        probability: 0.5
      });
    }

    triggers.push({
      type: 'leadership_change',
      description: 'New decision maker with different priorities',
      monitoringMethod: 'LinkedIn monitoring, company news',
      probability: 0.2
    });

    triggers.push({
      type: 'budget_cycle',
      description: 'New fiscal year budget allocation',
      monitoringMethod: 'Calendar-based tracking',
      expectedTimeline: 'Fiscal year start',
      probability: 0.4
    });

    triggers.push({
      type: 'strategic_shift',
      description: 'Company announces new strategic initiative',
      monitoringMethod: 'Press releases, earnings calls, industry news',
      probability: 0.25
    });

    return triggers;
  }

  private designReentryApproach(deal: LostDeal, strategy: ReversalStrategy): ReentryApproach {
    const primaryContact = deal.decisionMakers.find(dm => dm.influence === 'primary');
    const preferredChannel = primaryContact?.preferredChannel || 'email';

    return {
      channel: preferredChannel as any,
      contactSequence: [
        {
          day: 0,
          action: 'Initial outreach',
          channel: preferredChannel,
          message: strategy.messaging.openingHook,
          expectedResponse: 'Acknowledgment or curiosity',
          nextStepIfPositive: 'Schedule brief call',
          nextStepIfNegative: 'Wait and try alternative contact'
        },
        {
          day: 5,
          action: 'Value-add follow-up',
          channel: 'email',
          message: 'Share relevant insight or resource',
          expectedResponse: 'Engagement with content',
          nextStepIfPositive: 'Request brief conversation',
          nextStepIfNegative: 'Try different angle'
        },
        {
          day: 14,
          action: 'Soft check-in',
          channel: 'linkedin',
          message: 'Non-salesy connection message',
          expectedResponse: 'Connection or response',
          nextStepIfPositive: 'Continue relationship building',
          nextStepIfNegative: 'Move to monitoring mode'
        }
      ],
      escalationPath: [
        {
          trigger: 'No response after 3 touches',
          action: 'Try alternative contact or channel',
          owner: 'Account executive',
          timeline: '30 days'
        },
        {
          trigger: 'Positive signal received',
          action: 'Escalate to senior contact for executive outreach',
          owner: 'Sales leader',
          timeline: 'Within 48 hours'
        }
      ],
      fallbackStrategy: 'Move to long-term nurture with quarterly value touches'
    };
  }

  private assessRisks(deal: LostDeal): RiskFactor[] {
    const risks: RiskFactor[] = [];

    if (deal.relationshipStrength.trustLevel === 'broken') {
      risks.push({
        factor: 'Damaged relationship may preclude reentry',
        severity: 'high',
        mitigation: 'Use different contact or wait longer',
        likelihood: 0.7
      });
    }

    if (deal.competitiveContext.competitorChosen) {
      risks.push({
        factor: 'Competitor lock-in may prevent switching',
        severity: 'medium',
        mitigation: 'Focus on gaps competitor cannot fill',
        likelihood: 0.5
      });
    }

    risks.push({
      factor: 'Contact may have moved on',
      severity: 'low',
      mitigation: 'Research current role before outreach',
      likelihood: 0.3
    });

    return risks;
  }

  private calculateEstimatedValue(deal: LostDeal, probability: number): number {
    return deal.originalOpportunityValue * probability * 0.8; // 80% of original due to potential concessions
  }

  private calculateConfidence(deal: LostDeal): number {
    let confidence = 0.5;

    // More data = higher confidence
    if (deal.interactionHistory.length > 5) confidence += 0.1;
    if (deal.proposalDetails) confidence += 0.1;
    if (deal.inferredLossReason) confidence += 0.1;
    if (deal.decisionMakers.length > 1) confidence += 0.1;

    return Math.min(1, confidence);
  }

  recordOutcome(outcome: ReversalOutcome): void {
    const existing = this.reversalAttempts.get(outcome.dealId) || [];
    existing.push(outcome);
    this.reversalAttempts.set(outcome.dealId, existing);
    
    // Update success patterns
    if (outcome.result === 'won') {
      this.extractSuccessPattern(outcome);
    }
  }

  private extractSuccessPattern(outcome: ReversalOutcome): void {
    // Pattern extraction logic would analyze what made this reversal successful
    // and add it to the successPatterns array for future strategy optimization
  }

  getReversalPipeline(): ReversalOpportunity[] {
    const opportunities: ReversalOpportunity[] = [];
    
    for (const deal of this.lostDeals.values()) {
      const opportunity = this.analyzeLostDeal(deal);
      if (opportunity.reversalProbability > 0.15) {
        opportunities.push(opportunity);
      }
    }

    return opportunities.sort((a, b) => 
      (b.reversalProbability * b.estimatedValue) - (a.reversalProbability * a.estimatedValue)
    );
  }
}

interface ReversalPattern {
  id: string;
  conditions: string[];
  strategy: string;
  successRate: number;
  sampleSize: number;
}
