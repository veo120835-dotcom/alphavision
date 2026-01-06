// Database helper functions for safe table access
import { supabase } from '@/integrations/supabase/client';

/**
 * Safe query wrapper that casts supabase to any to avoid type errors
 * for tables not yet in the generated types
 */
export function safeFrom(tableName: string) {
  return (supabase as any).from(tableName);
}

/**
 * Tables that exist in the database schema
 * Update this list when new tables are added via migrations
 */
export const EXISTING_TABLES = [
  'organizations',
  'memberships',
  'permission_contracts',
  'business_config',
  'agent_goals',
  'agent_audit_log',
  'opportunity_pipeline',
  'financial_snapshots',
  'automation_rules',
  'profiles',
  'user_roles',
  'sessions',
  'agent_states',
  'execution_tasks',
  'agent_execution_logs',
  'decisions',
  'decision_outcomes',
  'taste_preferences',
  'founder_state_logs',
  'leads',
  'revenue_events',
  'approval_requests',
  'daily_priorities',
  'constraint_hierarchy',
] as const;

export type ExistingTable = typeof EXISTING_TABLES[number];

/**
 * Check if a table exists in the known schema
 */
export function isKnownTable(tableName: string): tableName is ExistingTable {
  return EXISTING_TABLES.includes(tableName as ExistingTable);
}

/**
 * Safe select query that returns empty array for non-existent tables
 */
export async function safeSelect<T = any>(
  tableName: string,
  organizationId: string,
  options: {
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
  } = {}
): Promise<{ data: T[]; error: Error | null }> {
  try {
    let query = safeFrom(tableName)
      .select('*')
      .eq('organization_id', organizationId);
    
    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    return { data: (data || []) as T[], error };
  } catch (error) {
    console.warn(`Failed to query table ${tableName}:`, error);
    return { data: [], error: error as Error };
  }
}
