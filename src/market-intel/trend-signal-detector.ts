// Trend Signal Detector - Identify market trends and shifts

import { TrendSignal } from './types';

interface TrendAnalysis {
  signal: TrendSignal;
  action_urgency: 'monitor' | 'prepare' | 'act_now' | 'critical';
  strategic_implications: string[];
  potential_responses: string[];
}

interface TrendForecast {
  trend_id: string;
  current_strength: number;
  projected_strength_30d: number;
  projected_strength_90d: number;
  peak_timing_estimate: string;
  confidence: number;
}

class TrendSignalDetectorService {
  private signals: TrendSignal[] = [];
  private industryKeywords: Map<string, string[]> = new Map();

  registerIndustryKeywords(industry: string, keywords: string[]): void {
    this.industryKeywords.set(industry.toLowerCase(), keywords);
  }

  addSignal(signal: TrendSignal): void {
    const existing = this.signals.findIndex(s => s.id === signal.id);
    if (existing >= 0) {
      this.signals[existing] = signal;
    } else {
      this.signals.push(signal);
    }
  }

  detectTrends(industry: string): TrendSignal[] {
    const keywords = this.industryKeywords.get(industry.toLowerCase()) || [];
    
    return this.signals.filter(signal => {
      const relevantToIndustry = keywords.length === 0 || 
        keywords.some(kw => 
          signal.title.toLowerCase().includes(kw) ||
          signal.description.toLowerCase().includes(kw) ||
          signal.category.toLowerCase().includes(kw)
        );
      
      return relevantToIndustry && signal.relevance_score >= 0.5;
    }).sort((a, b) => b.relevance_score - a.relevance_score);
  }

  analyzeSignal(signalId: string): TrendAnalysis | null {
    const signal = this.signals.find(s => s.id === signalId);
    if (!signal) return null;

    const urgency = this.determineUrgency(signal);
    const implications = this.deriveImplications(signal);
    const responses = this.generateResponses(signal, urgency);

    return {
      signal,
      action_urgency: urgency,
      strategic_implications: implications,
      potential_responses: responses,
    };
  }

  private determineUrgency(signal: TrendSignal): 'monitor' | 'prepare' | 'act_now' | 'critical' {
    const timeHorizonWeight = {
      immediate: 4,
      short_term: 3,
      medium_term: 2,
      long_term: 1,
    }[signal.time_horizon];

    const signalTypeWeight = {
      disruption: 4,
      emerging: 3,
      growing: 2,
      declining: 1,
    }[signal.signal_type];

    const urgencyScore = (timeHorizonWeight * signalTypeWeight * signal.confidence) / 4;

    if (urgencyScore >= 12) return 'critical';
    if (urgencyScore >= 8) return 'act_now';
    if (urgencyScore >= 4) return 'prepare';
    return 'monitor';
  }

  private deriveImplications(signal: TrendSignal): string[] {
    const implications: string[] = [];

    if (signal.signal_type === 'disruption') {
      implications.push('Existing business model may need fundamental rethinking');
      implications.push('Early movers could gain significant market share');
    }

    if (signal.signal_type === 'emerging') {
      implications.push('Opportunity to establish early leadership position');
      implications.push('Investment now could yield competitive advantage');
    }

    if (signal.signal_type === 'growing') {
      implications.push('Market validation exists - focus on execution');
      implications.push('Competition likely to increase');
    }

    if (signal.signal_type === 'declining') {
      implications.push('Resources may need reallocation');
      implications.push('Look for adjacent opportunities');
    }

    if (signal.time_horizon === 'immediate') {
      implications.push('Rapid response required to capitalize or mitigate');
    }

    return implications;
  }

  private generateResponses(signal: TrendSignal, urgency: string): string[] {
    const responses: string[] = [];

    switch (urgency) {
      case 'critical':
        responses.push('Convene emergency strategy session');
        responses.push('Allocate resources for immediate response');
        responses.push('Communicate with stakeholders');
        break;
      case 'act_now':
        responses.push('Develop action plan within 2 weeks');
        responses.push('Assign dedicated team to address');
        responses.push('Begin pilot or prototype');
        break;
      case 'prepare':
        responses.push('Include in quarterly planning');
        responses.push('Research and gather more data');
        responses.push('Identify required capabilities');
        break;
      case 'monitor':
        responses.push('Add to trend watching list');
        responses.push('Set up alerts for developments');
        responses.push('Review monthly');
        break;
    }

    return responses;
  }

  forecastTrend(signalId: string): TrendForecast | null {
    const signal = this.signals.find(s => s.id === signalId);
    if (!signal) return null;

    const growthRate = signal.signal_type === 'emerging' ? 1.5 :
                       signal.signal_type === 'growing' ? 1.2 :
                       signal.signal_type === 'declining' ? 0.7 : 1.0;

    const currentStrength = signal.relevance_score * signal.confidence * 100;

    return {
      trend_id: signalId,
      current_strength: currentStrength,
      projected_strength_30d: Math.min(100, currentStrength * Math.pow(growthRate, 1)),
      projected_strength_90d: Math.min(100, currentStrength * Math.pow(growthRate, 3)),
      peak_timing_estimate: this.estimatePeakTiming(signal),
      confidence: signal.confidence * 0.8,
    };
  }

  private estimatePeakTiming(signal: TrendSignal): string {
    const baseMonths = {
      immediate: 3,
      short_term: 6,
      medium_term: 12,
      long_term: 24,
    }[signal.time_horizon];

    const adjustedMonths = signal.signal_type === 'emerging' ? baseMonths * 1.5 :
                          signal.signal_type === 'growing' ? baseMonths :
                          signal.signal_type === 'declining' ? 0 : baseMonths;

    if (adjustedMonths === 0) return 'Already peaked';
    
    const peakDate = new Date();
    peakDate.setMonth(peakDate.getMonth() + adjustedMonths);
    return peakDate.toISOString().split('T')[0];
  }

  getTopTrends(limit: number = 10): TrendSignal[] {
    return [...this.signals]
      .sort((a, b) => {
        const scoreA = a.relevance_score * a.confidence;
        const scoreB = b.relevance_score * b.confidence;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }
}

export const trendSignalDetectorService = new TrendSignalDetectorService();
