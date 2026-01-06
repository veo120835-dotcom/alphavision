// Investor Alerts Playbook

import { Playbook, PlaybookStep, ActionType, ExecutionContext } from '../types';

export interface InvestorAlertsConfig {
  alert_thresholds: AlertThreshold[];
  digest_frequency: 'realtime' | 'hourly' | 'daily';
  priority_symbols: string[];
  notification_channels: string[];
}

interface AlertThreshold {
  metric: string;
  condition: 'above' | 'below' | 'change_percent';
  value: number;
  severity: 'info' | 'warning' | 'critical';
}

const defaultConfig: InvestorAlertsConfig = {
  alert_thresholds: [
    { metric: 'portfolio_drawdown', condition: 'above', value: 5, severity: 'warning' },
    { metric: 'portfolio_drawdown', condition: 'above', value: 10, severity: 'critical' },
    { metric: 'position_concentration', condition: 'above', value: 20, severity: 'warning' },
    { metric: 'daily_pnl_change', condition: 'change_percent', value: 3, severity: 'info' },
    { metric: 'daily_pnl_change', condition: 'change_percent', value: 7, severity: 'critical' },
  ],
  digest_frequency: 'daily',
  priority_symbols: [],
  notification_channels: ['email', 'push'],
};

class InvestorAlertsPlaybook {
  private config: InvestorAlertsConfig;

  constructor(config: Partial<InvestorAlertsConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  createPlaybook(): Playbook {
    return {
      id: 'playbook_investor_alerts',
      name: 'Investor Alert System',
      description: 'Real-time portfolio monitoring and investor notifications',
      version: 1,
      automation_level: 2, // Auto-execute notifications
      steps: this.buildSteps(),
      risk_tier: 'low',
      enabled: true,
      created_at: new Date(),
      updated_at: new Date(),
      execution_count: 0,
      success_rate: 0,
    };
  }

  private buildSteps(): PlaybookStep[] {
    return [
      {
        id: 'step_check_thresholds',
        order: 1,
        name: 'Check Alert Thresholds',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'checkThresholds',
          thresholds: this.config.alert_thresholds,
        },
        on_success: 'step_classify_alerts',
      },
      {
        id: 'step_classify_alerts',
        order: 2,
        name: 'Classify and Prioritize Alerts',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'classifyAlerts',
          priority_symbols: this.config.priority_symbols,
        },
        on_success: 'step_route_alerts',
      },
      {
        id: 'step_route_alerts',
        order: 3,
        name: 'Route Alerts by Severity',
        action_type: 'branch' as ActionType,
        action_config: {
          branches: [
            { condition: 'has_critical_alerts', next_step: 'step_critical_alert' },
            { condition: 'has_warning_alerts', next_step: 'step_warning_alert' },
            { condition: 'has_info_alerts', next_step: 'step_info_alert' },
            { condition: 'default', next_step: 'step_no_alerts' },
          ],
        },
      },
      {
        id: 'step_critical_alert',
        order: 4,
        name: 'Send Critical Alert',
        action_type: 'send_notification' as ActionType,
        action_config: {
          channels: ['push', 'sms', 'email'],
          priority: 'critical',
          template: 'investor_critical_alert',
          immediate: true,
        },
        on_success: 'step_log_alert',
      },
      {
        id: 'step_warning_alert',
        order: 5,
        name: 'Send Warning Alert',
        action_type: 'send_notification' as ActionType,
        action_config: {
          channels: ['push', 'email'],
          priority: 'high',
          template: 'investor_warning_alert',
        },
        on_success: 'step_log_alert',
      },
      {
        id: 'step_info_alert',
        order: 6,
        name: 'Queue Info Alert for Digest',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'queueForDigest',
          frequency: this.config.digest_frequency,
        },
        on_success: 'step_log_alert',
      },
      {
        id: 'step_log_alert',
        order: 7,
        name: 'Log Alert History',
        action_type: 'update_record' as ActionType,
        action_config: {
          table: 'investor_alerts',
          operation: 'insert',
          include_context: true,
        },
      },
      {
        id: 'step_no_alerts',
        order: 8,
        name: 'No Alerts Triggered',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'logCheck',
          status: 'no_alerts',
        },
      },
    ];
  }

  checkThresholds(metrics: Record<string, number>): {
    triggered: boolean;
    alerts: Array<{ threshold: AlertThreshold; current_value: number; message: string }>;
  } {
    const alerts: Array<{ threshold: AlertThreshold; current_value: number; message: string }> = [];

    this.config.alert_thresholds.forEach(threshold => {
      const currentValue = metrics[threshold.metric];
      if (currentValue === undefined) return;

      let triggered = false;
      let message = '';

      switch (threshold.condition) {
        case 'above':
          triggered = currentValue > threshold.value;
          message = `${threshold.metric} is ${currentValue}% (above ${threshold.value}% threshold)`;
          break;
        case 'below':
          triggered = currentValue < threshold.value;
          message = `${threshold.metric} is ${currentValue}% (below ${threshold.value}% threshold)`;
          break;
        case 'change_percent':
          triggered = Math.abs(currentValue) > threshold.value;
          message = `${threshold.metric} changed by ${currentValue}% (threshold: ±${threshold.value}%)`;
          break;
      }

      if (triggered) {
        alerts.push({ threshold, current_value: currentValue, message });
      }
    });

    return {
      triggered: alerts.length > 0,
      alerts,
    };
  }

  groupAlertsBySeverity(alerts: Array<{ threshold: AlertThreshold; current_value: number; message: string }>): {
    critical: typeof alerts;
    warning: typeof alerts;
    info: typeof alerts;
  } {
    return {
      critical: alerts.filter(a => a.threshold.severity === 'critical'),
      warning: alerts.filter(a => a.threshold.severity === 'warning'),
      info: alerts.filter(a => a.threshold.severity === 'info'),
    };
  }

  updateConfig(config: Partial<InvestorAlertsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): InvestorAlertsConfig {
    return { ...this.config };
  }

  addPrioritySymbol(symbol: string): void {
    if (!this.config.priority_symbols.includes(symbol)) {
      this.config.priority_symbols.push(symbol);
    }
  }

  removePrioritySymbol(symbol: string): void {
    this.config.priority_symbols = this.config.priority_symbols.filter(s => s !== symbol);
  }
}

export const investorAlertsPlaybook = new InvestorAlertsPlaybook();
