// Growth Blueprint Engine Types

export type BusinessStage = 'idea' | 'early' | 'growth' | 'scaling' | 'mature';

export type BottleneckCategory = 
  | 'product_market_fit'
  | 'lead_generation'
  | 'sales_conversion'
  | 'operations'
  | 'team'
  | 'capital'
  | 'market_position'
  | 'retention';

export type LeverageType = 'quick_win' | 'strategic' | 'foundational' | 'moonshot';

export interface BusinessIntake {
  id: string;
  client_id: string;
  revenue_monthly: number;
  revenue_trend: 'growing' | 'stable' | 'declining';
  team_size: number;
  industry: string;
  business_model: string;
  primary_channel: string;
  customer_count: number;
  churn_rate?: number;
  cash_runway_months?: number;
  main_challenges: string[];
  goals_90_day: string[];
  created_at: string;
}

export interface StageClassification {
  stage: BusinessStage;
  confidence: number;
  indicators: string[];
  typical_challenges: string[];
  next_stage_requirements: string[];
}

export interface Bottleneck {
  id: string;
  category: BottleneckCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact_score: number;
  evidence: string[];
  recommended_actions: string[];
}

export interface LeveragePoint {
  id: string;
  type: LeverageType;
  title: string;
  description: string;
  impact_potential: number;
  effort_required: 'low' | 'medium' | 'high';
  time_to_impact_days: number;
  dependencies: string[];
  resources_needed: string[];
}

export interface RoadmapMilestone {
  id: string;
  week: number;
  title: string;
  objectives: string[];
  key_actions: string[];
  success_metrics: string[];
  dependencies: string[];
}

export interface GrowthRoadmap {
  id: string;
  client_id: string;
  stage: BusinessStage;
  primary_bottleneck: Bottleneck;
  leverage_points: LeveragePoint[];
  milestones: RoadmapMilestone[];
  things_to_ignore: string[];
  risk_factors: string[];
  success_probability: number;
  created_at: string;
}

export interface ExecutionPriority {
  id: string;
  rank: number;
  action: string;
  rationale: string;
  expected_outcome: string;
  blocking_factors: string[];
  due_date?: string;
}

export interface KPITarget {
  metric: string;
  current_value: number;
  target_value: number;
  target_date: string;
  tracking_frequency: 'daily' | 'weekly' | 'monthly';
  leading_indicators: string[];
}