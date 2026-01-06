import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceDialerRequest {
  organizationId: string;
  leadId?: string;
  leadName: string;
  leadPhone: string;
  context: string;
  variantId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, leadId, leadName, leadPhone, context, variantId }: VoiceDialerRequest = await req.json();

    const VAPI_PRIVATE_KEY = Deno.env.get('VAPI_PRIVATE_KEY');
    const VAPI_PHONE_ID = Deno.env.get('VAPI_PHONE_ID');
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!VAPI_PRIVATE_KEY || !VAPI_PHONE_ID) {
      console.log('[Voice] Vapi.ai not configured - simulating call');
      
      // Simulate call for demo purposes
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      
      await supabase.from('voice_call_logs').insert({
        organization_id: organizationId,
        lead_id: leadId || null,
        phone_number: leadPhone,
        call_status: 'simulated',
        call_outcome: 'demo_mode',
        variant_id: variantId || null,
        transcript: `[SIMULATED] Call to ${leadName} at ${leadPhone}. Context: ${context}`
      });

      await supabase.from('agent_execution_logs').insert({
        organization_id: organizationId,
        lead_id: leadId || null,
        action_type: 'voice_dialer',
        reasoning: `Simulated call to ${leadName} (Vapi not configured)`,
        action_details: { leadName, leadPhone, context, mode: 'simulated' },
        result: 'simulated'
      });

      return new Response(JSON.stringify({
        success: true,
        mode: 'simulated',
        message: 'Vapi.ai not configured. Add VAPI_PRIVATE_KEY and VAPI_PHONE_ID to enable real calls.'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`[Voice] Initiating call to ${leadName} at ${leadPhone}...`);

    // Get business context for personalization
    const { data: identity } = await supabase
      .from('business_identity')
      .select('*')
      .eq('organization_id', organizationId);

    const businessInfo = identity?.map(i => `${i.identity_element}: ${i.title}`).join(', ') || 'Alpha Vision AI Sales Agent';

    // Get voice script variant if available
    let voiceScript = `You are a helpful sales assistant. Your goal is to book a meeting.
Context: ${context}. 
If they say yes, ask for a time tomorrow.
If they say no, politely hang up.`;

    if (variantId) {
      const { data: variant } = await supabase
        .from('prompt_variants')
        .select('prompt_text')
        .eq('id', variantId)
        .single();
      
      if (variant?.prompt_text) {
        voiceScript = variant.prompt_text;
      }

      // Increment variant uses
      await supabase.rpc('increment_variant_uses', { p_variant_id: variantId });
    }

    // Call Vapi.ai to initiate outbound call
    const response = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phoneNumberId: VAPI_PHONE_ID,
        customer: {
          number: leadPhone,
          name: leadName
        },
        assistant: {
          firstMessage: `Hi ${leadName}, this is Alex calling from ${businessInfo.split(',')[0] || 'Alpha Vision'}. ${context.slice(0, 100)}`,
          model: {
            provider: "openai",
            model: "gpt-4-turbo",
            messages: [
              {
                role: "system",
                content: voiceScript
              }
            ]
          },
          voice: "jennifer-playht"
        },
        // Webhook for call status updates
        serverUrl: `${SUPABASE_URL}/functions/v1/webhook-handler`,
        serverUrlSecret: Deno.env.get('N8N_WEBHOOK_SECRET') || undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Voice] Vapi API error:', errorText);
      throw new Error(`Vapi API error: ${response.status} - ${errorText}`);
    }

    const callData = await response.json();

    // Log the call initiation
    const { data: callLog } = await supabase.from('voice_call_logs').insert({
      organization_id: organizationId,
      lead_id: leadId || null,
      vapi_call_id: callData.id,
      phone_number: leadPhone,
      call_status: 'initiated',
      variant_id: variantId || null
    }).select().single();

    await supabase.from('agent_execution_logs').insert({
      organization_id: organizationId,
      lead_id: leadId || null,
      action_type: 'voice_dialer',
      reasoning: `Initiated voice call to ${leadName}`,
      action_details: { 
        leadName, 
        leadPhone, 
        context,
        vapi_call_id: callData.id,
        variant_id: variantId
      },
      result: 'initiated'
    });

    return new Response(JSON.stringify({
      success: true,
      call_id: callData.id,
      call_log_id: callLog?.id,
      status: 'initiated'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[Voice] Error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
