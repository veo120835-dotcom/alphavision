import type { BusinessContext, LeadSource, LeadSourceOptimization, Channel } from './types';

export class LeadSourceOptimizer {
  analyzeSources(sources: LeadSource[], context: BusinessContext): LeadSourceOptimization[] {
    return sources
      .map(source => this.analyzeSource(source, context))
      .sort((a, b) => (b.potential - b.currentPerformance) - (a.potential - a.currentPerformance));
  }

  private analyzeSource(source: LeadSource, context: BusinessContext): LeadSourceOptimization {
    const currentPerformance = this.calculatePerformance(source, context);
    const potential = this.estimatePotential(source, context);
    const recommendations = this.generateRecommendations(source, currentPerformance, potential);
    const priorityActions = this.identifyPriorityActions(source, recommendations);
    const expectedImprovement = this.calculateExpectedImprovement(source, recommendations);

    return {
      source,
      currentPerformance,
      potential,
      recommendations,
      priorityActions,
      expectedImprovement,
    };
  }

  private calculatePerformance(source: LeadSource, context: BusinessContext): number {
    let score = 50;

    // Quality-adjusted volume
    const effectiveLeads = source.volume * source.quality;
    const targetLeads = context.budget / source.cac;
    
    if (effectiveLeads >= targetLeads) score += 20;
    else if (effectiveLeads >= targetLeads * 0.7) score += 10;
    else score -= 10;

    // CAC efficiency
    const targetCac = context.averageDealSize * 0.15; // 15% of ACV target
    if (source.cac <= targetCac) score += 20;
    else if (source.cac <= targetCac * 1.5) score += 10;
    else score -= 15;

    // Conversion rate
    if (source.conversionRate >= 0.10) score += 15;
    else if (source.conversionRate >= 0.05) score += 10;
    else if (source.conversionRate < 0.02) score -= 10;

    // Trend
    if (source.trending === 'up') score += 10;
    else if (source.trending === 'down') score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private estimatePotential(source: LeadSource, context: BusinessContext): number {
    const channelPotential = this.getChannelPotential(source.channel, context);
    const qualityPotential = source.quality >= 0.7 ? 90 : source.quality >= 0.5 ? 75 : 60;
    const volumeHeadroom = this.assessVolumeHeadroom(source, context);

    return Math.round((channelPotential * 0.4) + (qualityPotential * 0.3) + (volumeHeadroom * 0.3));
  }

  private getChannelPotential(channel: Channel, context: BusinessContext): number {
    const potentialMap: Record<string, Record<Channel, number>> = {
      'b2b': {
        'organic-search': 85,
        'paid-search': 80,
        'content-marketing': 90,
        'outbound-sales': 85,
        'email': 75,
        'referral': 80,
        'partnerships': 85,
        'social-organic': 60,
        'social-paid': 65,
        'events': 75,
        'community': 70,
        'product-led': 75,
        'influencer': 50,
        'pr': 65,
      },
      'b2c': {
        'organic-search': 80,
        'paid-search': 85,
        'social-organic': 80,
        'social-paid': 90,
        'content-marketing': 75,
        'email': 80,
        'referral': 90,
        'influencer': 85,
        'product-led': 90,
        'community': 75,
        'partnerships': 65,
        'events': 60,
        'outbound-sales': 40,
        'pr': 70,
      },
    };

    const marketType = context.targetMarket === 'b2b2c' ? 'b2b' : context.targetMarket;
    return potentialMap[marketType]?.[channel] || 60;
  }

  private assessVolumeHeadroom(source: LeadSource, context: BusinessContext): number {
    // Estimate how much more volume is available from this source
    const currentSpend = source.cac * source.volume;
    const budgetHeadroom = context.budget - currentSpend;
    
    if (budgetHeadroom > currentSpend * 2) return 90;
    if (budgetHeadroom > currentSpend) return 75;
    if (budgetHeadroom > 0) return 60;
    return 40;
  }

  private generateRecommendations(
    source: LeadSource,
    performance: number,
    potential: number
  ): string[] {
    const recommendations: string[] = [];
    const gap = potential - performance;

    // Quality improvements
    if (source.quality < 0.6) {
      recommendations.push('Improve lead qualification criteria to increase quality');
      recommendations.push('Add lead scoring to prioritize high-quality leads');
    }

    // Conversion improvements
    if (source.conversionRate < 0.05) {
      recommendations.push('Review and optimize conversion funnel for this source');
      recommendations.push('Implement source-specific landing pages and messaging');
    }

    // CAC improvements
    if (source.cac > source.quality * 500) {
      recommendations.push('Test new creatives/messaging to improve CAC');
      recommendations.push('Implement stricter targeting to reduce wasted spend');
    }

    // Volume scaling
    if (gap > 20 && source.trending !== 'down') {
      recommendations.push('Increase investment to capture available demand');
      recommendations.push('Test new sub-channels or audiences within this source');
    }

    // Declining sources
    if (source.trending === 'down') {
      recommendations.push('Diagnose cause of decline (market saturation, competition, seasonal)');
      recommendations.push('Consider reallocating budget to growing sources');
    }

    // High performers
    if (performance > 80) {
      recommendations.push('Document what\'s working to replicate in other channels');
      recommendations.push('Invest in automation to scale without proportional effort');
    }

    return recommendations.slice(0, 5);
  }

  private identifyPriorityActions(source: LeadSource, recommendations: string[]): string[] {
    const priority: string[] = [];

    if (source.trending === 'down') {
      priority.push('URGENT: Diagnose and address declining performance');
    }

    if (source.conversionRate < 0.03) {
      priority.push('Fix conversion bottleneck before scaling spend');
    }

    if (source.quality >= 0.7 && source.volume < 50) {
      priority.push('High quality source - prioritize volume scaling');
    }

    if (recommendations.length > 0 && priority.length < 2) {
      priority.push(recommendations[0]);
    }

    return priority.slice(0, 3);
  }

  private calculateExpectedImprovement(source: LeadSource, recommendations: string[]): number {
    // Estimate potential improvement from implementing recommendations
    let improvement = 0;

    if (recommendations.some(r => r.includes('qualification'))) improvement += 15;
    if (recommendations.some(r => r.includes('conversion'))) improvement += 20;
    if (recommendations.some(r => r.includes('CAC'))) improvement += 15;
    if (recommendations.some(r => r.includes('scale'))) improvement += 25;

    // Adjustment based on current performance
    if (source.trending === 'up') improvement *= 1.2;
    if (source.trending === 'down') improvement *= 0.8;

    return Math.round(improvement);
  }

  getQuickWins(sources: LeadSource[], context: BusinessContext): LeadSourceOptimization[] {
    const optimizations = this.analyzeSources(sources, context);
    
    return optimizations
      .filter(o => 
        o.expectedImprovement > 15 && 
        o.priorityActions.length > 0 &&
        !o.priorityActions.some(a => a.includes('URGENT'))
      )
      .slice(0, 3);
  }

  getUrgentIssues(sources: LeadSource[], context: BusinessContext): LeadSourceOptimization[] {
    const optimizations = this.analyzeSources(sources, context);
    
    return optimizations.filter(o => 
      o.source.trending === 'down' || 
      o.currentPerformance < 40 ||
      o.priorityActions.some(a => a.includes('URGENT'))
    );
  }

  calculatePortfolioHealth(sources: LeadSource[], context: BusinessContext): {
    score: number;
    diversification: number;
    topSourceDependency: number;
    recommendations: string[];
  } {
    const totalVolume = sources.reduce((sum, s) => sum + s.volume, 0);
    const topSource = sources.reduce((max, s) => s.volume > max.volume ? s : max, sources[0]);
    const topSourceDependency = totalVolume > 0 ? topSource.volume / totalVolume : 0;
    const uniqueChannels = new Set(sources.map(s => s.channel)).size;
    const diversification = Math.min(100, uniqueChannels * 15);

    const recommendations: string[] = [];
    
    if (topSourceDependency > 0.5) {
      recommendations.push(`Reduce dependency on ${topSource.name} (${Math.round(topSourceDependency * 100)}% of leads)`);
    }
    
    if (uniqueChannels < 3) {
      recommendations.push('Add more lead source channels for diversification');
    }

    const avgQuality = sources.reduce((sum, s) => sum + s.quality, 0) / sources.length;
    if (avgQuality < 0.6) {
      recommendations.push('Focus on improving overall lead quality across sources');
    }

    const score = Math.round(
      (diversification * 0.3) + 
      ((1 - topSourceDependency) * 100 * 0.3) + 
      (avgQuality * 100 * 0.4)
    );

    return {
      score,
      diversification,
      topSourceDependency,
      recommendations,
    };
  }
}

export const leadSourceOptimizer = new LeadSourceOptimizer();
