import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  description?: string;
  conversationId?: string;
  leadId?: string;
  metadata?: Record<string, string>;
}

interface PaymentLinkRequest {
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  conversationId?: string;
  expiresInHours?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      throw new Error('No organization found');
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    if (path === 'create-payment-intent' && req.method === 'POST') {
      const body: PaymentIntentRequest = await req.json();
      
      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .insert({
          organization_id: membership.organization_id,
          user_id: user.id,
          amount: body.amount,
          currency: body.currency || 'USD',
          status: 'pending',
          description: body.description,
          conversation_id: body.conversationId || null,
          lead_id: body.leadId || null,
          metadata: body.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('revenue_events')
        .insert({
          organization_id: membership.organization_id,
          event_type: 'payment_initiated',
          amount: body.amount,
          currency: body.currency || 'USD',
          source_type: 'payment',
          source_id: transaction.id,
          conversation_id: body.conversationId || null,
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          transaction,
          message: 'Payment transaction created. Stripe integration coming soon.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'create-payment-link' && req.method === 'POST') {
      const body: PaymentLinkRequest = await req.json();
      
      const linkUrl = `${supabaseUrl}/pay/${crypto.randomUUID()}`;
      const expiresAt = body.expiresInHours 
        ? new Date(Date.now() + body.expiresInHours * 60 * 60 * 1000).toISOString()
        : null;

      const { data: paymentLink, error } = await supabase
        .from('payment_links')
        .insert({
          organization_id: membership.organization_id,
          created_by: user.id,
          title: body.title,
          description: body.description,
          amount: body.amount,
          currency: body.currency || 'USD',
          link_url: linkUrl,
          status: 'active',
          expires_at: expiresAt,
          conversation_id: body.conversationId || null,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, paymentLink }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'list-transactions' && req.method === 'GET') {
      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, transactions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'update-transaction-status' && req.method === 'POST') {
      const { transactionId, status } = await req.json();
      
      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', transactionId)
        .eq('organization_id', membership.organization_id)
        .select()
        .single();

      if (error) throw error;

      if (status === 'completed') {
        await supabase
          .from('revenue_events')
          .insert({
            organization_id: membership.organization_id,
            event_type: 'payment_received',
            amount: transaction.amount,
            currency: transaction.currency,
            source_type: 'payment',
            source_id: transaction.id,
            conversation_id: transaction.conversation_id,
          });
      }

      return new Response(
        JSON.stringify({ success: true, transaction }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment processor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});