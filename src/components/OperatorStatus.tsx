import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Award,
  Trophy,
  Star,
  TrendingUp,
  Shield,
  CheckCircle,
  Target,
  BarChart3,
  Medal,
  Crown,
  Zap,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { Json } from '@/integrations/supabase/types';

interface OperatorProfile {
  id: string;
  maturity_level: string;
  maturity_score: number | null;
  operator_grade: string;
  execution_credibility_score: number | null;
  revenue_percentile: number | null;
  decision_quality_score: number | null;
  total_verified_revenue: number | null;
  verified_wins: Json;
  badges: Json;
  public_profile_enabled: boolean;
  profile_visibility: string;
  last_assessment_at: string | null;
}

interface Assessment {
  id: string;
  assessment_period_start: string;
  assessment_period_end: string;
  previous_grade: string | null;
  new_grade: string;
  grade_change_reason: string | null;
  recommendations: Json;
  assessed_at: string;
}

const maturityLevels = ['emerging', 'developing', 'established', 'advanced', 'elite'];
const gradeColors: Record<string, string> = {
  'A+': 'text-purple-500',
  'A': 'text-green-500',
  'B': 'text-blue-500',
  'C': 'text-yellow-500',
  'D': 'text-orange-500',
  'F': 'text-red-500'
};

const levelIcons: Record<string, React.ElementType> = {
  emerging: Star,
  developing: TrendingUp,
  established: Shield,
  advanced: Award,
  elite: Crown
};

export default function OperatorStatus() {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['operator-profile', organization?.id, user?.id],
    queryFn: async () => {
      if (!organization?.id || !user?.id) return null;
      const { data, error } = await supabase
        .from('operator_profiles')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as OperatorProfile | null;
    },
    enabled: !!organization?.id && !!user?.id
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['status-assessments', organization?.id],
    queryFn: async () => {
      if (!organization?.id || !profile?.id) return [];
      const { data, error } = await supabase
        .from('status_assessments')
        .select('*')
        .eq('profile_id', profile.id)
        .order('assessed_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Assessment[];
    },
    enabled: !!organization?.id && !!profile?.id
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!profile?.id) throw new Error('No profile');
      const { error } = await supabase
        .from('operator_profiles')
        .update({ 
          public_profile_enabled: enabled,
          profile_visibility: enabled ? 'public' : 'private'
        })
        .eq('id', profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator-profile'] });
      toast.success('Visibility updated');
    }
  });

  const getBadges = (): Array<{badge: string; earned_at: string; criteria?: string}> => {
    if (!profile?.badges) return [];
    if (Array.isArray(profile.badges)) return profile.badges as Array<{badge: string; earned_at: string; criteria?: string}>;
    return [];
  };

  const getVerifiedWins = (): Array<{achievement: string; date: string; proof?: string}> => {
    if (!profile?.verified_wins) return [];
    if (Array.isArray(profile.verified_wins)) return profile.verified_wins as Array<{achievement: string; date: string; proof?: string}>;
    return [];
  };

  const getRecommendations = (assessment: Assessment): string[] => {
    if (!assessment.recommendations) return [];
    if (Array.isArray(assessment.recommendations)) return assessment.recommendations as string[];
    return [];
  };

  const currentLevelIndex = maturityLevels.indexOf(profile?.maturity_level || 'emerging');
  const progressToNext = profile?.maturity_score ? (profile.maturity_score % 20) * 5 : 0;
  const LevelIcon = levelIcons[profile?.maturity_level || 'emerging'];
  const badges = getBadges();
  const verifiedWins = getVerifiedWins();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Operator Status
          </h1>
          <p className="text-muted-foreground mt-1">
            Your economic status signaling and credibility scores
          </p>
        </div>
        {profile && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Public Profile</span>
            <Switch
              checked={profile.public_profile_enabled}
              onCheckedChange={enabled => toggleVisibilityMutation.mutate(enabled)}
            />
          </div>
        )}
      </div>

      {!profile ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Profile Not Yet Created</h3>
            <p className="text-muted-foreground mt-2">
              Your operator profile will be created as you use the platform
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Status Card */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Grade Circle */}
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${gradeColors[profile.operator_grade]} border-current`}>
                      <span className="text-4xl font-bold">{profile.operator_grade}</span>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-background border shadow-sm">Operator Grade</Badge>
                    </div>
                  </div>

                  {/* Maturity Level */}
                  <div>
                    <div className="flex items-center gap-2">
                      <LevelIcon className="h-6 w-6 text-primary" />
                      <span className="text-2xl font-bold capitalize">{profile.maturity_level}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Revenue Maturity Level</p>
                    
                    {/* Level Progress */}
                    <div className="mt-4 w-64">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress to next level</span>
                        <span>{progressToNext}%</span>
                      </div>
                      <Progress value={progressToNext} />
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-2xl font-bold">{profile.maturity_score || 0}</p>
                    <p className="text-xs text-muted-foreground">Maturity Score</p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-2xl font-bold">{profile.execution_credibility_score || 0}</p>
                    <p className="text-xs text-muted-foreground">Credibility</p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-2xl font-bold">{profile.decision_quality_score || 0}%</p>
                    <p className="text-xs text-muted-foreground">Decision Quality</p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-2xl font-bold">
                      {profile.revenue_percentile ? `Top ${100 - profile.revenue_percentile}%` : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">Revenue Rank</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verified Revenue */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Verified Revenue</p>
                    <p className="text-3xl font-bold text-green-500">
                      ${(profile.total_verified_revenue || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Verified
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="badges">
            <TabsList>
              <TabsTrigger value="badges">Badges ({badges.length})</TabsTrigger>
              <TabsTrigger value="wins">Verified Wins ({verifiedWins.length})</TabsTrigger>
              <TabsTrigger value="history">Assessment History</TabsTrigger>
            </TabsList>

            <TabsContent value="badges" className="space-y-4">
              {badges.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Medal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold">No badges yet</h3>
                    <p className="text-muted-foreground mt-1">Earn badges by hitting milestones</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {badges.map((badge, idx) => (
                    <Card key={idx}>
                      <CardContent className="py-6 text-center">
                        <Medal className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                        <p className="font-semibold">{badge.badge}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(badge.earned_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="wins" className="space-y-4">
              {verifiedWins.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold">No verified wins yet</h3>
                    <p className="text-muted-foreground mt-1">Document your wins to build credibility</p>
                  </CardContent>
                </Card>
              ) : (
                verifiedWins.map((win, idx) => (
                  <Card key={idx}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">{win.achievement}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(win.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {assessments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold">No assessments yet</h3>
                    <p className="text-muted-foreground mt-1">Regular assessments will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                assessments.map(assessment => (
                  <Card key={assessment.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            Assessment: {new Date(assessment.assessment_period_start).toLocaleDateString()} - {new Date(assessment.assessment_period_end).toLocaleDateString()}
                          </p>
                          {assessment.grade_change_reason && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {assessment.grade_change_reason}
                            </p>
                          )}
                          {getRecommendations(assessment).length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">Recommendations:</p>
                              <ul className="text-sm mt-1">
                                {getRecommendations(assessment).slice(0, 3).map((rec, idx) => (
                                  <li key={idx} className="flex items-center gap-1">
                                    <Zap className="h-3 w-3 text-primary" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {assessment.previous_grade && (
                              <>
                                <span className={`text-lg ${gradeColors[assessment.previous_grade]}`}>
                                  {assessment.previous_grade}
                                </span>
                                <span className="text-muted-foreground">→</span>
                              </>
                            )}
                            <span className={`text-xl font-bold ${gradeColors[assessment.new_grade]}`}>
                              {assessment.new_grade}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(assessment.assessed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
