import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TRACE LOGGER - Agent Reasoning Chain Capture
 * Records the full decision-making process for debugging and optimization
 * 
 * Trace Structure:
 * - TraceID: Unique identifier for the execution
 * - Spans: Individual steps in the reasoning chain
 * - Events: Significant moments (tool calls, decisions, errors)
 * - Metadata: Context, model used, tokens consumed
 */

interface TraceSpan {
  spanId: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed';
  type: 'perception' | 'reasoning' | 'delegation' | 'action' | 'reflexion' | 'tool_call';
  input?: any;
  output?: any;
  metadata?: Record<string, any>;
  error?: string;
  children?: TraceSpan[];
}

interface TraceEvent {
  timestamp: number;
  type: 'info' | 'decision' | 'tool_call' | 'tool_result' | 'error' | 'warning';
  message: string;
  data?: any;
}

interface Trace {
  traceId: string;
  organizationId: string;
  agentType: string;
  status: 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  rootSpan?: TraceSpan;
  events: TraceEvent[];
  metadata: {
    model?: string;
    tokensUsed?: number;
    cost?: number;
    trigger?: string;
    leadId?: string;
  };
}

interface TraceRequest {
  action: 'start' | 'addSpan' | 'addEvent' | 'endSpan' | 'complete' | 'fail' | 'get';
  traceId?: string;
  organizationId: string;
  agentType?: string;
  span?: Partial<TraceSpan>;
  event?: Partial<TraceEvent>;
  metadata?: Record<string, any>;
}

// In-memory trace store (in production, use Redis or similar)
const activeTraces = new Map<string, Trace>();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function findSpanById(span: TraceSpan | undefined, spanId: string): TraceSpan | null {
  if (!span) return null;
  if (span.spanId === spanId) return span;
  
  for (const child of span.children || []) {
    const found = findSpanById(child, spanId);
    if (found) return found;
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: TraceRequest = await req.json();
    const { action, organizationId } = request;
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let trace: Trace | undefined;
    let response: any;

    switch (action) {
      case 'start': {
        const traceId = generateId();
        trace = {
          traceId,
          organizationId,
          agentType: request.agentType || 'unknown',
          status: 'running',
          startTime: Date.now(),
          events: [{
            timestamp: Date.now(),
            type: 'info',
            message: `Trace started for ${request.agentType} agent`
          }],
          metadata: request.metadata || {}
        };
        activeTraces.set(traceId, trace);
        
        console.log(`Trace ${traceId}: Started for ${request.agentType}`);
        response = { traceId, status: 'started' };
        break;
      }

      case 'addSpan': {
        trace = activeTraces.get(request.traceId!);
        if (!trace) {
          throw new Error(`Trace ${request.traceId} not found`);
        }
        
        const spanId = generateId();
        const newSpan: TraceSpan = {
          spanId,
          name: request.span?.name || 'unnamed',
          startTime: Date.now(),
          status: 'running',
          type: request.span?.type || 'reasoning',
          input: request.span?.input,
          metadata: request.span?.metadata,
          children: []
        };
        
        if (!trace.rootSpan) {
          trace.rootSpan = newSpan;
        } else {
          // Add as child of root for now (could support parent reference)
          trace.rootSpan.children = trace.rootSpan.children || [];
          trace.rootSpan.children.push(newSpan);
        }
        
        trace.events.push({
          timestamp: Date.now(),
          type: 'info',
          message: `Span started: ${newSpan.name}`,
          data: { spanId, type: newSpan.type }
        });
        
        console.log(`Trace ${request.traceId}: Span ${spanId} (${newSpan.name}) started`);
        response = { spanId, status: 'created' };
        break;
      }

      case 'addEvent': {
        trace = activeTraces.get(request.traceId!);
        if (!trace) {
          throw new Error(`Trace ${request.traceId} not found`);
        }
        
        const event: TraceEvent = {
          timestamp: Date.now(),
          type: request.event?.type || 'info',
          message: request.event?.message || '',
          data: request.event?.data
        };
        
        trace.events.push(event);
        console.log(`Trace ${request.traceId}: Event - ${event.message}`);
        response = { status: 'added' };
        break;
      }

      case 'endSpan': {
        trace = activeTraces.get(request.traceId!);
        if (!trace) {
          throw new Error(`Trace ${request.traceId} not found`);
        }
        
        const span = findSpanById(trace.rootSpan, request.span?.spanId!);
        if (span) {
          span.endTime = Date.now();
          span.status = request.span?.status === 'failed' ? 'failed' : 'completed';
          span.output = request.span?.output;
          span.error = request.span?.error;
          
          trace.events.push({
            timestamp: Date.now(),
            type: span.status === 'failed' ? 'error' : 'info',
            message: `Span ended: ${span.name} (${span.status})`,
            data: { spanId: span.spanId, duration: span.endTime - span.startTime }
          });
          
          console.log(`Trace ${request.traceId}: Span ${span.spanId} ended (${span.endTime - span.startTime}ms)`);
        }
        response = { status: 'ended' };
        break;
      }

      case 'complete': {
        trace = activeTraces.get(request.traceId!);
        if (!trace) {
          throw new Error(`Trace ${request.traceId} not found`);
        }
        
        trace.status = 'completed';
        trace.endTime = Date.now();
        trace.metadata = { ...trace.metadata, ...request.metadata };
        
        trace.events.push({
          timestamp: Date.now(),
          type: 'info',
          message: 'Trace completed successfully',
          data: { duration: trace.endTime - trace.startTime }
        });
        
        // Persist to database
        await supabase.from('agent_execution_logs').insert({
          organization_id: organizationId,
          action_type: 'trace',
          reasoning: `${trace.agentType} agent execution`,
          action_details: {
            traceId: trace.traceId,
            duration: trace.endTime - trace.startTime,
            spanCount: countSpans(trace.rootSpan),
            eventCount: trace.events.length,
            model: trace.metadata.model,
            tokensUsed: trace.metadata.tokensUsed
          },
          result: 'completed'
        });
        
        console.log(`Trace ${request.traceId}: Completed in ${trace.endTime - trace.startTime}ms`);
        
        // Keep in memory for a bit for retrieval, then clean up
        setTimeout(() => activeTraces.delete(request.traceId!), 300000); // 5 min
        
        response = { 
          status: 'completed', 
          duration: trace.endTime - trace.startTime,
          trace: formatTraceForOutput(trace)
        };
        break;
      }

      case 'fail': {
        trace = activeTraces.get(request.traceId!);
        if (!trace) {
          throw new Error(`Trace ${request.traceId} not found`);
        }
        
        trace.status = 'failed';
        trace.endTime = Date.now();
        
        trace.events.push({
          timestamp: Date.now(),
          type: 'error',
          message: request.event?.message || 'Trace failed',
          data: request.event?.data
        });
        
        // Persist failure
        await supabase.from('agent_execution_logs').insert({
          organization_id: organizationId,
          action_type: 'trace',
          reasoning: `${trace.agentType} agent execution failed`,
          error_message: request.event?.message,
          action_details: {
            traceId: trace.traceId,
            duration: trace.endTime - trace.startTime,
            events: trace.events
          },
          result: 'failed'
        });
        
        console.log(`Trace ${request.traceId}: Failed - ${request.event?.message}`);
        activeTraces.delete(request.traceId!);
        
        response = { status: 'failed' };
        break;
      }

      case 'get': {
        trace = activeTraces.get(request.traceId!);
        if (!trace) {
          // Try to fetch from database
          const { data } = await supabase
            .from('agent_execution_logs')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('action_type', 'trace')
            .order('executed_at', { ascending: false })
            .limit(10);
          
          response = { 
            activeTrace: null, 
            recentTraces: data?.map(d => d.action_details) || []
          };
        } else {
          response = { 
            activeTrace: formatTraceForOutput(trace),
            status: trace.status
          };
        }
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Trace logger error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function countSpans(span: TraceSpan | undefined): number {
  if (!span) return 0;
  let count = 1;
  for (const child of span.children || []) {
    count += countSpans(child);
  }
  return count;
}

function formatTraceForOutput(trace: Trace): any {
  return {
    traceId: trace.traceId,
    agentType: trace.agentType,
    status: trace.status,
    duration: trace.endTime ? trace.endTime - trace.startTime : Date.now() - trace.startTime,
    spans: flattenSpans(trace.rootSpan),
    events: trace.events,
    metadata: trace.metadata
  };
}

function flattenSpans(span: TraceSpan | undefined, result: any[] = []): any[] {
  if (!span) return result;
  
  result.push({
    spanId: span.spanId,
    name: span.name,
    type: span.type,
    status: span.status,
    duration: span.endTime ? span.endTime - span.startTime : null,
    hasOutput: !!span.output,
    error: span.error
  });
  
  for (const child of span.children || []) {
    flattenSpans(child, result);
  }
  
  return result;
}
