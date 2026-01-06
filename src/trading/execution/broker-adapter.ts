// Broker Adapter - Interface for real brokerages

import { Order, Position, Trade } from '../types';

export interface BrokerCredentials {
  apiKey: string;
  apiSecret: string;
  environment: 'paper' | 'live';
}

export interface BrokerAdapter {
  name: string;
  connect(credentials: BrokerCredentials): Promise<boolean>;
  disconnect(): Promise<void>;
  
  // Account
  getBalance(): Promise<number>;
  getPositions(): Promise<Position[]>;
  
  // Orders
  submitOrder(order: Omit<Order, 'id' | 'status' | 'filledQuantity' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  cancelOrder(orderId: string): Promise<boolean>;
  getOrder(orderId: string): Promise<Order | null>;
  getOpenOrders(): Promise<Order[]>;
  
  // Market Data
  getQuote(symbol: string): Promise<{ bid: number; ask: number; last: number }>;
  
  // Events
  onOrderUpdate(callback: (order: Order) => void): void;
  onTradeExecution(callback: (trade: Trade) => void): void;
}

// Mock implementation for development
class MockBrokerAdapter implements BrokerAdapter {
  name = 'mock';
  private connected = false;
  private balance = 100000;
  private positions: Position[] = [];
  private orders: Order[] = [];
  private orderCallbacks: Array<(order: Order) => void> = [];
  private tradeCallbacks: Array<(trade: Trade) => void> = [];

  async connect(_credentials: BrokerCredentials): Promise<boolean> {
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getBalance(): Promise<number> {
    return this.balance;
  }

  async getPositions(): Promise<Position[]> {
    return this.positions;
  }

  async submitOrder(orderData: Omit<Order, 'id' | 'status' | 'filledQuantity' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const order: Order = {
      ...orderData,
      id: crypto.randomUUID(),
      status: 'open',
      filledQuantity: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.push(order);
    
    // Simulate immediate fill for market orders
    if (order.type === 'market') {
      setTimeout(() => this.simulateFill(order), 100);
    }
    
    return order;
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.find(o => o.id === orderId);
    if (order && order.status === 'open') {
      order.status = 'cancelled';
      this.orderCallbacks.forEach(cb => cb(order));
      return true;
    }
    return false;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return this.orders.find(o => o.id === orderId) || null;
  }

  async getOpenOrders(): Promise<Order[]> {
    return this.orders.filter(o => o.status === 'open');
  }

  async getQuote(symbol: string): Promise<{ bid: number; ask: number; last: number }> {
    const basePrice = 100 + Math.random() * 50;
    return {
      bid: basePrice - 0.05,
      ask: basePrice + 0.05,
      last: basePrice
    };
  }

  onOrderUpdate(callback: (order: Order) => void): void {
    this.orderCallbacks.push(callback);
  }

  onTradeExecution(callback: (trade: Trade) => void): void {
    this.tradeCallbacks.push(callback);
  }

  private simulateFill(order: Order): void {
    order.status = 'filled';
    order.filledQuantity = order.quantity;
    order.averageFillPrice = order.price || 100;
    order.updatedAt = new Date();
    
    this.orderCallbacks.forEach(cb => cb(order));
    
    const trade: Trade = {
      id: crypto.randomUUID(),
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.averageFillPrice,
      commission: order.quantity * order.averageFillPrice * 0.001,
      executedAt: new Date()
    };
    this.tradeCallbacks.forEach(cb => cb(trade));
  }
}

export const mockBroker = new MockBrokerAdapter();
