// Max Daily Loss - Tracks and enforces daily loss limits

import { killSwitch } from './kill-switch';

interface DailyLossConfig {
  maxDailyLoss: number;
  maxDailyLossPercent: number;
  warningThreshold: number;
  resetHour: number; // UTC hour to reset
}

interface DailyStats {
  date: string;
  startingValue: number;
  currentValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
  peakValue: number;
  trades: number;
}

class MaxDailyLoss {
  private config: DailyLossConfig = {
    maxDailyLoss: 5000,
    maxDailyLossPercent: 0.02,
    warningThreshold: 0.7,
    resetHour: 0
  };

  private stats: DailyStats = {
    date: new Date().toISOString().split('T')[0],
    startingValue: 100000,
    currentValue: 100000,
    realizedPnL: 0,
    unrealizedPnL: 0,
    peakValue: 100000,
    trades: 0
  };

  private listeners: Array<(stats: DailyStats, status: 'ok' | 'warning' | 'breach') => void> = [];

  configure(config: Partial<DailyLossConfig>): void {
    this.config = { ...this.config, ...config };
  }

  initializeDay(startingValue: number): void {
    const today = new Date().toISOString().split('T')[0];
    
    if (this.stats.date !== today) {
      this.stats = {
        date: today,
        startingValue,
        currentValue: startingValue,
        realizedPnL: 0,
        unrealizedPnL: 0,
        peakValue: startingValue,
        trades: 0
      };
    }
  }

  recordTrade(pnl: number): void {
    this.stats.realizedPnL += pnl;
    this.stats.trades++;
    this.checkLimits();
  }

  updateUnrealizedPnL(unrealizedPnL: number): void {
    this.stats.unrealizedPnL = unrealizedPnL;
    this.stats.currentValue = this.stats.startingValue + this.stats.realizedPnL + unrealizedPnL;
    
    if (this.stats.currentValue > this.stats.peakValue) {
      this.stats.peakValue = this.stats.currentValue;
    }
    
    this.checkLimits();
  }

  private checkLimits(): void {
    const totalLoss = this.stats.startingValue - this.stats.currentValue;
    const lossPercent = totalLoss / this.stats.startingValue;
    
    const absoluteBreached = totalLoss >= this.config.maxDailyLoss;
    const percentBreached = lossPercent >= this.config.maxDailyLossPercent;
    
    if (absoluteBreached || percentBreached) {
      killSwitch.activate(`Daily loss limit breached: $${totalLoss.toFixed(2)} (${(lossPercent * 100).toFixed(2)}%)`);
      this.notifyListeners('breach');
      return;
    }

    // Check warning threshold
    const warningLevel = this.config.maxDailyLoss * this.config.warningThreshold;
    if (totalLoss >= warningLevel) {
      this.notifyListeners('warning');
      return;
    }

    this.notifyListeners('ok');
  }

  private notifyListeners(status: 'ok' | 'warning' | 'breach'): void {
    this.listeners.forEach(l => l(this.stats, status));
  }

  onStatusChange(listener: (stats: DailyStats, status: 'ok' | 'warning' | 'breach') => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getStats(): DailyStats {
    return { ...this.stats };
  }

  getRemainingRisk(): number {
    const totalLoss = this.stats.startingValue - this.stats.currentValue;
    return Math.max(0, this.config.maxDailyLoss - totalLoss);
  }

  canTrade(): boolean {
    return !killSwitch.isActive() && this.getRemainingRisk() > 0;
  }
}

export const maxDailyLoss = new MaxDailyLoss();
