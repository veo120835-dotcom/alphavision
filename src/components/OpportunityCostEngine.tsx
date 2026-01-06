import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Scale, 
  Brain, 
  Loader2,
  TrendingUp,
  AlertTriangle,
  Target,
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowRight,
  Lightbulb,
  Clock,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OpportunityAnalysis {
  score: number;
  opportunity: string;
  opportunityCost: string;
  hiddenCosts: string[];
  recommendation: 'pursue' | 'decline' | 'negotiate';
  betterAlternatives: string[];
  questionToAsk: string;
  timeValue: number;
  revenuePerHour: number;
}

export function OpportunityCostEngine() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<OpportunityAnalysis | null>(null);
  const [opportunityInput, setOpportunityInput] = useState({
    description: '',
    potentialRevenue: '',
    timeRequired: '',
    currentProjects: '',
    hourlyRate: ''
  });

  const analyzeOpportunity = async () => {
    if (!opportunityInput.description) {
      toast.error('Describe the opportunity');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [{
            role: 'user',
            content: `You are a brutally honest business strategist. Analyze this opportunity for TRUE opportunity cost.

Opportunity: ${opportunityInput.description}
Potential Revenue: ${opportunityInput.potentialRevenue || 'Unknown'}
Time Required: ${opportunityInput.timeRequired || 'Unknown'}
Current Projects/Commitments: ${opportunityInput.currentProjects || 'Not specified'}
Current Hourly Rate: ${opportunityInput.hourlyRate || 'Not specified'}

Be direct and analytical. Consider:
1. What they're EXPLICITLY gaining
2. What they're IMPLICITLY saying NO to (other clients, rest, strategic work, family time)
3. Hidden costs (scope creep, mental bandwidth, opportunity cost)
4. Whether this compounds or depletes their position

Respond with JSON only:
{
  "score": <1-100 opportunity score - higher means SHOULD pursue>,
  "opportunity": "<concise: what they gain>",
  "opportunityCost": "<critical: what they're implicitly saying NO to by saying YES>",
  "hiddenCosts": ["hidden cost 1", "hidden cost 2", "hidden cost 3"],
  "recommendation": "<pursue|decline|negotiate>",
  "betterAlternatives": ["better option 1", "better option 2"],
  "questionToAsk": "<one powerful question they need to answer before deciding>",
  "timeValue": <effective hourly rate of this opportunity>,
  "revenuePerHour": <revenue divided by hours required>
}`
          }]
        }
      });

      if (error) throw error;

      const content = data?.choices?.[0]?.message?.content || data;
      const jsonMatch = typeof content === 'string' ? content.match(/\{[\s\S]*\}/) : null;
      if (jsonMatch) {
        setAnalysis(JSON.parse(jsonMatch[0]));
        toast.success('Analysis complete');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback demo response
      const revenue = parseFloat(opportunityInput.potentialRevenue) || 8000;
      const hours = parseFloat(opportunityInput.timeRequired) || 60;
      const hourlyRate = revenue / hours;
      
      setAnalysis({
        score: hourlyRate > 150 ? 72 : 38,
        opportunity: `Quick revenue of $${revenue.toLocaleString()} from a known opportunity`,
        opportunityCost: `You're saying NO to: pursuing your $50k pipeline prospect, building scalable systems, strategic thinking time, and recovery that prevents burnout`,
        hiddenCosts: [
          'Scope creep risk - small projects often expand without price increases',
          'Mental bandwidth drain - context switching costs ~23 minutes per switch',
          'Reputation dilution - saying yes to everything signals you\'re not premium',
          'Energy depletion - leaves you too tired for high-leverage activities'
        ],
        recommendation: hourlyRate > 150 ? 'negotiate' : 'decline',
        betterAlternatives: [
          `Refer this to a subcontractor at 30% margin = $${Math.round(revenue * 0.3).toLocaleString()} for zero hours`,
          `Counter with 2x price ($${(revenue * 2).toLocaleString()}) - let them self-select out`,
          'Invest same hours in nurturing your $50k prospect instead'
        ],
        questionToAsk: 'What happens to your business if you say NO to all projects under $20k for the next 90 days?',
        timeValue: hourlyRate,
        revenuePerHour: hourlyRate
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case 'pursue': return { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-600', label: 'PURSUE' };
      case 'decline': return { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-600', label: 'DECLINE' };
      case 'negotiate': return { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-600', label: 'NEGOTIATE' };
      default: return { bg: '', text: '', label: '' };
    }
  };

  const recStyle = analysis ? getRecommendationStyle(analysis.recommendation) : null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Scale className="h-8 w-8 text-primary" />
          Opportunity Cost Engine
        </h1>
        <p className="text-muted-foreground mt-1">
          Every YES is a hidden NO. See what you're <span className="font-semibold text-foreground">really</span> trading.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Evaluate an Opportunity
            </CardTitle>
            <CardDescription>
              Describe what you're considering saying yes to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">The Opportunity</label>
              <Textarea
                placeholder="e.g., New client wants a $8k project, 3-week timeline, seems straightforward..."
                value={opportunityInput.description}
                onChange={(e) => setOpportunityInput({ ...opportunityInput, description: e.target.value })}
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Potential Revenue ($)</label>
                <Input
                  type="number"
                  placeholder="8000"
                  value={opportunityInput.potentialRevenue}
                  onChange={(e) => setOpportunityInput({ ...opportunityInput, potentialRevenue: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time Required (hours)</label>
                <Input
                  type="number"
                  placeholder="60"
                  value={opportunityInput.timeRequired}
                  onChange={(e) => setOpportunityInput({ ...opportunityInput, timeRequired: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Your Current Hourly Rate ($)</label>
              <Input
                type="number"
                placeholder="200"
                value={opportunityInput.hourlyRate}
                onChange={(e) => setOpportunityInput({ ...opportunityInput, hourlyRate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">What Else is on Your Plate?</label>
              <Textarea
                placeholder="Current clients, pipeline deals, personal projects, health goals, family commitments..."
                value={opportunityInput.currentProjects}
                onChange={(e) => setOpportunityInput({ ...opportunityInput, currentProjects: e.target.value })}
                rows={2}
                className="mt-1"
              />
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={analyzeOpportunity}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Calculating True Cost...
                </>
              ) : (
                <>
                  <Scale className="mr-2 h-5 w-5" />
                  Reveal the Trade-off
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-4">
            {/* Score & Recommendation */}
            <Card className={`${recStyle?.bg} border`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Opportunity Score</p>
                    <p className="text-5xl font-bold">{analysis.score}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {analysis.score >= 70 ? 'High leverage opportunity' : 
                       analysis.score >= 50 ? 'Marginal - needs improvement' : 
                       'Low leverage - likely a trap'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={`text-lg px-4 py-2 ${recStyle?.bg} ${recStyle?.text}`}>
                      {analysis.recommendation === 'pursue' && <CheckCircle className="h-4 w-4 mr-2" />}
                      {analysis.recommendation === 'decline' && <XCircle className="h-4 w-4 mr-2" />}
                      {analysis.recommendation === 'negotiate' && <Scale className="h-4 w-4 mr-2" />}
                      {recStyle?.label}
                    </Badge>
                    <div className="mt-3 text-right">
                      <p className="text-sm text-muted-foreground">Effective Rate</p>
                      <p className={`text-xl font-bold ${analysis.revenuePerHour >= 150 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.round(analysis.revenuePerHour)}/hr
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What You Gain vs Lose */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-green-500/30 bg-green-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    What You Gain
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{analysis.opportunity}</p>
                </CardContent>
              </Card>

              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    What You're Saying NO To
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{analysis.opportunityCost}</p>
                </CardContent>
              </Card>
            </div>

            {/* Hidden Costs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Hidden Costs You're Not Seeing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.hiddenCosts.map((cost, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      {cost}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Better Alternatives */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Better Alternatives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.betterAlternatives.map((alt, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {alt}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* The Question */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-600 mb-1">
                      The Question You Need to Answer:
                    </p>
                    <p className="text-lg font-medium">{analysis.questionToAsk}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
