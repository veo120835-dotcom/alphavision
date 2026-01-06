import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  Plus, 
  Play, 
  Clock, 
  Zap,
  BookOpen,
  MessageCircle,
  Palette,
  Search,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { format } from "date-fns";
import { TrendScouterDashboard } from "./TrendScouterDashboard";
import { ContentScheduler } from "./ContentScheduler";

interface TrendTopic {
  id: string;
  topic: string;
  source: string | null;
  relevance_score: number | null;
  status: string;
  used_count: number | null;
  discovered_at: string;
}

interface ContentQueueItem {
  id: string;
  content_type: string;
  variation: string;
  title: string | null;
  script: string | null;
  hook_text: string | null;
  platform: string;
  scheduled_at: string | null;
  status: string;
}

const VARIATIONS = [
  { id: 'educational', label: 'Educational', icon: BookOpen, color: 'text-blue-400', description: 'Informative listicle-style content' },
  { id: 'controversial', label: 'Controversial', icon: MessageCircle, color: 'text-orange-400', description: 'Opinion-driven engagement bait' },
  { id: 'aesthetic', label: 'Aesthetic', icon: Palette, color: 'text-purple-400', description: 'Vibe-based visual content' },
];

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Twitter'];

export function ContentFactoryView() {
  const { organization } = useOrganization();
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [contentQueue, setContentQueue] = useState<ContentQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrend, setSelectedTrend] = useState<TrendTopic | null>(null);
  const [newTrendTopic, setNewTrendTopic] = useState("");
  const [generatingContent, setGeneratingContent] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchData();

      // Subscribe to real-time content queue updates
      const contentChannel = supabase
        .channel('content-queue-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'content_queue',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            console.log('Content queue update:', payload);
            if (payload.eventType === 'INSERT') {
              setContentQueue(prev => [payload.new as ContentQueueItem, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setContentQueue(prev => 
                prev.map(c => c.id === (payload.new as ContentQueueItem).id ? payload.new as ContentQueueItem : c)
              );
            } else if (payload.eventType === 'DELETE') {
              setContentQueue(prev => prev.filter(c => c.id !== (payload.old as any).id));
            }
          }
        )
        .subscribe();

      // Subscribe to real-time trend updates
      const trendChannel = supabase
        .channel('trend-topics-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trend_topics',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            console.log('Trend topic update:', payload);
            if (payload.eventType === 'INSERT') {
              setTrends(prev => [payload.new as TrendTopic, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setTrends(prev => 
                prev.map(t => t.id === (payload.new as TrendTopic).id ? payload.new as TrendTopic : t)
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(contentChannel);
        supabase.removeChannel(trendChannel);
      };
    }
  }, [organization?.id]);

  const fetchData = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const [trendsRes, queueRes] = await Promise.all([
        supabase
          .from('trend_topics')
          .select('*')
          .eq('organization_id', organization.id)
          .order('discovered_at', { ascending: false })
          .limit(20),
        supabase
          .from('content_queue')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (trendsRes.data) setTrends(trendsRes.data);
      if (queueRes.data) setContentQueue(queueRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTrendTopic = async () => {
    if (!organization?.id || !newTrendTopic.trim()) return;

    try {
      const { data, error } = await supabase
        .from('trend_topics')
        .insert({
          organization_id: organization.id,
          topic: newTrendTopic.trim(),
          source: 'manual',
          relevance_score: 80,
          status: 'new'
        })
        .select()
        .single();

      if (error) throw error;
      
      setTrends(prev => [data, ...prev]);
      setNewTrendTopic("");
      toast.success("Trend topic added!");
    } catch (error) {
      console.error('Error adding trend:', error);
      toast.error("Failed to add trend topic");
    }
  };

  const generateContentVariations = async (trend: TrendTopic) => {
    if (!organization?.id) return;
    
    setGeneratingContent(true);
    setSelectedTrend(trend);

    try {
      // Generate 3 variations for each platform
      const variations = VARIATIONS.map(v => ({
        organization_id: organization.id,
        trend_topic_id: trend.id,
        content_type: 'video',
        variation: v.id,
        title: `${trend.topic} - ${v.label} Version`,
        hook_text: generateHook(trend.topic, v.id),
        script: generateScript(trend.topic, v.id),
        platform: 'TikTok',
        status: 'draft'
      }));

      const { data, error } = await supabase
        .from('content_queue')
        .insert(variations)
        .select();

      if (error) throw error;

      // Update trend used count
      await supabase
        .from('trend_topics')
        .update({ 
          used_count: (trend.used_count || 0) + 1,
          last_used_at: new Date().toISOString(),
          status: 'used'
        })
        .eq('id', trend.id);

      setContentQueue(prev => [...(data || []), ...prev]);
      toast.success("Generated 3 content variations!");
      fetchData();
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error("Failed to generate content");
    } finally {
      setGeneratingContent(false);
      setSelectedTrend(null);
    }
  };

  const generateHook = (topic: string, variation: string): string => {
    const hooks = {
      educational: `Here are 5 things nobody tells you about ${topic}...`,
      controversial: `Unpopular opinion: Most people are doing ${topic} completely wrong`,
      aesthetic: `POV: You finally mastered ${topic} ✨`
    };
    return hooks[variation as keyof typeof hooks] || topic;
  };

  const generateScript = (topic: string, variation: string): string => {
    const scripts = {
      educational: `[HOOK] ${topic} breakdown\n\n1. First point...\n2. Second point...\n3. Third point...\n\n[CTA] Follow for more tips!`,
      controversial: `[HOOK] Hot take on ${topic}\n\nHere's why everyone is wrong...\n\n[CTA] Comment your thoughts below!`,
      aesthetic: `[HOOK] Aesthetic ${topic} moment\n\n[Visual sequence]\n\n[CTA] Save this for later ✨`
    };
    return scripts[variation as keyof typeof scripts] || topic;
  };

  const scheduleContent = async (contentId: string, scheduledAt: Date) => {
    try {
      await supabase
        .from('content_queue')
        .update({ 
          scheduled_at: scheduledAt.toISOString(),
          status: 'scheduled'
        })
        .eq('id', contentId);

      fetchData();
      toast.success("Content scheduled!");
    } catch (error) {
      console.error('Error scheduling content:', error);
      toast.error("Failed to schedule content");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'published': return 'bg-green-500/20 text-green-400';
      case 'new': return 'bg-yellow-500/20 text-yellow-400';
      case 'used': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getVariationIcon = (variation: string) => {
    const v = VARIATIONS.find(x => x.id === variation);
    return v ? v.icon : Sparkles;
  };

  const getVariationColor = (variation: string) => {
    const v = VARIATIONS.find(x => x.id === variation);
    return v ? v.color : 'text-muted-foreground';
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold gradient-text">Content Factory</h1>
          <p className="text-muted-foreground mt-1">Trend scouting, multi-version generation & scheduling</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="scout" className="gap-2">
            <Target className="w-4 h-4" />
            Scout
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scout" className="mt-6">
          <TrendScouterDashboard />
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Trend */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Trend Scout
                </CardTitle>
                <CardDescription>Add trending topics for content generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter trending topic..."
                    value={newTrendTopic}
                    onChange={(e) => setNewTrendTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTrendTopic()}
                  />
                  <Button onClick={addTrendTopic} disabled={!newTrendTopic.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {['AI Tools', 'Side Hustles', 'Remote Work'].map(topic => (
                    <Button
                      key={topic}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setNewTrendTopic(topic)}
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trend Topics List */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Active Trends
                </CardTitle>
                <CardDescription>{trends.length} topics discovered</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    <AnimatePresence>
                      {trends.map((trend, idx) => (
                        <motion.div
                          key={trend.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{trend.topic}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getStatusColor(trend.status)} variant="secondary">
                                {trend.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Used {trend.used_count || 0}x
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => generateContentVariations(trend)}
                            disabled={generatingContent && selectedTrend?.id === trend.id}
                          >
                            {generatingContent && selectedTrend?.id === trend.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4" />
                            )}
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {trends.length === 0 && !loading && (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No trends yet. Add your first topic above!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VARIATIONS.map((variation) => {
              const Icon = variation.icon;
              const variationContent = contentQueue.filter(c => c.variation === variation.id);
              
              return (
                <Card key={variation.id} className="card-glow">
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${variation.color}`}>
                      <Icon className="w-5 h-5" />
                      {variation.label}
                    </CardTitle>
                    <CardDescription>{variation.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{variationContent.length}</div>
                    <p className="text-sm text-muted-foreground mb-4">pieces generated</p>
                    
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {variationContent.slice(0, 5).map(content => (
                          <div key={content.id} className="p-2 rounded bg-muted/50">
                            <p className="text-sm font-medium truncate">{content.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{content.platform}</Badge>
                              <Badge className={getStatusColor(content.status)} variant="secondary">
                                {content.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        
                        {variationContent.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No {variation.label.toLowerCase()} content yet
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-6">
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Content Queue
              </CardTitle>
              <CardDescription>Schedule and manage your content pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {contentQueue.map((content, idx) => {
                    const VariationIcon = getVariationIcon(content.variation);
                    
                    return (
                      <motion.div
                        key={content.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className={`p-2 rounded-lg bg-background ${getVariationColor(content.variation)}`}>
                          <VariationIcon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{content.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{content.hook_text}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{content.platform}</Badge>
                          <Badge className={getStatusColor(content.status)} variant="secondary">
                            {content.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          {content.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const scheduledAt = new Date();
                                scheduledAt.setHours(scheduledAt.getHours() + 1);
                                scheduleContent(content.id, scheduledAt);
                              }}
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              Schedule
                            </Button>
                          )}
                          {content.scheduled_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(content.scheduled_at), 'MMM d, h:mm a')}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {contentQueue.length === 0 && !loading && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No content in queue</p>
                      <p className="text-sm">Generate content from trending topics first</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}