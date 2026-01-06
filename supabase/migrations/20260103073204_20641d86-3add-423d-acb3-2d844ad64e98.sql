-- Create leads table for the autonomous income agent
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'social', -- 'social', 'dm', 'referral', 'ads'
  platform TEXT, -- 'instagram', 'facebook', 'tiktok', 'email'
  external_id TEXT, -- ID from external platform
  name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'engaged', 'qualified', 'proposal_sent', 'closed_won', 'closed_lost'
  intent_score INTEGER DEFAULT 0, -- 0-100 score
  qualification_data JSONB DEFAULT '{}',
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  next_followup_at TIMESTAMP WITH TIME ZONE,
  assigned_workflow TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automation workflows table
CREATE TABLE public.automation_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  stage TEXT NOT NULL, -- 'traffic', 'engagement', 'closing', 'maintenance'
  trigger_type TEXT NOT NULL, -- 'schedule', 'event', 'manual'
  trigger_config JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT false,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dm conversations table
CREATE TABLE public.dm_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_conversation_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'qualified', 'closed', 'unresponsive'
  ai_handling_mode TEXT DEFAULT 'autonomous', -- 'autonomous', 'supervised', 'manual'
  messages_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  sentiment_score INTEGER, -- -100 to 100
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create revenue events table
CREATE TABLE public.revenue_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  workflow_id UUID REFERENCES public.automation_workflows(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'invoice_sent', 'payment_received', 'subscription_started', 'refund'
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  payment_provider TEXT, -- 'stripe', 'ghl', 'paypal'
  external_transaction_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent execution logs
CREATE TABLE public.agent_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.automation_workflows(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT '{}',
  result TEXT, -- 'success', 'failed', 'pending_approval'
  error_message TEXT,
  reasoning TEXT, -- AI's chain-of-thought
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can view leads in their organization"
  ON public.leads FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert leads in their organization"
  ON public.leads FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update leads in their organization"
  ON public.leads FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete leads in their organization"
  ON public.leads FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- RLS Policies for automation_workflows
CREATE POLICY "Users can view workflows in their organization"
  ON public.automation_workflows FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert workflows in their organization"
  ON public.automation_workflows FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update workflows in their organization"
  ON public.automation_workflows FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete workflows in their organization"
  ON public.automation_workflows FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- RLS Policies for dm_conversations
CREATE POLICY "Users can view conversations in their organization"
  ON public.dm_conversations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert conversations in their organization"
  ON public.dm_conversations FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update conversations in their organization"
  ON public.dm_conversations FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- RLS Policies for revenue_events
CREATE POLICY "Users can view revenue in their organization"
  ON public.revenue_events FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert revenue in their organization"
  ON public.revenue_events FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- RLS Policies for agent_execution_logs
CREATE POLICY "Users can view logs in their organization"
  ON public.agent_execution_logs FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert logs in their organization"
  ON public.agent_execution_logs FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_workflows_updated_at
  BEFORE UPDATE ON public.automation_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dm_conversations_updated_at
  BEFORE UPDATE ON public.dm_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_leads_organization ON public.leads(organization_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_next_followup ON public.leads(next_followup_at) WHERE next_followup_at IS NOT NULL;
CREATE INDEX idx_workflows_organization ON public.automation_workflows(organization_id);
CREATE INDEX idx_workflows_stage ON public.automation_workflows(stage);
CREATE INDEX idx_dm_conversations_lead ON public.dm_conversations(lead_id);
CREATE INDEX idx_revenue_events_lead ON public.revenue_events(lead_id);
CREATE INDEX idx_agent_logs_workflow ON public.agent_execution_logs(workflow_id);