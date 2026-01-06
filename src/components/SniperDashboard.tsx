import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Search,
  Mail,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TrendingUp,
  Building2,
  Clock,
  Zap,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Edit3,
  Trash2,
  Radar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface NewsSignal {
  id: string;
  company_name: string;
  signal_type: string;
  headline: string;
  summary: string | null;
  source_url: string | null;
  relevance_score: number | null;
  outreach_status: string | null;
  draft_email: string | null;
  created_at: string;
  detected_at: string;
}

const SIGNAL_ICONS: Record<string, string> = {
  funding: '💰',
  hiring: '👥',
  product_launch: '🚀',
  leadership_change: '👔',
  general: '📰',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  drafted: 'bg-blue-500/20 text-blue-400',
  sent: 'bg-green-500/20 text-green-400',
  replied: 'bg-purple-500/20 text-purple-400',
  ignored: 'bg-muted text-muted-foreground',
};

export function SniperDashboard() {
  const { organization } = useOrganization();
  const [signals, setSignals] = useState<NewsSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<NewsSignal | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [industryNiche, setIndustryNiche] = useState("SaaS startups");
  const [triggerEvent, setTriggerEvent] = useState("recently raised funding");

  useEffect(() => {
    if (organization?.id) {
      fetchSignals();
    }
  }, [organization?.id]);

  const fetchSignals = async () => {
    if (!organization?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('news_signals')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching signals:', error);
    } else {
      setSignals(data || []);
    }
    setLoading(false);
  };

  const scanForSignals = async (mode: 'fetch_news' | 'exa_search') => {
    if (!organization?.id) return;
    setScanning(true);

    try {
      const { data, error } = await supabase.functions.invoke('sniper-outreach', {
        body: {
          organizationId: organization.id,
          mode,
          niche: industryNiche,
          triggerEvent: triggerEvent,
          searchQuery: `${industryNiche} ${triggerEvent}`,
          industry: 'technology'
        }
      });

      if (error) throw error;

      toast.success(`Found ${data.signals_fetched || 0} new targets!`);
      fetchSignals();
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to scan for signals');
    } finally {
      setScanning(false);
    }
  };

  const draftEmail = async (signalId: string) => {
    if (!organization?.id) return;
    setDrafting(signalId);

    try {
      const { data, error } = await supabase.functions.invoke('sniper-outreach', {
        body: {
          organizationId: organization.id,
          mode: 'draft',
          signalId
        }
      });

      if (error) throw error;

      toast.success('Email drafted successfully!');
      fetchSignals();
    } catch (error) {
      console.error('Draft error:', error);
      toast.error('Failed to draft email');
    } finally {
      setDrafting(null);
    }
  };

  const batchDraft = async () => {
    if (!organization?.id) return;
    setScanning(true);

    try {
      const { data, error } = await supabase.functions.invoke('sniper-outreach', {
        body: {
          organizationId: organization.id,
          mode: 'batch'
        }
      });

      if (error) throw error;

      toast.success(`Drafted ${data.processed || 0} emails!`);
      fetchSignals();
    } catch (error) {
      console.error('Batch error:', error);
      toast.error('Failed to batch draft');
    } finally {
      setScanning(false);
    }
  };

  const openEmailPreview = (signal: NewsSignal) => {
    setSelectedSignal(signal);
    setEditedEmail(signal.draft_email || '');
    setPreviewOpen(true);
  };

  const updateSignalStatus = async (signalId: string, status: string) => {
    await supabase
      .from('news_signals')
      .update({ outreach_status: status })
      .eq('id', signalId);
    
    setSignals(prev => prev.map(s => 
      s.id === signalId ? { ...s, outreach_status: status } : s
    ));
  };

  const sendEmail = async () => {
    if (!selectedSignal || !organization?.id) return;

    // Update the draft and mark as sent
    await supabase
      .from('news_signals')
      .update({ 
        draft_email: editedEmail,
        outreach_status: 'sent'
      })
      .eq('id', selectedSignal.id);

    toast.success('Email marked as sent! (Connect Gmail to auto-send)');
    setPreviewOpen(false);
    fetchSignals();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Filter signals
  const filteredSignals = signals.filter(s => {
    if (filterStatus !== 'all' && s.outreach_status !== filterStatus) return false;
    if (filterType !== 'all' && s.signal_type !== filterType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        s.company_name.toLowerCase().includes(query) ||
        s.headline.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    total: signals.length,
    pending: signals.filter(s => s.outreach_status === 'pending').length,
    drafted: signals.filter(s => s.outreach_status === 'drafted').length,
    sent: signals.filter(s => s.outreach_status === 'sent').length,
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold gradient-text flex items-center gap-3">
            <Radar className="w-8 h-8" />
            Sniper Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Hunt for high-intent targets with AI-powered signal detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchSignals} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Signals</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Target className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drafted</p>
                <p className="text-2xl font-bold text-blue-400">{stats.drafted}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold text-green-400">{stats.sent}</p>
              </div>
              <Send className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hunt Controls */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-primary" />
            The Hunter - Scan for Money Signals
          </CardTitle>
          <CardDescription>
            Configure your target and trigger to find high-intent prospects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Industry/Niche</label>
              <Input
                value={industryNiche}
                onChange={(e) => setIndustryNiche(e.target.value)}
                placeholder="e.g., SaaS startups, Office furniture, HR software"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Trigger Event</label>
              <Input
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                placeholder="e.g., recently raised funding, hiring VP of Sales"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => scanForSignals('exa_search')}
              disabled={scanning}
              className="flex-1"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Neural Search (Exa.ai)
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => scanForSignals('fetch_news')}
              disabled={scanning}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Quick Scan
            </Button>
            <Button
              variant="secondary"
              onClick={batchDraft}
              disabled={scanning || stats.pending === 0}
            >
              <Mail className="w-4 h-4 mr-2" />
              Draft All ({stats.pending})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Signals Table */}
      <Card className="card-glow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Detected Signals</CardTitle>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="drafted">Drafted</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="funding">Funding</SelectItem>
                  <SelectItem value="hiring">Hiring</SelectItem>
                  <SelectItem value="product_launch">Launch</SelectItem>
                  <SelectItem value="leadership_change">Leadership</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSignals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Target className="w-12 h-12 mb-3 opacity-50" />
                <p>No signals found. Start hunting!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredSignals.map((signal, idx) => (
                    <motion.div
                      key={signal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.02 }}
                      className="p-4 rounded-lg border border-border hover:border-primary/30 transition-all bg-card"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl">
                            {SIGNAL_ICONS[signal.signal_type] || '📰'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold truncate">
                                {signal.company_name}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {signal.signal_type.replace('_', ' ')}
                              </Badge>
                              {signal.relevance_score && (
                                <Badge className="text-xs bg-primary/20 text-primary">
                                  {Math.round(signal.relevance_score * 100)}% match
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {signal.headline}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{format(new Date(signal.detected_at), 'MMM d, yyyy')}</span>
                              {signal.source_url && (
                                <a 
                                  href={signal.source_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 hover:text-primary"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Source
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Badge className={STATUS_COLORS[signal.outreach_status || 'pending']}>
                            {signal.outreach_status || 'pending'}
                          </Badge>

                          {signal.outreach_status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => draftEmail(signal.id)}
                              disabled={drafting === signal.id}
                            >
                              {drafting === signal.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Edit3 className="w-4 h-4 mr-1" />
                                  Draft
                                </>
                              )}
                            </Button>
                          )}

                          {signal.draft_email && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEmailPreview(signal)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => updateSignalStatus(signal.id, 'ignored')}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Ignore
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateSignalStatus(signal.id, 'replied')}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Mark Replied
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Email Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email to {selectedSignal?.company_name}
            </DialogTitle>
            <DialogDescription>
              Review and edit before sending
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedSignal && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-1">Signal: {selectedSignal.headline}</p>
                <p className="text-muted-foreground">{selectedSignal.summary}</p>
              </div>
            )}

            <Textarea
              value={editedEmail}
              onChange={(e) => setEditedEmail(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="Email content will appear here..."
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => copyToClipboard(editedEmail)}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendEmail}>
              <Send className="w-4 h-4 mr-2" />
              Mark as Sent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}