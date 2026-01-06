// Channel Reassignment System
// Determines optimal communication channels for lead re-engagement

export interface ChannelAssignment {
  leadId: string;
  primaryChannel: Channel;
  secondaryChannels: Channel[];
  channelSequence: ChannelSequenceStep[];
  channelRationale: ChannelRationale;
  avoidChannels: AvoidedChannel[];
  personalizedApproach: PersonalizedApproach;
}

export interface Channel {
  type: ChannelType;
  priority: number;
  expectedResponseRate: number;
  estimatedResponseTime: number; // hours
  bestTimeSlots: TimeSlot[];
  messageConstraints: MessageConstraints;
  integrationStatus: 'active' | 'limited' | 'unavailable';
}

export type ChannelType = 
  | 'email'
  | 'phone'
  | 'linkedin'
  | 'sms'
  | 'video_message'
  | 'direct_mail'
  | 'whatsapp'
  | 'referral'
  | 'event'
  | 'content_engagement'
  | 'retargeting'
  | 'community';

export interface TimeSlot {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startHour: number;
  endHour: number;
  timezone: string;
  confidence: number;
}

export interface MessageConstraints {
  maxLength?: number;
  formatSupported: ('text' | 'html' | 'rich_media' | 'video' | 'audio')[];
  attachmentsAllowed: boolean;
  personalizationLevel: 'high' | 'medium' | 'low';
  responseTrackable: boolean;
}

export interface ChannelSequenceStep {
  step: number;
  channel: ChannelType;
  timing: string;
  purpose: string;
  messageType: string;
  successCriteria: string;
  nextStepIfSuccess: number | 'complete';
  nextStepIfNoResponse: number | 'escalate' | 'pause';
  maxAttempts: number;
}

export interface ChannelRationale {
  primaryReason: string;
  dataPoints: DataPoint[];
  confidenceLevel: number;
  alternativeConsiderations: string[];
}

export interface DataPoint {
  source: string;
  insight: string;
  weight: number;
}

export interface AvoidedChannel {
  channel: ChannelType;
  reason: string;
  overrideCondition?: string;
}

export interface PersonalizedApproach {
  communicationStyle: CommunicationStyle;
  tonalGuidance: TonalGuidance;
  contentPreferences: ContentPreference[];
  timingPreferences: TimingPreference;
}

export interface CommunicationStyle {
  formality: 'formal' | 'professional' | 'casual' | 'friendly';
  length: 'brief' | 'moderate' | 'detailed';
  structure: 'direct' | 'story' | 'data_driven' | 'relationship_first';
  callToAction: 'strong' | 'soft' | 'implied';
}

export interface TonalGuidance {
  primaryTone: string;
  avoidTones: string[];
  emotionalAppeal: 'logical' | 'emotional' | 'balanced';
  urgencyLevel: 'none' | 'subtle' | 'moderate' | 'strong';
}

export interface ContentPreference {
  type: 'case_study' | 'data' | 'testimonial' | 'demo' | 'whitepaper' | 'video' | 'infographic';
  effectiveness: number;
  notes: string;
}

export interface TimingPreference {
  preferredDays: string[];
  preferredTimes: string[];
  avoidDays: string[];
  avoidTimes: string[];
  timezone: string;
  responsePatterns: string;
}

export interface LeadChannelData {
  id: string;
  contactInfo: ContactInfo;
  channelHistory: ChannelInteraction[];
  preferences: ExplicitPreferences;
  behaviorSignals: BehaviorSignal[];
  companyContext: CompanyChannelContext;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  linkedin?: string;
  twitter?: string;
  otherChannels: Record<string, string>;
}

export interface ChannelInteraction {
  channel: ChannelType;
  date: Date;
  type: 'outbound' | 'inbound' | 'engagement';
  action: string;
  response: boolean;
  responseTime?: number; // hours
  sentiment?: 'positive' | 'neutral' | 'negative';
  notes?: string;
}

export interface ExplicitPreferences {
  stated?: string;
  optOuts: ChannelType[];
  optIns: ChannelType[];
  frequency?: string;
}

export interface BehaviorSignal {
  signal: string;
  channel: ChannelType;
  date: Date;
  strength: 'strong' | 'moderate' | 'weak';
  implication: string;
}

export interface CompanyChannelContext {
  industry: string;
  size: string;
  culture: 'traditional' | 'modern' | 'startup' | 'enterprise';
  commonChannels: ChannelType[];
  gatekeepers: boolean;
  decisionProcess: string;
}

export interface ChannelPerformanceData {
  channel: ChannelType;
  industry: string;
  companySize: string;
  role: string;
  openRate?: number;
  responseRate: number;
  avgResponseTime: number;
  conversionRate: number;
  sampleSize: number;
}

export class ChannelReassignmentSystem {
  private performanceData: ChannelPerformanceData[] = [];
  private channelConfigs: Map<ChannelType, ChannelConfig> = new Map();

  constructor() {
    this.initializeChannelConfigs();
    this.initializePerformanceData();
  }

  private initializeChannelConfigs(): void {
    this.channelConfigs.set('email', {
      type: 'email',
      scalability: 'high',
      personalizationCapacity: 'high',
      costPerContact: 'low',
      requiredInfo: ['email'],
      legalConsiderations: ['CAN-SPAM', 'GDPR'],
      integrations: ['crm', 'marketing_automation']
    });

    this.channelConfigs.set('phone', {
      type: 'phone',
      scalability: 'low',
      personalizationCapacity: 'very_high',
      costPerContact: 'high',
      requiredInfo: ['phone'],
      legalConsiderations: ['TCPA', 'DNC'],
      integrations: ['crm', 'dialer']
    });

    this.channelConfigs.set('linkedin', {
      type: 'linkedin',
      scalability: 'medium',
      personalizationCapacity: 'high',
      costPerContact: 'medium',
      requiredInfo: ['linkedin'],
      legalConsiderations: ['Platform TOS'],
      integrations: ['sales_navigator']
    });

    this.channelConfigs.set('video_message', {
      type: 'video_message',
      scalability: 'low',
      personalizationCapacity: 'very_high',
      costPerContact: 'medium',
      requiredInfo: ['email'],
      legalConsiderations: [],
      integrations: ['video_platform']
    });

    this.channelConfigs.set('direct_mail', {
      type: 'direct_mail',
      scalability: 'low',
      personalizationCapacity: 'medium',
      costPerContact: 'very_high',
      requiredInfo: ['mailing_address'],
      legalConsiderations: [],
      integrations: ['fulfillment']
    });

    this.channelConfigs.set('sms', {
      type: 'sms',
      scalability: 'high',
      personalizationCapacity: 'low',
      costPerContact: 'low',
      requiredInfo: ['phone', 'sms_consent'],
      legalConsiderations: ['TCPA', 'opt-in required'],
      integrations: ['sms_platform']
    });
  }

  private initializePerformanceData(): void {
    // Industry benchmarks - would be updated with real data
    this.performanceData = [
      {
        channel: 'email',
        industry: 'technology',
        companySize: 'enterprise',
        role: 'executive',
        openRate: 0.15,
        responseRate: 0.03,
        avgResponseTime: 48,
        conversionRate: 0.01,
        sampleSize: 10000
      },
      {
        channel: 'linkedin',
        industry: 'technology',
        companySize: 'enterprise',
        role: 'executive',
        responseRate: 0.12,
        avgResponseTime: 72,
        conversionRate: 0.04,
        sampleSize: 5000
      },
      {
        channel: 'phone',
        industry: 'technology',
        companySize: 'smb',
        role: 'owner',
        responseRate: 0.25,
        avgResponseTime: 0.5,
        conversionRate: 0.08,
        sampleSize: 2000
      },
      {
        channel: 'video_message',
        industry: 'technology',
        companySize: 'mid_market',
        role: 'manager',
        responseRate: 0.18,
        avgResponseTime: 24,
        conversionRate: 0.06,
        sampleSize: 1000
      }
    ];
  }

  assignChannels(lead: LeadChannelData): ChannelAssignment {
    const availableChannels = this.identifyAvailableChannels(lead);
    const rankedChannels = this.rankChannels(lead, availableChannels);
    const channelSequence = this.designSequence(lead, rankedChannels);
    const avoidChannels = this.identifyAvoidChannels(lead);
    const personalizedApproach = this.designPersonalizedApproach(lead);

    return {
      leadId: lead.id,
      primaryChannel: rankedChannels[0],
      secondaryChannels: rankedChannels.slice(1, 3),
      channelSequence,
      channelRationale: this.generateRationale(lead, rankedChannels),
      avoidChannels,
      personalizedApproach
    };
  }

  private identifyAvailableChannels(lead: LeadChannelData): ChannelType[] {
    const available: ChannelType[] = [];

    if (lead.contactInfo.email && !lead.preferences.optOuts.includes('email')) {
      available.push('email');
    }

    if (lead.contactInfo.phone && !lead.preferences.optOuts.includes('phone')) {
      available.push('phone');
    }

    if (lead.contactInfo.linkedin && !lead.preferences.optOuts.includes('linkedin')) {
      available.push('linkedin');
    }

    if (lead.contactInfo.email) {
      available.push('video_message');
    }

    // Always available as options
    available.push('content_engagement', 'retargeting');

    return available;
  }

  private rankChannels(lead: LeadChannelData, available: ChannelType[]): Channel[] {
    const channelScores: Map<ChannelType, number> = new Map();

    for (const channelType of available) {
      let score = 0;

      // Historical performance with this lead
      const history = lead.channelHistory.filter(h => h.channel === channelType);
      if (history.length > 0) {
        const responseRate = history.filter(h => h.response).length / history.length;
        score += responseRate * 40;

        const avgSentiment = history.filter(h => h.sentiment === 'positive').length / history.length;
        score += avgSentiment * 20;
      }

      // Industry benchmarks
      const benchmark = this.performanceData.find(p => 
        p.channel === channelType && 
        p.industry === lead.companyContext.industry.toLowerCase()
      );
      if (benchmark) {
        score += benchmark.responseRate * 30;
      }

      // Explicit preferences
      if (lead.preferences.optIns.includes(channelType)) {
        score += 25;
      }

      // Behavior signals
      const signals = lead.behaviorSignals.filter(s => s.channel === channelType);
      for (const signal of signals) {
        if (signal.strength === 'strong') score += 15;
        else if (signal.strength === 'moderate') score += 8;
        else score += 3;
      }

      // Company context fit
      if (lead.companyContext.commonChannels.includes(channelType)) {
        score += 10;
      }

      channelScores.set(channelType, score);
    }

    // Sort and convert to Channel objects
    const sorted = Array.from(channelScores.entries())
      .sort((a, b) => b[1] - a[1]);

    return sorted.map(([type, score], index) => this.buildChannel(type, score, index, lead));
  }

  private buildChannel(
    type: ChannelType, 
    score: number, 
    priority: number,
    lead: LeadChannelData
  ): Channel {
    const history = lead.channelHistory.filter(h => h.channel === type);
    const responses = history.filter(h => h.response);
    
    const avgResponseTime = responses.length > 0
      ? responses.reduce((sum, h) => sum + (h.responseTime || 24), 0) / responses.length
      : 48;

    return {
      type,
      priority: priority + 1,
      expectedResponseRate: score / 100,
      estimatedResponseTime: avgResponseTime,
      bestTimeSlots: this.inferBestTimeSlots(type, lead),
      messageConstraints: this.getMessageConstraints(type),
      integrationStatus: 'active'
    };
  }

  private inferBestTimeSlots(type: ChannelType, lead: LeadChannelData): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const history = lead.channelHistory.filter(h => h.channel === type && h.response);

    if (history.length > 0) {
      // Analyze response patterns
      // In production, this would be more sophisticated
      slots.push({
        day: 'tuesday',
        startHour: 9,
        endHour: 11,
        timezone: 'America/New_York',
        confidence: 0.7
      });
      slots.push({
        day: 'thursday',
        startHour: 14,
        endHour: 16,
        timezone: 'America/New_York',
        confidence: 0.6
      });
    } else {
      // Default slots based on channel type
      if (type === 'email') {
        slots.push({
          day: 'tuesday',
          startHour: 10,
          endHour: 11,
          timezone: 'America/New_York',
          confidence: 0.5
        });
      } else if (type === 'phone') {
        slots.push({
          day: 'wednesday',
          startHour: 10,
          endHour: 11,
          timezone: 'America/New_York',
          confidence: 0.5
        });
      }
    }

    return slots;
  }

  private getMessageConstraints(type: ChannelType): MessageConstraints {
    const constraints: Record<ChannelType, MessageConstraints> = {
      email: {
        maxLength: 500,
        formatSupported: ['text', 'html', 'rich_media'],
        attachmentsAllowed: true,
        personalizationLevel: 'high',
        responseTrackable: true
      },
      phone: {
        formatSupported: ['audio'],
        attachmentsAllowed: false,
        personalizationLevel: 'high',
        responseTrackable: true
      },
      linkedin: {
        maxLength: 300,
        formatSupported: ['text'],
        attachmentsAllowed: false,
        personalizationLevel: 'medium',
        responseTrackable: true
      },
      sms: {
        maxLength: 160,
        formatSupported: ['text'],
        attachmentsAllowed: false,
        personalizationLevel: 'low',
        responseTrackable: true
      },
      video_message: {
        formatSupported: ['video'],
        attachmentsAllowed: false,
        personalizationLevel: 'high',
        responseTrackable: true
      },
      direct_mail: {
        formatSupported: ['rich_media'],
        attachmentsAllowed: true,
        personalizationLevel: 'medium',
        responseTrackable: false
      },
      whatsapp: {
        maxLength: 1000,
        formatSupported: ['text', 'rich_media'],
        attachmentsAllowed: true,
        personalizationLevel: 'medium',
        responseTrackable: true
      },
      referral: {
        formatSupported: ['text'],
        attachmentsAllowed: false,
        personalizationLevel: 'high',
        responseTrackable: false
      },
      event: {
        formatSupported: ['text', 'rich_media'],
        attachmentsAllowed: true,
        personalizationLevel: 'medium',
        responseTrackable: false
      },
      content_engagement: {
        formatSupported: ['rich_media'],
        attachmentsAllowed: false,
        personalizationLevel: 'low',
        responseTrackable: true
      },
      retargeting: {
        formatSupported: ['rich_media'],
        attachmentsAllowed: false,
        personalizationLevel: 'low',
        responseTrackable: true
      },
      community: {
        formatSupported: ['text', 'rich_media'],
        attachmentsAllowed: true,
        personalizationLevel: 'medium',
        responseTrackable: true
      }
    };

    return constraints[type];
  }

  private designSequence(lead: LeadChannelData, rankedChannels: Channel[]): ChannelSequenceStep[] {
    const sequence: ChannelSequenceStep[] = [];
    const primary = rankedChannels[0];
    const secondary = rankedChannels[1];

    // Step 1: Primary channel first touch
    sequence.push({
      step: 1,
      channel: primary.type,
      timing: 'Day 0',
      purpose: 'Initial re-engagement',
      messageType: 'Value-first outreach',
      successCriteria: 'Response received',
      nextStepIfSuccess: 'complete',
      nextStepIfNoResponse: 2,
      maxAttempts: 1
    });

    // Step 2: Same channel follow-up
    sequence.push({
      step: 2,
      channel: primary.type,
      timing: 'Day 3',
      purpose: 'Follow-up with additional value',
      messageType: 'Resource share or insight',
      successCriteria: 'Response or engagement',
      nextStepIfSuccess: 'complete',
      nextStepIfNoResponse: 3,
      maxAttempts: 1
    });

    // Step 3: Switch to secondary channel
    if (secondary) {
      sequence.push({
        step: 3,
        channel: secondary.type,
        timing: 'Day 7',
        purpose: 'Channel variation',
        messageType: 'Different angle same value',
        successCriteria: 'Response received',
        nextStepIfSuccess: 'complete',
        nextStepIfNoResponse: 4,
        maxAttempts: 1
      });
    }

    // Step 4: Final attempt on primary
    sequence.push({
      step: 4,
      channel: primary.type,
      timing: 'Day 14',
      purpose: 'Soft breakup or pause notice',
      messageType: 'Respectful final touch',
      successCriteria: 'Any response',
      nextStepIfSuccess: 'complete',
      nextStepIfNoResponse: 'pause',
      maxAttempts: 1
    });

    return sequence;
  }

  private identifyAvoidChannels(lead: LeadChannelData): AvoidedChannel[] {
    const avoided: AvoidedChannel[] = [];

    // Explicit opt-outs
    for (const channel of lead.preferences.optOuts) {
      avoided.push({
        channel,
        reason: 'Explicit opt-out by contact'
      });
    }

    // Negative history
    const negativeChannels = lead.channelHistory
      .filter(h => h.sentiment === 'negative')
      .map(h => h.channel);

    for (const channel of new Set(negativeChannels)) {
      if (!avoided.some(a => a.channel === channel)) {
        avoided.push({
          channel,
          reason: 'Negative sentiment in previous interactions',
          overrideCondition: 'Significant time passed and new value proposition'
        });
      }
    }

    // Missing contact info
    if (!lead.contactInfo.phone) {
      avoided.push({
        channel: 'phone',
        reason: 'Phone number not available'
      });
    }

    if (!lead.contactInfo.linkedin) {
      avoided.push({
        channel: 'linkedin',
        reason: 'LinkedIn profile not available'
      });
    }

    return avoided;
  }

  private designPersonalizedApproach(lead: LeadChannelData): PersonalizedApproach {
    return {
      communicationStyle: this.inferCommunicationStyle(lead),
      tonalGuidance: this.inferTonalGuidance(lead),
      contentPreferences: this.inferContentPreferences(lead),
      timingPreferences: this.inferTimingPreferences(lead)
    };
  }

  private inferCommunicationStyle(lead: LeadChannelData): CommunicationStyle {
    const culture = lead.companyContext.culture;
    
    if (culture === 'enterprise' || culture === 'traditional') {
      return {
        formality: 'professional',
        length: 'moderate',
        structure: 'data_driven',
        callToAction: 'soft'
      };
    } else if (culture === 'startup') {
      return {
        formality: 'casual',
        length: 'brief',
        structure: 'direct',
        callToAction: 'strong'
      };
    }

    return {
      formality: 'professional',
      length: 'brief',
      structure: 'value_first' as any,
      callToAction: 'soft'
    };
  }

  private inferTonalGuidance(lead: LeadChannelData): TonalGuidance {
    const hasNegativeHistory = lead.channelHistory.some(h => h.sentiment === 'negative');

    if (hasNegativeHistory) {
      return {
        primaryTone: 'Respectful and humble',
        avoidTones: ['Pushy', 'Assumptive', 'Urgent'],
        emotionalAppeal: 'logical',
        urgencyLevel: 'none'
      };
    }

    return {
      primaryTone: 'Helpful and confident',
      avoidTones: ['Aggressive', 'Desperate'],
      emotionalAppeal: 'balanced',
      urgencyLevel: 'subtle'
    };
  }

  private inferContentPreferences(lead: LeadChannelData): ContentPreference[] {
    const preferences: ContentPreference[] = [];

    // Analyze behavior signals for content engagement
    const contentSignals = lead.behaviorSignals.filter(s => 
      s.signal.toLowerCase().includes('content') ||
      s.signal.toLowerCase().includes('download') ||
      s.signal.toLowerCase().includes('view')
    );

    if (contentSignals.some(s => s.signal.includes('case study'))) {
      preferences.push({
        type: 'case_study',
        effectiveness: 0.8,
        notes: 'Engaged with case studies previously'
      });
    }

    if (contentSignals.some(s => s.signal.includes('data') || s.signal.includes('report'))) {
      preferences.push({
        type: 'data',
        effectiveness: 0.7,
        notes: 'Responds to data-driven content'
      });
    }

    // Default preferences based on company context
    if (preferences.length === 0) {
      if (lead.companyContext.size === 'enterprise') {
        preferences.push({
          type: 'case_study',
          effectiveness: 0.6,
          notes: 'Enterprise typically prefers proof'
        });
      } else {
        preferences.push({
          type: 'demo',
          effectiveness: 0.6,
          notes: 'Smaller companies prefer to see product'
        });
      }
    }

    return preferences;
  }

  private inferTimingPreferences(lead: LeadChannelData): TimingPreference {
    const responses = lead.channelHistory.filter(h => h.response);
    
    // Default preferences
    const preference: TimingPreference = {
      preferredDays: ['Tuesday', 'Wednesday', 'Thursday'],
      preferredTimes: ['9:00 AM - 11:00 AM', '2:00 PM - 4:00 PM'],
      avoidDays: ['Monday', 'Friday'],
      avoidTimes: ['Before 8 AM', 'After 6 PM', 'Lunch hours'],
      timezone: 'America/New_York',
      responsePatterns: 'Typically responds within 48 hours'
    };

    // Refine based on history
    if (responses.length > 0) {
      const avgResponseTime = responses.reduce((sum, r) => sum + (r.responseTime || 24), 0) / responses.length;
      if (avgResponseTime < 12) {
        preference.responsePatterns = 'Quick responder - usually within same day';
      } else if (avgResponseTime > 72) {
        preference.responsePatterns = 'Slow responder - expect 3-5 days';
      }
    }

    return preference;
  }

  private generateRationale(lead: LeadChannelData, rankedChannels: Channel[]): ChannelRationale {
    const primary = rankedChannels[0];
    const dataPoints: DataPoint[] = [];

    // Historical data
    const history = lead.channelHistory.filter(h => h.channel === primary.type);
    if (history.length > 0) {
      const responseRate = history.filter(h => h.response).length / history.length;
      dataPoints.push({
        source: 'Historical interactions',
        insight: `${(responseRate * 100).toFixed(0)}% response rate on ${primary.type}`,
        weight: 0.4
      });
    }

    // Preferences
    if (lead.preferences.optIns.includes(primary.type)) {
      dataPoints.push({
        source: 'Explicit preference',
        insight: `Contact opted in to ${primary.type} communications`,
        weight: 0.3
      });
    }

    // Company context
    if (lead.companyContext.commonChannels.includes(primary.type)) {
      dataPoints.push({
        source: 'Industry norms',
        insight: `${primary.type} is common in ${lead.companyContext.industry}`,
        weight: 0.2
      });
    }

    return {
      primaryReason: `${primary.type} selected based on ${dataPoints.length} data points`,
      dataPoints,
      confidenceLevel: primary.expectedResponseRate,
      alternativeConsiderations: rankedChannels.slice(1, 3).map(c => 
        `${c.type}: Expected ${(c.expectedResponseRate * 100).toFixed(0)}% response rate`
      )
    };
  }

  recordOutcome(
    leadId: string, 
    channel: ChannelType, 
    outcome: 'success' | 'no_response' | 'negative'
  ): void {
    // Update performance data based on outcome
    // This would feed back into the ranking algorithm
  }
}

interface ChannelConfig {
  type: ChannelType;
  scalability: 'high' | 'medium' | 'low';
  personalizationCapacity: 'very_high' | 'high' | 'medium' | 'low';
  costPerContact: 'very_high' | 'high' | 'medium' | 'low';
  requiredInfo: string[];
  legalConsiderations: string[];
  integrations: string[];
}
