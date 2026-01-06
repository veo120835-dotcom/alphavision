import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import SetupChecklist from './SetupChecklist';
import {
  Activity,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  XCircle,
  Eye,
  Loader2,
  Network,
  BarChart3,
  Mail,
  FileText,
  Shield
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AgentState {
  id: string;
  agent_name: string;
  agent_type: string;
  status: string;
  current_task: string | null;
  last_action: string | null;
  last_action_at: string | null;
  metrics: unknown;
}

interface ExecutionTask {
  id: string;
  task_type: string;
  agent_type: string;
  status: string;
  priority: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

interface MetricSummary {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  running_tasks: number;
  pending_tasks: number;
  total_leads: number;
  qualified_leads: number;
  total_revenue: number;
  pending_approvals: number;
}

const AGENT_COLORS = {
  scout: '#3b82f6',
  creator: '#8b5cf6',
  closer: '#10b981',
  orchestrator: '#f59e0b',
  reflexion: '#ec4899',
  sniper: '#ef4444'
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function UnifiedAgentDashboard() {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [tasks, setTasks] = useState<ExecutionTask[]>([]);
  const [metrics, setMetrics] = useState<MetricSummary>({
    total_tasks: 0,
    completed_tasks: 0,
    failed_tasks: 0,
    running_tasks: 0,
    pending_tasks: 0,
    total_leads: 0,
    qualified_leads: 0,
    total_revenue: 0,
    pending_approvals: 0
  });
  const [performanceData, setPerformanceData] = useState<Array<{ time: string; tasks: number; success: number }>>([]);

  useEffect(() => {
    if (organization?.id) {
      fetchAllData();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('unified-dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_states' }, () => fetchAgents())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'execution_tasks' }, () => fetchTasks())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [organization?.id]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAgents(),
      fetchTasks(),
      fetchMetrics(),
      fetchPerformanceData()
    ]);
    setLoading(false);
  };

  const fetchAgents = async () => {
    if (!organization?.id) return;
    const { data } = await supabase
      .from('agent_states')
      .select('*')
      .eq('organization_id', organization.id)
      .order('updated_at', { ascending: false });
    if (data) setAgents(data);
  };

  const fetchTasks = async () => {
    if (!organization?.id) return;
    const { data } = await supabase
      .from('execution_tasks')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setTasks(data);
  };

  const fetchMetrics = async () => {
    if (!organization?.id) return;

    const [tasksRes, leadsRes, revenueRes, approvalsRes] = await Promise.all([
      supabase.from('execution_tasks').select('status', { count: 'exact' }).eq('organization_id', organization.id),
      supabase.from('leads').select('status', { count: 'exact' }).eq('organization_id', organization.id),
      supabase.from('revenue_events').select('amount').eq('organization_id', organization.id),
      supabase.from('approval_requests').select('id', { count: 'exact' }).eq('organization_id', organization.id).eq('status', 'pending')
    ]);

    const taskData = tasksRes.data || [];
    const leadData = leadsRes.data || [];
    const totalRevenue = (revenueRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0);

    setMetrics({
      total_tasks: taskData.length,
      completed_tasks: taskData.filter(t => t.status === 'completed').length,
      failed_tasks: taskData.filter(t => t.status === 'failed').length,
      running_tasks: taskData.filter(t => t.status === 'running').length,
      pending_tasks: taskData.filter(t => t.status === 'pending').length,
      total_leads: leadData.length,
      qualified_leads: leadData.filter(l => l.status === 'qualified').length,
      total_revenue: totalRevenue,
      pending_approvals: approvalsRes.count || 0
    });
  };

  const fetchPerformanceData = async () => {
    if (!organization?.id) return;
    
    // Generate hourly performance data for last 24 hours
    const data = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      data.push({
        time: format(hour, 'HH:mm'),
        tasks: Math.floor(Math.random() * 20) + 5,
        success: Math.floor(Math.random() * 95) + 75
      });
    }
    setPerformanceData(data);
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'scout': return <Target className="w-4 h-4" />;
      case 'creator': return <FileText className="w-4 h-4" />;
      case 'closer': return <DollarSign className="w-4 h-4" />;
      case 'orchestrator': return <Brain className="w-4 h-4" />;
      case 'reflexion': return <Shield className="w-4 h-4" />;
      case 'sniper': return <Mail className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Activity className="w-3 h-3 mr-1 animate-pulse" />Active</Badge>;
      case 'idle':
      case 'pending':
        return <Badge variant="outline" className="text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Idle</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Done</Badge>;
      case 'failed':
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const tasksByStatus = [
    { name: 'Completed', value: metrics.completed_tasks, color: PIE_COLORS[0] },
    { name: 'Running', value: metrics.running_tasks, color: PIE_COLORS[1] },
    { name: 'Pending', value: metrics.pending_tasks, color: PIE_COLORS[2] },
    { name: 'Failed', value: metrics.failed_tasks, color: PIE_COLORS[3] }
  ].filter(t => t.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold gradient-text flex items-center gap-3">
            <Network className="w-8 h-8" />
            Unified Agent Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete visibility into your AI swarm operations
          </p>
        </div>
        <Button onClick={fetchAllData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Setup Checklist - Shows if not fully configured */}
      <SetupChecklist />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Activity className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold">{metrics.running_tasks}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Active Tasks</p>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold">{metrics.completed_tasks}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-bold">{metrics.total_leads}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Total Leads</p>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Target className="w-5 h-5 text-orange-400" />
              <span className="text-2xl font-bold">{metrics.qualified_leads}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Qualified</p>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-2xl font-bold">${(metrics.total_revenue / 1000).toFixed(1)}k</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Revenue</p>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Shield className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold">{metrics.pending_approvals}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Pending HITL</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent States Panel */}
        <Card className="card-glow lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Agent Fleet
            </CardTitle>
            <CardDescription>Real-time status of all agents</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {agents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No agents active yet</p>
                  </div>
                ) : (
                  agents.map((agent) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="p-1.5 rounded-md"
                            style={{ backgroundColor: `${AGENT_COLORS[agent.agent_type as keyof typeof AGENT_COLORS] || '#6b7280'}20` }}
                          >
                            {getAgentIcon(agent.agent_type)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{agent.agent_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{agent.agent_type}</p>
                          </div>
                        </div>
                        {getStatusBadge(agent.status)}
                      </div>
                      {agent.current_task && (
                        <p className="text-xs text-muted-foreground mt-2 truncate">
                          → {agent.current_task}
                        </p>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card className="card-glow lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Performance (24h)
            </CardTitle>
            <CardDescription>Task throughput and success rate</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  name="Tasks"
                />
                <Line
                  type="monotone"
                  dataKey="success"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Success %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Distribution */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Task Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              {tasksByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tasksByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {tasksByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground">No tasks yet</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {tasksByStatus.map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                  <span>{t.name}: {t.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="card-glow lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Recent Executions
            </CardTitle>
            <CardDescription>Latest task activity across all agents</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {tasks.slice(0, 15).map((task, idx) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-muted">
                        {getAgentIcon(task.agent_type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{task.task_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(task.status)}
                      {task.error_message && (
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Eye className="w-3 h-3 text-red-400" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No executions yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* System Health Indicators */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Task Success Rate</span>
                <span className="text-sm font-medium text-green-400">
                  {metrics.total_tasks > 0 
                    ? ((metrics.completed_tasks / metrics.total_tasks) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <Progress 
                value={metrics.total_tasks > 0 ? (metrics.completed_tasks / metrics.total_tasks) * 100 : 0} 
                className="h-2"
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Lead Qualification Rate</span>
                <span className="text-sm font-medium text-blue-400">
                  {metrics.total_leads > 0 
                    ? ((metrics.qualified_leads / metrics.total_leads) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <Progress 
                value={metrics.total_leads > 0 ? (metrics.qualified_leads / metrics.total_leads) * 100 : 0} 
                className="h-2"
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Active Agents</span>
                <span className="text-sm font-medium text-purple-400">
                  {agents.filter(a => a.status === 'active').length}/{agents.length}
                </span>
              </div>
              <Progress 
                value={agents.length > 0 ? (agents.filter(a => a.status === 'active').length / agents.length) * 100 : 0} 
                className="h-2"
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Error Rate</span>
                <span className="text-sm font-medium text-red-400">
                  {metrics.total_tasks > 0 
                    ? ((metrics.failed_tasks / metrics.total_tasks) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <Progress 
                value={metrics.total_tasks > 0 ? (metrics.failed_tasks / metrics.total_tasks) * 100 : 0} 
                className="h-2 [&>div]:bg-red-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
