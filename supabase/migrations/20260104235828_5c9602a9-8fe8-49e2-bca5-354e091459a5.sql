-- =====================================================
-- COMPREHENSIVE INTEGRATION SYSTEM
-- Automatic Business Observation & Learning
-- =====================================================

-- Master list of available integrations
CREATE TABLE public.integration_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  priority INTEGER DEFAULT 50,
  is_required BOOLEAN DEFAULT false,
  is_read_only BOOLEAN DEFAULT false,
  data_types_collected TEXT[] DEFAULT ARRAY[]::TEXT[],
  ai_capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
  setup_url TEXT,
  docs_url TEXT,
  icon_name TEXT,
  secret_keys TEXT[] DEFAULT ARRAY[]::TEXT[],
  oauth_required BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User's connected integrations
CREATE TABLE public.integration_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  integration_key TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  credentials_stored BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  error_message TEXT,
  connected_at TIMESTAMP WITH TIME ZONE,
  connected_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, integration_key)
);

-- Sync logs for integrations
CREATE TABLE public.integration_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  integration_key TEXT NOT NULL,
  sync_type TEXT DEFAULT 'full',
  status TEXT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- CATEGORY I: FINANCIAL DATA
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_id TEXT,
  source TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT,
  customer_id TEXT,
  customer_email TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.financial_metrics_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  gross_revenue NUMERIC DEFAULT 0,
  net_revenue NUMERIC DEFAULT 0,
  refunds NUMERIC DEFAULT 0,
  expenses NUMERIC DEFAULT 0,
  cash_flow NUMERIC DEFAULT 0,
  mrr NUMERIC DEFAULT 0,
  arr NUMERIC DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,
  average_order_value NUMERIC,
  ltv_estimate NUMERIC,
  burn_rate NUMERIC,
  runway_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, metric_date)
);

-- CATEGORY II: CRM & PIPELINE DATA
CREATE TABLE public.crm_contacts_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  source TEXT NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  phone TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_fields JSONB DEFAULT '{}',
  lifecycle_stage TEXT,
  lead_score INTEGER,
  created_external_at TIMESTAMP WITH TIME ZONE,
  updated_external_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, source, external_id)
);

CREATE TABLE public.crm_deals_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  source TEXT NOT NULL,
  contact_external_id TEXT,
  deal_name TEXT,
  pipeline_stage TEXT,
  deal_value NUMERIC,
  currency TEXT DEFAULT 'USD',
  close_probability INTEGER,
  expected_close_date DATE,
  actual_close_date DATE,
  won BOOLEAN,
  lost_reason TEXT,
  days_in_stage INTEGER,
  created_external_at TIMESTAMP WITH TIME ZONE,
  updated_external_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, source, external_id)
);

-- CATEGORY III: CALENDAR & TIME DATA
CREATE TABLE public.calendar_events_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  source TEXT NOT NULL,
  user_id UUID,
  title TEXT,
  event_type TEXT,
  attendees_count INTEGER DEFAULT 0,
  is_revenue_generating BOOLEAN DEFAULT false,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  recurring BOOLEAN DEFAULT false,
  cancelled BOOLEAN DEFAULT false,
  no_show BOOLEAN DEFAULT false,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, source, external_id)
);

CREATE TABLE public.time_tracking_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_id TEXT,
  source TEXT NOT NULL,
  user_id UUID,
  project_name TEXT,
  task_name TEXT,
  category TEXT,
  is_billable BOOLEAN DEFAULT false,
  hourly_rate NUMERIC,
  duration_minutes INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.time_analysis_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID,
  analysis_date DATE NOT NULL,
  total_tracked_minutes INTEGER DEFAULT 0,
  deep_work_minutes INTEGER DEFAULT 0,
  meeting_minutes INTEGER DEFAULT 0,
  admin_minutes INTEGER DEFAULT 0,
  revenue_generating_minutes INTEGER DEFAULT 0,
  revenue_per_hour NUMERIC,
  meeting_roi_score NUMERIC,
  burnout_risk_score NUMERIC,
  opportunity_cost_estimate NUMERIC,
  ai_recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id, analysis_date)
);

-- CATEGORY IV: SOCIAL & CONTENT DATA
CREATE TABLE public.social_accounts_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_account_id TEXT,
  account_name TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  is_connected BOOLEAN DEFAULT true,
  access_token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, platform)
);

CREATE TABLE public.social_posts_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_post_id TEXT NOT NULL,
  post_type TEXT,
  content_preview TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  engagement_rate NUMERIC,
  clicks INTEGER DEFAULT 0,
  video_views INTEGER,
  avg_watch_time_seconds NUMERIC,
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  sentiment_score NUMERIC,
  ai_performance_score NUMERIC,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, platform, external_post_id)
);

CREATE TABLE public.content_performance_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  analysis_period TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  platform TEXT,
  top_performing_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  worst_performing_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  optimal_posting_times JSONB DEFAULT '{}',
  audience_insights JSONB DEFAULT '{}',
  content_recommendations JSONB DEFAULT '[]',
  trend_signals JSONB DEFAULT '[]',
  demand_indicators JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CATEGORY V: WEBSITE & FUNNEL ANALYTICS
CREATE TABLE public.website_analytics_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  analytics_date DATE NOT NULL,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  avg_session_duration_seconds NUMERIC,
  bounce_rate NUMERIC,
  pages_per_session NUMERIC,
  top_pages JSONB DEFAULT '[]',
  top_referrers JSONB DEFAULT '[]',
  device_breakdown JSONB DEFAULT '{}',
  geo_breakdown JSONB DEFAULT '{}',
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, source, analytics_date)
);

CREATE TABLE public.funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  funnel_name TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  visitor_id TEXT,
  session_id TEXT,
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN DEFAULT true,
  time_on_step_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.funnel_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  funnel_name TEXT NOT NULL,
  analysis_date DATE NOT NULL,
  total_entries INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  overall_conversion_rate NUMERIC,
  step_conversion_rates JSONB DEFAULT '{}',
  drop_off_points JSONB DEFAULT '[]',
  friction_points JSONB DEFAULT '[]',
  ai_recommendations JSONB DEFAULT '[]',
  estimated_revenue_lift NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CATEGORY VI: CALL & MEETING TRANSCRIPTS
CREATE TABLE public.call_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  external_id TEXT,
  meeting_title TEXT,
  meeting_type TEXT,
  participants TEXT[] DEFAULT ARRAY[]::TEXT[],
  duration_minutes INTEGER,
  transcript_text TEXT,
  transcript_segments JSONB DEFAULT '[]',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  lead_id UUID REFERENCES public.leads(id),
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.call_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  transcript_id UUID NOT NULL REFERENCES public.call_transcripts(id) ON DELETE CASCADE,
  objections_detected TEXT[] DEFAULT ARRAY[]::TEXT[],
  buyer_signals TEXT[] DEFAULT ARRAY[]::TEXT[],
  competitor_mentions TEXT[] DEFAULT ARRAY[]::TEXT[],
  pricing_discussions JSONB DEFAULT '[]',
  emotional_moments JSONB DEFAULT '[]',
  talk_ratio JSONB DEFAULT '{}',
  sentiment_timeline JSONB DEFAULT '[]',
  key_quotes JSONB DEFAULT '[]',
  deal_killers TEXT[] DEFAULT ARRAY[]::TEXT[],
  deal_accelerators TEXT[] DEFAULT ARRAY[]::TEXT[],
  next_steps_mentioned TEXT[] DEFAULT ARRAY[]::TEXT[],
  win_probability_change NUMERIC,
  ai_recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CATEGORY VII: EMAIL & COMMUNICATION
CREATE TABLE public.email_sync_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  user_email TEXT NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  emails_synced INTEGER DEFAULT 0,
  sync_errors INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, source, user_email)
);

CREATE TABLE public.email_thread_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  thread_external_id TEXT NOT NULL,
  source TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id),
  subject TEXT,
  participants TEXT[] DEFAULT ARRAY[]::TEXT[],
  message_count INTEGER DEFAULT 0,
  our_response_time_avg_minutes NUMERIC,
  their_response_time_avg_minutes NUMERIC,
  sentiment_trend TEXT,
  intent_signals TEXT[] DEFAULT ARRAY[]::TEXT[],
  urgency_level TEXT,
  deal_momentum TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  ai_suggested_actions JSONB DEFAULT '[]',
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CATEGORY VIII: KNOWLEDGE REPOSITORIES
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  document_type TEXT,
  title TEXT NOT NULL,
  content_preview TEXT,
  full_content TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_modified_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  vector_embedded BOOLEAN DEFAULT false,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, source, external_id)
);

-- CATEGORY IX: PASSIVE OBSERVATION MODE
CREATE TABLE public.passive_observations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  observation_type TEXT NOT NULL,
  source_integration TEXT,
  severity TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT,
  data_points JSONB DEFAULT '{}',
  ai_confidence NUMERIC,
  requires_action BOOLEAN DEFAULT false,
  action_deadline TIMESTAMP WITH TIME ZONE,
  suggested_actions JSONB DEFAULT '[]',
  status TEXT DEFAULT 'new',
  viewed_at TIMESTAMP WITH TIME ZONE,
  actioned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.daily_intelligence_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  executive_summary TEXT,
  key_metrics JSONB DEFAULT '{}',
  anomalies_detected JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]',
  auto_actions_taken JSONB DEFAULT '[]',
  pending_approvals JSONB DEFAULT '[]',
  ai_recommendations JSONB DEFAULT '[]',
  health_score NUMERIC,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, report_date)
);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.integration_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_tracking_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_analysis_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_performance_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_thread_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passive_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_intelligence_reports ENABLE ROW LEVEL SECURITY;

-- Integration definitions are public read
CREATE POLICY "Anyone can view integration definitions" ON public.integration_definitions FOR SELECT USING (true);

-- All other tables use organization-based RLS
CREATE POLICY "Users can manage their org integration connections" ON public.integration_connections FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their org sync logs" ON public.integration_sync_logs FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org financial transactions" ON public.financial_transactions FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org financial metrics" ON public.financial_metrics_daily FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org CRM contacts" ON public.crm_contacts_sync FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org CRM deals" ON public.crm_deals_sync FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org calendar events" ON public.calendar_events_sync FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org time tracking" ON public.time_tracking_entries FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org time analysis" ON public.time_analysis_daily FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org social accounts" ON public.social_accounts_sync FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org social posts" ON public.social_posts_sync FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org content analysis" ON public.content_performance_analysis FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org website analytics" ON public.website_analytics_daily FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org funnel events" ON public.funnel_events FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org funnel analysis" ON public.funnel_analysis FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org call transcripts" ON public.call_transcripts FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org call analysis" ON public.call_analysis FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org email sync" ON public.email_sync_status FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org email analysis" ON public.email_thread_analysis FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org knowledge docs" ON public.knowledge_documents FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org passive observations" ON public.passive_observations FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their org intelligence reports" ON public.daily_intelligence_reports FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
);

-- Create indexes for performance
CREATE INDEX idx_integration_connections_org ON public.integration_connections(organization_id);
CREATE INDEX idx_financial_transactions_org_date ON public.financial_transactions(organization_id, transaction_date);
CREATE INDEX idx_crm_deals_org ON public.crm_deals_sync(organization_id);
CREATE INDEX idx_calendar_events_org_time ON public.calendar_events_sync(organization_id, start_time);
CREATE INDEX idx_social_posts_org_platform ON public.social_posts_sync(organization_id, platform);
CREATE INDEX idx_passive_observations_org_status ON public.passive_observations(organization_id, status);
CREATE INDEX idx_daily_reports_org_date ON public.daily_intelligence_reports(organization_id, report_date);