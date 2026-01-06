// Position Limits - Enforces position size constraints

interface PositionLimitConfig {
  maxPositionSize: number;          // Max shares per position
  maxPositionValue: number;         // Max $ value per position
  maxPositionPercent: number;       // Max % of portfolio per position
  maxTotalPositions: number;        // Max number of positions
}

interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentValue?: number;
  limit?: number;
}

class PositionLimits {
  private config: PositionLimitConfig = {
    maxPositionSize: 10000,
    maxPositionValue: 50000,
    maxPositionPercent: 0.1,
    maxTotalPositions: 20
  };

  private positions: Map<string, { quantity: number; value: number }> = new Map();
  private portfolioValue: number = 100000;

  configure(config: Partial<PositionLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setPortfolioValue(value: number): void {
    this.portfolioValue = value;
  }

  updatePosition(symbol: string, quantity: number, value: number): void {
    this.positions.set(symbol, { quantity, value });
  }

  async check(symbol: string, quantity: number, side: 'buy' | 'sell'): Promise<LimitCheckResult> {
    const current = this.positions.get(symbol) || { quantity: 0, value: 0 };
    
    if (side === 'sell') {
      // Selling - check we have enough
      if (quantity > current.quantity) {
        return {
          allowed: false,
          reason: `Insufficient position: have ${current.quantity}, trying to sell ${quantity}`
        };
      }
      return { allowed: true };
    }

    // Buying - check limits
    const newQuantity = current.quantity + quantity;
    
    // Check position size limit
    if (newQuantity > this.config.maxPositionSize) {
      return {
        allowed: false,
        reason: 'Position size limit exceeded',
        currentValue: current.quantity,
        limit: this.config.maxPositionSize
      };
    }

    // Check number of positions
    if (!this.positions.has(symbol) && this.positions.size >= this.config.maxTotalPositions) {
      return {
        allowed: false,
        reason: 'Maximum number of positions reached',
        currentValue: this.positions.size,
        limit: this.config.maxTotalPositions
      };
    }

    return { allowed: true };
  }

  async checkValue(symbol: string, additionalValue: number): Promise<LimitCheckResult> {
    const current = this.positions.get(symbol) || { quantity: 0, value: 0 };
    const newValue = current.value + additionalValue;

    // Check absolute value limit
    if (newValue > this.config.maxPositionValue) {
      return {
        allowed: false,
        reason: 'Position value limit exceeded',
        currentValue: current.value,
        limit: this.config.maxPositionValue
      };
    }

    // Check percentage limit
    const percentOfPortfolio = newValue / this.portfolioValue;
    if (percentOfPortfolio > this.config.maxPositionPercent) {
      return {
        allowed: false,
        reason: 'Position exceeds portfolio concentration limit',
        currentValue: percentOfPortfolio,
        limit: this.config.maxPositionPercent
      };
    }

    return { allowed: true };
  }

  getConfig(): PositionLimitConfig {
    return { ...this.config };
  }
}

export const positionLimits = new PositionLimits();
