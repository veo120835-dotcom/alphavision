import { supabase } from '@/integrations/supabase/client';
import type { PromptRun, PromptMetrics } from '@/prompt-studio/types';

export interface CreateRunInput {
  client_id?: string;
  prompt_template_id?: string;
  template_version?: number;
  inputs?: Record<string, unknown>;
  output?: string;
}

export interface RunFilters {
  client_id?: string;
  prompt_template_id?: string;
  start_date?: string;
  end_date?: string;
  has_rating?: boolean;
  min_rating?: number;
}

export class PromptRunService {
  /**
   * Create a new prompt run record
   */
  async createRun(input: CreateRunInput): Promise<PromptRun> {
    const { data, error } = await supabase
      .from('prompt_runs')
      .insert({
        client_id: input.client_id,
        prompt_template_id: input.prompt_template_id,
        template_version: input.template_version || 1,
        inputs: input.inputs || {},
        output: input.output,
        metrics: {},
      } as any)
      .select()
      .single();

    if (error) throw error;
    return this.mapToPromptRun(data);
  }

  /**
   * Get a specific run by ID
   */
  async getRun(id: string): Promise<PromptRun | null> {
    const { data, error } = await supabase
      .from('prompt_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapToPromptRun(data);
  }

  /**
   * Get runs with filters
   */
  async getRuns(filters: RunFilters, limit: number = 100): Promise<PromptRun[]> {
    let query = supabase
      .from('prompt_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id);
    }
    if (filters.prompt_template_id) {
      query = query.eq('prompt_template_id', filters.prompt_template_id);
    }
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }
    if (filters.has_rating) {
      query = query.not('human_rating', 'is', null);
    }
    if (filters.min_rating) {
      query = query.gte('human_rating', filters.min_rating);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(this.mapToPromptRun);
  }

  /**
   * Get runs for a specific prompt
   */
  async getRunsForPrompt(promptId: string, limit: number = 100): Promise<PromptRun[]> {
    return this.getRuns({ prompt_template_id: promptId }, limit);
  }

  /**
   * Get runs for a specific client
   */
  async getRunsForClient(clientId: string, limit: number = 100): Promise<PromptRun[]> {
    return this.getRuns({ client_id: clientId }, limit);
  }

  /**
   * Update metrics for a run
   */
  async updateMetrics(runId: string, metrics: Partial<PromptMetrics>): Promise<PromptRun> {
    const existing = await this.getRun(runId);
    if (!existing) {
      throw new Error('Run not found');
    }

    const updatedMetrics = { ...existing.metrics, ...metrics };

    const { data, error } = await supabase
      .from('prompt_runs')
      .update({ metrics: updatedMetrics })
      .eq('id', runId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToPromptRun(data);
  }

  /**
   * Add human rating to a run
   */
  async addRating(runId: string, rating: number, feedback?: string): Promise<PromptRun> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const updateData: Record<string, unknown> = { human_rating: rating };
    if (feedback) {
      updateData.feedback = feedback;
    }

    const { data, error } = await supabase
      .from('prompt_runs')
      .update(updateData)
      .eq('id', runId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToPromptRun(data);
  }

  /**
   * Record an outcome event for a run
   */
  async recordOutcome(runId: string, eventType: string, eventData?: Record<string, unknown>): Promise<PromptRun> {
    const existing = await this.getRun(runId);
    if (!existing) {
      throw new Error('Run not found');
    }

    const metrics = { ...existing.metrics };

    // Update relevant metric based on event type
    switch (eventType) {
      case 'opened':
        metrics.open_rate = 1;
        break;
      case 'replied':
        metrics.reply_rate = 1;
        break;
      case 'clicked':
        metrics.click_rate = 1;
        break;
      case 'converted':
        metrics.conversion_rate = 1;
        break;
      case 'booked_call':
        metrics.booked_calls = (metrics.booked_calls || 0) + 1;
        break;
      case 'complaint':
        metrics.complaint_rate = 1;
        break;
    }

    return this.updateMetrics(runId, metrics);
  }

  /**
   * Get aggregate stats for a prompt
   */
  async getPromptStats(promptId: string): Promise<{
    total_runs: number;
    avg_rating: number | null;
    reply_rate: number;
    conversion_rate: number;
    open_rate: number;
  }> {
    const runs = await this.getRunsForPrompt(promptId, 1000);

    if (runs.length === 0) {
      return {
        total_runs: 0,
        avg_rating: null,
        reply_rate: 0,
        conversion_rate: 0,
        open_rate: 0,
      };
    }

    let totalRating = 0;
    let ratingCount = 0;
    let replyCount = 0;
    let conversionCount = 0;
    let openCount = 0;

    for (const run of runs) {
      if (run.human_rating) {
        totalRating += run.human_rating;
        ratingCount++;
      }
      if (run.metrics?.reply_rate) replyCount++;
      if (run.metrics?.conversion_rate) conversionCount++;
      if (run.metrics?.open_rate) openCount++;
    }

    return {
      total_runs: runs.length,
      avg_rating: ratingCount > 0 ? totalRating / ratingCount : null,
      reply_rate: runs.length > 0 ? replyCount / runs.length : 0,
      conversion_rate: runs.length > 0 ? conversionCount / runs.length : 0,
      open_rate: runs.length > 0 ? openCount / runs.length : 0,
    };
  }

  /**
   * Delete a run
   */
  async deleteRun(id: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_runs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete old runs (cleanup)
   */
  async deleteOldRuns(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data, error } = await supabase
      .from('prompt_runs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  }

  private mapToPromptRun(data: Record<string, unknown>): PromptRun {
    return {
      id: data.id as string,
      client_id: data.client_id as string | undefined,
      prompt_template_id: data.prompt_template_id as string | undefined,
      template_version: (data.template_version as number) || 1,
      inputs: (data.inputs as Record<string, unknown>) || {},
      output: data.output as string | undefined,
      metrics: (data.metrics as PromptMetrics) || {},
      human_rating: data.human_rating as number | undefined,
      feedback: data.feedback as string | undefined,
      created_at: data.created_at as string,
    };
  }
}

export const promptRunService = new PromptRunService();
