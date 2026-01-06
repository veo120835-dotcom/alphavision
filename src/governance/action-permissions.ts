// Action Permission Checking

import { Role, Permission, ApprovalRequest } from './types';
import { getPermission, canPerformAction, canApprove } from './roles';

interface PermissionCheckResult {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
}

export function checkPermission(
  userRole: Role,
  action: string
): PermissionCheckResult {
  const permission = getPermission(action);
  
  if (!permission) {
    return { allowed: false, requiresApproval: false, reason: 'Unknown action' };
  }
  
  if (!canPerformAction(userRole, permission)) {
    return { 
      allowed: false, 
      requiresApproval: false, 
      reason: `Role '${userRole}' cannot perform '${action}'` 
    };
  }
  
  return {
    allowed: true,
    requiresApproval: permission.requiresApproval
  };
}

export function createApprovalRequest(
  action: string,
  requesterId: string,
  context: Record<string, unknown>
): ApprovalRequest {
  return {
    id: crypto.randomUUID(),
    action,
    requesterId,
    status: 'pending',
    context,
    createdAt: new Date()
  };
}

export function resolveApproval(
  request: ApprovalRequest,
  approverId: string,
  approverRole: Role,
  approved: boolean
): ApprovalRequest {
  const permission = getPermission(request.action);
  
  if (!permission || !canApprove(approverRole, permission)) {
    throw new Error(`Role '${approverRole}' cannot approve '${request.action}'`);
  }
  
  return {
    ...request,
    approverId,
    status: approved ? 'approved' : 'rejected',
    resolvedAt: new Date()
  };
}
