import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import { 
  Brain, 
  Target, 
  Zap, 
  RefreshCw, 
  Play, 
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Users,
  DollarSign,
  MessageSquare,
  Eye
} from 'lucide-react';

interface OrchestrationResult {
  perception: {
    current_bottleneck: string;
    bottleneck_severity: number;
    key_metrics: any;
  };
  reasoning: {
    analysis: string;
    expected_impact: string;
    risk_assessment: string;
  };
  delegation: {
    agent: string;
    task: string;
    priority: number;
    success_criteria: string[];
  };
  verification: {
    quality_threshold: number;
    reflexion_required: boolean;
    human_approval_required: boolean;
    reason: string;
  };
  next_state: string;
}

interface ReflexionResult {
  finalOutput: string;
  iterations: number;
  passedOnIteration: number | null;
  critiques: Array<{
    iteration: number;
    verdict: string;
    score: number;
    issues: any[];
  }>;
  improvement: number;
}

interface EvolutionResult {
  analysis: {
    period: string;
    total_leads: number;
    conversion_rate: string;
    top_objections: string[];
    best_performing_patterns: string[];
  };
  recommended_changes: Array<{
    area: string;
    current: string;
    proposed: string;
    rationale: string;
  }>;
  confidence: string;
}

const stateNodes = [
  { id: 'NODE_A', label: 'Perception', icon: Eye, description: 'Check for triggers' },
  { id: 'NODE_B', label: 'Delegation', icon: Users, description: 'Dispatch to agent' },
  { id: 'NODE_C', label: 'Reflexion', icon: RefreshCw, description: 'Quality check' },
  { id: 'NODE_D', label: 'Execution', icon: Zap, description: 'Execute action' },
  { id: 'NODE_E', label: 'Logging', icon: CheckCircle, description: 'Record outcome' },
];

const agentIcons: Record<string, any> = {
  scout: Target,
  creator: Lightbulb,
  socialite: MessageSquare,
  closer: DollarSign,
};

export default function SwarmOrchestrator() {
  const { organization } = useOrganization();
  const [isRunning, setIsRunning] = useState(false);
  const [currentState, setCurrentState] = useState('NODE_A');
  const [orchestrationResult, setOrchestrationResult] = useState<OrchestrationResult | null>(null);
  const [reflexionResult, setReflexionResult] = useState<ReflexionResult | null>(null);
  const [evolutionResult, setEvolutionResult] = useState<EvolutionResult | null>(null);
  const [isEvolutionRunning, setIsEvolutionRunning] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);

  useEffect(() => {
    if (organization?.id) {
      loadExecutionHistory();
    }
  }, [organization?.id]);

  const loadExecutionHistory = async () => {
    if (!organization?.id) return;
    
    const { data } = await supabase
      .from('agent_execution_logs')
      .select('*')
      .eq('organization_id', organization.id)
      .order('executed_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setExecutionHistory(data);
    }
  };

  const runOrchestrator = async () => {
    if (!organization?.id) return;
    
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('swarm-orchestrator', {
        body: {
          organizationId: organization.id,
          trigger: { type: 'manual', data: {} },
          currentState
        }
      });

      if (error) throw error;

      setOrchestrationResult(data.orchestration);
      setCurrentState(data.orchestration.next_state);
      toast.success('Orchestration cycle complete');
      loadExecutionHistory();
    } catch (error) {
      console.error('Orchestration error:', error);
      toast.error('Failed to run orchestration');
    } finally {
      setIsRunning(false);
    }
  };

  const testReflexion = async () => {
    if (!organization?.id) return;
    
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('reflexion-engine', {
        body: {
          originalOutput: "Hey! I see you're interested in our service. We have the best solution for you at only $997. Click here to buy now!!!",
          context: {
            agentType: 'closer',
            brandVoice: 'Professional Maverick',
            validPrices: [997, 497, 27],
          },
          maxIterations: 3
        }
      });

      if (error) throw error;

      setReflexionResult(data);
      toast.success(`Reflexion complete after ${data.iterations} iterations`);
    } catch (error) {
      console.error('Reflexion error:', error);
      toast.error('Failed to run reflexion');
    } finally {
      setIsRunning(false);
    }
  };

  const runEvolution = async () => {
    if (!organization?.id) return;
    
    setIsEvolutionRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-evolution', {
        body: {
          organizationId: organization.id,
          periodDays: 7
        }
      });

      if (error) throw error;

      setEvolutionResult(data.evolution);
      toast.success('Meta-evolution analysis complete');
    } catch (error) {
      console.error('Evolution error:', error);
      toast.error('Failed to run evolution');
    } finally {
      setIsEvolutionRunning(false);
    }
  };

  const getBottleneckColor = (bottleneck: string) => {
    switch (bottleneck) {
      case 'traffic': return 'bg-blue-500/20 text-blue-400';
      case 'conversion': return 'bg-orange-500/20 text-orange-400';
      case 'retention': return 'bg-purple-500/20 text-purple-400';
      case 'content': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Swarm Orchestrator</h2>
          <p className="text-muted-foreground">ReAct State Machine with Reflexion Loop</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={testReflexion}
            disabled={isRunning}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            Test Reflexion
          </Button>
          <Button 
            onClick={runOrchestrator}
            disabled={isRunning}
          >
            {isRunning ? (
              <Pause className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? 'Running...' : 'Run Cycle'}
          </Button>
        </div>
      </div>

      {/* State Machine Visualization */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            State Machine
          </CardTitle>
          <CardDescription>Current cognitive loop state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {stateNodes.map((node, index) => {
              const Icon = node.icon;
              const isActive = currentState === node.id;
              const isPast = stateNodes.findIndex(n => n.id === currentState) > index;
              
              return (
                <div key={node.id} className="flex items-center">
                  <div 
                    className={`flex flex-col items-center p-4 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-primary/20 border-2 border-primary scale-110' 
                        : isPast 
                          ? 'bg-green-500/20 border border-green-500/50' 
                          : 'bg-muted/50 border border-border/50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-primary' : isPast ? 'text-green-400' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>{node.label}</span>
                    <span className="text-xs text-muted-foreground">{node.description}</span>
                  </div>
                  {index < stateNodes.length - 1 && (
                    <ArrowRight className={`w-6 h-6 mx-2 ${isPast ? 'text-green-400' : 'text-muted-foreground'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="orchestration" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="orchestration">Orchestration</TabsTrigger>
          <TabsTrigger value="reflexion">Reflexion</TabsTrigger>
          <TabsTrigger value="evolution">Meta-Evolution</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="orchestration" className="space-y-4">
          {orchestrationResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Perception */}
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Perception
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bottleneck:</span>
                    <Badge className={getBottleneckColor(orchestrationResult.perception.current_bottleneck)}>
                      {orchestrationResult.perception.current_bottleneck.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Severity:</span>
                      <span>{orchestrationResult.perception.bottleneck_severity}/10</span>
                    </div>
                    <Progress 
                      value={orchestrationResult.perception.bottleneck_severity * 10} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Reasoning */}
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Reasoning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Analysis:</span>
                    <p className="text-sm">{orchestrationResult.reasoning.analysis}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Expected Impact:</span>
                    <p className="text-sm text-green-400">{orchestrationResult.reasoning.expected_impact}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Risk:</span>
                    <p className="text-sm text-orange-400">{orchestrationResult.reasoning.risk_assessment}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Delegation */}
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Delegation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orchestrationResult.delegation && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Agent:</span>
                        <Badge variant="outline" className="capitalize">
                          {orchestrationResult.delegation.agent}
                        </Badge>
                        <Badge variant="secondary">P{orchestrationResult.delegation.priority}</Badge>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Task:</span>
                        <p className="text-sm">{orchestrationResult.delegation.task}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Success Criteria:</span>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {orchestrationResult.delegation.success_criteria?.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Verification */}
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Quality Threshold:</span>
                    <span>{orchestrationResult.verification.quality_threshold}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Reflexion Required:</span>
                    {orchestrationResult.verification.reflexion_required ? (
                      <Badge variant="destructive">Yes</Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-400">No</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Human Approval:</span>
                    {orchestrationResult.verification.human_approval_required ? (
                      <Badge variant="destructive">Required</Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-400">Auto-approved</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{orchestrationResult.verification.reason}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="glass border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Run an orchestration cycle to see results</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reflexion" className="space-y-4">
          {reflexionResult ? (
            <div className="space-y-4">
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Reflexion Results
                  </CardTitle>
                  <CardDescription>
                    Completed in {reflexionResult.iterations} iterations | 
                    Improvement: {reflexionResult.improvement > 0 ? '+' : ''}{reflexionResult.improvement} points
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Final Output:</h4>
                    <p className="p-3 bg-muted/50 rounded-lg text-sm">
                      {reflexionResult.finalOutput}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Critique History:</h4>
                    <div className="space-y-2">
                      {reflexionResult.critiques.map((critique, index) => (
                        <div 
                          key={index}
                          className="p-3 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Iteration {critique.iteration}</span>
                            <div className="flex items-center gap-2">
                              <Badge className={critique.verdict === 'PASS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                                {critique.verdict}
                              </Badge>
                              <span className="text-sm">{critique.score}/100</span>
                            </div>
                          </div>
                          {critique.issues.length > 0 && (
                            <div className="space-y-1">
                              {critique.issues.map((issue, i) => (
                                <p key={i} className="text-xs text-muted-foreground">
                                  • [{issue.category}] {issue.description}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="glass border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Click "Test Reflexion" to see the quality control loop in action</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="evolution" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={runEvolution}
              disabled={isEvolutionRunning}
            >
              <TrendingUp className={`w-4 h-4 mr-2 ${isEvolutionRunning ? 'animate-pulse' : ''}`} />
              {isEvolutionRunning ? 'Analyzing...' : 'Run Meta-Evolution'}
            </Button>
          </div>

          {evolutionResult ? (
            <div className="space-y-4">
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Evolution Analysis
                  </CardTitle>
                  <CardDescription>
                    Period: {evolutionResult.analysis.period} | 
                    Confidence: {evolutionResult.confidence}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <span className="text-xs text-muted-foreground">Total Leads</span>
                      <p className="text-2xl font-bold">{evolutionResult.analysis.total_leads}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <span className="text-xs text-muted-foreground">Conversion Rate</span>
                      <p className="text-2xl font-bold text-green-400">{evolutionResult.analysis.conversion_rate}</p>
                    </div>
                  </div>

                  {evolutionResult.analysis.top_objections?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Top Objections:</h4>
                      <div className="flex flex-wrap gap-2">
                        {evolutionResult.analysis.top_objections.map((obj, i) => (
                          <Badge key={i} variant="outline">{obj}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {evolutionResult.recommended_changes?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recommended Changes:</h4>
                      <div className="space-y-2">
                        {evolutionResult.recommended_changes.map((change, i) => (
                          <div key={i} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="secondary">{change.area}</Badge>
                            </div>
                            <p className="text-sm mb-1">
                              <span className="text-red-400 line-through">{change.current}</span>
                              {' → '}
                              <span className="text-green-400">{change.proposed}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">{change.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="glass border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Run meta-evolution to analyze and improve agent prompts</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>Recent orchestrator and agent actions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {executionHistory.map((log) => (
                    <div 
                      key={log.id}
                      className="p-3 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="capitalize">{log.action_type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.executed_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{log.reasoning || 'No reasoning recorded'}</p>
                      {log.result && (
                        <Badge className="mt-2 bg-green-500/20 text-green-400">{log.result}</Badge>
                      )}
                    </div>
                  ))}
                  {executionHistory.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No execution history yet</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
