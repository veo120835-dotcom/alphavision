// Cross-Business Learning Network Types

export interface AnonymizedPattern {
  id: string;
  pattern_type: 'strategy' | 'tactic' | 'process' | 'metric' | 'outcome';
  industry?: string;
  business_stage?: string;
  pattern_description: string;
  success_rate: number;
  sample_size: number;
  confidence_level: number;
  context_conditions: string[];
  anti_patterns: string[];
  created_at: string;
  last_validated: string;
}

export interface LeverageInsight {
  id: string;
  source_industry: string;
  applicable_industries: string[];
  insight: string;
  leverage_mechanism: string;
  effort_to_apply: 'low' | 'medium' | 'high';
  expected_impact: 'minor' | 'moderate' | 'significant' | 'transformational';
  prerequisites: string[];
  implementation_steps: string[];
}

export interface Benchmark {
  id: string;
  metric_name: string;
  industry: string;
  business_stage: string;
  percentile_10: number;
  percentile_25: number;
  median: number;
  percentile_75: number;
  percentile_90: number;
  sample_size: number;
  last_updated: string;
}

export interface BenchmarkComparison {
  metric_name: string;
  your_value: number;
  percentile: number;
  status: 'below_average' | 'average' | 'above_average' | 'top_performer';
  gap_to_median: number;
  gap_to_top_quartile: number;
  improvement_suggestions: string[];
}

export interface BestPractice {
  id: string;
  category: string;
  title: string;
  description: string;
  supporting_data: string;
  adoption_rate: number;
  impact_score: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  time_to_implement_weeks: number;
  applicable_stages: string[];
  applicable_industries: string[];
  implementation_guide: string[];
}

export interface NetworkLearning {
  id: string;
  learning_type: 'pattern' | 'benchmark' | 'best_practice' | 'anti_pattern';
  content: string;
  source_count: number;
  validation_score: number;
  relevance_conditions: string[];
  expiry_date?: string;
}
