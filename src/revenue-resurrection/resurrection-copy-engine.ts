/**
 * Resurrection Copy Engine
 * Generates psychologically precise reactivation messaging for dormant leads
 */

export interface ResurrectionCopy {
  copyId: string;
  leadId: string;
  variant: CopyVariant;
  channel: CommunicationChannel;
  subject?: string;
  headline?: string;
  body: string;
  callToAction: CallToAction;
  personalizationElements: PersonalizationElement[];
  psychologicalTriggers: PsychologicalTrigger[];
  complianceChecks: ComplianceCheck[];
  predictedMetrics: PredictedMetrics;
  generatedAt: Date;
}

export interface CopyVariant {
  type: VariantType;
  tone: CopyTone;
  length: 'micro' | 'short' | 'medium' | 'long';
  angle: CopyAngle;
  urgencyLevel: number;
}

export type VariantType =
  | 'soft_check_in'
  | 'value_reminder'
  | 'new_development'
  | 'social_proof'
  | 'scarcity_authentic'
  | 'problem_resurface'
  | 'direct_ask'
  | 'relationship_rebuild'
  | 'permission_based'
  | 'pattern_interrupt';

export type CopyTone =
  | 'warm_professional'
  | 'casual_friendly'
  | 'authoritative'
  | 'empathetic'
  | 'curious'
  | 'direct'
  | 'playful'
  | 'urgent';

export type CopyAngle =
  | 'outcome_focused'
  | 'problem_agitation'
  | 'opportunity_cost'
  | 'success_story'
  | 'exclusive_access'
  | 'genuine_concern'
  | 'new_information'
  | 'time_sensitive';

export type CommunicationChannel = 
  | 'email'
  | 'sms'
  | 'phone_script'
  | 'video_message'
  | 'social_dm'
  | 'direct_mail'
  | 'voicemail';

export interface CallToAction {
  primary: string;
  secondary?: string;
  urgency: string;
  friction: 'ultra_low' | 'low' | 'medium' | 'high';
  type: CTAType;
}

export type CTAType =
  | 'reply'
  | 'click'
  | 'call'
  | 'book'
  | 'download'
  | 'watch'
  | 'confirm';

export interface PersonalizationElement {
  type: PersonalizationType;
  value: string;
  placement: string;
  impact: number;
}

export type PersonalizationType =
  | 'name'
  | 'company'
  | 'industry'
  | 'previous_interaction'
  | 'specific_pain'
  | 'goal'
  | 'timeline'
  | 'mutual_connection'
  | 'recent_event'
  | 'behavior_based';

export interface PsychologicalTrigger {
  trigger: TriggerType;
  implementation: string;
  ethicalScore: number;
  effectiveness: number;
}

export type TriggerType =
  | 'curiosity'
  | 'social_proof'
  | 'authority'
  | 'scarcity'
  | 'reciprocity'
  | 'commitment_consistency'
  | 'liking'
  | 'unity'
  | 'loss_aversion'
  | 'autonomy';

export interface ComplianceCheck {
  rule: string;
  passed: boolean;
  details: string;
}

export interface PredictedMetrics {
  openRate: number;
  responseRate: number;
  conversionRate: number;
  confidenceInterval: number;
}

export interface LeadContext {
  leadId: string;
  name: string;
  company?: string;
  industry: string;
  dormancyReason: string;
  lastInteraction: Date;
  previousObjections: string[];
  identityProfile: IdentitySnapshot;
  communicationHistory: CommunicationRecord[];
}

export interface IdentitySnapshot {
  decisionStyle: string;
  riskTolerance: number;
  statusOrientation: number;
  communicationPreference: string;
  emotionalDrivers: string[];
  trustLevel: number;
}

export interface CommunicationRecord {
  channel: CommunicationChannel;
  message: string;
  response?: string;
  sentiment: number;
  timestamp: Date;
}

export interface CopyTemplate {
  id: string;
  variantType: VariantType;
  channel: CommunicationChannel;
  structure: TemplateStructure;
  variables: TemplateVariable[];
  constraints: TemplateConstraint[];
  performance: TemplatePerformance;
}

export interface TemplateStructure {
  hook: string;
  bridge: string;
  body: string;
  proof?: string;
  cta: string;
}

export interface TemplateVariable {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}

export interface TemplateConstraint {
  type: 'word_count' | 'tone' | 'compliance' | 'personalization';
  rule: string;
  enforcement: 'strict' | 'flexible';
}

export interface TemplatePerformance {
  usageCount: number;
  avgOpenRate: number;
  avgResponseRate: number;
  avgConversionRate: number;
  bestPerformingSegments: string[];
}

export interface CopyGenerationConfig {
  maxVariants: number;
  complianceLevel: 'strict' | 'moderate' | 'flexible';
  personalizationDepth: 'basic' | 'deep' | 'hyper';
  toneOverride?: CopyTone;
  excludeTriggers?: TriggerType[];
}

export class ResurrectionCopyEngine {
  private templates: Map<string, CopyTemplate>;
  private complianceRules: ComplianceRule[];
  private performanceData: Map<string, CopyPerformance>;

  constructor() {
    this.templates = this.initializeTemplates();
    this.complianceRules = this.initializeComplianceRules();
    this.performanceData = new Map();
  }

  private initializeTemplates(): Map<string, CopyTemplate> {
    const templates = new Map<string, CopyTemplate>();

    templates.set('soft_check_in_email', {
      id: 'soft_check_in_email',
      variantType: 'soft_check_in',
      channel: 'email',
      structure: {
        hook: 'Personal acknowledgment of time passed',
        bridge: 'Genuine curiosity about their situation',
        body: 'Light value reminder without selling',
        cta: 'Low-pressure invitation to reconnect'
      },
      variables: [
        { name: 'firstName', type: 'string', required: true },
        { name: 'timeframe', type: 'string', required: true },
        { name: 'previousTopic', type: 'string', required: false }
      ],
      constraints: [
        { type: 'word_count', rule: 'max 150 words', enforcement: 'flexible' },
        { type: 'tone', rule: 'warm, non-pushy', enforcement: 'strict' }
      ],
      performance: {
        usageCount: 0,
        avgOpenRate: 0.35,
        avgResponseRate: 0.12,
        avgConversionRate: 0.04,
        bestPerformingSegments: ['B2B services', 'consulting']
      }
    });

    templates.set('value_reminder_email', {
      id: 'value_reminder_email',
      variantType: 'value_reminder',
      channel: 'email',
      structure: {
        hook: 'Reference to their specific goal or problem',
        bridge: 'Recent success story or development',
        body: 'Value proposition refresh with new angle',
        proof: 'Quick testimonial or result',
        cta: 'Specific next step offer'
      },
      variables: [
        { name: 'firstName', type: 'string', required: true },
        { name: 'goalOrProblem', type: 'string', required: true },
        { name: 'successStory', type: 'string', required: true }
      ],
      constraints: [
        { type: 'word_count', rule: 'max 200 words', enforcement: 'flexible' },
        { type: 'compliance', rule: 'no unverifiable claims', enforcement: 'strict' }
      ],
      performance: {
        usageCount: 0,
        avgOpenRate: 0.28,
        avgResponseRate: 0.08,
        avgConversionRate: 0.03,
        bestPerformingSegments: ['SaaS', 'agencies']
      }
    });

    templates.set('pattern_interrupt_email', {
      id: 'pattern_interrupt_email',
      variantType: 'pattern_interrupt',
      channel: 'email',
      structure: {
        hook: 'Unexpected opening that breaks email fatigue',
        bridge: 'Quick pivot to relevance',
        body: 'Concise value with fresh perspective',
        cta: 'Simple, intriguing ask'
      },
      variables: [
        { name: 'firstName', type: 'string', required: true },
        { name: 'interruptHook', type: 'string', required: true }
      ],
      constraints: [
        { type: 'word_count', rule: 'max 100 words', enforcement: 'strict' },
        { type: 'tone', rule: 'unexpected but professional', enforcement: 'flexible' }
      ],
      performance: {
        usageCount: 0,
        avgOpenRate: 0.42,
        avgResponseRate: 0.15,
        avgConversionRate: 0.05,
        bestPerformingSegments: ['creative', 'startup']
      }
    });

    templates.set('direct_ask_email', {
      id: 'direct_ask_email',
      variantType: 'direct_ask',
      channel: 'email',
      structure: {
        hook: 'Respectful acknowledgment',
        bridge: 'Direct statement of intent',
        body: 'Clear value proposition',
        cta: 'Binary choice close'
      },
      variables: [
        { name: 'firstName', type: 'string', required: true },
        { name: 'directAsk', type: 'string', required: true }
      ],
      constraints: [
        { type: 'word_count', rule: 'max 80 words', enforcement: 'strict' },
        { type: 'tone', rule: 'respectful, direct', enforcement: 'strict' }
      ],
      performance: {
        usageCount: 0,
        avgOpenRate: 0.25,
        avgResponseRate: 0.18,
        avgConversionRate: 0.08,
        bestPerformingSegments: ['enterprise', 'executives']
      }
    });

    return templates;
  }

  private initializeComplianceRules(): ComplianceRule[] {
    return [
      {
        id: 'no_false_urgency',
        name: 'No False Urgency',
        check: (copy: string) => !this.containsFalseUrgency(copy),
        severity: 'critical'
      },
      {
        id: 'no_manipulation',
        name: 'No Manipulative Language',
        check: (copy: string) => !this.containsManipulation(copy),
        severity: 'critical'
      },
      {
        id: 'unsubscribe_compliant',
        name: 'Unsubscribe Compliance',
        check: (copy: string, channel: CommunicationChannel) => 
          channel !== 'email' || this.hasUnsubscribeOption(copy),
        severity: 'critical'
      },
      {
        id: 'truthful_claims',
        name: 'Truthful Claims Only',
        check: (copy: string) => !this.containsUnverifiableClaims(copy),
        severity: 'high'
      },
      {
        id: 'respectful_tone',
        name: 'Respectful Tone',
        check: (copy: string) => !this.containsDisrespectfulLanguage(copy),
        severity: 'high'
      }
    ];
  }

  async generateResurrectionCopy(
    leadContext: LeadContext,
    strategy: ResurrectionStrategy,
    config: CopyGenerationConfig
  ): Promise<ResurrectionCopy[]> {
    const variants: ResurrectionCopy[] = [];
    const selectedTemplates = this.selectTemplates(strategy, config);

    for (const template of selectedTemplates.slice(0, config.maxVariants)) {
      const copy = await this.generateFromTemplate(template, leadContext, strategy, config);
      const compliantCopy = this.ensureCompliance(copy, config.complianceLevel);
      variants.push(compliantCopy);
    }

    return this.rankVariants(variants);
  }

  private selectTemplates(strategy: ResurrectionStrategy, config: CopyGenerationConfig): CopyTemplate[] {
    const matchingTemplates: CopyTemplate[] = [];

    for (const [, template] of this.templates) {
      if (template.variantType === strategy.approach && template.channel === strategy.channel) {
        matchingTemplates.push(template);
      }
    }

    // If no exact match, get templates for the channel
    if (matchingTemplates.length === 0) {
      for (const [, template] of this.templates) {
        if (template.channel === strategy.channel) {
          matchingTemplates.push(template);
        }
      }
    }

    return matchingTemplates.sort((a, b) => 
      b.performance.avgResponseRate - a.performance.avgResponseRate
    );
  }

  private async generateFromTemplate(
    template: CopyTemplate,
    leadContext: LeadContext,
    strategy: ResurrectionStrategy,
    config: CopyGenerationConfig
  ): Promise<ResurrectionCopy> {
    const personalization = this.generatePersonalization(leadContext, config.personalizationDepth);
    const triggers = this.selectPsychologicalTriggers(leadContext, strategy, config.excludeTriggers);
    const variant = this.determineVariant(template, strategy, config);
    
    const body = this.composeCopyBody(template, leadContext, personalization, triggers, variant);
    const subject = template.channel === 'email' ? 
      this.generateSubjectLine(leadContext, variant) : undefined;
    const cta = this.generateCTA(strategy, leadContext, variant);

    return {
      copyId: crypto.randomUUID(),
      leadId: leadContext.leadId,
      variant,
      channel: template.channel,
      subject,
      headline: template.channel === 'email' ? undefined : this.generateHeadline(leadContext, variant),
      body,
      callToAction: cta,
      personalizationElements: personalization,
      psychologicalTriggers: triggers,
      complianceChecks: [],
      predictedMetrics: this.predictMetrics(template, personalization, triggers),
      generatedAt: new Date()
    };
  }

  private generatePersonalization(
    leadContext: LeadContext,
    depth: 'basic' | 'deep' | 'hyper'
  ): PersonalizationElement[] {
    const elements: PersonalizationElement[] = [];

    // Basic personalization
    elements.push({
      type: 'name',
      value: leadContext.name,
      placement: 'opening',
      impact: 0.3
    });

    if (leadContext.company) {
      elements.push({
        type: 'company',
        value: leadContext.company,
        placement: 'body',
        impact: 0.2
      });
    }

    if (depth === 'deep' || depth === 'hyper') {
      elements.push({
        type: 'industry',
        value: leadContext.industry,
        placement: 'context',
        impact: 0.25
      });

      if (leadContext.dormancyReason) {
        elements.push({
          type: 'specific_pain',
          value: leadContext.dormancyReason,
          placement: 'bridge',
          impact: 0.4
        });
      }
    }

    if (depth === 'hyper') {
      const lastComm = leadContext.communicationHistory[leadContext.communicationHistory.length - 1];
      if (lastComm) {
        elements.push({
          type: 'previous_interaction',
          value: `our conversation about ${lastComm.message.substring(0, 50)}`,
          placement: 'opening',
          impact: 0.5
        });
      }

      elements.push({
        type: 'behavior_based',
        value: `Based on your ${leadContext.identityProfile.decisionStyle} approach`,
        placement: 'body',
        impact: 0.35
      });
    }

    return elements;
  }

  private selectPsychologicalTriggers(
    leadContext: LeadContext,
    strategy: ResurrectionStrategy,
    excludeTriggers?: TriggerType[]
  ): PsychologicalTrigger[] {
    const triggers: PsychologicalTrigger[] = [];
    const excluded = new Set(excludeTriggers || []);

    // Select triggers based on identity profile
    const profile = leadContext.identityProfile;

    if (!excluded.has('social_proof') && profile.trustLevel < 0.6) {
      triggers.push({
        trigger: 'social_proof',
        implementation: 'Include relevant testimonial or result',
        ethicalScore: 0.95,
        effectiveness: 0.75
      });
    }

    if (!excluded.has('autonomy')) {
      triggers.push({
        trigger: 'autonomy',
        implementation: 'Frame as their choice, no pressure',
        ethicalScore: 1.0,
        effectiveness: 0.70
      });
    }

    if (!excluded.has('curiosity') && strategy.approach !== 'direct_ask') {
      triggers.push({
        trigger: 'curiosity',
        implementation: 'Open loop in subject or opening',
        ethicalScore: 0.90,
        effectiveness: 0.80
      });
    }

    if (!excluded.has('reciprocity') && profile.trustLevel > 0.4) {
      triggers.push({
        trigger: 'reciprocity',
        implementation: 'Offer value before asking',
        ethicalScore: 0.95,
        effectiveness: 0.65
      });
    }

    if (!excluded.has('loss_aversion') && profile.riskTolerance < 0.5) {
      triggers.push({
        trigger: 'loss_aversion',
        implementation: 'Frame cost of inaction (ethically)',
        ethicalScore: 0.80,
        effectiveness: 0.70
      });
    }

    return triggers.filter(t => t.ethicalScore >= 0.8);
  }

  private determineVariant(
    template: CopyTemplate,
    strategy: ResurrectionStrategy,
    config: CopyGenerationConfig
  ): CopyVariant {
    return {
      type: template.variantType,
      tone: config.toneOverride || this.selectTone(strategy),
      length: this.determineLength(template.channel),
      angle: this.selectAngle(strategy),
      urgencyLevel: strategy.urgencyLevel || 0.3
    };
  }

  private selectTone(strategy: ResurrectionStrategy): CopyTone {
    const toneMap: Record<VariantType, CopyTone> = {
      'soft_check_in': 'warm_professional',
      'value_reminder': 'authoritative',
      'new_development': 'curious',
      'social_proof': 'authoritative',
      'scarcity_authentic': 'direct',
      'problem_resurface': 'empathetic',
      'direct_ask': 'direct',
      'relationship_rebuild': 'warm_professional',
      'permission_based': 'empathetic',
      'pattern_interrupt': 'playful'
    };

    return toneMap[strategy.approach] || 'warm_professional';
  }

  private determineLength(channel: CommunicationChannel): CopyVariant['length'] {
    const lengthMap: Record<CommunicationChannel, CopyVariant['length']> = {
      'email': 'short',
      'sms': 'micro',
      'phone_script': 'medium',
      'video_message': 'short',
      'social_dm': 'micro',
      'direct_mail': 'medium',
      'voicemail': 'micro'
    };

    return lengthMap[channel] || 'short';
  }

  private selectAngle(strategy: ResurrectionStrategy): CopyAngle {
    const angleMap: Record<VariantType, CopyAngle> = {
      'soft_check_in': 'genuine_concern',
      'value_reminder': 'outcome_focused',
      'new_development': 'new_information',
      'social_proof': 'success_story',
      'scarcity_authentic': 'time_sensitive',
      'problem_resurface': 'problem_agitation',
      'direct_ask': 'outcome_focused',
      'relationship_rebuild': 'genuine_concern',
      'permission_based': 'genuine_concern',
      'pattern_interrupt': 'new_information'
    };

    return angleMap[strategy.approach] || 'outcome_focused';
  }

  private composeCopyBody(
    template: CopyTemplate,
    leadContext: LeadContext,
    personalization: PersonalizationElement[],
    triggers: PsychologicalTrigger[],
    variant: CopyVariant
  ): string {
    const parts: string[] = [];
    const firstName = personalization.find(p => p.type === 'name')?.value || 'there';

    // Hook
    parts.push(this.generateHook(variant, firstName, leadContext));

    // Bridge
    parts.push(this.generateBridge(variant, leadContext, personalization));

    // Body
    parts.push(this.generateBodyContent(variant, leadContext, triggers));

    // Proof (if applicable)
    if (template.structure.proof && triggers.some(t => t.trigger === 'social_proof')) {
      parts.push(this.generateProofSection(leadContext));
    }

    return parts.join('\n\n');
  }

  private generateHook(variant: CopyVariant, firstName: string, leadContext: LeadContext): string {
    const hooks: Record<VariantType, string[]> = {
      'soft_check_in': [
        `Hi ${firstName},`,
        `${firstName}, just thinking of you.`,
        `Hey ${firstName},`
      ],
      'value_reminder': [
        `${firstName},`,
        `Hi ${firstName},`
      ],
      'pattern_interrupt': [
        `${firstName}, quick question:`,
        `I owe you an apology, ${firstName}.`,
        `${firstName}, I deleted this email twice before sending.`
      ],
      'direct_ask': [
        `${firstName}, I'll keep this brief.`,
        `Hi ${firstName}, straight to it:`
      ],
      'new_development': [
        `${firstName}, something changed.`,
        `Hi ${firstName}, thought you should know:`
      ],
      'social_proof': [
        `${firstName},`,
        `Hi ${firstName},`
      ],
      'scarcity_authentic': [
        `${firstName}, heads up:`,
        `Hi ${firstName}, quick note:`
      ],
      'problem_resurface': [
        `${firstName},`,
        `Hi ${firstName},`
      ],
      'relationship_rebuild': [
        `Hi ${firstName},`,
        `${firstName}, it's been a while.`
      ],
      'permission_based': [
        `${firstName}, quick question for you.`,
        `Hi ${firstName}, wondering something:`
      ]
    };

    const options = hooks[variant.type] || hooks['soft_check_in'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateBridge(
    variant: CopyVariant,
    leadContext: LeadContext,
    personalization: PersonalizationElement[]
  ): string {
    const previousInteraction = personalization.find(p => p.type === 'previous_interaction');
    const timeSinceContact = this.formatTimeSince(leadContext.lastInteraction);

    const bridges: Record<VariantType, string[]> = {
      'soft_check_in': [
        `It's been ${timeSinceContact} since we last connected.`,
        `I was reviewing my notes from our conversation and thought of you.`
      ],
      'value_reminder': [
        `When we last spoke, you mentioned wanting to ${this.extractGoal(leadContext)}.`,
        `I remember you were focused on ${this.extractGoal(leadContext)}.`
      ],
      'pattern_interrupt': [
        `This isn't another follow-up email.`,
        `I know your inbox is probably full of emails like this one. This is different.`
      ],
      'direct_ask': [
        `I wanted to reach out one more time.`,
        `Rather than guess, I thought I'd just ask directly.`
      ],
      'new_development': [
        `Something happened that I thought you'd want to know about.`,
        `There's been a development that's relevant to what we discussed.`
      ],
      'social_proof': [
        `I was just working with a client in a similar situation.`,
        `Something interesting happened with one of our clients in ${leadContext.industry}.`
      ],
      'scarcity_authentic': [
        `I have some news about availability.`,
        `Things are changing on our end, and I wanted you to know.`
      ],
      'problem_resurface': [
        `I was thinking about the challenge you mentioned.`,
        `The problem you described has been on my mind.`
      ],
      'relationship_rebuild': [
        `Life gets busy, I completely understand.`,
        `No agenda here, just genuinely curious how things are going.`
      ],
      'permission_based': [
        `I have some thoughts that might be helpful, but only if you're open to it.`,
        `Before I share anything else, I wanted to ask:`
      ]
    };

    const options = bridges[variant.type] || bridges['soft_check_in'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateBodyContent(
    variant: CopyVariant,
    leadContext: LeadContext,
    triggers: PsychologicalTrigger[]
  ): string {
    const bodyTemplates: Record<VariantType, string> = {
      'soft_check_in': `I hope things are going well with ${leadContext.company || 'your work'}. If anything has changed regarding ${this.extractGoal(leadContext)}, I'd love to hear about it.`,
      'value_reminder': `We've helped similar ${leadContext.industry} companies achieve significant results. If ${this.extractGoal(leadContext)} is still a priority, there might be a quick win we could explore together.`,
      'pattern_interrupt': `I realized I never asked you the most important question: What would actually make this worth your time?`,
      'direct_ask': `Is this something you're still considering, or should I close the loop on my end? Either way is completely fine.`,
      'new_development': `We recently made some changes that directly address the concerns you raised. If you have 10 minutes, I'd like to show you.`,
      'social_proof': `They were in a similar situation - ${this.extractPain(leadContext)}. Now they're seeing different results.`,
      'scarcity_authentic': `We're adjusting our capacity, and I wanted to reach out before things change.`,
      'problem_resurface': `That challenge you mentioned - ${this.extractPain(leadContext)} - tends to compound over time. Has anything shifted?`,
      'relationship_rebuild': `No pitch, no pressure. Just wanted to reconnect and see how things are going.`,
      'permission_based': `Would it be okay if I shared a thought about ${this.extractGoal(leadContext)}? Just say the word.`
    };

    return bodyTemplates[variant.type] || bodyTemplates['soft_check_in'];
  }

  private generateProofSection(leadContext: LeadContext): string {
    return `One of our ${leadContext.industry} clients recently shared their experience - might be relevant to your situation.`;
  }

  private generateSubjectLine(leadContext: LeadContext, variant: CopyVariant): string {
    const subjects: Record<VariantType, string[]> = {
      'soft_check_in': [
        `${leadContext.name}, quick check-in`,
        `Thinking of you`,
        `${leadContext.name}?`
      ],
      'value_reminder': [
        `Re: ${this.extractGoal(leadContext)}`,
        `Update for ${leadContext.company || 'you'}`,
        `Thought of you when I saw this`
      ],
      'pattern_interrupt': [
        `(Not a sales email)`,
        `I owe you an apology`,
        `Quick question, ${leadContext.name}`
      ],
      'direct_ask': [
        `Should I close your file?`,
        `Yes or no?`,
        `${leadContext.name}, one question`
      ],
      'new_development': [
        `Something changed`,
        `News for ${leadContext.company || 'you'}`,
        `Update you should see`
      ],
      'social_proof': [
        `${leadContext.industry} client results`,
        `Thought you'd find this interesting`,
        `Similar situation, different outcome`
      ],
      'scarcity_authentic': [
        `Before this changes`,
        `Quick heads up`,
        `Timing update`
      ],
      'problem_resurface': [
        `Still thinking about this`,
        `Re: ${this.extractPain(leadContext)}`,
        `Has this changed?`
      ],
      'relationship_rebuild': [
        `Been a while, ${leadContext.name}`,
        `How are things?`,
        `Checking in`
      ],
      'permission_based': [
        `Quick question`,
        `Would this help?`,
        `Permission to share?`
      ]
    };

    const options = subjects[variant.type] || subjects['soft_check_in'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateHeadline(leadContext: LeadContext, variant: CopyVariant): string {
    return `A message for ${leadContext.name}`;
  }

  private generateCTA(
    strategy: ResurrectionStrategy,
    leadContext: LeadContext,
    variant: CopyVariant
  ): CallToAction {
    const ctaTemplates: Record<VariantType, CallToAction> = {
      'soft_check_in': {
        primary: 'Hit reply and let me know how things are going.',
        urgency: 'No rush at all.',
        friction: 'ultra_low',
        type: 'reply'
      },
      'value_reminder': {
        primary: 'Want me to send over some details?',
        secondary: 'Or we can jump on a quick call.',
        urgency: 'Whenever works for you.',
        friction: 'low',
        type: 'reply'
      },
      'pattern_interrupt': {
        primary: 'Just reply with one word: interested or not.',
        urgency: '',
        friction: 'ultra_low',
        type: 'reply'
      },
      'direct_ask': {
        primary: 'Yes or no - I respect either answer.',
        urgency: '',
        friction: 'ultra_low',
        type: 'reply'
      },
      'new_development': {
        primary: 'Want to see what changed?',
        urgency: 'Happy to show you this week.',
        friction: 'low',
        type: 'book'
      },
      'social_proof': {
        primary: 'Want me to share what worked for them?',
        urgency: '',
        friction: 'low',
        type: 'reply'
      },
      'scarcity_authentic': {
        primary: 'Let me know if you want to explore this before things shift.',
        urgency: 'Changes take effect soon.',
        friction: 'low',
        type: 'reply'
      },
      'problem_resurface': {
        primary: 'If this is still relevant, I have some ideas.',
        urgency: '',
        friction: 'low',
        type: 'reply'
      },
      'relationship_rebuild': {
        primary: 'Would love to hear from you.',
        urgency: '',
        friction: 'ultra_low',
        type: 'reply'
      },
      'permission_based': {
        primary: "Just say \"yes\" and I'll share.",
        urgency: '',
        friction: 'ultra_low',
        type: 'reply'
      }
    };

    return ctaTemplates[variant.type] || ctaTemplates['soft_check_in'];
  }

  private predictMetrics(
    template: CopyTemplate,
    personalization: PersonalizationElement[],
    triggers: PsychologicalTrigger[]
  ): PredictedMetrics {
    const baseMetrics = template.performance;
    
    // Adjust based on personalization depth
    const personalizationBoost = personalization.reduce((sum, p) => sum + p.impact, 0) / 10;
    
    // Adjust based on trigger effectiveness
    const triggerBoost = triggers.reduce((sum, t) => sum + t.effectiveness * t.ethicalScore, 0) / 
                         (triggers.length || 1) / 10;

    return {
      openRate: Math.min(0.7, baseMetrics.avgOpenRate + personalizationBoost),
      responseRate: Math.min(0.4, baseMetrics.avgResponseRate + personalizationBoost + triggerBoost),
      conversionRate: Math.min(0.2, baseMetrics.avgConversionRate + triggerBoost),
      confidenceInterval: 0.15
    };
  }

  private ensureCompliance(copy: ResurrectionCopy, level: 'strict' | 'moderate' | 'flexible'): ResurrectionCopy {
    const checks: ComplianceCheck[] = [];

    for (const rule of this.complianceRules) {
      const passed = rule.check(copy.body, copy.channel);
      checks.push({
        rule: rule.name,
        passed,
        details: passed ? 'Passed' : `Failed: ${rule.name}`
      });

      if (!passed && (level === 'strict' || rule.severity === 'critical')) {
        // Clean the copy
        copy.body = this.cleanViolation(copy.body, rule);
      }
    }

    copy.complianceChecks = checks;
    return copy;
  }

  private cleanViolation(body: string, rule: ComplianceRule): string {
    // Simple cleaning - in production, this would be more sophisticated
    return body;
  }

  private rankVariants(variants: ResurrectionCopy[]): ResurrectionCopy[] {
    return variants.sort((a, b) => {
      const scoreA = a.predictedMetrics.responseRate * a.predictedMetrics.conversionRate;
      const scoreB = b.predictedMetrics.responseRate * b.predictedMetrics.conversionRate;
      return scoreB - scoreA;
    });
  }

  // Helper methods
  private formatTimeSince(date: Date): string {
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return 'a while';
  }

  private extractGoal(context: LeadContext): string {
    const drivers = context.identityProfile.emotionalDrivers;
    return drivers[0] || 'your goals';
  }

  private extractPain(context: LeadContext): string {
    return context.dormancyReason || 'the challenge you mentioned';
  }

  private containsFalseUrgency(copy: string): boolean {
    const falseUrgencyPhrases = [
      'last chance',
      'act now or lose',
      'only 1 left',
      'expires in 24 hours'
    ];
    const copyLower = copy.toLowerCase();
    return falseUrgencyPhrases.some(phrase => copyLower.includes(phrase));
  }

  private containsManipulation(copy: string): boolean {
    const manipulativePhrases = [
      'you\'d be stupid not to',
      'everyone else is doing',
      'don\'t miss out or'
    ];
    const copyLower = copy.toLowerCase();
    return manipulativePhrases.some(phrase => copyLower.includes(phrase));
  }

  private hasUnsubscribeOption(copy: string): boolean {
    return copy.toLowerCase().includes('unsubscribe') || 
           copy.toLowerCase().includes('opt out') ||
           copy.toLowerCase().includes('stop receiving');
  }

  private containsUnverifiableClaims(copy: string): boolean {
    const unverifiablePhrases = [
      'guaranteed results',
      '100% success',
      'everyone who',
      'never fails'
    ];
    const copyLower = copy.toLowerCase();
    return unverifiablePhrases.some(phrase => copyLower.includes(phrase));
  }

  private containsDisrespectfulLanguage(copy: string): boolean {
    return false; // Simplified - would have actual check in production
  }
}

interface ResurrectionStrategy {
  approach: VariantType;
  channel: CommunicationChannel;
  urgencyLevel?: number;
}

interface ComplianceRule {
  id: string;
  name: string;
  check: (copy: string, channel?: CommunicationChannel) => boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface CopyPerformance {
  copyId: string;
  opens: number;
  responses: number;
  conversions: number;
  sentiment: number;
}
