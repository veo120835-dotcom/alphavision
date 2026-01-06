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
  Clock,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { useMockStorage, generateMockId, generateMockTimestamp } from "@/hooks/useMockStorage";

interface DMConversation {
  id: string;
  platform: string;
  status: string;
  lead_id: string | null;
  messages_count: number;
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
  const storageKey = `double_hook_${organization?.id || 'default'}`;
  const configKey = `double_hook_config_${organization?.id || 'default'}`;
  
  const { data: conversations, addItem, loading } = useMockStorage<DMConversation>(storageKey, []);
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
  const [stats] = useState({
    responseRate: 32,
    avgResponseTime: '2.4h',
    conversionsToday: 3,
    followersToday: 12
  });

  useEffect(() => {
    loadConfig();
  }, [organization?.id]);

  const loadConfig = () => {
    try {
      const stored = localStorage.getItem(configKey);
      if (stored) {
        setConfig(prev => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      localStorage.setItem(configKey, JSON.stringify(config));
      toast.success('Configuration saved!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
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

  const simulateNewFollower = () => {
    const platforms = ['instagram', 'tiktok', 'twitter'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];

    const newConversation: DMConversation = {
      id: generateMockId(),
      platform,
      status: 'active',
      lead_id: generateMockId(),
      messages_count: 1,
      last_message_at: generateMockTimestamp(),
      ai_handling_mode: 'autonomous',
      created_at: generateMockTimestamp()
    };

    addItem(newConversation);
    toast.success(`Simulated new ${platform} follower! Double Hook triggered.`);
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
                      <div className="p-2 rounded-full bg-primary/20">
                        <UserPlus className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{conv.platform}</span>
                          <Badge variant="outline" className="text-xs">{conv.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {conv.messages_count} messages sent
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(conv.created_at).toLocaleString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {conversations.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm">Simulate a follower to see the strategy in action</p>
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
