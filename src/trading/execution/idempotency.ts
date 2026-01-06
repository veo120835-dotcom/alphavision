// Idempotency Guard - Prevents duplicate order submissions

interface IdempotencyRecord {
  key: string;
  orderData: unknown;
  createdAt: Date;
  expiresAt: Date;
}

class IdempotencyGuard {
  private records: Map<string, IdempotencyRecord> = new Map();
  private ttlMs: number = 60 * 60 * 1000; // 1 hour default

  setTTL(ttlMs: number): void {
    this.ttlMs = ttlMs;
  }

  checkAndRecord(key: string, orderData: unknown): boolean {
    this.cleanup();
    
    if (this.records.has(key)) {
      return false; // Duplicate detected
    }

    const record: IdempotencyRecord = {
      key,
      orderData,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.ttlMs)
    };
    
    this.records.set(key, record);
    return true;
  }

  check(key: string): boolean {
    this.cleanup();
    return !this.records.has(key);
  }

  getRecord(key: string): IdempotencyRecord | undefined {
    return this.records.get(key);
  }

  invalidate(key: string): void {
    this.records.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    this.records.forEach((record, key) => {
      if (record.expiresAt.getTime() < now) {
        this.records.delete(key);
      }
    });
  }

  generateKey(userId: string, symbol: string, side: string, quantity: number, timestamp?: number): string {
    const ts = timestamp || Math.floor(Date.now() / 1000);
    return `${userId}-${symbol}-${side}-${quantity}-${ts}`;
  }

  clear(): void {
    this.records.clear();
  }
}

export const idempotencyGuard = new IdempotencyGuard();
