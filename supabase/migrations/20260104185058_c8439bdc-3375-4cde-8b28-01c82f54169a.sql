-- Strategy Guide table for self-healing agent memory
CREATE TABLE public.strategy_guide (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  error_pattern TEXT,
  advice TEXT NOT NULL,
  confidence_score FLOAT DEFAULT 1.0,
  times_applied INTEGER DEFAULT 0,
  last_applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategy_guide ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view strategy guides for their organizations"
ON public.strategy_guide FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create strategy guides for their organizations"
ON public.strategy_guide FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update strategy guides for their organizations"
ON public.strategy_guide FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

-- Service role policy for edge functions
CREATE POLICY "Service role can manage all strategy guides"
ON public.strategy_guide FOR ALL
USING (auth.role() = 'service_role');

-- Index for fast lookups
CREATE INDEX idx_strategy_guide_task_type ON public.strategy_guide(organization_id, task_type);

-- Trigger for updated_at
CREATE TRIGGER update_strategy_guide_updated_at
BEFORE UPDATE ON public.strategy_guide
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();