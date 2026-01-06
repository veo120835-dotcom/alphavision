import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthRequest {
  action: 'get_auth_url' | 'exchange_code' | 'refresh_token' | 'revoke';
  code?: string;
  redirect_uri?: string;
  organization_id: string;
}

// GHL OAuth 2.0 scopes
const GHL_SCOPES = [
  'contacts.readonly',
  'contacts.write',
  'opportunities.readonly',
  'opportunities.write',
  'calendars.readonly',
  'calendars.write',
  'locations.readonly',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ghlClientId = Deno.env.get('GHL_CLIENT_ID');
    const ghlClientSecret = Deno.env.get('GHL_CLIENT_SECRET');

    if (!ghlClientId || !ghlClientSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'CRM OAuth not configured', 
          message: 'Please add GHL_CLIENT_ID and GHL_CLIENT_SECRET to your secrets',
          setup_required: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: OAuthRequest = await req.json();
    const { action, code, redirect_uri, organization_id } = body;

    console.log(`CRM OAuth action: ${action} for org: ${organization_id}`);

    switch (action) {
      case 'get_auth_url': {
        const authUrl = new URL('https://marketplace.gohighlevel.com/oauth/chooselocation');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', ghlClientId);
        authUrl.searchParams.set('redirect_uri', redirect_uri || `${supabaseUrl}/functions/v1/crm-oauth-callback`);
        authUrl.searchParams.set('scope', GHL_SCOPES.join(' '));
        authUrl.searchParams.set('state', organization_id);

        console.log('Generated CRM auth URL');

        return new Response(
          JSON.stringify({ auth_url: authUrl.toString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'exchange_code': {
        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Authorization code required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Exchanging code for tokens...');

        // Exchange code for tokens
        const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: new URLSearchParams({
            client_id: ghlClientId,
            client_secret: ghlClientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirect_uri || `${supabaseUrl}/functions/v1/crm-oauth-callback`
          })
        });

        const tokens = await tokenResponse.json();

        if (tokens.error || !tokens.access_token) {
          console.error('Token exchange error:', tokens);
          return new Response(
            JSON.stringify({ error: tokens.error_description || tokens.error || 'Token exchange failed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Tokens received, location_id:', tokens.locationId);

        // Calculate expiry
        const expiresAt = new Date(Date.now() + (tokens.expires_in || 86400) * 1000).toISOString();

        // Store tokens
        const { error: dbError } = await supabase
          .from('oauth_tokens')
          .upsert({
            organization_id,
            provider: 'gohighlevel',
            access_token_encrypted: tokens.access_token,
            refresh_token_encrypted: tokens.refresh_token,
            token_type: tokens.token_type || 'Bearer',
            expires_at: expiresAt,
            scopes: GHL_SCOPES,
            metadata: {
              location_id: tokens.locationId,
              user_id: tokens.userId,
              company_id: tokens.companyId
            }
          }, {
            onConflict: 'organization_id,provider'
          });

        if (dbError) {
          console.error('Error storing tokens:', dbError);
          return new Response(
            JSON.stringify({ error: 'Failed to store tokens' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update integrations table
        await supabase
          .from('integrations')
          .upsert({
            organization_id,
            provider: 'gohighlevel',
            status: 'connected',
            scopes: GHL_SCOPES,
            credentials_encrypted: JSON.stringify({
              location_id: tokens.locationId
            }),
            last_sync_at: new Date().toISOString()
          }, {
            onConflict: 'organization_id,provider'
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'CRM connected successfully',
            location_id: tokens.locationId,
            expires_at: expiresAt
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'refresh_token': {
        // Get stored refresh token
        const { data: tokenData, error: fetchError } = await supabase
          .from('oauth_tokens')
          .select('refresh_token_encrypted')
          .eq('organization_id', organization_id)
          .eq('provider', 'gohighlevel')
          .single();

        if (fetchError || !tokenData?.refresh_token_encrypted) {
          return new Response(
            JSON.stringify({ error: 'No refresh token found' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Refreshing token...');

        // Refresh the token
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
          console.error('Token refresh error:', newTokens);
          return new Response(
            JSON.stringify({ error: newTokens.error_description || newTokens.error || 'Token refresh failed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const expiresAt = new Date(Date.now() + (newTokens.expires_in || 86400) * 1000).toISOString();

        // Update stored token
        await supabase
          .from('oauth_tokens')
          .update({
            access_token_encrypted: newTokens.access_token,
            refresh_token_encrypted: newTokens.refresh_token || tokenData.refresh_token_encrypted,
            expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })
          .eq('organization_id', organization_id)
          .eq('provider', 'gohighlevel');

        return new Response(
          JSON.stringify({ 
            success: true, 
            access_token: newTokens.access_token,
            expires_at: expiresAt
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'revoke': {
        console.log('Revoking token...');

        // Delete from database
        await supabase
          .from('oauth_tokens')
          .delete()
          .eq('organization_id', organization_id)
          .eq('provider', 'gohighlevel');

        await supabase
          .from('integrations')
          .update({ status: 'disconnected' })
          .eq('organization_id', organization_id)
          .eq('provider', 'gohighlevel');

        return new Response(
          JSON.stringify({ success: true, message: 'CRM disconnected' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('CRM OAuth error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
