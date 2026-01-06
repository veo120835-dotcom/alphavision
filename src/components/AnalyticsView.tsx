import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Brain, 
  Heart, 
  Shield,
  BarChart3,
  PieChart,
  Activity,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  totalDecisions: number;
  approvedDecisions: number;
  executedDecisions: number;
  avgConfidenceScore: number;
  tastePatterns: { key: string; count: number; confidence: number }[];
  founderStateAvg: { energy: number; confidence: number; clarity: number };
  recentOutcomes: { positive: number; negative: number; neutral: number };
}

export function AnalyticsView() {
  const { organization } = useOrganization();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      loadAnalytics();
    }
  }, [organization?.id]);

  const loadAnalytics = async () => {
    if (!organization?.id) return;
    
    try {
      // Fetch decisions
      const { data: decisions } = await (supabase as any)
        .from('decisions')
        .select('*')
        .eq('organization_id', organization.id);

      // Fetch taste preferences
      const { data: tastePrefs } = await (supabase as any)
        .from('taste_preferences')
        .select('*')
        .eq('organization_id', organization.id)
        .order('observation_count', { ascending: false })
        .limit(5);

      // Fetch founder state logs
      const { data: founderLogs } = await (supabase as any)
        .from('founder_state_logs')
        .select('*')
        .eq('organization_id', organization.id)
        .order('logged_at', { ascending: false })
        .limit(10);

      // Fetch decision outcomes
      const { data: outcomes } = await (supabase as any)
        .from('decision_outcomes')
        .select('*')
        .eq('organization_id', organization.id);

      const totalDecisions = decisions?.length || 0;
      const approvedDecisions = decisions?.filter(d => d.status === 'approved').length || 0;
      const executedDecisions = decisions?.filter(d => d.status === 'executed').length || 0;

      const tastePatterns = (tastePrefs || []).map(t => ({
        key: t.pattern_key,
        count: t.observation_count,
        confidence: Number(t.confidence_score)
      }));

      const avgEnergy = founderLogs?.length 
        ? founderLogs.reduce((sum, l) => sum + (l.energy_level || 3), 0) / founderLogs.length 
        : 3;
      const avgConfidence = founderLogs?.length 
        ? founderLogs.reduce((sum, l) => sum + (l.confidence_level || 3), 0) / founderLogs.length 
        : 3;
      const avgClarity = founderLogs?.length 
        ? founderLogs.reduce((sum, l) => sum + (l.decision_clarity || 3), 0) / founderLogs.length 
        : 3;

      const positive = outcomes?.filter(o => (o.impact_score || 0) > 0).length || 0;
      const negative = outcomes?.filter(o => (o.impact_score || 0) < 0).length || 0;
      const neutral = outcomes?.filter(o => (o.impact_score || 0) === 0).length || 0;

      setAnalytics({
        totalDecisions,
        approvedDecisions,
        executedDecisions,
        avgConfidenceScore: tastePatterns.length 
          ? tastePatterns.reduce((sum, t) => sum + t.confidence, 0) / tastePatterns.length 
          : 0,
        tastePatterns,
        founderStateAvg: { energy: avgEnergy, confidence: avgConfidence, clarity: avgClarity },
        recentOutcomes: { positive, negative, neutral }
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track your decision quality, taste calibration, and founder state over time.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Target}
          label="Total Decisions"
          value={analytics?.totalDecisions || 0}
          subtext={`${analytics?.executedDecisions || 0} executed`}
          trend="up"
        />
        <MetricCard
          icon={TrendingUp}
          label="Approval Rate"
          value={analytics?.totalDecisions 
            ? `${Math.round((analytics.approvedDecisions / analytics.totalDecisions) * 100)}%`
            : '0%'
          }
          subtext="of decisions approved"
          trend="up"
        />
        <MetricCard
          icon={Brain}
          label="Taste Calibration"
          value={`${Math.round((analytics?.avgConfidenceScore || 0) * 100)}%`}
          subtext="preference confidence"
          trend={analytics?.avgConfidenceScore && analytics.avgConfidenceScore > 0.5 ? 'up' : 'neutral'}
        />
        <MetricCard
          icon={Activity}
          label="Outcome Score"
          value={analytics?.recentOutcomes 
            ? `+${analytics.recentOutcomes.positive}/-${analytics.recentOutcomes.negative}`
            : '+0/-0'
          }
          subtext="positive/negative"
          trend={analytics?.recentOutcomes && analytics.recentOutcomes.positive > analytics.recentOutcomes.negative ? 'up' : 'down'}
        />
      </div>

      {/* Founder State Monitor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Heart className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Founder State Monitor</h2>
            <p className="text-sm text-muted-foreground">Your current operating capacity</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <StateGauge
            label="Energy Level"
            value={analytics?.founderStateAvg.energy || 3}
            color="from-yellow-500 to-orange-500"
          />
          <StateGauge
            label="Confidence"
            value={analytics?.founderStateAvg.confidence || 3}
            color="from-blue-500 to-cyan-500"
          />
          <StateGauge
            label="Decision Clarity"
            value={analytics?.founderStateAvg.clarity || 3}
            color="from-green-500 to-emerald-500"
          />
        </div>
      </motion.div>

      {/* Taste Patterns & Identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Taste Patterns */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Taste & Judgment Patterns</h2>
              <p className="text-sm text-muted-foreground">What you consistently prefer</p>
            </div>
          </div>

          {analytics?.tastePatterns.length ? (
            <div className="space-y-3">
              {analytics.tastePatterns.map((pattern, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="font-medium capitalize">{pattern.key.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                        style={{ width: `${pattern.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{pattern.count}x</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <PieChart className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No taste patterns recorded yet.</p>
              <p className="text-sm">Make decisions to calibrate your preferences.</p>
            </div>
          )}
        </motion.div>

        {/* Decision Outcomes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Decision Consequences</h2>
              <p className="text-sm text-muted-foreground">Tracked outcomes from past decisions</p>
            </div>
          </div>

          {(analytics?.recentOutcomes.positive || 0) + (analytics?.recentOutcomes.negative || 0) > 0 ? (
            <div className="space-y-4">
              <OutcomeBar 
                label="Positive Outcomes" 
                value={analytics?.recentOutcomes.positive || 0}
                total={(analytics?.recentOutcomes.positive || 0) + (analytics?.recentOutcomes.negative || 0) + (analytics?.recentOutcomes.neutral || 0)}
                color="bg-green-500"
              />
              <OutcomeBar 
                label="Neutral Outcomes" 
                value={analytics?.recentOutcomes.neutral || 0}
                total={(analytics?.recentOutcomes.positive || 0) + (analytics?.recentOutcomes.negative || 0) + (analytics?.recentOutcomes.neutral || 0)}
                color="bg-yellow-500"
              />
              <OutcomeBar 
                label="Negative Outcomes" 
                value={analytics?.recentOutcomes.negative || 0}
                total={(analytics?.recentOutcomes.positive || 0) + (analytics?.recentOutcomes.negative || 0) + (analytics?.recentOutcomes.neutral || 0)}
                color="bg-red-500"
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No outcomes recorded yet.</p>
              <p className="text-sm">Log outcomes to track decision quality.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  trend 
}: { 
  icon: typeof Target;
  label: string;
  value: string | number;
  subtext: string;
  trend: 'up' | 'down' | 'neutral';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>
    </motion.div>
  );
}

function StateGauge({ label, value, color }: { label: string; value: number; color: string }) {
  const percentage = (value / 5) * 100;
  
  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-3">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.51} 251`}
            className="transition-all duration-500"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={cn("stop-current", color.split(' ')[0].replace('from-', 'text-'))} />
              <stop offset="100%" className={cn("stop-current", color.split(' ')[1]?.replace('to-', 'text-') || color.split(' ')[0].replace('from-', 'text-'))} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{value.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function OutcomeBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
