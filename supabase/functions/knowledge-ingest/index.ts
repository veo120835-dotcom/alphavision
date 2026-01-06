import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple text chunking function
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if ((currentChunk + ' ' + trimmedSentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk = currentChunk ? currentChunk + '. ' + trimmedSentence : trimmedSentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Extract important entities from content
function extractEntities(content: string): Record<string, any> {
  const entities: Record<string, any> = {};
  
  // Extract prices
  const priceMatches = content.match(/\$[\d,]+(?:\.\d{2})?/g);
  if (priceMatches) {
    entities.prices = priceMatches;
  }
  
  // Extract emails
  const emailMatches = content.match(/[\w.-]+@[\w.-]+\.\w+/g);
  if (emailMatches) {
    entities.emails = emailMatches;
  }
  
  // Extract phone numbers
  const phoneMatches = content.match(/(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g);
  if (phoneMatches) {
    entities.phones = phoneMatches;
  }
  
  return entities;
}

// Determine if content is revenue-critical
function isRevenueCritical(content: string, url: string): boolean {
  const revenueCriticalPatterns = [
    /pric/i, /cost/i, /fee/i, /invest/i, /payment/i,
    /book/i, /schedule/i, /appointment/i, /consult/i,
    /service/i, /offer/i, /package/i, /plan/i,
    /contact/i, /get.?started/i, /sign.?up/i
  ];
  
  const urlPatterns = ['pricing', 'services', 'contact', 'book', 'schedule', 'plans', 'packages'];
  
  const contentMatch = revenueCriticalPatterns.some(pattern => pattern.test(content));
  const urlMatch = urlPatterns.some(pattern => url.toLowerCase().includes(pattern));
  
  return contentMatch || urlMatch;
}

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

// Simple website scraper (fallback when Firecrawl not available)
async function scrapeUrl(url: string): Promise<{ content: string; title: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlphaVisionBot/1.0)'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;
    
    // Remove scripts, styles, and HTML tags
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit content size
    if (content.length > 50000) {
      content = content.substring(0, 50000);
    }
    
    return { content, title };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

// Try to use Firecrawl if available
async function crawlWithFirecrawl(url: string): Promise<{ url: string; content: string; title: string }[]> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlKey) {
    console.log('Firecrawl not configured, using fallback scraper');
    const result = await scrapeUrl(url);
    if (result) {
      return [{ url, ...result }];
    }
    return [];
  }
  
  try {
    // Start crawl job
    const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url,
        limit: 20, // Limit pages per crawl
        scrapeOptions: {
          formats: ['markdown', 'html'],
        }
      }),
    });

    if (!crawlResponse.ok) {
      console.error('Firecrawl error:', await crawlResponse.text());
      // Fallback to simple scraper
      const result = await scrapeUrl(url);
      if (result) return [{ url, ...result }];
      return [];
    }

    const crawlData = await crawlResponse.json();
    
    if (crawlData.success && crawlData.data) {
      return crawlData.data.map((page: any) => ({
        url: page.url || url,
        content: page.markdown || page.content || '',
        title: page.title || page.url || url,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Firecrawl error:', error);
    const result = await scrapeUrl(url);
    if (result) return [{ url, ...result }];
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, website_url, job_id } = await req.json();

    if (!organization_id || !website_url) {
      return new Response(
        JSON.stringify({ error: 'Missing organization_id or website_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting knowledge ingestion for org ${organization_id}: ${website_url}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update job status if job_id provided
    if (job_id) {
      await supabase.from('knowledge_ingestion_jobs').update({
        status: 'processing',
        started_at: new Date().toISOString()
      }).eq('id', job_id);
    }

    // Crawl the website
    const pages = await crawlWithFirecrawl(website_url);
    console.log(`Crawled ${pages.length} pages`);

    if (pages.length === 0) {
      if (job_id) {
        await supabase.from('knowledge_ingestion_jobs').update({
          status: 'failed',
          error_message: 'No pages could be crawled',
          completed_at: new Date().toISOString()
        }).eq('id', job_id);
      }
      return new Response(
        JSON.stringify({ error: 'No pages could be crawled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalChunks = 0;
    
    // Process each page
    for (const page of pages) {
      if (!page.content || page.content.trim().length < 50) continue;
      
      const chunks = chunkText(page.content);
      
      for (const chunk of chunks) {
        if (chunk.length < 50) continue;
        
        // Generate embedding
        const embedding = await generateEmbedding(chunk);
        
        // Extract entities
        const entities = extractEntities(chunk);
        
        // Check if revenue critical
        const revenueCritical = isRevenueCritical(chunk, page.url);
        
        // Calculate importance score
        let importanceScore = 0.5;
        if (revenueCritical) importanceScore += 0.3;
        if (entities.prices?.length) importanceScore += 0.1;
        if (chunk.length > 500) importanceScore += 0.1;
        importanceScore = Math.min(importanceScore, 1.0);
        
        // Insert into org_knowledge
        const { error } = await supabase.from('org_knowledge').insert({
          organization_id,
          content: chunk,
          content_type: 'website_page',
          title: page.title,
          source_url: page.url,
          source_type: 'crawl',
          embedding,
          importance_score: importanceScore,
          is_revenue_critical: revenueCritical,
          extracted_entities: entities,
          last_crawled_at: new Date().toISOString()
        });

        if (error) {
          console.error('Error inserting knowledge:', error);
        } else {
          totalChunks++;
        }
      }
    }

    // Update job status
    if (job_id) {
      await supabase.from('knowledge_ingestion_jobs').update({
        status: 'completed',
        pages_found: pages.length,
        pages_processed: pages.length,
        chunks_created: totalChunks,
        completed_at: new Date().toISOString()
      }).eq('id', job_id);
    }

    console.log(`Knowledge ingestion complete: ${totalChunks} chunks created from ${pages.length} pages`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pages_crawled: pages.length,
        chunks_created: totalChunks,
        message: 'Brain Transplant Complete'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Knowledge ingestion error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});