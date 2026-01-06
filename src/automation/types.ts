// Automation System Types

export type AutomationLevel = 0 | 1 | 2 | 3;

export type EventType = 
  | 'lead_created'
  | 'lead_stale'
  | 'crm_stage_changed'
  | 'payment_failed'
  | 'payment_succeeded'
  | 'competitor_pricing_changed'
  | 'market_signal_triggered'
  | 'portfolio_risk_threshold'
  | 'earnings_event'
  | 'news_event'
  | 'user_action'
  | 'scheduled'
  | 'manual';

export type RiskTier = 'low' | 'medium' | 'high' | 'critical';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'expired';

export interface Event {
  id: string;
  type: EventType;
  source: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface EventHandler {
  id: string;
  event_types: EventType[];
  handler: (event: Event) => Promise<void>;
  priority: number;
  enabled: boolean;
}

export interface Trigger {
  id: string;
  name: string;
  description: string;
  event_type: EventType;
  conditions: TriggerCondition[];
  playbook_id: string;
  enabled: boolean;
  created_at: Date;
  last_triggered?: Date;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: unknown;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  version: number;
  automation_level: AutomationLevel;
  steps: PlaybookStep[];
  risk_tier: RiskTier;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
  execution_count: number;
  success_rate: number;
}

export interface PlaybookStep {
  id: string;
  order: number;
  name: string;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  condition?: StepCondition;
  on_success?: string; // next step id
  on_failure?: string; // failure handler step id
  timeout_ms?: number;
  retry_config?: RetryConfig;
}

export type ActionType = 
  | 'send_email'
  | 'send_notification'
  | 'create_task'
  | 'update_record'
  | 'call_api'
  | 'execute_function'
  | 'wait'
  | 'branch'
  | 'approve'
  | 'place_order'
  | 'cancel_order'
  | 'adjust_position';

export interface StepCondition {
  expression: string;
  variables: Record<string, unknown>;
}

export interface RetryConfig {
  max_attempts: number;
  backoff_type: 'fixed' | 'exponential' | 'linear';
  initial_delay_ms: number;
  max_delay_ms: number;
}

export interface ApprovalRequest {
  id: string;
  playbook_id: string;
  playbook_name: string;
  step_id: string;
  action_type: ActionType;
  action_details: Record<string, unknown>;
  risk_tier: RiskTier;
  requested_at: Date;
  expires_at: Date;
  status: ApprovalStatus;
  reviewer_id?: string;
  reviewed_at?: Date;
  review_notes?: string;
}

export interface ActionLog {
  id: string;
  playbook_id: string;
  playbook_name: string;
  step_id: string;
  action_type: ActionType;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  started_at: Date;
  completed_at?: Date;
  duration_ms?: number;
  error?: string;
  approval_id?: string;
}

export interface DecisionTrace {
  id: string;
  execution_id: string;
  timestamp: Date;
  decision_point: string;
  inputs: Record<string, unknown>;
  decision: string;
  reasoning: string;
  alternatives_considered: string[];
  confidence: number;
}

export interface ScheduledJob {
  id: string;
  name: string;
  cron_expression: string;
  playbook_id: string;
  enabled: boolean;
  last_run?: Date;
  next_run: Date;
  run_count: number;
  failure_count: number;
}

export interface ExecutionContext {
  execution_id: string;
  playbook_id: string;
  trigger_event?: Event;
  variables: Record<string, unknown>;
  started_at: Date;
  current_step?: string;
  completed_steps: string[];
  failed_steps: string[];
}
