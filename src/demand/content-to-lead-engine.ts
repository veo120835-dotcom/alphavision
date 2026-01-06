import type { BusinessContext, ContentStrategy, ContentPiece, DistributionChannel, LeadMagnet, ConversionStep, ContentType, FunnelStage } from './types';

export class ContentToLeadEngine {
  generateStrategy(context: BusinessContext): ContentStrategy {
    const pillarTopics = this.identifyPillarTopics(context);
    const contentCalendar = this.buildContentCalendar(context, pillarTopics);
    const distributionPlan = this.createDistributionPlan(context);
    const leadMagnets = this.designLeadMagnets(context, pillarTopics);
    const conversionPath = this.mapConversionPath(context);

    return {
      pillarTopics,
      contentCalendar,
      distributionPlan,
      leadMagnets,
      conversionPath,
    };
  }

  private identifyPillarTopics(context: BusinessContext): string[] {
    const industryTopics: Record<string, string[]> = {
      'saas': [
        'Product best practices',
        'Industry trends and analysis',
        'Use case deep dives',
        'Integration guides',
        'ROI and business impact',
      ],
      'fintech': [
        'Regulatory compliance guides',
        'Industry trends',
        'Security and trust',
        'Implementation guides',
        'Case studies and ROI',
      ],
      'healthtech': [
        'Compliance and regulations',
        'Patient outcomes',
        'Technology adoption',
        'Workflow optimization',
        'Industry research',
      ],
      'default': [
        'Industry insights',
        'How-to guides',
        'Best practices',
        'Case studies',
        'Product education',
      ],
    };

    const industryLower = context.industry.toLowerCase();
    for (const [key, topics] of Object.entries(industryTopics)) {
      if (industryLower.includes(key)) {
        return topics;
      }
    }
    
    return industryTopics.default;
  }

  private buildContentCalendar(context: BusinessContext, pillars: string[]): ContentPiece[] {
    const pieces: ContentPiece[] = [];
    const personas = this.inferPersonas(context);

    // Generate content for each funnel stage
    for (const stage of ['awareness', 'consideration', 'decision'] as FunnelStage[]) {
      for (const pillar of pillars.slice(0, 3)) {
        for (const persona of personas.slice(0, 2)) {
          pieces.push(this.createContentPiece(pillar, stage, persona, context));
        }
      }
    }

    return pieces;
  }

  private inferPersonas(context: BusinessContext): string[] {
    if (context.targetMarket === 'b2b') {
      if (context.averageDealSize > 50000) {
        return ['C-Level Executive', 'VP/Director', 'Technical Evaluator', 'End User'];
      }
      return ['Decision Maker', 'Champion/User', 'Technical Buyer'];
    }
    return ['Primary User', 'Secondary User', 'Influencer'];
  }

  private createContentPiece(
    pillar: string,
    stage: FunnelStage,
    persona: string,
    context: BusinessContext
  ): ContentPiece {
    const typeByStage: Record<FunnelStage, ContentType[]> = {
      awareness: ['blog-post', 'social-post', 'infographic', 'podcast'],
      consideration: ['whitepaper', 'webinar', 'case-study', 'video'],
      decision: ['case-study', 'landing-page', 'video'],
      retention: ['newsletter', 'blog-post', 'webinar'],
    };

    const types = typeByStage[stage];
    const type = types[Math.floor(Math.random() * types.length)];

    const ctaByStage: Record<FunnelStage, string> = {
      awareness: 'Learn more',
      consideration: 'Download guide / Watch demo',
      decision: 'Start free trial / Request demo',
      retention: 'Explore features',
    };

    return {
      title: this.generateTitle(pillar, stage, persona),
      type,
      topic: pillar,
      funnelStage: stage,
      targetPersona: persona,
      keywords: this.generateKeywords(pillar, context),
      cta: ctaByStage[stage],
      estimatedEffort: this.estimateEffort(type),
    };
  }

  private generateTitle(pillar: string, stage: FunnelStage, persona: string): string {
    const templates: Record<FunnelStage, string[]> = {
      awareness: [
        `The Complete Guide to ${pillar}`,
        `Why ${pillar} Matters for ${persona}s`,
        `${pillar}: Trends and Insights for 2024`,
      ],
      consideration: [
        `How to Evaluate ${pillar} Solutions`,
        `${pillar} Best Practices for ${persona}s`,
        `Comparing Approaches to ${pillar}`,
      ],
      decision: [
        `How [Company] Achieved [Result] with ${pillar}`,
        `${pillar} ROI Calculator`,
        `Implementation Guide: ${pillar}`,
      ],
      retention: [
        `Advanced ${pillar} Techniques`,
        `${pillar} Tips for Power Users`,
        `What's New in ${pillar}`,
      ],
    };

    const options = templates[stage];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateKeywords(pillar: string, context: BusinessContext): string[] {
    const baseKeywords = pillar.toLowerCase().split(' ');
    const industryKeywords = context.industry.toLowerCase().split(' ');
    
    return [
      ...baseKeywords,
      ...industryKeywords,
      context.targetMarket,
      'best practices',
      'guide',
    ].slice(0, 6);
  }

  private estimateEffort(type: ContentType): string {
    const effortMap: Record<ContentType, string> = {
      'blog-post': '4-8 hours',
      'case-study': '8-16 hours',
      'whitepaper': '20-40 hours',
      'webinar': '16-24 hours',
      'podcast': '4-8 hours',
      'video': '8-20 hours',
      'infographic': '4-8 hours',
      'newsletter': '2-4 hours',
      'social-post': '1-2 hours',
      'landing-page': '4-8 hours',
    };
    return effortMap[type];
  }

  private createDistributionPlan(context: BusinessContext): DistributionChannel[] {
    const channels: DistributionChannel[] = [];

    // Organic social
    channels.push({
      channel: 'social-organic',
      strategy: context.targetMarket === 'b2b' 
        ? 'LinkedIn-first with cross-posting to Twitter/X'
        : 'Multi-platform with Instagram/TikTok priority',
      frequency: '3-5 posts per week',
      metrics: ['Engagement rate', 'Clicks', 'Followers'],
    });

    // Email
    channels.push({
      channel: 'email',
      strategy: 'Weekly newsletter + triggered sequences based on content engagement',
      frequency: 'Weekly newsletter, triggered emails ongoing',
      metrics: ['Open rate', 'Click rate', 'Conversions'],
    });

    // SEO
    channels.push({
      channel: 'organic-search',
      strategy: 'Optimize all content for target keywords, build internal links',
      frequency: 'Ongoing optimization',
      metrics: ['Rankings', 'Organic traffic', 'Time on page'],
    });

    // Community if applicable
    if (context.industry.toLowerCase().includes('developer') || 
        context.industry.toLowerCase().includes('tech')) {
      channels.push({
        channel: 'community',
        strategy: 'Share in relevant communities (Reddit, Discord, Slack groups)',
        frequency: '2-3 shares per week',
        metrics: ['Referral traffic', 'Engagement', 'Sign-ups'],
      });
    }

    // Paid amplification
    if (context.budget > 5000) {
      channels.push({
        channel: 'social-paid',
        strategy: 'Boost top-performing organic content to expand reach',
        frequency: 'Weekly based on organic performance',
        metrics: ['Cost per engagement', 'Reach', 'Conversions'],
      });
    }

    return channels;
  }

  private designLeadMagnets(context: BusinessContext, pillars: string[]): LeadMagnet[] {
    const magnets: LeadMagnet[] = [];
    const personas = this.inferPersonas(context);

    // Template-based lead magnet
    magnets.push({
      name: `${context.industry} Toolkit`,
      type: 'whitepaper',
      topic: pillars[0],
      targetPersona: personas[0],
      valueProposition: `Get our proven templates and frameworks for ${pillars[0].toLowerCase()}`,
      conversionGoal: 0.15,
    });

    // Calculator/Assessment
    magnets.push({
      name: 'ROI Calculator',
      type: 'landing-page',
      topic: 'Business Value',
      targetPersona: personas[0],
      valueProposition: 'Calculate your potential savings and ROI in 2 minutes',
      conversionGoal: 0.25,
    });

    // Educational content
    magnets.push({
      name: `The Ultimate Guide to ${pillars[1]}`,
      type: 'whitepaper',
      topic: pillars[1],
      targetPersona: personas[1] || personas[0],
      valueProposition: 'Comprehensive guide with actionable strategies',
      conversionGoal: 0.12,
    });

    // Webinar/training
    magnets.push({
      name: `${context.industry} Masterclass`,
      type: 'webinar',
      topic: pillars[0],
      targetPersona: personas[0],
      valueProposition: 'Live training with Q&A from industry experts',
      conversionGoal: 0.30,
    });

    return magnets;
  }

  private mapConversionPath(context: BusinessContext): ConversionStep[] {
    const isHighTouch = context.averageDealSize > 10000;

    if (isHighTouch) {
      return [
        {
          stage: 'awareness',
          action: 'Consume educational content',
          content: 'Blog posts, social content, videos',
          cta: 'Download guide',
          expectedConversion: 0.03,
        },
        {
          stage: 'consideration',
          action: 'Download lead magnet',
          content: 'Whitepaper, webinar, toolkit',
          cta: 'Request demo',
          expectedConversion: 0.15,
        },
        {
          stage: 'decision',
          action: 'Attend demo',
          content: 'Product demo, case studies',
          cta: 'Start trial / Get proposal',
          expectedConversion: 0.25,
        },
      ];
    }

    return [
      {
        stage: 'awareness',
        action: 'Discover product',
        content: 'Blog, social, ads',
        cta: 'Learn more',
        expectedConversion: 0.05,
      },
      {
        stage: 'consideration',
        action: 'Explore features',
        content: 'Feature pages, comparisons',
        cta: 'Start free trial',
        expectedConversion: 0.20,
      },
      {
        stage: 'decision',
        action: 'Use free trial',
        content: 'Onboarding, in-app',
        cta: 'Upgrade to paid',
        expectedConversion: 0.15,
      },
    ];
  }

  calculateContentROI(strategy: ContentStrategy, context: BusinessContext): {
    estimatedLeads: number;
    estimatedCac: number;
    contentInvestment: number;
    projectedRevenue: number;
    roi: number;
  } {
    const piecesPerMonth = strategy.contentCalendar.length / 3; // Spread over quarter
    const hoursPerPiece = 8; // Average
    const hourlyRate = 75;
    const contentInvestment = piecesPerMonth * hoursPerPiece * hourlyRate;

    const avgConversion = strategy.conversionPath.reduce((acc, step) => acc * step.expectedConversion, 1) * 1000;
    const estimatedLeads = piecesPerMonth * 500 * avgConversion; // 500 views per piece average
    const estimatedCac = estimatedLeads > 0 ? contentInvestment / estimatedLeads : 0;

    const projectedRevenue = estimatedLeads * context.averageDealSize * 0.25; // 25% close rate

    return {
      estimatedLeads: Math.round(estimatedLeads),
      estimatedCac: Math.round(estimatedCac),
      contentInvestment: Math.round(contentInvestment),
      projectedRevenue: Math.round(projectedRevenue),
      roi: contentInvestment > 0 ? Math.round((projectedRevenue - contentInvestment) / contentInvestment * 100) : 0,
    };
  }
}

export const contentToLeadEngine = new ContentToLeadEngine();
