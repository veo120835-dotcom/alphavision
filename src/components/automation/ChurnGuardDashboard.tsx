import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, DollarSign, RefreshCw, CheckCircle, Clock, Crown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface PaymentFailure {
  id: string;
  customer_email: string;
  amount_due: number;
  currency: string;
  error_code: string;
  error_message: string;
  retry_count: number;
  next_retry_at: string;
  ltv_estimate: number;
  recovery_strategy: string;
  recovered: boolean;
  created_at: string;
}

export function ChurnGuardDashboard() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: failures, isLoading } = useQuery({
    queryKey: ['payment-failures', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase.functions.invoke('churn-guard', {
        body: {
          action: 'get_failures',
          organization_id: organization.id
        }
      });
      
      if (error) throw error;
      return data.failures as PaymentFailure[];
    },
    enabled: !!organization?.id
  });

  const { data: stats } = useQuery({
    queryKey: ['churn-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const { data, error } = await supabase.functions.invoke('churn-guard', {
        body: {
          action: 'get_stats',
          organization_id: organization.id
        }
      });
      
      if (error) throw error;
      return data.stats;
    },
    enabled: !!organization?.id
  });

  const processRetriesMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('churn-guard', {
        body: {
          action: 'process_retries',
          organization_id: organization.id
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Processed ${data.retries_processed} retries`);
      queryClient.invalidateQueries({ queryKey: ['payment-failures'] });
      queryClient.invalidateQueries({ queryKey: ['churn-stats'] });
    }
  });

  const markRecoveredMutation = useMutation({
    mutationFn: async (failureId: string) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('churn-guard', {
        body: {
          action: 'mark_recovered',
          organization_id: organization.id,
          failure_id: failureId
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Marked as recovered');
      queryClient.invalidateQueries({ queryKey: ['payment-failures'] });
      queryClient.invalidateQueries({ queryKey: ['churn-stats'] });
    }
  });

  const getStrategyBadge = (strategy: string) => {
    switch (strategy) {
      case 'white_glove':
        return <Badge className="bg-yellow-500"><Crown className="h-3 w-3 mr-1" />White Glove</Badge>;
      case 'payday_retry':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Payday Retry</Badge>;
      case 'card_update_request':
        return <Badge variant="outline">Card Update</Badge>;
      default:
        return <Badge variant="outline">Standard</Badge>;
    }
  };

  const recoveryRate = stats?.total_failures 
    ? ((stats.recovered / stats.total_failures) * 100).toFixed(1) 
    : '0';

  const whiteGloveFailures = failures?.filter(f => f.recovery_strategy === 'white_glove') || [];
  const paydayFailures = failures?.filter(f => f.recovery_strategy === 'payday_retry') || [];
  const standardFailures = failures?.filter(f => !['white_glove', 'payday_retry'].includes(f.recovery_strategy)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Churn Guard
          </h1>
          <p className="text-muted-foreground mt-1">
            Intelligent payment recovery with payday-aware retries and LTV-based escalation.
          </p>
        </div>
        <Button 
          onClick={() => processRetriesMutation.mutate()}
          disabled={processRetriesMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${processRetriesMutation.isPending ? 'animate-spin' : ''}`} />
          Process Retries
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold">${(stats?.total_at_risk || 0).toLocaleString()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recovered</p>
                <p className="text-2xl font-bold">${(stats?.total_recovered || 0).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recovery Rate</p>
                <p className="text-2xl font-bold">{recoveryRate}%</p>
              </div>
              <div className="w-16">
                <Progress value={parseFloat(recoveryRate)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failures by Strategy */}
      <Tabs defaultValue="white_glove">
        <TabsList>
          <TabsTrigger value="white_glove" className="gap-2">
            <Crown className="h-4 w-4" />
            White Glove
            <Badge variant="secondary">{whiteGloveFailures.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="payday" className="gap-2">
            <Clock className="h-4 w-4" />
            Payday Retry
            <Badge variant="secondary">{paydayFailures.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="standard" className="gap-2">
            Standard
            <Badge variant="secondary">{standardFailures.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="white_glove" className="space-y-4">
          <Card className="border-yellow-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                High-Value Customers Requiring Personal Outreach
              </CardTitle>
              <CardDescription>
                These customers have high LTV or large payment amounts. Personal call recommended.
              </CardDescription>
            </CardHeader>
          </Card>

          {whiteGloveFailures.map(failure => (
            <Card key={failure.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{failure.customer_email}</p>
                      {getStrategyBadge(failure.recovery_strategy)}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Amount: ${failure.amount_due}</span>
                      <span>LTV: ${failure.ltv_estimate || 'Unknown'}</span>
                      <span>Error: {failure.error_code}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Failed: {new Date(failure.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => markRecoveredMutation.mutate(failure.id)}
                    disabled={markRecoveredMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Recovered
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {whiteGloveFailures.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No high-value payment failures. Great news!
            </div>
          )}
        </TabsContent>

        <TabsContent value="payday" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled for Payday Retry
              </CardTitle>
              <CardDescription>
                These payments failed due to insufficient funds. Retries scheduled for the 1st or 15th.
              </CardDescription>
            </CardHeader>
          </Card>

          {paydayFailures.map(failure => (
            <Card key={failure.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{failure.customer_email}</p>
                      {getStrategyBadge(failure.recovery_strategy)}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Amount: ${failure.amount_due}</span>
                      <span>Retries: {failure.retry_count}</span>
                    </div>
                    <p className="text-sm mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Next retry: {new Date(failure.next_retry_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => markRecoveredMutation.mutate(failure.id)}
                    disabled={markRecoveredMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Recovered
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {paydayFailures.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No payday retry failures pending.
            </div>
          )}
        </TabsContent>

        <TabsContent value="standard" className="space-y-4">
          {standardFailures.map(failure => (
            <Card key={failure.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{failure.customer_email}</p>
                      {getStrategyBadge(failure.recovery_strategy)}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Amount: ${failure.amount_due}</span>
                      <span>Error: {failure.error_code}</span>
                      <span>Retries: {failure.retry_count}</span>
                    </div>
                    <p className="text-sm mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Next retry: {new Date(failure.next_retry_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => markRecoveredMutation.mutate(failure.id)}
                    disabled={markRecoveredMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Recovered
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {standardFailures.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No standard failures pending.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
