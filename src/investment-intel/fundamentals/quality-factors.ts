import { FundamentalData, QualityScore } from '../types';

export interface QualityAnalysis {
  score: QualityScore;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  strengths: string[];
  weaknesses: string[];
  redFlags: string[];
}

export class QualityFactorAnalyzer {
  analyze(data: FundamentalData): QualityAnalysis {
    const profitability = this.scoreProfitability(data);
    const financialStrength = this.scoreFinancialStrength(data);
    const earningsQuality = this.scoreEarningsQuality(data);
    const growth = this.scoreGrowth(data);

    const overall = (profitability + financialStrength + earningsQuality + growth) / 4;

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const redFlags: string[] = [];

    // Identify strengths
    if (data.roe && data.roe > 15) strengths.push(`Strong ROE of ${data.roe.toFixed(1)}%`);
    if (data.grossMargin && data.grossMargin > 40) strengths.push(`High gross margin of ${data.grossMargin.toFixed(1)}%`);
    if (data.currentRatio && data.currentRatio > 2) strengths.push('Excellent liquidity position');
    if (data.fcfYield && data.fcfYield > 5) strengths.push('Strong free cash flow generation');

    // Identify weaknesses
    if (data.roe && data.roe < 10 && data.roe > 0) weaknesses.push('Below-average return on equity');
    if (data.debtToEquity && data.debtToEquity > 1) weaknesses.push('Elevated debt levels');
    if (data.operatingMargin && data.operatingMargin < 10) weaknesses.push('Low operating margins');

    // Identify red flags
    if (data.roe && data.roe < 0) redFlags.push('Negative return on equity');
    if (data.currentRatio && data.currentRatio < 1) redFlags.push('Liquidity concerns - current ratio below 1');
    if (data.debtToEquity && data.debtToEquity > 3) redFlags.push('Extremely high debt levels');
    if (data.netMargin && data.netMargin < 0) redFlags.push('Operating at a loss');

    const score: QualityScore = {
      overall,
      profitability,
      financialStrength,
      earningsQuality,
      growth,
    };

    return {
      score,
      grade: this.determineGrade(overall),
      strengths,
      weaknesses,
      redFlags,
    };
  }

  private scoreProfitability(data: FundamentalData): number {
    let score = 50;

    // ROE scoring
    if (data.roe !== undefined) {
      if (data.roe > 20) score += 15;
      else if (data.roe > 15) score += 10;
      else if (data.roe > 10) score += 5;
      else if (data.roe < 0) score -= 20;
      else if (data.roe < 5) score -= 10;
    }

    // ROA scoring
    if (data.roa !== undefined) {
      if (data.roa > 10) score += 10;
      else if (data.roa > 5) score += 5;
      else if (data.roa < 0) score -= 15;
    }

    // ROIC scoring
    if (data.roic !== undefined) {
      if (data.roic > 15) score += 15;
      else if (data.roic > 10) score += 10;
      else if (data.roic < 5) score -= 10;
    }

    // Operating margin
    if (data.operatingMargin !== undefined) {
      if (data.operatingMargin > 25) score += 10;
      else if (data.operatingMargin > 15) score += 5;
      else if (data.operatingMargin < 5) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreFinancialStrength(data: FundamentalData): number {
    let score = 50;

    // Debt to Equity
    if (data.debtToEquity !== undefined) {
      if (data.debtToEquity < 0.3) score += 15;
      else if (data.debtToEquity < 0.5) score += 10;
      else if (data.debtToEquity < 1) score += 5;
      else if (data.debtToEquity > 2) score -= 15;
      else if (data.debtToEquity > 1.5) score -= 10;
    }

    // Current Ratio
    if (data.currentRatio !== undefined) {
      if (data.currentRatio > 2.5) score += 10;
      else if (data.currentRatio > 1.5) score += 5;
      else if (data.currentRatio < 1) score -= 20;
      else if (data.currentRatio < 1.2) score -= 10;
    }

    // Quick Ratio
    if (data.quickRatio !== undefined) {
      if (data.quickRatio > 1.5) score += 10;
      else if (data.quickRatio > 1) score += 5;
      else if (data.quickRatio < 0.5) score -= 15;
    }

    // Free Cash Flow Yield
    if (data.fcfYield !== undefined) {
      if (data.fcfYield > 8) score += 15;
      else if (data.fcfYield > 5) score += 10;
      else if (data.fcfYield > 2) score += 5;
      else if (data.fcfYield < 0) score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreEarningsQuality(data: FundamentalData): number {
    let score = 50;

    // Gross margin stability (higher is generally better)
    if (data.grossMargin !== undefined) {
      if (data.grossMargin > 50) score += 15;
      else if (data.grossMargin > 35) score += 10;
      else if (data.grossMargin > 20) score += 5;
      else if (data.grossMargin < 15) score -= 10;
    }

    // Net margin
    if (data.netMargin !== undefined) {
      if (data.netMargin > 20) score += 15;
      else if (data.netMargin > 10) score += 10;
      else if (data.netMargin > 5) score += 5;
      else if (data.netMargin < 0) score -= 20;
    }

    // Operating margin
    if (data.operatingMargin !== undefined) {
      if (data.operatingMargin > 25) score += 10;
      else if (data.operatingMargin > 15) score += 5;
      else if (data.operatingMargin < 5) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreGrowth(data: FundamentalData): number {
    let score = 50;

    // Revenue growth
    if (data.revenueGrowth !== undefined) {
      if (data.revenueGrowth > 30) score += 20;
      else if (data.revenueGrowth > 20) score += 15;
      else if (data.revenueGrowth > 10) score += 10;
      else if (data.revenueGrowth > 5) score += 5;
      else if (data.revenueGrowth < 0) score -= 15;
    }

    // Earnings growth
    if (data.earningsGrowth !== undefined) {
      if (data.earningsGrowth > 30) score += 20;
      else if (data.earningsGrowth > 20) score += 15;
      else if (data.earningsGrowth > 10) score += 10;
      else if (data.earningsGrowth > 5) score += 5;
      else if (data.earningsGrowth < 0) score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  private determineGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 35) return 'D';
    return 'F';
  }

  compareQuality(a: FundamentalData, b: FundamentalData): { winner: 'a' | 'b' | 'tie'; comparison: Record<string, { a: number; b: number; winner: string }> } {
    const analysisA = this.analyze(a);
    const analysisB = this.analyze(b);

    const comparison: Record<string, { a: number; b: number; winner: string }> = {
      overall: { a: analysisA.score.overall, b: analysisB.score.overall, winner: analysisA.score.overall > analysisB.score.overall ? 'a' : analysisB.score.overall > analysisA.score.overall ? 'b' : 'tie' },
      profitability: { a: analysisA.score.profitability, b: analysisB.score.profitability, winner: analysisA.score.profitability > analysisB.score.profitability ? 'a' : analysisB.score.profitability > analysisA.score.profitability ? 'b' : 'tie' },
      financialStrength: { a: analysisA.score.financialStrength, b: analysisB.score.financialStrength, winner: analysisA.score.financialStrength > analysisB.score.financialStrength ? 'a' : analysisB.score.financialStrength > analysisA.score.financialStrength ? 'b' : 'tie' },
      earningsQuality: { a: analysisA.score.earningsQuality, b: analysisB.score.earningsQuality, winner: analysisA.score.earningsQuality > analysisB.score.earningsQuality ? 'a' : analysisB.score.earningsQuality > analysisA.score.earningsQuality ? 'b' : 'tie' },
      growth: { a: analysisA.score.growth, b: analysisB.score.growth, winner: analysisA.score.growth > analysisB.score.growth ? 'a' : analysisB.score.growth > analysisA.score.growth ? 'b' : 'tie' },
    };

    const aWins = Object.values(comparison).filter(c => c.winner === 'a').length;
    const bWins = Object.values(comparison).filter(c => c.winner === 'b').length;

    return {
      winner: aWins > bWins ? 'a' : bWins > aWins ? 'b' : 'tie',
      comparison,
    };
  }
}

export const qualityFactorAnalyzer = new QualityFactorAnalyzer();
