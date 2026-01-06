import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Target, 
  DollarSign, 
  MessageSquare, 
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  platform: string | null;
  status: string;
  intent_score: number | null;
  source: string;
  last_interaction_at: string | null;
  created_at: string;
}

const PIPELINE_STAGES = [
  { id: 'new', label: 'New', color: 'bg-blue-500', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' },
  { id: 'engaged', label: 'Engaged', color: 'bg-purple-500', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400' },
  { id: 'qualified', label: 'Qualified', color: 'bg-orange-500', bgColor: 'bg-orange-500/20', textColor: 'text-orange-400' },
  { id: 'proposal_sent', label: 'Proposal', color: 'bg-yellow-500', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400' },
  { id: 'closed_won', label: 'Closed', color: 'bg-green-500', bgColor: 'bg-green-500/20', textColor: 'text-green-400' },
];

export function LeadPipelineView() {
  const { organization } = useOrganization();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  useEffect(() => {
    if (organization?.id) {
      fetchLeads();

      const channel = supabase
        .channel('leads-pipeline-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setLeads(prev => [payload.new as Lead, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setLeads(prev => 
                prev.map(l => l.id === (payload.new as Lead).id ? payload.new as Lead : l)
              );
            } else if (payload.eventType === 'DELETE') {
              setLeads(prev => prev.filter(l => l.id !== (payload.old as any).id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [organization?.id]);

  const fetchLeads = async () => {
    if (!organization?.id) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });

    if (data) setLeads(data);
    setLoading(false);
  };

  const moveLeadToStage = async (leadId: string, newStatus: string) => {
    try {
      await supabase
        .from('leads')
        .update({ status: newStatus, last_interaction_at: new Date().toISOString() })
        .eq('id', leadId);
      
      toast.success(`Lead moved to ${PIPELINE_STAGES.find(s => s.id === newStatus)?.label}`);
      fetchLeads();
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };

  const getLeadsByStage = (stageId: string) => leads.filter(l => l.status === stageId);

  const getIntentColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => ['qualified', 'proposal_sent', 'closed_won'].includes(l.status)).length;
  const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;
  const avgIntentScore = leads.length > 0 
    ? Math.round(leads.reduce((sum, l) => sum + (l.intent_score || 0), 0) / leads.length) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Lead Pipeline</h2>
          <p className="text-muted-foreground">Visual pipeline with intent scoring</p>
        </div>
        <Button onClick={fetchLeads} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLeads}</p>
                <p className="text-sm text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{qualifiedLeads}</p>
                <p className="text-sm text-muted-foreground">Qualified</p>
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
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <p className="text-sm text-muted-foreground">Conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Zap className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgIntentScore}%</p>
                <p className="text-sm text-muted-foreground">Avg Intent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Visualization */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {PIPELINE_STAGES.map((stage, idx) => {
          const stageLeads = getLeadsByStage(stage.id);
          const isSelected = selectedStage === stage.id;
          
          return (
            <div key={stage.id} className="flex items-center">
              <Button
                variant={isSelected ? "default" : "outline"}
                className={`min-w-[140px] ${isSelected ? '' : 'border-border'}`}
                onClick={() => setSelectedStage(isSelected ? null : stage.id)}
              >
                <span className={`w-2 h-2 rounded-full ${stage.color} mr-2`} />
                {stage.label}
                <Badge variant="secondary" className="ml-2">
                  {stageLeads.length}
                </Badge>
              </Button>
              {idx < PIPELINE_STAGES.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-5 gap-4">
        {PIPELINE_STAGES.map(stage => {
          const stageLeads = getLeadsByStage(stage.id);
          const isHighlighted = selectedStage === null || selectedStage === stage.id;
          
          return (
            <Card 
              key={stage.id} 
              className={`card-glow transition-opacity ${isHighlighted ? '' : 'opacity-50'}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm flex items-center gap-2 ${stage.textColor}`}>
                  <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                  {stage.label}
                </CardTitle>
                <CardDescription>{stageLeads.length} leads</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    <AnimatePresence>
                      {stageLeads.map((lead, idx) => (
                        <motion.div
                          key={lead.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm truncate">
                              {lead.name || 'Unknown'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {lead.platform || 'N/A'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <span className={getIntentColor(lead.intent_score)}>
                              {lead.intent_score || 0}% intent
                            </span>
                          </div>
                          <Progress value={lead.intent_score || 0} className="h-1 mb-2" />
                          <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            {stage.id !== 'closed_won' && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 text-xs"
                                onClick={() => {
                                  const nextStageIdx = PIPELINE_STAGES.findIndex(s => s.id === stage.id) + 1;
                                  if (nextStageIdx < PIPELINE_STAGES.length) {
                                    moveLeadToStage(lead.id, PIPELINE_STAGES[nextStageIdx].id);
                                  }
                                }}
                              >
                                <ArrowRight className="w-3 h-3 mr-1" />
                                Move
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {stageLeads.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No leads</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
