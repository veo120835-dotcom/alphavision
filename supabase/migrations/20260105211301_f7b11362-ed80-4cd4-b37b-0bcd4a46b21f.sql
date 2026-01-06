-- Phase 2: Tag Taxonomy Engine
-- Tags table for taxonomy management
CREATE TABLE public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'custom', -- status, source, quality, intent, custom
  color TEXT DEFAULT '#6366f1',
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Tag applications (polymorphic tagging)
CREATE TABLE public.tag_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL, -- contact, company, opportunity, lead
  entity_id UUID NOT NULL,
  applied_by UUID REFERENCES auth.users(id),
  applied_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tag_id, entity_type, entity_id)
);

-- Auto-tag rules for automation
CREATE TABLE public.auto_tag_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]', -- [{field, operator, value}]
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 3: Campaign/Sequence Engine
CREATE TABLE public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'email', -- email, sms, multi
  status TEXT DEFAULT 'draft', -- draft, active, paused, completed, archived
  trigger_type TEXT, -- manual, tag_added, stage_change, form_submit, booking
  trigger_config JSONB DEFAULT '{}',
  stop_conditions JSONB DEFAULT '[]', -- [unsubscribe, reply, booked, closed]
  settings JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{"enrolled": 0, "completed": 0, "converted": 0}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.campaign_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  step_type TEXT NOT NULL, -- email, sms, delay, condition, branch, webhook
  delay_minutes INTEGER DEFAULT 0,
  subject TEXT,
  body TEXT,
  template_id UUID,
  branch_conditions JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, step_number)
);

CREATE TABLE public.campaign_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, completed, stopped, bounced, paused
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  next_step_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stop_reason TEXT,
  metadata JSONB DEFAULT '{}',
  UNIQUE(campaign_id, contact_id)
);

CREATE TABLE public.campaign_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID REFERENCES public.campaign_enrollments(id) ON DELETE CASCADE NOT NULL,
  step_id UUID REFERENCES public.campaign_steps(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- sent, delivered, opened, clicked, replied, bounced, unsubscribed
  occurred_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Phase 4: Booking Engine
CREATE TABLE public.availability_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.booking_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  buffer_before_minutes INTEGER DEFAULT 0,
  buffer_after_minutes INTEGER DEFAULT 15,
  color TEXT DEFAULT '#6366f1',
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  booking_type_id UUID REFERENCES public.booking_types(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, completed, no_show, rescheduled
  google_event_id TEXT,
  zoom_link TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 5: Meta Ads Manager
CREATE TABLE public.ad_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  platform TEXT DEFAULT 'meta', -- meta, google, linkedin
  external_account_id TEXT NOT NULL,
  name TEXT,
  currency TEXT DEFAULT 'USD',
  timezone TEXT,
  status TEXT DEFAULT 'active',
  credentials_encrypted TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, platform, external_account_id)
);

CREATE TABLE public.meta_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE CASCADE NOT NULL,
  external_campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  objective TEXT,
  status TEXT,
  daily_budget DECIMAL(12,2),
  lifetime_budget DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  settings JSONB DEFAULT '{}',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ad_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.meta_campaigns(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(12,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  ctr DECIMAL(8,4),
  cpc DECIMAL(10,2),
  cpm DECIMAL(10,2),
  roas DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, date)
);

-- Phase 6: Message Logs
CREATE TABLE public.message_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  channel TEXT NOT NULL, -- email, sms, whatsapp
  direction TEXT NOT NULL, -- outbound, inbound
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, bounced, failed, opened, clicked
  provider TEXT, -- resend, twilio, sendgrid
  provider_id TEXT,
  campaign_step_id UUID REFERENCES public.campaign_steps(id) ON DELETE SET NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 7: Email Templates
CREATE TABLE public.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- welcome, follow-up, booking, invoice, nurture, win-back
  subject_template TEXT,
  blocks JSONB NOT NULL DEFAULT '[]', -- Block-based content
  preview_text TEXT,
  variables JSONB DEFAULT '[]', -- Available merge tags
  status TEXT DEFAULT 'draft', -- draft, active, archived
  version INTEGER DEFAULT 1,
  stats JSONB DEFAULT '{"sends": 0, "opens": 0, "clicks": 0}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.email_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  rendered_html TEXT,
  provider TEXT DEFAULT 'resend',
  provider_message_id TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.unsubscribes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  reason TEXT,
  unsubscribed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Phase 8: Forms & Surveys
CREATE TABLE public.forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  form_type TEXT DEFAULT 'form', -- form, survey, quiz
  fields JSONB NOT NULL DEFAULT '[]', -- Field definitions
  settings JSONB DEFAULT '{}',
  styling JSONB DEFAULT '{}',
  thank_you_message TEXT,
  redirect_url TEXT,
  status TEXT DEFAULT 'draft', -- draft, active, archived
  submission_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE TABLE public.form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  route TEXT,
  tags_applied TEXT[],
  metadata JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.survey_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  rules JSONB NOT NULL DEFAULT '[]', -- Scoring/routing rules
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 9: Invoicing & Payments
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  stripe_product_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT DEFAULT 'service', -- service, digital, course, subscription
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  stripe_price_id TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_period TEXT, -- one_time, monthly, yearly
  trial_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT,
  invoice_number TEXT,
  status TEXT DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled, void
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  line_items JSONB DEFAULT '[]',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- pending, succeeded, failed, refunded
  payment_method TEXT,
  refund_amount DECIMAL(12,2),
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  price_id UUID REFERENCES public.prices(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active', -- active, past_due, cancelled, trialing
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 10: Courses & LMS
CREATE TABLE public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  price_id UUID REFERENCES public.prices(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft', -- draft, published, archived
  is_free BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  drip_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE TABLE public.modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  drip_delay_days INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content_html TEXT,
  content_blocks JSONB DEFAULT '[]',
  video_url TEXT,
  video_provider TEXT, -- youtube, vimeo, bunny, custom
  duration_minutes INTEGER,
  attachments JSONB DEFAULT '[]',
  position INTEGER NOT NULL,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active', -- active, completed, expired, refunded
  progress JSONB DEFAULT '{}', -- {lesson_id: completed}
  completed_lessons INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  UNIQUE(course_id, contact_id)
);

CREATE TABLE public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  passed BOOLEAN,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT now(),
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Phase 11: Template Library
CREATE TABLE public.platform_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- workflow, campaign, pipeline, form, email, course
  name TEXT NOT NULL,
  description TEXT,
  niche TEXT, -- real_estate, agency, saas, coaching, ecommerce
  config JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT true,
  popularity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.template_deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.platform_templates(id) ON DELETE SET NULL,
  deployed_entity_type TEXT NOT NULL,
  deployed_entity_id UUID NOT NULL,
  deployed_at TIMESTAMPTZ DEFAULT now(),
  deployed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all new tables
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_tag_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_deployments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Users can view tags in their organization" ON public.tags FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create tags in their organization" ON public.tags FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update tags in their organization" ON public.tags FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete non-system tags" ON public.tags FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) AND is_system = false);

-- RLS Policies for tag_applications
CREATE POLICY "Users can view tag applications in their org" ON public.tag_applications FOR SELECT USING (tag_id IN (SELECT id FROM public.tags WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Users can create tag applications" ON public.tag_applications FOR INSERT WITH CHECK (tag_id IN (SELECT id FROM public.tags WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Users can delete tag applications" ON public.tag_applications FOR DELETE USING (tag_id IN (SELECT id FROM public.tags WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- RLS Policies for auto_tag_rules
CREATE POLICY "Users can manage auto tag rules" ON public.auto_tag_rules FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for campaigns
CREATE POLICY "Users can manage campaigns" ON public.campaigns FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for campaign_steps
CREATE POLICY "Users can manage campaign steps" ON public.campaign_steps FOR ALL USING (campaign_id IN (SELECT id FROM public.campaigns WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- RLS Policies for campaign_enrollments
CREATE POLICY "Users can manage enrollments" ON public.campaign_enrollments FOR ALL USING (campaign_id IN (SELECT id FROM public.campaigns WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- RLS Policies for campaign_events
CREATE POLICY "Users can view campaign events" ON public.campaign_events FOR SELECT USING (enrollment_id IN (SELECT id FROM public.campaign_enrollments WHERE campaign_id IN (SELECT id FROM public.campaigns WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))));

-- RLS Policies for availability_rules
CREATE POLICY "Users can manage availability" ON public.availability_rules FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for booking_types
CREATE POLICY "Users can manage booking types" ON public.booking_types FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for bookings
CREATE POLICY "Users can manage bookings" ON public.bookings FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for ad_accounts
CREATE POLICY "Users can manage ad accounts" ON public.ad_accounts FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for meta_campaigns
CREATE POLICY "Users can manage meta campaigns" ON public.meta_campaigns FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for ad_insights
CREATE POLICY "Users can view ad insights" ON public.ad_insights FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for message_logs
CREATE POLICY "Users can view message logs" ON public.message_logs FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for email_templates
CREATE POLICY "Users can manage email templates" ON public.email_templates FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for email_sends
CREATE POLICY "Users can view email sends" ON public.email_sends FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for unsubscribes
CREATE POLICY "Users can manage unsubscribes" ON public.unsubscribes FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for forms
CREATE POLICY "Users can manage forms" ON public.forms FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for form_submissions
CREATE POLICY "Users can view form submissions" ON public.form_submissions FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for survey_rules
CREATE POLICY "Users can manage survey rules" ON public.survey_rules FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for products
CREATE POLICY "Users can manage products" ON public.products FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for prices
CREATE POLICY "Users can manage prices" ON public.prices FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for invoices
CREATE POLICY "Users can manage invoices" ON public.invoices FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for payments
CREATE POLICY "Users can view payments" ON public.payments FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for subscriptions
CREATE POLICY "Users can manage subscriptions" ON public.subscriptions FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for courses
CREATE POLICY "Users can manage courses" ON public.courses FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for modules
CREATE POLICY "Users can manage modules" ON public.modules FOR ALL USING (course_id IN (SELECT id FROM public.courses WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- RLS Policies for lessons
CREATE POLICY "Users can manage lessons" ON public.lessons FOR ALL USING (module_id IN (SELECT id FROM public.modules WHERE course_id IN (SELECT id FROM public.courses WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))));

-- RLS Policies for enrollments
CREATE POLICY "Users can manage enrollments" ON public.enrollments FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for quizzes
CREATE POLICY "Users can manage quizzes" ON public.quizzes FOR ALL USING (lesson_id IN (SELECT id FROM public.lessons WHERE module_id IN (SELECT id FROM public.modules WHERE course_id IN (SELECT id FROM public.courses WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())))));

-- RLS Policies for quiz_attempts
CREATE POLICY "Users can view quiz attempts" ON public.quiz_attempts FOR ALL USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- RLS Policies for certificates
CREATE POLICY "Users can view certificates" ON public.certificates FOR ALL USING (course_id IN (SELECT id FROM public.courses WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- RLS Policies for platform_templates (public read)
CREATE POLICY "Anyone can view system templates" ON public.platform_templates FOR SELECT USING (is_system = true);

-- RLS Policies for template_deployments
CREATE POLICY "Users can manage template deployments" ON public.template_deployments FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_tags_org ON public.tags(organization_id);
CREATE INDEX idx_tag_applications_entity ON public.tag_applications(entity_type, entity_id);
CREATE INDEX idx_campaigns_org ON public.campaigns(organization_id);
CREATE INDEX idx_campaign_enrollments_contact ON public.campaign_enrollments(contact_id);
CREATE INDEX idx_bookings_org ON public.bookings(organization_id);
CREATE INDEX idx_bookings_time ON public.bookings(start_time, end_time);
CREATE INDEX idx_ad_insights_date ON public.ad_insights(campaign_id, date);
CREATE INDEX idx_message_logs_contact ON public.message_logs(contact_id);
CREATE INDEX idx_forms_slug ON public.forms(organization_id, slug);
CREATE INDEX idx_invoices_contact ON public.invoices(contact_id);
CREATE INDEX idx_courses_slug ON public.courses(organization_id, slug);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);

-- Triggers for updated_at
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_booking_types_updated_at BEFORE UPDATE ON public.booking_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_meta_campaigns_updated_at BEFORE UPDATE ON public.meta_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();