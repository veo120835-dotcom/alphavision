export type FundingStage = 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'series-c' | 'growth' | 'pre-ipo';
export type InvestorType = 'angel' | 'vc' | 'pe' | 'strategic' | 'family-office' | 'crowdfunding';
export type DealType = 'equity' | 'convertible' | 'safe' | 'debt' | 'revenue-share' | 'hybrid';

export interface FundabilityScore {
  overall: number;
  breakdown: {
    traction: number;
    team: number;
    market: number;
    product: number;
    financials: number;
    timing: number;
  };
  readiness: 'not-ready' | 'early' | 'ready' | 'optimal';
  recommendations: string[];
  gaps: FundabilityGap[];
  timeline: string;
}

export interface FundabilityGap {
  area: string;
  current: string;
  required: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionItems: string[];
}

export interface InvestorProfile {
  id: string;
  name: string;
  type: InvestorType;
  stages: FundingStage[];
  checkSize: { min: number; max: number };
  industries: string[];
  geographies: string[];
  thesisKeywords: string[];
  portfolioCompanies: string[];
  leadRounds: boolean;
  boardSeats: boolean;
  valueAdd: string[];
}

export interface InvestorMatch {
  investor: InvestorProfile;
  fitScore: number;
  matchReasons: string[];
  concerns: string[];
  approachStrategy: string;
  warmIntroPath?: string[];
  timing: 'now' | 'soon' | 'later';
}

export interface PitchElement {
  section: string;
  content: string;
  score: number;
  improvements: string[];
  examples?: string[];
}

export interface PitchOptimization {
  overallScore: number;
  elements: PitchElement[];
  narrative: {
    hook: string;
    problem: string;
    solution: string;
    traction: string;
    ask: string;
  };
  objectionHandlers: { objection: string; response: string }[];
  storyArc: string;
}

export interface ValuationModel {
  method: string;
  value: number;
  range: { low: number; mid: number; high: number };
  comparables: { company: string; multiple: number; value: number }[];
  assumptions: { key: string; value: string; sensitivity: number }[];
  defensibility: string;
}

export interface ValuationAnalysis {
  primaryValuation: ValuationModel;
  alternativeModels: ValuationModel[];
  recommendedRange: { min: number; max: number };
  negotiationStrategy: string;
  dilutionAnalysis: {
    preMoneyOwnership: number;
    postMoneyOwnership: number;
    futureRoundImpact: number;
  };
}

export interface DealStructure {
  type: DealType;
  terms: Record<string, unknown>;
  pros: string[];
  cons: string[];
  negotiationPoints: string[];
  redFlags: string[];
  alternatives: DealStructure[];
}

export interface DealRecommendation {
  recommendedStructure: DealStructure;
  reasoning: string;
  keyTerms: { term: string; recommendation: string; importance: 'must-have' | 'important' | 'nice-to-have' }[];
  walkAwayPoints: string[];
}

export interface PartnershipOpportunity {
  id: string;
  partnerName: string;
  type: 'distribution' | 'technology' | 'co-marketing' | 'integration' | 'reseller' | 'strategic';
  fitScore: number;
  potentialValue: number;
  synergies: string[];
  risks: string[];
  approachStrategy: string;
  dealStructure: string;
}

export interface MnAReadiness {
  score: number;
  readiness: 'not-ready' | 'early-stage' | 'preparing' | 'ready' | 'active';
  valuation: ValuationAnalysis;
  attractiveness: {
    factor: string;
    score: number;
    improvement: string;
  }[];
  potentialAcquirers: {
    name: string;
    type: 'strategic' | 'financial';
    likelihood: number;
    rationale: string;
  }[];
  preparationSteps: string[];
  timeline: string;
  dealbreakers: string[];
}

export interface BusinessMetrics {
  revenue: number;
  mrr?: number;
  arr?: number;
  growth: number;
  grossMargin: number;
  burnRate?: number;
  runway?: number;
  customers: number;
  churn: number;
  cac: number;
  ltv: number;
  nps?: number;
}

export interface CompanyProfile {
  name: string;
  industry: string;
  stage: FundingStage;
  founded: string;
  teamSize: number;
  location: string;
  metrics: BusinessMetrics;
  previousFunding?: { stage: FundingStage; amount: number; date: string }[];
  productDescription: string;
  competitiveAdvantage: string;
}
