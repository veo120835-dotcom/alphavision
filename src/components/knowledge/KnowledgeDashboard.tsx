import { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Globe, 
  FileText, 
  Zap, 
  RefreshCw, 
  Search,
  DollarSign,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface KnowledgeItem {
  id: string;
  content: string;
  content_type: string | null;
  title: string | null;
  source_url: string | null;
  importance_score: number | null;
  is_revenue_critical: boolean | null;
  extracted_entities: unknown;
  created_at: string;
}

interface IngestionJob {
  id: string;
  job_type: string;
  source_url: string | null;
  status: string;
  pages_found: number;
  pages_processed: number;
  chunks_created: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export function KnowledgeDashboard() {
  const { organization } = useOrganization();
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchData();
    }
  }, [organization?.id]);

  async function fetchData() {
    if (!organization?.id) return;
    
    setLoading(true);
    
    const [knowledgeRes, jobsRes] = await Promise.all([
      supabase
        .from('org_knowledge')
        .select('*')
        .eq('organization_id', organization.id)
        .order('importance_score', { ascending: false })
        .limit(100),
      supabase
        .from('knowledge_ingestion_jobs')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    if (knowledgeRes.data) setKnowledge(knowledgeRes.data);
    if (jobsRes.data) setJobs(jobsRes.data);
    
    setLoading(false);
  }

  async function startIngestion() {
    if (!organization?.id || !websiteUrl) {
      toast.error('Please enter a website URL');
      return;
    }

    setIngesting(true);

    try {
      // Create job record
      const { data: job, error: jobError } = await supabase
        .from('knowledge_ingestion_jobs')
        .insert({
          organization_id: organization.id,
          job_type: 'website_crawl',
          source_url: websiteUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Start ingestion
      const response = await supabase.functions.invoke('knowledge-ingest', {
        body: {
          organization_id: organization.id,
          website_url: websiteUrl,
          job_id: job.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(`Knowledge ingestion complete! ${response.data.chunks_created} chunks created.`);
      fetchData();
      setWebsiteUrl('');
    } catch (error: any) {
      console.error('Ingestion error:', error);
      toast.error(error.message || 'Failed to ingest knowledge');
    } finally {
      setIngesting(false);
    }
  }

  async function searchKnowledge() {
    if (!organization?.id || !searchQuery) return;

    setSearching(true);

    try {
      const response = await supabase.functions.invoke('knowledge-search', {
        body: {
          organization_id: organization.id,
          query: searchQuery,
          limit: 10
        }
      });

      if (response.error) throw new Error(response.error.message);
      
      setSearchResults(response.data.results || []);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  }

  const stats = {
    total: knowledge.length,
    revenueCritical: knowledge.filter(k => k.is_revenue_critical).length,
    avgImportance: knowledge.length > 0 
      ? (knowledge.reduce((sum, k) => sum + Number(k.importance_score), 0) / knowledge.length * 100).toFixed(0)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground">
            Your AI's brain - ingested from your website and documents
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Knowledge Chunks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.revenueCritical}</p>
                <p className="text-sm text-muted-foreground">Revenue-Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgImportance}%</p>
                <p className="text-sm text-muted-foreground">Avg Importance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ingest" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ingest">Ingest Knowledge</TabsTrigger>
          <TabsTrigger value="search">Search & Test</TabsTrigger>
          <TabsTrigger value="browse">Browse All</TabsTrigger>
          <TabsTrigger value="jobs">Ingestion Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="ingest">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Website Ingestion
              </CardTitle>
              <CardDescription>
                Crawl your website and automatically extract knowledge for your AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="https://yourwebsite.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={startIngestion} disabled={ingesting}>
                  {ingesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Ingesting...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Start Brain Transplant
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This will crawl your website, extract content, generate embeddings, and store 
                everything in your AI's knowledge base. Revenue-critical content (pricing, services) 
                will be automatically prioritized.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Test Knowledge Retrieval
              </CardTitle>
              <CardDescription>
                Test how your AI retrieves knowledge for different questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Ask a question to test retrieval..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchKnowledge()}
                  className="flex-1"
                />
                <Button onClick={searchKnowledge} disabled={searching}>
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h4 className="font-medium">Retrieved Knowledge:</h4>
                  {searchResults.map((result, idx) => (
                    <Card key={result.id || idx} className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm">{result.content?.substring(0, 300)}...</p>
                          <div className="flex flex-col gap-1">
                            {result.is_revenue_critical && (
                              <Badge variant="default" className="bg-green-500">Revenue</Badge>
                            )}
                            <Badge variant="outline">{(result.importance_score * 100).toFixed(0)}%</Badge>
                          </div>
                        </div>
                        {result.source_url && (
                          <a 
                            href={result.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground flex items-center gap-1 mt-2 hover:text-primary"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {result.source_url}
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse">
          <Card>
            <CardHeader>
              <CardTitle>All Knowledge</CardTitle>
              <CardDescription>Browse all ingested knowledge chunks</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {knowledge.map((item) => (
                    <Card key={item.id} className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{item.content_type}</Badge>
                              {item.is_revenue_critical && (
                                <Badge className="bg-green-500">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  Revenue
                                </Badge>
                              )}
                              {item.title && (
                                <span className="text-sm font-medium">{item.title}</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.content.substring(0, 200)}...
                            </p>
                            {item.source_url && (
                              <a 
                                href={item.source_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary flex items-center gap-1 mt-2"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {item.source_url}
                              </a>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              {(Number(item.importance_score) * 100).toFixed(0)}%
                            </div>
                            <p className="text-xs text-muted-foreground">importance</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {knowledge.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No knowledge ingested yet</p>
                      <p className="text-sm">Start by crawling your website</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Ingestion Jobs</CardTitle>
              <CardDescription>History of knowledge ingestion jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs.map((job) => (
                  <Card key={job.id} className="bg-muted/30">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {job.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                          {job.status === 'processing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                          {job.status === 'pending' && <Clock className="w-5 h-5 text-yellow-500" />}
                          {job.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-500" />}
                          <div>
                            <p className="font-medium">{job.source_url}</p>
                            <p className="text-sm text-muted-foreground">
                              {job.pages_processed} pages • {job.chunks_created} chunks
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          job.status === 'completed' ? 'default' :
                          job.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                      {job.error_message && (
                        <p className="text-sm text-red-500 mt-2">{job.error_message}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {jobs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No ingestion jobs yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}