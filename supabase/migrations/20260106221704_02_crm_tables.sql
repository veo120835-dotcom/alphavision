/*
  # CRM Tables Setup

  1. New Tables
    - `contacts` - Contact/lead information
    - `companies` - Company records
    - `deals` - Sales pipeline deals
    - `leads` - Lead tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for organization members
    - Add service role policies
*/

-- Companies
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT,
  website TEXT,
  linkedin_url TEXT,
  annual_revenue TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  title TEXT,
  lifecycle_stage TEXT DEFAULT 'lead',
  source TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deals
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stage TEXT DEFAULT 'prospecting',
  probability INTEGER DEFAULT 0,
  close_date DATE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  status TEXT DEFAULT 'new',
  score INTEGER DEFAULT 0,
  source TEXT,
  value NUMERIC,
  notes TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Companies policies
DROP POLICY IF EXISTS "Users can view companies in their organizations" ON public.companies;
CREATE POLICY "Users can view companies in their organizations"
  ON public.companies FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage companies in their organizations" ON public.companies;
CREATE POLICY "Users can manage companies in their organizations"
  ON public.companies FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to companies" ON public.companies;
CREATE POLICY "Service role full access to companies"
  ON public.companies FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Contacts policies
DROP POLICY IF EXISTS "Users can view contacts in their organizations" ON public.contacts;
CREATE POLICY "Users can view contacts in their organizations"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage contacts in their organizations" ON public.contacts;
CREATE POLICY "Users can manage contacts in their organizations"
  ON public.contacts FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to contacts" ON public.contacts;
CREATE POLICY "Service role full access to contacts"
  ON public.contacts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Deals policies
DROP POLICY IF EXISTS "Users can view deals in their organizations" ON public.deals;
CREATE POLICY "Users can view deals in their organizations"
  ON public.deals FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to deals" ON public.deals;
CREATE POLICY "Service role full access to deals"
  ON public.deals FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Leads policies
DROP POLICY IF EXISTS "Users can view leads in their organizations" ON public.leads;
CREATE POLICY "Users can view leads in their organizations"
  ON public.leads FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to leads" ON public.leads;
CREATE POLICY "Service role full access to leads"
  ON public.leads FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_org ON public.contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_companies_org ON public.companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_org ON public.deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- Triggers
DROP TRIGGER IF EXISTS handle_updated_at_contacts ON public.contacts;
CREATE TRIGGER handle_updated_at_contacts
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_companies ON public.companies;
CREATE TRIGGER handle_updated_at_companies
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_deals ON public.deals;
CREATE TRIGGER handle_updated_at_deals
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_leads ON public.leads;
CREATE TRIGGER handle_updated_at_leads
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();