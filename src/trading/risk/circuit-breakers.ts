// Circuit Breakers - Automatic trading halts on anomalies

import { killSwitch } from './kill-switch';

type CircuitBreakerType = 'volatility' | 'data_quality' | 'latency' | 'error_rate' | 'volume';

interface CircuitBreakerConfig {
  volatilityThreshold: number;
  dataQualityMinFreshness: number; // seconds
  maxLatencyMs: number;
  errorRateThreshold: number;
  volumeAnomalyMultiplier: number;
  cooldownPeriodMs: number;
}

interface CircuitBreakerState {
  type: CircuitBreakerType;
  triggered: boolean;
  triggeredAt?: Date;
  value: number;
  threshold: number;
  cooldownUntil?: Date;
}

class CircuitBreakers {
  private config: CircuitBreakerConfig = {
    volatilityThreshold: 0.1,        // 10% intraday move
    dataQualityMinFreshness: 60,     // 60 seconds max stale data
    maxLatencyMs: 5000,              // 5 second max latency
    errorRateThreshold: 0.1,         // 10% error rate
    volumeAnomalyMultiplier: 10,     // 10x normal volume
    cooldownPeriodMs: 300000         // 5 minute cooldown
  };

  private states: Map<CircuitBreakerType, CircuitBreakerState> = new Map();
  private errorCounts: { errors: number; total: number; window: number[] } = { errors: 0, total: 0, window: [] };
  private listeners: Array<(state: CircuitBreakerState) => void> = [];

  configure(config: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  checkVolatility(currentPrice: number, openPrice: number): boolean {
    const move = Math.abs(currentPrice - openPrice) / openPrice;
    
    const state: CircuitBreakerState = {
      type: 'volatility',
      triggered: move >= this.config.volatilityThreshold,
      value: move,
      threshold: this.config.volatilityThreshold
    };

    if (state.triggered) {
      state.triggeredAt = new Date();
      state.cooldownUntil = new Date(Date.now() + this.config.cooldownPeriodMs);
      this.triggerBreaker(state);
    }

    this.states.set('volatility', state);
    return state.triggered;
  }

  checkDataQuality(lastUpdateTimestamp: Date): boolean {
    const staleness = (Date.now() - lastUpdateTimestamp.getTime()) / 1000;
    
    const state: CircuitBreakerState = {
      type: 'data_quality',
      triggered: staleness >= this.config.dataQualityMinFreshness,
      value: staleness,
      threshold: this.config.dataQualityMinFreshness
    };

    if (state.triggered) {
      state.triggeredAt = new Date();
      this.triggerBreaker(state);
    }

    this.states.set('data_quality', state);
    return state.triggered;
  }

  checkLatency(latencyMs: number): boolean {
    const state: CircuitBreakerState = {
      type: 'latency',
      triggered: latencyMs >= this.config.maxLatencyMs,
      value: latencyMs,
      threshold: this.config.maxLatencyMs
    };

    if (state.triggered) {
      state.triggeredAt = new Date();
      this.triggerBreaker(state);
    }

    this.states.set('latency', state);
    return state.triggered;
  }

  recordOperation(success: boolean): void {
    this.errorCounts.total++;
    if (!success) this.errorCounts.errors++;
    this.errorCounts.window.push(success ? 0 : 1);
    
    // Keep rolling window of last 100 operations
    if (this.errorCounts.window.length > 100) {
      const removed = this.errorCounts.window.shift();
      if (removed) this.errorCounts.errors--;
      this.errorCounts.total--;
    }

    this.checkErrorRate();
  }

  private checkErrorRate(): void {
    if (this.errorCounts.total < 10) return; // Need minimum sample
    
    const errorRate = this.errorCounts.errors / this.errorCounts.total;
    
    const state: CircuitBreakerState = {
      type: 'error_rate',
      triggered: errorRate >= this.config.errorRateThreshold,
      value: errorRate,
      threshold: this.config.errorRateThreshold
    };

    if (state.triggered) {
      state.triggeredAt = new Date();
      state.cooldownUntil = new Date(Date.now() + this.config.cooldownPeriodMs);
      this.triggerBreaker(state);
    }

    this.states.set('error_rate', state);
  }

  checkVolume(currentVolume: number, averageVolume: number): boolean {
    const volumeRatio = currentVolume / averageVolume;
    
    const state: CircuitBreakerState = {
      type: 'volume',
      triggered: volumeRatio >= this.config.volumeAnomalyMultiplier,
      value: volumeRatio,
      threshold: this.config.volumeAnomalyMultiplier
    };

    if (state.triggered) {
      state.triggeredAt = new Date();
      state.cooldownUntil = new Date(Date.now() + this.config.cooldownPeriodMs);
      this.triggerBreaker(state);
    }

    this.states.set('volume', state);
    return state.triggered;
  }

  private triggerBreaker(state: CircuitBreakerState): void {
    console.warn(`[CIRCUIT BREAKER] ${state.type} triggered: ${state.value} >= ${state.threshold}`);
    killSwitch.activate(`Circuit breaker: ${state.type}`);
    this.listeners.forEach(l => l(state));
  }

  isTriggered(type?: CircuitBreakerType): boolean {
    if (type) {
      return this.states.get(type)?.triggered || false;
    }
    return Array.from(this.states.values()).some(s => s.triggered);
  }

  getState(type: CircuitBreakerType): CircuitBreakerState | undefined {
    return this.states.get(type);
  }

  getAllStates(): CircuitBreakerState[] {
    return Array.from(this.states.values());
  }

  reset(type?: CircuitBreakerType): void {
    if (type) {
      this.states.delete(type);
    } else {
      this.states.clear();
      this.errorCounts = { errors: 0, total: 0, window: [] };
    }
  }

  onTrigger(listener: (state: CircuitBreakerState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const circuitBreakers = new CircuitBreakers();
