import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OutgoingMessage {
  conversation_id: string;
  content: string;
  media_urls?: string[];
  metadata?: Record<string, any>;
}

async function sendWhatsApp(to: string, content: string, config: any): Promise<{ success: boolean; external_id?: string; error?: string }> {
  if (!config.whatsapp_business_account_id || !config.whatsapp_access_token) {
    return { success: false, error: 'WhatsApp not configured' };
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${config.whatsapp_phone_number_id}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsapp_access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: content }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error };
  }

  const result = await response.json();
  return { success: true, external_id: result.messages?.[0]?.id };
}

async function sendSMS(to: string, content: string, config: any): Promise<{ success: boolean; external_id?: string; error?: string }> {
  if (!config.twilio_account_sid || !config.twilio_auth_token || !config.twilio_phone_number) {
    return { success: false, error: 'Twilio not configured' };
  }

  const auth = btoa(`${config.twilio_account_sid}:${config.twilio_auth_token}`);
  const body = new URLSearchParams({
    To: to,
    From: config.twilio_phone_number,
    Body: content
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.twilio_account_sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    }
  );

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error };
  }

  const result = await response.json();
  return { success: true, external_id: result.sid };
}

async function sendEmail(to: string, content: string, config: any): Promise<{ success: boolean; external_id?: string; error?: string }> {
  if (!config.sendgrid_api_key || !config.sendgrid_from_email) {
    return { success: false, error: 'SendGrid not configured' };
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.sendgrid_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: config.sendgrid_from_email },
      subject: 'New Message',
      content: [{ type: 'text/plain', value: content }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error };
  }

  const messageId = response.headers.get('x-message-id');
  return { success: true, external_id: messageId || undefined };
}

async function sendManyChat(to: string, content: string, config: any): Promise<{ success: boolean; external_id?: string; error?: string }> {
  if (!config.manychat_api_key) {
    return { success: false, error: 'ManyChat not configured' };
  }

  const response = await fetch('https://api.manychat.com/fb/sending/sendContent', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.manychat_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subscriber_id: to,
      data: {
        version: 'v2',
        content: {
          messages: [
            {
              type: 'text',
              text: content
            }
          ]
        }
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error };
  }

  return { success: true };
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

    const { conversation_id, content, media_urls, metadata }: OutgoingMessage = await req.json();

    if (!conversation_id || !content) {
      return new Response(
        JSON.stringify({ error: 'conversation_id and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, organizations!inner(provider_config)')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const providerConfig = conversation.organizations.provider_config || {};
    const channel = conversation.channel;
    const recipient = conversation.external_id;

    let sendResult: { success: boolean; external_id?: string; error?: string };

    switch (channel) {
      case 'whatsapp':
        sendResult = await sendWhatsApp(recipient, content, providerConfig);
        break;
      case 'sms':
        sendResult = await sendSMS(recipient, content, providerConfig);
        break;
      case 'email':
        sendResult = await sendEmail(recipient, content, providerConfig);
        break;
      case 'manychat':
        sendResult = await sendManyChat(recipient, content, providerConfig);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unsupported channel: ${channel}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (!sendResult.success) {
      return new Response(
        JSON.stringify({ error: 'Failed to send message', details: sendResult.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: messageRecord, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        organization_id: conversation.organization_id,
        direction: 'outbound',
        channel,
        content,
        media_urls: media_urls || [],
        external_id: sendResult.external_id,
        sender_id: 'system',
        recipient_id: recipient,
        metadata: metadata || {},
        status: 'sent'
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error storing message:', msgError);
    }

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation_id);

    await supabase.from('event_bus').insert({
      event_type: 'message.sent',
      payload: {
        conversation_id,
        message_id: messageRecord?.id,
        channel,
        recipient
      },
      organization_id: conversation.organization_id,
      source: 'message-egress',
      priority: 'normal',
      status: 'pending'
    });

    return new Response(
      JSON.stringify({
        success: true,
        message_id: messageRecord?.id,
        external_id: sendResult.external_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in message-egress:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
