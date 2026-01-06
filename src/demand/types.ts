export type Channel = 
  | 'organic-search'
  | 'paid-search'
  | 'social-organic'
  | 'social-paid'
  | 'content-marketing'
  | 'email'
  | 'referral'
  | 'partnerships'
  | 'events'
  | 'outbound-sales'
  | 'community'
  | 'product-led'
  | 'influencer'
  | 'pr';

export type ContentType = 
  | 'blog-post'
  | 'case-study'
  | 'whitepaper'
  | 'webinar'
  | 'podcast'
  | 'video'
  | 'infographic'
  | 'newsletter'
  | 'social-post'
  | 'landing-page';

export type FunnelStage = 'awareness' | 'consideration' | 'decision' | 'retention';

export interface ChannelFit {
  channel: Channel;
  fitScore: number;
  reasoning: string[];
  estimatedCac: number;
  timeToResults: string;
  resourceRequirement: 'low' | 'medium' | 'high';
  prerequisites: string[];
  risks: string[];
}

export interface LeadSource {
  name: string;
  channel: Channel;
  quality: number;
  volume: number;
  cac: number;
  conversionRate: number;
  trending: 'up' | 'down' | 'stable';
}

export interface LeadSourceOptimization {
  source: LeadSource;
  currentPerformance: number;
  potential: number;
  recommendations: string[];
  priorityActions: string[];
  expectedImprovement: number;
}

export interface ContentStrategy {
  pillarTopics: string[];
  contentCalendar: ContentPiece[];
  distributionPlan: DistributionChannel[];
  leadMagnets: LeadMagnet[];
  conversionPath: ConversionStep[];
}

export interface ContentPiece {
  title: string;
  type: ContentType;
  topic: string;
  funnelStage: FunnelStage;
  targetPersona: string;
  keywords: string[];
  cta: string;
  estimatedEffort: string;
}

export interface DistributionChannel {
  channel: Channel;
  strategy: string;
  frequency: string;
  metrics: string[];
}

export interface LeadMagnet {
  name: string;
  type: ContentType;
  topic: string;
  targetPersona: string;
  valueProposition: string;
  conversionGoal: number;
}

export interface ConversionStep {
  stage: FunnelStage;
  action: string;
  content: string;
  cta: string;
  expectedConversion: number;
}

export interface OutboundStrategy {
  targetSegments: TargetSegment[];
  sequences: OutboundSequence[];
  messagingFramework: MessagingFramework;
  tools: string[];
  metrics: OutboundMetrics;
}

export interface TargetSegment {
  name: string;
  criteria: string[];
  size: number;
  priority: 'primary' | 'secondary' | 'tertiary';
  painPoints: string[];
  triggers: string[];
}

export interface OutboundSequence {
  name: string;
  segment: string;
  steps: SequenceStep[];
  duration: string;
  expectedResponseRate: number;
}

export interface SequenceStep {
  day: number;
  channel: 'email' | 'linkedin' | 'phone' | 'video';
  action: string;
  template: string;
}

export interface MessagingFramework {
  valueProposition: string;
  differentiators: string[];
  objectionHandlers: Record<string, string>;
  socialProof: string[];
}

export interface OutboundMetrics {
  emailOpenRate: number;
  replyRate: number;
  meetingRate: number;
  targetMeetingsPerMonth: number;
}

export interface InboundFunnel {
  stages: FunnelStageConfig[];
  leadScoring: LeadScoringModel;
  nurturing: NurturingSequence[];
  handoffCriteria: HandoffCriteria;
}

export interface FunnelStageConfig {
  stage: FunnelStage;
  entryPoints: string[];
  content: string[];
  conversionActions: string[];
  targetConversion: number;
}

export interface LeadScoringModel {
  demographicFactors: ScoringFactor[];
  behavioralFactors: ScoringFactor[];
  mqThreshold: number;
  sqlThreshold: number;
}

export interface ScoringFactor {
  factor: string;
  weight: number;
  conditions: { value: string; points: number }[];
}

export interface NurturingSequence {
  name: string;
  trigger: string;
  duration: string;
  steps: NurturingStep[];
}

export interface NurturingStep {
  day: number;
  type: 'email' | 'content' | 'retargeting';
  content: string;
  goal: string;
}

export interface HandoffCriteria {
  mqCriteria: string[];
  sqlCriteria: string[];
  handoffProcess: string;
  slaHours: number;
}

export interface ReferralProgram {
  type: 'customer' | 'partner' | 'affiliate';
  incentiveStructure: IncentiveStructure;
  mechanics: ReferralMechanics;
  tracking: TrackingConfig;
  projectedImpact: number;
}

export interface IncentiveStructure {
  referrerReward: { type: string; value: number };
  refereeReward: { type: string; value: number };
  tiers?: { threshold: number; bonus: number }[];
}

export interface ReferralMechanics {
  triggerPoints: string[];
  sharingMethods: string[];
  conversionFlow: string;
  qualificationCriteria: string[];
}

export interface TrackingConfig {
  attribution: string;
  metrics: string[];
  reporting: string;
}

export interface ViralityLoop {
  type: 'inherent' | 'artificial' | 'collaborative';
  mechanism: string;
  viralCoefficient: number;
  cycletime: string;
  amplifiers: string[];
  constraints: string[];
}

export interface BusinessContext {
  industry: string;
  targetMarket: 'b2b' | 'b2c' | 'b2b2c';
  averageDealSize: number;
  salesCycle: string;
  currentChannels: Channel[];
  budget: number;
  teamSize: number;
  stage: string;
}
