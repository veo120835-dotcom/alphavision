import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  Users,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  CreditCard,
  Wallet,
  Receipt
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { format, formatDistanceToNow, subDays, startOfDay, endOfDay } from "date-fns";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";

interface RevenueEvent {
  id: string;
  event_type: string;
  amount: number | null;
  currency: string | null;
  payment_provider: string | null;
  lead_id: string | null;
  workflow_id: string | null;
  created_at: string;
  metadata: any;
}

interface Lead {
  id: string;
  name: string | null;
  status: string;
  source: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444'];

export function RevenueTrackingView() {
  const { organization } = useOrganization();
  const [revenueEvents, setRevenueEvents] = useState<RevenueEvent[]>([]);
  const [leads, setLeads] = useState<Map<string, Lead>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [monthlyGoal, setMonthlyGoal] = useState(10000);
  const [showGoalEdit, setShowGoalEdit] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchData();

      // Real-time subscription
      const channel = supabase
        .channel('revenue-events-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'revenue_events',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            console.log('New revenue event:', payload);
            setRevenueEvents(prev => [payload.new as RevenueEvent, ...prev]);
            toast.success(`New revenue event: ${(payload.new as RevenueEvent).event_type}`);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [organization?.id, dateRange]);

  const fetchData = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const startDate = subDays(new Date(), daysAgo).toISOString();

    try {
      const [revenueRes, leadsRes] = await Promise.all([
        supabase
          .from('revenue_events')
          .select('*')
          .eq('organization_id', organization.id)
          .gte('created_at', startDate)
          .order('created_at', { ascending: false }),
        supabase
          .from('leads')
          .select('id, name, status, source')
          .eq('organization_id', organization.id)
      ]);

      if (revenueRes.data) setRevenueEvents(revenueRes.data);
      if (leadsRes.data) {
        const leadMap = new Map(leadsRes.data.map(l => [l.id, l]));
        setLeads(leadMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestRevenueEvent = async () => {
    if (!organization?.id) return;

    const eventTypes = ['payment_received', 'subscription_started', 'upsell_converted', 'downsell_converted'];
    const amounts = [27, 97, 297, 497, 997, 1997, 2500];
    const providers = ['stripe', 'gohighlevel', 'paypal'];

    try {
      await supabase.from('revenue_events').insert({
        organization_id: organization.id,
        event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        amount: amounts[Math.floor(Math.random() * amounts.length)],
        currency: 'USD',
        payment_provider: providers[Math.floor(Math.random() * providers.length)],
        metadata: { source: 'test', agent: 'closer' }
      });

      toast.success('Test revenue event created!');
      fetchData();
    } catch (error) {
      console.error('Error creating test event:', error);
    }
  };

  // Calculate metrics
  const totalRevenue = revenueEvents
    .filter(e => e.event_type === 'payment_received' || e.event_type === 'subscription_started')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const downsellRevenue = revenueEvents
    .filter(e => e.event_type === 'downsell_converted')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const upsellRevenue = revenueEvents
    .filter(e => e.event_type === 'upsell_converted')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const transactionCount = revenueEvents.filter(e => 
    ['payment_received', 'subscription_started', 'downsell_converted', 'upsell_converted'].includes(e.event_type)
  ).length;

  const avgTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  // Chart data
  const dailyRevenue = revenueEvents.reduce((acc, event) => {
    const date = format(new Date(event.created_at), 'MMM dd');
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.revenue += event.amount || 0;
      existing.transactions += 1;
    } else {
      acc.push({ date, revenue: event.amount || 0, transactions: 1 });
    }
    return acc;
  }, [] as { date: string; revenue: number; transactions: number }[]).reverse();

  const revenueByType = [
    { name: 'Payments', value: totalRevenue - downsellRevenue - upsellRevenue, color: COLORS[0] },
    { name: 'Upsells', value: upsellRevenue, color: COLORS[2] },
    { name: 'Downsells', value: downsellRevenue, color: COLORS[3] },
  ].filter(d => d.value > 0);

  const revenueByProvider = revenueEvents.reduce((acc, event) => {
    const provider = event.payment_provider || 'unknown';
    const existing = acc.find(d => d.provider === provider);
    if (existing) {
      existing.amount += event.amount || 0;
    } else {
      acc.push({ provider, amount: event.amount || 0 });
    }
    return acc;
  }, [] as { provider: string; amount: number }[]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'payment_received': return CreditCard;
      case 'subscription_started': return Wallet;
      case 'upsell_converted': return ArrowUpRight;
      case 'downsell_converted': return ArrowDownRight;
      default: return Receipt;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'payment_received': return 'bg-green-500/20 text-green-400';
      case 'subscription_started': return 'bg-blue-500/20 text-blue-400';
      case 'upsell_converted': return 'bg-purple-500/20 text-purple-400';
      case 'downsell_converted': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold gradient-text">Revenue Tracking</h1>
          <p className="text-muted-foreground mt-1">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Real-time revenue monitoring
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          <Button onClick={createTestRevenueEvent} variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Test Event
          </Button>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-glow border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">{transactionCount}</p>
                <p className="text-sm text-muted-foreground">Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">{formatCurrency(avgTransactionValue)}</p>
                <p className="text-sm text-muted-foreground">Avg Transaction</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-orange-500/20">
                <ArrowDownRight className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">{formatCurrency(downsellRevenue)}</p>
                <p className="text-sm text-muted-foreground">Downsell Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Progress */}
      <Card className="card-glow border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-medium">Monthly Goal Progress</span>
              <Badge 
                variant="outline" 
                className="cursor-pointer"
                onClick={() => setShowGoalEdit(!showGoalEdit)}
              >
                {formatCurrency(monthlyGoal)} goal
              </Badge>
            </div>
            <span className="text-2xl font-bold">
              {Math.min(100, Math.round((totalRevenue / monthlyGoal) * 100))}%
            </span>
          </div>
          <Progress 
            value={Math.min(100, (totalRevenue / monthlyGoal) * 100)} 
            className="h-3"
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{formatCurrency(totalRevenue)} earned</span>
            <span>{formatCurrency(Math.max(0, monthlyGoal - totalRevenue))} to go</span>
          </div>
          {showGoalEdit && (
            <div className="mt-3 flex gap-2">
              {[5000, 10000, 25000, 50000, 100000].map(goal => (
                <Button
                  key={goal}
                  size="sm"
                  variant={monthlyGoal === goal ? 'default' : 'outline'}
                  onClick={() => {
                    setMonthlyGoal(goal);
                    setShowGoalEdit(false);
                  }}
                >
                  {formatCurrency(goal)}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Over Time */}
        <Card className="card-glow lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Revenue Trend
            </CardTitle>
            <CardDescription>Daily revenue for selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Type */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Revenue Breakdown
            </CardTitle>
            <CardDescription>By transaction type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={revenueByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {revenueByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {revenueByType.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Provider & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Provider */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              By Payment Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByProvider} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <YAxis dataKey="provider" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Latest revenue events</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <AnimatePresence>
                  {revenueEvents.slice(0, 10).map((event, idx) => {
                    const EventIcon = getEventIcon(event.event_type);
                    const lead = event.lead_id ? leads.get(event.lead_id) : null;

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        <div className={`p-2 rounded-lg ${getEventColor(event.event_type)}`}>
                          <EventIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {event.event_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            {event.payment_provider && (
                              <Badge variant="outline" className="text-xs">
                                {event.payment_provider}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {lead?.name || 'Unknown'} • {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-green-400">
                          +{formatCurrency(event.amount || 0)}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {revenueEvents.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No revenue events yet</p>
                    <p className="text-sm">Create a test event to see it here</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}