import { MarketRegime, Signal, SignalStrength, TimeFrame } from '../types';
import { PriceData } from './momentum';

export interface VolatilityMetrics {
  historicalVolatility: number;
  impliedVolatilityRatio?: number;
  atr: number;
  atrPercent: number;
  vixLevel?: number;
  regime: MarketRegime;
  isExpanding: boolean;
  isContracting: boolean;
}

export class VolatilityRegimeDetector {
  calculateHistoricalVolatility(prices: number[], period: number = 20): number {
    if (prices.length < period + 1) return 0;

    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }

    const recentReturns = returns.slice(-period);
    const mean = recentReturns.reduce((a, b) => a + b, 0) / period;
    const squaredDiffs = recentReturns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;

    // Annualized volatility (assuming daily data)
    return Math.sqrt(variance * 252) * 100;
  }

  calculateATR(data: PriceData[], period: number = 14): number {
    if (data.length < period + 1) return 0;

    const trueRanges: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
      trueRanges.push(tr);
    }

    const recentTR = trueRanges.slice(-period);
    return recentTR.reduce((a, b) => a + b, 0) / period;
  }

  calculateATRPercent(data: PriceData[], period: number = 14): number {
    const atr = this.calculateATR(data, period);
    const currentPrice = data[data.length - 1].close;
    return (atr / currentPrice) * 100;
  }

  detectVolatilityTrend(data: PriceData[], shortPeriod: number = 5, longPeriod: number = 20): { isExpanding: boolean; isContracting: boolean; ratio: number } {
    const shortATR = this.calculateATR(data, shortPeriod);
    const longATR = this.calculateATR(data, longPeriod);

    const ratio = longATR > 0 ? shortATR / longATR : 1;

    return {
      isExpanding: ratio > 1.2,
      isContracting: ratio < 0.8,
      ratio,
    };
  }

  classifyRegime(data: PriceData[]): MarketRegime {
    if (data.length < 50) return 'sideways';

    const closes = data.map(d => d.close);
    const hv = this.calculateHistoricalVolatility(closes);
    const atrPercent = this.calculateATRPercent(data);
    const volatilityTrend = this.detectVolatilityTrend(data);

    // Calculate price trend
    const shortMA = this.calculateSMA(closes, 20);
    const longMA = this.calculateSMA(closes, 50);
    const priceTrend = shortMA > longMA ? 'up' : shortMA < longMA ? 'down' : 'flat';

    // High volatility threshold
    if (hv > 40 || atrPercent > 3) {
      return 'volatile';
    }

    // Low volatility
    if (hv < 15 && atrPercent < 1) {
      return 'low-volatility';
    }

    // Trending regimes
    if (priceTrend === 'up' && hv < 30) {
      return 'bull';
    }

    if (priceTrend === 'down' && hv < 30) {
      return 'bear';
    }

    return 'sideways';
  }

  calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  getVolatilityMetrics(data: PriceData[]): VolatilityMetrics {
    const closes = data.map(d => d.close);
    const hv = this.calculateHistoricalVolatility(closes);
    const atr = this.calculateATR(data);
    const atrPercent = this.calculateATRPercent(data);
    const volatilityTrend = this.detectVolatilityTrend(data);
    const regime = this.classifyRegime(data);

    return {
      historicalVolatility: hv,
      atr,
      atrPercent,
      regime,
      isExpanding: volatilityTrend.isExpanding,
      isContracting: volatilityTrend.isContracting,
    };
  }

  generateSignal(symbol: string, data: PriceData[], timeframe: TimeFrame): Signal | null {
    if (data.length < 50) return null;

    const metrics = this.getVolatilityMetrics(data);
    const closes = data.map(d => d.close);

    let signalScore = 0;
    let direction: 'long' | 'short' | 'neutral' = 'neutral';

    // Volatility contraction breakout setup
    if (metrics.isContracting) {
      // Price at upper range suggests upward breakout
      const recentHigh = Math.max(...data.slice(-20).map(d => d.high));
      const recentLow = Math.min(...data.slice(-20).map(d => d.low));
      const currentPrice = closes[closes.length - 1];
      const position = (currentPrice - recentLow) / (recentHigh - recentLow);

      if (position > 0.8) {
        signalScore = 2;
        direction = 'long';
      } else if (position < 0.2) {
        signalScore = 2;
        direction = 'short';
      }
    }

    // Volatility expansion - trend continuation
    if (metrics.isExpanding && metrics.regime !== 'sideways') {
      if (metrics.regime === 'bull') {
        signalScore += 1;
        direction = 'long';
      } else if (metrics.regime === 'bear') {
        signalScore += 1;
        direction = 'short';
      }
    }

    // Low volatility regime - mean reversion opportunity
    if (metrics.regime === 'low-volatility') {
      const mean = this.calculateSMA(closes, 20);
      const deviation = (closes[closes.length - 1] - mean) / mean;

      if (deviation > 0.02) {
        signalScore = 1;
        direction = 'short';
      } else if (deviation < -0.02) {
        signalScore = 1;
        direction = 'long';
      }
    }

    if (signalScore < 1 || direction === 'neutral') return null;

    const confidence = Math.min(signalScore / 4, 1);
    const strength: SignalStrength = 
      confidence > 0.7 ? 'strong' :
      confidence > 0.4 ? 'moderate' :
      confidence > 0.2 ? 'weak' : 'neutral';

    return {
      id: `vol_${symbol}_${Date.now()}`,
      symbol,
      type: 'volatility-breakout',
      direction,
      strength,
      confidence,
      timeframe,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.getExpiryDuration(timeframe)),
      metadata: {
        volatilityMetrics: metrics,
      },
    };
  }

  private getExpiryDuration(timeframe: TimeFrame): number {
    const durations: Record<TimeFrame, number> = {
      '1m': 5 * 60 * 1000,
      '5m': 15 * 60 * 1000,
      '15m': 45 * 60 * 1000,
      '1h': 4 * 60 * 60 * 1000,
      '4h': 12 * 60 * 60 * 1000,
      '1d': 3 * 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000,
    };
    return durations[timeframe];
  }
}

export const volatilityRegimeDetector = new VolatilityRegimeDetector();
