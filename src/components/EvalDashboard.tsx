import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trash2,
  FileText,
  TrendingUp,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface TestCase {
  id: string;
  name: string;
  input: string;
  context?: string;
  expectedOutput: string;
  agentType: 'orchestrator' | 'closer' | 'creator' | 'reflexion';
  passThreshold?: number;
  tags?: string[];
}

interface EvalResult {
  testId: string;
  testName: string;
  passed: boolean;
  scores: {
    accuracy: number;
    faithfulness: number;
    relevance: number;
    tone: number;
  };
  overall: number;
  generatedOutput: string;
  expectedOutput: string;
  issues: string[];
  duration: number;
}

interface EvalRun {
  id: string;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  results?: Array<{ testId: string; testName: string; passed: boolean; overall: number }>;
}

export function EvalDashboard() {
  const { organization } = useOrganization();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [evalRuns, setEvalRuns] = useState<EvalRun[]>([]);
  const [currentResults, setCurrentResults] = useState<EvalResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTestCase, setNewTestCase] = useState<{
    name: string;
    input: string;
    context: string;
    expectedOutput: string;
    agentType: 'orchestrator' | 'closer' | 'creator' | 'reflexion';
    passThreshold: number;
  }>({
    name: '',
    input: '',
    context: '',
    expectedOutput: '',
    agentType: 'closer',
    passThreshold: 80
  });

  useEffect(() => {
    if (organization?.id) {
      loadData();
    }
  }, [organization?.id]);

  const loadData = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      // Load test cases
      const { data: testData } = await supabase
        .from('memory_items')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('type', 'eval_test_case')
        .order('created_at', { ascending: false });

      if (testData) {
        const contentItems = testData as Array<{
          id: string;
          title: string;
          content: Record<string, unknown>;
        }>;
        setTestCases(contentItems.map(item => ({
          id: item.id,
          name: item.title,
          ...(item.content as Omit<TestCase, 'id' | 'name'>)
        })));
      }

      // Load eval runs
      const { data: runData } = await supabase
        .from('memory_items')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('type', 'eval_run')
        .order('created_at', { ascending: false })
        .limit(10);

      if (runData) {
        setEvalRuns(runData.map(item => ({
          id: item.id,
          timestamp: item.created_at,
          totalTests: (item.content as Record<string, unknown>)?.totalTests as number || 0,
          passed: (item.content as Record<string, unknown>)?.passed as number || 0,
          failed: (item.content as Record<string, unknown>)?.failed as number || 0,
          passRate: (item.content as Record<string, unknown>)?.passRate as number || 0,
          results: (item.content as Record<string, unknown>)?.results as EvalRun['results']
        })));
      }
    } catch (error) {
      console.error('Failed to load eval data:', error);
    }
    setLoading(false);
  };

  const addTestCase = async () => {
    if (!organization?.id || !newTestCase.name || !newTestCase.input || !newTestCase.expectedOutput) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase.from('memory_items').insert({
        organization_id: organization.id,
        type: 'eval_test_case',
        title: newTestCase.name,
        content: {
          input: newTestCase.input,
          context: newTestCase.context,
          expectedOutput: newTestCase.expectedOutput,
          agentType: newTestCase.agentType,
          passThreshold: newTestCase.passThreshold
        },
        tags: ['eval', newTestCase.agentType]
      });

      if (error) throw error;

      toast.success('Test case added');
      setNewTestCase({
        name: '',
        input: '',
        context: '',
        expectedOutput: '',
        agentType: 'closer',
        passThreshold: 80
      });
      setShowAddForm(false);
      loadData();
    } catch (error) {
      toast.error('Failed to add test case');
    }
  };

  const deleteTestCase = async (id: string) => {
    try {
      await supabase.from('memory_items').delete().eq('id', id);
      toast.success('Test case deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete test case');
    }
  };

  const runEvaluation = async (agentType?: string) => {
    if (!organization?.id) return;
    
    setRunning(true);
    setCurrentResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('eval-runner', {
        body: {
          organizationId: organization.id,
          runAll: !agentType,
          agentType
        }
      });

      if (error) throw error;

      if (data.success) {
        setCurrentResults(data.results);
        toast.success(`Evaluation complete: ${data.passed}/${data.totalTests} passed`);
        loadData();
      } else {
        toast.error(data.message || 'Evaluation failed');
      }
    } catch (error) {
      console.error('Eval error:', error);
      toast.error('Failed to run evaluation');
    }
    setRunning(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const latestPassRate = evalRuns[0]?.passRate || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Evaluation Framework</h1>
          <p className="text-muted-foreground">Golden dataset testing & regression detection</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAddForm(true)}
            disabled={running}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Test Case
          </Button>
          <Button 
            onClick={() => runEvaluation()} 
            disabled={running || testCases.length === 0}
          >
            {running ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{testCases.length}</p>
                <p className="text-sm text-muted-foreground">Test Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{evalRuns.length}</p>
                <p className="text-sm text-muted-foreground">Eval Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-5 h-5 ${latestPassRate >= 80 ? 'text-green-500' : 'text-yellow-500'}`} />
              <div>
                <p className="text-2xl font-bold">{latestPassRate}%</p>
                <p className="text-sm text-muted-foreground">Latest Pass Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">
                  {currentResults.length > 0 
                    ? Math.round(currentResults.reduce((s, r) => s + r.overall, 0) / currentResults.length)
                    : '-'}
                </p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tests">Test Cases</TabsTrigger>
          <TabsTrigger value="results">Latest Results</TabsTrigger>
          <TabsTrigger value="history">Run History</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add Test Case</CardTitle>
                <CardDescription>Create a new golden test case for regression testing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Test Name</label>
                    <Input
                      placeholder="e.g., Closing objection handling"
                      value={newTestCase.name}
                      onChange={(e) => setNewTestCase({ ...newTestCase, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Agent Type</label>
                    <Select
                      value={newTestCase.agentType}
                      onValueChange={(v: 'orchestrator' | 'closer' | 'creator' | 'reflexion') => 
                        setNewTestCase({ ...newTestCase, agentType: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orchestrator">Orchestrator</SelectItem>
                        <SelectItem value="closer">Closer</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="reflexion">Reflexion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Input (User Message)</label>
                  <Textarea
                    placeholder="The message/question to test..."
                    value={newTestCase.input}
                    onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Context (System Prompt)</label>
                  <Textarea
                    placeholder="Optional context for the agent..."
                    value={newTestCase.context}
                    onChange={(e) => setNewTestCase({ ...newTestCase, context: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expected Output</label>
                  <Textarea
                    placeholder="The ideal response (will be compared semantically)..."
                    value={newTestCase.expectedOutput}
                    onChange={(e) => setNewTestCase({ ...newTestCase, expectedOutput: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  <Button onClick={addTestCase}>Add Test Case</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {testCases.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No test cases yet. Add your first golden test!</p>
                </CardContent>
              </Card>
            ) : (
              testCases.map((test) => (
                <Card key={test.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{test.name}</h3>
                          <Badge variant="outline">{test.agentType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{test.input}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runEvaluation(test.agentType)}
                          disabled={running}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTestCase(test.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {currentResults.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Play className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Run an evaluation to see results</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {currentResults.map((result) => (
                  <Card key={result.testId} className={result.passed ? 'border-green-500/30' : 'border-red-500/30'}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <h3 className="font-medium">{result.testName}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${getScoreColor(result.overall)}`}>
                            {result.overall}/100
                          </span>
                          <Badge variant="outline">{result.duration}ms</Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        {Object.entries(result.scores).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <p className="text-xs text-muted-foreground capitalize">{key}</p>
                            <Progress value={value} className="h-2 mt-1" />
                            <p className={`text-sm font-medium ${getScoreColor(value)}`}>{value}</p>
                          </div>
                        ))}
                      </div>

                      {result.issues.length > 0 && (
                        <div className="bg-destructive/10 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            <span className="text-sm font-medium">Issues Found</span>
                          </div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {result.issues.map((issue, i) => (
                              <li key={i}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium mb-1">Expected</p>
                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded line-clamp-3">
                            {result.expectedOutput}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1">Generated</p>
                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded line-clamp-3">
                            {result.generatedOutput}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {evalRuns.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No evaluation runs yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {evalRuns.map((run) => (
                <Card key={run.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          run.passRate >= 80 ? 'bg-green-500/20' : run.passRate >= 50 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                        }`}>
                          <span className={`text-lg font-bold ${
                            run.passRate >= 80 ? 'text-green-500' : run.passRate >= 50 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {run.passRate}%
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {run.passed}/{run.totalTests} tests passed
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(run.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={run.passRate >= 80 ? 'default' : 'destructive'}>
                          {run.failed} failed
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
