/**
 * Revenue Command Center
 * Executive dashboard for revenue intelligence and performance monitoring
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Brain,
  Sparkles
} from 'lucide-react';

// Types
interface RevenueMetrics {
  totalRecovered: number;
  recoveredThisMonth: number;
  recoveryRate: number;
  avgDealSize: number;
  leadsResurrected: number;
  conversionLift: number;
  ltvIncrease: number;
  personalizationImpact: number;
}

interface LeadStatus {
  id: string;
  name: string;
  company: string;
  stage: 'cooling' | 'dormant' | 'deep_dormant' | 'hibernating' | 'fossilized';
  reactivationPotential: number;
  lastContact: Date;
  estimatedValue: number;
  recommendedAction: string;
}

interface StrategicInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedAction?: string;
}

interface WinPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  applicableSegments: string[];
}

// Mock data generator
const generateMockMetrics = (): RevenueMetrics => ({
  totalRecovered: 847500,
  recoveredThisMonth: 125000,
  recoveryRate: 0.34,
  avgDealSize: 12500,
  leadsResurrected: 68,
  conversionLift: 0.23,
  ltvIncrease: 0.31,
  personalizationImpact: 0.42
});

const generateMockLeads = (): LeadStatus[] => [
  {
    id: '1',
    name: 'Sarah Chen',
    company: 'TechFlow Inc',
    stage: 'dormant',
    reactivationPotential: 0.78,
    lastContact: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    estimatedValue: 35000,
    recommendedAction: 'Send value reminder with recent case study'
  },
  {
    id: '2',
    name: 'Michael Torres',
    company: 'GrowthLabs',
    stage: 'cooling',
    reactivationPotential: 0.92,
    lastContact: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    estimatedValue: 28000,
    recommendedAction: 'Soft check-in about timeline concerns'
  },
  {
    id: '3',
    name: 'Emily Watson',
    company: 'ScaleUp Co',
    stage: 'deep_dormant',
    reactivationPotential: 0.45,
    lastContact: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    estimatedValue: 52000,
    recommendedAction: 'Pattern interrupt email with new angle'
  },
  {
    id: '4',
    name: 'David Kim',
    company: 'Innovate Partners',
    stage: 'hibernating',
    reactivationPotential: 0.28,
    lastContact: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    estimatedValue: 18000,
    recommendedAction: 'Relationship rebuild approach'
  }
];

const generateMockInsights = (): StrategicInsight[] => [
  {
    id: '1',
    type: 'opportunity',
    title: 'High-value segment underserved',
    description: 'Enterprise clients in fintech showing 3x higher conversion with personalized outreach',
    impact: 'high',
    actionable: true,
    suggestedAction: 'Prioritize enterprise fintech leads for immediate outreach'
  },
  {
    id: '2',
    type: 'risk',
    title: 'Trust objection pattern emerging',
    description: '34% increase in trust-related objections from SaaS segment',
    impact: 'medium',
    actionable: true,
    suggestedAction: 'Deploy social proof campaign targeting SaaS leads'
  },
  {
    id: '3',
    type: 'recommendation',
    title: 'Optimal contact timing identified',
    description: 'Tuesday 10-11am shows 47% higher response rates',
    impact: 'medium',
    actionable: true,
    suggestedAction: 'Reschedule outreach campaigns to Tuesday mornings'
  }
];

const generateMockPatterns = (): WinPattern[] => [
  {
    pattern: 'Social proof + specific ROI in first message',
    frequency: 156,
    successRate: 0.42,
    applicableSegments: ['SaaS', 'Agencies']
  },
  {
    pattern: 'Soft check-in after 7-day silence',
    frequency: 89,
    successRate: 0.38,
    applicableSegments: ['All']
  },
  {
    pattern: 'Direct ask with binary choice',
    frequency: 67,
    successRate: 0.51,
    applicableSegments: ['Enterprise', 'Executives']
  }
];

// Components
const MetricCard: React.FC<{
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  description?: string;
}> = ({ title, value, change, icon, description }) => (
  <Card className="bg-card border-border">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {Math.abs(change)}%
        </div>
      </div>
      {description && (
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      )}
    </CardContent>
  </Card>
);

const LeadCard: React.FC<{ lead: LeadStatus }> = ({ lead }) => {
  const stageColors: Record<LeadStatus['stage'], string> = {
    cooling: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    dormant: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    deep_dormant: 'bg-red-500/10 text-red-500 border-red-500/20',
    hibernating: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    fossilized: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  };

  const formatDate = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-foreground">{lead.name}</h4>
            <p className="text-sm text-muted-foreground">{lead.company}</p>
          </div>
          <Badge variant="outline" className={stageColors[lead.stage]}>
            {lead.stage.replace('_', ' ')}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Reactivation Potential</span>
            <span className="font-medium text-foreground">{Math.round(lead.reactivationPotential * 100)}%</span>
          </div>
          <Progress value={lead.reactivationPotential * 100} className="h-2" />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last Contact
            </span>
            <span className="text-foreground">{formatDate(lead.lastContact)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Est. Value
            </span>
            <span className="font-medium text-foreground">${lead.estimatedValue.toLocaleString()}</span>
          </div>
          
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Recommended Action:</p>
            <p className="text-sm text-foreground">{lead.recommendedAction}</p>
          </div>
          
          <Button size="sm" className="w-full mt-2">
            <Zap className="h-4 w-4 mr-2" />
            Execute Strategy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const InsightCard: React.FC<{ insight: StrategicInsight }> = ({ insight }) => {
  const typeStyles = {
    opportunity: { icon: <TrendingUp className="h-4 w-4" />, color: 'text-green-500', bg: 'bg-green-500/10' },
    risk: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-500', bg: 'bg-red-500/10' },
    recommendation: { icon: <Sparkles className="h-4 w-4" />, color: 'text-blue-500', bg: 'bg-blue-500/10' }
  };

  const style = typeStyles[insight.type];

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${style.bg} ${style.color}`}>
            {style.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-foreground">{insight.title}</h4>
              <Badge variant={insight.impact === 'high' ? 'default' : 'secondary'}>
                {insight.impact} impact
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
            {insight.actionable && insight.suggestedAction && (
              <Button size="sm" variant="outline" className="w-full">
                {insight.suggestedAction}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PatternCard: React.FC<{ pattern: WinPattern }> = ({ pattern }) => (
  <Card className="bg-card border-border">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-foreground">{pattern.pattern}</h4>
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          {Math.round(pattern.successRate * 100)}% success
        </Badge>
      </div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-muted-foreground">Used {pattern.frequency} times</span>
        <div className="flex gap-1">
          {pattern.applicableSegments.map(segment => (
            <Badge key={segment} variant="secondary" className="text-xs">
              {segment}
            </Badge>
          ))}
        </div>
      </div>
      <Progress value={pattern.successRate * 100} className="h-1.5" />
    </CardContent>
  </Card>
);

// Main Component
export const RevenueCommandCenter: React.FC = () => {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [leads, setLeads] = useState<LeadStatus[]>([]);
  const [insights, setInsights] = useState<StrategicInsight[]>([]);
  const [patterns, setPatterns] = useState<WinPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMetrics(generateMockMetrics());
      setLeads(generateMockLeads());
      setInsights(generateMockInsights());
      setPatterns(generateMockPatterns());
      setIsLoading(false);
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Revenue Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              Revenue Command Center
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered revenue intelligence and resurrection tracking
            </p>
          </div>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue Recovered"
            value={`$${(metrics?.totalRecovered || 0).toLocaleString()}`}
            change={18}
            icon={<DollarSign className="h-5 w-5" />}
            description="From dormant leads this year"
          />
          <MetricCard
            title="Leads Resurrected"
            value={String(metrics?.leadsResurrected || 0)}
            change={24}
            icon={<Users className="h-5 w-5" />}
            description="Successfully reactivated"
          />
          <MetricCard
            title="Recovery Rate"
            value={`${Math.round((metrics?.recoveryRate || 0) * 100)}%`}
            change={8}
            icon={<Target className="h-5 w-5" />}
            description="Of dormant leads recovered"
          />
          <MetricCard
            title="LTV Increase"
            value={`+${Math.round((metrics?.ltvIncrease || 0) * 100)}%`}
            change={12}
            icon={<TrendingUp className="h-5 w-5" />}
            description="From personalization"
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pipeline" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="pipeline" className="gap-2">
              <Activity className="h-4 w-4" />
              Resurrection Pipeline
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Strategic Insights
            </TabsTrigger>
            <TabsTrigger value="patterns" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Win Patterns
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <PieChart className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Active Resurrection Opportunities</h2>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                  {leads.filter(l => l.stage === 'cooling').length} Cooling
                </Badge>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-500">
                  {leads.filter(l => l.stage === 'dormant').length} Dormant
                </Badge>
                <Badge variant="outline" className="bg-red-500/10 text-red-500">
                  {leads.filter(l => l.stage === 'deep_dormant').length} Deep
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.map(lead => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Strategic Insights</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {insights.map(insight => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Winning Patterns</h2>
              <p className="text-sm text-muted-foreground">
                Automatically detected from successful conversions
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {patterns.map((pattern, idx) => (
                <PatternCard key={idx} pattern={pattern} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Performance Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Personalization Impact</CardTitle>
                  <CardDescription>Effect of identity-level personalization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Conversion Lift</span>
                      <span className="text-2xl font-bold text-green-500">
                        +{Math.round((metrics?.conversionLift || 0) * 100)}%
                      </span>
                    </div>
                    <Progress value={(metrics?.conversionLift || 0) * 100} className="h-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Response Rate Improvement</span>
                      <span className="text-2xl font-bold text-green-500">
                        +{Math.round((metrics?.personalizationImpact || 0) * 100)}%
                      </span>
                    </div>
                    <Progress value={(metrics?.personalizationImpact || 0) * 100} className="h-3" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Revenue by Strategy</CardTitle>
                  <CardDescription>Recovery performance by approach</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Soft Check-in', value: 32000, percentage: 38 },
                      { name: 'Value Reminder', value: 45000, percentage: 52 },
                      { name: 'Direct Ask', value: 28000, percentage: 33 },
                      { name: 'Pattern Interrupt', value: 20000, percentage: 24 }
                    ].map(strategy => (
                      <div key={strategy.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{strategy.name}</span>
                          <span className="text-muted-foreground">${strategy.value.toLocaleString()}</span>
                        </div>
                        <Progress value={strategy.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Stats */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">System Status: Optimal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Processing 847 leads across 12 segments
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueCommandCenter;
