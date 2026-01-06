import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Zap, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Lock,
  Unlock,
  ArrowUpRight
} from 'lucide-react';

interface DecisionCredit {
  tier: 'advisor' | 'operator' | 'autopilot';
  monthlyAllocation: number;
  used: number;
  remaining: number;
  overageRate: number;
  overageUsed: number;
}

export function DecisionBillingSystem() {
  const [credits] = useState<DecisionCredit>({
    tier: 'operator',
    monthlyAllocation: 150,
    used: 127,
    remaining: 23,
    overageRate: 4.99,
    overageUsed: 12
  });

  const [recentDecisions] = useState([
    { id: '1', type: 'Strategic', title: 'Pricing restructure analysis', credits: 3, value: 'High', timestamp: new Date(Date.now() - 3600000) },
    { id: '2', type: 'Tactical', title: 'Lead qualification assessment', credits: 1, value: 'Medium', timestamp: new Date(Date.now() - 7200000) },
    { id: '3', type: 'Operational', title: 'Content calendar optimization', credits: 1, value: 'Medium', timestamp: new Date(Date.now() - 14400000) },
    { id: '4', type: 'Strategic', title: 'Client portfolio rebalancing', credits: 3, value: 'High', timestamp: new Date(Date.now() - 28800000) },
    { id: '5', type: 'Premium', title: 'M&A opportunity evaluation', credits: 10, value: 'Critical', timestamp: new Date(Date.now() - 86400000) }
  ]);

  const tiers = [
    {
      name: 'Advisor',
      price: 99,
      credits: 50,
      features: ['Basic recommendations', 'Manual execution only', 'Email support'],
      current: credits.tier === 'advisor'
    },
    {
      name: 'Operator',
      price: 299,
      credits: 150,
      features: ['Advanced analysis', 'Semi-automated actions', 'Priority support', 'Action queue'],
      current: credits.tier === 'operator'
    },
    {
      name: 'Autopilot',
      price: 999,
      credits: 500,
      features: ['Full autonomy', 'Auto-execution', 'Dedicated support', 'Custom integrations', 'Unlimited rollback'],
      current: credits.tier === 'autopilot'
    }
  ];

  const stats = {
    thisMonth: {
      decisions: 42,
      creditsUsed: 127,
      valueGenerated: 34500,
      avgCreditsPerDecision: 3.0
    },
    billing: {
      base: 299,
      overage: credits.overageUsed * credits.overageRate,
      total: 299 + (credits.overageUsed * credits.overageRate)
    }
  };

  const getValueColor = (value: string) => {
    switch (value) {
      case 'Critical': return 'bg-purple-500/20 text-purple-400';
      case 'High': return 'bg-green-500/20 text-green-400';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Decision Credits & Billing
          </h1>
          <p className="text-muted-foreground">Pay per decision, not per seat — aligned incentives</p>
        </div>
        <Badge className="bg-primary/20 text-primary text-lg px-4 py-2 capitalize">
          {credits.tier} Mode
        </Badge>
      </div>

      {/* Credit Usage */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Monthly Credits</h3>
              <p className="text-muted-foreground text-sm">Resets in 12 days</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                <span className="text-primary">{credits.remaining}</span>
                <span className="text-muted-foreground">/{credits.monthlyAllocation}</span>
              </div>
              <div className="text-sm text-muted-foreground">credits remaining</div>
            </div>
          </div>
          <Progress value={(credits.used / credits.monthlyAllocation) * 100} className="h-3 mb-4" />
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Used: <span className="font-bold text-foreground">{credits.used}</span></span>
              {credits.overageUsed > 0 && (
                <span className="text-yellow-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {credits.overageUsed} overage @ ${credits.overageRate}/each
                </span>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Zap className="w-4 h-4 mr-1" />
              Buy More Credits
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
            <div className="text-2xl font-bold">{stats.thisMonth.decisions}</div>
            <div className="text-xs text-muted-foreground">Decisions This Month</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-400" />
            <div className="text-2xl font-bold text-green-400">${stats.thisMonth.valueGenerated.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Value Generated</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <div className="text-2xl font-bold">{stats.thisMonth.avgCreditsPerDecision}</div>
            <div className="text-xs text-muted-foreground">Avg Credits/Decision</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">${Math.round(stats.thisMonth.valueGenerated / credits.used)}</div>
            <div className="text-xs text-muted-foreground">ROI Per Credit</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="usage">Credit Usage</TabsTrigger>
          <TabsTrigger value="tiers">Autonomy Tiers</TabsTrigger>
          <TabsTrigger value="billing">Billing Details</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Recent Decisions</CardTitle>
              <CardDescription>Credits consumed per decision based on complexity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentDecisions.map((decision) => (
                <div key={decision.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{decision.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{decision.type}</Badge>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        {Math.round((Date.now() - decision.timestamp.getTime()) / 3600000)}h ago
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getValueColor(decision.value)}>{decision.value}</Badge>
                    <div className="text-right">
                      <div className="font-bold">{decision.credits} credits</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Credit Pricing by Decision Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { type: 'Operational', credits: 1, examples: 'Status updates, simple queries' },
                  { type: 'Tactical', credits: 2, examples: 'Lead scoring, content optimization' },
                  { type: 'Strategic', credits: 5, examples: 'Pricing, hiring, positioning' },
                  { type: 'Premium', credits: 15, examples: 'M&A, major pivots, fundraising' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-muted/30 rounded-lg">
                    <div className="font-medium">{item.type}</div>
                    <div className="text-2xl font-bold text-primary my-2">{item.credits}</div>
                    <div className="text-xs text-muted-foreground">{item.examples}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {tiers.map((tier, idx) => (
              <Card 
                key={idx} 
                className={`bg-card/50 border-border/50 ${tier.current ? 'ring-2 ring-primary' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {tier.name === 'Advisor' && <Lock className="w-5 h-5" />}
                      {tier.name === 'Operator' && <Unlock className="w-5 h-5" />}
                      {tier.name === 'Autopilot' && <Zap className="w-5 h-5" />}
                      {tier.name}
                    </CardTitle>
                    {tier.current && <Badge className="bg-primary">Current</Badge>}
                  </div>
                  <CardDescription>
                    <span className="text-3xl font-bold">${tier.price}</span>/month
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{tier.credits}</div>
                    <div className="text-xs text-muted-foreground">credits/month</div>
                  </div>
                  <div className="space-y-2">
                    {tier.features.map((feature, fidx) => (
                      <div key={fidx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full" 
                    variant={tier.current ? 'outline' : 'default'}
                    disabled={tier.current}
                  >
                    {tier.current ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Upgrade Recommendation</div>
                  <div className="text-sm text-muted-foreground">
                    Based on your usage pattern, upgrading to <span className="text-primary font-bold">Autopilot</span> would 
                    save you ${(credits.overageUsed * credits.overageRate * 12).toFixed(0)}/year in overage fees.
                  </div>
                </div>
                <Button>View Upgrade</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Current Invoice Preview</CardTitle>
              <CardDescription>Billing period: Dec 4 - Jan 3</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span>Base subscription ({credits.tier})</span>
                  <span className="font-bold">${stats.billing.base.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span>Overage credits ({credits.overageUsed} × ${credits.overageRate})</span>
                  <span className="font-bold">${stats.billing.overage.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary">${stats.billing.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button variant="outline">Download Invoice</Button>
                <Button variant="outline">Update Payment Method</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DecisionBillingSystem;
