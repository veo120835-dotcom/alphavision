-- Create content_posts table to track content performance and hooks
CREATE TABLE public.content_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'video',
  hook_text TEXT,
  hook_duration_seconds NUMERIC,
  content_url TEXT,
  thumbnail_url TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft',
  
  -- Engagement metrics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  
  -- Watch metrics (for video content)
  avg_watch_time_seconds NUMERIC DEFAULT 0,
  watch_through_rate NUMERIC DEFAULT 0,
  retention_at_3s NUMERIC DEFAULT 0,
  retention_at_10s NUMERIC DEFAULT 0,
  
  -- Hook scoring
  hook_score NUMERIC DEFAULT 0,
  hook_category TEXT,
  
  -- Metadata
  content_variation TEXT,
  trend_topic TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hook_patterns table to store winning hook patterns
CREATE TABLE public.hook_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pattern_name TEXT NOT NULL,
  pattern_structure TEXT NOT NULL,
  example_hooks TEXT[],
  avg_retention NUMERIC DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hook_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_posts
CREATE POLICY "Users can view content posts in their organization"
  ON public.content_posts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert content posts in their organization"
  ON public.content_posts FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can update content posts in their organization"
  ON public.content_posts FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete content posts in their organization"
  ON public.content_posts FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

-- RLS policies for hook_patterns
CREATE POLICY "Users can view hook patterns in their organization"
  ON public.hook_patterns FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert hook patterns in their organization"
  ON public.hook_patterns FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can update hook patterns in their organization"
  ON public.hook_patterns FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete hook patterns in their organization"
  ON public.hook_patterns FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_content_posts_org_id ON public.content_posts(organization_id);
CREATE INDEX idx_content_posts_posted_at ON public.content_posts(posted_at);
CREATE INDEX idx_content_posts_hook_score ON public.content_posts(hook_score DESC);
CREATE INDEX idx_hook_patterns_org_id ON public.hook_patterns(organization_id);
CREATE INDEX idx_hook_patterns_success_rate ON public.hook_patterns(success_rate DESC);

-- Trigger for updated_at
CREATE TRIGGER update_content_posts_updated_at
  BEFORE UPDATE ON public.content_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hook_patterns_updated_at
  BEFORE UPDATE ON public.hook_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();