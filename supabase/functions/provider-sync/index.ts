import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SyncRequest {
  organization_id: string;
  provider: 'whatsapp' | 'sms' | 'email' | 'manychat' | 'ghl';
  sync_type: 'contacts' | 'messages' | 'status' | 'full';
}

async function syncWhatsApp(orgId: string, config: any, supabase: any) {
  console.log('Syncing WhatsApp for org:', orgId);
  return { synced_contacts: 0, synced_messages: 0 };
}

async function syncTwilio(orgId: string, config: any, supabase: any) {
  if (!config.twilio_account_sid || !config.twilio_auth_token) {
    throw new Error('Twilio not configured');
  }

  const auth = btoa(`${config.twilio_account_sid}:${config.twilio_auth_token}`);
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.twilio_account_sid}/Messages.json?PageSize=50`,
    {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch messages from Twilio');
  }

  const data = await response.json();
  let syncedCount = 0;

  for (const msg of data.messages || []) {
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('external_id', msg.sid)
      .maybeSingle();

    if (!existing) {
      const direction = msg.direction === 'inbound' ? 'inbound' : 'outbound';
      const from = msg.from;
      const to = msg.to;

      let conversationId: string;
      const identifier = direction === 'inbound' ? from : to;

      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('organization_id', orgId)
        .eq('channel', 'sms')
        .eq('external_id', identifier)
        .maybeSingle();

      if (conv) {
        conversationId = conv.id;
      } else {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            organization_id: orgId,
            channel: 'sms',
            external_id: identifier,
            contact_info: { identifier, provider: 'sms' },
            status: 'active',
            last_message_at: msg.date_sent
          })
          .select()
          .single();
        conversationId = newConv.id;
      }

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        organization_id: orgId,
        direction,
        channel: 'sms',
        content: msg.body,
        external_id: msg.sid,
        sender_id: from,
        recipient_id: to,
        status: msg.status,
        created_at: msg.date_sent
      });

      syncedCount++;
    }
  }

  return { synced_contacts: 0, synced_messages: syncedCount };
}

async function syncSendGrid(orgId: string, config: any, supabase: any) {
  console.log('Syncing SendGrid for org:', orgId);
  return { synced_contacts: 0, synced_messages: 0 };
}

async function syncManyChat(orgId: string, config: any, supabase: any) {
  console.log('Syncing ManyChat for org:', orgId);
  return { synced_contacts: 0, synced_messages: 0 };
}

async function syncGHL(orgId: string, config: any, supabase: any) {
  if (!config.ghl_access_token) {
    throw new Error('GoHighLevel not configured');
  }

  console.log('Syncing GHL for org:', orgId);
  return { synced_contacts: 0, synced_messages: 0 };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { organization_id, provider, sync_type = 'full' }: SyncRequest = await req.json();

    if (!organization_id || !provider) {
      return new Response(
        JSON.stringify({ error: 'organization_id and provider are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('provider_config')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const providerConfig = org.provider_config || {};
    let syncResult;

    switch (provider) {
      case 'whatsapp':
        syncResult = await syncWhatsApp(organization_id, providerConfig, supabase);
        break;
      case 'sms':
        syncResult = await syncTwilio(organization_id, providerConfig, supabase);
        break;
      case 'email':
        syncResult = await syncSendGrid(organization_id, providerConfig, supabase);
        break;
      case 'manychat':
        syncResult = await syncManyChat(organization_id, providerConfig, supabase);
        break;
      case 'ghl':
        syncResult = await syncGHL(organization_id, providerConfig, supabase);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unsupported provider: ${provider}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    await supabase.from('event_bus').insert({
      event_type: 'provider.synced',
      payload: {
        provider,
        sync_type,
        ...syncResult
      },
      organization_id,
      source: 'provider-sync',
      priority: 'low',
      status: 'pending'
    });

    return new Response(
      JSON.stringify({
        success: true,
        provider,
        sync_type,
        ...syncResult
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in provider-sync:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
