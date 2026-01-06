/**
 * Objection Forensics
 * Deep analysis of objections to uncover true resistance and craft precise responses
 */

export interface ObjectionAnalysis {
  objectionId: string;
  surfaceObjection: string;
  trueObjection: TrueObjection;
  psychologicalRoot: PsychologicalRoot;
  responseStrategy: ResponseStrategy;
  counterarguments: Counterargument[];
  riskAssessment: ObjectionRisk;
  successProbability: number;
  analyzedAt: Date;
}

export interface TrueObjection {
  category: ObjectionCategory;
  subCategory: string;
  hiddenConcern: string;
  emotionalCore: string;
  beliefSystem: string;
  confidenceLevel: number;
}

export type ObjectionCategory =
  | 'price'
  | 'timing'
  | 'trust'
  | 'authority'
  | 'need'
  | 'urgency'
  | 'risk'
  | 'identity'
  | 'politics'
  | 'competition'
  | 'inertia'
  | 'fear';

export interface PsychologicalRoot {
  primaryDriver: PsychologicalDriver;
  secondaryDrivers: PsychologicalDriver[];
  cognitivePatterns: CognitivePattern[];
  emotionalState: EmotionalState;
  decisionStyle: DecisionStyle;
}

export type PsychologicalDriver =
  | 'loss_aversion'
  | 'status_protection'
  | 'identity_threat'
  | 'cognitive_overload'
  | 'social_proof_seeking'
  | 'authority_deference'
  | 'autonomy_protection'
  | 'uncertainty_avoidance'
  | 'regret_anticipation'
  | 'commitment_fear';

export interface CognitivePattern {
  pattern: string;
  strength: number;
  manifestation: string;
}

export interface EmotionalState {
  primary: string;
  intensity: number;
  stability: 'stable' | 'fluctuating' | 'volatile';
  triggers: string[];
}

export type DecisionStyle = 
  | 'analytical'
  | 'intuitive'
  | 'consensus'
  | 'authority'
  | 'risk_averse'
  | 'impulsive';

export interface ResponseStrategy {
  approach: ResponseApproach;
  tone: ResponseTone;
  structure: ResponseStructure;
  keyMessages: string[];
  proofElements: ProofElement[];
  closingTechnique: string;
  followUpPlan: FollowUpStep[];
}

export type ResponseApproach =
  | 'acknowledge_and_reframe'
  | 'isolate_and_address'
  | 'feel_felt_found'
  | 'question_and_discover'
  | 'social_proof_flood'
  | 'risk_reversal'
  | 'future_pacing'
  | 'contrast_framing'
  | 'authority_leverage'
  | 'scarcity_authentic';

export type ResponseTone =
  | 'empathetic'
  | 'confident'
  | 'curious'
  | 'authoritative'
  | 'collaborative'
  | 'challenging';

export interface ResponseStructure {
  opening: string;
  bridge: string;
  core: string;
  proof: string;
  close: string;
}

export interface ProofElement {
  type: 'testimonial' | 'case_study' | 'data' | 'demonstration' | 'guarantee' | 'authority';
  content: string;
  relevance: number;
  credibility: number;
}

export interface FollowUpStep {
  timing: string;
  action: string;
  condition: string;
}

export interface Counterargument {
  argument: string;
  strength: number;
  bestContext: string;
  potentialBackfire: string;
}

export interface ObjectionRisk {
  dealKiller: boolean;
  recoverable: boolean;
  escalationRisk: number;
  competitorVulnerability: number;
  recommendations: string[];
}

export interface ObjectionPattern {
  pattern: string;
  frequency: number;
  successfulResponses: string[];
  failedResponses: string[];
  contextFactors: string[];
}

export interface ObjectionHistory {
  leadId: string;
  objections: RecordedObjection[];
  patterns: ObjectionPattern[];
  resistanceProfile: ResistanceProfile;
}

export interface RecordedObjection {
  objection: string;
  context: string;
  response: string;
  outcome: 'overcome' | 'unresolved' | 'deal_lost';
  timestamp: Date;
}

export interface ResistanceProfile {
  overallResistance: number;
  primaryResistanceType: ObjectionCategory;
  persuasionSusceptibility: Record<ResponseApproach, number>;
  bestApproaches: ResponseApproach[];
  worstApproaches: ResponseApproach[];
}

export class ObjectionForensics {
  private objectionDatabase: Map<string, ObjectionPattern>;
  private responseLibrary: Map<ObjectionCategory, ResponseTemplate[]>;
  
  constructor() {
    this.objectionDatabase = new Map();
    this.responseLibrary = this.initializeResponseLibrary();
  }

  private initializeResponseLibrary(): Map<ObjectionCategory, ResponseTemplate[]> {
    const library = new Map<ObjectionCategory, ResponseTemplate[]>();

    library.set('price', [
      {
        approach: 'contrast_framing',
        template: 'Compare {offer_price} against {cost_of_problem} or {competitor_total_cost}',
        conditions: ['clear_roi', 'quantifiable_problem'],
        effectiveness: 0.75
      },
      {
        approach: 'risk_reversal',
        template: 'What if we {guarantee_type}? You only pay if {success_condition}',
        conditions: ['can_offer_guarantee', 'confident_in_delivery'],
        effectiveness: 0.80
      },
      {
        approach: 'acknowledge_and_reframe',
        template: 'I understand. Most successful clients felt the same initially. What changed was {reframe}',
        conditions: ['have_success_stories', 'similar_client_examples'],
        effectiveness: 0.70
      }
    ]);

    library.set('timing', [
      {
        approach: 'question_and_discover',
        template: 'What specifically needs to happen before {timing_trigger}?',
        conditions: ['vague_timing_objection'],
        effectiveness: 0.65
      },
      {
        approach: 'future_pacing',
        template: 'If we start {small_step} now, by {future_date} you would have {outcome}',
        conditions: ['can_start_small', 'clear_timeline'],
        effectiveness: 0.70
      }
    ]);

    library.set('trust', [
      {
        approach: 'social_proof_flood',
        template: 'Here are {number} clients in {similar_industry} who faced {similar_situation}',
        conditions: ['have_relevant_proof', 'permission_to_share'],
        effectiveness: 0.75
      },
      {
        approach: 'authority_leverage',
        template: '{authority_figure} chose to work with us because {reason}',
        conditions: ['have_authority_clients', 'can_name_drop'],
        effectiveness: 0.80
      }
    ]);

    library.set('risk', [
      {
        approach: 'risk_reversal',
        template: 'The only risk is {inaction_risk}. We eliminate yours with {guarantee}',
        conditions: ['can_quantify_inaction', 'have_guarantee'],
        effectiveness: 0.85
      },
      {
        approach: 'contrast_framing',
        template: 'Compare: {risk_of_action} vs {risk_of_inaction}',
        conditions: ['clear_contrast', 'honest_assessment'],
        effectiveness: 0.70
      }
    ]);

    library.set('need', [
      {
        approach: 'question_and_discover',
        template: 'When {problem_symptom} happens, what does that cost you?',
        conditions: ['can_surface_pain', 'has_symptoms'],
        effectiveness: 0.75
      },
      {
        approach: 'future_pacing',
        template: 'In 12 months without this solved, what does {situation} look like?',
        conditions: ['can_project_negative', 'logical_prospect'],
        effectiveness: 0.70
      }
    ]);

    return library;
  }

  async analyzeObjection(
    objection: string,
    context: ObjectionContext
  ): Promise<ObjectionAnalysis> {
    const surfaceAnalysis = this.parseSurfaceObjection(objection);
    const trueObjection = await this.uncoverTrueObjection(objection, context, surfaceAnalysis);
    const psychRoot = this.identifyPsychologicalRoot(trueObjection, context);
    const strategy = this.developResponseStrategy(trueObjection, psychRoot, context);
    const counterarguments = this.generateCounterarguments(trueObjection, context);
    const risk = this.assessObjectionRisk(trueObjection, context);
    const successProb = this.calculateSuccessProbability(trueObjection, strategy, context);

    return {
      objectionId: crypto.randomUUID(),
      surfaceObjection: objection,
      trueObjection,
      psychologicalRoot: psychRoot,
      responseStrategy: strategy,
      counterarguments,
      riskAssessment: risk,
      successProbability: successProb,
      analyzedAt: new Date()
    };
  }

  private parseSurfaceObjection(objection: string): SurfaceAnalysis {
    const keywords = this.extractKeywords(objection);
    const sentiment = this.analyzeSentiment(objection);
    const intensity = this.measureIntensity(objection);

    return {
      keywords,
      sentiment,
      intensity,
      category: this.categorizeFromKeywords(keywords)
    };
  }

  private extractKeywords(text: string): string[] {
    const priceKeywords = ['expensive', 'cost', 'price', 'budget', 'afford', 'investment', 'money'];
    const timingKeywords = ['now', 'later', 'busy', 'timing', 'ready', 'wait', 'soon'];
    const trustKeywords = ['trust', 'guarantee', 'proof', 'results', 'sure', 'believe'];
    const riskKeywords = ['risk', 'safe', 'certain', 'worried', 'concern', 'afraid'];
    
    const allKeywords = [...priceKeywords, ...timingKeywords, ...trustKeywords, ...riskKeywords];
    const textLower = text.toLowerCase();
    
    return allKeywords.filter(kw => textLower.includes(kw));
  }

  private analyzeSentiment(text: string): number {
    const negativeWords = ['not', 'no', 'never', 'cant', "can't", 'wont', "won't", 'dont', "don't"];
    const textLower = text.toLowerCase();
    const negativeCount = negativeWords.filter(w => textLower.includes(w)).length;
    return Math.max(-1, 0 - negativeCount * 0.2);
  }

  private measureIntensity(text: string): number {
    const intensifiers = ['very', 'really', 'absolutely', 'definitely', 'certainly', 'extremely'];
    const textLower = text.toLowerCase();
    const intensifierCount = intensifiers.filter(w => textLower.includes(w)).length;
    return Math.min(1, 0.5 + intensifierCount * 0.15);
  }

  private categorizeFromKeywords(keywords: string[]): ObjectionCategory {
    const categoryScores: Record<ObjectionCategory, number> = {
      price: 0, timing: 0, trust: 0, authority: 0, need: 0,
      urgency: 0, risk: 0, identity: 0, politics: 0, competition: 0,
      inertia: 0, fear: 0
    };

    const mapping: Record<string, ObjectionCategory> = {
      'expensive': 'price', 'cost': 'price', 'price': 'price', 'budget': 'price', 'afford': 'price',
      'now': 'timing', 'later': 'timing', 'busy': 'timing', 'timing': 'timing', 'ready': 'timing',
      'trust': 'trust', 'guarantee': 'trust', 'proof': 'trust', 'results': 'trust',
      'risk': 'risk', 'safe': 'risk', 'worried': 'risk', 'concern': 'risk', 'afraid': 'fear'
    };

    for (const keyword of keywords) {
      const category = mapping[keyword];
      if (category) {
        categoryScores[category]++;
      }
    }

    return Object.entries(categoryScores)
      .sort((a, b) => b[1] - a[1])[0][0] as ObjectionCategory;
  }

  private async uncoverTrueObjection(
    objection: string,
    context: ObjectionContext,
    surface: SurfaceAnalysis
  ): Promise<TrueObjection> {
    const hiddenConcern = this.inferHiddenConcern(surface, context);
    const emotionalCore = this.identifyEmotionalCore(surface, context);
    const beliefSystem = this.mapBeliefSystem(surface, context);

    return {
      category: surface.category,
      subCategory: this.determineSubCategory(surface.category, objection),
      hiddenConcern,
      emotionalCore,
      beliefSystem,
      confidenceLevel: this.calculateConfidence(surface, context)
    };
  }

  private inferHiddenConcern(surface: SurfaceAnalysis, context: ObjectionContext): string {
    const concerns: Record<ObjectionCategory, string[]> = {
      price: [
        'Fear of not getting value',
        'Lack of budget authority',
        'Comparison with cheaper alternatives',
        'Past bad investment experiences'
      ],
      timing: [
        'Not convinced of urgency',
        'Avoiding commitment',
        'Waiting for external validation',
        'Fear of making wrong decision'
      ],
      trust: [
        'Past negative experiences',
        'Skepticism from industry reputation',
        'Need for more proof',
        'Fear of being sold to'
      ],
      risk: [
        'Career risk if decision fails',
        'Financial exposure concerns',
        'Implementation failure fears',
        'Reputation protection'
      ],
      need: [
        'Not feeling the pain acutely',
        'Underestimating problem severity',
        'Existing workaround satisfaction',
        'Denial of problem existence'
      ],
      authority: [
        'Need approval from others',
        'Fear of stepping out of bounds',
        'Political sensitivities',
        'Committee decision dynamics'
      ],
      urgency: [
        'Other priorities dominating',
        'Crisis fatigue',
        'Long planning horizons',
        'Bureaucratic constraints'
      ],
      identity: [
        'Offer conflicts with self-image',
        'Cultural or value misalignment',
        'Brand association concerns',
        'Peer group judgment fears'
      ],
      politics: [
        'Internal stakeholder conflicts',
        'Territorial concerns',
        'Change resistance from teams',
        'Power dynamics at play'
      ],
      competition: [
        'Actively evaluating alternatives',
        'Existing vendor relationships',
        'Switching cost concerns',
        'Loyalty to current provider'
      ],
      inertia: [
        'Comfort with status quo',
        'Change fatigue',
        'Effort aversion',
        'Success with current approach'
      ],
      fear: [
        'General anxiety about change',
        'Fear of unknown outcomes',
        'Past failure trauma',
        'Overwhelm with options'
      ]
    };

    const categoryConcerns = concerns[surface.category] || concerns.fear;
    return categoryConcerns[Math.floor(Math.random() * categoryConcerns.length)];
  }

  private identifyEmotionalCore(surface: SurfaceAnalysis, context: ObjectionContext): string {
    const emotionalCores: Record<ObjectionCategory, string[]> = {
      price: ['anxiety about money', 'fear of waste', 'status concern'],
      timing: ['overwhelm', 'avoidance', 'uncertainty'],
      trust: ['skepticism', 'self-protection', 'past hurt'],
      risk: ['fear', 'self-preservation', 'career anxiety'],
      need: ['denial', 'complacency', 'blindness'],
      authority: ['powerlessness', 'political fear', 'exposure'],
      urgency: ['fatigue', 'priority conflict', 'indifference'],
      identity: ['dissonance', 'judgment fear', 'belonging'],
      politics: ['conflict avoidance', 'territory', 'power'],
      competition: ['loyalty conflict', 'switching fear', 'comparison'],
      inertia: ['comfort', 'laziness', 'resistance'],
      fear: ['anxiety', 'uncertainty', 'paralysis']
    };

    const cores = emotionalCores[surface.category] || ['uncertainty'];
    return cores[0];
  }

  private mapBeliefSystem(surface: SurfaceAnalysis, context: ObjectionContext): string {
    const beliefs: Record<ObjectionCategory, string> = {
      price: 'Lower price equals better value',
      timing: 'The right time will present itself',
      trust: 'Most people are trying to take advantage',
      risk: 'It is better to avoid risk than seek reward',
      need: 'If it is not broken, do not fix it',
      authority: 'Decisions should be made by consensus',
      urgency: 'There is always tomorrow',
      identity: 'I must be consistent with my image',
      politics: 'Internal harmony trumps external opportunity',
      competition: 'Better the devil you know',
      inertia: 'Change is harder than staying the same',
      fear: 'The unknown is dangerous'
    };

    return beliefs[surface.category] || 'Change carries risk';
  }

  private determineSubCategory(category: ObjectionCategory, objection: string): string {
    const subCategories: Record<ObjectionCategory, string[]> = {
      price: ['sticker_shock', 'budget_limit', 'roi_unclear', 'comparison'],
      timing: ['not_now', 'need_approval', 'other_priorities', 'waiting_for'],
      trust: ['need_proof', 'skeptical', 'past_experience', 'reputation'],
      risk: ['implementation', 'financial', 'career', 'operational'],
      need: ['not_priority', 'have_solution', 'problem_unclear', 'denial'],
      authority: ['need_boss', 'committee', 'stakeholders', 'politics'],
      urgency: ['no_deadline', 'other_fires', 'later_priority', 'no_pressure'],
      identity: ['not_for_me', 'different_approach', 'values', 'image'],
      politics: ['internal_conflict', 'territory', 'change_resistance', 'power'],
      competition: ['evaluating', 'existing_vendor', 'switching_cost', 'loyalty'],
      inertia: ['comfortable', 'working_fine', 'effort', 'change_tired'],
      fear: ['unknown', 'failure', 'judgment', 'commitment']
    };

    return subCategories[category]?.[0] || 'general';
  }

  private calculateConfidence(surface: SurfaceAnalysis, context: ObjectionContext): number {
    let confidence = 0.5;
    
    if (surface.keywords.length > 2) confidence += 0.1;
    if (surface.intensity > 0.7) confidence += 0.1;
    if (context.previousObjections && context.previousObjections.length > 0) confidence += 0.1;
    
    return Math.min(0.95, confidence);
  }

  private identifyPsychologicalRoot(
    trueObjection: TrueObjection,
    context: ObjectionContext
  ): PsychologicalRoot {
    const driverMap: Record<ObjectionCategory, PsychologicalDriver> = {
      price: 'loss_aversion',
      timing: 'uncertainty_avoidance',
      trust: 'social_proof_seeking',
      risk: 'regret_anticipation',
      need: 'cognitive_overload',
      authority: 'authority_deference',
      urgency: 'uncertainty_avoidance',
      identity: 'identity_threat',
      politics: 'status_protection',
      competition: 'commitment_fear',
      inertia: 'autonomy_protection',
      fear: 'loss_aversion'
    };

    return {
      primaryDriver: driverMap[trueObjection.category],
      secondaryDrivers: [driverMap[trueObjection.category]],
      cognitivePatterns: [
        {
          pattern: 'confirmation_bias',
          strength: 0.7,
          manifestation: 'Seeking information that confirms their objection'
        }
      ],
      emotionalState: {
        primary: trueObjection.emotionalCore,
        intensity: 0.6,
        stability: 'stable',
        triggers: [trueObjection.hiddenConcern]
      },
      decisionStyle: this.inferDecisionStyle(context)
    };
  }

  private inferDecisionStyle(context: ObjectionContext): DecisionStyle {
    if (context.buyerType === 'analytical') return 'analytical';
    if (context.buyerType === 'driver') return 'authority';
    if (context.buyerType === 'expressive') return 'intuitive';
    return 'consensus';
  }

  private developResponseStrategy(
    trueObjection: TrueObjection,
    psychRoot: PsychologicalRoot,
    context: ObjectionContext
  ): ResponseStrategy {
    const templates = this.responseLibrary.get(trueObjection.category) || [];
    const bestTemplate = templates.sort((a, b) => b.effectiveness - a.effectiveness)[0];

    const approach = bestTemplate?.approach || 'acknowledge_and_reframe';
    const tone = this.selectTone(psychRoot);
    
    return {
      approach,
      tone,
      structure: this.buildResponseStructure(approach, trueObjection, context),
      keyMessages: this.generateKeyMessages(trueObjection, context),
      proofElements: this.selectProofElements(trueObjection, context),
      closingTechnique: this.selectClosingTechnique(trueObjection, psychRoot),
      followUpPlan: this.createFollowUpPlan(trueObjection)
    };
  }

  private selectTone(psychRoot: PsychologicalRoot): ResponseTone {
    const toneMap: Record<PsychologicalDriver, ResponseTone> = {
      loss_aversion: 'empathetic',
      status_protection: 'authoritative',
      identity_threat: 'collaborative',
      cognitive_overload: 'confident',
      social_proof_seeking: 'confident',
      authority_deference: 'authoritative',
      autonomy_protection: 'curious',
      uncertainty_avoidance: 'empathetic',
      regret_anticipation: 'confident',
      commitment_fear: 'empathetic'
    };

    return toneMap[psychRoot.primaryDriver] || 'empathetic';
  }

  private buildResponseStructure(
    approach: ResponseApproach,
    trueObjection: TrueObjection,
    context: ObjectionContext
  ): ResponseStructure {
    return {
      opening: `Acknowledge: "${trueObjection.hiddenConcern}"`,
      bridge: 'Create connection between concern and solution',
      core: `Address with ${approach} technique`,
      proof: 'Insert relevant proof element',
      close: 'Micro-commitment or next step'
    };
  }

  private generateKeyMessages(trueObjection: TrueObjection, context: ObjectionContext): string[] {
    const messages: string[] = [];

    messages.push(`Validate: "${trueObjection.emotionalCore}" is understandable`);
    messages.push(`Reframe: The real question is "${trueObjection.beliefSystem}" - let's examine that`);
    messages.push('Proof: Here is what others in your situation discovered');
    messages.push('Path: Here is how we can address this together');

    return messages;
  }

  private selectProofElements(
    trueObjection: TrueObjection,
    context: ObjectionContext
  ): ProofElement[] {
    const proofTypes: Record<ObjectionCategory, ProofElement['type'][]> = {
      price: ['case_study', 'data'],
      timing: ['testimonial', 'case_study'],
      trust: ['testimonial', 'guarantee', 'authority'],
      risk: ['guarantee', 'data', 'demonstration'],
      need: ['data', 'case_study'],
      authority: ['authority', 'testimonial'],
      urgency: ['data', 'case_study'],
      identity: ['testimonial', 'authority'],
      politics: ['case_study', 'authority'],
      competition: ['data', 'demonstration'],
      inertia: ['case_study', 'testimonial'],
      fear: ['guarantee', 'testimonial']
    };

    const types = proofTypes[trueObjection.category] || ['testimonial'];
    
    return types.map(type => ({
      type,
      content: `[${type} content for ${trueObjection.category}]`,
      relevance: 0.8,
      credibility: 0.9
    }));
  }

  private selectClosingTechnique(
    trueObjection: TrueObjection,
    psychRoot: PsychologicalRoot
  ): string {
    const techniques: Record<ObjectionCategory, string> = {
      price: 'ROI question close',
      timing: 'Small step commitment',
      trust: 'Risk reversal offer',
      risk: 'Guarantee presentation',
      need: 'Cost of inaction question',
      authority: 'Champion creation',
      urgency: 'Deadline introduction',
      identity: 'Values alignment summary',
      politics: 'Stakeholder mapping offer',
      competition: 'Comparison invitation',
      inertia: 'Easy first step',
      fear: 'Safety confirmation'
    };

    return techniques[trueObjection.category] || 'Assumptive next step';
  }

  private createFollowUpPlan(trueObjection: TrueObjection): FollowUpStep[] {
    return [
      {
        timing: '24 hours',
        action: 'Send relevant proof element via email',
        condition: 'If no immediate resolution'
      },
      {
        timing: '48 hours',
        action: 'Follow up call to address remaining concerns',
        condition: 'If email not responded'
      },
      {
        timing: '1 week',
        action: 'Share new case study or testimonial',
        condition: 'If still in consideration'
      }
    ];
  }

  private generateCounterarguments(
    trueObjection: TrueObjection,
    context: ObjectionContext
  ): Counterargument[] {
    const counterMap: Record<ObjectionCategory, Counterargument[]> = {
      price: [
        {
          argument: 'The cost of not solving this problem exceeds the investment',
          strength: 0.85,
          bestContext: 'When problem cost is quantifiable',
          potentialBackfire: 'Can feel pushy if overused'
        },
        {
          argument: 'Clients typically see ROI within X months',
          strength: 0.80,
          bestContext: 'When have proven ROI data',
          potentialBackfire: 'Requires proof to back up'
        }
      ],
      timing: [
        {
          argument: 'The best time was yesterday, the second best is today',
          strength: 0.70,
          bestContext: 'When urgency is real',
          potentialBackfire: 'Can feel cliché'
        }
      ],
      trust: [
        {
          argument: 'Here are X clients who felt the same way initially',
          strength: 0.85,
          bestContext: 'When have relevant testimonials',
          potentialBackfire: 'Requires genuine examples'
        }
      ],
      risk: [
        {
          argument: 'We guarantee results with our X policy',
          strength: 0.90,
          bestContext: 'When can offer genuine guarantee',
          potentialBackfire: 'Must be able to honor it'
        }
      ],
      need: [
        {
          argument: 'What would change if this problem were solved?',
          strength: 0.75,
          bestContext: 'To surface hidden desire',
          potentialBackfire: 'Can seem assumptive'
        }
      ],
      authority: [
        {
          argument: 'Would it help if we spoke with your team together?',
          strength: 0.80,
          bestContext: 'When multiple stakeholders involved',
          potentialBackfire: 'Can bypass the contact'
        }
      ],
      urgency: [
        {
          argument: 'Every month of delay costs approximately X',
          strength: 0.75,
          bestContext: 'When delay cost is measurable',
          potentialBackfire: 'Requires accurate data'
        }
      ],
      identity: [
        {
          argument: 'This approach aligns with your stated values of X',
          strength: 0.70,
          bestContext: 'When know their values',
          potentialBackfire: 'Must accurately know their identity'
        }
      ],
      politics: [
        {
          argument: 'How can we make this a win for all stakeholders?',
          strength: 0.75,
          bestContext: 'When internal politics at play',
          potentialBackfire: 'Can surface more objections'
        }
      ],
      competition: [
        {
          argument: 'Unlike X, we specifically focus on Y',
          strength: 0.80,
          bestContext: 'When have clear differentiators',
          potentialBackfire: 'Can seem defensive'
        }
      ],
      inertia: [
        {
          argument: 'What if we started with just one small piece?',
          strength: 0.85,
          bestContext: 'When full commitment feels big',
          potentialBackfire: 'May reduce deal size'
        }
      ],
      fear: [
        {
          argument: 'Your concern is valid. Here is how we protect you',
          strength: 0.80,
          bestContext: 'When can offer real protection',
          potentialBackfire: 'Must have actual safeguards'
        }
      ]
    };

    return counterMap[trueObjection.category] || [];
  }

  private assessObjectionRisk(
    trueObjection: TrueObjection,
    context: ObjectionContext
  ): ObjectionRisk {
    const dealKillers: ObjectionCategory[] = ['identity', 'politics', 'authority'];
    const isDealKiller = dealKillers.includes(trueObjection.category) && 
                         trueObjection.confidenceLevel > 0.8;

    return {
      dealKiller: isDealKiller,
      recoverable: !isDealKiller && trueObjection.confidenceLevel < 0.9,
      escalationRisk: trueObjection.category === 'politics' ? 0.8 : 0.3,
      competitorVulnerability: trueObjection.category === 'competition' ? 0.9 : 0.4,
      recommendations: this.generateRiskRecommendations(trueObjection)
    };
  }

  private generateRiskRecommendations(trueObjection: TrueObjection): string[] {
    const recommendations: string[] = [];

    if (trueObjection.category === 'identity') {
      recommendations.push('Consider if this is the right fit before pushing');
    }
    if (trueObjection.category === 'politics') {
      recommendations.push('Map all stakeholders before next engagement');
    }
    if (trueObjection.category === 'trust') {
      recommendations.push('Lead with proof in all future communications');
    }

    recommendations.push('Document this objection for pattern analysis');
    
    return recommendations;
  }

  private calculateSuccessProbability(
    trueObjection: TrueObjection,
    strategy: ResponseStrategy,
    context: ObjectionContext
  ): number {
    const baseProbability: Record<ObjectionCategory, number> = {
      price: 0.65,
      timing: 0.70,
      trust: 0.55,
      risk: 0.60,
      need: 0.50,
      authority: 0.45,
      urgency: 0.65,
      identity: 0.35,
      politics: 0.40,
      competition: 0.55,
      inertia: 0.60,
      fear: 0.55
    };

    let probability = baseProbability[trueObjection.category] || 0.5;

    // Adjust for proof strength
    const avgProofCredibility = strategy.proofElements.reduce((sum, p) => sum + p.credibility, 0) / 
                                 (strategy.proofElements.length || 1);
    probability += avgProofCredibility * 0.1;

    // Adjust for objection confidence (higher confidence = harder to overcome)
    probability -= trueObjection.confidenceLevel * 0.1;

    return Math.max(0.1, Math.min(0.95, probability));
  }

  async buildResistanceProfile(history: ObjectionHistory): Promise<ResistanceProfile> {
    const objectionCounts: Record<ObjectionCategory, number> = {} as Record<ObjectionCategory, number>;
    const outcomesByApproach: Record<ResponseApproach, { success: number; total: number }> = {} as any;

    for (const obj of history.objections) {
      const analysis = await this.analyzeObjection(obj.objection, { 
        buyerType: 'unknown',
        industry: 'general',
        dealSize: 'medium'
      });
      
      objectionCounts[analysis.trueObjection.category] = 
        (objectionCounts[analysis.trueObjection.category] || 0) + 1;

      const approach = analysis.responseStrategy.approach;
      if (!outcomesByApproach[approach]) {
        outcomesByApproach[approach] = { success: 0, total: 0 };
      }
      outcomesByApproach[approach].total++;
      if (obj.outcome === 'overcome') {
        outcomesByApproach[approach].success++;
      }
    }

    const primaryType = Object.entries(objectionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as ObjectionCategory || 'unknown' as ObjectionCategory;

    const susceptibility: Record<ResponseApproach, number> = {} as Record<ResponseApproach, number>;
    for (const [approach, stats] of Object.entries(outcomesByApproach)) {
      susceptibility[approach as ResponseApproach] = stats.total > 0 ? stats.success / stats.total : 0.5;
    }

    const sortedApproaches = Object.entries(susceptibility)
      .sort((a, b) => b[1] - a[1]);

    return {
      overallResistance: 1 - (history.objections.filter(o => o.outcome === 'overcome').length / 
                              (history.objections.length || 1)),
      primaryResistanceType: primaryType,
      persuasionSusceptibility: susceptibility,
      bestApproaches: sortedApproaches.slice(0, 3).map(([a]) => a as ResponseApproach),
      worstApproaches: sortedApproaches.slice(-3).map(([a]) => a as ResponseApproach)
    };
  }
}

interface SurfaceAnalysis {
  keywords: string[];
  sentiment: number;
  intensity: number;
  category: ObjectionCategory;
}

interface ObjectionContext {
  buyerType: string;
  industry: string;
  dealSize: string;
  previousObjections?: string[];
}

interface ResponseTemplate {
  approach: ResponseApproach;
  template: string;
  conditions: string[];
  effectiveness: number;
}
