import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, TrendingUp, DollarSign, Target, Users, 
  ArrowUpRight, ArrowDownRight, Calendar, Filter
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export function ROIDashboard() {
  const { organization } = useOrganization();
  const [dateRange, setDateRange] = useState('30d');

  const { data: revenueData } = useQuery({
    queryKey: ['roi-revenue', organization?.id, dateRange],
    queryFn: async () => {
      if (!organization?.id) return null;
      
      const startDate = dateRange === '7d' ? subDays(new Date(), 7) :
                        dateRange === '30d' ? subDays(new Date(), 30) :
                        startOfMonth(new Date());
      
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, paid_at')
        .eq('organization_id', organization.id)
        .eq('status', 'succeeded')
        .gte('paid_at', startDate.toISOString());
      
      const { data: leads } = await supabase
        .from('leads')
        .select('id, source, created_at')
        .eq('organization_id', organization.id)
        .gte('created_at', startDate.toISOString());

      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('id, amount, status, created_at')
        .eq('organization_id', organization.id)
        .gte('created_at', startDate.toISOString());

      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, status, created_at')
        .eq('organization_id', organization.id)
        .gte('created_at', startDate.toISOString());

      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalLeads = leads?.length || 0;
      const wonDeals = opportunities?.filter(o => o.status === 'won').length || 0;
      const totalDeals = opportunities?.length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;

      // Attribution by source
      const sourceAttribution = leads?.reduce((acc, lead) => {
        const source = lead.source || 'direct';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalRevenue,
        totalLeads,
        wonDeals,
        totalDeals,
        completedBookings,
        conversionRate: totalDeals ? ((wonDeals / totalDeals) * 100).toFixed(1) : '0',
        avgDealValue: wonDeals ? (totalRevenue / wonDeals).toFixed(0) : '0',
        sourceAttribution,
        revenuePerLead: totalLeads ? (totalRevenue / totalLeads).toFixed(0) : '0',
      };
    },
    enabled: !!organization?.id,
  });

  const { data: workflowROI } = useQuery({
    queryKey: ['workflow-roi', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data } = await supabase
        .from('automation_workflows')
        .select('id, name, execution_count')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('execution_count', { ascending: false })
        .limit(10);
      
      return data || [];
    },
    enabled: !!organization?.id,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ROI Dashboard</h1>
          <p className="text-muted-foreground">Track profit per action and attribution</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', 'mtd'].map(range => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'Month'}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold">${revenueData?.totalRevenue.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Leads</span>
            </div>
            <p className="text-2xl font-bold">{revenueData?.totalLeads || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
            </div>
            <p className="text-2xl font-bold">{revenueData?.conversionRate || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Revenue/Lead</span>
            </div>
            <p className="text-2xl font-bold">${revenueData?.revenuePerLead || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Source Attribution</CardTitle>
            <CardDescription>Where your leads are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(revenueData?.sourceAttribution || {}).map(([source, count]) => {
                const total = revenueData?.totalLeads || 1;
                const percentage = ((count as number / total) * 100).toFixed(1);
                return (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="capitalize">{source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{count as number}</span>
                      <Badge variant="outline">{percentage}%</Badge>
                    </div>
                  </div>
                );
              })}
              {!Object.keys(revenueData?.sourceAttribution || {}).length && (
                <p className="text-muted-foreground text-center py-4">No lead data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Performance</CardTitle>
            <CardDescription>ROI by automation workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflowROI?.map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between">
                  <span className="truncate flex-1">{workflow.name}</span>
                  <Badge variant="secondary">{workflow.execution_count} runs</Badge>
                </div>
              ))}
              {!workflowROI?.length && (
                <p className="text-muted-foreground text-center py-4">No workflow data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funnel Performance</CardTitle>
          <CardDescription>Lead → Booking → Close → Revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold">{revenueData?.totalLeads || 0}</p>
              <p className="text-sm text-muted-foreground">Leads</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold">{revenueData?.completedBookings || 0}</p>
              <p className="text-sm text-muted-foreground">Bookings</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold">{revenueData?.wonDeals || 0}</p>
              <p className="text-sm text-muted-foreground">Closed Won</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <p className="text-3xl font-bold text-green-600">${revenueData?.totalRevenue.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}