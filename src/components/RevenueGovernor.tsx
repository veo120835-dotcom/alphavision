import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, ShieldAlert, ShieldCheck, ShieldOff, Plus, AlertTriangle, TrendingDown, TrendingUp, Scale, Gavel } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { Json } from '@/integrations/supabase/types';

interface GovernanceRule {
  id: string;
  rule_name: string;
  rule_type: string;
  condition_logic: Json;
  enforcement_level: string;
  is_active: boolean;
}

interface GovernanceDecision {
  id: string;
  strategy_description: string;
  strategy_type: string;
  projected_short_term_revenue: number | null;
  projected_long_term_impact: number | null;
  pricing_power_impact: string | null;
  governance_decision: string;
  governance_reasoning: string | null;
  created_at: string;
}

export default function RevenueGovernor() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [showNewRule, setShowNewRule] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    rule_type: 'pricing_discipline',
    enforcement_level: 'warn',
    condition_logic: {}
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['governance-rules', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('revenue_governance_rules')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as GovernanceRule[];
    },
    enabled: !!organization?.id
  });

  const { data: decisions = [], isLoading: decisionsLoading } = useQuery({
    queryKey: ['governance-decisions', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('strategy_governance_decisions')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as GovernanceDecision[];
    },
    enabled: !!organization?.id
  });

  const createRuleMutation = useMutation({
    mutationFn: async (rule: typeof newRule) => {
      if (!organization?.id) throw new Error('No organization');
      const { error } = await supabase.from('revenue_governance_rules').insert({
        organization_id: organization.id,
        ...rule
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-rules'] });
      setShowNewRule(false);
      setNewRule({ rule_name: '', rule_type: 'pricing_discipline', enforcement_level: 'warn', condition_logic: {} });
      toast.success('Governance rule created');
    }
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('revenue_governance_rules')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['governance-rules'] })
  });

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approved': return <ShieldCheck className="h-4 w-4 text-green-500" />;
      case 'blocked': return <ShieldOff className="h-4 w-4 text-red-500" />;
      case 'modified': return <ShieldAlert className="h-4 w-4 text-yellow-500" />;
      default: return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getImpactBadge = (impact: string | null) => {
    if (!impact) return null;
    const colors: Record<string, string> = {
      increase: 'bg-green-500/10 text-green-500',
      decrease: 'bg-red-500/10 text-red-500',
      neutral: 'bg-muted text-muted-foreground'
    };
    return <Badge className={colors[impact] || colors.neutral}>{impact}</Badge>;
  };

  const blockedStrategies = decisions.filter(d => d.governance_decision === 'blocked').length;
  const approvedStrategies = decisions.filter(d => d.governance_decision === 'approved').length;
  const activeRules = rules.filter(r => r.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gavel className="h-8 w-8 text-primary" />
            Revenue Governor
          </h1>
          <p className="text-muted-foreground mt-1">
            Protect long-term revenue power through strategic governance
          </p>
        </div>
        <Dialog open={showNewRule} onOpenChange={setShowNewRule}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Governance Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Rule name"
                value={newRule.rule_name}
                onChange={e => setNewRule({ ...newRule, rule_name: e.target.value })}
              />
              <Select value={newRule.rule_type} onValueChange={v => setNewRule({ ...newRule, rule_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pricing_discipline">Pricing Discipline</SelectItem>
                  <SelectItem value="margin_protection">Margin Protection</SelectItem>
                  <SelectItem value="market_positioning">Market Positioning</SelectItem>
                  <SelectItem value="sustainability">Sustainability</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newRule.enforcement_level} onValueChange={v => setNewRule({ ...newRule, enforcement_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="warn">Warn Only</SelectItem>
                  <SelectItem value="block">Block Strategy</SelectItem>
                  <SelectItem value="require_approval">Require Approval</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                className="w-full" 
                onClick={() => createRuleMutation.mutate(newRule)}
                disabled={!newRule.rule_name}
              >
                Create Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{activeRules}</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Strategies Blocked</p>
                <p className="text-2xl font-bold text-red-500">{blockedStrategies}</p>
              </div>
              <ShieldOff className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Strategies Approved</p>
                <p className="text-2xl font-bold text-green-500">{approvedStrategies}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pricing Power</p>
                <p className="text-2xl font-bold text-primary">Protected</p>
              </div>
              <Scale className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Governance Rules</TabsTrigger>
          <TabsTrigger value="decisions">Recent Decisions</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {rulesLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading rules...</CardContent></Card>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No governance rules yet</h3>
                <p className="text-muted-foreground mt-1">Create rules to protect your long-term revenue power</p>
              </CardContent>
            </Card>
          ) : (
            rules.map(rule => (
              <Card key={rule.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={is_active => toggleRuleMutation.mutate({ id: rule.id, is_active })}
                      />
                      <div>
                        <p className="font-medium">{rule.rule_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{rule.rule_type.replace('_', ' ')}</Badge>
                          <Badge className={
                            rule.enforcement_level === 'block' ? 'bg-red-500/10 text-red-500' :
                            rule.enforcement_level === 'require_approval' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-muted text-muted-foreground'
                          }>
                            {rule.enforcement_level}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          {decisionsLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading decisions...</CardContent></Card>
          ) : decisions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No governance decisions yet</h3>
                <p className="text-muted-foreground mt-1">Strategies will be evaluated as you use the platform</p>
              </CardContent>
            </Card>
          ) : (
            decisions.map(decision => (
              <Card key={decision.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getDecisionIcon(decision.governance_decision)}
                      <div>
                        <p className="font-medium">{decision.strategy_description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{decision.strategy_type}</Badge>
                          {getImpactBadge(decision.pricing_power_impact)}
                          {decision.projected_short_term_revenue && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              ${decision.projected_short_term_revenue.toLocaleString()} short-term
                            </span>
                          )}
                          {decision.projected_long_term_impact && decision.projected_long_term_impact < 0 && (
                            <span className="text-sm text-red-500 flex items-center gap-1">
                              <TrendingDown className="h-3 w-3" />
                              ${Math.abs(decision.projected_long_term_impact).toLocaleString()} long-term loss
                            </span>
                          )}
                        </div>
                        {decision.governance_reasoning && (
                          <p className="text-sm text-muted-foreground mt-2">{decision.governance_reasoning}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={
                      decision.governance_decision === 'approved' ? 'bg-green-500/10 text-green-500' :
                      decision.governance_decision === 'blocked' ? 'bg-red-500/10 text-red-500' :
                      'bg-yellow-500/10 text-yellow-500'
                    }>
                      {decision.governance_decision}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
