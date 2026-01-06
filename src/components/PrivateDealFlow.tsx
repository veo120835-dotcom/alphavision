import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Briefcase,
  DollarSign,
  Users,
  Building,
  TrendingUp,
  Star,
  Lock,
  CheckCircle,
  Clock,
  ExternalLink,
  Handshake,
  Target,
  Zap,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { format } from 'date-fns';

interface DealFlowItem {
  id: string;
  deal_type: string;
  title: string;
  description: string;
  opportunity_value: number | null;
  ai_score: number | null;
  is_exclusive: boolean;
  status: string;
  success_fee_percent: number | null;
  expires_at: string | null;
  created_at: string;
}

interface DealFlowAccess {
  id: string;
  access_tier: string;
  monthly_fee: number;
  deals_viewed: number;
  deals_claimed: number;
  total_deal_value: number;
  success_fees_paid: number;
}

const dealTypeIcons: Record<string, React.ElementType> = {
  partnership: Handshake,
  acquisition: Building,
  investment: TrendingUp,
  talent: Users,
  traffic_source: Target
};

export default function PrivateDealFlow() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deal-flow-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_flow_items')
        .select('*')
        .eq('status', 'available')
        .order('ai_score', { ascending: false });
      if (error) throw error;
      return data as DealFlowItem[];
    }
  });

  const { data: access } = useQuery({
    queryKey: ['deal-flow-access', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('deal_flow_access')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();
      if (error) throw error;
      return data as DealFlowAccess | null;
    },
    enabled: !!organization?.id
  });

  const claimDealMutation = useMutation({
    mutationFn: async (dealId: string) => {
      if (!organization?.id) throw new Error('No organization');
      const { error } = await supabase
        .from('deal_flow_items')
        .update({ 
          claimed_by: organization.id,
          claimed_at: new Date().toISOString(),
          status: 'claimed'
        })
        .eq('id', dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-flow-items'] });
      toast.success('Deal claimed! Details sent to your inbox.');
    }
  });

  const currentTier = access?.access_tier || 'none';
  const exclusiveDeals = deals.filter(d => d.is_exclusive);
  const standardDeals = deals.filter(d => !d.is_exclusive);
  const totalValue = deals.reduce((sum, d) => sum + (d.opportunity_value || 0), 0);

  const canAccessDeal = (deal: DealFlowItem) => {
    if (!deal.is_exclusive) return true;
    return currentTier === 'premium' || currentTier === 'elite';
  };

  const getDealIcon = (type: string) => dealTypeIcons[type] || Briefcase;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Private Deal Flow
          </h1>
          <p className="text-muted-foreground mt-1">
            Curated partnerships, investments, and opportunities
          </p>
        </div>
        {currentTier !== 'elite' && (
          <Button>
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Access
          </Button>
        )}
      </div>

      {/* Access Tier Banner */}
      <Card className={`${
        currentTier === 'elite' ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/30' :
        currentTier === 'premium' ? 'bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-blue-500/30' :
        'bg-muted/30'
      }`}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentTier === 'elite' ? (
                <Crown className="h-10 w-10 text-yellow-500" />
              ) : currentTier === 'premium' ? (
                <Star className="h-10 w-10 text-blue-500" />
              ) : (
                <Lock className="h-10 w-10 text-muted-foreground" />
              )}
              <div>
                <h2 className="text-xl font-bold capitalize">{currentTier || 'No'} Access</h2>
                <p className="text-muted-foreground">
                  {currentTier === 'elite' ? 'Full access to all exclusive deals' :
                   currentTier === 'premium' ? 'Access to premium deal flow' :
                   'Upgrade to access private deals'}
                </p>
              </div>
            </div>
            {access && (
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold">{access.deals_viewed}</p>
                  <p className="text-xs text-muted-foreground">Deals Viewed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{access.deals_claimed}</p>
                  <p className="text-xs text-muted-foreground">Claimed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    ${(access.total_deal_value / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Deals</p>
                <p className="text-2xl font-bold">{deals.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exclusive</p>
                <p className="text-2xl font-bold text-yellow-500">{exclusiveDeals.length}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-green-500">
                  ${(totalValue / 1000000).toFixed(1)}M
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg AI Score</p>
                <p className="text-2xl font-bold">
                  {deals.length > 0 
                    ? Math.round(deals.reduce((sum, d) => sum + (d.ai_score || 0), 0) / deals.length)
                    : 0}
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Deals ({deals.length})</TabsTrigger>
          <TabsTrigger value="exclusive">Exclusive ({exclusiveDeals.length})</TabsTrigger>
          <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading deal flow...</CardContent></Card>
          ) : deals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No deals available</h3>
                <p className="text-muted-foreground mt-1">New opportunities are added weekly</p>
              </CardContent>
            </Card>
          ) : (
            deals.map(deal => {
              const Icon = getDealIcon(deal.deal_type);
              const hasAccess = canAccessDeal(deal);
              
              return (
                <Card key={deal.id} className={`${deal.is_exclusive ? 'border-yellow-500/30' : ''} ${!hasAccess ? 'opacity-60' : ''}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${deal.is_exclusive ? 'bg-yellow-500/10' : 'bg-muted'}`}>
                          <Icon className={`h-5 w-5 ${deal.is_exclusive ? 'text-yellow-500' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{deal.title}</p>
                            {deal.is_exclusive && (
                              <Badge className="bg-yellow-500/10 text-yellow-500">
                                <Star className="h-3 w-3 mr-1" />
                                Exclusive
                              </Badge>
                            )}
                            <Badge variant="outline" className="capitalize">
                              {deal.deal_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{deal.description}</p>
                          
                          <div className="flex items-center gap-4 mt-3">
                            {deal.opportunity_value && (
                              <span className="text-sm font-medium text-green-500">
                                ${(deal.opportunity_value / 1000).toFixed(0)}k potential
                              </span>
                            )}
                            {deal.ai_score && (
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-blue-500" />
                                <span className="text-sm">{deal.ai_score} score</span>
                              </div>
                            )}
                            {deal.expires_at && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expires {format(new Date(deal.expires_at), 'MMM d')}
                              </span>
                            )}
                            {deal.success_fee_percent && (
                              <span className="text-sm text-muted-foreground">
                                {deal.success_fee_percent}% success fee
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {hasAccess ? (
                        <Button onClick={() => claimDealMutation.mutate(deal.id)}>
                          Claim Deal
                        </Button>
                      ) : (
                        <Button variant="outline" disabled>
                          <Lock className="h-4 w-4 mr-2" />
                          Premium Only
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="exclusive" className="space-y-4">
          {exclusiveDeals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No exclusive deals available</h3>
              </CardContent>
            </Card>
          ) : (
            exclusiveDeals.map(deal => {
              const Icon = getDealIcon(deal.deal_type);
              return (
                <Card key={deal.id} className="border-yellow-500/30">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">{deal.title}</p>
                          <p className="text-sm text-muted-foreground">{deal.description}</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500/10 text-yellow-500">
                        ${(deal.opportunity_value || 0 / 1000).toFixed(0)}k
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="partnerships" className="space-y-4">
          {deals.filter(d => d.deal_type === 'partnership').map(deal => (
            <Card key={deal.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Handshake className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-sm text-muted-foreground">{deal.description}</p>
                    </div>
                  </div>
                  <Button size="sm">View</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          {deals.filter(d => d.deal_type === 'investment').map(deal => (
            <Card key={deal.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-sm text-muted-foreground">{deal.description}</p>
                    </div>
                  </div>
                  <Button size="sm">View</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
