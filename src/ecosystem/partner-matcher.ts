// Partner Matcher - Find ideal partnership matches

import { Partner, PartnerMatch, PartnerType, DealType } from './types';

interface MatchCriteria {
  industry?: string;
  partner_types?: PartnerType[];
  minimum_trust_level?: number;
  required_offerings?: string[];
  required_strengths?: string[];
}

interface BusinessProfile {
  industry: string;
  offerings: string[];
  seeking: string[];
  strengths: string[];
  weaknesses: string[];
  growth_stage: 'early' | 'growth' | 'scaling' | 'mature';
}

class PartnerMatcherService {
  private partners: Partner[] = [];
  private trustLevelScores: Record<string, number> = {
    unverified: 0,
    basic: 25,
    verified: 50,
    trusted: 75,
    premium: 100,
  };

  registerPartner(partner: Partner): void {
    const existing = this.partners.findIndex(p => p.id === partner.id);
    if (existing >= 0) {
      this.partners[existing] = partner;
    } else {
      this.partners.push(partner);
    }
  }

  findMatches(profile: BusinessProfile, criteria?: MatchCriteria): PartnerMatch[] {
    const matches: PartnerMatch[] = [];

    this.partners.forEach(partner => {
      if (criteria && !this.meetsCriteria(partner, criteria)) {
        return;
      }

      const matchResult = this.calculateMatch(partner, profile);
      if (matchResult.match_score >= 40) {
        matches.push(matchResult);
      }
    });

    return matches.sort((a, b) => b.match_score - a.match_score);
  }

  private meetsCriteria(partner: Partner, criteria: MatchCriteria): boolean {
    if (criteria.industry && partner.industry !== criteria.industry) {
      return false;
    }

    if (criteria.partner_types && !criteria.partner_types.includes(partner.type)) {
      return false;
    }

    if (criteria.minimum_trust_level) {
      const partnerTrustScore = this.trustLevelScores[partner.trust_level];
      if (partnerTrustScore < criteria.minimum_trust_level) {
        return false;
      }
    }

    if (criteria.required_offerings) {
      const hasOfferings = criteria.required_offerings.every(o =>
        partner.offerings.some(po => po.toLowerCase().includes(o.toLowerCase()))
      );
      if (!hasOfferings) return false;
    }

    return true;
  }

  private calculateMatch(partner: Partner, profile: BusinessProfile): PartnerMatch {
    let score = 0;
    const matchReasons: string[] = [];
    const synergyAreas: string[] = [];

    const offeringMatches = partner.offerings.filter(o =>
      profile.seeking.some(s => s.toLowerCase().includes(o.toLowerCase()) ||
                                o.toLowerCase().includes(s.toLowerCase()))
    );
    if (offeringMatches.length > 0) {
      score += Math.min(30, offeringMatches.length * 15);
      matchReasons.push(`Offers what you're seeking: ${offeringMatches.join(', ')}`);
      synergyAreas.push(...offeringMatches);
    }

    const seekingMatches = partner.seeking.filter(s =>
      profile.offerings.some(o => o.toLowerCase().includes(s.toLowerCase()) ||
                                  s.toLowerCase().includes(o.toLowerCase()))
    );
    if (seekingMatches.length > 0) {
      score += Math.min(25, seekingMatches.length * 12);
      matchReasons.push(`Seeking what you offer: ${seekingMatches.join(', ')}`);
    }

    const strengthGapFills = partner.strengths.filter(s =>
      profile.weaknesses.some(w => s.toLowerCase().includes(w.toLowerCase()))
    );
    if (strengthGapFills.length > 0) {
      score += Math.min(20, strengthGapFills.length * 10);
      matchReasons.push(`Their strengths complement your gaps`);
      synergyAreas.push(...strengthGapFills);
    }

    if (partner.industry === profile.industry) {
      score += 15;
      matchReasons.push('Same industry - deep understanding of challenges');
    } else {
      score += 5;
      matchReasons.push('Cross-industry - fresh perspectives');
    }

    const trustBonus = this.trustLevelScores[partner.trust_level] / 10;
    score += trustBonus;

    const potentialDealTypes = this.identifyDealTypes(partner, profile);
    const estimatedValue = this.estimatePartnershipValue(score, partner, profile);

    return {
      partner_id: partner.id,
      match_score: Math.min(100, score),
      match_reasons: matchReasons,
      synergy_areas: synergyAreas,
      potential_deal_types: potentialDealTypes,
      estimated_value: estimatedValue,
      recommended_approach: this.generateApproach(partner, matchReasons),
    };
  }

  private identifyDealTypes(partner: Partner, profile: BusinessProfile): DealType[] {
    const dealTypes: DealType[] = [];

    if (partner.type === 'referral' || partner.type === 'channel') {
      dealTypes.push('partnership');
    }

    if (partner.type === 'technology' || partner.type === 'integration') {
      dealTypes.push('integration');
      dealTypes.push('licensing');
    }

    if (partner.type === 'strategic') {
      dealTypes.push('partnership');
      dealTypes.push('joint_venture');
      if (profile.growth_stage === 'scaling' || profile.growth_stage === 'mature') {
        dealTypes.push('investment');
      }
    }

    return [...new Set(dealTypes)];
  }

  private estimatePartnershipValue(
    matchScore: number,
    partner: Partner,
    profile: BusinessProfile
  ): 'low' | 'medium' | 'high' | 'very_high' {
    const trustMultiplier = this.trustLevelScores[partner.trust_level] / 100;
    const stageMultiplier = {
      early: 0.5,
      growth: 1,
      scaling: 1.5,
      mature: 1.25,
    }[profile.growth_stage];

    const valueScore = matchScore * trustMultiplier * stageMultiplier;

    if (valueScore >= 80) return 'very_high';
    if (valueScore >= 60) return 'high';
    if (valueScore >= 40) return 'medium';
    return 'low';
  }

  private generateApproach(partner: Partner, matchReasons: string[]): string {
    if (partner.trust_level === 'premium' || partner.trust_level === 'trusted') {
      return 'Direct outreach highlighting mutual benefits. Propose initial collaboration call.';
    }

    if (matchReasons.length >= 3) {
      return 'Strong fit identified. Request warm introduction if possible, or send personalized outreach.';
    }

    return 'Explore common ground through industry events or content engagement before direct outreach.';
  }

  getPartnerById(partnerId: string): Partner | undefined {
    return this.partners.find(p => p.id === partnerId);
  }

  getPartnersByType(type: PartnerType): Partner[] {
    return this.partners.filter(p => p.type === type);
  }

  getTopMatches(profile: BusinessProfile, limit: number = 10): PartnerMatch[] {
    return this.findMatches(profile).slice(0, limit);
  }
}

export const partnerMatcherService = new PartnerMatcherService();
