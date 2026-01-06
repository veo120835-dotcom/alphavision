// Upsell Playbook

import { Playbook, PlaybookStep, ActionType, ExecutionContext } from '../types';

export interface UpsellConfig {
  usage_threshold_percent: number;
  days_as_customer: number;
  satisfaction_score_min: number;
  offer_discount_percent: number;
  upgrade_paths: UpgradePath[];
}

interface UpgradePath {
  from_plan: string;
  to_plan: string;
  trigger_usage_percent: number;
  value_proposition: string;
  discount_eligible: boolean;
}

const defaultConfig: UpsellConfig = {
  usage_threshold_percent: 80,
  days_as_customer: 30,
  satisfaction_score_min: 7,
  offer_discount_percent: 20,
  upgrade_paths: [
    { from_plan: 'starter', to_plan: 'pro', trigger_usage_percent: 80, value_proposition: 'Unlock advanced features', discount_eligible: true },
    { from_plan: 'pro', to_plan: 'enterprise', trigger_usage_percent: 90, value_proposition: 'Scale without limits', discount_eligible: true },
  ],
};

class UpsellPlaybook {
  private config: UpsellConfig;

  constructor(config: Partial<UpsellConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  createPlaybook(): Playbook {
    return {
      id: 'playbook_upsell',
      name: 'Strategic Upsell Campaign',
      description: 'Identify and convert high-value upgrade opportunities',
      version: 1,
      automation_level: 1, // Draft + queue for approval
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
        id: 'step_analyze_usage',
        order: 1,
        name: 'Analyze Customer Usage',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'analyzeUsagePatterns',
          metrics: ['api_calls', 'storage', 'active_users', 'feature_adoption'],
        },
        on_success: 'step_check_eligibility',
      },
      {
        id: 'step_check_eligibility',
        order: 2,
        name: 'Check Upsell Eligibility',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'checkEligibility',
          criteria: {
            usage_threshold: this.config.usage_threshold_percent,
            min_tenure_days: this.config.days_as_customer,
            min_satisfaction: this.config.satisfaction_score_min,
          },
        },
        condition: {
          expression: 'usage_percent >= threshold AND tenure_days >= min_days',
          variables: {},
        },
        on_success: 'step_select_upgrade_path',
        on_failure: 'step_defer_upsell',
      },
      {
        id: 'step_select_upgrade_path',
        order: 3,
        name: 'Select Upgrade Path',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'selectUpgradePath',
          paths: this.config.upgrade_paths,
        },
        on_success: 'step_calculate_offer',
      },
      {
        id: 'step_calculate_offer',
        order: 4,
        name: 'Calculate Personalized Offer',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'calculateOffer',
          base_discount: this.config.offer_discount_percent,
          factors: ['tenure', 'usage_growth', 'referral_potential'],
        },
        on_success: 'step_require_approval',
      },
      {
        id: 'step_require_approval',
        order: 5,
        name: 'Queue for Approval',
        action_type: 'approve' as ActionType,
        action_config: {
          approval_type: 'upsell_offer',
          reviewers: ['sales_manager', 'account_owner'],
          expiration_hours: 48,
        },
        on_success: 'step_send_offer',
        on_failure: 'step_log_rejection',
      },
      {
        id: 'step_send_offer',
        order: 6,
        name: 'Send Upsell Offer',
        action_type: 'send_email' as ActionType,
        action_config: {
          template: 'upsell_offer',
          track_opens: true,
          track_clicks: true,
          include_calendar_link: true,
        },
        on_success: 'step_create_followup_task',
      },
      {
        id: 'step_create_followup_task',
        order: 7,
        name: 'Create Follow-up Task',
        action_type: 'create_task' as ActionType,
        action_config: {
          task_type: 'upsell_followup',
          due_days: 3,
          priority: 'high',
          assignee: 'account_owner',
        },
      },
      {
        id: 'step_defer_upsell',
        order: 8,
        name: 'Defer Upsell Attempt',
        action_type: 'update_record' as ActionType,
        action_config: {
          table: 'customers',
          updates: {
            next_upsell_check: { value: 'now + 30 days' },
          },
        },
      },
      {
        id: 'step_log_rejection',
        order: 9,
        name: 'Log Offer Rejection',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'logRejection',
          include_reason: true,
        },
      },
    ];
  }

  async evaluateCustomer(customer: {
    id: string;
    plan: string;
    usage_percent: number;
    tenure_days: number;
    satisfaction_score: number;
  }): Promise<{ eligible: boolean; upgrade_path?: UpgradePath; reason?: string }> {
    if (customer.tenure_days < this.config.days_as_customer) {
      return { eligible: false, reason: 'Customer tenure too short' };
    }

    if (customer.satisfaction_score < this.config.satisfaction_score_min) {
      return { eligible: false, reason: 'Satisfaction score below threshold' };
    }

    const upgradePath = this.config.upgrade_paths.find(
      path => path.from_plan === customer.plan && customer.usage_percent >= path.trigger_usage_percent
    );

    if (!upgradePath) {
      return { eligible: false, reason: 'No suitable upgrade path available' };
    }

    return { eligible: true, upgrade_path: upgradePath };
  }

  updateConfig(config: Partial<UpsellConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): UpsellConfig {
    return { ...this.config };
  }
}

export const upsellPlaybook = new UpsellPlaybook();
