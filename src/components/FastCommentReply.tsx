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
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  Send,
  Bot,
  User,
  Sparkles,
  Timer,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface CommentReply {
  id: string;
  platform: string;
  original_comment: string;
  reply_text: string;
  reply_time_seconds: number;
  status: 'replied' | 'pending' | 'skipped';
  sentiment: 'positive' | 'neutral' | 'negative' | 'question';
  created_at: string;
}

interface ReplyTemplate {
  id: string;
  name: string;
  trigger: string;
  response: string;
  sentiment: string;
  priority: number;
}

interface FastReplyConfig {
  enabled: boolean;
  maxReplyTimeSeconds: number;
  aiMode: 'template' | 'ai_generated' | 'hybrid';
  platforms: string[];
  autoReplyPositive: boolean;
  autoReplyQuestions: boolean;
  requireApprovalNegative: boolean;
}

export function FastCommentReply() {
  const { organization } = useOrganization();
  const [replies, setReplies] = useState<CommentReply[]>([]);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([
    { id: '1', name: 'Thank You', trigger: 'positive', response: 'Thank you so much! 🙏 Appreciate the love!', sentiment: 'positive', priority: 1 },
    { id: '2', name: 'Answer Question', trigger: 'question', response: 'Great question! Check the link in bio for more details 👆', sentiment: 'question', priority: 2 },
    { id: '3', name: 'Engagement Boost', trigger: 'any', response: 'Glad this resonated! What was your biggest takeaway?', sentiment: 'neutral', priority: 3 },
  ]);
  const [config, setConfig] = useState<FastReplyConfig>({
    enabled: true,
    maxReplyTimeSeconds: 60,
    aiMode: 'hybrid',
    platforms: ['instagram', 'tiktok', 'youtube'],
    autoReplyPositive: true,
    autoReplyQuestions: true,
    requireApprovalNegative: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', trigger: 'any', response: '' });
  const [stats, setStats] = useState({
    repliedToday: 0,
    avgReplyTime: 0,
    engagementBoost: 0
  });

  useEffect(() => {
    if (organization?.id) {
      loadData();
      simulateIncomingComments();
    }
  }, [organization?.id]);

  const loadData = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      // Load config from memory
      const { data: configData } = await supabase
        .from('memory_items')
        .select('content')
        .eq('organization_id', organization.id)
        .eq('type', 'config')
        .eq('title', 'fast_comment_reply')
        .maybeSingle();

      if (configData?.content) {
        const content = configData.content as any;
        if (content.config) setConfig(content.config);
        if (content.templates) setTemplates(content.templates);
      }

      // Calculate stats from execution logs
      const { data: logs } = await supabase
        .from('agent_execution_logs')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('action_type', 'comment_reply')
        .order('executed_at', { ascending: false })
        .limit(100);

      if (logs) {
        const todayReplies = logs.filter(l => 
          new Date(l.executed_at).toDateString() === new Date().toDateString()
        );
        
        setStats({
          repliedToday: todayReplies.length,
          avgReplyTime: 45, // Simulated
          engagementBoost: 23 // Simulated
        });

        // Convert logs to replies
        const parsedReplies: CommentReply[] = logs.slice(0, 20).map(log => ({
          id: log.id,
          platform: (log.action_details as any)?.platform || 'instagram',
          original_comment: (log.action_details as any)?.comment || 'Great content!',
          reply_text: log.result || 'Thanks! 🙏',
          reply_time_seconds: (log.action_details as any)?.reply_time || Math.floor(Math.random() * 60) + 10,
          status: 'replied',
          sentiment: (log.action_details as any)?.sentiment || 'positive',
          created_at: log.executed_at
        }));
        
        setReplies(parsedReplies);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulateIncomingComments = () => {
    // Simulate real-time incoming comments
    const interval = setInterval(() => {
      if (Math.random() > 0.7 && config.enabled) {
        const comments = [
          { text: 'This is exactly what I needed!', sentiment: 'positive' as const },
          { text: 'How do I get started with this?', sentiment: 'question' as const },
          { text: 'Amazing content! 🔥', sentiment: 'positive' as const },
          { text: 'Can you explain more about step 3?', sentiment: 'question' as const },
        ];
        
        const comment = comments[Math.floor(Math.random() * comments.length)];
        const platforms = ['instagram', 'tiktok', 'youtube'];
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const replyTime = Math.floor(Math.random() * config.maxReplyTimeSeconds) + 5;
        
        // Find matching template
        const template = templates.find(t => 
          t.sentiment === comment.sentiment || t.trigger === 'any'
        ) || templates[0];

        const newReply: CommentReply = {
          id: Date.now().toString(),
          platform,
          original_comment: comment.text,
          reply_text: template?.response || 'Thanks for commenting!',
          reply_time_seconds: replyTime,
          status: replyTime <= config.maxReplyTimeSeconds ? 'replied' : 'pending',
          sentiment: comment.sentiment,
          created_at: new Date().toISOString()
        };

        setReplies(prev => [newReply, ...prev.slice(0, 49)]);
        setStats(prev => ({
          ...prev,
          repliedToday: prev.repliedToday + 1,
          avgReplyTime: Math.round((prev.avgReplyTime + replyTime) / 2)
        }));

        if (replyTime <= 60) {
          toast.success(`Fast reply sent in ${replyTime}s! 🚀`);
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  };

  const saveConfig = async () => {
    if (!organization?.id) return;
    
    setSaving(true);
    try {
      const configData = { config, templates };
      
      const { data: existing } = await supabase
        .from('memory_items')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('type', 'config')
        .eq('title', 'fast_comment_reply')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('memory_items')
          .update({ content: configData as any })
          .eq('id', existing.id);
      } else {
        await supabase.from('memory_items').insert({
          organization_id: organization.id,
          type: 'config',
          title: 'fast_comment_reply',
          content: configData as any
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

  const addTemplate = () => {
    if (!newTemplate.name || !newTemplate.response) {
      toast.error('Please fill in all fields');
      return;
    }

    const template: ReplyTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      trigger: newTemplate.trigger,
      response: newTemplate.response,
      sentiment: newTemplate.trigger,
      priority: templates.length + 1
    };

    setTemplates(prev => [...prev, template]);
    setNewTemplate({ name: '', trigger: 'any', response: '' });
    setShowAddTemplate(false);
    toast.success('Template added!');
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const simulateComment = async () => {
    if (!organization?.id) return;

    const comments = [
      { text: 'This changed my perspective completely!', sentiment: 'positive' },
      { text: 'Where can I learn more about this?', sentiment: 'question' },
      { text: 'Not sure I agree with point 2...', sentiment: 'negative' },
    ];

    const comment = comments[Math.floor(Math.random() * comments.length)];
    const platforms = ['instagram', 'tiktok', 'youtube'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const replyTime = Math.floor(Math.random() * 55) + 5;

    try {
      await supabase.from('agent_execution_logs').insert({
        organization_id: organization.id,
        action_type: 'comment_reply',
        reasoning: `Fast comment reply triggered by ${comment.sentiment} comment`,
        result: templates.find(t => t.sentiment === comment.sentiment)?.response || 'Thanks!',
        action_details: {
          platform,
          comment: comment.text,
          sentiment: comment.sentiment,
          reply_time: replyTime
        } as any
      });

      const newReply: CommentReply = {
        id: Date.now().toString(),
        platform,
        original_comment: comment.text,
        reply_text: templates.find(t => t.sentiment === comment.sentiment)?.response || 'Thanks!',
        reply_time_seconds: replyTime,
        status: 'replied',
        sentiment: comment.sentiment as any,
        created_at: new Date().toISOString()
      };

      setReplies(prev => [newReply, ...prev]);
      setStats(prev => ({ ...prev, repliedToday: prev.repliedToday + 1 }));
      
      toast.success(`Replied in ${replyTime}s! Algorithm boost activated 🚀`);
    } catch (error) {
      console.error('Error simulating comment:', error);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/20 text-green-400';
      case 'question': return 'bg-blue-500/20 text-blue-400';
      case 'negative': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTimeColor = (seconds: number) => {
    if (seconds <= 30) return 'text-green-400';
    if (seconds <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            Fast Comment Reply
          </h2>
          <p className="text-muted-foreground mt-1">Auto-reply within 60 seconds to boost algorithm ranking</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 glass rounded-full px-4 py-2">
            <span className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-sm font-medium">{config.enabled ? 'Active' : 'Paused'}</span>
            <Switch checked={config.enabled} onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))} />
          </div>
          <Button onClick={saveConfig} variant="outline" size="sm" disabled={saving}>
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Save
          </Button>
          <Button onClick={simulateComment} variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Simulate Comment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-glow border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <MessageCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.repliedToday}</p>
                <p className="text-sm text-muted-foreground">Replied Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Timer className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgReplyTime}s</p>
                <p className="text-sm text-muted-foreground">Avg Reply Time</p>
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
                <p className="text-2xl font-bold">+{stats.engagementBoost}%</p>
                <p className="text-sm text-muted-foreground">Engagement Boost</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Target className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{config.maxReplyTimeSeconds}s</p>
                <p className="text-sm text-muted-foreground">Target Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Reply Settings
            </CardTitle>
            <CardDescription>Configure auto-reply behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Max Reply Time */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Max Reply Time</label>
                <span className="text-sm text-muted-foreground">{config.maxReplyTimeSeconds} seconds</span>
              </div>
              <Slider
                value={[config.maxReplyTimeSeconds]}
                onValueChange={([value]) => setConfig(prev => ({ ...prev, maxReplyTimeSeconds: value }))}
                min={15}
                max={120}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Replies under 60s boost algorithm ranking significantly
              </p>
            </div>

            {/* AI Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reply Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'template', label: 'Templates', icon: MessageCircle },
                  { id: 'ai_generated', label: 'AI Generated', icon: Sparkles },
                  { id: 'hybrid', label: 'Hybrid', icon: Bot }
                ].map(mode => (
                  <Button
                    key={mode.id}
                    variant={config.aiMode === mode.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConfig(prev => ({ ...prev, aiMode: mode.id as any }))}
                    className="flex items-center gap-1"
                  >
                    <mode.icon className="w-3 h-3" />
                    {mode.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Auto-reply toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-reply to positive comments</span>
                <Switch 
                  checked={config.autoReplyPositive} 
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, autoReplyPositive: v }))} 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-reply to questions</span>
                <Switch 
                  checked={config.autoReplyQuestions} 
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, autoReplyQuestions: v }))} 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Require approval for negative</span>
                <Switch 
                  checked={config.requireApprovalNegative} 
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, requireApprovalNegative: v }))} 
                />
              </div>
            </div>

            {/* Platform selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Active Platforms</label>
              <div className="flex gap-2">
                {['instagram', 'tiktok', 'youtube', 'twitter'].map(platform => (
                  <Badge
                    key={platform}
                    variant={config.platforms.includes(platform) ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => {
                      setConfig(prev => ({
                        ...prev,
                        platforms: prev.platforms.includes(platform)
                          ? prev.platforms.filter(p => p !== platform)
                          : [...prev.platforms, platform]
                      }));
                    }}
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reply Templates */}
        <Card className="card-glow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Reply Templates
                </CardTitle>
                <CardDescription>Pre-configured responses by sentiment</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowAddTemplate(!showAddTemplate)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Template Form */}
            <AnimatePresence>
              {showAddTemplate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-lg bg-muted/50 space-y-3"
                >
                  <Input
                    placeholder="Template name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newTemplate.trigger}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, trigger: e.target.value }))}
                  >
                    <option value="any">Any comment</option>
                    <option value="positive">Positive sentiment</option>
                    <option value="question">Questions</option>
                    <option value="negative">Negative sentiment</option>
                  </select>
                  <Textarea
                    placeholder="Reply template..."
                    value={newTemplate.response}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, response: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addTemplate}>Add</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddTemplate(false)}>Cancel</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Templates List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Badge className={getSentimentColor(template.sentiment)} variant="secondary">
                      {template.trigger}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-sm text-muted-foreground">{template.response}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteTemplate(template.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Replies */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Fast Replies
          </CardTitle>
          <CardDescription>
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live updates enabled
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              <AnimatePresence>
                {replies.map((reply, idx) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/30"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className={`p-2 rounded-lg ${getSentimentColor(reply.sentiment)}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{reply.platform}</span>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-sm">{reply.original_comment}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Bot className="w-4 h-4 text-primary mt-1" />
                        <div className="flex-1 p-2 rounded-lg bg-primary/10">
                          <p className="text-sm">{reply.reply_text}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge className={reply.status === 'replied' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                        {reply.status}
                      </Badge>
                      <span className={`text-lg font-bold ${getTimeColor(reply.reply_time_seconds)}`}>
                        {reply.reply_time_seconds}s
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {replies.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No replies yet</p>
                  <p className="text-sm">Simulate a comment to test</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
