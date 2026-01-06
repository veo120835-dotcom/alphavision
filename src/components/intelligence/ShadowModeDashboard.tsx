import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ghost, Upload, Wand2, MessageSquare, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export function ShadowModeDashboard() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [sampleText, setSampleText] = useState('');
  const [sampleType, setSampleType] = useState<'email' | 'zoom_transcript' | 'chat'>('email');
  const [testInput, setTestInput] = useState('');
  const [styledOutput, setStyledOutput] = useState('');

  const { data: styleVector, isLoading } = useQuery({
    queryKey: ['style-vector', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('style_vectors')
        .select('*')
        .eq('organization_id', organization.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!organization?.id
  });

  const { data: samples } = useQuery({
    queryKey: ['style-samples', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('style_training_samples')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id
  });

  const ingestMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id || !sampleText.trim()) {
        throw new Error('Missing organization or sample text');
      }

      const { data, error } = await supabase.functions.invoke('shadow-mode-trainer', {
        body: {
          action: 'ingest_samples',
          organization_id: organization.id,
          samples: sampleText.split('\n---\n').filter(s => s.trim()),
          sample_type: sampleType
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Added ${data.samples_added} samples`);
      setSampleText('');
      queryClient.invalidateQueries({ queryKey: ['style-samples'] });
    },
    onError: (error) => {
      toast.error('Failed to add samples: ' + error.message);
    }
  });

  const processMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('shadow-mode-trainer', {
        body: {
          action: 'process_samples',
          organization_id: organization.id
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Style vector updated');
      queryClient.invalidateQueries({ queryKey: ['style-vector'] });
      queryClient.invalidateQueries({ queryKey: ['style-samples'] });
    },
    onError: (error) => {
      toast.error('Failed to process: ' + error.message);
    }
  });

  const applyStyleMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id || !testInput.trim()) {
        throw new Error('Missing input');
      }

      const { data, error } = await supabase.functions.invoke('shadow-mode-trainer', {
        body: {
          action: 'apply_style',
          organization_id: organization.id,
          content: testInput
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setStyledOutput(data.styled_content);
      if (!data.applied) {
        toast.info('No style vector found - showing original');
      }
    },
    onError: (error) => {
      toast.error('Failed to apply style: ' + error.message);
    }
  });

  const processedCount = samples?.filter(s => s.processed).length || 0;
  const pendingCount = samples?.filter(s => !s.processed).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ghost className="h-8 w-8 text-primary" />
            Shadow Mode
          </h1>
          <p className="text-muted-foreground mt-1">
            Clone your writing style. AI outputs that sound exactly like you.
          </p>
        </div>
        <Button 
          onClick={() => processMutation.mutate()}
          disabled={processMutation.isPending || pendingCount === 0}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${processMutation.isPending ? 'animate-spin' : ''}`} />
          Process Samples ({pendingCount})
        </Button>
      </div>

      {/* Style Vector Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {styleVector ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            Style Vector Status
          </CardTitle>
          <CardDescription>
            {styleVector 
              ? `Trained on ${styleVector.sample_count} samples` 
              : 'Add samples to train your style vector'}
          </CardDescription>
        </CardHeader>
        {styleVector && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Formality</p>
                <div className="flex items-center gap-2">
                  <Progress value={(styleVector.formality_score || 0.5) * 100} className="flex-1" />
                  <span className="text-sm">{((styleVector.formality_score || 0.5) * 100).toFixed(0)}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(styleVector.formality_score || 0.5) > 0.7 ? 'Formal' : (styleVector.formality_score || 0.5) < 0.3 ? 'Casual' : 'Balanced'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sentence Length</p>
                <p className="text-xl font-bold">{styleVector.sentence_length_avg?.toFixed(0) || '?'}</p>
                <p className="text-xs text-muted-foreground">avg words</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Greeting Style</p>
                <p className="font-medium">{styleVector.greeting_style || 'Not detected'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closing Style</p>
                <p className="font-medium">{styleVector.closing_style || 'Not detected'}</p>
              </div>
            </div>

            {(styleVector.signature_phrases as string[])?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Signature Phrases</p>
                <div className="flex flex-wrap gap-2">
                  {(styleVector.signature_phrases as string[]).map((phrase, i) => (
                    <Badge key={i} variant="secondary">{phrase}</Badge>
                  ))}
                </div>
              </div>
            )}

            {(styleVector.tone_keywords as string[])?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Tone Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {(styleVector.tone_keywords as string[]).map((keyword, i) => (
                    <Badge key={i} variant="outline">{keyword}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="ingest">
        <TabsList>
          <TabsTrigger value="ingest">Add Samples</TabsTrigger>
          <TabsTrigger value="test">Test Style</TabsTrigger>
          <TabsTrigger value="history">Sample History</TabsTrigger>
        </TabsList>

        <TabsContent value="ingest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Training Samples
              </CardTitle>
              <CardDescription>
                Paste emails, Zoom transcripts, or chat messages. Use "---" to separate multiple samples.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge 
                  variant={sampleType === 'email' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSampleType('email')}
                >
                  Email
                </Badge>
                <Badge 
                  variant={sampleType === 'zoom_transcript' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSampleType('zoom_transcript')}
                >
                  Zoom Transcript
                </Badge>
                <Badge 
                  variant={sampleType === 'chat' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSampleType('chat')}
                >
                  Chat Messages
                </Badge>
              </div>

              <Textarea
                placeholder={`Paste your ${sampleType} samples here...\n\nSeparate multiple samples with ---\n\nExample:\nHey John, thanks for reaching out! Really appreciate you taking the time...\n---\nHi Sarah, quick follow-up on our call yesterday...`}
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />

              <Button 
                onClick={() => ingestMutation.mutate()}
                disabled={ingestMutation.isPending || !sampleText.trim()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Samples
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Test Your Style
              </CardTitle>
              <CardDescription>
                Enter generic text and see it transformed to your voice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Original Text</p>
                <Textarea
                  placeholder="Enter text to transform..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button 
                onClick={() => applyStyleMutation.mutate()}
                disabled={applyStyleMutation.isPending || !testInput.trim() || !styleVector}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Apply My Style
              </Button>

              {styledOutput && (
                <div>
                  <p className="text-sm font-medium mb-2">Styled Output</p>
                  <div className="bg-muted p-4 rounded-md">
                    {styledOutput}
                  </div>
                </div>
              )}

              {!styleVector && (
                <p className="text-sm text-muted-foreground">
                  Add and process samples first to enable style transformation.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4">
            {samples?.map(sample => (
              <Card key={sample.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{sample.sample_type}</Badge>
                        <Badge variant={sample.processed ? 'default' : 'secondary'}>
                          {sample.processed ? 'Processed' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm line-clamp-3">{sample.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sample.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {samples?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No samples yet. Add some in the "Add Samples" tab.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
