import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Handshake, Heart, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, TrendingDown, Shield, Plus, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface TrustEntry {
  id: string;
  stakeholder_type: string;
  stakeholder_name: string;
  promise_made: string;
  delivery_deadline: string;
  delivery_status: string;
  trust_impact_score: number;
}

export default function TrustReputationEngine() {
  const [entries, setEntries] = useState<TrustEntry[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPromise, setShowAddPromise] = useState(false);
  const { organization } = useOrganization();

  const [newPromise, setNewPromise] = useState({
    stakeholder_type: 'client',
    stakeholder_name: '',
    promise_made: '',
    delivery_deadline: ''
  });

  useEffect(() => {
    if (organization?.id) {
      fetchEntries();
      fetchRisks();
    }
  }, [organization?.id]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('trust_capital_ledger')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('delivery_deadline', { ascending: true });
      
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRisks = async () => {
    try {
      const { data, error } = await supabase
        .from('reputation_risk_alerts')
        .select('*')
        .eq('organization_id', organization!.id)
        .is('resolved_at', null);
      
      if (error) throw error;
      setRisks(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addPromise = async () => {
    if (!organization?.id || !newPromise.promise_made) return;

    try {
      const { error } = await supabase
        .from('trust_capital_ledger')
        .insert({
          organization_id: organization.id,
          ...newPromise,
          delivery_status: 'pending',
          promise_date: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Promise tracked');
      setShowAddPromise(false);
      setNewPromise({ stakeholder_type: 'client', stakeholder_name: '', promise_made: '', delivery_deadline: '' });
      fetchEntries();
    } catch (error) {
      toast.error('Failed to add promise');
    }
  };

  const updateDeliveryStatus = async (id: string, status: string, impact: number) => {
    try {
      const { error } = await supabase
        .from('trust_capital_ledger')
        .update({ 
          delivery_status: status,
          delivered_at: status !== 'pending' ? new Date().toISOString() : null,
          trust_impact_score: impact
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status updated');
      fetchEntries();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const pendingPromises = entries.filter(e => e.delivery_status === 'pending');
  const deliveredOnTime = entries.filter(e => ['delivered_early', 'delivered_on_time'].includes(e.delivery_status));
  const brokenPromises = entries.filter(e => e.delivery_status === 'broken');
  
  const trustScore = entries.length > 0
    ? Math.round((deliveredOnTime.length / entries.length) * 100)
    : 100;

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
            🤝 Trust & Reputation Capital
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Track promises made and kept. Protect brand credibility, pricing power, 
            and long-term goodwill. Trust is the ultimate moat.
          </p>
        </div>
        <Dialog open={showAddPromise} onOpenChange={setShowAddPromise}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Track Promise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Track a Promise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Stakeholder Type</label>
                <Select value={newPromise.stakeholder_type} onValueChange={v => setNewPromise({...newPromise, stakeholder_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="market">Market/Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Stakeholder Name</label>
                <Input 
                  placeholder="e.g., Acme Corp"
                  value={newPromise.stakeholder_name}
                  onChange={e => setNewPromise({...newPromise, stakeholder_name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Promise Made</label>
                <Textarea 
                  placeholder="What did you promise?"
                  value={newPromise.promise_made}
                  onChange={e => setNewPromise({...newPromise, promise_made: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Delivery Deadline</label>
                <Input 
                  type="date"
                  value={newPromise.delivery_deadline}
                  onChange={e => setNewPromise({...newPromise, delivery_deadline: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddPromise(false)}>Cancel</Button>
                <Button onClick={addPromise}>Track Promise</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Trust Score */}
      <Card className={cn(
        "border-2",
        trustScore >= 80 ? "border-green-500/50 bg-green-500/5" :
        trustScore >= 60 ? "border-yellow-500/50 bg-yellow-500/5" :
        "border-red-500/50 bg-red-500/5"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className={cn(
              "p-4 rounded-2xl",
              trustScore >= 80 ? "bg-green-500/20" :
              trustScore >= 60 ? "bg-yellow-500/20" :
              "bg-red-500/20"
            )}>
              <Heart className={cn(
                "w-10 h-10",
                trustScore >= 80 ? "text-green-400" :
                trustScore >= 60 ? "text-yellow-400" :
                "text-red-400"
              )} />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold">{trustScore}%</span>
                <span className="text-muted-foreground">Trust Score</span>
              </div>
              <Progress value={trustScore} className="h-3" />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">{deliveredOnTime.length}</div>
                <div className="text-xs text-muted-foreground">Delivered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{pendingPromises.length}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{brokenPromises.length}</div>
                <div className="text-xs text-muted-foreground">Broken</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reputation Risks */}
      {risks.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Reputation Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {risks.map((risk) => (
                <div key={risk.id} className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-red-500 text-white">{risk.severity}</Badge>
                    <span className="font-medium">{risk.risk_type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{risk.description}</p>
                  {risk.recommended_action && (
                    <p className="text-sm text-red-400 mt-2">→ {risk.recommended_action}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Promises */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            Pending Promises ({pendingPromises.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPromises.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p className="text-muted-foreground">No pending promises</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPromises.map((entry) => {
                const deadline = new Date(entry.delivery_deadline);
                const isOverdue = deadline < new Date();
                const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border",
                      isOverdue ? "border-red-500/50 bg-red-500/10" : "border-yellow-500/30 bg-yellow-500/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isOverdue ? "bg-red-500/20" : "bg-yellow-500/20"
                      )}>
                        <Users className={cn(
                          "w-5 h-5",
                          isOverdue ? "text-red-400" : "text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <h4 className="font-medium">{entry.stakeholder_name || entry.stakeholder_type}</h4>
                        <p className="text-sm text-muted-foreground">{entry.promise_made}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3" />
                          <span className={cn(
                            "text-xs",
                            isOverdue ? "text-red-400" : "text-muted-foreground"
                          )}>
                            {isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateDeliveryStatus(entry.id, 'delivered_on_time', 5)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1 text-green-400" />
                        Delivered
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => updateDeliveryStatus(entry.id, 'broken', -10)}
                      >
                        Broken
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Philosophy */}
      <Card className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-500/30">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">💎 The Trust Imperative</h3>
          <p className="text-muted-foreground">
            "The AI tracks promises made and promises kept. It protects brand credibility,
            pricing power, and long-term goodwill. Example: 'Do not accept this client.
            Trust damage risk exceeds revenue.' This is extremely rare—and extremely valuable."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
