import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Crown,
  Users,
  Star,
  Rocket,
  Lock,
  CheckCircle,
  Sparkles,
  Vote,
  FlaskConical,
  Calendar,
  DollarSign,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Json } from '@/integrations/supabase/types';

interface InnerCircleTier {
  id: string;
  tier_name: string;
  max_seats: number;
  current_seats: number;
  annual_fee: number;
  benefits: Json;
  is_invite_only: boolean;
}

interface InnerCircleMember {
  id: string;
  tier_id: string;
  status: string;
  joined_at: string;
  expires_at: string | null;
  roadmap_influence_votes: number;
  experiments_participated: number;
}

interface InnerCircleExperiment {
  id: string;
  experiment_name: string;
  description: string;
  hypothesis: string | null;
  status: string;
  min_participants: number;
  current_participants: number;
  started_at: string | null;
  completed_at: string | null;
}

export default function InnerCircleAccess() {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tiers = [] } = useQuery({
    queryKey: ['inner-circle-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inner_circle_tiers')
        .select('*')
        .order('annual_fee', { ascending: true });
      if (error) throw error;
      return data as InnerCircleTier[];
    }
  });

  const { data: membership } = useQuery({
    queryKey: ['inner-circle-membership', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('inner_circle_members')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();
      if (error) throw error;
      return data as InnerCircleMember | null;
    },
    enabled: !!organization?.id
  });

  const { data: experiments = [] } = useQuery({
    queryKey: ['inner-circle-experiments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inner_circle_experiments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InnerCircleExperiment[];
    }
  });

  const currentTier = tiers.find(t => t.id === membership?.tier_id);
  const isMember = !!membership && membership.status === 'active';

  const getBenefits = (tier: InnerCircleTier): string[] => {
    if (!tier.benefits) return [];
    if (Array.isArray(tier.benefits)) return tier.benefits as string[];
    return [];
  };

  const activeExperiments = experiments.filter(e => e.status === 'active');
  const votingExperiments = experiments.filter(e => e.status === 'voting');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Crown className="h-8 w-8 text-yellow-500" />
          Inner Circle
        </h1>
        <p className="text-muted-foreground mt-1">
          Exclusive access, early features, and roadmap influence
        </p>
      </div>

      {/* Member Status or Join CTA */}
      {isMember && currentTier ? (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/30">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Crown className="h-12 w-12 text-yellow-500" />
                <div>
                  <h2 className="text-2xl font-bold">{currentTier.tier_name}</h2>
                  <p className="text-muted-foreground">Active Member</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{membership.roadmap_influence_votes}</p>
                  <p className="text-xs text-muted-foreground">Votes Remaining</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{membership.experiments_participated}</p>
                  <p className="text-xs text-muted-foreground">Experiments</p>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {membership.expires_at 
                      ? format(new Date(membership.expires_at), 'MMM yyyy')
                      : 'Lifetime'}
                  </p>
                  <p className="text-xs text-muted-foreground">Expires</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-primary/10 to-yellow-500/10 border-primary/20">
          <CardContent className="py-8">
            <div className="text-center max-w-2xl mx-auto">
              <Lock className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Join the Inner Circle</h2>
              <p className="text-muted-foreground mt-2">
                Limited seats. Invite-only. Get early access to features before anyone else, 
                influence the product roadmap, and participate in private experiments.
              </p>
              <Button size="lg" className="mt-6">
                <Crown className="h-4 w-4 mr-2" />
                Request Invite
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map(tier => {
          const benefits = getBenefits(tier);
          const seatsRemaining = tier.max_seats - tier.current_seats;
          const isCurrentTier = tier.id === currentTier?.id;
          
          return (
            <Card 
              key={tier.id} 
              className={`relative ${isCurrentTier ? 'border-yellow-500 ring-2 ring-yellow-500/20' : ''}`}
            >
              {seatsRemaining <= 5 && seatsRemaining > 0 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-red-500 text-white">Only {seatsRemaining} seats left</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <Crown className="h-10 w-10 text-yellow-500 mx-auto" />
                <CardTitle>{tier.tier_name}</CardTitle>
                <CardDescription>
                  {tier.current_seats}/{tier.max_seats} members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-bold">${tier.annual_fee.toLocaleString()}</span>
                  <span className="text-muted-foreground">/year</span>
                </div>

                <Progress 
                  value={(tier.current_seats / tier.max_seats) * 100} 
                  className="h-2"
                />

                <div className="space-y-2">
                  {benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full" 
                  variant={isCurrentTier ? 'outline' : 'default'}
                  disabled={isCurrentTier || seatsRemaining === 0}
                >
                  {isCurrentTier ? 'Current Tier' : 
                   seatsRemaining === 0 ? 'Waitlist' :
                   tier.is_invite_only ? 'Request Invite' : 'Join'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Member-only content */}
      {isMember && (
        <Tabs defaultValue="experiments">
          <TabsList>
            <TabsTrigger value="experiments">Experiments ({experiments.length})</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap Voting</TabsTrigger>
            <TabsTrigger value="benefits">Your Benefits</TabsTrigger>
          </TabsList>

          <TabsContent value="experiments" className="space-y-4">
            {experiments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold">No active experiments</h3>
                  <p className="text-muted-foreground mt-1">New experiments are launched monthly</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {activeExperiments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-green-500" />
                      Active Experiments
                    </h3>
                    {activeExperiments.map(exp => (
                      <Card key={exp.id} className="border-green-500/30">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{exp.experiment_name}</p>
                                <Badge className="bg-green-500/10 text-green-500">Active</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
                              {exp.hypothesis && (
                                <p className="text-sm mt-2">
                                  <span className="text-muted-foreground">Hypothesis:</span> {exp.hypothesis}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {exp.current_participants}/{exp.min_participants} participants
                                </span>
                              </div>
                            </div>
                            <Button>Join Experiment</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {votingExperiments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Vote className="h-4 w-4 text-blue-500" />
                      Vote on Upcoming Experiments
                    </h3>
                    {votingExperiments.map(exp => (
                      <Card key={exp.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{exp.experiment_name}</p>
                              <p className="text-sm text-muted-foreground">{exp.description}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">👎</Button>
                              <Button variant="outline" size="sm">👍</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="roadmap">
            <Card>
              <CardContent className="py-12 text-center">
                <Vote className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold">Roadmap Voting Coming Soon</h3>
                <p className="text-muted-foreground mt-1">
                  You have {membership?.roadmap_influence_votes || 0} votes to allocate
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits">
            {currentTier && (
              <Card>
                <CardHeader>
                  <CardTitle>Your {currentTier.tier_name} Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getBenefits(currentTier).map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Gift className="h-5 w-5 text-primary" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
