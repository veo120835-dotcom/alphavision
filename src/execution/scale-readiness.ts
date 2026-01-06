// Scale Readiness - Assess readiness to scale operations

import { ScaleReadinessAssessment, BusinessSystem } from './types';

interface ScaleCategory {
  name: string;
  weight: number;
  criteria: {
    name: string;
    weight: number;
    evaluate: (context: ScaleContext) => { score: number; gaps: string[]; recommendations: string[] };
  }[];
}

interface ScaleContext {
  systems: BusinessSystem[];
  teamSize: number;
  revenueMonthly: number;
  customerCount: number;
  churnRate: number;
  documentedProcesses: number;
  automationLevel: number;
}

class ScaleReadinessService {
  private categories: ScaleCategory[] = [
    {
      name: 'Systems & Processes',
      weight: 25,
      criteria: [
        {
          name: 'Process Documentation',
          weight: 40,
          evaluate: (ctx) => {
            const score = ctx.documentedProcesses * 100;
            return {
              score,
              gaps: score < 70 ? ['Critical processes not documented'] : [],
              recommendations: score < 70 ? ['Document top 10 most frequent processes'] : [],
            };
          },
        },
        {
          name: 'System Coverage',
          weight: 30,
          evaluate: (ctx) => {
            const requiredSystems = ['sales', 'operations', 'finance'];
            const covered = ctx.systems.filter(s => requiredSystems.includes(s.type)).length;
            const score = (covered / requiredSystems.length) * 100;
            return {
              score,
              gaps: score < 100 ? ['Missing critical business systems'] : [],
              recommendations: score < 100 ? ['Implement missing core systems'] : [],
            };
          },
        },
        {
          name: 'Automation Level',
          weight: 30,
          evaluate: (ctx) => {
            const score = ctx.automationLevel * 100;
            return {
              score,
              gaps: score < 40 ? ['Low automation creates scaling bottlenecks'] : [],
              recommendations: score < 40 ? ['Identify and automate repetitive tasks'] : [],
            };
          },
        },
      ],
    },
    {
      name: 'Team & Organization',
      weight: 25,
      criteria: [
        {
          name: 'Team Size Adequacy',
          weight: 40,
          evaluate: (ctx) => {
            const revenuePerPerson = ctx.revenueMonthly / ctx.teamSize;
            const score = Math.min(100, (revenuePerPerson / 15000) * 100);
            return {
              score,
              gaps: score < 50 ? ['Team may be undersized for revenue'] : [],
              recommendations: score < 50 ? ['Evaluate hiring needs for sustainable growth'] : [],
            };
          },
        },
        {
          name: 'Organizational Structure',
          weight: 30,
          evaluate: (ctx) => {
            const hasStructure = ctx.teamSize > 3;
            const score = hasStructure ? 70 : 40;
            return {
              score,
              gaps: !hasStructure ? ['Flat structure limits scale'] : [],
              recommendations: !hasStructure ? ['Define roles and reporting structure'] : [],
            };
          },
        },
        {
          name: 'Knowledge Distribution',
          weight: 30,
          evaluate: (ctx) => {
            const documentedRatio = ctx.documentedProcesses;
            const score = documentedRatio * 80 + 20;
            return {
              score,
              gaps: score < 60 ? ['Knowledge concentrated in few people'] : [],
              recommendations: score < 60 ? ['Cross-train and document tribal knowledge'] : [],
            };
          },
        },
      ],
    },
    {
      name: 'Customer Operations',
      weight: 25,
      criteria: [
        {
          name: 'Customer Health',
          weight: 50,
          evaluate: (ctx) => {
            const score = Math.max(0, 100 - (ctx.churnRate * 500));
            return {
              score,
              gaps: score < 70 ? ['High churn threatens scale sustainability'] : [],
              recommendations: score < 70 ? ['Implement customer success program'] : [],
            };
          },
        },
        {
          name: 'Service Scalability',
          weight: 50,
          evaluate: (ctx) => {
            const customersPerPerson = ctx.customerCount / ctx.teamSize;
            const score = Math.min(100, customersPerPerson * 5);
            return {
              score,
              gaps: score < 40 ? ['Service model not scalable'] : [],
              recommendations: score < 40 ? ['Productize services and create self-service options'] : [],
            };
          },
        },
      ],
    },
    {
      name: 'Financial Readiness',
      weight: 25,
      criteria: [
        {
          name: 'Revenue Stability',
          weight: 40,
          evaluate: (ctx) => {
            const score = ctx.revenueMonthly > 50000 ? 80 : (ctx.revenueMonthly / 50000) * 80;
            return {
              score,
              gaps: score < 50 ? ['Revenue not stable enough for scaling'] : [],
              recommendations: score < 50 ? ['Focus on revenue consistency before scaling'] : [],
            };
          },
        },
        {
          name: 'Unit Economics',
          weight: 30,
          evaluate: (ctx) => {
            const revenuePerCustomer = ctx.revenueMonthly / ctx.customerCount;
            const score = Math.min(100, (revenuePerCustomer / 200) * 100);
            return {
              score,
              gaps: score < 60 ? ['Unit economics need improvement'] : [],
              recommendations: score < 60 ? ['Increase customer value or reduce acquisition cost'] : [],
            };
          },
        },
        {
          name: 'Profit Margins',
          weight: 30,
          evaluate: (ctx) => {
            const estimatedMargin = 0.4;
            const score = estimatedMargin * 100;
            return {
              score,
              gaps: score < 30 ? ['Margins too thin for sustainable scaling'] : [],
              recommendations: score < 30 ? ['Improve margins before aggressive scaling'] : [],
            };
          },
        },
      ],
    },
  ];

  assessReadiness(context: ScaleContext): ScaleReadinessAssessment {
    const categoryScores: ScaleReadinessAssessment['category_scores'] = [];
    let overallScore = 0;
    const allBlockers: string[] = [];
    const allEnablers: string[] = [];

    this.categories.forEach(category => {
      let categoryTotal = 0;
      const categoryGaps: string[] = [];
      const categoryRecommendations: string[] = [];

      category.criteria.forEach(criterion => {
        const result = criterion.evaluate(context);
        categoryTotal += result.score * (criterion.weight / 100);
        categoryGaps.push(...result.gaps);
        categoryRecommendations.push(...result.recommendations);

        if (result.score < 40) {
          allBlockers.push(`${category.name}: ${criterion.name}`);
        } else if (result.score > 80) {
          allEnablers.push(`${category.name}: ${criterion.name}`);
        }
      });

      categoryScores.push({
        category: category.name,
        score: categoryTotal,
        gaps: categoryGaps,
        recommendations: categoryRecommendations,
      });

      overallScore += categoryTotal * (category.weight / 100);
    });

    const timelineMonths = this.estimateTimeline(overallScore, allBlockers.length);

    return {
      overall_score: Math.round(overallScore),
      category_scores: categoryScores,
      blockers: allBlockers,
      enablers: allEnablers,
      timeline_to_ready_months: timelineMonths,
    };
  }

  private estimateTimeline(score: number, blockerCount: number): number {
    if (score >= 80) return 0;
    if (score >= 60) return 3;
    if (score >= 40) return 6;
    return 6 + (blockerCount * 2);
  }

  generateScalePlaybook(assessment: ScaleReadinessAssessment): {
    phase: string;
    duration_months: number;
    focus_areas: string[];
    milestones: string[];
  }[] {
    const playbook: ReturnType<typeof this.generateScalePlaybook> = [];

    if (assessment.overall_score < 40) {
      playbook.push({
        phase: 'Foundation',
        duration_months: 3,
        focus_areas: ['Process documentation', 'System implementation', 'Team structure'],
        milestones: ['Core processes documented', 'Critical systems operational', 'Roles defined'],
      });
    }

    if (assessment.overall_score < 70) {
      playbook.push({
        phase: 'Optimization',
        duration_months: 3,
        focus_areas: ['Automation', 'Team training', 'Customer success'],
        milestones: ['Key workflows automated', 'Team cross-trained', 'Churn reduced'],
      });
    }

    playbook.push({
      phase: 'Scale',
      duration_months: 6,
      focus_areas: ['Growth hiring', 'Market expansion', 'Product development'],
      milestones: ['Team doubled', 'New market entered', 'Product enhanced'],
    });

    return playbook;
  }

  identifyQuickWins(assessment: ScaleReadinessAssessment): string[] {
    const quickWins: string[] = [];

    assessment.category_scores.forEach(category => {
      if (category.score < 60 && category.recommendations.length > 0) {
        const lowEffortRecs = category.recommendations.filter(r => 
          r.toLowerCase().includes('document') ||
          r.toLowerCase().includes('define') ||
          r.toLowerCase().includes('implement')
        );
        quickWins.push(...lowEffortRecs.slice(0, 2));
      }
    });

    return quickWins.slice(0, 5);
  }
}

export const scaleReadinessService = new ScaleReadinessService();
