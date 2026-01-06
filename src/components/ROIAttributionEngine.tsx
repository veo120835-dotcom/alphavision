import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Link2,
  CheckCircle2,
  Clock,
  BarChart3,
  ArrowRight,
  Shield,
  AlertTriangle,
  Zap,
  Eye,
  FileText
} from 'lucide-react';

interface AttributionChain {
  id: string;
  outcome: string;
  outcomeValue: number;
  decisions: string[];
  actions: string[];
  confidence: number;
  attributedRevenue: number;
  window: number;
  timestamp: Date;
}

export function ROIAttributionEngine() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  const [attributions] = useState<AttributionChain[]>([
    {
      id: '1',
      outcome: 'Closed $15,000 consulting deal',
      outcomeValue: 15000,
      decisions: ['Pricing recommendation', 'Proposal strategy'],
      actions: ['Sales room sent', 'Follow-up sequence'],
      confidence: 0.85,
      attributedRevenue: 12750,
      window: 14,
      timestamp: new Date(Date.now() - 86400000 * 2)
    },
    {
      id: '2',
      outcome: 'Price increase implemented',
      outcomeValue: 4800,
      decisions: ['Pricing power analysis'],
      actions: ['Client notification sent'],
      confidence: 0.92,
      attributedRevenue: 4416,
      window: 7,
      timestamp: new Date(Date.now() - 86400000 * 5)
    },
    {
      id: '3',
      outcome: 'Saved $2,400 on SaaS stack',
      outcomeValue: 2400,
      decisions: ['Cost optimization analysis'],
      actions: ['Subscription cancelled', 'Alternative setup'],
      confidence: 0.98,
      attributedRevenue: 2352,
      window: 3,
      timestamp: new Date(Date.now() - 86400000 * 8)
    },
    {
      id: '4',
      outcome: 'Avoided bad client ($8k opportunity cost)',
      outcomeValue: 8000,
      decisions: ['Client quality assessment'],
      actions: ['Referral to competitor'],
      confidence: 0.72,
      attributedRevenue: 5760,
      window: 21,
      timestamp: new Date(Date.now() - 86400000 * 12)
    }
  ]);

  const stats = {
    totalAttributed: 47280,
    earned: 32166,
    saved: 8768,
    avoided: 6346,
    avgConfidence: 0.87,
    decisionsLinked: 156,
    actionsLinked: 89,
    outcomeFeeRate: 0.05,
    outcomeFeeOwed: 2364
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            ROI Attribution Engine
          </h1>
          <p className="text-muted-foreground">Track decisions → actions → outcomes with evidence</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <Button 
              key={p}
              variant={period === p ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Total Attributed</span>
            </div>
            <div className="text-3xl font-bold text-green-400">
              ${stats.totalAttributed.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {stats.avgConfidence * 100}% avg confidence
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm">Earned</span>
            </div>
            <div className="text-2xl font-bold">${stats.earned.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Revenue influenced</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm">Saved</span>
            </div>
            <div className="text-2xl font-bold">${stats.saved.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Costs reduced</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">Avoided</span>
            </div>
            <div className="text-2xl font-bold">${stats.avoided.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Losses prevented</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chains" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="chains">Attribution Chains</TabsTrigger>
          <TabsTrigger value="billing">Outcome Billing</TabsTrigger>
          <TabsTrigger value="methodology">Methodology</TabsTrigger>
        </TabsList>

        <TabsContent value="chains" className="space-y-4">
          {attributions.map((attr) => (
            <Card key={attr.id} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <h3 className="font-semibold">{attr.outcome}</h3>
                      <Badge className="bg-green-500/20 text-green-400">
                        ${attr.outcomeValue.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round((Date.now() - attr.timestamp.getTime()) / 86400000)} days ago • 
                      {attr.window}-day attribution window
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-400">
                      ${attr.attributedRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(attr.confidence * 100)}% confidence
                    </div>
                  </div>
                </div>

                {/* Attribution Chain Visualization */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-2">Decisions</div>
                      <div className="space-y-1">
                        {attr.decisions.map((d, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Target className="w-3 h-3 text-primary" />
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-2">Actions</div>
                      <div className="space-y-1">
                        {attr.actions.map((a, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-yellow-400" />
                            <span>{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-2">Outcome</div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-green-400" />
                        <span className="font-bold">${attr.outcomeValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Confidence Level</span>
                      <div className="flex items-center gap-2">
                        <Progress value={attr.confidence * 100} className="w-32 h-2" />
                        <span className="font-bold">{Math.round(attr.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View Evidence
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    Dispute
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Outcome-Based Billing</CardTitle>
              <CardDescription>
                Revenue share based on attributed outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <div className="text-muted-foreground text-sm mb-1">Outcome Fee Rate</div>
                  <div className="text-3xl font-bold">{stats.outcomeFeeRate * 100}%</div>
                  <div className="text-xs text-muted-foreground">of attributed revenue</div>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <div className="text-muted-foreground text-sm mb-1">This Period</div>
                  <div className="text-3xl font-bold">${stats.outcomeFeeOwed.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">outcome fee owed</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-lg text-center">
                  <div className="text-muted-foreground text-sm mb-1">Your Net Gain</div>
                  <div className="text-3xl font-bold text-green-400">
                    ${(stats.totalAttributed - stats.outcomeFeeOwed).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">after fees</div>
                </div>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <h4 className="font-medium mb-2">Next Invoice Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Subscription</span>
                    <span>$299.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outcome Fee (5% of $47,280)</span>
                    <span>$2,364.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Decision Credits Overage (12 × $4.99)</span>
                    <span>$59.88</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span>$2,722.88</span>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Download Attribution Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methodology" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Attribution Methodology</CardTitle>
              <CardDescription>
                How we calculate and verify attributed revenue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  title: 'Multi-Touch Attribution',
                  description: 'We use weighted multi-touch attribution with 60% to the closest executed action and 40% distributed across earlier linked decisions.',
                  icon: <Link2 className="w-5 h-5" />
                },
                {
                  title: '30-Day Default Window',
                  description: 'Outcomes are only attributed if they occur within 30 days of the related decision/action chain. Configurable per outcome type.',
                  icon: <Clock className="w-5 h-5" />
                },
                {
                  title: 'Confidence Scoring',
                  description: 'Confidence is based on completeness of the event chain, directness of causation, and historical baseline comparison.',
                  icon: <BarChart3 className="w-5 h-5" />
                },
                {
                  title: 'Incremental Lift Calculation',
                  description: 'For revenue share billing, we calculate incremental lift vs. your historical 90-day baseline to ensure you only pay for genuine agent-influenced gains.',
                  icon: <TrendingUp className="w-5 h-5" />
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{item.description}</div>
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

export default ROIAttributionEngine;
