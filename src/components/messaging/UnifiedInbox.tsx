import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Mail, Phone, MessageCircle, Users, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import type { Conversation } from '@/providers/types';

const channelIcons = {
  whatsapp: MessageSquare,
  sms: Phone,
  email: Mail,
  manychat: MessageCircle,
  ghl: Users,
  internal: MessageSquare
};

export function UnifiedInbox() {
  const { currentOrganization } = useOrganization();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'snoozed' | 'closed'>('all');

  useEffect(() => {
    if (!currentOrganization?.id) return;

    loadConversations();

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `organization_id=eq.${currentOrganization.id}`
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization?.id, statusFilter]);

  async function loadConversations() {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('last_message_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      setConversations(data || []);
    } catch (error) {
      console.error('Error in loadConversations:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.external_id.toLowerCase().includes(query) ||
      conv.contact_info?.name?.toLowerCase().includes(query) ||
      conv.channel.toLowerCase().includes(query)
    );
  });

  const groupedByChannel = filteredConversations.reduce((acc, conv) => {
    if (!acc[conv.channel]) acc[conv.channel] = [];
    acc[conv.channel].push(conv);
    return acc;
  }, {} as Record<string, Conversation[]>);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <Card className="w-96 flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Inbox</CardTitle>
            <Badge variant="secondary">{filteredConversations.length}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="snoozed">Snoozed</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
          <ScrollArea className="flex-1">
            <CardContent className="p-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading conversations...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No conversations found</div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((conv) => {
                    const Icon = channelIcons[conv.channel] || MessageSquare;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedConversation?.id === conv.id
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-muted">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium truncate">
                                {conv.contact_info?.name || conv.external_id}
                              </p>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {conv.channel}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {conv.external_id}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(conv.last_message_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Tabs>
      </Card>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>
            {selectedConversation ? (
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = channelIcons[selectedConversation.channel] || MessageSquare;
                  return <Icon className="h-5 w-5" />;
                })()}
                <span>{selectedConversation.contact_info?.name || selectedConversation.external_id}</span>
                <Badge variant="outline">{selectedConversation.channel}</Badge>
              </div>
            ) : (
              'Select a conversation'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedConversation ? (
            <div className="text-center py-8 text-muted-foreground">
              Select a conversation to view messages
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation from the list to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
