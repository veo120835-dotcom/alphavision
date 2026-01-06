// Action Log - Complete audit trail of all automated actions

import { ActionLog, ActionType, RiskTier } from '../types';

interface ActionLogQuery {
  playbook_id?: string;
  action_type?: ActionType;
  status?: ActionLog['status'];
  from_date?: Date;
  to_date?: Date;
  limit?: number;
  offset?: number;
}

interface ActionLogStats {
  total_actions: number;
  by_status: Record<ActionLog['status'], number>;
  by_action_type: Record<string, number>;
  average_duration_ms: number;
  success_rate: number;
  actions_per_hour: number;
}

class ActionLogService {
  private logs: ActionLog[] = [];
  private maxLogSize = 10000;

  log(action: Omit<ActionLog, 'id' | 'started_at'>): ActionLog {
    const logEntry: ActionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      started_at: new Date(),
      ...action,
    };

    this.logs.push(logEntry);
    this.trimLogs();

    console.log(`[Action Log] ${action.status}: ${action.action_type} in ${action.playbook_name}`);

    return logEntry;
  }

  updateLog(logId: string, updates: Partial<ActionLog>): ActionLog | null {
    const log = this.logs.find(l => l.id === logId);
    if (!log) return null;

    Object.assign(log, updates);

    if (updates.completed_at && log.started_at) {
      log.duration_ms = updates.completed_at.getTime() - log.started_at.getTime();
    }

    return log;
  }

  completeLog(logId: string, output?: Record<string, unknown>, error?: string): ActionLog | null {
    return this.updateLog(logId, {
      status: error ? 'failed' : 'completed',
      completed_at: new Date(),
      output,
      error,
    });
  }

  query(params: ActionLogQuery): ActionLog[] {
    let results = [...this.logs];

    if (params.playbook_id) {
      results = results.filter(l => l.playbook_id === params.playbook_id);
    }

    if (params.action_type) {
      results = results.filter(l => l.action_type === params.action_type);
    }

    if (params.status) {
      results = results.filter(l => l.status === params.status);
    }

    if (params.from_date) {
      results = results.filter(l => l.started_at >= params.from_date!);
    }

    if (params.to_date) {
      results = results.filter(l => l.started_at <= params.to_date!);
    }

    // Sort by most recent first
    results.sort((a, b) => b.started_at.getTime() - a.started_at.getTime());

    // Apply pagination
    const offset = params.offset || 0;
    const limit = params.limit || 100;
    return results.slice(offset, offset + limit);
  }

  getStats(timeWindowHours = 24): ActionLogStats {
    const cutoff = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
    const recentLogs = this.logs.filter(l => l.started_at >= cutoff);

    const byStatus: Record<ActionLog['status'], number> = {
      pending: 0,
      executing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    const byActionType: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;
    let successCount = 0;

    recentLogs.forEach(log => {
      byStatus[log.status]++;
      
      byActionType[log.action_type] = (byActionType[log.action_type] || 0) + 1;

      if (log.duration_ms) {
        totalDuration += log.duration_ms;
        durationCount++;
      }

      if (log.status === 'completed') {
        successCount++;
      }
    });

    const completedOrFailed = byStatus.completed + byStatus.failed;

    return {
      total_actions: recentLogs.length,
      by_status: byStatus,
      by_action_type: byActionType,
      average_duration_ms: durationCount > 0 ? totalDuration / durationCount : 0,
      success_rate: completedOrFailed > 0 ? successCount / completedOrFailed : 0,
      actions_per_hour: recentLogs.length / timeWindowHours,
    };
  }

  getLog(logId: string): ActionLog | undefined {
    return this.logs.find(l => l.id === logId);
  }

  getRecentLogs(count = 50): ActionLog[] {
    return this.logs.slice(-count).reverse();
  }

  getFailedLogs(since?: Date): ActionLog[] {
    let failed = this.logs.filter(l => l.status === 'failed');
    if (since) {
      failed = failed.filter(l => l.started_at >= since);
    }
    return failed.reverse();
  }

  getLogsByPlaybook(playbookId: string): ActionLog[] {
    return this.logs.filter(l => l.playbook_id === playbookId).reverse();
  }

  private trimLogs(): void {
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }
  }

  exportLogs(from: Date, to: Date): ActionLog[] {
    return this.logs.filter(l => l.started_at >= from && l.started_at <= to);
  }

  clear(): void {
    this.logs = [];
  }

  setMaxSize(size: number): void {
    this.maxLogSize = size;
    this.trimLogs();
  }
}

export const actionLogService = new ActionLogService();
