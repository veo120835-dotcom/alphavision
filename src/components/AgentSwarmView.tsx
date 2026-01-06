import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Search, 
  Palette, 
  MessageCircle, 
  DollarSign, 
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  Users,
  Target,
  ArrowDownRight,
  Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { DoubleHookStrategy } from "./DoubleHookStrategy";
import { DownsellAutomation } from "./DownsellAutomation";

interface AgentState {
  id: string;
  agent_type: string;
  agent_name: string;
  status: string;
  current_task: string | null;
  last_action: string | null;
  last_action_at: string | null;
  metrics: any;
}

interface AgentConfig {
  id: string;
  name: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  capabilities: string[];
}

const AGENTS: AgentConfig[] = [
  {
    id: 'scout',
    name: 'The Scout',
    type: 'scout',
    icon: Search,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Trend & market intelligence',
    capabilities: ['Trend Discovery', 'Competitor Analysis', 'Market Signals']
  },
  {
    id: 'creator',
    name: 'The Creator',
    type: 'creator',
    icon: Palette,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    description: 'Content generation engine',
    capabilities: ['Script Writing', 'Hook Optimization', 'Multi-Platform Adaptation']
  },
  {
    id: 'socialite',
    name: 'The Socialite',
    type: 'socialite',
    icon: MessageCircle,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    description: 'Engagement & community',
    capabilities: ['Comment Replies', 'DM Outreach', 'Follower Nurturing']
  },
  {
    id: 'closer',
    name: 'The Closer',
    type: 'closer',
    icon: DollarSign,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    description: 'Revenue generation',
    capabilities: ['Lead Qualification', 'Deal Closing', 'Downsell Logic']
  }
];

export function AgentSwarmView() {
  const { organization } = useOrganization();
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      fetchData();
      initializeAgents();

      // Subscribe to real-time agent state changes
      const agentChannel = supabase
        .channel('agent-states-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'agent_states',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            console.log('Agent state update:', payload);
            if (payload.eventType === 'INSERT') {
              setAgentStates(prev => [...prev, payload.new as AgentState]);
            } else if (payload.eventType === 'UPDATE') {
              setAgentStates(prev => 
                prev.map(a => a.id === (payload.new as AgentState).id ? payload.new as AgentState : a)
              );
            } else if (payload.eventType === 'DELETE') {
              setAgentStates(prev => prev.filter(a => a.id !== (payload.old as any).id));
            }
          }
        )
        .subscribe();

      // Subscribe to real-time execution logs
      const logsChannel = supabase
        .channel('execution-logs-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_execution_logs',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            console.log('New execution log:', payload);
            setExecutionLogs(prev => [payload.new as any, ...prev].slice(0, 50));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(agentChannel);
        supabase.removeChannel(logsChannel);
      };
    }
  }, [organization?.id]);

  const fetchData = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const [statesRes, logsRes] = await Promise.all([
        (supabase as any)
          .from('agent_states')
          .select('*')
          .eq('organization_id', organization.id),
        (supabase as any)
          .from('agent_execution_logs')
          .select('*')
          .eq('organization_id', organization.id)
          .order('executed_at', { ascending: false })
          .limit(50)
      ]);

      if (statesRes.data) setAgentStates(statesRes.data as any);
      if (logsRes.data) setExecutionLogs(logsRes.data as any);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeAgents = async () => {
    if (!organization?.id) return;

    // Check if agents exist, if not create them
    const { data: existing } = await (supabase as any)
      .from('agent_states')
      .select('agent_type')
      .eq('organization_id', organization.id);

    const existingTypes = existing?.map((a: any) => a.agent_type) || [];
    const missingAgents = AGENTS.filter(a => !existingTypes.includes(a.type));

    if (missingAgents.length > 0) {
      const newAgents = missingAgents.map(agent => ({
        organization_id: organization.id,
        agent_type: agent.type,
        agent_name: agent.name,
        status: 'idle',
        metrics: { tasks_completed: 0, success_rate: 0 }
      }));

      await (supabase as any).from('agent_states').insert(newAgents);
      fetchData();
    }
  };

  const toggleAgentStatus = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'idle' : 'active';
    
    try {
      await (supabase as any)
        .from('agent_states')
        .update({ status: newStatus })
        .eq('id', agentId);

      setAgentStates(prev => 
        prev.map(a => a.id === agentId ? { ...a, status: newStatus } : a)
      );

      toast.success(`Agent ${newStatus === 'active' ? 'activated' : 'paused'}`);
    } catch (error) {
      console.error('Error toggling agent:', error);
      toast.error('Failed to update agent status');
    }
  };

  const simulateAgentAction = async (agentType: string) => {
    if (!organization?.id) return;

    const actions: Record<string, string[]> = {
      scout: ['Discovered trending topic: AI for Real Estate', 'Analyzed competitor content', 'Found market opportunity'],
      creator: ['Generated 3 content variations', 'Optimized hook for TikTok', 'Created script draft'],
      socialite: ['Replied to 15 comments', 'Sent 5 welcome DMs', 'Engaged with followers'],
      closer: ['Qualified 3 new leads', 'Sent payment link', 'Applied downsell offer']
    };

    const randomAction = actions[agentType]?.[Math.floor(Math.random() * (actions[agentType]?.length || 0))] || 'Performed action';

    try {
      // Log the action
      await (supabase as any).from('agent_execution_logs').insert({
        organization_id: organization.id,
        action_type: agentType,
        reasoning: `Autonomous action by ${agentType} agent`,
        result: randomAction
      });

      // Update agent state
      const agentState = agentStates.find(a => a.agent_type === agentType);
      if (agentState) {
        await (supabase as any)
          .from('agent_states')
          .update({
            last_action: randomAction,
            last_action_at: new Date().toISOString(),
            metrics: {
              ...(agentState.metrics || {}),
              tasks_completed: ((agentState.metrics as any)?.tasks_completed || 0) + 1
            }
          })
          .eq('id', agentState.id);
      }

      fetchData();
      toast.success(randomAction);
    } catch (error) {
      console.error('Error simulating action:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { color: 'bg-green-500/20 text-green-400', label: 'Active' };
      case 'idle': return { color: 'bg-yellow-500/20 text-yellow-400', label: 'Idle' };
      case 'error': return { color: 'bg-red-500/20 text-red-400', label: 'Error' };
      default: return { color: 'bg-muted text-muted-foreground', label: status };
    }
  };

  const activeAgents = agentStates.filter(a => a.status === 'active').length;
  const totalActions = executionLogs.length;

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold gradient-text">Agent Swarm</h1>
          <p className="text-muted-foreground mt-1">Multi-agent orchestration dashboard</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-2">
            <Bot className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="double-hook" className="gap-2">
            <Heart className="w-4 h-4" />
            Double Hook
          </TabsTrigger>
          <TabsTrigger value="downsell" className="gap-2">
            <ArrowDownRight className="w-4 h-4" />
            Downsell Logic
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAgents}/{AGENTS.length}</p>
                <p className="text-sm text-muted-foreground">Active Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalActions}</p>
                <p className="text-sm text-muted-foreground">Total Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">92%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Target className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">Hub & Spoke</p>
                <p className="text-sm text-muted-foreground">Architecture</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {AGENTS.map((agent, idx) => {
          const Icon = agent.icon;
          const state = agentStates.find(s => s.agent_type === agent.type);
          const status = state?.status || 'idle';
          const statusBadge = getStatusBadge(status);

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="card-glow h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${agent.bgColor}`}>
                      <Icon className={`w-6 h-6 ${agent.color}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(status)} animate-pulse`} />
                      <Badge className={statusBadge.color} variant="secondary">
                        {statusBadge.label}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-3">{agent.name}</CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Capabilities */}
                  <div className="space-y-1">
                    {agent.capabilities.map(cap => (
                      <div key={cap} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                        <span className="text-muted-foreground">{cap}</span>
                      </div>
                    ))}
                  </div>

                  {/* Last Action */}
                  {state?.last_action && (
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Last Action</p>
                      <p className="text-sm truncate">{state.last_action}</p>
                      {state.last_action_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(state.last_action_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={status === 'active' ? 'secondary' : 'default'}
                      className="flex-1"
                      onClick={() => state && toggleAgentStatus(state.id, status)}
                    >
                      {status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => simulateAgentAction(agent.type)}
                    >
                      <Zap className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Activity Log */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Activity Feed
          </CardTitle>
        <CardDescription>
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live updates enabled
          </span>
        </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              <AnimatePresence>
                {executionLogs.map((log, idx) => {
                  const agent = AGENTS.find(a => a.type === log.action_type);
                  const Icon = agent?.icon || Bot;

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <div className={`p-2 rounded-lg ${agent?.bgColor || 'bg-muted'}`}>
                        <Icon className={`w-4 h-4 ${agent?.color || 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{agent?.name || log.action_type}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.executed_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{log.result}</p>
                        {log.reasoning && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{log.reasoning}</p>
                        )}
                      </div>
                      {log.error_message ? (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {executionLogs.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No agent activity yet</p>
                  <p className="text-sm">Start agents to see activity here</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="double-hook">
          <DoubleHookStrategy />
        </TabsContent>

        <TabsContent value="downsell">
          <DownsellAutomation />
        </TabsContent>
      </Tabs>
    </div>
  );
}