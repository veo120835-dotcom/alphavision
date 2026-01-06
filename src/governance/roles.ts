// Role Definitions and Management

import { Role, Permission, ActionCategory, RiskTier } from './types';

const roleHierarchy: Record<Role, number> = {
  viewer: 0,
  analyst: 1,
  operator: 2,
  admin: 3
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canPerformAction(userRole: Role, permission: Permission): boolean {
  return permission.allowedRoles.includes(userRole);
}

export function canApprove(userRole: Role, permission: Permission): boolean {
  if (!permission.requiresApproval || !permission.approverRoles) return false;
  return permission.approverRoles.includes(userRole);
}

export const defaultPermissions: Permission[] = [
  // Trading actions
  { action: 'view_positions', category: 'trading', riskTier: 'low', allowedRoles: ['viewer', 'analyst', 'operator', 'admin'], requiresApproval: false },
  { action: 'paper_trade', category: 'trading', riskTier: 'low', allowedRoles: ['analyst', 'operator', 'admin'], requiresApproval: false },
  { action: 'live_trade', category: 'trading', riskTier: 'critical', allowedRoles: ['operator', 'admin'], requiresApproval: true, approverRoles: ['admin'] },
  { action: 'activate_kill_switch', category: 'trading', riskTier: 'high', allowedRoles: ['operator', 'admin'], requiresApproval: false },
  
  // Automation actions
  { action: 'view_playbooks', category: 'automation', riskTier: 'low', allowedRoles: ['viewer', 'analyst', 'operator', 'admin'], requiresApproval: false },
  { action: 'run_playbook', category: 'automation', riskTier: 'medium', allowedRoles: ['operator', 'admin'], requiresApproval: false },
  { action: 'modify_playbook', category: 'automation', riskTier: 'high', allowedRoles: ['admin'], requiresApproval: false },
  
  // Configuration actions
  { action: 'view_config', category: 'configuration', riskTier: 'low', allowedRoles: ['analyst', 'operator', 'admin'], requiresApproval: false },
  { action: 'modify_risk_limits', category: 'configuration', riskTier: 'critical', allowedRoles: ['admin'], requiresApproval: true, approverRoles: ['admin'] },
];

export function getPermission(action: string): Permission | undefined {
  return defaultPermissions.find(p => p.action === action);
}
