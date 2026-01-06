import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const CREDIT_COSTS = {
  'chat_message': 1,
  'decision_analysis': 3,
  'action_approval': 2,
  'automation_execution': 5,
  'ai_insight': 2,
  'report_generation': 10,
  'integration_sync': 3,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      return new Response(
        JSON.stringify({ error: 'No organization found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orgId = membership.organization_id;

    if (req.method === 'POST') {
      const { action_type, metadata } = await req.json();

      const creditCost = CREDIT_COSTS[action_type as keyof typeof CREDIT_COSTS] || 1;

      const { data: creditAccount } = await supabase
        .from('decision_credits')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!creditAccount) {
        return new Response(
          JSON.stringify({
            error: 'No credit account found',
            action_type,
            credit_cost: creditCost,
            balance: 0
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const currentBalance = creditAccount.balance || 0;

      if (currentBalance < creditCost) {
        return new Response(
          JSON.stringify({
            error: 'Insufficient credits',
            action_type,
            credit_cost: creditCost,
            balance: currentBalance,
            required: creditCost,
            shortfall: creditCost - currentBalance
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newBalance = currentBalance - creditCost;

      const { error: updateError } = await supabase
        .from('decision_credits')
        .update({
          balance: newBalance,
          total_used: (creditAccount.total_used || 0) + creditCost,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', creditAccount.id);

      if (updateError) throw updateError;

      await supabase
        .from('credit_transactions')
        .insert({
          organization_id: orgId,
          credit_account_id: creditAccount.id,
          type: 'debit',
          amount: creditCost,
          balance_after: newBalance,
          reason: action_type,
          metadata: {
            action_type,
            ...metadata
          }
        });

      if (newBalance <= 10 && currentBalance > 10) {
        await supabase
          .from('notifications')
          .insert({
            organization_id: orgId,
            type: 'credit_low_balance',
            title: 'Low Credit Balance Warning',
            message: `Your credit balance is now ${newBalance}. Consider purchasing more credits to avoid service interruption.`,
            severity: 'warning',
            metadata: {
              balance: newBalance,
              trigger: 'auto_check'
            }
          });
      }

      return new Response(
        JSON.stringify({
          success: true,
          action_type,
          credit_cost: creditCost,
          previous_balance: currentBalance,
          new_balance: newBalance,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const action = url.searchParams.get('action');

      if (action === 'balance') {
        const { data: creditAccount } = await supabase
          .from('decision_credits')
          .select('*')
          .eq('organization_id', orgId)
          .maybeSingle();

        return new Response(
          JSON.stringify({
            balance: creditAccount?.balance || 0,
            total_purchased: creditAccount?.total_purchased || 0,
            total_used: creditAccount?.total_used || 0,
            last_used_at: creditAccount?.last_used_at,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'transactions') {
        const limit = parseInt(url.searchParams.get('limit') || '50');

        const { data: transactions } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(limit);

        return new Response(
          JSON.stringify({ transactions }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'pricing') {
        return new Response(
          JSON.stringify({
            credit_costs: CREDIT_COSTS,
            packages: [
              { name: 'Starter', credits: 100, price: 29, per_credit: 0.29 },
              { name: 'Professional', credits: 500, price: 119, per_credit: 0.24 },
              { name: 'Business', credits: 2000, price: 399, per_credit: 0.20 },
              { name: 'Enterprise', credits: 10000, price: 1699, per_credit: 0.17 },
            ]
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT') {
      const { credits_to_add, payment_intent_id } = await req.json();

      if (!credits_to_add || credits_to_add <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid credits amount' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: creditAccount } = await supabase
        .from('decision_credits')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      let accountId: string;

      if (!creditAccount) {
        const { data: newAccount, error: createError } = await supabase
          .from('decision_credits')
          .insert({
            organization_id: orgId,
            balance: credits_to_add,
            total_purchased: credits_to_add,
            total_used: 0,
          })
          .select()
          .maybeSingle();

        if (createError) throw createError;
        accountId = newAccount!.id;
      } else {
        const { error: updateError } = await supabase
          .from('decision_credits')
          .update({
            balance: (creditAccount.balance || 0) + credits_to_add,
            total_purchased: (creditAccount.total_purchased || 0) + credits_to_add,
          })
          .eq('id', creditAccount.id);

        if (updateError) throw updateError;
        accountId = creditAccount.id;
      }

      await supabase
        .from('credit_transactions')
        .insert({
          organization_id: orgId,
          credit_account_id: accountId,
          type: 'credit',
          amount: credits_to_add,
          balance_after: (creditAccount?.balance || 0) + credits_to_add,
          reason: 'purchase',
          metadata: {
            payment_intent_id,
            purchase_date: new Date().toISOString()
          }
        });

      return new Response(
        JSON.stringify({
          success: true,
          credits_added: credits_to_add,
          new_balance: (creditAccount?.balance || 0) + credits_to_add,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Credit manager error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
