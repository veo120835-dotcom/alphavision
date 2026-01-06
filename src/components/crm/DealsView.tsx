import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, DollarSign, Calendar, User, MoreHorizontal, Trash2, Edit, GripVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface Opportunity {
  id: string;
  name: string;
  amount: number | null;
  currency: string;
  close_date: string | null;
  probability: number;
  status: string;
  stage_id: string | null;
  contact_id: string | null;
  company_id: string | null;
  contact?: { first_name: string; last_name: string | null } | null;
  company?: { name: string } | null;
  created_at: string;
}

interface Stage {
  id: string;
  name: string;
  position: number;
  probability: number;
  color: string;
}

interface Pipeline {
  id: string;
  name: string;
  is_default: boolean;
}

export function DealsView() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Opportunity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: 'USD',
    close_date: '',
    contact_id: '',
    company_id: '',
    stage_id: '',
  });

  const { data: pipelines } = useQuery({
    queryKey: ['pipelines', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at');
      if (error) throw error;
      return data as Pipeline[];
    },
    enabled: !!organization?.id,
  });

  // Create default pipeline if none exists
  useEffect(() => {
    if (pipelines && pipelines.length === 0 && organization?.id) {
      createDefaultPipeline();
    } else if (pipelines && pipelines.length > 0 && !selectedPipeline) {
      const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];
      setSelectedPipeline(defaultPipeline.id);
    }
  }, [pipelines, organization?.id, selectedPipeline]);

  const createDefaultPipeline = async () => {
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .insert({ organization_id: organization!.id, name: 'Sales Pipeline', is_default: true })
      .select()
      .single();
    
    if (pipelineError) {
      console.error('Error creating pipeline:', pipelineError);
      return;
    }

    const defaultStages = [
      { name: 'Lead', position: 0, probability: 10, color: '#6366f1' },
      { name: 'Qualified', position: 1, probability: 25, color: '#8b5cf6' },
      { name: 'Proposal', position: 2, probability: 50, color: '#a855f7' },
      { name: 'Negotiation', position: 3, probability: 75, color: '#d946ef' },
      { name: 'Closed Won', position: 4, probability: 100, color: '#22c55e' },
      { name: 'Closed Lost', position: 5, probability: 0, color: '#ef4444' },
    ];

    await supabase.from('pipeline_stages').insert(
      defaultStages.map(s => ({ ...s, pipeline_id: pipeline.id }))
    );

    queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    queryClient.invalidateQueries({ queryKey: ['stages'] });
    setSelectedPipeline(pipeline.id);
  };

  const { data: stages } = useQuery({
    queryKey: ['stages', selectedPipeline],
    queryFn: async () => {
      if (!selectedPipeline) return [];
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', selectedPipeline)
        .order('position');
      if (error) throw error;
      return data as Stage[];
    },
    enabled: !!selectedPipeline,
  });

  const { data: deals, isLoading } = useQuery({
    queryKey: ['deals', organization?.id, selectedPipeline],
    queryFn: async () => {
      if (!organization?.id || !selectedPipeline) return [];
      const { data, error } = await supabase
        .from('opportunities')
        .select('*, contact:contacts(first_name, last_name), company:companies(name)')
        .eq('organization_id', organization.id)
        .eq('pipeline_id', selectedPipeline)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Opportunity[];
    },
    enabled: !!organization?.id && !!selectedPipeline,
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .eq('organization_id', organization.id);
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: companies } = useQuery({
    queryKey: ['companies', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('organization_id', organization.id);
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const stage = stages?.find(s => s.id === data.stage_id);
      const { error } = await supabase.from('opportunities').insert({
        organization_id: organization!.id,
        pipeline_id: selectedPipeline,
        name: data.name,
        amount: data.amount ? parseFloat(data.amount) : null,
        currency: data.currency,
        close_date: data.close_date || null,
        contact_id: data.contact_id || null,
        company_id: data.company_id || null,
        stage_id: data.stage_id || null,
        probability: stage?.probability || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Deal created');
    },
    onError: () => toast.error('Failed to create deal'),
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const stage = stages?.find(s => s.id === stageId);
      const status = stage?.name === 'Closed Won' ? 'won' : stage?.name === 'Closed Lost' ? 'lost' : 'open';
      const { error } = await supabase
        .from('opportunities')
        .update({ stage_id: stageId, probability: stage?.probability || 0, status })
        .eq('id', dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal stage updated');
    },
    onError: () => toast.error('Failed to update deal'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('opportunities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal deleted');
    },
    onError: () => toast.error('Failed to delete deal'),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      currency: 'USD',
      close_date: '',
      contact_id: '',
      company_id: '',
      stage_id: stages?.[0]?.id || '',
    });
  };

  useEffect(() => {
    if (stages && stages.length > 0 && !formData.stage_id) {
      setFormData(prev => ({ ...prev, stage_id: stages[0].id }));
    }
  }, [stages]);

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const getDealsForStage = (stageId: string) => deals?.filter(d => d.stage_id === stageId) || [];

  const getTotalForStage = (stageId: string) => {
    return getDealsForStage(stageId).reduce((sum, d) => sum + (d.amount || 0), 0);
  };

  const DealCard = ({ deal }: { deal: Opportunity }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{deal.name}</div>
            {deal.contact && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <User className="w-3 h-3" />
                {deal.contact.first_name} {deal.contact.last_name}
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingDeal(deal)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(deal.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-sm font-semibold text-primary">
            <DollarSign className="w-3 h-3" />
            {formatCurrency(deal.amount, deal.currency)}
          </div>
          {deal.close_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(deal.close_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const DealForm = ({ onSubmit, isEdit }: { onSubmit: () => void; isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label>Deal Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Website Redesign Project"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Amount</Label>
          <Input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="10000"
          />
        </div>
        <div>
          <Label>Currency</Label>
          <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Close Date</Label>
          <Input
            type="date"
            value={formData.close_date}
            onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
          />
        </div>
        <div>
          <Label>Stage</Label>
          <Select value={formData.stage_id} onValueChange={(v) => setFormData({ ...formData, stage_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {stages?.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Contact</Label>
          <Select value={formData.contact_id} onValueChange={(v) => setFormData({ ...formData, contact_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select contact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No contact</SelectItem>
              {contacts?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Company</Label>
          <Select value={formData.company_id} onValueChange={(v) => setFormData({ ...formData, company_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No company</SelectItem>
              {companies?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => { isEdit ? setEditingDeal(null) : setIsCreateOpen(false); resetForm(); }}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!formData.name}>
          {isEdit ? 'Update' : 'Create'} Deal
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          {pipelines && pipelines.length > 0 && (
            <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add Deal</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Deal</DialogTitle>
              </DialogHeader>
              <DealForm onSubmit={() => createMutation.mutate(formData)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pipeline Board */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {stages?.map((stage) => (
            <div key={stage.id} className="flex-shrink-0 w-72">
              <Card>
                <CardHeader className="pb-2" style={{ borderTop: `3px solid ${stage.color}` }}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {getDealsForStage(stage.id).length}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(getTotalForStage(stage.id), 'USD')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 min-h-[200px]">
                  {isLoading ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
                  ) : getDealsForStage(stage.id).length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-xs">No deals</div>
                  ) : (
                    getDealsForStage(stage.id).map((deal) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('dealId', deal.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const dealId = e.dataTransfer.getData('dealId');
                          if (dealId && dealId !== deal.id) {
                            updateStageMutation.mutate({ dealId, stageId: stage.id });
                          }
                        }}
                      >
                        <DealCard deal={deal} />
                      </div>
                    ))
                  )}
                  <div
                    className="h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dealId = e.dataTransfer.getData('dealId');
                      if (dealId) {
                        updateStageMutation.mutate({ dealId, stageId: stage.id });
                      }
                    }}
                  >
                    <span className="text-xs text-muted-foreground">Drop here</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={!!editingDeal} onOpenChange={() => setEditingDeal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
          </DialogHeader>
          <DealForm
            isEdit
            onSubmit={() => {
              if (editingDeal) {
                const stage = stages?.find(s => s.id === formData.stage_id);
                supabase
                  .from('opportunities')
                  .update({
                    name: formData.name,
                    amount: formData.amount ? parseFloat(formData.amount) : null,
                    currency: formData.currency,
                    close_date: formData.close_date || null,
                    contact_id: formData.contact_id || null,
                    company_id: formData.company_id || null,
                    stage_id: formData.stage_id || null,
                    probability: stage?.probability || 0,
                  })
                  .eq('id', editingDeal.id)
                  .then(({ error }) => {
                    if (error) {
                      toast.error('Failed to update deal');
                    } else {
                      queryClient.invalidateQueries({ queryKey: ['deals'] });
                      setEditingDeal(null);
                      resetForm();
                      toast.success('Deal updated');
                    }
                  });
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
