/**
 * @alphavision/contracts
 * 
 * TypeScript type definitions and interfaces for the AlphaVision platform.
 * Provides shared contracts across all packages and services.
 */

/**
 * User and authentication types
 */
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/**
 * Agent and conversation types
 */
export interface Agent {
  id: string;
  userId: string;
  name: string;
  description?: string;
  model: string;
  systemPrompt?: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  userId: string;
  agentId?: string;
  title?: string;
  status: 'active' | 'archived' | 'deleted';
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    toolCalls?: ToolCall[];
    citations?: Citation[];
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
  status: 'pending' | 'success' | 'failure';
}

export interface Citation {
  source: string;
  url?: string;
  title?: string;
  snippet?: string;
}

/**
 * Workflow and task types
 */
export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'webhook';
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  type: 'tool' | 'condition' | 'loop' | 'parallel';
  config: Record<string, unknown>;
  nextSteps?: string[];
}

export interface Task {
  id: string;
  workflowId?: string;
  userId: string;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Memory and knowledge types
 */
export interface Memory {
  id: string;
  userId: string;
  type: 'fact' | 'preference' | 'context' | 'skill';
  content: string;
  embedding?: number[];
  importance: number;
  confidence: number;
  source?: string;
  createdAt: string;
  accessedAt: string;
  accessCount: number;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeBase {
  id: string;
  userId: string;
  name: string;
  description?: string;
  documentCount: number;
  status: 'indexing' | 'ready' | 'error';
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  title: string;
  content: string;
  type: string;
  status: 'pending' | 'indexed' | 'failed';
  chunks?: DocumentChunk[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  position: number;
  metadata?: Record<string, unknown>;
}

/**
 * Policy and compliance types
 */
export interface Policy {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'access' | 'data' | 'execution' | 'compliance';
  rules: PolicyRule[];
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'require_approval' | 'log';
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  status: 'success' | 'failure';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Integration and connection types
 */
export interface Integration {
  id: string;
  userId: string;
  provider: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  credentials?: Record<string, unknown>;
  config?: Record<string, unknown>;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface Webhook {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secret?: string;
  status: 'active' | 'inactive';
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Analytics and metrics types
 */
export interface Metric {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  event: string;
  properties?: Record<string, unknown>;
  timestamp: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Error and response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    requestId?: string;
    timestamp?: string;
    duration?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Utility types
 */
export type Timestamp = string;
export type UUID = string;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];

/**
 * Permission and access control types
 */
export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface AccessControl {
  userId: string;
  resourceId: string;
  resourceType: string;
  permissions: string[];
  grantedBy?: string;
  grantedAt: string;
  expiresAt?: string;
}
