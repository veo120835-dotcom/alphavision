import { Signal, SignalType, SignalPerformance, TimeFrame } from '../types';

export interface SignalOutcome {
  signal: Signal;
  actualDirection: 'up' | 'down' | 'flat';
  actualReturn: number;
  holdingPeriod: number;
  peakReturn: number;
  drawdown: number;
  closedAt: Date;
}

export interface SignalAnalytics {
  byType: Record<SignalType, SignalPerformance>;
  byTimeframe: Record<TimeFrame, SignalPerformance>;
  byStrength: Record<string, SignalPerformance>;
  overall: SignalPerformance;
}

export class SignalPerformanceTracker {
  private outcomes: SignalOutcome[] = [];
  private pendingSignals: Map<string, Signal> = new Map();

  trackSignal(signal: Signal): void {
    this.pendingSignals.set(signal.id, signal);
  }

  recordOutcome(
    signalId: string,
    actualDirection: 'up' | 'down' | 'flat',
    actualReturn: number,
    peakReturn: number,
    drawdown: number
  ): SignalOutcome | null {
    const signal = this.pendingSignals.get(signalId);
    if (!signal) return null;

    const outcome: SignalOutcome = {
      signal,
      actualDirection,
      actualReturn,
      holdingPeriod: (Date.now() - signal.generatedAt.getTime()) / (60 * 60 * 1000), // hours
      peakReturn,
      drawdown,
      closedAt: new Date(),
    };

    this.outcomes.push(outcome);
    this.pendingSignals.delete(signalId);
    return outcome;
  }

  getAnalytics(): SignalAnalytics {
    const byType: Record<string, SignalPerformance> = {};
    const byTimeframe: Record<string, SignalPerformance> = {};
    const byStrength: Record<string, SignalPerformance> = {};

    // Initialize
    const signalTypes: SignalType[] = ['momentum', 'mean-reversion', 'trend-following', 'volatility-breakout', 'event-driven', 'fundamental'];
    const timeframes: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'];
    const strengths = ['strong', 'moderate', 'weak', 'neutral'];

    for (const type of signalTypes) {
      byType[type] = this.calculatePerformance(this.outcomes.filter(o => o.signal.type === type));
    }

    for (const tf of timeframes) {
      byTimeframe[tf] = this.calculatePerformance(this.outcomes.filter(o => o.signal.timeframe === tf));
    }

    for (const strength of strengths) {
      byStrength[strength] = this.calculatePerformance(this.outcomes.filter(o => o.signal.strength === strength));
    }

    return {
      byType: byType as Record<SignalType, SignalPerformance>,
      byTimeframe: byTimeframe as Record<TimeFrame, SignalPerformance>,
      byStrength,
      overall: this.calculatePerformance(this.outcomes),
    };
  }

  private calculatePerformance(outcomes: SignalOutcome[]): SignalPerformance {
    if (outcomes.length === 0) {
      return {
        signalType: 'momentum',
        totalSignals: 0,
        successfulSignals: 0,
        winRate: 0,
        avgReturn: 0,
        avgHoldingPeriod: 0,
      };
    }

    const successful = outcomes.filter(o => {
      if (o.signal.direction === 'long') return o.actualDirection === 'up';
      if (o.signal.direction === 'short') return o.actualDirection === 'down';
      return o.actualDirection === 'flat';
    });

    const avgReturn = outcomes.reduce((sum, o) => sum + o.actualReturn, 0) / outcomes.length;
    const avgHoldingPeriod = outcomes.reduce((sum, o) => sum + o.holdingPeriod, 0) / outcomes.length;

    // Calculate Sharpe ratio (simplified)
    const returns = outcomes.map(o => o.actualReturn);
    const meanReturn = avgReturn;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? meanReturn / stdDev : 0;

    // Calculate max drawdown
    let maxDrawdown = 0;
    for (const outcome of outcomes) {
      if (outcome.drawdown > maxDrawdown) {
        maxDrawdown = outcome.drawdown;
      }
    }

    // Calculate profit factor
    const profits = outcomes.filter(o => o.actualReturn > 0).reduce((sum, o) => sum + o.actualReturn, 0);
    const losses = Math.abs(outcomes.filter(o => o.actualReturn < 0).reduce((sum, o) => sum + o.actualReturn, 0));
    const profitFactor = losses > 0 ? profits / losses : profits > 0 ? Infinity : 0;

    return {
      signalType: outcomes[0]?.signal.type || 'momentum',
      totalSignals: outcomes.length,
      successfulSignals: successful.length,
      winRate: successful.length / outcomes.length,
      avgReturn,
      avgHoldingPeriod,
      sharpeRatio,
      maxDrawdown,
      profitFactor,
    };
  }

  getBestPerformingSignalTypes(): { type: SignalType; performance: SignalPerformance }[] {
    const analytics = this.getAnalytics();
    return Object.entries(analytics.byType)
      .map(([type, performance]) => ({ type: type as SignalType, performance }))
      .filter(({ performance }) => performance.totalSignals >= 5)
      .sort((a, b) => b.performance.winRate - a.performance.winRate);
  }

  getSignalQualityScore(signal: Signal): number {
    const analytics = this.getAnalytics();
    
    // Base score from historical performance of this signal type
    const typePerf = analytics.byType[signal.type];
    const tfPerf = analytics.byTimeframe[signal.timeframe];
    const strengthPerf = analytics.byStrength[signal.strength];

    let score = 50;

    if (typePerf && typePerf.totalSignals >= 5) {
      score += (typePerf.winRate - 0.5) * 40;
    }

    if (tfPerf && tfPerf.totalSignals >= 5) {
      score += (tfPerf.winRate - 0.5) * 20;
    }

    if (strengthPerf && strengthPerf.totalSignals >= 5) {
      score += (strengthPerf.winRate - 0.5) * 20;
    }

    // Adjust for signal confidence
    score += (signal.confidence - 0.5) * 20;

    return Math.max(0, Math.min(100, score));
  }

  getRecentOutcomes(hours: number = 24): SignalOutcome[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.outcomes
      .filter(o => o.closedAt >= cutoff)
      .sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime());
  }

  getPendingSignals(): Signal[] {
    return Array.from(this.pendingSignals.values());
  }

  expireOldSignals(): number {
    const now = Date.now();
    let expired = 0;

    for (const [id, signal] of this.pendingSignals) {
      if (signal.expiresAt && signal.expiresAt.getTime() < now) {
        this.pendingSignals.delete(id);
        expired++;
      }
    }

    return expired;
  }

  exportData(): { outcomes: SignalOutcome[]; pending: Signal[] } {
    return {
      outcomes: [...this.outcomes],
      pending: Array.from(this.pendingSignals.values()),
    };
  }

  importData(data: { outcomes: SignalOutcome[]; pending: Signal[] }): void {
    this.outcomes = data.outcomes;
    this.pendingSignals.clear();
    for (const signal of data.pending) {
      this.pendingSignals.set(signal.id, signal);
    }
  }
}

export const signalPerformanceTracker = new SignalPerformanceTracker();
