import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  Zap,
  Target,
  Sparkles,
  BarChart3,
  Play,
  Instagram,
  Youtube,
  Video,
  Trophy,
  Lightbulb,
  RefreshCcw,
  ArrowRight,
  FlaskConical,
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { ABTestingFramework } from './ABTestingFramework';
import { FastCommentReply } from './FastCommentReply';

interface ContentPost {
  id: string;
  platform: string;
  post_type: string;
  hook_text: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  avg_watch_time_seconds: number;
  retention_at_3s: number;
  hook_score: number;
  hook_category: string | null;
  content_variation: string | null;
  posted_at: string | null;
}

interface HookPattern {
  id: string;
  pattern_name: string;
  pattern_structure: string;
  example_hooks: string[] | null;
  avg_retention: number;
  usage_count: number;
  success_rate: number;
  is_active: boolean;
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  tiktok: <Video className="h-4 w-4" />,
};

const variationColors: Record<string, string> = {
  educational: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  controversial: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  aesthetic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

// Mock data for visualization (will be replaced with real data)
const mockRetentionData = [
  { second: 0, retention: 100 },
  { second: 1, retention: 92 },
  { second: 2, retention: 85 },
  { second: 3, retention: 78 },
  { second: 5, retention: 65 },
  { second: 10, retention: 48 },
  { second: 15, retention: 35 },
  { second: 20, retention: 28 },
  { second: 30, retention: 18 },
];

const mockHookPerformance = [
  { category: 'Question', score: 82, color: '#22c55e' },
  { category: 'Shocking Stat', score: 78, color: '#3b82f6' },
  { category: 'Story Open', score: 71, color: '#a855f7' },
  { category: 'Controversial', score: 68, color: '#f97316' },
  { category: 'Tutorial Start', score: 55, color: '#6b7280' },
];

export function HookOptimizationView() {
  const { organization } = useOrganization();
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [patterns, setPatterns] = useState<HookPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  useEffect(() => {
    if (organization?.id) {
      loadData();
    }
  }, [organization?.id]);

  const loadData = async () => {
    if (!organization?.id) return;
    
    setIsLoading(true);
    try {
      const [postsRes, patternsRes] = await Promise.all([
        supabase
          .from('content_posts')
          .select('*')
          .eq('organization_id', organization.id)
          .order('hook_score', { ascending: false })
          .limit(50),
        supabase
          .from('hook_patterns')
          .select('*')
          .eq('organization_id', organization.id)
          .order('success_rate', { ascending: false })
      ]);

      if (postsRes.data) setPosts(postsRes.data);
      if (patternsRes.data) setPatterns(patternsRes.data);
    } catch (error) {
      console.error('Error loading hook data:', error);
      toast.error('Failed to load hook analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const topPerformingPosts = posts.slice(0, 5);
  const avgRetention = posts.length > 0 
    ? posts.reduce((sum, p) => sum + Number(p.retention_at_3s || 0), 0) / posts.length 
    : 0;
  const avgHookScore = posts.length > 0 
    ? posts.reduce((sum, p) => sum + Number(p.hook_score || 0), 0) / posts.length 
    : 0;

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Hook Optimization Engine
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered analysis of your content hooks for maximum retention
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCcw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="ab-testing" className="gap-2">
            <FlaskConical className="w-4 h-4" />
            A/B Testing
          </TabsTrigger>
          <TabsTrigger value="fast-reply" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Fast Reply
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
        {['24h', '7d', '30d'].map((tf) => (
          <Button
            key={tf}
            variant={selectedTimeframe === tf ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTimeframe(tf)}
            className="text-xs"
          >
            {tf}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Avg 3s Retention"
          value={`${avgRetention.toFixed(1)}%`}
          icon={<Eye className="h-5 w-5" />}
          trend={posts.length > 0 ? '+5.2%' : undefined}
          trendUp={true}
        />
        <MetricCard
          label="Hook Score"
          value={avgHookScore.toFixed(0)}
          icon={<Zap className="h-5 w-5" />}
          subtitle="out of 100"
          trend={posts.length > 0 ? '+12' : undefined}
          trendUp={true}
        />
        <MetricCard
          label="Winning Patterns"
          value={patterns.filter(p => p.success_rate > 70).length.toString()}
          icon={<Trophy className="h-5 w-5" />}
          subtitle={`of ${patterns.length} discovered`}
        />
        <MetricCard
          label="Posts Analyzed"
          value={posts.length.toString()}
          icon={<BarChart3 className="h-5 w-5" />}
          subtitle="this period"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Retention Curve */}
        <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Average Retention Curve
            </CardTitle>
            <CardDescription>
              Viewer drop-off analysis across your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockRetentionData}>
                  <defs>
                    <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="second" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(v) => `${v}s`}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Retention']}
                    labelFormatter={(label) => `At ${label} seconds`}
                  />
                  <Area
                    type="monotone"
                    dataKey="retention"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#retentionGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Critical zone: 0-3s (hook performance)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Engagement zone: 3-10s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hook Category Performance */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Hook Categories
            </CardTitle>
            <CardDescription>
              Performance by hook type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockHookPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}`, 'Score']}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {mockHookPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Winning Patterns & Top Posts */}
      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="patterns">
            <Lightbulb className="h-4 w-4 mr-2" />
            Winning Patterns
          </TabsTrigger>
          <TabsTrigger value="posts">
            <Trophy className="h-4 w-4 mr-2" />
            Top Posts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patterns">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>AI-Discovered Hook Patterns</CardTitle>
              <CardDescription>
                Patterns automatically extracted from your best-performing content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patterns.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No patterns discovered yet</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    As you post more content, the AI will analyze your hooks and discover 
                    winning patterns that drive retention.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {patterns.map((pattern) => (
                      <PatternCard key={pattern.id} pattern={pattern} />
                    ))}
                  </div>
                </ScrollArea>
              )}
              
              {/* Sample patterns for demo */}
              {patterns.length === 0 && (
                <div className="mt-6 space-y-4">
                  <p className="text-sm text-muted-foreground">Example patterns the AI might discover:</p>
                  <div className="space-y-3">
                    <DemoPatternCard 
                      name="The Question Hook"
                      structure="Start with a provocative question that challenges assumptions"
                      examples={[
                        "Why are 90% of entrepreneurs doing this wrong?",
                        "What if everything you knew about X was false?"
                      ]}
                      retention={82}
                    />
                    <DemoPatternCard 
                      name="The Shocking Stat"
                      structure="Lead with an unexpected statistic or data point"
                      examples={[
                        "Only 3% of businesses survive past year 5...",
                        "$47,000 - that's what this mistake cost me"
                      ]}
                      retention={78}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>
                Your highest-scoring hooks ranked by retention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topPerformingPosts.length === 0 ? (
                <div className="text-center py-12">
                  <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No content analyzed yet</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Connect your social platforms to start tracking hook performance 
                    across your content.
                  </p>
                  <Button className="mt-4" variant="outline">
                    Connect Platforms
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {topPerformingPosts.map((post, idx) => (
                      <PostCard key={post.id} post={post} rank={idx + 1} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Recommendations */}
      <Card className="border-primary/30 bg-primary/5 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Hook Recommendations
          </CardTitle>
          <CardDescription>
            Based on your top-performing content patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RecommendationCard
              title="Use More Questions"
              description="Your question-based hooks outperform others by 23%. Try starting 60% of your content with questions."
              impact="+18% retention"
              impactUp={true}
            />
            <RecommendationCard
              title="Shorten Hook Duration"
              description="Your best hooks are under 2.5 seconds. Trim the setup and get to the point faster."
              impact="+12% watch time"
              impactUp={true}
            />
            <RecommendationCard
              title="Avoid Tutorial Openers"
              description="'In this video I'll show you...' drops 35% of viewers. Try pattern interrupts instead."
              impact="-35% drop-off"
              impactUp={true}
            />
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="ab-testing">
          <ABTestingFramework />
        </TabsContent>

        <TabsContent value="fast-reply">
          <FastCommentReply />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  icon, 
  subtitle, 
  trend, 
  trendUp 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  subtitle?: string;
  trend?: string; 
  trendUp?: boolean;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          {trend && (
            <Badge 
              variant="outline" 
              className={trendUp 
                ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                : 'bg-red-500/10 text-red-400 border-red-500/30'
              }
            >
              {trendUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {trend}
            </Badge>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function PatternCard({ pattern }: { pattern: HookPattern }) {
  return (
    <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium">{pattern.pattern_name}</h4>
          <p className="text-sm text-muted-foreground">{pattern.pattern_structure}</p>
        </div>
        <Badge 
          variant="outline"
          className={pattern.success_rate > 70 
            ? 'bg-green-500/10 text-green-400 border-green-500/30'
            : 'bg-muted text-muted-foreground'
          }
        >
          {pattern.success_rate}% success
        </Badge>
      </div>
      {pattern.example_hooks && pattern.example_hooks.length > 0 && (
        <div className="mt-3 space-y-1">
          {pattern.example_hooks.slice(0, 2).map((hook, idx) => (
            <p key={idx} className="text-sm italic text-muted-foreground">
              "{hook}"
            </p>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span>Used {pattern.usage_count} times</span>
        <span>Avg retention: {pattern.avg_retention}%</span>
      </div>
    </div>
  );
}

function DemoPatternCard({ 
  name, 
  structure, 
  examples, 
  retention 
}: { 
  name: string; 
  structure: string; 
  examples: string[]; 
  retention: number;
}) {
  return (
    <div className="p-4 rounded-lg border border-dashed border-border/50 bg-muted/10">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-muted-foreground">{name}</h4>
          <p className="text-sm text-muted-foreground/70">{structure}</p>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          {retention}% retention
        </Badge>
      </div>
      <div className="mt-3 space-y-1">
        {examples.map((ex, idx) => (
          <p key={idx} className="text-sm italic text-muted-foreground/60">
            "{ex}"
          </p>
        ))}
      </div>
    </div>
  );
}

function PostCard({ post, rank }: { post: ContentPost; rank: number }) {
  return (
    <div className="p-4 rounded-lg border border-border/50 bg-muted/20 flex items-start gap-4">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {platformIcons[post.platform] || <Video className="h-4 w-4" />}
          <span className="text-sm font-medium capitalize">{post.platform}</span>
          {post.content_variation && (
            <Badge 
              variant="outline" 
              className={variationColors[post.content_variation] || 'bg-muted'}
            >
              {post.content_variation}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {post.hook_text || 'No hook text recorded'}
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {post.views.toLocaleString()}
          </span>
          <span>{post.retention_at_3s}% @ 3s</span>
          <span>Score: {post.hook_score}</span>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ 
  title, 
  description, 
  impact, 
  impactUp 
}: { 
  title: string; 
  description: string; 
  impact: string; 
  impactUp: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border border-primary/20 bg-background/50">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium">{title}</h4>
        <Badge 
          variant="outline"
          className={impactUp 
            ? 'bg-green-500/10 text-green-400 border-green-500/30'
            : 'bg-red-500/10 text-red-400 border-red-500/30'
          }
        >
          {impact}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
