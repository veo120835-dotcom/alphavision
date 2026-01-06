/*
  # Booking and Infrastructure Tables

  1. Booking Tables
    - `booking_types` - Types of bookings/appointments
    - `bookings` - Appointment bookings

  2. Infrastructure Tables
    - `idempotency_keys` - Prevent duplicate operations
    - `rate_limit_records` - Rate limiting tracker
    - `notifications` - User notifications
    - `lead_listings` - Marketplace listings
    - `marketplace_transactions` - Marketplace sales

  3. Security
    - Enable RLS on all tables
    - Add policies for organization members
*/

-- Booking Types
CREATE TABLE IF NOT EXISTS public.booking_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  color TEXT DEFAULT '#3b82f6',
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_type_id UUID REFERENCES public.booking_types(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed',
  location TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Idempotency Keys
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  response_data JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(key, organization_id)
);

-- Rate Limit Records
CREATE TABLE IF NOT EXISTS public.rate_limit_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lead Listings (for marketplace)
CREATE TABLE IF NOT EXISTS public.lead_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'active',
  description TEXT,
  buyer_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  sold_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketplace Transactions
CREATE TABLE IF NOT EXISTS public.marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.lead_listings(id) ON DELETE CASCADE,
  buyer_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  seller_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  platform_fee NUMERIC NOT NULL,
  seller_payout NUMERIC NOT NULL,
  payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_transactions ENABLE ROW LEVEL SECURITY;

-- Service role policies
DROP POLICY IF EXISTS "Service role full access to idempotency_keys" ON public.idempotency_keys;
CREATE POLICY "Service role full access to idempotency_keys"
  ON public.idempotency_keys FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to rate_limit_records" ON public.rate_limit_records;
CREATE POLICY "Service role full access to rate_limit_records"
  ON public.rate_limit_records FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to lead_listings" ON public.lead_listings;
CREATE POLICY "Service role full access to lead_listings"
  ON public.lead_listings FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to marketplace_transactions" ON public.marketplace_transactions;
CREATE POLICY "Service role full access to marketplace_transactions"
  ON public.marketplace_transactions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- User policies
DROP POLICY IF EXISTS "Users can view bookings in their organizations" ON public.bookings;
CREATE POLICY "Users can view bookings in their organizations"
  ON public.bookings FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
CREATE POLICY "Users can view notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view lead listings" ON public.lead_listings;
CREATE POLICY "Users can view lead listings"
  ON public.lead_listings FOR SELECT
  TO authenticated
  USING (
    status = 'active' OR
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_org ON public.bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON public.bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_lookup ON public.idempotency_keys(key, organization_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_records_lookup ON public.rate_limit_records(key, window_start);
CREATE INDEX IF NOT EXISTS idx_notifications_org_unread ON public.notifications(organization_id, read);
CREATE INDEX IF NOT EXISTS idx_lead_listings_status ON public.lead_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_status ON public.marketplace_transactions(status);