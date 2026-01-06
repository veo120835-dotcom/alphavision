import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Brain, Zap, TrendingUp, Users, RefreshCw, Crown, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export function HiveMindDashboard() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  const { data: wisdom, isLoading: wisdomLoading } = useQuery({
    queryKey: ['global-wisdom', selectedIndustry],
    queryFn: async () => {
      let query = supabase
        .from('global_niche_wisdom')
        .select('*')
        .order('confidence_score', { ascending: false })
        .limit(50);

      if (selectedIndustry !== 'all') {
        query = query.eq('industry_type', selectedIndustry);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: handlers, isLoading: handlersLoading } = useQuery({
    queryKey: ['objection-handlers', selectedIndustry],
    queryFn: async () => {
      let query = supabase
        .from('objection_handlers')
        .select('*')
        .order('conversion_count', { ascending: false })
        .limit(30);

      if (selectedIndustry !== 'all') {
        query = query.eq('industry_type', selectedIndustry);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: industries } = useQuery({
    queryKey: ['industries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_niche_wisdom')
        .select('industry_type')
        .limit(100);

      if (error) throw error;
      const unique = [...new Set(data?.map(d => d.industry_type))];
      return unique;
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('hive-mind-learner', {
        body: { action: 'analyze_wins' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Analyzed ${data.industries_analyzed} industries, extracted ${data.patterns_extracted} patterns`);
      queryClient.invalidateQueries({ queryKey: ['global-wisdom'] });
    },
    onError: (error) => {
      toast.error('Failed to analyze: ' + error.message);
    }
  });

  const promoteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('hive-mind-learner', {
        body: { action: 'promote_handlers' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Promoted ${data.promoted_count} handlers to master status`);
      queryClient.invalidateQueries({ queryKey: ['objection-handlers'] });
    }
  });

  const masterCount = handlers?.filter(h => h.is_master).length || 0;
  const totalUsage = handlers?.reduce((sum, h) => sum + (h.usage_count || 0), 0) || 0;
  const avgConversion = handlers?.length 
    ? handlers.reduce((sum, h) => sum + (h.usage_count > 0 ? (h.conversion_count / h.usage_count) * 100 : 0), 0) / handlers.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Hive Mind
          </h1>
          <p className="text-muted-foreground mt-1">
            Federated learning across organizations. Every win makes everyone smarter.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => promoteMutation.mutate()}
            disabled={promoteMutation.isPending}
          >
            <Crown className="h-4 w-4 mr-2" />
            Promote Masters
          </Button>
          <Button 
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} />
            Analyze Wins
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patterns</p>
                <p className="text-2xl font-bold">{wisdom?.length || 0}</p>
              </div>
              <Sparkles className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Master Handlers</p>
                <p className="text-2xl font-bold">{masterCount}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">{totalUsage.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Conversion</p>
                <p className="text-2xl font-bold">{avgConversion.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Industry Filter */}
      <div className="flex gap-2 flex-wrap">
        <Badge 
          variant={selectedIndustry === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedIndustry('all')}
        >
          All Industries
        </Badge>
        {industries?.map(industry => (
          <Badge 
            key={industry}
            variant={selectedIndustry === industry ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedIndustry(industry)}
          >
            {industry}
          </Badge>
        ))}
      </div>

      <Tabs defaultValue="wisdom">
        <TabsList>
          <TabsTrigger value="wisdom">Global Wisdom</TabsTrigger>
          <TabsTrigger value="handlers">Objection Handlers</TabsTrigger>
        </TabsList>

        <TabsContent value="wisdom" className="space-y-4">
          {wisdomLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading wisdom...</div>
          ) : (
            <div className="grid gap-4">
              {wisdom?.map(w => (
                <Card key={w.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{w.industry_type}</Badge>
                        <Badge variant="secondary">{w.pattern_type}</Badge>
                        {w.promoted_to_master && (
                          <Badge className="bg-yellow-500">
                            <Crown className="h-3 w-3 mr-1" />
                            Master
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Confidence: {((w.confidence_score || 0) * 1).toFixed(0)}%
                        </span>
                        <Progress value={w.confidence_score || 0} className="w-20 h-2" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium mb-2">{w.insight}</p>
                    {w.suggested_prompt_fragment && (
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <span className="text-muted-foreground">Suggested response: </span>
                        {w.suggested_prompt_fragment}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground">
                      Success rate: {w.success_rate}% • Sample size: {w.sample_size}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {wisdom?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No patterns yet. Click "Analyze Wins" to extract patterns from successful conversations.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="handlers" className="space-y-4">
          {handlersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading handlers...</div>
          ) : (
            <div className="grid gap-4">
              {handlers?.map(h => {
                const conversionRate = h.usage_count > 0 
                  ? (h.conversion_count / h.usage_count) * 100 
                  : 0;
                
                return (
                  <Card key={h.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{h.industry_type}</Badge>
                            {h.is_master && (
                              <Badge className="bg-yellow-500">
                                <Crown className="h-3 w-3 mr-1" />
                                Master
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">When they say:</p>
                          <p className="font-medium mb-2">"{h.objection_pattern}"</p>
                          <p className="text-sm text-muted-foreground mb-1">Respond with:</p>
                          <div className="bg-muted p-3 rounded-md">
                            {h.handler_text}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-green-500">
                            {conversionRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {h.conversion_count}/{h.usage_count} wins
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {h.org_count} orgs
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {handlers?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No objection handlers yet. They'll be created as your AI handles objections.
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
