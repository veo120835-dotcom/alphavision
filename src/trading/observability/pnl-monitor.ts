// PnL Monitor - Real-time profit and loss tracking

import { Trade, Position } from '../types';

interface PnLSnapshot {
  timestamp: Date;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  bySymbol: Record<string, { realized: number; unrealized: number }>;
}

interface PnLConfig {
  snapshotInterval: number; // milliseconds
  alertThreshold: number;
  targetProfit?: number;
}

class PnLMonitor {
  private config: PnLConfig = {
    snapshotInterval: 60000, // 1 minute
    alertThreshold: -1000
  };

  private realizedPnL: Map<string, number> = new Map();
  private positions: Map<string, Position> = new Map();
  private snapshots: PnLSnapshot[] = [];
  private intervalId?: ReturnType<typeof setInterval>;
  private listeners: Array<(snapshot: PnLSnapshot) => void> = [];

  configure(config: Partial<PnLConfig>): void {
    this.config = { ...this.config, ...config };
  }

  start(): void {
    this.takeSnapshot();
    this.intervalId = setInterval(() => this.takeSnapshot(), this.config.snapshotInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  recordTrade(trade: Trade, entryPrice: number): void {
    if (trade.side === 'sell') {
      const pnl = (trade.price - entryPrice) * trade.quantity - trade.commission;
      const current = this.realizedPnL.get(trade.symbol) || 0;
      this.realizedPnL.set(trade.symbol, current + pnl);
    }
  }

  updatePosition(position: Position): void {
    this.positions.set(position.symbol, position);
  }

  removePosition(symbol: string): void {
    this.positions.delete(symbol);
  }

  private takeSnapshot(): void {
    const bySymbol: Record<string, { realized: number; unrealized: number }> = {};
    
    let totalRealized = 0;
    let totalUnrealized = 0;

    // Realized PnL
    this.realizedPnL.forEach((pnl, symbol) => {
      bySymbol[symbol] = { realized: pnl, unrealized: 0 };
      totalRealized += pnl;
    });

    // Unrealized PnL
    this.positions.forEach((position, symbol) => {
      const unrealized = position.unrealizedPnL;
      if (!bySymbol[symbol]) {
        bySymbol[symbol] = { realized: 0, unrealized };
      } else {
        bySymbol[symbol].unrealized = unrealized;
      }
      totalUnrealized += unrealized;
    });

    const snapshot: PnLSnapshot = {
      timestamp: new Date(),
      realizedPnL: totalRealized,
      unrealizedPnL: totalUnrealized,
      totalPnL: totalRealized + totalUnrealized,
      bySymbol
    };

    this.snapshots.push(snapshot);
    
    // Keep last 1000 snapshots
    if (this.snapshots.length > 1000) {
      this.snapshots = this.snapshots.slice(-1000);
    }

    // Check alert threshold
    if (snapshot.totalPnL <= this.config.alertThreshold) {
      console.warn(`[PnL ALERT] Total PnL (${snapshot.totalPnL}) below threshold (${this.config.alertThreshold})`);
    }

    // Check target profit
    if (this.config.targetProfit && snapshot.totalPnL >= this.config.targetProfit) {
      console.log(`[PnL TARGET] Target profit reached: ${snapshot.totalPnL}`);
    }

    this.listeners.forEach(l => l(snapshot));
  }

  getCurrentPnL(): PnLSnapshot {
    this.takeSnapshot();
    return this.snapshots[this.snapshots.length - 1];
  }

  getSnapshots(since?: Date): PnLSnapshot[] {
    if (!since) return [...this.snapshots];
    return this.snapshots.filter(s => s.timestamp >= since);
  }

  getRealizedPnL(symbol?: string): number {
    if (symbol) {
      return this.realizedPnL.get(symbol) || 0;
    }
    let total = 0;
    this.realizedPnL.forEach(pnl => total += pnl);
    return total;
  }

  getUnrealizedPnL(symbol?: string): number {
    if (symbol) {
      return this.positions.get(symbol)?.unrealizedPnL || 0;
    }
    let total = 0;
    this.positions.forEach(p => total += p.unrealizedPnL);
    return total;
  }

  onSnapshot(listener: (snapshot: PnLSnapshot) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  reset(): void {
    this.realizedPnL.clear();
    this.positions.clear();
    this.snapshots = [];
  }
}

export const pnlMonitor = new PnLMonitor();
