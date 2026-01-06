import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface IdempotencyResult<T = any> {
  isProcessed: boolean;
  response?: T;
}

export class IdempotencyManager {
  private supabase: SupabaseClient;
  private readonly TABLE_NAME = "idempotency_keys";

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async checkOrStore<T>(
    key: string,
    organizationId: string,
    ttlSeconds = 86400
  ): Promise<IdempotencyResult<T>> {
    const { data: existing } = await this.supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("key", key)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (existing) {
      const expiresAt = new Date(existing.expires_at);
      if (expiresAt > new Date()) {
        return {
          isProcessed: true,
          response: existing.response_data as T,
        };
      } else {
        await this.supabase
          .from(this.TABLE_NAME)
          .delete()
          .eq("key", key);
      }
    }

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await this.supabase
      .from(this.TABLE_NAME)
      .insert({
        key,
        organization_id: organizationId,
        status: "processing",
        expires_at: expiresAt.toISOString(),
      });

    return { isProcessed: false };
  }

  async storeResult<T>(
    key: string,
    organizationId: string,
    response: T,
    status: "completed" | "failed" = "completed"
  ): Promise<void> {
    await this.supabase
      .from(this.TABLE_NAME)
      .update({
        status,
        response_data: response,
        completed_at: new Date().toISOString(),
      })
      .eq("key", key)
      .eq("organization_id", organizationId);
  }

  async cleanup(): Promise<void> {
    await this.supabase
      .from(this.TABLE_NAME)
      .delete()
      .lt("expires_at", new Date().toISOString());
  }
}

export function generateIdempotencyKey(
  prefix: string,
  ...parts: string[]
): string {
  const combined = [prefix, ...parts].join(":");
  return `${prefix}:${hashString(combined)}`;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export async function withIdempotency<T>(
  manager: IdempotencyManager,
  key: string,
  organizationId: string,
  operation: () => Promise<T>
): Promise<T> {
  const check = await manager.checkOrStore<T>(key, organizationId);

  if (check.isProcessed) {
    return check.response!;
  }

  try {
    const result = await operation();
    await manager.storeResult(key, organizationId, result, "completed");
    return result;
  } catch (error) {
    await manager.storeResult(
      key,
      organizationId,
      { error: error instanceof Error ? error.message : String(error) },
      "failed"
    );
    throw error;
  }
}
