import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Shield, DollarSign, Plus, Lock, Unlock } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import { useMockStorage, generateMockId } from '@/hooks/useMockStorage';

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
  auto_stop_rules: Record<string, number>;
  approved_at: string | null;
  expires_at: string | null;
}

interface AllocationRule {
  id: string;
  resource_type: string;
  allocation_category: string;
  min_allocation_percent: number;
  max_allocation_percent: number;
  target_allocation_percent: number;
  priority: number;
  is_active: boolean;
  rationale: string;
}

export default function CapitalRulesEngine() {
  const { organization } = useOrganization();
  const [showNewContract, setShowNewContract] = useState(false);
  const [showNewRule, setShowNewRule] = useState(false);

  // Use mock storage for non-existent tables
  const { data: contracts, addItem: addContract, updateItem: updateContract } = useMockStorage<CapitalContract>(`capital_contracts_${organization?.id}`);
  const { data: rules, addItem: addRule, updateItem: updateRule, removeItem: removeRule } = useMockStorage<AllocationRule>(`capital_allocation_rules_${organization?.id}`);

  const [newContract, setNewContract] = useState({
    contract_type: 'lead_arbitrage',
    max_capital: 1000,
    max_loss: 400,
    time_horizon_days: 14,
    allowed_categories: ['leads'],
    auto_stop_rules: {
      stop_on_loss_percent: 40,
      stop_on_consecutive_losses: 3,
      daily_loss_limit: 200
    }
  });

  const [newRule, setNewRule] = useState({
    resource_type: 'capital',
    allocation_category: 'growth',
    min_allocation_percent: 0,
    max_allocation_percent: 100,
    target_allocation_percent: 50,
    priority: 1,
    rationale: ''
  });

  const createContract = () => {
    const contract: CapitalContract = {
      id: generateMockId(),
      contract_type: newContract.contract_type,
      max_capital: newContract.max_capital,
      max_loss: newContract.max_loss,
      time_horizon_days: newContract.time_horizon_days,
      allowed_categories: newContract.allowed_categories,
      auto_stop_rules: newContract.auto_stop_rules,
      status: 'pending_approval',
      current_deployed: 0,
      current_pnl: 0,
      approved_at: null,
      expires_at: null
    };
    addContract(contract);
    toast.success('Contract created - awaiting approval');
    setShowNewContract(false);
  };

  const approveContract = (id: string) => {
    updateContract(id, { 
      status: 'active', 
      approved_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    toast.success('Contract approved');
  };

  const revokeContract = (id: string) => {
    updateContract(id, { status: 'revoked' });
    toast.success('Contract revoked');
  };

  const createRule = () => {
    const rule: AllocationRule = {
      id: generateMockId(),
      resource_type: newRule.resource_type,
      allocation_category: newRule.allocation_category,
      min_allocation_percent: newRule.min_allocation_percent,
      max_allocation_percent: newRule.max_allocation_percent,
      target_allocation_percent: newRule.target_allocation_percent,
      priority: newRule.priority,
      is_active: true,
      rationale: newRule.rationale
    };
    addRule(rule);
    toast.success('Allocation rule created');
    setShowNewRule(false);
  };

  const toggleRule = (id: string, isActive: boolean) => {
    updateRule(id, { is_active: !isActive });
  };

  const deleteRule = (id: string) => {
    removeRule(id);
    toast.success('Rule deleted');
  };

  const stats = {
    totalContracts: contracts.length,
    activeContracts: contracts.filter(c => c.status === 'active').length,
    totalCapitalAuthorized: contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + c.max_capital, 0),
    totalDeployed: contracts.reduce((sum, c) => sum + (c.current_deployed || 0), 0),
    activeRules: rules.filter(r => r.is_active).length
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Capital Rules Engine
          </h1>
          <p className="text-muted-foreground mt-1">
            Define and enforce capital deployment contracts and allocation rules
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.totalContracts}</div>
            <p className="text-sm text-muted-foreground">Total Contracts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.activeContracts}</div>
            <p className="text-sm text-muted-foreground">Active Contracts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">${stats.totalCapitalAuthorized.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Authorized Capital</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-500">${stats.totalDeployed.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Currently Deployed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.activeRules}</div>
            <p className="text-sm text-muted-foreground">Active Rules</p>
          </CardContent>
        </Card>
      </div>

      {/* Capital Contracts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Capital Deployment Contracts
            </CardTitle>
            <CardDescription>
              User-approved limits for automated capital deployment
            </CardDescription>
          </div>
          <Dialog open={showNewContract} onOpenChange={setShowNewContract}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Capital Contract</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Contract Type</Label>
                  <Select 
                    value={newContract.contract_type} 
                    onValueChange={(v) => setNewContract({...newContract, contract_type: v})}
                  >
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Maximum Capital ($)</Label>
                    <Input 
                      type="number" 
                      value={newContract.max_capital}
                      onChange={(e) => setNewContract({...newContract, max_capital: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Maximum Loss ($)</Label>
                    <Input 
                      type="number" 
                      value={newContract.max_loss}
                      onChange={(e) => setNewContract({...newContract, max_loss: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Time Horizon (days)</Label>
                  <Input 
                    type="number" 
                    value={newContract.time_horizon_days}
                    onChange={(e) => setNewContract({...newContract, time_horizon_days: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Auto-Stop: Loss Threshold (%)</Label>
                  <Slider 
                    value={[newContract.auto_stop_rules.stop_on_loss_percent]}
                    onValueChange={([v]) => setNewContract({
                      ...newContract, 
                      auto_stop_rules: {...newContract.auto_stop_rules, stop_on_loss_percent: v}
                    })}
                    max={100}
                    step={5}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Stop if losses exceed {newContract.auto_stop_rules.stop_on_loss_percent}% of capital
                  </p>
                </div>
                <Button onClick={createContract} className="w-full">
                  Create Contract (Pending Approval)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {contracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No capital contracts defined</p>
                <p className="text-sm">Create a contract to enable automated capital deployment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contracts.map((contract) => (
                  <div 
                    key={contract.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {contract.status === 'active' ? (
                        <Unlock className="h-5 w-5 text-green-500" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium capitalize">
                          {contract.contract_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Max: ${contract.max_capital.toLocaleString()} | Loss Limit: ${contract.max_loss.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono text-sm">
                          ${(contract.current_deployed || 0).toLocaleString()} deployed
                        </div>
                        <div className={`text-sm font-mono ${(contract.current_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {(contract.current_pnl || 0) >= 0 ? '+' : ''}${(contract.current_pnl || 0).toLocaleString()} P&L
                        </div>
                      </div>
                      <Badge variant={
                        contract.status === 'active' ? 'default' : 
                        contract.status === 'pending_approval' ? 'secondary' : 'outline'
                      }>
                        {contract.status.replace(/_/g, ' ')}
                      </Badge>
                      {contract.status === 'pending_approval' && (
                        <Button size="sm" onClick={() => approveContract(contract.id)}>
                          Approve
                        </Button>
                      )}
                      {contract.status === 'active' && (
                        <Button size="sm" variant="destructive" onClick={() => revokeContract(contract.id)}>
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Allocation Rules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Allocation Rules
            </CardTitle>
            <CardDescription>
              Define how capital should be allocated across categories
            </CardDescription>
          </div>
          <Dialog open={showNewRule} onOpenChange={setShowNewRule}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Allocation Rule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Resource Type</Label>
                    <Select 
                      value={newRule.resource_type} 
                      onValueChange={(v) => setNewRule({...newRule, resource_type: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="capital">Capital</SelectItem>
                        <SelectItem value="time">Time</SelectItem>
                        <SelectItem value="attention">Attention</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select 
                      value={newRule.allocation_category} 
                      onValueChange={(v) => setNewRule({...newRule, allocation_category: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Target Allocation: {newRule.target_allocation_percent}%</Label>
                  <Slider 
                    value={[newRule.target_allocation_percent]}
                    onValueChange={([v]) => setNewRule({...newRule, target_allocation_percent: v})}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Rationale</Label>
                  <Input 
                    value={newRule.rationale}
                    onChange={(e) => setNewRule({...newRule, rationale: e.target.value})}
                    placeholder="Why this allocation?"
                  />
                </div>
                <Button onClick={createRule} className="w-full">Create Rule</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No allocation rules defined</p>
              <p className="text-sm">Create rules to govern capital allocation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div 
                  key={rule.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium capitalize">
                        {rule.resource_type} → {rule.allocation_category}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Target: {rule.target_allocation_percent}% | {rule.rationale || 'No rationale provided'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={rule.is_active ? 'default' : 'outline'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Switch 
                      checked={rule.is_active} 
                      onCheckedChange={() => toggleRule(rule.id, rule.is_active)}
                    />
                    <Button size="sm" variant="destructive" onClick={() => deleteRule(rule.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}