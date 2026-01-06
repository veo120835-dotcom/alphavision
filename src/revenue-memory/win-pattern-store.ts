/**
 * Win Pattern Store
 * Captures and learns from successful revenue patterns
 */

export interface WinPattern {
  id: string;
  timestamp: Date;
  pattern: PatternDefinition;
  context: WinContext;
  performance: PatternPerformance;
  applicability: Applicability;
  insights: PatternInsight[];
}

export interface PatternDefinition {
  name: string;
  description: string;
  category: PatternCategory;
  triggers: string[];
  sequence: PatternStep[];
  criticalElements: string[];
  antiPatterns: string[];
}

export type PatternCategory =
  | 'closing'
  | 'objection_handling'
  | 'reactivation'
  | 'upsell'
  | 'referral'
  | 'trust_building'
  | 'urgency_creation'
  | 'value_demonstration'
  | 'pricing'
  | 'negotiation';

export interface PatternStep {
  order: number;
  action: string;
  timing: string;
  channel: string;
  keyElements: string[];
  variations: string[];
}

export interface WinContext {
  industry: string;
  dealSize: DealSizeRange;
  buyerPersona: string;
  salesCycle: string;
  competitiveSituation: string;
  initialObjections: string[];
  winningFactors: string[];
}

export type DealSizeRange = 'small' | 'medium' | 'large' | 'enterprise';

export interface PatternPerformance {
  usageCount: number;
  successCount: number;
  successRate: number;
  avgDealValue: number;
  avgCycleReduction: number;
  lastUsed: Date;
  trend: 'improving' | 'stable' | 'declining';
}

export interface Applicability {
  industries: string[];
  dealSizes: DealSizeRange[];
  personas: string[];
  objectionTypes: string[];
  confidenceScore: number;
  exclusions: string[];
}

export interface PatternInsight {
  type: InsightType;
  insight: string;
  confidence: number;
  actionable: boolean;
  recommendation?: string;
}

export type InsightType =
  | 'timing'
  | 'channel'
  | 'messaging'
  | 'sequence'
  | 'persona'
  | 'objection'
  | 'pricing';

export interface WinRecord {
  dealId: string;
  timestamp: Date;
  industry: string;
  dealValue: number;
  cycleLength: number;
  buyerPersona: string;
  competitorsInvolved: string[];
  initialObjections: string[];
  winningActions: WinningAction[];
  lostAlternatives: string[];
  customerFeedback?: string;
}

export interface WinningAction {
  action: string;
  timing: string;
  channel: string;
  impact: 'critical' | 'important' | 'helpful' | 'minor';
  description: string;
}

export interface PatternQuery {
  category?: PatternCategory;
  industry?: string;
  dealSize?: DealSizeRange;
  objectionType?: string;
  minSuccessRate?: number;
  limit?: number;
}

class WinPatternStore {
  private patterns: Map<string, WinPattern> = new Map();
  private winRecords: WinRecord[] = [];

  generateId(): string {
    return `win_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async recordWin(record: WinRecord): Promise<void> {
    this.winRecords.push(record);
    await this.extractPatterns(record);
  }

  private async extractPatterns(record: WinRecord): Promise<void> {
    const criticalActions = record.winningActions.filter((a) => a.impact === 'critical');

    if (criticalActions.length === 0) return;

    // Group actions into potential patterns
    const actionSequence = criticalActions.map((a) => ({
      order: record.winningActions.indexOf(a),
      action: a.action,
      timing: a.timing,
      channel: a.channel,
      keyElements: [a.description],
      variations: [],
    }));

    // Check if this matches existing pattern
    const matchingPattern = this.findMatchingPattern(actionSequence);

    if (matchingPattern) {
      // Update existing pattern
      await this.updatePattern(matchingPattern.id, record);
    } else {
      // Create new pattern
      await this.createPattern(record, actionSequence);
    }
  }

  private findMatchingPattern(sequence: PatternStep[]): WinPattern | undefined {
    const sequenceSignature = sequence.map((s) => s.action).join('|');

    for (const pattern of this.patterns.values()) {
      const patternSignature = pattern.pattern.sequence.map((s) => s.action).join('|');
      if (this.calculateSimilarity(sequenceSignature, patternSignature) > 0.7) {
        return pattern;
      }
    }

    return undefined;
  }

  private calculateSimilarity(a: string, b: string): number {
    const aSet = new Set(a.split('|'));
    const bSet = new Set(b.split('|'));
    const intersection = [...aSet].filter((x) => bSet.has(x)).length;
    const union = new Set([...aSet, ...bSet]).size;
    return intersection / union;
  }

  private async updatePattern(patternId: string, record: WinRecord): Promise<void> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    // Update performance
    pattern.performance.usageCount++;
    pattern.performance.successCount++;
    pattern.performance.successRate = pattern.performance.successCount / pattern.performance.usageCount;
    pattern.performance.avgDealValue = (
      (pattern.performance.avgDealValue * (pattern.performance.usageCount - 1) + record.dealValue) /
      pattern.performance.usageCount
    );
    pattern.performance.lastUsed = new Date();

    // Update applicability
    if (!pattern.applicability.industries.includes(record.industry)) {
      pattern.applicability.industries.push(record.industry);
    }

    // Recalculate trend
    pattern.performance.trend = this.calculateTrend(pattern);

    // Generate new insights
    pattern.insights = this.generateInsights(pattern, record);
  }

  private async createPattern(record: WinRecord, sequence: PatternStep[]): Promise<WinPattern> {
    const category = this.categorizePattern(record);

    const pattern: WinPattern = {
      id: this.generateId(),
      timestamp: new Date(),
      pattern: {
        name: `${category} Pattern ${this.patterns.size + 1}`,
        description: `Extracted from ${record.industry} deal`,
        category,
        triggers: record.initialObjections,
        sequence,
        criticalElements: record.winningActions
          .filter((a) => a.impact === 'critical')
          .map((a) => a.action),
        antiPatterns: record.lostAlternatives,
      },
      context: {
        industry: record.industry,
        dealSize: this.categorizeDealSize(record.dealValue),
        buyerPersona: record.buyerPersona,
        salesCycle: `${record.cycleLength} days`,
        competitiveSituation: record.competitorsInvolved.length > 0 ? 'competitive' : 'solo',
        initialObjections: record.initialObjections,
        winningFactors: record.winningActions.map((a) => a.action),
      },
      performance: {
        usageCount: 1,
        successCount: 1,
        successRate: 1,
        avgDealValue: record.dealValue,
        avgCycleReduction: 0,
        lastUsed: new Date(),
        trend: 'stable',
      },
      applicability: {
        industries: [record.industry],
        dealSizes: [this.categorizeDealSize(record.dealValue)],
        personas: [record.buyerPersona],
        objectionTypes: record.initialObjections,
        confidenceScore: 0.5,
        exclusions: [],
      },
      insights: [],
    };

    this.patterns.set(pattern.id, pattern);
    return pattern;
  }

  private categorizePattern(record: WinRecord): PatternCategory {
    const objections = record.initialObjections.join(' ').toLowerCase();

    if (objections.includes('price') || objections.includes('cost')) return 'pricing';
    if (objections.includes('competitor') || objections.includes('alternative')) return 'negotiation';
    if (objections.includes('trust') || objections.includes('risk')) return 'trust_building';
    if (objections.includes('time') || objections.includes('busy')) return 'urgency_creation';

    return 'closing';
  }

  private categorizeDealSize(value: number): DealSizeRange {
    if (value < 5000) return 'small';
    if (value < 25000) return 'medium';
    if (value < 100000) return 'large';
    return 'enterprise';
  }

  private calculateTrend(pattern: WinPattern): 'improving' | 'stable' | 'declining' {
    // Simplified - would analyze recent vs historical performance
    if (pattern.performance.successRate > 0.8) return 'improving';
    if (pattern.performance.successRate < 0.5) return 'declining';
    return 'stable';
  }

  private generateInsights(pattern: WinPattern, record: WinRecord): PatternInsight[] {
    const insights: PatternInsight[] = [];

    // Timing insight
    if (pattern.performance.usageCount > 5) {
      insights.push({
        type: 'timing',
        insight: `Pattern most effective when initiated within first week of engagement`,
        confidence: pattern.performance.successRate,
        actionable: true,
        recommendation: 'Deploy early in sales cycle',
      });
    }

    // Channel insight
    const channels = pattern.pattern.sequence.map((s) => s.channel);
    const uniqueChannels = [...new Set(channels)];
    if (uniqueChannels.length > 1) {
      insights.push({
        type: 'channel',
        insight: `Multi-channel approach (${uniqueChannels.join(', ')}) shows higher success`,
        confidence: 0.7,
        actionable: true,
        recommendation: 'Use diverse channels in sequence',
      });
    }

    // Messaging insight
    if (pattern.performance.successRate > 0.75) {
      insights.push({
        type: 'messaging',
        insight: 'Critical messaging elements consistently drive conversion',
        confidence: pattern.performance.successRate,
        actionable: true,
        recommendation: `Focus on: ${pattern.pattern.criticalElements.slice(0, 3).join(', ')}`,
      });
    }

    return insights;
  }

  async query(query: PatternQuery): Promise<WinPattern[]> {
    let results = Array.from(this.patterns.values());

    if (query.category) {
      results = results.filter((p) => p.pattern.category === query.category);
    }

    if (query.industry) {
      results = results.filter((p) => p.applicability.industries.includes(query.industry));
    }

    if (query.dealSize) {
      results = results.filter((p) => p.applicability.dealSizes.includes(query.dealSize!));
    }

    if (query.objectionType) {
      results = results.filter((p) =>
        p.applicability.objectionTypes.some((o) =>
          o.toLowerCase().includes(query.objectionType!.toLowerCase())
        )
      );
    }

    if (query.minSuccessRate !== undefined) {
      results = results.filter((p) => p.performance.successRate >= query.minSuccessRate!);
    }

    results.sort((a, b) => b.performance.successRate - a.performance.successRate);

    return query.limit ? results.slice(0, query.limit) : results;
  }

  async getRecommendedPatterns(context: {
    industry: string;
    dealSize: DealSizeRange;
    objections: string[];
  }): Promise<WinPattern[]> {
    const patterns = await this.query({
      industry: context.industry,
      dealSize: context.dealSize,
      minSuccessRate: 0.5,
    });

    // Score by relevance
    const scored = patterns.map((p) => {
      let score = p.performance.successRate;

      // Boost for matching objections
      const matchingObjections = context.objections.filter((o) =>
        p.applicability.objectionTypes.some((ao) =>
          ao.toLowerCase().includes(o.toLowerCase())
        )
      );
      score += matchingObjections.length * 0.1;

      // Boost for recent success
      const daysSinceUse = (Date.now() - p.performance.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUse < 30) score += 0.1;

      return { pattern: p, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.pattern);
  }

  getPattern(patternId: string): WinPattern | undefined {
    return this.patterns.get(patternId);
  }

  getStats(): {
    totalPatterns: number;
    totalWins: number;
    avgSuccessRate: number;
    topCategories: Array<{ category: PatternCategory; count: number }>;
  } {
    const patterns = Array.from(this.patterns.values());
    const categoryCounts: Record<string, number> = {};

    patterns.forEach((p) => {
      categoryCounts[p.pattern.category] = (categoryCounts[p.pattern.category] || 0) + 1;
    });

    return {
      totalPatterns: patterns.length,
      totalWins: this.winRecords.length,
      avgSuccessRate: patterns.length > 0
        ? patterns.reduce((sum, p) => sum + p.performance.successRate, 0) / patterns.length
        : 0,
      topCategories: Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category: category as PatternCategory, count })),
    };
  }

  export(): { patterns: WinPattern[]; records: WinRecord[] } {
    return {
      patterns: Array.from(this.patterns.values()),
      records: this.winRecords,
    };
  }

  import(data: { patterns: WinPattern[]; records: WinRecord[] }): void {
    data.patterns.forEach((p) => this.patterns.set(p.id, p));
    this.winRecords.push(...data.records);
  }
}

export const winPatternStore = new WinPatternStore();
export { WinPatternStore };
