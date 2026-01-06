// Competitor Tracker - Monitor and analyze competitors

import { Competitor } from './types';

interface CompetitorAnalysis {
  competitor: Competitor;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  movement_detected: boolean;
  recent_changes: string[];
  watch_priority: number;
}

class CompetitorTrackerService {
  private competitorDatabase: Map<string, Competitor> = new Map();

  addCompetitor(competitor: Competitor): void {
    this.competitorDatabase.set(competitor.id, competitor);
  }

  analyzeCompetitor(competitorId: string): CompetitorAnalysis | null {
    const competitor = this.competitorDatabase.get(competitorId);
    if (!competitor) return null;

    const threatLevel = this.assessThreatLevel(competitor);
    const recentChanges = this.detectRecentChanges(competitor);

    return {
      competitor,
      threat_level: threatLevel,
      movement_detected: recentChanges.length > 0,
      recent_changes: recentChanges,
      watch_priority: this.calculateWatchPriority(competitor, threatLevel),
    };
  }

  private assessThreatLevel(competitor: Competitor): 'low' | 'medium' | 'high' | 'critical' {
    const marketShareScore = (competitor.market_share_estimate || 0) / 25;
    const strengthScore = competitor.strengths.length / 5;
    const categoryMultiplier = competitor.category === 'direct' ? 1.5 : 
                               competitor.category === 'indirect' ? 1 : 0.5;

    const totalScore = (marketShareScore + strengthScore) * categoryMultiplier;

    if (totalScore >= 2) return 'critical';
    if (totalScore >= 1.5) return 'high';
    if (totalScore >= 0.8) return 'medium';
    return 'low';
  }

  private detectRecentChanges(competitor: Competitor): string[] {
    const changes: string[] = [];
    const lastUpdate = new Date(competitor.last_updated);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate < 7) {
      changes.push('Profile recently updated');
    }

    if (competitor.strengths.length > 5) {
      changes.push('Expanding capabilities detected');
    }

    return changes;
  }

  private calculateWatchPriority(competitor: Competitor, threatLevel: string): number {
    const baseScore = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
    }[threatLevel] || 25;

    const categoryBonus = competitor.category === 'direct' ? 20 : 0;
    const marketShareBonus = (competitor.market_share_estimate || 0) * 0.5;

    return Math.min(100, baseScore + categoryBonus + marketShareBonus);
  }

  getTopCompetitors(limit: number = 5): CompetitorAnalysis[] {
    const analyses: CompetitorAnalysis[] = [];
    
    this.competitorDatabase.forEach((_, id) => {
      const analysis = this.analyzeCompetitor(id);
      if (analysis) analyses.push(analysis);
    });

    return analyses
      .sort((a, b) => b.watch_priority - a.watch_priority)
      .slice(0, limit);
  }

  compareStrengths(competitorId: string, ourStrengths: string[]): {
    our_advantages: string[];
    their_advantages: string[];
    shared_strengths: string[];
    gaps_to_close: string[];
  } {
    const competitor = this.competitorDatabase.get(competitorId);
    if (!competitor) {
      return {
        our_advantages: ourStrengths,
        their_advantages: [],
        shared_strengths: [],
        gaps_to_close: [],
      };
    }

    const ourSet = new Set(ourStrengths.map(s => s.toLowerCase()));
    const theirSet = new Set(competitor.strengths.map(s => s.toLowerCase()));

    return {
      our_advantages: ourStrengths.filter(s => !theirSet.has(s.toLowerCase())),
      their_advantages: competitor.strengths.filter(s => !ourSet.has(s.toLowerCase())),
      shared_strengths: ourStrengths.filter(s => theirSet.has(s.toLowerCase())),
      gaps_to_close: competitor.strengths.filter(s => !ourSet.has(s.toLowerCase())),
    };
  }
}

export const competitorTrackerService = new CompetitorTrackerService();
