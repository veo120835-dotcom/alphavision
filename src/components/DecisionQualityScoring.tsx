import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Brain, Target, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Clock, BarChart3, Sparkles, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useMockStorage } from "@/hooks/useMockStorage";

interface ScoredDecision {
  id: string;
  decision_description: string;
  rationale: string;
  decision_quality_score: number;
  outcome_quality_score: number | null;
  regret_delta: number | null;
  confidence_at_decision: number;
  calibration_accuracy: number | null;
  learning_extracted: string | null;
  decided_at: string;
  outcome_recorded_at: string | null;
}

const DEMO_DECISIONS: ScoredDecision[] = [
  {
    id: '1',
    decision_description: 'Launched new pricing tier for enterprise clients',
    rationale: 'Market analysis showed demand for premium features',
    decision_quality_score: 85,
    outcome_quality_score: 78,
    regret_delta: -5,
    confidence_at_decision: 75,
    calibration_accuracy: 82,
    learning_extracted: 'Enterprise clients respond better to value-based pricing than feature-based',
    decided_at: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
    outcome_recorded_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
  },
  {
    id: '2',
    decision_description: 'Hired additional sales rep for Q4',
    rationale: 'Pipeline growth required more capacity',
    decision_quality_score: 72,
    outcome_quality_score: null,
    regret_delta: null,
    confidence_at_decision: 68,
    calibration_accuracy: null,
    learning_extracted: null,
    decided_at: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    outcome_recorded_at: null
  }
];

export default function DecisionQualityScoring() {
  const { data: decisions, loading } = useMockStorage<ScoredDecision>('decision_quality_scores', DEMO_DECISIONS);
  const [stats, setStats] = useState({
    avgDecisionQuality: 0,
    avgOutcomeQuality: 0,
    calibrationScore: 0,
    decisionsTracked: 0,
    learningsExtracted: 0
  });

  useEffect(() => {
    const withOutcomes = decisions.filter(d => d.outcome_quality_score);
    setStats({
      avgDecisionQuality: decisions.length ? decisions.reduce((a, b) => a + b.decision_quality_score, 0) / decisions.length : 0,
      avgOutcomeQuality: withOutcomes.length ? withOutcomes.reduce((a, b) => a + (b.outcome_quality_score || 0), 0) / withOutcomes.length : 0,
      calibrationScore: withOutcomes.length ? withOutcomes.reduce((a, b) => a + (b.calibration_accuracy || 0), 0) / withOutcomes.length : 0,
      decisionsTracked: decisions.length,
      learningsExtracted: decisions.filter(d => d.learning_extracted).length
    });
  }, [decisions]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
          🧠 Decision Quality Scoring
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Evaluate every decision by its process, not just outcome. 
          This is how AI becomes meaningfully smarter over time.
        </p>
      </div>

      {/* Key Insight */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-purple-500/20">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Outcome ≠ Decision Quality</h3>
              <p className="text-muted-foreground">
                A good decision with a bad outcome is still a good decision. 
                A bad decision with a good outcome is still a bad decision. 
                We track both separately to improve judgment, not luck.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        {[
          { label: 'Avg Decision Quality', value: stats.avgDecisionQuality, icon: Target },
          { label: 'Avg Outcome Quality', value: stats.avgOutcomeQuality, icon: CheckCircle2 },
          { label: 'Calibration Score', value: stats.calibrationScore, icon: BarChart3 },
          { label: 'Decisions Tracked', value: stats.decisionsTracked, icon: Clock, isCount: true },
          { label: 'Learnings Extracted', value: stats.learningsExtracted, icon: Sparkles, isCount: true }
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <div className={cn(
                "text-2xl font-bold",
                !stat.isCount && getScoreColor(stat.value)
              )}>
                {stat.isCount ? stat.value : `${Math.round(stat.value)}%`}
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calibration Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            How Calibration Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">1. Decision Made</h4>
              <p className="text-sm text-muted-foreground">
                You make a decision with a confidence level (e.g., "80% sure this will work")
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">2. Outcome Recorded</h4>
              <p className="text-sm text-muted-foreground">
                We track what actually happened and compare to prediction
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">3. Calibration Updated</h4>
              <p className="text-sm text-muted-foreground">
                If you're right 80% of the time when you say 80%, you're well-calibrated
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Decisions */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Recent Scored Decisions</h2>

        {decisions.length === 0 ? (
          <Card className="p-8 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Decisions Scored Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Make decisions through the system to start building your decision quality profile.
            </p>
          </Card>
        ) : (
          decisions.map((decision, index) => (
            <motion.div
              key={decision.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{decision.decision_description}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(decision.decided_at).toLocaleDateString()}
                      </div>
                    </div>
                    {decision.outcome_quality_score ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Outcome Recorded
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Awaiting Outcome
                      </Badge>
                    )}
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Decision Quality</div>
                      <div className="flex items-center gap-2">
                        <Progress value={decision.decision_quality_score} className="h-2" />
                        <span className={cn("text-sm font-medium", getScoreColor(decision.decision_quality_score))}>
                          {Math.round(decision.decision_quality_score)}%
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                      <div className="flex items-center gap-2">
                        <Progress value={decision.confidence_at_decision} className="h-2" />
                        <span className="text-sm font-medium">
                          {Math.round(decision.confidence_at_decision)}%
                        </span>
                      </div>
                    </div>

                    {decision.outcome_quality_score && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Outcome Quality</div>
                        <div className="flex items-center gap-2">
                          <Progress value={decision.outcome_quality_score} className="h-2" />
                          <span className={cn("text-sm font-medium", getScoreColor(decision.outcome_quality_score))}>
                            {Math.round(decision.outcome_quality_score)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {decision.calibration_accuracy && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Calibration</div>
                        <div className="flex items-center gap-2">
                          <Progress value={decision.calibration_accuracy} className="h-2" />
                          <span className={cn("text-sm font-medium", getScoreColor(decision.calibration_accuracy))}>
                            {Math.round(decision.calibration_accuracy)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {decision.learning_extracted && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400 mt-0.5" />
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Learning Extracted</div>
                          <p className="text-sm">{decision.learning_extracted}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
