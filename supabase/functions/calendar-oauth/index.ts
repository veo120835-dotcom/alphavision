import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthRequest {
  action: 'get_auth_url' | 'exchange_code' | 'refresh_token' | 'check_status';
  code?: string;
  organizationId: string;
  redirectUri?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, organizationId, redirectUri }: OAuthRequest = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if Google OAuth is configured
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Google OAuth not configured',
        message: 'Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your secrets'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check connection status
    if (action === 'check_status') {
      const { data: tokens } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('provider', 'google')
        .single();

      return new Response(JSON.stringify({
        success: true,
        connected: !!tokens,
        expires_at: tokens?.expires_at,
        scopes: tokens?.scopes
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate authorization URL
    if (action === 'get_auth_url') {
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly'
      ];

      const callbackUri = redirectUri || `${SUPABASE_URL}/functions/v1/calendar-oauth`;
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', callbackUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes.join(' '));
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', organizationId);

      return new Response(JSON.stringify({
        success: true,
        authUrl: authUrl.toString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exchange authorization code for tokens
    if (action === 'exchange_code' && code) {
      const callbackUri = redirectUri || `${SUPABASE_URL}/functions/v1/calendar-oauth`;
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: callbackUri
        })
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('[OAUTH] Token exchange failed:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Token exchange failed',
          details: error
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenResponse.json();

      // Store tokens
      const { error: upsertError } = await supabase
        .from('oauth_tokens')
        .upsert({
          organization_id: organizationId,
          provider: 'google',
          access_token_encrypted: tokens.access_token,
          refresh_token_encrypted: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          scopes: tokens.scope?.split(' ') || [],
          token_type: tokens.token_type
        }, {
          onConflict: 'organization_id,provider'
        });

      if (upsertError) {
        console.error('[OAUTH] Token storage failed:', upsertError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to store tokens'
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log the action
      await supabase.from('agent_execution_logs').insert({
        organization_id: organizationId,
        action_type: 'oauth_connected',
        reasoning: 'Google Calendar and Gmail connected successfully',
        action_details: { provider: 'google', scopes: tokens.scope },
        result: 'success'
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Google Calendar connected successfully!'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh token
    if (action === 'refresh_token') {
      const { data: existing } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('provider', 'google')
        .single();

      if (!existing?.refresh_token_encrypted) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No refresh token available'
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: existing.refresh_token_encrypted,
          grant_type: 'refresh_token'
        })
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('[OAUTH] Token refresh failed:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Token refresh failed'
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenResponse.json();

      // Update access token
      await supabase
        .from('oauth_tokens')
        .update({
          access_token_encrypted: tokens.access_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('provider', 'google');

      return new Response(JSON.stringify({
        success: true,
        message: 'Token refreshed successfully'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Calendar OAuth error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});