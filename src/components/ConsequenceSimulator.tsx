import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  GitBranch, ArrowRight, AlertCircle, CheckCircle2,
  Sparkles, TrendingUp, TrendingDown, Target, Clock, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useOrganization } from "@/hooks/useOrganization";
import { useMockStorage, generateMockId, generateMockTimestamp } from "@/hooks/useMockStorage";

interface Simulation {
  id: string;
  action_description: string;
  first_order_effects: any[];
  second_order_effects: any[];
  third_order_effects: any[];
  net_expected_value: number;
  proceed_recommended: boolean;
  simulated_at: string;
}

export default function ConsequenceSimulator() {
  const { organization } = useOrganization();
  const { data: simulations, setData: setSimulations, loading } = useMockStorage<Simulation>(
    `consequence_simulations_${organization?.id}`,
    []
  );
  const [showSimulate, setShowSimulate] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [action, setAction] = useState('');

  const runSimulation = async () => {
    if (!organization?.id || !action) return;

    setSimulating(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    const firstOrder = [
      { effect: "Immediate revenue increase", type: "positive", magnitude: "high" },
      { effect: "Increased workload", type: "negative", magnitude: "medium" }
    ];
    
    const secondOrder = [
      { effect: "Team burnout in 3 months", type: "negative", magnitude: "high" },
      { effect: "Referral increase from happy clients", type: "positive", magnitude: "medium" }
    ];
    
    const thirdOrder = [
      { effect: "Hiring pressure", type: "neutral", magnitude: "medium" },
      { effect: "Market perception shift", type: "positive", magnitude: "low" }
    ];

    const newSimulation: Simulation = {
      id: generateMockId(),
      action_description: action,
      first_order_effects: firstOrder,
      second_order_effects: secondOrder,
      third_order_effects: thirdOrder,
      net_expected_value: Math.random() * 50000 - 10000,
      proceed_recommended: Math.random() > 0.3,
      simulated_at: generateMockTimestamp()
    };

    setSimulations([newSimulation, ...simulations]);
    toast.success('Simulation complete');
    setShowSimulate(false);
    setAction('');
    setSimulating(false);
  };

  const getEffectIcon = (type: string) => {
    if (type === 'positive') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (type === 'negative') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Target className="w-4 h-4 text-yellow-400" />;
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
            🔮 Second-Order Consequence Simulator
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Before any major action, simulate first, second, and third-order effects.
            Humans stop at first order. Elite strategists think three steps ahead.
          </p>
        </div>
        <Dialog open={showSimulate} onOpenChange={setShowSimulate}>
          <DialogTrigger asChild>
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Simulate Action
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Simulate Consequences</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Action to Simulate</label>
                <Textarea 
                  placeholder="e.g., Raise prices by 25% across all products"
                  value={action}
                  onChange={e => setAction(e.target.value)}
                  rows={3}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                The AI will analyze first, second, and third-order effects across a 12-month horizon.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSimulate(false)}>Cancel</Button>
                <Button onClick={runSimulation} disabled={simulating}>
                  {simulating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Simulating...
                    </>
                  ) : (
                    <>Run Simulation</>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* How It Works */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4">
            {[
              { label: '1st Order', desc: 'Direct effects', color: 'text-green-400' },
              { label: '2nd Order', desc: 'Ripple effects', color: 'text-yellow-400' },
              { label: '3rd Order', desc: 'Long-term shifts', color: 'text-red-400' }
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className={cn("font-bold text-lg", step.color)}>{step.label}</div>
                  <div className="text-xs text-muted-foreground">{step.desc}</div>
                </div>
                {i < 2 && <ArrowRight className="w-6 h-6 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Simulations */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Recent Simulations</h2>

        {simulations.length === 0 ? (
          <Card className="p-8 text-center">
            <GitBranch className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Simulations Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Run your first simulation to see multi-order consequences.
            </p>
            <Button onClick={() => setShowSimulate(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Run Simulation
            </Button>
          </Card>
        ) : (
          simulations.map((sim, index) => (
            <motion.div
              key={sim.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "border-l-4",
                sim.proceed_recommended ? "border-l-green-500" : "border-l-red-500"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-lg mb-1">{sim.action_description}</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(sim.simulated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {sim.proceed_recommended ? (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Proceed
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500 text-white">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Caution
                      </Badge>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {/* First Order */}
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <h4 className="font-medium text-green-400 mb-3">1st Order Effects</h4>
                      <div className="space-y-2">
                        {(sim.first_order_effects || []).map((effect: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            {getEffectIcon(effect.type)}
                            <span>{effect.effect}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Second Order */}
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <h4 className="font-medium text-yellow-400 mb-3">2nd Order Effects</h4>
                      <div className="space-y-2">
                        {(sim.second_order_effects || []).map((effect: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            {getEffectIcon(effect.type)}
                            <span>{effect.effect}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Third Order */}
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <h4 className="font-medium text-red-400 mb-3">3rd Order Effects</h4>
                      <div className="space-y-2">
                        {(sim.third_order_effects || []).map((effect: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            {getEffectIcon(effect.type)}
                            <span>{effect.effect}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {sim.net_expected_value && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Net Expected Value (12 months)</span>
                        <span className={cn(
                          "font-bold text-lg",
                          sim.net_expected_value >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {sim.net_expected_value >= 0 ? '+' : ''}${sim.net_expected_value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Example */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">💡 Example</h3>
          <p className="text-muted-foreground">
            "Raising prices improves revenue now (1st order) but weakens referral velocity 
            in 3 months (2nd order) which compounds into slower organic growth (3rd order).
            This is how elite strategists think."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}