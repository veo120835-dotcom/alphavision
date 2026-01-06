import { supabase } from '@/integrations/supabase/client';
import type { ClientMemory, MemoryType } from '@/prompt-studio/types';

export interface CreateMemoryInput {
  client_id: string;
  memory_type: MemoryType;
  key: string;
  value: Record<string, unknown>;
  relevance_score?: number;
  expires_at?: string;
}

export interface MemoryQuery {
  client_id: string;
  memory_type?: MemoryType;
  keys?: string[];
  min_relevance?: number;
  include_expired?: boolean;
  limit?: number;
}

export class MemoryService {
  /**
   * Store a new memory entry
   */
  async store(input: CreateMemoryInput): Promise<ClientMemory> {
    const { data, error } = await supabase
      .from('client_memory')
      .insert({
        client_id: input.client_id,
        memory_type: input.memory_type,
        key: input.key,
        value: input.value,
        relevance_score: input.relevance_score ?? 1.0,
        expires_at: input.expires_at,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return this.mapToClientMemory(data);
  }

  /**
   * Update or insert a memory (upsert by client_id + key)
   */
  async upsert(input: CreateMemoryInput): Promise<ClientMemory> {
    // Check if memory with this key exists
    const existing = await this.getByKey(input.client_id, input.key);

    if (existing) {
      return this.update(existing.id, {
        value: input.value,
        relevance_score: input.relevance_score,
        expires_at: input.expires_at,
      });
    }

    return this.store(input);
  }

  /**
   * Get a specific memory by key
   */
  async getByKey(clientId: string, key: string): Promise<ClientMemory | null> {
    const { data, error } = await supabase
      .from('client_memory')
      .select('*')
      .eq('client_id', clientId)
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapToClientMemory(data);
  }

  /**
   * Query memories with filters
   */
  async query(query: MemoryQuery): Promise<ClientMemory[]> {
    let dbQuery = supabase
      .from('client_memory')
      .select('*')
      .eq('client_id', query.client_id);

    if (query.memory_type) {
      dbQuery = dbQuery.eq('memory_type', query.memory_type);
    }

    if (query.keys && query.keys.length > 0) {
      dbQuery = dbQuery.in('key', query.keys);
    }

    if (query.min_relevance !== undefined) {
      dbQuery = dbQuery.gte('relevance_score', query.min_relevance);
    }

    if (!query.include_expired) {
      dbQuery = dbQuery.or('expires_at.is.null,expires_at.gt.now()');
    }

    dbQuery = dbQuery.order('relevance_score', { ascending: false });

    if (query.limit) {
      dbQuery = dbQuery.limit(query.limit);
    }

    const { data, error } = await dbQuery;

    if (error) throw error;
    return (data || []).map(this.mapToClientMemory);
  }

  /**
   * Get all semantic memories for a client
   */
  async getSemanticMemories(clientId: string, limit?: number): Promise<ClientMemory[]> {
    return this.query({
      client_id: clientId,
      memory_type: 'semantic',
      limit,
    });
  }

  /**
   * Get recent episodic memories for a client
   */
  async getEpisodicMemories(clientId: string, limit?: number): Promise<ClientMemory[]> {
    return this.query({
      client_id: clientId,
      memory_type: 'episodic',
      limit: limit || 10,
    });
  }

  /**
   * Get all memories relevant for prompt context
   */
  async getContextMemories(clientId: string): Promise<{
    semantic: ClientMemory[];
    episodic: ClientMemory[];
  }> {
    const [semantic, episodic] = await Promise.all([
      this.getSemanticMemories(clientId, 10),
      this.getEpisodicMemories(clientId, 5),
    ]);

    return { semantic, episodic };
  }

  /**
   * Update a memory entry
   */
  async update(memoryId: string, updates: {
    value?: Record<string, unknown>;
    relevance_score?: number;
    expires_at?: string | null;
  }): Promise<ClientMemory> {
    const updateData: Record<string, unknown> = {};

    if (updates.value !== undefined) updateData.value = updates.value;
    if (updates.relevance_score !== undefined) updateData.relevance_score = updates.relevance_score;
    if (updates.expires_at !== undefined) updateData.expires_at = updates.expires_at;

    const { data, error } = await supabase
      .from('client_memory')
      .update(updateData)
      .eq('id', memoryId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToClientMemory(data);
  }

  /**
   * Delete a memory entry
   */
  async delete(memoryId: string): Promise<void> {
    const { error } = await supabase
      .from('client_memory')
      .delete()
      .eq('id', memoryId);

    if (error) throw error;
  }

  /**
   * Delete all memories for a client
   */
  async deleteAllForClient(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('client_memory')
      .delete()
      .eq('client_id', clientId);

    if (error) throw error;
  }

  /**
   * Delete expired memories (cleanup job)
   */
  async deleteExpired(): Promise<number> {
    const { data, error } = await supabase
      .from('client_memory')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  }

  /**
   * Decay relevance scores over time (for episodic memories)
   */
  async decayRelevance(decayFactor: number = 0.95): Promise<void> {
    // Get all episodic memories
    const { data, error } = await supabase
      .from('client_memory')
      .select('id, relevance_score')
      .eq('memory_type', 'episodic');

    if (error) throw error;

    // Update each with decayed score
    for (const memory of data || []) {
      const newScore = Math.max(0.1, (memory.relevance_score as number) * decayFactor);
      await supabase
        .from('client_memory')
        .update({ relevance_score: newScore })
        .eq('id', memory.id);
    }
  }

  /**
   * Store an interaction as episodic memory
   */
  async storeInteraction(
    clientId: string,
    interactionType: string,
    details: Record<string, unknown>,
    expiresInDays: number = 30
  ): Promise<ClientMemory> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return this.store({
      client_id: clientId,
      memory_type: 'episodic',
      key: `interaction_${interactionType}_${Date.now()}`,
      value: {
        type: interactionType,
        timestamp: new Date().toISOString(),
        ...details,
      },
      relevance_score: 1.0,
      expires_at: expiresAt.toISOString(),
    });
  }

  /**
   * Store a learned fact as semantic memory
   */
  async storeFact(
    clientId: string,
    key: string,
    value: Record<string, unknown>
  ): Promise<ClientMemory> {
    return this.upsert({
      client_id: clientId,
      memory_type: 'semantic',
      key,
      value,
      relevance_score: 1.0,
    });
  }

  private mapToClientMemory(data: Record<string, unknown>): ClientMemory {
    return {
      id: data.id as string,
      client_id: data.client_id as string,
      memory_type: data.memory_type as MemoryType,
      key: data.key as string,
      value: (data.value as Record<string, unknown>) || {},
      relevance_score: Number(data.relevance_score) || 1.0,
      expires_at: data.expires_at as string | undefined,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    };
  }
}

export const memoryService = new MemoryService();
