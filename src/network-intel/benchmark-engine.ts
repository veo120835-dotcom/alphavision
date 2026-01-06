// Benchmark Engine - Compare performance against industry benchmarks

import { Benchmark, BenchmarkComparison } from './types';

interface BenchmarkSet {
  industry: string;
  stage: string;
  benchmarks: Benchmark[];
  last_updated: string;
}

interface PerformanceProfile {
  industry: string;
  stage: string;
  metrics: Record<string, number>;
}

interface BenchmarkReport {
  overall_percentile: number;
  status: 'underperforming' | 'on_track' | 'outperforming';
  comparisons: BenchmarkComparison[];
  strengths: string[];
  improvement_areas: string[];
  priority_actions: string[];
}

class BenchmarkEngineService {
  private benchmarkSets: BenchmarkSet[] = [];

  constructor() {
    this.initializeDefaultBenchmarks();
  }

  private initializeDefaultBenchmarks(): void {
    this.benchmarkSets = [
      {
        industry: 'SaaS',
        stage: 'early',
        last_updated: new Date().toISOString(),
        benchmarks: [
          { id: 'saas-early-mrr-growth', metric_name: 'MRR Growth Rate %', industry: 'SaaS', business_stage: 'early', percentile_10: 5, percentile_25: 10, median: 15, percentile_75: 25, percentile_90: 40, sample_size: 500, last_updated: new Date().toISOString() },
          { id: 'saas-early-churn', metric_name: 'Monthly Churn Rate %', industry: 'SaaS', business_stage: 'early', percentile_10: 12, percentile_25: 8, median: 5, percentile_75: 3, percentile_90: 1.5, sample_size: 500, last_updated: new Date().toISOString() },
          { id: 'saas-early-cac', metric_name: 'CAC Payback Months', industry: 'SaaS', business_stage: 'early', percentile_10: 24, percentile_25: 18, median: 12, percentile_75: 8, percentile_90: 6, sample_size: 450, last_updated: new Date().toISOString() },
          { id: 'saas-early-nps', metric_name: 'NPS Score', industry: 'SaaS', business_stage: 'early', percentile_10: -10, percentile_25: 10, median: 30, percentile_75: 50, percentile_90: 70, sample_size: 400, last_updated: new Date().toISOString() },
        ],
      },
      {
        industry: 'SaaS',
        stage: 'growth',
        last_updated: new Date().toISOString(),
        benchmarks: [
          { id: 'saas-growth-mrr-growth', metric_name: 'MRR Growth Rate %', industry: 'SaaS', business_stage: 'growth', percentile_10: 8, percentile_25: 15, median: 20, percentile_75: 30, percentile_90: 50, sample_size: 300, last_updated: new Date().toISOString() },
          { id: 'saas-growth-churn', metric_name: 'Monthly Churn Rate %', industry: 'SaaS', business_stage: 'growth', percentile_10: 8, percentile_25: 5, median: 3, percentile_75: 2, percentile_90: 1, sample_size: 300, last_updated: new Date().toISOString() },
          { id: 'saas-growth-ltv-cac', metric_name: 'LTV:CAC Ratio', industry: 'SaaS', business_stage: 'growth', percentile_10: 1.5, percentile_25: 2, median: 3, percentile_75: 4, percentile_90: 6, sample_size: 280, last_updated: new Date().toISOString() },
        ],
      },
      {
        industry: 'E-commerce',
        stage: 'growth',
        last_updated: new Date().toISOString(),
        benchmarks: [
          { id: 'ecom-growth-conversion', metric_name: 'Conversion Rate %', industry: 'E-commerce', business_stage: 'growth', percentile_10: 0.5, percentile_25: 1.2, median: 2.5, percentile_75: 4, percentile_90: 6, sample_size: 600, last_updated: new Date().toISOString() },
          { id: 'ecom-growth-aov', metric_name: 'Average Order Value', industry: 'E-commerce', business_stage: 'growth', percentile_10: 35, percentile_25: 55, median: 85, percentile_75: 130, percentile_90: 200, sample_size: 600, last_updated: new Date().toISOString() },
          { id: 'ecom-growth-repeat', metric_name: 'Repeat Purchase Rate %', industry: 'E-commerce', business_stage: 'growth', percentile_10: 10, percentile_25: 20, median: 30, percentile_75: 45, percentile_90: 60, sample_size: 550, last_updated: new Date().toISOString() },
        ],
      },
      {
        industry: 'Agency',
        stage: 'scaling',
        last_updated: new Date().toISOString(),
        benchmarks: [
          { id: 'agency-scaling-margin', metric_name: 'Gross Margin %', industry: 'Agency', business_stage: 'scaling', percentile_10: 30, percentile_25: 40, median: 50, percentile_75: 60, percentile_90: 70, sample_size: 200, last_updated: new Date().toISOString() },
          { id: 'agency-scaling-utilization', metric_name: 'Team Utilization %', industry: 'Agency', business_stage: 'scaling', percentile_10: 50, percentile_25: 60, median: 70, percentile_75: 80, percentile_90: 85, sample_size: 200, last_updated: new Date().toISOString() },
          { id: 'agency-scaling-revenue-per', metric_name: 'Revenue per Employee K', industry: 'Agency', business_stage: 'scaling', percentile_10: 80, percentile_25: 100, median: 130, percentile_75: 170, percentile_90: 220, sample_size: 180, last_updated: new Date().toISOString() },
        ],
      },
    ];
  }

  addBenchmarkSet(benchmarkSet: BenchmarkSet): void {
    const existing = this.benchmarkSets.findIndex(
      bs => bs.industry === benchmarkSet.industry && bs.stage === benchmarkSet.stage
    );

    if (existing >= 0) {
      this.benchmarkSets[existing] = benchmarkSet;
    } else {
      this.benchmarkSets.push(benchmarkSet);
    }
  }

  comparePerformance(profile: PerformanceProfile): BenchmarkReport {
    const benchmarkSet = this.benchmarkSets.find(
      bs => bs.industry.toLowerCase() === profile.industry.toLowerCase() &&
            bs.stage.toLowerCase() === profile.stage.toLowerCase()
    );

    if (!benchmarkSet) {
      return {
        overall_percentile: 50,
        status: 'on_track',
        comparisons: [],
        strengths: [],
        improvement_areas: ['Insufficient benchmark data for your industry/stage'],
        priority_actions: ['Contact us to add benchmarks for your industry'],
      };
    }

    const comparisons: BenchmarkComparison[] = [];
    let totalPercentile = 0;
    let comparisonCount = 0;

    Object.entries(profile.metrics).forEach(([metricName, value]) => {
      const benchmark = benchmarkSet.benchmarks.find(
        b => b.metric_name.toLowerCase() === metricName.toLowerCase()
      );

      if (benchmark) {
        const comparison = this.createComparison(benchmark, value);
        comparisons.push(comparison);
        totalPercentile += comparison.percentile;
        comparisonCount++;
      }
    });

    const overallPercentile = comparisonCount > 0 ? totalPercentile / comparisonCount : 50;
    const status = overallPercentile >= 70 ? 'outperforming' :
                   overallPercentile >= 40 ? 'on_track' : 'underperforming';

    const strengths = comparisons
      .filter(c => c.status === 'top_performer' || c.status === 'above_average')
      .map(c => c.metric_name);

    const improvementAreas = comparisons
      .filter(c => c.status === 'below_average')
      .map(c => c.metric_name);

    const priorityActions = this.generatePriorityActions(comparisons);

    return {
      overall_percentile: Math.round(overallPercentile),
      status,
      comparisons,
      strengths,
      improvement_areas: improvementAreas,
      priority_actions: priorityActions,
    };
  }

  private createComparison(benchmark: Benchmark, value: number): BenchmarkComparison {
    const percentile = this.calculatePercentile(benchmark, value);
    const status = this.determineStatus(percentile);
    const suggestions = this.generateSuggestions(benchmark.metric_name, status, value, benchmark);

    const isLowerBetter = benchmark.metric_name.toLowerCase().includes('churn') ||
                          benchmark.metric_name.toLowerCase().includes('cac') ||
                          benchmark.metric_name.toLowerCase().includes('payback');

    return {
      metric_name: benchmark.metric_name,
      your_value: value,
      percentile,
      status,
      gap_to_median: isLowerBetter ? benchmark.median - value : value - benchmark.median,
      gap_to_top_quartile: isLowerBetter ? benchmark.percentile_75 - value : value - benchmark.percentile_75,
      improvement_suggestions: suggestions,
    };
  }

  private calculatePercentile(benchmark: Benchmark, value: number): number {
    const isLowerBetter = benchmark.metric_name.toLowerCase().includes('churn') ||
                          benchmark.metric_name.toLowerCase().includes('cac') ||
                          benchmark.metric_name.toLowerCase().includes('payback');

    const points = isLowerBetter
      ? [
          { percentile: 90, value: benchmark.percentile_90 },
          { percentile: 75, value: benchmark.percentile_75 },
          { percentile: 50, value: benchmark.median },
          { percentile: 25, value: benchmark.percentile_25 },
          { percentile: 10, value: benchmark.percentile_10 },
        ]
      : [
          { percentile: 10, value: benchmark.percentile_10 },
          { percentile: 25, value: benchmark.percentile_25 },
          { percentile: 50, value: benchmark.median },
          { percentile: 75, value: benchmark.percentile_75 },
          { percentile: 90, value: benchmark.percentile_90 },
        ];

    for (let i = 0; i < points.length - 1; i++) {
      if (value <= points[i + 1].value && value >= points[i].value) {
        const range = points[i + 1].value - points[i].value;
        const position = value - points[i].value;
        const percentileRange = points[i + 1].percentile - points[i].percentile;
        return points[i].percentile + (position / range) * percentileRange;
      }
    }

    if (value < points[0].value) return isLowerBetter ? 95 : 5;
    return isLowerBetter ? 5 : 95;
  }

  private determineStatus(percentile: number): BenchmarkComparison['status'] {
    if (percentile >= 75) return 'top_performer';
    if (percentile >= 50) return 'above_average';
    if (percentile >= 25) return 'average';
    return 'below_average';
  }

  private generateSuggestions(
    metricName: string,
    status: string,
    value: number,
    benchmark: Benchmark
  ): string[] {
    if (status === 'top_performer') {
      return ['Maintain current performance', 'Document and share best practices'];
    }

    const suggestions: string[] = [];
    const metricLower = metricName.toLowerCase();

    if (metricLower.includes('churn')) {
      suggestions.push('Implement customer health scoring');
      suggestions.push('Create proactive outreach program for at-risk customers');
      suggestions.push('Improve onboarding to increase time-to-value');
    } else if (metricLower.includes('growth')) {
      suggestions.push('Optimize top-of-funnel acquisition');
      suggestions.push('Implement expansion revenue strategies');
      suggestions.push('Analyze and replicate high-growth cohorts');
    } else if (metricLower.includes('conversion')) {
      suggestions.push('A/B test checkout flow');
      suggestions.push('Add social proof and trust signals');
      suggestions.push('Reduce friction in signup process');
    } else if (metricLower.includes('cac') || metricLower.includes('payback')) {
      suggestions.push('Optimize marketing channel mix');
      suggestions.push('Improve lead qualification');
      suggestions.push('Increase average contract value');
    }

    return suggestions.slice(0, 3);
  }

  private generatePriorityActions(comparisons: BenchmarkComparison[]): string[] {
    const actions: string[] = [];

    const worstMetrics = comparisons
      .filter(c => c.status === 'below_average')
      .sort((a, b) => a.percentile - b.percentile);

    worstMetrics.slice(0, 2).forEach(metric => {
      actions.push(`Priority: Improve ${metric.metric_name} (currently ${metric.percentile}th percentile)`);
    });

    const bestMetrics = comparisons
      .filter(c => c.status === 'top_performer')
      .slice(0, 1);

    bestMetrics.forEach(metric => {
      actions.push(`Leverage strength in ${metric.metric_name} for competitive advantage`);
    });

    return actions;
  }

  getBenchmarkSet(industry: string, stage: string): BenchmarkSet | undefined {
    return this.benchmarkSets.find(
      bs => bs.industry.toLowerCase() === industry.toLowerCase() &&
            bs.stage.toLowerCase() === stage.toLowerCase()
    );
  }

  getAvailableIndustries(): string[] {
    return [...new Set(this.benchmarkSets.map(bs => bs.industry))];
  }

  getAvailableStages(industry: string): string[] {
    return this.benchmarkSets
      .filter(bs => bs.industry.toLowerCase() === industry.toLowerCase())
      .map(bs => bs.stage);
  }
}

export const benchmarkEngineService = new BenchmarkEngineService();
