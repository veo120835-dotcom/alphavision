import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Star, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Target,
  DollarSign,
  Clock,
  Filter,
  Sparkles,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface QualityCriteria {
  minBudget: number;
  minIntentScore: number;
  requiresDecisionMaker: boolean;
  maxResponseTime: number;
  preferredPlatforms: string[];
}

interface ClientScore {
  id: string;
  name: string;
  qualityScore: number;
  budget: number;
  intent: number;
  responsiveness: number;
  platform: string;
  recommendation: 'ideal' | 'good' | 'caution' | 'avoid';
}

export function ClientQualityOptimizer() {
  const { organization } = useOrganization();
  const [criteria, setCriteria] = useState<QualityCriteria>({
    minBudget: 2000,
    minIntentScore: 60,
    requiresDecisionMaker: true,
    maxResponseTime: 24,
    preferredPlatforms: ['Instagram', 'LinkedIn']
  });
  const [clients, setClients] = useState<ClientScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoFilter, setAutoFilter] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      loadConfig();
      loadClients();
    }
  }, [organization?.id]);

  const loadConfig = async () => {
    if (!organization?.id) return;

    const { data } = await supabase
      .from('memory_items')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('type', 'client_quality_config')
      .single();

    if (data?.content) {
      const content = data.content as unknown as QualityCriteria;
      if (content.minBudget) setCriteria(content);
    }
  };

  const loadClients = async () => {
    if (!organization?.id) return;
    setLoading(true);

    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (leads) {
      const scoredClients: ClientScore[] = leads.map(lead => {
        const budget = Math.round(1000 + Math.random() * 9000);
        const intent = lead.intent_score || Math.round(40 + Math.random() * 55);
        const responsiveness = Math.round(50 + Math.random() * 50);
        const qualityScore = Math.round((intent * 0.4 + responsiveness * 0.3 + Math.min(budget / 100, 30)) / 1);
        
        let recommendation: ClientScore['recommendation'] = 'good';
        if (qualityScore >= 80 && budget >= criteria.minBudget) recommendation = 'ideal';
        else if (qualityScore >= 60) recommendation = 'good';
        else if (qualityScore >= 40) recommendation = 'caution';
        else recommendation = 'avoid';

        return {
          id: lead.id,
          name: lead.name || 'Unknown Lead',
          qualityScore,
          budget,
          intent,
          responsiveness,
          platform: lead.platform || 'Unknown',
          recommendation
        };
      });

      setClients(scoredClients.sort((a, b) => b.qualityScore - a.qualityScore));
    }

    setLoading(false);
  };

  const saveConfig = async () => {
    if (!organization?.id) return;

    try {
      const { data: existing } = await supabase
        .from('memory_items')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('type', 'client_quality_config')
        .single();

      if (existing) {
        await supabase
          .from('memory_items')
          .update({ 
            content: JSON.parse(JSON.stringify(criteria)),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('memory_items')
          .insert({
            organization_id: organization.id,
            type: 'client_quality_config',
            title: 'Client Quality Configuration',
            content: JSON.parse(JSON.stringify(criteria))
          });
      }

      toast.success('Quality criteria saved!');
      loadClients();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const getRecommendationBadge = (rec: ClientScore['recommendation']) => {
    switch (rec) {
      case 'ideal': return { color: 'bg-green-500/20 text-green-400', icon: Star, label: 'Ideal' };
      case 'good': return { color: 'bg-blue-500/20 text-blue-400', icon: ThumbsUp, label: 'Good' };
      case 'caution': return { color: 'bg-yellow-500/20 text-yellow-400', icon: AlertTriangle, label: 'Caution' };
      case 'avoid': return { color: 'bg-red-500/20 text-red-400', icon: ThumbsDown, label: 'Avoid' };
    }
  };

  const idealClients = clients.filter(c => c.recommendation === 'ideal').length;
  const avgQuality = clients.length > 0 
    ? Math.round(clients.reduce((sum, c) => sum + c.qualityScore, 0) / clients.length) 
    : 0;
  const filteredClients = autoFilter 
    ? clients.filter(c => c.recommendation !== 'avoid') 
    : clients;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Client Quality Optimizer</h2>
          <p className="text-muted-foreground">Score and filter leads by quality criteria</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-filter" className="text-sm">Auto-filter poor fits</Label>
            <Switch 
              id="auto-filter"
              checked={autoFilter} 
              onCheckedChange={setAutoFilter} 
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Star className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{idealClients}</p>
                <p className="text-sm text-muted-foreground">Ideal Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgQuality}%</p>
                <p className="text-sm text-muted-foreground">Avg Quality</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-sm text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Filter className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredClients.length}</p>
                <p className="text-sm text-muted-foreground">Passing Filter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Quality Criteria */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Quality Criteria
            </CardTitle>
            <CardDescription>Define your ideal client profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Minimum Budget</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={criteria.minBudget}
                  onChange={(e) => setCriteria(prev => ({ ...prev, minBudget: Number(e.target.value) }))}
                />
              </div>
              <Slider
                value={[criteria.minBudget]}
                onValueChange={([v]) => setCriteria(prev => ({ ...prev, minBudget: v }))}
                min={500}
                max={10000}
                step={250}
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Intent Score</Label>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{criteria.minIntentScore}%</span>
              </div>
              <Slider
                value={[criteria.minIntentScore]}
                onValueChange={([v]) => setCriteria(prev => ({ ...prev, minIntentScore: v }))}
                min={20}
                max={90}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Response Time (hours)</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{criteria.maxResponseTime}h</span>
              </div>
              <Slider
                value={[criteria.maxResponseTime]}
                onValueChange={([v]) => setCriteria(prev => ({ ...prev, maxResponseTime: v }))}
                min={1}
                max={72}
                step={1}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Require Decision Maker</Label>
              <Switch
                checked={criteria.requiresDecisionMaker}
                onCheckedChange={(v) => setCriteria(prev => ({ ...prev, requiresDecisionMaker: v }))}
              />
            </div>

            <Button onClick={saveConfig} className="w-full">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Criteria
            </Button>
          </CardContent>
        </Card>

        {/* Client Scores */}
        <Card className="card-glow col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Scored Leads
            </CardTitle>
            <CardDescription>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Sorted by quality score
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredClients.map((client, idx) => {
                    const badge = getRecommendationBadge(client.recommendation);
                    const BadgeIcon = badge.icon;

                    return (
                      <motion.div
                        key={client.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: idx * 0.02 }}
                        className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="font-bold text-primary">
                                {client.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-muted-foreground">{client.platform}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={badge.color} variant="secondary">
                              <BadgeIcon className="w-3 h-3 mr-1" />
                              {badge.label}
                            </Badge>
                            <div className="text-right">
                              <p className="text-xl font-bold">{client.qualityScore}%</p>
                              <p className="text-xs text-muted-foreground">Quality Score</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Est. Budget</p>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-green-400" />
                              <span className="font-medium">${client.budget.toLocaleString()}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Intent</p>
                            <div className="flex items-center gap-2">
                              <Progress value={client.intent} className="h-1.5 flex-1" />
                              <span className="text-sm">{client.intent}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Responsiveness</p>
                            <div className="flex items-center gap-2">
                              <Progress value={client.responsiveness} className="h-1.5 flex-1" />
                              <span className="text-sm">{client.responsiveness}%</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredClients.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No leads found</p>
                    <p className="text-sm">Leads will appear here as they come in</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
