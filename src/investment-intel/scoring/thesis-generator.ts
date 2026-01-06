import { Asset, InvestmentThesis, Signal, FundamentalData } from '../types';
import { qualityFactorAnalyzer } from '../fundamentals/quality-factors';
import { valuationFactorAnalyzer } from '../fundamentals/valuation-factors';
import { growthFactorAnalyzer } from '../fundamentals/growth-factors';

export interface ThesisComponents {
  technicalAnalysis: string;
  fundamentalAnalysis: string;
  valuationAnalysis: string;
  catalystAnalysis: string;
  riskAnalysis: string;
}

export class ThesisGenerator {
  generate(
    asset: Asset,
    signals: Signal[],
    fundamentals?: FundamentalData,
    catalysts?: string[],
    marketContext?: string
  ): InvestmentThesis {
    const components = this.analyzeComponents(asset, signals, fundamentals, catalysts);
    const direction = this.determineDirection(signals, fundamentals);
    
    const bullCase = this.buildBullCase(components, direction);
    const bearCase = this.buildBearCase(components, direction);
    const risks = this.identifyRisks(asset, signals, fundamentals);
    const confidence = this.calculateConfidence(signals, fundamentals);

    const summary = this.buildSummary(asset, direction, components, confidence);

    return {
      summary,
      bullCase,
      bearCase,
      catalysts: catalysts || [],
      risks,
      confidence,
    };
  }

  private analyzeComponents(
    asset: Asset,
    signals: Signal[],
    fundamentals?: FundamentalData,
    catalysts?: string[]
  ): ThesisComponents {
    return {
      technicalAnalysis: this.analyzeTechnicals(signals),
      fundamentalAnalysis: fundamentals ? this.analyzeFundamentals(fundamentals) : 'No fundamental data available',
      valuationAnalysis: fundamentals ? this.analyzeValuation(fundamentals, asset.sector || 'default') : 'Valuation not assessed',
      catalystAnalysis: this.analyzeCatalysts(catalysts || []),
      riskAnalysis: this.analyzeRisks(signals, fundamentals),
    };
  }

  private analyzeTechnicals(signals: Signal[]): string {
    if (signals.length === 0) return 'No technical signals available';

    const longSignals = signals.filter(s => s.direction === 'long');
    const shortSignals = signals.filter(s => s.direction === 'short');
    const strongSignals = signals.filter(s => s.strength === 'strong');

    const direction = longSignals.length > shortSignals.length ? 'bullish' : 
                      shortSignals.length > longSignals.length ? 'bearish' : 'mixed';

    const signalTypes = [...new Set(signals.map(s => s.type))];
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;

    return `Technical picture is ${direction} with ${signals.length} signals (${strongSignals.length} strong). ` +
           `Signal types: ${signalTypes.join(', ')}. Average confidence: ${(avgConfidence * 100).toFixed(0)}%.`;
  }

  private analyzeFundamentals(data: FundamentalData): string {
    const quality = qualityFactorAnalyzer.analyze(data);
    const growth = growthFactorAnalyzer.analyze(data);

    const parts: string[] = [];

    parts.push(`Quality grade: ${quality.grade} (score: ${quality.score.overall.toFixed(0)})`);
    parts.push(`Growth profile: ${growth.profile}`);

    if (quality.strengths.length > 0) {
      parts.push(`Strengths: ${quality.strengths.slice(0, 2).join(', ')}`);
    }
    if (quality.weaknesses.length > 0) {
      parts.push(`Concerns: ${quality.weaknesses.slice(0, 2).join(', ')}`);
    }

    return parts.join('. ');
  }

  private analyzeValuation(data: FundamentalData, industry: string): string {
    const valuation = valuationFactorAnalyzer.analyze(data, industry);
    
    const parts: string[] = [];
    parts.push(`Valuation: ${valuation.assessment}`);

    if (valuation.keyMetrics.length > 0) {
      parts.push(valuation.keyMetrics[0]);
    }
    if (valuation.concerns.length > 0) {
      parts.push(`Caution: ${valuation.concerns[0]}`);
    }

    return parts.join('. ');
  }

  private analyzeCatalysts(catalysts: string[]): string {
    if (catalysts.length === 0) return 'No specific catalysts identified';
    
    return `${catalysts.length} potential catalyst(s): ${catalysts.slice(0, 3).join(', ')}` +
           (catalysts.length > 3 ? ` and ${catalysts.length - 3} more` : '');
  }

  private analyzeRisks(signals: Signal[], fundamentals?: FundamentalData): string {
    const risks: string[] = [];

    // Signal-based risks
    const lowConfidenceSignals = signals.filter(s => s.confidence < 0.4);
    if (lowConfidenceSignals.length > signals.length / 2) {
      risks.push('Low signal confidence');
    }

    // Conflicting signals
    const hasLong = signals.some(s => s.direction === 'long');
    const hasShort = signals.some(s => s.direction === 'short');
    if (hasLong && hasShort) {
      risks.push('Mixed technical signals');
    }

    // Fundamental risks
    if (fundamentals) {
      if (fundamentals.debtToEquity && fundamentals.debtToEquity > 2) {
        risks.push('High leverage');
      }
      if (fundamentals.currentRatio && fundamentals.currentRatio < 1) {
        risks.push('Liquidity concerns');
      }
    }

    return risks.length > 0 ? risks.join(', ') : 'Standard market risk';
  }

  private determineDirection(signals: Signal[], fundamentals?: FundamentalData): 'long' | 'short' | 'neutral' {
    let score = 0;

    // Technical direction
    for (const signal of signals) {
      const weight = signal.strength === 'strong' ? 2 : signal.strength === 'moderate' ? 1 : 0.5;
      if (signal.direction === 'long') score += weight * signal.confidence;
      else if (signal.direction === 'short') score -= weight * signal.confidence;
    }

    // Fundamental bias
    if (fundamentals) {
      const quality = qualityFactorAnalyzer.analyze(fundamentals);
      const valuation = valuationFactorAnalyzer.analyze(fundamentals);

      if (quality.score.overall > 70) score += 0.5;
      else if (quality.score.overall < 40) score -= 0.5;

      if (valuation.assessment === 'undervalued' || valuation.assessment === 'deeply-undervalued') {
        score += 0.5;
      } else if (valuation.assessment === 'overvalued' || valuation.assessment === 'deeply-overvalued') {
        score -= 0.5;
      }
    }

    if (score > 0.5) return 'long';
    if (score < -0.5) return 'short';
    return 'neutral';
  }

  private buildBullCase(components: ThesisComponents, direction: string): string[] {
    const bullCase: string[] = [];

    if (direction === 'long' || direction === 'neutral') {
      if (components.technicalAnalysis.includes('bullish')) {
        bullCase.push('Technical indicators suggest upside momentum');
      }
      if (components.fundamentalAnalysis.includes('A') || components.fundamentalAnalysis.includes('B')) {
        bullCase.push('Strong fundamental quality supports valuation');
      }
      if (components.valuationAnalysis.includes('undervalued')) {
        bullCase.push('Trading at attractive valuation relative to peers/history');
      }
      if (components.catalystAnalysis.includes('catalyst')) {
        bullCase.push('Identified catalysts could drive re-rating');
      }
    }

    return bullCase.length > 0 ? bullCase : ['Limited bullish factors identified'];
  }

  private buildBearCase(components: ThesisComponents, direction: string): string[] {
    const bearCase: string[] = [];

    if (direction === 'short' || direction === 'neutral') {
      if (components.technicalAnalysis.includes('bearish')) {
        bearCase.push('Technical breakdown signals further downside');
      }
      if (components.fundamentalAnalysis.includes('D') || components.fundamentalAnalysis.includes('F')) {
        bearCase.push('Weak fundamentals raise concerns');
      }
      if (components.valuationAnalysis.includes('overvalued')) {
        bearCase.push('Valuation appears stretched');
      }
    }

    if (components.riskAnalysis !== 'Standard market risk') {
      bearCase.push(`Key risks: ${components.riskAnalysis}`);
    }

    return bearCase.length > 0 ? bearCase : ['Limited bearish factors identified'];
  }

  private identifyRisks(asset: Asset, signals: Signal[], fundamentals?: FundamentalData): string[] {
    const risks: string[] = [];

    // Always present risks
    risks.push('Market-wide selloff or volatility spike');

    // Asset-specific
    if (asset.assetClass === 'crypto') {
      risks.push('High volatility and regulatory uncertainty');
    }

    // Signal-based
    if (signals.length < 3) {
      risks.push('Limited technical confirmation');
    }

    // Fundamental-based
    if (fundamentals) {
      const quality = qualityFactorAnalyzer.analyze(fundamentals);
      if (quality.redFlags.length > 0) {
        risks.push(...quality.redFlags.slice(0, 2));
      }
    }

    // Sector-specific
    if (asset.sector) {
      risks.push(`Sector-specific headwinds in ${asset.sector}`);
    }

    return risks.slice(0, 5);
  }

  private calculateConfidence(signals: Signal[], fundamentals?: FundamentalData): number {
    let confidence = 0;
    let weights = 0;

    // Signal confidence
    if (signals.length > 0) {
      const signalConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
      const signalAgreement = this.calculateSignalAgreement(signals);
      confidence += signalConfidence * 0.6 + signalAgreement * 0.4;
      weights += 1;
    }

    // Fundamental confidence
    if (fundamentals) {
      const quality = qualityFactorAnalyzer.analyze(fundamentals);
      const fundamentalConfidence = quality.score.overall / 100;
      confidence += fundamentalConfidence;
      weights += 1;
    }

    return weights > 0 ? confidence / weights : 0.5;
  }

  private calculateSignalAgreement(signals: Signal[]): number {
    if (signals.length === 0) return 0;

    const longCount = signals.filter(s => s.direction === 'long').length;
    const shortCount = signals.filter(s => s.direction === 'short').length;
    const totalDirectional = longCount + shortCount;

    if (totalDirectional === 0) return 0.5;

    return Math.max(longCount, shortCount) / totalDirectional;
  }

  private buildSummary(
    asset: Asset,
    direction: string,
    components: ThesisComponents,
    confidence: number
  ): string {
    const directionText = direction === 'long' ? 'bullish' : direction === 'short' ? 'bearish' : 'neutral';
    const confidenceText = confidence > 0.7 ? 'high' : confidence > 0.4 ? 'moderate' : 'low';

    return `${asset.symbol} presents a ${directionText} opportunity with ${confidenceText} conviction. ` +
           `${components.technicalAnalysis.split('.')[0]}. ` +
           `${components.valuationAnalysis.split('.')[0]}.`;
  }

  generateOneLiner(thesis: InvestmentThesis): string {
    const direction = thesis.bullCase.length >= thesis.bearCase.length ? 'Long' : 'Short';
    const conviction = thesis.confidence > 0.7 ? 'high' : thesis.confidence > 0.4 ? 'medium' : 'low';
    return `${direction} with ${conviction} conviction: ${thesis.summary}`;
  }
}

export const thesisGenerator = new ThesisGenerator();
