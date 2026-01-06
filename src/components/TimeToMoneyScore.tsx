import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Zap,
  Target,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Timer,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface TimeMetrics {
  avgLeadToClose: number; // days
  avgTimePerDeal: number; // hours
  hourlyRate: number;
  monthlyDeals: number;
  efficiency: number;
}

interface Activity {
  name: string;
  hoursPerWeek: number;
  revenueContribution: number;
  isMultiplier: boolean;
}

export function TimeToMoneyScore() {
  const { organization } = useOrganization();
  const [metrics, setMetrics] = useState<TimeMetrics>({
    avgLeadToClose: 7,
    avgTimePerDeal: 4,
    hourlyRate: 250,
    monthlyDeals: 8,
    efficiency: 72
  });
  const [activities, setActivities] = useState<Activity[]>([
    { name: 'Content Creation', hoursPerWeek: 8, revenueContribution: 25, isMultiplier: true },
    { name: 'Client Calls', hoursPerWeek: 10, revenueContribution: 40, isMultiplier: true },
    { name: 'DM Outreach', hoursPerWeek: 5, revenueContribution: 20, isMultiplier: true },
    { name: 'Admin Tasks', hoursPerWeek: 6, revenueContribution: 0, isMultiplier: false },
    { name: 'Proposal Writing', hoursPerWeek: 4, revenueContribution: 15, isMultiplier: true },
  ]);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      loadConfig();
    }
  }, [organization?.id]);

  const loadConfig = async () => {
    if (!organization?.id) return;

    const { data } = await supabase
      .from('memory_items')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('type', 'time_money_config')
      .single();

    if (data?.content) {
      const content = data.content as Record<string, unknown>;
      if (content.metrics) setMetrics(content.metrics as TimeMetrics);
      if (content.activities) setActivities(content.activities as Activity[]);
    }
  };

  const analyzeEfficiency = async () => {
    setAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const totalHours = activities.reduce((sum, a) => sum + a.hoursPerWeek, 0);
    const multiplierHours = activities.filter(a => a.isMultiplier).reduce((sum, a) => sum + a.hoursPerWeek, 0);
    const efficiency = Math.round((multiplierHours / totalHours) * 100);
    
    setMetrics(prev => ({ ...prev, efficiency }));
    setAnalyzing(false);
    toast.success('Efficiency analysis complete!');
  };

  const saveConfig = async () => {
    if (!organization?.id) return;

    try {
      const { data: existing } = await supabase
        .from('memory_items')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('type', 'time_money_config')
        .single();

      const content = JSON.parse(JSON.stringify({ metrics, activities }));

      if (existing) {
        await supabase
          .from('memory_items')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('memory_items')
          .insert({
            organization_id: organization.id,
            type: 'time_money_config',
            title: 'Time-to-Money Configuration',
            content
          });
      }

      toast.success('Configuration saved!');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const updateActivity = (index: number, updates: Partial<Activity>) => {
    setActivities(prev => prev.map((a, i) => i === index ? { ...a, ...updates } : a));
  };

  const totalWeeklyHours = activities.reduce((sum, a) => sum + a.hoursPerWeek, 0);
  const multiplierHours = activities.filter(a => a.isMultiplier).reduce((sum, a) => sum + a.hoursPerWeek, 0);
  const wastedHours = totalWeeklyHours - multiplierHours;
  const monthlyRevenue = metrics.monthlyDeals * metrics.hourlyRate * metrics.avgTimePerDeal;
  const effectiveHourlyRate = monthlyRevenue / (totalWeeklyHours * 4);
  const potentialRate = monthlyRevenue / (multiplierHours * 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Time-to-Money Efficiency</h2>
          <p className="text-muted-foreground">Analyze your income-multiplying activities</p>
        </div>
        <Button onClick={analyzeEfficiency} disabled={analyzing}>
          {analyzing ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyze
            </>
          )}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.efficiency}%</p>
                <p className="text-sm text-muted-foreground">Efficiency Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${Math.round(effectiveHourlyRate)}</p>
                <p className="text-sm text-muted-foreground">Effective $/hr</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Timer className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.avgLeadToClose}d</p>
                <p className="text-sm text-muted-foreground">Lead to Close</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Target className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${Math.round(potentialRate)}</p>
                <p className="text-sm text-muted-foreground">Potential $/hr</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Time Breakdown */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Weekly Time Breakdown
            </CardTitle>
            <CardDescription>Track where your time goes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map((activity, idx) => (
              <motion.div
                key={activity.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {activity.isMultiplier ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                    )}
                    <span className="font-medium">{activity.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={activity.hoursPerWeek}
                      onChange={(e) => updateActivity(idx, { hoursPerWeek: Number(e.target.value) })}
                      className="w-16 h-8 text-center"
                    />
                    <span className="text-sm text-muted-foreground">hrs</span>
                  </div>
                </div>
                <Progress 
                  value={(activity.hoursPerWeek / totalWeeklyHours) * 100} 
                  className={`h-2 ${activity.isMultiplier ? '' : 'opacity-50'}`}
                />
              </motion.div>
            ))}

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Weekly Hours</span>
                <span className="font-bold">{totalWeeklyHours}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Multiplier Hours</span>
                <span className="font-bold text-green-400">{multiplierHours}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-orange-400">Non-Multiplier Hours</span>
                <span className="font-bold text-orange-400">{wastedHours}h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deal Metrics */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Deal Metrics
            </CardTitle>
            <CardDescription>Configure your average deal parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Avg Lead-to-Close (days)</Label>
                <Input
                  type="number"
                  value={metrics.avgLeadToClose}
                  onChange={(e) => setMetrics(prev => ({ ...prev, avgLeadToClose: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Avg Time Per Deal (hours)</Label>
                <Input
                  type="number"
                  value={metrics.avgTimePerDeal}
                  onChange={(e) => setMetrics(prev => ({ ...prev, avgTimePerDeal: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Hourly Rate ($)</Label>
                <Input
                  type="number"
                  value={metrics.hourlyRate}
                  onChange={(e) => setMetrics(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Deals</Label>
                <Input
                  type="number"
                  value={metrics.monthlyDeals}
                  onChange={(e) => setMetrics(prev => ({ ...prev, monthlyDeals: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Revenue Projection
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Monthly Revenue</p>
                  <p className="text-xl font-bold">${monthlyRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Annual Projection</p>
                  <p className="text-xl font-bold">${(monthlyRevenue * 12).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <Button onClick={saveConfig} className="w-full">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {wastedHours > 5 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20"
              >
                <div className="flex items-center gap-2 text-orange-400 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Reduce Admin Time</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You spend {wastedHours}h/week on non-multiplier tasks. Consider automation or delegation.
                </p>
              </motion.div>
            )}
            
            {effectiveHourlyRate < metrics.hourlyRate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20"
              >
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Increase Deal Size</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your effective rate (${Math.round(effectiveHourlyRate)}) is below target. Focus on higher-value clients.
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-lg bg-green-500/10 border border-green-500/20"
            >
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <Zap className="w-4 h-4" />
                <span className="font-medium">Potential Unlock</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Eliminating non-multiplier tasks could boost your effective rate to ${Math.round(potentialRate)}/hr.
              </p>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
