-- ROI Attribution & Outcome Billing tables
CREATE TABLE public.outcome_attributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  outcome_id UUID REFERENCES public.decision_outcomes(id),
  decision_id UUID REFERENCES public.decisions(id),
  action_id UUID REFERENCES public.actions(id),
  attribution_weight DECIMAL(5,4) DEFAULT 0.5,
  confidence_score DECIMAL(5,4) DEFAULT 0.5,
  revenue_attributed DECIMAL(12,2) DEFAULT 0,
  attribution_window_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Billing events for outcome-based pricing
CREATE TABLE public.billing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  event_type TEXT NOT NULL, -- subscription, outcome_fee, decision_fee, license_fee
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, invoiced, paid, failed
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lead exchange marketplace
CREATE TABLE public.lead_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  lead_id UUID REFERENCES public.leads(id),
  listing_type TEXT DEFAULT 'sale', -- sale, referral
  asking_price DECIMAL(10,2),
  quality_score DECIMAL(3,2),
  industry TEXT,
  company_size TEXT,
  intent_level TEXT,
  description TEXT,
  status TEXT DEFAULT 'available', -- available, reserved, sold, withdrawn
  buyer_org_id UUID REFERENCES public.organizations(id),
  sold_at TIMESTAMP WITH TIME ZONE,
  sold_price DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Licensing/White-label tenants
CREATE TABLE public.license_tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_org_id UUID NOT NULL REFERENCES public.organizations(id),
  tenant_name TEXT NOT NULL,
  branding_config JSONB DEFAULT '{"logo_url": null, "primary_color": "#8B5CF6", "assistant_name": "AI Assistant"}',
  policy_template_id UUID REFERENCES public.permission_contracts(id),
  seat_limit INTEGER DEFAULT 5,
  active_seats INTEGER DEFAULT 0,
  sub_org_limit INTEGER DEFAULT 10,
  active_sub_orgs INTEGER DEFAULT 0,
  license_tier TEXT DEFAULT 'standard', -- standard, professional, enterprise
  monthly_fee DECIMAL(10,2) DEFAULT 499,
  per_seat_fee DECIMAL(10,2) DEFAULT 49,
  per_sub_org_fee DECIMAL(10,2) DEFAULT 99,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Decision credits and billing tiers
CREATE TABLE public.decision_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  credits_purchased INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  credits_remaining INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'advisor', -- advisor, operator, autopilot
  monthly_allocation INTEGER DEFAULT 50,
  overage_rate DECIMAL(6,2) DEFAULT 4.99,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Playbook marketplace
CREATE TABLE public.playbook_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  sales_count INTEGER DEFAULT 0,
  revenue_generated DECIMAL(12,2) DEFAULT 0,
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  category TEXT,
  tags TEXT[],
  preview_content JSONB,
  status TEXT DEFAULT 'draft', -- draft, published, archived
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Certifications
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  certification_type TEXT NOT NULL, -- consultant, agency, operator
  level TEXT DEFAULT 'certified', -- certified, advanced, master
  performance_score DECIMAL(5,2),
  audit_passed BOOLEAN DEFAULT false,
  issued_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  renewal_fee DECIMAL(10,2) DEFAULT 199,
  status TEXT DEFAULT 'pending', -- pending, active, expired, revoked
  badge_url TEXT,
  verification_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.outcome_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own org attributions" ON public.outcome_attributions
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own org billing" ON public.billing_events
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org leads" ON public.lead_listings
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view available listings" ON public.lead_listings
  FOR SELECT USING (status = 'available');

CREATE POLICY "Users can view own org licenses" ON public.license_tenants
  FOR ALL USING (parent_org_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org credits" ON public.decision_credits
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view public playbooks" ON public.playbook_listings
  FOR SELECT USING (is_public = true OR organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org playbooks" ON public.playbook_listings
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own certifications" ON public.certifications
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));