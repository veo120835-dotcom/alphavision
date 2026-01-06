import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Eye, EyeOff, Zap, AlertTriangle, CheckCircle2,
  TrendingUp, Clock, Bell, BellOff, Activity,
  Shield, Target, Brain, Sparkles, Play, Loader2, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { format } from "date-fns";

export default function NoInputMode() {
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [latestBrief, setLatestBrief] = useState<any>(null);
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization?.id) {
      fetchState();
      fetchLatestBrief();
    }
  }, [organization?.id]);

  const fetchState = async () => {
    try {
      const { data, error } = await supabase
        .from('passive_mode_state')
        .select('*')
        .eq('organization_id', organization!.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Create initial state
        const { data: newState, error: insertError } = await supabase
          .from('passive_mode_state')
          .insert({
            organization_id: organization!.id,
            is_enabled: false,
            alert_threshold: 'critical_only'
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        setState(newState);
      } else {
        setState(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestBrief = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_briefs')
      .select('*')
      .eq('organization_id', organization!.id)
      .eq('brief_date', today)
      .single();
    
    if (data) setLatestBrief(data);
  };

  const toggleMode = async (enabled: boolean) => {
    if (!state?.id) return;

    try {
      const { error } = await supabase
        .from('passive_mode_state')
        .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('id', state.id);

      if (error) throw error;
      setState({ ...state, is_enabled: enabled });
      toast.success(enabled ? 'No-Input Mode activated' : 'No-Input Mode deactivated');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const updateThreshold = async (threshold: string) => {
    if (!state?.id) return;

    try {
      const { error } = await supabase
        .from('passive_mode_state')
        .update({ alert_threshold: threshold })
        .eq('id', state.id);

      if (error) throw error;
      setState({ ...state, alert_threshold: threshold });
      toast.success('Alert threshold updated');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const runAgentsNow = async () => {
    if (!organization?.id) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('autonomous-agent-runner', {
        body: { organizationId: organization.id, generateBrief: true }
      });
      if (error) throw error;
      toast.success('All autonomous agents executed successfully');
      fetchState();
      fetchLatestBrief();
    } catch (err) {
      toast.error('Failed to run agents');
    } finally {
      setRunning(false);
    }
  };

  const generateBrief = async () => {
    if (!organization?.id) return;
    setGeneratingBrief(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-brief-generator', {
        body: { organization_id: organization.id }
      });
      if (error) throw error;
      toast.success('Daily brief generated');
      fetchLatestBrief();
    } catch (err) {
      toast.error('Failed to generate brief');
    } finally {
      setGeneratingBrief(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const isEnabled = state?.is_enabled || false;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
            👁️ No-Input Mode (Endgame)
          </h1>
          <p className="text-muted-foreground max-w-xl">
            The AI observes, learns, decides, prepares—and alerts only when necessary.
            User interaction drops toward zero. This is the highest willingness-to-pay state.
          </p>
        </div>
      </div>

      {/* Main Toggle */}
      <Card className={cn(
        "border-2 transition-all duration-500",
        isEnabled 
          ? "border-green-500/50 bg-gradient-to-r from-green-500/10 to-emerald-500/10" 
          : "border-muted"
      )}>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={cn(
                "p-6 rounded-2xl transition-all duration-500",
                isEnabled ? "bg-green-500/20" : "bg-muted"
              )}>
                {isEnabled ? (
                  <Eye className="w-12 h-12 text-green-400" />
                ) : (
                  <EyeOff className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {isEnabled ? 'Passive Observation Active' : 'No-Input Mode Disabled'}
                </h2>
                <p className="text-muted-foreground">
                  {isEnabled 
                    ? 'AI is watching, learning, and preparing decisions automatically'
                    : 'Enable to let AI operate autonomously with minimal input'}
                </p>
              </div>
            </div>
            <Switch 
              checked={isEnabled} 
              onCheckedChange={toggleMode}
              className="scale-150"
            />
          </div>

          {isEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 pt-6 border-t border-green-500/30"
            >
              <div className="flex items-center gap-2 text-green-400">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-sm">System is actively observing your business...</span>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button onClick={runAgentsNow} disabled={running} className="flex-1">
          {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Run All Agents Now
        </Button>
        <Button onClick={generateBrief} disabled={generatingBrief} variant="outline" className="flex-1">
          {generatingBrief ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          Generate Daily Brief
        </Button>
      </div>

      {/* Latest Brief Preview */}
      {latestBrief && (
        <Card className="bg-gradient-to-r from-primary/5 to-green-500/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Today's Brief
              <Badge variant="outline" className="ml-auto">
                {format(new Date(latestBrief.generated_at), 'h:mm a')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{latestBrief.executive_summary}</p>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-2 rounded bg-muted/50">
                <div className="text-lg font-bold text-green-400">
                  ${(latestBrief.revenue_impact?.protected || 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Protected</div>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="text-lg font-bold text-blue-400">
                  {latestBrief.revenue_impact?.auto_executed_count || 0}
                </div>
                <div className="text-xs text-muted-foreground">Auto-Executed</div>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="text-lg font-bold text-orange-400">
                  {latestBrief.revenue_impact?.blocked_count || 0}
                </div>
                <div className="text-xs text-muted-foreground">Blocked</div>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="text-lg font-bold text-purple-400">
                  {latestBrief.revenue_impact?.time_saved_minutes || 0}m
                </div>
                <div className="text-xs text-muted-foreground">Time Saved</div>
              </div>
            </div>
            {latestBrief.tomorrows_focus && (
              <div className="mt-3 p-2 rounded bg-primary/10 border border-primary/20">
                <span className="text-xs text-muted-foreground">Tomorrow's Focus: </span>
                <span className="text-sm font-medium">{latestBrief.tomorrows_focus}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold">{state?.observations_today || 0}</div>
            <div className="text-xs text-muted-foreground">Observations Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Brain className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold">{state?.decisions_prepared || 0}</div>
            <div className="text-xs text-muted-foreground">Decisions Prepared</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            <div className="text-2xl font-bold">{state?.risks_flagged || 0}</div>
            <div className="text-xs text-muted-foreground">Risks Flagged</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold">{state?.opportunities_queued || 0}</div>
            <div className="text-xs text-muted-foreground">Opportunities Queued</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold">{state?.actions_auto_executed || 0}</div>
            <div className="text-xs text-muted-foreground">Auto-Executed</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Threshold */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alert Threshold
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select 
              value={state?.alert_threshold || 'critical_only'} 
              onValueChange={updateThreshold}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    All Alerts
                  </div>
                </SelectItem>
                <SelectItem value="important">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Important Only
                  </div>
                </SelectItem>
                <SelectItem value="critical_only">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Critical Only (Recommended)
                  </div>
                </SelectItem>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <BellOff className="w-4 h-4" />
                    No Alerts (Full Autonomy)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Control how often the AI interrupts you
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Example Daily Output */}
      <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5">
        <CardHeader>
          <CardTitle>Example Daily Output</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-lg bg-background/50 border border-primary/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  "No action required today."
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>✅ 3 leads automatically qualified and added to pipeline</p>
                  <p>⚠️ 1 risk flagged: Churn indicator on client #47</p>
                  <p>🎯 1 opportunity queued: Upsell ready for approval</p>
                  <p>📊 Revenue on track: +12% vs. last month</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What It Does */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { icon: Eye, label: 'Observes', desc: 'Monitors all business signals 24/7' },
          { icon: Brain, label: 'Learns', desc: 'Builds understanding of patterns' },
          { icon: Shield, label: 'Decides', desc: 'Makes decisions within authority' },
          { icon: Sparkles, label: 'Prepares', desc: 'Queues actions for your approval' }
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <item.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">{item.label}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Philosophy */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-primary/10 border-purple-500/30">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">🎯 The Endgame</h3>
          <p className="text-muted-foreground">
            "User interaction drops toward zero. The AI observes, learns, decides, prepares,
            and alerts only when necessary. This is the highest willingness-to-pay state—
            a business that runs itself while you focus on what matters."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
