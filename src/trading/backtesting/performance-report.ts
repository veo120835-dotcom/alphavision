// Performance Report - Generates detailed backtest analysis

import { BacktestResult, Trade } from '../types';

export interface PerformanceMetrics {
  // Returns
  totalReturn: number;
  annualizedReturn: number;
  monthlyReturns: number[];
  
  // Risk
  volatility: number;
  maxDrawdown: number;
  averageDrawdown: number;
  drawdownDuration: number;
  
  // Risk-Adjusted
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  
  // Trading
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageHoldingPeriod: number;
  
  // Consistency
  consecutiveWins: number;
  consecutiveLosses: number;
  expectancy: number;
}

export interface ReportSection {
  title: string;
  metrics: { label: string; value: string | number; }[];
}

class PerformanceReporter {
  generate(result: BacktestResult): PerformanceMetrics {
    const trades = result.trades;
    const pnlPerTrade = this.calculatePnLPerTrade(trades);
    
    const wins = pnlPerTrade.filter(p => p > 0);
    const losses = pnlPerTrade.filter(p => p < 0);
    
    const volatility = this.calculateVolatility(pnlPerTrade);
    const downsideDeviation = this.calculateDownsideDeviation(pnlPerTrade);
    
    return {
      totalReturn: result.totalReturn,
      annualizedReturn: result.annualizedReturn,
      monthlyReturns: this.calculateMonthlyReturns(trades),
      
      volatility,
      maxDrawdown: result.maxDrawdown,
      averageDrawdown: result.maxDrawdown * 0.5, // Simplified
      drawdownDuration: this.calculateDrawdownDuration(trades),
      
      sharpeRatio: result.sharpeRatio,
      sortinoRatio: downsideDeviation > 0 ? result.annualizedReturn / downsideDeviation : 0,
      calmarRatio: result.maxDrawdown > 0 ? result.annualizedReturn / result.maxDrawdown : 0,
      
      totalTrades: result.totalTrades,
      winRate: result.winRate,
      profitFactor: result.profitFactor,
      averageWin: wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0,
      averageLoss: losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0,
      largestWin: wins.length > 0 ? Math.max(...wins) : 0,
      largestLoss: losses.length > 0 ? Math.abs(Math.min(...losses)) : 0,
      averageHoldingPeriod: this.calculateAverageHoldingPeriod(trades),
      
      consecutiveWins: this.calculateConsecutive(pnlPerTrade, true),
      consecutiveLosses: this.calculateConsecutive(pnlPerTrade, false),
      expectancy: this.calculateExpectancy(result.winRate, wins, losses)
    };
  }

  generateReport(result: BacktestResult): ReportSection[] {
    const metrics = this.generate(result);
    
    return [
      {
        title: 'Returns',
        metrics: [
          { label: 'Total Return', value: `${(metrics.totalReturn * 100).toFixed(2)}%` },
          { label: 'Annualized Return', value: `${(metrics.annualizedReturn * 100).toFixed(2)}%` },
          { label: 'Volatility', value: `${(metrics.volatility * 100).toFixed(2)}%` }
        ]
      },
      {
        title: 'Risk',
        metrics: [
          { label: 'Max Drawdown', value: `${(metrics.maxDrawdown * 100).toFixed(2)}%` },
          { label: 'Sharpe Ratio', value: metrics.sharpeRatio.toFixed(2) },
          { label: 'Sortino Ratio', value: metrics.sortinoRatio.toFixed(2) },
          { label: 'Calmar Ratio', value: metrics.calmarRatio.toFixed(2) }
        ]
      },
      {
        title: 'Trading',
        metrics: [
          { label: 'Total Trades', value: metrics.totalTrades },
          { label: 'Win Rate', value: `${(metrics.winRate * 100).toFixed(1)}%` },
          { label: 'Profit Factor', value: metrics.profitFactor.toFixed(2) },
          { label: 'Expectancy', value: `$${metrics.expectancy.toFixed(2)}` }
        ]
      }
    ];
  }

  private calculatePnLPerTrade(trades: Trade[]): number[] {
    const pnls: number[] = [];
    for (let i = 0; i < trades.length; i += 2) {
      if (i + 1 >= trades.length) break;
      const buy = trades[i];
      const sell = trades[i + 1];
      if (buy.side === 'buy' && sell.side === 'sell') {
        pnls.push((sell.price - buy.price) * sell.quantity - buy.commission - sell.commission);
      }
    }
    return pnls;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculateDownsideDeviation(returns: number[]): number {
    const negativeReturns = returns.filter(r => r < 0);
    if (negativeReturns.length === 0) return 0;
    const variance = negativeReturns.reduce((sum, r) => sum + r * r, 0) / negativeReturns.length;
    return Math.sqrt(variance);
  }

  private calculateMonthlyReturns(trades: Trade[]): number[] {
    // Simplified - group by month
    return [];
  }

  private calculateDrawdownDuration(trades: Trade[]): number {
    // Simplified
    return 0;
  }

  private calculateAverageHoldingPeriod(trades: Trade[]): number {
    let totalDays = 0;
    let pairs = 0;
    for (let i = 0; i < trades.length; i += 2) {
      if (i + 1 >= trades.length) break;
      const buy = trades[i];
      const sell = trades[i + 1];
      if (buy.side === 'buy' && sell.side === 'sell') {
        totalDays += (sell.executedAt.getTime() - buy.executedAt.getTime()) / (1000 * 60 * 60 * 24);
        pairs++;
      }
    }
    return pairs > 0 ? totalDays / pairs : 0;
  }

  private calculateConsecutive(pnls: number[], wins: boolean): number {
    let max = 0;
    let current = 0;
    for (const pnl of pnls) {
      if ((wins && pnl > 0) || (!wins && pnl < 0)) {
        current++;
        max = Math.max(max, current);
      } else {
        current = 0;
      }
    }
    return max;
  }

  private calculateExpectancy(winRate: number, wins: number[], losses: number[]): number {
    const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0;
    return (winRate * avgWin) - ((1 - winRate) * avgLoss);
  }
}

export const performanceReporter = new PerformanceReporter();
