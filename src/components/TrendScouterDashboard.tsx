import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  TrendingUp, 
  Zap, 
  Globe, 
  Hash, 
  RefreshCw,
  Sparkles,
  ExternalLink,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface DiscoveredTrend {
  id: string;
  topic: string;
  source: string | null;
  relevance_score: number | null;
  status: string;
  metadata: unknown;
  discovered_at: string;
}

const TREND_SOURCES = [
  { id: 'twitter', name: 'X/Twitter', icon: Hash },
  { id: 'tiktok', name: 'TikTok', icon: Sparkles },
  { id: 'google', name: 'Google Trends', icon: Globe },
  { id: 'reddit', name: 'Reddit', icon: Target },
];

export function TrendScouterDashboard() {
  const { organization } = useOrganization();
  const [trends, setTrends] = useState<DiscoveredTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  useEffect(() => {
    if (organization?.id) {
      fetchTrends();

      const channel = supabase
        .channel('trend-scout-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trend_topics',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setTrends(prev => [payload.new as DiscoveredTrend, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setTrends(prev => 
                prev.map(t => t.id === (payload.new as DiscoveredTrend).id ? payload.new as DiscoveredTrend : t)
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [organization?.id]);

  const fetchTrends = async () => {
    if (!organization?.id) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('trend_topics')
      .select('*')
      .eq('organization_id', organization.id)
      .order('discovered_at', { ascending: false })
      .limit(50);

    if (data) setTrends(data);
    setLoading(false);
  };

  const simulateTrendScan = async () => {
    if (!organization?.id) return;
    setScanning(true);

    const mockTrends = [
      { topic: 'AI Video Editing Tools 2025', source: 'tiktok', relevance_score: 92 },
      { topic: 'Remote Work Productivity Hacks', source: 'twitter', relevance_score: 87 },
      { topic: 'No-Code App Development', source: 'google', relevance_score: 85 },
      { topic: 'Side Hustle Tax Tips', source: 'reddit', relevance_score: 78 },
    ];

    try {
      const newTrends = mockTrends.map(t => ({
        organization_id: organization.id,
        topic: t.topic,
        source: t.source,
        relevance_score: t.relevance_score,
        status: 'new',
        metadata: { auto_discovered: true, scan_batch: Date.now() }
      }));

      await supabase.from('trend_topics').insert(newTrends);
      toast.success(`Discovered ${mockTrends.length} new trends!`);
      fetchTrends();
    } catch (error) {
      toast.error('Failed to scan for trends');
    } finally {
      setScanning(false);
    }
  };

  const markTrendUsed = async (trendId: string) => {
    await supabase
      .from('trend_topics')
      .update({ status: 'used', last_used_at: new Date().toISOString() })
      .eq('id', trendId);
    
    fetchTrends();
    toast.success('Trend marked as used');
  };

  const getRelevanceColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return { color: 'bg-blue-500/20 text-blue-400', label: 'New' };
      case 'used': return { color: 'bg-purple-500/20 text-purple-400', label: 'Used' };
      case 'expired': return { color: 'bg-muted text-muted-foreground', label: 'Expired' };
      default: return { color: 'bg-muted text-muted-foreground', label: status };
    }
  };

  const filteredTrends = trends.filter(t => {
    const matchesSearch = !searchQuery || t.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = !selectedSource || t.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  const newTrendsCount = trends.filter(t => t.status === 'new').length;
  const avgRelevance = trends.length > 0 
    ? Math.round(trends.reduce((sum, t) => sum + (t.relevance_score || 0), 0) / trends.length) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Trend Scouter</h2>
          <p className="text-muted-foreground">AI-powered trend discovery for your niche</p>
        </div>
        <Button onClick={simulateTrendScan} disabled={scanning}>
          {scanning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Scan Now
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trends.length}</p>
                <p className="text-sm text-muted-foreground">Total Trends</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Sparkles className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{newTrendsCount}</p>
                <p className="text-sm text-muted-foreground">New Trends</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgRelevance}%</p>
                <p className="text-sm text-muted-foreground">Avg Relevance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">Live</p>
                <p className="text-sm text-muted-foreground">Auto-Refresh</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search trends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedSource === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSource(null)}
          >
            All
          </Button>
          {TREND_SOURCES.map(source => (
            <Button
              key={source.id}
              variant={selectedSource === source.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSource(source.id)}
            >
              <source.icon className="w-4 h-4 mr-1" />
              {source.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Trends List */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Discovered Trends
          </CardTitle>
          <CardDescription>
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Real-time updates enabled
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              <AnimatePresence>
                {filteredTrends.map((trend, idx) => {
                  const statusBadge = getStatusBadge(trend.status);
                  const sourceInfo = TREND_SOURCES.find(s => s.id === trend.source);
                  const SourceIcon = sourceInfo?.icon || Globe;

                  return (
                    <motion.div
                      key={trend.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: idx * 0.02 }}
                      className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{trend.topic}</h4>
                            <Badge className={statusBadge.color} variant="secondary">
                              {statusBadge.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <SourceIcon className="w-3 h-3" />
                              {sourceInfo?.name || trend.source}
                            </span>
                            <span className={`flex items-center gap-1 ${getRelevanceColor(trend.relevance_score)}`}>
                              <Target className="w-3 h-3" />
                              {trend.relevance_score}% relevance
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(trend.discovered_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {trend.status === 'new' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markTrendUsed(trend.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Use
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <Zap className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={trend.relevance_score || 0} className="h-1" />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredTrends.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No trends found</p>
                  <p className="text-sm">Click "Scan Now" to discover trending topics</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
