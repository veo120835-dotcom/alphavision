-- Create organizations table if not exists
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create memberships table (links users to organizations)
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Create business_config table
CREATE TABLE IF NOT EXISTS public.business_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_name TEXT DEFAULT 'My Product',
  product_description TEXT,
  base_price NUMERIC DEFAULT 0,
  upsell_price NUMERIC DEFAULT 0,
  downsell_price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stripe_payment_link TEXT,
  stripe_upsell_link TEXT,
  stripe_downsell_link TEXT,
  booking_link TEXT,
  system_persona TEXT,
  brand_voice TEXT,
  closing_style TEXT DEFAULT 'consultative',
  target_niche TEXT,
  target_location TEXT,
  target_company_size TEXT,
  ideal_deal_value NUMERIC DEFAULT 0,
  upsell_enabled BOOLEAN DEFAULT true,
  upsell_name TEXT,
  upsell_pitch TEXT,
  upsell_delay_seconds INTEGER DEFAULT 60,
  referral_enabled BOOLEAN DEFAULT false,
  referral_bonus NUMERIC DEFAULT 0,
  referral_discount NUMERIC DEFAULT 0,
  referral_pitch TEXT,
  retention_enabled BOOLEAN DEFAULT false,
  save_offer_type TEXT,
  save_offer_duration_days INTEGER DEFAULT 30,
  save_offer_pitch TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Create permission_contracts table (governs agent autonomy)
CREATE TABLE IF NOT EXISTS public.permission_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  risk_posture_personal TEXT DEFAULT 'conservative',
  risk_posture_business TEXT DEFAULT 'balanced',
  risk_posture_marketing TEXT DEFAULT 'balanced',
  runway_minimum INTEGER DEFAULT 3,
  monthly_cap_ads NUMERIC DEFAULT 1000,
  monthly_cap_experiments NUMERIC DEFAULT 500,
  monthly_cap_tool_actions INTEGER DEFAULT 100,
  auto_execute_below NUMERIC DEFAULT 50,
  require_approval_above NUMERIC DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_goals table (sovereign priority engine)
CREATE TABLE IF NOT EXISTS public.agent_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'life', 'business', 'financial'
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 1,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  deadline DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create opportunity_pipeline table (opportunity radar)
CREATE TABLE IF NOT EXISTS public.opportunity_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  opportunity_type TEXT NOT NULL, -- 'market', 'private_deal', 'startup', 'acquisition', 'real_estate', 'digital_asset'
  title TEXT NOT NULL,
  description TEXT,
  thesis TEXT,
  why_now TEXT,
  why_not TEXT,
  invalidation_triggers TEXT[],
  conviction_score INTEGER DEFAULT 0,
  upside_potential NUMERIC,
  downside_risk NUMERIC,
  asymmetry_ratio NUMERIC,
  status TEXT DEFAULT 'evaluating',
  source TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_snapshots table (personal finance)
CREATE TABLE IF NOT EXISTS public.financial_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_income NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  net_cashflow NUMERIC DEFAULT 0,
  liquid_assets NUMERIC DEFAULT 0,
  total_assets NUMERIC DEFAULT 0,
  total_liabilities NUMERIC DEFAULT 0,
  net_worth NUMERIC DEFAULT 0,
  runway_months NUMERIC DEFAULT 0,
  savings_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, snapshot_date)
);

-- Create automation_rules table (autonomous actions)
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'schedule', 'event', 'threshold'
  trigger_config JSONB DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}',
  risk_score INTEGER DEFAULT 50,
  is_reversible BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_audit_log table (full audit trail)
CREATE TABLE IF NOT EXISTS public.agent_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_description TEXT,
  input_data JSONB,
  output_data JSONB,
  risk_score INTEGER,
  was_approved BOOLEAN,
  approved_by UUID REFERENCES auth.users(id),
  was_reversed BOOLEAN DEFAULT false,
  reversed_at TIMESTAMP WITH TIME ZONE,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_audit_log ENABLE ROW LEVEL SECURITY;

-- Function to check organization membership
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

-- Function to check org admin
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id 
    AND organization_id = _org_id 
    AND role IN ('admin', 'owner')
  )
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations" ON public.organizations
  FOR SELECT USING (public.is_org_member(auth.uid(), id));

CREATE POLICY "Admins can update their organizations" ON public.organizations
  FOR UPDATE USING (public.is_org_admin(auth.uid(), id));

CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for memberships
CREATE POLICY "Users can view their own memberships" ON public.memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Org admins can manage memberships" ON public.memberships
  FOR ALL USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Users can create their own membership" ON public.memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for business_config
CREATE POLICY "Org members can view config" ON public.business_config
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage config" ON public.business_config
  FOR ALL USING (public.is_org_admin(auth.uid(), organization_id));

-- RLS Policies for permission_contracts
CREATE POLICY "Org members can view contracts" ON public.permission_contracts
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage contracts" ON public.permission_contracts
  FOR ALL USING (public.is_org_admin(auth.uid(), organization_id));

-- RLS Policies for agent_goals
CREATE POLICY "Org members can view goals" ON public.agent_goals
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can manage goals" ON public.agent_goals
  FOR ALL USING (public.is_org_member(auth.uid(), organization_id));

-- RLS Policies for opportunity_pipeline
CREATE POLICY "Org members can view opportunities" ON public.opportunity_pipeline
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can manage opportunities" ON public.opportunity_pipeline
  FOR ALL USING (public.is_org_member(auth.uid(), organization_id));

-- RLS Policies for financial_snapshots
CREATE POLICY "Org admins can view financials" ON public.financial_snapshots
  FOR SELECT USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage financials" ON public.financial_snapshots
  FOR ALL USING (public.is_org_admin(auth.uid(), organization_id));

-- RLS Policies for automation_rules
CREATE POLICY "Org members can view automation rules" ON public.automation_rules
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage automation rules" ON public.automation_rules
  FOR ALL USING (public.is_org_admin(auth.uid(), organization_id));

-- RLS Policies for agent_audit_log
CREATE POLICY "Org members can view audit log" ON public.agent_audit_log
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "System can insert audit logs" ON public.agent_audit_log
  FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_business_config_updated_at
  BEFORE UPDATE ON public.business_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_permission_contracts_updated_at
  BEFORE UPDATE ON public.permission_contracts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_agent_goals_updated_at
  BEFORE UPDATE ON public.agent_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_opportunity_pipeline_updated_at
  BEFORE UPDATE ON public.opportunity_pipeline
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();