// Experiment Manager - A/B testing for strategies

import { Strategy, StrategyPerformance } from '../types';

interface Experiment {
  id: string;
  name: string;
  champion: Strategy;
  challenger: Strategy;
  status: 'running' | 'completed' | 'cancelled';
  startedAt: Date;
  endedAt?: Date;
  championAllocation: number; // 0-1
  results?: ExperimentResults;
}

interface ExperimentResults {
  championPerformance: StrategyPerformance;
  challengerPerformance: StrategyPerformance;
  winner: 'champion' | 'challenger' | 'tie';
  statisticalSignificance: number;
  recommendation: string;
}

class ExperimentManager {
  private experiments: Map<string, Experiment> = new Map();
  private performanceData: Map<string, number[]> = new Map(); // strategyId -> returns

  createExperiment(
    name: string,
    champion: Strategy,
    challenger: Strategy,
    championAllocation: number = 0.8
  ): Experiment {
    const experiment: Experiment = {
      id: crypto.randomUUID(),
      name,
      champion,
      challenger,
      status: 'running',
      startedAt: new Date(),
      championAllocation
    };
    
    this.experiments.set(experiment.id, experiment);
    return experiment;
  }

  recordReturn(experimentId: string, strategyId: string, returnValue: number): void {
    const key = `${experimentId}-${strategyId}`;
    const returns = this.performanceData.get(key) || [];
    returns.push(returnValue);
    this.performanceData.set(key, returns);
  }

  evaluateExperiment(experimentId: string): ExperimentResults | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const championReturns = this.performanceData.get(`${experimentId}-${experiment.champion.id}`) || [];
    const challengerReturns = this.performanceData.get(`${experimentId}-${experiment.challenger.id}`) || [];

    if (championReturns.length < 10 || challengerReturns.length < 10) {
      return null; // Not enough data
    }

    const championPerf = this.calculatePerformance(experiment.champion.id, championReturns);
    const challengerPerf = this.calculatePerformance(experiment.challenger.id, challengerReturns);

    const significance = this.calculateSignificance(championReturns, challengerReturns);
    
    let winner: 'champion' | 'challenger' | 'tie' = 'tie';
    let recommendation = 'Continue running experiment - results not conclusive';

    if (significance > 0.95) {
      if (challengerPerf.sharpeRatio > championPerf.sharpeRatio * 1.1) {
        winner = 'challenger';
        recommendation = 'Challenger significantly outperforms - consider promoting';
      } else if (championPerf.sharpeRatio > challengerPerf.sharpeRatio * 1.1) {
        winner = 'champion';
        recommendation = 'Champion remains superior - retire challenger';
      }
    }

    const results: ExperimentResults = {
      championPerformance: championPerf,
      challengerPerformance: challengerPerf,
      winner,
      statisticalSignificance: significance,
      recommendation
    };

    experiment.results = results;
    return results;
  }

  private calculatePerformance(strategyId: string, returns: number[]): StrategyPerformance {
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    const negativeReturns = returns.filter(r => r < 0);
    const downsideVariance = negativeReturns.length > 0
      ? negativeReturns.reduce((sum, r) => sum + r * r, 0) / negativeReturns.length
      : 0;
    const downsideDev = Math.sqrt(downsideVariance);

    return {
      strategyId,
      period: 'daily',
      returns,
      sharpeRatio: stdDev > 0 ? (avgReturn * 252) / (stdDev * Math.sqrt(252)) : 0,
      sortino: downsideDev > 0 ? (avgReturn * 252) / (downsideDev * Math.sqrt(252)) : 0,
      calmarRatio: 0, // Would need drawdown
      beta: 1,
      alpha: avgReturn * 252
    };
  }

  private calculateSignificance(returns1: number[], returns2: number[]): number {
    // Simplified t-test
    const n1 = returns1.length;
    const n2 = returns2.length;
    const mean1 = returns1.reduce((a, b) => a + b, 0) / n1;
    const mean2 = returns2.reduce((a, b) => a + b, 0) / n2;
    
    const var1 = returns1.reduce((sum, r) => sum + Math.pow(r - mean1, 2), 0) / (n1 - 1);
    const var2 = returns2.reduce((sum, r) => sum + Math.pow(r - mean2, 2), 0) / (n2 - 1);
    
    const pooledSE = Math.sqrt(var1 / n1 + var2 / n2);
    const t = Math.abs(mean1 - mean2) / pooledSE;
    
    // Approximate p-value (simplified)
    const df = Math.min(n1, n2) - 1;
    const pValue = Math.exp(-0.5 * t * t / df);
    
    return 1 - pValue;
  }

  completeExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.status = 'completed';
      experiment.endedAt = new Date();
      this.evaluateExperiment(experimentId);
    }
  }

  getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  getRunningExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).filter(e => e.status === 'running');
  }

  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }
}

export const experimentManager = new ExperimentManager();
