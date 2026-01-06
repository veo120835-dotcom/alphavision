import { Signal, SignalStrength, TimeFrame } from '../types';
import { PriceData } from './momentum';

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'sideways';
  strength: number;
  duration: number;
  higherHighs: boolean;
  higherLows: boolean;
  lowerHighs: boolean;
  lowerLows: boolean;
}

export class TrendFollowingSignalGenerator {
  calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
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

  detectMovingAverageCrossover(prices: number[], fastPeriod: number = 20, slowPeriod: number = 50): { crossover: 'golden' | 'death' | 'none'; recentCross: boolean } {
    if (prices.length < slowPeriod + 5) return { crossover: 'none', recentCross: false };

    const fastMA = this.calculateEMA(prices, fastPeriod);
    const slowMA = this.calculateEMA(prices, slowPeriod);
    const prevFastMA = this.calculateEMA(prices.slice(0, -1), fastPeriod);
    const prevSlowMA = this.calculateEMA(prices.slice(0, -1), slowPeriod);

    const currentAbove = fastMA > slowMA;
    const previousAbove = prevFastMA > prevSlowMA;

    if (currentAbove && !previousAbove) {
      return { crossover: 'golden', recentCross: true };
    } else if (!currentAbove && previousAbove) {
      return { crossover: 'death', recentCross: true };
    }

    return { crossover: currentAbove ? 'golden' : 'death', recentCross: false };
  }

  analyzeTrendStructure(data: PriceData[]): TrendAnalysis {
    if (data.length < 10) {
      return {
        direction: 'sideways',
        strength: 0,
        duration: 0,
        higherHighs: false,
        higherLows: false,
        lowerHighs: false,
        lowerLows: false,
      };
    }

    // Find swing points
    const swingHighs: number[] = [];
    const swingLows: number[] = [];

    for (let i = 2; i < data.length - 2; i++) {
      const isSwingHigh = data[i].high > data[i - 1].high && 
                          data[i].high > data[i - 2].high &&
                          data[i].high > data[i + 1].high && 
                          data[i].high > data[i + 2].high;
      const isSwingLow = data[i].low < data[i - 1].low && 
                         data[i].low < data[i - 2].low &&
                         data[i].low < data[i + 1].low && 
                         data[i].low < data[i + 2].low;

      if (isSwingHigh) swingHighs.push(data[i].high);
      if (isSwingLow) swingLows.push(data[i].low);
    }

    const recentHighs = swingHighs.slice(-4);
    const recentLows = swingLows.slice(-4);

    const higherHighs = recentHighs.length >= 2 && recentHighs.every((h, i) => i === 0 || h > recentHighs[i - 1]);
    const higherLows = recentLows.length >= 2 && recentLows.every((l, i) => i === 0 || l > recentLows[i - 1]);
    const lowerHighs = recentHighs.length >= 2 && recentHighs.every((h, i) => i === 0 || h < recentHighs[i - 1]);
    const lowerLows = recentLows.length >= 2 && recentLows.every((l, i) => i === 0 || l < recentLows[i - 1]);

    let direction: 'up' | 'down' | 'sideways' = 'sideways';
    let strength = 0;

    if (higherHighs && higherLows) {
      direction = 'up';
      strength = 0.8;
    } else if (lowerHighs && lowerLows) {
      direction = 'down';
      strength = 0.8;
    } else if (higherLows && !lowerHighs) {
      direction = 'up';
      strength = 0.5;
    } else if (lowerHighs && !higherLows) {
      direction = 'down';
      strength = 0.5;
    }

    return {
      direction,
      strength,
      duration: data.length,
      higherHighs,
      higherLows,
      lowerHighs,
      lowerLows,
    };
  }

  calculateADX(data: PriceData[], period: number = 14): number {
    if (data.length < period + 1) return 25;

    let plusDMSum = 0;
    let minusDMSum = 0;
    let trSum = 0;

    for (let i = 1; i < Math.min(data.length, period + 1); i++) {
      const current = data[i];
      const previous = data[i - 1];

      const highDiff = current.high - previous.high;
      const lowDiff = previous.low - current.low;

      plusDMSum += highDiff > lowDiff && highDiff > 0 ? highDiff : 0;
      minusDMSum += lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0;

      trSum += Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
    }

    const plusDI = trSum > 0 ? (plusDMSum / trSum) * 100 : 0;
    const minusDI = trSum > 0 ? (minusDMSum / trSum) * 100 : 0;
    
    return plusDI + minusDI > 0 ? Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100 : 0;
  }

  detectTrendBreakout(data: PriceData[], lookback: number = 20): { breakout: boolean; direction: 'up' | 'down' | 'none'; strength: number } {
    if (data.length < lookback) return { breakout: false, direction: 'none', strength: 0 };

    const recentData = data.slice(-lookback, -1);
    const currentBar = data[data.length - 1];
    
    const highestHigh = Math.max(...recentData.map(d => d.high));
    const lowestLow = Math.min(...recentData.map(d => d.low));
    const range = highestHigh - lowestLow;

    if (currentBar.close > highestHigh) {
      const breakoutStrength = (currentBar.close - highestHigh) / range;
      return { breakout: true, direction: 'up', strength: Math.min(breakoutStrength, 1) };
    } else if (currentBar.close < lowestLow) {
      const breakoutStrength = (lowestLow - currentBar.close) / range;
      return { breakout: true, direction: 'down', strength: Math.min(breakoutStrength, 1) };
    }

    return { breakout: false, direction: 'none', strength: 0 };
  }

  generateSignal(symbol: string, data: PriceData[], timeframe: TimeFrame): Signal | null {
    if (data.length < 50) return null;

    const closes = data.map(d => d.close);
    const maCrossover = this.detectMovingAverageCrossover(closes);
    const trendStructure = this.analyzeTrendStructure(data);
    const adx = this.calculateADX(data);
    const breakout = this.detectTrendBreakout(data);

    let signalScore = 0;

    // Moving average crossover
    if (maCrossover.crossover === 'golden') signalScore += maCrossover.recentCross ? 3 : 1;
    else if (maCrossover.crossover === 'death') signalScore -= maCrossover.recentCross ? 3 : 1;

    // Trend structure
    if (trendStructure.direction === 'up') signalScore += trendStructure.strength * 2;
    else if (trendStructure.direction === 'down') signalScore -= trendStructure.strength * 2;

    // ADX trend strength confirmation
    if (adx > 25) {
      signalScore *= 1.2;
    } else if (adx < 20) {
      signalScore *= 0.5; // Weak trend
    }

    // Breakout confirmation
    if (breakout.breakout) {
      if (breakout.direction === 'up') signalScore += breakout.strength * 2;
      else signalScore -= breakout.strength * 2;
    }

    if (Math.abs(signalScore) < 2) return null;

    const direction = signalScore > 0 ? 'long' : 'short';
    const confidence = Math.min(Math.abs(signalScore) / 8, 1);
    const strength: SignalStrength = 
      confidence > 0.7 ? 'strong' :
      confidence > 0.4 ? 'moderate' :
      confidence > 0.2 ? 'weak' : 'neutral';

    return {
      id: `tf_${symbol}_${Date.now()}`,
      symbol,
      type: 'trend-following',
      direction,
      strength,
      confidence,
      timeframe,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.getExpiryDuration(timeframe)),
      metadata: {
        movingAverageCrossover: maCrossover,
        trendStructure,
        adx,
        breakout,
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

export const trendFollowingSignalGenerator = new TrendFollowingSignalGenerator();
