import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database,
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  BarChart3,
  Zap,
  Clock,
  RefreshCw,
  Lock
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { Json } from '@/integrations/supabase/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DecisionActionOutcome {
  id: string;
  decision_context: Json;
  decision_chosen: string;
  alternatives_rejected: Json;
  predicted_outcome: Json;
  actual_outcome: Json;
  outcome_delta: Json;
  regret_score: number | null;
  regret_reason: string | null;
  learning_extracted: string | null;
  recorded_at: string;
  outcome_recorded_at: string | null;
}

interface PatternLearning {
  id: string;
  organization_id: string | null;
  pattern_type: string;
  context_signature: Json;
  pattern_description: string;
  success_rate: number | null;
  sample_size: number;
  confidence_level: number | null;
  recommended_action: string | null;
  counter_indicators: Json;
  discovered_at: string;
  last_validated_at: string | null;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', '#10b981', '#f59e0b'];

export default function DataFlywheel() {
  const { organization } = useOrganization();

  const { data: outcomes = [], isLoading: outcomesLoading } = useQuery({
    queryKey: ['decision-outcomes', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('decision_action_outcomes')
        .select('*')
        .eq('organization_id', organization.id)
        .order('recorded_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as DecisionActionOutcome[];
    },
    enabled: !!organization?.id
  });

  const { data: patterns = [], isLoading: patternsLoading } = useQuery({
    queryKey: ['pattern-learnings', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pattern_learnings')
        .select('*')
        .or(`organization_id.is.null,organization_id.eq.${organization?.id}`)
        .order('confidence_level', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as PatternLearning[];
    },
    enabled: !!organization?.id
  });

  // Calculate metrics
  const totalDecisions = outcomes.length;
  const outcomeRecorded = outcomes.filter(o => o.outcome_recorded_at).length;
  const avgRegret = outcomes.length > 0 
    ? outcomes.reduce((sum, o) => sum + (o.regret_score || 0), 0) / outcomes.length 
    : 0;
  const lowRegretDecisions = outcomes.filter(o => (o.regret_score || 0) < 30).length;
  const successPatterns = patterns.filter(p => p.pattern_type === 'success').length;
  const globalPatterns = patterns.filter(p => !p.organization_id).length;

  // Chart data for regret distribution
  const regretDistribution = [
    { name: 'Low Regret (<30)', value: outcomes.filter(o => (o.regret_score || 0) < 30).length },
    { name: 'Medium (30-60)', value: outcomes.filter(o => (o.regret_score || 0) >= 30 && (o.regret_score || 0) < 60).length },
    { name: 'High (>60)', value: outcomes.filter(o => (o.regret_score || 0) >= 60).length }
  ];

  const getAlternatives = (outcome: DecisionActionOutcome): string[] => {
    if (!outcome.alternatives_rejected) return [];
    if (Array.isArray(outcome.alternatives_rejected)) return outcome.alternatives_rejected as string[];
    return [];
  };

  const getCounterIndicators = (pattern: PatternLearning): string[] => {
    if (!pattern.counter_indicators) return [];
    if (Array.isArray(pattern.counter_indicators)) return pattern.counter_indicators as string[];
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          Data Flywheel
        </h1>
        <p className="text-muted-foreground mt-1">
          Proprietary decision → action → outcome → regret data
        </p>
      </div>

      {/* Moat Indicator */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <Lock className="h-12 w-12 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Your Proprietary Moat</h2>
              <p className="text-muted-foreground">
                This data cannot be scraped, bought, or replicated. It learns what actually works for your business.
              </p>
              <div className="flex items-center gap-6 mt-3">
                <div>
                  <span className="text-2xl font-bold text-primary">{totalDecisions}</span>
                  <span className="text-sm text-muted-foreground ml-2">decisions tracked</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-green-500">{patterns.length}</span>
                  <span className="text-sm text-muted-foreground ml-2">patterns learned</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-blue-500">{globalPatterns}</span>
                  <span className="text-sm text-muted-foreground ml-2">global insights</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outcomes Recorded</p>
                <p className="text-2xl font-bold">{outcomeRecorded}/{totalDecisions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={(outcomeRecorded / Math.max(totalDecisions, 1)) * 100} className="mt-3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Regret Score</p>
                <p className={`text-2xl font-bold ${avgRegret < 30 ? 'text-green-500' : avgRegret < 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {avgRegret.toFixed(0)}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${avgRegret < 30 ? 'text-green-500' : avgRegret < 60 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Regret Decisions</p>
                <p className="text-2xl font-bold text-green-500">{lowRegretDecisions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Patterns</p>
                <p className="text-2xl font-bold">{successPatterns}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="outcomes">
        <TabsList>
          <TabsTrigger value="outcomes">Decision Outcomes</TabsTrigger>
          <TabsTrigger value="patterns">Learned Patterns</TabsTrigger>
          <TabsTrigger value="analytics">Flywheel Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="outcomes" className="space-y-4">
          {outcomesLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : outcomes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No decision outcomes yet</h3>
                <p className="text-muted-foreground mt-1">
                  The flywheel starts spinning as you make and track decisions
                </p>
              </CardContent>
            </Card>
          ) : (
            outcomes.map(outcome => (
              <Card key={outcome.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{outcome.decision_chosen}</p>
                      
                      {getAlternatives(outcome).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-xs text-muted-foreground">Rejected:</span>
                          {getAlternatives(outcome).map((alt, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{alt}</Badge>
                          ))}
                        </div>
                      )}

                      {outcome.learning_extracted && (
                        <div className="mt-3 p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Lightbulb className="h-3 w-3" />
                            Learning Extracted
                          </div>
                          <p className="text-sm">{outcome.learning_extracted}</p>
                        </div>
                      )}

                      {outcome.regret_reason && (
                        <p className="text-sm text-orange-500 mt-2">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          {outcome.regret_reason}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      {outcome.regret_score !== null && (
                        <div className={`text-lg font-bold ${
                          outcome.regret_score < 30 ? 'text-green-500' :
                          outcome.regret_score < 60 ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {outcome.regret_score}
                          <span className="text-xs text-muted-foreground ml-1">regret</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(outcome.recorded_at).toLocaleDateString()}
                      </p>
                      {outcome.outcome_recorded_at ? (
                        <Badge className="bg-green-500/10 text-green-500 mt-1">Outcome Tracked</Badge>
                      ) : (
                        <Badge variant="outline" className="mt-1">Pending Outcome</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {patternsLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : patterns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No patterns learned yet</h3>
                <p className="text-muted-foreground mt-1">
                  Patterns emerge as the flywheel accumulates data
                </p>
              </CardContent>
            </Card>
          ) : (
            patterns.map(pattern => (
              <Card key={pattern.id} className={pattern.organization_id ? '' : 'border-primary/30'}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          pattern.pattern_type === 'success' ? 'bg-green-500/10 text-green-500' :
                          pattern.pattern_type === 'failure' ? 'bg-red-500/10 text-red-500' :
                          'bg-muted text-muted-foreground'
                        }>{pattern.pattern_type}</Badge>
                        {!pattern.organization_id && (
                          <Badge variant="outline" className="text-primary">
                            <Database className="h-3 w-3 mr-1" />
                            Global Pattern
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium mt-2">{pattern.pattern_description}</p>
                      
                      {pattern.recommended_action && (
                        <p className="text-sm text-primary mt-2">
                          <Zap className="h-3 w-3 inline mr-1" />
                          {pattern.recommended_action}
                        </p>
                      )}

                      {getCounterIndicators(pattern).length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-muted-foreground">Don't apply when: </span>
                          {getCounterIndicators(pattern).map((ind, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs ml-1">{ind}</Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-lg font-bold">{pattern.success_rate || 0}%</p>
                          <p className="text-xs text-muted-foreground">success rate</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{pattern.sample_size}</p>
                          <p className="text-xs text-muted-foreground">samples</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2 justify-end">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <Progress value={pattern.confidence_level || 0} className="w-16 h-2" />
                        <span className="text-xs">{pattern.confidence_level || 0}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regret Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Regret Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {outcomes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={regretDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {regretDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No data yet
                  </div>
                )}
                <div className="flex justify-center gap-4 mt-4">
                  {regretDistribution.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                      <span className="text-xs">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Flywheel Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Flywheel Momentum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Data Collection Rate</span>
                      <span className="font-medium">{Math.min(100, totalDecisions * 5)}%</span>
                    </div>
                    <Progress value={Math.min(100, totalDecisions * 5)} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Pattern Discovery</span>
                      <span className="font-medium">{Math.min(100, patterns.length * 10)}%</span>
                    </div>
                    <Progress value={Math.min(100, patterns.length * 10)} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Learning Extraction</span>
                      <span className="font-medium">
                        {Math.round((outcomes.filter(o => o.learning_extracted).length / Math.max(outcomes.length, 1)) * 100)}%
                      </span>
                    </div>
                    <Progress value={(outcomes.filter(o => o.learning_extracted).length / Math.max(outcomes.length, 1)) * 100} />
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                      <span className="text-sm text-muted-foreground">Flywheel is spinning...</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
