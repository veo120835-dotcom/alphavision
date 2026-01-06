import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PieChart as PieChartIcon,
  Clock,
  DollarSign,
  Eye,
  Zap,
  Target,
  TrendingUp,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useMockStorage, generateMockId } from '@/hooks/useMockStorage';

interface AllocationRule {
  id: string;
  resource_type: string;
  allocation_category: string;
  min_allocation_percent: number | null;
  max_allocation_percent: number | null;
  target_allocation_percent: number | null;
  priority: number;
  rationale: string | null;
  is_active: boolean;
}

interface AllocationSnapshot {
  id: string;
  snapshot_date: string;
  time_allocation: Record<string, number>;
  money_allocation: Record<string, number>;
  attention_allocation: Record<string, number>;
  roi_by_category: Record<string, number>;
  efficiency_score: number | null;
  recommendations: string[];
}

interface AllocationDecision {
  id: string;
  decision_type: string;
  request_description: string;
  requested_amount: number | null;
  resource_type: string;
  category: string;
  ai_recommendation: string | null;
  ai_reasoning: string | null;
  projected_impact: Record<string, number>;
  decision: string;
  decided_by: string | null;
  created_at: string;
  decided_at: string | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const resourceIcons: Record<string, React.ElementType> = {
  time: Clock,
  money: DollarSign,
  attention: Eye,
  energy: Zap
};

export default function CapitalAllocator() {
  const { organization } = useOrganization();
  const [showNewRule, setShowNewRule] = useState(false);
  const [newRule, setNewRule] = useState({
    resource_type: 'time',
    allocation_category: 'revenue_generation',
    target_allocation_percent: 30,
    rationale: ''
  });

  // Use mock storage for non-existent tables
  const { data: rules, addItem: addRule } = useMockStorage<AllocationRule>(`allocation_rules_${organization?.id}`);
  const { data: snapshots } = useMockStorage<AllocationSnapshot>(`allocation_snapshots_${organization?.id}`);
  const { data: decisions, updateItem: updateDecision } = useMockStorage<AllocationDecision>(`allocation_decisions_${organization?.id}`);

  const createRule = () => {
    const rule: AllocationRule = {
      id: generateMockId(),
      resource_type: newRule.resource_type,
      allocation_category: newRule.allocation_category,
      min_allocation_percent: null,
      max_allocation_percent: null,
      target_allocation_percent: newRule.target_allocation_percent,
      priority: rules.length + 1,
      rationale: newRule.rationale || null,
      is_active: true
    };
    addRule(rule);
    setShowNewRule(false);
    setNewRule({ resource_type: 'time', allocation_category: 'revenue_generation', target_allocation_percent: 30, rationale: '' });
    toast.success('Allocation rule created');
  };

  const decideAllocation = (id: string, decision: string) => {
    updateDecision(id, { 
      decision,
      decided_at: new Date().toISOString(),
      decided_by: 'user'
    });
    toast.success('Decision recorded');
  };

  const latestSnapshot = snapshots[0];
  const pendingDecisions = decisions.filter(d => d.decision === 'pending');
  const avgEfficiency = snapshots.length > 0
    ? snapshots.reduce((sum, s) => sum + (s.efficiency_score || 0), 0) / snapshots.length
    : 0;

  const timeAllocation = latestSnapshot?.time_allocation || {};
  const roiByCategory = latestSnapshot?.roi_by_category || {};

  const allocationChartData = Object.entries(timeAllocation).map(([name, value], idx) => ({
    name: name.replace('_', ' '),
    value,
    fill: COLORS[idx % COLORS.length]
  }));

  const roiChartData = Object.entries(roiByCategory).map(([name, value]) => ({
    name: name.replace('_', ' '),
    roi: value
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <PieChartIcon className="h-8 w-8 text-primary" />
            Capital Allocator
          </h1>
          <p className="text-muted-foreground mt-1">
            Govern where time, money, and attention goes
          </p>
        </div>
        <Dialog open={showNewRule} onOpenChange={setShowNewRule}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Allocation Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={newRule.resource_type} onValueChange={v => setNewRule({ ...newRule, resource_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="money">Money</SelectItem>
                  <SelectItem value="attention">Attention</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newRule.allocation_category} onValueChange={v => setNewRule({ ...newRule, allocation_category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue_generation">Revenue Generation</SelectItem>
                  <SelectItem value="skill_building">Skill Building</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
              <div>
                <label className="text-sm text-muted-foreground">Target Allocation: {newRule.target_allocation_percent}%</label>
                <Slider
                  value={[newRule.target_allocation_percent]}
                  onValueChange={([v]) => setNewRule({ ...newRule, target_allocation_percent: v })}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
              <Input
                placeholder="Rationale (optional)"
                value={newRule.rationale}
                onChange={e => setNewRule({ ...newRule, rationale: e.target.value })}
              />
              <Button className="w-full" onClick={createRule}>
                Create Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Decisions</p>
                <p className="text-2xl font-bold text-yellow-500">{pendingDecisions.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency Score</p>
                <p className={`text-2xl font-bold ${avgEfficiency >= 70 ? 'text-green-500' : avgEfficiency >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {avgEfficiency.toFixed(0)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Snapshots</p>
                <p className="text-2xl font-bold">{snapshots.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Time Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {allocationChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={allocationChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {allocationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <PieChartIcon className="h-10 w-10 mx-auto mb-2" />
                  <p>No allocation data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ROI by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ROI by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {roiChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={roiChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="roi" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-10 w-10 mx-auto mb-2" />
                  <p>No ROI data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="decisions">
        <TabsList>
          <TabsTrigger value="decisions">Pending Decisions ({pendingDecisions.length})</TabsTrigger>
          <TabsTrigger value="rules">Allocation Rules</TabsTrigger>
          <TabsTrigger value="history">Decision History</TabsTrigger>
        </TabsList>

        <TabsContent value="decisions" className="space-y-4">
          {pendingDecisions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold">No pending decisions</h3>
                <p className="text-muted-foreground mt-1">All allocation decisions are up to date</p>
              </CardContent>
            </Card>
          ) : (
            pendingDecisions.map(decision => {
              const Icon = resourceIcons[decision.resource_type] || Target;
              return (
                <Card key={decision.id} className="border-yellow-500/30">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                          <Icon className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">{decision.decision_type.replace('_', ' ')}</Badge>
                            <Badge variant="outline">{decision.resource_type}</Badge>
                          </div>
                          <p className="font-medium mt-2">{decision.request_description}</p>
                          {decision.requested_amount && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Requested: {decision.resource_type === 'money' ? `$${decision.requested_amount}` : `${decision.requested_amount}%`}
                            </p>
                          )}

                          {decision.ai_recommendation && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2 text-sm">
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="font-medium">AI Recommendation: {decision.ai_recommendation}</span>
                              </div>
                              {decision.ai_reasoning && (
                                <p className="text-sm text-muted-foreground mt-1">{decision.ai_reasoning}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => decideAllocation(decision.id, 'denied')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Deny
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => decideAllocation(decision.id, 'approved')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          {rules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No allocation rules</h3>
                <p className="text-muted-foreground mt-1">Create rules to govern resource allocation</p>
                <Button className="mt-4" onClick={() => setShowNewRule(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            rules.map(rule => {
              const Icon = resourceIcons[rule.resource_type] || Target;
              return (
                <Card key={rule.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">{rule.resource_type}</Badge>
                            <Badge variant="outline">{rule.allocation_category.replace('_', ' ')}</Badge>
                          </div>
                          <p className="font-medium mt-1">Target: {rule.target_allocation_percent}%</p>
                          {rule.rationale && (
                            <p className="text-sm text-muted-foreground">{rule.rationale}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={rule.is_active ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {decisions.filter(d => d.decision !== 'pending').length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No decision history</h3>
                <p className="text-muted-foreground mt-1">Decisions will appear here after they're made</p>
              </CardContent>
            </Card>
          ) : (
            decisions.filter(d => d.decision !== 'pending').map(decision => (
              <Card key={decision.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{decision.request_description}</p>
                      <p className="text-sm text-muted-foreground">
                        {decision.decided_at ? new Date(decision.decided_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <Badge className={decision.decision === 'approved' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                      {decision.decision}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}