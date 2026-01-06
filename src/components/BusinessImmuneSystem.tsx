import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, ShieldAlert, ShieldCheck, AlertTriangle,
  Ban, Sparkles, Users, DollarSign, Target, Plus,
  CheckCircle2, XCircle, Eye, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface Threat {
  id: string;
  threat_type: string;
  source: string;
  description: string;
  severity: string;
  auto_blocked: boolean;
  potential_damage: number;
  detected_at: string;
  resolved_at: string | null;
}

interface ImmuneRule {
  id: string;
  rule_name: string;
  rule_type: string;
  conditions: any;
  action: string;
  is_active: boolean;
  times_triggered: number;
}

const threatTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
  bad_client: { icon: Users, label: 'Bad Client', color: 'text-red-400' },
  bad_deal: { icon: DollarSign, label: 'Bad Deal', color: 'text-orange-400' },
  shiny_object: { icon: Sparkles, label: 'Shiny Object Syndrome', color: 'text-yellow-400' },
  emotional_decision: { icon: AlertTriangle, label: 'Emotional Decision', color: 'text-pink-400' },
  scarcity_panic: { icon: Target, label: 'Scarcity Panic', color: 'text-purple-400' },
  scope_creep: { icon: RotateCcw, label: 'Scope Creep', color: 'text-blue-400' },
  underpricing: { icon: DollarSign, label: 'Underpricing', color: 'text-cyan-400' }
};

export default function BusinessImmuneSystem() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [rules, setRules] = useState<ImmuneRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);
  const { organization } = useOrganization();

  const [newRule, setNewRule] = useState({
    rule_name: '',
    rule_type: 'client_filter',
    action: 'warn'
  });

  useEffect(() => {
    if (organization?.id) {
      fetchThreats();
      fetchRules();
    }
  }, [organization?.id]);

  const fetchThreats = async () => {
    try {
      const { data, error } = await supabase
        .from('business_threats')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('detected_at', { ascending: false });
      
      if (error) throw error;
      setThreats(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('immune_system_rules')
        .select('*')
        .eq('organization_id', organization!.id);
      
      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addRule = async () => {
    if (!organization?.id || !newRule.rule_name) return;

    try {
      const { error } = await supabase
        .from('immune_system_rules')
        .insert({
          organization_id: organization.id,
          ...newRule,
          conditions: {},
          is_active: true
        });

      if (error) throw error;
      toast.success('Rule added');
      setShowAddRule(false);
      fetchRules();
    } catch (error) {
      toast.error('Failed to add rule');
    }
  };

  const toggleRule = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('immune_system_rules')
        .update({ is_active: active })
        .eq('id', id);

      if (error) throw error;
      fetchRules();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const resolveThreal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('business_threats')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Threat resolved');
      fetchThreats();
    } catch (error) {
      toast.error('Failed to resolve');
    }
  };

  const activeThreats = threats.filter(t => !t.resolved_at);
  const blockedThreats = threats.filter(t => t.auto_blocked);
  const totalDamagePrevented = threats
    .filter(t => t.auto_blocked || t.resolved_at)
    .reduce((sum, t) => sum + (t.potential_damage || 0), 0);

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
            🛡️ Business Immune System
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Active defense against bad clients, bad deals, shiny-object syndrome,
            emotional decisions, and scarcity panic. Treats threats like viruses.
          </p>
        </div>
        <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Immune Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Rule Name</label>
                <Input 
                  placeholder="e.g., Block clients under $5k"
                  value={newRule.rule_name}
                  onChange={e => setNewRule({...newRule, rule_name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rule Type</label>
                <Select value={newRule.rule_type} onValueChange={v => setNewRule({...newRule, rule_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_filter">Client Filter</SelectItem>
                    <SelectItem value="deal_filter">Deal Filter</SelectItem>
                    <SelectItem value="decision_filter">Decision Filter</SelectItem>
                    <SelectItem value="spending_filter">Spending Filter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Action</label>
                <Select value={newRule.action} onValueChange={v => setNewRule({...newRule, action: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warn">Warn</SelectItem>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="escalate">Escalate</SelectItem>
                    <SelectItem value="auto_decline">Auto-Decline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddRule(false)}>Cancel</Button>
                <Button onClick={addRule}>Add Rule</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 text-center">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <div className="text-2xl font-bold text-red-400">{activeThreats.length}</div>
            <div className="text-sm text-muted-foreground">Active Threats</div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4 text-center">
            <Ban className="w-8 h-8 mx-auto mb-2 text-orange-400" />
            <div className="text-2xl font-bold text-orange-400">{blockedThreats.length}</div>
            <div className="text-sm text-muted-foreground">Auto-Blocked</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 text-center">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold text-green-400">{rules.filter(r => r.is_active).length}</div>
            <div className="text-sm text-muted-foreground">Active Rules</div>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-primary">
              ${totalDamagePrevented.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Damage Prevented</div>
          </CardContent>
        </Card>
      </div>

      {/* Immune Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Immune System Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No immune rules configured yet</p>
              <Button variant="outline" onClick={() => setShowAddRule(true)}>Add First Rule</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div 
                  key={rule.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    rule.is_active ? "bg-green-500/5 border-green-500/30" : "bg-muted/50 border-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Shield className={cn("w-5 h-5", rule.is_active ? "text-green-400" : "text-muted-foreground")} />
                    <div>
                      <h4 className="font-medium">{rule.rule_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{rule.rule_type}</Badge>
                        <Badge variant="outline" className="text-xs">{rule.action}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Triggered {rule.times_triggered || 0}x
                        </span>
                      </div>
                    </div>
                  </div>
                  <Switch 
                    checked={rule.is_active} 
                    onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Threats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Detected Threats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeThreats.length === 0 ? (
            <div className="text-center py-8">
              <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <h3 className="font-medium text-green-400">All Clear</h3>
              <p className="text-sm text-muted-foreground">No active threats detected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeThreats.map((threat) => {
                const config = threatTypeConfig[threat.threat_type] || threatTypeConfig.bad_client;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={threat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border",
                      threat.severity === 'critical' && "border-red-500/50 bg-red-500/10",
                      threat.severity === 'high' && "border-orange-500/50 bg-orange-500/10",
                      threat.severity === 'medium' && "border-yellow-500/50 bg-yellow-500/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-muted", config.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{config.label}</h4>
                          {threat.auto_blocked && (
                            <Badge className="bg-red-500 text-white text-xs">BLOCKED</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{threat.description}</p>
                        {threat.potential_damage && (
                          <span className="text-xs text-red-400">
                            Potential damage: ${threat.potential_damage.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => resolveThreal(threat.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Resolve
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Philosophy */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">🦠 The Immune System Philosophy</h3>
          <p className="text-muted-foreground">
            "The AI actively defends against bad clients, bad deals, shiny-object syndrome,
            emotional decisions, and scarcity panic. It treats these like viruses.
            This dramatically increases survival and long-term earnings."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
