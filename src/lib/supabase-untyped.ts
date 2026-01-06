import { supabase } from '@/integrations/supabase/client';

/**
 * Provides access to Supabase tables that may not be in the generated types yet.
 * Use this for tables that are created at runtime or not yet in the schema.
 * 
 * IMPORTANT: This bypasses TypeScript checking. Use with caution and ensure
 * the table/column names are correct.
 */
export const untypedSupabase = {
  /**
   * Access any table by name, bypassing type checks
   */
  from: (table: string) => {
    return (supabase as any).from(table);
  }
};

/**
 * Type-safe wrapper for common mock data operations using localStorage
 */
export class LocalStorageTable<T extends { id: string }> {
  constructor(private tableName: string, private orgId?: string) {}

  private getKey(): string {
    return this.orgId ? `${this.tableName}_${this.orgId}` : this.tableName;
  }

  select(): T[] {
    try {
      const stored = localStorage.getItem(this.getKey());
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  insert(item: Omit<T, 'id' | 'created_at'> & Partial<T>): T {
    const data = this.select();
    const newItem = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...item,
    } as T;
    localStorage.setItem(this.getKey(), JSON.stringify([...data, newItem]));
    return newItem;
  }

  update(id: string, updates: Partial<T>): T | null {
    const data = this.select();
    const idx = data.findIndex(item => item.id === id);
    if (idx === -1) return null;
    
    const updated = { ...data[idx], ...updates, updated_at: new Date().toISOString() };
    data[idx] = updated;
    localStorage.setItem(this.getKey(), JSON.stringify(data));
    return updated;
  }

  delete(id: string): boolean {
    const data = this.select();
    const filtered = data.filter(item => item.id !== id);
    if (filtered.length === data.length) return false;
    localStorage.setItem(this.getKey(), JSON.stringify(filtered));
    return true;
  }

  upsert(item: T): T {
    const data = this.select();
    const idx = data.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      data[idx] = { ...data[idx], ...item, updated_at: new Date().toISOString() };
    } else {
      data.push({ ...item, created_at: new Date().toISOString() });
    }
    localStorage.setItem(this.getKey(), JSON.stringify(data));
    return item;
  }

  clear(): void {
    localStorage.removeItem(this.getKey());
  }
}
