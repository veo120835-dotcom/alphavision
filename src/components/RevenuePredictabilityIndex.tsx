import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  RefreshCw,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Loader2,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface PredictabilityMetrics {
  overallScore: number;
  recurringRevenue: number;
  recurringPercentage: number;
  leadConsistency: number;
  conversionStability: number;
  volatilityIndex: number;
  monthsOfData: number;
}

interface Recommendation {
  title: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  action: string;
}

export function RevenuePredictabilityIndex() {
  const { organization } = useOrganization();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState<PredictabilityMetrics>({
    overallScore: 0,
    recurringRevenue: 0,
    recurringPercentage: 0,
    leadConsistency: 0,
    conversionStability: 0,
    volatilityIndex: 0,
    monthsOfData: 0
  });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [inputs, setInputs] = useState({
    monthlyRevenue: '',
    recurringRevenue: '',
    avgMonthlyLeads: '',
    conversionRate: ''
  });

  const analyzeRevenue = async () => {
    setIsAnalyzing(true);

    const monthly = parseFloat(inputs.monthlyRevenue) || 25000;
    const recurring = parseFloat(inputs.recurringRevenue) || 5000;
    const leads = parseFloat(inputs.avgMonthlyLeads) || 30;
    const conversion = parseFloat(inputs.conversionRate) || 15;

    // Calculate metrics
    const recurringPercentage = (recurring / monthly) * 100;
    const leadConsistency = Math.min(100, leads / 50 * 100); // Assume 50 leads/mo is stable
    const conversionStability = Math.min(100, conversion / 20 * 100); // Assume 20% is stable
    const volatilityIndex = 100 - recurringPercentage * 0.5;

    const overallScore = Math.round(
      (recurringPercentage * 0.4) +
      (leadConsistency * 0.3) +
      (conversionStability * 0.3)
    );

    setMetrics({
      overallScore,
      recurringRevenue: recurring,
      recurringPercentage,
      leadConsistency,
      conversionStability,
      volatilityIndex,
      monthsOfData: 6
    });

    // Generate recommendations based on scores
    const recs: Recommendation[] = [];

    if (recurringPercentage < 30) {
      recs.push({
        title: 'Add Recurring Revenue',
        impact: 'high',
        description: `Only ${recurringPercentage.toFixed(0)}% of revenue is recurring. This creates stress and unpredictability.`,
        action: 'Create a retainer, membership, or subscription tier for existing clients'
      });
    }

    if (leadConsistency < 50) {
      recs.push({
        title: 'Stabilize Lead Flow',
        impact: 'high',
        description: 'Lead volume is inconsistent, causing feast-or-famine cycles.',
        action: 'Implement always-on content distribution and paid retargeting'
      });
    }

    if (conversionStability < 60) {
      recs.push({
        title: 'Improve Conversion Consistency',
        impact: 'medium',
        description: 'Conversion rate fluctuates, making forecasting difficult.',
        action: 'Standardize your sales process with async closing flows'
      });
    }

    if (volatilityIndex > 50) {
      recs.push({
        title: 'Reduce Revenue Volatility',
        impact: 'medium',
        description: 'High volatility leads to stress-driven underpricing and poor decisions.',
        action: 'Collect 50% upfront on all projects to smooth cash flow'
      });
    }

    recs.push({
      title: 'Build Cash Buffer',
      impact: overallScore < 50 ? 'high' : 'low',
      description: 'A 3-month cash reserve eliminates desperation pricing.',
      action: 'Auto-allocate 10% of revenue to a separate account'
    });

    setRecommendations(recs);
    setIsAnalyzing(false);
    toast.success('Revenue predictability analyzed');
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getImpactStyle = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          Revenue Predictability Index
        </h1>
        <p className="text-muted-foreground mt-1">
          Income volatility kills growth. Measure and fix it.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Your Revenue Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Avg Monthly Revenue ($)</label>
                <Input
                  type="number"
                  placeholder="25000"
                  value={inputs.monthlyRevenue}
                  onChange={(e) => setInputs({ ...inputs, monthlyRevenue: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Recurring Revenue ($)</label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={inputs.recurringRevenue}
                  onChange={(e) => setInputs({ ...inputs, recurringRevenue: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Avg Monthly Leads</label>
                <Input
                  type="number"
                  placeholder="30"
                  value={inputs.avgMonthlyLeads}
                  onChange={(e) => setInputs({ ...inputs, avgMonthlyLeads: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Conversion Rate (%)</label>
                <Input
                  type="number"
                  placeholder="15"
                  value={inputs.conversionRate}
                  onChange={(e) => setInputs({ ...inputs, conversionRate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <Button className="w-full" onClick={analyzeRevenue} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Calculate Predictability Index
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Score Display */}
        {metrics.overallScore > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground">Revenue Predictability Index</p>
                <p className={`text-6xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                  {metrics.overallScore}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics.overallScore >= 70 ? 'Highly Predictable' :
                   metrics.overallScore >= 50 ? 'Moderately Predictable' :
                   'High Volatility Risk'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Recurring Revenue</span>
                    <span className="text-sm font-medium">{metrics.recurringPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={metrics.recurringPercentage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Lead Consistency</span>
                    <span className="text-sm font-medium">{metrics.leadConsistency.toFixed(0)}%</span>
                  </div>
                  <Progress value={metrics.leadConsistency} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Conversion Stability</span>
                    <span className="text-sm font-medium">{metrics.conversionStability.toFixed(0)}%</span>
                  </div>
                  <Progress value={metrics.conversionStability} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Structural Changes to Smooth Income
            </CardTitle>
            <CardDescription>
              Ranked by impact on predictability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, i) => (
                <div key={i} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <Badge className={getImpactStyle(rec.impact)}>
                      {rec.impact} impact
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">{rec.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      <div className="mt-2 p-2 bg-primary/5 rounded text-sm">
                        <span className="font-medium text-primary">→ </span>
                        {rec.action}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volatility Warning */}
      {metrics.volatilityIndex > 50 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-medium text-amber-500">Revenue Volatility Warning</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your income volatility index is {metrics.volatilityIndex.toFixed(0)}%. This leads to:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• Stress-driven underpricing ("I need this deal")</li>
                  <li>• Poor strategic decisions due to short-term pressure</li>
                  <li>• Inability to invest in growth during low months</li>
                  <li>• Higher risk of accepting bad-fit clients</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
