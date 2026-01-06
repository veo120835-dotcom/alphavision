-- Business Configuration Table (Admin settings for the AI agents)
CREATE TABLE public.business_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Product Configuration
  product_name TEXT DEFAULT 'High-Ticket Consulting',
  product_description TEXT DEFAULT 'Expert consulting services',
  base_price NUMERIC DEFAULT 5000,
  upsell_price NUMERIC DEFAULT 1000,
  downsell_price NUMERIC DEFAULT 27,
  currency TEXT DEFAULT 'USD',
  
  -- Payment Links
  stripe_payment_link TEXT,
  stripe_upsell_link TEXT,
  stripe_downsell_link TEXT,
  booking_link TEXT,
  
  -- AI Persona Configuration
  system_persona TEXT DEFAULT 'You are a direct, friendly sales closer who focuses on value.',
  brand_voice TEXT DEFAULT 'Professional Maverick',
  closing_style TEXT DEFAULT 'consultative',
  
  -- Target Market
  target_niche TEXT DEFAULT 'SaaS Founders',
  target_location TEXT,
  target_company_size TEXT,
  ideal_deal_value NUMERIC DEFAULT 5000,
  
  -- Upsell Configuration
  upsell_enabled BOOLEAN DEFAULT true,
  upsell_name TEXT DEFAULT 'Fast-Track Package',
  upsell_pitch TEXT DEFAULT 'Get results in half the time with priority support',
  upsell_delay_seconds INTEGER DEFAULT 60,
  
  -- Referral Configuration
  referral_enabled BOOLEAN DEFAULT true,
  referral_bonus NUMERIC DEFAULT 500,
  referral_discount NUMERIC DEFAULT 500,
  referral_pitch TEXT DEFAULT 'Know someone who needs this? Refer them for $500 each!',
  
  -- Retention Configuration
  retention_enabled BOOLEAN DEFAULT true,
  save_offer_type TEXT DEFAULT 'pause_billing',
  save_offer_duration_days INTEGER DEFAULT 30,
  save_offer_pitch TEXT DEFAULT 'Let me pause your billing for a month so you can catch up.',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_org_config UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org config"
ON public.business_config FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert their org config"
ON public.business_config FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their org config"
ON public.business_config FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Service role can manage all configs"
ON public.business_config FOR ALL
USING (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE TRIGGER update_business_config_updated_at
  BEFORE UPDATE ON public.business_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();