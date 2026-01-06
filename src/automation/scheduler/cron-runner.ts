// Cron Runner - Scheduled job execution

import { ScheduledJob, Playbook, ExecutionContext } from '../types';
import { eventBus, createEvent } from '../event-bus';

interface CronSchedule {
  minute: string;
  hour: string;
  day_of_month: string;
  month: string;
  day_of_week: string;
}

interface JobExecution {
  job_id: string;
  execution_id: string;
  started_at: Date;
  completed_at?: Date;
  status: 'running' | 'completed' | 'failed';
  error?: string;
  result?: Record<string, unknown>;
}

class CronRunner {
  private jobs: Map<string, ScheduledJob> = new Map();
  private executions: Map<string, JobExecution[]> = new Map();
  private playbooks: Map<string, Playbook> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private checkIntervalMs = 60000; // Check every minute
  private isRunning = false;

  registerJob(job: ScheduledJob): void {
    this.jobs.set(job.id, job);
    this.calculateNextRun(job);
  }

  unregisterJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  registerPlaybook(playbook: Playbook): void {
    this.playbooks.set(playbook.id, playbook);
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('[Cron Runner] Starting scheduler');

    this.intervalId = setInterval(() => {
      this.checkAndExecuteJobs();
    }, this.checkIntervalMs);

    // Initial check
    this.checkAndExecuteJobs();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[Cron Runner] Stopped scheduler');
  }

  private async checkAndExecuteJobs(): Promise<void> {
    const now = new Date();

    for (const job of this.jobs.values()) {
      if (!job.enabled) continue;
      
      if (job.next_run <= now) {
        await this.executeJob(job);
      }
    }
  }

  private async executeJob(job: ScheduledJob): Promise<void> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: JobExecution = {
      job_id: job.id,
      execution_id: executionId,
      started_at: new Date(),
      status: 'running',
    };

    this.recordExecution(job.id, execution);
    console.log(`[Cron Runner] Executing job: ${job.name}`);

    try {
      // Emit scheduled event
      const event = createEvent('scheduled', 'cron_runner', {
        job_id: job.id,
        job_name: job.name,
        playbook_id: job.playbook_id,
        execution_id: executionId,
      });

      await eventBus.emit(event);

      // Execute associated playbook
      const playbook = this.playbooks.get(job.playbook_id);
      if (playbook) {
        const context: ExecutionContext = {
          execution_id: executionId,
          playbook_id: job.playbook_id,
          trigger_event: event,
          variables: {
            scheduled_time: job.next_run,
            actual_time: new Date(),
          },
          started_at: new Date(),
          completed_steps: [],
          failed_steps: [],
        };

        // Playbook execution would happen here
        execution.result = { playbook_started: true, context };
      }

      execution.status = 'completed';
      execution.completed_at = new Date();

      // Update job stats
      job.last_run = new Date();
      job.run_count++;
      this.calculateNextRun(job);

      console.log(`[Cron Runner] Job completed: ${job.name}`);
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.completed_at = new Date();
      
      job.failure_count++;
      this.calculateNextRun(job);

      console.error(`[Cron Runner] Job failed: ${job.name}`, error);
    }
  }

  private recordExecution(jobId: string, execution: JobExecution): void {
    let executions = this.executions.get(jobId);
    if (!executions) {
      executions = [];
      this.executions.set(jobId, executions);
    }
    executions.push(execution);

    // Keep only last 100 executions per job
    if (executions.length > 100) {
      this.executions.set(jobId, executions.slice(-100));
    }
  }

  private calculateNextRun(job: ScheduledJob): void {
    const schedule = this.parseCronExpression(job.cron_expression);
    const now = new Date();
    const next = this.getNextCronTime(schedule, now);
    job.next_run = next;
  }

  private parseCronExpression(expression: string): CronSchedule {
    const parts = expression.split(' ');
    if (parts.length !== 5) {
      throw new Error(`Invalid cron expression: ${expression}`);
    }

    return {
      minute: parts[0],
      hour: parts[1],
      day_of_month: parts[2],
      month: parts[3],
      day_of_week: parts[4],
    };
  }

  private getNextCronTime(schedule: CronSchedule, from: Date): Date {
    // Simplified next run calculation
    // In production, use a proper cron parser library
    const next = new Date(from);
    next.setSeconds(0);
    next.setMilliseconds(0);
    next.setMinutes(next.getMinutes() + 1);

    // Handle common patterns
    if (schedule.minute !== '*') {
      const targetMinute = parseInt(schedule.minute, 10);
      if (next.getMinutes() > targetMinute) {
        next.setHours(next.getHours() + 1);
      }
      next.setMinutes(targetMinute);
    }

    if (schedule.hour !== '*') {
      const targetHour = parseInt(schedule.hour, 10);
      if (next.getHours() > targetHour || 
          (next.getHours() === targetHour && next.getMinutes() > 0)) {
        next.setDate(next.getDate() + 1);
      }
      next.setHours(targetHour);
    }

    return next;
  }

  getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  getJob(jobId: string): ScheduledJob | undefined {
    return this.jobs.get(jobId);
  }

  getExecutions(jobId: string): JobExecution[] {
    return this.executions.get(jobId) || [];
  }

  enableJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.enabled = true;
      this.calculateNextRun(job);
    }
  }

  disableJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.enabled = false;
    }
  }

  async triggerJobNow(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      await this.executeJob(job);
    }
  }

  getStatus(): { running: boolean; job_count: number; next_check: Date | null } {
    return {
      running: this.isRunning,
      job_count: this.jobs.size,
      next_check: this.isRunning ? new Date(Date.now() + this.checkIntervalMs) : null,
    };
  }
}

export const cronRunner = new CronRunner();
