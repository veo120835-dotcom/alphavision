-- Prompt Variants for A/B testing and genetic evolution
CREATE TABLE public.prompt_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL, -- 'sniper_email', 'closer_chat', 'voice_script'
  prompt_text TEXT NOT NULL,
  variant_tag TEXT NOT NULL, -- 'aggressive_v1', 'friendly_v2'
  generation INTEGER DEFAULT 1,
  parent_variant_id UUID REFERENCES prompt_variants(id),
  uses INTEGER DEFAULT 0,
  successes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Performance index for selecting best variants
CREATE INDEX idx_prompt_variants_performance 
ON prompt_variants (organization_id, agent_type, is_active);

-- Enable RLS
ALTER TABLE prompt_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization prompt variants"
ON prompt_variants FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert prompt variants for their organization"
ON prompt_variants FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their organization prompt variants"
ON prompt_variants FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

-- Add Stripe columns to license_tenants if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'license_tenants') THEN
    ALTER TABLE license_tenants ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
    ALTER TABLE license_tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
    ALTER TABLE license_tenants ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing';
    ALTER TABLE license_tenants ADD COLUMN IF NOT EXISTS current_tier TEXT DEFAULT 'standard';
    ALTER TABLE license_tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE license_tenants ADD COLUMN IF NOT EXISTS features_enabled JSONB DEFAULT '{"email_sniper": true}'::jsonb;
  END IF;
END $$;

-- Voice call logs table
CREATE TABLE public.voice_call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  vapi_call_id TEXT,
  phone_number TEXT,
  call_status TEXT DEFAULT 'initiated',
  duration_seconds INTEGER,
  call_outcome TEXT,
  transcript TEXT,
  recording_url TEXT,
  variant_id UUID REFERENCES prompt_variants(id),
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE voice_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization voice call logs"
ON voice_call_logs FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert voice call logs for their organization"
ON voice_call_logs FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

-- Add variant_id tracking to news_signals for A/B testing
ALTER TABLE news_signals ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES prompt_variants(id);

-- Function to increment variant success
CREATE OR REPLACE FUNCTION increment_variant_success(p_variant_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prompt_variants 
  SET successes = successes + 1 
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment variant uses
CREATE OR REPLACE FUNCTION increment_variant_uses(p_variant_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prompt_variants 
  SET uses = uses + 1 
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;