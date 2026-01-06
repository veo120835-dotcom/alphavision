// In-memory rate limiter for edge functions
// Uses sliding window algorithm

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  'chat': { windowMs: 60000, maxRequests: 20 },        // 20 requests per minute
  'api': { windowMs: 60000, maxRequests: 60 },         // 60 requests per minute
  'auth': { windowMs: 300000, maxRequests: 10 },       // 10 requests per 5 minutes
  'webhook': { windowMs: 1000, maxRequests: 100 },     // 100 requests per second
  'default': { windowMs: 60000, maxRequests: 30 },     // 30 requests per minute
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;  // milliseconds until reset
}

export function checkRateLimit(
  identifier: string,  // Usually IP or user ID
  endpoint: string = 'default'
): RateLimitResult {
  const config = DEFAULT_CONFIGS[endpoint] || DEFAULT_CONFIGS['default'];
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now - entry.windowStart >= config.windowMs) {
    // New window
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs
    };
  }
  
  if (entry.count >= config.maxRequests) {
    const resetIn = config.windowMs - (now - entry.windowStart);
    return {
      allowed: false,
      remaining: 0,
      resetIn
    };
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: config.windowMs - (now - entry.windowStart)
  };
}

export function getRateLimitHeaders(result: RateLimitResult, endpoint: string = 'default'): Record<string, string> {
  const config = DEFAULT_CONFIGS[endpoint] || DEFAULT_CONFIGS['default'];
  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
  };
}

// Cleanup old entries periodically (call this in edge function)
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove entries older than 10 minutes
    if (now - entry.windowStart > 600000) {
      rateLimitStore.delete(key);
    }
  }
}
