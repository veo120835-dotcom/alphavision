import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  TrendingDown, 
  Activity, 
  Zap, 
  Target, 
  AlertTriangle,
  Play,
  BarChart3,
  Clock,
  DollarSign,
  Users,
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Json } from '@/integrations/supabase/types';

interface DigitalTwin {
  id: string;
  snapshot_date: string;
  revenue_streams: Json;
  demand_metrics: Json;
  capacity_metrics: Json;
  pricing_metrics: Json;
  burn_metrics: Json;
  risk_factors: Json;
  health_score: number | null;
}

interface Simulation {
  id: string;
  simulation_name: string;
  scenario_type: string;
  strategy_changes: Json;
  projected_outcomes: Json;
  probability_score: number | null;
  recommended: boolean;
  simulated_at: string;
}

export default function EconomicDigitalTwin() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [showSimulation, setShowSimulation] = useState(false);
  const [newSimulation, setNewSimulation] = useState({
    simulation_name: '',
    scenario_type: 'base_case',
    strategy_changes: {}
  });

  const { data: twins = [], isLoading: twinsLoading } = useQuery({
    queryKey: ['digital-twin', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('business_digital_twin')
        .select('*')
        .eq('organization_id', organization.id)
        .order('snapshot_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as DigitalTwin[];
    },
    enabled: !!organization?.id
  });

  const { data: simulations = [] } = useQuery({
    queryKey: ['simulations', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('future_simulations')
        .select('*')
        .eq('organization_id', organization.id)
        .order('simulated_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Simulation[];
    },
    enabled: !!organization?.id
  });

  const createSimulationMutation = useMutation({
    mutationFn: async (sim: typeof newSimulation) => {
      if (!organization?.id) throw new Error('No organization');
      const latestTwin = twins[0];
      const { error } = await supabase.from('future_simulations').insert({
        organization_id: organization.id,
        twin_snapshot_id: latestTwin?.id,
        ...sim,
        projected_outcomes: generateProjectedOutcomes(sim.scenario_type),
        probability_score: sim.scenario_type === 'base_case' ? 70 : 
                          sim.scenario_type === 'optimistic' ? 40 : 60
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      setShowSimulation(false);
      toast.success('Simulation created');
    }
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

  const getRevenueStreams = (): Array<{name: string; mrr: number; growth_rate: number}> => {
    if (!latestTwin?.revenue_streams) return [];
    const streams = latestTwin.revenue_streams;
    if (Array.isArray(streams)) return streams as Array<{name: string; mrr: number; growth_rate: number}>;
    return [];
  };

  const getRiskFactors = (): Array<{risk: string; probability: number; impact: string}> => {
    if (!latestTwin?.risk_factors) return [];
    const risks = latestTwin.risk_factors;
    if (Array.isArray(risks)) return risks as Array<{risk: string; probability: number; impact: string}>;
    return [];
  };

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
                onClick={() => createSimulationMutation.mutate(newSimulation)}
                disabled={!newSimulation.simulation_name}
              >
                Run Simulation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                <p className="text-2xl font-bold">78%</p>
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
                    No historical data yet
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
              const outcomes = sim.projected_outcomes as { revenue_3m?: number; revenue_6m?: number; revenue_12m?: number } | null;
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
