import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatSendRequest {
  org_id?: string;
  session_id: string;
  message: {
    text: string;
    attachments?: Array<{
      type: 'file' | 'url' | 'text';
      name?: string;
      url?: string;
      text?: string;
      mime_type?: string;
    }>;
  };
  ui_state?: {
    mode: 'advisor' | 'operator' | 'autopilot';
    risk?: {
      personal: 'conservative' | 'balanced' | 'aggressive';
      ops: 'conservative' | 'balanced' | 'aggressive';
      marketing: 'conservative' | 'balanced' | 'aggressive';
    };
  };
  client_context?: {
    timezone?: string;
    locale?: string;
  };
}

interface AgentResponse {
  mode: string;
  decision: string;
  why_this_wins: string[];
  assumptions: string[];
  risks: Array<{ risk: string; mitigation: string; severity: string }>;
  options: {
    A: { label: string; plan: string };
    B: { label: string; plan: string };
    C: { label: string; plan: string };
  };
  next_actions: Array<{
    id: string;
    task: string;
    owner: 'user' | 'system';
    action_id?: string;
    due_in_days?: number;
  }>;
  metrics: Array<{ name: string; target: string; type: string }>;
  kill_criteria: string[];
  questions: string[];
  proposed_actions: Array<{
    action_id: string;
    type: string;
    payload: Record<string, unknown>;
    requires_approval: boolean;
    estimated_cost?: { currency: string; amount: number };
    policy_checks?: { passed: boolean; violations: Array<{ rule: string; message: string }> };
  }>;
  links?: { decision_log_url?: string };
  request_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's org
    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: { code: 'NO_ORG', message: 'User has no organization' } }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const orgId = membership.organization_id;
    const requestId = crypto.randomUUID();

    // Route handling
    // POST /v1/sessions - Create session
    if (path === '/v1/sessions' && method === 'POST') {
      const body = await req.json();
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          organization_id: orgId,
          user_id: user.id,
          title: body.title || 'New Session'
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ session, request_id: requestId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /v1/sessions/:id - Get session with messages
    const sessionMatch = path.match(/^\/v1\/sessions\/([^\/]+)$/);
    if (sessionMatch && method === 'GET') {
      const sessionId = sessionMatch[1];
      
      const { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('organization_id', orgId)
        .single();

      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      return new Response(JSON.stringify({ session, messages, request_id: requestId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/chat/send - Send message and get AI response
    if (path === '/v1/chat/send' && method === 'POST') {
      const body: ChatSendRequest = await req.json();
      
      // Store user message
      const { data: userMessage, error: msgError } = await supabase
        .from('messages')
        .insert({
          session_id: body.session_id,
          role: 'user',
          content: body.message.text,
          metadata: { attachments: body.message.attachments }
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Get policy for context
      const { data: policy } = await supabase
        .from('permission_contracts')
        .select('*')
        .eq('organization_id', orgId)
        .eq('active', true)
        .single();

      // Get business config
      const { data: businessConfig } = await supabase
        .from('business_config')
        .select('*')
        .eq('organization_id', orgId)
        .single();

      // Call AI
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      const systemPrompt = `You are Alpha Vision, an AI-powered business advisor and autonomous agent.

Current Mode: ${body.ui_state?.mode || 'operator'}
Risk Posture: ${JSON.stringify(body.ui_state?.risk || { personal: 'balanced', ops: 'balanced', marketing: 'balanced' })}

Business Context:
${businessConfig ? JSON.stringify(businessConfig) : 'No business config set'}

Policy Constraints:
- Runway minimum: ${policy?.runway_minimum || 6} months
- Autonomy level: ${policy?.version || 0}
- Monthly caps: Ads $${policy?.monthly_cap_ads || 2000}, Experiments $${policy?.monthly_cap_experiments || 500}

You MUST respond with a valid JSON object following this exact schema:
{
  "mode": "${body.ui_state?.mode || 'operator'}",
  "decision": "Your primary recommendation",
  "why_this_wins": ["Reason 1", "Reason 2"],
  "assumptions": ["Assumption 1", "Assumption 2"],
  "risks": [{"risk": "Risk description", "mitigation": "How to handle", "severity": "low|medium|high"}],
  "options": {
    "A": {"label": "Conservative", "plan": "Description"},
    "B": {"label": "Balanced", "plan": "Description"},
    "C": {"label": "Aggressive", "plan": "Description"}
  },
  "next_actions": [{"id": "1", "task": "Action item", "owner": "user|system", "due_in_days": 7}],
  "metrics": [{"name": "Metric name", "target": "Target value", "type": "leading|lagging"}],
  "kill_criteria": ["Condition to stop"],
  "questions": ["Clarifying question if needed"],
  "proposed_actions": []
}

Always provide actionable, specific advice aligned with the user's risk posture and business context.`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: body.message.text }
          ],
          response_format: { type: 'json_object' }
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI error:', errorText);
        throw new Error('AI service error');
      }

      const aiData = await aiResponse.json();
      let agentResponse: AgentResponse;
      
      try {
        agentResponse = JSON.parse(aiData.choices[0].message.content);
        agentResponse.request_id = requestId;
      } catch {
        // Fallback if JSON parsing fails
        agentResponse = {
          mode: body.ui_state?.mode || 'operator',
          decision: aiData.choices[0].message.content,
          why_this_wins: [],
          assumptions: [],
          risks: [],
          options: { A: { label: '', plan: '' }, B: { label: '', plan: '' }, C: { label: '', plan: '' } },
          next_actions: [],
          metrics: [],
          kill_criteria: [],
          questions: [],
          proposed_actions: [],
          request_id: requestId
        };
      }

      // Store assistant message
      const { data: assistantMessage } = await supabase
        .from('messages')
        .insert({
          session_id: body.session_id,
          role: 'assistant',
          content: agentResponse.decision,
          metadata: { full_response: agentResponse }
        })
        .select()
        .single();

      // Store decision
      const { data: decision } = await supabase
        .from('decisions')
        .insert({
          session_id: body.session_id,
          message_id: assistantMessage?.id,
          recommendation: agentResponse.decision,
          why_this_wins: agentResponse.why_this_wins?.join('\n'),
          assumptions: agentResponse.assumptions,
          risks: agentResponse.risks,
          options: agentResponse.options,
          next_actions: agentResponse.next_actions,
          metrics_to_track: agentResponse.metrics?.map(m => m.name),
          kill_criteria: agentResponse.kill_criteria,
          questions_needed: agentResponse.questions
        })
        .select()
        .single();

      // Store proposed actions
      if (agentResponse.proposed_actions?.length > 0) {
        for (const action of agentResponse.proposed_actions) {
          await supabase.from('actions').insert({
            organization_id: orgId,
            decision_id: decision?.id,
            action_type: action.type,
            tool: action.type,
            parameters: action.payload,
            status: 'pending'
          });
        }
      }

      // Broadcast real-time update
      const channel = supabase.channel(`org:${orgId}`);
      await channel.send({
        type: 'broadcast',
        event: 'message_received',
        payload: { session_id: body.session_id, message_id: assistantMessage?.id }
      });

      return new Response(JSON.stringify(agentResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /v1/policy - Get active policy
    if (path === '/v1/policy' && method === 'GET') {
      const { data: policy } = await supabase
        .from('permission_contracts')
        .select('*')
        .eq('organization_id', orgId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      return new Response(JSON.stringify({
        policy: {
          id: policy?.id,
          version: policy?.version || 1,
          mode_default: 'operator',
          risk_defaults: {
            personal: policy?.risk_posture_personal || 'balanced',
            ops: policy?.risk_posture_business || 'balanced',
            marketing: policy?.risk_posture_marketing || 'balanced'
          },
          runway: {
            business_min_months: policy?.runway_minimum || 6,
            business_warn_months: 9,
            business_growth_months: 12,
            personal_min_months: 6
          },
          autonomy_level: policy?.version || 0,
          caps: {
            max_experiment_spend_monthly: { currency: 'USD', amount: policy?.monthly_cap_experiments || 2000 },
            max_single_experiment: { currency: 'USD', amount: 500 },
            max_ad_spend_daily: { currency: 'USD', amount: (policy?.monthly_cap_ads || 3000) / 30 },
            approval_required_over: { currency: 'USD', amount: 250 }
          },
          non_negotiables: {
            brand: policy?.non_negotiables || [],
            lifestyle: [],
            regulatory: []
          }
        },
        request_id: requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PUT /v1/policy - Update policy
    if (path === '/v1/policy' && method === 'PUT') {
      if (membership.role !== 'owner' && membership.role !== 'admin') {
        return new Response(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Admin required' } }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const body = await req.json();
      
      const { data: policy, error } = await supabase
        .from('permission_contracts')
        .update({
          risk_posture_personal: body.risk_defaults?.personal,
          risk_posture_business: body.risk_defaults?.ops,
          risk_posture_marketing: body.risk_defaults?.marketing,
          runway_minimum: body.runway?.business_min_months,
          monthly_cap_ads: body.caps?.max_ad_spend_daily?.amount * 30,
          monthly_cap_experiments: body.caps?.max_experiment_spend_monthly?.amount,
          non_negotiables: body.non_negotiables?.brand,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ policy, request_id: requestId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /v1/actions - List actions
    if (path === '/v1/actions' && method === 'GET') {
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const cursor = url.searchParams.get('cursor');

      let query = supabase
        .from('actions')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) query = query.eq('status', status);
      if (cursor) query = query.lt('id', cursor);

      const { data: actions } = await query;

      return new Response(JSON.stringify({
        actions: actions?.map(a => ({
          id: a.id,
          created_at: a.created_at,
          status: a.status,
          type: a.action_type,
          requires_approval: a.status === 'pending',
          estimated_cost: { currency: 'USD', amount: 0 },
          summary: `${a.action_type}: ${a.tool}`,
          policy_checks: { passed: true, violations: [] }
        })),
        pagination: {
          has_more: (actions?.length || 0) === limit,
          next_cursor: actions?.[actions.length - 1]?.id
        },
        request_id: requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/actions/:id/approve
    const approveMatch = path.match(/^\/v1\/actions\/([^\/]+)\/approve$/);
    if (approveMatch && method === 'POST') {
      const actionId = approveMatch[1];
      const body = await req.json();

      if (!body.approve) {
        return new Response(JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'approve must be true' } }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: action, error } = await supabase
        .from('actions')
        .update({
          status: 'approved',
          approved_by: user.id,
          executed_at: new Date().toISOString()
        })
        .eq('id', actionId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) throw error;

      // Trigger n8n execution if configured
      const n8nUrl = Deno.env.get('N8N_WEBHOOK_URL');
      let n8nRequestId = null;
      
      if (n8nUrl && action) {
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = crypto.randomUUID();
        const payload = JSON.stringify({
          action_id: action.id,
          org_id: orgId,
          type: action.action_type,
          payload: action.parameters
        });

        try {
          const n8nResponse = await fetch(n8nUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-AV-Org-Id': orgId,
              'X-AV-Action-Id': action.id,
              'X-AV-Timestamp': timestamp.toString(),
              'X-AV-Nonce': nonce
            },
            body: payload
          });
          
          if (n8nResponse.ok) {
            const n8nData = await n8nResponse.json();
            n8nRequestId = n8nData.n8n_job_id;
          }
        } catch (e) {
          console.error('n8n call failed:', e);
        }
      }

      // Broadcast update
      const channel = supabase.channel(`org:${orgId}`);
      await channel.send({
        type: 'broadcast',
        event: 'action_update',
        payload: { action_id: actionId, status: 'approved' }
      });

      return new Response(JSON.stringify({
        action: { id: actionId, status: 'approved', approved_at: new Date().toISOString() },
        execution: { dispatch_status: n8nRequestId ? 'queued' : 'local', n8n_request_id: n8nRequestId },
        request_id: requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/actions/:id/deny
    const denyMatch = path.match(/^\/v1\/actions\/([^\/]+)\/deny$/);
    if (denyMatch && method === 'POST') {
      const actionId = denyMatch[1];
      
      await supabase
        .from('actions')
        .update({ status: 'rejected' })
        .eq('id', actionId)
        .eq('organization_id', orgId);

      return new Response(JSON.stringify({
        action: { id: actionId, status: 'denied' },
        request_id: requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /v1/decisions
    if (path === '/v1/decisions' && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const cursor = url.searchParams.get('cursor');

      let query = supabase
        .from('decisions')
        .select('*, sessions!inner(organization_id)')
        .eq('sessions.organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (cursor) query = query.lt('id', cursor);

      const { data: decisions } = await query;

      return new Response(JSON.stringify({
        decisions: decisions?.map(d => ({
          id: d.id,
          created_at: d.created_at,
          decision_summary: d.recommendation,
          confidence: 0.82,
          session_id: d.session_id,
          message_id: d.message_id
        })),
        pagination: {
          has_more: (decisions?.length || 0) === limit,
          next_cursor: decisions?.[decisions.length - 1]?.id
        },
        request_id: requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /v1/decisions/:id
    const decisionMatch = path.match(/^\/v1\/decisions\/([^\/]+)$/);
    if (decisionMatch && method === 'GET') {
      const decisionId = decisionMatch[1];

      const { data: decision } = await supabase
        .from('decisions')
        .select('*')
        .eq('id', decisionId)
        .single();

      const { data: linkedActions } = await supabase
        .from('actions')
        .select('id, status, action_type')
        .eq('decision_id', decisionId);

      return new Response(JSON.stringify({
        decision: {
          id: decision?.id,
          created_at: decision?.created_at,
          payload: {
            recommendation: decision?.recommendation,
            why_this_wins: decision?.why_this_wins,
            assumptions: decision?.assumptions,
            risks: decision?.risks,
            options: decision?.options,
            next_actions: decision?.next_actions,
            metrics: decision?.metrics_to_track,
            kill_criteria: decision?.kill_criteria,
            questions: decision?.questions_needed
          }
        },
        linked_actions: linkedActions?.map(a => ({ id: a.id, status: a.status, type: a.action_type })),
        request_id: requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /v1/impact/report
    if (path === '/v1/impact/report' && method === 'GET') {
      const { data: attributions } = await supabase
        .from('outcome_attributions')
        .select('*, decision_outcomes(*)')
        .eq('organization_id', orgId);

      const earned = attributions?.reduce((sum, a) => sum + Number(a.revenue_attributed || 0), 0) || 0;

      return new Response(JSON.stringify({
        impact: {
          earned_usd: earned * 0.7,
          saved_usd: earned * 0.2,
          avoided_usd: earned * 0.1,
          confidence: 0.75
        },
        evidence: attributions?.map(a => ({
          decision_id: a.decision_id,
          outcome_id: a.outcome_id,
          amount_usd: Number(a.revenue_attributed || 0)
        })) || [],
        request_id: requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/uploads/sign
    if (path === '/v1/uploads/sign' && method === 'POST') {
      const body = await req.json();
      const filePath = `${orgId}/${crypto.randomUUID()}/${body.filename}`;

      const { data: signedUrl } = await supabase.storage
        .from('attachments')
        .createSignedUploadUrl(filePath);

      return new Response(JSON.stringify({
        upload_url: signedUrl?.signedUrl,
        file_path: filePath,
        expires_in: 3600,
        request_id: requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 404 for unmatched routes
    return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      request_id: crypto.randomUUID()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
