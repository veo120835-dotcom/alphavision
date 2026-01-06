import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calculator, Clock, DollarSign, Ban, TrendingUp,
  AlertTriangle, CheckCircle2, Sparkles, Calendar, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface DeclinedActivity {
  id: string;
  activity_type: string;
  activity_description: string;
  estimated_opportunity_cost: number;
  reason_declined: string;
  alternative_suggested: string | null;
  auto_declined: boolean;
  user_override: boolean;
  declined_at: string;
}

export default function OpportunityCostMaximizer() {
  const [activities, setActivities] = useState<DeclinedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoDeclineEnabled, setAutoDeclineEnabled] = useState(true);
  const [stats, setStats] = useState({
    totalSaved: 0,
    activitiesDeclined: 0,
    hoursRecovered: 0,
    hourlyRate: 500
  });
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization?.id) fetchActivities();
  }, [organization?.id]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_declined_activities')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('declined_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setActivities(data || []);
      
      const total = (data || []).reduce((a, b) => a + b.estimated_opportunity_cost, 0);
      setStats({
        totalSaved: total,
        activitiesDeclined: (data || []).length,
        hoursRecovered: Math.round(total / 500),
        hourlyRate: 500
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (activityId: string) => {
    try {
      await supabase
        .from('auto_declined_activities')
        .update({ user_override: true })
        .eq('id', activityId);
      
      toast.success('Activity override recorded');
      fetchActivities();
    } catch (error) {
      toast.error('Failed to override');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'meeting': return Calendar;
      case 'email': return Target;
      case 'call': return Clock;
      default: return AlertTriangle;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
            💰 Opportunity Cost Maximizer
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Every "yes" is a "no" to something else. This system continuously measures 
            what you're doing vs. what you could be doing, and kills low-leverage actions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Auto-Decline</span>
          <Switch 
            checked={autoDeclineEnabled} 
            onCheckedChange={setAutoDeclineEnabled}
          />
        </div>
      </div>

      {/* Impact Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-3xl font-bold text-green-400">
              ${stats.totalSaved.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Value Saved</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Ban className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <div className="text-3xl font-bold">{stats.activitiesDeclined}</div>
            <div className="text-sm text-muted-foreground">Activities Declined</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <div className="text-3xl font-bold">{stats.hoursRecovered}</div>
            <div className="text-sm text-muted-foreground">Hours Recovered</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Calculator className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-3xl font-bold">${stats.hourlyRate}</div>
            <div className="text-sm text-muted-foreground">Your Effective Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Example Card */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-amber-500/20">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">How It Works</h3>
              <p className="text-muted-foreground">
                "This meeting costs $2,300 in opportunity cost. At your effective rate of $500/hr 
                and the meeting's 4.5 hour total time investment (prep + travel + meeting + follow-up), 
                this is economically negative. <strong>Auto-declined.</strong>"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Decline Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Active Auto-Decline Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { rule: "Meetings under $2,000 potential value", threshold: "$2,000" },
              { rule: "Calls without clear decision point", threshold: "Any" },
              { rule: "Email threads with >5 replies", threshold: ">5 replies" },
              { rule: "Networking without referral potential", threshold: "<$5k LTV" },
              { rule: "Free consulting requests", threshold: "$0" },
              { rule: "Scope creep without contract change", threshold: "Any" }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">{item.rule}</span>
                <Badge variant="outline">{item.threshold}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Declined Activities */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Recently Declined Activities</h2>

        {activities.length === 0 ? (
          <Card className="p-8 text-center">
            <Ban className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Declined Activities Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The system will start tracking and declining low-value activities automatically.
            </p>
          </Card>
        ) : (
          activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.activity_type);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "border-l-4",
                  activity.user_override ? "border-l-yellow-500" : "border-l-red-500"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{activity.activity_description}</h3>
                            {activity.auto_declined && (
                              <Badge className="bg-red-500/20 text-red-400 text-xs">
                                Auto-Declined
                              </Badge>
                            )}
                            {activity.user_override && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                Overridden
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {activity.reason_declined}
                          </p>
                          {activity.alternative_suggested && (
                            <div className="flex items-center gap-2 text-sm">
                              <Sparkles className="w-3 h-3 text-green-400" />
                              <span className="text-green-400">Alternative: {activity.alternative_suggested}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-400">
                          -${activity.estimated_opportunity_cost.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">opportunity cost</div>
                        {!activity.user_override && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => handleOverride(activity.id)}
                          >
                            Override
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Revenue Impact */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Revenue Without Growth</h3>
              <p className="text-muted-foreground text-sm">
                This single feature dramatically increases revenue without adding clients or work.
                It simply eliminates economic waste.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-400">
                +{Math.round((stats.totalSaved / 50000) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Effective Capacity</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
