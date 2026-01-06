-- Create taste_preferences table for Taste & Judgment Engine
CREATE TABLE public.taste_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL, -- 'decision_style', 'risk_appetite', 'aesthetic', 'priority'
  pattern_key TEXT NOT NULL, -- what was the pattern observed
  pattern_value JSONB NOT NULL DEFAULT '{}', -- detailed preference data
  confidence_score NUMERIC NOT NULL DEFAULT 0.5, -- 0 to 1
  observation_count INTEGER NOT NULL DEFAULT 1,
  last_observed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create founder_state_logs table for Founder State Monitor
CREATE TABLE public.founder_state_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  decision_clarity INTEGER CHECK (decision_clarity >= 1 AND decision_clarity <= 5),
  detected_patterns TEXT[] DEFAULT '{}', -- 'overconfidence', 'fatigue', 'avoidance', 'paralysis'
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_identity table for Business Identity Mirror
CREATE TABLE public.business_identity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  identity_element TEXT NOT NULL, -- 'core_values', 'brand_voice', 'red_lines', 'aspirations'
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, identity_element, title)
);

-- Create decision_outcomes table for tracking decision consequences
CREATE TABLE public.decision_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  outcome_type TEXT NOT NULL, -- 'immediate', 'downstream', 'hidden_cost', 'unexpected'
  outcome_description TEXT NOT NULL,
  impact_score INTEGER CHECK (impact_score >= -5 AND impact_score <= 5), -- negative = bad, positive = good
  observed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playbooks table for saveable playbooks
CREATE TABLE public.playbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- 'sales', 'marketing', 'operations', 'growth'
  steps JSONB NOT NULL DEFAULT '[]',
  success_metrics TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_template BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.taste_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_state_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

-- RLS policies for taste_preferences
CREATE POLICY "Users can view taste preferences for their orgs" ON public.taste_preferences
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM memberships WHERE memberships.organization_id = taste_preferences.organization_id AND memberships.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert taste preferences for their orgs" ON public.taste_preferences
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM memberships WHERE memberships.organization_id = taste_preferences.organization_id AND memberships.user_id = auth.uid()
  ));

CREATE POLICY "Users can update taste preferences for their orgs" ON public.taste_preferences
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM memberships WHERE memberships.organization_id = taste_preferences.organization_id AND memberships.user_id = auth.uid()
  ));

-- RLS policies for founder_state_logs
CREATE POLICY "Users can view their own founder state logs" ON public.founder_state_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own founder state logs" ON public.founder_state_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS policies for business_identity
CREATE POLICY "Users can view business identity for their orgs" ON public.business_identity
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM memberships WHERE memberships.organization_id = business_identity.organization_id AND memberships.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage business identity for their orgs" ON public.business_identity
  FOR ALL USING (EXISTS (
    SELECT 1 FROM memberships WHERE memberships.organization_id = business_identity.organization_id AND memberships.user_id = auth.uid()
  ));

-- RLS policies for decision_outcomes
CREATE POLICY "Users can view decision outcomes for their orgs" ON public.decision_outcomes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM memberships WHERE memberships.organization_id = decision_outcomes.organization_id AND memberships.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert decision outcomes for their orgs" ON public.decision_outcomes
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM memberships WHERE memberships.organization_id = decision_outcomes.organization_id AND memberships.user_id = auth.uid()
  ));

-- RLS policies for playbooks
CREATE POLICY "Users can view playbooks for their orgs" ON public.playbooks
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM memberships WHERE memberships.organization_id = playbooks.organization_id AND memberships.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage playbooks for their orgs" ON public.playbooks
  FOR ALL USING (EXISTS (
    SELECT 1 FROM memberships WHERE memberships.organization_id = playbooks.organization_id AND memberships.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_taste_preferences_org ON public.taste_preferences(organization_id);
CREATE INDEX idx_founder_state_logs_org_user ON public.founder_state_logs(organization_id, user_id);
CREATE INDEX idx_business_identity_org ON public.business_identity(organization_id);
CREATE INDEX idx_decision_outcomes_decision ON public.decision_outcomes(decision_id);
CREATE INDEX idx_playbooks_org ON public.playbooks(organization_id);