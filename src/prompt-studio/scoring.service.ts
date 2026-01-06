import { supabase } from '@/integrations/supabase/client';
import type { PromptTemplate, PromptRun, PromptMetrics, PromptScore, PromptScoreWeights } from './types';
import { promptService } from './prompt.service';

const DEFAULT_WEIGHTS: PromptScoreWeights = {
  reply_rate: 0.3,
  conversion: 0.4,
  sentiment: 0.2,
  complaints: 0.1,
};

const CHAMPION_THRESHOLD = 0.75;
const DEPRECATION_THRESHOLD = 0.3;
const MIN_SAMPLE_SIZE = 10;

export interface ScoringResult {
  score: PromptScore;
  recommendation: 'promote' | 'maintain' | 'deprecate' | 'insufficient_data';
  suggested_action?: string;
}

export class ScoringService {
  private weights: PromptScoreWeights;

  constructor(weights: Partial<PromptScoreWeights> = {}) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  /**
   * Calculate the performance score for a prompt based on its runs
   */
  async calculateScore(promptId: string): Promise<ScoringResult> {
    const runs = await this.getPromptRuns(promptId);

    if (runs.length < MIN_SAMPLE_SIZE) {
      return {
        score: this.createEmptyScore(promptId),
        recommendation: 'insufficient_data',
        suggested_action: `Need ${MIN_SAMPLE_SIZE - runs.length} more runs for reliable scoring`,
      };
    }

    const aggregatedMetrics = this.aggregateMetrics(runs);
    const score = this.computeScore(promptId, aggregatedMetrics, runs.length);

    // Update the prompt's stored score
    await this.updatePromptScore(promptId, score.score);

    const recommendation = this.getRecommendation(score.score);

    return {
      score,
      recommendation,
      suggested_action: this.getSuggestedAction(recommendation, score),
    };
  }

  /**
   * Calculate scores for all prompts of a client
   */
  async calculateClientScores(clientId: string): Promise<Map<string, ScoringResult>> {
    const prompts = await promptService.getPromptsByClient(clientId);
    const results = new Map<string, ScoringResult>();

    for (const prompt of prompts) {
      const result = await this.calculateScore(prompt.id);
      results.set(prompt.id, result);
    }

    return results;
  }

  /**
   * Get the top performing prompts for an intent
   */
  async getTopPerformers(intent: string, limit: number = 5): Promise<PromptTemplate[]> {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .contains('intent_tags', [intent])
      .in('status', ['active', 'champion'])
      .order('performance_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as unknown as PromptTemplate[];
  }

  /**
   * Compare two prompts (A/B test style)
   */
  async comparePrompts(promptAId: string, promptBId: string): Promise<{
    winner: string;
    margin: number;
    confidence: string;
    details: { promptA: ScoringResult; promptB: ScoringResult };
  }> {
    const [resultA, resultB] = await Promise.all([
      this.calculateScore(promptAId),
      this.calculateScore(promptBId),
    ]);

    const scoreA = resultA.score.score;
    const scoreB = resultB.score.score;
    const margin = Math.abs(scoreA - scoreB);

    let confidence: string;
    if (margin > 0.2) confidence = 'high';
    else if (margin > 0.1) confidence = 'medium';
    else confidence = 'low';

    return {
      winner: scoreA >= scoreB ? promptAId : promptBId,
      margin,
      confidence,
      details: { promptA: resultA, promptB: resultB },
    };
  }

  /**
   * Log a prompt run with its metrics
   */
  async logRun(run: Omit<PromptRun, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase.from('prompt_runs').insert({
      client_id: run.client_id,
      prompt_template_id: run.prompt_template_id,
      template_version: run.template_version,
      inputs: run.inputs,
      output: run.output,
      metrics: run.metrics,
      human_rating: run.human_rating,
      feedback: run.feedback,
    } as any);

    if (error) throw error;

    // Recalculate score after new run
    if (run.prompt_template_id) {
      await this.calculateScore(run.prompt_template_id);
    }
  }

  /**
   * Update metrics for an existing run
   */
  async updateRunMetrics(runId: string, metrics: Partial<PromptMetrics>): Promise<void> {
    const { data: existing, error: fetchError } = await supabase
      .from('prompt_runs')
      .select('metrics, prompt_template_id')
      .eq('id', runId)
      .single();

    if (fetchError) throw fetchError;

    const updatedMetrics = { ...(existing.metrics as object || {}), ...metrics };

    const { error: updateError } = await supabase
      .from('prompt_runs')
      .update({ metrics: updatedMetrics })
      .eq('id', runId);

    if (updateError) throw updateError;

    // Recalculate score
    if (existing.prompt_template_id) {
      await this.calculateScore(existing.prompt_template_id as string);
    }
  }

  /**
   * Auto-promote/demote prompts based on scores
   */
  async runAutoPromotion(): Promise<{
    promoted: string[];
    deprecated: string[];
    maintained: string[];
  }> {
    const { data: prompts, error } = await supabase
      .from('prompt_templates')
      .select('id')
      .in('status', ['active', 'challenger']);

    if (error) throw error;

    const promoted: string[] = [];
    const deprecated: string[] = [];
    const maintained: string[] = [];

    for (const prompt of prompts || []) {
      const result = await this.calculateScore(prompt.id as string);

      if (result.recommendation === 'promote') {
        await promptService.promoteToChampion(prompt.id as string);
        promoted.push(prompt.id as string);
      } else if (result.recommendation === 'deprecate') {
        await promptService.deprecatePrompt(prompt.id as string);
        deprecated.push(prompt.id as string);
      } else {
        maintained.push(prompt.id as string);
      }
    }

    return { promoted, deprecated, maintained };
  }

  private async getPromptRuns(promptId: string): Promise<PromptRun[]> {
    const { data, error } = await supabase
      .from('prompt_runs')
      .select('*')
      .eq('prompt_template_id', promptId)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    return (data || []) as unknown as PromptRun[];
  }

  private aggregateMetrics(runs: PromptRun[]): PromptMetrics {
    if (runs.length === 0) {
      return { reply_rate: 0, conversion_rate: 0, sentiment_score: 0, complaint_rate: 0 };
    }

    let totalReply = 0;
    let totalConversion = 0;
    let totalSentiment = 0;
    let totalComplaint = 0;
    let countReply = 0;
    let countConversion = 0;
    let countSentiment = 0;
    let countComplaint = 0;

    for (const run of runs) {
      const metrics = run.metrics || {};
      if (metrics.reply_rate !== undefined) {
        totalReply += metrics.reply_rate;
        countReply++;
      }
      if (metrics.conversion_rate !== undefined) {
        totalConversion += metrics.conversion_rate;
        countConversion++;
      }
      if (metrics.sentiment_score !== undefined) {
        totalSentiment += metrics.sentiment_score;
        countSentiment++;
      }
      if (metrics.complaint_rate !== undefined) {
        totalComplaint += metrics.complaint_rate;
        countComplaint++;
      }
    }

    return {
      reply_rate: countReply > 0 ? totalReply / countReply : 0,
      conversion_rate: countConversion > 0 ? totalConversion / countConversion : 0,
      sentiment_score: countSentiment > 0 ? totalSentiment / countSentiment : 0.5,
      complaint_rate: countComplaint > 0 ? totalComplaint / countComplaint : 0,
    };
  }

  private computeScore(promptId: string, metrics: PromptMetrics, sampleSize: number): PromptScore {
    const replyContribution = (metrics.reply_rate || 0) * this.weights.reply_rate;
    const conversionContribution = (metrics.conversion_rate || 0) * this.weights.conversion;
    const sentimentContribution = (metrics.sentiment_score || 0.5) * this.weights.sentiment;
    const complaintPenalty = (metrics.complaint_rate || 0) * this.weights.complaints;

    const score = Math.max(0, Math.min(1,
      replyContribution + conversionContribution + sentimentContribution - complaintPenalty
    ));

    return {
      prompt_id: promptId,
      version: 1, // Would need to fetch actual version
      score,
      components: {
        reply_contribution: replyContribution,
        conversion_contribution: conversionContribution,
        sentiment_contribution: sentimentContribution,
        complaint_penalty: complaintPenalty,
      },
      sample_size: sampleSize,
      calculated_at: new Date().toISOString(),
    };
  }

  private createEmptyScore(promptId: string): PromptScore {
    return {
      prompt_id: promptId,
      version: 1,
      score: 0,
      components: {
        reply_contribution: 0,
        conversion_contribution: 0,
        sentiment_contribution: 0,
        complaint_penalty: 0,
      },
      sample_size: 0,
      calculated_at: new Date().toISOString(),
    };
  }

  private getRecommendation(score: number): 'promote' | 'maintain' | 'deprecate' | 'insufficient_data' {
    if (score >= CHAMPION_THRESHOLD) return 'promote';
    if (score <= DEPRECATION_THRESHOLD) return 'deprecate';
    return 'maintain';
  }

  private getSuggestedAction(recommendation: string, score: PromptScore): string {
    switch (recommendation) {
      case 'promote':
        return `Score of ${score.score.toFixed(2)} exceeds champion threshold. Consider promoting to champion status.`;
      case 'deprecate':
        return `Score of ${score.score.toFixed(2)} is below deprecation threshold. Consider deprecating and creating a new variant.`;
      case 'maintain':
        return `Score of ${score.score.toFixed(2)} is acceptable. Monitor for improvements.`;
      default:
        return 'Collect more data for reliable recommendations.';
    }
  }

  private async updatePromptScore(promptId: string, score: number): Promise<void> {
    await supabase
      .from('prompt_templates')
      .update({ performance_score: score })
      .eq('id', promptId);
  }
}

export const scoringService = new ScoringService();
