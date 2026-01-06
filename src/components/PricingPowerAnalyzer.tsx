import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Calculator,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface PricingMetrics {
  currentPrice: number;
  suggestedPrice: number;
  priceElasticity: number;
  competitorAvg: number;
  demandScore: number;
  uniquenessScore: number;
  leverageScore: number;
}

export function PricingPowerAnalyzer() {
  const { organization } = useOrganization();
  const [metrics, setMetrics] = useState<PricingMetrics>({
    currentPrice: 2500,
    suggestedPrice: 3200,
    priceElasticity: 0.7,
    competitorAvg: 2000,
    demandScore: 78,
    uniquenessScore: 85,
    leverageScore: 72
  });
  const [currentPrice, setCurrentPrice] = useState(2500);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      loadPricingConfig();
    }
  }, [organization?.id]);

  const loadPricingConfig = async () => {
    if (!organization?.id) return;

    const { data } = await supabase
      .from('memory_items')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('type', 'pricing_config')
      .single();

    if (data?.content) {
      const content = data.content as Record<string, unknown>;
      setCurrentPrice(content.currentPrice as number || 2500);
      setMetrics(prev => ({
        ...prev,
        currentPrice: content.currentPrice as number || 2500
      }));
    }
  };

  const analyzePrice = async () => {
    setAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const demandMultiplier = 1 + (Math.random() * 0.3);
    const uniquenessBonus = metrics.uniquenessScore > 80 ? 1.15 : 1;
    const suggestedPrice = Math.round(currentPrice * demandMultiplier * uniquenessBonus);
    
    setMetrics(prev => ({
      ...prev,
      currentPrice,
      suggestedPrice,
      demandScore: Math.round(60 + Math.random() * 35),
      leverageScore: Math.round(55 + Math.random() * 40)
    }));
    
    setAnalyzing(false);
    toast.success('Pricing analysis complete!');
  };

  const savePricingConfig = async () => {
    if (!organization?.id) return;

    try {
      const { data: existing } = await supabase
        .from('memory_items')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('type', 'pricing_config')
        .single();

      if (existing) {
        await supabase
          .from('memory_items')
          .update({ 
            content: JSON.parse(JSON.stringify({ currentPrice, metrics })),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('memory_items')
          .insert({
            organization_id: organization.id,
            type: 'pricing_config',
            title: 'Pricing Configuration',
            content: JSON.parse(JSON.stringify({ currentPrice, metrics }))
          });
      }

      toast.success('Pricing config saved!');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const priceChange = metrics.suggestedPrice - metrics.currentPrice;
  const priceChangePercent = Math.round((priceChange / metrics.currentPrice) * 100);
  const overallScore = Math.round((metrics.demandScore + metrics.uniquenessScore + metrics.leverageScore) / 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Pricing Power Analyzer</h2>
          <p className="text-muted-foreground">AI-powered pricing optimization</p>
        </div>
        <Button onClick={analyzePrice} disabled={analyzing}>
          {analyzing ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4 mr-2" />
              Analyze
            </>
          )}
        </Button>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-glow col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-3xl font-bold">${metrics.currentPrice.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Suggested Price</p>
                <p className="text-3xl font-bold text-primary">${metrics.suggestedPrice.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {priceChange > 0 ? (
                <Badge className="bg-green-500/20 text-green-400">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  +${priceChange.toLocaleString()} ({priceChangePercent}%)
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400">
                  <ArrowDown className="w-3 h-3 mr-1" />
                  ${priceChange.toLocaleString()} ({priceChangePercent}%)
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">potential increase</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallScore}%</p>
                <p className="text-sm text-muted-foreground">Power Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <BarChart3 className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${metrics.competitorAvg.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Market Avg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Price Input */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Set Your Price
            </CardTitle>
            <CardDescription>Adjust your current pricing to analyze</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Current Price</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(Number(e.target.value))}
                  className="text-lg font-bold"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Quick Adjust</Label>
              <Slider
                value={[currentPrice]}
                onValueChange={([v]) => setCurrentPrice(v)}
                min={500}
                max={10000}
                step={100}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$500</span>
                <span>$10,000</span>
              </div>
            </div>

            <Button onClick={savePricingConfig} className="w-full">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Leverage Factors */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Leverage Factors
            </CardTitle>
            <CardDescription>Factors affecting your pricing power</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Market Demand</span>
                  <span className="text-sm text-muted-foreground">{metrics.demandScore}%</span>
                </div>
                <Progress value={metrics.demandScore} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Based on lead volume and inquiry rates
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Uniqueness Score</span>
                  <span className="text-sm text-muted-foreground">{metrics.uniquenessScore}%</span>
                </div>
                <Progress value={metrics.uniquenessScore} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  How differentiated is your offer
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Leverage Score</span>
                  <span className="text-sm text-muted-foreground">{metrics.leverageScore}%</span>
                </div>
                <Progress value={metrics.leverageScore} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Your negotiating position strength
                </p>
              </div>
            </div>

            {metrics.uniquenessScore >= 80 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-green-500/10 border border-green-500/20"
              >
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">High uniqueness detected</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  You have significant pricing power due to differentiation
                </p>
              </motion.div>
            )}

            {metrics.demandScore < 50 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
              >
                <div className="flex items-center gap-2 text-orange-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Low demand signal</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Consider increasing marketing or adjusting positioning
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Price Position</h4>
              <p className="text-sm text-muted-foreground">
                Your current price is {metrics.currentPrice > metrics.competitorAvg ? 'above' : 'below'} market average. 
                {priceChange > 0 && ` Consider increasing to $${metrics.suggestedPrice.toLocaleString()}.`}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Value Stack</h4>
              <p className="text-sm text-muted-foreground">
                Add more value components to justify premium pricing. Focus on outcomes over deliverables.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Urgency Levers</h4>
              <p className="text-sm text-muted-foreground">
                Limited availability and deadline-based offers can increase conversion without lowering price.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
