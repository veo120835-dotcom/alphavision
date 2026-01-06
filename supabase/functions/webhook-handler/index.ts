import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { executeTool, getToolDefinitions, corsHeaders } from "../_shared/tools.ts";

interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  organization_id?: string;
  timestamp?: string;
  // n8n specific fields
  source?: 'n8n' | 'zapier' | 'external';
  callback_url?: string;
  tool_request?: {
    tool_name: string;
    parameters: Record<string, unknown>;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');

    // Optional: Verify webhook secret for security
    const providedSecret = req.headers.get('x-webhook-secret');
    if (webhookSecret && providedSecret !== webhookSecret) {
      console.error('Invalid webhook secret provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: WebhookPayload = await req.json();

    console.log('Received webhook:', JSON.stringify(payload, null, 2));

    const { event, data, organization_id } = payload;

    // Route events to appropriate handlers
    switch (event) {
      // ============ LEAD EVENTS ============
      case 'lead.created':
      case 'lead.new': {
        console.log('Processing new lead:', data);
        if (organization_id) {
          const { error } = await supabase.from('leads').insert({
            organization_id,
            name: data.name as string,
            email: data.email as string,
            phone: data.phone as string,
            source: (data.source as string) || 'webhook',
            platform: (data.platform as string) || 'external',
            external_id: data.external_id as string,
            status: 'new',
            intent_score: (data.intent_score as number) || 0,
          });
          if (error) console.error('Error creating lead:', error);
        }
        break;
      }

      case 'lead.updated': {
        console.log('Processing lead update:', data);
        if (data.id) {
          const { error } = await supabase
            .from('leads')
            .update({
              status: data.status as string,
              intent_score: data.intent_score as number,
              notes: data.notes as string,
            })
            .eq('id', data.id);
          if (error) console.error('Error updating lead:', error);
        }
        break;
      }

      case 'lead.qualified': {
        console.log('Lead qualified:', data);
        if (organization_id && data.lead_id) {
          // Create approval request for qualified leads
          const { error } = await supabase.from('approval_requests').insert({
            organization_id,
            lead_id: data.lead_id as string,
            title: `Qualified Lead: ${data.name || 'Unknown'}`,
            description: data.qualification_reason as string,
            request_type: 'lead_qualification',
            status: 'pending',
            agent_recommendation: 'Proceed with outreach sequence',
          });
          if (error) console.error('Error creating approval:', error);
        }
        break;
      }

      // ============ REVENUE EVENTS ============
      case 'payment.received':
      case 'revenue.new': {
        console.log('Processing payment:', data);
        if (organization_id) {
          const { error } = await supabase.from('revenue_events').insert({
            organization_id,
            event_type: 'payment',
            amount: data.amount as number,
            currency: (data.currency as string) || 'USD',
            payment_provider: (data.provider as string) || 'wise',
            external_transaction_id: data.transaction_id as string,
            lead_id: data.lead_id as string,
            metadata: data,
          });
          if (error) console.error('Error recording revenue:', error);
        }
        break;
      }

      case 'payment.refunded': {
        console.log('Processing refund:', data);
        if (organization_id) {
          const { error } = await supabase.from('revenue_events').insert({
            organization_id,
            event_type: 'refund',
            amount: -(data.amount as number),
            currency: (data.currency as string) || 'USD',
            payment_provider: (data.provider as string) || 'wise',
            external_transaction_id: data.transaction_id as string,
            metadata: data,
          });
          if (error) console.error('Error recording refund:', error);
        }
        break;
      }

      // ============ CONTENT EVENTS ============
      case 'content.published': {
        console.log('Content published:', data);
        if (organization_id) {
          const { error } = await supabase.from('content_posts').insert({
            organization_id,
            platform: (data.platform as string) || 'unknown',
            post_type: (data.type as string) || 'video',
            content_url: data.url as string,
            hook_text: data.hook as string,
            status: 'published',
            posted_at: new Date().toISOString(),
          });
          if (error) console.error('Error recording content:', error);
        }
        break;
      }

      case 'content.metrics': {
        console.log('Content metrics update:', data);
        if (data.post_id) {
          const { error } = await supabase
            .from('content_posts')
            .update({
              views: data.views as number,
              likes: data.likes as number,
              comments: data.comments as number,
              shares: data.shares as number,
              saves: data.saves as number,
            })
            .eq('id', data.post_id);
          if (error) console.error('Error updating metrics:', error);
        }
        break;
      }

      // ============ SOCIAL EVENTS ============
      case 'dm.received': {
        console.log('DM received:', data);
        if (organization_id) {
          // Log execution for AI to process
          const { error } = await supabase.from('agent_execution_logs').insert({
            organization_id,
            action_type: 'dm_received',
            action_details: data,
            reasoning: 'Incoming DM from external platform',
            lead_id: data.lead_id as string,
          });
          if (error) console.error('Error logging DM:', error);
        }
        break;
      }

      case 'comment.received': {
        console.log('Comment received:', data);
        if (organization_id) {
          const { error } = await supabase.from('agent_execution_logs').insert({
            organization_id,
            action_type: 'comment_received',
            action_details: data,
            reasoning: 'Incoming comment for fast reply',
          });
          if (error) console.error('Error logging comment:', error);
        }
        break;
      }

      case 'follower.new': {
        console.log('New follower:', data);
        if (organization_id) {
          // Trigger double hook strategy
          const { error } = await supabase.from('agent_execution_logs').insert({
            organization_id,
            action_type: 'new_follower_hook',
            action_details: data,
            reasoning: 'Trigger Double Hook Strategy for new follower',
          });
          if (error) console.error('Error logging follower:', error);
        }
        break;
      }

      // ============ TREND EVENTS ============
      case 'trend.detected': {
        console.log('Trend detected:', data);
        if (organization_id) {
          const { error } = await supabase.from('trend_topics').insert({
            organization_id,
            topic: data.topic as string,
            source: (data.source as string) || 'webhook',
            relevance_score: (data.relevance as number) || 0.5,
            metadata: data,
            status: 'new',
          });
          if (error) console.error('Error recording trend:', error);
        }
        break;
      }

      // ============ AGENT CONTROL EVENTS ============
      case 'agent.trigger': {
        console.log('Agent trigger:', data);
        if (organization_id && data.agent_name) {
          const { error } = await supabase
            .from('agent_states')
            .update({
              status: 'active',
              current_task: data.task as string,
              last_action_at: new Date().toISOString(),
            })
            .eq('organization_id', organization_id)
            .eq('agent_name', data.agent_name);
          if (error) console.error('Error triggering agent:', error);
        }
        break;
      }

      // ============ APPROVAL EVENTS ============
      case 'approval.decision': {
        console.log('Approval decision:', data);
        if (data.request_id) {
          const { error } = await supabase
            .from('approval_requests')
            .update({
              status: data.approved ? 'approved' : 'rejected',
              decision: data.approved ? 'approved' : 'rejected',
              decision_notes: data.notes as string,
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', data.request_id);
          if (error) console.error('Error updating approval:', error);
        }
        break;
      }

      // ============ CALENDAR/BOOKING EVENTS ============
      case 'booking.created': {
        console.log('Booking created:', data);
        if (organization_id) {
          const { error } = await supabase.from('agent_execution_logs').insert({
            organization_id,
            action_type: 'booking_created',
            action_details: data,
            reasoning: 'New booking from calendar integration',
            lead_id: data.lead_id as string,
          });
          if (error) console.error('Error logging booking:', error);
        }
        break;
      }

      // ============ N8N BIDIRECTIONAL EVENTS ============
      case 'n8n.tool_request': {
        // n8n requests a tool execution from the agent
        console.log('n8n tool request:', data);
        if (payload.tool_request) {
          const { tool_name, parameters } = payload.tool_request;
          const result = await executeTool(tool_name, parameters);
          
          // Log the execution
          if (organization_id) {
            await supabase.from('agent_execution_logs').insert({
              organization_id,
              action_type: 'n8n_tool_execution',
              action_details: { tool_name, parameters, result },
              reasoning: `n8n requested tool: ${tool_name}`,
            });
          }

          // If callback URL provided, send result back to n8n
          if (payload.callback_url) {
            await fetch(payload.callback_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ success: true, result: JSON.parse(result) }),
            });
          }

          return new Response(
            JSON.stringify({ success: true, result: JSON.parse(result) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      case 'n8n.get_tools': {
        // n8n requests available tools list
        console.log('n8n requesting tool definitions');
        const tools = getToolDefinitions();
        return new Response(
          JSON.stringify({ success: true, tools }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'n8n.sync_lead': {
        // Bidirectional lead sync from n8n/GHL
        console.log('n8n lead sync:', data);
        if (organization_id && data.external_id) {
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('external_id', data.external_id)
            .eq('organization_id', organization_id)
            .single();

          if (existingLead) {
            await supabase.from('leads').update({
              name: data.name as string,
              email: data.email as string,
              phone: data.phone as string,
              status: data.status as string,
              intent_score: data.intent_score as number,
              notes: data.notes as string,
            }).eq('id', existingLead.id);
          } else {
            await supabase.from('leads').insert({
              organization_id,
              external_id: data.external_id as string,
              name: data.name as string,
              email: data.email as string,
              phone: data.phone as string,
              source: 'n8n_sync',
              platform: data.platform as string || 'ghl',
              status: data.status as string || 'new',
            });
          }
        }
        break;
      }

      case 'n8n.trigger_orchestrator': {
        // n8n triggers the swarm orchestrator
        console.log('n8n triggering orchestrator:', data);
        if (organization_id) {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const orchestratorResponse = await fetch(
            `${supabaseUrl}/functions/v1/swarm-orchestrator`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                organizationId: organization_id,
                trigger: data.trigger || 'n8n_webhook',
                currentState: data.current_state || 'IDLE',
                dryRun: data.dry_run || false,
              }),
            }
          );
          
          const orchestratorResult = await orchestratorResponse.json();
          
          // Send result back to n8n callback if provided
          if (payload.callback_url) {
            await fetch(payload.callback_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orchestratorResult),
            });
          }

          return new Response(
            JSON.stringify({ success: true, orchestrator_result: orchestratorResult }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      // ============ DEFAULT HANDLER ============
      default: {
        console.log(`Unhandled event type: ${event}`, data);
        // Store unknown events for review
        if (organization_id) {
          await supabase.from('agent_execution_logs').insert({
            organization_id,
            action_type: 'webhook_received',
            action_details: { event, data },
            reasoning: `Received unhandled webhook event: ${event}`,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        event,
        message: `Event ${event} processed successfully`,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
