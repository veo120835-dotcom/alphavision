import type { 
  BusinessIntake, 
  BusinessStage, 
  Bottleneck, 
  LeveragePoint, 
  GrowthRoadmap, 
  RoadmapMilestone 
} from './types';
import { stageClassifierService } from './stage-classifier';
import { bottleneckDetectorService } from './bottleneck-detector';
import { leverageMapService } from './leverage-map';

const THINGS_TO_IGNORE_BY_STAGE: Record<BusinessStage, string[]> = {
  idea: [
    'Perfect branding and visual identity',
    'Complex pricing strategies',
    'Building for scale',
    'Most marketing channels',
    'Hiring before validation',
  ],
  early: [
    'Broad marketing campaigns',
    'Building extensive features',
    'Premature optimization',
    'Complex org structures',
    'Enterprise sales motions',
  ],
  growth: [
    'Chasing every opportunity',
    'Over-hiring',
    'Premature international expansion',
    'Building everything in-house',
    'Ignoring technical debt entirely',
  ],
  scaling: [
    'Founder-led sales exclusively',
    'Manual processes that should be automated',
    'Uniform approach to all customer segments',
    'Ignoring culture development',
  ],
  mature: [
    'Complacent optimization',
    'Ignoring disruption signals',
    'Over-reliance on existing channels',
    'Resistance to organizational change',
  ],
};

const RISK_FACTORS_BY_BOTTLENECK: Record<string, string[]> = {
  low_leads: ['Over-investing in wrong channels', 'Ignoring lead quality', 'CAC inflation'],
  low_conversion: ['Changing too many variables', 'Ignoring customer feedback', 'Price race to bottom'],
  high_churn: ['Focusing on symptoms not causes', 'Over-promising to retain', 'Ignoring product issues'],
  cash_crisis: ['Dilutive financing', 'Cutting growth investments', 'Desperation deals'],
  team_constraint: ['Bad hires under pressure', 'Over-hiring', 'Culture degradation'],
  ops_chaos: ['Over-engineering processes', 'Tool sprawl', 'Analysis paralysis'],
  pmf_missing: ['Premature scaling', 'Ignoring user feedback', 'Building for investors not users'],
  competition_threat: ['Reactive strategy', 'Price wars', 'Feature copying'],
};

export class GrowthRoadmapGenerator {
  generateRoadmap(intake: BusinessIntake): GrowthRoadmap {
    // 1. Classify stage
    const classification = stageClassifierService.classifyStage(intake);
    
    // 2. Detect bottlenecks
    const bottlenecks = bottleneckDetectorService.detectBottlenecks(intake, classification.stage);
    const primaryBottleneck = bottlenecks[0] || this.createDefaultBottleneck();
    
    // 3. Identify leverage points
    const leveragePoints = leverageMapService.identifyLeveragePoints(
      intake, 
      classification.stage, 
      bottlenecks
    );
    
    // 4. Generate milestones
    const milestones = this.generateMilestones(
      intake,
      classification.stage,
      primaryBottleneck,
      leveragePoints
    );
    
    // 5. Compile things to ignore
    const thingsToIgnore = THINGS_TO_IGNORE_BY_STAGE[classification.stage];
    
    // 6. Compile risk factors
    const riskFactors = this.compileRiskFactors(bottlenecks);
    
    // 7. Calculate success probability
    const successProbability = this.calculateSuccessProbability(
      intake,
      classification,
      bottlenecks,
      leveragePoints
    );

    return {
      id: crypto.randomUUID(),
      client_id: intake.client_id,
      stage: classification.stage,
      primary_bottleneck: primaryBottleneck,
      leverage_points: leveragePoints.slice(0, 5), // Top 5
      milestones,
      things_to_ignore: thingsToIgnore,
      risk_factors: riskFactors,
      success_probability: successProbability,
      created_at: new Date().toISOString(),
    };
  }

  private generateMilestones(
    intake: BusinessIntake,
    stage: BusinessStage,
    bottleneck: Bottleneck,
    leveragePoints: LeveragePoint[]
  ): RoadmapMilestone[] {
    const milestones: RoadmapMilestone[] = [];
    const quickWins = leveragePoints.filter(lp => lp.type === 'quick_win').slice(0, 2);
    const strategic = leveragePoints.filter(lp => lp.type === 'strategic').slice(0, 2);
    const foundational = leveragePoints.filter(lp => lp.type === 'foundational').slice(0, 1);

    // Week 1-2: Assessment & Quick Wins
    milestones.push({
      id: crypto.randomUUID(),
      week: 1,
      title: 'Foundation & Quick Wins',
      objectives: [
        'Complete business assessment',
        `Address ${bottleneck.category} bottleneck`,
        ...quickWins.slice(0, 1).map(qw => qw.title),
      ],
      key_actions: [
        ...bottleneck.recommended_actions.slice(0, 2),
        ...quickWins.flatMap(qw => qw.resources_needed).slice(0, 2),
      ],
      success_metrics: [
        'Assessment complete',
        'First quick win implemented',
        'Team aligned on priorities',
      ],
      dependencies: [],
    });

    // Week 3-4: Execution Sprint
    milestones.push({
      id: crypto.randomUUID(),
      week: 3,
      title: 'Execution Sprint',
      objectives: [
        'Complete remaining quick wins',
        'Begin strategic initiatives',
        'Establish measurement baseline',
      ],
      key_actions: [
        ...quickWins.slice(1).flatMap(qw => qw.resources_needed.slice(0, 1)),
        ...strategic.slice(0, 1).flatMap(s => s.resources_needed.slice(0, 2)),
        'Set up tracking dashboards',
      ],
      success_metrics: [
        'All quick wins live',
        'Strategic initiative kicked off',
        'KPIs baselined',
      ],
      dependencies: ['Week 1 complete'],
    });

    // Week 5-8: Strategic Focus
    milestones.push({
      id: crypto.randomUUID(),
      week: 5,
      title: 'Strategic Acceleration',
      objectives: [
        'Scale what works',
        'Complete first strategic initiative',
        'Begin foundational investments',
      ],
      key_actions: [
        ...strategic.flatMap(s => s.resources_needed.slice(0, 2)),
        ...foundational.flatMap(f => f.resources_needed.slice(0, 2)),
        'Double down on winning tactics',
      ],
      success_metrics: this.getStageSpecificMetrics(stage, intake),
      dependencies: ['Week 3 assessment'],
    });

    // Week 9-12: Optimization & Scale
    milestones.push({
      id: crypto.randomUUID(),
      week: 9,
      title: 'Optimization & Next Phase',
      objectives: [
        'Optimize performing initiatives',
        'Kill underperforming experiments',
        'Plan next quarter priorities',
      ],
      key_actions: [
        'Performance review all initiatives',
        'Update growth model',
        'Prepare next 90-day plan',
        'Document learnings',
      ],
      success_metrics: [
        'Revenue target hit',
        'Key bottleneck resolved',
        'Next phase planned',
      ],
      dependencies: ['Week 5 execution'],
    });

    return milestones;
  }

  private getStageSpecificMetrics(stage: BusinessStage, intake: BusinessIntake): string[] {
    const baseMetrics = {
      idea: [
        'First paying customer',
        'Product validation complete',
        '10 customer conversations',
      ],
      early: [
        '50% revenue increase',
        'Churn under 8%',
        'Repeatable sales process documented',
      ],
      growth: [
        `Revenue > $${Math.round(intake.revenue_monthly * 1.5 / 1000)}k MRR`,
        'CAC/LTV ratio improved',
        'Second channel producing',
      ],
      scaling: [
        'Team efficiency improved',
        'Processes documented',
        'Management layer operational',
      ],
      mature: [
        'New revenue stream launched',
        'Market share protected',
        'Operational efficiency gains',
      ],
    };
    return baseMetrics[stage];
  }

  private compileRiskFactors(bottlenecks: Bottleneck[]): string[] {
    const risks: string[] = [];
    for (const bottleneck of bottlenecks.slice(0, 3)) {
      const bottleneckRisks = RISK_FACTORS_BY_BOTTLENECK[bottleneck.id] || [];
      risks.push(...bottleneckRisks.slice(0, 2));
    }
    return [...new Set(risks)].slice(0, 6);
  }

  private calculateSuccessProbability(
    intake: BusinessIntake,
    classification: { stage: BusinessStage; confidence: number },
    bottlenecks: Bottleneck[],
    leveragePoints: LeveragePoint[]
  ): number {
    let probability = 50; // Base

    // Positive factors
    if (intake.revenue_trend === 'growing') probability += 15;
    if (classification.confidence > 0.7) probability += 5;
    if (leveragePoints.filter(lp => lp.type === 'quick_win').length > 0) probability += 10;
    if (intake.cash_runway_months && intake.cash_runway_months > 12) probability += 10;
    if (bottlenecks.length < 3) probability += 5;

    // Negative factors
    if (intake.revenue_trend === 'declining') probability -= 20;
    if (bottlenecks.some(b => b.severity === 'critical')) probability -= 15;
    if (intake.cash_runway_months && intake.cash_runway_months < 6) probability -= 15;
    if (bottlenecks.length > 4) probability -= 10;

    return Math.max(10, Math.min(90, probability));
  }

  private createDefaultBottleneck(): Bottleneck {
    return {
      id: 'general_growth',
      category: 'lead_generation',
      severity: 'medium',
      title: 'General Growth Optimization',
      description: 'No critical bottleneck identified. Focus on optimization.',
      impact_score: 50,
      evidence: ['No major issues detected'],
      recommended_actions: ['Continue current trajectory', 'Look for optimization opportunities'],
    };
  }
}

export const growthRoadmapGenerator = new GrowthRoadmapGenerator();