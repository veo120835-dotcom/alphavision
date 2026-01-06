import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  MessageSquare,
  DollarSign,
  RefreshCw,
  Play,
  Pause,
  Settings,
  TrendingUp,
  Users,
  Activity,
  Brain,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bot,
  Target,
  ArrowRight,
  Calculator,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { LeadPipelineView } from "./LeadPipelineView";
import { IntentScoringSystem } from "./IntentScoringSystem";
import { DMSequenceAutomation } from "./DMSequenceAutomation";
import { PricingPowerAnalyzer } from "./PricingPowerAnalyzer";
import { ClientQualityOptimizer } from "./ClientQualityOptimizer";
import { TimeToMoneyScore } from "./TimeToMoneyScore";

interface StageMetrics {
  traffic: { posts: number; engagement: number; leads: number };
  engagement: { activeConversations: number; qualified: number; avgResponseTime: string };
  closing: { proposalsSent: number; closed: number; revenue: number };
  maintenance: { followups: number; reactivated: number };
}

interface AgentLog {
  id: string;
  action_type: string;
  action_details: Record<string, unknown>;
  result: string;
  reasoning: string;
  executed_at: string;
}

const stages = [
  {
    id: 'traffic',
    name: 'Traffic Generator',
    icon: TrendingUp,
    description: 'Generate awareness through social content',
    color: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
  },
  {
    id: 'engagement',
    name: 'DM Closer',
    icon: MessageSquare,
    description: 'Qualify leads through intelligent DMs',
    color: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400',
  },
  {
    id: 'closing',
    name: 'Revenue Collector',
    icon: DollarSign,
    description: 'Close deals with payment links',
    color: 'from-green-500/20 to-emerald-500/20',
    iconColor: 'text-green-400',
  },
  {
    id: 'maintenance',
    name: 'CRM Manager',
    icon: RefreshCw,
    description: 'Strategic follow-ups and reactivation',
    color: 'from-orange-500/20 to-yellow-500/20',
    iconColor: 'text-orange-400',
  },
];

export function IncomeAgentView() {
  const { organization } = useOrganization();
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [activeStage, setActiveStage] = useState('traffic');
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [metrics, setMetrics] = useState<StageMetrics>({
    traffic: { posts: 12, engagement: 847, leads: 23 },
    engagement: { activeConversations: 8, qualified: 5, avgResponseTime: '< 2 min' },
    closing: { proposalsSent: 5, closed: 2, revenue: 4800 },
    maintenance: { followups: 15, reactivated: 3 },
  });
  const [leadsPipeline, setLeadsPipeline] = useState<Array<{
    id: string;
    name: string;
    status: string;
    intent_score: number;
    platform: string;
    last_interaction_at: string;
  }>>([]);

  useEffect(() => {
    if (organization?.id) {
      loadData();
    }
  }, [organization?.id]);

  const loadData = async () => {
    if (!organization?.id) return;

    // Load agent logs
    const { data: logs } = await supabase
      .from('agent_execution_logs')
      .select('*')
      .eq('organization_id', organization.id)
      .order('executed_at', { ascending: false })
      .limit(20);

    if (logs) {
      setAgentLogs(logs.map(log => ({
        ...log,
        action_details: (log.action_details || {}) as Record<string, unknown>
      })));
    }

    // Load leads
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (leads) {
      setLeadsPipeline(leads as Array<{
        id: string;
        name: string;
        status: string;
        intent_score: number;
        platform: string;
        last_interaction_at: string;
      }>);
    }

    // Load revenue metrics
    const { data: revenue } = await supabase
      .from('revenue_events')
      .select('amount')
      .eq('organization_id', organization.id)
      .eq('event_type', 'payment_received');

    if (revenue) {
      const totalRevenue = revenue.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      setMetrics(prev => ({
        ...prev,
        closing: { ...prev.closing, revenue: totalRevenue || 4800 }
      }));
    }
  };

  const toggleAgent = () => {
    setIsAgentActive(!isAgentActive);
    toast.success(isAgentActive ? 'Income Agent paused' : 'Income Agent activated');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualified': return 'bg-green-500/20 text-green-400';
      case 'engaged': return 'bg-blue-500/20 text-blue-400';
      case 'proposal_sent': return 'bg-purple-500/20 text-purple-400';
      case 'closed_won': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">Income Agent</h1>
            <p className="text-muted-foreground">Autonomous 4-stage revenue loop</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 glass rounded-full px-4 py-2">
              <span className={cn(
                "w-2 h-2 rounded-full",
                isAgentActive ? "bg-green-400 animate-pulse" : "bg-muted-foreground"
              )} />
              <span className="text-sm font-medium">
                {isAgentActive ? 'Agent Active' : 'Agent Paused'}
              </span>
              <Switch checked={isAgentActive} onCheckedChange={toggleAgent} />
            </div>
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* System Prompt Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-5 border border-primary/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Chief Revenue Officer Mode</h3>
              <p className="text-sm text-muted-foreground">AI Agent with 'Professional Peer' tone</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              <Bot className="w-3 h-3 mr-1" />
              Multi-Step Reasoning
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1 font-mono bg-muted/30 rounded-lg p-3">
            <p><span className="text-primary">GOAL:</span> Maximize net revenue with zero human intervention</p>
            <p><span className="text-orange-400">GUARDRAIL:</span> Up to 10% discount authority without approval</p>
          </div>
        </motion.div>

        {/* 4-Stage Pipeline */}
        <div className="grid grid-cols-4 gap-4">
          {stages.map((stage, index) => (
            <motion.button
              key={stage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setActiveStage(stage.id)}
              className={cn(
                "glass rounded-xl p-4 text-left transition-all duration-200 relative group",
                activeStage === stage.id 
                  ? "ring-2 ring-primary/50 bg-gradient-to-br " + stage.color
                  : "hover:bg-muted/20"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "p-2 rounded-lg bg-gradient-to-br",
                  stage.color
                )}>
                  <stage.icon className={cn("w-5 h-5", stage.iconColor)} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Stage {index + 1}</p>
                  <h4 className="font-semibold text-sm">{stage.name}</h4>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{stage.description}</p>
              
              {index < 3 && (
                <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 text-muted-foreground/50 hidden md:block" />
              )}

              {isAgentActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse block" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Stage Details & Metrics */}
        <div className="grid grid-cols-3 gap-6">
          {/* Stage Metrics */}
          <div className="col-span-2">
            <Tabs value={activeStage} onValueChange={setActiveStage}>
              <TabsList className="glass mb-4">
                {stages.map(stage => (
                  <TabsTrigger key={stage.id} value={stage.id} className="gap-2">
                    <stage.icon className="w-4 h-4" />
                    {stage.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="traffic" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <MetricCard label="Posts Scheduled" value={metrics.traffic.posts} icon={Activity} trend="+5 this week" />
                  <MetricCard label="Total Engagement" value={metrics.traffic.engagement} icon={TrendingUp} trend="+12% vs last week" />
                  <MetricCard label="Leads Generated" value={metrics.traffic.leads} icon={Users} trend="23 in pipeline" />
                </div>
                <div className="glass rounded-xl p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Traffic Actions
                  </h4>
                  <div className="space-y-2">
                    <ActionItem action="Scan industry trends" status="completed" time="Today, 9:00 AM" />
                    <ActionItem action="Generate 3 posts with AI" status="completed" time="Today, 9:15 AM" />
                    <ActionItem action="Schedule posts via GHL" status="completed" time="Today, 9:20 AM" />
                    <ActionItem action="Reply to comments (boost algorithm)" status="in_progress" time="Ongoing" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="engagement" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <MetricCard label="Active Conversations" value={metrics.engagement.activeConversations} icon={MessageSquare} trend="8 active DMs" />
                  <MetricCard label="Qualified Leads" value={metrics.engagement.qualified} icon={Target} trend="62% qualification rate" />
                  <MetricCard label="Avg Response Time" value={metrics.engagement.avgResponseTime} icon={Clock} trend="Under SLA" />
                </div>
                <div className="glass rounded-xl p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    DM Closer Logic
                  </h4>
                  <div className="space-y-2">
                    <ActionItem action="Intent Detection: Friendly → Stay warm" status="info" time="Passive engagement" />
                    <ActionItem action="Intent Detection: Service inquiry → Qualify" status="active" time="Ask budget/needs" />
                    <ActionItem action="Qualified → Offer booking/payment link" status="ready" time="Move to Stage 3" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="closing" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <MetricCard label="Proposals Sent" value={metrics.closing.proposalsSent} icon={ArrowRight} trend="5 this week" />
                  <MetricCard label="Deals Closed" value={metrics.closing.closed} icon={CheckCircle2} trend="40% close rate" />
                  <MetricCard 
                    label="Revenue Collected" 
                    value={`$${metrics.closing.revenue.toLocaleString()}`} 
                    icon={DollarSign} 
                    trend="+$2,400 this week" 
                  />
                </div>
                <div className="glass rounded-xl p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    Revenue Collection Actions
                  </h4>
                  <div className="space-y-2">
                    <ActionItem action="Generate Stripe/GHL payment link" status="completed" time="Auto-generated" />
                    <ActionItem action='Send "Lock in rate" message with urgency' status="active" time="Personalized offer" />
                    <ActionItem action="Follow-up if clicked but didn't pay" status="scheduled" time="After 1 hour" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <MetricCard label="Follow-ups Sent" value={metrics.maintenance.followups} icon={RefreshCw} trend="15 this week" />
                  <MetricCard label="Leads Reactivated" value={metrics.maintenance.reactivated} icon={Users} trend="3 back in pipeline" />
                  <MetricCard label="Stale Leads" value={7} icon={AlertTriangle} trend="Pending strategy" />
                </div>
                <div className="glass rounded-xl p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-orange-400" />
                    CRM Re-Reasoning
                  </h4>
                  <div className="space-y-2">
                    <ActionItem 
                      action='"This lead mentioned busy this week" → Wait until Friday 10 AM' 
                      status="scheduled" 
                      time="Strategic delay" 
                    />
                    <ActionItem 
                      action="Send personalized video follow-up" 
                      status="ready" 
                      time="High-value leads" 
                    />
                    <ActionItem 
                      action="Self-correction: Offer lower-tier lead magnet" 
                      status="info" 
                      time="If rejection detected" 
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Leads Pipeline */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Live Pipeline
            </h3>
            <div className="space-y-3">
              {leadsPipeline.length > 0 ? (
                leadsPipeline.map((lead) => (
                  <div key={lead.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{lead.name || 'Unknown Lead'}</span>
                      <Badge className={cn("text-xs", getStatusColor(lead.status))}>
                        {lead.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{lead.platform || 'Unknown'}</span>
                      <div className="flex items-center gap-2">
                        <span>Intent: {lead.intent_score}%</span>
                        <Progress value={lead.intent_score} className="w-12 h-1" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No leads yet</p>
                  <p className="text-xs">Activate agent to start generating</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agent Execution Logs */}
        <div className="glass rounded-xl p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Agent Execution Log
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {agentLogs.length > 0 ? (
              agentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    log.result === 'success' ? 'bg-green-500/20' : 
                    log.result === 'failed' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                  )}>
                    {log.result === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : log.result === 'failed' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{log.action_type}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.executed_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {log.reasoning && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        💭 {log.reasoning}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No agent activity yet</p>
                <p className="text-xs">Activate the agent to see execution logs</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  icon: Icon, 
  trend 
}: { 
  label: string; 
  value: string | number; 
  icon: typeof Activity;
  trend?: string;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold gradient-text">{value}</p>
      {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
    </div>
  );
}

function ActionItem({ 
  action, 
  status, 
  time 
}: { 
  action: string; 
  status: 'completed' | 'in_progress' | 'scheduled' | 'active' | 'ready' | 'info';
  time: string;
}) {
  const statusConfig = {
    completed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
    in_progress: { icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    scheduled: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    active: { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ready: { icon: ArrowRight, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    info: { icon: Brain, color: 'text-muted-foreground', bg: 'bg-muted' },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className={cn("flex items-center gap-3 p-2 rounded-lg", config.bg)}>
      <StatusIcon className={cn("w-4 h-4", config.color)} />
      <span className="text-sm flex-1">{action}</span>
      <span className="text-xs text-muted-foreground">{time}</span>
    </div>
  );
}
