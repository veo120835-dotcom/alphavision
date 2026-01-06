-- =====================================================
-- Website Intelligence & Pattern Diagnosis Engine
-- =====================================================

-- 1. Website Diagnoses Table - Stores structured analysis
CREATE TABLE public.website_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  
  -- Input
  website_url TEXT,
  pasted_content TEXT,
  input_type TEXT NOT NULL DEFAULT 'url' CHECK (input_type IN ('url', 'paste')),
  
  -- Diagnosis Output (AI Call #1)
  clarity TEXT CHECK (clarity IN ('clear', 'mixed', 'vague')),
  offer_structure TEXT CHECK (offer_structure IN ('single', 'multiple', 'custom-heavy')),
  language_style TEXT CHECK (language_style IN ('outcome-driven', 'adjective-driven', 'mixed')),
  credibility_type TEXT CHECK (credibility_type IN ('judgment-based', 'credential-based', 'mixed')),
  sales_entry TEXT CHECK (sales_entry IN ('open', 'filtered', 'unclear')),
  revenue_stage TEXT CHECK (revenue_stage IN ('early', 'mid', 'established')),
  primary_constraint TEXT CHECK (primary_constraint IN ('positioning', 'pricing', 'offer', 'sales', 'authority', 'systems')),
  pressure_signals TEXT[],
  dominant_pattern TEXT,
  
  -- Full diagnosis JSON
  diagnosis_json JSONB,
  
  -- Metadata
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Authority Emails Table - Stores generated emails
CREATE TABLE public.authority_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  diagnosis_id UUID NOT NULL REFERENCES public.website_diagnoses(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  
  -- Email Content
  subject_line TEXT NOT NULL,
  email_body TEXT NOT NULL,
  closing_loop TEXT,
  
  -- Variant Testing
  variant_id UUID REFERENCES public.prompt_variants(id) ON DELETE SET NULL,
  variant_tag TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'replied', 'ignored')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  
  -- Quality Tracking
  personalization_hooks TEXT[],
  confidence_score DECIMAL(3,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Email Sending Config - Cold email safety guardrails
CREATE TABLE public.email_sending_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  
  -- Rate Limits
  max_emails_per_day INTEGER NOT NULL DEFAULT 30,
  max_emails_per_week INTEGER NOT NULL DEFAULT 150,
  
  -- Send Windows
  send_window_start TIME NOT NULL DEFAULT '09:00',
  send_window_end TIME NOT NULL DEFAULT '17:00',
  send_days TEXT[] NOT NULL DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  
  -- Safety Rules
  require_approval BOOLEAN NOT NULL DEFAULT true,
  stop_on_reply BOOLEAN NOT NULL DEFAULT true,
  plain_text_only BOOLEAN NOT NULL DEFAULT true,
  no_links BOOLEAN NOT NULL DEFAULT true,
  no_attachments BOOLEAN NOT NULL DEFAULT true,
  
  -- Follow-up
  auto_followup_enabled BOOLEAN NOT NULL DEFAULT false,
  followup_days INTEGER NOT NULL DEFAULT 7,
  max_followups INTEGER NOT NULL DEFAULT 2,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Pattern Performance Tracking Table
CREATE TABLE public.pattern_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Pattern Info
  dominant_pattern TEXT NOT NULL,
  primary_constraint TEXT,
  
  -- Metrics
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  emails_replied INTEGER NOT NULL DEFAULT 0,
  reply_rate DECIMAL(5,4) GENERATED ALWAYS AS (
    CASE WHEN emails_sent > 0 THEN emails_replied::DECIMAL / emails_sent ELSE 0 END
  ) STORED,
  
  -- Best variant for this pattern
  best_variant_id UUID REFERENCES public.prompt_variants(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id, dominant_pattern, primary_constraint)
);

-- Indexes
CREATE INDEX idx_website_diagnoses_org ON public.website_diagnoses(organization_id);
CREATE INDEX idx_website_diagnoses_contact ON public.website_diagnoses(contact_id);
CREATE INDEX idx_website_diagnoses_pattern ON public.website_diagnoses(dominant_pattern);
CREATE INDEX idx_authority_emails_org ON public.authority_emails(organization_id);
CREATE INDEX idx_authority_emails_status ON public.authority_emails(status);
CREATE INDEX idx_authority_emails_diagnosis ON public.authority_emails(diagnosis_id);
CREATE INDEX idx_pattern_performance_org ON public.pattern_performance(organization_id);

-- RLS Policies
ALTER TABLE public.website_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authority_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sending_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_performance ENABLE ROW LEVEL SECURITY;

-- Website Diagnoses RLS
CREATE POLICY "Users can view own org diagnoses"
  ON public.website_diagnoses FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own org diagnoses"
  ON public.website_diagnoses FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own org diagnoses"
  ON public.website_diagnoses FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own org diagnoses"
  ON public.website_diagnoses FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- Authority Emails RLS
CREATE POLICY "Users can view own org emails"
  ON public.authority_emails FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own org emails"
  ON public.authority_emails FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own org emails"
  ON public.authority_emails FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own org emails"
  ON public.authority_emails FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- Email Sending Config RLS
CREATE POLICY "Users can view own org config"
  ON public.email_sending_config FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own org config"
  ON public.email_sending_config FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own org config"
  ON public.email_sending_config FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- Pattern Performance RLS
CREATE POLICY "Users can view own org patterns"
  ON public.pattern_performance FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own org patterns"
  ON public.pattern_performance FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own org patterns"
  ON public.pattern_performance FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_email_sending_config_updated_at
  BEFORE UPDATE ON public.email_sending_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pattern_performance_updated_at
  BEFORE UPDATE ON public.pattern_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();