-- =====================================================
-- META-PRINCIPLE SYSTEMS: Failure Prevention + Asymmetric Upside
-- =====================================================

-- 1. FAILURE MODE ELIMINATION ENGINE
CREATE TABLE public.failure_modes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- strategic, execution, market, founder, capital, operational
  title TEXT NOT NULL,
  description TEXT,
  likelihood_score INTEGER CHECK (likelihood_score >= 1 AND likelihood_score <= 10),
  impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
  combined_risk_score NUMERIC GENERATED ALWAYS AS (likelihood_score * impact_score) STORED,
  time_horizon_months INTEGER DEFAULT 12,
  mitigation_required BOOLEAN DEFAULT true,
  mitigation_plan TEXT,
  mitigation_status TEXT DEFAULT 'pending', -- pending, in_progress, mitigated, accepted
  blocks_growth_actions BOOLEAN DEFAULT false,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  mitigated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. STRATEGIC FRICTION ENGINE
CREATE TABLE public.strategic_friction_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL, -- launch_block, scaling_block, spending_block, hiring_block
  target_action TEXT NOT NULL,
  reason TEXT NOT NULL,
  prerequisites JSONB DEFAULT '[]', -- What must be done first
  prerequisite_status JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'warning', -- info, warning, hard_block
  is_active BOOLEAN DEFAULT true,
  override_allowed BOOLEAN DEFAULT true,
  overridden_at TIMESTAMP WITH TIME ZONE,
  overridden_by UUID,
  override_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 3. MARKET TIMING & CYCLE INTELLIGENCE
CREATE TABLE public.market_cycle_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL,
  market_phase TEXT NOT NULL, -- growth, consolidation, harvest, pivot, expansion
  phase_confidence NUMERIC,
  demand_velocity_score NUMERIC,
  pricing_compression_score NUMERIC,
  competitor_intensity_score NUMERIC,
  sentiment_score NUMERIC,
  recommended_strategy TEXT,
  timing_signals JSONB DEFAULT '[]',
  macro_factors JSONB DEFAULT '{}',
  ai_recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, analysis_date)
);

-- 4. ECONOMIC MOAT DESIGNER
CREATE TABLE public.economic_moats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  moat_type TEXT NOT NULL, -- pricing_power, data_lock_in, workflow_dependency, trust_asymmetry, category_ownership, network_effects, brand_equity
  title TEXT NOT NULL,
  description TEXT,
  current_strength INTEGER CHECK (current_strength >= 0 AND current_strength <= 100),
  target_strength INTEGER CHECK (target_strength >= 0 AND target_strength <= 100),
  time_to_build_months INTEGER,
  switching_cost_score INTEGER,
  copyability_score INTEGER, -- 1 = easily copied, 10 = impossible to copy
  compounds_with_time BOOLEAN DEFAULT true,
  building_actions JSONB DEFAULT '[]',
  progress_percent INTEGER DEFAULT 0,
  status TEXT DEFAULT 'identified', -- identified, building, established, eroding
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. DECISION QUALITY SCORING
CREATE TABLE public.decision_quality_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  decision_id UUID REFERENCES public.decisions(id),
  decision_description TEXT NOT NULL,
  rationale_quality_score INTEGER, -- 1-10, how sound was the reasoning
  information_completeness INTEGER, -- 1-10, did we have enough info
  alternatives_considered INTEGER, -- how many options evaluated
  reversibility_score INTEGER, -- 1-10, how reversible
  outcome_prediction TEXT, -- what we predicted
  actual_outcome TEXT, -- what happened
  outcome_delta NUMERIC, -- difference from prediction
  regret_score INTEGER, -- 1-10, would we do it again?
  lesson_learned TEXT,
  decision_date TIMESTAMP WITH TIME ZONE NOT NULL,
  outcome_measured_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. OPPORTUNITY COST TRACKING
CREATE TABLE public.opportunity_cost_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- meeting, project, client_work, admin, marketing
  activity_description TEXT NOT NULL,
  time_spent_hours NUMERIC NOT NULL,
  hourly_value NUMERIC, -- Your revenue rate
  direct_cost NUMERIC DEFAULT 0,
  opportunity_cost NUMERIC, -- What you could have earned
  alternative_activity TEXT, -- What you could have done
  alternative_value NUMERIC, -- Value of alternative
  cost_delta NUMERIC GENERATED ALWAYS AS (COALESCE(alternative_value, 0) - COALESCE(opportunity_cost, 0)) STORED,
  was_worth_it BOOLEAN,
  ai_assessment TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.auto_declined_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT NOT NULL,
  estimated_opportunity_cost NUMERIC NOT NULL,
  reason_declined TEXT NOT NULL,
  alternative_suggested TEXT,
  auto_declined BOOLEAN DEFAULT true,
  user_override BOOLEAN DEFAULT false,
  declined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. ORGANIZATIONAL INTELLIGENCE
CREATE TABLE public.org_capacity_model (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  team_size INTEGER DEFAULT 1,
  total_capacity_hours NUMERIC,
  utilized_hours NUMERIC,
  utilization_rate NUMERIC,
  decision_latency_days NUMERIC, -- How long decisions take
  execution_velocity_score NUMERIC, -- How fast things get done
  role_overlap_issues JSONB DEFAULT '[]',
  bottlenecks JSONB DEFAULT '[]',
  automation_opportunities JSONB DEFAULT '[]',
  hiring_recommendations JSONB DEFAULT '[]',
  process_improvements JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, snapshot_date)
);

-- 8. TRUST & REPUTATION CAPITAL
CREATE TABLE public.trust_capital_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stakeholder_type TEXT NOT NULL, -- client, partner, employee, market
  stakeholder_id TEXT,
  stakeholder_name TEXT,
  promise_made TEXT,
  promise_date TIMESTAMP WITH TIME ZONE,
  delivery_deadline TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivery_status TEXT DEFAULT 'pending', -- pending, delivered_early, delivered_on_time, delivered_late, broken
  trust_impact_score INTEGER, -- -10 to +10
  cumulative_trust_score NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.reputation_risk_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  risk_type TEXT NOT NULL, -- client_damage, brand_damage, pricing_power_loss, referral_damage
  source TEXT, -- What triggered the risk
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  potential_revenue_impact NUMERIC,
  recommended_action TEXT,
  status TEXT DEFAULT 'active', -- active, mitigated, accepted, escalated
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 9. SECOND-ORDER CONSEQUENCE TRACKING
CREATE TABLE public.consequence_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  decision_id UUID REFERENCES public.decisions(id),
  action_description TEXT NOT NULL,
  first_order_effects JSONB DEFAULT '[]',
  second_order_effects JSONB DEFAULT '[]',
  third_order_effects JSONB DEFAULT '[]',
  time_horizon_months INTEGER DEFAULT 12,
  net_expected_value NUMERIC,
  confidence_level NUMERIC,
  hidden_costs JSONB DEFAULT '[]',
  delayed_benefits JSONB DEFAULT '[]',
  ai_recommendation TEXT,
  proceed_recommended BOOLEAN,
  simulated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. BUSINESS IMMUNE SYSTEM
CREATE TABLE public.business_threats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  threat_type TEXT NOT NULL, -- bad_client, bad_deal, shiny_object, emotional_decision, scarcity_panic, scope_creep, underpricing
  source TEXT,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  auto_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  user_override BOOLEAN DEFAULT false,
  override_reason TEXT,
  potential_damage NUMERIC,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_outcome TEXT
);

CREATE TABLE public.immune_system_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- client_filter, deal_filter, decision_filter, spending_filter
  conditions JSONB NOT NULL, -- What triggers the rule
  action TEXT NOT NULL, -- block, warn, escalate, auto_decline
  is_active BOOLEAN DEFAULT true,
  times_triggered INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. NO-INPUT MODE STATE
CREATE TABLE public.passive_mode_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  last_observation_at TIMESTAMP WITH TIME ZONE,
  observations_today INTEGER DEFAULT 0,
  decisions_prepared INTEGER DEFAULT 0,
  risks_flagged INTEGER DEFAULT 0,
  opportunities_queued INTEGER DEFAULT 0,
  actions_auto_executed INTEGER DEFAULT 0,
  user_interventions_required INTEGER DEFAULT 0,
  daily_summary TEXT,
  alert_threshold TEXT DEFAULT 'critical_only', -- all, important, critical_only, none
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- ENABLE RLS
ALTER TABLE public.failure_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_friction_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_cycle_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_moats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_cost_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_declined_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_capacity_model ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_capital_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consequence_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immune_system_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passive_mode_state ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users manage their org failure modes" ON public.failure_modes FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users manage their org friction blocks" ON public.strategic_friction_blocks FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users manage their org market analysis" ON public.market_cycle_analysis FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users manage their org moats" ON public.economic_moats FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users manage their org decision quality" ON public.decision_quality_scores FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users manage their org opportunity cost" ON public.opportunity_cost_log FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users manage their org auto declined" ON public.auto_declined_activities FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users manage their org capacity" ON public.org_capacity_model FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users manage their org trust capital" ON public.trust_capital_ledger FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users manage their org reputation risks" ON public.reputation_risk_alerts FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users manage their org consequence sims" ON public.consequence_simulations FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users manage their org threats" ON public.business_threats FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users manage their org immune rules" ON public.immune_system_rules FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users manage their org passive mode" ON public.passive_mode_state FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- INDEXES
CREATE INDEX idx_failure_modes_org ON public.failure_modes(organization_id);
CREATE INDEX idx_failure_modes_risk ON public.failure_modes(organization_id, combined_risk_score DESC);
CREATE INDEX idx_friction_blocks_active ON public.strategic_friction_blocks(organization_id, is_active);
CREATE INDEX idx_market_cycle_org_date ON public.market_cycle_analysis(organization_id, analysis_date DESC);
CREATE INDEX idx_moats_org ON public.economic_moats(organization_id);
CREATE INDEX idx_threats_active ON public.business_threats(organization_id, resolved_at NULLS FIRST);