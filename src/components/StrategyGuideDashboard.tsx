import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Stethoscope, 
  Brain, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  History,
  Edit
} from 'lucide-react';

interface StrategyGuide {
  id: string;
  task_type: string;
  error_pattern: string | null;
  advice: string;
  confidence_score: number;
  times_applied: number;
  created_at: string;
  updated_at: string;
}

interface PromptVersion {
  id: string;
  agent_type: string;
  prompt_name: string;
  prompt_content: string;
  version: number;
  is_active: boolean;
  performance_score: number | null;
  created_at: string;
  activated_at: string | null;
  notes: string | null;
}

const TASK_TYPES = [
  'scrape_linkedin',
  'email_outreach',
  'dm_response',
  'content_generation',
  'lead_qualification',
  'appointment_booking',
  'payment_processing',
  'social_engagement',
  'trend_analysis',
  'other'
];

const AGENT_TYPES = [
  'orchestrator',
  'scout',
  'creator',
  'socialite',
  'closer'
];

export default function StrategyGuideDashboard() {
  const { organization } = useOrganization();
  const [guides, setGuides] = useState<StrategyGuide[]>([]);
  const [prompts, setPrompts] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskType, setSelectedTaskType] = useState<string>('all');
  const [newGuide, setNewGuide] = useState({ task_type: '', advice: '' });
  const [newPrompt, setNewPrompt] = useState({ agent_type: '', prompt_name: '', prompt_content: '', notes: '' });
  const [editingPrompt, setEditingPrompt] = useState<PromptVersion | null>(null);

  useEffect(() => {
    if (organization?.id) {
      loadData();
    }
  }, [organization?.id]);

  const loadData = async () => {
    if (!organization?.id) return;
    setLoading(true);

    const [guidesRes, promptsRes] = await Promise.all([
      supabase
        .from('strategy_guide')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('prompt_versions')
        .select('*')
        .eq('organization_id', organization.id)
        .order('agent_type', { ascending: true })
        .order('version', { ascending: false })
    ]);

    if (guidesRes.data) setGuides(guidesRes.data as StrategyGuide[]);
    if (promptsRes.data) setPrompts(promptsRes.data as PromptVersion[]);
    setLoading(false);
  };

  const addGuide = async () => {
    if (!organization?.id || !newGuide.task_type || !newGuide.advice) {
      toast.error('Please fill in all fields');
      return;
    }

    const { error } = await supabase.from('strategy_guide').insert({
      organization_id: organization.id,
      task_type: newGuide.task_type,
      advice: newGuide.advice,
      confidence_score: 1.0
    });

    if (error) {
      toast.error('Failed to add guide');
    } else {
      toast.success('Strategy guide added');
      setNewGuide({ task_type: '', advice: '' });
      loadData();
    }
  };

  const deleteGuide = async (id: string) => {
    const { error } = await supabase.from('strategy_guide').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete guide');
    } else {
      toast.success('Guide deleted');
      loadData();
    }
  };

  const addPromptVersion = async () => {
    if (!organization?.id || !newPrompt.agent_type || !newPrompt.prompt_name || !newPrompt.prompt_content) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Get the latest version for this agent
    const { data: existing } = await supabase
      .from('prompt_versions')
      .select('version')
      .eq('organization_id', organization.id)
      .eq('agent_type', newPrompt.agent_type)
      .eq('prompt_name', newPrompt.prompt_name)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1;

    const { error } = await supabase.from('prompt_versions').insert({
      organization_id: organization.id,
      agent_type: newPrompt.agent_type,
      prompt_name: newPrompt.prompt_name,
      prompt_content: newPrompt.prompt_content,
      notes: newPrompt.notes || null,
      version: nextVersion,
      is_active: false
    });

    if (error) {
      toast.error('Failed to add prompt version');
    } else {
      toast.success(`Prompt v${nextVersion} created`);
      setNewPrompt({ agent_type: '', prompt_name: '', prompt_content: '', notes: '' });
      loadData();
    }
  };

  const activatePrompt = async (prompt: PromptVersion) => {
    if (!organization?.id) return;

    // Deactivate all other prompts for this agent
    await supabase
      .from('prompt_versions')
      .update({ is_active: false })
      .eq('organization_id', organization.id)
      .eq('agent_type', prompt.agent_type);

    // Activate this one
    const { error } = await supabase
      .from('prompt_versions')
      .update({ is_active: true, activated_at: new Date().toISOString() })
      .eq('id', prompt.id);

    if (error) {
      toast.error('Failed to activate prompt');
    } else {
      toast.success(`${prompt.agent_type} prompt v${prompt.version} activated`);
      loadData();
    }
  };

  const rollbackPrompt = async (agentType: string) => {
    // Find the previous active version
    const agentPrompts = prompts.filter(p => p.agent_type === agentType).sort((a, b) => b.version - a.version);
    const activeIndex = agentPrompts.findIndex(p => p.is_active);
    
    if (activeIndex < agentPrompts.length - 1) {
      const previousVersion = agentPrompts[activeIndex + 1];
      await activatePrompt(previousVersion);
      toast.success(`Rolled back to v${previousVersion.version}`);
    } else {
      toast.error('No previous version to rollback to');
    }
  };

  const filteredGuides = selectedTaskType === 'all' 
    ? guides 
    : guides.filter(g => g.task_type === selectedTaskType);

  const groupedPrompts = AGENT_TYPES.reduce((acc, type) => {
    acc[type] = prompts.filter(p => p.agent_type === type);
    return acc;
  }, {} as Record<string, PromptVersion[]>);

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-400';
    if (score >= 0.7) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" />
            Self-Healing System
          </h2>
          <p className="text-muted-foreground">Strategy guides & prompt versioning</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="strategies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="strategies" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Strategy Guides ({guides.length})
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Prompt Versions ({prompts.length})
          </TabsTrigger>
        </TabsList>

        {/* Strategy Guides Tab */}
        <TabsContent value="strategies" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                {TASK_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Strategy Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={newGuide.task_type} onValueChange={(v) => setNewGuide({ ...newGuide, task_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="When [condition], always [action]..."
                    value={newGuide.advice}
                    onChange={(e) => setNewGuide({ ...newGuide, advice: e.target.value })}
                    rows={3}
                  />
                  <Button onClick={addGuide} className="w-full">Save Rule</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredGuides.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No strategy guides yet</p>
                    <p className="text-sm">Rules will be auto-generated when agents fail</p>
                  </CardContent>
                </Card>
              ) : (
                filteredGuides.map((guide) => (
                  <Card key={guide.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{guide.task_type.replace('_', ' ')}</Badge>
                            <span className={`text-sm ${getConfidenceColor(guide.confidence_score)}`}>
                              {(guide.confidence_score * 100).toFixed(0)}% confidence
                            </span>
                            {guide.times_applied > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Applied {guide.times_applied}x
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{guide.advice}</p>
                          {guide.error_pattern && (
                            <p className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                              Error: {guide.error_pattern.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGuide(guide.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Prompt Versions Tab */}
        <TabsContent value="prompts" className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Prompt Version
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Prompt Version</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select value={newPrompt.agent_type} onValueChange={(v) => setNewPrompt({ ...newPrompt, agent_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Prompt name (e.g., main_system_prompt)"
                    value={newPrompt.prompt_name}
                    onChange={(e) => setNewPrompt({ ...newPrompt, prompt_name: e.target.value })}
                  />
                </div>
                <Textarea
                  placeholder="Enter the prompt content..."
                  value={newPrompt.prompt_content}
                  onChange={(e) => setNewPrompt({ ...newPrompt, prompt_content: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                />
                <Input
                  placeholder="Notes (optional)"
                  value={newPrompt.notes}
                  onChange={(e) => setNewPrompt({ ...newPrompt, notes: e.target.value })}
                />
                <Button onClick={addPromptVersion} className="w-full">Save Version</Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AGENT_TYPES.map(agentType => {
              const agentPrompts = groupedPrompts[agentType] || [];
              const activePrompt = agentPrompts.find(p => p.is_active);

              return (
                <Card key={agentType}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="capitalize">{agentType}</span>
                      {activePrompt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rollbackPrompt(agentType)}
                        >
                          <History className="w-3 h-3 mr-1" />
                          Rollback
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {agentPrompts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No prompts configured</p>
                    ) : (
                      <div className="space-y-2">
                        {agentPrompts.slice(0, 3).map(prompt => (
                          <div
                            key={prompt.id}
                            className={`p-2 rounded border ${prompt.is_active ? 'border-green-500 bg-green-500/10' : 'border-border'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {prompt.is_active && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                <span className="font-medium text-sm">v{prompt.version}</span>
                                <span className="text-xs text-muted-foreground">{prompt.prompt_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {prompt.performance_score && (
                                  <Badge variant="outline" className="text-xs">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    {(prompt.performance_score * 100).toFixed(0)}%
                                  </Badge>
                                )}
                                {!prompt.is_active && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => activatePrompt(prompt)}
                                  >
                                    Activate
                                  </Button>
                                )}
                              </div>
                            </div>
                            {prompt.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{prompt.notes}</p>
                            )}
                          </div>
                        ))}
                        {agentPrompts.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{agentPrompts.length - 3} more versions
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
