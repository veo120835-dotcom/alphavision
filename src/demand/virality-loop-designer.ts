import type { BusinessContext, ViralityLoop } from './types';

type ViralityType = 'inherent' | 'artificial' | 'collaborative';

interface ViralMechanic {
  name: string;
  type: ViralityType;
  description: string;
  applicability: string[];
  viralCoefficient: number;
  implementationEffort: 'low' | 'medium' | 'high';
  examples: string[];
}

const VIRAL_MECHANICS: ViralMechanic[] = [
  {
    name: 'Invite-Required Features',
    type: 'inherent',
    description: 'Core features that require inviting others to use',
    applicability: ['collaboration', 'communication', 'productivity'],
    viralCoefficient: 0.8,
    implementationEffort: 'high',
    examples: ['Slack workspaces', 'Notion team spaces', 'Figma collaboration'],
  },
  {
    name: 'Content Sharing',
    type: 'inherent',
    description: 'Users share outputs to external platforms with product branding',
    applicability: ['content-creation', 'design', 'analytics', 'social'],
    viralCoefficient: 0.4,
    implementationEffort: 'low',
    examples: ['Canva designs', 'Spotify Wrapped', 'Typeform responses'],
  },
  {
    name: 'Network Effects',
    type: 'inherent',
    description: 'Product becomes more valuable as more people use it',
    applicability: ['marketplace', 'social', 'communication', 'platform'],
    viralCoefficient: 1.2,
    implementationEffort: 'high',
    examples: ['LinkedIn', 'Uber', 'Airbnb', 'Facebook'],
  },
  {
    name: 'Referral Incentives',
    type: 'artificial',
    description: 'Rewards for bringing new users',
    applicability: ['b2c', 'b2b', 'saas', 'ecommerce'],
    viralCoefficient: 0.3,
    implementationEffort: 'medium',
    examples: ['Dropbox extra storage', 'Uber credits', 'Morning Brew points'],
  },
  {
    name: 'Social Proof Badges',
    type: 'artificial',
    description: 'Shareable achievements that drive curiosity',
    applicability: ['education', 'fitness', 'gaming', 'learning'],
    viralCoefficient: 0.2,
    implementationEffort: 'low',
    examples: ['Duolingo streaks', 'LinkedIn certifications', 'Peloton achievements'],
  },
  {
    name: 'Collaborative Workspaces',
    type: 'collaborative',
    description: 'Multiple users work together in shared environments',
    applicability: ['productivity', 'design', 'development', 'project-management'],
    viralCoefficient: 0.6,
    implementationEffort: 'high',
    examples: ['Google Docs', 'Miro boards', 'GitHub repos'],
  },
  {
    name: 'User-Generated Content Platforms',
    type: 'collaborative',
    description: 'Users create content that attracts other users',
    applicability: ['community', 'marketplace', 'education', 'entertainment'],
    viralCoefficient: 0.7,
    implementationEffort: 'high',
    examples: ['YouTube', 'Substack', 'Product Hunt'],
  },
  {
    name: 'Embeddable Widgets',
    type: 'inherent',
    description: 'Product can be embedded on external sites',
    applicability: ['analytics', 'forms', 'scheduling', 'chat'],
    viralCoefficient: 0.5,
    implementationEffort: 'medium',
    examples: ['Calendly embed', 'Intercom chat', 'Typeform embed'],
  },
  {
    name: 'Public Profiles/Pages',
    type: 'inherent',
    description: 'Users have public pages that drive organic traffic',
    applicability: ['portfolio', 'social', 'professional', 'creator'],
    viralCoefficient: 0.4,
    implementationEffort: 'medium',
    examples: ['LinkedIn profiles', 'Linktree pages', 'Dribbble portfolios'],
  },
  {
    name: 'Waitlist/Invite-Only Access',
    type: 'artificial',
    description: 'Exclusivity creates FOMO and sharing',
    applicability: ['launch', 'beta', 'premium'],
    viralCoefficient: 0.6,
    implementationEffort: 'low',
    examples: ['Clubhouse launch', 'Superhuman waitlist', 'Gmail invites'],
  },
];

export class ViralityLoopDesigner {
  designLoop(context: BusinessContext): ViralityLoop[] {
    const applicableMechanics = this.findApplicableMechanics(context);
    const designedLoops = applicableMechanics.map(mechanic => this.designLoopFromMechanic(mechanic, context));
    
    return designedLoops
      .sort((a, b) => b.viralCoefficient - a.viralCoefficient)
      .slice(0, 3);
  }

  private findApplicableMechanics(context: BusinessContext): ViralMechanic[] {
    const industryLower = context.industry.toLowerCase();
    const tags = this.extractContextTags(context);

    return VIRAL_MECHANICS.filter(mechanic => {
      // Check if any applicability matches industry or context tags
      return mechanic.applicability.some(app => 
        industryLower.includes(app) || 
        tags.includes(app) ||
        this.isRelatedCategory(app, industryLower)
      );
    });
  }

  private extractContextTags(context: BusinessContext): string[] {
    const tags: string[] = [context.targetMarket];
    
    const industryLower = context.industry.toLowerCase();
    
    if (industryLower.includes('saas')) tags.push('saas', 'b2b');
    if (industryLower.includes('social')) tags.push('social', 'community');
    if (industryLower.includes('productivity')) tags.push('productivity', 'collaboration');
    if (industryLower.includes('design')) tags.push('design', 'content-creation');
    if (industryLower.includes('education')) tags.push('education', 'learning');
    if (industryLower.includes('fitness') || industryLower.includes('health')) tags.push('fitness', 'health');
    if (industryLower.includes('ecommerce') || industryLower.includes('commerce')) tags.push('ecommerce', 'marketplace');
    if (industryLower.includes('developer') || industryLower.includes('dev')) tags.push('development', 'developer');
    
    // Stage-based tags
    if (context.stage === 'early' || context.stage === 'seed') tags.push('launch', 'beta');
    
    return tags;
  }

  private isRelatedCategory(applicability: string, industry: string): boolean {
    const relations: Record<string, string[]> = {
      'collaboration': ['team', 'enterprise', 'productivity', 'project'],
      'communication': ['chat', 'messaging', 'team', 'enterprise'],
      'content-creation': ['design', 'media', 'creative', 'marketing'],
      'analytics': ['data', 'intelligence', 'metrics', 'reporting'],
      'b2c': ['consumer', 'retail', 'direct'],
      'b2b': ['enterprise', 'business', 'saas'],
    };

    for (const [key, related] of Object.entries(relations)) {
      if (applicability === key && related.some(r => industry.includes(r))) {
        return true;
      }
    }

    return false;
  }

  private designLoopFromMechanic(mechanic: ViralMechanic, context: BusinessContext): ViralityLoop {
    const adjustedCoefficient = this.adjustViralCoefficient(mechanic, context);
    const amplifiers = this.identifyAmplifiers(mechanic, context);
    const constraints = this.identifyConstraints(mechanic, context);
    const cycletime = this.estimateCycleTime(mechanic, context);

    return {
      type: mechanic.type,
      mechanism: mechanic.name,
      viralCoefficient: adjustedCoefficient,
      cycletime,
      amplifiers,
      constraints,
    };
  }

  private adjustViralCoefficient(mechanic: ViralMechanic, context: BusinessContext): number {
    let coefficient = mechanic.viralCoefficient;

    // B2B typically has lower viral coefficients
    if (context.targetMarket === 'b2b') {
      coefficient *= 0.7;
    }

    // High deal size reduces virality (fewer potential customers)
    if (context.averageDealSize > 50000) {
      coefficient *= 0.5;
    } else if (context.averageDealSize > 10000) {
      coefficient *= 0.7;
    }

    // Long sales cycle reduces virality
    if (context.salesCycle.includes('year') || context.salesCycle.includes('12')) {
      coefficient *= 0.6;
    }

    // Larger team can execute better
    if (context.teamSize >= 10) {
      coefficient *= 1.1;
    }

    return Math.round(coefficient * 100) / 100;
  }

  private identifyAmplifiers(mechanic: ViralMechanic, context: BusinessContext): string[] {
    const amplifiers: string[] = [];

    // Universal amplifiers
    amplifiers.push('Reduce friction in sharing flow');
    amplifiers.push('Add urgency/scarcity to invites');

    // Type-specific amplifiers
    if (mechanic.type === 'inherent') {
      amplifiers.push('Make shared content visually distinctive and branded');
      amplifiers.push('Ensure value is visible to non-users');
    }

    if (mechanic.type === 'artificial') {
      amplifiers.push('Test reward amounts for optimal participation');
      amplifiers.push('Add tier system for super-referrers');
    }

    if (mechanic.type === 'collaborative') {
      amplifiers.push('Enable guest access without signup');
      amplifiers.push('Prompt collaboration at key product moments');
    }

    // Context-specific amplifiers
    if (context.targetMarket === 'b2b') {
      amplifiers.push('Leverage professional network connections');
      amplifiers.push('Add team-based incentives');
    } else {
      amplifiers.push('Optimize for mobile sharing');
      amplifiers.push('Integrate with social platforms');
    }

    return amplifiers.slice(0, 5);
  }

  private identifyConstraints(mechanic: ViralMechanic, context: BusinessContext): string[] {
    const constraints: string[] = [];

    // Implementation constraints
    if (mechanic.implementationEffort === 'high') {
      constraints.push('Significant development effort required');
    }

    // Market constraints
    if (context.targetMarket === 'b2b') {
      constraints.push('B2B buying cycles limit viral speed');
      constraints.push('Enterprise security concerns may limit sharing');
    }

    if (context.averageDealSize > 10000) {
      constraints.push('Smaller addressable market limits viral reach');
    }

    // Mechanic-specific constraints
    if (mechanic.type === 'inherent') {
      constraints.push('Requires product to have inherently shareable elements');
    }

    if (mechanic.type === 'artificial') {
      constraints.push('Incentive costs impact unit economics');
      constraints.push('May attract lower-quality leads');
    }

    if (mechanic.type === 'collaborative') {
      constraints.push('Requires multi-user value proposition');
    }

    return constraints.slice(0, 4);
  }

  private estimateCycleTime(mechanic: ViralMechanic, context: BusinessContext): string {
    // Base cycle time by mechanic type
    let baseDays = 7;
    
    if (mechanic.type === 'inherent') baseDays = 3;
    if (mechanic.type === 'collaborative') baseDays = 14;
    if (mechanic.type === 'artificial') baseDays = 7;

    // Adjust for context
    if (context.targetMarket === 'b2b') baseDays *= 2;
    if (context.averageDealSize > 10000) baseDays *= 1.5;
    if (context.salesCycle.includes('month')) baseDays *= 1.5;

    if (baseDays <= 3) return '1-3 days';
    if (baseDays <= 7) return '3-7 days';
    if (baseDays <= 14) return '1-2 weeks';
    if (baseDays <= 30) return '2-4 weeks';
    return '1+ months';
  }

  calculateViralGrowth(loop: ViralityLoop, initialUsers: number, periods: number): {
    periods: { period: number; users: number; newViral: number }[];
    totalViralUsers: number;
    viralPercentage: number;
  } {
    const results: { period: number; users: number; newViral: number }[] = [];
    let currentUsers = initialUsers;
    let totalViralUsers = 0;

    for (let i = 0; i < periods; i++) {
      const newViral = Math.round(currentUsers * loop.viralCoefficient);
      totalViralUsers += newViral;
      currentUsers += newViral;
      
      results.push({
        period: i + 1,
        users: currentUsers,
        newViral,
      });
    }

    const viralPercentage = totalViralUsers / currentUsers;

    return {
      periods: results,
      totalViralUsers,
      viralPercentage,
    };
  }

  optimizeLoop(loop: ViralityLoop, currentMetrics: {
    inviteRate: number;
    acceptRate: number;
    activationRate: number;
  }): {
    currentCoefficient: number;
    improvements: { lever: string; impact: number; effort: 'low' | 'medium' | 'high' }[];
    projectedCoefficient: number;
  } {
    const currentCoefficient = currentMetrics.inviteRate * currentMetrics.acceptRate * currentMetrics.activationRate;
    const improvements: { lever: string; impact: number; effort: 'low' | 'medium' | 'high' }[] = [];

    // Analyze each lever
    if (currentMetrics.inviteRate < 0.3) {
      improvements.push({
        lever: 'Increase invite rate with prompts and incentives',
        impact: 0.15,
        effort: 'low',
      });
    }

    if (currentMetrics.acceptRate < 0.4) {
      improvements.push({
        lever: 'Improve invite messaging and landing experience',
        impact: 0.20,
        effort: 'medium',
      });
    }

    if (currentMetrics.activationRate < 0.5) {
      improvements.push({
        lever: 'Optimize onboarding for invited users',
        impact: 0.25,
        effort: 'medium',
      });
    }

    // Additional improvements
    improvements.push({
      lever: 'A/B test share copy and CTAs',
      impact: 0.10,
      effort: 'low',
    });

    improvements.push({
      lever: 'Add social proof to invite flows',
      impact: 0.08,
      effort: 'low',
    });

    const projectedImprovement = improvements
      .filter(i => i.effort !== 'high')
      .reduce((sum, i) => sum + i.impact, 0);

    return {
      currentCoefficient,
      improvements,
      projectedCoefficient: currentCoefficient * (1 + projectedImprovement),
    };
  }

  suggestMechanics(context: BusinessContext): {
    recommended: ViralMechanic[];
    notRecommended: { mechanic: ViralMechanic; reason: string }[];
  } {
    const applicable = this.findApplicableMechanics(context);
    const notApplicable = VIRAL_MECHANICS.filter(m => !applicable.includes(m));

    const notRecommended = notApplicable.map(mechanic => ({
      mechanic,
      reason: this.explainWhyNotApplicable(mechanic, context),
    }));

    return {
      recommended: applicable.sort((a, b) => b.viralCoefficient - a.viralCoefficient),
      notRecommended,
    };
  }

  private explainWhyNotApplicable(mechanic: ViralMechanic, context: BusinessContext): string {
    if (mechanic.type === 'inherent' && context.targetMarket === 'b2b' && context.averageDealSize > 50000) {
      return 'Enterprise B2B typically has limited viral potential due to long sales cycles and security requirements';
    }

    if (mechanic.name === 'Network Effects' && !context.industry.toLowerCase().includes('platform')) {
      return 'Network effects require platform/marketplace dynamics that may not fit your business model';
    }

    if (mechanic.implementationEffort === 'high' && context.teamSize < 10) {
      return 'High implementation effort may not be feasible with current team size';
    }

    return `${mechanic.applicability.join(', ')} use cases don't match your industry focus`;
  }
}

export const viralityLoopDesigner = new ViralityLoopDesigner();
