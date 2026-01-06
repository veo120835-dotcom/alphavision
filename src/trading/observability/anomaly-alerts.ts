// Anomaly Alerts - Detects unusual trading patterns

type AnomalyType = 
  | 'unusual_volume'
  | 'price_spike'
  | 'rapid_trades'
  | 'large_position'
  | 'high_loss'
  | 'pattern_break'
  | 'correlation_shift';

type Severity = 'info' | 'warning' | 'critical';

interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: Severity;
  symbol?: string;
  message: string;
  value: number;
  threshold: number;
  detectedAt: Date;
  acknowledged: boolean;
}

interface AnomalyConfig {
  volumeMultiplier: number;
  priceSpikePct: number;
  rapidTradeWindowMs: number;
  rapidTradeCount: number;
  largePositionPct: number;
  highLossThreshold: number;
}

class AnomalyAlerts {
  private config: AnomalyConfig = {
    volumeMultiplier: 5,
    priceSpikePct: 0.05,
    rapidTradeWindowMs: 60000,
    rapidTradeCount: 10,
    largePositionPct: 0.3,
    highLossThreshold: 5000
  };

  private anomalies: Anomaly[] = [];
  private tradeTimestamps: Date[] = [];
  private priceHistory: Map<string, number[]> = new Map();
  private listeners: Array<(anomaly: Anomaly) => void> = [];

  configure(config: Partial<AnomalyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  checkVolume(symbol: string, currentVolume: number, averageVolume: number): Anomaly | null {
    const ratio = currentVolume / averageVolume;
    
    if (ratio >= this.config.volumeMultiplier) {
      return this.createAnomaly({
        type: 'unusual_volume',
        severity: ratio > this.config.volumeMultiplier * 2 ? 'critical' : 'warning',
        symbol,
        message: `Volume ${ratio.toFixed(1)}x higher than average`,
        value: ratio,
        threshold: this.config.volumeMultiplier
      });
    }
    return null;
  }

  checkPriceSpike(symbol: string, currentPrice: number, previousPrice: number): Anomaly | null {
    const change = Math.abs(currentPrice - previousPrice) / previousPrice;
    
    if (change >= this.config.priceSpikePct) {
      const direction = currentPrice > previousPrice ? 'up' : 'down';
      return this.createAnomaly({
        type: 'price_spike',
        severity: change > this.config.priceSpikePct * 2 ? 'critical' : 'warning',
        symbol,
        message: `Price moved ${direction} ${(change * 100).toFixed(2)}%`,
        value: change,
        threshold: this.config.priceSpikePct
      });
    }
    return null;
  }

  recordTrade(): Anomaly | null {
    const now = new Date();
    this.tradeTimestamps.push(now);
    
    // Clean old timestamps
    const windowStart = new Date(now.getTime() - this.config.rapidTradeWindowMs);
    this.tradeTimestamps = this.tradeTimestamps.filter(t => t >= windowStart);
    
    if (this.tradeTimestamps.length >= this.config.rapidTradeCount) {
      return this.createAnomaly({
        type: 'rapid_trades',
        severity: 'warning',
        message: `${this.tradeTimestamps.length} trades in last ${this.config.rapidTradeWindowMs / 1000}s`,
        value: this.tradeTimestamps.length,
        threshold: this.config.rapidTradeCount
      });
    }
    return null;
  }

  checkPositionSize(symbol: string, positionValue: number, portfolioValue: number): Anomaly | null {
    const pct = positionValue / portfolioValue;
    
    if (pct >= this.config.largePositionPct) {
      return this.createAnomaly({
        type: 'large_position',
        severity: pct > 0.5 ? 'critical' : 'warning',
        symbol,
        message: `Position represents ${(pct * 100).toFixed(1)}% of portfolio`,
        value: pct,
        threshold: this.config.largePositionPct
      });
    }
    return null;
  }

  checkLoss(currentLoss: number): Anomaly | null {
    if (currentLoss >= this.config.highLossThreshold) {
      return this.createAnomaly({
        type: 'high_loss',
        severity: currentLoss > this.config.highLossThreshold * 2 ? 'critical' : 'warning',
        message: `Current loss $${currentLoss.toFixed(2)} exceeds threshold`,
        value: currentLoss,
        threshold: this.config.highLossThreshold
      });
    }
    return null;
  }

  private createAnomaly(data: Omit<Anomaly, 'id' | 'detectedAt' | 'acknowledged'>): Anomaly {
    const anomaly: Anomaly = {
      ...data,
      id: crypto.randomUUID(),
      detectedAt: new Date(),
      acknowledged: false
    };
    
    this.anomalies.push(anomaly);
    this.listeners.forEach(l => l(anomaly));
    
    // Keep last 500 anomalies
    if (this.anomalies.length > 500) {
      this.anomalies = this.anomalies.slice(-500);
    }
    
    return anomaly;
  }

  acknowledge(anomalyId: string): void {
    const anomaly = this.anomalies.find(a => a.id === anomalyId);
    if (anomaly) {
      anomaly.acknowledged = true;
    }
  }

  getUnacknowledged(): Anomaly[] {
    return this.anomalies.filter(a => !a.acknowledged);
  }

  getAnomalies(filter?: { type?: AnomalyType; severity?: Severity; since?: Date }): Anomaly[] {
    let filtered = [...this.anomalies];
    
    if (filter?.type) {
      filtered = filtered.filter(a => a.type === filter.type);
    }
    if (filter?.severity) {
      filtered = filtered.filter(a => a.severity === filter.severity);
    }
    if (filter?.since) {
      filtered = filtered.filter(a => a.detectedAt >= filter.since!);
    }
    
    return filtered;
  }

  onAnomaly(listener: (anomaly: Anomaly) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  clear(): void {
    this.anomalies = [];
    this.tradeTimestamps = [];
    this.priceHistory.clear();
  }
}

export const anomalyAlerts = new AnomalyAlerts();
