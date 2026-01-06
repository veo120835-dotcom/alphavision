// Trading System Types

export interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
  openedAt: Date;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected';
  filledQuantity: number;
  averageFillPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  commission: number;
  executedAt: Date;
}

export interface Strategy {
  id: string;
  name: string;
  version: number;
  status: 'draft' | 'backtest' | 'paper' | 'live' | 'retired';
  parameters: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BacktestResult {
  strategyId: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  trades: Trade[];
}

export interface RiskLimits {
  maxPositionSize: number;
  maxPortfolioExposure: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  maxConcentration: number;
}

export interface MarketRegime {
  type: 'bull' | 'bear' | 'sideways' | 'volatile' | 'crisis';
  confidence: number;
  indicators: Record<string, number>;
  detectedAt: Date;
}

export interface StrategyPerformance {
  strategyId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  returns: number[];
  sharpeRatio: number;
  sortino: number;
  calmarRatio: number;
  beta: number;
  alpha: number;
}
