import { Signal, SignalStrength, TimeFrame } from '../types';

export interface MomentumIndicators {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  stochastic: { k: number; d: number };
  roc: number;
  williams: number;
  adx: number;
  plusDI: number;
  minusDI: number;
}

export interface PriceData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class MomentumSignalGenerator {
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices: number[], fast: number = 12, slow: number = 26, signal: number = 9): { value: number; signal: number; histogram: number } {
    const emaFast = this.calculateEMA(prices, fast);
    const emaSlow = this.calculateEMA(prices, slow);
    const macdLine = emaFast - emaSlow;

    const macdValues = prices.slice(-signal).map((_, i) => {
      const slice = prices.slice(0, prices.length - signal + i + 1);
      return this.calculateEMA(slice, fast) - this.calculateEMA(slice, slow);
    });

    const signalLine = this.calculateEMA(macdValues, signal);
    const histogram = macdLine - signalLine;

    return { value: macdLine, signal: signalLine, histogram };
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

  calculateStochastic(data: PriceData[], kPeriod: number = 14, dPeriod: number = 3): { k: number; d: number } {
    if (data.length < kPeriod) return { k: 50, d: 50 };

    const recentData = data.slice(-kPeriod);
    const currentClose = recentData[recentData.length - 1].close;
    const lowestLow = Math.min(...recentData.map(d => d.low));
    const highestHigh = Math.max(...recentData.map(d => d.high));

    const k = highestHigh !== lowestLow
      ? ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100
      : 50;

    // Simplified D calculation
    const d = k; // In production, this would be an SMA of K values

    return { k, d };
  }

  calculateROC(prices: number[], period: number = 12): number {
    if (prices.length < period + 1) return 0;
    const current = prices[prices.length - 1];
    const past = prices[prices.length - 1 - period];
    return ((current - past) / past) * 100;
  }

  calculateADX(data: PriceData[], period: number = 14): { adx: number; plusDI: number; minusDI: number } {
    if (data.length < period + 1) {
      return { adx: 25, plusDI: 25, minusDI: 25 };
    }

    // Simplified ADX calculation
    const recentData = data.slice(-period - 1);
    let plusDMSum = 0;
    let minusDMSum = 0;
    let trSum = 0;

    for (let i = 1; i < recentData.length; i++) {
      const current = recentData[i];
      const previous = recentData[i - 1];

      const highDiff = current.high - previous.high;
      const lowDiff = previous.low - current.low;

      const plusDM = highDiff > lowDiff && highDiff > 0 ? highDiff : 0;
      const minusDM = lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0;

      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );

      plusDMSum += plusDM;
      minusDMSum += minusDM;
      trSum += tr;
    }

    const plusDI = trSum > 0 ? (plusDMSum / trSum) * 100 : 0;
    const minusDI = trSum > 0 ? (minusDMSum / trSum) * 100 : 0;
    const dx = plusDI + minusDI > 0 ? Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100 : 0;

    return { adx: dx, plusDI, minusDI };
  }

  generateSignal(symbol: string, data: PriceData[], timeframe: TimeFrame): Signal | null {
    if (data.length < 26) return null;

    const closes = data.map(d => d.close);
    const rsi = this.calculateRSI(closes);
    const macd = this.calculateMACD(closes);
    const stoch = this.calculateStochastic(data);
    const roc = this.calculateROC(closes);
    const { adx, plusDI, minusDI } = this.calculateADX(data);

    let bullishSignals = 0;
    let bearishSignals = 0;
    let totalWeight = 0;

    // RSI signals
    if (rsi < 30) { bullishSignals += 2; totalWeight += 2; }
    else if (rsi > 70) { bearishSignals += 2; totalWeight += 2; }
    else { totalWeight += 1; }

    // MACD signals
    if (macd.histogram > 0 && macd.value > macd.signal) { bullishSignals += 2; }
    else if (macd.histogram < 0 && macd.value < macd.signal) { bearishSignals += 2; }
    totalWeight += 2;

    // Stochastic signals
    if (stoch.k < 20 && stoch.k > stoch.d) { bullishSignals += 1; }
    else if (stoch.k > 80 && stoch.k < stoch.d) { bearishSignals += 1; }
    totalWeight += 1;

    // ROC signals
    if (roc > 5) { bullishSignals += 1; }
    else if (roc < -5) { bearishSignals += 1; }
    totalWeight += 1;

    // ADX trend strength
    const trendStrength = adx > 25;
    if (trendStrength) {
      if (plusDI > minusDI) { bullishSignals += 2; }
      else { bearishSignals += 2; }
      totalWeight += 2;
    }

    const netSignal = bullishSignals - bearishSignals;
    const confidence = Math.min(Math.abs(netSignal) / totalWeight, 1);

    if (Math.abs(netSignal) < 2) return null;

    const strength: SignalStrength = 
      confidence > 0.7 ? 'strong' :
      confidence > 0.4 ? 'moderate' :
      confidence > 0.2 ? 'weak' : 'neutral';

    return {
      id: `mom_${symbol}_${Date.now()}`,
      symbol,
      type: 'momentum',
      direction: netSignal > 0 ? 'long' : 'short',
      strength,
      confidence,
      timeframe,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.getExpiryDuration(timeframe)),
      metadata: {
        rsi,
        macd,
        stochastic: stoch,
        roc,
        adx,
        plusDI,
        minusDI,
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

export const momentumSignalGenerator = new MomentumSignalGenerator();
