-- Fix function search paths for security
CREATE OR REPLACE FUNCTION increment_variant_success(p_variant_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.prompt_variants 
  SET successes = successes + 1 
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION increment_variant_uses(p_variant_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.prompt_variants 
  SET uses = uses + 1 
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;