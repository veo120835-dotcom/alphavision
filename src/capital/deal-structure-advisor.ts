import type { CompanyProfile, DealStructure, DealRecommendation, DealType, FundingStage } from './types';

interface TermSheet {
  dealType: DealType;
  valuation?: number;
  amount: number;
  discount?: number;
  cap?: number;
  interestRate?: number;
  liquidationPreference?: number;
  participatingPreferred?: boolean;
  antidilution?: 'full-ratchet' | 'weighted-average' | 'none';
  boardSeats?: number;
  proRata?: boolean;
  dragAlong?: boolean;
  payToPlay?: boolean;
}

export class DealStructureAdvisor {
  analyze(profile: CompanyProfile, termSheet?: TermSheet): DealRecommendation {
    const recommendedStructure = this.recommendStructure(profile, termSheet);
    const reasoning = this.generateReasoning(profile, recommendedStructure);
    const keyTerms = this.analyzeKeyTerms(profile, termSheet);
    const walkAwayPoints = this.identifyWalkAwayPoints(profile, termSheet);

    return {
      recommendedStructure,
      reasoning,
      keyTerms,
      walkAwayPoints,
    };
  }

  private recommendStructure(profile: CompanyProfile, termSheet?: TermSheet): DealStructure {
    const stage = profile.stage;
    
    if (stage === 'pre-seed' || stage === 'seed') {
      return this.createSAFEStructure(profile);
    }
    
    if (termSheet) {
      return this.evaluateTermSheet(profile, termSheet);
    }
    
    return this.createEquityStructure(profile);
  }

  private createSAFEStructure(profile: CompanyProfile): DealStructure {
    const suggestedCap = this.calculateValuationCap(profile);
    
    return {
      type: 'safe',
      terms: {
        cap: suggestedCap,
        discount: 0.20,
        mfn: true,
        proRata: true,
      },
      pros: [
        'Simple documentation - faster close',
        'No valuation negotiation at early stage',
        'Founder-friendly - no board seats or control provisions',
        'Standard terms well understood by investors',
      ],
      cons: [
        'Conversion math can be complex with multiple SAFEs',
        'Investors may want priced round at higher amounts',
        'Cap creates effective maximum valuation',
      ],
      negotiationPoints: [
        'Cap should reflect 2-3x expected next round valuation',
        'Discount typically 15-25%',
        'Pro-rata rights matter for investor follow-on',
        'MFN clause protects against better terms to later investors',
      ],
      redFlags: [
        'Uncapped SAFEs can lead to excessive dilution',
        'Very low caps may signal desperation',
        'Complex additional terms beyond standard SAFE',
      ],
      alternatives: [],
    };
  }

  private createEquityStructure(profile: CompanyProfile): DealStructure {
    return {
      type: 'equity',
      terms: {
        liquidationPreference: '1x non-participating',
        antidilution: 'weighted-average',
        boardSeats: profile.stage === 'series-a' ? 1 : 2,
        proRata: true,
        dragAlong: true,
        payToPlay: false,
      },
      pros: [
        'Clear valuation and ownership',
        'Standard structure understood by all parties',
        'Sets up clean cap table for future rounds',
      ],
      cons: [
        'Longer negotiation and documentation',
        'More expensive legal fees',
        'Investor typically gets board representation',
      ],
      negotiationPoints: [
        'Valuation - anchor high, expect negotiation',
        'Liquidation preference - fight for 1x non-participating',
        'Board composition - maintain founder majority if possible',
        'Protective provisions - limit scope of investor vetoes',
      ],
      redFlags: [
        'Participating preferred (double-dip)',
        'Greater than 1x liquidation preference',
        'Full-ratchet anti-dilution',
        'Excessive protective provisions',
      ],
      alternatives: [],
    };
  }

  private evaluateTermSheet(profile: CompanyProfile, termSheet: TermSheet): DealStructure {
    const issues: string[] = [];
    const positives: string[] = [];

    // Evaluate liquidation preference
    if (termSheet.liquidationPreference && termSheet.liquidationPreference > 1) {
      issues.push(`${termSheet.liquidationPreference}x liquidation preference is above market standard`);
    } else {
      positives.push('Standard 1x liquidation preference');
    }

    // Evaluate participating preferred
    if (termSheet.participatingPreferred) {
      issues.push('Participating preferred creates "double-dip" - investors get preference AND participation');
    } else {
      positives.push('Non-participating preferred is founder-friendly');
    }

    // Evaluate anti-dilution
    if (termSheet.antidilution === 'full-ratchet') {
      issues.push('Full-ratchet anti-dilution is very aggressive - push for weighted-average');
    } else if (termSheet.antidilution === 'weighted-average') {
      positives.push('Weighted-average anti-dilution is market standard');
    }

    return {
      type: termSheet.dealType,
      terms: termSheet as unknown as Record<string, unknown>,
      pros: positives,
      cons: issues,
      negotiationPoints: this.generateNegotiationPoints(termSheet, issues),
      redFlags: issues.filter(i => i.includes('aggressive') || i.includes('double-dip')),
      alternatives: this.suggestAlternatives(profile, termSheet),
    };
  }

  private calculateValuationCap(profile: CompanyProfile): number {
    const baseCaps: Record<FundingStage, number> = {
      'pre-seed': 5000000,
      'seed': 12000000,
      'series-a': 30000000,
      'series-b': 80000000,
      'series-c': 200000000,
      'growth': 500000000,
      'pre-ipo': 1000000000,
    };

    let cap = baseCaps[profile.stage];

    // Adjust for traction
    if (profile.metrics.revenue > 500000) cap *= 1.3;
    if (profile.metrics.growth > 0.20) cap *= 1.2;
    if (profile.metrics.customers > 100) cap *= 1.1;

    return Math.round(cap / 1000000) * 1000000; // Round to nearest million
  }

  private generateReasoning(profile: CompanyProfile, structure: DealStructure): string {
    const reasons: string[] = [];

    if (structure.type === 'safe') {
      reasons.push(`At ${profile.stage} stage, SAFEs provide speed and simplicity.`);
      reasons.push('Avoiding valuation negotiation now preserves optionality for growth.');
    } else if (structure.type === 'equity') {
      reasons.push(`At ${profile.stage} stage, a priced round is expected and provides clarity.`);
      reasons.push('Clear valuation helps with employee equity and future planning.');
    }

    if (profile.metrics.growth >= 0.15) {
      reasons.push('Strong growth supports premium terms and valuation.');
    }

    return reasons.join(' ');
  }

  private analyzeKeyTerms(profile: CompanyProfile, termSheet?: TermSheet): DealRecommendation['keyTerms'] {
    const terms: DealRecommendation['keyTerms'] = [
      {
        term: 'Valuation / Cap',
        recommendation: termSheet?.valuation || termSheet?.cap 
          ? `Proposed: $${((termSheet.valuation || termSheet.cap)! / 1000000).toFixed(1)}M - evaluate against comparables`
          : 'Target 2-3x where you expect to be at next round',
        importance: 'must-have',
      },
      {
        term: 'Liquidation Preference',
        recommendation: 'Insist on 1x non-participating. Never accept >1x or participating.',
        importance: 'must-have',
      },
      {
        term: 'Anti-dilution',
        recommendation: 'Weighted-average is standard. Reject full-ratchet.',
        importance: 'important',
      },
      {
        term: 'Board Seats',
        recommendation: profile.stage === 'seed' 
          ? 'Avoid giving board seats at seed if possible'
          : 'Standard is one board seat per lead investor',
        importance: profile.stage === 'seed' ? 'important' : 'nice-to-have',
      },
      {
        term: 'Pro-rata Rights',
        recommendation: 'Standard for lead investors. Can limit to major investors only.',
        importance: 'nice-to-have',
      },
      {
        term: 'Protective Provisions',
        recommendation: 'Review carefully - limit scope to major decisions only.',
        importance: 'important',
      },
    ];

    return terms;
  }

  private identifyWalkAwayPoints(profile: CompanyProfile, termSheet?: TermSheet): string[] {
    const walkAways: string[] = [];

    walkAways.push('Participating preferred with >1x liquidation preference');
    walkAways.push('Full-ratchet anti-dilution');
    walkAways.push('Investor majority on board before Series B');
    walkAways.push('Excessive protective provisions that hamper operations');
    walkAways.push('Valuation so low it creates excessive dilution (>30% for seed, >25% for A)');
    
    if (termSheet) {
      if (termSheet.participatingPreferred && (termSheet.liquidationPreference || 1) > 1) {
        walkAways.unshift('⚠️ CURRENT TERM SHEET has walk-away terms: participating preferred + >1x preference');
      }
      if (termSheet.antidilution === 'full-ratchet') {
        walkAways.unshift('⚠️ CURRENT TERM SHEET has walk-away terms: full-ratchet anti-dilution');
      }
    }

    return walkAways;
  }

  private generateNegotiationPoints(termSheet: TermSheet, issues: string[]): string[] {
    const points: string[] = [];

    if (issues.length > 0) {
      points.push('Address identified issues before signing - these are negotiable');
    }

    if (termSheet.liquidationPreference && termSheet.liquidationPreference > 1) {
      points.push('Counter with 1x preference - offer other concessions if needed');
    }

    if (termSheet.participatingPreferred) {
      points.push('Request cap on participation or convert to non-participating');
    }

    points.push('Get legal counsel to review full documents');
    points.push('Compare against other term sheets if available');

    return points;
  }

  private suggestAlternatives(profile: CompanyProfile, termSheet: TermSheet): DealStructure[] {
    const alternatives: DealStructure[] = [];

    // If equity with bad terms, suggest convertible
    if (termSheet.dealType === 'equity' && termSheet.participatingPreferred) {
      alternatives.push(this.createSAFEStructure(profile));
    }

    // Revenue-based financing alternative
    if (profile.metrics.revenue > 500000 && profile.metrics.grossMargin > 0.50) {
      alternatives.push({
        type: 'revenue-share',
        terms: {
          amount: termSheet.amount,
          repaymentCap: termSheet.amount * 1.5,
          percentageOfRevenue: 0.05,
        },
        pros: ['No dilution', 'Aligned incentives', 'Faster process'],
        cons: ['Cash flow impact', 'Limited to companies with revenue', 'Cap limits upside for lender'],
        negotiationPoints: ['Negotiate repayment cap', 'Revenue percentage should match your margins'],
        redFlags: ['Very high revenue percentages (>10%)', 'No cap on repayment'],
        alternatives: [],
      });
    }

    return alternatives;
  }

  compareDealStructures(structures: DealStructure[]): { 
    comparison: Record<string, Record<string, string>>;
    recommendation: string;
  } {
    const comparison: Record<string, Record<string, string>> = {};

    for (const structure of structures) {
      comparison[structure.type] = {
        'Dilution Impact': this.getDilutionImpact(structure),
        'Control Impact': this.getControlImpact(structure),
        'Complexity': this.getComplexity(structure),
        'Speed to Close': this.getSpeedToClose(structure),
      };
    }

    const recommendation = this.compareAndRecommend(structures);

    return { comparison, recommendation };
  }

  private getDilutionImpact(structure: DealStructure): string {
    switch (structure.type) {
      case 'safe':
      case 'convertible':
        return 'Deferred until conversion';
      case 'equity':
        return 'Immediate and known';
      case 'debt':
      case 'revenue-share':
        return 'None (non-dilutive)';
      default:
        return 'Varies';
    }
  }

  private getControlImpact(structure: DealStructure): string {
    if (structure.type === 'equity' && structure.terms.boardSeats) {
      return `${structure.terms.boardSeats} board seat(s)`;
    }
    if (structure.type === 'safe' || structure.type === 'convertible') {
      return 'Minimal until conversion';
    }
    return 'None';
  }

  private getComplexity(structure: DealStructure): string {
    switch (structure.type) {
      case 'safe':
        return 'Low - standard docs';
      case 'convertible':
        return 'Medium';
      case 'equity':
        return 'High - full documentation';
      default:
        return 'Medium';
    }
  }

  private getSpeedToClose(structure: DealStructure): string {
    switch (structure.type) {
      case 'safe':
        return '1-2 weeks';
      case 'convertible':
        return '2-4 weeks';
      case 'equity':
        return '4-8 weeks';
      default:
        return '2-6 weeks';
    }
  }

  private compareAndRecommend(structures: DealStructure[]): string {
    if (structures.length === 0) return 'No structures to compare';
    if (structures.length === 1) return `Only one option: ${structures[0].type}`;
    
    // Simple heuristic - prefer fewer red flags
    const ranked = [...structures].sort((a, b) => a.redFlags.length - b.redFlags.length);
    return `Recommend ${ranked[0].type} - fewest concerns (${ranked[0].redFlags.length} red flags vs ${ranked[ranked.length - 1].redFlags.length})`;
  }
}

export const dealStructureAdvisor = new DealStructureAdvisor();
