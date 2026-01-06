-- Business Profiles: Complete Alpha Vision Business Intelligence
CREATE TABLE public.business_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- IDENTITY CORE
  business_name TEXT NOT NULL DEFAULT '',
  tagline TEXT,
  industry TEXT, -- 'coaching', 'consulting', 'agency', 'saas', 'service'
  business_model TEXT, -- 'high_ticket_1on1', 'group_program', 'productized_service', 'hybrid'
  
  -- FOUNDER/OPERATOR PROFILE
  founder_name TEXT,
  founder_title TEXT, -- 'Coach', 'Consultant', 'Advisor', 'Founder'
  founder_expertise TEXT[] DEFAULT '{}',
  years_in_industry INTEGER,
  
  -- PRICING & POSITIONING
  price_floor DECIMAL(10,2), -- Minimum price they'll accept
  price_anchor DECIMAL(10,2), -- Target/anchor price
  price_ceiling DECIMAL(10,2), -- Premium/ceiling price
  pricing_philosophy TEXT DEFAULT 'value_based', -- 'truth_pricing', 'value_based', 'premium_only'
  
  -- TARGET AVATAR
  avatar_name TEXT,
  avatar_description TEXT,
  avatar_income_floor DECIMAL(12,2),
  avatar_income_ceiling DECIMAL(12,2),
  avatar_pain_points TEXT[] DEFAULT '{}',
  avatar_desires TEXT[] DEFAULT '{}',
  avatar_anti_desires TEXT[] DEFAULT '{}',
  
  -- OFFER ARCHITECTURE
  flagship_offer_name TEXT,
  flagship_offer_description TEXT,
  flagship_offer_duration TEXT,
  flagship_offer_price DECIMAL(10,2),
  flagship_offer_deliverables TEXT[] DEFAULT '{}',
  
  -- SALES PHILOSOPHY
  sales_style TEXT DEFAULT 'consultative', -- 'leadership_based', 'consultative', 'diagnostic', 'challenge'
  objection_handling TEXT DEFAULT 'acknowledge_redirect',
  discount_policy TEXT DEFAULT 'value_add_only', -- 'never', 'strategic_only', 'value_add_only'
  
  -- BRAND VOICE & SIGNAL
  brand_voice_adjectives TEXT[] DEFAULT '{}',
  brand_voice_avoid TEXT[] DEFAULT '{}',
  content_style TEXT DEFAULT 'educational', -- 'educational', 'provocative', 'story_driven'
  
  -- AI AGENT CONFIGURATION
  ai_agent_name TEXT DEFAULT 'Business Intelligence',
  ai_agent_role TEXT DEFAULT 'Business Partner',
  ai_agent_positioning TEXT,
  
  -- METHODOLOGY
  methodology_name TEXT,
  methodology_stages JSONB DEFAULT '[]',
  
  -- NON-NEGOTIABLES
  non_negotiables TEXT[] DEFAULT '{}',
  quality_standards TEXT[] DEFAULT '{}',
  
  -- SUCCESS METRICS
  primary_kpi TEXT DEFAULT 'monthly_revenue',
  secondary_kpis TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Agent Rules: Per-Organization AI Behavior
CREATE TABLE public.ai_agent_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  
  rule_type TEXT NOT NULL, -- 'qualification', 'pricing', 'content', 'sales', 'diagnostic'
  rule_name TEXT NOT NULL,
  rule_condition JSONB DEFAULT '{}',
  rule_action TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Diagnostic Templates: Pre-built diagnostic frameworks
CREATE TABLE public.diagnostic_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  template_type TEXT NOT NULL, -- 'website_audit', 'pricing_check', 'positioning_review', 'sales_integrity'
  template_name TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  scoring_logic JSONB DEFAULT '{}',
  output_format TEXT DEFAULT 'report', -- 'report', 'score_card', 'action_items'
  
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_business_profiles_org ON public.business_profiles(organization_id);
CREATE INDEX idx_ai_agent_rules_org ON public.ai_agent_rules(organization_id);
CREATE INDEX idx_ai_agent_rules_type ON public.ai_agent_rules(rule_type);
CREATE INDEX idx_diagnostic_templates_org ON public.diagnostic_templates(organization_id);
CREATE INDEX idx_diagnostic_templates_type ON public.diagnostic_templates(template_type);

-- Enable RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_profiles
CREATE POLICY "Users can view their org business profile"
ON public.business_profiles FOR SELECT
USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their org business profile"
ON public.business_profiles FOR INSERT
WITH CHECK (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their org business profile"
ON public.business_profiles FOR UPDATE
USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- RLS Policies for ai_agent_rules
CREATE POLICY "Users can view their org ai rules"
ON public.ai_agent_rules FOR SELECT
USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their org ai rules"
ON public.ai_agent_rules FOR ALL
USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- RLS Policies for diagnostic_templates
CREATE POLICY "Users can view system and org templates"
ON public.diagnostic_templates FOR SELECT
USING (is_system = true OR organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their org templates"
ON public.diagnostic_templates FOR ALL
USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Update trigger for business_profiles
CREATE TRIGGER update_business_profiles_updated_at
BEFORE UPDATE ON public.business_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system diagnostic templates
INSERT INTO public.diagnostic_templates (template_type, template_name, description, questions, is_system) VALUES
('website_audit', 'Website & Brand Diagnostic', 'Analyze positioning clarity and authority signals', '[
  {"id": "positioning", "question": "Is the core offer immediately clear within 5 seconds?", "weight": 20},
  {"id": "avatar", "question": "Is the target audience explicitly stated?", "weight": 15},
  {"id": "authority", "question": "Are there credibility markers (testimonials, logos, results)?", "weight": 15},
  {"id": "cta", "question": "Is there a clear, single call-to-action?", "weight": 20},
  {"id": "pricing", "question": "Does the pricing reflect premium positioning?", "weight": 15},
  {"id": "voice", "question": "Is the brand voice consistent and distinctive?", "weight": 15}
]'::jsonb, true),
('pricing_check', 'Pricing Integrity Check', 'Detect pricing collapse risk and justification language', '[
  {"id": "justification", "question": "Does the pricing statement avoid justification language?", "weight": 25},
  {"id": "confidence", "question": "Is the price stated without qualifiers (like around, approximately)?", "weight": 20},
  {"id": "anchoring", "question": "Is proper price anchoring used?", "weight": 20},
  {"id": "value_first", "question": "Is value established before price is mentioned?", "weight": 20},
  {"id": "alternatives", "question": "Are alternatives positioned correctly (not competing on price)?", "weight": 15}
]'::jsonb, true),
('sales_integrity', 'Sales Script Integrity', 'Check for persuasion leakage and boundary violations', '[
  {"id": "leadership", "question": "Does the sales approach lead with authority, not pleading?", "weight": 25},
  {"id": "qualification", "question": "Is proper qualification happening before pitching?", "weight": 20},
  {"id": "objections", "question": "Are objections addressed without discounting?", "weight": 20},
  {"id": "boundaries", "question": "Are clear boundaries established?", "weight": 20},
  {"id": "close", "question": "Is the close direct without desperation signals?", "weight": 15}
]'::jsonb, true),
('positioning_review', 'Positioning & Differentiation Review', 'Analyze market positioning and uniqueness', '[
  {"id": "unique", "question": "Is there a clear differentiator that competitors cannot copy?", "weight": 25},
  {"id": "category", "question": "Is the business positioned as a category leader vs competitor?", "weight": 20},
  {"id": "niche", "question": "Is the niche narrow enough for authority?", "weight": 20},
  {"id": "language", "question": "Does the language avoid generic industry buzzwords?", "weight": 20},
  {"id": "proof", "question": "Is the unique positioning backed by proof points?", "weight": 15}
]'::jsonb, true);