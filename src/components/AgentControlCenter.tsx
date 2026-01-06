import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Command, 
  Key, 
  BarChart3, 
  Play, 
  Pause, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Save,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Target,
  Activity,
  Loader2,
  Send,
  RefreshCw,
  LayoutDashboard,
  Bot,
  Settings2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { AutonomousActivityFeed } from "./AutonomousActivityFeed";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface Mission {
  id: string;
  goal: string;
  status: 'scouting' | 'drafting' | 'reviewing' | 'closing' | 'completed' | 'paused';
  progress: number;
  agent: string;
  created_at: string;
  result?: string;
}

interface VaultSecret {
  id: string;
  name: string;
  provider: string;
  connected: boolean;
  last_sync?: string;
}

interface RevenueMetric {
  date: string;
  revenue: number;
  followers: number;
  leads: number;
}

export function AgentControlCenter() {
  const { organization } = useOrganization();
  const [activeTab, setActiveTab] = useState<'command' | 'autonomous' | 'vault' | 'ledger'>('command');
  const [runningAgents, setRunningAgents] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [newMissionGoal, setNewMissionGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [secrets, setSecrets] = useState<VaultSecret[]>([
    { id: '1', name: 'OPENAI_API_KEY', provider: 'OpenAI', connected: true, last_sync: new Date().toISOString() },
    { id: '2', name: 'GHL_API_KEY', provider: 'GoHighLevel', connected: false },
    { id: '3', name: 'STRIPE_SECRET_KEY', provider: 'Stripe', connected: true, last_sync: new Date().toISOString() },
    { id: '4', name: 'META_ACCESS_TOKEN', provider: 'Meta', connected: false },
  ]);
  const [metrics, setMetrics] = useState<RevenueMetric[]>([]);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (organization?.id) {
      fetchMissions();
      fetchMetrics();
    }
  }, [organization?.id]);

  const fetchMissions = async () => {
    if (!organization?.id) return;
    
    // Fetch from execution_tasks as missions
    const { data, error } = await (supabase as any)
      .from('execution_tasks')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      const mappedMissions: Mission[] = data.map(task => ({
        id: task.id,
        goal: task.task_type,
        status: mapStatus(task.status),
        progress: task.status === 'completed' ? 100 : task.status === 'running' ? 65 : 30,
        agent: task.agent_type,
        created_at: task.created_at,
        result: task.output_data ? JSON.stringify(task.output_data) : undefined
      }));
      setMissions(mappedMissions);
    }
  };

  const mapStatus = (status: string): Mission['status'] => {
    switch (status) {
      case 'completed': return 'completed';
      case 'running': return 'closing';
      case 'pending': return 'scouting';
      case 'failed': return 'paused';
      default: return 'drafting';
    }
  };

  const fetchMetrics = async () => {
    if (!organization?.id) return;

    const daysAgo = subDays(new Date(), 7);
    
    const { data: revenueData } = await (supabase as any)
      .from('revenue_events')
      .select('created_at, amount')
      .eq('organization_id', organization.id)
      .gte('created_at', daysAgo.toISOString());

    const { data: leadsData } = await (supabase as any)
      .from('leads')
      .select('created_at')
      .eq('organization_id', organization.id)
      .gte('created_at', daysAgo.toISOString());

    // Aggregate by day
    const dailyMetrics: RevenueMetric[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM dd');
      
      const dayRevenue = revenueData?.filter(r => 
        format(new Date(r.created_at), 'MMM dd') === dateStr
      ).reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      
      const dayLeads = leadsData?.filter(l => 
        format(new Date(l.created_at), 'MMM dd') === dateStr
      ).length || 0;

      dailyMetrics.push({
        date: dateStr,
        revenue: dayRevenue,
        followers: Math.floor(Math.random() * 150) + 50, // Simulated follower data
        leads: dayLeads
      });
    }
    
    setMetrics(dailyMetrics);
  };

  const createMission = async () => {
    if (!newMissionGoal.trim() || !organization?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).from('execution_tasks').insert({
        organization_id: organization.id,
        task_type: newMissionGoal,
        agent_type: 'orchestrator',
        status: 'pending',
        priority: 1,
        input_data: { goal: newMissionGoal }
      }).select().single();

      if (error) throw error;

      setMissions(prev => [{
        id: data.id,
        goal: data.task_type,
        status: 'scouting',
        progress: 0,
        agent: 'orchestrator',
        created_at: data.created_at
      }, ...prev]);

      setNewMissionGoal("");
      toast.success("Mission created! Agent swarm activated.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create mission");
    } finally {
      setLoading(false);
    }
  };

  const approveMission = async (missionId: string) => {
    await (supabase as any)
      .from('execution_tasks')
      .update({ status: 'running' })
      .eq('id', missionId);
    
    setMissions(prev => prev.map(m => 
      m.id === missionId ? { ...m, status: 'closing' as const, progress: 80 } : m
    ));
    toast.success("Mission approved and executing!");
  };

  const toggleSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusColor = (status: Mission['status']) => {
    switch (status) {
      case 'scouting': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'drafting': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'reviewing': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'closing': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: Mission['status']) => {
    switch (status) {
      case 'scouting': return <Activity className="w-3 h-3" />;
      case 'drafting': return <Clock className="w-3 h-3" />;
      case 'reviewing': return <Eye className="w-3 h-3" />;
      case 'closing': return <Zap className="w-3 h-3" />;
      case 'completed': return <CheckCircle2 className="w-3 h-3" />;
      case 'paused': return <Pause className="w-3 h-3" />;
    }
  };

  const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0);
  const totalFollowers = metrics.reduce((sum, m) => sum + m.followers, 0);
  const totalLeads = metrics.reduce((sum, m) => sum + m.leads, 0);

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold gradient-text flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8" />
            Agent Control Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Your no-code command hub for the AI swarm
          </p>
        </div>
        <Button onClick={() => { fetchMissions(); fetchMetrics(); }} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tab Navigation - Airtable-style */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit flex-wrap">
        {[
          { id: 'command', label: 'Command Center', icon: Command },
          { id: 'autonomous', label: 'Autonomous Agents', icon: Bot },
          { id: 'vault', label: 'The Vault', icon: Key },
          { id: 'ledger', label: 'Revenue Ledger', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Command Center */}
        {activeTab === 'command' && (
          <motion.div
            key="command"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* New Mission Input */}
            <Card className="card-glow border-primary/30">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Type a goal: 'Find 10 plumbers in NYC who need websites and send intro DMs...'"
                    value={newMissionGoal}
                    onChange={(e) => setNewMissionGoal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createMission()}
                    className="flex-1 h-12 text-lg bg-muted/50 border-border"
                  />
                  <Button 
                    onClick={createMission} 
                    disabled={loading || !newMissionGoal.trim()}
                    className="h-12 px-6"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Launch Mission
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Missions List */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Active Missions
                </CardTitle>
                <CardDescription>Real-time status of your agent swarm tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {missions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Command className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No active missions. Create one above to get started!</p>
                      </div>
                    ) : (
                      missions.map((mission, idx) => (
                        <motion.div
                          key={mission.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{mission.goal}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={getStatusColor(mission.status)}>
                                  {getStatusIcon(mission.status)}
                                  <span className="ml-1 capitalize">{mission.status}</span>
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Agent: {mission.agent}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(mission.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                            {mission.status === 'reviewing' && (
                              <Button 
                                size="sm" 
                                onClick={() => approveMission(mission.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progress</span>
                              <span>{mission.progress}%</span>
                            </div>
                            <Progress value={mission.progress} className="h-2" />
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Autonomous Agents */}
        {activeTab === 'autonomous' && (
          <motion.div
            key="autonomous"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Run Agents Button */}
            <Card className="card-glow border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Run All Autonomous Agents</h3>
                    <p className="text-sm text-muted-foreground">
                      Execute all 7 autonomous agents including failure prevention, competitive intel, and emotional regulation
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={async () => {
                        if (!organization?.id) return;
                        setRunningAgents(true);
                        try {
                          const { data, error } = await supabase.functions.invoke('autonomous-agent-runner', {
                            body: { organizationId: organization.id, generateBrief: true }
                          });
                          if (error) throw error;
                          toast.success(`Agents completed: ${Object.keys(data.results || {}).length} orgs processed. Daily brief generated.`);
                        } catch (err) {
                          console.error(err);
                          toast.error('Failed to run agents');
                        } finally {
                          setRunningAgents(false);
                        }
                      }}
                      disabled={runningAgents}
                      size="lg"
                    >
                      {runningAgents ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Run Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[
                { 
                  name: 'Pricing Enforcer', 
                  description: 'Blocks unauthorized discounts, detects underpricing',
                  icon: DollarSign,
                  color: 'text-green-500 bg-green-500/10'
                },
                { 
                  name: 'Client Filter', 
                  description: 'Auto-rejects low-quality leads, fast-tracks premium',
                  icon: Users,
                  color: 'text-blue-500 bg-blue-500/10'
                },
                { 
                  name: 'Meeting Enforcer', 
                  description: 'Declines low-ROI meetings, protects your time',
                  icon: Clock,
                  color: 'text-purple-500 bg-purple-500/10'
                },
                { 
                  name: 'Waste Detector', 
                  description: 'Finds unused tools, stale workflows, redundant data',
                  icon: Trash2,
                  color: 'text-orange-500 bg-orange-500/10'
                },
                { 
                  name: 'Failure Prevention', 
                  description: 'Blocks risky decisions, enforces sequencing discipline',
                  icon: AlertCircle,
                  color: 'text-red-500 bg-red-500/10'
                },
                { 
                  name: 'Competitive Intel', 
                  description: 'Tracks competitors, protects differentiation & pricing power',
                  icon: Eye,
                  color: 'text-cyan-500 bg-cyan-500/10'
                },
                { 
                  name: 'Emotional Regulator', 
                  description: 'Blocks panic decisions, enforces cooling-off periods',
                  icon: Activity,
                  color: 'text-pink-500 bg-pink-500/10'
                },
              ].map((agent, idx) => (
                <Card key={idx} className="card-glow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${agent.color}`}>
                        <agent.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{agent.name}</h4>
                          <Badge className="bg-green-500/20 text-green-400 text-xs">Active</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{agent.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Activity Feed */}
            <AutonomousActivityFeed />
          </motion.div>
        )}

        {/* The Vault */}
        {activeTab === 'vault' && (
          <motion.div
            key="vault"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  API Keys & Connections
                </CardTitle>
                <CardDescription>
                  Paste your keys once—your agent stays connected forever
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {secrets.map((secret) => (
                    <div
                      key={secret.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          secret.connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                        }`} />
                        <div>
                          <p className="font-medium">{secret.provider}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {showSecrets[secret.id] 
                              ? 'sk-••••••••••••••••••••'
                              : secret.name
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {secret.connected ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                            Not Connected
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSecret(secret.id)}
                        >
                          {showSecrets[secret.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          {secret.connected ? 'Update' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full mt-4 border-dashed">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Integration
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Settings */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Agent Permissions</CardTitle>
                <CardDescription>Control what your agents can do automatically</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Auto-send DMs', description: 'Agent can message leads without approval', enabled: false },
                    { label: 'Auto-post content', description: 'Agent can publish to social media', enabled: true },
                    { label: 'Generate invoices', description: 'Agent can create Stripe payment links', enabled: true },
                    { label: 'Move leads in CRM', description: 'Agent can update lead stages in GHL', enabled: false },
                  ].map((setting, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                      <div>
                        <p className="font-medium">{setting.label}</p>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <Switch defaultChecked={setting.enabled} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Revenue Ledger */}
        {activeTab === 'ledger' && (
          <motion.div
            key="ledger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="card-glow border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-green-500/20">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Revenue (7 days)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glow border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/20">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">+{totalFollowers}</p>
                      <p className="text-sm text-muted-foreground">New Followers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glow border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-purple-500/20">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{totalLeads}</p>
                      <p className="text-sm text-muted-foreground">New Leads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Chart */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Passive Income Tracker
                </CardTitle>
                <CardDescription>Real-time revenue and growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="followersGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        fill="url(#revenueGrad)"
                        strokeWidth={2}
                        name="Revenue ($)"
                      />
                      <Area
                        type="monotone"
                        dataKey="followers"
                        stroke="#3b82f6"
                        fill="url(#followersGrad)"
                        strokeWidth={2}
                        name="Followers"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Today's Highlights */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Today's Agent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'DMs Sent', value: 47, icon: Send },
                    { label: 'Leads Qualified', value: 12, icon: CheckCircle2 },
                    { label: 'Content Posted', value: 3, icon: Zap },
                    { label: 'Invoices Created', value: 5, icon: DollarSign },
                  ].map((stat, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-muted/30 text-center">
                      <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
