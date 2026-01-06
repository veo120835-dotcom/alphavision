import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Heart, X, Zap, Brain, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FounderStateCheckInProps {
  onClose: () => void;
  onComplete: () => void;
}

export function FounderStateCheckIn({ onClose, onComplete }: FounderStateCheckInProps) {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [energy, setEnergy] = useState(3);
  const [confidence, setConfidence] = useState(3);
  const [clarity, setClarity] = useState(3);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const questions = [
    {
      icon: Zap,
      label: "Energy Level",
      question: "How's your energy right now?",
      value: energy,
      setValue: setEnergy,
      color: "from-yellow-500 to-orange-500",
      labels: ["Exhausted", "Low", "Okay", "Good", "Peak"]
    },
    {
      icon: Brain,
      label: "Confidence",
      question: "How confident are you in your current direction?",
      value: confidence,
      setValue: setConfidence,
      color: "from-blue-500 to-cyan-500",
      labels: ["Doubtful", "Uncertain", "Neutral", "Confident", "Certain"]
    },
    {
      icon: Target,
      label: "Decision Clarity",
      question: "How clear are your priorities right now?",
      value: clarity,
      setValue: setClarity,
      color: "from-green-500 to-emerald-500",
      labels: ["Foggy", "Unclear", "Moderate", "Clear", "Crystal"]
    }
  ];

  const detectPatterns = (): string[] => {
    const patterns: string[] = [];
    if (energy <= 2) patterns.push('fatigue');
    if (confidence >= 5 && energy <= 2) patterns.push('overconfidence');
    if (clarity <= 2) patterns.push('paralysis');
    if (confidence <= 2 && clarity <= 2) patterns.push('avoidance');
    return patterns;
  };

  const handleComplete = async () => {
    if (!organization?.id || !user?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('founder_state_logs')
        .insert({
          organization_id: organization.id,
          user_id: user.id,
          energy_level: energy,
          confidence_level: confidence,
          decision_clarity: clarity,
          detected_patterns: detectPatterns(),
          notes: notes.trim() || null
        });

      if (error) throw error;
      
      toast.success("Check-in complete!");
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error saving check-in:', error);
      toast.error("Failed to save check-in");
    } finally {
      setSaving(false);
    }
  };

  const currentQ = questions[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            <h2 className="font-serif text-lg font-semibold">Founder State Check-In</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-4 pt-4">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
          <div
            className={cn(
              "flex-1 h-1 rounded-full transition-colors",
              step >= questions.length ? "bg-primary" : "bg-muted"
            )}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step < questions.length ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className={cn(
                    "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                    `bg-gradient-to-br ${currentQ.color} bg-opacity-20`
                  )}>
                    <currentQ.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">{currentQ.label}</h3>
                  <p className="text-muted-foreground">{currentQ.question}</p>
                </div>

                {/* Rating Buttons */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => currentQ.setValue(val)}
                      className={cn(
                        "w-12 h-12 rounded-lg font-semibold transition-all",
                        currentQ.value === val
                          ? `bg-gradient-to-br ${currentQ.color} text-white scale-110`
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>

                {/* Labels */}
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>{currentQ.labels[0]}</span>
                  <span>{currentQ.labels[4]}</span>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => setStep(step + 1)}
                >
                  Continue
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="notes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium mb-1">Anything else?</h3>
                  <p className="text-muted-foreground text-sm">Optional notes for context</p>
                </div>

                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What's on your mind today..."
                  rows={3}
                />

                {/* Summary */}
                <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Energy</span>
                    <span className="font-medium">{energy}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{confidence}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Clarity</span>
                    <span className="font-medium">{clarity}/5</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleComplete}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Complete"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
