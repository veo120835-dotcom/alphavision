// Customer Shift Model - Track and predict customer behavior changes

import { CustomerShift } from './types';

interface ShiftImpactAnalysis {
  shift: CustomerShift;
  revenue_impact_estimate: 'negative_major' | 'negative_minor' | 'neutral' | 'positive_minor' | 'positive_major';
  affected_revenue_percent: number;
  time_to_impact_months: number;
  mitigation_strategies: string[];
  opportunity_strategies: string[];
}

interface SegmentVulnerability {
  segment: string;
  vulnerability_score: number;
  primary_risks: string[];
  protective_factors: string[];
  recommended_actions: string[];
}

class CustomerShiftModelService {
  private shifts: CustomerShift[] = [];
  private segments: Map<string, { size: number; value: number; loyalty: number }> = new Map();

  registerSegment(name: string, size: number, value: number, loyalty: number): void {
    this.segments.set(name, { size, value, loyalty });
  }

  recordShift(shift: CustomerShift): void {
    const existing = this.shifts.findIndex(s => s.id === shift.id);
    if (existing >= 0) {
      this.shifts[existing] = shift;
    } else {
      this.shifts.push(shift);
    }
  }

  analyzeShiftImpact(shiftId: string): ShiftImpactAnalysis | null {
    const shift = this.shifts.find(s => s.id === shiftId);
    if (!shift) return null;

    const affectedSegmentData = shift.affected_segments
      .map(seg => this.segments.get(seg))
      .filter(Boolean);

    const totalAffectedValue = affectedSegmentData.reduce((sum, seg) => sum + (seg?.value || 0), 0);
    const totalValue = Array.from(this.segments.values()).reduce((sum, seg) => sum + seg.value, 0);
    const affectedRevenuePercent = totalValue > 0 ? (totalAffectedValue / totalValue) * 100 : 0;

    const revenueImpact = this.determineRevenueImpact(shift, affectedRevenuePercent);
    const timeToImpact = this.estimateTimeToImpact(shift);

    return {
      shift,
      revenue_impact_estimate: revenueImpact,
      affected_revenue_percent: affectedRevenuePercent,
      time_to_impact_months: timeToImpact,
      mitigation_strategies: shift.opportunity_or_threat !== 'opportunity' 
        ? this.generateMitigationStrategies(shift) 
        : [],
      opportunity_strategies: shift.opportunity_or_threat !== 'threat'
        ? this.generateOpportunityStrategies(shift)
        : [],
    };
  }

  private determineRevenueImpact(
    shift: CustomerShift,
    affectedPercent: number
  ): 'negative_major' | 'negative_minor' | 'neutral' | 'positive_minor' | 'positive_major' {
    const magnitudeMultiplier = {
      transformational: 4,
      major: 3,
      moderate: 2,
      minor: 1,
    }[shift.magnitude];

    const impactScore = magnitudeMultiplier * (affectedPercent / 25);
    const isNegative = shift.opportunity_or_threat === 'threat';
    const isPositive = shift.opportunity_or_threat === 'opportunity';

    if (isNegative) {
      return impactScore >= 8 ? 'negative_major' : 'negative_minor';
    }
    if (isPositive) {
      return impactScore >= 8 ? 'positive_major' : 'positive_minor';
    }
    return 'neutral';
  }

  private estimateTimeToImpact(shift: CustomerShift): number {
    return {
      transformational: 3,
      major: 6,
      moderate: 9,
      minor: 12,
    }[shift.magnitude];
  }

  private generateMitigationStrategies(shift: CustomerShift): string[] {
    const strategies: string[] = [];

    switch (shift.shift_type) {
      case 'preference':
        strategies.push('Conduct customer research to understand new preferences');
        strategies.push('Adapt product/service to align with emerging preferences');
        strategies.push('Communicate changes and improvements to affected segments');
        break;
      case 'behavior':
        strategies.push('Analyze behavior change patterns');
        strategies.push('Adjust touchpoints and engagement strategies');
        strategies.push('Create new engagement models for changed behaviors');
        break;
      case 'demographic':
        strategies.push('Develop new customer acquisition strategies');
        strategies.push('Expand into growing demographic segments');
        strategies.push('Adapt messaging for demographic shifts');
        break;
      case 'need':
        strategies.push('Evolve product to address new needs');
        strategies.push('Develop new solutions for emerging needs');
        strategies.push('Partner with companies addressing new needs');
        break;
    }

    return strategies;
  }

  private generateOpportunityStrategies(shift: CustomerShift): string[] {
    const strategies: string[] = [];

    strategies.push('Fast-track development aligned with shift');
    strategies.push('Create marketing campaign targeting the shift');
    strategies.push('Develop case studies showing alignment');

    if (shift.magnitude === 'transformational') {
      strategies.push('Consider strategic pivot to capitalize');
      strategies.push('Evaluate acquisition opportunities');
    }

    return strategies;
  }

  analyzeSegmentVulnerability(segmentName: string): SegmentVulnerability | null {
    const segment = this.segments.get(segmentName);
    if (!segment) return null;

    const affectingShifts = this.shifts.filter(
      s => s.affected_segments.includes(segmentName)
    );

    const threatShifts = affectingShifts.filter(
      s => s.opportunity_or_threat === 'threat' || s.opportunity_or_threat === 'both'
    );

    let vulnerabilityScore = 0;
    threatShifts.forEach(shift => {
      const magnitudeWeight = { transformational: 40, major: 25, moderate: 15, minor: 5 }[shift.magnitude];
      vulnerabilityScore += magnitudeWeight;
    });

    vulnerabilityScore = Math.min(100, vulnerabilityScore * (1 - segment.loyalty));

    return {
      segment: segmentName,
      vulnerability_score: vulnerabilityScore,
      primary_risks: threatShifts.map(s => s.description),
      protective_factors: segment.loyalty > 0.7 ? ['High customer loyalty'] : [],
      recommended_actions: vulnerabilityScore > 50 
        ? ['Immediate attention required', 'Develop retention program']
        : ['Monitor situation', 'Standard engagement practices'],
    };
  }

  getActiveShifts(): CustomerShift[] {
    return this.shifts.filter(s => 
      s.magnitude !== 'minor' || s.opportunity_or_threat === 'opportunity'
    );
  }

  predictFutureShifts(industry: string): CustomerShift[] {
    const predictedShifts: CustomerShift[] = [
      {
        id: 'predicted-digital-first',
        shift_type: 'behavior',
        description: 'Continued shift toward digital-first interactions',
        magnitude: 'major',
        affected_segments: Array.from(this.segments.keys()),
        opportunity_or_threat: 'both',
        recommended_response: 'Invest in digital experience and omnichannel capabilities',
      },
      {
        id: 'predicted-value-consciousness',
        shift_type: 'preference',
        description: 'Increasing value consciousness and price sensitivity',
        magnitude: 'moderate',
        affected_segments: Array.from(this.segments.keys()),
        opportunity_or_threat: 'threat',
        recommended_response: 'Strengthen value proposition communication',
      },
    ];

    return predictedShifts;
  }
}

export const customerShiftModelService = new CustomerShiftModelService();
