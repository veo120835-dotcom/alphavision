/*
  # Default Data and Helper Functions

  1. Helper Functions
    - `cleanup_expired_records` - Clean up expired idempotency and rate limit records

  2. Default Data
    - Create default "Alpha Vision Demo" organization
    - Initialize credit account with 100 free credits

  3. Admin Setup
    - Instructions for creating admin user
*/

-- Cleanup function for expired records
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.idempotency_keys
  WHERE expires_at < now() - INTERVAL '1 hour';

  DELETE FROM public.rate_limit_records
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$;

-- Create default organization
DO $$
DECLARE
  default_org_id UUID;
  org_exists BOOLEAN;
BEGIN
  -- Check if demo org already exists
  SELECT EXISTS(SELECT 1 FROM public.organizations WHERE slug = 'alpha-vision-demo') INTO org_exists;
  
  IF NOT org_exists THEN
    INSERT INTO public.organizations (name, slug)
    VALUES ('Alpha Vision Demo', 'alpha-vision-demo')
    RETURNING id INTO default_org_id;

    -- Initialize credit account for demo org
    INSERT INTO public.decision_credits (organization_id, balance, total_purchased)
    VALUES (default_org_id, 100, 100);

    RAISE NOTICE 'Default organization created with ID: % and 100 free credits', default_org_id;
  ELSE
    RAISE NOTICE 'Default organization already exists';
  END IF;
END $$;