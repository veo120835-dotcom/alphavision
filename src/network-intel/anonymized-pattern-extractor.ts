// Anonymized Pattern Extractor - Extract patterns from business data safely

import { AnonymizedPattern } from './types';

interface RawBusinessData {
  industry: string;
  stage: string;
  strategy_used: string;
  outcome: 'success' | 'failure' | 'partial';
  metrics: Record<string, number>;
  context: string[];
}

interface PatternExtractionResult {
  patterns_found: AnonymizedPattern[];
  confidence_metrics: {
    data_quality: number;
    sample_diversity: number;
    pattern_strength: number;
  };
  excluded_data_reasons: string[];
}

class AnonymizedPatternExtractorService {
  private patterns: AnonymizedPattern[] = [];
  private rawDataBuffer: RawBusinessData[] = [];
  private minimumSampleSize = 5;

  addDataPoint(data: RawBusinessData): void {
    const anonymized = this.anonymizeData(data);
    this.rawDataBuffer.push(anonymized);

    if (this.rawDataBuffer.length >= this.minimumSampleSize) {
      this.extractPatterns();
    }
  }

  private anonymizeData(data: RawBusinessData): RawBusinessData {
    return {
      ...data,
      context: data.context.map(c => this.generalizeContext(c)),
      metrics: this.normalizeMetrics(data.metrics),
    };
  }

  private generalizeContext(context: string): string {
    const generalizations: Record<string, string> = {
      'raised series a': 'early funding',
      'raised series b': 'growth funding',
      'raised seed': 'pre-seed/seed funding',
      'bootstrapped': 'self-funded',
    };

    const contextLower = context.toLowerCase();
    for (const [specific, general] of Object.entries(generalizations)) {
      if (contextLower.includes(specific)) {
        return general;
      }
    }
    return context;
  }

  private normalizeMetrics(metrics: Record<string, number>): Record<string, number> {
    const normalized: Record<string, number> = {};
    
    Object.entries(metrics).forEach(([key, value]) => {
      if (key.includes('revenue')) {
        normalized[key] = Math.round(value / 10000) * 10000;
      } else if (key.includes('rate') || key.includes('percent')) {
        normalized[key] = Math.round(value * 10) / 10;
      } else {
        normalized[key] = value;
      }
    });

    return normalized;
  }

  extractPatterns(): PatternExtractionResult {
    const patternsFound: AnonymizedPattern[] = [];
    const excludedReasons: string[] = [];

    const strategyGroups = this.groupByStrategy();

    strategyGroups.forEach((group, strategy) => {
      if (group.length < this.minimumSampleSize) {
        excludedReasons.push(`Strategy "${strategy}" excluded: insufficient sample size (${group.length})`);
        return;
      }

      const successRate = group.filter(d => d.outcome === 'success').length / group.length;
      const commonContexts = this.findCommonContexts(group);
      const antiPatterns = this.identifyAntiPatterns(group);

      const pattern: AnonymizedPattern = {
        id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        pattern_type: 'strategy',
        industry: this.findMostCommon(group.map(d => d.industry)),
        business_stage: this.findMostCommon(group.map(d => d.stage)),
        pattern_description: `Strategy: ${strategy}`,
        success_rate: successRate,
        sample_size: group.length,
        confidence_level: this.calculateConfidence(group.length, successRate),
        context_conditions: commonContexts,
        anti_patterns: antiPatterns,
        created_at: new Date().toISOString(),
        last_validated: new Date().toISOString(),
      };

      patternsFound.push(pattern);
      this.patterns.push(pattern);
    });

    const confidenceMetrics = this.calculateOverallConfidence();

    return {
      patterns_found: patternsFound,
      confidence_metrics: confidenceMetrics,
      excluded_data_reasons: excludedReasons,
    };
  }

  private groupByStrategy(): Map<string, RawBusinessData[]> {
    const groups = new Map<string, RawBusinessData[]>();
    
    this.rawDataBuffer.forEach(data => {
      const existing = groups.get(data.strategy_used) || [];
      existing.push(data);
      groups.set(data.strategy_used, existing);
    });

    return groups;
  }

  private findCommonContexts(group: RawBusinessData[]): string[] {
    const contextCounts = new Map<string, number>();
    
    group.forEach(data => {
      data.context.forEach(ctx => {
        contextCounts.set(ctx, (contextCounts.get(ctx) || 0) + 1);
      });
    });

    return Array.from(contextCounts.entries())
      .filter(([_, count]) => count >= group.length * 0.5)
      .map(([ctx]) => ctx);
  }

  private identifyAntiPatterns(group: RawBusinessData[]): string[] {
    const failedData = group.filter(d => d.outcome === 'failure');
    if (failedData.length < 2) return [];

    const failureContexts = this.findCommonContexts(failedData);
    return failureContexts.map(ctx => `Avoid when: ${ctx}`);
  }

  private findMostCommon(values: string[]): string {
    const counts = new Map<string, number>();
    values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
    
    let maxCount = 0;
    let mostCommon = values[0];
    
    counts.forEach((count, value) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = value;
      }
    });

    return mostCommon;
  }

  private calculateConfidence(sampleSize: number, successRate: number): number {
    const sizeConfidence = Math.min(1, sampleSize / 20);
    const rateConfidence = Math.abs(successRate - 0.5) * 2;
    return (sizeConfidence * 0.6 + rateConfidence * 0.4) * 100;
  }

  private calculateOverallConfidence(): PatternExtractionResult['confidence_metrics'] {
    const industries = new Set(this.rawDataBuffer.map(d => d.industry));
    const stages = new Set(this.rawDataBuffer.map(d => d.stage));

    return {
      data_quality: Math.min(100, this.rawDataBuffer.length * 5),
      sample_diversity: Math.min(100, (industries.size + stages.size) * 10),
      pattern_strength: this.patterns.reduce((sum, p) => sum + p.confidence_level, 0) / Math.max(1, this.patterns.length),
    };
  }

  getPatterns(filters?: {
    industry?: string;
    stage?: string;
    min_success_rate?: number;
    min_confidence?: number;
  }): AnonymizedPattern[] {
    let filtered = this.patterns;

    if (filters?.industry) {
      filtered = filtered.filter(p => p.industry === filters.industry);
    }
    if (filters?.stage) {
      filtered = filtered.filter(p => p.business_stage === filters.stage);
    }
    if (filters?.min_success_rate) {
      filtered = filtered.filter(p => p.success_rate >= filters.min_success_rate);
    }
    if (filters?.min_confidence) {
      filtered = filtered.filter(p => p.confidence_level >= filters.min_confidence);
    }

    return filtered;
  }

  getTopPatterns(limit: number = 10): AnonymizedPattern[] {
    return [...this.patterns]
      .sort((a, b) => (b.success_rate * b.confidence_level) - (a.success_rate * a.confidence_level))
      .slice(0, limit);
  }
}

export const anonymizedPatternExtractorService = new AnonymizedPatternExtractorService();
