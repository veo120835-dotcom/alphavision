import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Factory, Package, FileText, Mail, Workflow, 
  BookOpen, Plus, Download, Star, Users, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

export function AssetFactory() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: templates } = useQuery({
    queryKey: ['platform-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_templates')
        .select('*')
        .eq('is_system', true)
        .order('popularity', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: myAssets } = useQuery({
    queryKey: ['my-assets', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { workflows: 0, emails: 0, forms: 0, courses: 0 };
      
      const [workflows, emails, forms, courses] = await Promise.all([
        supabase.from('automation_workflows').select('id', { count: 'exact' }).eq('organization_id', organization.id),
        supabase.from('email_templates').select('id', { count: 'exact' }).eq('organization_id', organization.id),
        supabase.from('forms').select('id', { count: 'exact' }).eq('organization_id', organization.id),
        supabase.from('courses').select('id', { count: 'exact' }).eq('organization_id', organization.id),
      ]);
      
      return {
        workflows: workflows.count || 0,
        emails: emails.count || 0,
        forms: forms.count || 0,
        courses: courses.count || 0,
      };
    },
    enabled: !!organization?.id,
  });

  const deployTemplate = useMutation({
    mutationFn: async (template: any) => {
      if (!organization?.id) throw new Error('No organization');
      
      // Record deployment
      const { error } = await supabase.from('template_deployments').insert({
        organization_id: organization.id,
        template_id: template.id,
        deployed_entity_type: template.category,
        deployed_entity_id: crypto.randomUUID(),
      });
      if (error) throw error;
      
      // Update popularity
      await supabase.from('platform_templates')
        .update({ popularity: (template.popularity || 0) + 1 })
        .eq('id', template.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-templates'] });
      toast.success('Template deployed successfully');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const groupedTemplates = templates?.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, any[]>);

  const CATEGORY_ICONS: Record<string, any> = {
    workflow: Workflow,
    campaign: Mail,
    form: FileText,
    email: Mail,
    course: BookOpen,
    pipeline: Users,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Factory</h1>
          <p className="text-muted-foreground">Deploy templates and manage revenue-generating assets</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Asset
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Workflow className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myAssets?.workflows || 0}</p>
                <p className="text-sm text-muted-foreground">Workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Mail className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myAssets?.emails || 0}</p>
                <p className="text-sm text-muted-foreground">Email Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myAssets?.forms || 0}</p>
                <p className="text-sm text-muted-foreground">Forms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <BookOpen className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myAssets?.courses || 0}</p>
                <p className="text-sm text-muted-foreground">Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="marketplace">
        <TabsList>
          <TabsTrigger value="marketplace">Template Marketplace</TabsTrigger>
          <TabsTrigger value="create">Convert to Asset</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          {Object.entries(groupedTemplates || {}).map(([category, categoryTemplates]) => {
            const Icon = CATEGORY_ICONS[category] || Package;
            return (
              <div key={category}>
                <h3 className="font-semibold mb-3 capitalize flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {category} Templates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTemplates.map((template: any) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          {template.niche && (
                            <Badge variant="outline" className="capitalize">{template.niche}</Badge>
                          )}
                        </div>
                        <h4 className="font-semibold mb-1">{template.name}</h4>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="h-3 w-3" />
                            {template.popularity || 0} deploys
                          </div>
                          <Button size="sm" onClick={() => deployTemplate.mutate(template)}>
                            <Download className="h-4 w-4 mr-1" />
                            Deploy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
          {!Object.keys(groupedTemplates || {}).length && (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No templates available</h3>
                <p className="text-muted-foreground">Templates will appear here as they're created</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Convert Success to Assets</CardTitle>
              <CardDescription>
                Turn your successful workflows, sequences, and content into sellable templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Workflow className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Successful Workflows</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Convert your best-performing automation workflows into templates
                  </p>
                  <Button variant="outline" size="sm">
                    View Candidates
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Email Sequences</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Package high-converting email sequences as templates
                  </p>
                  <Button variant="outline" size="sm">
                    View Candidates
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Call Transcripts → Courses</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Transform sales call insights into training courses
                  </p>
                  <Button variant="outline" size="sm">
                    Analyze Calls
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Objection Handling</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create email sequences from common objection patterns
                  </p>
                  <Button variant="outline" size="sm">
                    Generate Sequences
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}