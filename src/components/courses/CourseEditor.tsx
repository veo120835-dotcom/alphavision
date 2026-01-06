import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, BookOpen, GripVertical, Edit, Trash2, Video, FileText, 
  Image, Upload, Save, ArrowLeft, Play, Settings, Palette 
} from 'lucide-react';
import { toast } from 'sonner';
import { useAlphaVisionStore } from '@/store/alpha-vision-store';

interface CourseEditorProps {
  courseId: string;
  onBack: () => void;
}

export function CourseEditor({ courseId, onBack }: CourseEditorProps) {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('content');
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [lessonForm, setLessonForm] = useState({ 
    title: '', 
    content_html: '', 
    video_url: '',
    duration_minutes: 0 
  });

  // Fetch course
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch modules with lessons
  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['modules', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select(`
          *,
          lessons:lessons(*)
        `)
        .eq('course_id', courseId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch branding
  const { data: branding } = useQuery({
    queryKey: ['branding', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', organization.id)
        .single();
      return data;
    },
    enabled: !!organization?.id,
  });

  // Create module
  const createModule = useMutation({
    mutationFn: async (data: typeof moduleForm) => {
      const maxPos = modules?.reduce((max, m) => Math.max(max, m.position || 0), 0) || 0;
      const { data: module, error } = await supabase.from('modules').insert({
        course_id: courseId,
        title: data.title,
        description: data.description,
        position: maxPos + 1,
      }).select().single();
      if (error) throw error;
      return module;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Module created');
      setIsModuleDialogOpen(false);
      setModuleForm({ title: '', description: '' });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Create lesson
  const createLesson = useMutation({
    mutationFn: async (data: typeof lessonForm & { module_id: string }) => {
      const moduleData = modules?.find(m => m.id === data.module_id);
      const lessons = moduleData?.lessons || [];
      const maxPos = lessons.reduce((max: number, l: any) => Math.max(max, l.position || 0), 0);
      
      const { data: lesson, error } = await supabase.from('lessons').insert({
        module_id: data.module_id,
        title: data.title,
        content_html: data.content_html,
        video_url: data.video_url,
        duration_minutes: data.duration_minutes,
        position: maxPos + 1,
      }).select().single();
      if (error) throw error;
      return lesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Lesson created');
      setIsLessonDialogOpen(false);
      setLessonForm({ title: '', content_html: '', video_url: '', duration_minutes: 0 });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Update course
  const updateCourse = useMutation({
    mutationFn: async (updates: Partial<typeof course>) => {
      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course'] });
      toast.success('Course updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Update branding
  const updateBranding = useMutation({
    mutationFn: async (updates: any) => {
      if (!organization?.id) throw new Error('No organization');
      const { error } = await supabase
        .from('organization_branding')
        .upsert({
          organization_id: organization.id,
          ...updates,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      toast.success('Branding updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Delete module
  const deleteModule = useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase.from('modules').delete().eq('id', moduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Module deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Delete lesson
  const deleteLesson = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Lesson deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // File upload handler
  const handleFileUpload = async (file: File, type: 'video' | 'image' | 'document') => {
    if (!organization?.id) return null;
    
    const fileExt = file.name.split('.').pop();
    const filePath = `${organization.id}/courses/${courseId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);
    
    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);
    
    // Log media
    await supabase.from('course_media').insert({
      organization_id: organization.id,
      course_id: courseId,
      file_type: type,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.type,
    });
    
    toast.success('File uploaded');
    return urlData.publicUrl;
  };

  if (courseLoading || modulesLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  if (!course) {
    return <div className="p-6 text-center text-muted-foreground">Course not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">Course Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
            {course.status}
          </Badge>
          {course.status === 'draft' && (
            <Button onClick={() => updateCourse.mutate({ status: 'published' })}>
              <Play className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="content">
            <BookOpen className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Modules & Lessons</h2>
            <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Module</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Module Title</Label>
                    <Input
                      value={moduleForm.title}
                      onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                      placeholder="e.g., Getting Started"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                      placeholder="What will students learn in this module?"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsModuleDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => createModule.mutate(moduleForm)} disabled={!moduleForm.title}>
                      Create Module
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {!modules?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No modules yet</h3>
                <p className="text-muted-foreground mb-4">Create your first module to organize course content</p>
                <Button onClick={() => setIsModuleDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {modules.map((module, index) => (
                <AccordionItem key={module.id} value={module.id} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        Module {index + 1}: {module.title}
                      </span>
                      <Badge variant="secondary" className="ml-2">
                        {(module.lessons as any[])?.length || 0} lessons
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {module.description && (
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      )}
                      
                      {/* Lessons */}
                      <div className="space-y-2">
                        {(module.lessons as any[])?.sort((a, b) => a.position - b.position).map((lesson, li) => (
                          <Card key={lesson.id} className="bg-muted/50">
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                {lesson.video_url ? (
                                  <Video className="h-4 w-4 text-primary" />
                                ) : (
                                  <FileText className="h-4 w-4 text-primary" />
                                )}
                                <span>{lesson.title}</span>
                                {lesson.duration_minutes > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {lesson.duration_minutes} min
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => deleteLesson.mutate(lesson.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Add lesson button */}
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedModuleId(module.id);
                            setIsLessonDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Lesson
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteModule.mutate(module.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Module
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Course Title</Label>
                <Input
                  defaultValue={course.title}
                  onBlur={(e) => {
                    if (e.target.value !== course.title) {
                      updateCourse.mutate({ title: e.target.value });
                    }
                  }}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  defaultValue={course.description || ''}
                  onBlur={(e) => {
                    if (e.target.value !== course.description) {
                      updateCourse.mutate({ description: e.target.value });
                    }
                  }}
                />
              </div>
              <div>
                <Label>Thumbnail</Label>
                <div className="flex items-center gap-4 mt-2">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt="Thumbnail" 
                      className="w-32 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-32 h-20 bg-muted rounded flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleFileUpload(file, 'image');
                          if (url) {
                            updateCourse.mutate({ thumbnail_url: url });
                          }
                        }
                      }}
                    />
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Free Course</Label>
                  <p className="text-sm text-muted-foreground">Allow free access to this course</p>
                </div>
                <Switch
                  checked={course.is_free || false}
                  onCheckedChange={(checked) => updateCourse.mutate({ is_free: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Drip Content</Label>
                  <p className="text-sm text-muted-foreground">Release content over time</p>
                </div>
                <Switch
                  checked={course.drip_enabled || false}
                  onCheckedChange={(checked) => updateCourse.mutate({ drip_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Branding</CardTitle>
              <p className="text-sm text-muted-foreground">
                Customize the look of your course pages
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Logo</Label>
                <div className="flex items-center gap-4 mt-2">
                  {branding?.logo_url ? (
                    <img 
                      src={branding.logo_url} 
                      alt="Logo" 
                      className="h-12 object-contain"
                    />
                  ) : (
                    <div className="h-12 w-24 bg-muted rounded flex items-center justify-center">
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleFileUpload(file, 'image');
                          if (url) {
                            updateBranding.mutate({ logo_url: url });
                          }
                        }
                      }}
                    />
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={branding?.primary_color || '#6366f1'}
                      onChange={(e) => updateBranding.mutate({ primary_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={branding?.primary_color || '#6366f1'}
                      onChange={(e) => updateBranding.mutate({ primary_color: e.target.value })}
                      className="w-28"
                    />
                  </div>
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={branding?.secondary_color || '#8b5cf6'}
                      onChange={(e) => updateBranding.mutate({ secondary_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={branding?.secondary_color || '#8b5cf6'}
                      onChange={(e) => updateBranding.mutate({ secondary_color: e.target.value })}
                      className="w-28"
                    />
                  </div>
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={branding?.accent_color || '#f59e0b'}
                      onChange={(e) => updateBranding.mutate({ accent_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={branding?.accent_color || '#f59e0b'}
                      onChange={(e) => updateBranding.mutate({ accent_color: e.target.value })}
                      className="w-28"
                    />
                  </div>
                </div>
                <div>
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={branding?.background_color || '#ffffff'}
                      onChange={(e) => updateBranding.mutate({ background_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={branding?.background_color || '#ffffff'}
                      onChange={(e) => updateBranding.mutate({ background_color: e.target.value })}
                      className="w-28"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Font Family</Label>
                <Input
                  value={branding?.font_family || 'Inter'}
                  onChange={(e) => updateBranding.mutate({ font_family: e.target.value })}
                  placeholder="Inter, sans-serif"
                />
              </div>

              <div>
                <Label>Custom Domain (Optional)</Label>
                <Input
                  value={branding?.custom_domain || ''}
                  onChange={(e) => updateBranding.mutate({ custom_domain: e.target.value })}
                  placeholder="courses.yourdomain.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lesson Title</Label>
              <Input
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                placeholder="e.g., Introduction to the Topic"
              />
            </div>
            <div>
              <Label>Video URL (YouTube/Vimeo or direct link)</Label>
              <Input
                value={lessonForm.video_url}
                onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Or upload a video file below
              </p>
              <label className="cursor-pointer mt-2 inline-block">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await handleFileUpload(file, 'video');
                      if (url) {
                        setLessonForm({ ...lessonForm, video_url: url });
                      }
                    }
                  }}
                />
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Video className="h-4 w-4 mr-2" />
                    Upload Video
                  </span>
                </Button>
              </label>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={lessonForm.duration_minutes}
                onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Lesson Content</Label>
              <Textarea
                value={lessonForm.content_html}
                onChange={(e) => setLessonForm({ ...lessonForm, content_html: e.target.value })}
                placeholder="Write your lesson content here..."
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => {
                  if (selectedModuleId) {
                    createLesson.mutate({ ...lessonForm, module_id: selectedModuleId });
                  }
                }} 
                disabled={!lessonForm.title}
              >
                Create Lesson
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}