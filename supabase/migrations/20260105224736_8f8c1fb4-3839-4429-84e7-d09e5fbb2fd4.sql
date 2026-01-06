-- Workflow Templates (Global Library of Predetermined Workflows)
CREATE TABLE public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  eligibility_gate JSONB,
  decisioning_config JSONB,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  stop_rules JSONB,
  governance_config JSONB,
  learning_signals TEXT[],
  template_variables JSONB,
  priority INTEGER DEFAULT 50,
  is_core_template BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lead Scores (Advanced 3D Scoring)
CREATE TABLE public.lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  intent_score DECIMAL(5,2),
  capacity_score DECIMAL(5,2),
  efficiency_score DECIMAL(5,2),
  ear_score DECIMAL(5,2),
  identity_signals JSONB,
  website_signals JSONB,
  behavioral_signals JSONB,
  source_trust_weight DECIMAL(3,2),
  economic_potential JSONB,
  risk_flags TEXT[],
  routing_decision TEXT,
  routing_reasoning TEXT,
  scored_at TIMESTAMPTZ DEFAULT now(),
  model_version TEXT DEFAULT 'v1',
  UNIQUE(lead_id)
);

-- Workflow Execution Steps (Detailed Step Tracking)
CREATE TABLE public.workflow_execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE NOT NULL,
  step_order INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB,
  status TEXT DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  output_data JSONB,
  error_message TEXT,
  wait_until TIMESTAMPTZ,
  wait_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Call Intelligence (Extracted Call Insights) - using opportunities instead of deals
CREATE TABLE public.call_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  call_id TEXT,
  transcript_text TEXT,
  call_duration INTEGER,
  call_date TIMESTAMPTZ,
  buying_intent_signals TEXT[],
  objections JSONB,
  decision_criteria TEXT[],
  stakeholders_mentioned TEXT[],
  next_step_commitments TEXT[],
  close_probability DECIMAL(3,2),
  follow_up_urgency TEXT,
  recommended_actions JSONB,
  follow_up_email_draft TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- No-Show Tracking
CREATE TABLE public.no_show_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  no_show_count INTEGER DEFAULT 1,
  no_show_reason_likelihood JSONB,
  recovery_track TEXT,
  recovery_attempts JSONB DEFAULT '[]'::jsonb,
  recovered BOOLEAN DEFAULT false,
  rescheduled_booking_id UUID,
  pre_call_engagement_score DECIMAL(3,2),
  time_between_book_and_noshow INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Deal Decisions (using opportunities) - Proposal/Decision Deadline Tracking
CREATE TABLE public.deal_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  proposal_sent_at TIMESTAMPTZ,
  decision_deadline TIMESTAMPTZ,
  window_days INTEGER,
  touches JSONB DEFAULT '[]'::jsonb,
  touch_count INTEGER DEFAULT 0,
  decision_made BOOLEAN DEFAULT false,
  decision TEXT,
  decision_at TIMESTAMPTZ,
  loss_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(opportunity_id)
);

-- Add columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS ear_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS nurture_track TEXT,
ADD COLUMN IF NOT EXISTS requalify_at TIMESTAMPTZ;

-- Add columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.no_show_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_templates (global read, admin write)
CREATE POLICY "Anyone can view workflow templates"
ON public.workflow_templates FOR SELECT USING (true);

CREATE POLICY "Admins can manage workflow templates"
ON public.workflow_templates FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for lead_scores
CREATE POLICY "Users can view their org lead scores"
ON public.lead_scores FOR SELECT
USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their org lead scores"
ON public.lead_scores FOR ALL
USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- RLS Policies for workflow_execution_steps
CREATE POLICY "Users can view their org execution steps"
ON public.workflow_execution_steps FOR SELECT
USING (execution_id IN (
  SELECT we.id FROM public.workflow_executions we
  JOIN public.automation_workflows aw ON we.workflow_id = aw.id
  WHERE aw.organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
));

CREATE POLICY "Users can manage their org execution steps"
ON public.workflow_execution_steps FOR ALL
USING (execution_id IN (
  SELECT we.id FROM public.workflow_executions we
  JOIN public.automation_workflows aw ON we.workflow_id = aw.id
  WHERE aw.organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
));

-- RLS Policies for call_intelligence
CREATE POLICY "Users can view their org call intelligence"
ON public.call_intelligence FOR SELECT
USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their org call intelligence"
ON public.call_intelligence FOR ALL
USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- RLS Policies for no_show_tracking
CREATE POLICY "Users can view their org no-show tracking"
ON public.no_show_tracking FOR SELECT
USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their org no-show tracking"
ON public.no_show_tracking FOR ALL
USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- RLS Policies for deal_decisions
CREATE POLICY "Users can view their org deal decisions"
ON public.deal_decisions FOR SELECT
USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their org deal decisions"
ON public.deal_decisions FOR ALL
USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_lead_scores_org ON public.lead_scores(organization_id);
CREATE INDEX idx_lead_scores_ear ON public.lead_scores(ear_score DESC);
CREATE INDEX idx_lead_scores_routing ON public.lead_scores(routing_decision);
CREATE INDEX idx_workflow_execution_steps_execution ON public.workflow_execution_steps(execution_id);
CREATE INDEX idx_workflow_execution_steps_status ON public.workflow_execution_steps(status);
CREATE INDEX idx_call_intelligence_org ON public.call_intelligence(organization_id);
CREATE INDEX idx_no_show_tracking_org ON public.no_show_tracking(organization_id);
CREATE INDEX idx_deal_decisions_org ON public.deal_decisions(organization_id);
CREATE INDEX idx_workflow_templates_category ON public.workflow_templates(category);
CREATE INDEX idx_workflow_templates_trigger ON public.workflow_templates(trigger_event);