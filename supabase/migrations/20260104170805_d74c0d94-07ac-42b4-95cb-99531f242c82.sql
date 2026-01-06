-- Create execution_tasks table for persistent task queue
CREATE TABLE public.execution_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  task_type TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'paused', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 5,
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  workflow_id UUID REFERENCES public.automation_workflows(id),
  parent_task_id UUID REFERENCES public.execution_tasks(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_execution_tasks_org_status ON public.execution_tasks(organization_id, status);
CREATE INDEX idx_execution_tasks_scheduled ON public.execution_tasks(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_execution_tasks_agent ON public.execution_tasks(agent_type);

-- Enable RLS
ALTER TABLE public.execution_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view execution tasks in their organization"
ON public.execution_tasks FOR SELECT
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

CREATE POLICY "Users can insert execution tasks in their organization"
ON public.execution_tasks FOR INSERT
WITH CHECK (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

CREATE POLICY "Users can update execution tasks in their organization"
ON public.execution_tasks FOR UPDATE
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

CREATE POLICY "Users can delete execution tasks in their organization"
ON public.execution_tasks FOR DELETE
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

-- Create workflow_nodes table for visual workflow editor
CREATE TABLE public.workflow_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.automation_workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  node_type TEXT NOT NULL CHECK (node_type IN ('trigger', 'action', 'condition', 'delay', 'loop', 'parallel')),
  node_name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow_edges table for node connections
CREATE TABLE public.workflow_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.automation_workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  source_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
  edge_type TEXT DEFAULT 'default',
  condition JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for workflow_nodes
ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflow nodes in their organization"
ON public.workflow_nodes FOR SELECT
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

CREATE POLICY "Users can insert workflow nodes in their organization"
ON public.workflow_nodes FOR INSERT
WITH CHECK (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

CREATE POLICY "Users can update workflow nodes in their organization"
ON public.workflow_nodes FOR UPDATE
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

CREATE POLICY "Users can delete workflow nodes in their organization"
ON public.workflow_nodes FOR DELETE
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

-- Enable RLS for workflow_edges
ALTER TABLE public.workflow_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflow edges in their organization"
ON public.workflow_edges FOR SELECT
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

CREATE POLICY "Users can insert workflow edges in their organization"
ON public.workflow_edges FOR INSERT
WITH CHECK (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

CREATE POLICY "Users can update workflow edges in their organization"
ON public.workflow_edges FOR UPDATE
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

CREATE POLICY "Users can delete workflow edges in their organization"
ON public.workflow_edges FOR DELETE
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

-- Create oauth_tokens table for Google OAuth
CREATE TABLE public.oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  provider TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider)
);

-- Enable RLS for oauth_tokens
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view oauth tokens in their organization"
ON public.oauth_tokens FOR SELECT
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

CREATE POLICY "Users can manage oauth tokens in their organization"
ON public.oauth_tokens FOR ALL
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

-- Add cron_expression field to automation_workflows for scheduled triggers
ALTER TABLE public.automation_workflows ADD COLUMN IF NOT EXISTS cron_expression TEXT DEFAULT NULL;
ALTER TABLE public.automation_workflows ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Enable realtime for execution_tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.execution_tasks;

-- Create updated_at trigger for execution_tasks
CREATE TRIGGER update_execution_tasks_updated_at
BEFORE UPDATE ON public.execution_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();