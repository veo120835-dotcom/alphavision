import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users,
  Crown,
  DollarSign,
  TrendingUp,
  Briefcase,
  FileText,
  AlertTriangle,
  Lightbulb,
  Clock,
  CheckCircle,
  Send,
  Bot,
  Eye,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Json } from '@/integrations/supabase/types';

interface ExecutiveShadow {
  id: string;
  shadow_role: string;
  is_active: boolean;
  monthly_fee: number;
  capabilities: Json;
  decision_authority_level: string;
  last_briefing_at: string | null;
  total_decisions_prepared: number;
  total_risks_flagged: number;
}

interface ExecutiveBriefing {
  id: string;
  shadow_id: string;
  briefing_type: string;
  title: string;
  executive_summary: string;
  key_decisions: Json;
  risks_identified: Json;
  opportunities: Json;
  recommended_actions: Json;
  board_memo: string | null;
  status: string;
  created_at: string;
  delivered_at: string | null;
}

const roleConfig: Record<string, { icon: React.ElementType; title: string; description: string; color: string; price: number }> = {
  shadow_ceo: {
    icon: Crown,
    title: 'Shadow CEO',
    description: 'Strategic decisions, vision alignment, board-level preparation',
    color: 'text-purple-500',
    price: 15000
  },
  shadow_cfo: {
    icon: DollarSign,
    title: 'Shadow CFO',
    description: 'Financial strategy, runway optimization, capital allocation',
    color: 'text-green-500',
    price: 12000
  },
  shadow_cro: {
    icon: TrendingUp,
    title: 'Shadow CRO',
    description: 'Revenue strategy, pricing, go-to-market, sales optimization',
    color: 'text-blue-500',
    price: 10000
  },
  shadow_coo: {
    icon: Briefcase,
    title: 'Shadow COO',
    description: 'Operations, efficiency, systems, team management',
    color: 'text-orange-500',
    price: 10000
  }
};

export default function ExecutiveShadowMode() {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBriefing, setSelectedBriefing] = useState<ExecutiveBriefing | null>(null);

  const { data: shadows = [], isLoading } = useQuery({
    queryKey: ['executive-shadows', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('executive_shadows')
        .select('*')
        .eq('organization_id', organization.id);
      if (error) throw error;
      return data as ExecutiveShadow[];
    },
    enabled: !!organization?.id
  });

  const { data: briefings = [] } = useQuery({
    queryKey: ['executive-briefings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('executive_briefings')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as ExecutiveBriefing[];
    },
    enabled: !!organization?.id
  });

  const activateShadowMutation = useMutation({
    mutationFn: async (role: string) => {
      if (!organization?.id) throw new Error('No organization');
      const config = roleConfig[role];
      const { error } = await supabase.from('executive_shadows').insert({
        organization_id: organization.id,
        shadow_role: role,
        monthly_fee: config.price,
        capabilities: [],
        decision_authority_level: 'prepare'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executive-shadows'] });
      toast.success('Executive shadow activated');
    }
  });

  const activeShadows = shadows.filter(s => s.is_active);
  const totalMonthlyFees = activeShadows.reduce((sum, s) => sum + s.monthly_fee, 0);
  const totalDecisions = shadows.reduce((sum, s) => sum + s.total_decisions_prepared, 0);
  const totalRisks = shadows.reduce((sum, s) => sum + s.total_risks_flagged, 0);

  const getKeyDecisions = (briefing: ExecutiveBriefing): string[] => {
    if (!briefing.key_decisions) return [];
    if (Array.isArray(briefing.key_decisions)) return briefing.key_decisions as string[];
    return [];
  };

  const getRisks = (briefing: ExecutiveBriefing): string[] => {
    if (!briefing.risks_identified) return [];
    if (Array.isArray(briefing.risks_identified)) return briefing.risks_identified as string[];
    return [];
  };

  const getOpportunities = (briefing: ExecutiveBriefing): string[] => {
    if (!briefing.opportunities) return [];
    if (Array.isArray(briefing.opportunities)) return briefing.opportunities as string[];
    return [];
  };

  const getActions = (briefing: ExecutiveBriefing): string[] => {
    if (!briefing.recommended_actions) return [];
    if (Array.isArray(briefing.recommended_actions)) return briefing.recommended_actions as string[];
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Executive Shadow Mode
        </h1>
        <p className="text-muted-foreground mt-1">
          AI executives that prepare decisions, flag risks, and draft board-level memos
        </p>
      </div>

      {/* Value Prop */}
      <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <Bot className="h-12 w-12 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Your 24/7 Executive Team</h2>
              <p className="text-muted-foreground">
                Human executives cost $20k-$100k/month. Shadow executives work continuously, 
                prepare decisions before you ask, and catch risks you'd miss.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Shadows</p>
                <p className="text-2xl font-bold">{activeShadows.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Investment</p>
                <p className="text-2xl font-bold">${totalMonthlyFees.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Decisions Prepared</p>
                <p className="text-2xl font-bold">{totalDecisions}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risks Flagged</p>
                <p className="text-2xl font-bold text-orange-500">{totalRisks}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="shadows">
        <TabsList>
          <TabsTrigger value="shadows">Shadow Executives</TabsTrigger>
          <TabsTrigger value="briefings">Briefings ({briefings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="shadows">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(roleConfig).map(([role, config]) => {
              const Icon = config.icon;
              const shadow = shadows.find(s => s.shadow_role === role);
              const isActive = shadow?.is_active;
              
              return (
                <Card key={role} className={isActive ? 'border-primary ring-2 ring-primary/20' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-8 w-8 ${config.color}`} />
                        <div>
                          <CardTitle>{config.title}</CardTitle>
                          <CardDescription>{config.description}</CardDescription>
                        </div>
                      </div>
                      {isActive && (
                        <Badge className="bg-green-500/10 text-green-500">Active</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">${config.price.toLocaleString()}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      
                      {shadow && (
                        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">Decisions Prepared</p>
                            <p className="font-bold">{shadow.total_decisions_prepared}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Risks Flagged</p>
                            <p className="font-bold">{shadow.total_risks_flagged}</p>
                          </div>
                        </div>
                      )}

                      <Button 
                        className="w-full" 
                        variant={isActive ? 'outline' : 'default'}
                        disabled={isActive}
                        onClick={() => activateShadowMutation.mutate(role)}
                      >
                        {isActive ? 'Currently Active' : 'Activate Shadow'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="briefings" className="space-y-4">
          {briefings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No briefings yet</h3>
                <p className="text-muted-foreground mt-1">Activate shadow executives to receive briefings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Briefing List */}
              <div className="space-y-4">
                {briefings.map(briefing => (
                  <Card 
                    key={briefing.id} 
                    className={`cursor-pointer transition-colors ${selectedBriefing?.id === briefing.id ? 'border-primary' : 'hover:border-primary/50'}`}
                    onClick={() => setSelectedBriefing(briefing)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {briefing.briefing_type}
                            </Badge>
                            <Badge className={
                              briefing.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                              briefing.status === 'ready' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-muted text-muted-foreground'
                            }>{briefing.status}</Badge>
                          </div>
                          <p className="font-medium mt-2">{briefing.title}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {briefing.executive_summary}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        {format(new Date(briefing.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Briefing Detail */}
              {selectedBriefing ? (
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>{selectedBriefing.title}</CardTitle>
                    <CardDescription>
                      {format(new Date(selectedBriefing.created_at), 'MMMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2 mb-2">
                            <Eye className="h-4 w-4" />
                            Executive Summary
                          </h4>
                          <p className="text-muted-foreground">{selectedBriefing.executive_summary}</p>
                        </div>

                        {getKeyDecisions(selectedBriefing).length > 0 && (
                          <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2">
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                              Key Decisions Required
                            </h4>
                            <ul className="space-y-2">
                              {getKeyDecisions(selectedBriefing).map((decision, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs flex-shrink-0">
                                    {idx + 1}
                                  </span>
                                  {decision}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {getRisks(selectedBriefing).length > 0 && (
                          <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              Risks Identified
                            </h4>
                            <ul className="space-y-2">
                              {getRisks(selectedBriefing).map((risk, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-orange-600">
                                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                  {risk}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {getOpportunities(selectedBriefing).length > 0 && (
                          <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-yellow-500" />
                              Opportunities
                            </h4>
                            <ul className="space-y-2">
                              {getOpportunities(selectedBriefing).map((opp, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                  {opp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {getActions(selectedBriefing).length > 0 && (
                          <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              Recommended Actions
                            </h4>
                            <ul className="space-y-2">
                              {getActions(selectedBriefing).map((action, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedBriefing.board_memo && (
                          <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4" />
                              Board Memo
                            </h4>
                            <div className="p-4 bg-muted/50 rounded-lg text-sm">
                              {selectedBriefing.board_memo}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a briefing to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
