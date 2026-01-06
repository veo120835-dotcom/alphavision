import { Asset, Opportunity, Signal, InvestmentThesis, FundamentalData } from '../types';
import { qualityFactorAnalyzer } from '../fundamentals/quality-factors';
import { valuationFactorAnalyzer } from '../fundamentals/valuation-factors';
import { growthFactorAnalyzer } from '../fundamentals/growth-factors';

export interface ScoringWeights {
  technicalSignals: number;
  fundamentalQuality: number;
  valuation: number;
  growth: number;
  catalyst: number;
  risk: number;
}

export interface OpportunityScoreBreakdown {
  overall: number;
  technical: number;
  fundamental: number;
  valuation: number;
  growth: number;
  catalyst: number;
  riskAdjusted: number;
}

export class OpportunityScorer {
  private defaultWeights: ScoringWeights = {
    technicalSignals: 0.25,
    fundamentalQuality: 0.20,
    valuation: 0.20,
    growth: 0.15,
    catalyst: 0.10,
    risk: 0.10,
  };

  score(
    asset: Asset,
    signals: Signal[],
    fundamentals?: FundamentalData,
    catalysts?: string[],
    weights: Partial<ScoringWeights> = {}
  ): OpportunityScoreBreakdown {
    const w = { ...this.defaultWeights, ...weights };

    const technicalScore = this.scoreTechnicalSignals(signals);
    const fundamentalScore = fundamentals ? this.scoreFundamentals(fundamentals) : 50;
    const valuationScore = fundamentals ? this.scoreValuation(fundamentals, asset.sector || 'default') : 50;
    const growthScore = fundamentals ? this.scoreGrowth(fundamentals) : 50;
    const catalystScore = this.scoreCatalysts(catalysts || []);
    const riskScore = this.calculateRiskScore(signals, fundamentals);

    const overall = 
      technicalScore * w.technicalSignals +
      fundamentalScore * w.fundamentalQuality +
      valuationScore * w.valuation +
      growthScore * w.growth +
      catalystScore * w.catalyst +
      (100 - riskScore) * w.risk;

    return {
      overall,
      technical: technicalScore,
      fundamental: fundamentalScore,
      valuation: valuationScore,
      growth: growthScore,
      catalyst: catalystScore,
      riskAdjusted: overall * (1 - riskScore / 200),
    };
  }

  private scoreTechnicalSignals(signals: Signal[]): number {
    if (signals.length === 0) return 50;

    let totalScore = 0;
    let totalWeight = 0;

    for (const signal of signals) {
      const strengthMultiplier = 
        signal.strength === 'strong' ? 1.5 :
        signal.strength === 'moderate' ? 1.0 :
        signal.strength === 'weak' ? 0.5 : 0.25;

      const baseScore = signal.confidence * 100;
      const directionMultiplier = signal.direction === 'long' ? 1 : signal.direction === 'short' ? -1 : 0;

      totalScore += baseScore * strengthMultiplier * directionMultiplier;
      totalWeight += strengthMultiplier;
    }

    // Normalize to 0-100 scale with 50 as neutral
    const avgScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    return Math.max(0, Math.min(100, 50 + avgScore / 2));
  }

  private scoreFundamentals(data: FundamentalData): number {
    const analysis = qualityFactorAnalyzer.analyze(data);
    return analysis.score.overall;
  }

  private scoreValuation(data: FundamentalData, industry: string): number {
    const analysis = valuationFactorAnalyzer.analyze(data, industry);
    return analysis.score.overall;
  }

  private scoreGrowth(data: FundamentalData): number {
    const analysis = growthFactorAnalyzer.analyze(data);
    return analysis.score.overall;
  }

  private scoreCatalysts(catalysts: string[]): number {
    if (catalysts.length === 0) return 50;

    // Base score increases with number of catalysts
    const baseScore = Math.min(catalysts.length * 15, 50);
    return 50 + baseScore;
  }

  private calculateRiskScore(signals: Signal[], fundamentals?: FundamentalData): number {
    let riskScore = 30; // Base risk

    // Signal disagreement increases risk
    const longSignals = signals.filter(s => s.direction === 'long').length;
    const shortSignals = signals.filter(s => s.direction === 'short').length;
    if (longSignals > 0 && shortSignals > 0) {
      riskScore += 15;
    }

    // Low confidence signals increase risk
    const avgConfidence = signals.length > 0
      ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
      : 0.5;
    if (avgConfidence < 0.5) {
      riskScore += 20;
    }

    // Fundamental risks
    if (fundamentals) {
      if (fundamentals.debtToEquity && fundamentals.debtToEquity > 2) {
        riskScore += 15;
      }
      if (fundamentals.currentRatio && fundamentals.currentRatio < 1) {
        riskScore += 20;
      }
      if (fundamentals.netMargin && fundamentals.netMargin < 0) {
        riskScore += 15;
      }
    }

    return Math.min(100, riskScore);
  }

  generateOpportunity(
    asset: Asset,
    signals: Signal[],
    fundamentals?: FundamentalData,
    catalysts?: string[]
  ): Opportunity {
    const scoreBreakdown = this.score(asset, signals, fundamentals, catalysts);
    const thesis = this.generateThesis(asset, signals, fundamentals, catalysts);
    const riskScore = this.calculateRiskScore(signals, fundamentals);

    // Determine direction from signals
    const longSignals = signals.filter(s => s.direction === 'long');
    const shortSignals = signals.filter(s => s.direction === 'short');
    const isLong = longSignals.length >= shortSignals.length;

    // Calculate expected return based on score and timeframe
    const baseReturn = (scoreBreakdown.overall - 50) / 10; // -5% to +5% base
    const expectedReturn = baseReturn * (isLong ? 1 : -1);

    // Determine time horizon based on signals
    const timeframes = signals.map(s => this.timeframeToHours(s.timeframe));
    const avgTimeframe = timeframes.length > 0
      ? timeframes.reduce((a, b) => a + b, 0) / timeframes.length
      : 24 * 7;
    const timeHorizon = this.hoursToTimeHorizon(avgTimeframe);

    return {
      id: `opp_${asset.symbol}_${Date.now()}`,
      symbol: asset.symbol,
      asset,
      signals,
      thesis,
      opportunityScore: scoreBreakdown.overall,
      riskScore,
      expectedReturn,
      timeHorizon,
      invalidationConditions: this.generateInvalidationConditions(signals, thesis),
      generatedAt: new Date(),
      status: 'active',
    };
  }

  private generateThesis(
    asset: Asset,
    signals: Signal[],
    fundamentals?: FundamentalData,
    catalysts?: string[]
  ): InvestmentThesis {
    const bullCase: string[] = [];
    const bearCase: string[] = [];
    const risks: string[] = [];

    // From signals
    const strongLongSignals = signals.filter(s => s.direction === 'long' && s.strength === 'strong');
    const strongShortSignals = signals.filter(s => s.direction === 'short' && s.strength === 'strong');

    if (strongLongSignals.length > 0) {
      bullCase.push(`${strongLongSignals.length} strong bullish technical signals`);
    }
    if (strongShortSignals.length > 0) {
      bearCase.push(`${strongShortSignals.length} strong bearish technical signals`);
    }

    // From fundamentals
    if (fundamentals) {
      if (fundamentals.revenueGrowth && fundamentals.revenueGrowth > 20) {
        bullCase.push(`Strong revenue growth of ${fundamentals.revenueGrowth.toFixed(1)}%`);
      }
      if (fundamentals.roe && fundamentals.roe > 15) {
        bullCase.push(`High ROE of ${fundamentals.roe.toFixed(1)}%`);
      }
      if (fundamentals.pe && fundamentals.pe < 15) {
        bullCase.push(`Attractive P/E valuation of ${fundamentals.pe.toFixed(1)}`);
      }

      if (fundamentals.debtToEquity && fundamentals.debtToEquity > 1.5) {
        risks.push('Elevated debt levels');
        bearCase.push('Balance sheet concerns');
      }
      if (fundamentals.revenueGrowth && fundamentals.revenueGrowth < 0) {
        bearCase.push('Declining revenues');
        risks.push('Revenue decline may accelerate');
      }
    }

    // From catalysts
    if (catalysts && catalysts.length > 0) {
      bullCase.push(...catalysts.slice(0, 3).map(c => `Catalyst: ${c}`));
    }

    const summary = this.generateSummary(asset, signals, fundamentals);
    const isLong = signals.filter(s => s.direction === 'long').length >= 
                   signals.filter(s => s.direction === 'short').length;

    return {
      summary,
      bullCase: bullCase.length > 0 ? bullCase : ['Technical setup suggests upside potential'],
      bearCase: bearCase.length > 0 ? bearCase : ['Limited downside catalysts identified'],
      catalysts: catalysts || [],
      risks: risks.length > 0 ? risks : ['Standard market risk'],
      confidence: signals.reduce((sum, s) => sum + s.confidence, 0) / Math.max(signals.length, 1),
    };
  }

  private generateSummary(asset: Asset, signals: Signal[], fundamentals?: FundamentalData): string {
    const signalDirection = signals.filter(s => s.direction === 'long').length >= 
                           signals.filter(s => s.direction === 'short').length
      ? 'bullish' : 'bearish';
    
    const signalStrength = signals.some(s => s.strength === 'strong') 
      ? 'strong' 
      : signals.some(s => s.strength === 'moderate')
      ? 'moderate'
      : 'weak';

    let summary = `${asset.symbol} shows ${signalStrength} ${signalDirection} technical signals`;

    if (fundamentals) {
      const qualityAnalysis = qualityFactorAnalyzer.analyze(fundamentals);
      summary += ` with ${qualityAnalysis.grade}-grade fundamentals`;
    }

    return summary;
  }

  private generateInvalidationConditions(signals: Signal[], thesis: InvestmentThesis): string[] {
    const conditions: string[] = [];
    
    const isLong = thesis.bullCase.length >= thesis.bearCase.length;

    if (isLong) {
      conditions.push('Price breaks below recent support levels');
      conditions.push('Volume dries up on attempted breakout');
      conditions.push('Key technical indicators flip bearish');
    } else {
      conditions.push('Price breaks above recent resistance levels');
      conditions.push('Volume surge on attempted breakdown fails');
      conditions.push('Key technical indicators flip bullish');
    }

    conditions.push('Fundamental thesis changes materially');
    conditions.push('Time horizon expires without expected move');

    return conditions;
  }

  private timeframeToHours(timeframe: string): number {
    const map: Record<string, number> = {
      '1m': 0.25,
      '5m': 1,
      '15m': 3,
      '1h': 12,
      '4h': 48,
      '1d': 168,
      '1w': 504,
      '1M': 2160,
    };
    return map[timeframe] || 24;
  }

  private hoursToTimeHorizon(hours: number): string {
    if (hours < 1) return 'Intraday';
    if (hours < 24) return '1-3 Days';
    if (hours < 168) return '1-2 Weeks';
    if (hours < 720) return '1-3 Months';
    return '3+ Months';
  }
}

export const opportunityScorer = new OpportunityScorer();
