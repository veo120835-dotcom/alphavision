import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Tag, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

const TAG_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Purple', value: '#a855f7' },
];

const TAG_CATEGORIES = ['status', 'source', 'quality', 'intent', 'custom'];

interface TagFormData {
  name: string;
  category: string;
  color: string;
  description: string;
}

export function TagManager() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    category: 'custom',
    color: '#6366f1',
    description: '',
  });

  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('organization_id', organization.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const createTag = useMutation({
    mutationFn: async (data: TagFormData) => {
      if (!organization?.id) throw new Error('No organization');
      const { error } = await supabase.from('tags').insert({
        organization_id: organization.id,
        name: data.name,
        category: data.category,
        color: data.color,
        description: data.description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created');
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TagFormData }) => {
      const { error } = await supabase.from('tags').update({
        name: data.name,
        category: data.category,
        color: data.color,
        description: data.description,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag updated');
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormData({ name: '', category: 'custom', color: '#6366f1', description: '' });
    setEditingTag(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (tag: any) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      category: tag.category,
      color: tag.color,
      description: tag.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }
    if (editingTag) {
      updateTag.mutate({ id: editingTag.id, data: formData });
    } else {
      createTag.mutate(formData);
    }
  };

  const filteredTags = tags?.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || tag.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedTags = filteredTags?.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tag Manager</h1>
          <p className="text-muted-foreground">Organize contacts with a structured tag taxonomy</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., High Intent, Qualified"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAG_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {TAG_COLORS.map(c => (
                    <button
                      key={c.value}
                      className={`w-8 h-8 rounded-full border-2 ${formData.color === c.value ? 'border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setFormData({ ...formData, color: c.value })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this tag represent?"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit}>
                  {editingTag ? 'Update' : 'Create'}
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
            placeholder="Search tags..."
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
            {TAG_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading tags...</div>
      ) : !groupedTags || Object.keys(groupedTags).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No tags yet</h3>
            <p className="text-muted-foreground mb-4">Create tags to organize your contacts</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Tag
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Object.entries(groupedTags).map(([category, categoryTags]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categoryTags.map((tag: any) => (
                    <div
                      key={tag.id}
                      className="group flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="text-sm font-medium">{tag.name}</span>
                      <div className="hidden group-hover:flex items-center gap-1 ml-1">
                        <button
                          onClick={() => handleEdit(tag)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        {!tag.is_system && (
                          <button
                            onClick={() => deleteTag.mutate(tag.id)}
                            className="p-1 hover:bg-destructive/10 text-destructive rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
