-- =============================================================================
-- GLOBAL WORLD MODEL SCHEMA
-- Time-indexed state graph for AI cognition
-- =============================================================================

-- World Model Snapshots (daily business state)
CREATE TABLE public.world_model_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Business State
  business_state JSONB DEFAULT '{}'::jsonb,
  
  -- Market State
  market_state JSONB DEFAULT '{}'::jsonb,
  
  -- Client State
  client_state JSONB DEFAULT '{}'::jsonb,
  
  -- Founder State
  founder_state JSONB DEFAULT '{}'::jsonb,
  
  -- Capital State  
  capital_state JSONB DEFAULT '{}'::jsonb,
  
  -- Risk State
  risk_state JSONB DEFAULT '{}'::jsonb,
  
  -- Entity Graph (nodes and edges)
  entity_graph JSONB DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  
  -- Computed Health Score
  health_score DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, snapshot_date)
);

-- Causal Relationships (learned cause-effect patterns)
CREATE TABLE public.causal_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  cause_variable TEXT NOT NULL,
  effect_variable TEXT NOT NULL,
  strength DECIMAL(5,4) NOT NULL, -- -1 to 1
  lag_hours INTEGER DEFAULT 0,
  confidence DECIMAL(5,4) DEFAULT 0.5,
  sample_size INTEGER DEFAULT 0,
  discovered_at TIMESTAMPTZ DEFAULT now(),
  last_validated TIMESTAMPTZ,
  
  UNIQUE(organization_id, cause_variable, effect_variable)
);

-- Agent Objectives Registry (incentive system)
CREATE TABLE public.agent_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  agent_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  primary_metric TEXT NOT NULL,
  constraints TEXT[] DEFAULT '{}',
  cost_function TEXT,
  kill_threshold DECIMAL(5,4) DEFAULT 0.10,
  regret_tracker_enabled BOOLEAN DEFAULT true,
  reward_shaping JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, agent_id)
);

-- Trust Scores (autonomy level tracking)
CREATE TABLE public.agent_trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  agent_id TEXT NOT NULL,
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 0 AND current_level <= 4),
  max_allowed_level INTEGER DEFAULT 2 CHECK (max_allowed_level >= 0 AND max_allowed_level <= 4),
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  regret_sum DECIMAL(10,4) DEFAULT 0,
  last_evaluation TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, agent_id)
);

-- Decision Records (full cognition trace)
CREATE TABLE public.cognition_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  agent_id TEXT NOT NULL,
  
  -- Context
  inference_chain JSONB NOT NULL,
  options_considered JSONB NOT NULL,
  constraints_applied JSONB,
  risk_assessment JSONB,
  opportunity_cost_analysis JSONB,
  
  -- Decision
  selected_option JSONB NOT NULL,
  autonomy_level INTEGER NOT NULL,
  reasoning TEXT NOT NULL,
  
  -- Outcome (filled later)
  outcome JSONB,
  actual_value DECIMAL(12,2),
  expected_value DECIMAL(12,2),
  regret DECIMAL(12,2),
  learnings TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  executed_at TIMESTAMPTZ,
  outcome_recorded_at TIMESTAMPTZ
);

-- Learning Events (policy updates, patterns, biases)
CREATE TABLE public.learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  agent_id TEXT,
  learning_type TEXT NOT NULL, -- pattern_discovered, policy_update, heuristic_refined, bias_detected, constraint_learned, objective_calibrated
  source_decision_id UUID REFERENCES cognition_decisions(id),
  insight TEXT NOT NULL,
  confidence DECIMAL(5,4),
  applicability TEXT DEFAULT 'general', -- specific, general, universal
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Policy Updates (version-controlled agent policies)
CREATE TABLE public.agent_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  agent_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  policy_text TEXT NOT NULL,
  trigger_event_id UUID REFERENCES learning_events(id),
  validation_results JSONB,
  is_active BOOLEAN DEFAULT false,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, agent_id, version)
);

-- Buyer Psychology State Machine
CREATE TABLE public.buyer_psychology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  lead_id UUID REFERENCES leads(id),
  
  -- Awareness Journey
  awareness_stage TEXT DEFAULT 'unaware', -- unaware, problem_aware, solution_aware, product_aware, most_aware
  stage_entered_at TIMESTAMPTZ DEFAULT now(),
  
  -- Psychological Scores
  trust_score DECIMAL(5,4) DEFAULT 0.5,
  urgency_score DECIMAL(5,4) DEFAULT 0.3,
  confidence_score DECIMAL(5,4) DEFAULT 0.5,
  friction_score DECIMAL(5,4) DEFAULT 0.5,
  
  -- Momentum Tracking
  buying_momentum DECIMAL(5,4) DEFAULT 0,
  momentum_direction TEXT DEFAULT 'neutral', -- accelerating, stable, decelerating, stalled
  
  -- Objection Evolution
  objections_raised TEXT[] DEFAULT '{}',
  objections_resolved TEXT[] DEFAULT '{}',
  primary_objection TEXT,
  
  -- Trust Decay/Growth
  trust_events JSONB DEFAULT '[]'::jsonb,
  last_positive_interaction TIMESTAMPTZ,
  last_negative_interaction TIMESTAMPTZ,
  
  -- Why They Didn't Buy (if applicable)
  did_not_buy_reason TEXT,
  did_not_buy_details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Founder Substitution Index
CREATE TABLE public.founder_substitution_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Dependency Scores (0-1, lower = more replaceable)
  decision_dependency DECIMAL(5,4) DEFAULT 0.9, -- How much decisions need founder
  creativity_dependency DECIMAL(5,4) DEFAULT 0.8, -- Content, strategy creation
  sales_dependency DECIMAL(5,4) DEFAULT 0.8, -- Direct sales involvement
  authority_dependency DECIMAL(5,4) DEFAULT 0.9, -- Brand/trust tied to founder
  emotional_dependency DECIMAL(5,4) DEFAULT 0.7, -- Team morale, culture
  relationship_dependency DECIMAL(5,4) DEFAULT 0.8, -- Client relationships
  
  -- Computed Scores
  overall_dependency DECIMAL(5,4), -- Weighted average
  replacement_readiness DECIMAL(5,4), -- 1 - overall_dependency
  
  -- Trend
  trend TEXT DEFAULT 'stable', -- improving, stable, worsening
  change_from_last DECIMAL(5,4),
  
  -- Details
  bottleneck_areas TEXT[],
  delegation_opportunities TEXT[],
  automation_opportunities TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, measurement_date)
);

-- Value Attribution (decision -> outcome chain)
CREATE TABLE public.value_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  
  -- The Chain
  decision_id UUID REFERENCES cognition_decisions(id),
  action_id UUID REFERENCES actions(id),
  
  -- Attribution
  revenue_influenced DECIMAL(12,2) DEFAULT 0,
  loss_prevented DECIMAL(12,2) DEFAULT 0,
  time_saved_hours DECIMAL(8,2) DEFAULT 0,
  opportunity_captured DECIMAL(12,2) DEFAULT 0,
  
  -- Confidence
  attribution_confidence DECIMAL(5,4),
  attribution_method TEXT, -- direct, modeled, estimated
  
  -- For Billing
  billable_value DECIMAL(12,2),
  billed BOOLEAN DEFAULT false,
  billed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE world_model_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE causal_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognition_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_psychology ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_substitution_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_attribution ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using existing membership pattern)
CREATE POLICY "Users can view their org world model" ON world_model_snapshots 
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view their org causal relationships" ON causal_relationships 
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view their org agent objectives" ON agent_objectives 
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view their org trust scores" ON agent_trust_scores 
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view their org decisions" ON cognition_decisions 
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view their org learning events" ON learning_events 
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view their org agent policies" ON agent_policies 
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view their org buyer psychology" ON buyer_psychology 
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view their org founder index" ON founder_substitution_index 
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view their org value attribution" ON value_attribution 
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX idx_world_model_org_date ON world_model_snapshots(organization_id, snapshot_date DESC);
CREATE INDEX idx_cognition_decisions_org ON cognition_decisions(organization_id, created_at DESC);
CREATE INDEX idx_learning_events_org ON learning_events(organization_id, created_at DESC);
CREATE INDEX idx_buyer_psychology_contact ON buyer_psychology(contact_id);
CREATE INDEX idx_buyer_psychology_lead ON buyer_psychology(lead_id);
CREATE INDEX idx_value_attribution_decision ON value_attribution(decision_id);

-- Function to calculate founder substitution index
CREATE OR REPLACE FUNCTION calculate_founder_substitution_index(org_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  dep_decision DECIMAL;
  dep_creativity DECIMAL;
  dep_sales DECIMAL;
  dep_authority DECIMAL;
  dep_emotional DECIMAL;
  dep_relationship DECIMAL;
  weighted_avg DECIMAL;
BEGIN
  SELECT 
    COALESCE(decision_dependency, 0.9),
    COALESCE(creativity_dependency, 0.8),
    COALESCE(sales_dependency, 0.8),
    COALESCE(authority_dependency, 0.9),
    COALESCE(emotional_dependency, 0.7),
    COALESCE(relationship_dependency, 0.8)
  INTO dep_decision, dep_creativity, dep_sales, dep_authority, dep_emotional, dep_relationship
  FROM founder_substitution_index
  WHERE organization_id = org_id
  ORDER BY measurement_date DESC
  LIMIT 1;
  
  -- Weighted average (decisions and authority weigh more)
  weighted_avg := (dep_decision * 0.25 + dep_creativity * 0.15 + dep_sales * 0.20 + 
                   dep_authority * 0.20 + dep_emotional * 0.10 + dep_relationship * 0.10);
  
  RETURN weighted_avg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE cognition_decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE learning_events;
ALTER PUBLICATION supabase_realtime ADD TABLE buyer_psychology;