// Ecosystem & Opportunity Marketplace Types

export type PartnerType = 'technology' | 'channel' | 'strategic' | 'integration' | 'referral';
export type DealType = 'partnership' | 'investment' | 'acquisition' | 'joint_venture' | 'licensing' | 'strategic' | 'integration';
export type TrustLevel = 'unverified' | 'basic' | 'verified' | 'trusted' | 'premium';

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  industry: string;
  description: string;
  website?: string;
  contact_email?: string;
  strengths: string[];
  offerings: string[];
  seeking: string[];
  trust_level: TrustLevel;
  verified_at?: string;
  created_at: string;
}

export interface PartnerMatch {
  partner_id: string;
  match_score: number;
  match_reasons: string[];
  synergy_areas: string[];
  potential_deal_types: DealType[];
  estimated_value: 'low' | 'medium' | 'high' | 'very_high';
  recommended_approach: string;
}

export interface DealOpportunity {
  id: string;
  type: DealType;
  title: string;
  description: string;
  partner_id?: string;
  value_estimate: number;
  probability: number;
  stage: 'identified' | 'exploring' | 'negotiating' | 'closing' | 'closed';
  key_terms: string[];
  risks: string[];
  next_steps: string[];
  deadline?: string;
  created_at: string;
}

export interface OpportunityScore {
  opportunity_id: string;
  strategic_fit: number;
  financial_potential: number;
  execution_feasibility: number;
  risk_adjusted_score: number;
  ranking: number;
}

export interface TrustVerification {
  partner_id: string;
  verification_type: 'identity' | 'business' | 'references' | 'track_record';
  verified: boolean;
  verified_at?: string;
  verification_notes?: string;
  documents?: string[];
}

export interface Introduction {
  id: string;
  requester_id: string;
  target_partner_id: string;
  introducer_id?: string;
  status: 'requested' | 'pending_approval' | 'approved' | 'made' | 'declined';
  context: string;
  mutual_benefit: string;
  scheduled_at?: string;
  outcome?: string;
  created_at: string;
}

export interface EcosystemMetrics {
  total_partners: number;
  active_opportunities: number;
  introductions_made: number;
  deals_closed: number;
  total_deal_value: number;
  average_match_score: number;
}
