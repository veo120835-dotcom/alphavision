// Process Optimizer - Analyze and optimize business processes

import { Process, ProcessStep, TeamRole } from './types';

interface ProcessEfficiencyReport {
  process: Process;
  efficiency_score: number;
  bottlenecks: {
    step: ProcessStep;
    issue: string;
    impact: 'low' | 'medium' | 'high';
    solution: string;
  }[];
  time_savings_potential_minutes: number;
  optimization_recommendations: string[];
}

interface ProcessComparison {
  process_id: string;
  current_time_minutes: number;
  optimized_time_minutes: number;
  steps_eliminated: number;
  steps_automated: number;
  improvement_percent: number;
}

class ProcessOptimizerService {
  private processes: Process[] = [];

  registerProcess(process: Process): void {
    const existing = this.processes.findIndex(p => p.id === process.id);
    if (existing >= 0) {
      this.processes[existing] = process;
    } else {
      this.processes.push(process);
    }
  }

  analyzeProcess(processId: string): ProcessEfficiencyReport | null {
    const process = this.processes.find(p => p.id === processId);
    if (!process) return null;

    const bottlenecks = this.identifyBottlenecks(process);
    const efficiencyScore = this.calculateEfficiencyScore(process, bottlenecks);
    const timeSavings = this.estimateTimeSavings(process, bottlenecks);
    const recommendations = this.generateOptimizationRecommendations(process, bottlenecks);

    return {
      process,
      efficiency_score: efficiencyScore,
      bottlenecks,
      time_savings_potential_minutes: timeSavings,
      optimization_recommendations: recommendations,
    };
  }

  private identifyBottlenecks(process: Process): ProcessEfficiencyReport['bottlenecks'] {
    const bottlenecks: ProcessEfficiencyReport['bottlenecks'] = [];
    const averageStepTime = process.total_time_minutes / process.steps.length;

    process.steps.forEach(step => {
      if (step.time_estimate_minutes > averageStepTime * 2) {
        bottlenecks.push({
          step,
          issue: 'Step takes significantly longer than average',
          impact: 'high',
          solution: 'Consider breaking into smaller steps or automating',
        });
      }

      if (step.decision_points.length > 2) {
        bottlenecks.push({
          step,
          issue: 'Too many decision points creating complexity',
          impact: 'medium',
          solution: 'Simplify decision tree or create decision matrix',
        });
      }

      if (step.potential_bottlenecks.length > 0) {
        step.potential_bottlenecks.forEach(pb => {
          bottlenecks.push({
            step,
            issue: pb,
            impact: 'medium',
            solution: 'Address identified bottleneck cause',
          });
        });
      }

      if (step.inputs.length > 3) {
        bottlenecks.push({
          step,
          issue: 'Step requires too many inputs',
          impact: 'low',
          solution: 'Consolidate inputs or pre-process data',
        });
      }
    });

    return bottlenecks;
  }

  private calculateEfficiencyScore(
    process: Process,
    bottlenecks: ProcessEfficiencyReport['bottlenecks']
  ): number {
    let score = 100;

    const highImpactCount = bottlenecks.filter(b => b.impact === 'high').length;
    const mediumImpactCount = bottlenecks.filter(b => b.impact === 'medium').length;
    const lowImpactCount = bottlenecks.filter(b => b.impact === 'low').length;

    score -= highImpactCount * 15;
    score -= mediumImpactCount * 8;
    score -= lowImpactCount * 3;

    if (process.automation_potential > 50) {
      score -= (process.automation_potential - 50) / 5;
    }

    const stepsPerHour = process.steps.length / (process.total_time_minutes / 60);
    if (stepsPerHour < 3) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private estimateTimeSavings(
    process: Process,
    bottlenecks: ProcessEfficiencyReport['bottlenecks']
  ): number {
    let savings = 0;

    bottlenecks.forEach(bottleneck => {
      const stepTime = bottleneck.step.time_estimate_minutes;
      switch (bottleneck.impact) {
        case 'high':
          savings += stepTime * 0.4;
          break;
        case 'medium':
          savings += stepTime * 0.25;
          break;
        case 'low':
          savings += stepTime * 0.1;
          break;
      }
    });

    savings += (process.automation_potential / 100) * process.total_time_minutes * 0.3;

    return Math.round(savings);
  }

  private generateOptimizationRecommendations(
    process: Process,
    bottlenecks: ProcessEfficiencyReport['bottlenecks']
  ): string[] {
    const recommendations: string[] = [];

    if (bottlenecks.length > 0) {
      recommendations.push('Address high-impact bottlenecks first for maximum improvement');
    }

    if (process.automation_potential > 60) {
      recommendations.push('High automation potential - consider investing in automation tools');
    }

    const handoffCount = this.countHandoffs(process);
    if (handoffCount > 3) {
      recommendations.push(`Reduce ${handoffCount} handoffs between roles to minimize delays`);
    }

    const longSteps = process.steps.filter(s => s.time_estimate_minutes > 60);
    if (longSteps.length > 0) {
      recommendations.push('Break down steps longer than 1 hour into smaller, manageable tasks');
    }

    if (!process.improvement_opportunities.includes('documented')) {
      recommendations.push('Create detailed documentation and training materials');
    }

    const uniqueRoles = new Set(process.steps.map(s => s.responsible));
    if (uniqueRoles.size === 1 && process.steps.length > 5) {
      recommendations.push('Consider delegating some steps to reduce single-person dependency');
    }

    return recommendations;
  }

  private countHandoffs(process: Process): number {
    let handoffs = 0;
    for (let i = 1; i < process.steps.length; i++) {
      if (process.steps[i].responsible !== process.steps[i - 1].responsible) {
        handoffs++;
      }
    }
    return handoffs;
  }

  optimizeProcess(processId: string): ProcessComparison | null {
    const report = this.analyzeProcess(processId);
    if (!report) return null;

    const optimizedTime = report.process.total_time_minutes - report.time_savings_potential_minutes;
    const stepsToEliminate = report.bottlenecks.filter(b => 
      b.issue.includes('redundant') || b.issue.includes('unnecessary')
    ).length;
    const stepsToAutomate = Math.floor(report.process.automation_potential / 20);

    return {
      process_id: processId,
      current_time_minutes: report.process.total_time_minutes,
      optimized_time_minutes: optimizedTime,
      steps_eliminated: stepsToEliminate,
      steps_automated: stepsToAutomate,
      improvement_percent: (report.time_savings_potential_minutes / report.process.total_time_minutes) * 100,
    };
  }

  createOptimizedProcess(processId: string): Process | null {
    const original = this.processes.find(p => p.id === processId);
    if (!original) return null;

    const report = this.analyzeProcess(processId);
    if (!report) return null;

    const optimizedSteps = original.steps
      .filter(step => {
        const hasHighImpactIssue = report.bottlenecks.some(
          b => b.step.id === step.id && b.impact === 'high' && b.issue.includes('unnecessary')
        );
        return !hasHighImpactIssue;
      })
      .map(step => ({
        ...step,
        time_estimate_minutes: Math.round(step.time_estimate_minutes * 0.8),
        potential_bottlenecks: [],
      }));

    return {
      ...original,
      id: `${original.id}-optimized`,
      name: `${original.name} (Optimized)`,
      steps: optimizedSteps,
      total_time_minutes: optimizedSteps.reduce((sum, s) => sum + s.time_estimate_minutes, 0),
      automation_potential: Math.min(100, original.automation_potential + 20),
      improvement_opportunities: [
        ...original.improvement_opportunities,
        'Optimized based on bottleneck analysis',
      ],
    };
  }

  getProcessesBySystem(systemId: string): Process[] {
    return this.processes.filter(p => p.system_id === systemId);
  }

  getAllProcesses(): Process[] {
    return this.processes;
  }
}

export const processOptimizerService = new ProcessOptimizerService();
