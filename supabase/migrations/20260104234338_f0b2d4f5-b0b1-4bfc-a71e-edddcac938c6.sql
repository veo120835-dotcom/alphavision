-- =====================================================
-- ELITE MONETIZATION LAYERS - 10x-100x Pricing Power
-- =====================================================

-- ===========================================
-- 1. DECISION INSURANCE LAYER
-- AI underwrites decisions with fee-backed guarantees
-- ===========================================
CREATE TABLE public.decision_insurance_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  decision_id UUID REFERENCES public.decisions(id),
  policy_type TEXT NOT NULL, -- revenue_guarantee, conversion_guarantee, risk_mitigation
  guarantee_description TEXT NOT NULL,
  guaranteed_metric TEXT NOT NULL, -- e.g., "revenue increase"
  guaranteed_threshold NUMERIC NOT NULL, -- e.g., 15 (meaning 15%)
  guarantee_period_days INTEGER NOT NULL DEFAULT 60,
  premium_fee NUMERIC NOT NULL,
  refund_percentage NUMERIC NOT NULL DEFAULT 100, -- % refunded if guarantee not met
  status TEXT NOT NULL DEFAULT 'active', -- active, succeeded, failed, refunded
  outcome_measured NUMERIC, -- actual outcome
  outcome_met BOOLEAN,
  measured_at TIMESTAMP WITH TIME ZONE,
  refund_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.decision_insurance_policies(id),
  claim_reason TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}',
  claim_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, denied, paid
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  denial_reason TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===========================================
-- 2. PRIORITY INTELLIGENCE ROUTING
-- Faster response, more compute, more simulations
-- ===========================================
CREATE TABLE public.priority_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  tier_level INTEGER NOT NULL, -- 1=standard, 2=priority, 3=elite
  response_sla_seconds INTEGER NOT NULL DEFAULT 30,
  max_simulations INTEGER NOT NULL DEFAULT 3,
  red_team_enabled BOOLEAN NOT NULL DEFAULT false,
  compute_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.organization_priority (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.priority_tiers(id),
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, cancelled
  UNIQUE(organization_id)
);

-- ===========================================
-- 3. PRIVATE DEAL FLOW ACCESS
-- Curated partnerships, investments, opportunities
-- ===========================================
CREATE TABLE public.deal_flow_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_type TEXT NOT NULL, -- partnership, acquisition, investment, talent, traffic_source
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  opportunity_value NUMERIC, -- potential value
  minimum_requirements JSONB DEFAULT '{}', -- who can access
  ai_score NUMERIC, -- relevance/quality score 0-100
  source TEXT, -- where this came from
  expires_at TIMESTAMP WITH TIME ZONE,
  is_exclusive BOOLEAN DEFAULT false,
  claimed_by UUID REFERENCES public.organizations(id),
  claimed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'available', -- available, claimed, closed, expired
  success_fee_percent NUMERIC DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_flow_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  access_tier TEXT NOT NULL DEFAULT 'basic', -- basic, premium, elite
  monthly_fee NUMERIC NOT NULL DEFAULT 0,
  deals_viewed INTEGER DEFAULT 0,
  deals_claimed INTEGER DEFAULT 0,
  total_deal_value NUMERIC DEFAULT 0, -- sum of closed deals
  success_fees_paid NUMERIC DEFAULT 0,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id)
);

-- ===========================================
-- 4. EXCLUSIVE BENCHMARKS & INDEXES
-- Private industry benchmarks from anonymized data
-- ===========================================
CREATE TABLE public.benchmark_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  data_points_required INTEGER DEFAULT 10,
  update_frequency TEXT DEFAULT 'weekly', -- daily, weekly, monthly
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.benchmark_data_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.benchmark_categories(id),
  organization_id UUID REFERENCES public.organizations(id), -- NULL = anonymized
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  industry TEXT,
  company_size TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.benchmark_indexes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.benchmark_categories(id),
  index_name TEXT NOT NULL,
  calculation_method TEXT NOT NULL, -- median, percentile_75, average
  current_value NUMERIC NOT NULL,
  previous_value NUMERIC,
  change_percent NUMERIC,
  sample_size INTEGER NOT NULL,
  confidence_level NUMERIC, -- statistical confidence
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, index_name)
);

CREATE TABLE public.benchmark_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'basic', -- basic, premium, enterprise
  categories_accessible TEXT[] DEFAULT '{}',
  monthly_fee NUMERIC DEFAULT 0,
  data_export_enabled BOOLEAN DEFAULT false,
  api_access_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- ===========================================
-- 5. EXECUTIVE SHADOW MODE
-- Shadow CEO/CFO/CRO that prepares decisions
-- ===========================================
CREATE TABLE public.executive_shadows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shadow_role TEXT NOT NULL, -- shadow_ceo, shadow_cfo, shadow_cro, shadow_coo
  is_active BOOLEAN NOT NULL DEFAULT true,
  monthly_fee NUMERIC NOT NULL DEFAULT 0,
  capabilities JSONB NOT NULL DEFAULT '[]',
  decision_authority_level TEXT DEFAULT 'prepare', -- prepare, recommend, execute
  last_briefing_at TIMESTAMP WITH TIME ZONE,
  total_decisions_prepared INTEGER DEFAULT 0,
  total_risks_flagged INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, shadow_role)
);

CREATE TABLE public.executive_briefings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shadow_id UUID NOT NULL REFERENCES public.executive_shadows(id),
  briefing_type TEXT NOT NULL, -- daily, weekly, strategic, crisis
  title TEXT NOT NULL,
  executive_summary TEXT NOT NULL,
  key_decisions JSONB NOT NULL DEFAULT '[]',
  risks_identified JSONB NOT NULL DEFAULT '[]',
  opportunities JSONB NOT NULL DEFAULT '[]',
  recommended_actions JSONB NOT NULL DEFAULT '[]',
  board_memo TEXT, -- if applicable
  status TEXT NOT NULL DEFAULT 'draft', -- draft, ready, delivered, actioned
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- ===========================================
-- 6. INNER CIRCLE / EARLY ACCESS
-- Exclusive tier with limited seats
-- ===========================================
CREATE TABLE public.inner_circle_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  max_seats INTEGER NOT NULL,
  current_seats INTEGER DEFAULT 0,
  annual_fee NUMERIC NOT NULL,
  benefits JSONB NOT NULL DEFAULT '[]',
  requirements JSONB DEFAULT '{}', -- min revenue, etc.
  is_invite_only BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.inner_circle_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.inner_circle_tiers(id),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, suspended, expired
  invited_by UUID,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  roadmap_influence_votes INTEGER DEFAULT 3,
  experiments_participated INTEGER DEFAULT 0,
  UNIQUE(organization_id, tier_id)
);

CREATE TABLE public.inner_circle_experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_name TEXT NOT NULL,
  description TEXT NOT NULL,
  hypothesis TEXT,
  status TEXT NOT NULL DEFAULT 'proposed', -- proposed, voting, active, complete
  min_participants INTEGER DEFAULT 5,
  current_participants INTEGER DEFAULT 0,
  results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ===========================================
-- 7. VETO REGISTRY (for Revenue Governor)
-- Track when AI blocks actions
-- ===========================================
CREATE TABLE public.veto_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  veto_type TEXT NOT NULL, -- discount, client, funnel, partnership, pricing
  action_blocked TEXT NOT NULL,
  reason TEXT NOT NULL,
  long_term_impact TEXT,
  pricing_power_protected NUMERIC, -- estimated value preserved
  override_requested BOOLEAN DEFAULT false,
  override_approved BOOLEAN DEFAULT false,
  override_by UUID,
  override_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===========================================
-- ENABLE RLS
-- ===========================================
ALTER TABLE public.decision_insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_priority ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_flow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_flow_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_indexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_shadows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inner_circle_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inner_circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inner_circle_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veto_registry ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES
-- ===========================================
CREATE POLICY "Users can view their org insurance policies" ON public.decision_insurance_policies
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their org insurance claims" ON public.insurance_claims
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view priority tiers" ON public.priority_tiers
  FOR SELECT USING (true);

CREATE POLICY "Users can view their org priority" ON public.organization_priority
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can view available deals" ON public.deal_flow_items
  FOR SELECT USING (status = 'available' OR claimed_by IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their deal access" ON public.deal_flow_access
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view benchmark categories" ON public.benchmark_categories
  FOR SELECT USING (true);

CREATE POLICY "Users with access can view benchmarks" ON public.benchmark_indexes
  FOR SELECT USING (true);

CREATE POLICY "Users can view their benchmark access" ON public.benchmark_access
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their executive shadows" ON public.executive_shadows
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their briefings" ON public.executive_briefings
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view inner circle tiers" ON public.inner_circle_tiers
  FOR SELECT USING (true);

CREATE POLICY "Users can view their membership" ON public.inner_circle_members
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Members can view experiments" ON public.inner_circle_experiments
  FOR SELECT USING (true);

CREATE POLICY "Users can view their vetoes" ON public.veto_registry
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Benchmark data points - only aggregated/anonymized access
CREATE POLICY "Users can submit their own data" ON public.benchmark_data_points
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- ===========================================
-- SEED DEFAULT PRIORITY TIERS
-- ===========================================
INSERT INTO public.priority_tiers (tier_name, tier_level, response_sla_seconds, max_simulations, red_team_enabled, compute_multiplier, monthly_price, features)
VALUES 
  ('Standard', 1, 30, 3, false, 1.0, 0, '["Basic AI responses", "Standard queue"]'),
  ('Priority', 2, 10, 10, true, 2.0, 500, '["10s SLA", "10 simulations", "Red-team analysis"]'),
  ('Elite Capital', 3, 5, 50, true, 5.0, 2500, '["5s SLA", "50 simulations", "Full red-team", "Dedicated compute"]');

-- ===========================================
-- SEED INNER CIRCLE TIER
-- ===========================================
INSERT INTO public.inner_circle_tiers (tier_name, max_seats, annual_fee, benefits, requirements, is_invite_only)
VALUES 
  ('Founders Circle', 50, 25000, '["Early feature access", "Roadmap influence", "Private experiments", "Direct founder access", "Annual summit invite"]', '{"min_annual_revenue": 100000}', true);

-- ===========================================
-- SEED BENCHMARK CATEGORIES
-- ===========================================
INSERT INTO public.benchmark_categories (category_name, description, is_premium)
VALUES 
  ('Pricing Power Index', 'Average price elasticity and premium positioning across industries', true),
  ('Conversion Benchmarks', 'Funnel conversion rates by industry and company size', false),
  ('Revenue Per Employee', 'Revenue efficiency metrics', true),
  ('Client Acquisition Cost', 'CAC benchmarks across channels', false),
  ('Margin Benchmarks', 'Gross and net margin by business model', true);

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX idx_insurance_policies_org ON public.decision_insurance_policies(organization_id);
CREATE INDEX idx_insurance_claims_policy ON public.insurance_claims(policy_id);
CREATE INDEX idx_deal_flow_status ON public.deal_flow_items(status);
CREATE INDEX idx_benchmark_indexes_category ON public.benchmark_indexes(category_id);
CREATE INDEX idx_executive_shadows_org ON public.executive_shadows(organization_id);
CREATE INDEX idx_veto_registry_org ON public.veto_registry(organization_id);