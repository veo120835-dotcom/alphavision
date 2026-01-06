import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Zap, 
  Target, 
  Mail, 
  Clock, 
  AlertTriangle, 
  Phone, 
  FileCheck, 
  TrendingUp,
  Users,
  CheckCircle,
  Play,
  Settings,
  Loader2
} from 'lucide-react';

interface WorkflowTemplate {
  id: string;
  template_id: string;
  name: string;
  description: string;
  category: string;
  trigger_event: string;
  actions: any[];
  governance_config: any;
  learning_signals: string[];
  template_variables: Record<string, any>;
  priority: number;
  is_core_template: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  lead_intelligence: <Target className="h-5 w-5" />,
  outreach: <Mail className="h-5 w-5" />,
  conversion: <TrendingUp className="h-5 w-5" />,
  nurture: <Clock className="h-5 w-5" />,
  intelligence: <FileCheck className="h-5 w-5" />,
  sales: <Phone className="h-5 w-5" />,
  delivery: <Users className="h-5 w-5" />
};

const categoryColors: Record<string, string> = {
  lead_intelligence: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  outreach: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  conversion: 'bg-green-500/10 text-green-500 border-green-500/20',
  nurture: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  intelligence: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  sales: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  delivery: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
};

export function WorkflowTemplatesLibrary() {
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['workflow-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data as WorkflowTemplate[];
    }
  });

  const { data: deployedWorkflows } = useQuery({
    queryKey: ['deployed-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('name, trigger_config');
      
      if (error) throw error;
      return data;
    }
  });

  const deployMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: membership } = await supabase
        .from('memberships')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .single();

      if (!membership) throw new Error('No organization found');

      const response = await supabase.functions.invoke('provision-workspace', {
        body: {
          organization_id: membership.organization_id,
          template_ids: [templateId]
        }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Deployed ${data.provisioned} workflow(s) successfully`);
      queryClient.invalidateQueries({ queryKey: ['deployed-workflows'] });
    },
    onError: (error) => {
      toast.error(`Failed to deploy: ${error.message}`);
    }
  });

  const deployAllMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: membership } = await supabase
        .from('memberships')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .single();

      if (!membership) throw new Error('No organization found');

      const response = await supabase.functions.invoke('provision-workspace', {
        body: {
          organization_id: membership.organization_id
        }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Deployed ${data.provisioned} workflows, skipped ${data.skipped}`);
      queryClient.invalidateQueries({ queryKey: ['deployed-workflows'] });
    },
    onError: (error) => {
      toast.error(`Failed to deploy: ${error.message}`);
    }
  });

  const isTemplateDeployed = (templateName: string) => {
    return deployedWorkflows?.some(w => w.name === templateName);
  };

  const categories = ['all', ...new Set(templates?.map(t => t.category) || [])];
  
  const filteredTemplates = activeCategory === 'all' 
    ? templates 
    : templates?.filter(t => t.category === activeCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Templates</h2>
          <p className="text-muted-foreground">
            Pre-built automation workflows for your revenue engine
          </p>
        </div>
        <Button 
          onClick={() => deployAllMutation.mutate()}
          disabled={deployAllMutation.isPending}
        >
          {deployAllMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Deploy All Templates
        </Button>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
          {categories.map(category => (
            <TabsTrigger 
              key={category} 
              value={category}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {category === 'all' ? 'All' : category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates?.map(template => (
              <Card 
                key={template.id} 
                className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedTemplate(template)}
              >
                {isTemplateDeployed(template.name) && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Deployed
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${categoryColors[template.category] || 'bg-muted'}`}>
                      {categoryIcons[template.category] || <Zap className="h-5 w-5" />}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.template_id}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>Trigger: {template.trigger_event}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Settings className="h-4 w-4" />
                    <span>{template.actions?.length || 0} actions</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${categoryColors[selectedTemplate?.category || ''] || 'bg-muted'}`}>
                {categoryIcons[selectedTemplate?.category || ''] || <Zap className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle>{selectedTemplate?.name}</DialogTitle>
                <DialogDescription>{selectedTemplate?.template_id}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedTemplate?.description}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Trigger Event</h4>
                <Badge variant="outline">{selectedTemplate?.trigger_event}</Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2">Actions ({selectedTemplate?.actions?.length || 0})</h4>
                <div className="space-y-2">
                  {selectedTemplate?.actions?.map((action: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <span className="text-xs font-mono bg-background px-2 py-1 rounded">
                        {index + 1}
                      </span>
                      <span className="text-sm">{action.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTemplate?.learning_signals && selectedTemplate.learning_signals.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Learning Signals</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.learning_signals.map((signal: string, index: number) => (
                      <Badge key={index} variant="secondary">{signal}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedTemplate?.template_variables && Object.keys(selectedTemplate.template_variables).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Configurable Variables</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedTemplate.template_variables).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <span className="text-sm font-mono">{key}</span>
                        <span className="text-sm text-muted-foreground">
                          {JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                if (selectedTemplate) {
                  deployMutation.mutate(selectedTemplate.template_id);
                  setSelectedTemplate(null);
                }
              }}
              disabled={deployMutation.isPending || isTemplateDeployed(selectedTemplate?.name || '')}
            >
              {isTemplateDeployed(selectedTemplate?.name || '') ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Already Deployed
                </>
              ) : deployMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Deploy to Workspace
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WorkflowTemplatesLibrary;
