// Restricted Assets - Manages trading restrictions

interface RestrictionRule {
  symbol: string;
  reason: string;
  restrictionType: 'no_trade' | 'no_buy' | 'no_sell' | 'size_limit';
  maxSize?: number;
  expiresAt?: Date;
  addedAt: Date;
  addedBy: string;
}

class RestrictedAssets {
  private restrictions: Map<string, RestrictionRule> = new Map();
  private globalRestrictions: RestrictionRule[] = [];

  addRestriction(rule: Omit<RestrictionRule, 'addedAt'>): void {
    const fullRule: RestrictionRule = {
      ...rule,
      addedAt: new Date()
    };
    this.restrictions.set(rule.symbol, fullRule);
  }

  addGlobalRestriction(rule: Omit<RestrictionRule, 'addedAt' | 'symbol'>): void {
    this.globalRestrictions.push({
      ...rule,
      symbol: '*',
      addedAt: new Date()
    });
  }

  removeRestriction(symbol: string): void {
    this.restrictions.delete(symbol);
  }

  checkTrade(symbol: string, side: 'buy' | 'sell', quantity: number): { allowed: boolean; reason?: string } {
    // Clean up expired restrictions
    this.cleanupExpired();

    // Check global restrictions
    for (const rule of this.globalRestrictions) {
      if (rule.restrictionType === 'no_trade') {
        return { allowed: false, reason: `Global restriction: ${rule.reason}` };
      }
    }

    // Check symbol-specific restrictions
    const restriction = this.restrictions.get(symbol);
    if (!restriction) {
      return { allowed: true };
    }

    switch (restriction.restrictionType) {
      case 'no_trade':
        return { allowed: false, reason: restriction.reason };
      case 'no_buy':
        if (side === 'buy') {
          return { allowed: false, reason: restriction.reason };
        }
        break;
      case 'no_sell':
        if (side === 'sell') {
          return { allowed: false, reason: restriction.reason };
        }
        break;
      case 'size_limit':
        if (restriction.maxSize && quantity > restriction.maxSize) {
          return { allowed: false, reason: `Size exceeds limit of ${restriction.maxSize}: ${restriction.reason}` };
        }
        break;
    }

    return { allowed: true };
  }

  private cleanupExpired(): void {
    const now = new Date();
    
    this.restrictions.forEach((rule, symbol) => {
      if (rule.expiresAt && rule.expiresAt < now) {
        this.restrictions.delete(symbol);
      }
    });

    this.globalRestrictions = this.globalRestrictions.filter(
      rule => !rule.expiresAt || rule.expiresAt >= now
    );
  }

  getRestriction(symbol: string): RestrictionRule | undefined {
    return this.restrictions.get(symbol);
  }

  getAllRestrictions(): RestrictionRule[] {
    return [...Array.from(this.restrictions.values()), ...this.globalRestrictions];
  }

  isRestricted(symbol: string): boolean {
    return this.restrictions.has(symbol);
  }

  // Bulk operations for compliance lists
  importRestrictedList(symbols: string[], reason: string, addedBy: string): void {
    for (const symbol of symbols) {
      this.addRestriction({
        symbol,
        reason,
        restrictionType: 'no_trade',
        addedBy
      });
    }
  }

  clear(): void {
    this.restrictions.clear();
    this.globalRestrictions = [];
  }
}

export const restrictedAssets = new RestrictedAssets();
