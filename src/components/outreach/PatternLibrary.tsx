import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  Mail,
  MessageSquare,
  Eye,
  Target,
} from "lucide-react";

interface PatternPerformance {
  id: string;
  dominant_pattern: string;
  primary_constraint: string | null;
  emails_sent: number;
  emails_opened: number;
  emails_replied: number;
  reply_rate: number;
}

export function PatternLibrary() {
  const { organization } = useOrganization();

  const { data: patterns, isLoading } = useQuery({
    queryKey: ['pattern-performance', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('pattern_performance')
        .select('*')
        .eq('organization_id', organization.id)
        .order('emails_replied', { ascending: false });
      if (error) throw error;
      return data as PatternPerformance[];
    },
    enabled: !!organization?.id,
  });

  // Calculate totals
  const totals = patterns?.reduce(
    (acc, p) => ({
      sent: acc.sent + p.emails_sent,
      opened: acc.opened + p.emails_opened,
      replied: acc.replied + p.emails_replied,
    }),
    { sent: 0, opened: 0, replied: 0 }
  ) || { sent: 0, opened: 0, replied: 0 };

  const avgReplyRate = totals.sent > 0 ? (totals.replied / totals.sent) * 100 : 0;
  const avgOpenRate = totals.sent > 0 ? (totals.opened / totals.sent) * 100 : 0;

  const getConstraintColor = (constraint: string | null) => {
    const colors: Record<string, string> = {
      positioning: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      pricing: 'bg-green-500/10 text-green-500 border-green-500/20',
      offer: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      sales: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      authority: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      systems: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };
    return colors[constraint || ''] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          Pattern Library
        </h1>
        <p className="text-muted-foreground mt-1">
          Track which business patterns get the best email response rates
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-3xl font-bold">{totals.sent}</p>
              </div>
              <Mail className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Rate</p>
                <p className="text-3xl font-bold">{avgOpenRate.toFixed(1)}%</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reply Rate</p>
                <p className="text-3xl font-bold text-green-500">{avgReplyRate.toFixed(1)}%</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Patterns Tracked</p>
                <p className="text-3xl font-bold">{patterns?.length || 0}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pattern Performance List */}
      <Card>
        <CardHeader>
          <CardTitle>Pattern Performance</CardTitle>
          <CardDescription>
            Patterns sorted by reply rate - use winning patterns to improve your outreach
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !patterns || patterns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No pattern data yet</p>
              <p className="text-sm mt-1">
                Start analyzing websites and sending emails to track performance
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {patterns.map((pattern, index) => {
                  const replyRate = pattern.emails_sent > 0 
                    ? (pattern.emails_replied / pattern.emails_sent) * 100 
                    : 0;
                  const openRate = pattern.emails_sent > 0
                    ? (pattern.emails_opened / pattern.emails_sent) * 100
                    : 0;

                  return (
                    <div
                      key={pattern.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {index < 3 && (
                              <Badge variant="default" className="bg-green-500">
                                Top {index + 1}
                              </Badge>
                            )}
                            <Badge className={getConstraintColor(pattern.primary_constraint)}>
                              {pattern.primary_constraint || 'Unknown'}
                            </Badge>
                          </div>
                          <p className="font-medium text-lg">
                            {pattern.dominant_pattern}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-green-500">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-2xl font-bold">
                              {replyRate.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">reply rate</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Sent</span>
                            <span className="font-medium">{pattern.emails_sent}</span>
                          </div>
                          <Progress value={100} className="h-1" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Opened</span>
                            <span className="font-medium">{pattern.emails_opened}</span>
                          </div>
                          <Progress 
                            value={openRate} 
                            className="h-1"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Replied</span>
                            <span className="font-medium text-green-500">{pattern.emails_replied}</span>
                          </div>
                          <Progress 
                            value={replyRate} 
                            className="h-1 [&>div]:bg-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}