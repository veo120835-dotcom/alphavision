import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  UserPlus, 
  Link2, 
  Send, 
  Zap,
  Settings,
  Play,
  Pause,
  Clock,
  Users,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface DMConversation {
  id: string;
  platform: string;
  status: string;
  lead_id: string | null;
  messages_count: number | null;
  last_message_at: string | null;
  ai_handling_mode: string | null;
  created_at: string;
}

interface DoubleHookConfig {
  enabled: boolean;
  delayMinutes: number;
  contentLinks: string[];
  welcomeMessage: string;
  followUpMessage: string;
  autoReplyEnabled: boolean;
  platformFilters: string[];
}

export function DoubleHookStrategy() {
  const { organization } = useOrganization();
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DoubleHookConfig>({
    enabled: true,
    delayMinutes: 5,
    contentLinks: [],
    welcomeMessage: "Hey! Thanks for following 🙌 I noticed you're interested in [TOPIC]. Here's my best content on that:",
    followUpMessage: "Quick question - what's your biggest challenge with [TOPIC] right now?",
    autoReplyEnabled: true,
    platformFilters: ['instagram', 'tiktok', 'twitter']
  });
  const [newLink, setNewLink] = useState("");
  const [stats, setStats] = useState({
    responseRate: 32,
    avgResponseTime: '2.4h',
    conversionsToday: 3,
    followersToday: 12
  });

  useEffect(() => {
    if (organization?.id) {
      fetchData();
      loadConfig();

      // Real-time subscription for new followers/conversations
      const channel = supabase
        .channel('dm-conversations-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'dm_conversations',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            console.log('New DM conversation:', payload);
            setConversations(prev => [payload.new as DMConversation, ...prev]);
            setStats(prev => ({ ...prev, followersToday: prev.followersToday + 1 }));
            if (config.enabled) {
              toast.success('New follower detected! Double Hook triggered 🎯');
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [organization?.id, config.enabled]);

  const loadConfig = async () => {
    if (!organization?.id) return;
    
    const { data } = await supabase
      .from('memory_items')
      .select('content')
      .eq('organization_id', organization.id)
      .eq('type', 'config')
      .eq('title', 'double_hook_strategy')
      .single();
    
    if (data?.content) {
      setConfig(prev => ({ ...prev, ...(data.content as any) }));
    }
  };

  const saveConfig = async () => {
    if (!organization?.id) return;
    
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('memory_items')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('type', 'config')
        .eq('title', 'double_hook_strategy')
        .single();

      if (existing) {
        await supabase
          .from('memory_items')
          .update({ content: config as any })
          .eq('id', existing.id);
      } else {
        await supabase.from('memory_items').insert({
          organization_id: organization.id,
          type: 'config',
          title: 'double_hook_strategy',
          content: config as any
        });
      }
      
      toast.success('Configuration saved!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const fetchData = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dm_conversations')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const addContentLink = () => {
    if (!newLink.trim()) return;
    setConfig(prev => ({
      ...prev,
      contentLinks: [...prev.contentLinks, newLink.trim()]
    }));
    setNewLink("");
    toast.success("Content link added!");
  };

  const removeContentLink = (index: number) => {
    setConfig(prev => ({
      ...prev,
      contentLinks: prev.contentLinks.filter((_, i) => i !== index)
    }));
  };

  const simulateNewFollower = async () => {
    if (!organization?.id) return;

    const platforms = ['instagram', 'tiktok', 'twitter'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];

    try {
      // Create a test lead first
      const { data: lead } = await supabase
        .from('leads')
        .insert({
          organization_id: organization.id,
          name: `Test Follower ${Math.floor(Math.random() * 1000)}`,
          source: 'social',
          platform,
          status: 'new',
          intent_score: 20
        })
        .select()
        .single();

      // Create DM conversation
      await supabase.from('dm_conversations').insert({
        organization_id: organization.id,
        platform,
        lead_id: lead?.id,
        status: 'active',
        ai_handling_mode: 'autonomous'
      });

      // Log the action
      await supabase.from('agent_execution_logs').insert({
        organization_id: organization.id,
        action_type: 'socialite',
        reasoning: 'Double Hook Strategy: New follower detected',
        result: `Sent welcome DM with content link to new ${platform} follower`
      });

      toast.success(`Simulated new ${platform} follower! Double Hook triggered.`);
    } catch (error) {
      console.error('Error simulating follower:', error);
      toast.error('Failed to simulate follower');
    }
  };

  const activeConversations = conversations.filter(c => c.status === 'active').length;
  const totalDMsSent = conversations.reduce((sum, c) => sum + (c.messages_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-pink-400" />
            Double Hook Strategy
          </h2>
          <p className="text-muted-foreground mt-1">Auto-DM content links to new followers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 glass rounded-full px-4 py-2">
            <span className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-sm font-medium">{config.enabled ? 'Active' : 'Paused'}</span>
            <Switch 
              checked={config.enabled} 
              onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))} 
            />
          </div>
          <Button onClick={saveConfig} variant="outline" size="sm" disabled={saving}>
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Save Config
          </Button>
          <Button onClick={simulateNewFollower} variant="outline" size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Simulate Follower
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/20">
                <UserPlus className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conversations.length}</p>
                <p className="text-sm text-muted-foreground">Total Followers DM'd</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <MessageCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeConversations}</p>
                <p className="text-sm text-muted-foreground">Active Conversations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Send className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDMsSent}</p>
                <p className="text-sm text-muted-foreground">Total DMs Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.responseRate}%</p>
                <p className="text-sm text-muted-foreground">Response Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Filters */}
      <Card className="card-glow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Active Platforms:</span>
              <div className="flex gap-2">
                {['instagram', 'tiktok', 'twitter', 'youtube'].map(platform => (
                  <Badge
                    key={platform}
                    variant={config.platformFilters.includes(platform) ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => {
                      setConfig(prev => ({
                        ...prev,
                        platformFilters: prev.platformFilters.includes(platform)
                          ? prev.platformFilters.filter(p => p !== platform)
                          : [...prev.platformFilters, platform]
                      }));
                    }}
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Auto-Reply 60s</span>
              <Switch 
                checked={config.autoReplyEnabled} 
                onCheckedChange={(autoReplyEnabled) => setConfig(prev => ({ ...prev, autoReplyEnabled }))} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Strategy Configuration
            </CardTitle>
            <CardDescription>Customize your Double Hook automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Delay Setting */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">DM Delay After Follow</label>
                <span className="text-sm text-muted-foreground">{config.delayMinutes} minutes</span>
              </div>
              <Slider
                value={[config.delayMinutes]}
                onValueChange={([value]) => setConfig(prev => ({ ...prev, delayMinutes: value }))}
                min={1}
                max={60}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Wait before sending to avoid appearing bot-like
              </p>
            </div>

            {/* Welcome Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Welcome Message</label>
              <Textarea
                value={config.welcomeMessage}
                onChange={(e) => setConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                placeholder="Your welcome DM template..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Use [TOPIC] as a placeholder for personalization
              </p>
            </div>

            {/* Content Links */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Content Links to Share</label>
              <div className="flex gap-2">
                <Input
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://your-content-link.com"
                  onKeyDown={(e) => e.key === 'Enter' && addContentLink()}
                />
                <Button onClick={addContentLink} size="icon">
                  <Link2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {config.contentLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Link2 className="w-4 h-4 text-primary" />
                    <span className="flex-1 text-sm truncate">{link}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeContentLink(idx)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                {config.contentLinks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Add content links to share with new followers
                  </p>
                )}
              </div>
            </div>

            {/* Follow-up Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Follow-up Message (Hook #2)</label>
              <Textarea
                value={config.followUpMessage}
                onChange={(e) => setConfig(prev => ({ ...prev, followUpMessage: e.target.value }))}
                placeholder="Your follow-up question..."
              />
              <p className="text-xs text-muted-foreground">
                Sent 24h later if no response to start a conversation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              Recent Double Hooks
            </CardTitle>
            <CardDescription>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live updates enabled
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                <AnimatePresence>
                  {conversations.map((conv, idx) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <div className="p-2 rounded-lg bg-pink-500/20">
                        <Heart className="w-4 h-4 text-pink-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{conv.platform}</span>
                          <Badge 
                            variant="secondary" 
                            className={conv.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-muted'}
                          >
                            {conv.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {conv.messages_count || 0} messages • {conv.ai_handling_mode}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {conversations.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No Double Hooks sent yet</p>
                    <p className="text-sm">Simulate a follower to test</p>
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