// Delegation Map - Identify delegation opportunities

import { DelegationItem, TeamRole } from './types';

interface DelegationAnalysis {
  items: DelegationItem[];
  founder_hours_recoverable: number;
  delegation_readiness_score: number;
  highest_priority_delegations: DelegationItem[];
  training_plan: {
    role: TeamRole;
    skills_to_develop: string[];
    estimated_training_hours: number;
  }[];
}

interface TaskAssessment {
  task: string;
  current_owner: TeamRole;
  delegatable: boolean;
  ideal_owner: TeamRole;
  complexity: 'low' | 'medium' | 'high';
  frequency: 'daily' | 'weekly' | 'monthly' | 'ad_hoc';
  strategic_importance: 'low' | 'medium' | 'high';
}

class DelegationMapService {
  private delegationItems: DelegationItem[] = [];
  private taskAssessments: TaskAssessment[] = [];

  private roleHierarchy: Record<TeamRole, number> = {
    founder: 5,
    executive: 4,
    manager: 3,
    specialist: 2,
    coordinator: 1,
  };

  assessTask(task: string, currentOwner: TeamRole, details: {
    complexity: 'low' | 'medium' | 'high';
    frequency: 'daily' | 'weekly' | 'monthly' | 'ad_hoc';
    strategic_importance: 'low' | 'medium' | 'high';
    requires_decision_making: boolean;
    requires_relationships: boolean;
    requires_expertise: boolean;
  }): TaskAssessment {
    const delegatable = this.isDelegatable(currentOwner, details);
    const idealOwner = this.findIdealOwner(details);

    const assessment: TaskAssessment = {
      task,
      current_owner: currentOwner,
      delegatable,
      ideal_owner: idealOwner,
      complexity: details.complexity,
      frequency: details.frequency,
      strategic_importance: details.strategic_importance,
    };

    this.taskAssessments.push(assessment);

    if (delegatable && idealOwner !== currentOwner) {
      this.createDelegationItem(assessment, details);
    }

    return assessment;
  }

  private isDelegatable(currentOwner: TeamRole, details: {
    complexity: string;
    strategic_importance: string;
    requires_decision_making: boolean;
    requires_relationships: boolean;
    requires_expertise: boolean;
  }): boolean {
    if (currentOwner === 'coordinator') return false;

    if (details.strategic_importance === 'high' && details.requires_decision_making) {
      return false;
    }

    if (details.complexity === 'low') return true;
    if (details.complexity === 'medium' && !details.requires_expertise) return true;

    return false;
  }

  private findIdealOwner(details: {
    complexity: string;
    strategic_importance: string;
    requires_decision_making: boolean;
    requires_relationships: boolean;
    requires_expertise: boolean;
  }): TeamRole {
    if (details.strategic_importance === 'high' && details.requires_decision_making) {
      return 'executive';
    }

    if (details.requires_expertise) {
      return 'specialist';
    }

    if (details.complexity === 'high') {
      return 'manager';
    }

    if (details.complexity === 'medium') {
      return 'specialist';
    }

    return 'coordinator';
  }

  private createDelegationItem(assessment: TaskAssessment, details: {
    requires_decision_making: boolean;
    requires_relationships: boolean;
    requires_expertise: boolean;
  }): void {
    const trainingRequired: string[] = [];
    
    if (details.requires_expertise) {
      trainingRequired.push('Technical/domain training');
    }
    if (details.requires_relationships) {
      trainingRequired.push('Stakeholder introductions');
    }
    if (details.requires_decision_making) {
      trainingRequired.push('Decision framework training');
    }

    const item: DelegationItem = {
      id: `delegation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      task: assessment.task,
      current_owner: assessment.current_owner,
      recommended_owner: assessment.ideal_owner,
      reason: this.generateDelegationReason(assessment),
      training_required: trainingRequired,
      risk_if_delegated: this.assessDelegationRisk(assessment, details),
      delegation_steps: this.generateDelegationSteps(assessment, trainingRequired),
    };

    this.delegationItems.push(item);
  }

  private generateDelegationReason(assessment: TaskAssessment): string {
    const currentLevel = this.roleHierarchy[assessment.current_owner];
    const idealLevel = this.roleHierarchy[assessment.ideal_owner];

    if (currentLevel > idealLevel + 1) {
      return `Task complexity (${assessment.complexity}) doesn't require ${assessment.current_owner} level. Delegating frees up time for higher-value work.`;
    }

    if (assessment.frequency === 'daily' && currentLevel > 2) {
      return 'Daily tasks should be handled by team members to free leadership capacity.';
    }

    return `Better alignment with ${assessment.ideal_owner} role responsibilities.`;
  }

  private assessDelegationRisk(
    assessment: TaskAssessment,
    details: { requires_relationships: boolean; requires_expertise: boolean }
  ): 'low' | 'medium' | 'high' {
    if (details.requires_relationships && assessment.strategic_importance === 'high') {
      return 'high';
    }

    if (details.requires_expertise && assessment.complexity === 'high') {
      return 'medium';
    }

    return 'low';
  }

  private generateDelegationSteps(assessment: TaskAssessment, trainingRequired: string[]): string[] {
    const steps = [
      'Document current process and expectations',
      `Brief ${assessment.ideal_owner} on task context and importance`,
    ];

    if (trainingRequired.length > 0) {
      steps.push('Complete required training: ' + trainingRequired.join(', '));
    }

    steps.push(
      'Shadow current owner for 1-2 cycles',
      'Supervised execution with feedback',
      'Independent execution with check-ins',
      'Full handoff with periodic review'
    );

    return steps;
  }

  generateAnalysis(): DelegationAnalysis {
    const founderItems = this.delegationItems.filter(d => d.current_owner === 'founder');
    
    const founderHoursRecoverable = founderItems.length * 3;

    const highPriority = this.delegationItems.filter(
      d => d.risk_if_delegated === 'low' && 
           (d.current_owner === 'founder' || d.current_owner === 'executive')
    );

    const trainingPlan = this.generateTrainingPlan();
    const readinessScore = this.calculateDelegationReadiness();

    return {
      items: this.delegationItems,
      founder_hours_recoverable: founderHoursRecoverable,
      delegation_readiness_score: readinessScore,
      highest_priority_delegations: highPriority.slice(0, 5),
      training_plan: trainingPlan,
    };
  }

  private generateTrainingPlan(): DelegationAnalysis['training_plan'] {
    const roleTraining = new Map<TeamRole, Set<string>>();

    this.delegationItems.forEach(item => {
      if (!roleTraining.has(item.recommended_owner)) {
        roleTraining.set(item.recommended_owner, new Set());
      }
      item.training_required.forEach(t => {
        roleTraining.get(item.recommended_owner)!.add(t);
      });
    });

    const plan: DelegationAnalysis['training_plan'] = [];
    roleTraining.forEach((skills, role) => {
      const skillsArray = Array.from(skills);
      plan.push({
        role,
        skills_to_develop: skillsArray,
        estimated_training_hours: skillsArray.length * 4,
      });
    });

    return plan;
  }

  private calculateDelegationReadiness(): number {
    if (this.delegationItems.length === 0) return 100;

    const lowRiskRatio = this.delegationItems.filter(d => d.risk_if_delegated === 'low').length 
                         / this.delegationItems.length;
    
    const trainingBurden = this.delegationItems.reduce(
      (sum, d) => sum + d.training_required.length, 0
    ) / this.delegationItems.length;

    return Math.round((lowRiskRatio * 70) + (Math.max(0, 30 - trainingBurden * 10)));
  }

  getDelegationItemsForRole(role: TeamRole): DelegationItem[] {
    return this.delegationItems.filter(d => d.current_owner === role);
  }

  getFounderDelegations(): DelegationItem[] {
    return this.getDelegationItemsForRole('founder');
  }
}

export const delegationMapService = new DelegationMapService();
