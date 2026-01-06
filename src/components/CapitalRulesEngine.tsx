import { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Settings, Shield, DollarSign, Clock, AlertTriangle, Plus, Trash2, CheckCircle, Lock, Unlock } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  auto_stop_rules: any;
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
  const [contracts, setContracts] = useState<CapitalContract[]>([]);
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewContract, setShowNewContract] = useState(false);
  const [showNewRule, setShowNewRule] = useState(false);
  const { organization } = useOrganization();

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

  useEffect(() => {
    if (organization?.id) fetchData();
  }, [organization?.id]);

  const fetchData = async () => {
    try {
      const [contractsRes, rulesRes] = await Promise.all([
        supabase
          .from('capital_contracts')
          .select('*')
          .eq('organization_id', organization!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('capital_allocation_rules')
          .select('*')
          .eq('organization_id', organization!.id)
          .order('priority', { ascending: true })
      ]);

      if (contractsRes.error) throw contractsRes.error;
      if (rulesRes.error) throw rulesRes.error;

      setContracts(contractsRes.data || []);
      setRules(rulesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createContract = async () => {
    try {
      const { error } = await supabase.from('capital_contracts').insert({
        organization_id: organization!.id,
        contract_type: newContract.contract_type,
        max_capital: newContract.max_capital,
        max_loss: newContract.max_loss,
        time_horizon_days: newContract.time_horizon_days,
        allowed_categories: newContract.allowed_categories,
        auto_stop_rules: newContract.auto_stop_rules,
        status: 'pending_approval'
      });

      if (error) throw error;
      toast.success('Contract created - awaiting approval');
      setShowNewContract(false);
      fetchData();
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Failed to create contract');
    }
  };

  const approveContract = async (id: string) => {
    try {
      const { error } = await supabase
        .from('capital_contracts')
        .update({ 
          status: 'active', 
          approved_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Contract approved');
      fetchData();
    } catch (error) {
      console.error('Error approving contract:', error);
      toast.error('Failed to approve contract');
    }
  };

  const revokeContract = async (id: string) => {
    try {
      const { error } = await supabase
        .from('capital_contracts')
        .update({ status: 'revoked' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Contract revoked');
      fetchData();
    } catch (error) {
      console.error('Error revoking contract:', error);
      toast.error('Failed to revoke contract');
    }
  };

  const createRule = async () => {
    try {
      const { error } = await supabase.from('capital_allocation_rules').insert({
        organization_id: organization!.id,
        ...newRule,
        is_active: true
      });

      if (error) throw error;
      toast.success('Allocation rule created');
      setShowNewRule(false);
      fetchData();
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Failed to create rule');
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('capital_allocation_rules')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('capital_allocation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Rule deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const stats = {
    totalContracts: contracts.length,
    activeContracts: contracts.filter(c => c.status === 'active').length,
    totalCapitalAuthorized: contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + c.max_capital, 0),
    totalDeployed: contracts.reduce((sum, c) => sum + (c.current_deployed || 0), 0),
    activeRules: rules.filter(r => r.is_active).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="innovation">Innovation</SelectItem>
                        <SelectItem value="defense">Defense</SelectItem>
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
                <Button onClick={createRule} className="w-full">
                  Create Rule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No allocation rules defined</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div 
                  key={rule.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Switch 
                      checked={rule.is_active} 
                      onCheckedChange={() => toggleRule(rule.id, rule.is_active)}
                    />
                    <div>
                      <div className="font-medium capitalize">
                        {rule.resource_type}: {rule.allocation_category}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Target: {rule.target_allocation_percent}% | {rule.rationale || 'No rationale'}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
