/**
 * @alphavision/audit-ledger
 * 
 * Append-only hash chain for immutable audit logging.
 * Provides cryptographically verifiable audit trails for compliance and security.
 */

import { z } from 'zod';

/**
 * Audit entry schema
 */
export const AuditEntrySchema = z.object({
  /** Entry ID */
  entryId: z.string().uuid(),
  
  /** Sequence number in the chain */
  sequenceNumber: z.number().int().nonnegative(),
  
  /** Timestamp of the entry */
  timestamp: z.string().datetime(),
  
  /** User ID who performed the action */
  userId: z.string(),
  
  /** Action performed */
  action: z.string(),
  
  /** Resource type */
  resourceType: z.string(),
  
  /** Resource ID */
  resourceId: z.string().optional(),
  
  /** Action status */
  status: z.enum(['success', 'failure', 'pending']),
  
  /** IP address */
  ipAddress: z.string().optional(),
  
  /** User agent */
  userAgent: z.string().optional(),
  
  /** Session ID */
  sessionId: z.string().optional(),
  
  /** Additional metadata */
  metadata: z.record(z.unknown()).optional(),
  
  /** Changes made (before/after) */
  changes: z.object({
    before: z.record(z.unknown()).optional(),
    after: z.record(z.unknown()).optional(),
  }).optional(),
  
  /** Hash of this entry */
  hash: z.string(),
  
  /** Hash of previous entry in chain */
  previousHash: z.string().optional(),
  
  /** Signature for verification */
  signature: z.string().optional(),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

/**
 * Audit chain metadata
 */
export const AuditChainMetadataSchema = z.object({
  /** Chain ID */
  chainId: z.string().uuid(),
  
  /** Genesis hash (first entry in chain) */
  genesisHash: z.string(),
  
  /** Current sequence number */
  currentSequence: z.number().int().nonnegative(),
  
  /** Last entry hash */
  lastHash: z.string(),
  
  /** Chain creation timestamp */
  createdAt: z.string().datetime(),
  
  /** Last update timestamp */
  updatedAt: z.string().datetime(),
  
  /** Total entries */
  entryCount: z.number().int().nonnegative(),
  
  /** Chain integrity status */
  integrityStatus: z.enum(['valid', 'invalid', 'unknown']),
});

export type AuditChainMetadata = z.infer<typeof AuditChainMetadataSchema>;

/**
 * Create a hash of an audit entry
 */
export function hashAuditEntry(entry: Omit<AuditEntry, 'hash'>): string {
  const payload = JSON.stringify({
    entryId: entry.entryId,
    sequenceNumber: entry.sequenceNumber,
    timestamp: entry.timestamp,
    userId: entry.userId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    status: entry.status,
    metadata: entry.metadata,
    changes: entry.changes,
    previousHash: entry.previousHash,
  });
  
  // In production, use SHA-256 or stronger cryptographic hash
  // For now, using a simple base64 encoding as placeholder
  if (typeof btoa !== 'undefined') {
    return btoa(payload).substring(0, 64);
  }
  return Buffer.from(payload).toString('base64').substring(0, 64);
}

/**
 * Create a new audit entry
 */
export function createAuditEntry(params: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  status: AuditEntry['status'];
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  sequenceNumber: number;
  previousHash?: string;
}): AuditEntry {
  const entryWithoutHash: Omit<AuditEntry, 'hash'> = {
    entryId: crypto.randomUUID(),
    sequenceNumber: params.sequenceNumber,
    timestamp: new Date().toISOString(),
    userId: params.userId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    status: params.status,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    sessionId: params.sessionId,
    metadata: params.metadata,
    changes: params.changes,
    previousHash: params.previousHash,
  };

  const hash = hashAuditEntry(entryWithoutHash);

  return {
    ...entryWithoutHash,
    hash,
  };
}

/**
 * Verify a single audit entry
 */
export function verifyAuditEntry(entry: AuditEntry): boolean {
  const { hash, ...entryWithoutHash } = entry;
  const computedHash = hashAuditEntry(entryWithoutHash);
  return hash === computedHash;
}

/**
 * Verify the integrity of an audit chain
 */
export function verifyAuditChain(entries: AuditEntry[]): {
  valid: boolean;
  brokenAt?: number;
  errors: string[];
} {
  const errors: string[] = [];

  if (entries.length === 0) {
    return { valid: true, errors };
  }

  // Verify each entry's hash
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;
    
    if (!verifyAuditEntry(entry)) {
      errors.push(`Entry ${i} (${entry.entryId}) has invalid hash`);
      return { valid: false, brokenAt: i, errors };
    }
  }

  // Verify chain linkage
  for (let i = 1; i < entries.length; i++) {
    const current = entries[i];
    const previous = entries[i - 1];
    
    if (!current || !previous) continue;

    if (current.previousHash !== previous.hash) {
      errors.push(
        `Chain broken at entry ${i}: expected previousHash ${previous.hash}, got ${current.previousHash}`
      );
      return { valid: false, brokenAt: i, errors };
    }

    if (current.sequenceNumber !== previous.sequenceNumber + 1) {
      errors.push(
        `Sequence number mismatch at entry ${i}: expected ${previous.sequenceNumber + 1}, got ${current.sequenceNumber}`
      );
      return { valid: false, brokenAt: i, errors };
    }
  }

  return { valid: true, errors };
}

/**
 * Append a new entry to the audit chain
 */
export function appendToChain(
  chain: AuditEntry[],
  newEntry: Omit<AuditEntry, 'sequenceNumber' | 'previousHash' | 'hash' | 'entryId' | 'timestamp'>
): AuditEntry[] {
  const lastEntry = chain[chain.length - 1];
  const sequenceNumber = lastEntry ? lastEntry.sequenceNumber + 1 : 0;
  const previousHash = lastEntry?.hash;

  const entry = createAuditEntry({
    ...newEntry,
    sequenceNumber,
    previousHash,
  });

  return [...chain, entry];
}

/**
 * Query audit entries
 */
export function queryAuditEntries(
  entries: AuditEntry[],
  filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    status?: AuditEntry['status'];
    startTime?: string;
    endTime?: string;
  }
): AuditEntry[] {
  return entries.filter((entry) => {
    if (filters.userId && entry.userId !== filters.userId) return false;
    if (filters.action && entry.action !== filters.action) return false;
    if (filters.resourceType && entry.resourceType !== filters.resourceType) return false;
    if (filters.resourceId && entry.resourceId !== filters.resourceId) return false;
    if (filters.status && entry.status !== filters.status) return false;
    if (filters.startTime && entry.timestamp < filters.startTime) return false;
    if (filters.endTime && entry.timestamp > filters.endTime) return false;
    return true;
  });
}

/**
 * Get chain statistics
 */
export function getChainStatistics(entries: AuditEntry[]): {
  totalEntries: number;
  uniqueUsers: number;
  uniqueActions: number;
  statusCounts: Record<string, number>;
  dateRange: { earliest: string; latest: string } | null;
} {
  const uniqueUsers = new Set(entries.map((e) => e.userId));
  const uniqueActions = new Set(entries.map((e) => e.action));
  const statusCounts: Record<string, number> = {};

  for (const entry of entries) {
    statusCounts[entry.status] = (statusCounts[entry.status] ?? 0) + 1;
  }

  const timestamps = entries.map((e) => e.timestamp).sort();
  const dateRange =
    timestamps.length > 0
      ? { earliest: timestamps[0]!, latest: timestamps[timestamps.length - 1]! }
      : null;

  return {
    totalEntries: entries.length,
    uniqueUsers: uniqueUsers.size,
    uniqueActions: uniqueActions.size,
    statusCounts,
    dateRange,
  };
}

/**
 * Export chain to JSON
 */
export function exportChain(entries: AuditEntry[], metadata?: AuditChainMetadata): string {
  return JSON.stringify(
    {
      metadata,
      entries,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    },
    null,
    2
  );
}

/**
 * Import chain from JSON
 */
export function importChain(json: string): {
  entries: AuditEntry[];
  metadata?: AuditChainMetadata;
  valid: boolean;
  errors: string[];
} {
  try {
    const data = JSON.parse(json) as {
      entries: unknown[];
      metadata?: unknown;
    };

    const entries = data.entries.map((e) => AuditEntrySchema.parse(e));
    const metadata = data.metadata ? AuditChainMetadataSchema.parse(data.metadata) : undefined;

    const verification = verifyAuditChain(entries);

    return {
      entries,
      metadata,
      valid: verification.valid,
      errors: verification.errors,
    };
  } catch (error) {
    return {
      entries: [],
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown error during import'],
    };
  }
}

/**
 * Audit ledger interface
 */
export interface AuditLedger {
  /** Append a new entry to the ledger */
  append(entry: Omit<AuditEntry, 'sequenceNumber' | 'previousHash' | 'hash' | 'entryId' | 'timestamp'>): Promise<AuditEntry>;
  
  /** Get an entry by ID */
  getEntry(entryId: string): Promise<AuditEntry | null>;
  
  /** Query entries */
  query(filters: Parameters<typeof queryAuditEntries>[1]): Promise<AuditEntry[]>;
  
  /** Verify chain integrity */
  verify(): Promise<ReturnType<typeof verifyAuditChain>>;
  
  /** Get chain metadata */
  getMetadata(): Promise<AuditChainMetadata>;
  
  /** Export chain */
  export(): Promise<string>;
}
