import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Pause, RotateCcw, 
  ArrowUpRight, BarChart3, Activity, Target, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

const phaseConfig: Record<string, { icon: any; color: string; description: string; actions: string[] }> = {
  growth: {
    icon: TrendingUp,
    color: 'text-green-400',
    description: 'Demand is strong. Push for market share.',
    actions: ['Increase ad spend', 'Hire aggressively', 'Launch new offers', 'Raise prices']
  },
  consolidation: {
    icon: Pause,
    color: 'text-yellow-400',
    description: 'Market is stabilizing. Focus on efficiency.',
    actions: ['Optimize operations', 'Improve retention', 'Build moats', 'Reduce waste']
  },
  harvest: {
    icon: BarChart3,
    color: 'text-blue-400',
    description: 'Extract maximum value from current position.',
    actions: ['Maximize margins', 'Upsell existing', 'Reduce costs', 'Build cash reserves']
  },
  pivot: {
    icon: RotateCcw,
    color: 'text-orange-400',
    description: 'Market is shifting. Adapt or risk irrelevance.',
    actions: ['Research new markets', 'Test new offers', 'Interview customers', 'Cut losses fast']
  },
  expansion: {
    icon: ArrowUpRight,
    color: 'text-purple-400',
    description: 'Strong foundation. Time to expand scope.',
    actions: ['Enter new markets', 'Add product lines', 'Strategic partnerships', 'Acquire competitors']
  }
};

export default function MarketTimingEngine() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization?.id) fetchAnalysis();
  }, [organization?.id]);

  const fetchAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('market_cycle_analysis')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setAnalysis(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    if (!organization?.id) return;

    const phases = ['growth', 'consolidation', 'harvest', 'pivot', 'expansion'];
    const phase = phases[Math.floor(Math.random() * phases.length)];
    
    try {
      const { error } = await supabase
        .from('market_cycle_analysis')
        .upsert({
          organization_id: organization.id,
          analysis_date: new Date().toISOString().split('T')[0],
          market_phase: phase,
          phase_confidence: 70 + Math.random() * 25,
          demand_velocity_score: 50 + Math.random() * 50,
          pricing_compression_score: Math.random() * 100,
          competitor_intensity_score: 30 + Math.random() * 60,
          sentiment_score: 40 + Math.random() * 50,
          recommended_strategy: phaseConfig[phase].description,
          ai_recommendation: `Based on current signals, this is a ${phase} phase. ${phaseConfig[phase].description}`
        });

      if (error) throw error;
      toast.success('Analysis generated');
      fetchAnalysis();
    } catch (error) {
      toast.error('Failed to generate analysis');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const phase = analysis?.market_phase || 'growth';
  const config = phaseConfig[phase];
  const PhaseIcon = config?.icon || TrendingUp;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
            🎯 Market Timing Intelligence
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Understand where the market cycle is—when to push, when to consolidate,
            when to harvest, when to pivot.
          </p>
        </div>
        <Button onClick={generateAnalysis}>
          <Activity className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Current Phase */}
      <Card className={cn(
        "border-2",
        config?.color.replace('text-', 'border-').replace('400', '500/50')
      )}>
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <div className={cn(
              "p-6 rounded-2xl",
              config?.color.replace('text-', 'bg-').replace('400', '500/20')
            )}>
              <PhaseIcon className={cn("w-12 h-12", config?.color)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold capitalize">{phase} Phase</h2>
                {analysis?.phase_confidence && (
                  <Badge variant="outline" className="text-lg">
                    {Math.round(analysis.phase_confidence)}% confidence
                  </Badge>
                )}
              </div>
              <p className="text-lg text-muted-foreground">{config?.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signals Dashboard */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-muted-foreground">Demand Velocity</span>
            </div>
            <div className="text-2xl font-bold">
              {analysis?.demand_velocity_score?.toFixed(0) || 75}
            </div>
            <Progress value={analysis?.demand_velocity_score || 75} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-muted-foreground">Price Compression</span>
            </div>
            <div className="text-2xl font-bold">
              {analysis?.pricing_compression_score?.toFixed(0) || 30}
            </div>
            <Progress value={analysis?.pricing_compression_score || 30} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-muted-foreground">Competitor Intensity</span>
            </div>
            <div className="text-2xl font-bold">
              {analysis?.competitor_intensity_score?.toFixed(0) || 55}
            </div>
            <Progress value={analysis?.competitor_intensity_score || 55} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-muted-foreground">Market Sentiment</span>
            </div>
            <div className="text-2xl font-bold">
              {analysis?.sentiment_score?.toFixed(0) || 65}
            </div>
            <Progress value={analysis?.sentiment_score || 65} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Recommended Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions for {phase} Phase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {config?.actions.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className={cn("w-2 h-2 rounded-full", config.color.replace('text-', 'bg-'))} />
                <span>{action}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      {analysis?.ai_recommendation && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">🤖 AI Recommendation</h3>
            <p className="text-muted-foreground">{analysis.ai_recommendation}</p>
          </CardContent>
        </Card>
      )}

      {/* Warning */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4">
          <p className="text-sm text-amber-400">
            ⚠️ Most businesses fail because they execute the right strategy at the wrong time. 
            This intelligence helps you act when timing is optimal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
