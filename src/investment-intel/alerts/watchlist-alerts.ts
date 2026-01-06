import { Asset, Signal, PriceAlert, Opportunity } from '../types';

export type AlertType = 
  | 'price-target'
  | 'signal-generated'
  | 'opportunity-found'
  | 'risk-threshold'
  | 'volatility-spike'
  | 'volume-surge'
  | 'earnings-upcoming'
  | 'thesis-invalidated';

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';

export interface WatchlistAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  symbol: string;
  title: string;
  message: string;
  createdAt: Date;
  expiresAt?: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  metadata: Record<string, unknown>;
}

export interface AlertCondition {
  id: string;
  symbol: string;
  type: AlertType;
  condition: {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | 'crosses-above' | 'crosses-below';
    value: number;
  };
  enabled: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  repeatInterval?: number; // ms before re-triggering
}

export class WatchlistAlertManager {
  private alerts: WatchlistAlert[] = [];
  private conditions: AlertCondition[] = [];
  private subscribers: ((alert: WatchlistAlert) => void)[] = [];

  subscribe(callback: (alert: WatchlistAlert) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  private notify(alert: WatchlistAlert): void {
    for (const subscriber of this.subscribers) {
      subscriber(alert);
    }
  }

  createCondition(condition: Omit<AlertCondition, 'id' | 'createdAt'>): AlertCondition {
    const alertCondition: AlertCondition = {
      ...condition,
      id: `cond_${Date.now()}`,
      createdAt: new Date(),
    };
    this.conditions.push(alertCondition);
    return alertCondition;
  }

  removeCondition(conditionId: string): boolean {
    const index = this.conditions.findIndex(c => c.id === conditionId);
    if (index === -1) return false;
    this.conditions.splice(index, 1);
    return true;
  }

  checkPriceConditions(symbol: string, currentPrice: number, previousPrice: number): void {
    const relevantConditions = this.conditions.filter(
      c => c.symbol === symbol && c.enabled && c.type === 'price-target'
    );

    for (const condition of relevantConditions) {
      if (this.shouldTrigger(condition, currentPrice, previousPrice)) {
        this.triggerAlert(condition, currentPrice);
      }
    }
  }

  private shouldTrigger(condition: AlertCondition, currentValue: number, previousValue: number): boolean {
    // Check repeat interval
    if (condition.lastTriggered && condition.repeatInterval) {
      const elapsed = Date.now() - condition.lastTriggered.getTime();
      if (elapsed < condition.repeatInterval) return false;
    }

    const { operator, value } = condition.condition;

    switch (operator) {
      case '>':
        return currentValue > value;
      case '<':
        return currentValue < value;
      case '>=':
        return currentValue >= value;
      case '<=':
        return currentValue <= value;
      case '==':
        return Math.abs(currentValue - value) < 0.001;
      case 'crosses-above':
        return previousValue < value && currentValue >= value;
      case 'crosses-below':
        return previousValue > value && currentValue <= value;
      default:
        return false;
    }
  }

  private triggerAlert(condition: AlertCondition, currentValue: number): void {
    condition.lastTriggered = new Date();

    const alert: WatchlistAlert = {
      id: `alert_${Date.now()}`,
      type: condition.type,
      priority: 'high',
      symbol: condition.symbol,
      title: `${condition.symbol} ${condition.condition.operator} ${condition.condition.value}`,
      message: `${condition.symbol} ${condition.condition.metric} is now ${currentValue.toFixed(2)} (${condition.condition.operator} ${condition.condition.value})`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      acknowledged: false,
      metadata: {
        conditionId: condition.id,
        currentValue,
        threshold: condition.condition.value,
      },
    };

    this.alerts.push(alert);
    this.notify(alert);
  }

  alertOnSignal(signal: Signal): WatchlistAlert {
    const priority: AlertPriority = 
      signal.strength === 'strong' ? 'high' :
      signal.strength === 'moderate' ? 'medium' : 'low';

    const alert: WatchlistAlert = {
      id: `alert_${Date.now()}`,
      type: 'signal-generated',
      priority,
      symbol: signal.symbol,
      title: `${signal.strength.toUpperCase()} ${signal.direction} signal on ${signal.symbol}`,
      message: `${signal.type} signal detected with ${(signal.confidence * 100).toFixed(0)}% confidence`,
      createdAt: new Date(),
      expiresAt: signal.expiresAt,
      acknowledged: false,
      metadata: { signal },
    };

    this.alerts.push(alert);
    this.notify(alert);
    return alert;
  }

  alertOnOpportunity(opportunity: Opportunity): WatchlistAlert {
    const priority: AlertPriority = 
      opportunity.opportunityScore >= 75 ? 'critical' :
      opportunity.opportunityScore >= 60 ? 'high' :
      opportunity.opportunityScore >= 45 ? 'medium' : 'low';

    const alert: WatchlistAlert = {
      id: `alert_${Date.now()}`,
      type: 'opportunity-found',
      priority,
      symbol: opportunity.symbol,
      title: `New opportunity: ${opportunity.symbol} (Score: ${opportunity.opportunityScore.toFixed(0)})`,
      message: opportunity.thesis.summary,
      createdAt: new Date(),
      acknowledged: false,
      metadata: { opportunityId: opportunity.id },
    };

    this.alerts.push(alert);
    this.notify(alert);
    return alert;
  }

  alertOnRiskThreshold(symbol: string, riskLevel: number, threshold: number): WatchlistAlert {
    const alert: WatchlistAlert = {
      id: `alert_${Date.now()}`,
      type: 'risk-threshold',
      priority: 'critical',
      symbol,
      title: `Risk threshold exceeded: ${symbol}`,
      message: `Risk level (${riskLevel.toFixed(0)}) exceeds threshold (${threshold})`,
      createdAt: new Date(),
      acknowledged: false,
      metadata: { riskLevel, threshold },
    };

    this.alerts.push(alert);
    this.notify(alert);
    return alert;
  }

  alertOnVolatilitySpike(symbol: string, currentVol: number, avgVol: number): WatchlistAlert {
    const increase = ((currentVol - avgVol) / avgVol) * 100;

    const alert: WatchlistAlert = {
      id: `alert_${Date.now()}`,
      type: 'volatility-spike',
      priority: increase > 100 ? 'critical' : 'high',
      symbol,
      title: `Volatility spike: ${symbol}`,
      message: `Volatility increased ${increase.toFixed(0)}% above average`,
      createdAt: new Date(),
      acknowledged: false,
      metadata: { currentVol, avgVol, increase },
    };

    this.alerts.push(alert);
    this.notify(alert);
    return alert;
  }

  alertOnThesisInvalidation(opportunity: Opportunity, reason: string): WatchlistAlert {
    const alert: WatchlistAlert = {
      id: `alert_${Date.now()}`,
      type: 'thesis-invalidated',
      priority: 'critical',
      symbol: opportunity.symbol,
      title: `Thesis invalidated: ${opportunity.symbol}`,
      message: reason,
      createdAt: new Date(),
      acknowledged: false,
      metadata: { opportunityId: opportunity.id, reason },
    };

    this.alerts.push(alert);
    this.notify(alert);
    return alert;
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    return true;
  }

  getActiveAlerts(symbol?: string): WatchlistAlert[] {
    const now = new Date();
    return this.alerts.filter(alert => {
      if (alert.acknowledged) return false;
      if (alert.expiresAt && alert.expiresAt < now) return false;
      if (symbol && alert.symbol !== symbol) return false;
      return true;
    });
  }

  getAlertsByPriority(priority: AlertPriority): WatchlistAlert[] {
    return this.getActiveAlerts().filter(a => a.priority === priority);
  }

  getRecentAlerts(hours: number = 24): WatchlistAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts
      .filter(a => a.createdAt >= cutoff)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  clearExpiredAlerts(): number {
    const now = new Date();
    const before = this.alerts.length;
    this.alerts = this.alerts.filter(
      a => !a.expiresAt || a.expiresAt >= now || !a.acknowledged
    );
    return before - this.alerts.length;
  }
}

export const watchlistAlertManager = new WatchlistAlertManager();
