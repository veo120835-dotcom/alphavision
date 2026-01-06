-- Enable Realtime on memory_items for instant fact synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE public.memory_items;

-- News signals table for Sniper Outreach
CREATE TABLE public.news_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  signal_type TEXT NOT NULL, -- 'funding', 'hiring', 'product_launch', 'leadership_change'
  headline TEXT NOT NULL,
  summary TEXT,
  source_url TEXT,
  relevance_score FLOAT DEFAULT 0.5,
  outreach_status TEXT DEFAULT 'pending', -- 'pending', 'drafted', 'sent', 'responded'
  draft_email TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view news signals for their organizations"
ON public.news_signals FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can manage news signals for their organizations"
ON public.news_signals FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Service role can manage all news signals"
ON public.news_signals FOR ALL
USING (auth.role() = 'service_role');

CREATE INDEX idx_news_signals_lookup ON public.news_signals(organization_id, signal_type, outreach_status);

-- Deal simulations table for tracking simulation results
CREATE TABLE public.deal_simulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  proposal_summary TEXT NOT NULL,
  deal_value NUMERIC,
  currency TEXT DEFAULT 'USD',
  objections JSONB,
  strengths JSONB,
  recommended_responses JSONB,
  win_probability FLOAT,
  risk_factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deal simulations for their organizations"
ON public.deal_simulations FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create deal simulations for their organizations"
ON public.deal_simulations FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Service role can manage all deal simulations"
ON public.deal_simulations FOR ALL
USING (auth.role() = 'service_role');

-- Golden dataset for automated testing
CREATE TABLE public.golden_dataset (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL, -- 'reflexion', 'closer', 'orchestrator'
  input_data JSONB NOT NULL,
  expected_output JSONB NOT NULL,
  quality_criteria JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.golden_dataset ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage golden dataset for their organizations"
ON public.golden_dataset FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Service role can manage all golden datasets"
ON public.golden_dataset FOR ALL
USING (auth.role() = 'service_role');