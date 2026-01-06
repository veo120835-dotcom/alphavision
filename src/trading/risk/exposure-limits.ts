// Exposure Limits - Manages portfolio-level risk exposure

interface ExposureConfig {
  maxGrossExposure: number;         // Total long + short exposure
  maxNetExposure: number;           // Long - short exposure
  maxSectorExposure: number;        // Max per sector
  maxAssetClassExposure: Record<string, number>;
}

interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentValue?: number;
  limit?: number;
}

interface PositionExposure {
  symbol: string;
  value: number;
  side: 'long' | 'short';
  sector?: string;
  assetClass?: string;
}

class ExposureLimits {
  private config: ExposureConfig = {
    maxGrossExposure: 200000,
    maxNetExposure: 150000,
    maxSectorExposure: 50000,
    maxAssetClassExposure: {
      equity: 150000,
      crypto: 50000,
      forex: 30000
    }
  };

  private positions: PositionExposure[] = [];
  private portfolioValue: number = 100000;

  configure(config: Partial<ExposureConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setPortfolioValue(value: number): void {
    this.portfolioValue = value;
  }

  updatePositions(positions: PositionExposure[]): void {
    this.positions = positions;
  }

  async check(symbol: string, additionalExposure: number): Promise<LimitCheckResult> {
    const { gross, net } = this.calculateCurrentExposure();
    
    // Check gross exposure
    if (gross + Math.abs(additionalExposure) > this.config.maxGrossExposure) {
      return {
        allowed: false,
        reason: 'Gross exposure limit exceeded',
        currentValue: gross,
        limit: this.config.maxGrossExposure
      };
    }

    // Check net exposure
    if (Math.abs(net + additionalExposure) > this.config.maxNetExposure) {
      return {
        allowed: false,
        reason: 'Net exposure limit exceeded',
        currentValue: net,
        limit: this.config.maxNetExposure
      };
    }

    return { allowed: true };
  }

  async checkSector(sector: string, additionalExposure: number): Promise<LimitCheckResult> {
    const sectorExposure = this.positions
      .filter(p => p.sector === sector)
      .reduce((sum, p) => sum + p.value, 0);

    if (sectorExposure + additionalExposure > this.config.maxSectorExposure) {
      return {
        allowed: false,
        reason: `Sector exposure limit exceeded for ${sector}`,
        currentValue: sectorExposure,
        limit: this.config.maxSectorExposure
      };
    }

    return { allowed: true };
  }

  async checkAssetClass(assetClass: string, additionalExposure: number): Promise<LimitCheckResult> {
    const classExposure = this.positions
      .filter(p => p.assetClass === assetClass)
      .reduce((sum, p) => sum + p.value, 0);

    const limit = this.config.maxAssetClassExposure[assetClass] || this.config.maxGrossExposure;

    if (classExposure + additionalExposure > limit) {
      return {
        allowed: false,
        reason: `Asset class exposure limit exceeded for ${assetClass}`,
        currentValue: classExposure,
        limit
      };
    }

    return { allowed: true };
  }

  private calculateCurrentExposure(): { gross: number; net: number } {
    let longExposure = 0;
    let shortExposure = 0;

    for (const position of this.positions) {
      if (position.side === 'long') {
        longExposure += position.value;
      } else {
        shortExposure += position.value;
      }
    }

    return {
      gross: longExposure + shortExposure,
      net: longExposure - shortExposure
    };
  }

  getExposureReport(): {
    gross: number;
    net: number;
    bySector: Record<string, number>;
    byAssetClass: Record<string, number>;
  } {
    const { gross, net } = this.calculateCurrentExposure();
    
    const bySector: Record<string, number> = {};
    const byAssetClass: Record<string, number> = {};

    for (const position of this.positions) {
      if (position.sector) {
        bySector[position.sector] = (bySector[position.sector] || 0) + position.value;
      }
      if (position.assetClass) {
        byAssetClass[position.assetClass] = (byAssetClass[position.assetClass] || 0) + position.value;
      }
    }

    return { gross, net, bySector, byAssetClass };
  }
}

export const exposureLimits = new ExposureLimits();
