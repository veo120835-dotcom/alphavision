// Core types for the Prompt Studio system

export type PromptScope = 'global' | 'domain' | 'client';
export type PromptStatus = 'draft' | 'active' | 'deprecated' | 'champion' | 'challenger';
export type MemoryType = 'episodic' | 'semantic';
export type AppRole = 'admin' | 'moderator' | 'user';

export interface Client {
  id: string;
  name: string;
  industry?: string;
  offer_type?: string;
  website?: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PromptVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default_value?: unknown;
}

export interface PromptConstraint {
  max_length?: number;
  min_length?: number;
  forbidden_words?: string[];
  required_elements?: string[];
  tone?: string;
  style?: string;
  [key: string]: unknown;
}

export interface PromptTemplate {
  id: string;
  client_id?: string;
  scope: PromptScope;
  name: string;
  description?: string;
  intent_tags: string[];
  template: string;
  variables: PromptVariable[];
  constraints: PromptConstraint;
  output_schema?: Record<string, unknown>;
  version: number;
  status: PromptStatus;
  parent_version_id?: string;
  performance_score: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PromptRun {
  id: string;
  client_id?: string;
  prompt_template_id?: string;
  template_version: number;
  inputs: Record<string, unknown>;
  output?: string;
  metrics: PromptMetrics;
  human_rating?: number;
  feedback?: string;
  created_at: string;
}

export interface PromptMetrics {
  reply_rate?: number;
  conversion_rate?: number;
  sentiment_score?: number;
  complaint_rate?: number;
  open_rate?: number;
  click_rate?: number;
  booked_calls?: number;
}

export interface ClientProfile {
  id: string;
  client_id: string;
  voice_preferences: VoicePreferences;
  risk_level: 'low' | 'medium' | 'high';
  preferred_structure: 'bullets' | 'concise' | 'narrative' | 'detailed';
  buyer_psychology: Record<string, unknown>;
  do_not_say: string[];
  winning_patterns: WinningPattern[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VoicePreferences {
  tone?: string;
  formality?: 'casual' | 'professional' | 'formal';
  personality?: string[];
  language_style?: string;
}

export interface WinningPattern {
  pattern: string;
  intent: string;
  success_rate: number;
  sample_count: number;
  discovered_at: string;
}

export interface ClientMemory {
  id: string;
  client_id: string;
  memory_type: MemoryType;
  key: string;
  value: Record<string, unknown>;
  relevance_score: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PromptSelectionContext {
  client_id: string;
  intent: string;
  additional_tags?: string[];
  prefer_champion?: boolean;
}

export interface PromptRenderContext {
  variables: Record<string, unknown>;
  client_profile?: ClientProfile;
  memories?: ClientMemory[];
}

export interface PromptLintResult {
  valid: boolean;
  errors: LintError[];
  warnings: LintWarning[];
}

export interface LintError {
  code: string;
  message: string;
  position?: { line: number; column: number };
}

export interface LintWarning {
  code: string;
  message: string;
  suggestion?: string;
}

export interface PromptScoreWeights {
  reply_rate: number;
  conversion: number;
  sentiment: number;
  complaints: number;
}

export interface PromptScore {
  prompt_id: string;
  version: number;
  score: number;
  components: {
    reply_contribution: number;
    conversion_contribution: number;
    sentiment_contribution: number;
    complaint_penalty: number;
  };
  sample_size: number;
  calculated_at: string;
}

export interface VersionDiff {
  field: string;
  old_value: unknown;
  new_value: unknown;
}

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  created_at: string;
}
