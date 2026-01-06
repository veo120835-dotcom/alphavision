// Trade Ledger - Immutable record of all trades

import { Trade, Order } from '../types';

interface LedgerEntry {
  id: string;
  timestamp: Date;
  type: 'order' | 'trade' | 'adjustment' | 'dividend' | 'fee';
  order?: Order;
  trade?: Trade;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  metadata?: Record<string, unknown>;
}

class TradeLedger {
  private entries: LedgerEntry[] = [];
  private currentBalance: number = 0;

  initialize(startingBalance: number): void {
    this.currentBalance = startingBalance;
    this.entries = [{
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: 'adjustment',
      description: 'Initial balance',
      balanceBefore: 0,
      balanceAfter: startingBalance
    }];
  }

  recordOrder(order: Order): LedgerEntry {
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: 'order',
      order,
      description: `${order.side.toUpperCase()} ${order.quantity} ${order.symbol} @ ${order.price || 'MARKET'}`,
      balanceBefore: this.currentBalance,
      balanceAfter: this.currentBalance
    };
    
    this.entries.push(entry);
    return entry;
  }

  recordTrade(trade: Trade): LedgerEntry {
    const balanceBefore = this.currentBalance;
    const tradeValue = trade.quantity * trade.price;
    
    if (trade.side === 'buy') {
      this.currentBalance -= (tradeValue + trade.commission);
    } else {
      this.currentBalance += (tradeValue - trade.commission);
    }

    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      timestamp: trade.executedAt,
      type: 'trade',
      trade,
      description: `FILLED: ${trade.side.toUpperCase()} ${trade.quantity} ${trade.symbol} @ ${trade.price.toFixed(2)}`,
      balanceBefore,
      balanceAfter: this.currentBalance
    };
    
    this.entries.push(entry);
    return entry;
  }

  recordAdjustment(amount: number, description: string): LedgerEntry {
    const balanceBefore = this.currentBalance;
    this.currentBalance += amount;

    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: 'adjustment',
      description,
      balanceBefore,
      balanceAfter: this.currentBalance
    };
    
    this.entries.push(entry);
    return entry;
  }

  recordDividend(symbol: string, amount: number): LedgerEntry {
    return this.recordAdjustment(amount, `Dividend: ${symbol} $${amount.toFixed(2)}`);
  }

  recordFee(description: string, amount: number): LedgerEntry {
    return this.recordAdjustment(-amount, `Fee: ${description} -$${amount.toFixed(2)}`);
  }

  getEntries(filter?: {
    type?: LedgerEntry['type'];
    symbol?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): LedgerEntry[] {
    let filtered = [...this.entries];

    if (filter?.type) {
      filtered = filtered.filter(e => e.type === filter.type);
    }
    if (filter?.symbol) {
      filtered = filtered.filter(e => 
        e.trade?.symbol === filter.symbol || e.order?.symbol === filter.symbol
      );
    }
    if (filter?.startDate) {
      filtered = filtered.filter(e => e.timestamp >= filter.startDate!);
    }
    if (filter?.endDate) {
      filtered = filtered.filter(e => e.timestamp <= filter.endDate!);
    }
    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  getBalance(): number {
    return this.currentBalance;
  }

  getTotalTrades(): number {
    return this.entries.filter(e => e.type === 'trade').length;
  }

  getTotalCommissions(): number {
    return this.entries
      .filter(e => e.type === 'trade' && e.trade)
      .reduce((sum, e) => sum + (e.trade?.commission || 0), 0);
  }

  export(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  // For audit purposes - entries cannot be modified
  verify(): boolean {
    let runningBalance = 0;
    
    for (const entry of this.entries) {
      if (entry.type === 'adjustment' && entry.balanceBefore === 0) {
        runningBalance = entry.balanceAfter;
        continue;
      }

      if (Math.abs(entry.balanceBefore - runningBalance) > 0.01) {
        console.error(`Ledger inconsistency at entry ${entry.id}`);
        return false;
      }
      
      runningBalance = entry.balanceAfter;
    }
    
    return Math.abs(runningBalance - this.currentBalance) < 0.01;
  }
}

export const tradeLedger = new TradeLedger();
