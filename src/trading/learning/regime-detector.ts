// Regime Detector - Identifies market regimes for strategy adaptation

import { MarketRegime, OHLCV } from '../types';

type RegimeType = 'bull' | 'bear' | 'sideways' | 'volatile' | 'crisis';

interface RegimeIndicators {
  trend: number;           // -1 to 1 (bear to bull)
  volatility: number;      // 0 to 1 (low to high)
  momentum: number;        // -1 to 1
  breadth: number;         // 0 to 1 (narrow to broad)
}

interface RegimeConfig {
  lookbackPeriod: number;
  volatilityThreshold: number;
  trendThreshold: number;
  crisisVolatility: number;
}

class RegimeDetector {
  private config: RegimeConfig = {
    lookbackPeriod: 20,
    volatilityThreshold: 0.02,
    trendThreshold: 0.1,
    crisisVolatility: 0.05
  };

  private currentRegime: MarketRegime | null = null;
  private regimeHistory: MarketRegime[] = [];
  private listeners: Array<(regime: MarketRegime) => void> = [];

  configure(config: Partial<RegimeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  detect(data: OHLCV[]): MarketRegime {
    if (data.length < this.config.lookbackPeriod) {
      return this.createRegime('sideways', 0.5, {});
    }

    const recent = data.slice(-this.config.lookbackPeriod);
    const indicators = this.calculateIndicators(recent);
    
    const regime = this.classifyRegime(indicators);
    
    // Check for regime change
    if (this.currentRegime && this.currentRegime.type !== regime.type) {
      console.log(`[REGIME CHANGE] ${this.currentRegime.type} -> ${regime.type}`);
      this.listeners.forEach(l => l(regime));
    }
    
    this.currentRegime = regime;
    this.regimeHistory.push(regime);
    
    // Keep last 100 regimes
    if (this.regimeHistory.length > 100) {
      this.regimeHistory = this.regimeHistory.slice(-100);
    }
    
    return regime;
  }

  private calculateIndicators(data: OHLCV[]): RegimeIndicators {
    const closes = data.map(d => d.close);
    const returns = this.calculateReturns(closes);
    
    // Trend - simple moving average slope
    const firstHalf = closes.slice(0, Math.floor(closes.length / 2));
    const secondHalf = closes.slice(Math.floor(closes.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trend = (secondAvg - firstAvg) / firstAvg;
    
    // Volatility - standard deviation of returns
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    // Momentum - recent returns vs historical
    const recentReturns = returns.slice(-5);
    const momentum = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
    
    // Breadth - simplified as consistency of direction
    const positiveReturns = returns.filter(r => r > 0).length;
    const breadth = positiveReturns / returns.length;
    
    return {
      trend: Math.max(-1, Math.min(1, trend * 10)),
      volatility: Math.min(1, volatility / 0.05),
      momentum: Math.max(-1, Math.min(1, momentum * 50)),
      breadth
    };
  }

  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  private classifyRegime(indicators: RegimeIndicators): MarketRegime {
    const { trend, volatility, momentum } = indicators;
    
    // Crisis - very high volatility
    if (volatility > 0.8) {
      return this.createRegime('crisis', 0.9, indicators);
    }
    
    // Volatile - high volatility with unclear direction
    if (volatility > 0.5 && Math.abs(trend) < 0.3) {
      return this.createRegime('volatile', 0.75, indicators);
    }
    
    // Bull - positive trend and momentum
    if (trend > 0.3 && momentum > 0) {
      const confidence = Math.min(0.95, 0.5 + trend * 0.5);
      return this.createRegime('bull', confidence, indicators);
    }
    
    // Bear - negative trend and momentum
    if (trend < -0.3 && momentum < 0) {
      const confidence = Math.min(0.95, 0.5 + Math.abs(trend) * 0.5);
      return this.createRegime('bear', confidence, indicators);
    }
    
    // Sideways - low trend, moderate volatility
    return this.createRegime('sideways', 0.6, indicators);
  }

  private createRegime(
    type: RegimeType,
    confidence: number,
    indicators: RegimeIndicators | Record<string, number>
  ): MarketRegime {
    const indicatorRecord: Record<string, number> = 
      'trend' in indicators 
        ? { trend: indicators.trend, volatility: indicators.volatility, momentum: indicators.momentum, breadth: indicators.breadth }
        : indicators;
    return {
      type,
      confidence,
      indicators: indicatorRecord,
      detectedAt: new Date()
    };
  }

  getCurrentRegime(): MarketRegime | null {
    return this.currentRegime;
  }

  getRegimeHistory(limit?: number): MarketRegime[] {
    if (limit) {
      return this.regimeHistory.slice(-limit);
    }
    return [...this.regimeHistory];
  }

  onRegimeChange(listener: (regime: MarketRegime) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Get recommended strategy adjustments based on regime
  getStrategyAdjustments(): {
    positionSizing: number;    // Multiplier (0.5 = half size, 2 = double)
    stopLossMultiplier: number;
    profitTargetMultiplier: number;
    preferredStrategies: string[];
  } {
    const regime = this.currentRegime;
    
    if (!regime) {
      return {
        positionSizing: 1,
        stopLossMultiplier: 1,
        profitTargetMultiplier: 1,
        preferredStrategies: ['momentum', 'mean-reversion']
      };
    }

    switch (regime.type) {
      case 'bull':
        return {
          positionSizing: 1.2,
          stopLossMultiplier: 0.8,
          profitTargetMultiplier: 1.5,
          preferredStrategies: ['momentum', 'trend-following']
        };
      case 'bear':
        return {
          positionSizing: 0.5,
          stopLossMultiplier: 1.5,
          profitTargetMultiplier: 0.8,
          preferredStrategies: ['mean-reversion', 'defensive']
        };
      case 'sideways':
        return {
          positionSizing: 0.8,
          stopLossMultiplier: 1,
          profitTargetMultiplier: 1,
          preferredStrategies: ['mean-reversion', 'range-trading']
        };
      case 'volatile':
        return {
          positionSizing: 0.5,
          stopLossMultiplier: 2,
          profitTargetMultiplier: 1.2,
          preferredStrategies: ['volatility', 'options']
        };
      case 'crisis':
        return {
          positionSizing: 0.25,
          stopLossMultiplier: 3,
          profitTargetMultiplier: 0.5,
          preferredStrategies: ['defensive', 'cash']
        };
    }
  }
}

export const regimeDetector = new RegimeDetector();
