// Strategy Registry - Version Control for Strategies

import { Strategy, StrategyPerformance } from '../types';

interface StrategyVersion {
  strategy: Strategy;
  performance?: StrategyPerformance;
  promotedAt?: Date;
  demotedAt?: Date;
}

class StrategyRegistry {
  private strategies: Map<string, StrategyVersion[]> = new Map();
  private activeStrategies: Map<string, string> = new Map(); // strategyId -> versionId

  register(strategy: Strategy): void {
    const versions = this.strategies.get(strategy.id) || [];
    versions.push({ strategy });
    this.strategies.set(strategy.id, versions);
  }

  getLatestVersion(strategyId: string): Strategy | undefined {
    const versions = this.strategies.get(strategyId);
    if (!versions || versions.length === 0) return undefined;
    return versions[versions.length - 1].strategy;
  }

  getVersion(strategyId: string, version: number): Strategy | undefined {
    const versions = this.strategies.get(strategyId);
    return versions?.find(v => v.strategy.version === version)?.strategy;
  }

  getAllVersions(strategyId: string): Strategy[] {
    return this.strategies.get(strategyId)?.map(v => v.strategy) || [];
  }

  promote(strategyId: string, version: number): void {
    const versionData = this.strategies.get(strategyId)?.find(
      v => v.strategy.version === version
    );
    if (versionData) {
      versionData.promotedAt = new Date();
      versionData.strategy.status = 'live';
      this.activeStrategies.set(strategyId, `${strategyId}-v${version}`);
    }
  }

  demote(strategyId: string, version: number): void {
    const versionData = this.strategies.get(strategyId)?.find(
      v => v.strategy.version === version
    );
    if (versionData) {
      versionData.demotedAt = new Date();
      versionData.strategy.status = 'retired';
    }
  }

  recordPerformance(strategyId: string, version: number, performance: StrategyPerformance): void {
    const versionData = this.strategies.get(strategyId)?.find(
      v => v.strategy.version === version
    );
    if (versionData) {
      versionData.performance = performance;
    }
  }

  getActiveStrategies(): Strategy[] {
    const active: Strategy[] = [];
    this.strategies.forEach(versions => {
      const liveVersion = versions.find(v => v.strategy.status === 'live');
      if (liveVersion) active.push(liveVersion.strategy);
    });
    return active;
  }
}

export const strategyRegistry = new StrategyRegistry();
