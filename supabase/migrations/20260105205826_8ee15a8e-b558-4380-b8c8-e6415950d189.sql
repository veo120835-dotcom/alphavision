-- =============================================
-- Phase 1: CRM Core Engine
-- =============================================

-- Companies (B2B CRM)
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT, -- 1-10, 10-50, 50-200, 200+
  website TEXT,
  linkedin_url TEXT,
  annual_revenue TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contacts (enhanced CRM contacts)
CREATE TABLE public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  title TEXT,
  is_decision_maker BOOLEAN DEFAULT false,
  lifecycle_stage TEXT DEFAULT 'lead', -- lead, mql, sql, customer, evangelist
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pipelines
CREATE TABLE public.pipelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pipeline Stages
CREATE TABLE public.pipeline_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  probability INTEGER DEFAULT 0,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Opportunities (Deals)
CREATE TABLE public.opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  close_date DATE,
  probability INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open', -- open, won, lost
  lost_reason TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks
CREATE TABLE public.crm_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activity Timeline
CREATE TABLE public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- email, call, meeting, note, deal_update, task, stage_change
  subject TEXT,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view companies in their organization" ON public.companies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = companies.organization_id)
  );

CREATE POLICY "Users can insert companies in their organization" ON public.companies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = companies.organization_id)
  );

CREATE POLICY "Users can update companies in their organization" ON public.companies
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = companies.organization_id)
  );

CREATE POLICY "Users can delete companies in their organization" ON public.companies
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = companies.organization_id)
  );

-- RLS Policies for contacts
CREATE POLICY "Users can view contacts in their organization" ON public.contacts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = contacts.organization_id)
  );

CREATE POLICY "Users can insert contacts in their organization" ON public.contacts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = contacts.organization_id)
  );

CREATE POLICY "Users can update contacts in their organization" ON public.contacts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = contacts.organization_id)
  );

CREATE POLICY "Users can delete contacts in their organization" ON public.contacts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = contacts.organization_id)
  );

-- RLS Policies for pipelines
CREATE POLICY "Users can view pipelines in their organization" ON public.pipelines
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = pipelines.organization_id)
  );

CREATE POLICY "Users can insert pipelines in their organization" ON public.pipelines
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = pipelines.organization_id)
  );

CREATE POLICY "Users can update pipelines in their organization" ON public.pipelines
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = pipelines.organization_id)
  );

CREATE POLICY "Users can delete pipelines in their organization" ON public.pipelines
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = pipelines.organization_id)
  );

-- RLS Policies for pipeline_stages (access through pipeline)
CREATE POLICY "Users can view stages for their pipelines" ON public.pipeline_stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pipelines p
      JOIN public.memberships m ON m.organization_id = p.organization_id
      WHERE p.id = pipeline_stages.pipeline_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stages for their pipelines" ON public.pipeline_stages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pipelines p
      JOIN public.memberships m ON m.organization_id = p.organization_id
      WHERE p.id = pipeline_stages.pipeline_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stages for their pipelines" ON public.pipeline_stages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pipelines p
      JOIN public.memberships m ON m.organization_id = p.organization_id
      WHERE p.id = pipeline_stages.pipeline_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stages for their pipelines" ON public.pipeline_stages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.pipelines p
      JOIN public.memberships m ON m.organization_id = p.organization_id
      WHERE p.id = pipeline_stages.pipeline_id AND m.user_id = auth.uid()
    )
  );

-- RLS Policies for opportunities
CREATE POLICY "Users can view opportunities in their organization" ON public.opportunities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = opportunities.organization_id)
  );

CREATE POLICY "Users can insert opportunities in their organization" ON public.opportunities
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = opportunities.organization_id)
  );

CREATE POLICY "Users can update opportunities in their organization" ON public.opportunities
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = opportunities.organization_id)
  );

CREATE POLICY "Users can delete opportunities in their organization" ON public.opportunities
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = opportunities.organization_id)
  );

-- RLS Policies for crm_tasks
CREATE POLICY "Users can view tasks in their organization" ON public.crm_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = crm_tasks.organization_id)
  );

CREATE POLICY "Users can insert tasks in their organization" ON public.crm_tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = crm_tasks.organization_id)
  );

CREATE POLICY "Users can update tasks in their organization" ON public.crm_tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = crm_tasks.organization_id)
  );

CREATE POLICY "Users can delete tasks in their organization" ON public.crm_tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = crm_tasks.organization_id)
  );

-- RLS Policies for activities
CREATE POLICY "Users can view activities in their organization" ON public.activities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = activities.organization_id)
  );

CREATE POLICY "Users can insert activities in their organization" ON public.activities
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = activities.organization_id)
  );

CREATE POLICY "Users can update activities in their organization" ON public.activities
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = activities.organization_id)
  );

CREATE POLICY "Users can delete activities in their organization" ON public.activities
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND organization_id = activities.organization_id)
  );

-- Add updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON public.pipelines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_tasks_updated_at BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_companies_organization ON public.companies(organization_id);
CREATE INDEX idx_contacts_organization ON public.contacts(organization_id);
CREATE INDEX idx_contacts_company ON public.contacts(company_id);
CREATE INDEX idx_contacts_owner ON public.contacts(owner_id);
CREATE INDEX idx_pipelines_organization ON public.pipelines(organization_id);
CREATE INDEX idx_pipeline_stages_pipeline ON public.pipeline_stages(pipeline_id);
CREATE INDEX idx_opportunities_organization ON public.opportunities(organization_id);
CREATE INDEX idx_opportunities_pipeline ON public.opportunities(pipeline_id);
CREATE INDEX idx_opportunities_stage ON public.opportunities(stage_id);
CREATE INDEX idx_opportunities_contact ON public.opportunities(contact_id);
CREATE INDEX idx_crm_tasks_organization ON public.crm_tasks(organization_id);
CREATE INDEX idx_crm_tasks_contact ON public.crm_tasks(contact_id);
CREATE INDEX idx_crm_tasks_assigned ON public.crm_tasks(assigned_to);
CREATE INDEX idx_activities_organization ON public.activities(organization_id);
CREATE INDEX idx_activities_contact ON public.activities(contact_id);
CREATE INDEX idx_activities_opportunity ON public.activities(opportunity_id);