-- Create function for vector similarity search on org_knowledge
CREATE OR REPLACE FUNCTION public.match_org_knowledge(
  query_embedding vector(1536),
  match_organization_id UUID,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  title TEXT,
  source_url TEXT,
  importance_score DECIMAL,
  is_revenue_critical BOOLEAN,
  extracted_entities JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ok.id,
    ok.content,
    ok.title,
    ok.source_url,
    ok.importance_score,
    ok.is_revenue_critical,
    ok.extracted_entities,
    1 - (ok.embedding <=> query_embedding) AS similarity
  FROM public.org_knowledge ok
  WHERE ok.organization_id = match_organization_id
    AND ok.embedding IS NOT NULL
    AND 1 - (ok.embedding <=> query_embedding) > match_threshold
  ORDER BY ok.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;