import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Eye,
  ArrowRight,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Scale,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { Json } from '@/integrations/supabase/types';

interface ArbitrageOpportunity {
  id: string;
  opportunity_type: string;
  title: string;
  description: string;
  current_state: Json;
  optimal_state: Json;
  estimated_uplift_percent: number | null;
  estimated_uplift_amount: number | null;
  confidence_score: number | null;
  evidence: Json;
  action_required: string | null;
  status: string;
  captured_value: number | null;
  detected_at: string;
}

const opportunityTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pricing_gap: { icon: DollarSign, color: 'text-green-500', label: 'Pricing Gap' },
  demand_mismatch: { icon: Users, color: 'text-blue-500', label: 'Demand Mismatch' },
  skill_underpricing: { icon: Target, color: 'text-purple-500', label: 'Skill Underpricing' },
  attention_mispricing: { icon: Eye, color: 'text-orange-500', label: 'Attention Mispricing' },
  service_gap: { icon: Zap, color: 'text-cyan-500', label: 'Service Gap' }
};

export default function ArbitrageEngine() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['arbitrage-opportunities', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('arbitrage_opportunities')
        .select('*')
        .eq('organization_id', organization.id)
        .order('estimated_uplift_amount', { ascending: false });
      if (error) throw error;
      return data as ArbitrageOpportunity[];
    },
    enabled: !!organization?.id
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, captured_value }: { id: string; status: string; captured_value?: number }) => {
      const updateData: { status: string; actioned_at?: string; captured_value?: number } = { status };
      if (status === 'captured') {
        updateData.actioned_at = new Date().toISOString();
        if (captured_value) updateData.captured_value = captured_value;
      }
      const { error } = await supabase
        .from('arbitrage_opportunities')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arbitrage-opportunities'] });
      toast.success('Status updated');
    }
  });

  const actionableOpps = opportunities.filter(o => o.status === 'actionable' || o.status === 'detected');
  const capturedOpps = opportunities.filter(o => o.status === 'captured');
  const totalPotentialUplift = actionableOpps.reduce((sum, o) => sum + (o.estimated_uplift_amount || 0), 0);
  const totalCapturedValue = capturedOpps.reduce((sum, o) => sum + (o.captured_value || 0), 0);

  const getTypeConfig = (type: string) => opportunityTypeConfig[type] || { icon: Sparkles, color: 'text-muted-foreground', label: type };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Scale className="h-8 w-8 text-primary" />
          Arbitrage Detection Engine
        </h1>
        <p className="text-muted-foreground mt-1">
          Find hidden pricing inefficiencies and demand mismatches
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Potential Uplift</p>
                <p className="text-2xl font-bold text-green-500">
                  ${totalPotentialUplift.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Value Captured</p>
                <p className="text-2xl font-bold">${totalCapturedValue.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actionable</p>
                <p className="text-2xl font-bold">{actionableOpps.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Found</p>
                <p className="text-2xl font-bold">{opportunities.length}</p>
              </div>
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="actionable">
        <TabsList>
          <TabsTrigger value="actionable">Actionable ({actionableOpps.length})</TabsTrigger>
          <TabsTrigger value="captured">Captured ({capturedOpps.length})</TabsTrigger>
          <TabsTrigger value="all">All Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="actionable" className="space-y-4">
          {isLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Scanning for opportunities...</CardContent></Card>
          ) : actionableOpps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No actionable opportunities yet</h3>
                <p className="text-muted-foreground mt-1">The engine continuously scans for arbitrage opportunities</p>
              </CardContent>
            </Card>
          ) : (
            actionableOpps.map(opp => {
              const config = getTypeConfig(opp.opportunity_type);
              const Icon = config.icon;
              return (
                <Card key={opp.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{opp.title}</p>
                            <Badge variant="outline">{config.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{opp.description}</p>
                          
                          {/* Current → Optimal */}
                          <div className="flex items-center gap-3 mt-3 p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Current State</p>
                              <p className="text-sm font-medium">
                                {typeof opp.current_state === 'object' && opp.current_state !== null 
                                  ? JSON.stringify(opp.current_state) 
                                  : 'Not specified'}
                              </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Optimal State</p>
                              <p className="text-sm font-medium text-green-500">
                                {typeof opp.optimal_state === 'object' && opp.optimal_state !== null 
                                  ? JSON.stringify(opp.optimal_state) 
                                  : 'Not specified'}
                              </p>
                            </div>
                          </div>

                          {/* Metrics */}
                          <div className="flex items-center gap-4 mt-3">
                            {opp.estimated_uplift_percent && (
                              <Badge className="bg-green-500/10 text-green-500">
                                +{opp.estimated_uplift_percent}% uplift
                              </Badge>
                            )}
                            {opp.estimated_uplift_amount && (
                              <span className="text-sm font-medium text-green-500">
                                +${opp.estimated_uplift_amount.toLocaleString()}
                              </span>
                            )}
                            {opp.confidence_score && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Confidence:</span>
                                <Progress value={opp.confidence_score} className="w-20 h-2" />
                                <span className="text-xs">{opp.confidence_score}%</span>
                              </div>
                            )}
                          </div>

                          {opp.action_required && (
                            <p className="text-sm mt-3 p-2 bg-primary/5 rounded border-l-2 border-primary">
                              <strong>Action:</strong> {opp.action_required}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: opp.id, status: 'dismissed' })}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ 
                            id: opp.id, 
                            status: 'captured',
                            captured_value: opp.estimated_uplift_amount || 0
                          })}
                        >
                          Capture
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="captured" className="space-y-4">
          {capturedOpps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No captured opportunities yet</h3>
                <p className="text-muted-foreground mt-1">Mark opportunities as captured when you act on them</p>
              </CardContent>
            </Card>
          ) : (
            capturedOpps.map(opp => {
              const config = getTypeConfig(opp.opportunity_type);
              const Icon = config.icon;
              return (
                <Card key={opp.id} className="border-green-500/20">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{opp.title}</p>
                          <Badge variant="outline" className="mt-1">{config.label}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-500">
                          +${(opp.captured_value || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">captured</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {opportunities.map(opp => {
            const config = getTypeConfig(opp.opportunity_type);
            const Icon = config.icon;
            return (
              <Card key={opp.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${config.color}`} />
                      <div>
                        <p className="font-medium">{opp.title}</p>
                        <p className="text-sm text-muted-foreground">{opp.description}</p>
                      </div>
                    </div>
                    <Badge className={
                      opp.status === 'captured' ? 'bg-green-500/10 text-green-500' :
                      opp.status === 'actionable' ? 'bg-primary/10 text-primary' :
                      opp.status === 'dismissed' ? 'bg-muted text-muted-foreground' :
                      'bg-yellow-500/10 text-yellow-500'
                    }>
                      {opp.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
