import { promptRunService } from './prompt-run.service';
import { scoringService } from '@/prompt-studio/scoring.service';
import type { PromptMetrics, PromptRun } from '@/prompt-studio/types';

export interface MetricEvent {
  run_id: string;
  event_type: MetricEventType;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export type MetricEventType =
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'email_replied'
  | 'call_booked'
  | 'meeting_held'
  | 'proposal_sent'
  | 'deal_won'
  | 'deal_lost'
  | 'complaint_received'
  | 'positive_feedback'
  | 'negative_feedback';

export interface BatchMetricResult {
  processed: number;
  failed: number;
  errors: Array<{ run_id: string; error: string }>;
}

export class MetricsIngestService {
  private eventQueue: MetricEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private batchSize: number = 50;
  private flushIntervalMs: number = 5000;

  constructor() {
    // Start flush interval
    this.startFlushInterval();
  }

  /**
   * Queue a single metric event
   */
  queueEvent(event: MetricEvent): void {
    this.eventQueue.push({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });

    // Flush if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Process a single event immediately
   */
  async processEvent(event: MetricEvent): Promise<void> {
    const metricsUpdate = this.eventToMetrics(event);
    await promptRunService.updateMetrics(event.run_id, metricsUpdate);

    // Trigger score recalculation if needed
    const run = await promptRunService.getRun(event.run_id);
    if (run?.prompt_template_id) {
      await scoringService.calculateScore(run.prompt_template_id);
    }
  }

  /**
   * Process multiple events in batch
   */
  async processBatch(events: MetricEvent[]): Promise<BatchMetricResult> {
    const result: BatchMetricResult = {
      processed: 0,
      failed: 0,
      errors: [],
    };

    // Group events by run_id for efficiency
    const eventsByRun = new Map<string, MetricEvent[]>();
    for (const event of events) {
      const existing = eventsByRun.get(event.run_id) || [];
      existing.push(event);
      eventsByRun.set(event.run_id, existing);
    }

    // Process each run's events
    for (const [runId, runEvents] of eventsByRun) {
      try {
        // Merge all events into single metrics update
        const mergedMetrics = this.mergeEventMetrics(runEvents);
        await promptRunService.updateMetrics(runId, mergedMetrics);
        result.processed += runEvents.length;
      } catch (error) {
        result.failed += runEvents.length;
        result.errors.push({
          run_id: runId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Flush queued events
   */
  async flush(): Promise<BatchMetricResult> {
    if (this.eventQueue.length === 0) {
      return { processed: 0, failed: 0, errors: [] };
    }

    const eventsToProcess = [...this.eventQueue];
    this.eventQueue = [];

    return this.processBatch(eventsToProcess);
  }

  /**
   * Record email being sent
   */
  async recordEmailSent(runId: string): Promise<void> {
    await this.processEvent({
      run_id: runId,
      event_type: 'email_sent',
    });
  }

  /**
   * Record email being opened
   */
  async recordEmailOpened(runId: string): Promise<void> {
    await this.processEvent({
      run_id: runId,
      event_type: 'email_opened',
    });
  }

  /**
   * Record email click
   */
  async recordEmailClicked(runId: string, linkUrl?: string): Promise<void> {
    await this.processEvent({
      run_id: runId,
      event_type: 'email_clicked',
      metadata: linkUrl ? { link_url: linkUrl } : undefined,
    });
  }

  /**
   * Record email reply
   */
  async recordEmailReplied(runId: string, sentiment?: number): Promise<void> {
    await this.processEvent({
      run_id: runId,
      event_type: 'email_replied',
      value: sentiment,
    });
  }

  /**
   * Record call booked
   */
  async recordCallBooked(runId: string): Promise<void> {
    await this.processEvent({
      run_id: runId,
      event_type: 'call_booked',
    });
  }

  /**
   * Record deal won
   */
  async recordDealWon(runId: string, dealValue?: number): Promise<void> {
    await this.processEvent({
      run_id: runId,
      event_type: 'deal_won',
      value: dealValue,
    });
  }

  /**
   * Record deal lost
   */
  async recordDealLost(runId: string, reason?: string): Promise<void> {
    await this.processEvent({
      run_id: runId,
      event_type: 'deal_lost',
      metadata: reason ? { reason } : undefined,
    });
  }

  /**
   * Record complaint
   */
  async recordComplaint(runId: string, details?: string): Promise<void> {
    await this.processEvent({
      run_id: runId,
      event_type: 'complaint_received',
      metadata: details ? { details } : undefined,
    });
  }

  /**
   * Get conversion funnel stats for a prompt
   */
  async getConversionFunnel(promptId: string): Promise<{
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    booked: number;
    won: number;
    open_rate: number;
    click_rate: number;
    reply_rate: number;
    booking_rate: number;
    win_rate: number;
  }> {
    const runs = await promptRunService.getRunsForPrompt(promptId, 1000);

    let sent = 0;
    let opened = 0;
    let clicked = 0;
    let replied = 0;
    let booked = 0;
    let won = 0;

    for (const run of runs) {
      sent++;
      if (run.metrics?.open_rate) opened++;
      if (run.metrics?.click_rate) clicked++;
      if (run.metrics?.reply_rate) replied++;
      if (run.metrics?.booked_calls) booked++;
      if (run.metrics?.conversion_rate) won++;
    }

    return {
      sent,
      opened,
      clicked,
      replied,
      booked,
      won,
      open_rate: sent > 0 ? opened / sent : 0,
      click_rate: sent > 0 ? clicked / sent : 0,
      reply_rate: sent > 0 ? replied / sent : 0,
      booking_rate: sent > 0 ? booked / sent : 0,
      win_rate: sent > 0 ? won / sent : 0,
    };
  }

  /**
   * Stop the flush interval (for cleanup)
   */
  stopFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  private eventToMetrics(event: MetricEvent): Partial<PromptMetrics> {
    const metrics: Partial<PromptMetrics> = {};

    switch (event.event_type) {
      case 'email_opened':
        metrics.open_rate = 1;
        break;
      case 'email_clicked':
        metrics.click_rate = 1;
        break;
      case 'email_replied':
        metrics.reply_rate = 1;
        if (event.value !== undefined) {
          metrics.sentiment_score = event.value;
        }
        break;
      case 'call_booked':
        metrics.booked_calls = 1;
        break;
      case 'deal_won':
        metrics.conversion_rate = 1;
        break;
      case 'complaint_received':
        metrics.complaint_rate = 1;
        break;
    }

    return metrics;
  }

  private mergeEventMetrics(events: MetricEvent[]): Partial<PromptMetrics> {
    const merged: Partial<PromptMetrics> = {};

    for (const event of events) {
      const eventMetrics = this.eventToMetrics(event);
      Object.assign(merged, eventMetrics);
    }

    return merged;
  }
}

export const metricsIngestService = new MetricsIngestService();
