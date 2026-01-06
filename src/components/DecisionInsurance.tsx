import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Zap,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { addDays, format } from 'date-fns';

interface InsurancePolicy {
  id: string;
  policy_type: string;
  guarantee_description: string;
  guaranteed_metric: string;
  guaranteed_threshold: number;
  guarantee_period_days: number;
  premium_fee: number;
  refund_percentage: number;
  status: string;
  outcome_measured: number | null;
  outcome_met: boolean | null;
  created_at: string;
  expires_at: string;
}

interface InsuranceClaim {
  id: string;
  policy_id: string;
  claim_reason: string;
  claim_amount: number;
  status: string;
  created_at: string;
}

export default function DecisionInsurance() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [showNewPolicy, setShowNewPolicy] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    policy_type: 'revenue_guarantee',
    guarantee_description: '',
    guaranteed_metric: 'revenue_increase',
    guaranteed_threshold: 15,
    guarantee_period_days: 60,
    premium_fee: 199
  });

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['insurance-policies', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('decision_insurance_policies')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InsurancePolicy[];
    },
    enabled: !!organization?.id
  });

  const { data: claims = [] } = useQuery({
    queryKey: ['insurance-claims', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('insurance_claims')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InsuranceClaim[];
    },
    enabled: !!organization?.id
  });

  const createPolicyMutation = useMutation({
    mutationFn: async (policy: typeof newPolicy) => {
      if (!organization?.id) throw new Error('No organization');
      const { error } = await supabase.from('decision_insurance_policies').insert({
        organization_id: organization.id,
        ...policy,
        refund_percentage: 100,
        expires_at: addDays(new Date(), policy.guarantee_period_days).toISOString()
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-policies'] });
      setShowNewPolicy(false);
      toast.success('Decision insured! Premium fee applied.');
    }
  });

  const fileClaimMutation = useMutation({
    mutationFn: async (policyId: string) => {
      if (!organization?.id) throw new Error('No organization');
      const policy = policies.find(p => p.id === policyId);
      if (!policy) throw new Error('Policy not found');
      
      const { error } = await supabase.from('insurance_claims').insert({
        organization_id: organization.id,
        policy_id: policyId,
        claim_reason: 'Guaranteed threshold not met',
        claim_amount: policy.premium_fee
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims'] });
      toast.success('Claim filed successfully');
    }
  });

  const activePolicies = policies.filter(p => p.status === 'active');
  const succeededPolicies = policies.filter(p => p.status === 'succeeded');
  const totalPremiums = policies.reduce((sum, p) => sum + p.premium_fee, 0);
  const totalGuaranteed = activePolicies.reduce((sum, p) => sum + p.premium_fee, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'refunded': return <DollarSign className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Decision Insurance
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-backed guarantees on your strategic decisions
          </p>
        </div>
        <Dialog open={showNewPolicy} onOpenChange={setShowNewPolicy}>
          <DialogTrigger asChild>
            <Button><Lock className="h-4 w-4 mr-2" />Insure a Decision</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Decision Insurance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={newPolicy.policy_type} onValueChange={v => setNewPolicy({ ...newPolicy, policy_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue_guarantee">Revenue Guarantee</SelectItem>
                  <SelectItem value="conversion_guarantee">Conversion Guarantee</SelectItem>
                  <SelectItem value="risk_mitigation">Risk Mitigation</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Describe the decision being insured..."
                value={newPolicy.guarantee_description}
                onChange={e => setNewPolicy({ ...newPolicy, guarantee_description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Guaranteed Threshold (%)</label>
                  <Input
                    type="number"
                    value={newPolicy.guaranteed_threshold}
                    onChange={e => setNewPolicy({ ...newPolicy, guaranteed_threshold: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Period (days)</label>
                  <Input
                    type="number"
                    value={newPolicy.guarantee_period_days}
                    onChange={e => setNewPolicy({ ...newPolicy, guarantee_period_days: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Premium Fee</span>
                  <span className="text-2xl font-bold text-primary">${newPolicy.premium_fee}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  100% refund if guarantee not met within {newPolicy.guarantee_period_days} days
                </p>
              </div>
              <Button 
                className="w-full" 
                onClick={() => createPolicyMutation.mutate(newPolicy)}
                disabled={!newPolicy.guarantee_description}
              >
                <Shield className="h-4 w-4 mr-2" />
                Insure This Decision
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Value Prop Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-green-500/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <ShieldCheck className="h-12 w-12 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Risk-Free Decision Making</h2>
              <p className="text-muted-foreground">
                We stake our credibility on outcomes. If a guaranteed decision doesn't hit its threshold, 
                you get a 100% refund of the decision fee.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Policies</p>
                <p className="text-2xl font-bold text-blue-500">{activePolicies.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Succeeded</p>
                <p className="text-2xl font-bold text-green-500">{succeededPolicies.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Premiums</p>
                <p className="text-2xl font-bold">${totalPremiums.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Currently Guaranteed</p>
                <p className="text-2xl font-bold text-primary">${totalGuaranteed.toLocaleString()}</p>
              </div>
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Policies ({activePolicies.length})</TabsTrigger>
          <TabsTrigger value="all">All Policies</TabsTrigger>
          <TabsTrigger value="claims">Claims ({claims.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activePolicies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No active policies</h3>
                <p className="text-muted-foreground mt-1">Insure your next big decision</p>
              </CardContent>
            </Card>
          ) : (
            activePolicies.map(policy => (
              <Card key={policy.id} className="border-blue-500/30">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Shield className="h-6 w-6 text-blue-500 mt-1" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {policy.policy_type.replace('_', ' ')}
                          </Badge>
                          <Badge className="bg-blue-500/10 text-blue-500">Active</Badge>
                        </div>
                        <p className="font-medium mt-2">{policy.guarantee_description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            {policy.guaranteed_threshold}% guaranteed
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Expires {format(new Date(policy.expires_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${policy.premium_fee}</p>
                      <p className="text-xs text-muted-foreground">premium</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => fileClaimMutation.mutate(policy.id)}
                      >
                        File Claim
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {policies.map(policy => (
            <Card key={policy.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(policy.status)}
                    <div>
                      <p className="font-medium">{policy.guarantee_description}</p>
                      <p className="text-sm text-muted-foreground">
                        {policy.guaranteed_threshold}% threshold • {policy.guarantee_period_days} days
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      policy.status === 'succeeded' ? 'bg-green-500/10 text-green-500' :
                      policy.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                      policy.status === 'refunded' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-blue-500/10 text-blue-500'
                    }>{policy.status}</Badge>
                    <p className="text-sm font-medium mt-1">${policy.premium_fee}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          {claims.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No claims filed</h3>
                <p className="text-muted-foreground mt-1">Claims appear here when guarantees aren't met</p>
              </CardContent>
            </Card>
          ) : (
            claims.map(claim => (
              <Card key={claim.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{claim.claim_reason}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(claim.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={
                        claim.status === 'approved' || claim.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                        claim.status === 'denied' ? 'bg-red-500/10 text-red-500' :
                        'bg-yellow-500/10 text-yellow-500'
                      }>{claim.status}</Badge>
                      <p className="text-lg font-bold mt-1">${claim.claim_amount}</p>
                    </div>
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
