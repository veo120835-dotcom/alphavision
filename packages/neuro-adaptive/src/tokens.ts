import { z } from 'zod';

/**
 * Adaptation tokens schema
 * 
 * Tokens that encode contextual state for adaptive behavior modifications.
 * These are short-lived context indicators that modify AI behavior in real-time.
 */

export const AdaptationTokenSchema = z.object({
  /** Token ID */
  tokenId: z.string().uuid(),
  
  /** User ID */
  userId: z.string(),
  
  /** Token type */
  type: z.enum([
    'context',
    'mood',
    'urgency',
    'focus',
    'stress',
    'learning',
    'preference',
    'session',
  ]),
  
  /** Token value/data */
  value: z.unknown(),
  
  /** Token strength/confidence (0-1) */
  strength: z.number().min(0).max(1),
  
  /** Token creation timestamp */
  createdAt: z.string().datetime(),
  
  /** Token expiration timestamp */
  expiresAt: z.string().datetime(),
  
  /** Source of the token */
  source: z.enum(['explicit', 'inferred', 'learned']),
  
  /** Metadata */
  metadata: z.record(z.unknown()).optional(),
});

export type AdaptationToken = z.infer<typeof AdaptationTokenSchema>;

/**
 * Context adaptation token
 */
export const ContextTokenSchema = AdaptationTokenSchema.extend({
  type: z.literal('context'),
  value: z.object({
    /** Current task/goal */
    task: z.string().optional(),
    
    /** Domain/topic */
    domain: z.string().optional(),
    
    /** Conversation context */
    conversationContext: z.array(z.string()).optional(),
    
    /** Active tools/integrations */
    activeTools: z.array(z.string()).optional(),
  }),
});

export type ContextToken = z.infer<typeof ContextTokenSchema>;

/**
 * Mood adaptation token
 */
export const MoodTokenSchema = AdaptationTokenSchema.extend({
  type: z.literal('mood'),
  value: z.object({
    /** Mood valence (-1 to 1) */
    valence: z.number().min(-1).max(1),
    
    /** Mood arousal (0 to 1) */
    arousal: z.number().min(0).max(1),
    
    /** Mood label */
    label: z.enum(['positive', 'negative', 'neutral', 'frustrated', 'excited', 'calm']).optional(),
  }),
});

export type MoodToken = z.infer<typeof MoodTokenSchema>;

/**
 * Urgency adaptation token
 */
export const UrgencyTokenSchema = AdaptationTokenSchema.extend({
  type: z.literal('urgency'),
  value: z.object({
    /** Urgency level (0-1) */
    level: z.number().min(0).max(1),
    
    /** Deadline if applicable */
    deadline: z.string().datetime().optional(),
    
    /** Reason for urgency */
    reason: z.string().optional(),
  }),
});

export type UrgencyToken = z.infer<typeof UrgencyTokenSchema>;

/**
 * Focus adaptation token
 */
export const FocusTokenSchema = AdaptationTokenSchema.extend({
  type: z.literal('focus'),
  value: z.object({
    /** Focus level (0-1) */
    level: z.number().min(0).max(1),
    
    /** Focus target */
    target: z.string().optional(),
    
    /** Distraction level (0-1) */
    distraction: z.number().min(0).max(1).optional(),
  }),
});

export type FocusToken = z.infer<typeof FocusTokenSchema>;

/**
 * Stress adaptation token
 */
export const StressTokenSchema = AdaptationTokenSchema.extend({
  type: z.literal('stress'),
  value: z.object({
    /** Stress level (0-1) */
    level: z.number().min(0).max(1),
    
    /** Stress indicators */
    indicators: z.array(z.enum(['time-pressure', 'complexity', 'uncertainty', 'workload'])).optional(),
  }),
});

export type StressToken = z.infer<typeof StressTokenSchema>;

/**
 * Learning adaptation token
 */
export const LearningTokenSchema = AdaptationTokenSchema.extend({
  type: z.literal('learning'),
  value: z.object({
    /** Learning mode active */
    active: z.boolean(),
    
    /** Topic being learned */
    topic: z.string().optional(),
    
    /** Learning stage */
    stage: z.enum(['novice', 'intermediate', 'advanced', 'expert']).optional(),
  }),
});

export type LearningToken = z.infer<typeof LearningTokenSchema>;

/**
 * Session adaptation token
 */
export const SessionTokenSchema = AdaptationTokenSchema.extend({
  type: z.literal('session'),
  value: z.object({
    /** Session ID */
    sessionId: z.string(),
    
    /** Session start time */
    startedAt: z.string().datetime(),
    
    /** Session type */
    sessionType: z.enum(['work', 'planning', 'learning', 'exploratory']).optional(),
    
    /** Session goals */
    goals: z.array(z.string()).optional(),
  }),
});

export type SessionToken = z.infer<typeof SessionTokenSchema>;

/**
 * Collection of adaptation tokens for a user
 */
export const AdaptationTokenCollectionSchema = z.object({
  userId: z.string(),
  tokens: z.array(AdaptationTokenSchema),
  updatedAt: z.string().datetime(),
});

export type AdaptationTokenCollection = z.infer<typeof AdaptationTokenCollectionSchema>;

/**
 * Create a new adaptation token
 */
export function createAdaptationToken<T extends AdaptationToken>(
  params: Omit<T, 'tokenId' | 'createdAt'> & {
    ttlMinutes?: number;
  }
): T {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (params.ttlMinutes ?? 60) * 60 * 1000);

  return {
    ...params,
    tokenId: crypto.randomUUID(),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  } as T;
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: AdaptationToken): boolean {
  return new Date(token.expiresAt) < new Date();
}

/**
 * Filter expired tokens from a collection
 */
export function filterExpiredTokens(tokens: AdaptationToken[]): AdaptationToken[] {
  return tokens.filter((token) => !isTokenExpired(token));
}

/**
 * Get active tokens of a specific type
 */
export function getActiveTokensByType<T extends AdaptationToken>(
  tokens: AdaptationToken[],
  type: T['type']
): T[] {
  return filterExpiredTokens(tokens).filter((token) => token.type === type) as T[];
}

/**
 * Merge multiple tokens of the same type
 */
export function mergeTokens(tokens: AdaptationToken[]): AdaptationToken | null {
  if (tokens.length === 0) return null;
  if (tokens.length === 1) return tokens[0]!;

  const activeTokens = filterExpiredTokens(tokens);
  if (activeTokens.length === 0) return null;

  // Take the most recent token
  return activeTokens.reduce((latest, current) =>
    new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
  );
}

/**
 * Calculate effective strength of combined tokens
 */
export function calculateEffectiveStrength(tokens: AdaptationToken[]): number {
  const activeTokens = filterExpiredTokens(tokens);
  if (activeTokens.length === 0) return 0;

  // Weight more recent tokens higher
  const now = Date.now();
  const weights = activeTokens.map((token) => {
    const age = now - new Date(token.createdAt).getTime();
    const maxAge = new Date(token.expiresAt).getTime() - new Date(token.createdAt).getTime();
    return 1 - age / maxAge;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const weightedStrength = activeTokens.reduce(
    (sum, token, i) => sum + token.strength * (weights[i] ?? 0),
    0
  );

  return weightedStrength / totalWeight;
}
