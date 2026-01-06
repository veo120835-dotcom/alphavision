import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, Workflow, Mail, FileText, BookOpen, 
  Users, Download, Star, Search, Plus
} from 'lucide-react';
import { toast } from 'sonner';

export function TemplateLibrary() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: templates, isLoading } = useQuery({
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

  const { data: deployments } = useQuery({
    queryKey: ['template-deployments', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('template_deployments')
        .select('template_id')
        .eq('organization_id', organization.id);
      if (error) throw error;
      return data?.map(d => d.template_id) || [];
    },
    enabled: !!organization?.id,
  });

  const deployTemplate = useMutation({
    mutationFn: async (template: any) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { error } = await supabase.from('template_deployments').insert({
        organization_id: organization.id,
        template_id: template.id,
        deployed_entity_type: template.category,
        deployed_entity_id: crypto.randomUUID(),
      });
      if (error) throw error;
      
      await supabase.from('platform_templates')
        .update({ popularity: (template.popularity || 0) + 1 })
        .eq('id', template.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-deployments'] });
      queryClient.invalidateQueries({ queryKey: ['platform-templates'] });
      toast.success('Template deployed');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const CATEGORY_ICONS: Record<string, any> = {
    workflow: Workflow,
    campaign: Mail,
    form: FileText,
    email: Mail,
    course: BookOpen,
    pipeline: Users,
  };

  const categories = [...new Set(templates?.map(t => t.category) || [])];

  const filteredTemplates = templates?.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                          t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Template Library</h1>
          <p className="text-muted-foreground">Pre-built templates for quick deployment</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize">{cat}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
          ) : !filteredTemplates?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const Icon = CATEGORY_ICONS[template.category] || Package;
                const isDeployed = deployments?.includes(template.id);
                
                return (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                          {template.niche && (
                            <Badge variant="outline" className="capitalize text-xs">{template.niche}</Badge>
                          )}
                          <Badge variant="outline" className="capitalize">{template.category}</Badge>
                        </div>
                      </div>
                      <h3 className="font-semibold mb-1">{template.name}</h3>
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
                        {isDeployed ? (
                          <Badge variant="secondary">Deployed</Badge>
                        ) : (
                          <Button size="sm" onClick={() => deployTemplate.mutate(template)}>
                            <Download className="h-4 w-4 mr-1" />
                            Deploy
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Quick Deploy Packs</CardTitle>
          <CardDescription>Deploy multiple templates at once for complete setups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🏠 Real Estate Pack</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Workflows, emails, and forms for real estate agents
              </p>
              <Button variant="outline" size="sm" className="w-full">Deploy Pack</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🏢 Agency Pack</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Complete setup for marketing agencies
              </p>
              <Button variant="outline" size="sm" className="w-full">Deploy Pack</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">💼 SaaS Pack</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Onboarding and retention flows for SaaS
              </p>
              <Button variant="outline" size="sm" className="w-full">Deploy Pack</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}