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
import { Switch } from '@/components/ui/switch';
import { Plus, BookOpen, Search, Edit, Users, DollarSign, Play, Palette, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { CourseEditor } from './CourseEditor';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-green-500/10 text-green-600',
  archived: 'bg-muted text-muted-foreground',
};

export function CoursesList() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    is_free: false,
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('courses')
        .select(`*, enrollments:enrollments(count)`)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const createCourse = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!organization?.id) throw new Error('No organization');
      const { data: course, error } = await supabase.from('courses').insert({
        organization_id: organization.id,
        title: data.title,
        slug: data.slug || data.title.toLowerCase().replace(/\s+/g, '-'),
        description: data.description,
        is_free: data.is_free,
      }).select().single();
      if (error) throw error;
      return course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created');
      setIsDialogOpen(false);
      setFormData({ title: '', slug: '', description: '', is_free: false });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('courses').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filteredCourses = courses?.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (editingCourseId) {
    return <CourseEditor courseId={editingCourseId} onBack={() => setEditingCourseId(null)} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Course Academy</h1>
            <p className="text-muted-foreground">Create and manage online courses</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg"><Plus className="h-5 w-5 mr-2" />Create Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Course</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Course Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Mastering Sales" /></div>
              <div><Label>Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="e.g., mastering-sales" /></div>
              <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="flex items-center justify-between"><Label>Free Course</Label><Switch checked={formData.is_free} onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => createCourse.mutate(formData)} disabled={!formData.title.trim()}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent></Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : !filteredCourses?.length ? (
        <Card><CardContent className="py-12 text-center"><GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><h3 className="font-semibold mb-2">No courses yet</h3><Button onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Course</Button></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => {
            const enrollmentCount = (course.enrollments as any)?.[0]?.count || 0;
            return (
              <Card key={course.id} className="hover:shadow-md transition-shadow overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                  {course.thumbnail_url ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" /> : <BookOpen className="h-12 w-12 text-primary/40" />}
                  <Badge className={`absolute top-2 right-2 ${STATUS_COLORS[course.status]}`}>{course.status}</Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-1 mb-2">{course.title}</h3>
                  {course.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" />{enrollmentCount}</span>
                    {course.is_free ? <Badge variant="secondary">Free</Badge> : <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />Paid</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditingCourseId(course.id)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingCourseId(course.id)}><Palette className="h-4 w-4" /></Button>
                    {course.status === 'draft' && <Button size="sm" onClick={() => updateStatus.mutate({ id: course.id, status: 'published' })}><Play className="h-4 w-4" /></Button>}
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