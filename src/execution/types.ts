// Execution Engine Types

export type SystemType = 'sales' | 'marketing' | 'operations' | 'finance' | 'hr' | 'product' | 'customer_success';
export type AutomationCategory = 'workflow' | 'communication' | 'data' | 'reporting' | 'integration';
export type TeamRole = 'founder' | 'executive' | 'manager' | 'specialist' | 'coordinator';

export interface BusinessSystem {
  id: string;
  name: string;
  type: SystemType;
  description: string;
  inputs: string[];
  outputs: string[];
  owner?: string;
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'ad_hoc';
  dependencies: string[];
  tools_used: string[];
  documented: boolean;
  maturity: 'ad_hoc' | 'defined' | 'managed' | 'optimized';
}

export interface ProcessStep {
  id: string;
  order: number;
  name: string;
  description: string;
  responsible: TeamRole;
  time_estimate_minutes: number;
  inputs: string[];
  outputs: string[];
  decision_points: string[];
  potential_bottlenecks: string[];
}

export interface Process {
  id: string;
  name: string;
  system_id: string;
  steps: ProcessStep[];
  total_time_minutes: number;
  automation_potential: number;
  improvement_opportunities: string[];
}

export interface AutomationOpportunity {
  id: string;
  category: AutomationCategory;
  process_id: string;
  title: string;
  description: string;
  current_time_hours_monthly: number;
  potential_savings_hours: number;
  implementation_effort: 'low' | 'medium' | 'high';
  recommended_tools: string[];
  roi_months: number;
  priority_score: number;
}

export interface DelegationItem {
  id: string;
  task: string;
  current_owner: TeamRole;
  recommended_owner: TeamRole;
  reason: string;
  training_required: string[];
  risk_if_delegated: 'low' | 'medium' | 'high';
  delegation_steps: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  capacity_hours_weekly: number;
  current_utilization: number;
  skills: string[];
  growth_areas: string[];
}

export interface TeamCapacityAnalysis {
  total_capacity_hours: number;
  total_utilized_hours: number;
  overall_utilization: number;
  bottleneck_roles: TeamRole[];
  underutilized_roles: TeamRole[];
  hiring_recommendations: {
    role: TeamRole;
    urgency: 'low' | 'medium' | 'high';
    reason: string;
  }[];
}

export interface ScaleReadinessAssessment {
  overall_score: number;
  category_scores: {
    category: string;
    score: number;
    gaps: string[];
    recommendations: string[];
  }[];
  blockers: string[];
  enablers: string[];
  timeline_to_ready_months: number;
}
