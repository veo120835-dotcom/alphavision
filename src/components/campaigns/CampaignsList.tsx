import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Mail, MessageSquare, Play, Pause, Archive, Search, Users, BarChart } from 'lucide-react';
import { toast } from 'sonner';
import { useAlphaVisionStore } from '@/store/alpha-vision-store';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-500/10 text-green-600',
  paused: 'bg-yellow-500/10 text-yellow-600',
  completed: 'bg-blue-500/10 text-blue-600',
  archived: 'bg-muted text-muted-foreground',
};

export function CampaignsList() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const { setActiveView } = useAlphaVisionStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_type: 'email',
    trigger_type: 'manual',
  });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const createCampaign = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!organization?.id) throw new Error('No organization');
      const { data: campaign, error } = await supabase.from('campaigns').insert({
        organization_id: organization.id,
        name: data.name,
        description: data.description,
        campaign_type: data.campaign_type,
        trigger_type: data.trigger_type,
      }).select().single();
      if (error) throw error;
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created');
      setIsDialogOpen(false);
      setFormData({ name: '', description: '', campaign_type: 'email', trigger_type: 'manual' });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('campaigns').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredCampaigns = campaigns?.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Automated email & SMS sequences</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Campaign Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Sequence"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this campaign do?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={formData.campaign_type} onValueChange={(v) => setFormData({ ...formData, campaign_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="multi">Multi-Channel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Trigger</Label>
                  <Select value={formData.trigger_type} onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="tag_added">Tag Added</SelectItem>
                      <SelectItem value="stage_change">Stage Change</SelectItem>
                      <SelectItem value="form_submit">Form Submit</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => createCampaign.mutate(formData)} disabled={!formData.name.trim()}>
                  Create Campaign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading campaigns...</div>
      ) : !filteredCampaigns?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">Create your first automated sequence</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCampaigns.map((campaign) => {
            const stats = campaign.stats as { enrolled?: number; completed?: number; converted?: number } || {};
            return (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {campaign.campaign_type === 'email' ? (
                          <Mail className="h-5 w-5 text-primary" />
                        ) : campaign.campaign_type === 'sms' ? (
                          <MessageSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <BarChart className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-3">
                          <Badge variant="outline" className={STATUS_COLORS[campaign.status]}>
                            {campaign.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Trigger: {campaign.trigger_type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {campaign.status === 'draft' && (
                        <Button size="sm" onClick={() => updateStatus.mutate({ id: campaign.id, status: 'active' })}>
                          <Play className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                      )}
                      {campaign.status === 'active' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: campaign.id, status: 'paused' })}>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      {campaign.status === 'paused' && (
                        <Button size="sm" onClick={() => updateStatus.mutate({ id: campaign.id, status: 'active' })}>
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: campaign.id, status: 'archived' })}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-2xl font-bold">{stats.enrolled || 0}</p>
                      <p className="text-sm text-muted-foreground">Enrolled</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.completed || 0}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.converted || 0}</p>
                      <p className="text-sm text-muted-foreground">Converted</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
