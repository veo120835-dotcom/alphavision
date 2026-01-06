import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, TrendingUp, AlertTriangle, Shield, 
  Calculator, BarChart3, Settings, Check, X
} from 'lucide-react';
import { toast } from 'sonner';

export function PricingEngine() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [maxDiscount, setMaxDiscount] = useState(20);
  const [requireApproval, setRequireApproval] = useState(true);

  const { data: config } = useQuery({
    queryKey: ['business-config', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('business_config')
        .select('*')
        .eq('organization_id', organization.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: pricingAnalysis } = useQuery({
    queryKey: ['pricing-analysis', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      
      // Get recent deals to analyze pricing
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('amount, status, created_at')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      const wonDeals = opportunities?.filter(o => o.status === 'won') || [];
      const lostDeals = opportunities?.filter(o => o.status === 'lost') || [];
      
      const avgWonDeal = wonDeals.length 
        ? wonDeals.reduce((sum, d) => sum + Number(d.amount), 0) / wonDeals.length 
        : 0;
      
      const avgLostDeal = lostDeals.length
        ? lostDeals.reduce((sum, d) => sum + Number(d.amount), 0) / lostDeals.length
        : 0;
      
      return {
        avgWonDeal,
        avgLostDeal,
        winRate: opportunities?.length ? (wonDeals.length / opportunities.length * 100).toFixed(1) : '0',
        priceOptimal: avgWonDeal > avgLostDeal,
        recommendation: avgWonDeal > avgLostDeal 
          ? 'Current pricing appears optimal - won deals have higher values'
          : 'Consider adjusting pricing - lost deals have higher values (possible overpricing)',
      };
    },
    enabled: !!organization?.id,
  });

  const { data: discountRequests } = useQuery({
    queryKey: ['discount-requests', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('request_type', 'discount')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const approveDiscount = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-requests'] });
      toast.success('Discount request processed');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pricing Engine</h1>
          <p className="text-muted-foreground">Dynamic pricing suggestions and discount governance</p>
        </div>
      </div>

      <Tabs defaultValue="analysis">
        <TabsList>
          <TabsTrigger value="analysis">Pricing Analysis</TabsTrigger>
          <TabsTrigger value="governance">Discount Governance</TabsTrigger>
          <TabsTrigger value="requests">Pending Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Avg Won Deal</span>
                </div>
                <p className="text-2xl font-bold">${pricingAnalysis?.avgWonDeal.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Avg Lost Deal</span>
                </div>
                <p className="text-2xl font-bold">${pricingAnalysis?.avgLostDeal.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                </div>
                <p className="text-2xl font-bold">{pricingAnalysis?.winRate || 0}%</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${pricingAnalysis?.priceOptimal ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {pricingAnalysis?.priceOptimal ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="font-semibold">
                    {pricingAnalysis?.priceOptimal ? 'Pricing Looks Good' : 'Review Recommended'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{pricingAnalysis?.recommendation}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Pricing</CardTitle>
              <CardDescription>Your configured price points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Base Price</p>
                  <p className="text-xl font-bold">${config?.base_price || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Upsell Price</p>
                  <p className="text-xl font-bold">${config?.upsell_price || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Downsell Price</p>
                  <p className="text-xl font-bold">${config?.downsell_price || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="governance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discount Rules</CardTitle>
              <CardDescription>Control how discounts are applied</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Approval for Discounts</Label>
                    <p className="text-sm text-muted-foreground">All discounts must be approved before applying</p>
                  </div>
                  <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Maximum Discount Allowed</Label>
                    <span className="font-bold">{maxDiscount}%</span>
                  </div>
                  <Slider
                    value={[maxDiscount]}
                    onValueChange={([v]) => setMaxDiscount(v)}
                    max={50}
                    step={5}
                  />
                  <p className="text-sm text-muted-foreground">
                    Discounts above this threshold will be automatically blocked
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Discount Reason Required</h4>
                <p className="text-sm text-muted-foreground">
                  All discount requests must include a justification reason for audit purposes
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {!discountRequests?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No pending requests</h3>
                <p className="text-muted-foreground">All discount requests have been processed</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {discountRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{request.title}</h4>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                        {request.amount && (
                          <Badge variant="outline" className="mt-2">
                            ${Number(request.amount).toLocaleString()} discount requested
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveDiscount.mutate({ id: request.id, approved: true })}>
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => approveDiscount.mutate({ id: request.id, approved: false })}>
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}