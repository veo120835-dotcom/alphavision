import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot,
  DollarSign,
  UserX,
  Calendar,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Filter,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AutonomousAction {
  id: string;
  agent_type: string;
  action_type: string;
  target_entity_type: string | null;
  target_entity_id: string | null;
  decision: string;
  reasoning: string | null;
  confidence_score: number | null;
  value_impact: number | null;
  was_auto_executed: boolean;
  requires_approval: boolean;
  approved_at: string | null;
  executed_at: string | null;
  created_at: string;
}

const agentIcons: Record<string, any> = {
  pricing_enforcer: DollarSign,
  client_filter: UserX,
  meeting_enforcer: Calendar,
  waste_detector: Trash2,
};

const agentColors: Record<string, string> = {
  pricing_enforcer: 'text-green-500 bg-green-500/10',
  client_filter: 'text-blue-500 bg-blue-500/10',
  meeting_enforcer: 'text-purple-500 bg-purple-500/10',
  waste_detector: 'text-orange-500 bg-orange-500/10',
};

export function AutonomousActivityFeed() {
  const { organization } = useOrganization();
  const [actions, setActions] = useState<AutonomousAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchActions();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('autonomous_actions_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'autonomous_actions',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            setActions(prev => [payload.new as AutonomousAction, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [organization?.id]);

  const fetchActions = async () => {
    if (!organization?.id) return;
    setLoading(true);

    let query = (supabase as any)
      .from('agent_execution_logs')
      .select('*')
      .eq('organization_id', organization.id)
      .order('executed_at', { ascending: false })
      .limit(100);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching actions:', error);
      toast.error('Failed to load autonomous actions');
    } else {
      // Map the data to the expected format
      const mappedActions: AutonomousAction[] = (data || []).map((d: any) => ({
        id: d.id,
        agent_type: d.action_type || 'unknown',
        action_type: d.action_type,
        target_entity_type: null,
        target_entity_id: null,
        decision: d.result || 'executed',
        reasoning: d.reasoning,
        confidence_score: null,
        value_impact: null,
        was_auto_executed: true,
        requires_approval: false,
        approved_at: d.executed_at,
        executed_at: d.executed_at,
        created_at: d.executed_at
      }));
      setActions(mappedActions);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActions();
  }, [filter, showPendingOnly]);

  const approveAction = async (actionId: string) => {
    // For execution logs, we just update the local state since they're already executed
    toast.success('Action acknowledged');
    setActions(prev => prev.map(a => 
      a.id === actionId 
        ? { ...a, approved_at: new Date().toISOString() }
        : a
    ));
  };

  const rejectAction = async (actionId: string) => {
    // For execution logs, just remove from local state
    toast.success('Action dismissed');
    setActions(prev => prev.filter(a => a.id !== actionId));
  };

  const getAgentIcon = (agentType: string) => {
    const Icon = agentIcons[agentType] || Bot;
    return Icon;
  };

  const getStatusBadge = (action: AutonomousAction) => {
    if (action.was_auto_executed) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Auto-Executed
        </Badge>
      );
    }
    if (action.requires_approval && !action.approved_at) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse">
          <Clock className="w-3 h-3 mr-1" />
          Pending Approval
        </Badge>
      );
    }
    if (action.approved_at) {
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Flagged
      </Badge>
    );
  };

  const pendingCount = actions.filter(a => a.requires_approval && !a.approved_at).length;

  return (
    <Card className="card-glow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Autonomous Activity Feed
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount} pending
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real-time log of autonomous agent decisions
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Pending only</span>
              <Switch 
                checked={showPendingOnly} 
                onCheckedChange={setShowPendingOnly}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  {filter === 'all' ? 'All Agents' : filter.replace('_', ' ')}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  All Agents
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('pricing_enforcer')}>
                  <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                  Pricing Enforcer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('client_filter')}>
                  <UserX className="w-4 h-4 mr-2 text-blue-500" />
                  Client Filter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('meeting_enforcer')}>
                  <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                  Meeting Enforcer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('waste_detector')}>
                  <Trash2 className="w-4 h-4 mr-2 text-orange-500" />
                  Waste Detector
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchActions}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <AnimatePresence mode="popLayout">
            {actions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No autonomous actions yet</p>
                <p className="text-sm">Actions will appear here as agents make decisions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action, idx) => {
                  const Icon = getAgentIcon(action.agent_type);
                  const colorClass = agentColors[action.agent_type] || 'text-muted-foreground bg-muted';

                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`p-4 rounded-xl border transition-all ${
                        action.requires_approval && !action.approved_at
                          ? 'border-yellow-500/50 bg-yellow-500/5'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-foreground">
                                {action.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {action.agent_type.replace(/_/g, ' ')} • {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            {getStatusBadge(action)}
                          </div>

                          {action.reasoning && (
                            <p className="text-sm mt-2 text-muted-foreground">
                              {action.reasoning}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mt-3">
                            {action.confidence_score !== null && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <TrendingUp className="w-3 h-3" />
                                <span>Confidence: {action.confidence_score}%</span>
                              </div>
                            )}
                            {action.value_impact !== null && action.value_impact > 0 && (
                              <div className="flex items-center gap-1 text-xs text-green-500">
                                <DollarSign className="w-3 h-3" />
                                <span>Impact: ${action.value_impact.toFixed(0)}</span>
                              </div>
                            )}
                          </div>

                          {action.requires_approval && !action.approved_at && (
                            <div className="flex items-center gap-2 mt-3">
                              <Button 
                                size="sm" 
                                onClick={() => approveAction(action.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => rejectAction(action.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
