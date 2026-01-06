-- =====================================================
-- WORLD-CLASS REVENUE INTELLIGENCE PLATFORM SCHEMA
-- 10 Advanced Layers for Structural Advantage
-- =====================================================

-- ===========================================
-- 1. REVENUE GOVERNOR LAYER
-- Approves/blocks strategies based on long-term impact
-- ===========================================
CREATE TABLE public.revenue_governance_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL DEFAULT 'pricing_discipline', -- pricing_discipline, margin_protection, market_positioning, sustainability
  condition_logic JSONB NOT NULL DEFAULT '{}', -- e.g., {"min_margin": 0.4, "max_discount": 0.15}
  enforcement_level TEXT NOT NULL DEFAULT 'warn', -- warn, block, require_approval
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.strategy_governance_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  strategy_description TEXT NOT NULL,
  strategy_type TEXT NOT NULL, -- pricing, funnel, campaign, offer, partnership
  projected_short_term_revenue NUMERIC,
  projected_long_term_impact NUMERIC, -- negative means harmful
  pricing_power_impact TEXT, -- increase, decrease, neutral
  governance_decision TEXT NOT NULL DEFAULT 'pending', -- approved, blocked, modified, pending
  governance_reasoning TEXT,
  rule_id UUID REFERENCES public.revenue_governance_rules(id),
  override_by UUID, -- user who overrode
  override_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===========================================
-- 2. ECONOMIC DIGITAL TWIN
-- Simulates entire business economy continuously
-- ===========================================
CREATE TABLE public.business_digital_twin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  revenue_streams JSONB NOT NULL DEFAULT '[]', -- [{name, mrr, growth_rate, churn_rate}]
  demand_metrics JSONB NOT NULL DEFAULT '{}', -- {pipeline_value, conversion_rate, lead_velocity}
  capacity_metrics JSONB NOT NULL DEFAULT '{}', -- {utilization, available_hours, bottlenecks}
  pricing_metrics JSONB NOT NULL DEFAULT '{}', -- {avg_deal_size, price_elasticity, discount_frequency}
  burn_metrics JSONB NOT NULL DEFAULT '{}', -- {monthly_burn, runway_months, break_even_date}
  risk_factors JSONB NOT NULL DEFAULT '[]', -- [{risk, probability, impact, mitigation}]
  health_score NUMERIC DEFAULT 0, -- 0-100 composite score
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, snapshot_date)
);

CREATE TABLE public.future_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  twin_snapshot_id UUID REFERENCES public.business_digital_twin(id),
  simulation_name TEXT NOT NULL,
  scenario_type TEXT NOT NULL, -- base_case, optimistic, pessimistic, custom
  strategy_changes JSONB NOT NULL DEFAULT '{}', -- what changes to test
  projected_outcomes JSONB NOT NULL DEFAULT '{}', -- revenue, margin, runway at T+3,6,12 months
  probability_score NUMERIC, -- likelihood of this outcome
  recommended BOOLEAN DEFAULT false,
  simulated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===========================================
-- 3. ARBITRAGE DETECTION ENGINE
-- Finds pricing inefficiencies and demand mismatches
-- ===========================================
CREATE TABLE public.arbitrage_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  opportunity_type TEXT NOT NULL, -- pricing_gap, demand_mismatch, skill_underpricing, attention_mispricing, service_gap
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  current_state JSONB NOT NULL DEFAULT '{}', -- what exists now
  optimal_state JSONB NOT NULL DEFAULT '{}', -- what should exist
  estimated_uplift_percent NUMERIC,
  estimated_uplift_amount NUMERIC,
  confidence_score NUMERIC, -- 0-100
  evidence JSONB NOT NULL DEFAULT '[]', -- data points supporting this
  action_required TEXT,
  status TEXT NOT NULL DEFAULT 'detected', -- detected, analyzing, actionable, captured, dismissed
  captured_value NUMERIC, -- actual value realized
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  actioned_at TIMESTAMP WITH TIME ZONE
);

-- ===========================================
-- 4. REVENUE OS & DAILY BRIEF
-- Default operating system for earning
-- ===========================================
CREATE TABLE public.daily_briefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  executive_summary TEXT,
  priority_decisions JSONB NOT NULL DEFAULT '[]', -- [{decision, urgency, impact, deadline}]
  revenue_alerts JSONB NOT NULL DEFAULT '[]', -- critical revenue events
  market_signals JSONB NOT NULL DEFAULT '[]', -- external signals to act on
  pending_approvals JSONB NOT NULL DEFAULT '[]', -- items needing approval
  recommended_focus TEXT, -- what to focus on today
  time_allocation JSONB NOT NULL DEFAULT '{}', -- recommended time split
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  acted_on BOOLEAN DEFAULT false,
  UNIQUE(organization_id, user_id, brief_date)
);

CREATE TABLE public.os_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  brief_time TIME DEFAULT '08:00:00', -- when to generate daily brief
  brief_channel TEXT DEFAULT 'in_app', -- in_app, email, slack
  decision_delegation_level TEXT DEFAULT 'advisor', -- advisor, operator, autopilot
  focus_areas JSONB NOT NULL DEFAULT '[]', -- revenue, growth, efficiency, risk
  notification_preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- ===========================================
-- 5. SUCCESS TAX ECOSYSTEM
-- Monetize the success ecosystem via referrals
-- ===========================================
CREATE TABLE public.ecosystem_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_name TEXT NOT NULL,
  partner_type TEXT NOT NULL, -- tool, agency, consultant, platform, service
  category TEXT NOT NULL, -- marketing, sales, operations, finance, legal
  description TEXT,
  referral_commission_percent NUMERIC DEFAULT 0,
  rev_share_percent NUMERIC DEFAULT 0,
  affiliate_link TEXT,
  integration_available BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  avg_rating NUMERIC,
  total_referrals INTEGER DEFAULT 0,
  total_revenue_generated NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.ecosystem_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.ecosystem_partners(id),
  recommendation_type TEXT NOT NULL, -- tool, partner, hire, agency
  recommendation_reason TEXT NOT NULL,
  business_context JSONB NOT NULL DEFAULT '{}', -- why this is relevant now
  estimated_roi TEXT,
  urgency TEXT DEFAULT 'low', -- low, medium, high, critical
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined, converted
  click_through_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  commission_earned NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.success_tax_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES public.ecosystem_recommendations(id),
  partner_id UUID REFERENCES public.ecosystem_partners(id),
  revenue_type TEXT NOT NULL, -- referral_fee, rev_share, platform_fee
  gross_amount NUMERIC NOT NULL,
  platform_share NUMERIC NOT NULL,
  partner_share NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, paid
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===========================================
-- 6. ECONOMIC STATUS SIGNALING
-- Operator grades, certification, credibility scores
-- ===========================================
CREATE TABLE public.operator_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  maturity_level TEXT NOT NULL DEFAULT 'emerging', -- emerging, developing, established, advanced, elite
  maturity_score NUMERIC DEFAULT 0, -- 0-100 composite
  operator_grade TEXT DEFAULT 'C', -- A+, A, B, C, D
  execution_credibility_score NUMERIC DEFAULT 0, -- 0-100
  revenue_percentile NUMERIC, -- compared to similar operators
  decision_quality_score NUMERIC, -- accuracy of decisions
  total_verified_revenue NUMERIC DEFAULT 0,
  verified_wins JSONB NOT NULL DEFAULT '[]', -- [{achievement, date, proof}]
  badges JSONB NOT NULL DEFAULT '[]', -- [{badge, earned_at, criteria}]
  public_profile_enabled BOOLEAN DEFAULT false,
  profile_visibility TEXT DEFAULT 'private', -- private, selective, public
  last_assessment_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE public.status_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.operator_profiles(id),
  assessment_period_start DATE NOT NULL,
  assessment_period_end DATE NOT NULL,
  metrics_evaluated JSONB NOT NULL DEFAULT '{}',
  previous_grade TEXT,
  new_grade TEXT,
  grade_change_reason TEXT,
  recommendations JSONB NOT NULL DEFAULT '[]',
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===========================================
-- 7. MARKET SHAPING ENGINE
-- Redefine categories, set standards, anchor pricing
-- ===========================================
CREATE TABLE public.market_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  current_position TEXT, -- leader, challenger, follower, niche
  target_position TEXT,
  positioning_strategy TEXT, -- category_creation, premium_anchor, value_reframe, standard_setting
  unique_mechanisms JSONB NOT NULL DEFAULT '[]', -- proprietary terms, methods, frameworks
  price_anchors JSONB NOT NULL DEFAULT '{}', -- {floor, target, ceiling, competitor_avg}
  market_narrative TEXT, -- the story we're telling
  differentiation_score NUMERIC, -- 0-100 how differentiated
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.category_moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.market_positions(id),
  move_type TEXT NOT NULL, -- new_term, pricing_anchor, standard_definition, narrative_shift
  move_description TEXT NOT NULL,
  intended_effect TEXT,
  execution_status TEXT DEFAULT 'planned', -- planned, executing, complete, abandoned
  market_response JSONB DEFAULT '{}', -- tracked reactions
  impact_assessment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- ===========================================
-- 8. DATA FLYWHEEL
-- Proprietary decision→action→outcome→regret data
-- ===========================================
CREATE TABLE public.decision_action_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  decision_id UUID REFERENCES public.decisions(id),
  action_id UUID REFERENCES public.actions(id),
  decision_context JSONB NOT NULL DEFAULT '{}', -- situation when decision was made
  decision_chosen TEXT NOT NULL,
  alternatives_rejected JSONB NOT NULL DEFAULT '[]',
  predicted_outcome JSONB NOT NULL DEFAULT '{}',
  actual_outcome JSONB DEFAULT '{}',
  outcome_delta JSONB DEFAULT '{}', -- predicted vs actual
  regret_score NUMERIC, -- 0-100, higher = more regret
  regret_reason TEXT,
  learning_extracted TEXT,
  similar_future_decisions JSONB DEFAULT '[]', -- IDs of decisions this informed
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  outcome_recorded_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.pattern_learnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID, -- NULL = global learning
  pattern_type TEXT NOT NULL, -- success, failure, neutral
  context_signature JSONB NOT NULL DEFAULT '{}', -- conditions when this applies
  pattern_description TEXT NOT NULL,
  success_rate NUMERIC, -- 0-100
  sample_size INTEGER DEFAULT 0,
  confidence_level NUMERIC, -- 0-100
  recommended_action TEXT,
  counter_indicators JSONB DEFAULT '[]', -- when NOT to apply this
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_validated_at TIMESTAMP WITH TIME ZONE
);

-- ===========================================
-- 9. AUTO-PRODUCTIZATION ENGINE
-- Detect repeatable success, package into offers
-- ===========================================
CREATE TABLE public.success_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pattern_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL, -- process, methodology, framework, system
  description TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  inputs_required JSONB DEFAULT '[]',
  outputs_delivered JSONB DEFAULT '[]',
  success_metrics JSONB DEFAULT '{}',
  repeatability_score NUMERIC, -- 0-100
  times_executed INTEGER DEFAULT 0,
  avg_outcome_value NUMERIC,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.auto_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_pattern_id UUID REFERENCES public.success_patterns(id),
  product_type TEXT NOT NULL, -- offer, playbook, diagnostic, course, template
  product_name TEXT NOT NULL,
  product_description TEXT,
  pricing_model TEXT, -- one_time, subscription, usage_based, rev_share
  suggested_price NUMERIC,
  actual_price NUMERIC,
  sales_page_content JSONB DEFAULT '{}',
  delivery_mechanism TEXT, -- automated, manual, hybrid
  status TEXT NOT NULL DEFAULT 'draft', -- draft, ready, launched, retired
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  platform_fee_percent NUMERIC DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  launched_at TIMESTAMP WITH TIME ZONE
);

-- ===========================================
-- 10. CAPITAL ALLOCATOR
-- Govern where time/money/attention goes
-- ===========================================
CREATE TABLE public.capital_allocation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- time, money, attention, energy
  allocation_category TEXT NOT NULL, -- revenue_generation, skill_building, operations, marketing, product
  min_allocation_percent NUMERIC DEFAULT 0,
  max_allocation_percent NUMERIC DEFAULT 100,
  target_allocation_percent NUMERIC,
  priority INTEGER DEFAULT 1, -- lower = higher priority
  rationale TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.capital_allocation_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_allocation JSONB NOT NULL DEFAULT '{}', -- actual time spent by category
  money_allocation JSONB NOT NULL DEFAULT '{}', -- actual spend by category
  attention_allocation JSONB NOT NULL DEFAULT '{}', -- focus distribution
  roi_by_category JSONB NOT NULL DEFAULT '{}', -- returns per category
  efficiency_score NUMERIC, -- overall allocation efficiency 0-100
  recommendations JSONB DEFAULT '[]', -- suggested reallocation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, snapshot_date)
);

CREATE TABLE public.allocation_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL, -- time_block, budget_request, focus_shift, resource_request
  request_description TEXT NOT NULL,
  requested_amount NUMERIC,
  resource_type TEXT NOT NULL,
  category TEXT NOT NULL,
  ai_recommendation TEXT, -- approve, deny, modify
  ai_reasoning TEXT,
  current_allocation_state JSONB DEFAULT '{}',
  projected_impact JSONB DEFAULT '{}',
  decision TEXT DEFAULT 'pending', -- pending, approved, denied, deferred
  decided_by TEXT, -- ai, user, hybrid
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  decided_at TIMESTAMP WITH TIME ZONE
);

-- ===========================================
-- ENABLE RLS ON ALL NEW TABLES
-- ===========================================
ALTER TABLE public.revenue_governance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_governance_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_digital_twin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.future_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbitrage_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecosystem_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecosystem_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_tax_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_action_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capital_allocation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capital_allocation_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocation_decisions ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- Revenue Governance Rules
CREATE POLICY "Users can manage their org governance rules" ON public.revenue_governance_rules
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Strategy Governance Decisions
CREATE POLICY "Users can view their org governance decisions" ON public.strategy_governance_decisions
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Business Digital Twin
CREATE POLICY "Users can view their org digital twin" ON public.business_digital_twin
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Future Simulations
CREATE POLICY "Users can manage their org simulations" ON public.future_simulations
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Arbitrage Opportunities
CREATE POLICY "Users can view their org arbitrage opportunities" ON public.arbitrage_opportunities
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Daily Briefs
CREATE POLICY "Users can view their own briefs" ON public.daily_briefs
  FOR ALL USING (user_id = auth.uid() OR organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- OS Preferences
CREATE POLICY "Users can manage their OS preferences" ON public.os_preferences
  FOR ALL USING (user_id = auth.uid());

-- Ecosystem Partners (public read, admin write)
CREATE POLICY "Anyone can view verified partners" ON public.ecosystem_partners
  FOR SELECT USING (is_verified = true);

-- Ecosystem Recommendations
CREATE POLICY "Users can view their org recommendations" ON public.ecosystem_recommendations
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Success Tax Ledger
CREATE POLICY "Users can view their org ledger" ON public.success_tax_ledger
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Operator Profiles
CREATE POLICY "Users can manage their profile" ON public.operator_profiles
  FOR ALL USING (user_id = auth.uid() OR (public_profile_enabled = true AND profile_visibility = 'public'));

-- Status Assessments
CREATE POLICY "Users can view their org assessments" ON public.status_assessments
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Market Positions
CREATE POLICY "Users can manage their market positions" ON public.market_positions
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Category Moves
CREATE POLICY "Users can manage their category moves" ON public.category_moves
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Decision Action Outcomes
CREATE POLICY "Users can view their org outcomes" ON public.decision_action_outcomes
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Pattern Learnings
CREATE POLICY "Users can view patterns" ON public.pattern_learnings
  FOR SELECT USING (organization_id IS NULL OR organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Success Patterns
CREATE POLICY "Users can manage their success patterns" ON public.success_patterns
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Auto Products
CREATE POLICY "Users can manage their auto products" ON public.auto_products
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Capital Allocation Rules
CREATE POLICY "Users can manage their allocation rules" ON public.capital_allocation_rules
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Capital Allocation Snapshots
CREATE POLICY "Users can view their allocation snapshots" ON public.capital_allocation_snapshots
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Allocation Decisions
CREATE POLICY "Users can manage their allocation decisions" ON public.allocation_decisions
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX idx_governance_rules_org ON public.revenue_governance_rules(organization_id);
CREATE INDEX idx_governance_decisions_org ON public.strategy_governance_decisions(organization_id);
CREATE INDEX idx_digital_twin_org_date ON public.business_digital_twin(organization_id, snapshot_date);
CREATE INDEX idx_simulations_org ON public.future_simulations(organization_id);
CREATE INDEX idx_arbitrage_org_status ON public.arbitrage_opportunities(organization_id, status);
CREATE INDEX idx_daily_briefs_user_date ON public.daily_briefs(user_id, brief_date);
CREATE INDEX idx_ecosystem_rec_org ON public.ecosystem_recommendations(organization_id);
CREATE INDEX idx_operator_profiles_user ON public.operator_profiles(user_id);
CREATE INDEX idx_dao_org ON public.decision_action_outcomes(organization_id);
CREATE INDEX idx_success_patterns_org ON public.success_patterns(organization_id);
CREATE INDEX idx_auto_products_org ON public.auto_products(organization_id);
CREATE INDEX idx_allocation_snapshots_org_date ON public.capital_allocation_snapshots(organization_id, snapshot_date);