import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, StopCircle, Activity, Clock, DollarSign, Zap, RefreshCw, CheckCircle } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface KillSwitchEvent {
  id: string;
  deployment_id: string | null;
  contract_id: string | null;
  trigger_type: string;
  trigger_value: any;
  threshold_value: any;
  action_taken: string;
  severity: string | null;
  auto_triggered: boolean | null;
  user_override: boolean | null;
  override_reason: string | null;
  triggered_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

interface ActiveDeployment {
  id: string;
  deployment_type: string;
  capital_deployed: number;
  current_value: number;
  status: string;
  started_at: string;
}

export default function KillSwitchDashboard() {
  const [events, setEvents] = useState<KillSwitchEvent[]>([]);
  const [deployments, setDeployments] = useState<ActiveDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalKillEnabled, setGlobalKillEnabled] = useState(false);
  const [autoHaltEnabled, setAutoHaltEnabled] = useState(true);
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization?.id) {
      fetchData();
    }
  }, [organization?.id]);

  const fetchData = async () => {
    try {
      const [eventsRes, deploymentsRes] = await Promise.all([
        supabase
          .from('kill_switch_events')
          .select('*')
          .eq('organization_id', organization!.id)
          .order('triggered_at', { ascending: false })
          .limit(100),
        supabase
          .from('capital_deployments')
          .select('*')
          .eq('organization_id', organization!.id)
          .in('status', ['active', 'pending'])
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (deploymentsRes.error) throw deploymentsRes.error;

      setEvents(eventsRes.data || []);
      setDeployments(deploymentsRes.data || []);
    } catch (error) {
      console.error('Error fetching kill switch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerGlobalHalt = async () => {
    try {
      // Halt all active deployments
      const { error } = await supabase
        .from('capital_deployments')
        .update({ status: 'halted', halt_reason: 'Global kill switch activated' })
        .eq('organization_id', organization!.id)
        .in('status', ['active', 'pending']);

      if (error) throw error;

      // Log the event
      await supabase.from('kill_switch_events').insert([{
        organization_id: organization!.id,
        trigger_type: 'global_halt',
        action_taken: 'All deployments halted',
        auto_triggered: false,
        trigger_value: 0,
        threshold_exceeded: true
      }]);

      toast.success('All deployments halted');
      setGlobalKillEnabled(true);
      fetchData();
    } catch (error) {
      console.error('Error triggering global halt:', error);
      toast.error('Failed to trigger global halt');
    }
  };

  const haltDeployment = async (deploymentId: string) => {
    try {
      const { error } = await supabase
        .from('capital_deployments')
        .update({ status: 'halted', halt_reason: 'Manual halt via kill switch' })
        .eq('id', deploymentId);

      if (error) throw error;

      await supabase.from('kill_switch_events').insert([{
        organization_id: organization!.id,
        deployment_id: deploymentId,
        trigger_type: 'manual_halt',
        action_taken: 'Deployment halted manually',
        auto_triggered: false,
        trigger_value: 0,
        threshold_exceeded: true
      }]);

      toast.success('Deployment halted');
      fetchData();
    } catch (error) {
      console.error('Error halting deployment:', error);
      toast.error('Failed to halt deployment');
    }
  };

  const resumeDeployment = async (deploymentId: string) => {
    try {
      const { error } = await supabase
        .from('capital_deployments')
        .update({ status: 'active', halt_reason: null })
        .eq('id', deploymentId);

      if (error) throw error;
      toast.success('Deployment resumed');
      fetchData();
    } catch (error) {
      console.error('Error resuming deployment:', error);
      toast.error('Failed to resume deployment');
    }
  };

  const stats = {
    activeDeployments: deployments.filter(d => d.status === 'active').length,
    haltedDeployments: deployments.filter(d => d.status === 'halted').length,
    totalKillEvents: events.length,
    autoTriggered: events.filter(e => e.auto_triggered === true).length,
    unresolvedEvents: events.filter(e => !e.resolved_at).length
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'loss_limit': return <DollarSign className="h-4 w-4 text-red-500" />;
      case 'quality_drop': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'manual_halt': return <StopCircle className="h-4 w-4 text-orange-500" />;
      case 'global_halt': return <Shield className="h-4 w-4 text-red-500" />;
      default: return <Zap className="h-4 w-4 text-muted-foreground" />;
    }
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
            <Shield className="h-6 w-6 text-red-500" />
            Kill Switch Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Emergency halt controls and real-time deployment monitoring
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={triggerGlobalHalt} 
            variant="destructive" 
            className="gap-2"
            disabled={globalKillEnabled}
          >
            <StopCircle className="h-4 w-4" />
            Global Halt All
          </Button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={globalKillEnabled ? 'border-red-500 bg-red-500/5' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Global Kill Switch
            </CardTitle>
            <CardDescription>
              Immediately halt ALL active capital deployments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{globalKillEnabled ? 'ACTIVATED' : 'Standby'}</p>
                <p className="text-sm text-muted-foreground">
                  {globalKillEnabled ? 'All deployments halted' : 'Click to activate'}
                </p>
              </div>
              <Switch 
                checked={globalKillEnabled} 
                onCheckedChange={(checked) => {
                  if (checked) triggerGlobalHalt();
                  else setGlobalKillEnabled(false);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Auto-Halt System
            </CardTitle>
            <CardDescription>
              Automatically halt when thresholds are breached
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{autoHaltEnabled ? 'Enabled' : 'Disabled'}</p>
                <p className="text-sm text-muted-foreground">
                  {autoHaltEnabled ? 'Auto-triggers on violations' : 'Manual control only'}
                </p>
              </div>
              <Switch checked={autoHaltEnabled} onCheckedChange={setAutoHaltEnabled} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.activeDeployments}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.haltedDeployments}</div>
            <p className="text-sm text-muted-foreground">Halted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.totalKillEvents}</div>
            <p className="text-sm text-muted-foreground">Kill Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.autoTriggered}</div>
            <p className="text-sm text-muted-foreground">Auto-Triggered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-orange-500">{stats.unresolvedEvents}</div>
            <p className="text-sm text-muted-foreground">Unresolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Deployments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Active Deployments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deployments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No active deployments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deployments.map((deployment) => {
                const pnl = (deployment.current_value || deployment.capital_deployed) - deployment.capital_deployed;
                const pnlPercent = (pnl / deployment.capital_deployed) * 100;
                
                return (
                  <div 
                    key={deployment.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium capitalize">
                          {deployment.deployment_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Started {new Date(deployment.started_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-mono">${deployment.capital_deployed.toLocaleString()}</div>
                        <div className={`text-sm font-mono ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                        </div>
                      </div>
                      <Badge variant={deployment.status === 'active' ? 'default' : 'secondary'}>
                        {deployment.status}
                      </Badge>
                      {deployment.status === 'active' ? (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => haltDeployment(deployment.id)}
                        >
                          Halt
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => resumeDeployment(deployment.id)}
                        >
                          Resume
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kill Switch Events History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Kill Switch Events History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-50 text-green-500" />
                <p>No kill switch events</p>
                <p className="text-sm">Your deployments are running smoothly</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getTriggerIcon(event.trigger_type)}
                      <div>
                        <div className="font-medium capitalize">
                          {event.trigger_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.action_taken}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={event.auto_triggered === true ? 'secondary' : 'outline'}>
                        {event.auto_triggered === true ? 'Auto' : 'Manual'}
                      </Badge>
                      <Badge variant={event.resolved_at ? 'default' : 'destructive'}>
                        {event.resolved_at ? 'Resolved' : 'Unresolved'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(event.triggered_at).toLocaleString()}
                      </span>
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
