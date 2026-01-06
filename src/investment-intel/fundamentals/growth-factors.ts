import { FundamentalData, GrowthScore } from '../types';

export interface GrowthAnalysis {
  score: GrowthScore;
  profile: 'hyper-growth' | 'high-growth' | 'moderate-growth' | 'slow-growth' | 'declining' | 'turnaround';
  sustainability: number;
  drivers: string[];
  risks: string[];
  projections: {
    metric: string;
    current: number;
    projected1Y: number;
    projected3Y: number;
    confidence: number;
  }[];
}

export class GrowthFactorAnalyzer {
  analyze(data: FundamentalData): GrowthAnalysis {
    const revenueGrowthScore = this.scoreRevenueGrowth(data);
    const earningsGrowthScore = this.scoreEarningsGrowth(data);
    const futureGrowthScore = this.scoreFutureGrowth(data);

    const overall = (revenueGrowthScore + earningsGrowthScore + futureGrowthScore) / 3;

    const score: GrowthScore = {
      overall,
      revenueGrowth: revenueGrowthScore,
      earningsGrowth: earningsGrowthScore,
      futureGrowth: futureGrowthScore,
    };

    const profile = this.determineGrowthProfile(data);
    const sustainability = this.assessSustainability(data);
    const drivers = this.identifyGrowthDrivers(data);
    const risks = this.identifyGrowthRisks(data);
    const projections = this.generateProjections(data);

    return {
      score,
      profile,
      sustainability,
      drivers,
      risks,
      projections,
    };
  }

  private scoreRevenueGrowth(data: FundamentalData): number {
    if (data.revenueGrowth === undefined) return 50;

    const growth = data.revenueGrowth;
    if (growth > 50) return 95;
    if (growth > 30) return 85;
    if (growth > 20) return 75;
    if (growth > 10) return 60;
    if (growth > 5) return 50;
    if (growth > 0) return 40;
    if (growth > -10) return 25;
    return 10;
  }

  private scoreEarningsGrowth(data: FundamentalData): number {
    if (data.earningsGrowth === undefined) return 50;

    const growth = data.earningsGrowth;
    if (growth > 50) return 95;
    if (growth > 30) return 85;
    if (growth > 20) return 75;
    if (growth > 10) return 60;
    if (growth > 5) return 50;
    if (growth > 0) return 40;
    if (growth > -10) return 25;
    return 10;
  }

  private scoreFutureGrowth(data: FundamentalData): number {
    let score = 50;

    // Based on current fundamentals, estimate future growth potential
    if (data.grossMargin !== undefined) {
      if (data.grossMargin > 60) score += 10;
      else if (data.grossMargin > 40) score += 5;
      else if (data.grossMargin < 20) score -= 10;
    }

    // High R&D spending often correlates with future growth
    // (would need this data point in practice)

    // Operating leverage
    if (data.operatingMargin !== undefined && data.grossMargin !== undefined) {
      const operatingLeverage = data.operatingMargin / data.grossMargin;
      if (operatingLeverage > 0.5) score += 10;
      else if (operatingLeverage < 0.2) score -= 10;
    }

    // Forward P/E vs trailing suggests expected growth
    if (data.forwardPe !== undefined && data.pe !== undefined && data.pe > 0) {
      const growthImplied = (data.pe - data.forwardPe) / data.forwardPe;
      if (growthImplied > 0.2) score += 15;
      else if (growthImplied > 0.1) score += 10;
      else if (growthImplied < 0) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private determineGrowthProfile(data: FundamentalData): GrowthAnalysis['profile'] {
    const revenueGrowth = data.revenueGrowth || 0;
    const earningsGrowth = data.earningsGrowth || 0;
    const avgGrowth = (revenueGrowth + earningsGrowth) / 2;

    // Check for turnaround situation
    if (earningsGrowth > 30 && data.netMargin !== undefined && data.netMargin < 5) {
      return 'turnaround';
    }

    if (avgGrowth > 40) return 'hyper-growth';
    if (avgGrowth > 20) return 'high-growth';
    if (avgGrowth > 8) return 'moderate-growth';
    if (avgGrowth > 0) return 'slow-growth';
    return 'declining';
  }

  private assessSustainability(data: FundamentalData): number {
    let sustainability = 50;

    // High margins support sustainable growth
    if (data.grossMargin !== undefined) {
      if (data.grossMargin > 50) sustainability += 15;
      else if (data.grossMargin > 35) sustainability += 10;
      else if (data.grossMargin < 20) sustainability -= 15;
    }

    // Profitability supports reinvestment
    if (data.roe !== undefined) {
      if (data.roe > 20) sustainability += 15;
      else if (data.roe > 10) sustainability += 5;
      else if (data.roe < 0) sustainability -= 20;
    }

    // Strong balance sheet enables growth investment
    if (data.debtToEquity !== undefined) {
      if (data.debtToEquity < 0.5) sustainability += 10;
      else if (data.debtToEquity > 2) sustainability -= 15;
    }

    // FCF positive companies can fund growth internally
    if (data.fcfYield !== undefined) {
      if (data.fcfYield > 5) sustainability += 10;
      else if (data.fcfYield < 0) sustainability -= 15;
    }

    return Math.max(0, Math.min(100, sustainability));
  }

  private identifyGrowthDrivers(data: FundamentalData): string[] {
    const drivers: string[] = [];

    if (data.revenueGrowth !== undefined && data.revenueGrowth > 15) {
      drivers.push(`Strong revenue momentum (${data.revenueGrowth.toFixed(1)}% YoY)`);
    }

    if (data.earningsGrowth !== undefined && data.earningsGrowth > data.revenueGrowth!) {
      drivers.push('Operating leverage driving earnings growth faster than revenue');
    }

    if (data.grossMargin !== undefined && data.grossMargin > 50) {
      drivers.push('High gross margins provide reinvestment capacity');
    }

    if (data.roe !== undefined && data.roe > 15) {
      drivers.push(`High return on equity (${data.roe.toFixed(1)}%) enables profitable reinvestment`);
    }

    if (data.roic !== undefined && data.roic > 12) {
      drivers.push('Strong ROIC indicates efficient capital deployment');
    }

    return drivers.length > 0 ? drivers : ['No clear growth drivers identified'];
  }

  private identifyGrowthRisks(data: FundamentalData): string[] {
    const risks: string[] = [];

    if (data.revenueGrowth !== undefined && data.revenueGrowth < 5) {
      risks.push('Slowing revenue growth');
    }

    if (data.grossMargin !== undefined && data.grossMargin < 30) {
      risks.push('Low gross margins limit growth investment capacity');
    }

    if (data.debtToEquity !== undefined && data.debtToEquity > 1.5) {
      risks.push('High debt levels may constrain growth investment');
    }

    if (data.fcfYield !== undefined && data.fcfYield < 0) {
      risks.push('Negative free cash flow - dependent on external funding');
    }

    if (data.earningsGrowth !== undefined && data.revenueGrowth !== undefined) {
      if (data.earningsGrowth < data.revenueGrowth - 10) {
        risks.push('Margin compression - earnings growing slower than revenue');
      }
    }

    return risks.length > 0 ? risks : ['No significant growth risks identified'];
  }

  private generateProjections(data: FundamentalData): GrowthAnalysis['projections'] {
    const projections: GrowthAnalysis['projections'] = [];

    // Revenue projection
    if (data.revenueGrowth !== undefined) {
      const sustainableGrowth = Math.min(data.revenueGrowth, data.revenueGrowth * 0.8); // Assume some deceleration
      projections.push({
        metric: 'Revenue Growth',
        current: data.revenueGrowth,
        projected1Y: sustainableGrowth * 0.9,
        projected3Y: sustainableGrowth * 0.7,
        confidence: this.assessSustainability(data) / 100,
      });
    }

    // Earnings projection
    if (data.earningsGrowth !== undefined) {
      const sustainableGrowth = Math.min(data.earningsGrowth, data.earningsGrowth * 0.8);
      projections.push({
        metric: 'Earnings Growth',
        current: data.earningsGrowth,
        projected1Y: sustainableGrowth * 0.9,
        projected3Y: sustainableGrowth * 0.7,
        confidence: this.assessSustainability(data) / 100 * 0.9,
      });
    }

    // Margin projection
    if (data.netMargin !== undefined) {
      const marginImprovement = data.netMargin < 20 ? 1 : 0;
      projections.push({
        metric: 'Net Margin',
        current: data.netMargin,
        projected1Y: data.netMargin + marginImprovement,
        projected3Y: data.netMargin + marginImprovement * 2,
        confidence: 0.5,
      });
    }

    return projections;
  }

  calculateGrowthAdjustedValue(data: FundamentalData): { pegRatio: number; assessment: string } {
    if (data.pe === undefined || data.earningsGrowth === undefined || data.earningsGrowth <= 0) {
      return { pegRatio: 0, assessment: 'Cannot calculate PEG - missing data or negative growth' };
    }

    const pegRatio = data.pe / data.earningsGrowth;

    let assessment: string;
    if (pegRatio < 0.5) {
      assessment = 'Significantly undervalued relative to growth';
    } else if (pegRatio < 1) {
      assessment = 'Attractively valued relative to growth';
    } else if (pegRatio < 1.5) {
      assessment = 'Fairly valued relative to growth';
    } else if (pegRatio < 2) {
      assessment = 'Somewhat expensive relative to growth';
    } else {
      assessment = 'Overvalued relative to growth';
    }

    return { pegRatio, assessment };
  }
}

export const growthFactorAnalyzer = new GrowthFactorAnalyzer();
