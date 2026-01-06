// Risk Tiers - Action categorization by risk level

import { RiskTier, ActionCategory } from './types';

interface TieredAction {
  action: string;
  category: ActionCategory;
  tier: RiskTier;
  description: string;
  automatable: boolean;
  requiresApproval: boolean;
  cooldownMinutes?: number;
}

const actionTiers: TieredAction[] = [
  // Low risk - fully automatable
  { action: 'view_data', category: 'data', tier: 'low', description: 'View any data', automatable: true, requiresApproval: false },
  { action: 'run_backtest', category: 'trading', tier: 'low', description: 'Run strategy backtest', automatable: true, requiresApproval: false },
  { action: 'paper_trade', category: 'trading', tier: 'low', description: 'Execute paper trades', automatable: true, requiresApproval: false },
  { action: 'view_logs', category: 'automation', tier: 'low', description: 'View audit logs', automatable: true, requiresApproval: false },
  
  // Medium risk - automatable with constraints
  { action: 'send_notification', category: 'automation', tier: 'medium', description: 'Send notifications', automatable: true, requiresApproval: false, cooldownMinutes: 5 },
  { action: 'update_watchlist', category: 'data', tier: 'medium', description: 'Modify watchlists', automatable: true, requiresApproval: false },
  { action: 'run_playbook', category: 'automation', tier: 'medium', description: 'Execute playbooks', automatable: true, requiresApproval: false },
  { action: 'small_trade', category: 'trading', tier: 'medium', description: 'Execute small trades (<1% portfolio)', automatable: true, requiresApproval: false },
  
  // High risk - requires approval
  { action: 'modify_strategy', category: 'configuration', tier: 'high', description: 'Modify trading strategies', automatable: false, requiresApproval: true },
  { action: 'large_trade', category: 'trading', tier: 'high', description: 'Execute large trades (>1% portfolio)', automatable: false, requiresApproval: true },
  { action: 'modify_playbook', category: 'automation', tier: 'high', description: 'Modify playbooks', automatable: false, requiresApproval: true },
  { action: 'export_data', category: 'data', tier: 'high', description: 'Export sensitive data', automatable: false, requiresApproval: true },
  
  // Critical risk - always requires approval + audit
  { action: 'enable_live_trading', category: 'trading', tier: 'critical', description: 'Enable live trading', automatable: false, requiresApproval: true },
  { action: 'modify_risk_limits', category: 'configuration', tier: 'critical', description: 'Change risk limits', automatable: false, requiresApproval: true },
  { action: 'add_api_keys', category: 'configuration', tier: 'critical', description: 'Add/modify API keys', automatable: false, requiresApproval: true },
  { action: 'manage_users', category: 'user_management', tier: 'critical', description: 'User management', automatable: false, requiresApproval: true },
  { action: 'disable_circuit_breakers', category: 'trading', tier: 'critical', description: 'Disable safety controls', automatable: false, requiresApproval: true },
];

class RiskTiers {
  private tiers: Map<string, TieredAction> = new Map();
  private cooldowns: Map<string, Date> = new Map();

  constructor() {
    actionTiers.forEach(tier => this.tiers.set(tier.action, tier));
  }

  getTier(action: string): TieredAction | undefined {
    return this.tiers.get(action);
  }

  getRiskLevel(action: string): RiskTier {
    return this.tiers.get(action)?.tier || 'high';
  }

  isAutomatable(action: string): boolean {
    return this.tiers.get(action)?.automatable || false;
  }

  requiresApproval(action: string): boolean {
    return this.tiers.get(action)?.requiresApproval || true;
  }

  checkCooldown(action: string): { allowed: boolean; remainingMinutes?: number } {
    const tier = this.tiers.get(action);
    if (!tier?.cooldownMinutes) {
      return { allowed: true };
    }

    const lastExecution = this.cooldowns.get(action);
    if (!lastExecution) {
      return { allowed: true };
    }

    const elapsedMinutes = (Date.now() - lastExecution.getTime()) / 60000;
    if (elapsedMinutes < tier.cooldownMinutes) {
      return { 
        allowed: false, 
        remainingMinutes: tier.cooldownMinutes - elapsedMinutes 
      };
    }

    return { allowed: true };
  }

  recordExecution(action: string): void {
    this.cooldowns.set(action, new Date());
  }

  getActionsByTier(tier: RiskTier): TieredAction[] {
    return Array.from(this.tiers.values()).filter(t => t.tier === tier);
  }

  getActionsByCategory(category: ActionCategory): TieredAction[] {
    return Array.from(this.tiers.values()).filter(t => t.category === category);
  }

  getAllActions(): TieredAction[] {
    return Array.from(this.tiers.values());
  }

  // Custom tier registration
  registerAction(tieredAction: TieredAction): void {
    this.tiers.set(tieredAction.action, tieredAction);
  }
}

export const riskTiers = new RiskTiers();
