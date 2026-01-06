import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TestTube, 
  Loader2, 
  Check, 
  X, 
  Users, 
  UserSearch, 
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GHLConnectionTesterProps {
  organizationId: string;
  locationId: string | null;
}

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface ActionLog {
  id: string;
  action_type: string;
  result: string | null;
  executed_at: string;
  error_message: string | null;
}

export function GHLConnectionTester({ organizationId, locationId }: GHLConnectionTesterProps) {
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [locationName, setLocationName] = useState<string | null>(null);
  
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  
  const [logsOpen, setLogsOpen] = useState(false);

  useEffect(() => {
    fetchActionLogs();
  }, [organizationId]);

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const { data, error } = await supabase.functions.invoke('crm-actions', {
        body: {
          action: 'test_connection',
          organization_id: organizationId
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message);
      }

      setConnectionStatus('success');
      setLocationName(data.data?.location?.name || data.data?.name || null);
      toast.success('Connection verified successfully!');
    } catch (err: any) {
      setConnectionStatus('error');
      toast.error(err.message || 'Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const listContacts = async () => {
    setLoadingContacts(true);

    try {
      const { data, error } = await supabase.functions.invoke('crm-actions', {
        body: {
          action: 'list_contacts',
          organization_id: organizationId
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message);
      }

      const contactList = data.data?.contacts || [];
      setContacts(contactList);
      toast.success(`Found ${contactList.length} contacts`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchActionLogs = async () => {
    setLoadingLogs(true);

    try {
      const { data, error } = await supabase
        .from('agent_execution_logs')
        .select('id, action_type, result, executed_at, error_message')
        .eq('organization_id', organizationId)
        .like('action_type', 'crm_%')
        .order('executed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActionLogs(data || []);
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-4"
    >
      <Card className="border-border/50 bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TestTube className="w-4 h-4 text-primary" />
            Connection Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex-1">
              <p className="text-sm font-medium">Token Status</p>
              <p className="text-xs text-muted-foreground">
                {connectionStatus === 'success' && locationName 
                  ? `Connected to: ${locationName}`
                  : locationId 
                    ? `Location: ${locationId.substring(0, 12)}...`
                    : 'Not tested yet'}
              </p>
            </div>
            {connectionStatus === 'success' && (
              <Badge className="bg-green-500/20 text-green-400">
                <Check className="w-3 h-3 mr-1" />
                Valid
              </Badge>
            )}
            {connectionStatus === 'error' && (
              <Badge variant="destructive">
                <X className="w-3 h-3 mr-1" />
                Failed
              </Badge>
            )}
          </div>

          {/* Quick Tests */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={testConnection}
              disabled={testingConnection}
            >
              {testingConnection ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={listContacts}
              disabled={loadingContacts}
            >
              {loadingContacts ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              List Contacts
            </Button>
          </div>

          {/* Contacts List */}
          {contacts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Contacts ({contacts.length})</p>
              <ScrollArea className="h-32 rounded-md border border-border/50 bg-background/50">
                <div className="p-2 space-y-1">
                  {contacts.map((contact) => (
                    <div 
                      key={contact.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 text-sm"
                    >
                      <UserSearch className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="font-medium">
                        {contact.firstName || contact.lastName 
                          ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                          : 'Unknown'}
                      </span>
                      <span className="text-muted-foreground text-xs truncate">
                        {contact.email || contact.phone || contact.id.substring(0, 8)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Action Logs */}
          <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent CRM Actions ({actionLogs.length})
                </span>
                {logsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-32 mt-2 rounded-md border border-border/50 bg-background/50">
                <div className="p-2 space-y-1">
                  {actionLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No CRM actions logged yet
                    </p>
                  ) : (
                    actionLogs.map((log) => (
                      <div 
                        key={log.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted/50 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {log.result === 'success' ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <X className="w-3 h-3 text-red-400" />
                          )}
                          <span className="font-mono">{log.action_type}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {formatTimeAgo(log.executed_at)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchActionLogs}
                disabled={loadingLogs}
                className="w-full mt-2"
              >
                {loadingLogs ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh Logs
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </motion.div>
  );
}
