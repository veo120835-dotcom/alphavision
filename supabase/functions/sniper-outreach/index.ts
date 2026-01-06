import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SNIPER_PROMPT = `You are an expert B2B sales copywriter specializing in hyper-personalized outreach.

Your job is to craft emails that feel like they were written by a friend who genuinely understands the recipient's situation.

SIGNAL TYPES:
- funding: Company just raised money → They're scaling, need solutions
- hiring: Aggressive hiring → Growth pains, process gaps
- product_launch: New product → Competitive pressure, marketing needs
- leadership_change: New executive → Fresh perspective, change appetite

EMAIL STRUCTURE:
1. Hook: Reference the specific news (shows you did homework)
2. Insight: What typically happens next (shows expertise)
3. Social Proof: Similar company you helped (builds credibility)
4. Soft CTA: No hard sell, just conversation starter

TONE: Peer-to-peer, not salesy. Like a colleague sharing helpful intel.

OUTPUT FORMAT (JSON):
{
  "subject_line": "Short, curiosity-driving subject",
  "email_body": "The personalized email",
  "follow_up_timing": "When to follow up if no response",
  "relevance_score": 0.0-1.0,
  "personalization_hooks": ["What makes this feel personal"]
}`;

interface SniperRequest {
  organizationId: string;
  mode: 'scan' | 'draft' | 'batch' | 'fetch_news' | 'exa_search';
  signals?: Array<{
    companyName: string;
    signalType: string;
    headline: string;
    summary?: string;
  }>;
  signalId?: string;
  businessContext?: string;
  searchQuery?: string;
  industry?: string;
  niche?: string;
  triggerEvent?: string;
}

// Real Exa.ai Neural Search
async function searchWithExa(query: string, options: {
  numResults?: number;
  startDate?: string;
  type?: 'neural' | 'keyword';
  includeText?: boolean;
}): Promise<Array<{
  title: string;
  url: string;
  text?: string;
  publishedDate?: string;
  author?: string;
  score?: number;
}>> {
  const EXA_API_KEY = Deno.env.get('EXA_API_KEY');
  
  if (!EXA_API_KEY) {
    console.log('[SNIPER] Exa.ai not configured, using simulated data');
    return simulateNewsSignals(query);
  }

  const startPublishedDate = options.startDate || 
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "x-api-key": EXA_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: query,
      numResults: options.numResults || 10,
      useAutoprompt: true,
      type: options.type || "neural",
      startPublishedDate,
      contents: options.includeText ? { text: true } : undefined
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[SNIPER] Exa.ai error:', error);
    throw new Error(`Exa.ai search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

// Simulated news for when Exa.ai is not configured
function simulateNewsSignals(query: string): Array<{
  title: string;
  url: string;
  text?: string;
  publishedDate?: string;
}> {
  const signalTypes = ['funding', 'hiring', 'product_launch', 'leadership_change'];
  const companies = [
    { name: 'TechFlow Inc', industry: 'SaaS' },
    { name: 'DataScale AI', industry: 'AI/ML' },
    { name: 'CloudBridge Systems', industry: 'Cloud' },
    { name: 'GrowthMetrics', industry: 'Analytics' },
    { name: 'SecureVault Pro', industry: 'Security' }
  ];

  const newsTemplates = {
    funding: [
      { headline: '{company} Raises ${amount}M Series {round}', summary: 'Led by {investor}, the funding will accelerate product development and market expansion.' },
      { headline: '{company} Closes ${amount}M Seed Round', summary: 'The startup plans to double its engineering team and expand into new markets.' }
    ],
    hiring: [
      { headline: '{company} Plans to Hire {count}+ Employees in Q1', summary: 'Aggressive expansion signals strong demand for their solutions.' },
      { headline: '{company} Opens New Office, Hiring {count} Roles', summary: 'The expansion comes after 300% YoY growth.' }
    ],
    product_launch: [
      { headline: '{company} Launches AI-Powered Platform', summary: 'The new solution promises to reduce operational costs by 40%.' },
      { headline: '{company} Unveils Enterprise Platform', summary: 'Targeting Fortune 500 companies with comprehensive capabilities.' }
    ],
    leadership_change: [
      { headline: '{company} Appoints New CEO from {previous}', summary: 'The new leadership brings experience scaling companies to $100M+ ARR.' },
      { headline: 'Former {previous} Exec Joins {company} as CRO', summary: 'Signaling a major push into enterprise sales.' }
    ]
  };

  const signals = [];
  const numSignals = Math.floor(Math.random() * 3) + 3;

  for (let i = 0; i < numSignals; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const signalType = signalTypes[Math.floor(Math.random() * signalTypes.length)] as keyof typeof newsTemplates;
    const template = newsTemplates[signalType][Math.floor(Math.random() * newsTemplates[signalType].length)];
    
    const variables: Record<string, string> = {
      company: company.name,
      amount: String(Math.floor(Math.random() * 50) + 5),
      round: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      investor: ['Sequoia', 'a16z', 'Accel', 'Index Ventures'][Math.floor(Math.random() * 4)],
      count: String(Math.floor(Math.random() * 100) + 20),
      industry: company.industry,
      previous: ['Google', 'Salesforce', 'HubSpot', 'Stripe'][Math.floor(Math.random() * 4)]
    };

    const headline = template.headline.replace(/{(\w+)}/g, (_, key) => variables[key] || key);
    const summary = template.summary.replace(/{(\w+)}/g, (_, key) => variables[key] || key);

    signals.push({
      title: headline,
      url: `https://news.example.com/${company.name.toLowerCase().replace(/ /g, '-')}`,
      text: summary,
      publishedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  return signals;
}

// Extract company name from URL or title
function extractCompanyName(url: string, title: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '').split('.')[0];
    if (domain && domain.length > 2) {
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
  } catch {}
  
  // Try to extract from title
  const match = title.match(/^([A-Z][a-zA-Z\s]+?)\s+(?:Raises|Launches|Appoints|Hires|Opens|Closes)/);
  return match ? match[1].trim() : 'Unknown Company';
}

// Detect signal type from content
function detectSignalType(title: string, text?: string): string {
  const content = `${title} ${text || ''}`.toLowerCase();
  
  if (/raises|funding|series [a-d]|seed|investment|million|investor/.test(content)) return 'funding';
  if (/hiring|hires|job|talent|recruits|employees|team/.test(content)) return 'hiring';
  if (/launch|unveil|release|new product|platform|announces/.test(content)) return 'product_launch';
  if (/ceo|cro|cto|cfo|executive|appoints|joins|leadership/.test(content)) return 'leadership_change';
  
  return 'general';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, mode, signals, signalId, businessContext, searchQuery, industry }: SniperRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get business identity for personalization
    const { data: identity } = await supabase
      .from('business_identity')
      .select('*')
      .eq('organization_id', organizationId);

    const businessInfo = identity?.map(i => `${i.identity_element}: ${i.title}`).join(', ') || '';

    // NEW: Exa.ai Neural Search mode
    if (mode === 'exa_search') {
      const { niche, triggerEvent } = await req.json() as SniperRequest & { niche?: string; triggerEvent?: string };
      const query = niche && triggerEvent 
        ? `News analysis: ${niche} companies that ${triggerEvent}`
        : searchQuery || `${industry || 'SaaS'} companies funding hiring news`;

      console.log(`[SNIPER] Exa neural search: ${query}`);
      
      const exaResults = await searchWithExa(query, {
        numResults: 10,
        type: 'neural',
        includeText: true
      });

      // Transform Exa results into signals
      const signalInserts = exaResults.map(r => ({
        organization_id: organizationId,
        company_name: extractCompanyName(r.url, r.title),
        signal_type: detectSignalType(r.title, r.text),
        headline: r.title,
        summary: r.text?.substring(0, 500),
        source_url: r.url,
        relevance_score: r.score || 0.7,
        outreach_status: 'pending'
      }));

      const { data: inserted, error } = await supabase
        .from('news_signals')
        .insert(signalInserts)
        .select();

      if (error) console.error('Failed to store Exa signals:', error);

      // Trigger n8n enrichment for each lead
      const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL');
      if (N8N_WEBHOOK_URL) {
        for (const signal of inserted || []) {
          try {
            await fetch(`${N8N_WEBHOOK_URL}/enrich-lead`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                company_domain: new URL(signal.source_url || '').hostname,
                source_url: signal.source_url,
                news_summary: signal.summary,
                campaign_type: 'sniper_outreach',
                signal_id: signal.id
              })
            });
          } catch (e) {
            console.log('[SNIPER] n8n enrichment skipped:', e);
          }
        }
      }

      await supabase.from('agent_execution_logs').insert({
        organization_id: organizationId,
        action_type: 'sniper_exa_search',
        reasoning: `Neural search found ${exaResults.length} targets`,
        action_details: { query, results_count: exaResults.length },
        result: 'success'
      });

      return new Response(JSON.stringify({
        success: true,
        mode: 'exa_search',
        signals_fetched: inserted?.length || 0,
        signals: inserted || []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: Fetch news signals with simulated data
    if (mode === 'fetch_news') {
      console.log(`[SNIPER] Fetching news signals for: ${searchQuery || 'general'}`);
      
      const simulatedResults = simulateNewsSignals(searchQuery || '');
      
      const signalInserts = simulatedResults.map(s => ({
        organization_id: organizationId,
        company_name: extractCompanyName(s.url, s.title),
        signal_type: detectSignalType(s.title, s.text),
        headline: s.title,
        summary: s.text,
        source_url: s.url,
        relevance_score: 0.7 + Math.random() * 0.3,
        outreach_status: 'pending'
      }));

      const { data: inserted, error } = await supabase
        .from('news_signals')
        .insert(signalInserts)
        .select();

      if (error) console.error('Failed to store news signals:', error);

      await supabase.from('agent_execution_logs').insert({
        organization_id: organizationId,
        action_type: 'sniper_news_fetch',
        reasoning: `Fetched ${simulatedResults.length} news signals for prospecting`,
        action_details: { query: searchQuery, industry, signals_found: simulatedResults.length },
        result: 'success'
      });

      return new Response(JSON.stringify({
        success: true,
        signals_fetched: inserted?.length || 0,
        signals: inserted || []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === 'scan' && signals) {
      // Store new signals in database
      console.log(`[SNIPER] Scanning ${signals.length} signals`);
      
      const signalInserts = signals.map(s => ({
        organization_id: organizationId,
        company_name: s.companyName,
        signal_type: s.signalType,
        headline: s.headline,
        summary: s.summary,
        outreach_status: 'pending'
      }));

      const { data: inserted, error } = await supabase
        .from('news_signals')
        .insert(signalInserts)
        .select();

      if (error) {
        console.error('Failed to store signals:', error);
      }

      return new Response(JSON.stringify({
        success: true,
        signals_stored: inserted?.length || 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === 'draft') {
      // Get signal to draft for
      let signal;
      if (signalId) {
        const { data } = await supabase
          .from('news_signals')
          .select('*')
          .eq('id', signalId)
          .single();
        signal = data;
      } else {
        // Get next pending signal
        const { data } = await supabase
          .from('news_signals')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('outreach_status', 'pending')
          .order('relevance_score', { ascending: false })
          .limit(1)
          .single();
        signal = data;
      }

      if (!signal) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No pending signals to draft'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[SNIPER] Drafting outreach for: ${signal.company_name}`);

      // SELECT VARIANT using epsilon-greedy (80% exploit, 20% explore)
      let selectedVariant = null;
      let promptToUse = SNIPER_PROMPT;

      const { data: activeVariants } = await supabase
        .from('prompt_variants')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('agent_type', 'sniper_email')
        .eq('is_active', true);

      if (activeVariants && activeVariants.length > 0) {
        // Calculate success rates and sort
        const variantsWithRates = activeVariants.map(v => ({
          ...v,
          success_rate: v.uses > 0 ? v.successes / v.uses : 0
        })).sort((a, b) => b.success_rate - a.success_rate);

        const epsilon = 0.2; // 20% exploration
        if (Math.random() < epsilon && variantsWithRates.length > 1) {
          // Explore: pick random variant (not top)
          const exploreCandidates = variantsWithRates.slice(1);
          selectedVariant = exploreCandidates[Math.floor(Math.random() * exploreCandidates.length)];
        } else {
          // Exploit: pick top performer
          selectedVariant = variantsWithRates[0];
        }

        promptToUse = selectedVariant.prompt_text;
        
        // Increment uses
        await supabase.rpc('increment_variant_uses', { p_variant_id: selectedVariant.id });
      }

      // Generate personalized email
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: promptToUse },
            {
              role: "user",
              content: `SIGNAL DETECTED:
Company: ${signal.company_name}
Signal Type: ${signal.signal_type}
Headline: ${signal.headline}
${signal.summary ? `Summary: ${signal.summary}` : ''}

MY BUSINESS:
${businessInfo}
${businessContext ? `Additional Context: ${businessContext}` : ''}

Draft a hyper-personalized outreach email that references this specific news.`
            }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AI draft failed: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const draft = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');

      // Update signal with draft and variant used
      await supabase
        .from('news_signals')
        .update({
          draft_email: `Subject: ${draft.subject_line}\n\n${draft.email_body}`,
          relevance_score: draft.relevance_score,
          outreach_status: 'drafted',
          processed_at: new Date().toISOString(),
          variant_id: selectedVariant?.id || null
        })
        .eq('id', signal.id);

      // Log action
      await supabase.from('agent_execution_logs').insert({
        organization_id: organizationId,
        action_type: 'sniper_outreach',
        reasoning: `Drafted outreach for ${signal.company_name} (${signal.signal_type})${selectedVariant ? ` using variant ${selectedVariant.variant_tag}` : ''}`,
        action_details: {
          company: signal.company_name,
          signal_type: signal.signal_type,
          relevance_score: draft.relevance_score,
          variant_id: selectedVariant?.id,
          variant_tag: selectedVariant?.variant_tag
        },
        result: 'drafted'
      });
      return new Response(JSON.stringify({
        success: true,
        signal_id: signal.id,
        draft
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === 'batch') {
      // Process all pending signals
      const { data: pendingSignals } = await supabase
        .from('news_signals')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('outreach_status', 'pending')
        .limit(5);

      const results = [];
      for (const signal of pendingSignals || []) {
        // Recursive call to draft each
        const draftResponse = await fetch(`${SUPABASE_URL}/functions/v1/sniper-outreach`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            organizationId,
            mode: 'draft',
            signalId: signal.id,
            businessContext
          }),
        });
        
        const result = await draftResponse.json();
        results.push({ signal_id: signal.id, company: signal.company_name, ...result });
      }

      return new Response(JSON.stringify({
        success: true,
        processed: results.length,
        results
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid mode' }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Sniper outreach error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
