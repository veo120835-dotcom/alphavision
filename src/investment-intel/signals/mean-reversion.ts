import { Signal, SignalStrength, TimeFrame } from '../types';
import { PriceData } from './momentum';

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
}

export class MeanReversionSignalGenerator {
  calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  calculateStdDev(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const slice = prices.slice(-period);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const squaredDiffs = slice.map(p => Math.pow(p - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
  }

  calculateBollingerBands(prices: number[], period: number = 20, stdDevMultiplier: number = 2): BollingerBands {
    const middle = this.calculateSMA(prices, period);
    const stdDev = this.calculateStdDev(prices, period);
    const upper = middle + (stdDev * stdDevMultiplier);
    const lower = middle - (stdDev * stdDevMultiplier);
    const currentPrice = prices[prices.length - 1];

    return {
      upper,
      middle,
      lower,
      bandwidth: ((upper - lower) / middle) * 100,
      percentB: upper !== lower ? (currentPrice - lower) / (upper - lower) : 0.5,
    };
  }

  calculateZScore(prices: number[], period: number = 20): number {
    const mean = this.calculateSMA(prices, period);
    const stdDev = this.calculateStdDev(prices, period);
    const currentPrice = prices[prices.length - 1];

    if (stdDev === 0) return 0;
    return (currentPrice - mean) / stdDev;
  }

  calculateKeltnerChannels(data: PriceData[], emaPeriod: number = 20, atrPeriod: number = 10, multiplier: number = 2): { upper: number; middle: number; lower: number } {
    const closes = data.map(d => d.close);
    const middle = this.calculateEMA(closes, emaPeriod);
    const atr = this.calculateATR(data, atrPeriod);

    return {
      upper: middle + (atr * multiplier),
      middle,
      lower: middle - (atr * multiplier),
    };
  }

  calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
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

    return this.calculateSMA(trueRanges, period);
  }

  detectOverextension(prices: number[], period: number = 20): { isOverextended: boolean; direction: 'overbought' | 'oversold' | 'neutral'; magnitude: number } {
    const zScore = this.calculateZScore(prices, period);
    const bands = this.calculateBollingerBands(prices, period);

    if (zScore > 2 || bands.percentB > 1) {
      return { isOverextended: true, direction: 'overbought', magnitude: Math.max(zScore, (bands.percentB - 0.5) * 4) };
    } else if (zScore < -2 || bands.percentB < 0) {
      return { isOverextended: true, direction: 'oversold', magnitude: Math.abs(Math.min(zScore, (bands.percentB - 0.5) * 4)) };
    }

    return { isOverextended: false, direction: 'neutral', magnitude: 0 };
  }

  generateSignal(symbol: string, data: PriceData[], timeframe: TimeFrame): Signal | null {
    if (data.length < 20) return null;

    const closes = data.map(d => d.close);
    const bands = this.calculateBollingerBands(closes);
    const zScore = this.calculateZScore(closes);
    const keltner = this.calculateKeltnerChannels(data);
    const overextension = this.detectOverextension(closes);

    let signalScore = 0;

    // Bollinger Band signals
    if (bands.percentB < 0) signalScore += 2; // Below lower band - bullish
    else if (bands.percentB > 1) signalScore -= 2; // Above upper band - bearish

    // Z-score signals
    if (zScore < -2) signalScore += 2;
    else if (zScore > 2) signalScore -= 2;
    else if (zScore < -1.5) signalScore += 1;
    else if (zScore > 1.5) signalScore -= 1;

    // Keltner squeeze detection
    const currentPrice = closes[closes.length - 1];
    if (currentPrice < keltner.lower) signalScore += 1;
    else if (currentPrice > keltner.upper) signalScore -= 1;

    // Bandwidth contraction (potential squeeze)
    if (bands.bandwidth < 5) {
      // Low volatility, potential breakout
      signalScore *= 0.5; // Reduce confidence
    }

    if (Math.abs(signalScore) < 2) return null;

    const direction = signalScore > 0 ? 'long' : 'short';
    const confidence = Math.min(Math.abs(signalScore) / 6, 1);
    const strength: SignalStrength = 
      confidence > 0.7 ? 'strong' :
      confidence > 0.4 ? 'moderate' :
      confidence > 0.2 ? 'weak' : 'neutral';

    return {
      id: `mr_${symbol}_${Date.now()}`,
      symbol,
      type: 'mean-reversion',
      direction,
      strength,
      confidence,
      timeframe,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.getExpiryDuration(timeframe)),
      metadata: {
        bollingerBands: bands,
        zScore,
        keltnerChannels: keltner,
        overextension,
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

export const meanReversionSignalGenerator = new MeanReversionSignalGenerator();
