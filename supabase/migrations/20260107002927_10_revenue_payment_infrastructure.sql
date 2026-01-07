/*
  # Revenue & Payment Infrastructure

  1. New Tables
    - `payment_transactions`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `user_id` (uuid, references auth.users)
      - `conversation_id` (uuid, references conversations, nullable)
      - `lead_id` (uuid, references leads, nullable)
      - `amount` (decimal)
      - `currency` (text, default 'USD')
      - `status` (enum: pending, completed, failed, refunded)
      - `payment_method` (text)
      - `stripe_payment_intent_id` (text, unique, nullable)
      - `description` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)

    - `payment_links`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `created_by` (uuid, references auth.users)
      - `conversation_id` (uuid, references conversations, nullable)
      - `title` (text)
      - `description` (text)
      - `amount` (decimal)
      - `currency` (text, default 'USD')
      - `link_url` (text, unique)
      - `status` (enum: active, paid, expired, cancelled)
      - `expires_at` (timestamptz, nullable)
      - `paid_at` (timestamptz, nullable)
      - `payment_transaction_id` (uuid, references payment_transactions, nullable)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

    - `subscription_plans`
      - Subscription plan definitions for recurring billing

    - `subscriptions`
      - Active subscriptions linked to contacts

    - `quotations`
      - Auto-generated price quotes

    - `commission_rules`
      - Commission calculation rules

    - `commission_payments`
      - Commission payment tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their organization's data
*/

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  amount decimal(12, 2) NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  stripe_payment_intent_id text UNIQUE,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  CONSTRAINT valid_payment_amount CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_org ON payment_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe ON payment_transactions(stripe_payment_intent_id);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's payment transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create payment transactions for their organization"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's payment transactions"
  ON payment_transactions FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Payment Links Table
CREATE TABLE IF NOT EXISTS payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  amount decimal(12, 2) NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  link_url text UNIQUE NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  expires_at timestamptz,
  paid_at timestamptz,
  payment_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_payment_link_status CHECK (status IN ('active', 'paid', 'expired', 'cancelled')),
  CONSTRAINT valid_link_amount CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_payment_links_org ON payment_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status);
CREATE INDEX IF NOT EXISTS idx_payment_links_url ON payment_links(link_url);

ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's payment links"
  ON payment_links FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create payment links for their organization"
  ON payment_links FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's payment links"
  ON payment_links FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price decimal(12, 2) NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  billing_interval text NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  stripe_price_id text UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_billing_interval CHECK (billing_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
  CONSTRAINT valid_plan_price CHECK (price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_org ON subscription_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization's subscription plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE RESTRICT NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  stripe_subscription_id text UNIQUE,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  cancelled_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_subscription_status CHECK (status IN ('active', 'paused', 'cancelled', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization's subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  quote_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  line_items jsonb DEFAULT '[]'::jsonb,
  subtotal decimal(12, 2) DEFAULT 0,
  tax decimal(12, 2) DEFAULT 0,
  total decimal(12, 2) DEFAULT 0,
  currency text DEFAULT 'USD' NOT NULL,
  status text DEFAULT 'draft' NOT NULL,
  valid_until timestamptz,
  accepted_at timestamptz,
  payment_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_quotation_status CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_quotations_org ON quotations(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotations_contact ON quotations(contact_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations(quote_number);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's quotations"
  ON quotations FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization's quotations"
  ON quotations FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Commission Rules Table
CREATE TABLE IF NOT EXISTS commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  rule_type text NOT NULL,
  calculation_method text NOT NULL,
  rate decimal(5, 4),
  flat_amount decimal(12, 2),
  conditions jsonb DEFAULT '{}'::jsonb,
  applies_to jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 5,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_commission_type CHECK (rule_type IN ('referral', 'sale', 'subscription', 'lead')),
  CONSTRAINT valid_calculation_method CHECK (calculation_method IN ('percentage', 'flat', 'tiered'))
);

CREATE INDEX IF NOT EXISTS idx_commission_rules_org ON commission_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_active ON commission_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_commission_rules_type ON commission_rules(rule_type);

ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's commission rules"
  ON commission_rules FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization's commission rules"
  ON commission_rules FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Commission Payments Table
CREATE TABLE IF NOT EXISTS commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rule_id uuid REFERENCES commission_rules(id) ON DELETE SET NULL,
  source_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE CASCADE NOT NULL,
  amount decimal(12, 2) NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  paid_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_commission_status CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  CONSTRAINT valid_commission_amount CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_commission_payments_org ON commission_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_recipient ON commission_payments(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_status ON commission_payments(status);

ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's commission payments"
  ON commission_payments FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
    OR recipient_user_id = auth.uid()
  );

CREATE POLICY "Users can create commission payments for their organization"
  ON commission_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's commission payments"
  ON commission_payments FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );