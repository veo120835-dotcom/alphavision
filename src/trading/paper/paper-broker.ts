// Paper Broker - Simulated brokerage for paper trading

import { Order, Position, Trade } from '../types';
import { orderSimulator } from './order-simulator';
import { fillsEngine } from './fills-engine';

export interface PaperAccount {
  id: string;
  cash: number;
  positions: Map<string, Position>;
  orders: Order[];
  trades: Trade[];
  createdAt: Date;
}

class PaperBroker {
  private accounts: Map<string, PaperAccount> = new Map();
  private prices: Map<string, number> = new Map();

  createAccount(initialCash: number = 100000): PaperAccount {
    const account: PaperAccount = {
      id: crypto.randomUUID(),
      cash: initialCash,
      positions: new Map(),
      orders: [],
      trades: [],
      createdAt: new Date()
    };
    this.accounts.set(account.id, account);
    return account;
  }

  getAccount(accountId: string): PaperAccount | undefined {
    return this.accounts.get(accountId);
  }

  updatePrice(symbol: string, price: number): void {
    this.prices.set(symbol, price);
    this.processOpenOrders(symbol, price);
  }

  submitOrder(accountId: string, order: Omit<Order, 'id' | 'status' | 'filledQuantity' | 'createdAt' | 'updatedAt'>): Order | null {
    const account = this.accounts.get(accountId);
    if (!account) return null;

    const newOrder: Order = {
      ...order,
      id: crypto.randomUUID(),
      status: 'pending',
      filledQuantity: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate order
    if (order.side === 'buy') {
      const estimatedCost = order.quantity * (order.price || this.prices.get(order.symbol) || 0);
      if (estimatedCost > account.cash) {
        newOrder.status = 'rejected';
        account.orders.push(newOrder);
        return newOrder;
      }
    } else {
      const position = account.positions.get(order.symbol);
      if (!position || position.quantity < order.quantity) {
        newOrder.status = 'rejected';
        account.orders.push(newOrder);
        return newOrder;
      }
    }

    newOrder.status = 'open';
    account.orders.push(newOrder);

    // Try immediate fill for market orders
    if (order.type === 'market') {
      const price = this.prices.get(order.symbol);
      if (price) {
        this.fillOrder(account, newOrder, price);
      }
    }

    return newOrder;
  }

  cancelOrder(accountId: string, orderId: string): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    const order = account.orders.find(o => o.id === orderId);
    if (!order || order.status !== 'open') return false;

    order.status = 'cancelled';
    order.updatedAt = new Date();
    return true;
  }

  private processOpenOrders(symbol: string, price: number): void {
    this.accounts.forEach(account => {
      const openOrders = account.orders.filter(
        o => o.status === 'open' && o.symbol === symbol
      );

      openOrders.forEach(order => {
        const shouldFill = orderSimulator.shouldFill(order, price);
        if (shouldFill) {
          this.fillOrder(account, order, price);
        }
      });
    });
  }

  private fillOrder(account: PaperAccount, order: Order, price: number): void {
    const fill = fillsEngine.generateFill(order, price);
    
    order.filledQuantity = order.quantity;
    order.averageFillPrice = fill.price;
    order.status = 'filled';
    order.updatedAt = new Date();

    const trade: Trade = {
      id: crypto.randomUUID(),
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: fill.quantity,
      price: fill.price,
      commission: fill.commission,
      executedAt: new Date()
    };
    account.trades.push(trade);

    // Update position
    this.updatePosition(account, trade);
    
    // Update cash
    if (order.side === 'buy') {
      account.cash -= (fill.quantity * fill.price + fill.commission);
    } else {
      account.cash += (fill.quantity * fill.price - fill.commission);
    }
  }

  private updatePosition(account: PaperAccount, trade: Trade): void {
    const existing = account.positions.get(trade.symbol);
    
    if (trade.side === 'buy') {
      if (existing) {
        const totalQuantity = existing.quantity + trade.quantity;
        const totalCost = existing.averagePrice * existing.quantity + trade.price * trade.quantity;
        existing.averagePrice = totalCost / totalQuantity;
        existing.quantity = totalQuantity;
        existing.currentPrice = trade.price;
      } else {
        account.positions.set(trade.symbol, {
          symbol: trade.symbol,
          quantity: trade.quantity,
          averagePrice: trade.price,
          currentPrice: trade.price,
          unrealizedPnL: 0,
          realizedPnL: 0,
          openedAt: trade.executedAt
        });
      }
    } else {
      if (existing) {
        const pnl = (trade.price - existing.averagePrice) * trade.quantity;
        existing.realizedPnL += pnl;
        existing.quantity -= trade.quantity;
        if (existing.quantity <= 0) {
          account.positions.delete(trade.symbol);
        }
      }
    }
  }

  getPortfolioValue(accountId: string): number {
    const account = this.accounts.get(accountId);
    if (!account) return 0;

    let value = account.cash;
    account.positions.forEach(position => {
      const price = this.prices.get(position.symbol) || position.currentPrice;
      value += position.quantity * price;
    });
    return value;
  }
}

export const paperBroker = new PaperBroker();
