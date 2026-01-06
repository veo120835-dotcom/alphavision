/**
 * Identity Profile Builder
 * Builds deep psychological profiles for hyper-personalization
 */

export interface IdentityProfile {
  id: string;
  entityId: string;
  entityType: 'lead' | 'customer' | 'prospect';
  timestamp: Date;
  demographics: Demographics;
  psychographics: Psychographics;
  behavioralProfile: BehavioralProfile;
  communicationProfile: CommunicationProfile;
  decisionProfile: DecisionProfile;
  valueProfile: ValueProfile;
  trustProfile: TrustProfile;
  confidence: ProfileConfidence;
}

export interface Demographics {
  role?: string;
  seniority?: SeniorityLevel;
  industry?: string;
  companySize?: CompanySize;
  location?: string;
  generationalCohort?: GenerationalCohort;
  inferredIncome?: IncomeRange;
}

export type SeniorityLevel = 'entry' | 'individual_contributor' | 'manager' | 'director' | 'vp' | 'c_level' | 'founder';
export type CompanySize = 'solo' | 'small' | 'medium' | 'large' | 'enterprise';
export type GenerationalCohort = 'gen_z' | 'millennial' | 'gen_x' | 'boomer';
export type IncomeRange = 'under_50k' | '50k_100k' | '100k_200k' | '200k_500k' | 'over_500k';

export interface Psychographics {
  personality: PersonalityProfile;
  motivations: MotivationProfile;
  fears: FearProfile;
  values: string[];
  beliefs: BeliefProfile;
  identity: SelfIdentity;
}

export interface PersonalityProfile {
  dominance: number; // 0-1: Low = accommodating, High = assertive
  influence: number; // 0-1: Low = reserved, High = outgoing
  steadiness: number; // 0-1: Low = impatient, High = patient
  conscientiousness: number; // 0-1: Low = flexible, High = precise
  openness: number; // 0-1: Low = traditional, High = innovative
  riskTolerance: number; // 0-1: Low = risk-averse, High = risk-seeking
}

export interface MotivationProfile {
  primary: Motivation[];
  secondary: Motivation[];
  antiMotivations: string[];
  motivationStrength: Record<string, number>;
}

export type Motivation =
  | 'achievement'
  | 'recognition'
  | 'security'
  | 'autonomy'
  | 'belonging'
  | 'growth'
  | 'impact'
  | 'wealth'
  | 'status'
  | 'legacy'
  | 'innovation'
  | 'efficiency';

export interface FearProfile {
  primaryFears: Fear[];
  fearIntensity: Record<string, number>;
  avoidanceBehaviors: string[];
}

export type Fear =
  | 'failure'
  | 'rejection'
  | 'loss'
  | 'missing_out'
  | 'being_wrong'
  | 'embarrassment'
  | 'conflict'
  | 'change'
  | 'commitment'
  | 'wasted_resources';

export interface BeliefProfile {
  worldview: string;
  marketBeliefs: string[];
  selfBeliefs: string[];
  limitingBeliefs: string[];
  empoweringBeliefs: string[];
}

export interface SelfIdentity {
  selfImage: string[];
  aspirationalIdentity: string[];
  rejectIdentity: string[];
  groupIdentities: string[];
  statusLevel: 'emerging' | 'established' | 'elite' | 'legacy';
}

export interface BehavioralProfile {
  engagementPatterns: EngagementPattern;
  purchaseBehavior: PurchaseBehavior;
  contentPreferences: ContentPreferences;
  timePatterns: TimePatterns;
}

export interface EngagementPattern {
  avgResponseTime: number;
  preferredChannels: string[];
  engagementFrequency: 'daily' | 'weekly' | 'monthly' | 'sporadic';
  depthOfEngagement: 'surface' | 'moderate' | 'deep';
  initiationStyle: 'proactive' | 'reactive' | 'passive';
}

export interface PurchaseBehavior {
  decisionSpeed: 'impulsive' | 'moderate' | 'deliberate' | 'analytical';
  priceOrientation: 'value' | 'quality' | 'premium' | 'budget';
  researchDepth: 'minimal' | 'moderate' | 'extensive' | 'exhaustive';
  socialInfluence: number;
  brandLoyalty: number;
}

export interface ContentPreferences {
  formatPreferences: string[];
  lengthPreference: 'brief' | 'moderate' | 'detailed';
  tonePreference: 'formal' | 'conversational' | 'direct' | 'inspirational';
  proofPreference: 'data' | 'stories' | 'testimonials' | 'authority';
}

export interface TimePatterns {
  activeHours: string[];
  activeDays: number[];
  timezone: string;
  seasonalPatterns?: string[];
}

export interface CommunicationProfile {
  style: CommunicationStyle;
  preferences: CommunicationPreferences;
  language: LanguageProfile;
}

export interface CommunicationStyle {
  directness: number;
  formality: number;
  emotionality: number;
  detailOrientation: number;
  assertiveness: number;
}

export interface CommunicationPreferences {
  preferredChannel: string;
  preferredFrequency: string;
  preferredTime: string;
  responseExpectation: 'immediate' | 'same_day' | 'within_week' | 'flexible';
  meetingPreference: 'video' | 'phone' | 'in_person' | 'async';
}

export interface LanguageProfile {
  vocabulary: 'technical' | 'business' | 'casual' | 'mixed';
  jargonLevel: 'none' | 'light' | 'heavy';
  persuasionTriggers: string[];
  avoidTerms: string[];
}

export interface DecisionProfile {
  decisionStyle: DecisionStyle;
  stakeholderInfluence: StakeholderInfluence;
  timeline: DecisionTimeline;
  criteria: DecisionCriteria;
}

export interface DecisionStyle {
  type: 'analytical' | 'intuitive' | 'collaborative' | 'directive';
  informationNeeds: 'comprehensive' | 'summary' | 'key_points';
  comparisonBehavior: 'extensive' | 'moderate' | 'minimal';
  commitmentSpeed: number;
}

export interface StakeholderInfluence {
  isPrimaryDecisionMaker: boolean;
  influenceLevel: number;
  keyInfluencers: string[];
  reportingTo?: string;
  teamSize?: number;
}

export interface DecisionTimeline {
  avgDecisionDays: number;
  urgencyFactor: number;
  deadlineResponsiveness: number;
  procrastinationTendency: number;
}

export interface DecisionCriteria {
  primaryFactors: string[];
  dealBreakers: string[];
  niceToHaves: string[];
  weightedCriteria: Record<string, number>;
}

export interface ValueProfile {
  perceivedValue: PerceivedValue;
  pricesSensitivity: PriceSensitivity;
  investmentCapacity: InvestmentCapacity;
}

export interface PerceivedValue {
  valueDrivers: string[];
  valueBlockers: string[];
  roiExpectation: number;
  qualityExpectation: 'basic' | 'standard' | 'premium' | 'luxury';
}

export interface PriceSensitivity {
  sensitivity: number;
  priceAnchor?: number;
  paymentPreference: 'upfront' | 'installment' | 'subscription' | 'performance';
  negotiationLikelihood: number;
}

export interface InvestmentCapacity {
  estimatedBudget?: number;
  budgetAuthority: boolean;
  fiscalTiming?: string;
  budgetFlexibility: number;
}

export interface TrustProfile {
  trustLevel: number;
  trustFactors: TrustFactor[];
  trustBarriers: string[];
  trustBuilders: string[];
  verificationNeeds: string[];
}

export interface TrustFactor {
  factor: string;
  importance: number;
  currentStatus: 'met' | 'partial' | 'unmet' | 'unknown';
}

export interface ProfileConfidence {
  overall: number;
  bySection: Record<string, number>;
  dataPoints: number;
  lastUpdated: Date;
  reliabilitySources: string[];
}

export interface ProfileInput {
  entityId: string;
  entityType: 'lead' | 'customer' | 'prospect';
  interactions: InteractionData[];
  explicitData: Record<string, unknown>;
  behavioralSignals: BehavioralSignal[];
}

export interface InteractionData {
  type: string;
  timestamp: Date;
  content?: string;
  sentiment?: number;
  channel: string;
  responseTime?: number;
}

export interface BehavioralSignal {
  signal: string;
  timestamp: Date;
  value: unknown;
  confidence: number;
}

class IdentityProfileBuilder {
  private profiles: Map<string, IdentityProfile> = new Map();

  generateId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async buildProfile(input: ProfileInput): Promise<IdentityProfile> {
    const demographics = this.inferDemographics(input);
    const psychographics = this.inferPsychographics(input);
    const behavioralProfile = this.analyzeBehavior(input);
    const communicationProfile = this.analyzeCommunication(input);
    const decisionProfile = this.analyzeDecisionPattern(input);
    const valueProfile = this.analyzeValuePerception(input);
    const trustProfile = this.analyzeTrust(input);
    const confidence = this.calculateConfidence(input);

    const profile: IdentityProfile = {
      id: this.generateId(),
      entityId: input.entityId,
      entityType: input.entityType,
      timestamp: new Date(),
      demographics,
      psychographics,
      behavioralProfile,
      communicationProfile,
      decisionProfile,
      valueProfile,
      trustProfile,
      confidence,
    };

    this.profiles.set(input.entityId, profile);
    return profile;
  }

  private inferDemographics(input: ProfileInput): Demographics {
    const explicit = input.explicitData;

    // Infer seniority from role
    let seniority: SeniorityLevel = 'individual_contributor';
    const role = (explicit.role as string)?.toLowerCase() || '';
    if (role.includes('ceo') || role.includes('cto') || role.includes('cfo') || role.includes('chief')) {
      seniority = 'c_level';
    } else if (role.includes('vp') || role.includes('vice president')) {
      seniority = 'vp';
    } else if (role.includes('director')) {
      seniority = 'director';
    } else if (role.includes('manager') || role.includes('head')) {
      seniority = 'manager';
    } else if (role.includes('founder') || role.includes('owner')) {
      seniority = 'founder';
    }

    // Infer company size from signals
    let companySize: CompanySize = 'small';
    const employees = explicit.companyEmployees as number;
    if (employees) {
      if (employees === 1) companySize = 'solo';
      else if (employees < 50) companySize = 'small';
      else if (employees < 500) companySize = 'medium';
      else if (employees < 5000) companySize = 'large';
      else companySize = 'enterprise';
    }

    return {
      role: explicit.role as string,
      seniority,
      industry: explicit.industry as string,
      companySize,
      location: explicit.location as string,
      generationalCohort: this.inferGeneration(explicit),
      inferredIncome: this.inferIncome(seniority, companySize),
    };
  }

  private inferGeneration(data: Record<string, unknown>): GenerationalCohort | undefined {
    const birthYear = data.birthYear as number;
    if (!birthYear) return undefined;

    if (birthYear >= 1997) return 'gen_z';
    if (birthYear >= 1981) return 'millennial';
    if (birthYear >= 1965) return 'gen_x';
    return 'boomer';
  }

  private inferIncome(seniority: SeniorityLevel, companySize: CompanySize): IncomeRange {
    const seniorityMap: Record<SeniorityLevel, number> = {
      entry: 1,
      individual_contributor: 2,
      manager: 3,
      director: 4,
      vp: 5,
      c_level: 6,
      founder: 6,
    };

    const companyMap: Record<CompanySize, number> = {
      solo: 1,
      small: 2,
      medium: 3,
      large: 4,
      enterprise: 5,
    };

    const score = seniorityMap[seniority] * 0.6 + companyMap[companySize] * 0.4;

    if (score > 5) return 'over_500k';
    if (score > 4) return '200k_500k';
    if (score > 3) return '100k_200k';
    if (score > 2) return '50k_100k';
    return 'under_50k';
  }

  private inferPsychographics(input: ProfileInput): Psychographics {
    const personality = this.analyzePersonality(input);
    const motivations = this.analyzeMotivations(input);
    const fears = this.analyzeFears(input);
    const beliefs = this.analyzeBeliefs(input);
    const identity = this.analyzeIdentity(input);

    return {
      personality,
      motivations,
      fears,
      values: this.extractValues(input),
      beliefs,
      identity,
    };
  }

  private analyzePersonality(input: ProfileInput): PersonalityProfile {
    const signals = input.behavioralSignals;
    const interactions = input.interactions;

    // Default to middle values
    const profile: PersonalityProfile = {
      dominance: 0.5,
      influence: 0.5,
      steadiness: 0.5,
      conscientiousness: 0.5,
      openness: 0.5,
      riskTolerance: 0.5,
    };

    // Adjust based on response patterns
    const avgResponseTime = interactions
      .filter((i) => i.responseTime)
      .reduce((sum, i) => sum + (i.responseTime || 0), 0) / Math.max(interactions.length, 1);

    if (avgResponseTime < 60) profile.dominance += 0.2;
    if (avgResponseTime > 240) profile.steadiness += 0.2;

    // Adjust based on communication content
    const allContent = interactions.map((i) => i.content || '').join(' ').toLowerCase();

    if (allContent.includes('asap') || allContent.includes('urgent')) {
      profile.dominance += 0.1;
    }
    if (allContent.includes('detail') || allContent.includes('specific')) {
      profile.conscientiousness += 0.2;
    }
    if (allContent.includes('new') || allContent.includes('innovative')) {
      profile.openness += 0.2;
    }

    // Normalize values
    Object.keys(profile).forEach((key) => {
      profile[key as keyof PersonalityProfile] = Math.max(0, Math.min(1, profile[key as keyof PersonalityProfile]));
    });

    return profile;
  }

  private analyzeMotivations(input: ProfileInput): MotivationProfile {
    const explicit = input.explicitData;
    const content = input.interactions.map((i) => i.content || '').join(' ').toLowerCase();

    const motivations: Motivation[] = [];
    const motivationStrength: Record<string, number> = {};

    // Detect achievement motivation
    if (content.includes('goal') || content.includes('achieve') || content.includes('result')) {
      motivations.push('achievement');
      motivationStrength.achievement = 0.8;
    }

    // Detect growth motivation
    if (content.includes('learn') || content.includes('grow') || content.includes('improve')) {
      motivations.push('growth');
      motivationStrength.growth = 0.7;
    }

    // Detect efficiency motivation
    if (content.includes('time') || content.includes('efficient') || content.includes('automate')) {
      motivations.push('efficiency');
      motivationStrength.efficiency = 0.8;
    }

    // Detect security motivation
    if (content.includes('risk') || content.includes('safe') || content.includes('guarantee')) {
      motivations.push('security');
      motivationStrength.security = 0.7;
    }

    return {
      primary: motivations.slice(0, 2),
      secondary: motivations.slice(2, 4),
      antiMotivations: [],
      motivationStrength,
    };
  }

  private analyzeFears(input: ProfileInput): FearProfile {
    const content = input.interactions.map((i) => i.content || '').join(' ').toLowerCase();
    const fears: Fear[] = [];
    const fearIntensity: Record<string, number> = {};

    if (content.includes('worried') || content.includes('concern') || content.includes('risk')) {
      fears.push('failure');
      fearIntensity.failure = 0.7;
    }

    if (content.includes('waste') || content.includes('return')) {
      fears.push('wasted_resources');
      fearIntensity.wasted_resources = 0.6;
    }

    if (content.includes('wrong') || content.includes('mistake')) {
      fears.push('being_wrong');
      fearIntensity.being_wrong = 0.6;
    }

    if (content.includes('commit') || content.includes('lock')) {
      fears.push('commitment');
      fearIntensity.commitment = 0.5;
    }

    return {
      primaryFears: fears.slice(0, 3),
      fearIntensity,
      avoidanceBehaviors: [],
    };
  }

  private analyzeBeliefs(input: ProfileInput): BeliefProfile {
    return {
      worldview: 'pragmatic',
      marketBeliefs: [],
      selfBeliefs: [],
      limitingBeliefs: [],
      empoweringBeliefs: [],
    };
  }

  private analyzeIdentity(input: ProfileInput): SelfIdentity {
    const explicit = input.explicitData;
    const role = (explicit.role as string) || '';

    return {
      selfImage: [role],
      aspirationalIdentity: [],
      rejectIdentity: [],
      groupIdentities: [],
      statusLevel: 'established',
    };
  }

  private extractValues(input: ProfileInput): string[] {
    const content = input.interactions.map((i) => i.content || '').join(' ').toLowerCase();
    const values: string[] = [];

    if (content.includes('quality')) values.push('quality');
    if (content.includes('integrity') || content.includes('honest')) values.push('integrity');
    if (content.includes('innovation') || content.includes('creative')) values.push('innovation');
    if (content.includes('excellence')) values.push('excellence');
    if (content.includes('family') || content.includes('balance')) values.push('work_life_balance');

    return values;
  }

  private analyzeBehavior(input: ProfileInput): BehavioralProfile {
    const interactions = input.interactions;

    // Calculate engagement patterns
    const responseTimes = interactions
      .filter((i) => i.responseTime)
      .map((i) => i.responseTime!);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 24;

    const channels = interactions.map((i) => i.channel);
    const channelCounts = channels.reduce((acc, ch) => {
      acc[ch] = (acc[ch] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const preferredChannels = Object.entries(channelCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([ch]) => ch);

    return {
      engagementPatterns: {
        avgResponseTime,
        preferredChannels,
        engagementFrequency: interactions.length > 20 ? 'daily' : interactions.length > 5 ? 'weekly' : 'sporadic',
        depthOfEngagement: avgResponseTime < 60 ? 'deep' : 'moderate',
        initiationStyle: 'reactive',
      },
      purchaseBehavior: {
        decisionSpeed: avgResponseTime < 30 ? 'moderate' : 'deliberate',
        priceOrientation: 'quality',
        researchDepth: 'moderate',
        socialInfluence: 0.5,
        brandLoyalty: 0.5,
      },
      contentPreferences: {
        formatPreferences: ['email', 'video'],
        lengthPreference: 'moderate',
        tonePreference: 'conversational',
        proofPreference: 'data',
      },
      timePatterns: {
        activeHours: ['09:00', '14:00', '16:00'],
        activeDays: [1, 2, 3, 4, 5],
        timezone: 'UTC',
      },
    };
  }

  private analyzeCommunication(input: ProfileInput): CommunicationProfile {
    const interactions = input.interactions;
    const content = interactions.map((i) => i.content || '').join(' ');

    const avgLength = content.length / Math.max(interactions.length, 1);

    return {
      style: {
        directness: avgLength < 100 ? 0.8 : 0.5,
        formality: 0.5,
        emotionality: 0.4,
        detailOrientation: avgLength > 200 ? 0.7 : 0.4,
        assertiveness: 0.5,
      },
      preferences: {
        preferredChannel: 'email',
        preferredFrequency: 'weekly',
        preferredTime: '10:00',
        responseExpectation: 'same_day',
        meetingPreference: 'video',
      },
      language: {
        vocabulary: 'business',
        jargonLevel: 'light',
        persuasionTriggers: ['ROI', 'efficiency', 'results'],
        avoidTerms: [],
      },
    };
  }

  private analyzeDecisionPattern(input: ProfileInput): DecisionProfile {
    return {
      decisionStyle: {
        type: 'analytical',
        informationNeeds: 'comprehensive',
        comparisonBehavior: 'moderate',
        commitmentSpeed: 0.5,
      },
      stakeholderInfluence: {
        isPrimaryDecisionMaker: true,
        influenceLevel: 0.8,
        keyInfluencers: [],
      },
      timeline: {
        avgDecisionDays: 14,
        urgencyFactor: 0.5,
        deadlineResponsiveness: 0.7,
        procrastinationTendency: 0.3,
      },
      criteria: {
        primaryFactors: ['ROI', 'quality', 'support'],
        dealBreakers: [],
        niceToHaves: [],
        weightedCriteria: {},
      },
    };
  }

  private analyzeValuePerception(input: ProfileInput): ValueProfile {
    return {
      perceivedValue: {
        valueDrivers: ['time_savings', 'quality_improvement'],
        valueBlockers: [],
        roiExpectation: 3,
        qualityExpectation: 'premium',
      },
      pricesSensitivity: {
        sensitivity: 0.5,
        paymentPreference: 'subscription',
        negotiationLikelihood: 0.4,
      },
      investmentCapacity: {
        budgetAuthority: true,
        budgetFlexibility: 0.5,
      },
    };
  }

  private analyzeTrust(input: ProfileInput): TrustProfile {
    const interactions = input.interactions;
    const sentiments = interactions.filter((i) => i.sentiment !== undefined).map((i) => i.sentiment!);
    const avgSentiment = sentiments.length > 0
      ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
      : 0.5;

    return {
      trustLevel: avgSentiment,
      trustFactors: [
        { factor: 'expertise', importance: 0.8, currentStatus: 'partial' },
        { factor: 'reliability', importance: 0.9, currentStatus: 'unknown' },
        { factor: 'transparency', importance: 0.7, currentStatus: 'partial' },
      ],
      trustBarriers: [],
      trustBuilders: ['case_studies', 'testimonials', 'guarantees'],
      verificationNeeds: ['references', 'track_record'],
    };
  }

  private calculateConfidence(input: ProfileInput): ProfileConfidence {
    const dataPoints = input.interactions.length + input.behavioralSignals.length + Object.keys(input.explicitData).length;

    return {
      overall: Math.min(1, dataPoints / 50),
      bySection: {
        demographics: Object.keys(input.explicitData).length > 3 ? 0.8 : 0.4,
        psychographics: input.interactions.length > 10 ? 0.6 : 0.3,
        behavioral: input.behavioralSignals.length > 5 ? 0.7 : 0.4,
      },
      dataPoints,
      lastUpdated: new Date(),
      reliabilitySources: ['interactions', 'explicit_data'],
    };
  }

  getProfile(entityId: string): IdentityProfile | undefined {
    return this.profiles.get(entityId);
  }

  async updateProfile(entityId: string, newInput: Partial<ProfileInput>): Promise<IdentityProfile | undefined> {
    const existing = this.profiles.get(entityId);
    if (!existing) return undefined;

    // Merge and rebuild
    // This is simplified - real implementation would merge intelligently
    return existing;
  }

  getStats(): {
    totalProfiles: number;
    avgConfidence: number;
    profilesByType: Record<string, number>;
  } {
    const profiles = Array.from(this.profiles.values());
    const typeCount: Record<string, number> = {};

    profiles.forEach((p) => {
      typeCount[p.entityType] = (typeCount[p.entityType] || 0) + 1;
    });

    return {
      totalProfiles: profiles.length,
      avgConfidence: profiles.length > 0
        ? profiles.reduce((sum, p) => sum + p.confidence.overall, 0) / profiles.length
        : 0,
      profilesByType: typeCount,
    };
  }
}

export const identityProfileBuilder = new IdentityProfileBuilder();
export { IdentityProfileBuilder };
