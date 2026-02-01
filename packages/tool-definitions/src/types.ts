import type { ToolCategory } from './categories';
import type { RiskTier } from './risk-tiers';

/**
 * Core type definitions for tool system
 */

export interface ToolDefinition {
  /** Unique tool identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Tool description */
  description: string;
  
  /** Tool category */
  category: ToolCategory;
  
  /** Risk tier */
  riskTier: RiskTier;
  
  /** Tool version */
  version: string;
  
  /** Input schema */
  inputSchema: ToolSchema;
  
  /** Output schema */
  outputSchema: ToolSchema;
  
  /** Rate limits */
  rateLimits?: ToolRateLimits;
  
  /** Whether tool requires user approval */
  requiresApproval: boolean;
  
  /** Whether tool supports retry */
  supportsRetry: boolean;
  
  /** Maximum execution timeout in milliseconds */
  timeoutMs?: number;
  
  /** Tool metadata */
  metadata?: {
    /** Provider/integration name */
    provider?: string;
    
    /** API version */
    apiVersion?: string;
    
    /** Scopes/permissions required */
    requiredScopes?: string[];
    
    /** Dependencies on other tools */
    dependencies?: string[];
    
    /** Tags for categorization */
    tags?: string[];
  };
}

export interface ToolSchema {
  /** Schema type */
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  
  /** Schema description */
  description?: string;
  
  /** Required properties (for objects) */
  required?: string[];
  
  /** Property definitions (for objects) */
  properties?: Record<string, ToolSchema>;
  
  /** Array item schema */
  items?: ToolSchema;
  
  /** Enum values */
  enum?: unknown[];
  
  /** Default value */
  default?: unknown;
  
  /** Validation rules */
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    minimum?: number;
    maximum?: number;
    format?: string;
  };
}

export interface ToolRateLimits {
  /** Maximum requests per minute */
  requestsPerMinute?: number;
  
  /** Maximum requests per hour */
  requestsPerHour?: number;
  
  /** Maximum requests per day */
  requestsPerDay?: number;
  
  /** Maximum concurrent executions */
  maxConcurrent?: number;
  
  /** Cooldown period in milliseconds after execution */
  cooldownMs?: number;
  
  /** Burst allowance */
  burstAllowance?: number;
}

export interface ToolExecution {
  /** Unique execution ID */
  executionId: string;
  
  /** Tool ID */
  toolId: string;
  
  /** User ID */
  userId: string;
  
  /** Execution status */
  status: 'pending' | 'running' | 'success' | 'failure' | 'cancelled' | 'timeout';
  
  /** Input parameters */
  inputs: Record<string, unknown>;
  
  /** Output result */
  output?: unknown;
  
  /** Error information */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  
  /** Execution timestamps */
  timestamps: {
    created: string;
    started?: string;
    completed?: string;
  };
  
  /** Execution metadata */
  metadata: {
    durationMs?: number;
    retryCount: number;
    approvalRequired: boolean;
    approvedBy?: string;
    approvalTimestamp?: string;
  };
}

export interface ToolRegistry {
  /** Register a new tool */
  register(definition: ToolDefinition): Promise<void>;
  
  /** Unregister a tool */
  unregister(toolId: string): Promise<void>;
  
  /** Get tool definition */
  get(toolId: string): Promise<ToolDefinition | null>;
  
  /** List all registered tools */
  list(filters?: {
    category?: ToolCategory;
    riskTier?: RiskTier;
    tags?: string[];
  }): Promise<ToolDefinition[]>;
  
  /** Update tool definition */
  update(toolId: string, updates: Partial<ToolDefinition>): Promise<void>;
}

export interface ToolExecutor {
  /** Execute a tool */
  execute(params: {
    toolId: string;
    userId: string;
    inputs: Record<string, unknown>;
    context?: {
      sessionId?: string;
      conversationId?: string;
      metadata?: Record<string, unknown>;
    };
  }): Promise<ToolExecution>;
  
  /** Get execution status */
  getStatus(executionId: string): Promise<ToolExecution | null>;
  
  /** Cancel an execution */
  cancel(executionId: string): Promise<void>;
  
  /** Retry a failed execution */
  retry(executionId: string): Promise<ToolExecution>;
}
