import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Sun, 
  Moon,
  Coffee,
  Target,
  AlertTriangle,
  TrendingUp,
  Bell,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  DollarSign,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DailyBriefData {
  id: string;
  brief_date: string;
  executive_summary: string | null;
  priority_decisions: PriorityDecision[];
  revenue_alerts: RevenueAlert[];
  market_signals: string[];
  pending_approvals: string[];
  recommended_focus: string | null;
  time_allocation: Record<string, number>;
  viewed_at: string | null;
  acted_on: boolean;
}

interface PriorityDecision {
  decision: string;
  urgency: string;
  impact: string;
  deadline?: string;
}

interface RevenueAlert {
  type: string;
  message: string;
  amount?: number;
}

const DEMO_BRIEF: DailyBriefData = {
  id: '1',
  brief_date: format(new Date(), 'yyyy-MM-dd'),
  executive_summary: 'Your pipeline is healthy with 3 hot leads ready to close. Focus on follow-ups today for maximum impact.',
  priority_decisions: [
    { decision: 'Review pricing proposal for Enterprise client', urgency: 'high', impact: 'high', deadline: 'Today 3pm' },
    { decision: 'Approve marketing budget increase', urgency: 'medium', impact: 'high' },
    { decision: 'Schedule Q1 planning session', urgency: 'low', impact: 'medium' }
  ],
  revenue_alerts: [
    { type: 'opportunity', message: 'Hot lead ready to close', amount: 15000 },
    { type: 'renewal', message: 'Subscription renewal due', amount: 5000 }
  ],
  market_signals: ['Competitor launched new feature', 'Industry trend shifting'],
  pending_approvals: ['Marketing spend', 'New hire request'],
  recommended_focus: 'Revenue-generating activities',
  time_allocation: { 'deep_work': 40, 'meetings': 25, 'admin': 15, 'learning': 20 },
  viewed_at: null,
  acted_on: false
};

export default function DailyBrief() {
  const [brief, setBrief] = useState<DailyBriefData | null>(DEMO_BRIEF);
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const GreetingIcon = hour < 12 ? Coffee : hour < 18 ? Sun : Moon;

  const toggleItem = (idx: number) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(idx)) {
      newCompleted.delete(idx);
    } else {
      newCompleted.add(idx);
    }
    setCompletedItems(newCompleted);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500/10 text-red-500';
      case 'high': return 'bg-orange-500/10 text-orange-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const priorityDecisions = brief?.priority_decisions || [];
  const revenueAlerts = brief?.revenue_alerts || [];
  const timeAllocation = brief?.time_allocation || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Preparing your daily brief...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Greeting Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <GreetingIcon className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">{greeting}</h1>
        </div>
        <p className="text-xl text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Executive Summary */}
      {brief?.executive_summary ? (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <Sparkles className="h-6 w-6 text-primary mt-1" />
              <div>
                <h2 className="font-semibold text-lg mb-2">Today's Focus</h2>
                <p className="text-muted-foreground">{brief.executive_summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <Sparkles className="h-6 w-6 text-primary mt-1" />
              <div>
                <h2 className="font-semibold text-lg mb-2">Welcome to Your Daily Brief</h2>
                <p className="text-muted-foreground">
                  Your personalized intelligence briefing will appear here. As you use the platform, 
                  we'll learn your priorities and generate actionable daily insights.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Focus */}
      {brief?.recommended_focus && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Recommended Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{brief.recommended_focus}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Decisions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Priority Decisions
              {priorityDecisions.length > 0 && (
                <Badge variant="secondary">{priorityDecisions.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priorityDecisions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No urgent decisions today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {priorityDecisions.map((decision, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-3 p-3 rounded-lg bg-muted/50 ${completedItems.has(idx) ? 'opacity-50' : ''}`}
                  >
                    <Checkbox 
                      checked={completedItems.has(idx)}
                      onCheckedChange={() => toggleItem(idx)}
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${completedItems.has(idx) ? 'line-through' : ''}`}>
                        {decision.decision}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getUrgencyColor(decision.urgency)}>
                          {decision.urgency}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {decision.impact} impact
                        </span>
                        {decision.deadline && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {decision.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Revenue Alerts
              {revenueAlerts.length > 0 && (
                <Badge variant="secondary">{revenueAlerts.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <p>No revenue alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {revenueAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Bell className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      {alert.amount && (
                        <p className="text-sm text-green-500 font-medium mt-1">
                          ${alert.amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Allocation */}
      {Object.keys(timeAllocation).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Recommended Time Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(timeAllocation).map(([category, percent]) => (
                <div key={category} className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{percent}%</p>
                  <p className="text-sm text-muted-foreground capitalize">{category.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Target className="h-4 w-4 mr-2" />
              View Pipeline
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Check Approvals
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Revenue Dashboard
            </Button>
            <Button variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Ask AI
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
