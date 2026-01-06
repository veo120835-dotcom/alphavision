-- =============================================
-- KNOWLEDGE-TO-REVENUE ENGINE: Database Schema
-- =============================================

-- 1. INDUSTRY PRESETS TABLE
-- Pre-configured settings per industry for auto-detection and revenue pivots
CREATE TABLE public.industry_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_code TEXT NOT NULL UNIQUE,
  industry_name TEXT NOT NULL,
  
  -- Knowledge Sources
  primary_sources TEXT[] DEFAULT ARRAY['website'],
  auto_detect_patterns JSONB DEFAULT '[]'::jsonb,
  
  -- The Product/Goal
  product_type TEXT,
  success_tool TEXT,
  
  -- Revenue Pivot Patterns
  pivot_patterns JSONB DEFAULT '[]'::jsonb,
  closing_loops JSONB DEFAULT '[]'::jsonb,
  
  -- AI Behavior
  default_cta TEXT,
  urgency_triggers TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ORG_KNOWLEDGE TABLE
-- Per-organization knowledge with vector embeddings
CREATE TABLE public.org_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'website_page',
  title TEXT,
  
  -- Source Tracking
  source_url TEXT,
  source_type TEXT DEFAULT 'crawl',
  
  -- Vector (1536 dimensions for OpenAI/Gemini embeddings)
  embedding vector(1536),
  
  -- Metadata
  importance_score DECIMAL(3,2) DEFAULT 0.5,
  is_revenue_critical BOOLEAN DEFAULT false,
  extracted_entities JSONB DEFAULT '{}'::jsonb,
  
  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create vector index for similarity search
CREATE INDEX org_knowledge_embedding_idx ON public.org_knowledge 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index for organization lookups
CREATE INDEX org_knowledge_org_idx ON public.org_knowledge(organization_id);

-- 3. REVENUE_PIVOTS TABLE
-- Custom pivot patterns per organization
CREATE TABLE public.revenue_pivots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  
  trigger_category TEXT NOT NULL,
  trigger_patterns TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  librarian_response TEXT,
  revenue_response TEXT NOT NULL,
  
  cta_type TEXT,
  cta_link TEXT,
  
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX revenue_pivots_org_idx ON public.revenue_pivots(organization_id);

-- 4. KNOWLEDGE_INGESTION_JOBS TABLE
-- Track crawl/ingestion jobs
CREATE TABLE public.knowledge_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  
  job_type TEXT NOT NULL,
  source_url TEXT,
  status TEXT DEFAULT 'pending',
  
  pages_found INTEGER DEFAULT 0,
  pages_processed INTEGER DEFAULT 0,
  chunks_created INTEGER DEFAULT 0,
  
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.industry_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_pivots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- Industry presets are readable by all authenticated users
CREATE POLICY "Industry presets are readable by authenticated users"
  ON public.industry_presets FOR SELECT
  TO authenticated
  USING (true);

-- Org knowledge policies
CREATE POLICY "Users can view their organization knowledge"
  ON public.org_knowledge FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert knowledge for their organization"
  ON public.org_knowledge FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their organization knowledge"
  ON public.org_knowledge FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their organization knowledge"
  ON public.org_knowledge FOR DELETE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- Revenue pivots policies
CREATE POLICY "Users can view their organization pivots"
  ON public.revenue_pivots FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their organization pivots"
  ON public.revenue_pivots FOR ALL
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- Knowledge ingestion jobs policies
CREATE POLICY "Users can view their organization jobs"
  ON public.knowledge_ingestion_jobs FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their organization jobs"
  ON public.knowledge_ingestion_jobs FOR ALL
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- =============================================
-- SEED INDUSTRY PRESETS
-- =============================================

INSERT INTO public.industry_presets (industry_code, industry_name, primary_sources, product_type, success_tool, default_cta, auto_detect_patterns, pivot_patterns, closing_loops, urgency_triggers) VALUES
('coaching', 'Coaching & Consulting', 
  ARRAY['website', 'youtube', 'pdf_uploads'],
  'consultation', 'calendly_booking',
  'Book a free discovery call',
  '["coach", "mentor", "consulting", "program", "transformation", "mindset", "success"]'::jsonb,
  '[
    {"trigger": "how long", "librarian": "The program is X weeks.", "revenue": "Most clients see results by week 4. Want to see the case studies?"},
    {"trigger": "price", "librarian": "The investment is $X.", "revenue": "The investment reflects the transformation. Can I share how clients typically 10x their ROI?"},
    {"trigger": "guarantee", "librarian": "We offer a guarantee.", "revenue": "We stand behind results. Lets book a call so I can show you exactly what to expect."}
  ]'::jsonb,
  '["Shall I reserve a spot for you?", "Want me to send you the case study?", "Ready to take the first step?"]'::jsonb,
  ARRAY['ready', 'now', 'today', 'start', 'begin', 'serious', 'committed']
),

('real_estate', 'Real Estate', 
  ARRAY['website', 'mls_feed'],
  'property_viewing', 'calendly_booking',
  'Schedule a private showing',
  '["real estate", "property", "homes", "realtor", "listings", "buy", "sell", "mortgage"]'::jsonb,
  '[
    {"trigger": "pool", "librarian": "Yes, it has a pool.", "revenue": "Yes, and its heated year-round. When would you like to see it?"},
    {"trigger": "price", "librarian": "The asking price is $X.", "revenue": "Its priced competitively for this area. Theres strong interest—want to schedule a showing before it goes?"},
    {"trigger": "neighborhood", "librarian": "Its in X neighborhood.", "revenue": "Great schools and low crime. I can drive you through the area tomorrow—interested?"}
  ]'::jsonb,
  '["When would you like to see it?", "Should I schedule a private showing?", "Want me to send you the full listing?"]'::jsonb,
  ARRAY['interested', 'serious', 'ready', 'move', 'soon', 'looking']
),

('ecommerce', 'E-Commerce & Retail', 
  ARRAY['website', 'shopify_feed'],
  'physical_item', 'stripe_checkout',
  'Add to cart with free shipping',
  '["shop", "store", "buy", "cart", "checkout", "products", "shipping", "returns"]'::jsonb,
  '[
    {"trigger": "size", "librarian": "It runs true to size.", "revenue": "It runs true to size. I can apply 10% off if you checkout in the next hour."},
    {"trigger": "stock", "librarian": "We have X in stock.", "revenue": "Only 3 left! Want me to hold one for you?"},
    {"trigger": "shipping", "librarian": "Shipping takes X days.", "revenue": "Free shipping if you order today—arrives by Friday."}
  ]'::jsonb,
  '["Ready to checkout?", "Want me to apply a discount?", "Should I add this to your cart?"]'::jsonb,
  ARRAY['buy', 'order', 'checkout', 'now', 'today', 'want']
),

('law_firm', 'Legal Services', 
  ARRAY['website', 'pdf_uploads'],
  'consultation', 'calendly_booking',
  'Book a free case evaluation',
  '["attorney", "lawyer", "legal", "law firm", "case", "court", "litigation", "defense"]'::jsonb,
  '[
    {"trigger": "handle", "librarian": "Yes, we handle that type of case.", "revenue": "Yes, Attorney Smith specializes in this. We have a free consultation slot tomorrow—should I reserve it?"},
    {"trigger": "cost", "librarian": "Fees depend on the case.", "revenue": "We offer free initial consultations. Lets discuss your case and Ill give you a clear picture of costs."},
    {"trigger": "experience", "librarian": "We have X years of experience.", "revenue": "30 years and 500+ cases won. Want to see how we can help with yours?"}
  ]'::jsonb,
  '["Ready to discuss your case?", "Shall I schedule your free consultation?", "Want me to have an attorney call you?"]'::jsonb,
  ARRAY['urgent', 'help', 'need', 'asap', 'immediately', 'serious']
),

('saas', 'Software / SaaS', 
  ARRAY['website', 'docs'],
  'free_trial', 'create_account_link',
  'Start your free trial',
  '["software", "platform", "saas", "app", "integration", "api", "dashboard", "analytics"]'::jsonb,
  '[
    {"trigger": "integrate", "librarian": "Yes, we integrate with X.", "revenue": "Yes, native integration! Start your free trial and youll be connected in 60 seconds."},
    {"trigger": "pricing", "librarian": "Plans start at $X/month.", "revenue": "Start free for 14 days, no card required. Most teams upgrade after seeing results in week 1."},
    {"trigger": "demo", "librarian": "We offer demos.", "revenue": "Id love to show you around. Whats a good time for a 15-minute walkthrough?"}
  ]'::jsonb,
  '["Ready to start your free trial?", "Want me to set up a quick demo?", "Should I create your account now?"]'::jsonb,
  ARRAY['try', 'start', 'demo', 'test', 'ready', 'need']
),

('roofing', 'Roofing & Home Services', 
  ARRAY['website'],
  'inspection', 'schedule_truck',
  'Schedule a free inspection',
  '["roofing", "roof", "contractor", "repair", "replacement", "inspection", "shingles", "leak"]'::jsonb,
  '[
    {"trigger": "inspection", "librarian": "Yes, we do inspections.", "revenue": "Yes, and theyre free. I have a crew in your area Thursday—want me to lock in that slot?"},
    {"trigger": "cost", "librarian": "Cost depends on the job.", "revenue": "Every roof is different. Our free inspection gives you an exact quote with no obligation."},
    {"trigger": "insurance", "librarian": "We work with insurance.", "revenue": "We handle insurance claims directly. Most clients pay nothing out of pocket. Want me to explain how?"}
  ]'::jsonb,
  '["Ready to schedule your free inspection?", "Want me to send a crew this week?", "Should I check availability in your area?"]'::jsonb,
  ARRAY['leak', 'damage', 'storm', 'urgent', 'asap', 'emergency']
),

('dental', 'Dental Practice', 
  ARRAY['website'],
  'appointment', 'calendly_booking',
  'Book your appointment',
  '["dentist", "dental", "teeth", "smile", "cleaning", "implants", "orthodontics", "whitening"]'::jsonb,
  '[
    {"trigger": "implants", "librarian": "Yes, we do implants.", "revenue": "Yes, Dr. Smith is board-certified. We have a consultation slot tomorrow at 10 AM—should I reserve it?"},
    {"trigger": "insurance", "librarian": "We accept most insurance.", "revenue": "We accept most plans and verify benefits for you. Whats your provider? Ill check your coverage now."},
    {"trigger": "emergency", "librarian": "We handle emergencies.", "revenue": "We have same-day emergency slots. Are you in pain right now? I can get you in today."}
  ]'::jsonb,
  '["Ready to book your appointment?", "Want me to check todays availability?", "Should I schedule your consultation?"]'::jsonb,
  ARRAY['pain', 'emergency', 'urgent', 'asap', 'today', 'hurt']
),

('fitness', 'Fitness & Wellness', 
  ARRAY['website', 'youtube'],
  'trial_session', 'calendly_booking',
  'Book your free trial class',
  '["fitness", "gym", "workout", "training", "personal trainer", "yoga", "crossfit", "weight loss"]'::jsonb,
  '[
    {"trigger": "schedule", "librarian": "We have classes at X times.", "revenue": "We have a spot in tomorrow mornings class—its our most popular. Want me to save it for you?"},
    {"trigger": "price", "librarian": "Membership is $X/month.", "revenue": "First week is free. Most members see results within 14 days. Ready to start?"},
    {"trigger": "results", "librarian": "Results vary by person.", "revenue": "Our average client loses 10 lbs in month one. Want to see the before/afters?"}
  ]'::jsonb,
  '["Ready to claim your free trial?", "Want me to book your first session?", "Should I save you a spot?"]'::jsonb,
  ARRAY['start', 'begin', 'ready', 'motivated', 'change', 'transform']
),

('agency', 'Marketing Agency', 
  ARRAY['website', 'pdf_uploads'],
  'strategy_call', 'calendly_booking',
  'Book a free strategy session',
  '["agency", "marketing", "advertising", "seo", "ppc", "social media", "branding", "creative"]'::jsonb,
  '[
    {"trigger": "results", "librarian": "We drive strong results.", "revenue": "Our last client saw 300% ROAS in 60 days. Want to see the case study?"},
    {"trigger": "price", "librarian": "Pricing depends on scope.", "revenue": "We customize to your goals. Lets do a free audit—Ill show you exactly where youre leaving money on the table."},
    {"trigger": "timeline", "librarian": "Results take X months.", "revenue": "Most clients see movement in 30 days. Ready to get started?"}
  ]'::jsonb,
  '["Ready for your free strategy session?", "Want me to run a quick audit?", "Should I show you the case study?"]'::jsonb,
  ARRAY['grow', 'scale', 'revenue', 'leads', 'sales', 'ready']
),

('financial', 'Financial Services', 
  ARRAY['website', 'pdf_uploads'],
  'consultation', 'calendly_booking',
  'Schedule your free financial review',
  '["financial", "advisor", "wealth", "investment", "retirement", "planning", "insurance", "tax"]'::jsonb,
  '[
    {"trigger": "retirement", "librarian": "We help with retirement planning.", "revenue": "We create custom retirement roadmaps. Most clients find $100k+ in hidden opportunities. Want a free review?"},
    {"trigger": "fees", "librarian": "Our fee structure is X.", "revenue": "Our fee is often offset by the savings we find. Lets do a free analysis—no obligation."},
    {"trigger": "experience", "librarian": "We have X years experience.", "revenue": "25 years and $500M managed. Want to see how we can optimize your portfolio?"}
  ]'::jsonb,
  '["Ready for your complimentary review?", "Want me to schedule your consultation?", "Should I have an advisor call you?"]'::jsonb,
  ARRAY['retire', 'save', 'invest', 'plan', 'worried', 'serious']
);