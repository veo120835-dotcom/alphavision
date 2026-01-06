import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, RefreshCw, AlertTriangle, TrendingDown, TrendingUp, CheckCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export function MysteryShopperDashboard() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({
    competitor_name: '',
    website_url: '',
    pricing_page_url: ''
  });

  const { data: competitors, isLoading } = useQuery({
    queryKey: ['competitors', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('competitor_profiles')
        .select('*')
        .eq('organization_id', organization.id)
        .order('competitor_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id
  });

  const { data: alerts } = useQuery({
    queryKey: ['competitor-alerts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('competitor_alerts')
        .select('*, competitor_profiles(competitor_name)')
        .eq('organization_id', organization.id)
        .eq('acknowledged', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id
  });

  const addCompetitorMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('mystery-shopper', {
        body: {
          action: 'add_competitor',
          organization_id: organization.id,
          ...newCompetitor
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Competitor added');
      setDialogOpen(false);
      setNewCompetitor({ competitor_name: '', website_url: '', pricing_page_url: '' });
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
    },
    onError: (error) => {
      toast.error('Failed to add competitor: ' + error.message);
    }
  });

  const scanMutation = useMutation({
    mutationFn: async (competitorId: string) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('mystery-shopper', {
        body: {
          action: 'scan_competitor',
          organization_id: organization.id,
          competitor_id: competitorId
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.price) {
        toast.success(`Found price: $${data.price}`);
      } else {
        toast.info('Could not extract price');
      }
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      queryClient.invalidateQueries({ queryKey: ['competitor-alerts'] });
    },
    onError: (error) => {
      toast.error('Scan failed: ' + error.message);
    }
  });

  const scanAllMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('mystery-shopper', {
        body: {
          action: 'scan_all',
          organization_id: organization.id
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Scanned ${data.scanned} competitors`);
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      queryClient.invalidateQueries({ queryKey: ['competitor-alerts'] });
    }
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('mystery-shopper', {
        body: {
          action: 'acknowledge_alert',
          organization_id: organization.id,
          alert_id: alertId
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitor-alerts'] });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Search className="h-8 w-8 text-primary" />
            Mystery Shopper
          </h1>
          <p className="text-muted-foreground mt-1">
            Automated competitive intelligence. Know when competitors change prices.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Competitor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Competitor Name</Label>
                  <Input
                    placeholder="Acme Corp"
                    value={newCompetitor.competitor_name}
                    onChange={(e) => setNewCompetitor({...newCompetitor, competitor_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Website URL</Label>
                  <Input
                    placeholder="https://example.com"
                    value={newCompetitor.website_url}
                    onChange={(e) => setNewCompetitor({...newCompetitor, website_url: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Pricing Page URL</Label>
                  <Input
                    placeholder="https://example.com/pricing"
                    value={newCompetitor.pricing_page_url}
                    onChange={(e) => setNewCompetitor({...newCompetitor, pricing_page_url: e.target.value})}
                  />
                </div>
                <Button 
                  onClick={() => addCompetitorMutation.mutate()}
                  disabled={addCompetitorMutation.isPending || !newCompetitor.competitor_name}
                  className="w-full"
                >
                  Add Competitor
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            onClick={() => scanAllMutation.mutate()}
            disabled={scanAllMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${scanAllMutation.isPending ? 'animate-spin' : ''}`} />
            Scan All
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-start justify-between p-3 bg-muted rounded-md">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                    <Badge variant="outline">{alert.alert_type}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {(alert.competitor_profiles as any)?.competitor_name}
                    </span>
                  </div>
                  <p className="font-medium">{alert.message}</p>
                  {alert.recommendation && (
                    <p className="text-sm text-muted-foreground mt-1">{alert.recommendation}</p>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => acknowledgeMutation.mutate(alert.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Competitors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitors?.map(competitor => (
          <Card key={competitor.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{competitor.competitor_name}</CardTitle>
                {competitor.website_url && (
                  <a href={competitor.website_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </a>
                )}
              </div>
              {competitor.last_checked_at && (
                <CardDescription>
                  Last checked: {new Date(competitor.last_checked_at).toLocaleDateString()}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {competitor.current_price ? (
                  <div className="text-center py-4">
                    <p className="text-3xl font-bold">${competitor.current_price}</p>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No price data</p>
                    <p className="text-xs">Click scan to fetch</p>
                  </div>
                )}

                {competitor.current_offers && Object.keys(competitor.current_offers as object).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Offers</p>
                    <div className="text-sm bg-muted p-2 rounded">
                      {(competitor.current_offers as any)?.current_promotions?.join(', ') || 'None detected'}
                    </div>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => scanMutation.mutate(competitor.id)}
                  disabled={scanMutation.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
                  Scan Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {competitors?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No competitors added yet.</p>
              <p className="text-sm text-muted-foreground">Click "Add Competitor" to start monitoring.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
