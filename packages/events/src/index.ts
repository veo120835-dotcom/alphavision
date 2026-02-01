/**
 * @alphavision/events
 * 
 * Event schemas and definitions for the AlphaVision platform.
 * Provides type-safe event validation using Zod.
 */

import { z } from 'zod';

/**
 * Base event schema
 */
export const BaseEventSchema = z.object({
  /** Event ID */
  id: z.string().uuid(),
  
  /** Event type */
  type: z.string(),
  
  /** Event timestamp */
  timestamp: z.string().datetime(),
  
  /** User ID who triggered the event */
  userId: z.string().optional(),
  
  /** Session ID */
  sessionId: z.string().optional(),
  
  /** Event metadata */
  metadata: z.record(z.unknown()).optional(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

/**
 * User events
 */
export const UserCreatedEventSchema = BaseEventSchema.extend({
  type: z.literal('user.created'),
  payload: z.object({
    userId: z.string(),
    email: z.string().email(),
    name: z.string(),
  }),
});

export const UserUpdatedEventSchema = BaseEventSchema.extend({
  type: z.literal('user.updated'),
  payload: z.object({
    userId: z.string(),
    changes: z.record(z.unknown()),
  }),
});

export const UserDeletedEventSchema = BaseEventSchema.extend({
  type: z.literal('user.deleted'),
  payload: z.object({
    userId: z.string(),
  }),
});

/**
 * Conversation events
 */
export const ConversationStartedEventSchema = BaseEventSchema.extend({
  type: z.literal('conversation.started'),
  payload: z.object({
    conversationId: z.string(),
    agentId: z.string().optional(),
    title: z.string().optional(),
  }),
});

export const ConversationEndedEventSchema = BaseEventSchema.extend({
  type: z.literal('conversation.ended'),
  payload: z.object({
    conversationId: z.string(),
    messageCount: z.number(),
    durationMs: z.number(),
  }),
});

export const MessageSentEventSchema = BaseEventSchema.extend({
  type: z.literal('message.sent'),
  payload: z.object({
    messageId: z.string(),
    conversationId: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    contentLength: z.number(),
    hasToolCalls: z.boolean().optional(),
  }),
});

/**
 * Tool execution events
 */
export const ToolExecutionStartedEventSchema = BaseEventSchema.extend({
  type: z.literal('tool.execution.started'),
  payload: z.object({
    executionId: z.string(),
    toolId: z.string(),
    category: z.string(),
    riskTier: z.number().min(0).max(4),
  }),
});

export const ToolExecutionCompletedEventSchema = BaseEventSchema.extend({
  type: z.literal('tool.execution.completed'),
  payload: z.object({
    executionId: z.string(),
    toolId: z.string(),
    status: z.enum(['success', 'failure', 'cancelled']),
    durationMs: z.number(),
    retryCount: z.number(),
  }),
});

export const ToolApprovalRequestedEventSchema = BaseEventSchema.extend({
  type: z.literal('tool.approval.requested'),
  payload: z.object({
    executionId: z.string(),
    toolId: z.string(),
    riskTier: z.number(),
    requestedAt: z.string().datetime(),
  }),
});

export const ToolApprovalGrantedEventSchema = BaseEventSchema.extend({
  type: z.literal('tool.approval.granted'),
  payload: z.object({
    executionId: z.string(),
    toolId: z.string(),
    approvedBy: z.string(),
    approvedAt: z.string().datetime(),
  }),
});

export const ToolApprovalDeniedEventSchema = BaseEventSchema.extend({
  type: z.literal('tool.approval.denied'),
  payload: z.object({
    executionId: z.string(),
    toolId: z.string(),
    deniedBy: z.string(),
    deniedAt: z.string().datetime(),
    reason: z.string().optional(),
  }),
});

/**
 * Workflow events
 */
export const WorkflowStartedEventSchema = BaseEventSchema.extend({
  type: z.literal('workflow.started'),
  payload: z.object({
    workflowId: z.string(),
    triggerType: z.string(),
    executionId: z.string(),
  }),
});

export const WorkflowCompletedEventSchema = BaseEventSchema.extend({
  type: z.literal('workflow.completed'),
  payload: z.object({
    workflowId: z.string(),
    executionId: z.string(),
    status: z.enum(['success', 'failure', 'cancelled']),
    durationMs: z.number(),
    stepsCompleted: z.number(),
  }),
});

export const WorkflowStepCompletedEventSchema = BaseEventSchema.extend({
  type: z.literal('workflow.step.completed'),
  payload: z.object({
    workflowId: z.string(),
    executionId: z.string(),
    stepId: z.string(),
    status: z.enum(['success', 'failure', 'skipped']),
    durationMs: z.number(),
  }),
});

/**
 * Integration events
 */
export const IntegrationConnectedEventSchema = BaseEventSchema.extend({
  type: z.literal('integration.connected'),
  payload: z.object({
    integrationId: z.string(),
    provider: z.string(),
  }),
});

export const IntegrationDisconnectedEventSchema = BaseEventSchema.extend({
  type: z.literal('integration.disconnected'),
  payload: z.object({
    integrationId: z.string(),
    provider: z.string(),
    reason: z.string().optional(),
  }),
});

export const IntegrationSyncStartedEventSchema = BaseEventSchema.extend({
  type: z.literal('integration.sync.started'),
  payload: z.object({
    integrationId: z.string(),
    syncId: z.string(),
  }),
});

export const IntegrationSyncCompletedEventSchema = BaseEventSchema.extend({
  type: z.literal('integration.sync.completed'),
  payload: z.object({
    integrationId: z.string(),
    syncId: z.string(),
    status: z.enum(['success', 'failure']),
    itemsSynced: z.number(),
    durationMs: z.number(),
  }),
});

/**
 * Memory and learning events
 */
export const MemoryCreatedEventSchema = BaseEventSchema.extend({
  type: z.literal('memory.created'),
  payload: z.object({
    memoryId: z.string(),
    memoryType: z.enum(['fact', 'preference', 'context', 'skill']),
    importance: z.number(),
  }),
});

export const MemoryAccessedEventSchema = BaseEventSchema.extend({
  type: z.literal('memory.accessed'),
  payload: z.object({
    memoryId: z.string(),
    accessCount: z.number(),
    relevanceScore: z.number().optional(),
  }),
});

export const MemoryUpdatedEventSchema = BaseEventSchema.extend({
  type: z.literal('memory.updated'),
  payload: z.object({
    memoryId: z.string(),
    changes: z.record(z.unknown()),
  }),
});

/**
 * Policy and compliance events
 */
export const PolicyViolationEventSchema = BaseEventSchema.extend({
  type: z.literal('policy.violation'),
  payload: z.object({
    policyId: z.string(),
    ruleId: z.string(),
    resource: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    action: z.string(),
  }),
});

export const AuditLogCreatedEventSchema = BaseEventSchema.extend({
  type: z.literal('audit.log.created'),
  payload: z.object({
    logId: z.string(),
    action: z.string(),
    resource: z.string(),
    status: z.enum(['success', 'failure']),
  }),
});

/**
 * System events
 */
export const SystemErrorEventSchema = BaseEventSchema.extend({
  type: z.literal('system.error'),
  payload: z.object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      stack: z.string().optional(),
    }),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    component: z.string(),
  }),
});

export const SystemHealthCheckEventSchema = BaseEventSchema.extend({
  type: z.literal('system.health.check'),
  payload: z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    checks: z.record(z.object({
      status: z.enum(['pass', 'fail', 'warn']),
      message: z.string().optional(),
    })),
  }),
});

/**
 * Union of all event schemas
 */
export const EventSchema = z.discriminatedUnion('type', [
  UserCreatedEventSchema,
  UserUpdatedEventSchema,
  UserDeletedEventSchema,
  ConversationStartedEventSchema,
  ConversationEndedEventSchema,
  MessageSentEventSchema,
  ToolExecutionStartedEventSchema,
  ToolExecutionCompletedEventSchema,
  ToolApprovalRequestedEventSchema,
  ToolApprovalGrantedEventSchema,
  ToolApprovalDeniedEventSchema,
  WorkflowStartedEventSchema,
  WorkflowCompletedEventSchema,
  WorkflowStepCompletedEventSchema,
  IntegrationConnectedEventSchema,
  IntegrationDisconnectedEventSchema,
  IntegrationSyncStartedEventSchema,
  IntegrationSyncCompletedEventSchema,
  MemoryCreatedEventSchema,
  MemoryAccessedEventSchema,
  MemoryUpdatedEventSchema,
  PolicyViolationEventSchema,
  AuditLogCreatedEventSchema,
  SystemErrorEventSchema,
  SystemHealthCheckEventSchema,
]);

export type Event = z.infer<typeof EventSchema>;

/**
 * Event handler type
 */
export type EventHandler<T extends Event = Event> = (event: T) => Promise<void> | void;

/**
 * Event emitter interface
 */
export interface EventEmitter {
  emit<T extends Event>(event: T): Promise<void>;
  on<T extends Event>(eventType: T['type'], handler: EventHandler<T>): void;
  off<T extends Event>(eventType: T['type'], handler: EventHandler<T>): void;
}

/**
 * Event store interface
 */
export interface EventStore {
  append(event: Event): Promise<void>;
  getById(eventId: string): Promise<Event | null>;
  query(filters: {
    type?: Event['type'];
    userId?: string;
    sessionId?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
    offset?: number;
  }): Promise<Event[]>;
}
