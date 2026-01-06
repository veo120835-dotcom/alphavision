import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Zap,
  Clock,
  Users,
  Target,
  Gift,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';

interface PricingRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
  timesTriggered: number;
  revenueImpact: number;
}

interface Offer {
  id: string;
  name: string;
  basePrice: number;
  currentPrice: number;
  priceChange: number;
  demand: 'high' | 'medium' | 'low';
  capacity: number;
  bonuses: string[];
}

export function DynamicPricingAgent() {
  const [autoMode, setAutoMode] = useState(true);
  const [priceFloor, setPriceFloor] = useState([2500]);
  const [priceCeiling, setPriceCeiling] = useState([15000]);

  const [offers, setOffers] = useState<Offer[]>([
    {
      id: '1',
      name: 'Core Consulting Package',
      basePrice: 5000,
      currentPrice: 6500,
      priceChange: 30,
      demand: 'high',
      capacity: 65,
      bonuses: ['Priority Support', '2 Extra Calls']
    },
    {
      id: '2',
      name: 'Premium Advisory Retainer',
      basePrice: 8000,
      currentPrice: 8000,
      priceChange: 0,
      demand: 'medium',
      capacity: 40,
      bonuses: []
    },
    {
      id: '3',
      name: 'VIP Implementation Sprint',
      basePrice: 12000,
      currentPrice: 10800,
      priceChange: -10,
      demand: 'low',
      capacity: 20,
      bonuses: ['30-Day Guarantee', 'Free Audit']
    }
  ]);

  const [rules, setRules] = useState<PricingRule[]>([
    { id: '1', name: 'Demand Surge', trigger: 'Capacity drops below 30%', action: 'Increase price 15%', active: true, timesTriggered: 8, revenueImpact: 12400 },
    { id: '2', name: 'Objection Cluster', trigger: '3+ price objections in 24h', action: 'Add bonus instead of discount', active: true, timesTriggered: 14, revenueImpact: 4200 },
    { id: '3', name: 'Low Demand Alert', trigger: 'No inquiries in 48h', action: 'Add urgency bonus', active: true, timesTriggered: 5, revenueImpact: 8500 },
    { id: '4', name: 'Premium Buyer', trigger: 'Enterprise company detected', action: 'Show enterprise pricing', active: true, timesTriggered: 3, revenueImpact: 21000 },
    { id: '5', name: 'Returning Visitor', trigger: 'Visited pricing 3+ times', action: 'Unlock limited offer', active: true, timesTriggered: 22, revenueImpact: 6800 }
  ]);

  const stats = {
    priceOptimizations: 47,
    revenueIncrease: 23,
    avgDealSize: 7840,
    previousAvg: 5200,
    automatedDecisions: 156,
    humanOverrides: 4
  };

  const getDemandColor = (demand: Offer['demand']) => {
    switch (demand) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-red-400';
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Dynamic Offer & Pricing Agent
          </h1>
          <p className="text-muted-foreground">AI-powered pricing that adjusts based on demand signals</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Auto Mode</span>
            <Switch checked={autoMode} onCheckedChange={setAutoMode} />
          </div>
          <Badge className={autoMode ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}>
            {autoMode ? 'Agent Active' : 'Manual Mode'}
          </Badge>
        </div>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Revenue Impact</span>
            </div>
            <div className="text-2xl font-bold">+{stats.revenueIncrease}%</div>
            <div className="text-sm text-muted-foreground">
              vs static pricing
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Avg Deal Size</span>
            </div>
            <div className="text-2xl font-bold">${stats.avgDealSize.toLocaleString()}</div>
            <div className="text-sm text-green-400">
              +${(stats.avgDealSize - stats.previousAvg).toLocaleString()} vs before
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-sm">Auto Decisions</span>
            </div>
            <div className="text-2xl font-bold">{stats.automatedDecisions}</div>
            <div className="text-sm text-muted-foreground">
              {stats.humanOverrides} manual overrides
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Optimizations</span>
            </div>
            <div className="text-2xl font-bold">{stats.priceOptimizations}</div>
            <div className="text-sm text-muted-foreground">
              this month
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="offers" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="offers">Live Offers</TabsTrigger>
          <TabsTrigger value="rules">Pricing Rules</TabsTrigger>
          <TabsTrigger value="bounds">Price Bounds</TabsTrigger>
          <TabsTrigger value="history">Decision Log</TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-4">
          {offers.map((offer) => (
            <Card key={offer.id} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{offer.name}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Base:</span>
                        <span className="line-through text-muted-foreground">${offer.basePrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Current:</span>
                        <span className="text-xl font-bold">${offer.currentPrice.toLocaleString()}</span>
                        {offer.priceChange !== 0 && (
                          <Badge className={offer.priceChange > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                            {offer.priceChange > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {offer.priceChange > 0 ? '+' : ''}{offer.priceChange}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Override Price</Button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Demand Signal</div>
                    <div className={`font-bold flex items-center gap-1 ${getDemandColor(offer.demand)}`}>
                      {offer.demand === 'high' ? <TrendingUp className="w-4 h-4" /> : 
                       offer.demand === 'low' ? <TrendingDown className="w-4 h-4" /> : null}
                      {offer.demand.charAt(0).toUpperCase() + offer.demand.slice(1)}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Capacity Used</div>
                    <div className="space-y-1">
                      <div className="font-bold">{offer.capacity}%</div>
                      <Progress value={offer.capacity} className="h-1.5" />
                    </div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Active Bonuses</div>
                    <div className="flex flex-wrap gap-1">
                      {offer.bonuses.length > 0 ? (
                        offer.bonuses.map((bonus, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <Gift className="w-3 h-3 mr-1" />
                            {bonus}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </div>
                  </div>
                </div>

                {autoMode && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/20 rounded">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span>
                      {offer.demand === 'high' 
                        ? 'Price increased due to high demand and limited capacity'
                        : offer.demand === 'low'
                        ? 'Bonus added to increase conversions without lowering price'
                        : 'Monitoring for optimization opportunities'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Active Pricing Rules</CardTitle>
              <CardDescription>Automated triggers that adjust pricing and bonuses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Switch 
                      checked={rule.active}
                      onCheckedChange={(checked) => {
                        setRules(rules.map(r => 
                          r.id === rule.id ? {...r, active: checked} : r
                        ));
                      }}
                    />
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-muted-foreground">
                        <span className="text-yellow-400">When:</span> {rule.trigger}
                        <span className="mx-2">→</span>
                        <span className="text-green-400">Then:</span> {rule.action}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-400">+${rule.revenueImpact.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      Triggered {rule.timesTriggered}x
                    </div>
                  </div>
                </div>
              ))}

              <Button className="w-full" variant="outline">
                <Zap className="w-4 h-4 mr-2" />
                Add Custom Rule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bounds" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Price Boundaries
              </CardTitle>
              <CardDescription>
                The agent will never price below floor or above ceiling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Price Floor</span>
                  <span className="text-2xl font-bold text-red-400">${priceFloor[0].toLocaleString()}</span>
                </div>
                <Slider
                  value={priceFloor}
                  onValueChange={setPriceFloor}
                  max={10000}
                  min={500}
                  step={100}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Even with low demand, prices will never drop below this amount
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Price Ceiling</span>
                  <span className="text-2xl font-bold text-green-400">${priceCeiling[0].toLocaleString()}</span>
                </div>
                <Slider
                  value={priceCeiling}
                  onValueChange={setPriceCeiling}
                  max={50000}
                  min={5000}
                  step={500}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Even with high demand, prices will never exceed this amount
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Current Range Analysis</h4>
                <div className="text-sm text-muted-foreground">
                  Your pricing range allows for <span className="text-primary font-bold">
                    {Math.round((priceCeiling[0] / priceFloor[0] - 1) * 100)}%
                  </span> dynamic adjustment. The agent will optimize within this band based on 
                  real-time demand, capacity, and buyer signals.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Pricing Decision Log</CardTitle>
              <CardDescription>Recent automated pricing decisions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { time: '2h ago', action: 'Price increased 15% on Core Package', reason: 'Capacity dropped to 28%', impact: '+$975 per sale' },
                { time: '5h ago', action: 'Added "Priority Support" bonus', reason: '2 price objections in 3h', impact: 'Maintained price, closed deal' },
                { time: '12h ago', action: 'Unlocked limited offer for visitor', reason: 'Returned to pricing page 4 times', impact: 'Converted at $6,500' },
                { time: '1d ago', action: 'Price reduced 10% on VIP Sprint', reason: 'No inquiries for 52 hours', impact: '2 new leads generated' },
                { time: '2d ago', action: 'Enterprise pricing shown', reason: 'Fortune 500 company detected', impact: 'Closed at $18,000' }
              ].map((log, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="w-20 text-xs text-muted-foreground">{log.time}</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{log.action}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="text-yellow-400">Trigger:</span> {log.reason}
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">
                    {log.impact}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DynamicPricingAgent;
