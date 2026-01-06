
-- =====================================================
-- HIVE MIND TABLES (Federated Learning)
-- =====================================================

-- Global cross-org wisdom (anonymized patterns)
CREATE TABLE public.global_niche_wisdom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_type TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  insight TEXT NOT NULL,
  suggested_prompt_fragment TEXT,
  trigger_context JSONB DEFAULT '{}',
  success_rate DECIMAL(5,2),
  sample_size INTEGER DEFAULT 0,
  confidence_score DECIMAL(5,2),
  promoted_to_master BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Objection handlers with voting
CREATE TABLE public.objection_handlers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_type TEXT NOT NULL,
  objection_pattern TEXT NOT NULL,
  handler_text TEXT NOT NULL,
  conversion_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  org_count INTEGER DEFAULT 0,
  is_master BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- SHADOW MODE TABLES (Behavioral Cloning)
-- =====================================================

-- Style vectors per organization
CREATE TABLE public.style_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL,
  sentence_length_avg DECIMAL(5,2),
  formality_score DECIMAL(3,2),
  humor_markers TEXT[] DEFAULT '{}',
  signature_phrases TEXT[] DEFAULT '{}',
  greeting_style TEXT,
  closing_style TEXT,
  tone_keywords TEXT[] DEFAULT '{}',
  vocabulary_preferences JSONB DEFAULT '{}',
  style_embedding JSONB DEFAULT '{}',
  sample_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- Training samples for style learning
CREATE TABLE public.style_training_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  sample_type TEXT NOT NULL,
  content TEXT NOT NULL,
  extracted_markers JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- MYSTERY SHOPPER TABLES (Competitor Intel)
-- =====================================================

-- Competitor profiles to monitor
CREATE TABLE public.competitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  competitor_name TEXT NOT NULL,
  website_url TEXT,
  pricing_page_url TEXT,
  pricing_selector TEXT,
  last_checked_at TIMESTAMPTZ,
  current_price DECIMAL(10,2),
  current_offers JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Intelligence alerts
CREATE TABLE public.competitor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  competitor_id UUID REFERENCES competitor_profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  message TEXT NOT NULL,
  recommendation TEXT,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- BOARDROOM TABLES (Multi-Agent Council)
-- =====================================================

CREATE TABLE public.boardroom_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  ceo_response JSONB,
  cfo_response JSONB,
  cro_response JSONB,
  cmo_response JSONB,
  synthesis TEXT,
  recommended_action TEXT,
  confidence_score DECIMAL(3,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- CHURN GUARD TABLES (Smart Dunning)
-- =====================================================

CREATE TABLE public.payment_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_email TEXT NOT NULL,
  customer_id TEXT,
  amount_due DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  error_code TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  ltv_estimate DECIMAL(10,2),
  recovery_strategy TEXT,
  recovered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- REVIEW MAGNET TABLES (Sentiment Gating)
-- =====================================================

CREATE TABLE public.reputation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  sentiment_score INTEGER,
  chat_history_summary TEXT,
  review_platform TEXT,
  review_link TEXT,
  status TEXT DEFAULT 'pending',
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PRICE SURGEON TABLES (Margin-Aware Pricing)
-- =====================================================

CREATE TABLE public.pricing_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  my_price DECIMAL(10,2) NOT NULL,
  my_cogs DECIMAL(10,2),
  min_margin_percent DECIMAL(5,2) DEFAULT 20.0,
  competitor_url TEXT,
  competitor_selector TEXT,
  competitor_price DECIMAL(10,2),
  price_action_taken TEXT,
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- LEADS TABLE EXTENSIONS (Lazarus Engine)
-- =====================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_objection TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reactivation_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS resurrection_status TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_resurrection_at TIMESTAMPTZ;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Global Niche Wisdom (readable by all authenticated, writable by system)
ALTER TABLE public.global_niche_wisdom ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read global wisdom" ON public.global_niche_wisdom FOR SELECT USING (true);

-- Objection Handlers (readable by all authenticated)
ALTER TABLE public.objection_handlers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read objection handlers" ON public.objection_handlers FOR SELECT USING (true);

-- Style Vectors (org-based access)
ALTER TABLE public.style_vectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own org style vectors" ON public.style_vectors FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Style Training Samples
ALTER TABLE public.style_training_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own org training samples" ON public.style_training_samples FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Competitor Profiles
ALTER TABLE public.competitor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own org competitor profiles" ON public.competitor_profiles FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Competitor Alerts
ALTER TABLE public.competitor_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own org competitor alerts" ON public.competitor_alerts FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Boardroom Sessions
ALTER TABLE public.boardroom_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own org boardroom sessions" ON public.boardroom_sessions FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Payment Failures
ALTER TABLE public.payment_failures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own org payment failures" ON public.payment_failures FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Reputation Logs
ALTER TABLE public.reputation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own org reputation logs" ON public.reputation_logs FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Pricing Intelligence
ALTER TABLE public.pricing_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own org pricing intelligence" ON public.pricing_intelligence FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- =====================================================
-- ENABLE REALTIME FOR KEY TABLES
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.competitor_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.boardroom_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_failures;
