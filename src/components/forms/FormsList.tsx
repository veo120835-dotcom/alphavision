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
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, Search, Edit, Copy, Trash2, ExternalLink, BarChart } from 'lucide-react';
import { toast } from 'sonner';
import { useAlphaVisionStore } from '@/store/alpha-vision-store';

const FORM_TYPES = ['form', 'survey', 'quiz'];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-500/10 text-green-600',
  archived: 'bg-muted text-muted-foreground',
};

export function FormsList() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const { setActiveView } = useAlphaVisionStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    form_type: 'form',
  });

  const { data: forms, isLoading } = useQuery({
    queryKey: ['forms', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('organization_id', organization.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const createForm = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!organization?.id) throw new Error('No organization');
      const { data: form, error } = await supabase.from('forms').insert({
        organization_id: organization.id,
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        description: data.description,
        form_type: data.form_type,
        fields: [],
      }).select().single();
      if (error) throw error;
      return form;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form created');
      setIsDialogOpen(false);
      setFormData({ name: '', slug: '', description: '', form_type: 'form' });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const duplicateForm = useMutation({
    mutationFn: async (form: any) => {
      if (!organization?.id) throw new Error('No organization');
      const { error } = await supabase.from('forms').insert({
        organization_id: organization.id,
        name: `${form.name} (Copy)`,
        slug: `${form.slug}-copy-${Date.now()}`,
        description: form.description,
        form_type: form.form_type,
        fields: form.fields,
        settings: form.settings,
        styling: form.styling,
        thank_you_message: form.thank_you_message,
        redirect_url: form.redirect_url,
        status: 'draft',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form duplicated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteForm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('forms').update({ status: 'archived' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form archived');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === 'active' ? 'draft' : 'active';
      const { error } = await supabase.from('forms').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredForms = forms?.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || f.form_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forms & Surveys</h1>
          <p className="text-muted-foreground">Create forms to capture leads and feedback</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Form Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Contact Form"
                />
              </div>
              <div>
                <Label>Slug (URL-friendly)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., contact-form"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this form for?"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={formData.form_type} onValueChange={(v) => setFormData({ ...formData, form_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="form">Form</SelectItem>
                    <SelectItem value="survey">Survey</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => createForm.mutate(formData)} disabled={!formData.name.trim()}>
                  Create Form
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
            placeholder="Search forms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {FORM_TYPES.map(t => (
              <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading forms...</div>
      ) : !filteredForms?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No forms yet</h3>
            <p className="text-muted-foreground mb-4">Create your first form to capture leads</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredForms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{form.form_type}</Badge>
                    <Badge variant="outline" className={STATUS_COLORS[form.status]}>
                      {form.status}
                    </Badge>
                  </div>
                </div>
                <h3 className="font-semibold mb-1">{form.name}</h3>
                {form.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{form.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <BarChart className="h-4 w-4" />
                  <span>{form.submission_count || 0} submissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => duplicateForm.mutate(form)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleStatus.mutate({ id: form.id, status: form.status })}
                  >
                    {form.status === 'active' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteForm.mutate(form.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
