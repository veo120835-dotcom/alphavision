// Best Practice Distributor - Share proven practices across the network

import { BestPractice } from './types';

interface PracticeRecommendation {
  practice: BestPractice;
  relevance_score: number;
  quick_win: boolean;
  estimated_roi: 'low' | 'medium' | 'high' | 'very_high';
  adoption_reasoning: string;
}

interface PracticeCategory {
  name: string;
  practices: BestPractice[];
  average_impact: number;
  average_adoption_rate: number;
}

class BestPracticeDistributorService {
  private practices: BestPractice[] = [];

  constructor() {
    this.initializeDefaultPractices();
  }

  private initializeDefaultPractices(): void {
    this.practices = [
      {
        id: 'bp-1',
        category: 'Customer Retention',
        title: 'Implement 90-Day Customer Health Scoring',
        description: 'Create a composite score based on product usage, engagement, support tickets, and payment history to predict churn risk.',
        supporting_data: 'Companies using health scores reduce churn by 15-25%',
        adoption_rate: 45,
        impact_score: 85,
        difficulty: 'moderate',
        time_to_implement_weeks: 4,
        applicable_stages: ['growth', 'scaling'],
        applicable_industries: ['SaaS', 'FinTech', 'EdTech'],
        implementation_guide: [
          'Define 5-7 key health indicators',
          'Weight indicators by predictive power',
          'Set up automated data collection',
          'Create health dashboard',
          'Define intervention triggers',
          'Train CS team on health-based playbooks',
        ],
      },
      {
        id: 'bp-2',
        category: 'Sales Optimization',
        title: 'Implement Sales-Accepted Lead (SAL) Handoff Process',
        description: 'Create formal criteria and process for marketing to hand leads to sales, ensuring alignment and accountability.',
        supporting_data: 'Proper lead handoff increases conversion by 25-35%',
        adoption_rate: 60,
        impact_score: 75,
        difficulty: 'easy',
        time_to_implement_weeks: 2,
        applicable_stages: ['early', 'growth', 'scaling'],
        applicable_industries: ['SaaS', 'Agency', 'Consulting', 'B2B'],
        implementation_guide: [
          'Define SAL criteria with both teams',
          'Create handoff documentation template',
          'Set up CRM automation for handoffs',
          'Establish SLA for follow-up timing',
          'Create feedback loop for lead quality',
        ],
      },
      {
        id: 'bp-3',
        category: 'Operations',
        title: 'Weekly Metrics Review Ritual',
        description: 'Establish a weekly 30-minute team review of key metrics with defined owners and action items.',
        supporting_data: 'Teams with regular metrics reviews outperform by 40%',
        adoption_rate: 55,
        impact_score: 70,
        difficulty: 'easy',
        time_to_implement_weeks: 1,
        applicable_stages: ['early', 'growth', 'scaling', 'mature'],
        applicable_industries: ['SaaS', 'E-commerce', 'Agency', 'Consulting', 'FinTech'],
        implementation_guide: [
          'Identify 5-7 key weekly metrics',
          'Assign metric owners',
          'Create simple dashboard or scorecard',
          'Schedule recurring 30-min meeting',
          'Establish action item follow-up process',
        ],
      },
      {
        id: 'bp-4',
        category: 'Customer Acquisition',
        title: 'Implement Customer Referral Program',
        description: 'Create a structured referral program with clear incentives for both referrer and referred.',
        supporting_data: 'Referred customers have 25% higher LTV and 3-5x conversion rate',
        adoption_rate: 40,
        impact_score: 80,
        difficulty: 'moderate',
        time_to_implement_weeks: 3,
        applicable_stages: ['growth', 'scaling'],
        applicable_industries: ['SaaS', 'E-commerce', 'D2C', 'FinTech'],
        implementation_guide: [
          'Define referral incentive structure',
          'Build referral tracking mechanism',
          'Create referral page and assets',
          'Identify trigger points to ask for referrals',
          'Set up automated referral reminders',
          'Track and optimize referral performance',
        ],
      },
      {
        id: 'bp-5',
        category: 'Product Development',
        title: 'Monthly User Feedback Sprint',
        description: 'Dedicate one week per month to building features from direct user feedback, with public changelog.',
        supporting_data: 'Companies with feedback loops have 50% higher retention',
        adoption_rate: 35,
        impact_score: 75,
        difficulty: 'moderate',
        time_to_implement_weeks: 2,
        applicable_stages: ['early', 'growth'],
        applicable_industries: ['SaaS', 'FinTech', 'EdTech', 'Marketplace'],
        implementation_guide: [
          'Set up feedback collection system',
          'Create voting/prioritization mechanism',
          'Block one week in monthly sprint',
          'Build public changelog/roadmap',
          'Close feedback loop with users',
        ],
      },
      {
        id: 'bp-6',
        category: 'Financial Management',
        title: 'Weekly Cash Flow Forecasting',
        description: 'Implement rolling 13-week cash flow forecast updated weekly with variance analysis.',
        supporting_data: 'Reduces cash surprises by 80% and improves planning',
        adoption_rate: 30,
        impact_score: 90,
        difficulty: 'moderate',
        time_to_implement_weeks: 2,
        applicable_stages: ['early', 'growth', 'scaling'],
        applicable_industries: ['SaaS', 'E-commerce', 'Agency', 'Consulting'],
        implementation_guide: [
          'Create 13-week forecast template',
          'Identify all cash inflow sources',
          'Map all recurring cash outflows',
          'Schedule weekly 30-min update',
          'Track forecast vs actual variance',
          'Set cash threshold alerts',
        ],
      },
    ];
  }

  addPractice(practice: BestPractice): void {
    this.practices.push(practice);
  }

  getRecommendations(
    industry: string,
    stage: string,
    currentChallenges: string[]
  ): PracticeRecommendation[] {
    const applicable = this.practices.filter(p =>
      p.applicable_industries.some(i => i.toLowerCase() === industry.toLowerCase()) &&
      p.applicable_stages.some(s => s.toLowerCase() === stage.toLowerCase())
    );

    const recommendations = applicable.map(practice => {
      const relevanceScore = this.calculateRelevance(practice, currentChallenges);
      const isQuickWin = practice.difficulty === 'easy' && practice.time_to_implement_weeks <= 2;
      const estimatedROI = this.estimateROI(practice);

      return {
        practice,
        relevance_score: relevanceScore,
        quick_win: isQuickWin,
        estimated_roi: estimatedROI,
        adoption_reasoning: this.generateAdoptionReasoning(practice, relevanceScore),
      };
    });

    return recommendations.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  private calculateRelevance(practice: BestPractice, challenges: string[]): number {
    let score = practice.impact_score * 0.5;

    const categoryMatch = challenges.some(c =>
      practice.category.toLowerCase().includes(c.toLowerCase()) ||
      practice.title.toLowerCase().includes(c.toLowerCase())
    );

    if (categoryMatch) score += 25;

    if (practice.adoption_rate > 50) {
      score += 10;
    } else if (practice.adoption_rate < 30) {
      score += 15;
    }

    if (practice.difficulty === 'easy') score += 10;

    return Math.min(100, score);
  }

  private estimateROI(practice: BestPractice): 'low' | 'medium' | 'high' | 'very_high' {
    const effortScore = practice.difficulty === 'easy' ? 1 :
                       practice.difficulty === 'moderate' ? 2 : 3;
    const impactScore = practice.impact_score;

    const roiScore = impactScore / (effortScore * 20);

    if (roiScore >= 2) return 'very_high';
    if (roiScore >= 1.5) return 'high';
    if (roiScore >= 1) return 'medium';
    return 'low';
  }

  private generateAdoptionReasoning(practice: BestPractice, relevance: number): string {
    if (relevance >= 80) {
      return `Highly relevant to your current challenges. ${practice.supporting_data}`;
    }
    if (relevance >= 60) {
      return `Good fit for your stage. ${practice.adoption_rate}% of similar companies have adopted this.`;
    }
    return `Consider for future implementation. Impact score: ${practice.impact_score}%.`;
  }

  getQuickWins(industry: string, stage: string): PracticeRecommendation[] {
    return this.getRecommendations(industry, stage, [])
      .filter(r => r.quick_win)
      .slice(0, 5);
  }

  getPracticesByCategory(): PracticeCategory[] {
    const categoryMap = new Map<string, BestPractice[]>();

    this.practices.forEach(practice => {
      const existing = categoryMap.get(practice.category) || [];
      existing.push(practice);
      categoryMap.set(practice.category, existing);
    });

    const categories: PracticeCategory[] = [];

    categoryMap.forEach((practices, name) => {
      const avgImpact = practices.reduce((sum, p) => sum + p.impact_score, 0) / practices.length;
      const avgAdoption = practices.reduce((sum, p) => sum + p.adoption_rate, 0) / practices.length;

      categories.push({
        name,
        practices,
        average_impact: avgImpact,
        average_adoption_rate: avgAdoption,
      });
    });

    return categories.sort((a, b) => b.average_impact - a.average_impact);
  }

  getPracticeById(id: string): BestPractice | undefined {
    return this.practices.find(p => p.id === id);
  }

  getHighImpactPractices(minImpact: number = 75): BestPractice[] {
    return this.practices
      .filter(p => p.impact_score >= minImpact)
      .sort((a, b) => b.impact_score - a.impact_score);
  }

  getUnderutilizedPractices(maxAdoption: number = 40): BestPractice[] {
    return this.practices
      .filter(p => p.adoption_rate <= maxAdoption && p.impact_score >= 70)
      .sort((a, b) => (b.impact_score - b.adoption_rate) - (a.impact_score - a.adoption_rate));
  }
}

export const bestPracticeDistributorService = new BestPracticeDistributorService();
