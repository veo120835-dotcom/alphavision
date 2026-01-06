// Offer Diff Analyzer - Compare features and offerings

import { OfferDiff } from './types';

interface OfferComparison {
  competitor_id: string;
  competitor_name: string;
  total_features_compared: number;
  our_advantages: OfferDiff[];
  their_advantages: OfferDiff[];
  parity_features: OfferDiff[];
  critical_gaps: OfferDiff[];
  competitive_score: number;
}

interface FeatureGapPriority {
  feature: string;
  priority_score: number;
  reasoning: string;
  effort_estimate: 'low' | 'medium' | 'high';
  impact_if_added: 'minor' | 'moderate' | 'significant' | 'game_changer';
}

class OfferDiffAnalyzerService {
  private offerDiffs: OfferDiff[] = [];
  private ourFeatures: Map<string, { has: boolean; quality: 'basic' | 'good' | 'excellent' }> = new Map();

  setOurFeature(feature: string, has: boolean, quality: 'basic' | 'good' | 'excellent' = 'good'): void {
    this.ourFeatures.set(feature.toLowerCase(), { has, quality });
  }

  addOfferDiff(diff: OfferDiff): void {
    const existing = this.offerDiffs.findIndex(
      d => d.competitor_id === diff.competitor_id && d.feature === diff.feature
    );
    
    if (existing >= 0) {
      this.offerDiffs[existing] = diff;
    } else {
      this.offerDiffs.push(diff);
    }
  }

  analyzeCompetitor(competitorId: string, competitorName: string): OfferComparison {
    const competitorDiffs = this.offerDiffs.filter(d => d.competitor_id === competitorId);

    const ourAdvantages = competitorDiffs.filter(
      d => d.our_status === 'has' && d.competitor_status === 'missing' ||
           d.our_status === 'better'
    );

    const theirAdvantages = competitorDiffs.filter(
      d => d.our_status === 'missing' && d.competitor_status === 'has' ||
           d.our_status === 'worse'
    );

    const parityFeatures = competitorDiffs.filter(
      d => d.our_status === d.competitor_status && d.our_status !== 'missing'
    );

    const criticalGaps = theirAdvantages.filter(d => d.importance === 'critical');

    const competitiveScore = this.calculateCompetitiveScore(
      ourAdvantages.length,
      theirAdvantages.length,
      criticalGaps.length,
      competitorDiffs.length
    );

    return {
      competitor_id: competitorId,
      competitor_name: competitorName,
      total_features_compared: competitorDiffs.length,
      our_advantages: ourAdvantages,
      their_advantages: theirAdvantages,
      parity_features: parityFeatures,
      critical_gaps: criticalGaps,
      competitive_score: competitiveScore,
    };
  }

  private calculateCompetitiveScore(
    ourAdvantages: number,
    theirAdvantages: number,
    criticalGaps: number,
    totalFeatures: number
  ): number {
    if (totalFeatures === 0) return 50;

    const advantageRatio = (ourAdvantages - theirAdvantages) / totalFeatures;
    const criticalGapPenalty = criticalGaps * 10;
    
    let score = 50 + (advantageRatio * 40) - criticalGapPenalty;
    return Math.max(0, Math.min(100, score));
  }

  prioritizeGaps(): FeatureGapPriority[] {
    const gaps = this.offerDiffs.filter(
      d => d.our_status === 'missing' || d.our_status === 'worse'
    );

    return gaps.map(gap => {
      const importanceScore = { critical: 100, important: 60, nice_to_have: 20 }[gap.importance];
      const competitorCount = this.offerDiffs.filter(
        d => d.feature === gap.feature && d.competitor_status === 'has'
      ).length;
      const marketPrevalence = competitorCount * 15;

      const priorityScore = importanceScore + marketPrevalence;

      return {
        feature: gap.feature,
        priority_score: priorityScore,
        reasoning: this.generateGapReasoning(gap, competitorCount),
        effort_estimate: this.estimateEffort(gap.feature),
        impact_if_added: this.estimateImpact(gap.importance, competitorCount),
      };
    }).sort((a, b) => b.priority_score - a.priority_score);
  }

  private generateGapReasoning(gap: OfferDiff, competitorCount: number): string {
    if (gap.importance === 'critical') {
      return `Critical feature that ${competitorCount} competitor(s) have. Missing this creates significant competitive disadvantage.`;
    }
    if (competitorCount >= 3) {
      return `Table-stakes feature present in most competitor offerings. Customers may expect this.`;
    }
    return gap.gap_analysis || 'Feature analysis pending';
  }

  private estimateEffort(feature: string): 'low' | 'medium' | 'high' {
    const complexFeatures = ['integration', 'api', 'automation', 'ai', 'analytics'];
    const simpleFeatures = ['ui', 'display', 'filter', 'sort', 'export'];

    const featureLower = feature.toLowerCase();
    
    if (complexFeatures.some(cf => featureLower.includes(cf))) return 'high';
    if (simpleFeatures.some(sf => featureLower.includes(sf))) return 'low';
    return 'medium';
  }

  private estimateImpact(
    importance: 'critical' | 'important' | 'nice_to_have',
    competitorCount: number
  ): 'minor' | 'moderate' | 'significant' | 'game_changer' {
    if (importance === 'critical' && competitorCount >= 3) return 'game_changer';
    if (importance === 'critical') return 'significant';
    if (importance === 'important' && competitorCount >= 2) return 'significant';
    if (importance === 'important') return 'moderate';
    return 'minor';
  }

  getCompetitiveMatrix(): Map<string, number> {
    const matrix = new Map<string, number>();
    const competitorIds = [...new Set(this.offerDiffs.map(d => d.competitor_id))];

    competitorIds.forEach(id => {
      const comparison = this.analyzeCompetitor(id, id);
      matrix.set(id, comparison.competitive_score);
    });

    return matrix;
  }
}

export const offerDiffAnalyzerService = new OfferDiffAnalyzerService();
