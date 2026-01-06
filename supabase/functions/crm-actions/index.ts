import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GHLActionRequest {
  action: string;
  organization_id: string;
  contact_id?: string;
  tag?: string;
  opportunity?: {
    name: string;
    pipeline_id: string;
    stage_id: string;
    monetary_value?: number;
  };
  contact_data?: Record<string, any>;
  message?: string;
  workflow_id?: string;
}

// Helper to get valid access token (refreshes if needed)
async function getValidAccessToken(supabase: any, organizationId: string): Promise<string | null> {
  const { data: tokenData, error } = await supabase
    .from('oauth_tokens')
    .select('access_token_encrypted, refresh_token_encrypted, expires_at')
    .eq('organization_id', organizationId)
    .eq('provider', 'gohighlevel')
    .single();

  if (error || !tokenData) {
    console.error('No token found for organization:', organizationId);
    return null;
  }

  // Check if token is expired or will expire in next 5 minutes
  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;

  if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
    console.log('Token expired or expiring soon, refreshing...');
    
    const ghlClientId = Deno.env.get('GHL_CLIENT_ID');
    const ghlClientSecret = Deno.env.get('GHL_CLIENT_SECRET');

    if (!ghlClientId || !ghlClientSecret) {
      console.error('Missing CRM credentials');
      return null;
    }

    const refreshResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: ghlClientId,
        client_secret: ghlClientSecret,
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token_encrypted
      })
    });

    const newTokens = await refreshResponse.json();

    if (newTokens.error || !newTokens.access_token) {
      console.error('Token refresh failed:', newTokens);
      return null;
    }

    const newExpiresAt = new Date(Date.now() + (newTokens.expires_in || 86400) * 1000).toISOString();

    await supabase
      .from('oauth_tokens')
      .update({
        access_token_encrypted: newTokens.access_token,
        refresh_token_encrypted: newTokens.refresh_token || tokenData.refresh_token_encrypted,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('provider', 'gohighlevel');

    return newTokens.access_token;
  }

  return tokenData.access_token_encrypted;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: GHLActionRequest = await req.json();
    const { action, organization_id, contact_id, tag, opportunity, contact_data, message, workflow_id } = body;

    console.log(`CRM action: ${action} for org: ${organization_id}`);

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, organization_id);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'CRM not connected or token expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get location ID
    const { data: integration } = await supabase
      .from('integrations')
      .select('credentials_encrypted')
      .eq('organization_id', organization_id)
      .eq('provider', 'gohighlevel')
      .single();

    const creds = integration?.credentials_encrypted ? JSON.parse(integration.credentials_encrypted as string) : {};
    const locationId = creds.location_id;

    if (!locationId) {
      return new Response(
        JSON.stringify({ error: 'Location ID not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    };

    let result: any;

    switch (action) {
      case 'tag_contact': {
        if (!contact_id || !tag) {
          return new Response(
            JSON.stringify({ error: 'contact_id and tag required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contact_id}/tags`, {
          method: 'POST',
          headers: baseHeaders,
          body: JSON.stringify({ tags: [tag] })
        });
        result = await response.json();
        break;
      }

      case 'create_opportunity': {
        if (!opportunity || !contact_id) {
          return new Response(
            JSON.stringify({ error: 'opportunity details and contact_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const response = await fetch('https://services.leadconnectorhq.com/opportunities/', {
          method: 'POST',
          headers: baseHeaders,
          body: JSON.stringify({
            locationId,
            contactId: contact_id,
            name: opportunity.name,
            pipelineId: opportunity.pipeline_id,
            pipelineStageId: opportunity.stage_id,
            monetaryValue: opportunity.monetary_value || 0,
            status: 'open'
          })
        });
        result = await response.json();
        break;
      }

      case 'update_contact': {
        if (!contact_id || !contact_data) {
          return new Response(
            JSON.stringify({ error: 'contact_id and contact_data required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contact_id}`, {
          method: 'PUT',
          headers: baseHeaders,
          body: JSON.stringify(contact_data)
        });
        result = await response.json();
        break;
      }

      case 'get_contact': {
        if (!contact_id) {
          return new Response(
            JSON.stringify({ error: 'contact_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contact_id}`, {
          method: 'GET',
          headers: baseHeaders
        });
        result = await response.json();
        break;
      }

      case 'send_sms': {
        if (!contact_id || !message) {
          return new Response(
            JSON.stringify({ error: 'contact_id and message required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const response = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
          method: 'POST',
          headers: baseHeaders,
          body: JSON.stringify({
            type: 'SMS',
            contactId: contact_id,
            message
          })
        });
        result = await response.json();
        break;
      }

      case 'start_workflow': {
        if (!contact_id || !workflow_id) {
          return new Response(
            JSON.stringify({ error: 'contact_id and workflow_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contact_id}/workflow/${workflow_id}`, {
          method: 'POST',
          headers: baseHeaders
        });
        result = await response.json();
        break;
      }

      case 'test_connection': {
        // Get location info to verify connection works
        const response = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
          method: 'GET',
          headers: baseHeaders
        });
        result = await response.json();
        console.log('Test connection result:', result);
        break;
      }

      case 'list_contacts': {
        // Fetch first 20 contacts for testing
        const response = await fetch(`https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&limit=20`, {
          method: 'GET',
          headers: baseHeaders
        });
        result = await response.json();
        console.log('List contacts result:', result);
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Log the action
    await supabase.from('agent_execution_logs').insert({
      organization_id,
      action_type: `crm_${action}`,
      action_details: { contact_id, tag, opportunity, contact_data, message, workflow_id },
      result: result?.error ? 'error' : 'success',
      error_message: result?.error || null
    });

    return new Response(
      JSON.stringify({ success: !result?.error, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('CRM action error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
