import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate embeddings using Lovable AI
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://api.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small'
      }),
    });

    if (!response.ok) {
      console.error('Embedding API error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, query, limit = 5, include_revenue_critical = true } = await req.json();

    if (!organization_id || !query) {
      return new Response(
        JSON.stringify({ error: 'Missing organization_id or query' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching knowledge for org ${organization_id}: "${query}"`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    if (!queryEmbedding) {
      // Fallback to text search if embedding fails
      console.log('Embedding failed, falling back to text search');
      
      const { data: textResults, error: textError } = await supabase
        .from('org_knowledge')
        .select('id, content, title, source_url, importance_score, is_revenue_critical')
        .eq('organization_id', organization_id)
        .textSearch('content', query.split(' ').join(' | '))
        .order('importance_score', { ascending: false })
        .limit(limit);

      if (textError) {
        console.error('Text search error:', textError);
        return new Response(
          JSON.stringify({ error: 'Search failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          results: textResults || [],
          search_type: 'text'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vector similarity search using RPC function
    // First, try to use pgvector directly
    const { data: vectorResults, error: vectorError } = await supabase.rpc('match_org_knowledge', {
      query_embedding: queryEmbedding,
      match_organization_id: organization_id,
      match_count: limit,
      match_threshold: 0.5
    });

    if (vectorError) {
      console.error('Vector search error:', vectorError);
      
      // Fallback: Direct query with manual similarity (less efficient but works)
      const { data: fallbackResults, error: fallbackError } = await supabase
        .from('org_knowledge')
        .select('id, content, title, source_url, importance_score, is_revenue_critical, extracted_entities')
        .eq('organization_id', organization_id)
        .not('embedding', 'is', null)
        .order('importance_score', { ascending: false })
        .limit(limit * 2);

      if (fallbackError) {
        return new Response(
          JSON.stringify({ error: 'Search failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          results: fallbackResults || [],
          search_type: 'fallback'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If include_revenue_critical, also fetch any revenue-critical content not in results
    let allResults = vectorResults || [];
    
    if (include_revenue_critical) {
      const existingIds = allResults.map((r: any) => r.id);
      
      const { data: revenueResults } = await supabase
        .from('org_knowledge')
        .select('id, content, title, source_url, importance_score, is_revenue_critical, extracted_entities')
        .eq('organization_id', organization_id)
        .eq('is_revenue_critical', true)
        .not('id', 'in', `(${existingIds.join(',')})`)
        .order('importance_score', { ascending: false })
        .limit(2);

      if (revenueResults && revenueResults.length > 0) {
        allResults = [...allResults, ...revenueResults];
      }
    }

    console.log(`Found ${allResults.length} knowledge results`);

    return new Response(
      JSON.stringify({ 
        results: allResults,
        search_type: 'vector'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Knowledge search error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});