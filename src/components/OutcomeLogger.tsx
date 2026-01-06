import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, Minus, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Decision {
  id: string;
  recommendation: string;
  created_at: string;
}

interface OutcomeLoggerProps {
  onClose: () => void;
}

export function OutcomeLogger({ onClose }: OutcomeLoggerProps) {
  const { organization } = useOrganization();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<string>("");
  const [outcomeType, setOutcomeType] = useState<"positive" | "negative" | "neutral">("positive");
  const [description, setDescription] = useState("");
  const [impactScore, setImpactScore] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDecisions();
  }, [organization?.id]);

  const loadDecisions = async () => {
    if (!organization?.id) return;
    
    const { data } = await supabase
      .from('decisions')
      .select('id, recommendation, created_at, session:sessions!inner(organization_id)')
      .eq('session.organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setDecisions(data.map(d => ({
        id: d.id,
        recommendation: d.recommendation,
        created_at: d.created_at
      })));
    }
  };

  const handleSubmit = async () => {
    if (!organization?.id || !selectedDecision || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('decision_outcomes').insert({
        organization_id: organization.id,
        decision_id: selectedDecision,
        outcome_type: outcomeType,
        outcome_description: description,
        impact_score: impactScore
      });

      if (error) throw error;
      
      toast.success("Outcome logged successfully!");
      onClose();
    } catch (error) {
      console.error("Error logging outcome:", error);
      toast.error("Failed to log outcome");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-6 w-full max-w-lg space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Log Decision Outcome</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Decision Select */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Decision</label>
          <Select value={selectedDecision} onValueChange={setSelectedDecision}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a decision to log outcome for..." />
            </SelectTrigger>
            <SelectContent>
              {decisions.map((decision) => (
                <SelectItem key={decision.id} value={decision.id}>
                  <span className="line-clamp-1">{decision.recommendation}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Outcome Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Outcome Type</label>
          <div className="flex gap-2">
            {[
              { type: "positive" as const, icon: TrendingUp, color: "text-green-500 border-green-500 bg-green-500/10" },
              { type: "neutral" as const, icon: Minus, color: "text-yellow-500 border-yellow-500 bg-yellow-500/10" },
              { type: "negative" as const, icon: TrendingDown, color: "text-red-500 border-red-500 bg-red-500/10" }
            ].map(({ type, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => setOutcomeType(type)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all",
                  outcomeType === type ? color : "border-muted text-muted-foreground hover:border-border"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Impact Score */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Impact Score (-5 to +5)</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="-5"
              max="5"
              value={impactScore}
              onChange={(e) => setImpactScore(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className={cn(
              "text-lg font-bold min-w-[3ch] text-center",
              impactScore > 0 && "text-green-500",
              impactScore < 0 && "text-red-500",
              impactScore === 0 && "text-yellow-500"
            )}>
              {impactScore > 0 ? `+${impactScore}` : impactScore}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">What happened?</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the outcome and any learnings..."
            rows={4}
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={loading || !selectedDecision || !description}
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Logging...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Log Outcome
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}