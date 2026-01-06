import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, organization_id, lead_id } = await req.json();

    if (action === 'find_dead_leads') {
      // Find leads with no contact > 60 days, status stalled/cold
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, email, phone, status, last_objection, last_contacted_at, reactivation_count, score')
        .eq('organization_id', organization_id)
        .in('status', ['stalled', 'cold', 'unresponsive'])
        .lt('last_contacted_at', sixtyDaysAgo.toISOString())
        .lt('reactivation_count', 3) // Max 3 resurrection attempts
        .order('score', { ascending: false }); // Prioritize high-score leads

      if (error) throw error;

      // Group by objection type
      const byObjection: Record<string, any[]> = {
        'price': [],
        'timing': [],
        'competitor': [],
        'ghosted': [],
        'other': []
      };

      for (const lead of leads || []) {
        const objection = lead.last_objection?.toLowerCase() || 'ghosted';
        if (objection.includes('price') || objection.includes('expensive') || objection.includes('budget')) {
          byObjection.price.push(lead);
        } else if (objection.includes('later') || objection.includes('timing') || objection.includes('busy')) {
          byObjection.timing.push(lead);
        } else if (objection.includes('competitor') || objection.includes('alternative')) {
          byObjection.competitor.push(lead);
        } else if (!lead.last_objection) {
          byObjection.ghosted.push(lead);
        } else {
          byObjection.other.push(lead);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          total: leads?.length || 0,
          by_objection: byObjection
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'generate_resurrection_message') {
      // Get lead details
      const { data: lead, error } = await supabase
        .from('leads')
        .select('*, organizations(business_config(*))')
        .eq('id', lead_id)
        .single();

      if (error || !lead) {
        throw new Error('Lead not found');
      }

      // Get recent chat history if available
      const { data: chats } = await supabase
        .from('chats')
        .select('messages')
        .eq('lead_id', lead_id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastMessages = chats?.[0]?.messages?.slice(-5) || [];
      const businessConfig = (lead.organizations as any)?.business_config;

      const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Draft a reactivation message for a cold lead.

LEAD INFO:
- Name: ${lead.name}
- Last objection: "${lead.last_objection || 'Stopped replying'}"
- Last contact: ${lead.last_contacted_at}
- Previous reactivation attempts: ${lead.reactivation_count || 0}

LAST CONVERSATION CONTEXT:
${JSON.stringify(lastMessages)}

BUSINESS CONTEXT:
- Product: ${businessConfig?.product_name || 'our service'}
- Current offer: $${businessConfig?.base_price || 'competitive pricing'}

STRATEGY BY OBJECTION TYPE:
- Price: Mention new pricing, payment plans, or value breakdown
- Timing: Reference their "call me later" request naturally
- Competitor: Share a recent success story or differentiator
- Ghosted: Use pattern interrupt with curiosity hook

Generate THREE message options (SMS-length, ~160 chars each):
1. Casual/friendly approach
2. Value-driven approach  
3. Curiosity hook approach

Format as JSON:
{
  "messages": [
    {"type": "casual", "content": "..."},
    {"type": "value", "content": "..."},
    {"type": "curiosity", "content": "..."}
  ],
  "recommended": "casual" or "value" or "curiosity",
  "reasoning": "why this approach fits"
}

Return ONLY valid JSON.`
              }]
            }],
            generationConfig: { temperature: 0.8 }
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate message');
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      let messages;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        messages = jsonMatch ? JSON.parse(jsonMatch[0]) : { messages: [], recommended: 'casual' };
      } catch (e) {
        messages = {
          messages: [
            { type: 'casual', content: `Hey ${lead.name}, it's been a while! Wanted to check in and see how things are going. Still thinking about ${businessConfig?.product_name || 'working together'}?` }
          ],
          recommended: 'casual'
        };
      }

      return new Response(
        JSON.stringify({ success: true, lead, ...messages }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send_resurrection') {
      const { message, channel } = await req.json();

      // Get lead
      const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead_id)
        .single();

      if (error || !lead) {
        throw new Error('Lead not found');
      }

      // Update lead status
      await supabase
        .from('leads')
        .update({
          status: 'reactivation_attempted',
          resurrection_status: 'sent',
          last_resurrection_at: new Date().toISOString(),
          reactivation_count: (lead.reactivation_count || 0) + 1,
          last_contacted_at: new Date().toISOString()
        })
        .eq('id', lead_id);

      // Log the action
      await supabase
        .from('agent_execution_logs')
        .insert({
          organization_id: lead.organization_id,
          lead_id,
          action_type: 'lazarus_resurrection',
          action_details: {
            message,
            channel,
            objection: lead.last_objection,
            attempt_number: (lead.reactivation_count || 0) + 1
          },
          result: 'sent'
        });

      // Here you would integrate with actual SMS/Email service
      // For now, we just log the action

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Resurrection message queued',
          lead_id,
          channel
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'bulk_resurrect') {
      const { lead_ids, message_type } = await req.json();

      const results: any[] = [];
      for (const lid of lead_ids.slice(0, 50)) { // Max 50 at a time
        // Generate message for each lead
        const genResponse = await fetch(req.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_resurrection_message',
            organization_id,
            lead_id: lid
          })
        });

        if (genResponse.ok) {
          const genResult = await genResponse.json();
          const selectedMessage = genResult.messages?.find((m: any) => m.type === (message_type || genResult.recommended));

          if (selectedMessage) {
            // Send the message
            await fetch(req.url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'send_resurrection',
                organization_id,
                lead_id: lid,
                message: selectedMessage.content,
                channel: 'email'
              })
            });
            results.push({ lead_id: lid, status: 'sent' });
          }
        } else {
          results.push({ lead_id: lid, status: 'failed' });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_resurrection_stats') {
      const { data: stats, error } = await supabase
        .from('leads')
        .select('resurrection_status, reactivation_count')
        .eq('organization_id', organization_id)
        .not('resurrection_status', 'is', null);

      if (error) throw error;

      const summary = {
        total_resurrected: stats?.length || 0,
        by_status: {} as Record<string, number>,
        by_attempt: {} as Record<string, number>
      };

      for (const lead of stats || []) {
        summary.by_status[lead.resurrection_status] = (summary.by_status[lead.resurrection_status] || 0) + 1;
        const attempt = `attempt_${lead.reactivation_count}`;
        summary.by_attempt[attempt] = (summary.by_attempt[attempt] || 0) + 1;
      }

      return new Response(
        JSON.stringify({ success: true, stats: summary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Lazarus Resurrector Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
