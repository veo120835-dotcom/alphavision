// Decision Trace - Track reasoning and decisions for auditability

import { DecisionTrace } from '../types';

interface DecisionNode {
  id: string;
  parent_id?: string;
  decision_point: string;
  inputs: Record<string, unknown>;
  decision: string;
  reasoning: string;
  alternatives: AlternativeDecision[];
  confidence: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface AlternativeDecision {
  option: string;
  score: number;
  reason_not_chosen: string;
}

interface ExecutionTrace {
  execution_id: string;
  playbook_id: string;
  playbook_name: string;
  started_at: Date;
  completed_at?: Date;
  decisions: DecisionNode[];
  outcome?: 'success' | 'failure' | 'partial';
  summary?: string;
}

class DecisionTraceService {
  private traces: Map<string, ExecutionTrace> = new Map();
  private maxTraces = 1000;

  startTrace(executionId: string, playbookId: string, playbookName: string): ExecutionTrace {
    const trace: ExecutionTrace = {
      execution_id: executionId,
      playbook_id: playbookId,
      playbook_name: playbookName,
      started_at: new Date(),
      decisions: [],
    };

    this.traces.set(executionId, trace);
    this.trimTraces();

    return trace;
  }

  recordDecision(
    executionId: string,
    decisionPoint: string,
    inputs: Record<string, unknown>,
    decision: string,
    reasoning: string,
    alternatives: AlternativeDecision[] = [],
    confidence = 1.0,
    parentId?: string,
    metadata?: Record<string, unknown>
  ): DecisionNode | null {
    const trace = this.traces.get(executionId);
    if (!trace) return null;

    const node: DecisionNode = {
      id: `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      parent_id: parentId,
      decision_point: decisionPoint,
      inputs,
      decision,
      reasoning,
      alternatives,
      confidence,
      timestamp: new Date(),
      metadata,
    };

    trace.decisions.push(node);
    return node;
  }

  completeTrace(executionId: string, outcome: 'success' | 'failure' | 'partial', summary?: string): ExecutionTrace | null {
    const trace = this.traces.get(executionId);
    if (!trace) return null;

    trace.completed_at = new Date();
    trace.outcome = outcome;
    trace.summary = summary || this.generateSummary(trace);

    return trace;
  }

  private generateSummary(trace: ExecutionTrace): string {
    const decisionCount = trace.decisions.length;
    const lowConfidenceCount = trace.decisions.filter(d => d.confidence < 0.7).length;
    
    const duration = trace.completed_at 
      ? trace.completed_at.getTime() - trace.started_at.getTime()
      : Date.now() - trace.started_at.getTime();

    return `Playbook ${trace.playbook_name} made ${decisionCount} decisions in ${duration}ms. ` +
           `${lowConfidenceCount > 0 ? `${lowConfidenceCount} low-confidence decisions.` : 'All decisions high-confidence.'}`;
  }

  getTrace(executionId: string): ExecutionTrace | undefined {
    return this.traces.get(executionId);
  }

  getDecisionPath(executionId: string, decisionId: string): DecisionNode[] {
    const trace = this.traces.get(executionId);
    if (!trace) return [];

    const path: DecisionNode[] = [];
    let currentId: string | undefined = decisionId;

    while (currentId) {
      const node = trace.decisions.find(d => d.id === currentId);
      if (!node) break;
      
      path.unshift(node);
      currentId = node.parent_id;
    }

    return path;
  }

  getDecisionTree(executionId: string): { root: DecisionNode | null; children: Map<string, DecisionNode[]> } {
    const trace = this.traces.get(executionId);
    if (!trace || trace.decisions.length === 0) {
      return { root: null, children: new Map() };
    }

    const children: Map<string, DecisionNode[]> = new Map();
    let root: DecisionNode | null = null;

    trace.decisions.forEach(decision => {
      if (!decision.parent_id) {
        root = decision;
      } else {
        const siblings = children.get(decision.parent_id) || [];
        siblings.push(decision);
        children.set(decision.parent_id, siblings);
      }
    });

    return { root, children };
  }

  queryTraces(params: {
    playbook_id?: string;
    outcome?: 'success' | 'failure' | 'partial';
    from_date?: Date;
    to_date?: Date;
    min_decisions?: number;
    has_low_confidence?: boolean;
  }): ExecutionTrace[] {
    let results = Array.from(this.traces.values());

    if (params.playbook_id) {
      results = results.filter(t => t.playbook_id === params.playbook_id);
    }

    if (params.outcome) {
      results = results.filter(t => t.outcome === params.outcome);
    }

    if (params.from_date) {
      results = results.filter(t => t.started_at >= params.from_date!);
    }

    if (params.to_date) {
      results = results.filter(t => t.started_at <= params.to_date!);
    }

    if (params.min_decisions) {
      results = results.filter(t => t.decisions.length >= params.min_decisions!);
    }

    if (params.has_low_confidence) {
      results = results.filter(t => 
        t.decisions.some(d => d.confidence < 0.7)
      );
    }

    return results.sort((a, b) => b.started_at.getTime() - a.started_at.getTime());
  }

  analyzeDecisionPatterns(playbookId: string): {
    common_paths: string[];
    average_decisions: number;
    low_confidence_rate: number;
    decision_point_stats: Record<string, { count: number; avg_confidence: number }>;
  } {
    const traces = this.queryTraces({ playbook_id: playbookId });
    
    if (traces.length === 0) {
      return {
        common_paths: [],
        average_decisions: 0,
        low_confidence_rate: 0,
        decision_point_stats: {},
      };
    }

    const pathCounts: Record<string, number> = {};
    const decisionPointStats: Record<string, { count: number; total_confidence: number }> = {};
    let totalDecisions = 0;
    let lowConfidenceCount = 0;

    traces.forEach(trace => {
      const path = trace.decisions.map(d => d.decision_point).join(' -> ');
      pathCounts[path] = (pathCounts[path] || 0) + 1;

      trace.decisions.forEach(d => {
        totalDecisions++;
        if (d.confidence < 0.7) lowConfidenceCount++;

        if (!decisionPointStats[d.decision_point]) {
          decisionPointStats[d.decision_point] = { count: 0, total_confidence: 0 };
        }
        decisionPointStats[d.decision_point].count++;
        decisionPointStats[d.decision_point].total_confidence += d.confidence;
      });
    });

    const commonPaths = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path]) => path);

    const processedStats: Record<string, { count: number; avg_confidence: number }> = {};
    Object.entries(decisionPointStats).forEach(([point, stats]) => {
      processedStats[point] = {
        count: stats.count,
        avg_confidence: stats.total_confidence / stats.count,
      };
    });

    return {
      common_paths: commonPaths,
      average_decisions: totalDecisions / traces.length,
      low_confidence_rate: totalDecisions > 0 ? lowConfidenceCount / totalDecisions : 0,
      decision_point_stats: processedStats,
    };
  }

  private trimTraces(): void {
    if (this.traces.size > this.maxTraces) {
      const entries = Array.from(this.traces.entries())
        .sort((a, b) => a[1].started_at.getTime() - b[1].started_at.getTime());
      
      const toRemove = entries.slice(0, this.traces.size - this.maxTraces);
      toRemove.forEach(([id]) => this.traces.delete(id));
    }
  }

  exportTrace(executionId: string): string | null {
    const trace = this.traces.get(executionId);
    if (!trace) return null;

    return JSON.stringify(trace, null, 2);
  }

  clear(): void {
    this.traces.clear();
  }
}

export const decisionTraceService = new DecisionTraceService();
