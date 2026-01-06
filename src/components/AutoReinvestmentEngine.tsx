import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Wallet, 
  TrendingUp, 
  PieChart, 
  Shield,
  Zap,
  Target,
  DollarSign,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react';

interface AllocationBucket {
  id: string;
  name: string;
  allocation: number;
  spent: number;
  roi: number;
  autoOptimize: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface ReinvestmentDecision {
  timestamp: Date;
  from: string;
  to: string;
  amount: number;
  reason: string;
  expectedROI: number;
  status: 'executed' | 'pending' | 'blocked';
}

export function AutoReinvestmentEngine() {
  const [autoMode, setAutoMode] = useState(true);
  const [runwayProtection, setRunwayProtection] = useState([6]); // months
  const [monthlyBudget, setMonthlyBudget] = useState([8000]);

  const [buckets, setBuckets] = useState<AllocationBucket[]>([
    { id: '1', name: 'Paid Ads', allocation: 35, spent: 2450, roi: 340, autoOptimize: true, priority: 'high' },
    { id: '2', name: 'Content Creation', allocation: 25, spent: 1750, roi: 520, autoOptimize: true, priority: 'high' },
    { id: '3', name: 'Tool Stack', allocation: 15, spent: 1050, roi: 180, autoOptimize: true, priority: 'medium' },
    { id: '4', name: 'Skill Development', allocation: 15, spent: 1050, roi: 280, autoOptimize: true, priority: 'medium' },
    { id: '5', name: 'Experiments', allocation: 10, spent: 700, roi: 150, autoOptimize: true, priority: 'low' }
  ]);

  const [decisions, setDecisions] = useState<ReinvestmentDecision[]>([
    { timestamp: new Date(Date.now() - 3600000 * 2), from: 'Experiments', to: 'Content Creation', amount: 200, reason: 'Content ROI 3.5x higher than experiment performance', expectedROI: 520, status: 'executed' },
    { timestamp: new Date(Date.now() - 3600000 * 24), from: 'Tool Stack', to: 'Paid Ads', amount: 350, reason: 'High-converting ad set identified, scaling opportunity', expectedROI: 340, status: 'executed' },
    { timestamp: new Date(Date.now() - 3600000 * 48), from: 'Paid Ads', to: 'Skill Development', amount: 150, reason: 'Ad fatigue detected, reallocating to long-term asset', expectedROI: 280, status: 'executed' }
  ]);

  const stats = {
    totalBudget: 8000,
    allocated: 7000,
    reserved: 1000,
    avgROI: 294,
    autoDecisions: 23,
    savedFromWaste: 2400,
    runwayMonths: 9.2
  };

  const getPriorityColor = (priority: AllocationBucket['priority']) => {
    switch (priority) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-muted-foreground';
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            Auto-Reinvestment Engine
          </h1>
          <p className="text-muted-foreground">Intelligent capital allocation that compounds while you sleep</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Auto-Allocate</span>
            <Switch checked={autoMode} onCheckedChange={setAutoMode} />
          </div>
          <Badge className={autoMode ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}>
            {autoMode ? 'Engine Active' : 'Manual Mode'}
          </Badge>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">${stats.totalBudget.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Monthly Budget</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-400" />
            <div className="text-2xl font-bold">{stats.avgROI}%</div>
            <div className="text-xs text-muted-foreground">Avg ROI</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
            <div className="text-2xl font-bold">{stats.autoDecisions}</div>
            <div className="text-xs text-muted-foreground">Auto Decisions</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <div className="text-2xl font-bold">${stats.savedFromWaste.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Saved from Waste</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <Lock className="w-5 h-5 mx-auto mb-1 text-green-400" />
            <div className="text-2xl font-bold text-green-400">{stats.runwayMonths}</div>
            <div className="text-xs text-muted-foreground">Runway Protected</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="allocation" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="allocation">Capital Allocation</TabsTrigger>
          <TabsTrigger value="decisions">Recent Decisions</TabsTrigger>
          <TabsTrigger value="protection">Runway Protection</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunity Scanner</TabsTrigger>
        </TabsList>

        <TabsContent value="allocation" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Investment Buckets
              </CardTitle>
              <CardDescription>
                How your capital is distributed and performing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {buckets.map((bucket) => (
                <div key={bucket.id} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        bucket.priority === 'high' ? 'bg-green-400' :
                        bucket.priority === 'medium' ? 'bg-yellow-400' : 'bg-muted-foreground'
                      }`} />
                      <div>
                        <div className="font-medium">{bucket.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ${bucket.spent.toLocaleString()} / ${(stats.totalBudget * bucket.allocation / 100).toLocaleString()} allocated
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">{bucket.roi}% ROI</div>
                        <div className="text-xs text-muted-foreground">{bucket.allocation}% of budget</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Auto</span>
                        <Switch 
                          checked={bucket.autoOptimize}
                          onCheckedChange={(checked) => {
                            setBuckets(buckets.map(b => 
                              b.id === bucket.id ? {...b, autoOptimize: checked} : b
                            ));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <Progress value={(bucket.spent / (stats.totalBudget * bucket.allocation / 100)) * 100} className="h-2" />
                </div>
              ))}

              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  <span className="font-medium">Auto-Rebalancing</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Next optimization in 6 hours based on performance data
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Reinvestment Decision Log</CardTitle>
              <CardDescription>Automated capital reallocation decisions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {decisions.map((decision, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex-shrink-0">
                    {decision.status === 'executed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : decision.status === 'pending' ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-red-400">{decision.from}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="text-green-400">{decision.to}</span>
                      <Badge variant="outline">${decision.amount}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {decision.reason}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {Math.round((Date.now() - decision.timestamp.getTime()) / 3600000)}h ago • 
                      Expected ROI: {decision.expectedROI}%
                    </div>
                  </div>
                  <Badge className={
                    decision.status === 'executed' ? 'bg-green-500/20 text-green-400' :
                    decision.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }>
                    {decision.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protection" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Runway Protection Settings
              </CardTitle>
              <CardDescription>
                The engine will never invest below your safety threshold
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Minimum Runway Reserve</span>
                  <span className="text-2xl font-bold text-blue-400">{runwayProtection[0]} months</span>
                </div>
                <Slider
                  value={runwayProtection}
                  onValueChange={setRunwayProtection}
                  max={18}
                  min={3}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  The engine will automatically reduce spending if runway drops below this threshold
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Monthly Investment Cap</span>
                  <span className="text-2xl font-bold">${monthlyBudget[0].toLocaleString()}</span>
                </div>
                <Slider
                  value={monthlyBudget}
                  onValueChange={setMonthlyBudget}
                  max={25000}
                  min={1000}
                  step={500}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Maximum amount the engine can allocate per month across all buckets
                </p>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-green-400" />
                  <span className="font-medium text-green-400">Protection Active</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your current runway is <span className="font-bold">9.2 months</span>. 
                  The engine is operating at full capacity. If runway drops below {runwayProtection[0]} months, 
                  spending will automatically reduce.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-400" />
                Opportunity Scanner
              </CardTitle>
              <CardDescription>
                Asymmetric bets identified by the engine
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { 
                  opportunity: 'Scale winning ad set #42', 
                  investment: 500, 
                  expectedReturn: 2400, 
                  risk: 'low',
                  reasoning: 'CTR 3x above average, conversion rate stable'
                },
                { 
                  opportunity: 'New content format test', 
                  investment: 200, 
                  expectedReturn: 800, 
                  risk: 'medium',
                  reasoning: 'Competitor seeing 40% engagement lift'
                },
                { 
                  opportunity: 'Tool automation upgrade', 
                  investment: 150, 
                  expectedReturn: 450, 
                  risk: 'low',
                  reasoning: 'Will save 8 hours/week at current wage'
                }
              ].map((opp, idx) => (
                <div key={idx} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">{opp.opportunity}</div>
                      <div className="text-sm text-muted-foreground mt-1">{opp.reasoning}</div>
                    </div>
                    <Badge className={
                      opp.risk === 'low' ? 'bg-green-500/20 text-green-400' :
                      opp.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }>
                      {opp.risk} risk
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Invest: <span className="text-primary font-bold">${opp.investment}</span></span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="text-muted-foreground">Expected: <span className="text-green-400 font-bold">${opp.expectedReturn}</span></span>
                      <span className="text-muted-foreground">({Math.round((opp.expectedReturn / opp.investment - 1) * 100)}% ROI)</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Reject</Button>
                      <Button size="sm" className="bg-primary">Approve</Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AutoReinvestmentEngine;
