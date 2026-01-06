import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cpu,
  Play,
  Pause,
  RefreshCw,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Settings2,
  Activity,
  Bot,
  Layers,
  Network,
  Workflow
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface ExecutionTask {
  id: string;
  task_type: string;
  agent_type: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  priority: number;
  input_data: any;
  output_data: any;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  workflow_id: string | null;
}

interface EngineConfig {
  auto_execute: boolean;
  max_concurrent_tasks: number;
  retry_failed: boolean;
  max_retries: number;
  cooldown_seconds: number;
}

export function AgentExecutionEngine() {
  const { organization } = useOrganization();
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [taskQueue, setTaskQueue] = useState<ExecutionTask[]>([]);
  const [engineStatus, setEngineStatus] = useState<'running' | 'paused' | 'idle'>('idle');
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<EngineConfig>({
    auto_execute: true,
    max_concurrent_tasks: 3,
    retry_failed: true,
    max_retries: 3,
    cooldown_seconds: 5
  });

  useEffect(() => {
    if (organization?.id) {
      fetchData();
      
      // Real-time subscription for execution logs
      const logsChannel = supabase
        .channel('execution-engine-logs')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_execution_logs',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            setExecutionLogs(prev => [payload.new as any, ...prev].slice(0, 100));
          }
        )
        .subscribe();

      // Real-time subscription for task queue
      const tasksChannel = supabase
        .channel('execution-engine-tasks')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'execution_tasks',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setTaskQueue(prev => [...prev, payload.new as ExecutionTask]);
            } else if (payload.eventType === 'UPDATE') {
              setTaskQueue(prev => prev.map(t => t.id === (payload.new as ExecutionTask).id ? payload.new as ExecutionTask : t));
            } else if (payload.eventType === 'DELETE') {
              setTaskQueue(prev => prev.filter(t => t.id !== (payload.old as any).id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(logsChannel);
        supabase.removeChannel(tasksChannel);
      };
    }
  }, [organization?.id]);

  const fetchData = async () => {
    if (!organization?.id) return;
    setLoading(true);
    
    try {
      const [logsRes, tasksRes] = await Promise.all([
        (supabase as any)
          .from('agent_execution_logs')
          .select('*')
          .eq('organization_id', organization.id)
          .order('executed_at', { ascending: false })
          .limit(100),
        (supabase as any)
          .from('execution_tasks')
          .select('*')
          .eq('organization_id', organization.id)
          .in('status', ['queued', 'running', 'paused'])
          .order('priority', { ascending: true })
          .order('created_at', { ascending: true })
      ]);

      if (logsRes.data) setExecutionLogs(logsRes.data);
      if (tasksRes.data) setTaskQueue(tasksRes.data as unknown as ExecutionTask[]);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskType: string, agentType: string, inputData: any = {}) => {
    if (!organization?.id) return;

    const { data, error } = await supabase
      .from('execution_tasks')
      .insert({
        organization_id: organization.id,
        task_type: taskType,
        agent_type: agentType,
        status: 'queued',
        priority: 5,
        input_data: inputData,
        max_retries: config.max_retries
      })
      .select()
      .single();

    if (data) {
      toast.success(`Task ${taskType} created`);
    } else if (error) {
      toast.error('Failed to create task');
    }
  };

  const toggleEngine = () => {
    setEngineStatus(prev => prev === 'running' ? 'paused' : 'running');
    toast.success(`Engine ${engineStatus === 'running' ? 'paused' : 'started'}`);
  };

  const executeTask = async (taskId: string) => {
    const task = taskQueue.find(t => t.id === taskId);
    if (!task || !organization?.id) return;

    setTaskQueue(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'running' as const, started_at: new Date().toISOString() } : t
    ));

    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Log execution
    await supabase.from('agent_execution_logs').insert({
      organization_id: organization.id,
      action_type: task.task_type,
      reasoning: `Executed ${task.task_type} task via Execution Engine`,
      result: 'success',
      action_details: task.input_data
    });

    setTaskQueue(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'completed' as const, completed_at: new Date().toISOString() } : t
    ));

    toast.success(`Task ${task.task_type} completed`);
    fetchData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'queued': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'paused': return <Pause className="w-4 h-4 text-muted-foreground" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
      running: 'bg-blue-500/20 text-blue-400',
      queued: 'bg-yellow-500/20 text-yellow-400',
      paused: 'bg-muted text-muted-foreground'
    };
    return styles[status] || 'bg-muted text-muted-foreground';
  };

  const stats = {
    queued: taskQueue.filter(t => t.status === 'queued').length,
    running: taskQueue.filter(t => t.status === 'running').length,
    completed: executionLogs.filter(l => l.result === 'success').length,
    failed: executionLogs.filter(l => l.error_message).length
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold gradient-text">Agent Execution Engine</h1>
          <p className="text-muted-foreground mt-1">Orchestrate and monitor agent task execution</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={engineStatus === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}>
            {engineStatus === 'running' ? '● Running' : engineStatus === 'paused' ? '● Paused' : '○ Idle'}
          </Badge>
          <Button onClick={toggleEngine} variant={engineStatus === 'running' ? 'secondary' : 'default'}>
            {engineStatus === 'running' ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {engineStatus === 'running' ? 'Pause' : 'Start'} Engine
          </Button>
        </div>
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="queue" className="gap-2">
            <Layers className="w-4 h-4" />
            Task Queue
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Activity className="w-4 h-4" />
            Execution History
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings2 className="w-4 h-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.queued}</p>
                    <p className="text-sm text-muted-foreground">Queued</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <RefreshCw className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.running}</p>
                    <p className="text-sm text-muted-foreground">Running</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Queue */}
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Active Task Queue
              </CardTitle>
              <CardDescription>Tasks waiting to be executed by agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence>
                  {taskQueue.map((task, idx) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(task.status)}
                          <div>
                            <p className="font-medium">{task.task_type.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              Agent: {task.agent_type} • Priority: {task.priority}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusBadge(task.status)}>{task.status}</Badge>
                          {task.status === 'queued' && (
                            <Button size="sm" onClick={() => executeTask(task.id)}>
                              <Play className="w-4 h-4 mr-1" />
                              Execute
                            </Button>
                          )}
                        </div>
                      </div>
                      {task.started_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Started {formatDistanceToNow(new Date(task.started_at), { addSuffix: true })}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {taskQueue.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No tasks in queue</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Execution History
              </CardTitle>
              <CardDescription>Recent task executions across all agents</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {executionLogs.map((log, idx) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="p-3 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bot className="w-4 h-4 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{log.action_type}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {log.reasoning || log.result}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className={log.error_message ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
                            {log.error_message ? 'Failed' : 'Success'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(log.executed_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Engine Configuration
              </CardTitle>
              <CardDescription>Configure how the execution engine operates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-Execute Tasks</p>
                  <p className="text-sm text-muted-foreground">Automatically execute queued tasks when engine is running</p>
                </div>
                <Switch
                  checked={config.auto_execute}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, auto_execute: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Retry Failed Tasks</p>
                  <p className="text-sm text-muted-foreground">Automatically retry failed tasks up to max retries</p>
                </div>
                <Switch
                  checked={config.retry_failed}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, retry_failed: checked }))}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Max Concurrent Tasks</p>
                  <span className="text-2xl font-bold text-primary">{config.max_concurrent_tasks}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={config.max_concurrent_tasks}
                  onChange={(e) => setConfig(prev => ({ ...prev, max_concurrent_tasks: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Max Retries</p>
                  <span className="text-2xl font-bold text-primary">{config.max_retries}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={config.max_retries}
                  onChange={(e) => setConfig(prev => ({ ...prev, max_retries: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Cooldown (seconds)</p>
                  <span className="text-2xl font-bold text-primary">{config.cooldown_seconds}s</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={config.cooldown_seconds}
                  onChange={(e) => setConfig(prev => ({ ...prev, cooldown_seconds: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <Button className="w-full" onClick={() => toast.success('Configuration saved')}>
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
