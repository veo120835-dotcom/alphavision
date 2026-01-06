import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skull, RefreshCw, Send, Users, DollarSign, Clock, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface DeadLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  last_objection: string | null;
  last_contacted_at: string;
  reactivation_count: number;
  score: number;
}

interface MessageOption {
  type: string;
  content: string;
}

export function LazarusEngineDashboard() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<DeadLead | null>(null);
  const [messages, setMessages] = useState<MessageOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: deadLeads, isLoading } = useQuery({
    queryKey: ['dead-leads', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { total: 0, by_objection: {} };

      const { data, error } = await supabase.functions.invoke('lazarus-resurrector', {
        body: {
          action: 'find_dead_leads',
          organization_id: organization.id
        }
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id
  });

  const { data: stats } = useQuery({
    queryKey: ['resurrection-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const { data, error } = await supabase.functions.invoke('lazarus-resurrector', {
        body: {
          action: 'get_resurrection_stats',
          organization_id: organization.id
        }
      });
      
      if (error) throw error;
      return data.stats;
    },
    enabled: !!organization?.id
  });

  const generateMessageMutation = useMutation({
    mutationFn: async (leadId: string) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('lazarus-resurrector', {
        body: {
          action: 'generate_resurrection_message',
          organization_id: organization.id,
          lead_id: leadId
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSelectedLead(data.lead);
      setMessages(data.messages || []);
      setDialogOpen(true);
    },
    onError: (error) => {
      toast.error('Failed to generate message: ' + error.message);
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ leadId, message, channel }: { leadId: string; message: string; channel: string }) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('lazarus-resurrector', {
        body: {
          action: 'send_resurrection',
          organization_id: organization.id,
          lead_id: leadId,
          message,
          channel
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Resurrection message sent');
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['dead-leads'] });
      queryClient.invalidateQueries({ queryKey: ['resurrection-stats'] });
    },
    onError: (error) => {
      toast.error('Failed to send: ' + error.message);
    }
  });

  const bulkResurrectMutation = useMutation({
    mutationFn: async (objectionType: string) => {
      if (!organization?.id) throw new Error('No organization');

      const leads = deadLeads?.by_objection?.[objectionType] || [];
      const leadIds = leads.slice(0, 10).map((l: DeadLead) => l.id);

      const { data, error } = await supabase.functions.invoke('lazarus-resurrector', {
        body: {
          action: 'bulk_resurrect',
          organization_id: organization.id,
          lead_ids: leadIds,
          message_type: 'casual'
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sent ${data.results?.length || 0} resurrection messages`);
      queryClient.invalidateQueries({ queryKey: ['dead-leads'] });
      queryClient.invalidateQueries({ queryKey: ['resurrection-stats'] });
    }
  });

  const objectionCategories = [
    { key: 'price', label: 'Price Objection', color: 'bg-red-500' },
    { key: 'timing', label: 'Bad Timing', color: 'bg-yellow-500' },
    { key: 'competitor', label: 'Chose Competitor', color: 'bg-purple-500' },
    { key: 'ghosted', label: 'Ghosted', color: 'bg-gray-500' },
    { key: 'other', label: 'Other', color: 'bg-blue-500' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Skull className="h-8 w-8 text-primary" />
            Lazarus Engine
          </h1>
          <p className="text-muted-foreground mt-1">
            Resurrect dead leads with context-aware, personalized reactivation.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dead Leads</p>
                <p className="text-2xl font-bold">{deadLeads?.total || 0}</p>
              </div>
              <Skull className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resurrections Sent</p>
                <p className="text-2xl font-bold">{stats?.total_resurrected || 0}</p>
              </div>
              <Send className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Replied</p>
                <p className="text-2xl font-bold">{stats?.by_status?.replied || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revived</p>
                <p className="text-2xl font-bold">{stats?.by_status?.revived || 0}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads by Objection */}
      <Tabs defaultValue="price">
        <TabsList>
          {objectionCategories.map(cat => {
            const count = deadLeads?.by_objection?.[cat.key]?.length || 0;
            return (
              <TabsTrigger key={cat.key} value={cat.key} className="gap-2">
                {cat.label}
                <Badge variant="secondary" className="text-xs">{count}</Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {objectionCategories.map(cat => (
          <TabsContent key={cat.key} value={cat.key} className="space-y-4">
            <div className="flex justify-end">
              <Button 
                variant="outline"
                onClick={() => bulkResurrectMutation.mutate(cat.key)}
                disabled={bulkResurrectMutation.isPending || !(deadLeads?.by_objection?.[cat.key]?.length)}
              >
                <Send className="h-4 w-4 mr-2" />
                Bulk Resurrect (Top 10)
              </Button>
            </div>

            <div className="grid gap-4">
              {(deadLeads?.by_objection?.[cat.key] || []).slice(0, 20).map((lead: DeadLead) => (
                <Card key={lead.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{lead.name}</p>
                          <Badge variant="outline" className="text-xs">
                            Score: {lead.score || 0}
                          </Badge>
                          {lead.reactivation_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {lead.reactivation_count} attempts
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                        {lead.last_objection && (
                          <p className="text-sm mt-1">
                            <span className="text-muted-foreground">Last objection: </span>
                            "{lead.last_objection}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Last contact: {lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <Button 
                        onClick={() => generateMessageMutation.mutate(lead.id)}
                        disabled={generateMessageMutation.isPending}
                      >
                        {generateMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Resurrect
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(deadLeads?.by_objection?.[cat.key]?.length || 0) === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No dead leads with this objection type.
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Message Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resurrect {selectedLead?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedLead?.last_objection && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">Their objection was:</p>
                <p className="font-medium">"{selectedLead.last_objection}"</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">Choose a message approach:</p>

            <div className="space-y-3">
              {messages.map((msg, i) => (
                <Card 
                  key={i} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => sendMessageMutation.mutate({
                    leadId: selectedLead!.id,
                    message: msg.content,
                    channel: 'email'
                  })}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge>{msg.type}</Badge>
                      <Button size="sm" variant="ghost" disabled={sendMessageMutation.isPending}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
