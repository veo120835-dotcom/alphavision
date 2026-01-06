import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Brain, 
  Battery, 
  BatteryLow, 
  BatteryWarning,
  Clock,
  Pause,
  Play,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface DecisionMetrics {
  todayDecisions: number;
  avgDailyDecisions: number;
  fatigueLevel: number;
  optimalWindow: string;
  avoidancePatterns: string[];
  deferredDecisions: number;
}

interface PendingDecision {
  id: string;
  title: string;
  urgency: 'now' | 'today' | 'this-week' | 'defer';
  complexity: 'trivial' | 'simple' | 'complex' | 'strategic';
  recommendation: string;
}

export function DecisionFatigueSystem() {
  const { organization } = useOrganization();
  const [metrics, setMetrics] = useState<DecisionMetrics>({
    todayDecisions: 0,
    avgDailyDecisions: 15,
    fatigueLevel: 45,
    optimalWindow: '9am - 11am',
    avoidancePatterns: [],
    deferredDecisions: 3
  });
  const [autoSimplify, setAutoSimplify] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [pendingDecisions, setPendingDecisions] = useState<PendingDecision[]>([]);

  useEffect(() => {
    loadDecisionData();
  }, [organization?.id]);

  const loadDecisionData = async () => {
    if (!organization?.id) return;

    // Load decision counts
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('decisions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    const hour = new Date().getHours();
    const fatigueLevel = Math.min(100, (count || 0) * 8 + (hour > 14 ? 20 : 0) + (hour > 18 ? 25 : 0));

    setMetrics(prev => ({
      ...prev,
      todayDecisions: count || 0,
      fatigueLevel,
      avoidancePatterns: fatigueLevel > 60 ? [
        'Postponing high-stakes decisions',
        'Seeking more information when action is clear',
        'Defaulting to "safe" options repeatedly'
      ] : []
    }));

    // Generate pending decisions
    setPendingDecisions([
      { id: '1', title: 'Respond to $25k proposal request', urgency: 'today', complexity: 'complex', recommendation: 'Schedule for tomorrow AM - your peak clarity window' },
      { id: '2', title: 'Choose email subject line for campaign', urgency: 'now', complexity: 'trivial', recommendation: 'Pick Option A (data shows 23% higher open rate)' },
      { id: '3', title: 'Approve contractor invoice', urgency: 'today', complexity: 'simple', recommendation: 'Auto-approved per your $500 threshold rule' },
      { id: '4', title: 'Strategic pricing change', urgency: 'this-week', complexity: 'strategic', recommendation: 'Defer to Friday strategy block' }
    ]);
  };

  const getFatigueStatus = () => {
    if (metrics.fatigueLevel < 30) return { color: 'text-green-500', icon: Battery, label: 'Fresh', bg: 'bg-green-500/10' };
    if (metrics.fatigueLevel < 60) return { color: 'text-amber-500', icon: BatteryWarning, label: 'Moderate', bg: 'bg-amber-500/10' };
    return { color: 'text-red-500', icon: BatteryLow, label: 'Fatigued', bg: 'bg-red-500/10' };
  };

  const getUrgencyStyle = (urgency: PendingDecision['urgency']) => {
    switch (urgency) {
      case 'now': return 'bg-red-500/20 text-red-400';
      case 'today': return 'bg-amber-500/20 text-amber-400';
      case 'this-week': return 'bg-blue-500/20 text-blue-400';
      case 'defer': return 'bg-muted text-muted-foreground';
    }
  };

  const handleDecision = (id: string, action: 'approve' | 'defer' | 'delegate') => {
    setPendingDecisions(prev => prev.filter(d => d.id !== id));
    setMetrics(prev => ({
      ...prev,
      todayDecisions: prev.todayDecisions + 1,
      deferredDecisions: action === 'defer' ? prev.deferredDecisions + 1 : prev.deferredDecisions
    }));
    toast.success(action === 'approve' ? 'Decision made' : action === 'defer' ? 'Deferred to optimal time' : 'Delegated');
  };

  const status = getFatigueStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Decision Fatigue System
          </h1>
          <p className="text-muted-foreground mt-1">
            Protect decision quality. Automate the trivial. Defer the complex.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Focus Mode</span>
            <Switch checked={focusMode} onCheckedChange={setFocusMode} />
          </div>
        </div>
      </div>

      {/* Fatigue Status */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className={`${status.bg} border-${status.color.replace('text-', '')}/30`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-8 w-8 ${status.color}`} />
              <div>
                <p className="text-sm text-muted-foreground">Decision Energy</p>
                <p className={`text-2xl font-bold ${status.color}`}>{100 - metrics.fatigueLevel}%</p>
                <p className="text-xs text-muted-foreground">{status.label}</p>
              </div>
            </div>
            <Progress value={100 - metrics.fatigueLevel} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary" />
              <div>
                <p className="text-2xl font-bold">{metrics.todayDecisions}</p>
                <p className="text-sm text-muted-foreground">Decisions Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-lg font-bold">{metrics.optimalWindow}</p>
                <p className="text-sm text-muted-foreground">Peak Clarity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Pause className="h-6 w-6 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.deferredDecisions}</p>
                <p className="text-sm text-muted-foreground">Wisely Deferred</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning if fatigued */}
      {metrics.fatigueLevel > 60 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-medium text-red-500">High Decision Fatigue Detected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You've made {metrics.todayDecisions} decisions today. Research shows quality drops significantly after 10-15 decisions. 
                  Consider deferring non-urgent choices to tomorrow morning.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {metrics.avoidancePatterns.map((pattern, i) => (
                    <Badge key={i} variant="outline" className="text-red-400 border-red-400/30">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Decisions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Pending Decisions
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Auto-simplify</span>
                <Switch checked={autoSimplify} onCheckedChange={setAutoSimplify} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingDecisions.map((decision) => (
                <div key={decision.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{decision.title}</p>
                        <Badge className={getUrgencyStyle(decision.urgency)}>
                          {decision.urgency}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{decision.recommendation}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {decision.complexity === 'trivial' && autoSimplify ? (
                      <Button size="sm" className="flex-1" onClick={() => handleDecision(decision.id, 'approve')}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept Recommendation
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleDecision(decision.id, 'defer')}>
                          <Pause className="h-4 w-4 mr-1" />
                          Defer
                        </Button>
                        <Button size="sm" onClick={() => handleDecision(decision.id, 'approve')}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Decide
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {pendingDecisions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>All caught up! No pending decisions.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Decision Defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Smart Defaults (Auto-Decide)
            </CardTitle>
            <CardDescription>
              Pre-set rules for trivial decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { rule: 'Auto-approve invoices under $500', enabled: true },
                { rule: 'Use last successful email subject pattern', enabled: true },
                { rule: 'Schedule meetings only in PM time blocks', enabled: true },
                { rule: 'Decline meetings without clear agenda', enabled: false },
                { rule: 'Auto-respond to pricing questions with rate card', enabled: true },
                { rule: 'Defer strategic decisions to Friday deep work', enabled: true }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">{item.rule}</span>
                  <Switch checked={item.enabled} />
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium text-primary mb-1">💡 Pro Tip</p>
              <p className="text-sm text-muted-foreground">
                Each automated rule saves ~3 decisions/week. With 6 rules, you're preserving 
                <span className="font-bold text-primary"> 18 high-quality decisions</span> for what actually matters.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
