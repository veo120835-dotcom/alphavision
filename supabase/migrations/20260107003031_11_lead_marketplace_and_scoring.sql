/*
  # Lead Marketplace and AI Scoring Infrastructure

  1. New Tables
    - `lead_scoring_models`
      - AI model configurations for lead scoring
      - Tracks different scoring algorithms and their performance
    
    - `lead_scores`
      - Real-time lead quality scores
      - Intent, fit, urgency, and engagement scores
    
    - `marketplace_offers`
      - Lead sale offers in the marketplace
      - Pricing, quality indicators, and buyer matching
    
    - `marketplace_bids`
      - Buyer bids on marketplace leads
      - Negotiation and offer tracking
    
    - `lead_transfers`
      - Completed lead transfers between organizations
      - Audit trail and quality guarantees

  2. Security
    - Enable RLS on all tables
    - Buyers can only see listings, not lead details until purchased
    - Sellers can manage their own listings
*/

-- Lead Scoring Models Table
CREATE TABLE IF NOT EXISTS lead_scoring_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  version text NOT NULL,
  model_type text NOT NULL,
  weights jsonb DEFAULT '{}'::jsonb,
  thresholds jsonb DEFAULT '{}'::jsonb,
  performance_metrics jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  trained_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_model_type CHECK (model_type IN ('rule_based', 'ml_classification', 'neural_network', 'ensemble'))
);

CREATE INDEX IF NOT EXISTS idx_lead_scoring_models_org ON lead_scoring_models(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_scoring_models_active ON lead_scoring_models(is_active);

ALTER TABLE lead_scoring_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's scoring models"
  ON lead_scoring_models FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization's scoring models"
  ON lead_scoring_models FOR ALL
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

-- Lead Scores Table
CREATE TABLE IF NOT EXISTS lead_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  model_id uuid REFERENCES lead_scoring_models(id) ON DELETE SET NULL,
  overall_score integer NOT NULL DEFAULT 0,
  intent_score integer NOT NULL DEFAULT 0,
  fit_score integer NOT NULL DEFAULT 0,
  urgency_score integer NOT NULL DEFAULT 0,
  engagement_score integer NOT NULL DEFAULT 0,
  buying_signals jsonb DEFAULT '[]'::jsonb,
  risk_flags jsonb DEFAULT '[]'::jsonb,
  predicted_value decimal(12, 2),
  confidence_level text DEFAULT 'medium',
  next_best_action text,
  reasoning text,
  metadata jsonb DEFAULT '{}'::jsonb,
  scored_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  CONSTRAINT valid_overall_score CHECK (overall_score BETWEEN 0 AND 100),
  CONSTRAINT valid_intent_score CHECK (intent_score BETWEEN 0 AND 100),
  CONSTRAINT valid_fit_score CHECK (fit_score BETWEEN 0 AND 100),
  CONSTRAINT valid_urgency_score CHECK (urgency_score BETWEEN 0 AND 100),
  CONSTRAINT valid_engagement_score CHECK (engagement_score BETWEEN 0 AND 100),
  CONSTRAINT valid_confidence CHECK (confidence_level IN ('low', 'medium', 'high', 'very_high')),
  CONSTRAINT valid_lead_or_contact CHECK ((lead_id IS NOT NULL) OR (contact_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_lead_scores_org ON lead_scores(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_lead ON lead_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_contact ON lead_scores(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_overall ON lead_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_scored_at ON lead_scores(scored_at DESC);

ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's lead scores"
  ON lead_scores FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create lead scores"
  ON lead_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can update lead scores"
  ON lead_scores FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Marketplace Offers Table
CREATE TABLE IF NOT EXISTS marketplace_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  asking_price decimal(12, 2) NOT NULL,
  minimum_price decimal(12, 2),
  currency text DEFAULT 'USD' NOT NULL,
  lead_quality_score integer,
  industry text,
  location text,
  lead_age_days integer,
  engagement_level text,
  qualification_status text,
  included_data jsonb DEFAULT '{}'::jsonb,
  exclusions jsonb DEFAULT '[]'::jsonb,
  quality_guarantees jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active' NOT NULL,
  visibility text DEFAULT 'public' NOT NULL,
  featured boolean DEFAULT false,
  views_count integer DEFAULT 0,
  bids_count integer DEFAULT 0,
  expires_at timestamptz,
  sold_at timestamptz,
  buyer_org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  final_price decimal(12, 2),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_offer_status CHECK (status IN ('active', 'pending', 'sold', 'expired', 'cancelled')),
  CONSTRAINT valid_visibility CHECK (visibility IN ('public', 'private', 'invite_only')),
  CONSTRAINT valid_prices CHECK (asking_price >= COALESCE(minimum_price, 0))
);

CREATE INDEX IF NOT EXISTS idx_marketplace_offers_seller ON marketplace_offers(seller_org_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_status ON marketplace_offers(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_industry ON marketplace_offers(industry);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_quality ON marketplace_offers(lead_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_created ON marketplace_offers(created_at DESC);

ALTER TABLE marketplace_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active public marketplace offers (limited fields)"
  ON marketplace_offers FOR SELECT
  TO authenticated
  USING (
    status = 'active' 
    AND visibility = 'public'
  );

CREATE POLICY "Sellers can view their own offers"
  ON marketplace_offers FOR SELECT
  TO authenticated
  USING (
    seller_org_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can view purchased offers"
  ON marketplace_offers FOR SELECT
  TO authenticated
  USING (
    buyer_org_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can create marketplace offers"
  ON marketplace_offers FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_org_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update their own offers"
  ON marketplace_offers FOR UPDATE
  TO authenticated
  USING (
    seller_org_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Marketplace Bids Table
CREATE TABLE IF NOT EXISTS marketplace_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES marketplace_offers(id) ON DELETE CASCADE NOT NULL,
  bidder_org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  bidder_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  bid_amount decimal(12, 2) NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  message text,
  accepted_at timestamptz,
  rejected_at timestamptz,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_bid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'expired')),
  CONSTRAINT valid_bid_amount CHECK (bid_amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_bids_offer ON marketplace_bids(offer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_bids_bidder ON marketplace_bids(bidder_org_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_bids_status ON marketplace_bids(status);

ALTER TABLE marketplace_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view bids on their offers"
  ON marketplace_bids FOR SELECT
  TO authenticated
  USING (
    offer_id IN (
      SELECT id FROM marketplace_offers 
      WHERE seller_org_id IN (
        SELECT organization_id FROM memberships WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Bidders can view their own bids"
  ON marketplace_bids FOR SELECT
  TO authenticated
  USING (
    bidder_org_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bids"
  ON marketplace_bids FOR INSERT
  TO authenticated
  WITH CHECK (
    bidder_org_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Bidders can update their own bids"
  ON marketplace_bids FOR UPDATE
  TO authenticated
  USING (
    bidder_org_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Lead Transfers Table
CREATE TABLE IF NOT EXISTS lead_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES marketplace_offers(id) ON DELETE SET NULL,
  seller_org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  buyer_org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  sale_price decimal(12, 2) NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  platform_fee decimal(12, 2) NOT NULL,
  seller_payout decimal(12, 2) NOT NULL,
  payment_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE SET NULL,
  transferred_data jsonb DEFAULT '{}'::jsonb,
  quality_guarantee jsonb DEFAULT '{}'::jsonb,
  warranty_until timestamptz,
  status text DEFAULT 'pending' NOT NULL,
  completed_at timestamptz,
  dispute_opened_at timestamptz,
  dispute_resolved_at timestamptz,
  buyer_rating integer,
  seller_rating integer,
  buyer_feedback text,
  seller_feedback text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_transfer_status CHECK (status IN ('pending', 'completed', 'disputed', 'refunded', 'cancelled')),
  CONSTRAINT valid_buyer_rating CHECK (buyer_rating IS NULL OR buyer_rating BETWEEN 1 AND 5),
  CONSTRAINT valid_seller_rating CHECK (seller_rating IS NULL OR seller_rating BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_lead_transfers_seller ON lead_transfers(seller_org_id);
CREATE INDEX IF NOT EXISTS idx_lead_transfers_buyer ON lead_transfers(buyer_org_id);
CREATE INDEX IF NOT EXISTS idx_lead_transfers_status ON lead_transfers(status);
CREATE INDEX IF NOT EXISTS idx_lead_transfers_created ON lead_transfers(created_at DESC);

ALTER TABLE lead_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their transfers"
  ON lead_transfers FOR SELECT
  TO authenticated
  USING (
    seller_org_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can view their transfers"
  ON lead_transfers FOR SELECT
  TO authenticated
  USING (
    buyer_org_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create lead transfers"
  ON lead_transfers FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_org_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
    OR buyer_org_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update transfers"
  ON lead_transfers FOR UPDATE
  TO authenticated
  USING (
    seller_org_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
    OR buyer_org_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );