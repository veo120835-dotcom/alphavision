import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  DollarSign, 
  TrendingUp,
  ExternalLink,
  Star,
  Building,
  Briefcase,
  Wrench,
  UserPlus,
  HandCoins,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { Json } from '@/integrations/supabase/types';

interface EcosystemPartner {
  id: string;
  partner_name: string;
  partner_type: string;
  category: string;
  description: string | null;
  referral_commission_percent: number | null;
  rev_share_percent: number | null;
  affiliate_link: string | null;
  is_verified: boolean;
  avg_rating: number | null;
  total_referrals: number;
  total_revenue_generated: number | null;
}

interface Recommendation {
  id: string;
  partner_id: string | null;
  recommendation_type: string;
  recommendation_reason: string;
  business_context: Json;
  estimated_roi: string | null;
  urgency: string;
  status: string;
  commission_earned: number | null;
  created_at: string;
  partner?: EcosystemPartner;
}

interface LedgerEntry {
  id: string;
  revenue_type: string;
  gross_amount: number;
  platform_share: number;
  partner_share: number;
  status: string;
  transaction_date: string;
}

const partnerTypeIcons: Record<string, React.ElementType> = {
  tool: Wrench,
  agency: Building,
  consultant: Users,
  platform: Briefcase,
  service: HandCoins
};

export default function SuccessTaxEcosystem() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: partners = [] } = useQuery({
    queryKey: ['ecosystem-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ecosystem_partners')
        .select('*')
        .eq('is_verified', true)
        .order('avg_rating', { ascending: false });
      if (error) throw error;
      return data as EcosystemPartner[];
    }
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['ecosystem-recommendations', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('ecosystem_recommendations')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Recommendation[];
    },
    enabled: !!organization?.id
  });

  const { data: ledger = [] } = useQuery({
    queryKey: ['success-tax-ledger', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('success_tax_ledger')
        .select('*')
        .eq('organization_id', organization.id)
        .order('transaction_date', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as LedgerEntry[];
    },
    enabled: !!organization?.id
  });

  const updateRecommendationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: { status: string; click_through_at?: string; converted_at?: string } = { status };
      if (status === 'accepted') updateData.click_through_at = new Date().toISOString();
      if (status === 'converted') updateData.converted_at = new Date().toISOString();
      const { error } = await supabase
        .from('ecosystem_recommendations')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecosystem-recommendations'] });
      toast.success('Status updated');
    }
  });

  const totalEarned = ledger.reduce((sum, entry) => sum + entry.platform_share, 0);
  const pendingEarnings = ledger.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.platform_share, 0);
  const activeRecommendations = recommendations.filter(r => r.status === 'pending').length;
  const convertedRecommendations = recommendations.filter(r => r.status === 'converted').length;

  const getPartnerIcon = (type: string) => {
    const Icon = partnerTypeIcons[type] || Briefcase;
    return Icon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <HandCoins className="h-8 w-8 text-primary" />
          Success Tax Ecosystem
        </h1>
        <p className="text-muted-foreground mt-1">
          Monetize the success ecosystem through referrals and partnerships
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-green-500">
                  ${totalEarned.toLocaleString()}
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
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">${pendingEarnings.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Recs</p>
                <p className="text-2xl font-bold">{activeRecommendations}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Converted</p>
                <p className="text-2xl font-bold text-green-500">{convertedRecommendations}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recommendations">
        <TabsList>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="partners">Partner Directory</TabsTrigger>
          <TabsTrigger value="earnings">Earnings Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No recommendations yet</h3>
                <p className="text-muted-foreground mt-1">
                  As your business grows, we'll recommend tools, partners, and hires
                </p>
              </CardContent>
            </Card>
          ) : (
            recommendations.map(rec => (
              <Card key={rec.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{rec.recommendation_type}</Badge>
                        <Badge className={
                          rec.urgency === 'critical' ? 'bg-red-500/10 text-red-500' :
                          rec.urgency === 'high' ? 'bg-orange-500/10 text-orange-500' :
                          rec.urgency === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-muted text-muted-foreground'
                        }>{rec.urgency}</Badge>
                      </div>
                      <p className="font-medium mt-2">{rec.recommendation_reason}</p>
                      {rec.estimated_roi && (
                        <p className="text-sm text-green-500 mt-1">Est. ROI: {rec.estimated_roi}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {rec.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateRecommendationMutation.mutate({ id: rec.id, status: 'declined' })}
                          >
                            Decline
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => updateRecommendationMutation.mutate({ id: rec.id, status: 'accepted' })}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </>
                      )}
                      {rec.status === 'accepted' && (
                        <Button 
                          size="sm"
                          onClick={() => updateRecommendationMutation.mutate({ id: rec.id, status: 'converted' })}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Converted
                        </Button>
                      )}
                      {rec.status === 'converted' && (
                        <Badge className="bg-green-500/10 text-green-500">Converted</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="partners" className="space-y-4">
          {partners.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">Partner directory coming soon</h3>
                <p className="text-muted-foreground mt-1">
                  Verified partners and tools will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map(partner => {
                const Icon = getPartnerIcon(partner.partner_type);
                return (
                  <Card key={partner.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{partner.partner_name}</p>
                            {partner.is_verified && (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{partner.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            {partner.avg_rating && (
                              <span className="flex items-center gap-1 text-sm">
                                <Star className="h-3 w-3 text-yellow-500" />
                                {partner.avg_rating.toFixed(1)}
                              </span>
                            )}
                            {partner.referral_commission_percent && (
                              <Badge variant="outline" className="text-green-500">
                                {partner.referral_commission_percent}% commission
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          {ledger.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No earnings yet</h3>
                <p className="text-muted-foreground mt-1">
                  Earnings from referrals and partnerships will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {ledger.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium capitalize">{entry.revenue_type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-500">
                          +${entry.platform_share.toLocaleString()}
                        </p>
                        <Badge className={
                          entry.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                          entry.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-yellow-500/10 text-yellow-500'
                        }>{entry.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
