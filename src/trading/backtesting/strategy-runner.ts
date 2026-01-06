// Strategy Runner - Executes strategies against historical data

import { OHLCV, Order, Trade, BacktestResult, Strategy } from '../types';
import { slippageModel } from './slippage-model';

export interface StrategySignal {
  action: 'buy' | 'sell' | 'hold';
  quantity?: number;
  price?: number;
  reason?: string;
}

export interface StrategyLogic {
  initialize?(context: BacktestContext): void;
  onBar(bar: OHLCV, context: BacktestContext): StrategySignal;
  onComplete?(context: BacktestContext): void;
}

export interface BacktestContext {
  symbol: string;
  position: number;
  cash: number;
  portfolio: number;
  bars: OHLCV[];
  currentIndex: number;
  trades: Trade[];
  parameters: Record<string, unknown>;
}

class StrategyRunner {
  run(
    strategy: Strategy,
    logic: StrategyLogic,
    data: OHLCV[],
    initialCapital: number = 100000
  ): BacktestResult {
    const context: BacktestContext = {
      symbol: 'BACKTEST',
      position: 0,
      cash: initialCapital,
      portfolio: initialCapital,
      bars: data,
      currentIndex: 0,
      trades: [],
      parameters: strategy.parameters
    };

    logic.initialize?.(context);

    for (let i = 0; i < data.length; i++) {
      context.currentIndex = i;
      const bar = data[i];
      
      const signal = logic.onBar(bar, context);
      
      if (signal.action !== 'hold') {
        this.executeSignal(signal, bar, context);
      }
      
      // Update portfolio value
      context.portfolio = context.cash + (context.position * bar.close);
    }

    logic.onComplete?.(context);

    return this.calculateResults(strategy.id, data, initialCapital, context);
  }

  private executeSignal(signal: StrategySignal, bar: OHLCV, context: BacktestContext): void {
    const quantity = signal.quantity || Math.floor(context.cash * 0.1 / bar.close);
    const slippage = slippageModel.calculate(bar.close, quantity, bar.volume);
    
    if (signal.action === 'buy' && context.cash >= quantity * bar.close) {
      const price = bar.close * (1 + slippage);
      const cost = quantity * price;
      const commission = cost * 0.001; // 0.1% commission
      
      context.cash -= (cost + commission);
      context.position += quantity;
      
      context.trades.push({
        id: crypto.randomUUID(),
        orderId: crypto.randomUUID(),
        symbol: context.symbol,
        side: 'buy',
        quantity,
        price,
        commission,
        executedAt: bar.timestamp
      });
    } else if (signal.action === 'sell' && context.position >= quantity) {
      const price = bar.close * (1 - slippage);
      const proceeds = quantity * price;
      const commission = proceeds * 0.001;
      
      context.cash += (proceeds - commission);
      context.position -= quantity;
      
      context.trades.push({
        id: crypto.randomUUID(),
        orderId: crypto.randomUUID(),
        symbol: context.symbol,
        side: 'sell',
        quantity,
        price,
        commission,
        executedAt: bar.timestamp
      });
    }
  }

  private calculateResults(
    strategyId: string,
    data: OHLCV[],
    initialCapital: number,
    context: BacktestContext
  ): BacktestResult {
    const finalCapital = context.portfolio;
    const totalReturn = (finalCapital - initialCapital) / initialCapital;
    const days = data.length;
    const annualizedReturn = Math.pow(1 + totalReturn, 365 / days) - 1;
    
    // Calculate drawdown
    let peak = initialCapital;
    let maxDrawdown = 0;
    let runningCapital = initialCapital;
    
    for (const trade of context.trades) {
      if (trade.side === 'buy') {
        runningCapital -= trade.quantity * trade.price + trade.commission;
      } else {
        runningCapital += trade.quantity * trade.price - trade.commission;
      }
      peak = Math.max(peak, runningCapital);
      const drawdown = (peak - runningCapital) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    // Win rate
    const winningTrades = context.trades.filter((t, i) => {
      if (t.side !== 'sell') return false;
      const buyTrade = context.trades.slice(0, i).reverse().find(bt => bt.side === 'buy');
      return buyTrade && t.price > buyTrade.price;
    });
    const sellTrades = context.trades.filter(t => t.side === 'sell');
    const winRate = sellTrades.length > 0 ? winningTrades.length / sellTrades.length : 0;

    return {
      strategyId,
      startDate: data[0].timestamp,
      endDate: data[data.length - 1].timestamp,
      initialCapital,
      finalCapital,
      totalReturn,
      annualizedReturn,
      sharpeRatio: this.calculateSharpe(context.trades, data),
      maxDrawdown,
      winRate,
      profitFactor: this.calculateProfitFactor(context.trades),
      totalTrades: context.trades.length,
      trades: context.trades
    };
  }

  private calculateSharpe(trades: Trade[], data: OHLCV[]): number {
    if (trades.length < 2) return 0;
    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].close - data[i-1].close) / data[i-1].close);
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    return stdDev > 0 ? (avgReturn * 252) / (stdDev * Math.sqrt(252)) : 0;
  }

  private calculateProfitFactor(trades: Trade[]): number {
    let grossProfit = 0;
    let grossLoss = 0;
    
    for (let i = 0; i < trades.length; i += 2) {
      if (i + 1 >= trades.length) break;
      const buy = trades[i];
      const sell = trades[i + 1];
      if (buy.side === 'buy' && sell.side === 'sell') {
        const pnl = (sell.price - buy.price) * sell.quantity;
        if (pnl > 0) grossProfit += pnl;
        else grossLoss += Math.abs(pnl);
      }
    }
    
    return grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  }
}

export const strategyRunner = new StrategyRunner();
