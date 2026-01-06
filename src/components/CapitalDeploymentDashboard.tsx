import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DollarSign, TrendingUp, TrendingDown, Shield, Zap,
  Play, Pause, Square, AlertTriangle, CheckCircle2, Clock,
  Target, BarChart3, Rocket, RefreshCw, Eye, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface CapitalContract {
  id: string;
  contract_type: string;
  max_capital: number;
  max_loss: number;
  allowed_categories: string[];
  time_horizon_days: number;
  status: string;
  current_deployed: number;
  current_pnl: number;
  created_at: string;
}

interface Opportunity {
  id: string;
  opportunity_type: string;
  title: string;
  description: string;
  estimated_cost: number;
  estimated_revenue: number;
  estimated_roi_percent: number;
  confidence_score: number;
  best_case: number;
  base_case: number;
  worst_case: number;
  status: string;
  time_to_execute_hours: number;
}

interface Deployment {
  id: string;
  deployment_type: string;
  capital_deployed: number;
  current_value: number;
  realized_pnl: number;
  status: string;
  current_step: number;
  execution_steps: any;
}

export default function CapitalDeploymentDashboard() {
  const [contracts, setContracts] = useState<CapitalContract[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewContract, setShowNewContract] = useState(false);
  const [newContract, setNewContract] = useState({
    type: 'lead_arbitrage',
    maxCapital: 1000,
    maxLoss: 400,
    timeHorizon: 14,
    categories: ['leads', 'services']
  });
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization?.id) fetchData();
  }, [organization?.id]);

  const fetchData = async () => {
    try {
      const [contractsRes, oppsRes, deploymentsRes] = await Promise.all([
        supabase.from('capital_contracts').select('*').eq('organization_id', organization!.id).order('created_at', { ascending: false }),
        supabase.from('arbitrage_opportunities_queue').select('*').eq('organization_id', organization!.id).order('detected_at', { ascending: false }).limit(10),
        supabase.from('capital_deployments').select('*').eq('organization_id', organization!.id).order('created_at', { ascending: false }).limit(10)
      ]);

      setContracts(contractsRes.data || []);
      setOpportunities(oppsRes.data || []);
      setDeployments(deploymentsRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createContract = async () => {
    if (!organization?.id) return;

    try {
      const { error } = await supabase
        .from('capital_contracts')
        .insert({
          organization_id: organization.id,
          contract_type: newContract.type,
          max_capital: newContract.maxCapital,
          max_loss: newContract.maxLoss,
          time_horizon_days: newContract.timeHorizon,
          allowed_categories: newContract.categories,
          status: 'pending_approval'
        });

      if (error) throw error;
      toast.success('Contract created! Review and approve to activate.');
      setShowNewContract(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create contract');
    }
  };

  const approveContract = async (contractId: string) => {
    try {
      const { error } = await supabase
        .from('capital_contracts')
        .update({ 
          status: 'active', 
          approved_at: new Date().toISOString(),
          approved_by: 'user'
        })
        .eq('id', contractId);

      if (error) throw error;
      toast.success('Contract approved! AI will now scan for opportunities.');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve contract');
    }
  };

  const approveOpportunity = async (oppId: string) => {
    try {
      const { error } = await supabase
        .from('arbitrage_opportunities_queue')
        .update({ status: 'approved' })
        .eq('id', oppId);

      if (error) throw error;
      toast.success('Opportunity approved for execution!');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve opportunity');
    }
  };

  const stats = {
    totalDeployed: contracts.filter(c => c.status === 'active').reduce((a, b) => a + b.current_deployed, 0),
    totalPnL: contracts.reduce((a, b) => a + b.current_pnl, 0),
    activeContracts: contracts.filter(c => c.status === 'active').length,
    pendingOpportunities: opportunities.filter(o => o.status === 'ready').length,
    activeDeployments: deployments.filter(d => d.status === 'active').length
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
            🚀 Capital Deployment Engine
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Autonomous economic execution. Deploy capital into short-cycle business operations 
            with deterministic execution and probabilistic outcomes.
          </p>
        </div>
        <Dialog open={showNewContract} onOpenChange={setShowNewContract}>
          <DialogTrigger asChild>
            <Button>
              <DollarSign className="w-4 h-4 mr-2" />
              New Capital Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Capital Deployment Contract</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div>
                <Label>Deployment Type</Label>
                <Select value={newContract.type} onValueChange={v => setNewContract({ ...newContract, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead_arbitrage">Lead Arbitrage</SelectItem>
                    <SelectItem value="service_reselling">Service Reselling</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Multi-Engine)</SelectItem>
                    <SelectItem value="cashflow_optimization">Cashflow Optimization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Maximum Capital: ${newContract.maxCapital.toLocaleString()}</Label>
                <Slider
                  value={[newContract.maxCapital]}
                  onValueChange={([v]) => setNewContract({ ...newContract, maxCapital: v })}
                  min={100}
                  max={50000}
                  step={100}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Maximum Loss (Stop-Loss): ${newContract.maxLoss.toLocaleString()}</Label>
                <Slider
                  value={[newContract.maxLoss]}
                  onValueChange={([v]) => setNewContract({ ...newContract, maxLoss: v })}
                  min={50}
                  max={newContract.maxCapital * 0.5}
                  step={50}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {((newContract.maxLoss / newContract.maxCapital) * 100).toFixed(0)}% of capital
                </p>
              </div>

              <div>
                <Label>Time Horizon: {newContract.timeHorizon} days</Label>
                <Slider
                  value={[newContract.timeHorizon]}
                  onValueChange={([v]) => setNewContract({ ...newContract, timeHorizon: v })}
                  min={7}
                  max={90}
                  step={7}
                  className="mt-2"
                />
              </div>

              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <h4 className="font-medium text-amber-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Important
                </h4>
                <p className="text-sm text-muted-foreground">
                  By creating this contract, you authorize the AI to deploy up to ${newContract.maxCapital.toLocaleString()} 
                  into approved {newContract.type.replace('_', ' ')} opportunities. The AI will automatically 
                  halt if losses exceed ${newContract.maxLoss.toLocaleString()}.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewContract(false)}>Cancel</Button>
                <Button onClick={createContract}>
                  <Shield className="w-4 h-4 mr-2" />
                  Create Contract
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className={cn(
          "bg-gradient-to-br border-2",
          stats.totalPnL >= 0 
            ? "from-green-500/10 to-emerald-500/10 border-green-500/30" 
            : "from-red-500/10 to-orange-500/10 border-red-500/30"
        )}>
          <CardContent className="p-4 text-center">
            {stats.totalPnL >= 0 ? (
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
            ) : (
              <TrendingDown className="w-8 h-8 mx-auto mb-2 text-red-400" />
            )}
            <div className={cn(
              "text-2xl font-bold",
              stats.totalPnL >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total P&L</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold">${stats.totalDeployed.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Deployed Capital</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold">{stats.activeContracts}</div>
            <div className="text-xs text-muted-foreground">Active Contracts</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold">{stats.pendingOpportunities}</div>
            <div className="text-xs text-muted-foreground">Ready Opportunities</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-orange-400" />
            <div className="text-2xl font-bold">{stats.activeDeployments}</div>
            <div className="text-xs text-muted-foreground">Active Deployments</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="contracts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contracts">Capital Contracts</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="deployments">Active Deployments</TabsTrigger>
          <TabsTrigger value="killswitch">Kill Switch</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          {contracts.length === 0 ? (
            <Card className="p-8 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No Capital Contracts</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a capital contract to authorize automated deployment.
              </p>
              <Button onClick={() => setShowNewContract(true)}>
                <DollarSign className="w-4 h-4 mr-2" />
                Create First Contract
              </Button>
            </Card>
          ) : (
            contracts.map((contract) => (
              <Card key={contract.id} className={cn(
                "border-l-4",
                contract.status === 'active' ? "border-l-green-500" :
                contract.status === 'pending_approval' ? "border-l-yellow-500" : "border-l-muted"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-lg capitalize">
                          {contract.contract_type.replace('_', ' ')} Contract
                        </h3>
                        <Badge className={cn(
                          contract.status === 'active' ? "bg-green-500/20 text-green-400" :
                          contract.status === 'pending_approval' ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {contract.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {contract.time_horizon_days} day horizon • Created {new Date(contract.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {contract.status === 'pending_approval' && (
                      <Button onClick={() => approveContract(contract.id)}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve Contract
                      </Button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Max Capital</div>
                      <div className="text-lg font-bold">${contract.max_capital.toLocaleString()}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Max Loss (Stop)</div>
                      <div className="text-lg font-bold text-red-400">${contract.max_loss.toLocaleString()}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Currently Deployed</div>
                      <div className="text-lg font-bold text-blue-400">${contract.current_deployed.toLocaleString()}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Current P&L</div>
                      <div className={cn(
                        "text-lg font-bold",
                        contract.current_pnl >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {contract.current_pnl >= 0 ? '+' : ''}${contract.current_pnl.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {contract.status === 'active' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Capital Utilization</span>
                        <span>{((contract.current_deployed / contract.max_capital) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={(contract.current_deployed / contract.max_capital) * 100} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          {opportunities.length === 0 ? (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No Opportunities Detected</h3>
              <p className="text-sm text-muted-foreground">
                The AI is scanning for arbitrage opportunities. Check back soon.
              </p>
            </Card>
          ) : (
            opportunities.map((opp) => (
              <Card key={opp.id} className={cn(
                "border-l-4",
                opp.status === 'ready' ? "border-l-green-500" :
                opp.status === 'executing' ? "border-l-blue-500" : "border-l-muted"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{opp.title}</h3>
                        <Badge variant="outline" className="capitalize">
                          {opp.opportunity_type.replace('_', ' ')}
                        </Badge>
                        <Badge className={cn(
                          opp.status === 'ready' ? "bg-green-500/20 text-green-400" :
                          opp.status === 'executing' ? "bg-blue-500/20 text-blue-400" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {opp.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{opp.description}</p>
                    </div>
                    {opp.status === 'ready' && (
                      <Button onClick={() => approveOpportunity(opp.id)}>
                        <Rocket className="w-4 h-4 mr-2" />
                        Approve & Execute
                      </Button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-6 gap-3 mb-4">
                    <div className="p-2 rounded bg-muted/50 text-center">
                      <div className="text-xs text-muted-foreground">Cost</div>
                      <div className="font-bold">${opp.estimated_cost?.toLocaleString() || 0}</div>
                    </div>
                    <div className="p-2 rounded bg-muted/50 text-center">
                      <div className="text-xs text-muted-foreground">Revenue</div>
                      <div className="font-bold text-green-400">${opp.estimated_revenue?.toLocaleString() || 0}</div>
                    </div>
                    <div className="p-2 rounded bg-muted/50 text-center">
                      <div className="text-xs text-muted-foreground">ROI</div>
                      <div className="font-bold text-blue-400">{opp.estimated_roi_percent?.toFixed(0) || 0}%</div>
                    </div>
                    <div className="p-2 rounded bg-muted/50 text-center">
                      <div className="text-xs text-muted-foreground">Confidence</div>
                      <div className="font-bold">{opp.confidence_score?.toFixed(0) || 0}%</div>
                    </div>
                    <div className="p-2 rounded bg-muted/50 text-center">
                      <div className="text-xs text-muted-foreground">Time</div>
                      <div className="font-bold">{opp.time_to_execute_hours || 0}h</div>
                    </div>
                    <div className="p-2 rounded bg-muted/50 text-center">
                      <div className="text-xs text-muted-foreground">Worst Case</div>
                      <div className="font-bold text-red-400">${opp.worst_case?.toLocaleString() || 0}</div>
                    </div>
                  </div>

                  {/* Simulation Results */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Outcome Simulation
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Worst Case</div>
                        <div className="text-lg font-bold text-red-400">${opp.worst_case?.toLocaleString() || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Base Case</div>
                        <div className="text-lg font-bold text-yellow-400">${opp.base_case?.toLocaleString() || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Best Case</div>
                        <div className="text-lg font-bold text-green-400">${opp.best_case?.toLocaleString() || 0}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="deployments" className="space-y-4">
          {deployments.length === 0 ? (
            <Card className="p-8 text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No Active Deployments</h3>
              <p className="text-sm text-muted-foreground">
                Approve opportunities to start automated capital deployment.
              </p>
            </Card>
          ) : (
            deployments.map((dep) => (
              <Card key={dep.id} className={cn(
                "border-l-4",
                dep.status === 'active' ? "border-l-blue-500" :
                dep.status === 'completed' ? "border-l-green-500" :
                dep.status === 'halted' ? "border-l-red-500" : "border-l-muted"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium capitalize">{dep.deployment_type.replace('_', ' ')}</h3>
                        <Badge className={cn(
                          dep.status === 'active' ? "bg-blue-500/20 text-blue-400" :
                          dep.status === 'completed' ? "bg-green-500/20 text-green-400" :
                          dep.status === 'halted' ? "bg-red-500/20 text-red-400" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {dep.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {dep.status === 'active' && (
                        <>
                          <Button variant="outline" size="sm">
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                          <Button variant="destructive" size="sm">
                            <Square className="w-4 h-4 mr-1" />
                            Halt
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Deployed</div>
                      <div className="text-lg font-bold">${dep.capital_deployed.toLocaleString()}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Current Value</div>
                      <div className="text-lg font-bold text-blue-400">${dep.current_value.toLocaleString()}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Realized P&L</div>
                      <div className={cn(
                        "text-lg font-bold",
                        dep.realized_pnl >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {dep.realized_pnl >= 0 ? '+' : ''}${dep.realized_pnl.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Execution Step</div>
                      <div className="text-lg font-bold">{dep.current_step}/{(dep.execution_steps as any[])?.length || 0}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="killswitch" className="space-y-4">
          <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Kill Switch System</h3>
                  <p className="text-muted-foreground mb-4">
                    Automatic protection that halts all deployments if critical thresholds are breached.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-background/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">ROI Drop Threshold</span>
                        <span className="font-bold text-red-400">-30%</span>
                      </div>
                      <Progress value={70} className="h-2 [&>div]:bg-green-500" />
                    </div>
                    <div className="p-3 rounded-lg bg-background/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Spend Cap</span>
                        <span className="font-bold">100%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div className="p-3 rounded-lg bg-background/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Quality Score</span>
                        <span className="font-bold text-green-400">85%</span>
                      </div>
                      <Progress value={85} className="h-2 [&>div]:bg-green-500" />
                    </div>
                  </div>
                </div>
                <Button variant="destructive" size="lg">
                  <Square className="w-5 h-5 mr-2" />
                  EMERGENCY HALT ALL
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Kill Switch Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { trigger: 'ROI drops below -30%', action: 'Halt deployment', status: 'armed' },
                  { trigger: 'Spend cap reached', action: 'Pause new executions', status: 'armed' },
                  { trigger: 'Quality score below 50%', action: 'Halt and review', status: 'armed' },
                  { trigger: 'Loss limit reached', action: 'Terminate contract', status: 'armed' },
                  { trigger: 'Time horizon exceeded', action: 'Auto-harvest', status: 'armed' },
                  { trigger: 'External risk spike', action: 'Alert + pause', status: 'armed' }
                ].map((rule, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <div className="font-medium text-sm">{rule.trigger}</div>
                      <div className="text-xs text-muted-foreground">{rule.action}</div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {rule.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
