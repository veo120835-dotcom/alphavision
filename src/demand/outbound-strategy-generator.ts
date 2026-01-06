import type { BusinessContext, OutboundStrategy, TargetSegment, OutboundSequence, MessagingFramework, OutboundMetrics, SequenceStep } from './types';

export class OutboundStrategyGenerator {
  generateStrategy(context: BusinessContext, customization?: {
    targetCompanySize?: string[];
    targetTitles?: string[];
    valueProposition?: string;
  }): OutboundStrategy {
    const targetSegments = this.defineTargetSegments(context, customization);
    const messagingFramework = this.buildMessagingFramework(context, customization);
    const sequences = this.createSequences(targetSegments, messagingFramework);
    const tools = this.recommendTools(context);
    const metrics = this.setMetricTargets(context);

    return {
      targetSegments,
      sequences,
      messagingFramework,
      tools,
      metrics,
    };
  }

  private defineTargetSegments(
    context: BusinessContext,
    customization?: { targetCompanySize?: string[]; targetTitles?: string[] }
  ): TargetSegment[] {
    const segments: TargetSegment[] = [];

    // Primary segment based on deal size
    if (context.averageDealSize >= 50000) {
      segments.push({
        name: 'Enterprise',
        criteria: [
          'Company size: 1000+ employees',
          'Revenue: $100M+',
          `Industry: ${context.industry}`,
          'Has existing tech stack',
        ],
        size: 500,
        priority: 'primary',
        painPoints: this.getPainPoints(context, 'enterprise'),
        triggers: this.getTriggers('enterprise'),
      });
    }

    if (context.averageDealSize >= 10000) {
      segments.push({
        name: 'Mid-Market',
        criteria: [
          'Company size: 100-1000 employees',
          'Revenue: $10M-$100M',
          `Industry: ${context.industry}`,
          'Growth stage',
        ],
        size: 2000,
        priority: context.averageDealSize >= 50000 ? 'secondary' : 'primary',
        painPoints: this.getPainPoints(context, 'midmarket'),
        triggers: this.getTriggers('midmarket'),
      });
    }

    segments.push({
      name: 'SMB',
      criteria: [
        'Company size: 10-100 employees',
        'Revenue: $1M-$10M',
        `Industry: ${context.industry}`,
        'Tech-forward',
      ],
      size: 10000,
      priority: segments.length === 0 ? 'primary' : 'tertiary',
      painPoints: this.getPainPoints(context, 'smb'),
      triggers: this.getTriggers('smb'),
    });

    // Add customization if provided
    if (customization?.targetCompanySize) {
      segments.forEach(s => {
        s.criteria.push(`Specific sizes: ${customization.targetCompanySize!.join(', ')}`);
      });
    }

    return segments;
  }

  private getPainPoints(context: BusinessContext, segment: string): string[] {
    const commonPains = [
      'Manual processes slowing growth',
      'Difficulty scaling operations',
      'Lack of visibility into performance',
      'Integration challenges',
    ];

    const segmentPains: Record<string, string[]> = {
      enterprise: [
        'Complex procurement processes',
        'Security and compliance requirements',
        'Legacy system integration',
        'Multi-team coordination',
      ],
      midmarket: [
        'Resource constraints',
        'Rapid growth challenges',
        'Need for scalable solutions',
        'Budget optimization pressure',
      ],
      smb: [
        'Limited budget',
        'Time constraints',
        'Need for quick ROI',
        'Simple implementation required',
      ],
    };

    return [...commonPains.slice(0, 2), ...segmentPains[segment].slice(0, 2)];
  }

  private getTriggers(segment: string): string[] {
    const triggers: Record<string, string[]> = {
      enterprise: [
        'New executive hire',
        'Digital transformation initiative',
        'M&A activity',
        'Regulatory changes',
        'Competitive pressure',
      ],
      midmarket: [
        'Funding announcement',
        'Rapid hiring',
        'New office/expansion',
        'Tech stack evaluation',
        'Leadership change',
      ],
      smb: [
        'Growth milestones',
        'Team expansion',
        'Process breakdown',
        'Competitor adoption',
        'Industry event attendance',
      ],
    };

    return triggers[segment] || triggers.smb;
  }

  private buildMessagingFramework(
    context: BusinessContext,
    customization?: { valueProposition?: string }
  ): MessagingFramework {
    const valueProposition = customization?.valueProposition || 
      `We help ${context.targetMarket === 'b2b' ? 'companies' : 'teams'} in ${context.industry} achieve better results through our solution.`;

    const differentiators = [
      'Purpose-built for your industry',
      'Faster time-to-value than alternatives',
      'Proven ROI with similar companies',
      'White-glove implementation support',
    ];

    const objectionHandlers: Record<string, string> = {
      'Not a priority right now': 'I understand timing is everything. Many of our best customers started with a small pilot during their planning phase. Would it make sense to explore what that could look like so you\'re ready when it becomes a priority?',
      'Already using competitor': 'That\'s great that you\'re already invested in this area. Many customers who switched to us were surprised by the gains. Would a quick comparison be valuable?',
      'No budget': 'Budget is always a consideration. Our customers typically see ROI within the first quarter. Would it help to see how others justified the investment?',
      'Need to talk to team': 'Absolutely - important decisions need team input. Would it help if I put together a brief overview they can review? Or I could join a quick call with your team.',
      'Send me information': 'Happy to! To make sure I send the most relevant info, can I ask one quick question about your main priorities right now?',
    };

    const socialProof = [
      'Trusted by X companies in your industry',
      'Average customer sees Y% improvement',
      'Recently helped [Similar Company] achieve [Result]',
      'Industry award/recognition',
    ];

    return {
      valueProposition,
      differentiators,
      objectionHandlers,
      socialProof,
    };
  }

  private createSequences(segments: TargetSegment[], messaging: MessagingFramework): OutboundSequence[] {
    return segments.map(segment => ({
      name: `${segment.name} Outbound Sequence`,
      segment: segment.name,
      steps: this.buildSequenceSteps(segment, messaging),
      duration: segment.priority === 'primary' ? '21 days' : '14 days',
      expectedResponseRate: segment.priority === 'primary' ? 0.15 : 0.08,
    }));
  }

  private buildSequenceSteps(segment: TargetSegment, messaging: MessagingFramework): SequenceStep[] {
    const steps: SequenceStep[] = [];

    // Day 1: Initial email
    steps.push({
      day: 1,
      channel: 'email',
      action: 'Initial outreach',
      template: this.generateEmailTemplate('initial', segment, messaging),
    });

    // Day 2: LinkedIn connection
    steps.push({
      day: 2,
      channel: 'linkedin',
      action: 'Connection request with note',
      template: 'Personalized connection request referencing their role/company',
    });

    // Day 4: Follow-up email
    steps.push({
      day: 4,
      channel: 'email',
      action: 'Value-add follow-up',
      template: this.generateEmailTemplate('followup1', segment, messaging),
    });

    // Day 7: LinkedIn message
    steps.push({
      day: 7,
      channel: 'linkedin',
      action: 'Direct message with insight',
      template: 'Share relevant content or insight about their industry',
    });

    // Day 10: Email with social proof
    steps.push({
      day: 10,
      channel: 'email',
      action: 'Social proof email',
      template: this.generateEmailTemplate('socialproof', segment, messaging),
    });

    // Day 14: Breakup email
    steps.push({
      day: 14,
      channel: 'email',
      action: 'Final attempt / Breakup',
      template: this.generateEmailTemplate('breakup', segment, messaging),
    });

    // For enterprise, add phone touch
    if (segment.priority === 'primary') {
      steps.splice(4, 0, {
        day: 8,
        channel: 'phone',
        action: 'Phone call attempt',
        template: 'Brief voicemail if no answer, reference previous emails',
      });
    }

    return steps;
  }

  private generateEmailTemplate(type: string, segment: TargetSegment, messaging: MessagingFramework): string {
    const templates: Record<string, string> = {
      initial: `Subject: [Personalized hook related to ${segment.painPoints[0]}]

Hi {{firstName}},

[Trigger-based opener - noticed {{trigger}}]

${segment.painPoints[0]} is a challenge I hear about often from {{title}}s at companies like {{company}}.

${messaging.differentiators[0]}.

Would you be open to a quick conversation about how we've helped similar companies?

Best,
[Signature]`,

      followup1: `Subject: Re: [Previous subject]

Hi {{firstName}},

Quick follow-up on my note from earlier this week.

I wanted to share a resource that might be helpful: [Relevant content for ${segment.name}]

${messaging.socialProof[0]}

Worth a quick chat?

[Signature]`,

      socialproof: `Subject: How {{Similar Company}} solved {{Pain Point}}

Hi {{firstName}},

${messaging.socialProof[2]}

Given what I know about {{company}}, I think you could see similar results.

Would a 15-minute call make sense to explore this?

[Signature]`,

      breakup: `Subject: Should I close your file?

Hi {{firstName}},

I've reached out a few times without hearing back, so I want to respect your time.

If now isn't the right time, I completely understand. If priorities change, here's the one thing I'd want you to know:

${messaging.valueProposition}

Either way, I wish you the best.

[Signature]`,
    };

    return templates[type] || templates.initial;
  }

  private recommendTools(context: BusinessContext): string[] {
    const tools: string[] = [];

    // CRM
    if (context.averageDealSize >= 50000) {
      tools.push('Salesforce (Enterprise CRM)');
    } else if (context.averageDealSize >= 10000) {
      tools.push('HubSpot or Pipedrive (Mid-market CRM)');
    } else {
      tools.push('HubSpot Free or Notion CRM');
    }

    // Outreach/Sequencing
    if (context.budget >= 10000) {
      tools.push('Outreach.io or Salesloft (Sequencing)');
    } else {
      tools.push('Apollo.io or Lemlist (Sequencing)');
    }

    // Data/Prospecting
    tools.push('LinkedIn Sales Navigator');
    tools.push('Apollo.io or ZoomInfo (Contact data)');

    // Email tools
    tools.push('Email warming tool (Instantly, Warmbox)');

    return tools;
  }

  private setMetricTargets(context: BusinessContext): OutboundMetrics {
    const isEnterprise = context.averageDealSize >= 50000;

    return {
      emailOpenRate: isEnterprise ? 0.35 : 0.25,
      replyRate: isEnterprise ? 0.08 : 0.05,
      meetingRate: isEnterprise ? 0.03 : 0.02,
      targetMeetingsPerMonth: Math.ceil(context.budget / context.averageDealSize * 4), // 4 meetings per expected deal
    };
  }

  analyzeExistingSequence(sequence: OutboundSequence): {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Analyze step count
    if (sequence.steps.length >= 5) {
      strengths.push('Good sequence length for persistence');
    } else {
      weaknesses.push('Sequence may be too short');
      recommendations.push('Add more touchpoints - 5-7 is optimal');
    }

    // Analyze channel mix
    const channels = new Set(sequence.steps.map(s => s.channel));
    if (channels.size >= 2) {
      strengths.push('Multi-channel approach');
    } else {
      weaknesses.push('Single channel limits reach');
      recommendations.push('Add LinkedIn and/or phone touches');
    }

    // Analyze timing
    const lastDay = Math.max(...sequence.steps.map(s => s.day));
    if (lastDay >= 14) {
      strengths.push('Adequate sequence duration');
    } else {
      weaknesses.push('Sequence ends too quickly');
      recommendations.push('Extend to 14-21 days for better results');
    }

    return { strengths, weaknesses, recommendations };
  }
}

export const outboundStrategyGenerator = new OutboundStrategyGenerator();
