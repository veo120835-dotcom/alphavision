// Lead Resurrection Playbook

import { Playbook, PlaybookStep, ActionType, ExecutionContext } from '../types';

export interface LeadResurrectionConfig {
  stale_days_threshold: number;
  max_resurrection_attempts: number;
  email_templates: {
    first_attempt: string;
    second_attempt: string;
    final_attempt: string;
  };
  wait_between_attempts_days: number;
}

const defaultConfig: LeadResurrectionConfig = {
  stale_days_threshold: 7,
  max_resurrection_attempts: 3,
  email_templates: {
    first_attempt: 'lead_resurrection_soft',
    second_attempt: 'lead_resurrection_value',
    final_attempt: 'lead_resurrection_urgency',
  },
  wait_between_attempts_days: 3,
};

class LeadResurrectionPlaybook {
  private config: LeadResurrectionConfig;

  constructor(config: Partial<LeadResurrectionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  createPlaybook(): Playbook {
    return {
      id: 'playbook_lead_resurrection',
      name: 'Lead Resurrection Campaign',
      description: 'Automatically re-engage stale leads with a multi-touch campaign',
      version: 1,
      automation_level: 2, // Auto-execute low-risk actions
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
        id: 'step_check_resurrection_count',
        order: 1,
        name: 'Check Resurrection Attempt Count',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'checkResurrectionCount',
          params: { max_attempts: this.config.max_resurrection_attempts },
        },
        on_success: 'step_select_template',
        on_failure: 'step_mark_exhausted',
      },
      {
        id: 'step_select_template',
        order: 2,
        name: 'Select Email Template',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'selectTemplate',
          templates: this.config.email_templates,
        },
        on_success: 'step_personalize_email',
      },
      {
        id: 'step_personalize_email',
        order: 3,
        name: 'Personalize Email Content',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'personalizeEmail',
          include_fields: ['name', 'company', 'last_interaction', 'interest_areas'],
        },
        on_success: 'step_send_email',
      },
      {
        id: 'step_send_email',
        order: 4,
        name: 'Send Resurrection Email',
        action_type: 'send_email' as ActionType,
        action_config: {
          track_opens: true,
          track_clicks: true,
        },
        on_success: 'step_update_record',
        on_failure: 'step_log_failure',
        retry_config: {
          max_attempts: 3,
          backoff_type: 'exponential',
          initial_delay_ms: 1000,
          max_delay_ms: 30000,
        },
      },
      {
        id: 'step_update_record',
        order: 5,
        name: 'Update Lead Record',
        action_type: 'update_record' as ActionType,
        action_config: {
          table: 'leads',
          updates: {
            resurrection_attempt: { increment: 1 },
            last_resurrection_at: { value: 'now' },
            status: { value: 'resurrection_in_progress' },
          },
        },
        on_success: 'step_schedule_followup',
      },
      {
        id: 'step_schedule_followup',
        order: 6,
        name: 'Schedule Follow-up Check',
        action_type: 'wait' as ActionType,
        action_config: {
          duration_days: this.config.wait_between_attempts_days,
          callback: 'check_resurrection_response',
        },
      },
      {
        id: 'step_mark_exhausted',
        order: 7,
        name: 'Mark Lead as Exhausted',
        action_type: 'update_record' as ActionType,
        action_config: {
          table: 'leads',
          updates: {
            resurrection_status: { value: 'exhausted' },
            status: { value: 'dormant' },
          },
        },
      },
      {
        id: 'step_log_failure',
        order: 8,
        name: 'Log Email Failure',
        action_type: 'execute_function' as ActionType,
        action_config: {
          function: 'logFailure',
          notify_ops: true,
        },
      },
    ];
  }

  async execute(context: ExecutionContext): Promise<{ success: boolean; result: Record<string, unknown> }> {
    console.log(`[Lead Resurrection] Starting execution for context: ${context.execution_id}`);

    const lead = context.variables.lead as Record<string, unknown>;
    if (!lead) {
      return { success: false, result: { error: 'No lead data provided' } };
    }

    const resurrectionCount = (lead.resurrection_attempt as number) || 0;

    if (resurrectionCount >= this.config.max_resurrection_attempts) {
      return { success: false, result: { status: 'exhausted', message: 'Max resurrection attempts reached' } };
    }

    const templateKey = resurrectionCount === 0 
      ? 'first_attempt' 
      : resurrectionCount === 1 
        ? 'second_attempt' 
        : 'final_attempt';

    const template = this.config.email_templates[templateKey];

    return {
      success: true,
      result: {
        template_used: template,
        attempt_number: resurrectionCount + 1,
        next_check_days: this.config.wait_between_attempts_days,
        lead_id: lead.id,
      },
    };
  }

  updateConfig(config: Partial<LeadResurrectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LeadResurrectionConfig {
    return { ...this.config };
  }
}

export const leadResurrectionPlaybook = new LeadResurrectionPlaybook();
