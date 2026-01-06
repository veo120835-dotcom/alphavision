// Approval Requirements - Defines approval workflows

import { Role, ApprovalRequest } from './types';
import { riskTiers } from './risk-tiers';
import { hasRole } from './roles';

interface ApprovalRule {
  action: string;
  requiredApprovers: number;
  approverRoles: Role[];
  expirationHours: number;
  escalationHours: number;
  escalationTo?: Role[];
}

interface ApprovalWorkflow {
  request: ApprovalRequest;
  rule: ApprovalRule;
  approvals: Array<{ userId: string; role: Role; approvedAt: Date }>;
  escalated: boolean;
  expired: boolean;
}

const defaultRules: ApprovalRule[] = [
  { 
    action: 'large_trade', 
    requiredApprovers: 1, 
    approverRoles: ['operator', 'admin'], 
    expirationHours: 1,
    escalationHours: 0.5,
    escalationTo: ['admin']
  },
  { 
    action: 'modify_strategy', 
    requiredApprovers: 1, 
    approverRoles: ['admin'], 
    expirationHours: 24,
    escalationHours: 12
  },
  { 
    action: 'enable_live_trading', 
    requiredApprovers: 2, 
    approverRoles: ['admin'], 
    expirationHours: 24,
    escalationHours: 4
  },
  { 
    action: 'modify_risk_limits', 
    requiredApprovers: 2, 
    approverRoles: ['admin'], 
    expirationHours: 48,
    escalationHours: 24
  },
  { 
    action: 'disable_circuit_breakers', 
    requiredApprovers: 2, 
    approverRoles: ['admin'], 
    expirationHours: 1,
    escalationHours: 0.25
  },
];

class ApprovalRequirements {
  private rules: Map<string, ApprovalRule> = new Map();
  private workflows: Map<string, ApprovalWorkflow> = new Map();
  private listeners: Array<(workflow: ApprovalWorkflow, event: string) => void> = [];

  constructor() {
    defaultRules.forEach(rule => this.rules.set(rule.action, rule));
  }

  getRule(action: string): ApprovalRule | undefined {
    return this.rules.get(action);
  }

  needsApproval(action: string): boolean {
    const tier = riskTiers.getTier(action);
    return tier?.requiresApproval || false;
  }

  createWorkflow(request: ApprovalRequest): ApprovalWorkflow {
    const rule = this.rules.get(request.action);
    
    if (!rule) {
      throw new Error(`No approval rule defined for action: ${request.action}`);
    }

    const workflow: ApprovalWorkflow = {
      request,
      rule,
      approvals: [],
      escalated: false,
      expired: false
    };

    this.workflows.set(request.id, workflow);
    this.notifyListeners(workflow, 'created');
    
    // Set up expiration check
    setTimeout(() => this.checkExpiration(request.id), rule.expirationHours * 60 * 60 * 1000);
    
    // Set up escalation check
    setTimeout(() => this.checkEscalation(request.id), rule.escalationHours * 60 * 60 * 1000);

    return workflow;
  }

  approve(requestId: string, userId: string, userRole: Role): { success: boolean; message: string } {
    const workflow = this.workflows.get(requestId);
    
    if (!workflow) {
      return { success: false, message: 'Workflow not found' };
    }

    if (workflow.expired) {
      return { success: false, message: 'Approval request has expired' };
    }

    if (workflow.request.status !== 'pending') {
      return { success: false, message: 'Request is no longer pending' };
    }

    // Check if user can approve
    const canApprove = workflow.rule.approverRoles.some(role => hasRole(userRole, role));
    if (!canApprove) {
      return { success: false, message: 'User does not have approval authority' };
    }

    // Check if user already approved
    if (workflow.approvals.some(a => a.userId === userId)) {
      return { success: false, message: 'User has already approved' };
    }

    // Add approval
    workflow.approvals.push({
      userId,
      role: userRole,
      approvedAt: new Date()
    });

    // Check if fully approved
    if (workflow.approvals.length >= workflow.rule.requiredApprovers) {
      workflow.request.status = 'approved';
      workflow.request.resolvedAt = new Date();
      this.notifyListeners(workflow, 'approved');
    } else {
      this.notifyListeners(workflow, 'partial_approval');
    }

    return { success: true, message: 'Approval recorded' };
  }

  reject(requestId: string, userId: string, userRole: Role, reason?: string): { success: boolean; message: string } {
    const workflow = this.workflows.get(requestId);
    
    if (!workflow) {
      return { success: false, message: 'Workflow not found' };
    }

    const canApprove = workflow.rule.approverRoles.some(role => hasRole(userRole, role));
    if (!canApprove) {
      return { success: false, message: 'User does not have rejection authority' };
    }

    workflow.request.status = 'rejected';
    workflow.request.approverId = userId;
    workflow.request.resolvedAt = new Date();
    
    this.notifyListeners(workflow, 'rejected');

    return { success: true, message: reason || 'Request rejected' };
  }

  private checkExpiration(requestId: string): void {
    const workflow = this.workflows.get(requestId);
    if (!workflow || workflow.request.status !== 'pending') return;

    workflow.expired = true;
    workflow.request.status = 'rejected';
    workflow.request.resolvedAt = new Date();
    
    this.notifyListeners(workflow, 'expired');
  }

  private checkEscalation(requestId: string): void {
    const workflow = this.workflows.get(requestId);
    if (!workflow || workflow.request.status !== 'pending') return;

    workflow.escalated = true;
    this.notifyListeners(workflow, 'escalated');
  }

  getWorkflow(requestId: string): ApprovalWorkflow | undefined {
    return this.workflows.get(requestId);
  }

  getPendingWorkflows(): ApprovalWorkflow[] {
    return Array.from(this.workflows.values())
      .filter(w => w.request.status === 'pending' && !w.expired);
  }

  getWorkflowsForApprover(userRole: Role): ApprovalWorkflow[] {
    return this.getPendingWorkflows()
      .filter(w => w.rule.approverRoles.some(role => hasRole(userRole, role)));
  }

  onWorkflowEvent(listener: (workflow: ApprovalWorkflow, event: string) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(workflow: ApprovalWorkflow, event: string): void {
    this.listeners.forEach(l => l(workflow, event));
  }

  addRule(rule: ApprovalRule): void {
    this.rules.set(rule.action, rule);
  }

  getAllRules(): ApprovalRule[] {
    return Array.from(this.rules.values());
  }
}

export const approvalRequirements = new ApprovalRequirements();
