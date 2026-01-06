import { FundamentalData, ValuationScore } from '../types';

export interface ValuationAnalysis {
  score: ValuationScore;
  assessment: 'deeply-undervalued' | 'undervalued' | 'fairly-valued' | 'overvalued' | 'deeply-overvalued';
  multiples: Record<string, { value: number; industryAvg: number; percentile: number }>;
  keyMetrics: string[];
  concerns: string[];
}

export interface IndustryBenchmarks {
  pe: number;
  forwardPe: number;
  pb: number;
  ps: number;
  evToEbitda: number;
  pegRatio: number;
}

export class ValuationFactorAnalyzer {
  private industryBenchmarks: Record<string, IndustryBenchmarks> = {
    technology: { pe: 25, forwardPe: 22, pb: 5, ps: 6, evToEbitda: 18, pegRatio: 1.5 },
    healthcare: { pe: 20, forwardPe: 18, pb: 4, ps: 4, evToEbitda: 14, pegRatio: 1.8 },
    financials: { pe: 12, forwardPe: 11, pb: 1.2, ps: 3, evToEbitda: 10, pegRatio: 1.2 },
    consumer: { pe: 22, forwardPe: 20, pb: 4, ps: 2, evToEbitda: 12, pegRatio: 1.6 },
    industrials: { pe: 18, forwardPe: 16, pb: 3, ps: 1.5, evToEbitda: 11, pegRatio: 1.4 },
    energy: { pe: 10, forwardPe: 9, pb: 1.5, ps: 1, evToEbitda: 6, pegRatio: 1.0 },
    utilities: { pe: 18, forwardPe: 17, pb: 1.8, ps: 2, evToEbitda: 10, pegRatio: 2.0 },
    realestate: { pe: 35, forwardPe: 32, pb: 2, ps: 8, evToEbitda: 15, pegRatio: 2.5 },
    materials: { pe: 15, forwardPe: 13, pb: 2, ps: 1.2, evToEbitda: 8, pegRatio: 1.3 },
    default: { pe: 20, forwardPe: 18, pb: 3, ps: 3, evToEbitda: 12, pegRatio: 1.5 },
  };

  analyze(data: FundamentalData, industry: string = 'default'): ValuationAnalysis {
    const benchmarks = this.industryBenchmarks[industry.toLowerCase()] || this.industryBenchmarks.default;
    
    const relativeValue = this.scoreRelativeValue(data, benchmarks);
    const absoluteValue = this.scoreAbsoluteValue(data);
    const historicalValue = this.scoreHistoricalValue(data, benchmarks);

    const overall = (relativeValue + absoluteValue + historicalValue) / 3;

    const multiples = this.calculateMultiples(data, benchmarks);
    const keyMetrics: string[] = [];
    const concerns: string[] = [];

    // Identify key metrics
    if (data.pe && data.pe < benchmarks.pe * 0.7) {
      keyMetrics.push(`P/E of ${data.pe.toFixed(1)} is ${((1 - data.pe / benchmarks.pe) * 100).toFixed(0)}% below industry average`);
    }
    if (data.peg && data.peg < 1) {
      keyMetrics.push(`PEG ratio of ${data.peg.toFixed(2)} suggests undervaluation relative to growth`);
    }
    if (data.pb && data.pb < 1) {
      keyMetrics.push('Trading below book value');
    }
    if (data.fcfYield && data.fcfYield > 8) {
      keyMetrics.push(`High FCF yield of ${data.fcfYield.toFixed(1)}%`);
    }

    // Identify concerns
    if (data.pe && data.pe > benchmarks.pe * 1.5) {
      concerns.push(`P/E of ${data.pe.toFixed(1)} is significantly above industry average`);
    }
    if (data.peg && data.peg > 2.5) {
      concerns.push('High PEG ratio suggests overvaluation relative to growth');
    }
    if (data.evToEbitda && data.evToEbitda > benchmarks.evToEbitda * 2) {
      concerns.push('EV/EBITDA multiple is stretched');
    }
    if (data.ps && data.ps > benchmarks.ps * 2) {
      concerns.push('High price-to-sales multiple');
    }

    const score: ValuationScore = {
      overall,
      relativeValue,
      absoluteValue,
      historicalValue,
    };

    return {
      score,
      assessment: this.determineAssessment(overall),
      multiples,
      keyMetrics,
      concerns,
    };
  }

  private scoreRelativeValue(data: FundamentalData, benchmarks: IndustryBenchmarks): number {
    let score = 50;
    let factors = 0;

    // P/E relative to industry
    if (data.pe !== undefined && data.pe > 0) {
      const peRatio = data.pe / benchmarks.pe;
      if (peRatio < 0.6) score += 20;
      else if (peRatio < 0.8) score += 15;
      else if (peRatio < 1) score += 5;
      else if (peRatio > 1.5) score -= 15;
      else if (peRatio > 1.2) score -= 10;
      factors++;
    }

    // P/B relative to industry
    if (data.pb !== undefined && data.pb > 0) {
      const pbRatio = data.pb / benchmarks.pb;
      if (pbRatio < 0.5) score += 15;
      else if (pbRatio < 0.8) score += 10;
      else if (pbRatio < 1) score += 5;
      else if (pbRatio > 2) score -= 15;
      factors++;
    }

    // EV/EBITDA relative to industry
    if (data.evToEbitda !== undefined && data.evToEbitda > 0) {
      const evRatio = data.evToEbitda / benchmarks.evToEbitda;
      if (evRatio < 0.6) score += 15;
      else if (evRatio < 0.8) score += 10;
      else if (evRatio < 1) score += 5;
      else if (evRatio > 1.5) score -= 15;
      factors++;
    }

    return factors > 0 ? Math.max(0, Math.min(100, score)) : 50;
  }

  private scoreAbsoluteValue(data: FundamentalData): number {
    let score = 50;

    // PEG ratio (growth-adjusted P/E)
    if (data.peg !== undefined) {
      if (data.peg < 0.5) score += 25;
      else if (data.peg < 1) score += 15;
      else if (data.peg < 1.5) score += 5;
      else if (data.peg > 3) score -= 20;
      else if (data.peg > 2) score -= 10;
    }

    // FCF Yield
    if (data.fcfYield !== undefined) {
      if (data.fcfYield > 10) score += 20;
      else if (data.fcfYield > 7) score += 15;
      else if (data.fcfYield > 4) score += 5;
      else if (data.fcfYield < 0) score -= 15;
    }

    // Dividend Yield + Growth
    if (data.dividendYield !== undefined) {
      if (data.dividendYield > 5) score += 10;
      else if (data.dividendYield > 3) score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreHistoricalValue(data: FundamentalData, benchmarks: IndustryBenchmarks): number {
    // In practice, this would compare current multiples to historical ranges
    // For now, use a simplified approach based on absolute levels
    let score = 50;

    if (data.pe !== undefined && data.pe > 0) {
      if (data.pe < 10) score += 15;
      else if (data.pe < 15) score += 10;
      else if (data.pe > 40) score -= 15;
      else if (data.pe > 30) score -= 10;
    }

    if (data.pb !== undefined) {
      if (data.pb < 1) score += 15;
      else if (data.pb < 1.5) score += 10;
      else if (data.pb > 8) score -= 15;
      else if (data.pb > 5) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateMultiples(data: FundamentalData, benchmarks: IndustryBenchmarks): Record<string, { value: number; industryAvg: number; percentile: number }> {
    const multiples: Record<string, { value: number; industryAvg: number; percentile: number }> = {};

    if (data.pe !== undefined) {
      multiples.pe = {
        value: data.pe,
        industryAvg: benchmarks.pe,
        percentile: this.calculatePercentile(data.pe, benchmarks.pe),
      };
    }

    if (data.pb !== undefined) {
      multiples.pb = {
        value: data.pb,
        industryAvg: benchmarks.pb,
        percentile: this.calculatePercentile(data.pb, benchmarks.pb),
      };
    }

    if (data.ps !== undefined) {
      multiples.ps = {
        value: data.ps,
        industryAvg: benchmarks.ps,
        percentile: this.calculatePercentile(data.ps, benchmarks.ps),
      };
    }

    if (data.evToEbitda !== undefined) {
      multiples.evToEbitda = {
        value: data.evToEbitda,
        industryAvg: benchmarks.evToEbitda,
        percentile: this.calculatePercentile(data.evToEbitda, benchmarks.evToEbitda),
      };
    }

    return multiples;
  }

  private calculatePercentile(value: number, benchmark: number): number {
    // Simplified percentile calculation
    const ratio = value / benchmark;
    if (ratio <= 0.5) return 95;
    if (ratio <= 0.75) return 75;
    if (ratio <= 1) return 50;
    if (ratio <= 1.25) return 35;
    if (ratio <= 1.5) return 20;
    return 5;
  }

  private determineAssessment(score: number): ValuationAnalysis['assessment'] {
    if (score >= 80) return 'deeply-undervalued';
    if (score >= 65) return 'undervalued';
    if (score >= 40) return 'fairly-valued';
    if (score >= 25) return 'overvalued';
    return 'deeply-overvalued';
  }

  calculateFairValue(data: FundamentalData, industry: string = 'default'): { method: string; fairValue: number; upside: number }[] {
    const benchmarks = this.industryBenchmarks[industry.toLowerCase()] || this.industryBenchmarks.default;
    const estimates: { method: string; fairValue: number; upside: number }[] = [];

    // This would need actual price data to calculate upside
    // For now, return relative valuations

    if (data.pe !== undefined && data.pe > 0) {
      const fairPE = benchmarks.pe;
      const adjustment = fairPE / data.pe;
      estimates.push({
        method: 'P/E Multiple',
        fairValue: adjustment * 100, // Placeholder
        upside: (adjustment - 1) * 100,
      });
    }

    if (data.evToEbitda !== undefined && data.evToEbitda > 0) {
      const fairEV = benchmarks.evToEbitda;
      const adjustment = fairEV / data.evToEbitda;
      estimates.push({
        method: 'EV/EBITDA Multiple',
        fairValue: adjustment * 100,
        upside: (adjustment - 1) * 100,
      });
    }

    return estimates;
  }
}

export const valuationFactorAnalyzer = new ValuationFactorAnalyzer();
