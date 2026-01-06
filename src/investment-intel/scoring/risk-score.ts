import { Asset, Signal, FundamentalData, MarketRegime } from '../types';
import { VolatilityMetrics } from '../signals/volatility-regimes';

export interface RiskScoreBreakdown {
  overall: number;
  marketRisk: number;
  assetRisk: number;
  technicalRisk: number;
  fundamentalRisk: number;
  liquidityRisk: number;
  concentrationRisk: number;
}

export interface RiskAssessment {
  score: RiskScoreBreakdown;
  level: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  factors: { factor: string; impact: number; description: string }[];
  mitigations: string[];
  maxDrawdownEstimate: number;
}

export class RiskScorer {
  assessRisk(
    asset: Asset,
    signals: Signal[],
    fundamentals?: FundamentalData,
    volatilityMetrics?: VolatilityMetrics,
    marketRegime?: MarketRegime,
    portfolioWeight?: number
  ): RiskAssessment {
    const marketRisk = this.calculateMarketRisk(marketRegime);
    const assetRisk = this.calculateAssetRisk(asset);
    const technicalRisk = this.calculateTechnicalRisk(signals, volatilityMetrics);
    const fundamentalRisk = fundamentals ? this.calculateFundamentalRisk(fundamentals) : 50;
    const liquidityRisk = this.calculateLiquidityRisk(asset);
    const concentrationRisk = this.calculateConcentrationRisk(portfolioWeight);

    const overall = (
      marketRisk * 0.20 +
      assetRisk * 0.15 +
      technicalRisk * 0.25 +
      fundamentalRisk * 0.20 +
      liquidityRisk * 0.10 +
      concentrationRisk * 0.10
    );

    const score: RiskScoreBreakdown = {
      overall,
      marketRisk,
      assetRisk,
      technicalRisk,
      fundamentalRisk,
      liquidityRisk,
      concentrationRisk,
    };

    const factors = this.identifyRiskFactors(score, asset, signals, fundamentals);
    const mitigations = this.suggestMitigations(score, asset);
    const maxDrawdownEstimate = this.estimateMaxDrawdown(score, volatilityMetrics);

    return {
      score,
      level: this.determineRiskLevel(overall),
      factors,
      mitigations,
      maxDrawdownEstimate,
    };
  }

  private calculateMarketRisk(regime?: MarketRegime): number {
    const regimeRisks: Record<MarketRegime, number> = {
      'bull': 30,
      'bear': 70,
      'sideways': 40,
      'volatile': 80,
      'low-volatility': 25,
    };

    return regime ? regimeRisks[regime] : 50;
  }

  private calculateAssetRisk(asset: Asset): number {
    let risk = 40; // Base risk

    // Asset class risk
    const assetClassRisks: Record<string, number> = {
      'equity': 0,
      'etf': -10,
      'bond': -20,
      'crypto': 30,
      'commodity': 10,
      'forex': 5,
    };
    risk += assetClassRisks[asset.assetClass] || 0;

    // Market cap risk
    if (asset.marketCap) {
      if (asset.marketCap > 100_000_000_000) risk -= 10; // Large cap
      else if (asset.marketCap < 2_000_000_000) risk += 15; // Small cap
      else if (asset.marketCap < 300_000_000) risk += 25; // Micro cap
    }

    return Math.max(0, Math.min(100, risk));
  }

  private calculateTechnicalRisk(signals: Signal[], volatilityMetrics?: VolatilityMetrics): number {
    let risk = 40;

    // Signal agreement
    const directions = signals.map(s => s.direction);
    const longCount = directions.filter(d => d === 'long').length;
    const shortCount = directions.filter(d => d === 'short').length;
    
    if (longCount > 0 && shortCount > 0) {
      risk += 15; // Mixed signals
    }

    // Low confidence signals
    const avgConfidence = signals.length > 0
      ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
      : 0.5;
    
    if (avgConfidence < 0.4) risk += 20;
    else if (avgConfidence < 0.6) risk += 10;
    else if (avgConfidence > 0.8) risk -= 10;

    // Volatility risk
    if (volatilityMetrics) {
      if (volatilityMetrics.historicalVolatility > 40) risk += 20;
      else if (volatilityMetrics.historicalVolatility > 25) risk += 10;
      else if (volatilityMetrics.historicalVolatility < 15) risk -= 10;

      if (volatilityMetrics.isExpanding) risk += 10;
    }

    return Math.max(0, Math.min(100, risk));
  }

  private calculateFundamentalRisk(data: FundamentalData): number {
    let risk = 40;

    // Leverage risk
    if (data.debtToEquity !== undefined) {
      if (data.debtToEquity > 3) risk += 25;
      else if (data.debtToEquity > 2) risk += 15;
      else if (data.debtToEquity > 1) risk += 5;
      else if (data.debtToEquity < 0.3) risk -= 10;
    }

    // Liquidity risk
    if (data.currentRatio !== undefined) {
      if (data.currentRatio < 0.8) risk += 25;
      else if (data.currentRatio < 1) risk += 15;
      else if (data.currentRatio > 2) risk -= 10;
    }

    // Profitability risk
    if (data.netMargin !== undefined) {
      if (data.netMargin < 0) risk += 20;
      else if (data.netMargin < 5) risk += 10;
      else if (data.netMargin > 20) risk -= 10;
    }

    // Growth risk
    if (data.revenueGrowth !== undefined) {
      if (data.revenueGrowth < -10) risk += 20;
      else if (data.revenueGrowth < 0) risk += 10;
    }

    return Math.max(0, Math.min(100, risk));
  }

  private calculateLiquidityRisk(asset: Asset): number {
    let risk = 30;

    if (asset.avgVolume !== undefined && asset.price !== undefined) {
      const dollarVolume = asset.avgVolume * asset.price;
      
      if (dollarVolume < 100_000) risk += 40; // Very illiquid
      else if (dollarVolume < 1_000_000) risk += 25;
      else if (dollarVolume < 10_000_000) risk += 10;
      else if (dollarVolume > 100_000_000) risk -= 15;
    }

    return Math.max(0, Math.min(100, risk));
  }

  private calculateConcentrationRisk(portfolioWeight?: number): number {
    if (!portfolioWeight) return 30;

    if (portfolioWeight > 25) return 90;
    if (portfolioWeight > 15) return 70;
    if (portfolioWeight > 10) return 50;
    if (portfolioWeight > 5) return 30;
    return 15;
  }

  private determineRiskLevel(score: number): RiskAssessment['level'] {
    if (score >= 75) return 'very-high';
    if (score >= 60) return 'high';
    if (score >= 40) return 'moderate';
    if (score >= 25) return 'low';
    return 'very-low';
  }

  private identifyRiskFactors(
    score: RiskScoreBreakdown,
    asset: Asset,
    signals: Signal[],
    fundamentals?: FundamentalData
  ): RiskAssessment['factors'] {
    const factors: RiskAssessment['factors'] = [];

    if (score.marketRisk >= 60) {
      factors.push({
        factor: 'Market Conditions',
        impact: score.marketRisk,
        description: 'Elevated market volatility or bearish regime',
      });
    }

    if (score.assetRisk >= 60) {
      factors.push({
        factor: 'Asset Class Risk',
        impact: score.assetRisk,
        description: `Higher inherent risk in ${asset.assetClass} assets`,
      });
    }

    if (score.technicalRisk >= 60) {
      factors.push({
        factor: 'Technical Uncertainty',
        impact: score.technicalRisk,
        description: 'Mixed or low-confidence technical signals',
      });
    }

    if (score.fundamentalRisk >= 60 && fundamentals) {
      factors.push({
        factor: 'Fundamental Concerns',
        impact: score.fundamentalRisk,
        description: 'Balance sheet or profitability issues',
      });
    }

    if (score.liquidityRisk >= 60) {
      factors.push({
        factor: 'Liquidity Risk',
        impact: score.liquidityRisk,
        description: 'Limited trading volume may impact execution',
      });
    }

    if (score.concentrationRisk >= 60) {
      factors.push({
        factor: 'Concentration Risk',
        impact: score.concentrationRisk,
        description: 'Position size relative to portfolio is high',
      });
    }

    return factors.sort((a, b) => b.impact - a.impact);
  }

  private suggestMitigations(score: RiskScoreBreakdown, asset: Asset): string[] {
    const mitigations: string[] = [];

    if (score.overall >= 60) {
      mitigations.push('Consider reducing position size');
    }

    if (score.technicalRisk >= 60) {
      mitigations.push('Wait for clearer technical confirmation');
      mitigations.push('Use tighter stop-loss levels');
    }

    if (score.fundamentalRisk >= 60) {
      mitigations.push('Monitor upcoming earnings/filings closely');
      mitigations.push('Consider hedging with options if available');
    }

    if (score.liquidityRisk >= 60) {
      mitigations.push('Use limit orders to manage execution');
      mitigations.push('Scale into position over time');
    }

    if (score.marketRisk >= 60) {
      mitigations.push('Consider portfolio hedges during volatile periods');
    }

    if (score.concentrationRisk >= 60) {
      mitigations.push('Reduce position size to improve diversification');
    }

    return mitigations.length > 0 ? mitigations : ['Standard risk management practices apply'];
  }

  private estimateMaxDrawdown(score: RiskScoreBreakdown, volatilityMetrics?: VolatilityMetrics): number {
    let baseDrawdown = 10; // Base 10% drawdown assumption

    // Adjust for risk score
    baseDrawdown += (score.overall / 100) * 20;

    // Adjust for volatility
    if (volatilityMetrics) {
      baseDrawdown += volatilityMetrics.historicalVolatility / 5;
    }

    // Cap at reasonable levels
    return Math.min(baseDrawdown, 50);
  }

  calculatePositionSizeLimit(
    risk: RiskAssessment,
    portfolioValue: number,
    maxRiskPerTrade: number = 0.02
  ): { maxPositionSize: number; maxPositionPercent: number; rationale: string } {
    // Kelly-inspired position sizing with risk adjustment
    const riskMultiplier = 1 - (risk.score.overall / 100) * 0.5;
    const basePosition = portfolioValue * maxRiskPerTrade;
    const adjustedPosition = basePosition * riskMultiplier / (risk.maxDrawdownEstimate / 100);

    const maxPositionSize = Math.min(adjustedPosition, portfolioValue * 0.25);
    const maxPositionPercent = (maxPositionSize / portfolioValue) * 100;

    return {
      maxPositionSize,
      maxPositionPercent,
      rationale: `Based on ${risk.level} risk level and ${risk.maxDrawdownEstimate.toFixed(1)}% estimated max drawdown`,
    };
  }
}

export const riskScorer = new RiskScorer();
