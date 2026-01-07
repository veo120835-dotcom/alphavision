/*
  # Event Bus Infrastructure for n8n Integration

  1. Overview
    - Creates event-driven architecture foundation
    - Enables n8n workflow orchestration
    - Core App emits events → n8n subscribes → n8n calls Core App APIs
    - Supports retry, idempotency, and tracing

  2. New Tables
    - `system_events`: All events emitted by the system
    - `webhook_subscriptions`: n8n webhook subscriptions
    - `webhook_deliveries`: Delivery log for observability
    - `processing_jobs`: Async job queue
    - `provider_messages`: Unified message storage across all channels
    - `conversations`: Unified conversation threads

  3. Security
    - RLS enabled on all tables
    - Organizations can only access their own data
*/

-- Create system_events table
CREATE TABLE IF NOT EXISTS system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT,
  entity_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  trace_id TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view own events"
  ON system_events FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Create webhook_subscriptions table
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  event_types TEXT[] NOT NULL DEFAULT '{}',
  webhook_url TEXT NOT NULL,
  secret TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  retry_config JSONB DEFAULT '{"max_attempts": 3, "backoff_seconds": [1, 5, 15]}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can manage own webhooks"
  ON webhook_subscriptions FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Create webhook_deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES system_events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view own deliveries"
  ON webhook_deliveries FOR SELECT
  TO authenticated
  USING (
    subscription_id IN (
      SELECT id FROM webhook_subscriptions
      WHERE organization_id IN (
        SELECT organization_id FROM memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create processing_jobs table
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  priority INTEGER DEFAULT 5,
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB,
  error TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  trace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view own jobs"
  ON processing_jobs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  assigned_to UUID REFERENCES auth.users(id),
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can manage own conversations"
  ON conversations FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Create provider_messages table
CREATE TABLE IF NOT EXISTS provider_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  direction TEXT NOT NULL,
  provider_message_id TEXT,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE provider_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can manage own messages"
  ON provider_messages FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_events_org_id ON system_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_system_events_event_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_trace_id ON system_events(trace_id);
CREATE INDEX IF NOT EXISTS idx_system_events_entity ON system_events(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_org_id ON webhook_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_active ON webhook_subscriptions(active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_subscription_id ON webhook_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_id ON webhook_deliveries(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_org_id ON processing_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_scheduled ON processing_jobs(scheduled_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_processing_jobs_trace_id ON processing_jobs(trace_id);

CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_id ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_messages_org_id ON provider_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_messages_contact_id ON provider_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_provider_messages_conversation_id ON provider_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_provider_messages_channel ON provider_messages(channel);
CREATE INDEX IF NOT EXISTS idx_provider_messages_created_at ON provider_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_messages_provider_id ON provider_messages(provider_message_id);

-- Create trigger function for updated_at if not exists
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
DROP TRIGGER IF EXISTS set_webhook_subscriptions_updated_at ON webhook_subscriptions;
CREATE TRIGGER set_webhook_subscriptions_updated_at
  BEFORE UPDATE ON webhook_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_conversations_updated_at ON conversations;
CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
