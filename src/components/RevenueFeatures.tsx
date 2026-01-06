import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Target, 
  Crosshair, 
  BarChart3, 
  Loader2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Mail,
  Zap
} from 'lucide-react';

interface DealSimulation {
  objections: Array<{ objection: string; severity: string; response_suggestion: string }>;
  strengths: string[];
  risk_factors: Array<{ risk: string; mitigation: string }>;
  win_probability: number;
  recommended_responses: Record<string, string>;
  deal_score: number;
  critical_improvements: string[];
}

interface ChartData {
  url: string;
  base64: string;
}

export default function RevenueFeatures() {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState<string | null>(null);
  
  // Deal Simulator state
  const [proposalSummary, setProposalSummary] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [buyerContext, setBuyerContext] = useState('');
  const [simulation, setSimulation] = useState<DealSimulation | null>(null);

  // Chart Generator state
  const [chartPrompt, setChartPrompt] = useState('');
  const [generatedChart, setGeneratedChart] = useState<ChartData | null>(null);

  // Sniper state
  const [sniperResults, setSniperResults] = useState<any>(null);

  const runDealSimulation = async () => {
    if (!organization?.id || !proposalSummary || !dealValue) {
      toast.error('Please fill in proposal details');
      return;
    }

    setLoading('simulator');
    try {
      const { data, error } = await supabase.functions.invoke('deal-simulator', {
        body: {
          organizationId: organization.id,
          proposalSummary,
          dealValue: parseFloat(dealValue),
          currency: 'USD',
          buyerContext
        }
      });

      if (error) throw error;
      setSimulation(data.simulation);
      toast.success('Deal simulation complete');
    } catch (e) {
      toast.error('Simulation failed');
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const generateComparisonChart = async () => {
    setLoading('chart');
    try {
      const dealVal = parseFloat(dealValue) || 50000;
      
      const { data, error } = await supabase.functions.invoke('chart-generator', {
        body: {
          type: 'bar',
          title: 'Cost of Inaction vs Investment',
          labels: ['Cost of Inaction', 'Our Fee', 'Net Savings'],
          datasets: [{
            label: 'USD',
            data: [dealVal * 3, dealVal, dealVal * 2],
            backgroundColor: ['#ef4444', '#4f46e5', '#10b981']
          }],
          options: { currency: '$', showLegend: false }
        }
      });

      if (error) throw error;
      setGeneratedChart(data.chart);
      toast.success('Chart generated');
    } catch (e) {
      toast.error('Chart generation failed');
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const runSniperBatch = async () => {
    if (!organization?.id) return;
    
    setLoading('sniper');
    try {
      const { data, error } = await supabase.functions.invoke('sniper-outreach', {
        body: {
          organizationId: organization.id,
          mode: 'batch'
        }
      });

      if (error) throw error;
      setSniperResults(data);
      toast.success(`Processed ${data.processed} signals`);
    } catch (e) {
      toast.error('Sniper outreach failed');
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary" />
          Revenue Features
        </h2>
        <p className="text-muted-foreground">Advanced tools to increase closing rates</p>
      </div>

      <Tabs defaultValue="simulator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Deal Simulator
          </TabsTrigger>
          <TabsTrigger value="sniper" className="flex items-center gap-2">
            <Crosshair className="w-4 h-4" />
            Sniper Outreach
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dynamic Assets
          </TabsTrigger>
        </TabsList>

        {/* Deal Simulator Tab */}
        <TabsContent value="simulator" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Proposal Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Deal Value (USD)</label>
                  <Input
                    type="number"
                    placeholder="50000"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Buyer Context (optional)</label>
                  <Input
                    placeholder="e.g., Series B tech company, CFO is ex-McKinsey"
                    value={buyerContext}
                    onChange={(e) => setBuyerContext(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Proposal Summary</label>
                  <Textarea
                    placeholder="Describe your proposal, pricing, deliverables, timeline..."
                    value={proposalSummary}
                    onChange={(e) => setProposalSummary(e.target.value)}
                    rows={6}
                  />
                </div>
                <Button 
                  onClick={runDealSimulation} 
                  className="w-full"
                  disabled={loading === 'simulator'}
                >
                  {loading === 'simulator' ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2" />Run Skeptical Buyer Simulation</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {simulation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Simulation Results</span>
                    <Badge variant={simulation.win_probability >= 0.7 ? 'default' : 'destructive'}>
                      {(simulation.win_probability * 100).toFixed(0)}% Win Probability
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {/* Objections */}
                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          Predicted Objections
                        </h4>
                        <div className="space-y-2">
                          {simulation.objections?.map((obj, i) => (
                            <div key={i} className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium">{obj.objection}</p>
                                <Badge variant="outline" className={getSeverityColor(obj.severity)}>
                                  {obj.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                → {obj.response_suggestion}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Strengths */}
                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {simulation.strengths?.map((s, i) => (
                            <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Critical Improvements */}
                      {simulation.critical_improvements?.length > 0 && (
                        <div>
                          <h4 className="font-medium flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Must Fix Before Sending
                          </h4>
                          <ul className="space-y-1">
                            {simulation.critical_improvements.map((c, i) => (
                              <li key={i} className="text-sm text-red-400">⚠ {c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Sniper Outreach Tab */}
        <TabsContent value="sniper" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-primary" />
                Signal-Based Outreach
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Monitor news signals (funding rounds, leadership changes, product launches) and auto-generate 
                hyper-personalized outreach emails.
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center">
                    <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Pending Signals</p>
                    <p className="text-2xl font-bold text-primary">
                      {sniperResults?.processed || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center">
                    <Target className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Drafts Ready</p>
                    <p className="text-2xl font-bold text-green-400">
                      {sniperResults?.results?.length || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">News Fetched</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {sniperResults?.signals_fetched || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={async () => {
                    if (!organization?.id) return;
                    setLoading('fetch');
                    try {
                      const { data, error } = await supabase.functions.invoke('sniper-outreach', {
                        body: {
                          organizationId: organization.id,
                          mode: 'fetch_news',
                          searchQuery: 'startup funding hiring',
                          industry: 'technology'
                        }
                      });
                      if (error) throw error;
                      setSniperResults(data);
                      toast.success(`Fetched ${data.signals_fetched} new signals`);
                    } catch (e) {
                      toast.error('Failed to fetch news');
                      console.error(e);
                    } finally {
                      setLoading(null);
                    }
                  }}
                  variant="outline"
                  disabled={loading === 'fetch'}
                >
                  {loading === 'fetch' ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching...</>
                  ) : (
                    <><TrendingUp className="w-4 h-4 mr-2" />Fetch News Signals</>
                  )}
                </Button>
                <Button 
                  onClick={runSniperBatch} 
                  disabled={loading === 'sniper'}
                >
                  {loading === 'sniper' ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2" />Process & Draft Emails</>
                  )}
                </Button>
              </div>

              {sniperResults?.results?.length > 0 && (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {sniperResults.results.map((result: any, i: number) => (
                      <div key={i} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.company}</span>
                          <Badge variant={result.success ? 'default' : 'destructive'}>
                            {result.success ? 'Drafted' : 'Failed'}
                          </Badge>
                        </div>
                        {result.draft?.subject_line && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Subject: {result.draft.subject_line}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {sniperResults?.signals?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Recently Fetched Signals</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {sniperResults.signals.map((signal: any, i: number) => (
                        <div key={i} className="p-3 bg-muted/30 rounded-lg border border-border">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{signal.company_name}</span>
                            <Badge variant="outline" className="text-xs">{signal.signal_type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{signal.headline}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dynamic Assets Tab */}
        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Dynamic Chart Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate visual proof assets (charts, graphs) to embed in sales conversations.
                Show the cost of inaction vs. your solution.
              </p>

              <div className="flex gap-4">
                <Button 
                  onClick={generateComparisonChart} 
                  disabled={loading === 'chart'}
                  variant="outline"
                >
                  {loading === 'chart' ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    'Generate Cost Comparison Chart'
                  )}
                </Button>
              </div>

              {generatedChart && (
                <div className="mt-4">
                  <img 
                    src={generatedChart.base64} 
                    alt="Generated Chart" 
                    className="max-w-full rounded-lg border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Right-click to save or copy this chart for use in proposals.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
