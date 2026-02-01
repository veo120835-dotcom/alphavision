import { z } from 'zod';

/**
 * Tool execution receipt schema
 * 
 * Receipts provide cryptographically signed proof of tool execution
 * for audit and compliance purposes.
 */

export const ToolReceiptSchema = z.object({
  /** Unique receipt identifier */
  receiptId: z.string().uuid(),
  
  /** Tool execution ID */
  executionId: z.string().uuid(),
  
  /** Tool identifier */
  toolId: z.string(),
  
  /** Tool category */
  category: z.string(),
  
  /** Risk tier at time of execution */
  riskTier: z.number().min(0).max(4),
  
  /** User who authorized the execution */
  userId: z.string(),
  
  /** Timestamp of execution */
  timestamp: z.string().datetime(),
  
  /** Input parameters (sanitized) */
  inputs: z.record(z.unknown()),
  
  /** Execution result status */
  status: z.enum(['success', 'failure', 'pending', 'cancelled']),
  
  /** Output summary (sanitized, no PII) */
  outputSummary: z.string().optional(),
  
  /** Error message if failed */
  error: z.string().optional(),
  
  /** Hash of the complete execution context */
  contextHash: z.string(),
  
  /** Digital signature */
  signature: z.string().optional(),
  
  /** Chain reference to previous receipt */
  previousReceiptHash: z.string().optional(),
  
  /** Metadata */
  metadata: z.object({
    durationMs: z.number(),
    retryCount: z.number().default(0),
    approvalRequired: z.boolean(),
    approvedBy: z.string().optional(),
    approvalTimestamp: z.string().datetime().optional(),
  }),
});

export type ToolReceipt = z.infer<typeof ToolReceiptSchema>;

/**
 * Generate a new tool execution receipt
 */
export function generateReceipt(params: {
  executionId: string;
  toolId: string;
  category: string;
  riskTier: number;
  userId: string;
  inputs: Record<string, unknown>;
  status: ToolReceipt['status'];
  outputSummary?: string;
  error?: string;
  durationMs: number;
  retryCount?: number;
  approvalRequired?: boolean;
  approvedBy?: string;
  approvalTimestamp?: string;
  previousReceiptHash?: string;
}): Omit<ToolReceipt, 'receiptId' | 'timestamp' | 'contextHash' | 'signature'> {
  return {
    executionId: params.executionId,
    toolId: params.toolId,
    category: params.category,
    riskTier: params.riskTier,
    userId: params.userId,
    inputs: sanitizeInputs(params.inputs),
    status: params.status,
    outputSummary: params.outputSummary,
    error: params.error,
    previousReceiptHash: params.previousReceiptHash,
    metadata: {
      durationMs: params.durationMs,
      retryCount: params.retryCount ?? 0,
      approvalRequired: params.approvalRequired ?? false,
      approvedBy: params.approvedBy,
      approvalTimestamp: params.approvalTimestamp,
    },
  };
}

/**
 * Sanitize input parameters to remove sensitive data
 */
function sanitizeInputs(inputs: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'privateKey', 'ssn', 'creditCard'];
  
  for (const [key, value] of Object.entries(inputs)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk.toLowerCase()));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInputs(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Compute hash of receipt for chain integrity
 */
export function computeReceiptHash(receipt: Partial<ToolReceipt>): string {
  const payload = JSON.stringify({
    executionId: receipt.executionId,
    toolId: receipt.toolId,
    timestamp: receipt.timestamp,
    inputs: receipt.inputs,
    status: receipt.status,
    previousReceiptHash: receipt.previousReceiptHash,
  });
  
  // In production, use a cryptographic hash function
  // For now, return a placeholder
  return `hash_${Buffer.from(payload).toString('base64').substring(0, 32)}`;
}

/**
 * Verify receipt chain integrity
 */
export function verifyReceiptChain(receipts: ToolReceipt[]): {
  valid: boolean;
  brokenAt?: number;
} {
  if (receipts.length === 0) {
    return { valid: true };
  }

  for (let i = 1; i < receipts.length; i++) {
    const current = receipts[i];
    const previous = receipts[i - 1];
    
    if (!current) continue;
    if (!previous) continue;
    
    const expectedHash = computeReceiptHash(previous);
    
    if (current.previousReceiptHash !== expectedHash) {
      return { valid: false, brokenAt: i };
    }
  }

  return { valid: true };
}
