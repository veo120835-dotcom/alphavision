/**
 * Business Diagnostician
 * Board-level strategic diagnosis and advisory
 */

export interface BusinessDiagnosis {
  id: string;
  timestamp: Date;
  businessContext: BusinessContext;
  symptoms: Symptom[];
  rootCauses: RootCause[];
  diagnosis: Diagnosis;
  prognosis: Prognosis;
  recommendations: StrategicRecommendation[];
  doNotDo: string[];
  confidence: DiagnosisConfidence;
}

export interface BusinessContext {
  industry: string;
  businessModel: string;
  stage: BusinessStage;
  revenue?: number;
  growthRate?: number;
  teamSize?: number;
  runway?: number;
  marketPosition: MarketPosition;
  competitiveIntensity: number;
}

export type BusinessStage =
  | 'pre_revenue'
  | 'early_revenue'
  | 'growth'
  | 'scale'
  | 'mature'
  | 'decline'
  | 'turnaround';

export type MarketPosition =
  | 'leader'
  | 'challenger'
  | 'niche'
  | 'follower'
  | 'new_entrant';

export interface Symptom {
  id: string;
  description: string;
  severity: number;
  duration: string;
  trend: 'improving' | 'stable' | 'worsening';
  category: SymptomCategory;
  evidence: string[];
}

export type SymptomCategory =
  | 'revenue'
  | 'growth'
  | 'profitability'
  | 'retention'
  | 'acquisition'
  | 'operations'
  | 'team'
  | 'product'
  | 'market'
  | 'competitive';

export interface RootCause {
  id: string;
  description: string;
  category: RootCauseCategory;
  confidence: number;
  linkedSymptoms: string[];
  cascadeEffects: string[];
  fixability: 'quick_fix' | 'medium_effort' | 'strategic_overhaul' | 'unfixable';
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export type RootCauseCategory =
  | 'strategy'
  | 'execution'
  | 'market_fit'
  | 'pricing'
  | 'positioning'
  | 'operations'
  | 'talent'
  | 'capital'
  | 'technology'
  | 'leadership'
  | 'culture'
  | 'external';

export interface Diagnosis {
  primaryCondition: string;
  secondaryConditions: string[];
  systemicIssues: string[];
  healthScore: number;
  criticalRisks: CriticalRisk[];
  hiddenStrengths: string[];
}

export interface CriticalRisk {
  risk: string;
  probability: number;
  impact: number;
  timeframe: string;
  mitigation: string;
}

export interface Prognosis {
  currentTrajectory: TrajectoryScenario;
  withIntervention: TrajectoryScenario;
  bestCase: TrajectoryScenario;
  worstCase: TrajectoryScenario;
  keyUncertainties: string[];
}

export interface TrajectoryScenario {
  name: string;
  probability: number;
  timeframe: string;
  outcome: string;
  keyAssumptions: string[];
  metrics: Record<string, number>;
}

export interface StrategicRecommendation {
  id: string;
  priority: number;
  title: string;
  description: string;
  rationale: string;
  impact: ImpactAssessment;
  implementation: Implementation;
  risks: string[];
  dependencies: string[];
  alternatives: string[];
}

export interface ImpactAssessment {
  revenueImpact: number;
  timeToImpact: string;
  confidence: number;
  secondOrderEffects: string[];
}

export interface Implementation {
  difficulty: 'easy' | 'moderate' | 'hard' | 'very_hard';
  timeRequired: string;
  resourcesRequired: string[];
  keyMilestones: string[];
  firstStep: string;
}

export interface DiagnosisConfidence {
  overall: number;
  dataQuality: number;
  analysisDepth: number;
  assumptionRisk: number;
  uncertainties: string[];
}

export interface DiagnosticInput {
  businessContext: BusinessContext;
  reportedSymptoms: string[];
  metrics: Record<string, number>;
  qualitativeData: Record<string, unknown>;
  constraints: string[];
  goals: string[];
}

class BusinessDiagnostician {
  private diagnoses: Map<string, BusinessDiagnosis> = new Map();

  generateId(): string {
    return `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async diagnose(input: DiagnosticInput): Promise<BusinessDiagnosis> {
    const symptoms = this.identifySymptoms(input);
    const rootCauses = this.identifyRootCauses(symptoms, input);
    const diagnosis = this.formDiagnosis(symptoms, rootCauses, input);
    const prognosis = this.projectPrognosis(diagnosis, input);
    const recommendations = this.generateRecommendations(diagnosis, rootCauses, input);
    const doNotDo = this.identifyAntiPatterns(diagnosis, input);
    const confidence = this.assessConfidence(input, symptoms, rootCauses);

    const result: BusinessDiagnosis = {
      id: this.generateId(),
      timestamp: new Date(),
      businessContext: input.businessContext,
      symptoms,
      rootCauses,
      diagnosis,
      prognosis,
      recommendations,
      doNotDo,
      confidence,
    };

    this.diagnoses.set(result.id, result);
    return result;
  }

  private identifySymptoms(input: DiagnosticInput): Symptom[] {
    const symptoms: Symptom[] = [];
    const metrics = input.metrics;
    const context = input.businessContext;

    // Revenue symptoms
    if (metrics.revenueGrowth !== undefined && metrics.revenueGrowth < 0) {
      symptoms.push({
        id: 'rev_decline',
        description: 'Revenue is declining',
        severity: Math.min(1, Math.abs(metrics.revenueGrowth) / 50),
        duration: 'ongoing',
        trend: 'worsening',
        category: 'revenue',
        evidence: [`Revenue growth: ${metrics.revenueGrowth}%`],
      });
    }

    // Retention symptoms
    if (metrics.churnRate !== undefined && metrics.churnRate > 5) {
      symptoms.push({
        id: 'high_churn',
        description: 'Customer churn is elevated',
        severity: Math.min(1, metrics.churnRate / 20),
        duration: 'ongoing',
        trend: 'stable',
        category: 'retention',
        evidence: [`Monthly churn: ${metrics.churnRate}%`],
      });
    }

    // Acquisition symptoms
    if (metrics.cac !== undefined && metrics.ltv !== undefined) {
      const ltvCacRatio = metrics.ltv / metrics.cac;
      if (ltvCacRatio < 3) {
        symptoms.push({
          id: 'poor_unit_economics',
          description: 'Unit economics are unhealthy',
          severity: ltvCacRatio < 1 ? 1 : (3 - ltvCacRatio) / 3,
          duration: 'ongoing',
          trend: 'stable',
          category: 'acquisition',
          evidence: [`LTV:CAC ratio: ${ltvCacRatio.toFixed(1)}`],
        });
      }
    }

    // Growth symptoms
    if (context.growthRate !== undefined && context.stage === 'growth' && context.growthRate < 20) {
      symptoms.push({
        id: 'slow_growth',
        description: 'Growth rate below stage expectations',
        severity: 0.7,
        duration: 'ongoing',
        trend: 'stable',
        category: 'growth',
        evidence: [`Growth rate: ${context.growthRate}% (expected >20% for growth stage)`],
      });
    }

    // Add reported symptoms
    input.reportedSymptoms.forEach((symptom, idx) => {
      symptoms.push({
        id: `reported_${idx}`,
        description: symptom,
        severity: 0.5,
        duration: 'unknown',
        trend: 'stable',
        category: 'operations',
        evidence: ['Self-reported'],
      });
    });

    return symptoms;
  }

  private identifyRootCauses(symptoms: Symptom[], input: DiagnosticInput): RootCause[] {
    const rootCauses: RootCause[] = [];
    const symptomCategories = new Set(symptoms.map((s) => s.category));

    // Pattern: Multiple revenue/growth symptoms -> market fit issue
    if (symptomCategories.has('revenue') && symptomCategories.has('retention')) {
      rootCauses.push({
        id: 'market_fit_gap',
        description: 'Product-market fit may be weakening or incomplete',
        category: 'market_fit',
        confidence: 0.7,
        linkedSymptoms: symptoms.filter((s) => ['revenue', 'retention'].includes(s.category)).map((s) => s.id),
        cascadeEffects: ['Increasing CAC', 'Declining referrals', 'Sales cycle lengthening'],
        fixability: 'strategic_overhaul',
        urgency: 'critical',
      });
    }

    // Pattern: High churn alone -> value delivery issue
    if (symptomCategories.has('retention') && !symptomCategories.has('acquisition')) {
      rootCauses.push({
        id: 'value_delivery_gap',
        description: 'Value delivery or customer success needs improvement',
        category: 'operations',
        confidence: 0.75,
        linkedSymptoms: symptoms.filter((s) => s.category === 'retention').map((s) => s.id),
        cascadeEffects: ['Negative word of mouth', 'Declining NPS'],
        fixability: 'medium_effort',
        urgency: 'high',
      });
    }

    // Pattern: Poor unit economics -> pricing or positioning issue
    if (symptoms.some((s) => s.id === 'poor_unit_economics')) {
      rootCauses.push({
        id: 'pricing_misalignment',
        description: 'Pricing may not reflect value delivered or market position',
        category: 'pricing',
        confidence: 0.65,
        linkedSymptoms: ['poor_unit_economics'],
        cascadeEffects: ['Constrained marketing budget', 'Unable to invest in growth'],
        fixability: 'medium_effort',
        urgency: 'high',
      });
    }

    // Pattern: Slow growth in growth stage -> execution or market issue
    if (symptoms.some((s) => s.id === 'slow_growth')) {
      rootCauses.push({
        id: 'execution_bottleneck',
        description: 'Growth execution may be constrained by process or talent',
        category: 'execution',
        confidence: 0.6,
        linkedSymptoms: ['slow_growth'],
        cascadeEffects: ['Competitor gains', 'Investor concerns'],
        fixability: 'medium_effort',
        urgency: 'medium',
      });
    }

    return rootCauses;
  }

  private formDiagnosis(
    symptoms: Symptom[],
    rootCauses: RootCause[],
    input: DiagnosticInput
  ): Diagnosis {
    const criticalCauses = rootCauses.filter((c) => c.urgency === 'critical');
    const avgSeverity = symptoms.length > 0
      ? symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length
      : 0;

    const healthScore = Math.max(0, 1 - avgSeverity);

    let primaryCondition = 'Business operating normally';
    if (criticalCauses.length > 0) {
      primaryCondition = criticalCauses[0].description;
    } else if (rootCauses.length > 0) {
      primaryCondition = rootCauses[0].description;
    }

    const systemicIssues: string[] = [];
    if (rootCauses.length > 3) {
      systemicIssues.push('Multiple interconnected issues suggest systemic challenges');
    }
    if (symptoms.some((s) => s.trend === 'worsening')) {
      systemicIssues.push('Deteriorating trends require immediate attention');
    }

    const criticalRisks: CriticalRisk[] = [];
    if (input.businessContext.runway !== undefined && input.businessContext.runway < 6) {
      criticalRisks.push({
        risk: 'Cash runway below 6 months',
        probability: 0.9,
        impact: 1,
        timeframe: `${input.businessContext.runway} months`,
        mitigation: 'Immediate focus on revenue acceleration or funding',
      });
    }

    // Identify hidden strengths
    const hiddenStrengths: string[] = [];
    if (input.metrics.nps !== undefined && input.metrics.nps > 50) {
      hiddenStrengths.push('Strong customer satisfaction (NPS > 50)');
    }
    if (input.metrics.retentionRate !== undefined && input.metrics.retentionRate > 90) {
      hiddenStrengths.push('Excellent customer retention');
    }

    return {
      primaryCondition,
      secondaryConditions: rootCauses.slice(1, 3).map((c) => c.description),
      systemicIssues,
      healthScore,
      criticalRisks,
      hiddenStrengths,
    };
  }

  private projectPrognosis(diagnosis: Diagnosis, input: DiagnosticInput): Prognosis {
    const currentGrowth = input.businessContext.growthRate || 0;

    return {
      currentTrajectory: {
        name: 'Status Quo',
        probability: 0.6,
        timeframe: '12 months',
        outcome: currentGrowth > 0 ? 'Continued modest growth with persistent challenges' : 'Gradual decline without intervention',
        keyAssumptions: ['No major changes', 'Market conditions stable'],
        metrics: { revenueGrowth: currentGrowth * 0.8, churnChange: 0 },
      },
      withIntervention: {
        name: 'With Recommended Actions',
        probability: 0.5,
        timeframe: '12 months',
        outcome: 'Significant improvement in key metrics',
        keyAssumptions: ['Recommendations implemented', 'Adequate resources allocated'],
        metrics: { revenueGrowth: Math.max(currentGrowth * 1.5, 20), churnChange: -20 },
      },
      bestCase: {
        name: 'Optimistic Scenario',
        probability: 0.2,
        timeframe: '12 months',
        outcome: 'Breakthrough growth and market position improvement',
        keyAssumptions: ['Perfect execution', 'Favorable market conditions', 'Key hires successful'],
        metrics: { revenueGrowth: Math.max(currentGrowth * 2, 50), churnChange: -40 },
      },
      worstCase: {
        name: 'Pessimistic Scenario',
        probability: 0.2,
        timeframe: '12 months',
        outcome: 'Continued decline requiring pivot or wind-down',
        keyAssumptions: ['No changes made', 'Market conditions worsen', 'Key talent leaves'],
        metrics: { revenueGrowth: Math.min(currentGrowth - 20, -30), churnChange: 30 },
      },
      keyUncertainties: [
        'Market response to changes',
        'Execution capability',
        'Competitive reactions',
        'Economic conditions',
      ],
    };
  }

  private generateRecommendations(
    diagnosis: Diagnosis,
    rootCauses: RootCause[],
    input: DiagnosticInput
  ): StrategicRecommendation[] {
    const recommendations: StrategicRecommendation[] = [];

    // Generate recommendations based on root causes
    rootCauses.forEach((cause, idx) => {
      const recommendation = this.createRecommendationForCause(cause, input, idx + 1);
      recommendations.push(recommendation);
    });

    // Add universal high-leverage recommendations
    if (!rootCauses.some((c) => c.category === 'pricing')) {
      recommendations.push({
        id: 'price_optimization',
        priority: recommendations.length + 1,
        title: 'Pricing Strategy Review',
        description: 'Conduct comprehensive pricing analysis to ensure value capture',
        rationale: 'Pricing is often the highest leverage growth lever available',
        impact: {
          revenueImpact: 15,
          timeToImpact: '30 days',
          confidence: 0.7,
          secondOrderEffects: ['Improved unit economics', 'Better customer segmentation'],
        },
        implementation: {
          difficulty: 'moderate',
          timeRequired: '2-4 weeks',
          resourcesRequired: ['Pricing analysis', 'Customer research'],
          keyMilestones: ['Analysis complete', 'New pricing tested', 'Full rollout'],
          firstStep: 'Analyze current pricing against value delivered',
        },
        risks: ['Customer pushback', 'Competitive response'],
        dependencies: ['Customer data access', 'Executive alignment'],
        alternatives: ['Value-based pricing', 'Tiered pricing', 'Usage-based pricing'],
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  private createRecommendationForCause(
    cause: RootCause,
    input: DiagnosticInput,
    priority: number
  ): StrategicRecommendation {
    const recommendationMap: Record<RootCauseCategory, Partial<StrategicRecommendation>> = {
      market_fit: {
        title: 'Product-Market Fit Reassessment',
        description: 'Deep dive into customer needs and product value proposition',
        implementation: {
          difficulty: 'hard',
          timeRequired: '2-3 months',
          resourcesRequired: ['Customer research', 'Product team', 'Data analysis'],
          keyMilestones: ['Research complete', 'Hypothesis validated', 'Changes implemented'],
          firstStep: 'Interview 20 churned customers',
        },
      },
      pricing: {
        title: 'Pricing Strategy Overhaul',
        description: 'Realign pricing with value delivered and market position',
        implementation: {
          difficulty: 'moderate',
          timeRequired: '4-6 weeks',
          resourcesRequired: ['Pricing analysis', 'Competitive research'],
          keyMilestones: ['Analysis complete', 'Testing', 'Rollout'],
          firstStep: 'Calculate willingness-to-pay by segment',
        },
      },
      execution: {
        title: 'Execution Framework Upgrade',
        description: 'Implement rigorous execution system with clear accountability',
        implementation: {
          difficulty: 'moderate',
          timeRequired: '1-2 months',
          resourcesRequired: ['Leadership alignment', 'Process design'],
          keyMilestones: ['System designed', 'Team trained', 'First cycle complete'],
          firstStep: 'Define key metrics and ownership',
        },
      },
      operations: {
        title: 'Operational Excellence Program',
        description: 'Streamline operations to improve delivery quality and efficiency',
        implementation: {
          difficulty: 'moderate',
          timeRequired: '2-3 months',
          resourcesRequired: ['Process mapping', 'Systems upgrade'],
          keyMilestones: ['Bottlenecks identified', 'Solutions implemented', 'Results measured'],
          firstStep: 'Map current customer journey and identify friction',
        },
      },
      strategy: {
        title: 'Strategic Repositioning',
        description: 'Redefine market position and competitive differentiation',
        implementation: {
          difficulty: 'hard',
          timeRequired: '3-6 months',
          resourcesRequired: ['Strategy team', 'Market research', 'Executive time'],
          keyMilestones: ['Strategy defined', 'Communicated', 'Executed'],
          firstStep: 'Competitive landscape analysis',
        },
      },
      positioning: {
        title: 'Market Positioning Refinement',
        description: 'Sharpen positioning to improve differentiation and resonance',
        implementation: {
          difficulty: 'moderate',
          timeRequired: '4-6 weeks',
          resourcesRequired: ['Marketing team', 'Customer research'],
          keyMilestones: ['Research complete', 'Positioning defined', 'Rolled out'],
          firstStep: 'Interview ideal customers about perception',
        },
      },
      talent: {
        title: 'Talent Strategy Upgrade',
        description: 'Address critical talent gaps and improve team capability',
        implementation: {
          difficulty: 'hard',
          timeRequired: '3-6 months',
          resourcesRequired: ['HR', 'Budget for hires', 'Management time'],
          keyMilestones: ['Gaps identified', 'Roles filled', 'Onboarding complete'],
          firstStep: 'Assess current team against needed capabilities',
        },
      },
      capital: {
        title: 'Capital Strategy Development',
        description: 'Secure appropriate capital to fund growth plan',
        implementation: {
          difficulty: 'hard',
          timeRequired: '3-6 months',
          resourcesRequired: ['Financial modeling', 'Investor materials', 'Executive time'],
          keyMilestones: ['Materials ready', 'Investor meetings', 'Term sheet'],
          firstStep: 'Build detailed financial model',
        },
      },
      technology: {
        title: 'Technology Infrastructure Upgrade',
        description: 'Address technical debt and scale limitations',
        implementation: {
          difficulty: 'hard',
          timeRequired: '3-6 months',
          resourcesRequired: ['Engineering team', 'Architecture review'],
          keyMilestones: ['Assessment complete', 'Roadmap defined', 'Key upgrades done'],
          firstStep: 'Technical architecture review',
        },
      },
      leadership: {
        title: 'Leadership Development Program',
        description: 'Strengthen leadership capability across the organization',
        implementation: {
          difficulty: 'hard',
          timeRequired: '6-12 months',
          resourcesRequired: ['Executive coaching', 'Training budget'],
          keyMilestones: ['Assessment done', 'Development plans', 'Progress reviews'],
          firstStep: '360 leadership assessment',
        },
      },
      culture: {
        title: 'Culture Transformation Initiative',
        description: 'Align culture with strategic objectives',
        implementation: {
          difficulty: 'very_hard',
          timeRequired: '12-24 months',
          resourcesRequired: ['Leadership commitment', 'Change management'],
          keyMilestones: ['Culture defined', 'Changes initiated', 'Sustained'],
          firstStep: 'Culture audit and gap analysis',
        },
      },
      external: {
        title: 'External Risk Mitigation',
        description: 'Address external factors impacting business',
        implementation: {
          difficulty: 'hard',
          timeRequired: 'Variable',
          resourcesRequired: ['Strategy team', 'External advisors'],
          keyMilestones: ['Risks mapped', 'Mitigations implemented'],
          firstStep: 'Detailed risk assessment',
        },
      },
    };

    const template = recommendationMap[cause.category] || recommendationMap.strategy;

    return {
      id: cause.id,
      priority,
      title: template.title || 'Strategic Initiative',
      description: template.description || cause.description,
      rationale: `Addresses root cause: ${cause.description}`,
      impact: {
        revenueImpact: cause.urgency === 'critical' ? 30 : cause.urgency === 'high' ? 20 : 10,
        timeToImpact: cause.fixability === 'quick_fix' ? '30 days' : '90 days',
        confidence: cause.confidence,
        secondOrderEffects: cause.cascadeEffects,
      },
      implementation: template.implementation || {
        difficulty: 'moderate',
        timeRequired: '2-3 months',
        resourcesRequired: ['TBD'],
        keyMilestones: ['TBD'],
        firstStep: 'Define scope and resources',
      },
      risks: ['Execution risk', 'Resource constraints'],
      dependencies: [],
      alternatives: [],
    };
  }

  private identifyAntiPatterns(diagnosis: Diagnosis, input: DiagnosticInput): string[] {
    const doNotDo: string[] = [];

    // Universal anti-patterns
    doNotDo.push('Do not pursue growth without fixing unit economics');
    doNotDo.push('Do not add features without validating demand');

    // Context-specific anti-patterns
    if (diagnosis.healthScore < 0.5) {
      doNotDo.push('Do not make major pivots without validating assumptions');
      doNotDo.push('Do not cut customer success to reduce costs');
    }

    if (input.businessContext.runway !== undefined && input.businessContext.runway < 12) {
      doNotDo.push('Do not pursue long-term initiatives without securing runway');
    }

    if (input.businessContext.stage === 'growth') {
      doNotDo.push('Do not over-optimize for short-term metrics at expense of growth');
    }

    return doNotDo;
  }

  private assessConfidence(
    input: DiagnosticInput,
    symptoms: Symptom[],
    rootCauses: RootCause[]
  ): DiagnosisConfidence {
    const metricsCount = Object.keys(input.metrics).length;
    const dataQuality = Math.min(1, metricsCount / 10);
    const analysisDepth = Math.min(1, (symptoms.length + rootCauses.length) / 10);

    return {
      overall: (dataQuality + analysisDepth) / 2,
      dataQuality,
      analysisDepth,
      assumptionRisk: rootCauses.filter((c) => c.confidence < 0.6).length / Math.max(rootCauses.length, 1),
      uncertainties: [
        'Market conditions may change',
        'Execution capability assumptions',
        'Competitive response unknown',
      ],
    };
  }

  getDiagnosis(diagnosisId: string): BusinessDiagnosis | undefined {
    return this.diagnoses.get(diagnosisId);
  }

  getStats(): {
    totalDiagnoses: number;
    avgHealthScore: number;
    commonRootCauses: Array<{ cause: string; count: number }>;
  } {
    const diagnoses = Array.from(this.diagnoses.values());
    const causeCounts: Record<string, number> = {};

    diagnoses.forEach((d) => {
      d.rootCauses.forEach((c) => {
        causeCounts[c.category] = (causeCounts[c.category] || 0) + 1;
      });
    });

    return {
      totalDiagnoses: diagnoses.length,
      avgHealthScore: diagnoses.length > 0
        ? diagnoses.reduce((sum, d) => sum + d.diagnosis.healthScore, 0) / diagnoses.length
        : 0,
      commonRootCauses: Object.entries(causeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cause, count]) => ({ cause, count })),
    };
  }
}

export const businessDiagnostician = new BusinessDiagnostician();
export { BusinessDiagnostician };
