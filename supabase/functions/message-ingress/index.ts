import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface IncomingMessage {
  provider: 'whatsapp' | 'sms' | 'email' | 'manychat' | 'ghl' | 'internal';
  external_id: string;
  from: string;
  to: string;
  content: string;
  media_urls?: string[];
  metadata?: Record<string, any>;
  organization_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const message: IncomingMessage = await req.json();

    if (!message.provider || !message.external_id || !message.from || !message.content || !message.organization_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: provider, external_id, from, content, organization_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingConversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('organization_id', message.organization_id)
      .eq('channel', message.provider)
      .eq('external_id', message.from)
      .maybeSingle();

    let conversationId = existingConversation?.id;

    if (!conversationId) {
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          organization_id: message.organization_id,
          channel: message.provider,
          external_id: message.from,
          contact_info: {
            identifier: message.from,
            provider: message.provider
          },
          status: 'active',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create conversation', details: createError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      conversationId = newConversation.id;
    } else {
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    const { data: messageRecord, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        organization_id: message.organization_id,
        direction: 'inbound',
        channel: message.provider,
        content: message.content,
        media_urls: message.media_urls || [],
        external_id: message.external_id,
        sender_id: message.from,
        recipient_id: message.to,
        metadata: message.metadata || {},
        status: 'delivered'
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error inserting message:', msgError);
      return new Response(
        JSON.stringify({ error: 'Failed to store message', details: msgError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase.from('event_bus').insert({
      event_type: 'message.received',
      payload: {
        conversation_id: conversationId,
        message_id: messageRecord.id,
        provider: message.provider,
        from: message.from,
        content: message.content
      },
      organization_id: message.organization_id,
      source: 'message-ingress',
      priority: 'high',
      status: 'pending'
    });

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: conversationId,
        message_id: messageRecord.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in message-ingress:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
