import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, FileText, Users, ShoppingCart, Percent } from 'lucide-react';
import { PaymentLinksManager } from './PaymentLinksManager';
import { LeadMarketplace } from './LeadMarketplace';
import { supabase } from '@/integrations/supabase/client';

interface RevenueStats {
  totalRevenue: number;
  paymentsReceived: number;
  leadsS old: number;
  commissionsEarned: number;
  quotesAccepted: number;
}

export function RevenueDashboard() {
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    paymentsReceived: 0,
    leadsSold: 0,
    commissionsEarned: 0,
    quotesAccepted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueStats();
  }, []);

  async function loadRevenueStats() {
    try {
      const { data: revenueEvents, error } = await supabase
        .from('revenue_events')
        .select('event_type, amount')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const stats: RevenueStats = {
        totalRevenue: 0,
        paymentsReceived: 0,
        leadsSold: 0,
        commissionsEarned: 0,
        quotesAccepted: 0,
      };

      revenueEvents?.forEach((event) => {
        stats.totalRevenue += Number(event.amount) || 0;

        if (event.event_type === 'payment_received') {
          stats.paymentsReceived += Number(event.amount) || 0;
        } else if (event.event_type === 'lead_sold') {
          stats.leadsSold += Number(event.amount) || 0;
        } else if (event.event_type === 'commission_earned') {
          stats.commissionsEarned += Number(event.amount) || 0;
        } else if (event.event_type === 'quote_accepted') {
          stats.quotesAccepted += Number(event.amount) || 0;
        }
      });

      setStats(stats);
    } catch (error) {
      console.error('Failed to load revenue stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      description: 'All revenue streams',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Payments Received',
      value: `$${stats.paymentsReceived.toFixed(2)}`,
      description: 'Direct payments',
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'Leads Sold',
      value: `$${stats.leadsSold.toFixed(2)}`,
      description: 'Marketplace earnings',
      icon: ShoppingCart,
      color: 'text-purple-600',
    },
    {
      title: 'Commissions',
      value: `$${stats.commissionsEarned.toFixed(2)}`,
      description: 'Commission earnings',
      icon: Percent,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue Center</h1>
        <p className="text-muted-foreground">
          Manage payments, marketplace, and revenue streams
        </p>
      </div>

      {loading ? (
        <div className="text-center p-8">Loading revenue data...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="payment-links" className="space-y-4">
            <TabsList>
              <TabsTrigger value="payment-links">
                <DollarSign className="h-4 w-4 mr-2" />
                Payment Links
              </TabsTrigger>
              <TabsTrigger value="marketplace">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Lead Marketplace
              </TabsTrigger>
              <TabsTrigger value="quotations">
                <FileText className="h-4 w-4 mr-2" />
                Quotations
              </TabsTrigger>
              <TabsTrigger value="commissions">
                <Percent className="h-4 w-4 mr-2" />
                Commissions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payment-links">
              <PaymentLinksManager />
            </TabsContent>

            <TabsContent value="marketplace">
              <LeadMarketplace />
            </TabsContent>

            <TabsContent value="quotations">
              <Card>
                <CardHeader>
                  <CardTitle>Quotation Management</CardTitle>
                  <CardDescription>
                    Generate and manage quotes for your customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Quotation System</h3>
                    <p className="text-muted-foreground">
                      AI-powered quotation generation available in conversations
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commissions">
              <Card>
                <CardHeader>
                  <CardTitle>Commission Tracking</CardTitle>
                  <CardDescription>
                    Track and manage commission payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Percent className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Commission Management</h3>
                    <p className="text-muted-foreground">
                      Automated commission calculation and tracking
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
