// Replay - Re-execute playbooks with historical context for debugging

import { ExecutionContext, Playbook, Event, ActionLog } from '../types';
import { actionLogService } from './action-log';
import { decisionTraceService } from './decision-trace';

interface ReplayConfig {
  dry_run: boolean;
  skip_side_effects: boolean;
  pause_at_decision?: string; // Decision point to pause at
  override_inputs?: Record<string, unknown>;
  speed_multiplier?: number; // 1 = real time, 0 = instant
}

interface ReplayResult {
  original_execution_id: string;
  replay_execution_id: string;
  started_at: Date;
  completed_at: Date;
  divergence_points: DivergencePoint[];
  actions_replayed: number;
  actions_skipped: number;
  decisions_matched: number;
  decisions_diverged: number;
  outcome_match: boolean;
}

interface DivergencePoint {
  step_id: string;
  decision_point: string;
  original_decision: string;
  replay_decision: string;
  reason: string;
  impact: 'none' | 'minor' | 'major';
}

interface ReplaySession {
  id: string;
  original_execution_id: string;
  config: ReplayConfig;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'aborted';
  current_step?: string;
  started_at?: Date;
  paused_at?: Date;
}

class ReplayService {
  private sessions: Map<string, ReplaySession> = new Map();
  private playbooks: Map<string, Playbook> = new Map();

  registerPlaybook(playbook: Playbook): void {
    this.playbooks.set(playbook.id, playbook);
  }

  async startReplay(
    originalExecutionId: string,
    config: Partial<ReplayConfig> = {}
  ): Promise<ReplaySession> {
    const fullConfig: ReplayConfig = {
      dry_run: true,
      skip_side_effects: true,
      speed_multiplier: 0,
      ...config,
    };

    const session: ReplaySession = {
      id: `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      original_execution_id: originalExecutionId,
      config: fullConfig,
      status: 'pending',
    };

    this.sessions.set(session.id, session);
    return session;
  }

  async executeReplay(sessionId: string): Promise<ReplayResult | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.status = 'running';
    session.started_at = new Date();

    const originalTrace = decisionTraceService.getTrace(session.original_execution_id);
    const originalLogs = actionLogService.getLogsByPlaybook(
      originalTrace?.playbook_id || ''
    );

    const replayExecutionId = `replay_exec_${Date.now()}`;
    const divergencePoints: DivergencePoint[] = [];
    let actionsReplayed = 0;
    let actionsSkipped = 0;
    let decisionsMatched = 0;
    let decisionsDiverged = 0;

    if (originalTrace) {
      decisionTraceService.startTrace(
        replayExecutionId,
        originalTrace.playbook_id,
        `[REPLAY] ${originalTrace.playbook_name}`
      );

      for (const originalDecision of originalTrace.decisions) {
        if (session.status as string === 'aborted') break;

        if (session.config.pause_at_decision === originalDecision.decision_point) {
          session.status = 'paused';
          session.paused_at = new Date();
          break;
        }

        session.current_step = originalDecision.decision_point;

        // Simulate re-evaluation of decision
        const replayInputs = session.config.override_inputs 
          ? { ...originalDecision.inputs, ...session.config.override_inputs }
          : originalDecision.inputs;

        const replayDecision = this.evaluateDecision(
          originalDecision.decision_point,
          replayInputs
        );

        if (replayDecision === originalDecision.decision) {
          decisionsMatched++;
        } else {
          decisionsDiverged++;
          divergencePoints.push({
            step_id: originalDecision.id,
            decision_point: originalDecision.decision_point,
            original_decision: originalDecision.decision,
            replay_decision: replayDecision,
            reason: 'Different inputs or context produced different result',
            impact: this.assessDivergenceImpact(originalDecision.decision, replayDecision),
          });
        }

        decisionTraceService.recordDecision(
          replayExecutionId,
          originalDecision.decision_point,
          replayInputs,
          replayDecision,
          `[REPLAY] Original: ${originalDecision.decision}`,
          [],
          originalDecision.confidence
        );

        // Handle speed multiplier
        if (session.config.speed_multiplier && session.config.speed_multiplier > 0) {
          await this.sleep(100 / session.config.speed_multiplier);
        }
      }
    }

    // Process action logs
    for (const log of originalLogs) {
      if (session.config.skip_side_effects) {
        if (['send_email', 'send_notification', 'place_order', 'call_api'].includes(log.action_type)) {
          actionsSkipped++;
          continue;
        }
      }

      if (session.config.dry_run) {
        console.log(`[Replay] Would execute: ${log.action_type}`);
        actionsReplayed++;
      }
    }

    session.status = 'completed';
    const completedAt = new Date();

    const result: ReplayResult = {
      original_execution_id: session.original_execution_id,
      replay_execution_id: replayExecutionId,
      started_at: session.started_at!,
      completed_at: completedAt,
      divergence_points: divergencePoints,
      actions_replayed: actionsReplayed,
      actions_skipped: actionsSkipped,
      decisions_matched: decisionsMatched,
      decisions_diverged: decisionsDiverged,
      outcome_match: divergencePoints.every(d => d.impact === 'none'),
    };

    decisionTraceService.completeTrace(
      replayExecutionId,
      result.outcome_match ? 'success' : 'partial',
      `Replay completed with ${decisionsDiverged} divergences`
    );

    return result;
  }

  private evaluateDecision(decisionPoint: string, inputs: Record<string, unknown>): string {
    // Simplified decision evaluation
    // In production, this would re-run the actual decision logic
    return `evaluated_${decisionPoint}`;
  }

  private assessDivergenceImpact(original: string, replay: string): 'none' | 'minor' | 'major' {
    if (original === replay) return 'none';
    
    // Simplified impact assessment
    // In production, this would analyze the semantic difference
    return 'minor';
  }

  pauseReplay(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'running') {
      session.status = 'paused';
      session.paused_at = new Date();
    }
  }

  resumeReplay(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'paused') {
      session.status = 'running';
      session.paused_at = undefined;
    }
  }

  abortReplay(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'aborted';
    }
  }

  getSession(sessionId: string): ReplaySession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessions(): ReplaySession[] {
    return Array.from(this.sessions.values());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  compareExecutions(executionId1: string, executionId2: string): {
    trace1: unknown;
    trace2: unknown;
    differences: DivergencePoint[];
  } {
    const trace1 = decisionTraceService.getTrace(executionId1);
    const trace2 = decisionTraceService.getTrace(executionId2);
    const differences: DivergencePoint[] = [];

    if (trace1 && trace2) {
      const maxLength = Math.max(trace1.decisions.length, trace2.decisions.length);
      
      for (let i = 0; i < maxLength; i++) {
        const d1 = trace1.decisions[i];
        const d2 = trace2.decisions[i];

        if (!d1 || !d2) {
          differences.push({
            step_id: (d1 || d2).id,
            decision_point: (d1 || d2).decision_point,
            original_decision: d1?.decision || 'N/A',
            replay_decision: d2?.decision || 'N/A',
            reason: 'Decision missing in one execution',
            impact: 'major',
          });
        } else if (d1.decision !== d2.decision) {
          differences.push({
            step_id: d1.id,
            decision_point: d1.decision_point,
            original_decision: d1.decision,
            replay_decision: d2.decision,
            reason: 'Different decisions made',
            impact: this.assessDivergenceImpact(d1.decision, d2.decision),
          });
        }
      }
    }

    return { trace1, trace2, differences };
  }
}

export const replayService = new ReplayService();
