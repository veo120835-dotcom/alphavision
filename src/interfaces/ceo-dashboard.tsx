import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  DollarSign,
  Users,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Priority {
  id: string;
  title: string;
  description: string;
  impact: 'critical' | 'high' | 'medium';
  category: 'revenue' | 'growth' | 'operations' | 'risk';
  estimatedValue?: number;
  timeToComplete?: string;
  actionItems: string[];
}

interface RevenueRisk {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'watch';
  potentialLoss: number;
  probability: number;
  mitigation: string;
  deadline?: string;
}

interface GrowthOpportunity {
  id: string;
  title: string;
  description: string;
  potentialValue: number;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  confidence: number;
}

interface AdvisorRecommendation {
  id: string;
  category: 'strategic' | 'tactical' | 'warning' | 'opportunity';
  title: string;
  insight: string;
  action: string;
  priority: number;
}

interface CEODashboardData {
  todaysPriority: Priority | null;
  upcomingPriorities: Priority[];
  revenueRisks: RevenueRisk[];
  growthOpportunities: GrowthOpportunity[];
  advisorRecommendations: AdvisorRecommendation[];
  metrics: {
    revenueAtRisk: number;
    recoveredRevenue: number;
    pipelineValue: number;
    conversionRate: number;
    healthScore: number;
  };
}

export function CEODashboard() {
  const [data, setData] = useState<CEODashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    // Simulated data load - in production, this would fetch from backend
    const mockData: CEODashboardData = {
      todaysPriority: {
        id: '1',
        title: 'Follow up with Enterprise Lead',
        description: 'High-value prospect showing buying signals. Response within 2 hours increases close rate by 40%.',
        impact: 'critical',
        category: 'revenue',
        estimatedValue: 125000,
        timeToComplete: '30 min',
        actionItems: [
          'Review previous conversation context',
          'Prepare personalized value proposition',
          'Schedule discovery call'
        ]
      },
      upcomingPriorities: [
        {
          id: '2',
          title: 'Address Churn Risk - Acme Corp',
          description: 'Usage dropped 60% this month. Proactive outreach recommended.',
          impact: 'high',
          category: 'risk',
          estimatedValue: 48000,
          timeToComplete: '1 hour',
          actionItems: ['Review usage patterns', 'Prepare retention offer']
        },
        {
          id: '3',
          title: 'Optimize Pricing Page',
          description: 'A/B test shows 23% higher conversion with simplified tiers.',
          impact: 'medium',
          category: 'growth',
          estimatedValue: 15000,
          timeToComplete: '2 hours',
          actionItems: ['Review test data', 'Approve new design']
        }
      ],
      revenueRisks: [
        {
          id: 'r1',
          title: 'Contract Renewal at Risk',
          severity: 'critical',
          potentialLoss: 240000,
          probability: 0.65,
          mitigation: 'Executive sponsor meeting + custom success plan',
          deadline: '2024-02-15'
        },
        {
          id: 'r2',
          title: 'Competitor Pressure on Mid-Market',
          severity: 'warning',
          potentialLoss: 180000,
          probability: 0.40,
          mitigation: 'Feature parity analysis + value messaging refresh'
        },
        {
          id: 'r3',
          title: 'Payment Method Expiring',
          severity: 'watch',
          potentialLoss: 12000,
          probability: 0.80,
          mitigation: 'Automated reminder sequence'
        }
      ],
      growthOpportunities: [
        {
          id: 'g1',
          title: 'Upsell Enterprise Tier',
          description: '12 accounts showing enterprise usage patterns on growth plans',
          potentialValue: 360000,
          effort: 'low',
          timeframe: 'Q1',
          confidence: 0.75
        },
        {
          id: 'g2',
          title: 'Partner Channel Expansion',
          description: 'Agency partner program could add 30% new business',
          potentialValue: 500000,
          effort: 'medium',
          timeframe: 'Q2',
          confidence: 0.60
        },
        {
          id: 'g3',
          title: 'Geographic Expansion - EMEA',
          description: 'Organic demand signals from UK, Germany, France',
          potentialValue: 800000,
          effort: 'high',
          timeframe: 'H2',
          confidence: 0.45
        }
      ],
      advisorRecommendations: [
        {
          id: 'a1',
          category: 'strategic',
          title: 'Focus on Net Revenue Retention',
          insight: 'Your NRR of 105% is below top-quartile (120%+). Expansion revenue is your biggest lever.',
          action: 'Launch customer success-led expansion motion',
          priority: 1
        },
        {
          id: 'a2',
          category: 'warning',
          title: 'Sales Cycle Lengthening',
          insight: 'Average deal cycle increased 18% last quarter. May indicate market hesitation or qualification issues.',
          action: 'Review top-of-funnel qualification criteria',
          priority: 2
        },
        {
          id: 'a3',
          category: 'opportunity',
          title: 'Underutilized Content Assets',
          insight: 'Your case studies convert 3x better but are shown to only 12% of prospects.',
          action: 'Integrate social proof earlier in sales process',
          priority: 3
        },
        {
          id: 'a4',
          category: 'tactical',
          title: 'Optimize Demo-to-Close',
          insight: 'Demo completion rate is 78% but close rate is only 23%. Gap indicates objection handling opportunity.',
          action: 'Implement post-demo objection capture and response system',
          priority: 4
        }
      ],
      metrics: {
        revenueAtRisk: 432000,
        recoveredRevenue: 156000,
        pipelineValue: 2400000,
        conversionRate: 0.23,
        healthScore: 72
      }
    };

    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 500);
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'warning': return 'text-orange-500';
      case 'watch': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strategic': return <Target className="h-4 w-4" />;
      case 'tactical': return <Zap className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">CEO Command Center</h1>
            <p className="text-muted-foreground">Your strategic overview for today</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Business Health</div>
              <div className="text-2xl font-bold text-foreground">{data.metrics.healthScore}%</div>
            </div>
            <Progress value={data.metrics.healthScore} className="w-24 h-3" />
          </div>
        </div>

        {/* Today's Priority - Hero Card */}
        {data.todaysPriority && (
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Today's #1 Priority</CardTitle>
                </div>
                <Badge className={getImpactColor(data.todaysPriority.impact)}>
                  {data.todaysPriority.impact.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{data.todaysPriority.title}</h3>
                <p className="text-muted-foreground">{data.todaysPriority.description}</p>
              </div>
              <div className="flex items-center gap-6">
                {data.todaysPriority.estimatedValue && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{formatCurrency(data.todaysPriority.estimatedValue)}</span>
                    <span className="text-muted-foreground text-sm">potential value</span>
                  </div>
                )}
                {data.todaysPriority.timeToComplete && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{data.todaysPriority.timeToComplete}</span>
                  </div>
                )}
              </div>
              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-2">Action Items:</div>
                <ul className="space-y-1">
                  {data.todaysPriority.actionItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Button className="w-full">
                Take Action <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue at Risk</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(data.metrics.revenueAtRisk)}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recovered This Month</p>
                  <p className="text-2xl font-bold text-green-500">{formatCurrency(data.metrics.recoveredRevenue)}</p>
                </div>
                <Shield className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pipeline Value</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(data.metrics.pipelineValue)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold text-foreground">{(data.metrics.conversionRate * 100).toFixed(1)}%</p>
                </div>
                <Users className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="risks">Revenue Risks</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="advisor">Advisor</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upcoming Priorities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Upcoming Priorities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.upcomingPriorities.map((priority) => (
                    <div key={priority.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{priority.title}</h4>
                        <Badge variant="outline" className={getImpactColor(priority.impact)}>
                          {priority.impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{priority.description}</p>
                      {priority.estimatedValue && (
                        <div className="text-sm text-green-500">
                          {formatCurrency(priority.estimatedValue)} potential
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Advisor Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Strategic Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.advisorRecommendations.slice(0, 3).map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(rec.category)}
                        <h4 className="font-medium">{rec.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.insight}</p>
                      <div className="text-sm text-primary flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" />
                        {rec.action}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="risks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Revenue Risks
                </CardTitle>
                <CardDescription>
                  Active threats to your revenue that require attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.revenueRisks.map((risk) => (
                  <div key={risk.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className={`h-5 w-5 ${getSeverityColor(risk.severity)}`} />
                        <h4 className="font-medium">{risk.title}</h4>
                      </div>
                      <Badge variant="outline" className={getSeverityColor(risk.severity)}>
                        {risk.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Potential Loss: </span>
                        <span className="font-medium text-destructive">{formatCurrency(risk.potentialLoss)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Probability: </span>
                        <span className="font-medium">{(risk.probability * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Mitigation: </span>
                      <span>{risk.mitigation}</span>
                    </div>
                    {risk.deadline && (
                      <div className="text-sm text-orange-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Deadline: {risk.deadline}
                      </div>
                    )}
                    <Button variant="outline" size="sm">Address Risk</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Growth Opportunities
                </CardTitle>
                <CardDescription>
                  High-potential growth levers identified for your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.growthOpportunities.map((opp) => (
                  <div key={opp.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{opp.title}</h4>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        {formatCurrency(opp.potentialValue)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{opp.description}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Effort: </span>
                        <span className="font-medium capitalize">{opp.effort}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Timeframe: </span>
                        <span className="font-medium">{opp.timeframe}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confidence: </span>
                        <span className="font-medium">{(opp.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <Progress value={opp.confidence * 100} className="h-2" />
                    <Button variant="outline" size="sm">Explore Opportunity</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advisor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Strategic Advisor
                </CardTitle>
                <CardDescription>
                  AI-powered recommendations based on your business data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.advisorRecommendations.map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(rec.category)}
                        <h4 className="font-medium">{rec.title}</h4>
                      </div>
                      <Badge variant="outline" className="capitalize">{rec.category}</Badge>
                    </div>
                    <div className="bg-muted/50 p-3 rounded text-sm">
                      <span className="font-medium">Insight: </span>
                      {rec.insight}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-primary">Recommended Action: </span>
                      {rec.action}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">Take Action</Button>
                      <Button variant="ghost" size="sm">Dismiss</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default CEODashboard;
