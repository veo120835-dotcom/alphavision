// Approval Policy Engine

import { ApprovalRequest, ApprovalStatus, RiskTier, ActionType, AutomationLevel } from '../types';

interface ApprovalPolicy {
  id: string;
  name: string;
  description: string;
  conditions: PolicyCondition[];
  required_approvers: number;
  approver_roles: string[];
  expiration_hours: number;
  auto_approve_conditions?: PolicyCondition[];
}

interface PolicyCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: unknown;
}

interface ApprovalResult {
  requires_approval: boolean;
  policy?: ApprovalPolicy;
  auto_approved?: boolean;
  reason: string;
}

class ApprovalPolicyEngine {
  private policies: Map<string, ApprovalPolicy> = new Map();
  private requests: Map<string, ApprovalRequest> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies(): void {
    // High-risk actions always need approval
    this.registerPolicy({
      id: 'policy_high_risk',
      name: 'High Risk Action Policy',
      description: 'All high-risk actions require manager approval',
      conditions: [
        { field: 'risk_tier', operator: 'in', value: ['high', 'critical'] },
      ],
      required_approvers: 1,
      approver_roles: ['manager', 'admin'],
      expiration_hours: 24,
    });

    // Trading actions
    this.registerPolicy({
      id: 'policy_trading',
      name: 'Trading Action Policy',
      description: 'Trading actions require approval based on size',
      conditions: [
        { field: 'action_type', operator: 'in', value: ['place_order', 'adjust_position'] },
      ],
      required_approvers: 1,
      approver_roles: ['trading_manager', 'admin'],
      expiration_hours: 4,
      auto_approve_conditions: [
        { field: 'order_value', operator: 'less_than', value: 1000 },
        { field: 'is_paper_trading', operator: 'equals', value: true },
      ],
    });

    // Financial actions
    this.registerPolicy({
      id: 'policy_financial',
      name: 'Financial Action Policy',
      description: 'Financial actions above threshold need approval',
      conditions: [
        { field: 'action_type', operator: 'in', value: ['issue_refund', 'apply_discount', 'adjust_billing'] },
      ],
      required_approvers: 1,
      approver_roles: ['finance', 'admin'],
      expiration_hours: 12,
      auto_approve_conditions: [
        { field: 'amount', operator: 'less_than', value: 100 },
      ],
    });

    // Communication at scale
    this.registerPolicy({
      id: 'policy_mass_communication',
      name: 'Mass Communication Policy',
      description: 'Bulk communications need review',
      conditions: [
        { field: 'action_type', operator: 'equals', value: 'send_email' },
        { field: 'recipient_count', operator: 'greater_than', value: 100 },
      ],
      required_approvers: 1,
      approver_roles: ['marketing', 'admin'],
      expiration_hours: 48,
    });
  }

  registerPolicy(policy: ApprovalPolicy): void {
    this.policies.set(policy.id, policy);
  }

  removePolicy(policyId: string): void {
    this.policies.delete(policyId);
  }

  evaluateAction(
    actionType: ActionType,
    actionDetails: Record<string, unknown>,
    automationLevel: AutomationLevel,
    riskTier: RiskTier
  ): ApprovalResult {
    // Level 0: Always require approval
    if (automationLevel === 0) {
      return {
        requires_approval: true,
        reason: 'Automation level is suggest-only',
      };
    }

    // Level 1: Draft and queue
    if (automationLevel === 1) {
      return {
        requires_approval: true,
        reason: 'Automation level requires human approval',
      };
    }

    const context = {
      action_type: actionType,
      risk_tier: riskTier,
      ...actionDetails,
    };

    // Find matching policies
    const matchingPolicies = this.findMatchingPolicies(context);

    if (matchingPolicies.length === 0) {
      // Level 2 or 3 with no matching policy: auto-approve
      return {
        requires_approval: false,
        auto_approved: true,
        reason: 'No restrictive policy matched',
      };
    }

    // Check auto-approve conditions
    for (const policy of matchingPolicies) {
      if (policy.auto_approve_conditions) {
        const canAutoApprove = policy.auto_approve_conditions.every(
          condition => this.evaluateCondition(condition, context)
        );

        if (canAutoApprove && automationLevel >= 2) {
          return {
            requires_approval: false,
            policy,
            auto_approved: true,
            reason: `Auto-approved by policy: ${policy.name}`,
          };
        }
      }
    }

    // Level 3 can auto-execute high-stakes with constraints
    if (automationLevel === 3 && riskTier !== 'critical') {
      const policy = matchingPolicies[0];
      return {
        requires_approval: false,
        policy,
        auto_approved: true,
        reason: 'Level 3 automation with non-critical risk',
      };
    }

    // Requires approval
    return {
      requires_approval: true,
      policy: matchingPolicies[0],
      reason: `Policy requires approval: ${matchingPolicies[0].name}`,
    };
  }

  private findMatchingPolicies(context: Record<string, unknown>): ApprovalPolicy[] {
    return Array.from(this.policies.values()).filter(policy =>
      policy.conditions.every(condition => this.evaluateCondition(condition, context))
    );
  }

  private evaluateCondition(condition: PolicyCondition, context: Record<string, unknown>): boolean {
    const value = context[condition.field];

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      default:
        return false;
    }
  }

  createApprovalRequest(
    playbookId: string,
    playbookName: string,
    stepId: string,
    actionType: ActionType,
    actionDetails: Record<string, unknown>,
    policy: ApprovalPolicy,
    riskTier: RiskTier
  ): ApprovalRequest {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + policy.expiration_hours * 60 * 60 * 1000);

    const request: ApprovalRequest = {
      id: `apr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playbook_id: playbookId,
      playbook_name: playbookName,
      step_id: stepId,
      action_type: actionType,
      action_details: actionDetails,
      risk_tier: riskTier,
      requested_at: now,
      expires_at: expiresAt,
      status: 'pending',
    };

    this.requests.set(request.id, request);
    return request;
  }

  approveRequest(requestId: string, reviewerId: string, notes?: string): ApprovalRequest | null {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') return null;

    if (new Date() > request.expires_at) {
      request.status = 'expired';
      return request;
    }

    request.status = 'approved';
    request.reviewer_id = reviewerId;
    request.reviewed_at = new Date();
    request.review_notes = notes;

    return request;
  }

  rejectRequest(requestId: string, reviewerId: string, notes?: string): ApprovalRequest | null {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') return null;

    request.status = 'rejected';
    request.reviewer_id = reviewerId;
    request.reviewed_at = new Date();
    request.review_notes = notes;

    return request;
  }

  getPendingRequests(reviewerRole?: string): ApprovalRequest[] {
    const pending = Array.from(this.requests.values()).filter(
      r => r.status === 'pending' && new Date() <= r.expires_at
    );

    if (!reviewerRole) return pending;

    // Filter by policies that allow this role
    return pending.filter(request => {
      const policies = this.findMatchingPolicies({ action_type: request.action_type, risk_tier: request.risk_tier });
      return policies.some(p => p.approver_roles.includes(reviewerRole));
    });
  }

  getRequest(requestId: string): ApprovalRequest | undefined {
    return this.requests.get(requestId);
  }

  getPolicies(): ApprovalPolicy[] {
    return Array.from(this.policies.values());
  }
}

export const approvalPolicyEngine = new ApprovalPolicyEngine();
