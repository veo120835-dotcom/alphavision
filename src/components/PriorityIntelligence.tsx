import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap,
  Rocket,
  Crown,
  Clock,
  Cpu,
  Target,
  Shield,
  CheckCircle,
  Star,
  TrendingUp,
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { Json } from '@/integrations/supabase/types';

interface PriorityTier {
  id: string;
  tier_name: string;
  tier_level: number;
  response_sla_seconds: number;
  max_simulations: number;
  red_team_enabled: boolean;
  compute_multiplier: number;
  monthly_price: number;
  features: Json;
}

interface OrgPriority {
  id: string;
  tier_id: string;
  activated_at: string;
  expires_at: string | null;
  status: string;
  tier?: PriorityTier;
}

const tierIcons: Record<number, React.ElementType> = {
  1: Clock,
  2: Zap,
  3: Crown
};

const tierColors: Record<number, string> = {
  1: 'text-muted-foreground',
  2: 'text-blue-500',
  3: 'text-yellow-500'
};

export default function PriorityIntelligence() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['priority-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('priority_tiers')
        .select('*')
        .order('tier_level', { ascending: true });
      if (error) throw error;
      return data as PriorityTier[];
    }
  });

  const { data: currentPriority } = useQuery({
    queryKey: ['org-priority', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('organization_priority')
        .select('*, priority_tiers(*)')
        .eq('organization_id', organization.id)
        .maybeSingle();
      if (error) throw error;
      return data as OrgPriority | null;
    },
    enabled: !!organization?.id
  });

  const upgradeTierMutation = useMutation({
    mutationFn: async (tierId: string) => {
      if (!organization?.id) throw new Error('No organization');
      
      // Upsert the priority
      const { error } = await supabase
        .from('organization_priority')
        .upsert({
          organization_id: organization.id,
          tier_id: tierId,
          status: 'active',
          activated_at: new Date().toISOString()
        }, { onConflict: 'organization_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-priority'] });
      toast.success('Priority tier upgraded!');
    }
  });

  const currentTier = tiers.find(t => t.id === currentPriority?.tier_id) || tiers[0];
  const currentLevel = currentTier?.tier_level || 1;

  const getFeatures = (tier: PriorityTier): string[] => {
    if (!tier.features) return [];
    if (Array.isArray(tier.features)) return tier.features as string[];
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          Priority Intelligence
        </h1>
        <p className="text-muted-foreground mt-1">
          Faster responses, more compute, deeper analysis
        </p>
      </div>

      {/* Current Status */}
      {currentTier && (
        <Card className={`bg-gradient-to-r ${
          currentLevel === 3 ? 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/30' :
          currentLevel === 2 ? 'from-blue-500/10 to-blue-500/5 border-blue-500/30' :
          'from-muted/50 to-muted/30'
        }`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentLevel === 3 ? (
                  <Crown className="h-12 w-12 text-yellow-500" />
                ) : currentLevel === 2 ? (
                  <Zap className="h-12 w-12 text-blue-500" />
                ) : (
                  <Clock className="h-12 w-12 text-muted-foreground" />
                )}
                <div>
                  <h2 className="text-2xl font-bold">{currentTier.tier_name}</h2>
                  <p className="text-muted-foreground">Your current priority tier</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary">{currentTier.response_sla_seconds}s</p>
                  <p className="text-xs text-muted-foreground">Response SLA</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">{currentTier.max_simulations}</p>
                  <p className="text-xs text-muted-foreground">Max Simulations</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">{currentTier.compute_multiplier}x</p>
                  <p className="text-xs text-muted-foreground">Compute Power</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tier Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map(tier => {
          const Icon = tierIcons[tier.tier_level] || Clock;
          const isCurrentTier = tier.id === currentTier?.id;
          const features = getFeatures(tier);
          
          return (
            <Card 
              key={tier.id} 
              className={`relative ${isCurrentTier ? 'border-primary ring-2 ring-primary/20' : ''} ${
                tier.tier_level === 3 ? 'bg-gradient-to-b from-yellow-500/5 to-transparent' : ''
              }`}
            >
              {tier.tier_level === 3 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-yellow-500 text-yellow-950">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <Icon className={`h-10 w-10 mx-auto ${tierColors[tier.tier_level]}`} />
                <CardTitle className="text-xl">{tier.tier_name}</CardTitle>
                <CardDescription>
                  {tier.tier_level === 1 && 'Get started with AI assistance'}
                  {tier.tier_level === 2 && 'For serious operators'}
                  {tier.tier_level === 3 && 'Maximum intelligence power'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-bold">
                    ${tier.monthly_price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Response SLA</span>
                    <span className="font-medium">{tier.response_sla_seconds}s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Simulations</span>
                    <span className="font-medium">{tier.max_simulations}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Compute Power</span>
                    <span className="font-medium">{tier.compute_multiplier}x</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Red-Team Analysis</span>
                    {tier.red_team_enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                {features.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  className="w-full" 
                  variant={isCurrentTier ? 'outline' : 'default'}
                  disabled={isCurrentTier || tier.tier_level < currentLevel}
                  onClick={() => upgradeTierMutation.mutate(tier.id)}
                >
                  {isCurrentTier ? 'Current Plan' : 
                   tier.tier_level < currentLevel ? 'Downgrade' : 
                   'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Benefits Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Why Priority Intelligence?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Gauge className="h-6 w-6 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium">Time Arbitrage</h4>
                <p className="text-sm text-muted-foreground">
                  Get answers in seconds, not minutes. Speed compounds over thousands of decisions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Cpu className="h-6 w-6 text-purple-500 mt-1" />
              <div>
                <h4 className="font-medium">Deeper Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  More simulations = better predictions. Test scenarios that would take days manually.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-green-500 mt-1" />
              <div>
                <h4 className="font-medium">Red-Team Protection</h4>
                <p className="text-sm text-muted-foreground">
                  Every decision stress-tested against adversarial scenarios before execution.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
