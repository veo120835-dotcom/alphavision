-- =============================================
-- WORKFLOW ENGINE (Replacing n8n)
-- =============================================

-- Workflow executions log
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  workflow_id UUID REFERENCES public.automation_workflows(id),
  trigger_event TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  steps_executed JSONB DEFAULT '[]',
  error_message TEXT,
  result JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own org workflow executions" ON public.workflow_executions
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "System can insert workflow executions" ON public.workflow_executions
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "System can update workflow executions" ON public.workflow_executions
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

-- =============================================
-- ORGANIZATION BRANDING (For Courses/Pages)
-- =============================================

CREATE TABLE IF NOT EXISTS public.organization_branding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL UNIQUE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  accent_color TEXT DEFAULT '#f59e0b',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#1f2937',
  font_family TEXT DEFAULT 'Inter',
  custom_css TEXT,
  custom_domain TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organization_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own org branding" ON public.organization_branding
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users update own org branding" ON public.organization_branding
  FOR ALL USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

-- =============================================
-- VECTOR MEMORY (pgvector)
-- =============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Memory embeddings table
CREATE TABLE IF NOT EXISTS public.memory_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'note', -- note, conversation, document, outcome
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.memory_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own org embeddings" ON public.memory_embeddings
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own org embeddings" ON public.memory_embeddings
  FOR ALL USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS memory_embeddings_embedding_idx ON public.memory_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================
-- COURSE MEDIA ATTACHMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS public.course_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  course_id UUID REFERENCES public.courses(id),
  lesson_id UUID REFERENCES public.lessons(id),
  file_type TEXT NOT NULL, -- video, pdf, image, document
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  duration_seconds INTEGER, -- for videos
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.course_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own org course media" ON public.course_media
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own org course media" ON public.course_media
  FOR ALL USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

-- =============================================
-- SUPER ADMIN FLAG
-- =============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_workflow_executions_org ON public.workflow_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_course_media_course ON public.course_media(course_id);
CREATE INDEX IF NOT EXISTS idx_course_media_lesson ON public.course_media(lesson_id);
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_org ON public.memory_embeddings(organization_id);
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_type ON public.memory_embeddings(content_type);