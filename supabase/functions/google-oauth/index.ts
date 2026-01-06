import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthRequest {
  action: 'get_auth_url' | 'exchange_code' | 'refresh_token' | 'revoke';
  provider: 'google_calendar' | 'google_gmail' | 'google_sheets';
  code?: string;
  redirect_uri?: string;
  organization_id: string;
}

const GOOGLE_SCOPES: Record<string, string[]> = {
  google_calendar: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ],
  google_gmail: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly'
  ],
  google_sheets: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!googleClientId || !googleClientSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'Google OAuth not configured', 
          message: 'Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your secrets'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: OAuthRequest = await req.json();
    const { action, provider, code, redirect_uri, organization_id } = body;

    console.log(`OAuth action: ${action} for provider: ${provider}`);

    switch (action) {
      case 'get_auth_url': {
        const scopes = GOOGLE_SCOPES[provider] || [];
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', googleClientId);
        authUrl.searchParams.set('redirect_uri', redirect_uri || `${supabaseUrl}/functions/v1/google-oauth-callback`);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', scopes.join(' '));
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        authUrl.searchParams.set('state', JSON.stringify({ provider, organization_id }));

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

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: googleClientId,
            client_secret: googleClientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirect_uri || `${supabaseUrl}/functions/v1/google-oauth-callback`
          })
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
          console.error('Token exchange error:', tokens);
          return new Response(
            JSON.stringify({ error: tokens.error_description || tokens.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Calculate expiry
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        // Store tokens (in production, encrypt these!)
        const { error: dbError } = await supabase
          .from('oauth_tokens')
          .upsert({
            organization_id,
            provider,
            access_token_encrypted: tokens.access_token, // TODO: Encrypt in production
            refresh_token_encrypted: tokens.refresh_token,
            token_type: tokens.token_type,
            expires_at: expiresAt,
            scopes: GOOGLE_SCOPES[provider]
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

        // Also update integrations table
        await supabase
          .from('integrations')
          .upsert({
            organization_id,
            provider,
            status: 'connected',
            scopes: GOOGLE_SCOPES[provider],
            last_sync_at: new Date().toISOString()
          }, {
            onConflict: 'organization_id,provider'
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `${provider} connected successfully`,
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
          .eq('provider', provider)
          .single();

        if (fetchError || !tokenData?.refresh_token_encrypted) {
          return new Response(
            JSON.stringify({ error: 'No refresh token found' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Refresh the token
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: googleClientId,
            client_secret: googleClientSecret,
            refresh_token: tokenData.refresh_token_encrypted,
            grant_type: 'refresh_token'
          })
        });

        const newTokens = await refreshResponse.json();

        if (newTokens.error) {
          return new Response(
            JSON.stringify({ error: newTokens.error_description || newTokens.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

        // Update stored token
        await supabase
          .from('oauth_tokens')
          .update({
            access_token_encrypted: newTokens.access_token,
            expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })
          .eq('organization_id', organization_id)
          .eq('provider', provider);

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
        // Get stored token
        const { data: tokenData } = await supabase
          .from('oauth_tokens')
          .select('access_token_encrypted')
          .eq('organization_id', organization_id)
          .eq('provider', provider)
          .single();

        if (tokenData?.access_token_encrypted) {
          // Revoke with Google
          await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.access_token_encrypted}`, {
            method: 'POST'
          });
        }

        // Delete from database
        await supabase
          .from('oauth_tokens')
          .delete()
          .eq('organization_id', organization_id)
          .eq('provider', provider);

        await supabase
          .from('integrations')
          .update({ status: 'disconnected' })
          .eq('organization_id', organization_id)
          .eq('provider', provider);

        return new Response(
          JSON.stringify({ success: true, message: 'Token revoked' }),
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
    console.error('OAuth error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
