import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  TrendingUp, 
  Activity, 
  Zap, 
  AlertTriangle,
  Play,
  DollarSign,
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMockStorage, generateMockId, generateMockTimestamp } from '@/hooks/useMockStorage';

interface DigitalTwin {
  id: string;
  snapshot_date: string;
  revenue_streams: Array<{name: string; mrr: number; growth_rate: number}>;
  demand_metrics: Record<string, number>;
  capacity_metrics: Record<string, number>;
  pricing_metrics: Record<string, number>;
  burn_metrics: Record<string, number>;
  risk_factors: Array<{risk: string; probability: number; impact: string}>;
  health_score: number;
}

interface Simulation {
  id: string;
  simulation_name: string;
  scenario_type: string;
  strategy_changes: Record<string, unknown>;
  projected_outcomes: {
    revenue_3m?: number;
    revenue_6m?: number;
    revenue_12m?: number;
    margin?: number;
    runway_months?: number;
  };
  probability_score: number;
  recommended: boolean;
  simulated_at: string;
}

export default function EconomicDigitalTwin() {
  const { organization } = useOrganization();
  const twinsKey = `digital_twins_${organization?.id || 'default'}`;
  const simsKey = `simulations_${organization?.id || 'default'}`;
  
  const { data: twins, addItem: addTwin } = useMockStorage<DigitalTwin>(twinsKey, []);
  const { data: simulations, addItem: addSimulation } = useMockStorage<Simulation>(simsKey, []);
  
  const [showSimulation, setShowSimulation] = useState(false);
  const [newSimulation, setNewSimulation] = useState({
    simulation_name: '',
    scenario_type: 'base_case',
    strategy_changes: {}
  });

  const generateProjectedOutcomes = (type: string) => {
    const multiplier = type === 'optimistic' ? 1.3 : type === 'pessimistic' ? 0.7 : 1.0;
    return {
      revenue_3m: 50000 * multiplier,
      revenue_6m: 120000 * multiplier,
      revenue_12m: 280000 * multiplier,
      margin: 0.4 * multiplier,
      runway_months: 12 * multiplier
    };
  };

  const createSimulation = () => {
    if (!newSimulation.simulation_name) {
      toast.error('Please enter a simulation name');
      return;
    }

    const simulation: Simulation = {
      id: generateMockId(),
      simulation_name: newSimulation.simulation_name,
      scenario_type: newSimulation.scenario_type,
      strategy_changes: newSimulation.strategy_changes,
      projected_outcomes: generateProjectedOutcomes(newSimulation.scenario_type),
      probability_score: newSimulation.scenario_type === 'base_case' ? 70 : 
                        newSimulation.scenario_type === 'optimistic' ? 40 : 60,
      recommended: newSimulation.scenario_type === 'base_case',
      simulated_at: generateMockTimestamp()
    };

    addSimulation(simulation);
    setShowSimulation(false);
    setNewSimulation({ simulation_name: '', scenario_type: 'base_case', strategy_changes: {} });
    toast.success('Simulation created');
  };

  const generateSampleTwin = () => {
    const twin: DigitalTwin = {
      id: generateMockId(),
      snapshot_date: generateMockTimestamp(),
      revenue_streams: [
        { name: 'Consulting', mrr: 15000, growth_rate: 12 },
        { name: 'Products', mrr: 8000, growth_rate: 25 },
        { name: 'Subscriptions', mrr: 5000, growth_rate: 8 }
      ],
      demand_metrics: { leads: 150, qualified: 45, pipeline_value: 125000 },
      capacity_metrics: { utilization: 78, available_hours: 40 },
      pricing_metrics: { avg_deal_size: 2500, win_rate: 35 },
      burn_metrics: { monthly_burn: 12000, runway_months: 18 },
      risk_factors: [
        { risk: 'Single client dependency', probability: 30, impact: 'high' },
        { risk: 'Market downturn', probability: 15, impact: 'medium' }
      ],
      health_score: 72
    };

    addTwin(twin);
    toast.success('Sample twin snapshot created');
  };

  const latestTwin = twins[0];
  const healthScore = latestTwin?.health_score || 0;

  const chartData = twins.slice().reverse().map(twin => ({
    date: new Date(twin.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    health: twin.health_score || 0,
  }));

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRevenueStreams = () => latestTwin?.revenue_streams || [];
  const getRiskFactors = () => latestTwin?.risk_factors || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Economic Digital Twin
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time simulation of your entire business economy
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateSampleTwin}>
            <Activity className="h-4 w-4 mr-2" />
            Generate Snapshot
          </Button>
          <Dialog open={showSimulation} onOpenChange={setShowSimulation}>
            <DialogTrigger asChild>
              <Button><Play className="h-4 w-4 mr-2" />Run Simulation</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Future Simulation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Simulation name (e.g., 'Price increase 20%')"
                  value={newSimulation.simulation_name}
                  onChange={e => setNewSimulation({ ...newSimulation, simulation_name: e.target.value })}
                />
                <Select 
                  value={newSimulation.scenario_type} 
                  onValueChange={v => setNewSimulation({ ...newSimulation, scenario_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base_case">Base Case (Most Likely)</SelectItem>
                    <SelectItem value="optimistic">Optimistic Scenario</SelectItem>
                    <SelectItem value="pessimistic">Pessimistic Scenario</SelectItem>
                    <SelectItem value="custom">Custom Scenario</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  className="w-full" 
                  onClick={createSimulation}
                  disabled={!newSimulation.simulation_name}
                >
                  Run Simulation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Health Score */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Business Health Score</p>
              <p className={`text-4xl font-bold ${getHealthColor(healthScore)}`}>{healthScore}/100</p>
              <p className="text-sm text-muted-foreground mt-1">
                {healthScore >= 80 ? 'Excellent - Business is thriving' :
                 healthScore >= 60 ? 'Good - Minor optimizations needed' :
                 healthScore >= 40 ? 'Fair - Attention required' :
                 twins.length === 0 ? 'No data - Generate a snapshot' :
                 'Critical - Immediate action needed'}
              </p>
            </div>
            <div className="w-32 h-32">
              <div className="relative">
                <Gauge className={`h-32 w-32 ${getHealthColor(healthScore)}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold ${getHealthColor(healthScore)}`}>{healthScore}%</span>
                </div>
              </div>
            </div>
          </div>
          <Progress value={healthScore} className="mt-4" />
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue Streams</p>
                <p className="text-2xl font-bold">{getRevenueStreams().length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Capacity Util.</p>
                <p className="text-2xl font-bold">{latestTwin?.capacity_metrics?.utilization || 0}%</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Factors</p>
                <p className="text-2xl font-bold text-orange-500">{getRiskFactors().length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Simulations</p>
                <p className="text-2xl font-bold">{simulations.length}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Twin Overview</TabsTrigger>
          <TabsTrigger value="simulations">Future Simulations</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Health Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="health" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Brain className="h-8 w-8 mx-auto mb-2" />
                      <p>No historical data yet</p>
                      <Button variant="link" onClick={generateSampleTwin}>Generate a snapshot</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Streams */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Streams</CardTitle>
              </CardHeader>
              <CardContent>
                {getRevenueStreams().length > 0 ? (
                  <div className="space-y-3">
                    {getRevenueStreams().map((stream, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{stream.name}</p>
                          <p className="text-sm text-muted-foreground">${stream.mrr?.toLocaleString()}/mo</p>
                        </div>
                        <Badge className={stream.growth_rate > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                          {stream.growth_rate > 0 ? '+' : ''}{stream.growth_rate}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <DollarSign className="h-8 w-8 mx-auto mb-2" />
                      <p>No revenue streams configured</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="simulations" className="space-y-4">
          {simulations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No simulations yet</h3>
                <p className="text-muted-foreground mt-1">Run simulations to test future scenarios</p>
              </CardContent>
            </Card>
          ) : (
            simulations.map(sim => {
              const outcomes = sim.projected_outcomes;
              return (
                <Card key={sim.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{sim.simulation_name}</p>
                          {sim.recommended && <Badge className="bg-green-500/10 text-green-500">Recommended</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{sim.scenario_type.replace('_', ' ')}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {sim.probability_score}% probability
                          </span>
                        </div>
                        {outcomes && (
                          <div className="flex gap-4 mt-3 text-sm">
                            <span>3mo: <strong>${((outcomes.revenue_3m || 0) / 1000).toFixed(0)}k</strong></span>
                            <span>6mo: <strong>${((outcomes.revenue_6m || 0) / 1000).toFixed(0)}k</strong></span>
                            <span>12mo: <strong>${((outcomes.revenue_12m || 0) / 1000).toFixed(0)}k</strong></span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(sim.simulated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          {getRiskFactors().length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No risk factors identified</h3>
                <p className="text-muted-foreground mt-1">Risks will be detected automatically</p>
              </CardContent>
            </Card>
          ) : (
            getRiskFactors().map((risk, idx) => (
              <Card key={idx}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`h-5 w-5 ${
                        risk.impact === 'high' ? 'text-red-500' :
                        risk.impact === 'medium' ? 'text-yellow-500' :
                        'text-muted-foreground'
                      }`} />
                      <div>
                        <p className="font-medium">{risk.risk}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{risk.probability}% likely</Badge>
                          <Badge className={
                            risk.impact === 'high' ? 'bg-red-500/10 text-red-500' :
                            risk.impact === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-muted text-muted-foreground'
                          }>{risk.impact} impact</Badge>
                        </div>
                      </div>
                    </div>
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
