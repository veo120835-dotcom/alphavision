// ============================================
// CRYPTO UTILITIES - HMAC Verification & Retry
// ============================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-av-org-id, x-av-action-id, x-av-timestamp, x-av-nonce, x-av-signature, x-webhook-secret, stripe-signature',
};

// ============ HMAC SIGNATURE VERIFICATION ============

export async function verifyHmacSignature(
  body: string,
  timestamp: string,
  nonce: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${body}.${timestamp}.${nonce}`);
    const keyData = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const computedSig = await crypto.subtle.sign('HMAC', key, data);
    const computedHex = bytesToHex(new Uint8Array(computedSig));
    
    return computedHex === signature;
  } catch (e) {
    console.error('HMAC verification failed:', e);
    return false;
  }
}

export function generateHmacSignature(
  body: string,
  timestamp: string,
  nonce: string,
  secret: string
): Promise<string> {
  return new Promise(async (resolve) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${body}.${timestamp}.${nonce}`);
    const keyData = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, data);
    resolve(bytesToHex(new Uint8Array(signature)));
  });
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============ STRIPE SIGNATURE VERIFICATION ============

export async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const elements = signature.split(',');
    const timestampPart = elements.find(e => e.startsWith('t='));
    const signaturePart = elements.find(e => e.startsWith('v1='));
    
    if (!timestampPart || !signaturePart) return false;
    
    const timestamp = timestampPart.replace('t=', '');
    const expectedSig = signaturePart.replace('v1=', '');
    
    // Check timestamp (5 minute tolerance)
    const ts = parseInt(timestamp);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > 300) {
      console.error('Stripe signature expired');
      return false;
    }
    
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const data = encoder.encode(signedPayload);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const computedSig = await crypto.subtle.sign('HMAC', key, data);
    const computedHex = bytesToHex(new Uint8Array(computedSig));
    
    return computedHex === expectedSig;
  } catch (e) {
    console.error('Stripe signature verification failed:', e);
    return false;
  }
}

// ============ RETRY WITH EXPONENTIAL BACKOFF ============

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    onRetry
  } = retryOptions;
  
  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Retry on 5xx errors
      if (response.status >= 500 && attempt < maxRetries) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      // Retry on rate limit
      if (response.status === 429 && attempt < maxRetries) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : calculateDelay(attempt, baseDelayMs, maxDelayMs);
        await sleep(delay);
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs);
        console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
        
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }
        
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ REQUEST VALIDATION ============

export function validateTimestamp(timestamp: string | null, toleranceSeconds = 300): boolean {
  if (!timestamp) return false;
  
  const ts = parseInt(timestamp);
  if (isNaN(ts)) return false;
  
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - ts) <= toleranceSeconds;
}

export function sanitizeInput(input: string, maxLength = 10000): string {
  if (!input) return '';
  return input.slice(0, maxLength).trim();
}
