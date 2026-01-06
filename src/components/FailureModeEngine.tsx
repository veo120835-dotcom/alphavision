import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, Shield, Plus, X, CheckCircle2, 
  AlertCircle, TrendingDown, Target, Clock, Zap,
  ChevronDown, ChevronRight, Edit, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface FailureMode {
  id: string;
  category: string;
  title: string;
  description: string;
  likelihood_score: number;
  impact_score: number;
  combined_risk_score: number;
  time_horizon_months: number;
  mitigation_plan: string;
  mitigation_status: string;
  blocks_growth_actions: boolean;
}

const categoryIcons: Record<string, any> = {
  strategic: Target,
  execution: Zap,
  market: TrendingDown,
  founder: AlertCircle,
  capital: AlertTriangle,
  operational: Clock
};

const categoryColors: Record<string, string> = {
  strategic: "text-purple-400",
  execution: "text-blue-400",
  market: "text-orange-400",
  founder: "text-pink-400",
  capital: "text-red-400",
  operational: "text-yellow-400"
};

export default function FailureModeEngine() {
  const [failureModes, setFailureModes] = useState<FailureMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { organization } = useOrganization();

  const [newMode, setNewMode] = useState({
    category: 'strategic',
    title: '',
    description: '',
    likelihood_score: 5,
    impact_score: 5,
    time_horizon_months: 12,
    mitigation_plan: ''
  });

  useEffect(() => {
    if (organization?.id) fetchFailureModes();
  }, [organization?.id]);

  const fetchFailureModes = async () => {
    try {
      const { data, error } = await supabase
        .from('failure_modes')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('combined_risk_score', { ascending: false });
      
      if (error) throw error;
      setFailureModes(data || []);
    } catch (error) {
      console.error('Error fetching failure modes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFailureMode = async () => {
    if (!organization?.id || !newMode.title) return;

    try {
      const { error } = await supabase
        .from('failure_modes')
        .insert({
          organization_id: organization.id,
          ...newMode,
          blocks_growth_actions: newMode.likelihood_score * newMode.impact_score >= 50
        });

      if (error) throw error;
      toast.success('Failure mode added');
      setShowAddModal(false);
      setNewMode({ category: 'strategic', title: '', description: '', likelihood_score: 5, impact_score: 5, time_horizon_months: 12, mitigation_plan: '' });
      fetchFailureModes();
    } catch (error) {
      toast.error('Failed to add failure mode');
    }
  };

  const updateMitigationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('failure_modes')
        .update({ 
          mitigation_status: status,
          mitigated_at: status === 'mitigated' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status updated');
      fetchFailureModes();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: 'CRITICAL', color: 'bg-red-500', textColor: 'text-red-400' };
    if (score >= 50) return { label: 'HIGH', color: 'bg-orange-500', textColor: 'text-orange-400' };
    if (score >= 30) return { label: 'MEDIUM', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
    return { label: 'LOW', color: 'bg-green-500', textColor: 'text-green-400' };
  };

  const criticalCount = failureModes.filter(m => m.combined_risk_score >= 70).length;
  const highCount = failureModes.filter(m => m.combined_risk_score >= 50 && m.combined_risk_score < 70).length;
  const mitigatedCount = failureModes.filter(m => m.mitigation_status === 'mitigated').length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
            🛡️ Failure Mode Elimination
          </h1>
          <p className="text-muted-foreground max-w-xl">
            What will most likely kill this business in the next 6-18 months?
            Eliminate downside before optimizing upside.
          </p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Failure Mode
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Failure Mode</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={newMode.category} onValueChange={v => setNewMode({...newMode, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strategic">Strategic Risk</SelectItem>
                    <SelectItem value="execution">Execution Risk</SelectItem>
                    <SelectItem value="market">Market Risk</SelectItem>
                    <SelectItem value="founder">Founder Risk</SelectItem>
                    <SelectItem value="capital">Capital Risk</SelectItem>
                    <SelectItem value="operational">Operational Entropy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input 
                  placeholder="e.g., High churn rate at scale"
                  value={newMode.title}
                  onChange={e => setNewMode({...newMode, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  placeholder="Describe the failure mode..."
                  value={newMode.description}
                  onChange={e => setNewMode({...newMode, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Likelihood (1-10)</label>
                  <Input 
                    type="number"
                    min={1}
                    max={10}
                    value={newMode.likelihood_score}
                    onChange={e => setNewMode({...newMode, likelihood_score: parseInt(e.target.value) || 5})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Impact (1-10)</label>
                  <Input 
                    type="number"
                    min={1}
                    max={10}
                    value={newMode.impact_score}
                    onChange={e => setNewMode({...newMode, impact_score: parseInt(e.target.value) || 5})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Time Horizon (months)</label>
                <Input 
                  type="number"
                  value={newMode.time_horizon_months}
                  onChange={e => setNewMode({...newMode, time_horizon_months: parseInt(e.target.value) || 12})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mitigation Plan</label>
                <Textarea 
                  placeholder="How will you prevent this?"
                  value={newMode.mitigation_plan}
                  onChange={e => setNewMode({...newMode, mitigation_plan: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button onClick={addFailureMode}>Add Failure Mode</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{criticalCount}</div>
            <div className="text-sm text-muted-foreground">Critical Risks</div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-400">{highCount}</div>
            <div className="text-sm text-muted-foreground">High Risks</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{mitigatedCount}</div>
            <div className="text-sm text-muted-foreground">Mitigated</div>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">{failureModes.length}</div>
            <div className="text-sm text-muted-foreground">Total Tracked</div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alert */}
      {criticalCount > 0 && (
        <Card className="border-red-500/50 bg-gradient-to-r from-red-500/10 to-orange-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-red-400">⚠️ Growth Actions Blocked</h3>
                <p className="text-sm text-muted-foreground">
                  {criticalCount} critical failure mode{criticalCount > 1 ? 's' : ''} must be mitigated before scaling.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failure Modes List */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Failure Mode Registry</h2>
        
        {failureModes.length === 0 ? (
          <Card className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Failure Modes Tracked</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start by identifying what could kill your business in the next 6-18 months.
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Failure Mode
            </Button>
          </Card>
        ) : (
          failureModes.map((mode, index) => {
            const risk = getRiskLevel(mode.combined_risk_score);
            const Icon = categoryIcons[mode.category] || AlertTriangle;
            const isExpanded = expandedId === mode.id;

            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "transition-all duration-200",
                  mode.mitigation_status === 'mitigated' && "opacity-60",
                  mode.blocks_growth_actions && "border-red-500/50"
                )}>
                  <CardContent className="p-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : mode.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg bg-muted", categoryColors[mode.category])}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{mode.title}</h3>
                            {mode.blocks_growth_actions && (
                              <Badge className="bg-red-500/20 text-red-400 text-xs">BLOCKS GROWTH</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">{mode.category} Risk</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={cn("text-lg font-bold", risk.textColor)}>
                            {mode.combined_risk_score}
                          </div>
                          <Badge className={cn("text-xs", risk.color, "text-white")}>
                            {risk.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {mode.likelihood_score} × {mode.impact_score}
                        </div>
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-border"
                        >
                          {mode.description && (
                            <p className="text-sm text-muted-foreground mb-4">{mode.description}</p>
                          )}
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="p-3 rounded-lg bg-muted/50">
                              <div className="text-xs text-muted-foreground mb-1">Time Horizon</div>
                              <div className="font-medium">{mode.time_horizon_months} months</div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <div className="text-xs text-muted-foreground mb-1">Mitigation Status</div>
                              <Select 
                                value={mode.mitigation_status} 
                                onValueChange={v => updateMitigationStatus(mode.id, v)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="mitigated">Mitigated</SelectItem>
                                  <SelectItem value="accepted">Risk Accepted</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {mode.mitigation_plan && (
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                              <div className="text-xs text-green-400 mb-1">Mitigation Plan</div>
                              <p className="text-sm">{mode.mitigation_plan}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
