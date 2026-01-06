// Promotion Policy - Rules for promoting/demoting strategies

import { Strategy, StrategyPerformance } from '../types';
import { strategyRegistry } from './strategy-registry';
import { experimentManager } from './experiment-manager';

interface PromotionCriteria {
  minSharpeRatio: number;
  minWinRate: number;
  minTradeCount: number;
  maxDrawdown: number;
  minProfitFactor: number;
  minBacktestPeriodDays: number;
  minPaperTradeDays: number;
  requiredExperimentWins: number;
}

interface PromotionDecision {
  strategyId: string;
  currentStatus: Strategy['status'];
  targetStatus: Strategy['status'];
  approved: boolean;
  reason: string;
  metrics: Record<string, number>;
  requirements: Record<string, { met: boolean; value: number; required: number }>;
}

class PromotionPolicy {
  private criteria: PromotionCriteria = {
    minSharpeRatio: 1.0,
    minWinRate: 0.45,
    minTradeCount: 30,
    maxDrawdown: 0.15,
    minProfitFactor: 1.2,
    minBacktestPeriodDays: 252,
    minPaperTradeDays: 30,
    requiredExperimentWins: 1
  };

  configure(criteria: Partial<PromotionCriteria>): void {
    this.criteria = { ...this.criteria, ...criteria };
  }

  evaluatePromotion(
    strategy: Strategy,
    performance: StrategyPerformance,
    backtestDays: number,
    paperTradeDays: number
  ): PromotionDecision {
    const requirements: Record<string, { met: boolean; value: number; required: number }> = {};

    // Check Sharpe ratio
    requirements.sharpeRatio = {
      met: performance.sharpeRatio >= this.criteria.minSharpeRatio,
      value: performance.sharpeRatio,
      required: this.criteria.minSharpeRatio
    };

    // Check trade count
    const tradeCount = performance.returns.length;
    requirements.tradeCount = {
      met: tradeCount >= this.criteria.minTradeCount,
      value: tradeCount,
      required: this.criteria.minTradeCount
    };

    // Check profit factor (simplified from Sortino)
    requirements.profitFactor = {
      met: performance.sortino >= this.criteria.minProfitFactor,
      value: performance.sortino,
      required: this.criteria.minProfitFactor
    };

    // Check backtest period
    requirements.backtestPeriod = {
      met: backtestDays >= this.criteria.minBacktestPeriodDays,
      value: backtestDays,
      required: this.criteria.minBacktestPeriodDays
    };

    // Check paper trade period (if promoting to live)
    if (strategy.status === 'paper') {
      requirements.paperTradePeriod = {
        met: paperTradeDays >= this.criteria.minPaperTradeDays,
        value: paperTradeDays,
        required: this.criteria.minPaperTradeDays
      };
    }

    // Check experiment results
    const experiments = experimentManager.getAllExperiments()
      .filter(e => 
        e.status === 'completed' && 
        e.results?.winner === 'challenger' &&
        e.challenger.id === strategy.id
      );
    
    requirements.experimentWins = {
      met: experiments.length >= this.criteria.requiredExperimentWins,
      value: experiments.length,
      required: this.criteria.requiredExperimentWins
    };

    // Determine if all requirements are met
    const allMet = Object.values(requirements).every(r => r.met);
    
    let targetStatus: Strategy['status'] = strategy.status;
    let reason = '';

    if (allMet) {
      // Determine next status
      switch (strategy.status) {
        case 'draft':
          targetStatus = 'backtest';
          reason = 'Ready for backtesting';
          break;
        case 'backtest':
          targetStatus = 'paper';
          reason = 'Backtest criteria met - ready for paper trading';
          break;
        case 'paper':
          targetStatus = 'live';
          reason = 'All criteria met - approved for live trading';
          break;
      }
    } else {
      const failedReqs = Object.entries(requirements)
        .filter(([, r]) => !r.met)
        .map(([name, r]) => `${name}: ${r.value.toFixed(2)} < ${r.required}`);
      reason = `Requirements not met: ${failedReqs.join(', ')}`;
    }

    return {
      strategyId: strategy.id,
      currentStatus: strategy.status,
      targetStatus,
      approved: allMet,
      reason,
      metrics: {
        sharpeRatio: performance.sharpeRatio,
        sortino: performance.sortino,
        calmar: performance.calmarRatio,
        tradeCount
      },
      requirements
    };
  }

  executePromotion(decision: PromotionDecision): void {
    if (!decision.approved) {
      console.warn(`[PROMOTION] Not approved: ${decision.reason}`);
      return;
    }

    if (decision.targetStatus === 'live') {
      strategyRegistry.promote(decision.strategyId, 1); // Simplified version handling
    }
    
    console.log(`[PROMOTION] ${decision.strategyId}: ${decision.currentStatus} -> ${decision.targetStatus}`);
  }

  evaluateDemotion(
    strategy: Strategy,
    performance: StrategyPerformance
  ): { shouldDemote: boolean; reason: string } {
    // Check for demotion criteria
    if (performance.sharpeRatio < 0) {
      return { 
        shouldDemote: true, 
        reason: 'Negative Sharpe ratio - strategy is losing money on risk-adjusted basis' 
      };
    }

    // Check for severe drawdown (simplified)
    if (performance.calmarRatio < 0.5) {
      return {
        shouldDemote: true,
        reason: 'Calmar ratio below threshold - excessive drawdown relative to returns'
      };
    }

    // Check for degrading performance
    const recentReturns = performance.returns.slice(-10);
    const olderReturns = performance.returns.slice(-30, -10);
    
    if (recentReturns.length >= 10 && olderReturns.length >= 10) {
      const recentAvg = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
      const olderAvg = olderReturns.reduce((a, b) => a + b, 0) / olderReturns.length;
      
      if (recentAvg < olderAvg * 0.5) {
        return {
          shouldDemote: true,
          reason: 'Performance degradation - recent returns significantly below historical'
        };
      }
    }

    return { shouldDemote: false, reason: '' };
  }

  executeDemotion(strategyId: string, version: number): void {
    strategyRegistry.demote(strategyId, version);
    console.log(`[DEMOTION] Strategy ${strategyId} v${version} demoted`);
  }

  getCriteria(): PromotionCriteria {
    return { ...this.criteria };
  }
}

export const promotionPolicy = new PromotionPolicy();
