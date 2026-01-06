import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle, Calendar, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, subMonths } from "date-fns";

interface TimelineEntry {
  id: string;
  type: 'decision' | 'outcome';
  date: Date;
  title: string;
  status: 'positive' | 'negative' | 'neutral' | 'pending';
  impact?: number;
  mattered: boolean;
  insight?: string;
}

export function TimeTravelReview() {
  const { organization } = useOrganization();
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<{ mattered: string[]; didntMatter: string[]; shouldIgnore: string[] }>({
    mattered: [],
    didntMatter: [],
    shouldIgnore: []
  });

  useEffect(() => {
    if (organization?.id) {
      loadTimeline();
    }
  }, [organization?.id]);

  const loadTimeline = async () => {
    if (!organization?.id) return;
    
    try {
      const threeMonthsAgo = subMonths(new Date(), 3);

      // Fetch decisions with outcomes
      const { data: decisions } = await supabase
        .from('decisions')
        .select(`
          id, 
          recommendation, 
          created_at, 
          status,
          session:sessions!inner(organization_id)
        `)
        .eq('session.organization_id', organization.id)
        .gte('created_at', threeMonthsAgo.toISOString())
        .order('created_at', { ascending: false });

      const { data: outcomes } = await supabase
        .from('decision_outcomes')
        .select('*')
        .eq('organization_id', organization.id)
        .gte('observed_at', threeMonthsAgo.toISOString());

      const outcomeMap = new Map<string, typeof outcomes[0]>();
      outcomes?.forEach(o => outcomeMap.set(o.decision_id, o));

      const entries: TimelineEntry[] = (decisions || []).map(d => {
        const outcome = outcomeMap.get(d.id);
        return {
          id: d.id,
          type: 'decision' as const,
          date: new Date(d.created_at),
          title: d.recommendation,
          status: outcome 
            ? (outcome.outcome_type as 'positive' | 'negative' | 'neutral')
            : 'pending',
          impact: outcome?.impact_score || 0,
          mattered: outcome ? Math.abs(outcome.impact_score || 0) >= 3 : false,
          insight: outcome?.outcome_description
        };
      });

      setTimeline(entries);

      // Generate insights
      const mattered = entries.filter(e => e.mattered && e.status === 'positive').map(e => e.title);
      const didntMatter = entries.filter(e => e.status === 'pending').map(e => e.title);
      const shouldIgnore = entries.filter(e => e.mattered && e.status === 'negative').map(e => e.title);

      setInsights({
        mattered: mattered.slice(0, 3),
        didntMatter: didntMatter.slice(0, 3),
        shouldIgnore: shouldIgnore.slice(0, 3)
      });

    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <span className="font-medium">Time-Travel Review</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
          Looking Back: What Actually Mattered?
        </h1>
        <p className="text-muted-foreground">
          A retrospective view of your decisions from the past 3 months
        </p>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard
          icon={CheckCircle2}
          title="What Mattered"
          items={insights.mattered}
          color="text-green-500"
          bgColor="from-green-500/20 to-emerald-500/20"
          emptyText="No high-impact positive decisions yet"
        />
        <InsightCard
          icon={AlertTriangle}
          title="Still Pending"
          items={insights.didntMatter}
          color="text-yellow-500"
          bgColor="from-yellow-500/20 to-amber-500/20"
          emptyText="All decisions have outcomes logged"
        />
        <InsightCard
          icon={XCircle}
          title="Should Have Avoided"
          items={insights.shouldIgnore}
          color="text-red-500"
          bgColor="from-red-500/20 to-rose-500/20"
          emptyText="No regrettable decisions found"
        />
      </div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Decision Timeline</h2>
            <p className="text-sm text-muted-foreground">Your decisions and their outcomes over time</p>
          </div>
        </div>

        {timeline.length > 0 ? (
          <div className="space-y-4">
            {timeline.map((entry, i) => (
              <TimelineItem key={entry.id} entry={entry} isLast={i === timeline.length - 1} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No decisions in the past 3 months.</p>
            <p className="text-sm">Start making decisions to see your timeline.</p>
          </div>
        )}
      </motion.div>

      {/* AI Reflection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6 border-l-4 border-primary"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">AI Reflection</h3>
            <p className="text-muted-foreground text-sm">
              {timeline.length > 0 ? (
                <>
                  Based on your {timeline.length} decisions in the past 3 months, 
                  {insights.mattered.length > 0 && ` ${insights.mattered.length} had significant positive impact.`}
                  {insights.shouldIgnore.length > 0 && ` Consider avoiding decisions similar to "${insights.shouldIgnore[0]?.slice(0, 50)}..." in the future.`}
                  {insights.didntMatter.length > 0 && ` You have ${insights.didntMatter.length} decisions awaiting outcome logging.`}
                </>
              ) : (
                "Start making and logging decisions to receive personalized insights about your decision-making patterns."
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InsightCard({ 
  icon: Icon, 
  title, 
  items, 
  color, 
  bgColor, 
  emptyText 
}: { 
  icon: typeof CheckCircle2;
  title: string;
  items: string[];
  color: string;
  bgColor: string;
  emptyText: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={cn("p-2 rounded-lg bg-gradient-to-br", bgColor)}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
        <h3 className="font-medium">{title}</h3>
      </div>
      
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground line-clamp-2">
              • {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground/50">{emptyText}</p>
      )}
    </motion.div>
  );
}

function TimelineItem({ entry, isLast }: { entry: TimelineEntry; isLast: boolean }) {
  const getStatusIcon = () => {
    switch (entry.status) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'neutral': return <div className="w-4 h-4 rounded-full bg-yellow-500" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground animate-pulse" />;
    }
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          entry.status === 'positive' && "bg-green-500/20",
          entry.status === 'negative' && "bg-red-500/20",
          entry.status === 'neutral' && "bg-yellow-500/20",
          entry.status === 'pending' && "bg-muted"
        )}>
          {getStatusIcon()}
        </div>
        {!isLast && <div className="w-px h-full bg-border flex-1 mt-2" />}
      </div>
      
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">
            {format(entry.date, 'MMM d, yyyy')}
          </span>
          {entry.mattered && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
              High Impact
            </span>
          )}
        </div>
        <p className="font-medium line-clamp-2">{entry.title}</p>
        {entry.insight && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{entry.insight}</p>
        )}
        {entry.impact !== undefined && entry.status !== 'pending' && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Impact:</span>
            <span className={cn(
              "text-xs font-medium",
              entry.impact > 0 && "text-green-500",
              entry.impact < 0 && "text-red-500",
              entry.impact === 0 && "text-yellow-500"
            )}>
              {entry.impact > 0 ? `+${entry.impact}` : entry.impact}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}