/*
  # AI Agent Packs Infrastructure

  ## Overview
  This migration creates the complete infrastructure for AI Agent Packs - niche-specific AI-operated 
  business systems that include websites, funnels, workflows, and pretrained AI agent behavior.

  ## New Tables

  ### 1. `niche_agent_packs`
  Master table for complete niche-based AI agent systems
  - `id` (uuid, primary key)
  - `name` (text) - Display name
  - `slug` (text, unique) - URL-safe identifier
  - `niche` (text) - Target industry/vertical
  - `description` (text) - What this pack does
  - `icon` (text) - Icon identifier
  - `popularity` (integer) - Deploy count
  - `is_featured` (boolean)
  - `pricing_tiers` (jsonb) - Recommended pricing structure
  - `setup_time_minutes` (integer) - Expected setup time
  - `tags` (text[]) - Searchable tags
  - `metadata` (jsonb)

  ### 2. `agent_behaviors`
  AI agent personality, rules, and decision-making logic
  - `id` (uuid, primary key)
  - `pack_id` (uuid) - Foreign key to niche_agent_packs
  - `agent_name` (text) - e.g., "Sales Qualifier", "Objection Handler"
  - `agent_type` (text) - sales, support, reactivation, qualification
  - `goal` (text) - Primary objective
  - `personality` (text) - professional, luxury, friendly, authoritative
  - `tone` (text) - conversational, formal, casual
  - `rules` (jsonb) - Pricing boundaries, disqualifiers, escalation conditions
  - `objection_handling` (jsonb) - Common objections and responses
  - `qualification_criteria` (jsonb) - Lead scoring rules
  - `escalation_rules` (jsonb) - When to hand off to human
  - `memory_config` (jsonb) - What context to retain
  - `channel_behaviors` (jsonb) - Different behavior per channel

  ### 3. `channel_configurations`
  Channel-specific execution logic for agents
  - `id` (uuid, primary key)
  - `behavior_id` (uuid) - Foreign key to agent_behaviors
  - `channel` (text) - whatsapp, sms, email, webchat
  - `message_style` (text) - conversational, concise, structured
  - `max_message_length` (integer)
  - `use_emojis` (boolean)
  - `response_delay_seconds` (integer)
  - `templates` (jsonb) - Channel-specific message templates
  - `metadata` (jsonb)

  ### 4. `platform_templates`
  Website, funnel, and page templates
  - `id` (uuid, primary key)
  - `pack_id` (uuid) - Foreign key to niche_agent_packs
  - `template_type` (text) - website, landing_page, funnel, form
  - `name` (text)
  - `description` (text)
  - `preview_url` (text)
  - `html_content` (text)
  - `css_content` (text)
  - `js_content` (text)
  - `schema` (jsonb) - Page structure/config
  - `is_system` (boolean)
  - `category` (text)
  - `popularity` (integer)
  - `metadata` (jsonb)

  ### 5. `workflow_templates`
  AI-powered workflow templates with decision nodes
  - `id` (uuid, primary key)
  - `pack_id` (uuid) - Foreign key to niche_agent_packs
  - `template_id` (text, unique)
  - `name` (text)
  - `description` (text)
  - `category` (text)
  - `trigger_event` (text)
  - `actions` (jsonb) - Workflow steps including AI decision nodes
  - `ai_decision_points` (jsonb) - Where AI makes decisions
  - `governance_config` (jsonb)
  - `learning_signals` (text[])
  - `template_variables` (jsonb)
  - `priority` (integer)
  - `is_core_template` (boolean)

  ### 6. `automation_workflows`
  Deployed workflow instances
  - `id` (uuid, primary key)
  - `organization_id` (uuid) - Foreign key
  - `template_id` (text) - Reference to workflow_templates
  - `name` (text)
  - `description` (text)
  - `trigger_config` (jsonb)
  - `action_sequence` (jsonb)
  - `is_active` (boolean)
  - `execution_count` (integer)
  - `last_executed_at` (timestamptz)
  - `success_rate` (numeric)
  - `metadata` (jsonb)

  ### 7. `template_deployments`
  Track what has been deployed to each organization
  - `id` (uuid, primary key)
  - `organization_id` (uuid)
  - `pack_id` (uuid) - Foreign key to niche_agent_packs
  - `template_id` (uuid) - Foreign key to platform_templates
  - `deployed_entity_type` (text)
  - `deployed_entity_id` (uuid)
  - `customizations` (jsonb)
  - `deployed_at` (timestamptz)

  ### 8. `agent_training_data`
  Custom training data for power users
  - `id` (uuid, primary key)
  - `organization_id` (uuid)
  - `behavior_id` (uuid) - Foreign key to agent_behaviors
  - `data_type` (text) - faq, transcript, script, objection
  - `content` (text)
  - `tags` (text[])
  - `is_active` (boolean)
  - `metadata` (jsonb)

  ### 9. `ai_conversation_memory`
  Unified conversation context across channels
  - `id` (uuid, primary key)
  - `organization_id` (uuid)
  - `contact_id` (uuid) - Foreign key to contacts
  - `channel` (text)
  - `message_type` (text) - inbound, outbound, system
  - `content` (text)
  - `ai_context` (jsonb) - Intent, sentiment, extracted data
  - `agent_decision` (jsonb) - What the AI decided to do
  - `created_at` (timestamptz)

  ### 10. `lead_intelligence_scores`
  AI-powered lead scoring and qualification
  - `id` (uuid, primary key)
  - `organization_id` (uuid)
  - `contact_id` (uuid) - Foreign key to contacts
  - `overall_score` (integer)
  - `intent_score` (integer)
  - `fit_score` (integer)
  - `urgency_score` (integer)
  - `ai_confidence` (text) - high, medium, low
  - `qualification_status` (text) - qualified, nurture, disqualified
  - `recommended_action` (text)
  - `reasoning` (text)
  - `signals` (jsonb)
  - `last_updated` (timestamptz)

  ## Security
  All tables have RLS enabled with appropriate policies
*/

-- Create niche_agent_packs table
CREATE TABLE IF NOT EXISTS niche_agent_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  niche text NOT NULL,
  description text,
  icon text DEFAULT 'Package',
  popularity integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  pricing_tiers jsonb DEFAULT '[]'::jsonb,
  setup_time_minutes integer DEFAULT 15,
  tags text[] DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE niche_agent_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agent packs"
  ON niche_agent_packs FOR SELECT
  TO authenticated
  USING (true);

-- Create agent_behaviors table
CREATE TABLE IF NOT EXISTS agent_behaviors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid REFERENCES niche_agent_packs(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  agent_type text NOT NULL,
  goal text NOT NULL,
  personality text DEFAULT 'professional',
  tone text DEFAULT 'conversational',
  rules jsonb DEFAULT '{}'::jsonb,
  objection_handling jsonb DEFAULT '{}'::jsonb,
  qualification_criteria jsonb DEFAULT '{}'::jsonb,
  escalation_rules jsonb DEFAULT '{}'::jsonb,
  memory_config jsonb DEFAULT '{}'::jsonb,
  channel_behaviors jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agent_behaviors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agent behaviors"
  ON agent_behaviors FOR SELECT
  TO authenticated
  USING (true);

-- Create channel_configurations table
CREATE TABLE IF NOT EXISTS channel_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  behavior_id uuid REFERENCES agent_behaviors(id) ON DELETE CASCADE,
  channel text NOT NULL,
  message_style text DEFAULT 'conversational',
  max_message_length integer DEFAULT 1000,
  use_emojis boolean DEFAULT true,
  response_delay_seconds integer DEFAULT 2,
  templates jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE channel_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view channel configs"
  ON channel_configurations FOR SELECT
  TO authenticated
  USING (true);

-- Create platform_templates table
CREATE TABLE IF NOT EXISTS platform_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid REFERENCES niche_agent_packs(id) ON DELETE SET NULL,
  template_type text NOT NULL,
  name text NOT NULL,
  description text,
  preview_url text,
  html_content text,
  css_content text,
  js_content text,
  schema jsonb DEFAULT '{}'::jsonb,
  is_system boolean DEFAULT true,
  category text,
  popularity integer DEFAULT 0,
  niche text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform templates"
  ON platform_templates FOR SELECT
  TO authenticated
  USING (true);

-- Create workflow_templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid REFERENCES niche_agent_packs(id) ON DELETE SET NULL,
  template_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  trigger_event text NOT NULL,
  actions jsonb DEFAULT '[]'::jsonb,
  ai_decision_points jsonb DEFAULT '[]'::jsonb,
  governance_config jsonb DEFAULT '{}'::jsonb,
  learning_signals text[] DEFAULT '{}'::text[],
  template_variables jsonb DEFAULT '{}'::jsonb,
  priority integer DEFAULT 5,
  is_core_template boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workflow templates"
  ON workflow_templates FOR SELECT
  TO authenticated
  USING (true);

-- Create automation_workflows table
CREATE TABLE IF NOT EXISTS automation_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  template_id text,
  name text NOT NULL,
  description text,
  trigger_config jsonb DEFAULT '{}'::jsonb,
  action_sequence jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  execution_count integer DEFAULT 0,
  last_executed_at timestamptz,
  success_rate numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org workflows"
  ON automation_workflows FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org workflows"
  ON automation_workflows FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own org workflows"
  ON automation_workflows FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Create template_deployments table
CREATE TABLE IF NOT EXISTS template_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  pack_id uuid REFERENCES niche_agent_packs(id) ON DELETE SET NULL,
  template_id uuid,
  deployed_entity_type text,
  deployed_entity_id uuid,
  customizations jsonb DEFAULT '{}'::jsonb,
  deployed_at timestamptz DEFAULT now()
);

ALTER TABLE template_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org deployments"
  ON template_deployments FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org deployments"
  ON template_deployments FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Create agent_training_data table
CREATE TABLE IF NOT EXISTS agent_training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  behavior_id uuid REFERENCES agent_behaviors(id) ON DELETE CASCADE,
  data_type text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agent_training_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own org training data"
  ON agent_training_data FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Create ai_conversation_memory table
CREATE TABLE IF NOT EXISTS ai_conversation_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  channel text NOT NULL,
  message_type text NOT NULL,
  content text NOT NULL,
  ai_context jsonb DEFAULT '{}'::jsonb,
  agent_decision jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_conversation_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org conversation memory"
  ON ai_conversation_memory FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org conversation memory"
  ON ai_conversation_memory FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Create lead_intelligence_scores table
CREATE TABLE IF NOT EXISTS lead_intelligence_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  overall_score integer DEFAULT 0,
  intent_score integer DEFAULT 0,
  fit_score integer DEFAULT 0,
  urgency_score integer DEFAULT 0,
  ai_confidence text DEFAULT 'medium',
  qualification_status text DEFAULT 'pending',
  recommended_action text,
  reasoning text,
  signals jsonb DEFAULT '{}'::jsonb,
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE lead_intelligence_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org intelligence scores"
  ON lead_intelligence_scores FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org intelligence scores"
  ON lead_intelligence_scores FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_niche_agent_packs_niche ON niche_agent_packs(niche);
CREATE INDEX IF NOT EXISTS idx_niche_agent_packs_slug ON niche_agent_packs(slug);
CREATE INDEX IF NOT EXISTS idx_agent_behaviors_pack_id ON agent_behaviors(pack_id);
CREATE INDEX IF NOT EXISTS idx_channel_configurations_behavior_id ON channel_configurations(behavior_id);
CREATE INDEX IF NOT EXISTS idx_platform_templates_pack_id ON platform_templates(pack_id);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_pack_id ON workflow_templates(pack_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_org_id ON automation_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_template_deployments_org_id ON template_deployments(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_memory_contact_id ON ai_conversation_memory(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_intelligence_scores_contact_id ON lead_intelligence_scores(contact_id);
