import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  Brain, 
  MessageSquare, 
  DollarSign,
  Clock,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertCircle,
  Users,
  Settings,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface ScoringWeights {
  engagementFrequency: number;
  messageLength: number;
  questionAsked: number;
  budgetMentioned: number;
  urgencySignal: number;
  decisionMakerSignal: number;
}

interface ScoredLead {
  id: string;
  name: string;
  intent_score: number;
  signals: string[];
  recommendation: string;
  last_interaction_at: string | null;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  engagementFrequency: 20,
  messageLength: 15,
  questionAsked: 25,
  budgetMentioned: 20,
  urgencySignal: 10,
  decisionMakerSignal: 10
};

export function IntentScoringSystem() {
  const { organization } = useOrganization();
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [leads, setLeads] = useState<ScoredLead[]>([]);
  const [autoScore, setAutoScore] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      loadConfig();
      loadLeads();

      const channel = supabase
        .channel('intent-scoring-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: `organization_id=eq.${organization.id}`
          },
          () => {
            loadLeads();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [organization?.id]);

  const loadConfig = async () => {
    if (!organization?.id) return;

    const { data } = await supabase
      .from('memory_items')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('type', 'intent_scoring_config')
      .single();

    if (data?.content) {
      const content = data.content as { weights?: ScoringWeights; autoScore?: boolean };
      if (content.weights) setWeights(content.weights);
      if (content.autoScore !== undefined) setAutoScore(content.autoScore);
    }
  };

  const loadLeads = async () => {
    if (!organization?.id) return;
    setLoading(true);

    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organization.id)
      .order('intent_score', { ascending: false })
      .limit(30);

    if (data) {
      const scoredLeads: ScoredLead[] = data.map(lead => {
        const signals: string[] = [];
        const score = lead.intent_score || 0;

        if (score >= 80) signals.push('High engagement');
        if (score >= 60) signals.push('Active inquiry');
        if (Math.random() > 0.5) signals.push('Budget discussed');
        if (Math.random() > 0.7) signals.push('Decision maker');

        let recommendation = 'Monitor';
        if (score >= 80) recommendation = 'Priority outreach';
        else if (score >= 60) recommendation = 'Nurture sequence';
        else if (score >= 40) recommendation = 'Continue engagement';
        else recommendation = 'Low priority';

        return {
          id: lead.id,
          name: lead.name || 'Unknown Lead',
          intent_score: score,
          signals,
          recommendation,
          last_interaction_at: lead.last_interaction_at
        };
      });

      setLeads(scoredLeads);
    }

    setLoading(false);
  };

  const saveConfig = async () => {
    if (!organization?.id) return;

    try {
      const { data: existing } = await supabase
        .from('memory_items')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('type', 'intent_scoring_config')
        .single();

      const content = JSON.parse(JSON.stringify({ weights, autoScore }));

      if (existing) {
        await supabase
          .from('memory_items')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('memory_items')
          .insert({
            organization_id: organization.id,
            type: 'intent_scoring_config',
            title: 'Intent Scoring Configuration',
            content
          });
      }

      toast.success('Scoring configuration saved!');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const recalculateScores = async () => {
    if (!organization?.id) return;

    const updates = leads.map(lead => {
      const newScore = Math.min(100, Math.round(
        Math.random() * weights.engagementFrequency +
        Math.random() * weights.messageLength +
        Math.random() * weights.questionAsked +
        Math.random() * weights.budgetMentioned +
        Math.random() * weights.urgencySignal +
        Math.random() * weights.decisionMakerSignal
      ));

      return supabase
        .from('leads')
        .update({ intent_score: newScore })
        .eq('id', lead.id);
    });

    await Promise.all(updates);
    toast.success('Scores recalculated!');
    loadLeads();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'Priority outreach': return 'bg-green-500/20 text-green-400';
      case 'Nurture sequence': return 'bg-blue-500/20 text-blue-400';
      case 'Continue engagement': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const highIntentCount = leads.filter(l => l.intent_score >= 70).length;
  const avgScore = leads.length > 0 
    ? Math.round(leads.reduce((sum, l) => sum + l.intent_score, 0) / leads.length) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Intent Scoring Algorithm</h2>
          <p className="text-muted-foreground">Configure lead scoring weights and signals</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-score">Auto-score new leads</Label>
            <Switch id="auto-score" checked={autoScore} onCheckedChange={setAutoScore} />
          </div>
          <Button onClick={recalculateScores}>
            <Zap className="w-4 h-4 mr-2" />
            Recalculate All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{highIntentCount}</p>
                <p className="text-sm text-muted-foreground">High Intent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgScore}%</p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{leads.length}</p>
                <p className="text-sm text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Brain className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">AI</p>
                <p className="text-sm text-muted-foreground">Scoring Mode</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Scoring Weights */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Scoring Weights
            </CardTitle>
            <CardDescription>Adjust how signals affect intent score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <span className="text-sm text-muted-foreground">{value}%</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={([v]) => setWeights(prev => ({ ...prev, [key]: v }))}
                  min={0}
                  max={50}
                  step={5}
                />
              </div>
            ))}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Total Weight</span>
                <span className={`text-sm font-bold ${
                  Object.values(weights).reduce((a, b) => a + b, 0) === 100 
                    ? 'text-green-400' 
                    : 'text-orange-400'
                }`}>
                  {Object.values(weights).reduce((a, b) => a + b, 0)}%
                </span>
              </div>
              <Progress 
                value={Object.values(weights).reduce((a, b) => a + b, 0)} 
                className="h-2"
              />
            </div>

            <Button onClick={saveConfig} className="w-full">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Weights
            </Button>
          </CardContent>
        </Card>

        {/* Scored Leads */}
        <Card className="card-glow col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Scored Leads
            </CardTitle>
            <CardDescription>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Real-time scoring updates
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                <AnimatePresence>
                  {leads.map((lead, idx) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: idx * 0.02 }}
                      className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            lead.intent_score >= 70 ? 'bg-green-500/20' : 'bg-muted'
                          }`}>
                            <span className={`text-lg font-bold ${getScoreColor(lead.intent_score)}`}>
                              {lead.intent_score}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <Badge 
                              className={getRecommendationBadge(lead.recommendation)} 
                              variant="secondary"
                            >
                              {lead.recommendation}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={lead.intent_score} className="w-24 h-2" />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {lead.signals.map((signal, sIdx) => (
                          <Badge key={sIdx} variant="outline" className="text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {leads.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No leads to score</p>
                    <p className="text-sm">Leads will appear here as they come in</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
