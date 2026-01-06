import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Send, ThumbsUp, ThumbsDown, MessageSquare, ExternalLink, Smile, Meh, Frown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface ReputationLog {
  id: string;
  contact_id: string;
  sentiment_score: number;
  chat_history_summary: string;
  review_platform: string;
  review_link: string;
  status: string;
  feedback_text: string;
  created_at: string;
  contacts?: {
    name: string;
    email: string;
  };
}

export function ReviewMagnetDashboard() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['review-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const { data, error } = await supabase.functions.invoke('review-magnet', {
        body: {
          action: 'get_stats',
          organization_id: organization.id
        }
      });
      
      if (error) throw error;
      return data.stats;
    },
    enabled: !!organization?.id
  });

  const { data: pendingReviews } = useQuery({
    queryKey: ['pending-reviews', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase.functions.invoke('review-magnet', {
        body: {
          action: 'get_pending_reviews',
          organization_id: organization.id
        }
      });
      
      if (error) throw error;
      return data.pending as ReputationLog[];
    },
    enabled: !!organization?.id
  });

  const requestReviewMutation = useMutation({
    mutationFn: async ({ logId, platform }: { logId: string; platform: string }) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('review-magnet', {
        body: {
          action: 'request_review',
          organization_id: organization.id,
          log_id: logId,
          platform,
          review_link: `https://g.page/r/${organization.id}/review`
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.message_type === 'public_review') {
        toast.success('Review request sent');
      } else if (data.message_type === 'private_feedback') {
        toast.info('Private feedback request sent');
      } else {
        toast.warning('Alert created for personal outreach');
      }
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review-stats'] });
    }
  });

  const markPostedMutation = useMutation({
    mutationFn: async (logId: string) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('review-magnet', {
        body: {
          action: 'mark_review_posted',
          organization_id: organization.id,
          log_id: logId
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Marked as posted');
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review-stats'] });
    }
  });

  const getSentimentIcon = (score: number) => {
    if (score >= 80) return <Smile className="h-5 w-5 text-green-500" />;
    if (score >= 50) return <Meh className="h-5 w-5 text-yellow-500" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  const getSentimentColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Star className="h-8 w-8 text-primary" />
            Review Magnet
          </h1>
          <p className="text-muted-foreground mt-1">
            Sentiment-gated review requests. Happy customers go public, others go private.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Sentiment</p>
                <p className={`text-2xl font-bold ${getSentimentColor(stats?.avg_sentiment || 0)}`}>
                  {stats?.avg_sentiment || 0}%
                </p>
              </div>
              {getSentimentIcon(stats?.avg_sentiment || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reviews Requested</p>
                <p className="text-2xl font-bold">{stats?.by_status?.review_requested || 0}</p>
              </div>
              <Send className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reviews Posted</p>
                <p className="text-2xl font-bold">{stats?.by_status?.posted || 0}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Feedback Received</p>
                <p className="text-2xl font-bold">{stats?.by_status?.feedback_received || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
          <CardDescription>Customer satisfaction levels across all interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Ecstatic (90-100)', key: 'ecstatic', color: 'bg-green-500' },
              { label: 'Satisfied (70-89)', key: 'satisfied', color: 'bg-blue-500' },
              { label: 'Neutral (50-69)', key: 'neutral', color: 'bg-yellow-500' },
              { label: 'Dissatisfied (30-49)', key: 'dissatisfied', color: 'bg-orange-500' },
              { label: 'Angry (0-29)', key: 'angry', color: 'bg-red-500' }
            ].map(item => {
              const count = stats?.sentiment_distribution?.[item.key] || 0;
              const total = stats?.total_analyzed || 1;
              const percent = (count / total) * 100;

              return (
                <div key={item.key} className="flex items-center gap-4">
                  <span className="w-32 text-sm">{item.label}</span>
                  <Progress value={percent} className="flex-1" />
                  <span className="w-12 text-sm text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Ready for Review Request</CardTitle>
          <CardDescription>
            High-sentiment customers ready to be asked for public reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReviews && pendingReviews.length > 0 ? (
            <div className="space-y-3">
              {pendingReviews.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{(log.contacts as any)?.name || 'Unknown'}</p>
                      <Badge variant="outline" className={getSentimentColor(log.sentiment_score)}>
                        {log.sentiment_score}% sentiment
                      </Badge>
                      <Badge variant="secondary">{log.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{(log.contacts as any)?.email}</p>
                    {log.chat_history_summary && (
                      <p className="text-sm mt-1 line-clamp-1">{log.chat_history_summary}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {log.status === 'analyzed' && (
                      <>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => requestReviewMutation.mutate({ logId: log.id, platform: 'google' })}
                          disabled={requestReviewMutation.isPending}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Request Review
                        </Button>
                      </>
                    )}
                    {log.status === 'review_requested' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => markPostedMutation.mutate(log.id)}
                        disabled={markPostedMutation.isPending}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Mark Posted
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No customers ready for review requests yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
