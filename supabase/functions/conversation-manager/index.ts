import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AssignConversationRequest {
  conversation_id: string;
  assigned_to?: string;
  assigned_agent_id?: string;
}

interface UpdateConversationRequest {
  conversation_id: string;
  status?: 'active' | 'snoozed' | 'closed';
  tags?: string[];
  metadata?: Record<string, any>;
}

interface ListConversationsRequest {
  organization_id: string;
  status?: string;
  channel?: string;
  assigned_to?: string;
  limit?: number;
  offset?: number;
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

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

    if (req.method === 'GET' && action === 'list') {
      const organization_id = url.searchParams.get('organization_id');
      const status = url.searchParams.get('status');
      const channel = url.searchParams.get('channel');
      const assigned_to = url.searchParams.get('assigned_to');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      if (!organization_id) {
        return new Response(
          JSON.stringify({ error: 'organization_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabase
        .from('conversations')
        .select('*, messages(id, content, created_at, direction)', { count: 'exact' })
        .eq('organization_id', organization_id)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq('status', status);
      if (channel) query = query.eq('channel', channel);
      if (assigned_to) query = query.eq('assigned_to', assigned_to);

      const { data: conversations, error: listError, count } = await query;

      if (listError) {
        return new Response(
          JSON.stringify({ error: 'Failed to list conversations', details: listError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ conversations, total: count }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && action === 'assign') {
      const { conversation_id, assigned_to, assigned_agent_id }: AssignConversationRequest = await req.json();

      if (!conversation_id) {
        return new Response(
          JSON.stringify({ error: 'conversation_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateData: any = {};
      if (assigned_to) updateData.assigned_to = assigned_to;
      if (assigned_agent_id) updateData.assigned_agent_id = assigned_agent_id;

      const { data: conversation, error: assignError } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversation_id)
        .select()
        .single();

      if (assignError) {
        return new Response(
          JSON.stringify({ error: 'Failed to assign conversation', details: assignError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase.from('event_bus').insert({
        event_type: 'conversation.assigned',
        payload: {
          conversation_id,
          assigned_to,
          assigned_agent_id
        },
        organization_id: conversation.organization_id,
        source: 'conversation-manager',
        priority: 'normal',
        status: 'pending'
      });

      return new Response(
        JSON.stringify({ success: true, conversation }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT' && action === 'update') {
      const { conversation_id, status, tags, metadata }: UpdateConversationRequest = await req.json();

      if (!conversation_id) {
        return new Response(
          JSON.stringify({ error: 'conversation_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (tags) updateData.tags = tags;
      if (metadata) updateData.metadata = metadata;

      const { data: conversation, error: updateError } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversation_id)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update conversation', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase.from('event_bus').insert({
        event_type: 'conversation.updated',
        payload: {
          conversation_id,
          changes: updateData
        },
        organization_id: conversation.organization_id,
        source: 'conversation-manager',
        priority: 'low',
        status: 'pending'
      });

      return new Response(
        JSON.stringify({ success: true, conversation }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or method' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in conversation-manager:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
