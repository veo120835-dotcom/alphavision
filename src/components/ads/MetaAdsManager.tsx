import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Search, TrendingUp, TrendingDown, DollarSign, 
  Eye, MousePointer, Users, Target, Play, Pause, Settings,
  BarChart3, RefreshCw
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

export function MetaAdsManager() {
  const { organization } = useOrganization();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('7d');

  const { data: adAccounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ['ad-accounts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('*')
        .eq('organization_id', organization.id);
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['meta-campaigns', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('meta_campaigns')
        .select(`
          *,
          ad_account:ad_accounts(name)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: insights } = useQuery({
    queryKey: ['ad-insights', organization?.id, dateRange],
    queryFn: async () => {
      if (!organization?.id) return [];
      const startDate = subDays(new Date(), dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90);
      const { data, error } = await supabase
        .from('ad_insights')
        .select('*')
        .eq('organization_id', organization.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'));
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const aggregatedStats = insights?.reduce((acc, i) => ({
    impressions: acc.impressions + (i.impressions || 0),
    clicks: acc.clicks + (i.clicks || 0),
    spend: acc.spend + Number(i.spend || 0),
    conversions: acc.conversions + (i.conversions || 0),
    leads: acc.leads + (i.leads || 0),
  }), { impressions: 0, clicks: 0, spend: 0, conversions: 0, leads: 0 });

  const ctr = aggregatedStats?.impressions ? ((aggregatedStats.clicks / aggregatedStats.impressions) * 100).toFixed(2) : '0';
  const cpc = aggregatedStats?.clicks ? (aggregatedStats.spend / aggregatedStats.clicks).toFixed(2) : '0';
  const cpl = aggregatedStats?.leads ? (aggregatedStats.spend / aggregatedStats.leads).toFixed(2) : '0';

  const filteredCampaigns = campaigns?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meta Ads Manager</h1>
          <p className="text-muted-foreground">Monitor and optimize your ad campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {!adAccounts?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Connect Your Ad Account</h3>
            <p className="text-muted-foreground mb-4">
              Link your Meta Business account to start managing ads
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Connect Ad Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map(range => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange(range)}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Impressions</span>
                </div>
                <p className="text-2xl font-bold">{aggregatedStats?.impressions.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clicks</span>
                </div>
                <p className="text-2xl font-bold">{aggregatedStats?.clicks.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Spend</span>
                </div>
                <p className="text-2xl font-bold">${aggregatedStats?.spend.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Leads</span>
                </div>
                <p className="text-2xl font-bold">{aggregatedStats?.leads || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">CTR</span>
                </div>
                <p className="text-2xl font-bold">{ctr}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Cost/Lead</span>
                </div>
                <p className="text-2xl font-bold">${cpl}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Campaigns</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search campaigns..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCampaigns ? (
                <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
              ) : !filteredCampaigns?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No campaigns found. Sync your ad account to see campaigns.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${campaign.status === 'ACTIVE' ? 'bg-green-500/10' : 'bg-muted'}`}>
                          <Target className={`h-5 w-5 ${campaign.status === 'ACTIVE' ? 'text-green-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{campaign.objective}</span>
                            {campaign.daily_budget && (
                              <span>${Number(campaign.daily_budget).toLocaleString()}/day</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                        <div className="flex gap-2">
                          {campaign.status === 'ACTIVE' ? (
                            <Button size="sm" variant="outline">
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
