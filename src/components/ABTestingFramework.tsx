import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FlaskConical, 
  Plus, 
  Play, 
  Pause, 
  TrendingUp, 
  TrendingDown,
  Trophy,
  Target,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  RefreshCw,
  Trash2,
  Copy,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

interface ABTest {
  id: string;
  name: string;
  hypothesis: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: ABVariant[];
  metric: string;
  confidence: number;
  winner: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface ABVariant {
  id: string;
  name: string;
  content: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
}

const METRICS = [
  { id: 'retention_3s', label: '3s Retention', description: 'Viewers retained at 3 seconds' },
  { id: 'engagement', label: 'Engagement Rate', description: 'Likes + Comments + Shares / Views' },
  { id: 'click_through', label: 'Click-Through', description: 'CTA clicks / Views' },
  { id: 'watch_time', label: 'Avg Watch Time', description: 'Average seconds watched' },
];

export function ABTestingFramework() {
  const { organization } = useOrganization();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    hypothesis: '',
    metric: 'retention_3s',
    variantA: '',
    variantB: ''
  });

  useEffect(() => {
    if (organization?.id) {
      loadTests();
    }
  }, [organization?.id]);

  const loadTests = () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const stored = localStorage.getItem(`ab_tests_${organization.id}`);
      if (stored) {
        setTests(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTests = (updatedTests: ABTest[]) => {
    if (!organization?.id) return;
    localStorage.setItem(`ab_tests_${organization.id}`, JSON.stringify(updatedTests));
    setTests(updatedTests);
  };

  const createTest = async () => {
    if (!organization?.id || !newTest.name || !newTest.variantA || !newTest.variantB) {
      toast.error('Please fill in all required fields');
      return;
    }

    const test: Omit<ABTest, 'id' | 'created_at'> = {
      name: newTest.name,
      hypothesis: newTest.hypothesis,
      status: 'draft',
      metric: newTest.metric,
      confidence: 0,
      winner: null,
      started_at: null,
      completed_at: null,
      variants: [
        {
          id: 'A',
          name: 'Variant A (Control)',
          content: newTest.variantA,
          impressions: 0,
          conversions: 0,
          conversionRate: 0
        },
        {
          id: 'B',
          name: 'Variant B (Challenger)',
          content: newTest.variantB,
          impressions: 0,
          conversions: 0,
          conversionRate: 0
        }
      ]
    };

    try {
      const testWithId = { ...test, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      saveTests([testWithId, ...tests]);
      setNewTest({ name: '', hypothesis: '', metric: 'retention_3s', variantA: '', variantB: '' });
      setShowCreateForm(false);
      toast.success('A/B Test created!');
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Failed to create test');
    }
  };

  const startTest = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    const updated = {
      ...test,
      status: 'running' as const,
      started_at: new Date().toISOString()
    };

    try {
      saveTests(tests.map(t => t.id === testId ? updated : t));
      toast.success('Test started!');
    } catch (error) {
      console.error('Error starting test:', error);
    }
  };

  const simulateResults = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test || test.status !== 'running') return;

    // Simulate realistic A/B test results
    const impressionsA = Math.floor(Math.random() * 5000) + 1000;
    const impressionsB = Math.floor(Math.random() * 5000) + 1000;
    const conversionRateA = Math.random() * 0.3 + 0.05;
    const conversionRateB = Math.random() * 0.35 + 0.05;

    const updatedVariants = test.variants.map(v => ({
      ...v,
      impressions: v.id === 'A' ? impressionsA : impressionsB,
      conversions: v.id === 'A' 
        ? Math.floor(impressionsA * conversionRateA) 
        : Math.floor(impressionsB * conversionRateB),
      conversionRate: v.id === 'A' ? conversionRateA * 100 : conversionRateB * 100
    }));

    const winningVariant = updatedVariants.reduce((a, b) => 
      a.conversionRate > b.conversionRate ? a : b
    );

    const confidence = Math.min(99, 70 + Math.random() * 29);
    const isSignificant = confidence > 95;

    const updated: ABTest = {
      ...test,
      variants: updatedVariants,
      confidence,
      status: isSignificant ? 'completed' : 'running',
      winner: isSignificant ? winningVariant.id : null,
      completed_at: isSignificant ? new Date().toISOString() : null
    };

    try {
      saveTests(tests.map(t => t.id === testId ? updated : t));
      
      if (isSignificant) {
        toast.success(`Test completed! Variant ${winningVariant.id} wins with ${confidence.toFixed(1)}% confidence`);
      } else {
        toast.info('Results updated. Need more data for significance.');
      }
    } catch (error) {
      console.error('Error updating test:', error);
    }
  };

  const deleteTest = (testId: string) => {
    try {
      saveTests(tests.filter(t => t.id !== testId));
      toast.success('Test deleted');
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  const getStatusBadge = (status: ABTest['status']) => {
    switch (status) {
      case 'draft': return { color: 'bg-muted text-muted-foreground', icon: Clock };
      case 'running': return { color: 'bg-blue-500/20 text-blue-400', icon: Play };
      case 'completed': return { color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 };
      case 'paused': return { color: 'bg-yellow-500/20 text-yellow-400', icon: Pause };
    }
  };

  const runningTests = tests.filter(t => t.status === 'running').length;
  const completedTests = tests.filter(t => t.status === 'completed').length;
  const avgLift = tests.filter(t => t.status === 'completed' && t.variants.length >= 2)
    .reduce((sum, t) => {
      const [a, b] = t.variants;
      return sum + ((b.conversionRate - a.conversionRate) / (a.conversionRate || 1)) * 100;
    }, 0) / (completedTests || 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" />
            A/B Testing Framework
          </h2>
          <p className="text-muted-foreground mt-1">Test hooks and content variations for optimal engagement</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Test
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Play className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{runningTests}</p>
                <p className="text-sm text-muted-foreground">Running Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTests}</p>
                <p className="text-sm text-muted-foreground">Completed Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgLift.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Avg Lift</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Trophy className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tests.filter(t => t.winner === 'B').length}</p>
                <p className="text-sm text-muted-foreground">Challengers Won</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Test Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="card-glow border-primary/30">
              <CardHeader>
                <CardTitle>Create New A/B Test</CardTitle>
                <CardDescription>Define your hypothesis and variants to test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Test Name</label>
                    <Input
                      placeholder="e.g., Question Hook vs Statement Hook"
                      value={newTest.name}
                      onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Success Metric</label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newTest.metric}
                      onChange={(e) => setNewTest(prev => ({ ...prev, metric: e.target.value }))}
                    >
                      {METRICS.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Hypothesis</label>
                  <Textarea
                    placeholder="e.g., Starting with a question will increase 3s retention by 15%"
                    value={newTest.hypothesis}
                    onChange={(e) => setNewTest(prev => ({ ...prev, hypothesis: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Badge variant="outline">A</Badge> Control Variant
                    </label>
                    <Textarea
                      placeholder="Original hook or content"
                      value={newTest.variantA}
                      onChange={(e) => setNewTest(prev => ({ ...prev, variantA: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Badge>B</Badge> Challenger Variant
                    </label>
                    <Textarea
                      placeholder="New hook or content to test"
                      value={newTest.variantB}
                      onChange={(e) => setNewTest(prev => ({ ...prev, variantB: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={createTest}>
                    <FlaskConical className="w-4 h-4 mr-2" />
                    Create Test
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tests List */}
      <div className="space-y-4">
        {tests.map((test) => {
          const statusConfig = getStatusBadge(test.status);
          const StatusIcon = statusConfig.icon;
          const chartData = test.variants.map(v => ({
            name: v.name,
            rate: v.conversionRate,
            fill: v.id === test.winner ? '#22c55e' : v.id === 'A' ? '#6366f1' : '#f97316'
          }));

          return (
            <Card key={test.id} className="card-glow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {test.name}
                      {test.winner && (
                        <Badge className="bg-green-500/20 text-green-400">
                          <Trophy className="w-3 h-3 mr-1" />
                          Variant {test.winner} Wins
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">{test.hypothesis}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {test.status}
                    </Badge>
                    {test.status === 'draft' && (
                      <Button size="sm" onClick={() => startTest(test.id)}>
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {test.status === 'running' && (
                      <Button size="sm" variant="outline" onClick={() => simulateResults(test.id)}>
                        <Zap className="w-4 h-4 mr-1" />
                        Simulate
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => deleteTest(test.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Variants */}
                  <div className="lg:col-span-2 space-y-3">
                    {test.variants.map((variant) => (
                      <div 
                        key={variant.id} 
                        className={`p-4 rounded-lg ${
                          variant.id === test.winner 
                            ? 'bg-green-500/10 border border-green-500/30' 
                            : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={variant.id === 'A' ? 'outline' : 'default'}>
                              {variant.id}
                            </Badge>
                            <span className="font-medium">{variant.name}</span>
                            {variant.id === test.winner && (
                              <Trophy className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <span className="text-lg font-bold">
                            {variant.conversionRate.toFixed(2)}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{variant.content}</p>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                            <span>{variant.impressions.toLocaleString()} impressions</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4 text-muted-foreground" />
                            <span>{variant.conversions.toLocaleString()} conversions</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chart & Confidence */}
                  <div className="space-y-4">
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" domain={[0, 'auto']} tickFormatter={v => `${v}%`} />
                          <YAxis type="category" dataKey="name" hide />
                          <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
                          <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Statistical Confidence</span>
                        <span className={test.confidence >= 95 ? 'text-green-400' : 'text-muted-foreground'}>
                          {test.confidence.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={test.confidence} 
                        className={test.confidence >= 95 ? 'bg-green-500/20' : ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        {test.confidence >= 95 
                          ? '✓ Statistically significant' 
                          : 'Need 95%+ for significance'}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <p>Metric: {METRICS.find(m => m.id === test.metric)?.label}</p>
                      {test.started_at && (
                        <p>Started: {formatDistanceToNow(new Date(test.started_at), { addSuffix: true })}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {tests.length === 0 && !loading && (
          <Card className="card-glow">
            <CardContent className="py-12 text-center">
              <FlaskConical className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No A/B Tests Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first test to optimize your content performance
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Test
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
