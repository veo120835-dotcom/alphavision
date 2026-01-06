import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Mail, Search, Edit, Copy, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useAlphaVisionStore } from '@/store/alpha-vision-store';

const CATEGORIES = ['general', 'welcome', 'follow-up', 'booking', 'invoice', 'nurture', 'win-back'];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-500/10 text-green-600',
  archived: 'bg-muted text-muted-foreground',
};

export function EmailTemplatesList() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const { setActiveView } = useAlphaVisionStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    subject_template: '',
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('organization_id', organization.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!organization?.id) throw new Error('No organization');
      const { data: template, error } = await supabase.from('email_templates').insert({
        organization_id: organization.id,
        name: data.name,
        category: data.category,
        subject_template: data.subject_template,
        blocks: [],
      }).select().single();
      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template created');
      setIsDialogOpen(false);
      setFormData({ name: '', category: 'general', subject_template: '' });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const duplicateTemplate = useMutation({
    mutationFn: async (template: any) => {
      if (!organization?.id) throw new Error('No organization');
      const { error } = await supabase.from('email_templates').insert({
        organization_id: organization.id,
        name: `${template.name} (Copy)`,
        category: template.category,
        subject_template: template.subject_template,
        blocks: template.blocks,
        preview_text: template.preview_text,
        variables: template.variables,
        status: 'draft',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template duplicated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('email_templates').update({ status: 'archived' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template archived');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredTemplates = templates?.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Design and manage reusable email templates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject Line</Label>
                <Input
                  value={formData.subject_template}
                  onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
                  placeholder="e.g., Welcome to {{company}}, {{first_name}}!"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {'{{variable}}'} for personalization
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => createTemplate.mutate(formData)} disabled={!formData.name.trim()}>
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
      ) : !filteredTemplates?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-4">Create your first email template</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const stats = template.stats as { sends?: number; opens?: number; clicks?: number } || {};
            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className={STATUS_COLORS[template.status]}>
                      {template.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                    {template.subject_template || 'No subject'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>{stats.sends || 0} sends</span>
                    <span>{stats.opens || 0} opens</span>
                    <span>{stats.clicks || 0} clicks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => duplicateTemplate.mutate(template)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteTemplate.mutate(template.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
