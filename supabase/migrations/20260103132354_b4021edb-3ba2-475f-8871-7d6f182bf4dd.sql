-- Create approval_requests table for HITL workflow
CREATE TABLE public.approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL DEFAULT 'high_value_deal',
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  agent_recommendation TEXT,
  risk_assessment JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  decision TEXT,
  decision_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_states table for multi-agent swarm tracking
CREATE TABLE public.agent_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  current_task TEXT,
  last_action TEXT,
  last_action_at TIMESTAMP WITH TIME ZONE,
  metrics JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trend_topics table for content factory
CREATE TABLE public.trend_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  source TEXT,
  relevance_score NUMERIC DEFAULT 0,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'new',
  used_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_queue table for content scheduling
CREATE TABLE public.content_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trend_topic_id UUID REFERENCES public.trend_topics(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL,
  variation TEXT NOT NULL,
  title TEXT,
  script TEXT,
  hook_text TEXT,
  platform TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft',
  content_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for approval_requests
CREATE POLICY "Users can view approval requests in their organization"
ON public.approval_requests FOR SELECT
USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert approval requests in their organization"
ON public.approval_requests FOR INSERT
WITH CHECK (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can update approval requests in their organization"
ON public.approval_requests FOR UPDATE
USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

-- RLS policies for agent_states
CREATE POLICY "Users can view agent states in their organization"
ON public.agent_states FOR SELECT
USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert agent states in their organization"
ON public.agent_states FOR INSERT
WITH CHECK (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can update agent states in their organization"
ON public.agent_states FOR UPDATE
USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

-- RLS policies for trend_topics
CREATE POLICY "Users can view trend topics in their organization"
ON public.trend_topics FOR SELECT
USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert trend topics in their organization"
ON public.trend_topics FOR INSERT
WITH CHECK (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can update trend topics in their organization"
ON public.trend_topics FOR UPDATE
USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete trend topics in their organization"
ON public.trend_topics FOR DELETE
USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

-- RLS policies for content_queue
CREATE POLICY "Users can view content queue in their organization"
ON public.content_queue FOR SELECT
USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert content queue in their organization"
ON public.content_queue FOR INSERT
WITH CHECK (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can update content queue in their organization"
ON public.content_queue FOR UPDATE
USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete content queue in their organization"
ON public.content_queue FOR DELETE
USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_approval_requests_org_status ON public.approval_requests(organization_id, status);
CREATE INDEX idx_agent_states_org ON public.agent_states(organization_id);
CREATE INDEX idx_trend_topics_org_status ON public.trend_topics(organization_id, status);
CREATE INDEX idx_content_queue_org_status ON public.content_queue(organization_id, status);
CREATE INDEX idx_content_queue_scheduled ON public.content_queue(scheduled_at) WHERE status = 'scheduled';

-- Add triggers for updated_at
CREATE TRIGGER update_approval_requests_updated_at
BEFORE UPDATE ON public.approval_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_states_updated_at
BEFORE UPDATE ON public.agent_states
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_queue_updated_at
BEFORE UPDATE ON public.content_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();