import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// This handles the OAuth callback redirect from GHL
serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // organization_id
  const error = url.searchParams.get('error');

  console.log('CRM OAuth callback received:', { code: !!code, state, error });

  // Build redirect URL back to the app
  const appUrl = Deno.env.get('APP_URL') || 'https://lovable.dev';
  const redirectUrl = new URL('/integrations', appUrl);

  if (error) {
    redirectUrl.searchParams.set('ghl_error', error);
    return Response.redirect(redirectUrl.toString(), 302);
  }

  if (code && state) {
    redirectUrl.searchParams.set('ghl_code', code);
    redirectUrl.searchParams.set('org_id', state);
  }

  // Redirect to app with the code (app will call exchange_code)
  return Response.redirect(redirectUrl.toString(), 302);
});
