// Governance System Types

export type Role = 'admin' | 'operator' | 'analyst' | 'viewer';

export type ActionCategory = 
  | 'trading' 
  | 'automation' 
  | 'data' 
  | 'configuration' 
  | 'user_management';

export type RiskTier = 'low' | 'medium' | 'high' | 'critical';

export interface Permission {
  action: string;
  category: ActionCategory;
  riskTier: RiskTier;
  allowedRoles: Role[];
  requiresApproval: boolean;
  approverRoles?: Role[];
}

export interface User {
  id: string;
  email: string;
  role: Role;
  permissions: string[];
  createdAt: Date;
}

export interface ApprovalRequest {
  id: string;
  action: string;
  requesterId: string;
  approverId?: string;
  status: 'pending' | 'approved' | 'rejected';
  context: Record<string, unknown>;
  createdAt: Date;
  resolvedAt?: Date;
}
