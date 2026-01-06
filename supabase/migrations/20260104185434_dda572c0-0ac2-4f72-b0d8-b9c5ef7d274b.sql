-- Prompt Versioning table for storing and rolling back agent prompts
CREATE TABLE public.prompt_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  prompt_name TEXT NOT NULL,
  prompt_content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  performance_score FLOAT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view prompt versions for their organizations"
ON public.prompt_versions FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create prompt versions for their organizations"
ON public.prompt_versions FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update prompt versions for their organizations"
ON public.prompt_versions FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete prompt versions for their organizations"
ON public.prompt_versions FOR DELETE
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

-- Service role policy for edge functions
CREATE POLICY "Service role can manage all prompt versions"
ON public.prompt_versions FOR ALL
USING (auth.role() = 'service_role');

-- Indexes for fast lookups
CREATE INDEX idx_prompt_versions_agent ON public.prompt_versions(organization_id, agent_type, is_active);
CREATE UNIQUE INDEX idx_prompt_versions_active ON public.prompt_versions(organization_id, agent_type) WHERE is_active = true;

-- Eval Results table for automated testing
CREATE TABLE public.eval_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  eval_type TEXT NOT NULL,
  prompt_version_id UUID REFERENCES public.prompt_versions(id),
  input_data JSONB,
  expected_output JSONB,
  actual_output JSONB,
  score FLOAT,
  passed BOOLEAN,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_ms INTEGER
);

-- Enable RLS
ALTER TABLE public.eval_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for eval_results
CREATE POLICY "Users can view eval results for their organizations"
ON public.eval_results FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create eval results for their organizations"
ON public.eval_results FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Service role can manage all eval results"
ON public.eval_results FOR ALL
USING (auth.role() = 'service_role');

-- Index for eval results
CREATE INDEX idx_eval_results_lookup ON public.eval_results(organization_id, eval_type, executed_at DESC);