// Churn Prevention Playbook

import { Playbook, PlaybookStep, ActionType, ExecutionContext } from '../types';

export interface ChurnPreventionConfig {
  risk_signals: RiskSignal[];
  intervention_thresholds: {
    warning: number;
    critical: number;
  };
  retention_offers: RetentionOffer[];
  escalation_delay_hours: number;
}

interface RiskSignal {
  signal: string;
  weight: number;
  lookback_days: number;
}

interface RetentionOffer {
  risk_level: 'warning' | 'critical';
  offer_type: 'discount' | 'feature_unlock' | 'support_upgrade' | 'custom';
  value: string;
  requires_approval: boolean;
}

const defaultConfig: ChurnPreventionConfig = {
  risk_signals: [
    { signal: 'login_frequency_drop', weight: 0.3, lookback_days: 14 },
    { signal: 'feature_usage_decline', weight: 0.25, lookback_days: 30 },
    { signal: 'support_tickets_increase', weight: 0.2, lookback_days: 7 },
    { signal: 'payment_failure', weight: 0.15, lookback_days: 30 },
    { signal: 'negative_feedback', weight: 0.1, lookback_days: 60 },
  ],
  intervention_thresholds: {
    warning: 0.5,
    critical: 0.75,
  },
  retention_offers: [
    { risk_level: 'warning', offer_type: 'support_upgrade', value: '1 month priority support', requires_approval: false },
    { risk_level: 'critical', offer_type: 'discount', value: '25% off next 3 months', requires_approval: true },
  ],
  escalation_delay_hours: 24,
};

class ChurnPreventionPlaybook {
  private config: ChurnPreventionConfig;

  constructor(config: Partial<ChurnPreventionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  createPlaybook(): Playbook {
    return {
      id: 'playbook_churn_prevention',
      name: 'Churn Prevention Intervention',
      description: 'Proactively identify and retain at-risk customers',
      version: 1,
      automation_level: 2, // Auto-execute for warning level
      steps: this.buildSteps(),
      risk_tier: 'medium',
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
        id: 'step_calculate_risk',
        order: 1,
        name: 'Calculate Churn Risk Score',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'calculateChurnRisk',
          signals: this.config.risk_signals,
        },
        on_success: 'step_classify_risk',
      },
      {
        id: 'step_classify_risk',
        order: 2,
        name: 'Classify Risk Level',
        action_type: 'branch' as ActionType,
        action_config: {
          branches: [
            { condition: 'risk_score >= critical_threshold', next_step: 'step_critical_intervention' },
            { condition: 'risk_score >= warning_threshold', next_step: 'step_warning_intervention' },
            { condition: 'default', next_step: 'step_no_action' },
          ],
          thresholds: this.config.intervention_thresholds,
        },
      },
      {
        id: 'step_warning_intervention',
        order: 3,
        name: 'Warning Level Intervention',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'prepareIntervention',
          risk_level: 'warning',
        },
        on_success: 'step_send_notification',
      },
      {
        id: 'step_critical_intervention',
        order: 4,
        name: 'Critical Level Intervention',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'prepareIntervention',
          risk_level: 'critical',
        },
        on_success: 'step_require_approval_critical',
      },
      {
        id: 'step_require_approval_critical',
        order: 5,
        name: 'Require Manager Approval',
        action_type: 'approve' as ActionType,
        action_config: {
          approval_type: 'retention_offer',
          reviewers: ['customer_success_manager', 'account_executive'],
          expiration_hours: 12,
          urgent: true,
        },
        on_success: 'step_send_retention_offer',
        on_failure: 'step_escalate',
      },
      {
        id: 'step_send_notification',
        order: 6,
        name: 'Send Internal Alert',
        action_type: 'send_notification' as ActionType,
        action_config: {
          channels: ['slack', 'email'],
          recipients: ['account_owner', 'customer_success'],
          template: 'churn_risk_alert',
        },
        on_success: 'step_create_task',
      },
      {
        id: 'step_send_retention_offer',
        order: 7,
        name: 'Send Retention Offer',
        action_type: 'send_email' as ActionType,
        action_config: {
          template: 'retention_offer',
          personalize: true,
          include_offer_details: true,
          track_opens: true,
          track_clicks: true,
        },
        on_success: 'step_schedule_followup',
      },
      {
        id: 'step_create_task',
        order: 8,
        name: 'Create Outreach Task',
        action_type: 'create_task' as ActionType,
        action_config: {
          task_type: 'churn_prevention_outreach',
          priority: 'high',
          due_hours: 24,
          assignee: 'account_owner',
        },
      },
      {
        id: 'step_schedule_followup',
        order: 9,
        name: 'Schedule Follow-up',
        action_type: 'wait' as ActionType,
        action_config: {
          duration_hours: 48,
          callback: 'check_retention_response',
        },
      },
      {
        id: 'step_escalate',
        order: 10,
        name: 'Escalate to Leadership',
        action_type: 'send_notification' as ActionType,
        action_config: {
          channels: ['slack', 'email'],
          recipients: ['vp_customer_success', 'cro'],
          template: 'churn_escalation',
          urgent: true,
        },
      },
      {
        id: 'step_no_action',
        order: 11,
        name: 'No Intervention Needed',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'logLowRisk',
        },
      },
    ];
  }

  calculateRiskScore(customer: {
    id: string;
    signals: Record<string, number>;
  }): { score: number; risk_level: 'low' | 'warning' | 'critical'; contributing_factors: string[] } {
    let totalScore = 0;
    const contributingFactors: string[] = [];

    this.config.risk_signals.forEach(signal => {
      const signalValue = customer.signals[signal.signal] || 0;
      const contribution = signalValue * signal.weight;
      totalScore += contribution;

      if (contribution > 0.1) {
        contributingFactors.push(signal.signal);
      }
    });

    const normalizedScore = Math.min(1, totalScore);
    let riskLevel: 'low' | 'warning' | 'critical' = 'low';

    if (normalizedScore >= this.config.intervention_thresholds.critical) {
      riskLevel = 'critical';
    } else if (normalizedScore >= this.config.intervention_thresholds.warning) {
      riskLevel = 'warning';
    }

    return {
      score: normalizedScore,
      risk_level: riskLevel,
      contributing_factors: contributingFactors,
    };
  }

  getRetentionOffer(riskLevel: 'warning' | 'critical'): RetentionOffer | undefined {
    return this.config.retention_offers.find(offer => offer.risk_level === riskLevel);
  }

  updateConfig(config: Partial<ChurnPreventionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ChurnPreventionConfig {
    return { ...this.config };
  }
}

export const churnPreventionPlaybook = new ChurnPreventionPlaybook();
