-- Fix function search path for calculate_founder_substitution_index
CREATE OR REPLACE FUNCTION public.calculate_founder_substitution_index(org_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  dep_decision DECIMAL;
  dep_creativity DECIMAL;
  dep_sales DECIMAL;
  dep_authority DECIMAL;
  dep_emotional DECIMAL;
  dep_relationship DECIMAL;
  weighted_avg DECIMAL;
BEGIN
  SELECT 
    COALESCE(decision_dependency, 0.9),
    COALESCE(creativity_dependency, 0.8),
    COALESCE(sales_dependency, 0.8),
    COALESCE(authority_dependency, 0.9),
    COALESCE(emotional_dependency, 0.7),
    COALESCE(relationship_dependency, 0.8)
  INTO dep_decision, dep_creativity, dep_sales, dep_authority, dep_emotional, dep_relationship
  FROM public.founder_substitution_index
  WHERE organization_id = org_id
  ORDER BY measurement_date DESC
  LIMIT 1;
  
  -- Weighted average (decisions and authority weigh more)
  weighted_avg := (dep_decision * 0.25 + dep_creativity * 0.15 + dep_sales * 0.20 + 
                   dep_authority * 0.20 + dep_emotional * 0.10 + dep_relationship * 0.10);
  
  RETURN weighted_avg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;