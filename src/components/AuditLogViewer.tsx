import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Search, Filter, Download, Clock, DollarSign, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuditEntry {
  id: string;
  deployment_id: string;
  event_type: string;
  event_data: any;
  outcome: any;
  roi_impact: number;
  logged_at: string;
  decision_reasoning: string | null;
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization?.id) fetchLogs();
  }, [organization?.id]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('deployment_audit_log')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('logged_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.decision_reasoning && log.decision_reasoning.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || log.event_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const actionTypes = [...new Set(logs.map(l => l.event_type))];

  const outcomeSuccess = (outcome: any) => outcome && (outcome === 'success' || outcome?.status === 'success');

  const stats = {
    totalLogs: logs.length,
    totalPnL: logs.reduce((sum, l) => sum + (l.roi_impact || 0), 0),
    successActions: logs.filter(l => outcomeSuccess(l.outcome)).length,
    failedActions: logs.filter(l => !outcomeSuccess(l.outcome) && l.outcome).length
  };

  const getActionIcon = (eventType: string) => {
    switch (eventType) {
      case 'execution_started': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'capital_deployed': return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'halt_triggered': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'profit_realized': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'loss_recorded': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Event Type', 'Outcome', 'ROI Impact', 'Deployment ID'].join(','),
      ...filteredLogs.map(l => [
        new Date(l.logged_at).toISOString(),
        l.event_type,
        typeof l.outcome === 'string' ? l.outcome : JSON.stringify(l.outcome || ''),
        l.roi_impact || 0,
        l.deployment_id || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Audit log exported');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Audit & Attribution Log
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete audit trail of all capital deployments, decisions, and outcomes
          </p>
        </div>
        <Button onClick={exportLogs} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
            <p className="text-sm text-muted-foreground">Total Log Entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total P&L Impact</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{stats.successActions}</div>
            <p className="text-sm text-muted-foreground">Successful Actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">{stats.failedActions}</div>
            <p className="text-sm text-muted-foreground">Failed Actions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search logs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {actionTypes.map(type => (
                  <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Log Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail ({filteredLogs.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found</p>
                <p className="text-sm">Logs will appear here when capital deployments are executed</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getActionIcon(log.event_type)}
                      <div>
                        <div className="font-medium capitalize">
                          {log.event_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {new Date(log.logged_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {log.outcome && (
                        <Badge variant={outcomeSuccess(log.outcome) ? 'default' : 'destructive'}>
                          {typeof log.outcome === 'string' ? log.outcome : (log.outcome?.status || 'completed')}
                        </Badge>
                      )}
                      {log.roi_impact !== null && log.roi_impact !== 0 && (
                        <span className={`font-mono font-medium ${log.roi_impact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {log.roi_impact >= 0 ? '+' : ''}${log.roi_impact.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
