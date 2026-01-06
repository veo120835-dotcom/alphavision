/**
 * ACTION LAYER
 * 
 * Execution and verification of decisions.
 * Handles rollback planning and step-by-step execution.
 */

import type {
  DecisionRecord,
  ActionPlan,
  ActionStep,
  ActionType,
  RollbackStep,
  VerificationCheck,
  ActionResult,
  StepResult,
  ActionError,
} from './types';

/**
 * Create an action plan from a decision
 */
export function createActionPlan(decision: DecisionRecord): ActionPlan {
  const steps = generateActionSteps(decision);
  
  return {
    id: crypto.randomUUID(),
    decisionId: decision.id,
    steps,
    rollbackPlan: generateRollbackPlan(steps),
    verificationChecks: generateVerificationChecks(steps),
    timeout: calculateTimeout(steps),
  };
}

/**
 * Generate action steps from decision
 */
function generateActionSteps(decision: DecisionRecord): ActionStep[] {
  const action = decision.selectedOption.action.toLowerCase();
  const steps: ActionStep[] = [];
  
  // Parse action into atomic steps
  if (action.includes('email') || action.includes('send')) {
    steps.push({
      id: crypto.randomUUID(),
      order: 1,
      type: 'email',
      tool: 'email_sender',
      parameters: { template: 'default', target: 'lead' },
      expectedResult: 'Email sent successfully',
    });
  }
  
  if (action.includes('update') || action.includes('save')) {
    steps.push({
      id: crypto.randomUUID(),
      order: steps.length + 1,
      type: 'database_write',
      tool: 'database',
      parameters: { operation: 'update' },
      expectedResult: 'Record updated',
    });
  }
  
  if (action.includes('notify') || action.includes('alert')) {
    steps.push({
      id: crypto.randomUUID(),
      order: steps.length + 1,
      type: 'notification',
      tool: 'notification_service',
      parameters: { channel: 'in_app' },
      expectedResult: 'Notification delivered',
    });
  }
  
  // Default step if no specific action detected
  if (steps.length === 0) {
    steps.push({
      id: crypto.randomUUID(),
      order: 1,
      type: 'database_write',
      tool: 'database',
      parameters: { 
        operation: 'log',
        data: { action: decision.selectedOption.action }
      },
      expectedResult: 'Action logged',
    });
  }
  
  return steps;
}

/**
 * Generate rollback plan for action steps
 */
function generateRollbackPlan(steps: ActionStep[]): RollbackStep[] {
  return steps
    .filter(step => isRollbackable(step.type))
    .map(step => ({
      actionStepId: step.id,
      rollbackAction: getRollbackAction(step.type),
      parameters: { originalStep: step.id },
    }))
    .reverse(); // Rollback in reverse order
}

/**
 * Check if an action type is rollbackable
 */
function isRollbackable(type: ActionType): boolean {
  const rollbackable: ActionType[] = ['database_write', 'api_call', 'calendar'];
  return rollbackable.includes(type);
}

/**
 * Get rollback action for an action type
 */
function getRollbackAction(type: ActionType): string {
  const rollbackActions: Record<ActionType, string> = {
    database_write: 'restore_previous_state',
    api_call: 'send_cancellation',
    calendar: 'delete_event',
    notification: 'no_rollback',
    email: 'no_rollback',
    sms: 'no_rollback',
    payment: 'issue_refund',
    content_creation: 'delete_content',
    agent_spawn: 'terminate_agent',
  };
  return rollbackActions[type];
}

/**
 * Generate verification checks for action steps
 */
function generateVerificationChecks(steps: ActionStep[]): VerificationCheck[] {
  return steps.map(step => ({
    id: crypto.randomUUID(),
    afterStep: step.id,
    condition: `step_${step.order}_completed`,
    expectedValue: true,
    onFailure: step.type === 'payment' ? 'rollback' : 'pause',
  }));
}

/**
 * Calculate total timeout for action plan
 */
function calculateTimeout(steps: ActionStep[]): number {
  const baseTimeout = 30000; // 30 seconds base
  const perStepTimeout = 10000; // 10 seconds per step
  return baseTimeout + steps.length * perStepTimeout;
}

/**
 * Execute an action plan
 */
export async function executeActionPlan(
  plan: ActionPlan,
  executor: ActionExecutor
): Promise<ActionResult> {
  const stepResults: StepResult[] = [];
  const errors: ActionError[] = [];
  const startTime = Date.now();
  
  for (const step of plan.steps) {
    try {
      const result = await executor.execute(step);
      
      stepResults.push({
        stepId: step.id,
        success: true,
        result,
        duration: Date.now() - startTime,
        verificationPassed: await verifyStep(step, result, plan.verificationChecks),
      });
    } catch (error) {
      const actionError: ActionError = {
        stepId: step.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        recoverable: isRollbackable(step.type),
        handled: false,
      };
      
      errors.push(actionError);
      stepResults.push({
        stepId: step.id,
        success: false,
        result: null,
        duration: Date.now() - startTime,
        verificationPassed: false,
      });
      
      // Check if we should continue or abort
      const check = plan.verificationChecks.find(c => c.afterStep === step.id);
      if (check?.onFailure === 'rollback') {
        await executeRollback(plan, stepResults, executor);
        break;
      }
    }
  }
  
  return {
    actionPlanId: plan.id,
    stepResults,
    overallSuccess: errors.length === 0,
    executionTime: Date.now() - startTime,
    errors,
  };
}

/**
 * Verify a step completed successfully
 */
async function verifyStep(
  step: ActionStep,
  result: unknown,
  checks: VerificationCheck[]
): Promise<boolean> {
  const check = checks.find(c => c.afterStep === step.id);
  if (!check) return true;
  
  // Simple verification - in production would be more sophisticated
  return result !== null && result !== undefined;
}

/**
 * Execute rollback for failed action plan
 */
async function executeRollback(
  plan: ActionPlan,
  completedSteps: StepResult[],
  executor: ActionExecutor
): Promise<void> {
  const successfulSteps = completedSteps.filter(s => s.success);
  
  for (const rollback of plan.rollbackPlan) {
    if (successfulSteps.some(s => s.stepId === rollback.actionStepId)) {
      try {
        await executor.rollback(rollback);
      } catch (error) {
        console.error('Rollback failed for step:', rollback.actionStepId, error);
      }
    }
  }
}

/**
 * Action executor interface
 */
export interface ActionExecutor {
  execute(step: ActionStep): Promise<unknown>;
  rollback(rollback: RollbackStep): Promise<void>;
}

/**
 * Create a mock executor for testing
 */
export function createMockExecutor(): ActionExecutor {
  return {
    execute: async (step) => {
      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true, stepId: step.id };
    },
    rollback: async (rollback) => {
      await new Promise(resolve => setTimeout(resolve, 50));
    },
  };
}
