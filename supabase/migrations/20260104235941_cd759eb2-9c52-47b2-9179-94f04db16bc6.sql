-- SEED INTEGRATION DEFINITIONS
INSERT INTO public.integration_definitions (integration_key, name, description, category, priority, is_required, is_read_only, data_types_collected, ai_capabilities, setup_url, icon_name, secret_keys, oauth_required, status) VALUES
-- CATEGORY I: Financial (MANDATORY)
('stripe', 'Stripe', 'Payment processing, subscriptions, and revenue tracking', 'financial', 100, true, true, ARRAY['revenue', 'transactions', 'customers', 'subscriptions', 'refunds', 'disputes']::TEXT[], ARRAY['revenue_governor', 'budget_allocation', 'outcome_billing', 'runway_enforcement']::TEXT[], 'https://dashboard.stripe.com/apikeys', 'CreditCard', ARRAY['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']::TEXT[], false, 'available'),
('paypal', 'PayPal', 'Payment processing and money transfers', 'financial', 90, false, true, ARRAY['revenue', 'transactions', 'refunds']::TEXT[], ARRAY['revenue_tracking', 'cash_flow_analysis']::TEXT[], 'https://developer.paypal.com', 'Wallet', ARRAY['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET']::TEXT[], true, 'available'),
('quickbooks', 'QuickBooks', 'Accounting, invoicing, and expense tracking', 'financial', 85, false, true, ARRAY['revenue', 'expenses', 'invoices', 'cash_flow', 'margins']::TEXT[], ARRAY['budget_allocation', 'burn_rate', 'profitability']::TEXT[], NULL, 'Calculator', ARRAY[]::TEXT[], true, 'available'),
('xero', 'Xero', 'Cloud accounting and financial management', 'financial', 85, false, true, ARRAY['revenue', 'expenses', 'invoices', 'cash_flow']::TEXT[], ARRAY['budget_allocation', 'burn_rate']::TEXT[], NULL, 'Calculator', ARRAY[]::TEXT[], true, 'available'),
('plaid', 'Plaid (Read-Only)', 'Bank account connections for real-time cash visibility', 'financial', 80, false, true, ARRAY['bank_balances', 'transactions', 'cash_flow']::TEXT[], ARRAY['runway_enforcement', 'cash_alerts']::TEXT[], NULL, 'Building2', ARRAY['PLAID_CLIENT_ID', 'PLAID_SECRET']::TEXT[], false, 'available'),

-- CATEGORY II: CRM & Pipeline (MANDATORY)
('gohighlevel', 'GoHighLevel', 'All-in-one CRM, automations, and sales pipeline', 'crm', 95, true, false, ARRAY['leads', 'deals', 'pipeline', 'automations', 'calendars']::TEXT[], ARRAY['async_closing', 'pricing_optimization', 'client_scoring', 'demand_forecasting']::TEXT[], 'https://app.gohighlevel.com/settings/integrations', 'Zap', ARRAY['GHL_API_KEY', 'GHL_LOCATION_ID']::TEXT[], false, 'available'),
('hubspot', 'HubSpot', 'CRM, marketing, and sales automation', 'crm', 90, false, false, ARRAY['leads', 'deals', 'companies', 'tickets', 'marketing']::TEXT[], ARRAY['lead_scoring', 'deal_velocity', 'objection_patterns']::TEXT[], NULL, 'Users', ARRAY['HUBSPOT_ACCESS_TOKEN']::TEXT[], true, 'available'),
('salesforce', 'Salesforce', 'Enterprise CRM and sales cloud', 'crm', 88, false, false, ARRAY['leads', 'opportunities', 'accounts', 'forecasts']::TEXT[], ARRAY['enterprise_sales', 'pipeline_analysis']::TEXT[], NULL, 'Cloud', ARRAY[]::TEXT[], true, 'available'),
('pipedrive', 'Pipedrive', 'Sales CRM and pipeline management', 'crm', 85, false, false, ARRAY['leads', 'deals', 'activities']::TEXT[], ARRAY['deal_tracking', 'sales_velocity']::TEXT[], NULL, 'GitBranch', ARRAY['PIPEDRIVE_API_KEY']::TEXT[], false, 'available'),

-- CATEGORY III: Calendar & Time
('google_calendar', 'Google Calendar', 'Calendar events and scheduling', 'calendar', 80, false, true, ARRAY['events', 'availability', 'attendees']::TEXT[], ARRAY['time_optimization', 'meeting_roi', 'burnout_detection']::TEXT[], NULL, 'Calendar', ARRAY['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']::TEXT[], true, 'available'),
('outlook_calendar', 'Outlook Calendar', 'Microsoft calendar and scheduling', 'calendar', 78, false, true, ARRAY['events', 'availability']::TEXT[], ARRAY['time_optimization', 'meeting_roi']::TEXT[], NULL, 'Calendar', ARRAY[]::TEXT[], true, 'available'),
('clockify', 'Clockify', 'Time tracking and productivity', 'calendar', 75, false, true, ARRAY['time_entries', 'projects', 'billable_hours']::TEXT[], ARRAY['revenue_per_hour', 'opportunity_cost']::TEXT[], NULL, 'Clock', ARRAY['CLOCKIFY_API_KEY']::TEXT[], false, 'available'),
('toggl', 'Toggl Track', 'Time tracking and reporting', 'calendar', 75, false, true, ARRAY['time_entries', 'projects']::TEXT[], ARRAY['productivity_analysis', 'time_allocation']::TEXT[], NULL, 'Timer', ARRAY['TOGGL_API_KEY']::TEXT[], false, 'available'),

-- CATEGORY IV: Social Platforms (READ-ONLY)
('linkedin', 'LinkedIn', 'Professional network and content performance', 'social', 70, false, true, ARRAY['posts', 'engagement', 'followers', 'impressions']::TEXT[], ARRAY['content_optimization', 'audience_insights', 'demand_signals']::TEXT[], NULL, 'Linkedin', ARRAY[]::TEXT[], true, 'available'),
('twitter', 'X (Twitter)', 'Social media and content performance', 'social', 68, false, true, ARRAY['tweets', 'engagement', 'followers', 'trends']::TEXT[], ARRAY['trend_detection', 'content_timing']::TEXT[], NULL, 'Twitter', ARRAY[]::TEXT[], true, 'available'),
('instagram', 'Instagram', 'Visual content and stories performance', 'social', 65, false, true, ARRAY['posts', 'stories', 'reels', 'engagement']::TEXT[], ARRAY['visual_content_analysis', 'audience_behavior']::TEXT[], NULL, 'Instagram', ARRAY[]::TEXT[], true, 'available'),
('youtube', 'YouTube', 'Video content performance and analytics', 'social', 65, false, true, ARRAY['videos', 'views', 'watch_time', 'subscribers']::TEXT[], ARRAY['video_optimization', 'retention_analysis']::TEXT[], NULL, 'Youtube', ARRAY[]::TEXT[], true, 'available'),

-- CATEGORY V: Website Analytics
('google_analytics', 'Google Analytics', 'Website traffic and behavior analytics', 'analytics', 72, false, true, ARRAY['pageviews', 'sessions', 'conversions', 'user_flow']::TEXT[], ARRAY['funnel_optimization', 'traffic_analysis']::TEXT[], NULL, 'BarChart3', ARRAY[]::TEXT[], true, 'available'),
('posthog', 'PostHog', 'Product analytics and feature flags', 'analytics', 70, false, true, ARRAY['events', 'funnels', 'feature_flags', 'recordings']::TEXT[], ARRAY['experimentation', 'user_behavior']::TEXT[], NULL, 'Layers', ARRAY['POSTHOG_API_KEY']::TEXT[], false, 'available'),
('hotjar', 'Hotjar', 'Heatmaps, recordings, and feedback', 'analytics', 65, false, true, ARRAY['heatmaps', 'recordings', 'surveys']::TEXT[], ARRAY['friction_detection', 'ux_optimization']::TEXT[], NULL, 'MousePointer', ARRAY['HOTJAR_API_KEY']::TEXT[], false, 'coming_soon'),

-- CATEGORY VI: Call Transcription
('zoom', 'Zoom', 'Video meetings and call recordings', 'communication', 75, false, true, ARRAY['recordings', 'transcripts', 'participants']::TEXT[], ARRAY['objection_detection', 'sentiment_analysis']::TEXT[], NULL, 'Video', ARRAY[]::TEXT[], true, 'available'),
('google_meet', 'Google Meet', 'Video meetings and recordings', 'communication', 73, false, true, ARRAY['recordings', 'transcripts']::TEXT[], ARRAY['meeting_analysis']::TEXT[], NULL, 'Video', ARRAY['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']::TEXT[], true, 'available'),
('otter', 'Otter.ai', 'AI transcription and meeting notes', 'communication', 70, false, true, ARRAY['transcripts', 'summaries', 'action_items']::TEXT[], ARRAY['conversation_intelligence']::TEXT[], NULL, 'FileText', ARRAY['OTTER_API_KEY']::TEXT[], false, 'coming_soon'),
('fireflies', 'Fireflies.ai', 'AI meeting assistant and transcription', 'communication', 70, false, true, ARRAY['transcripts', 'summaries', 'insights']::TEXT[], ARRAY['deal_intelligence']::TEXT[], NULL, 'Mic', ARRAY['FIREFLIES_API_KEY']::TEXT[], false, 'coming_soon'),

-- CATEGORY VII: Email & Communication
('gmail', 'Gmail', 'Email communication and sequences', 'communication', 78, false, false, ARRAY['emails', 'threads', 'labels']::TEXT[], ARRAY['intent_detection', 'response_timing', 'deal_momentum']::TEXT[], NULL, 'Mail', ARRAY['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']::TEXT[], true, 'available'),
('outlook_mail', 'Outlook Mail', 'Microsoft email and communication', 'communication', 75, false, false, ARRAY['emails', 'threads']::TEXT[], ARRAY['email_analysis']::TEXT[], NULL, 'Mail', ARRAY[]::TEXT[], true, 'available'),
('slack', 'Slack', 'Team communication and notifications', 'communication', 72, false, false, ARRAY['messages', 'channels', 'notifications']::TEXT[], ARRAY['team_insights', 'quick_approvals']::TEXT[], NULL, 'MessageSquare', ARRAY['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET']::TEXT[], true, 'coming_soon'),

-- CATEGORY VIII: Knowledge Repositories
('notion', 'Notion', 'Docs, wikis, and knowledge base', 'knowledge', 68, false, true, ARRAY['pages', 'databases', 'content']::TEXT[], ARRAY['institutional_memory', 'sop_retrieval']::TEXT[], NULL, 'BookOpen', ARRAY[]::TEXT[], true, 'available'),
('google_drive', 'Google Drive', 'Documents and file storage', 'knowledge', 65, false, true, ARRAY['documents', 'folders', 'content']::TEXT[], ARRAY['document_retrieval', 'knowledge_search']::TEXT[], NULL, 'HardDrive', ARRAY['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']::TEXT[], true, 'available'),
('dropbox', 'Dropbox', 'File storage and sharing', 'knowledge', 60, false, true, ARRAY['files', 'folders']::TEXT[], ARRAY['file_retrieval']::TEXT[], NULL, 'Box', ARRAY[]::TEXT[], true, 'coming_soon'),

-- CATEGORY IX: Automation Platforms
('n8n', 'n8n', 'Automation engine for AI-approved actions', 'automation', 100, true, false, ARRAY['workflows', 'executions', 'errors']::TEXT[], ARRAY['action_execution', 'retry_logic', 'rollback']::TEXT[], NULL, 'Webhook', ARRAY['N8N_WEBHOOK_URL', 'N8N_WEBHOOK_SECRET']::TEXT[], false, 'available'),
('zapier', 'Zapier', 'No-code automation platform', 'automation', 85, false, false, ARRAY['zaps', 'executions']::TEXT[], ARRAY['simple_automation']::TEXT[], NULL, 'Zap', ARRAY['ZAPIER_WEBHOOK_URL']::TEXT[], false, 'available'),
('make', 'Make (Integromat)', 'Advanced automation scenarios', 'automation', 82, false, false, ARRAY['scenarios', 'executions']::TEXT[], ARRAY['complex_automation']::TEXT[], NULL, 'Share2', ARRAY['MAKE_API_KEY']::TEXT[], false, 'coming_soon'),

-- CATEGORY X: Talent & Legal
('linkedin_talent', 'LinkedIn Recruiter', 'Talent sourcing and hiring', 'talent', 55, false, true, ARRAY['candidates', 'jobs', 'applications']::TEXT[], ARRAY['hire_timing', 'role_design']::TEXT[], NULL, 'UserPlus', ARRAY[]::TEXT[], true, 'coming_soon'),
('upwork', 'Upwork', 'Freelance talent marketplace', 'talent', 50, false, true, ARRAY['freelancers', 'contracts', 'hourly_rates']::TEXT[], ARRAY['contractor_analysis']::TEXT[], NULL, 'Briefcase', ARRAY['UPWORK_API_KEY']::TEXT[], false, 'coming_soon'),
('docusign', 'DocuSign', 'Electronic signatures and contracts', 'legal', 60, false, false, ARRAY['envelopes', 'signatures', 'documents']::TEXT[], ARRAY['contract_automation', 'faster_closes']::TEXT[], NULL, 'FileSignature', ARRAY[]::TEXT[], true, 'coming_soon'),
('pandadoc', 'PandaDoc', 'Document automation and e-signatures', 'legal', 58, false, false, ARRAY['documents', 'templates', 'signatures']::TEXT[], ARRAY['proposal_automation']::TEXT[], NULL, 'FileText', ARRAY['PANDADOC_API_KEY']::TEXT[], false, 'coming_soon');