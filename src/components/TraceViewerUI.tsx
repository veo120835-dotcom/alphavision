import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { 
  Activity, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Cpu,
  Zap,
  Brain,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TraceSpan {
  spanId: string;
  name: string;
  type: string;
  status: string;
  duration: number | null;
  hasOutput: boolean;
  error?: string;
}

interface TraceEvent {
  timestamp: number;
  type: 'info' | 'decision' | 'tool_call' | 'tool_result' | 'error' | 'warning';
  message: string;
  data?: any;
}

interface TraceData {
  traceId: string;
  agentType: string;
  status: string;
  duration: number;
  spans: TraceSpan[];
  events: TraceEvent[];
  metadata: {
    model?: string;
    tokensUsed?: number;
    cost?: number;
    trigger?: string;
  };
}

interface ExecutionLog {
  id: string;
  executed_at: string;
  action_type: string;
  reasoning: string | null;
  action_details: any;
  result: string | null;
  error_message: string | null;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'decision': return Brain;
    case 'tool_call': return Zap;
    case 'tool_result': return CheckCircle2;
    case 'error': return XCircle;
    case 'warning': return AlertTriangle;
    default: return MessageSquare;
  }
};

const getSpanTypeIcon = (type: string) => {
  switch (type) {
    case 'perception': return Activity;
    case 'reasoning': return Brain;
    case 'delegation': return Cpu;
    case 'action': return Zap;
    case 'reflexion': return RefreshCw;
    case 'tool_call': return Zap;
    default: return Activity;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'text-green-500';
    case 'failed': return 'text-red-500';
    case 'running': return 'text-yellow-500';
    default: return 'text-muted-foreground';
  }
};

export function TraceViewerUI() {
  const { organization } = useOrganization();
  const [traces, setTraces] = useState<ExecutionLog[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<ExecutionLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSpans, setExpandedSpans] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (organization?.id) {
      loadTraces();
    }
  }, [organization?.id]);

  const loadTraces = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_execution_logs')
        .select('*')
        .eq('organization_id', organization.id)
        .order('executed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTraces(data || []);
      
      // Auto-select first trace
      if (data && data.length > 0 && !selectedTrace) {
        setSelectedTrace(data[0]);
      }
    } catch (error) {
      console.error('Error loading traces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTraces();
    setRefreshing(false);
  };

  const toggleSpan = (spanId: string) => {
    const newExpanded = new Set(expandedSpans);
    if (newExpanded.has(spanId)) {
      newExpanded.delete(spanId);
    } else {
      newExpanded.add(spanId);
    }
    setExpandedSpans(newExpanded);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (ts: number | string) => {
    const date = new Date(typeof ts === 'number' ? ts : ts);
    return date.toLocaleTimeString();
  };

  const getAgentColor = (type: string) => {
    switch (type) {
      case 'orchestrator': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'closer': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'scout': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'creator': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'trace': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full p-6 flex gap-6">
      {/* Trace List */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Execution Traces
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="px-4 pb-4 space-y-2">
              {traces.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No traces recorded yet</p>
                  <p className="text-sm">Agent executions will appear here</p>
                </div>
              ) : (
                traces.map((trace) => (
                  <motion.button
                    key={trace.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedTrace(trace)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      selectedTrace?.id === trace.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={getAgentColor(trace.action_type)}>
                        {trace.action_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(trace.executed_at)}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">
                      {trace.reasoning || 'No reasoning recorded'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {trace.result === 'completed' || trace.result === 'delegated' || trace.result === 'generated' ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : trace.result === 'failed' ? (
                        <XCircle className="w-3 h-3 text-red-500" />
                      ) : (
                        <Clock className="w-3 h-3 text-yellow-500" />
                      )}
                      <span className="text-xs text-muted-foreground capitalize">
                        {trace.result || 'pending'}
                      </span>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Trace Detail */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Trace Details
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          {selectedTrace ? (
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="px-6 pb-6 space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Agent Type</p>
                    <Badge variant="outline" className={getAgentColor(selectedTrace.action_type)}>
                      {selectedTrace.action_type}
                    </Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {selectedTrace.result === 'completed' || selectedTrace.result === 'delegated' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : selectedTrace.result === 'failed' ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="font-medium capitalize">{selectedTrace.result}</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Executed At</p>
                    <p className="font-medium">
                      {new Date(selectedTrace.executed_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Reasoning */}
                {selectedTrace.reasoning && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Reasoning
                    </h3>
                    <div className="p-4 rounded-lg bg-muted/30 border">
                      <p className="text-sm">{selectedTrace.reasoning}</p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {selectedTrace.error_message && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-500">
                      <XCircle className="w-4 h-4" />
                      Error
                    </h3>
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-red-400">{selectedTrace.error_message}</p>
                    </div>
                  </div>
                )}

                {/* Action Details */}
                {selectedTrace.action_details && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Action Details
                    </h3>
                    <div className="space-y-3">
                      {/* Perception */}
                      {selectedTrace.action_details.perception && (
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors">
                            <Activity className="w-4 h-4 text-blue-400" />
                            <span className="font-medium flex-1 text-left">Perception</span>
                            <ChevronDown className="w-4 h-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 border-x border-b rounded-b-lg bg-muted/20">
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(selectedTrace.action_details.perception, null, 2)}
                              </pre>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Delegation */}
                      {selectedTrace.action_details.delegation && (
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors">
                            <Cpu className="w-4 h-4 text-purple-400" />
                            <span className="font-medium flex-1 text-left">Delegation</span>
                            <Badge variant="outline" className="mr-2">
                              {selectedTrace.action_details.delegation.agent}
                            </Badge>
                            <ChevronDown className="w-4 h-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 border-x border-b rounded-b-lg bg-muted/20">
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(selectedTrace.action_details.delegation, null, 2)}
                              </pre>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Reflexion */}
                      {selectedTrace.action_details.reflexion && (
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors">
                            <RefreshCw className="w-4 h-4 text-cyan-400" />
                            <span className="font-medium flex-1 text-left">Reflexion Loop</span>
                            <Badge variant="outline" className="mr-2">
                              {selectedTrace.action_details.reflexion.iterations} iterations
                            </Badge>
                            <ChevronDown className="w-4 h-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 border-x border-b rounded-b-lg bg-muted/20">
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(selectedTrace.action_details.reflexion, null, 2)}
                              </pre>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Intent (for closer agent) */}
                      {selectedTrace.action_details.intent && (
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Intent:</span>
                            <Badge variant="outline">{selectedTrace.action_details.intent}</Badge>
                          </div>
                          {selectedTrace.action_details.intent_score && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Score:</span>
                              <span className="font-bold text-primary">
                                {selectedTrace.action_details.intent_score}%
                              </span>
                            </div>
                          )}
                          {selectedTrace.action_details.recommended_action && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Action:</span>
                              <Badge>{selectedTrace.action_details.recommended_action}</Badge>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Next State */}
                      {selectedTrace.action_details.next_state && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border">
                          <span className="text-sm text-muted-foreground">Next State:</span>
                          <Badge variant="secondary">
                            {selectedTrace.action_details.next_state}
                          </Badge>
                        </div>
                      )}

                      {/* Trace metadata */}
                      {selectedTrace.action_details.traceId && (
                        <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-muted/30 border">
                          <div>
                            <span className="text-xs text-muted-foreground">Trace ID</span>
                            <p className="text-sm font-mono truncate">{selectedTrace.action_details.traceId}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Duration</span>
                            <p className="text-sm font-medium">{formatDuration(selectedTrace.action_details.duration || 0)}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Spans</span>
                            <p className="text-sm font-medium">{selectedTrace.action_details.spanCount || 0}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Events</span>
                            <p className="text-sm font-medium">{selectedTrace.action_details.eventCount || 0}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw Data */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className="w-4 h-4" />
                    View Raw Data
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-4 rounded-lg bg-muted/30 border">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedTrace, null, 2)}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a trace to view details</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
