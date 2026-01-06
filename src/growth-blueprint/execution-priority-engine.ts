import type { GrowthRoadmap, ExecutionPriority, RoadmapMilestone, LeveragePoint } from './types';

interface PriorityScore {
  impact: number;
  urgency: number;
  effort: number;
  dependencies: number;
  total: number;
}

export class ExecutionPriorityEngine {
  /**
   * Generate prioritized execution list from roadmap
   */
  generatePriorities(roadmap: GrowthRoadmap): ExecutionPriority[] {
    const priorities: ExecutionPriority[] = [];
    let rank = 1;

    // 1. Bottleneck actions are highest priority
    for (const action of roadmap.primary_bottleneck.recommended_actions.slice(0, 3)) {
      priorities.push({
        id: crypto.randomUUID(),
        rank: rank++,
        action,
        rationale: `Addresses primary bottleneck: ${roadmap.primary_bottleneck.title}`,
        expected_outcome: `Reduce impact of ${roadmap.primary_bottleneck.category}`,
        blocking_factors: [],
        due_date: this.calculateDueDate(7 * rank),
      });
    }

    // 2. Quick wins from leverage points
    const quickWins = roadmap.leverage_points.filter(lp => lp.type === 'quick_win');
    for (const qw of quickWins) {
      priorities.push({
        id: crypto.randomUUID(),
        rank: rank++,
        action: qw.title,
        rationale: qw.description,
        expected_outcome: `Impact potential: ${qw.impact_potential}%`,
        blocking_factors: qw.dependencies,
        due_date: this.calculateDueDate(qw.time_to_impact_days),
      });
    }

    // 3. First milestone actions
    const firstMilestone = roadmap.milestones[0];
    if (firstMilestone) {
      for (const action of firstMilestone.key_actions.slice(0, 2)) {
        if (!priorities.some(p => p.action === action)) {
          priorities.push({
            id: crypto.randomUUID(),
            rank: rank++,
            action,
            rationale: `Part of Week ${firstMilestone.week} milestone: ${firstMilestone.title}`,
            expected_outcome: firstMilestone.success_metrics[0] || 'Progress toward milestone',
            blocking_factors: firstMilestone.dependencies,
            due_date: this.calculateDueDate(firstMilestone.week * 7),
          });
        }
      }
    }

    // 4. Strategic initiatives
    const strategic = roadmap.leverage_points.filter(lp => lp.type === 'strategic');
    for (const s of strategic.slice(0, 2)) {
      priorities.push({
        id: crypto.randomUUID(),
        rank: rank++,
        action: `Initiate: ${s.title}`,
        rationale: s.description,
        expected_outcome: `Long-term impact: ${s.impact_potential}%`,
        blocking_factors: s.dependencies,
        due_date: this.calculateDueDate(s.time_to_impact_days),
      });
    }

    return priorities;
  }

  /**
   * Get today's single most important priority
   */
  getTodaysPriority(priorities: ExecutionPriority[]): ExecutionPriority | null {
    if (priorities.length === 0) return null;

    // Find highest priority that isn't blocked
    return priorities.find(p => p.blocking_factors.length === 0) || priorities[0];
  }

  /**
   * Score and rank a specific action
   */
  scoreAction(
    action: string,
    roadmap: GrowthRoadmap
  ): PriorityScore {
    let impact = 50;
    let urgency = 50;
    let effort = 50;
    let dependencies = 0;

    // Check if action is in bottleneck recommendations
    if (roadmap.primary_bottleneck.recommended_actions.includes(action)) {
      impact += 30;
      urgency += 20;
    }

    // Check if action is a quick win
    const quickWin = roadmap.leverage_points.find(
      lp => lp.type === 'quick_win' && lp.title === action
    );
    if (quickWin) {
      impact += quickWin.impact_potential * 0.3;
      urgency += 15;
      effort = this.effortToScore(quickWin.effort_required);
      dependencies = quickWin.dependencies.length * 10;
    }

    // Check if action is in first milestone
    const inFirstMilestone = roadmap.milestones[0]?.key_actions.includes(action);
    if (inFirstMilestone) {
      urgency += 25;
    }

    const total = (impact * 0.4) + (urgency * 0.3) + (effort * 0.2) - (dependencies * 0.1);

    return {
      impact: Math.min(100, impact),
      urgency: Math.min(100, urgency),
      effort: Math.min(100, effort),
      dependencies,
      total: Math.max(0, Math.min(100, total)),
    };
  }

  /**
   * Reorder priorities based on changed constraints
   */
  reprioritize(
    priorities: ExecutionPriority[],
    constraints: {
      maxEffort?: 'low' | 'medium' | 'high';
      focusArea?: string;
      excludeBlocked?: boolean;
    }
  ): ExecutionPriority[] {
    let filtered = [...priorities];

    if (constraints.excludeBlocked) {
      filtered = filtered.filter(p => p.blocking_factors.length === 0);
    }

    if (constraints.focusArea) {
      filtered = filtered.sort((a, b) => {
        const aMatch = a.rationale.toLowerCase().includes(constraints.focusArea!.toLowerCase());
        const bMatch = b.rationale.toLowerCase().includes(constraints.focusArea!.toLowerCase());
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }

    // Re-rank
    return filtered.map((p, i) => ({ ...p, rank: i + 1 }));
  }

  private calculateDueDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  private effortToScore(effort: 'low' | 'medium' | 'high'): number {
    return { low: 80, medium: 50, high: 20 }[effort];
  }
}

export const executionPriorityEngine = new ExecutionPriorityEngine();