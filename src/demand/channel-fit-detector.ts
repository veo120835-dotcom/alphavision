import type { BusinessContext, Channel, ChannelFit } from './types';

interface ChannelProfile {
  channel: Channel;
  idealFor: string[];
  notIdealFor: string[];
  minBudget: number;
  timeToResults: string;
  resourceRequirement: 'low' | 'medium' | 'high';
  scalability: number;
  prerequisites: string[];
}

const CHANNEL_PROFILES: ChannelProfile[] = [
  {
    channel: 'content-marketing',
    idealFor: ['b2b', 'high-aov', 'long-sales-cycle', 'thought-leadership'],
    notIdealFor: ['immediate-results', 'low-budget', 'commodity-product'],
    minBudget: 5000,
    timeToResults: '6-12 months',
    resourceRequirement: 'high',
    scalability: 9,
    prerequisites: ['Writing capability', 'SEO knowledge', 'Content strategy'],
  },
  {
    channel: 'paid-search',
    idealFor: ['high-intent', 'established-category', 'quick-results', 'b2b', 'b2c'],
    notIdealFor: ['new-category', 'low-budget', 'low-margin'],
    minBudget: 10000,
    timeToResults: '1-3 months',
    resourceRequirement: 'medium',
    scalability: 7,
    prerequisites: ['Landing pages', 'Conversion tracking', 'Budget'],
  },
  {
    channel: 'organic-search',
    idealFor: ['b2b', 'b2c', 'long-term', 'content-rich', 'established-category'],
    notIdealFor: ['immediate-results', 'new-category'],
    minBudget: 3000,
    timeToResults: '6-18 months',
    resourceRequirement: 'high',
    scalability: 10,
    prerequisites: ['Technical SEO', 'Content capability', 'Patience'],
  },
  {
    channel: 'social-paid',
    idealFor: ['b2c', 'visual-product', 'brand-building', 'retargeting'],
    notIdealFor: ['b2b-enterprise', 'low-budget', 'non-visual'],
    minBudget: 5000,
    timeToResults: '1-3 months',
    resourceRequirement: 'medium',
    scalability: 8,
    prerequisites: ['Creative assets', 'Audience understanding', 'Tracking'],
  },
  {
    channel: 'social-organic',
    idealFor: ['b2c', 'community-building', 'brand-awareness', 'thought-leadership'],
    notIdealFor: ['immediate-sales', 'b2b-enterprise'],
    minBudget: 1000,
    timeToResults: '3-6 months',
    resourceRequirement: 'medium',
    scalability: 6,
    prerequisites: ['Content creation', 'Community management', 'Consistency'],
  },
  {
    channel: 'outbound-sales',
    idealFor: ['b2b', 'high-aov', 'enterprise', 'complex-sale'],
    notIdealFor: ['low-aov', 'b2c', 'self-serve'],
    minBudget: 15000,
    timeToResults: '2-4 months',
    resourceRequirement: 'high',
    scalability: 5,
    prerequisites: ['ICP definition', 'Sales team', 'CRM', 'Email tools'],
  },
  {
    channel: 'email',
    idealFor: ['nurturing', 'retention', 'existing-list', 'product-updates'],
    notIdealFor: ['acquisition-only', 'no-existing-audience'],
    minBudget: 500,
    timeToResults: '1-2 months',
    resourceRequirement: 'low',
    scalability: 8,
    prerequisites: ['Email list', 'Email tool', 'Content'],
  },
  {
    channel: 'referral',
    idealFor: ['strong-nps', 'network-effects', 'b2c', 'community'],
    notIdealFor: ['new-product', 'low-satisfaction', 'enterprise'],
    minBudget: 2000,
    timeToResults: '2-4 months',
    resourceRequirement: 'low',
    scalability: 9,
    prerequisites: ['Happy customers', 'Referral mechanism', 'Tracking'],
  },
  {
    channel: 'partnerships',
    idealFor: ['b2b', 'complementary-products', 'channel-sales'],
    notIdealFor: ['early-stage', 'no-product-fit'],
    minBudget: 5000,
    timeToResults: '3-6 months',
    resourceRequirement: 'medium',
    scalability: 7,
    prerequisites: ['Partner program', 'Integration capability', 'BD team'],
  },
  {
    channel: 'product-led',
    idealFor: ['freemium', 'self-serve', 'viral-mechanics', 'low-friction'],
    notIdealFor: ['enterprise', 'complex-product', 'high-touch'],
    minBudget: 3000,
    timeToResults: '3-6 months',
    resourceRequirement: 'medium',
    scalability: 10,
    prerequisites: ['Free tier', 'Self-serve onboarding', 'Viral hooks'],
  },
  {
    channel: 'community',
    idealFor: ['developer', 'enthusiast', 'thought-leadership', 'long-term'],
    notIdealFor: ['transactional', 'commodity', 'enterprise'],
    minBudget: 3000,
    timeToResults: '6-12 months',
    resourceRequirement: 'high',
    scalability: 7,
    prerequisites: ['Community platform', 'Community manager', 'Content'],
  },
  {
    channel: 'events',
    idealFor: ['b2b', 'enterprise', 'relationship-building', 'brand'],
    notIdealFor: ['low-budget', 'b2c-mass', 'remote-only'],
    minBudget: 10000,
    timeToResults: '3-6 months',
    resourceRequirement: 'high',
    scalability: 4,
    prerequisites: ['Event budget', 'Speaker capability', 'Follow-up process'],
  },
  {
    channel: 'influencer',
    idealFor: ['b2c', 'visual', 'lifestyle', 'trust-dependent'],
    notIdealFor: ['b2b-enterprise', 'commodity', 'low-margin'],
    minBudget: 5000,
    timeToResults: '1-3 months',
    resourceRequirement: 'medium',
    scalability: 6,
    prerequisites: ['Influencer relationships', 'Creative assets', 'Tracking'],
  },
  {
    channel: 'pr',
    idealFor: ['newsworthy', 'brand-building', 'credibility', 'launches'],
    notIdealFor: ['direct-response', 'niche', 'commodity'],
    minBudget: 5000,
    timeToResults: '2-6 months',
    resourceRequirement: 'medium',
    scalability: 5,
    prerequisites: ['Story angle', 'Media relationships', 'Press kit'],
  },
];

export class ChannelFitDetector {
  analyzeChannelFit(context: BusinessContext): ChannelFit[] {
    const fits = CHANNEL_PROFILES.map(profile => this.scoreChannel(profile, context));
    return fits.sort((a, b) => b.fitScore - a.fitScore);
  }

  private scoreChannel(profile: ChannelProfile, context: BusinessContext): ChannelFit {
    let score = 50;
    const reasoning: string[] = [];
    const risks: string[] = [];

    // Market type fit
    const marketTags = this.getMarketTags(context);
    const idealMatches = profile.idealFor.filter(tag => marketTags.includes(tag));
    const antiMatches = profile.notIdealFor.filter(tag => marketTags.includes(tag));

    score += idealMatches.length * 10;
    score -= antiMatches.length * 15;

    if (idealMatches.length > 0) {
      reasoning.push(`Good fit for: ${idealMatches.join(', ')}`);
    }
    if (antiMatches.length > 0) {
      risks.push(`Potential misfit: ${antiMatches.join(', ')}`);
    }

    // Budget fit
    if (context.budget >= profile.minBudget * 2) {
      score += 10;
      reasoning.push('Budget allows full investment');
    } else if (context.budget >= profile.minBudget) {
      score += 5;
      reasoning.push('Budget is sufficient');
    } else {
      score -= 20;
      risks.push(`Minimum budget of $${profile.minBudget}/mo recommended`);
    }

    // Team size fit
    const teamRequirement = this.getTeamRequirement(profile.resourceRequirement);
    if (context.teamSize >= teamRequirement) {
      score += 5;
    } else {
      score -= 10;
      risks.push('May require additional team capacity');
    }

    // Already using channel
    if (context.currentChannels.includes(profile.channel)) {
      score += 5;
      reasoning.push('Already have experience with this channel');
    }

    // Scalability bonus for growth stage
    if (context.stage === 'growth' || context.stage === 'scaling') {
      score += profile.scalability;
      reasoning.push(`High scalability (${profile.scalability}/10)`);
    }

    // Estimate CAC based on deal size and channel
    const estimatedCac = this.estimateCac(profile.channel, context);

    return {
      channel: profile.channel,
      fitScore: Math.max(0, Math.min(100, score)),
      reasoning,
      estimatedCac,
      timeToResults: profile.timeToResults,
      resourceRequirement: profile.resourceRequirement,
      prerequisites: profile.prerequisites,
      risks,
    };
  }

  private getMarketTags(context: BusinessContext): string[] {
    const tags: string[] = [context.targetMarket];

    // AOV tags
    if (context.averageDealSize >= 50000) tags.push('enterprise', 'high-aov');
    else if (context.averageDealSize >= 10000) tags.push('mid-market', 'high-aov');
    else if (context.averageDealSize >= 1000) tags.push('smb');
    else tags.push('low-aov');

    // Sales cycle tags
    if (context.salesCycle.includes('12') || context.salesCycle.includes('year')) {
      tags.push('long-sales-cycle', 'complex-sale');
    } else if (context.salesCycle.includes('6')) {
      tags.push('medium-sales-cycle');
    } else {
      tags.push('short-sales-cycle', 'quick-results');
    }

    // Industry tags
    const industryLower = context.industry.toLowerCase();
    if (industryLower.includes('saas')) tags.push('saas', 'subscription');
    if (industryLower.includes('developer') || industryLower.includes('api')) tags.push('developer');
    if (industryLower.includes('consumer')) tags.push('b2c');

    // Stage tags
    if (context.stage === 'early' || context.stage === 'seed') {
      tags.push('early-stage', 'resource-constrained');
    } else if (context.stage === 'growth') {
      tags.push('scaling', 'growth-mode');
    }

    return tags;
  }

  private getTeamRequirement(resourceRequirement: 'low' | 'medium' | 'high'): number {
    switch (resourceRequirement) {
      case 'low': return 1;
      case 'medium': return 3;
      case 'high': return 5;
    }
  }

  private estimateCac(channel: Channel, context: BusinessContext): number {
    // Rough CAC estimates by channel
    const baseCacs: Record<Channel, number> = {
      'organic-search': 50,
      'paid-search': 150,
      'social-organic': 30,
      'social-paid': 100,
      'content-marketing': 80,
      'email': 20,
      'referral': 40,
      'partnerships': 200,
      'events': 500,
      'outbound-sales': 300,
      'community': 60,
      'product-led': 25,
      'influencer': 120,
      'pr': 200,
    };

    let cac = baseCacs[channel] || 100;

    // Adjust for B2B enterprise
    if (context.targetMarket === 'b2b' && context.averageDealSize > 10000) {
      cac *= 3;
    }

    return Math.round(cac);
  }

  getTopChannels(context: BusinessContext, count: number = 5): ChannelFit[] {
    const allFits = this.analyzeChannelFit(context);
    return allFits.slice(0, count);
  }

  getChannelsByTimeToResults(context: BusinessContext): {
    quick: ChannelFit[];
    medium: ChannelFit[];
    long: ChannelFit[];
  } {
    const allFits = this.analyzeChannelFit(context);
    
    return {
      quick: allFits.filter(f => f.timeToResults.includes('1-') || f.timeToResults.includes('2-')),
      medium: allFits.filter(f => f.timeToResults.includes('3-') || f.timeToResults.includes('4-')),
      long: allFits.filter(f => f.timeToResults.includes('6') || f.timeToResults.includes('12') || f.timeToResults.includes('18')),
    };
  }
}

export const channelFitDetector = new ChannelFitDetector();
