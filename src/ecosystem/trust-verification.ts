// Trust Verification - Verify partner trustworthiness

import { TrustVerification, TrustLevel, Partner } from './types';

interface VerificationResult {
  partner_id: string;
  overall_trust_level: TrustLevel;
  trust_score: number;
  verifications: TrustVerification[];
  pending_verifications: string[];
  recommendations: string[];
}

interface TrustAssessment {
  partner_id: string;
  risk_level: 'low' | 'medium' | 'high';
  risk_factors: string[];
  trust_signals: string[];
  recommended_actions: string[];
}

class TrustVerificationService {
  private verifications: Map<string, TrustVerification[]> = new Map();

  private verificationTypes = [
    { type: 'identity', weight: 25, description: 'Business identity verification' },
    { type: 'business', weight: 30, description: 'Business legitimacy and registration' },
    { type: 'references', weight: 25, description: 'References from trusted parties' },
    { type: 'track_record', weight: 20, description: 'Historical performance data' },
  ] as const;

  addVerification(verification: TrustVerification): void {
    const existing = this.verifications.get(verification.partner_id) || [];
    const index = existing.findIndex(v => v.verification_type === verification.verification_type);
    
    if (index >= 0) {
      existing[index] = verification;
    } else {
      existing.push(verification);
    }
    
    this.verifications.set(verification.partner_id, existing);
  }

  verifyPartner(
    partnerId: string,
    verificationType: TrustVerification['verification_type'],
    verified: boolean,
    notes?: string
  ): TrustVerification {
    const verification: TrustVerification = {
      partner_id: partnerId,
      verification_type: verificationType,
      verified,
      verified_at: verified ? new Date().toISOString() : undefined,
      verification_notes: notes,
    };

    this.addVerification(verification);
    return verification;
  }

  getVerificationResult(partnerId: string): VerificationResult {
    const verifications = this.verifications.get(partnerId) || [];
    
    let totalWeight = 0;
    let earnedWeight = 0;

    this.verificationTypes.forEach(vt => {
      totalWeight += vt.weight;
      const verification = verifications.find(v => v.verification_type === vt.type);
      if (verification?.verified) {
        earnedWeight += vt.weight;
      }
    });

    const trustScore = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;
    const trustLevel = this.calculateTrustLevel(trustScore, verifications);
    
    const pendingVerifications = this.verificationTypes
      .filter(vt => !verifications.some(v => v.verification_type === vt.type && v.verified))
      .map(vt => vt.type);

    const recommendations = this.generateRecommendations(trustLevel, pendingVerifications);

    return {
      partner_id: partnerId,
      overall_trust_level: trustLevel,
      trust_score: trustScore,
      verifications,
      pending_verifications: pendingVerifications,
      recommendations,
    };
  }

  private calculateTrustLevel(score: number, verifications: TrustVerification[]): TrustLevel {
    const hasIdentity = verifications.some(v => v.verification_type === 'identity' && v.verified);
    const hasBusiness = verifications.some(v => v.verification_type === 'business' && v.verified);
    const hasReferences = verifications.some(v => v.verification_type === 'references' && v.verified);
    const hasTrackRecord = verifications.some(v => v.verification_type === 'track_record' && v.verified);

    if (score >= 90 && hasIdentity && hasBusiness && hasReferences && hasTrackRecord) {
      return 'premium';
    }
    if (score >= 70 && hasIdentity && hasBusiness) {
      return 'trusted';
    }
    if (score >= 50 && hasIdentity) {
      return 'verified';
    }
    if (score >= 25) {
      return 'basic';
    }
    return 'unverified';
  }

  private generateRecommendations(trustLevel: TrustLevel, pending: string[]): string[] {
    const recommendations: string[] = [];

    if (pending.includes('identity')) {
      recommendations.push('Complete identity verification for basic trust level');
    }
    if (pending.includes('business')) {
      recommendations.push('Verify business registration and legitimacy');
    }
    if (pending.includes('references')) {
      recommendations.push('Collect references from mutual connections');
    }
    if (pending.includes('track_record')) {
      recommendations.push('Document past collaboration history');
    }

    if (trustLevel === 'unverified') {
      recommendations.push('Exercise caution - recommend starting with small engagements');
    }

    return recommendations;
  }

  assessPartnerTrust(partner: Partner): TrustAssessment {
    const verificationResult = this.getVerificationResult(partner.id);
    const riskFactors: string[] = [];
    const trustSignals: string[] = [];

    if (verificationResult.trust_score < 50) {
      riskFactors.push('Low verification score');
    }

    if (verificationResult.pending_verifications.includes('identity')) {
      riskFactors.push('Identity not verified');
    }

    if (verificationResult.pending_verifications.includes('business')) {
      riskFactors.push('Business not verified');
    }

    if (!partner.website) {
      riskFactors.push('No website provided');
    }

    if (partner.trust_level === 'premium' || partner.trust_level === 'trusted') {
      trustSignals.push('High trust level established');
    }

    if (partner.verified_at) {
      trustSignals.push('Previously verified');
    }

    if (partner.strengths.length >= 3) {
      trustSignals.push('Clear value proposition');
    }

    const riskLevel = riskFactors.length >= 3 ? 'high' :
                      riskFactors.length >= 1 ? 'medium' : 'low';

    const recommendedActions = this.generateRiskMitigation(riskLevel, riskFactors);

    return {
      partner_id: partner.id,
      risk_level: riskLevel,
      risk_factors: riskFactors,
      trust_signals: trustSignals,
      recommended_actions: recommendedActions,
    };
  }

  private generateRiskMitigation(riskLevel: string, riskFactors: string[]): string[] {
    const actions: string[] = [];

    if (riskLevel === 'high') {
      actions.push('Require upfront verification before engagement');
      actions.push('Start with small, low-risk collaboration');
      actions.push('Get references from trusted sources');
    } else if (riskLevel === 'medium') {
      actions.push('Complete pending verifications');
      actions.push('Structure agreements with clear milestones');
    }

    if (riskFactors.includes('Identity not verified')) {
      actions.push('Request identity documentation');
    }

    if (riskFactors.includes('Business not verified')) {
      actions.push('Verify business registration');
    }

    return actions;
  }

  requestVerification(partnerId: string, verificationType: TrustVerification['verification_type']): {
    requested: boolean;
    message: string;
    required_documents: string[];
  } {
    const requiredDocs: Record<string, string[]> = {
      identity: ['Government ID', 'Business card'],
      business: ['Business registration', 'Tax ID'],
      references: ['Reference contact list', 'Testimonials'],
      track_record: ['Case studies', 'Performance metrics'],
    };

    return {
      requested: true,
      message: `Verification request sent for ${verificationType}`,
      required_documents: requiredDocs[verificationType] || [],
    };
  }

  getPartnersByTrustLevel(level: TrustLevel): string[] {
    const partnerIds: string[] = [];
    
    this.verifications.forEach((_, partnerId) => {
      const result = this.getVerificationResult(partnerId);
      if (result.overall_trust_level === level) {
        partnerIds.push(partnerId);
      }
    });

    return partnerIds;
  }
}

export const trustVerificationService = new TrustVerificationService();
