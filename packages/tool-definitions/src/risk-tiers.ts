/**
 * Risk tier definitions for tool execution safety
 * 
 * Risk tiers determine the level of scrutiny and safeguards applied
 * before allowing a tool to execute.
 */

export enum RiskTier {
  /** No risk - read-only operations */
  TIER_0 = 0,
  /** Low risk - reversible writes */
  TIER_1 = 1,
  /** Medium risk - commits with side effects */
  TIER_2 = 2,
  /** High risk - financial or data deletion */
  TIER_3 = 3,
  /** Critical risk - irreversible or high-value operations */
  TIER_4 = 4,
}

export interface RiskTierConfig {
  level: RiskTier;
  label: string;
  description: string;
  requiresApproval: boolean;
  requiresSecondaryAuth?: boolean;
  maxRetries: number;
  cooldownMs?: number;
}

export const RISK_TIERS: Record<RiskTier, RiskTierConfig> = {
  [RiskTier.TIER_0]: {
    level: RiskTier.TIER_0,
    label: 'No Risk',
    description: 'Read-only operations with no side effects',
    requiresApproval: false,
    maxRetries: 3,
  },
  [RiskTier.TIER_1]: {
    level: RiskTier.TIER_1,
    label: 'Low Risk',
    description: 'Reversible write operations (drafts, temporary data)',
    requiresApproval: false,
    maxRetries: 2,
  },
  [RiskTier.TIER_2]: {
    level: RiskTier.TIER_2,
    label: 'Medium Risk',
    description: 'Operations with external side effects (emails, notifications)',
    requiresApproval: true,
    maxRetries: 1,
    cooldownMs: 1000,
  },
  [RiskTier.TIER_3]: {
    level: RiskTier.TIER_3,
    label: 'High Risk',
    description: 'Financial transactions or data deletion',
    requiresApproval: true,
    requiresSecondaryAuth: true,
    maxRetries: 0,
    cooldownMs: 5000,
  },
  [RiskTier.TIER_4]: {
    level: RiskTier.TIER_4,
    label: 'Critical Risk',
    description: 'Irreversible or high-value operations',
    requiresApproval: true,
    requiresSecondaryAuth: true,
    maxRetries: 0,
    cooldownMs: 10000,
  },
};

/**
 * Determine the risk tier for a given tool based on its category and operation
 */
export function getRiskTierForTool(params: {
  category: string;
  operation: string;
  metadata?: {
    isReversible?: boolean;
    involvesFinancials?: boolean;
    hasExternalSideEffects?: boolean;
    isDataDeletion?: boolean;
  };
}): RiskTier {
  const { category, operation, metadata = {} } = params;

  // Critical risk - financial or irreversible operations
  if (metadata.involvesFinancials || metadata.isDataDeletion) {
    return RiskTier.TIER_4;
  }

  // High risk - payment category
  if (category === 'payment') {
    return RiskTier.TIER_3;
  }

  // Medium risk - operations with external side effects
  if (metadata.hasExternalSideEffects) {
    return RiskTier.TIER_2;
  }

  // Low risk - reversible operations
  if (metadata.isReversible) {
    return RiskTier.TIER_1;
  }

  // Read operations are typically safe
  if (operation.startsWith('get') || operation.startsWith('list') || operation.startsWith('read')) {
    return RiskTier.TIER_0;
  }

  // Default to medium risk for unknown operations
  return RiskTier.TIER_2;
}

/**
 * Check if a tool execution should be allowed based on risk tier
 */
export function shouldAllowExecution(
  riskTier: RiskTier,
  context: {
    hasUserApproval?: boolean;
    hasSecondaryAuth?: boolean;
    retryCount?: number;
  }
): { allowed: boolean; reason?: string } {
  const config = RISK_TIERS[riskTier];
  
  if (context.retryCount !== undefined && context.retryCount > config.maxRetries) {
    return {
      allowed: false,
      reason: `Maximum retry attempts (${config.maxRetries}) exceeded`,
    };
  }

  if (config.requiresApproval && !context.hasUserApproval) {
    return {
      allowed: false,
      reason: 'User approval required for this operation',
    };
  }

  if (config.requiresSecondaryAuth && !context.hasSecondaryAuth) {
    return {
      allowed: false,
      reason: 'Secondary authentication required for this operation',
    };
  }

  return { allowed: true };
}
