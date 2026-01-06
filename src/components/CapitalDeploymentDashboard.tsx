import { useState } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, TrendingUp, TrendingDown, Shield, Zap,
  AlertTriangle, CheckCircle2, Clock,
  Target, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useOrganization } from "@/hooks/useOrganization";
import { useMockStorage, generateMockId } from "@/hooks/useMockStorage";

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
}

export default function CapitalDeploymentDashboard() {
  const { organization } = useOrganization();
  const [showNewContract, setShowNewContract] = useState(false);
  const [newContract, setNewContract] = useState({
    type: 'lead_arbitrage',
    maxCapital: 1000,
    maxLoss: 400,
    timeHorizon: 14,
    categories: ['leads', 'services']
  });

  // Use mock storage for non-existent tables
  const { data: contracts, addItem: addContract, updateItem: updateContract } = useMockStorage<CapitalContract>(`capital_contracts_${organization?.id}`);
  const { data: opportunities, updateItem: updateOpportunity } = useMockStorage<Opportunity>(`arbitrage_opportunities_${organization?.id}`);
  const { data: deployments } = useMockStorage<Deployment>(`capital_deployments_${organization?.id}`);

  const createContract = () => {
    if (!organization?.id) return;

    const contract: CapitalContract = {
      id: generateMockId(),
      contract_type: newContract.type,
      max_capital: newContract.maxCapital,
      max_loss: newContract.maxLoss,
      time_horizon_days: newContract.timeHorizon,
      allowed_categories: newContract.categories,
      status: 'pending_approval',
      current_deployed: 0,
      current_pnl: 0,
      created_at: new Date().toISOString()
    };

    addContract(contract);
    toast.success('Contract created! Review and approve to activate.');
    setShowNewContract(false);
  };

  const approveContract = (contractId: string) => {
    updateContract(contractId, { status: 'active' });
    toast.success('Contract approved! AI will now scan for opportunities.');
  };

  const approveOpportunity = (oppId: string) => {
    updateOpportunity(oppId, { status: 'approved' });
    toast.success('Opportunity approved for execution!');
  };

  const stats = {
    totalDeployed: contracts.filter(c => c.status === 'active').reduce((a, b) => a + b.current_deployed, 0),
    totalPnL: contracts.reduce((a, b) => a + b.current_pnl, 0),
    activeContracts: contracts.filter(c => c.status === 'active').length,
    pendingOpportunities: opportunities.filter(o => o.status === 'ready').length,
    activeDeployments: deployments.filter(d => d.status === 'active').length
  };

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
              <Rocket className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No Opportunities Detected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create an active contract to enable opportunity detection.
              </p>
            </Card>
          ) : (
            opportunities.map((opp) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{opp.title}</h3>
                          <Badge variant="outline">{opp.opportunity_type}</Badge>
                          <Badge className={cn(
                            opp.confidence_score >= 80 ? "bg-green-500/20 text-green-400" :
                            opp.confidence_score >= 60 ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                          )}>
                            {opp.confidence_score}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{opp.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span>Cost: ${opp.estimated_cost.toLocaleString()}</span>
                          <span>Revenue: ${opp.estimated_revenue.toLocaleString()}</span>
                          <span className="text-green-400">ROI: {opp.estimated_roi_percent}%</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {opp.time_to_execute_hours}h
                          </span>
                        </div>
                      </div>
                      {opp.status === 'ready' && (
                        <Button onClick={() => approveOpportunity(opp.id)}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="deployments" className="space-y-4">
          {deployments.length === 0 ? (
            <Card className="p-8 text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No Active Deployments</h3>
              <p className="text-sm text-muted-foreground">
                Approve opportunities to start deployments.
              </p>
            </Card>
          ) : (
            deployments.map((dep) => (
              <Card key={dep.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium capitalize">{dep.deployment_type.replace('_', ' ')}</h3>
                      <p className="text-sm text-muted-foreground">
                        Deployed: ${dep.capital_deployed.toLocaleString()} • 
                        Current Value: ${dep.current_value.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "text-lg font-bold",
                        dep.realized_pnl >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {dep.realized_pnl >= 0 ? '+' : ''}${dep.realized_pnl.toLocaleString()}
                      </div>
                      <Badge className={cn(
                        dep.status === 'active' ? "bg-green-500/20 text-green-400" :
                        dep.status === 'completed' ? "bg-blue-500/20 text-blue-400" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {dep.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="killswitch" className="space-y-4">
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <h3 className="font-semibold text-lg mb-2">Emergency Kill Switch</h3>
              <p className="text-muted-foreground mb-4">
                Immediately halt all capital deployments and lock all contracts
              </p>
              <Button variant="destructive" size="lg">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Activate Kill Switch
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}