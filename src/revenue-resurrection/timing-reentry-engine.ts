// Timing & Re-Entry Engine
// Determines optimal timing and approach for re-engaging dormant leads

export interface ReentryTiming {
  leadId: string;
  optimalWindow: TimeWindow;
  triggerEvents: TriggerEvent[];
  avoidPeriods: AvoidPeriod[];
  urgencyLevel: UrgencyLevel;
  contextualFactors: ContextualFactor[];
  recommendedApproach: ReentryRecommendation;
}

export interface TimeWindow {
  start: Date;
  end: Date;
  confidence: number;
  reasoning: string[];
  alternativeWindows: AlternativeWindow[];
}

export interface AlternativeWindow {
  start: Date;
  end: Date;
  confidence: number;
  condition: string;
}

export interface TriggerEvent {
  id: string;
  type: TriggerType;
  description: string;
  expectedDate?: Date;
  probability: number;
  impact: 'high' | 'medium' | 'low';
  monitoringMethod: MonitoringMethod;
  actionOnTrigger: string;
}

export type TriggerType = 
  | 'budget_cycle'
  | 'contract_renewal'
  | 'fiscal_year'
  | 'quarter_end'
  | 'leadership_change'
  | 'company_news'
  | 'industry_event'
  | 'competitor_issue'
  | 'regulation_change'
  | 'technology_shift'
  | 'expansion'
  | 'restructuring'
  | 'funding_round'
  | 'product_launch';

export interface MonitoringMethod {
  type: 'automated' | 'manual' | 'hybrid';
  sources: string[];
  frequency: string;
  alertThreshold?: string;
}

export interface AvoidPeriod {
  start: Date;
  end: Date;
  reason: AvoidReason;
  severity: 'absolute' | 'preferred' | 'contextual';
  override?: string;
}

export type AvoidReason = 
  | 'holiday_season'
  | 'industry_busy_period'
  | 'recent_rejection'
  | 'company_crisis'
  | 'contact_absence'
  | 'budget_frozen'
  | 'strategic_review'
  | 'competitor_evaluation';

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low' | 'monitoring';

export interface ContextualFactor {
  factor: string;
  influence: 'accelerate' | 'delay' | 'neutral';
  weight: number;
  explanation: string;
}

export interface ReentryRecommendation {
  timing: 'immediate' | 'scheduled' | 'trigger_based' | 'monitoring';
  suggestedDate?: Date;
  approach: ReentryApproach;
  channel: CommunicationChannel;
  messageType: MessageType;
  personalizationHooks: string[];
  escalationPath: EscalationStep[];
}

export interface ReentryApproach {
  style: 'direct' | 'indirect' | 'value_first' | 'relationship' | 'event_based';
  intensity: 'aggressive' | 'moderate' | 'soft' | 'subtle';
  frequency: string;
  duration: number; // days for the reentry campaign
}

export type CommunicationChannel = 
  | 'email'
  | 'phone'
  | 'linkedin'
  | 'sms'
  | 'direct_mail'
  | 'video_message'
  | 'referral'
  | 'event'
  | 'content';

export type MessageType = 
  | 'check_in'
  | 'value_share'
  | 'news_reference'
  | 'mutual_connection'
  | 'insight_offer'
  | 'case_study'
  | 'invitation'
  | 'direct_ask';

export interface EscalationStep {
  trigger: string;
  action: string;
  owner: string;
  timeline: string;
  fallback: string;
}

export interface LeadContext {
  id: string;
  company: CompanyContext;
  contacts: ContactContext[];
  interactionHistory: InteractionEvent[];
  dormancyReason: string;
  lastEngagement: Date;
  originalInterest: string;
  previousOutcomes: PreviousOutcome[];
}

export interface CompanyContext {
  name: string;
  industry: string;
  size: 'enterprise' | 'mid_market' | 'smb' | 'startup';
  fiscalYearEnd?: string;
  knownEvents: CompanyEvent[];
  competitorUsage?: string;
  fundingStage?: string;
  growthTrajectory: 'growing' | 'stable' | 'declining' | 'unknown';
}

export interface CompanyEvent {
  type: string;
  date: Date;
  description: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface ContactContext {
  id: string;
  name: string;
  role: string;
  tenure?: string;
  preferredChannel: string;
  bestReachTimes?: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
  lastContact: Date;
  notes: string;
}

export interface InteractionEvent {
  date: Date;
  type: string;
  channel: string;
  outcome: string;
  sentiment: string;
  notes: string;
}

export interface PreviousOutcome {
  date: Date;
  approach: string;
  result: 'success' | 'partial' | 'failure' | 'no_response';
  learnings: string[];
}

export interface TimingIntelligence {
  industryPatterns: IndustryPattern[];
  companySignals: CompanySignal[];
  contactBehaviors: ContactBehavior[];
  marketConditions: MarketCondition[];
}

export interface IndustryPattern {
  industry: string;
  busyPeriods: string[];
  budgetCycles: string[];
  decisionTimelines: string;
  optimalOutreachTimes: string[];
}

export interface CompanySignal {
  type: string;
  detected: Date;
  significance: 'high' | 'medium' | 'low';
  actionImplication: string;
}

export interface ContactBehavior {
  contactId: string;
  responsePatterns: ResponsePattern;
  preferredTiming: string[];
  avoidTiming: string[];
}

export interface ResponsePattern {
  avgResponseTime: number; // hours
  bestDays: string[];
  bestTimes: string[];
  preferredChannels: string[];
}

export interface MarketCondition {
  condition: string;
  impact: 'positive' | 'negative' | 'neutral';
  duration: string;
  adjustment: string;
}

export class TimingReentryEngine {
  private industryPatterns: Map<string, IndustryPattern> = new Map();
  private contactBehaviors: Map<string, ContactBehavior> = new Map();
  private activeMonitoring: Map<string, TriggerEvent[]> = new Map();

  constructor() {
    this.initializeIndustryPatterns();
  }

  private initializeIndustryPatterns(): void {
    // Technology/SaaS
    this.industryPatterns.set('technology', {
      industry: 'technology',
      busyPeriods: ['Q4 (budget finalization)', 'Product launch periods'],
      budgetCycles: ['January (new budget)', 'Q3 planning'],
      decisionTimelines: '30-90 days',
      optimalOutreachTimes: ['Tuesday-Thursday', '10am-2pm']
    });

    // Financial Services
    this.industryPatterns.set('financial_services', {
      industry: 'financial_services',
      busyPeriods: ['End of month', 'Earnings periods', 'Audit seasons'],
      budgetCycles: ['Q1 planning', 'Mid-year review'],
      decisionTimelines: '60-180 days',
      optimalOutreachTimes: ['Mid-week', 'Early morning']
    });

    // Healthcare
    this.industryPatterns.set('healthcare', {
      industry: 'healthcare',
      busyPeriods: ['Flu season', 'Open enrollment'],
      budgetCycles: ['Fiscal year varies', 'Often July start'],
      decisionTimelines: '90-365 days',
      optimalOutreachTimes: ['Early morning', 'After clinical hours']
    });

    // Retail
    this.industryPatterns.set('retail', {
      industry: 'retail',
      busyPeriods: ['Holiday season (Oct-Dec)', 'Back to school'],
      budgetCycles: ['Post-holiday planning', 'Q2 investment'],
      decisionTimelines: '30-60 days',
      optimalOutreachTimes: ['Monday-Wednesday', 'Morning']
    });

    // Manufacturing
    this.industryPatterns.set('manufacturing', {
      industry: 'manufacturing',
      busyPeriods: ['Production peaks', 'Inventory cycles'],
      budgetCycles: ['Annual planning (Q4)', 'Capital approval (Q1)'],
      decisionTimelines: '60-120 days',
      optimalOutreachTimes: ['Tuesday-Thursday', 'Mid-morning']
    });
  }

  calculateOptimalTiming(lead: LeadContext): ReentryTiming {
    const industryPattern = this.industryPatterns.get(lead.company.industry.toLowerCase());
    const contactBehavior = this.getContactBehavior(lead.contacts);
    
    const triggerEvents = this.identifyTriggerEvents(lead);
    const avoidPeriods = this.identifyAvoidPeriods(lead);
    const urgencyLevel = this.assessUrgency(lead);
    const contextualFactors = this.analyzeContextualFactors(lead);

    const optimalWindow = this.calculateOptimalWindow(
      lead,
      industryPattern,
      contactBehavior,
      triggerEvents,
      avoidPeriods,
      contextualFactors
    );

    return {
      leadId: lead.id,
      optimalWindow,
      triggerEvents,
      avoidPeriods,
      urgencyLevel,
      contextualFactors,
      recommendedApproach: this.generateRecommendation(
        lead,
        optimalWindow,
        urgencyLevel,
        contextualFactors
      )
    };
  }

  private getContactBehavior(contacts: ContactContext[]): ContactBehavior | undefined {
    const primary = contacts.find(c => c.sentiment !== 'negative');
    if (primary) {
      return this.contactBehaviors.get(primary.id);
    }
    return undefined;
  }

  private identifyTriggerEvents(lead: LeadContext): TriggerEvent[] {
    const triggers: TriggerEvent[] = [];
    const now = new Date();

    // Budget cycle trigger
    if (lead.company.fiscalYearEnd) {
      const fyEnd = new Date(lead.company.fiscalYearEnd);
      const planningStart = new Date(fyEnd);
      planningStart.setMonth(planningStart.getMonth() - 2);
      
      triggers.push({
        id: `budget_${lead.id}`,
        type: 'budget_cycle',
        description: 'Budget planning period approaching',
        expectedDate: planningStart,
        probability: 0.8,
        impact: 'high',
        monitoringMethod: {
          type: 'automated',
          sources: ['calendar'],
          frequency: 'monthly'
        },
        actionOnTrigger: 'Initiate value-focused outreach'
      });
    }

    // Contract renewal trigger
    if (lead.company.competitorUsage) {
      triggers.push({
        id: `renewal_${lead.id}`,
        type: 'contract_renewal',
        description: 'Potential competitor contract renewal',
        probability: 0.4,
        impact: 'high',
        monitoringMethod: {
          type: 'manual',
          sources: ['contact inquiry', 'industry intel'],
          frequency: 'quarterly'
        },
        actionOnTrigger: 'Position as alternative with migration support'
      });
    }

    // Company events
    for (const event of lead.company.knownEvents) {
      if (event.date > now && event.relevance === 'high') {
        triggers.push({
          id: `event_${lead.id}_${event.type}`,
          type: 'company_news',
          description: event.description,
          expectedDate: event.date,
          probability: 0.9,
          impact: 'high',
          monitoringMethod: {
            type: 'automated',
            sources: ['news alerts', 'linkedin'],
            frequency: 'daily'
          },
          actionOnTrigger: 'Reference event in personalized outreach'
        });
      }
    }

    // Industry events
    triggers.push({
      id: `industry_${lead.id}`,
      type: 'industry_event',
      description: 'Major industry conference or event',
      probability: 0.6,
      impact: 'medium',
      monitoringMethod: {
        type: 'hybrid',
        sources: ['event calendars', 'linkedin'],
        frequency: 'monthly'
      },
      actionOnTrigger: 'Use event as conversation starter'
    });

    return triggers;
  }

  private identifyAvoidPeriods(lead: LeadContext): AvoidPeriod[] {
    const periods: AvoidPeriod[] = [];
    const now = new Date();
    const year = now.getFullYear();

    // Recent rejection cooldown
    if (lead.dormancyReason.toLowerCase().includes('rejected') || 
        lead.dormancyReason.toLowerCase().includes('not interested')) {
      const cooldownEnd = new Date(lead.lastEngagement);
      cooldownEnd.setDate(cooldownEnd.getDate() + 60);
      
      if (cooldownEnd > now) {
        periods.push({
          start: now,
          end: cooldownEnd,
          reason: 'recent_rejection',
          severity: 'preferred',
          override: 'Major trigger event or new value proposition'
        });
      }
    }

    // Holiday periods
    periods.push({
      start: new Date(year, 11, 20),
      end: new Date(year + 1, 0, 5),
      reason: 'holiday_season',
      severity: 'absolute'
    });

    // Industry-specific busy periods
    const industryPattern = this.industryPatterns.get(lead.company.industry.toLowerCase());
    if (industryPattern) {
      // Add industry-specific avoid periods based on busy periods
      // This would be more sophisticated in production
    }

    return periods;
  }

  private assessUrgency(lead: LeadContext): UrgencyLevel {
    const daysSinceLast = (Date.now() - lead.lastEngagement.getTime()) / (1000 * 60 * 60 * 24);
    const hasPositiveHistory = lead.previousOutcomes.some(o => o.result === 'success' || o.result === 'partial');
    const hasRecentEvents = lead.company.knownEvents.some(e => 
      e.relevance === 'high' && 
      e.date > new Date() &&
      e.date < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    if (hasRecentEvents && hasPositiveHistory) return 'critical';
    if (hasRecentEvents) return 'high';
    if (daysSinceLast < 90 && hasPositiveHistory) return 'high';
    if (daysSinceLast < 180) return 'medium';
    if (daysSinceLast < 365) return 'low';
    return 'monitoring';
  }

  private analyzeContextualFactors(lead: LeadContext): ContextualFactor[] {
    const factors: ContextualFactor[] = [];

    // Company growth trajectory
    if (lead.company.growthTrajectory === 'growing') {
      factors.push({
        factor: 'Company is growing',
        influence: 'accelerate',
        weight: 0.8,
        explanation: 'Growing companies have more budget and urgency'
      });
    } else if (lead.company.growthTrajectory === 'declining') {
      factors.push({
        factor: 'Company showing decline',
        influence: 'delay',
        weight: 0.6,
        explanation: 'May have budget constraints or other priorities'
      });
    }

    // Contact sentiment
    const positiveContacts = lead.contacts.filter(c => c.sentiment === 'positive').length;
    if (positiveContacts > 0) {
      factors.push({
        factor: 'Positive contact relationships exist',
        influence: 'accelerate',
        weight: 0.7,
        explanation: 'Warm relationships increase response likelihood'
      });
    }

    // Previous success
    if (lead.previousOutcomes.some(o => o.result === 'success')) {
      factors.push({
        factor: 'Previous successful engagement',
        influence: 'accelerate',
        weight: 0.9,
        explanation: 'Proven ability to engage this lead'
      });
    }

    // Competitor usage
    if (lead.company.competitorUsage) {
      factors.push({
        factor: 'Currently using competitor',
        influence: 'neutral',
        weight: 0.5,
        explanation: 'Requires strategic timing around renewal periods'
      });
    }

    return factors;
  }

  private calculateOptimalWindow(
    lead: LeadContext,
    industryPattern: IndustryPattern | undefined,
    contactBehavior: ContactBehavior | undefined,
    triggers: TriggerEvent[],
    avoidPeriods: AvoidPeriod[],
    contextualFactors: ContextualFactor[]
  ): TimeWindow {
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);

    const reasoning: string[] = [];
    const alternativeWindows: AlternativeWindow[] = [];

    // Adjust for avoid periods
    for (const period of avoidPeriods) {
      if (period.severity === 'absolute' && startDate >= period.start && startDate <= period.end) {
        startDate = new Date(period.end);
        startDate.setDate(startDate.getDate() + 1);
        reasoning.push(`Delayed start to avoid ${period.reason}`);
      }
    }

    // Check for upcoming triggers
    const upcomingTriggers = triggers.filter(t => 
      t.expectedDate && 
      t.expectedDate > now && 
      t.probability > 0.5 &&
      t.impact === 'high'
    );

    if (upcomingTriggers.length > 0) {
      const nearestTrigger = upcomingTriggers.sort((a, b) => 
        (a.expectedDate?.getTime() || 0) - (b.expectedDate?.getTime() || 0)
      )[0];

      if (nearestTrigger.expectedDate) {
        const triggerBasedStart = new Date(nearestTrigger.expectedDate);
        triggerBasedStart.setDate(triggerBasedStart.getDate() - 7);
        
        alternativeWindows.push({
          start: triggerBasedStart,
          end: nearestTrigger.expectedDate,
          confidence: nearestTrigger.probability,
          condition: `Aligned with ${nearestTrigger.type}`
        });

        reasoning.push(`Consider aligning with ${nearestTrigger.type} trigger`);
      }
    }

    // Adjust for contextual factors
    const accelerators = contextualFactors.filter(f => f.influence === 'accelerate');
    const delayers = contextualFactors.filter(f => f.influence === 'delay');

    if (accelerators.length > delayers.length) {
      reasoning.push('Contextual factors favor earlier engagement');
    } else if (delayers.length > accelerators.length) {
      startDate.setDate(startDate.getDate() + 14);
      reasoning.push('Contextual factors suggest delayed engagement');
    }

    // Calculate confidence
    let confidence = 0.5;
    if (industryPattern) confidence += 0.1;
    if (contactBehavior) confidence += 0.15;
    if (accelerators.length > 0) confidence += 0.1;
    if (triggers.length > 0) confidence += 0.1;

    return {
      start: startDate,
      end: endDate,
      confidence: Math.min(0.95, confidence),
      reasoning,
      alternativeWindows
    };
  }

  private generateRecommendation(
    lead: LeadContext,
    window: TimeWindow,
    urgency: UrgencyLevel,
    factors: ContextualFactor[]
  ): ReentryRecommendation {
    const primaryContact = lead.contacts.find(c => c.sentiment !== 'negative');
    const preferredChannel = primaryContact?.preferredChannel as CommunicationChannel || 'email';

    // Determine approach based on urgency and factors
    let style: ReentryApproach['style'] = 'value_first';
    let intensity: ReentryApproach['intensity'] = 'moderate';

    if (urgency === 'critical' || urgency === 'high') {
      style = 'direct';
      intensity = 'moderate';
    } else if (factors.some(f => f.factor.includes('Positive contact'))) {
      style = 'relationship';
      intensity = 'soft';
    }

    // Determine message type
    let messageType: MessageType = 'value_share';
    if (lead.company.knownEvents.some(e => e.relevance === 'high')) {
      messageType = 'news_reference';
    } else if (lead.previousOutcomes.some(o => o.result === 'success')) {
      messageType = 'check_in';
    }

    return {
      timing: urgency === 'critical' ? 'immediate' : 'scheduled',
      suggestedDate: window.start,
      approach: {
        style,
        intensity,
        frequency: urgency === 'critical' ? 'Every 3 days' : 'Weekly',
        duration: 30
      },
      channel: preferredChannel,
      messageType,
      personalizationHooks: this.generatePersonalizationHooks(lead),
      escalationPath: [
        {
          trigger: 'No response after 3 attempts',
          action: 'Try alternative channel',
          owner: 'Account owner',
          timeline: '2 weeks',
          fallback: 'Move to quarterly nurture'
        },
        {
          trigger: 'Positive response received',
          action: 'Schedule discovery call',
          owner: 'Account owner',
          timeline: 'Within 48 hours',
          fallback: 'Propose async value share'
        }
      ]
    };
  }

  private generatePersonalizationHooks(lead: LeadContext): string[] {
    const hooks: string[] = [];

    // Company events
    for (const event of lead.company.knownEvents) {
      if (event.relevance === 'high') {
        hooks.push(`Reference: ${event.description}`);
      }
    }

    // Previous engagement
    if (lead.originalInterest) {
      hooks.push(`Previous interest: ${lead.originalInterest}`);
    }

    // Contact-specific
    for (const contact of lead.contacts) {
      if (contact.notes) {
        hooks.push(`${contact.name}: ${contact.notes}`);
      }
    }

    return hooks;
  }

  setMonitoring(leadId: string, triggers: TriggerEvent[]): void {
    this.activeMonitoring.set(leadId, triggers);
  }

  checkTriggers(leadId: string): TriggerEvent[] {
    const triggers = this.activeMonitoring.get(leadId) || [];
    const now = new Date();
    
    return triggers.filter(t => 
      t.expectedDate && 
      t.expectedDate <= now &&
      t.expectedDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
  }
}
