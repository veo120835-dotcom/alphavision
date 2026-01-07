import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function calculateCommission(amount: number, rule: any): number {
  if (rule.calculation_method === 'percentage') {
    return amount * rule.rate;
  } else if (rule.calculation_method === 'flat') {
    return rule.flat_amount;
  } else if (rule.calculation_method === 'tiered') {
    const tiers = rule.conditions?.tiers || [];
    for (const tier of tiers) {
      if (amount >= tier.min && (tier.max === null || amount <= tier.max)) {
        return amount * tier.rate;
      }
    }
    return amount * (rule.rate || 0.1);
  }
  return 0;
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
    const path = url.pathname.split('/').filter(p => p).pop();

    if (path === 'calculate' && req.method === 'POST') {
      const { transactionId } = await req.json();
      
      const { data: transaction } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('organization_id', membership.organization_id)
        .maybeSingle();

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const { data: rules } = await supabase
        .from('commission_rules')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      const applicableRules = (rules || []).filter(rule => {
        if (rule.conditions?.min_amount && transaction.amount < rule.conditions.min_amount) {
          return false;
        }
        if (rule.conditions?.max_amount && transaction.amount > rule.conditions.max_amount) {
          return false;
        }
        return true;
      });

      const commissions = [];
      for (const rule of applicableRules) {
        const commissionAmount = calculateCommission(transaction.amount, rule);
        
        if (commissionAmount > 0) {
          const recipientUserId = rule.applies_to?.[0] || user.id;
          
          const { data: commission } = await supabase
            .from('commission_payments')
            .insert({
              organization_id: membership.organization_id,
              recipient_user_id: recipientUserId,
              rule_id: rule.id,
              source_transaction_id: transactionId,
              amount: commissionAmount,
              currency: transaction.currency,
              status: 'pending',
              metadata: {
                rule_name: rule.name,
                calculation_method: rule.calculation_method,
                rate: rule.rate,
              },
            })
            .select()
            .single();

          commissions.push(commission);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          commissions,
          total_commission: commissions.reduce((sum, c) => sum + c.amount, 0),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'list-commissions' && req.method === 'GET') {
      const status = url.searchParams.get('status');
      const userId = url.searchParams.get('userId');
      
      let query = supabase
        .from('commission_payments')
        .select('*, commission_rules(name), payment_transactions(amount, description)')
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (userId) {
        query = query.eq('recipient_user_id', userId);
      }

      const { data: commissions, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, commissions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'approve-commission' && req.method === 'POST') {
      const { commissionId } = await req.json();
      
      const { data: commission, error } = await supabase
        .from('commission_payments')
        .update({ status: 'approved' })
        .eq('id', commissionId)
        .eq('organization_id', membership.organization_id)
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('revenue_events')
        .insert({
          organization_id: membership.organization_id,
          event_type: 'commission_earned',
          amount: commission.amount,
          currency: commission.currency,
          source_type: 'commission',
          source_id: commission.id,
        });

      return new Response(
        JSON.stringify({ success: true, commission }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'mark-paid' && req.method === 'POST') {
      const { commissionId } = await req.json();
      
      const { data: commission, error } = await supabase
        .from('commission_payments')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', commissionId)
        .eq('organization_id', membership.organization_id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, commission }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'create-rule' && req.method === 'POST') {
      const body = await req.json();
      
      const { data: rule, error } = await supabase
        .from('commission_rules')
        .insert({
          organization_id: membership.organization_id,
          name: body.name,
          rule_type: body.ruleType,
          calculation_method: body.calculationMethod,
          rate: body.rate || null,
          flat_amount: body.flatAmount || null,
          conditions: body.conditions || {},
          applies_to: body.appliesTo || [],
          is_active: true,
          priority: body.priority || 5,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, rule }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'list-rules' && req.method === 'GET') {
      const { data: rules, error } = await supabase
        .from('commission_rules')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .order('priority', { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, rules }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Commission engine error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});