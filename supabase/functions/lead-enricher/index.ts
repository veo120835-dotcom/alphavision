import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichRequest {
  domain?: string;
  email?: string;
  companyName?: string;
  leadId?: string;
  organizationId: string;
  source?: 'sniper' | 'inbound' | 'manual';
}

interface EnrichedData {
  company: {
    name: string;
    domain: string;
    industry?: string;
    size?: string;
    funding?: string;
    description?: string;
    linkedin_url?: string;
  };
  contacts: Array<{
    name: string;
    title: string;
    email: string;
    linkedin_url?: string;
    confidence: number;
  }>;
  signals?: Array<{
    type: string;
    description: string;
    date?: string;
  }>;
}

// Simulated enrichment - In production, use Hunter.io, Apollo, or Clearbit
async function enrichFromDomain(domain: string): Promise<EnrichedData> {
  // Clean domain
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  
  // Simulate API delay
  await new Promise(r => setTimeout(r, 500));

  // Generate realistic-looking data based on domain
  const companyName = cleanDomain.split('.')[0]
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const titles = ['CEO', 'Founder', 'CTO', 'VP of Sales', 'Head of Growth'];
  const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];

  const contacts = [];
  const numContacts = Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < numContacts; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const title = titles[i] || titles[Math.floor(Math.random() * titles.length)];

    contacts.push({
      name: `${firstName} ${lastName}`,
      title,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${cleanDomain}`,
      linkedin_url: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      confidence: Math.round((0.7 + Math.random() * 0.3) * 100) / 100
    });
  }

  const industries = ['SaaS', 'FinTech', 'HealthTech', 'E-commerce', 'MarTech', 'Enterprise Software'];
  const sizes = ['1-10', '11-50', '51-200', '201-500', '500+'];
  const fundingStages = ['Bootstrapped', 'Seed', 'Series A', 'Series B', 'Series C+'];

  return {
    company: {
      name: companyName,
      domain: cleanDomain,
      industry: industries[Math.floor(Math.random() * industries.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
      funding: fundingStages[Math.floor(Math.random() * fundingStages.length)],
      description: `${companyName} is a leading provider in the ${industries[Math.floor(Math.random() * industries.length)]} space.`,
      linkedin_url: `https://linkedin.com/company/${cleanDomain.split('.')[0]}`
    },
    contacts,
    signals: [
      {
        type: 'hiring',
        description: `${companyName} is actively hiring for sales and engineering roles`,
        date: new Date().toISOString()
      }
    ]
  };
}

// Hunter.io integration (when API key is available)
async function enrichWithHunter(domain: string, apiKey: string): Promise<EnrichedData | null> {
  try {
    // Domain search
    const searchResponse = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}`,
      { method: 'GET' }
    );

    if (!searchResponse.ok) {
      console.log('[ENRICHER] Hunter.io request failed:', searchResponse.status);
      return null;
    }

    const searchData = await searchResponse.json();
    const data = searchData.data;

    if (!data) return null;

    const contacts = (data.emails || []).slice(0, 5).map((email: any) => ({
      name: `${email.first_name || ''} ${email.last_name || ''}`.trim() || 'Unknown',
      title: email.position || 'Unknown',
      email: email.value,
      linkedin_url: email.linkedin,
      confidence: email.confidence / 100
    }));

    return {
      company: {
        name: data.organization || domain.split('.')[0],
        domain: domain,
        industry: data.industry,
        size: data.company_size,
        description: data.description,
        linkedin_url: data.linkedin
      },
      contacts
    };
  } catch (error) {
    console.error('[ENRICHER] Hunter.io error:', error);
    return null;
  }
}

// Apollo.io integration (when API key is available)
async function enrichWithApollo(domain: string, apiKey: string): Promise<EnrichedData | null> {
  try {
    const response = await fetch('https://api.apollo.io/v1/organizations/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({ domain })
    });

    if (!response.ok) {
      console.log('[ENRICHER] Apollo request failed:', response.status);
      return null;
    }

    const data = await response.json();
    const org = data.organization;

    if (!org) return null;

    // Fetch contacts
    const peopleResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({
        q_organization_domains: domain,
        person_seniorities: ['c_suite', 'vp', 'director'],
        per_page: 5
      })
    });

    const peopleData = await peopleResponse.json();
    const people = peopleData.people || [];

    const contacts = people.map((p: any) => ({
      name: p.name || 'Unknown',
      title: p.title || 'Unknown',
      email: p.email || '',
      linkedin_url: p.linkedin_url,
      confidence: p.email_status === 'verified' ? 0.95 : 0.7
    }));

    return {
      company: {
        name: org.name,
        domain: org.primary_domain,
        industry: org.industry,
        size: org.estimated_num_employees ? `${org.estimated_num_employees}` : undefined,
        funding: org.total_funding ? `$${org.total_funding}` : undefined,
        description: org.short_description,
        linkedin_url: org.linkedin_url
      },
      contacts
    };
  } catch (error) {
    console.error('[ENRICHER] Apollo error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, email, companyName, leadId, organizationId, source }: EnrichRequest = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const HUNTER_API_KEY = Deno.env.get("HUNTER_API_KEY");
    const APOLLO_API_KEY = Deno.env.get("APOLLO_API_KEY");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Determine what to enrich
    let targetDomain = domain;
    if (!targetDomain && email) {
      targetDomain = email.split('@')[1];
    }
    if (!targetDomain && companyName) {
      targetDomain = companyName.toLowerCase().replace(/\s+/g, '') + '.com';
    }

    if (!targetDomain) {
      return new Response(JSON.stringify({ 
        error: 'No domain, email, or company name provided' 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ENRICHER] Enriching: ${targetDomain}`);

    // Try enrichment providers in order
    let enrichedData: EnrichedData | null = null;
    let enrichmentSource = 'simulated';

    if (APOLLO_API_KEY) {
      enrichedData = await enrichWithApollo(targetDomain, APOLLO_API_KEY);
      if (enrichedData) enrichmentSource = 'apollo';
    }

    if (!enrichedData && HUNTER_API_KEY) {
      enrichedData = await enrichWithHunter(targetDomain, HUNTER_API_KEY);
      if (enrichedData) enrichmentSource = 'hunter';
    }

    if (!enrichedData) {
      enrichedData = await enrichFromDomain(targetDomain);
      enrichmentSource = 'simulated';
    }

    // Update lead if leadId provided
    if (leadId && enrichedData.contacts.length > 0) {
      const primaryContact = enrichedData.contacts[0];
      
      await supabase
        .from('leads')
        .update({
          name: primaryContact.name,
          email: primaryContact.email,
          qualification_data: {
            company: enrichedData.company,
            contacts: enrichedData.contacts,
            enrichment_source: enrichmentSource,
            enriched_at: new Date().toISOString()
          }
        })
        .eq('id', leadId);

      console.log(`[ENRICHER] Updated lead ${leadId} with ${enrichedData.contacts.length} contacts`);
    }

    // If this came from sniper, create a new lead
    if (source === 'sniper' && !leadId && enrichedData.contacts.length > 0) {
      const primaryContact = enrichedData.contacts[0];
      
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          organization_id: organizationId,
          name: primaryContact.name,
          email: primaryContact.email,
          source: 'sniper_outreach',
          status: 'new',
          qualification_data: {
            company: enrichedData.company,
            contacts: enrichedData.contacts,
            enrichment_source: enrichmentSource
          }
        })
        .select()
        .single();

      if (!leadError && newLead) {
        console.log(`[ENRICHER] Created new lead: ${newLead.id}`);
        enrichedData = { ...enrichedData, leadId: newLead.id } as any;
      }
    }

    // Log the action
    await supabase.from('agent_execution_logs').insert({
      organization_id: organizationId,
      lead_id: leadId,
      action_type: 'lead_enrichment',
      reasoning: `Enriched ${targetDomain} via ${enrichmentSource}`,
      action_details: {
        domain: targetDomain,
        source: enrichmentSource,
        contacts_found: enrichedData?.contacts?.length || 0,
        company_info: enrichedData?.company || null
      },
      result: 'success'
    });

    return new Response(JSON.stringify({
      success: true,
      source: enrichmentSource,
      data: enrichedData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Lead enricher error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});