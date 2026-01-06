import { useAlphaVisionStore } from "@/store/alpha-vision-store";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function DecisionsView() {
  const { decisionLog } = useAlphaVisionStore();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved': return { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10' };
      case 'executed': return { icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-400/10' };
      case 'rejected': return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' };
      default: return { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">Decision Log</h1>
        <p className="text-muted-foreground">
          Every recommendation, assumption, and outcome—tracked for accountability and learning.
        </p>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {decisionLog.map((entry, index) => (
            <DecisionLogCard key={entry.id} entry={entry} index={index} statusConfig={getStatusConfig(entry.status)} />
          ))}
        </AnimatePresence>
      </div>

      {decisionLog.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No decisions logged yet. Start a conversation to generate recommendations.</p>
        </div>
      )}
    </div>
  );
}

function DecisionLogCard({ entry, index, statusConfig }: { 
  entry: any; 
  index: number;
  statusConfig: { icon: typeof CheckCircle2; color: string; bg: string };
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={cn("p-2 rounded-lg", statusConfig.bg)}>
            <StatusIcon className={cn("w-5 h-5", statusConfig.color)} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">{entry.summary}</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(entry.timestamp).toLocaleDateString()} • {entry.status}
            </p>
          </div>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-muted-foreground transition-transform",
          isExpanded && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-4">
              {/* Recommendation */}
              <div>
                <h4 className="text-sm font-semibold text-primary mb-1">Recommendation</h4>
                <p className="text-foreground">{entry.recommendation}</p>
              </div>

              {/* Assumptions */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Assumptions</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {entry.assumptions.map((a: string, i: number) => (
                    <li key={i}>• {a}</li>
                  ))}
                </ul>
              </div>

              {/* Metrics & Kill Criteria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-green-400 mb-1">Metrics</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {entry.metrics.map((m: string, i: number) => (
                      <li key={i}>• {m}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-400 mb-1">Kill Criteria</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {entry.killCriteria.map((k: string, i: number) => (
                      <li key={i}>• {k}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
