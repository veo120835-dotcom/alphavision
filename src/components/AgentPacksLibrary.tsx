import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Home,
  Megaphone,
  Zap,
  Users,
  ShoppingCart,
  Rocket,
  CheckCircle,
  Clock,
  Star,
  Brain,
  MessageSquare,
  Workflow,
  Globe,
  TrendingUp,
  Loader2
} from 'lucide-react';

interface AgentPack {
  id: string;
  name: string;
  slug: string;
  niche: string;
  description: string;
  icon: string;
  popularity: number;
  is_featured: boolean;
  pricing_tiers: any[];
  setup_time_minutes: number;
  tags: string[];
  metadata: any;
}

interface AgentBehavior {
  id: string;
  agent_name: string;
  agent_type: string;
  goal: string;
  personality: string;
  tone: string;
}

const nicheIcons: Record<string, React.ComponentType<any>> = {
  real_estate: Home,
  marketing_agency: Megaphone,
  saas: Zap,
  coaching: Users,
  ecommerce: ShoppingCart
};

const nicheColors: Record<string, string> = {
  real_estate: 'from-blue-500 to-cyan-500',
  marketing_agency: 'from-orange-500 to-red-500',
  saas: 'from-green-500 to-emerald-500',
  coaching: 'from-amber-500 to-yellow-500',
  ecommerce: 'from-rose-500 to-pink-500'
};

export function AgentPacksLibrary() {
  const [selectedPack, setSelectedPack] = useState<AgentPack | null>(null);
  const [activeNiche, setActiveNiche] = useState<string>('all');
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const queryClient = useQueryClient();

  const { data: packs, isLoading } = useQuery({
    queryKey: ['agent-packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('niche_agent_packs')
        .select('*')
        .order('popularity', { ascending: false });

      if (error) throw error;
      return data as AgentPack[];
    }
  });

  const { data: packDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['pack-details', selectedPack?.id],
    queryFn: async () => {
      if (!selectedPack) return null;

      const [behaviors, templates, workflows] = await Promise.all([
        supabase.from('agent_behaviors').select('*').eq('pack_id', selectedPack.id),
        supabase.from('platform_templates').select('*').eq('pack_id', selectedPack.id),
        supabase.from('workflow_templates').select('*').eq('pack_id', selectedPack.id)
      ]);

      return {
        behaviors: behaviors.data || [],
        templates: templates.data || [],
        workflows: workflows.data || []
      };
    },
    enabled: !!selectedPack
  });

  const { data: deployments } = useQuery({
    queryKey: ['pack-deployments'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data: membership } = await supabase
        .from('memberships')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .single();

      if (!membership) return [];

      const { data } = await supabase
        .from('template_deployments')
        .select('pack_id')
        .eq('organization_id', membership.organization_id);

      return data?.map(d => d.pack_id) || [];
    }
  });

  const deployMutation = useMutation({
    mutationFn: async (pack: AgentPack) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: membership } = await supabase
        .from('memberships')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .single();

      if (!membership) throw new Error('No organization found');

      setDeploymentProgress(10);

      const response = await supabase.functions.invoke('provision-workspace', {
        body: {
          organization_id: membership.organization_id,
          pack_id: pack.id,
          pack_slug: pack.slug
        }
      });

      setDeploymentProgress(100);

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data, pack) => {
      toast.success(`${pack.name} deployed successfully!`, {
        description: 'Your AI-operated business system is ready to use'
      });
      queryClient.invalidateQueries({ queryKey: ['pack-deployments'] });
      setDeploymentProgress(0);
      setSelectedPack(null);
    },
    onError: (error: any) => {
      toast.error(`Deployment failed: ${error.message}`);
      setDeploymentProgress(0);
    }
  });

  const isPackDeployed = (packId: string) => {
    return deployments?.includes(packId);
  };

  const niches = ['all', ...new Set(packs?.map(p => p.niche) || [])];

  const filteredPacks = activeNiche === 'all'
    ? packs
    : packs?.filter(p => p.niche === activeNiche);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agent Packs</h1>
          <p className="text-muted-foreground mt-1">
            Complete AI-operated business systems. Deploy in under 15 minutes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            {deployments?.length || 0} Deployed
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Brain className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Agents Included</p>
                <p className="text-2xl font-bold">2-3 per pack</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MessageSquare className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Channels Supported</p>
                <p className="text-2xl font-bold">SMS, Email, Chat</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Setup Time</p>
                <p className="text-2xl font-bold">10-15 min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeNiche} onValueChange={setActiveNiche}>
        <TabsList>
          {niches.map(niche => (
            <TabsTrigger key={niche} value={niche} className="capitalize">
              {niche === 'all' ? 'All Packs' : niche.replace('_', ' ')}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeNiche} className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPacks?.map(pack => {
              const Icon = nicheIcons[pack.niche] || Rocket;
              const isDeployed = isPackDeployed(pack.id);

              return (
                <Card
                  key={pack.id}
                  className="relative overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => setSelectedPack(pack)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${nicheColors[pack.niche] || 'from-gray-500 to-gray-700'} opacity-0 group-hover:opacity-5 transition-opacity`} />

                  {pack.is_featured && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  )}

                  {isDeployed && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${nicheColors[pack.niche]} flex items-center justify-center mb-4`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{pack.name}</CardTitle>
                    <CardDescription className="line-clamp-3 min-h-[3.6rem]">
                      {pack.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{pack.setup_time_minutes} min setup</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>{pack.popularity} deploys</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {pack.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      className="w-full"
                      variant={isDeployed ? "outline" : "default"}
                      disabled={isDeployed}
                    >
                      {isDeployed ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Already Deployed
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4 mr-2" />
                          Deploy Pack
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedPack} onOpenChange={() => setSelectedPack(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center gap-4">
              {selectedPack && (() => {
                const Icon = nicheIcons[selectedPack.niche] || Rocket;
                return (
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${nicheColors[selectedPack.niche]} flex items-center justify-center`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                );
              })()}
              <div>
                <DialogTitle className="text-2xl">{selectedPack?.name}</DialogTitle>
                <DialogDescription>{selectedPack?.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deploymentProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Deploying your AI business system...</span>
                <span className="font-medium">{deploymentProgress}%</span>
              </div>
              <Progress value={deploymentProgress} />
            </div>
          )}

          <ScrollArea className="max-h-[60vh] pr-4">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-500" />
                    AI Agents Included ({packDetails?.behaviors?.length || 0})
                  </h4>
                  <div className="space-y-3">
                    {packDetails?.behaviors?.map((behavior: AgentBehavior) => (
                      <Card key={behavior.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium">{behavior.agent_name}</h5>
                              <p className="text-sm text-muted-foreground mt-1">{behavior.goal}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {behavior.personality}
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {behavior.agent_type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-500" />
                    Website & Funnel Templates ({packDetails?.templates?.length || 0})
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {packDetails?.templates?.map((template: any) => (
                      <Card key={template.id}>
                        <CardContent className="p-3">
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 capitalize">
                            {template.template_type.replace('_', ' ')}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-orange-500" />
                    AI-Powered Workflows ({packDetails?.workflows?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {packDetails?.workflows?.map((workflow: any) => (
                      <Card key={workflow.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{workflow.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{workflow.description}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {workflow.category.replace('_', ' ')}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {selectedPack?.pricing_tiers && selectedPack.pricing_tiers.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Recommended Pricing Tiers</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedPack.pricing_tiers.map((tier: any, index: number) => (
                        <Card key={index}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{tier.name}</p>
                              <p className="text-sm text-muted-foreground">{tier.description}</p>
                            </div>
                            <p className="text-xl font-bold">${tier.price}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setSelectedPack(null)}>
              Close
            </Button>
            <Button
              onClick={() => selectedPack && deployMutation.mutate(selectedPack)}
              disabled={deployMutation.isPending || isPackDeployed(selectedPack?.id || '')}
              className="min-w-[140px]"
            >
              {deployMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : isPackDeployed(selectedPack?.id || '') ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Deployed
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy Pack
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AgentPacksLibrary;
