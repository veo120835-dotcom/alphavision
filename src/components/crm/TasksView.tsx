import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Calendar, Clock, User, AlertCircle, CheckCircle2, Circle, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  contact_id: string | null;
  opportunity_id: string | null;
  company_id: string | null;
  assigned_to: string | null;
  contact?: { first_name: string; last_name: string | null } | null;
  opportunity?: { name: string } | null;
  company?: { name: string } | null;
  created_at: string;
}

const priorityConfig: Record<string, { color: string; icon: typeof AlertCircle }> = {
  low: { color: 'text-muted-foreground', icon: Circle },
  medium: { color: 'text-yellow-500', icon: Circle },
  high: { color: 'text-orange-500', icon: AlertCircle },
  urgent: { color: 'text-red-500', icon: AlertCircle },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-yellow-500/10 text-yellow-500', label: 'Pending' },
  in_progress: { color: 'bg-blue-500/10 text-blue-500', label: 'In Progress' },
  completed: { color: 'bg-green-500/10 text-green-500', label: 'Completed' },
  cancelled: { color: 'bg-muted text-muted-foreground', label: 'Cancelled' },
};

export function TasksView() {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'completed'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    contact_id: '',
    opportunity_id: '',
    company_id: '',
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['crm-tasks', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*, contact:contacts(first_name, last_name), opportunity:opportunities(name), company:companies(name)')
        .eq('organization_id', organization.id)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!organization?.id,
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .eq('organization_id', organization.id);
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: opportunities } = useQuery({
    queryKey: ['opportunities-list', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, name')
        .eq('organization_id', organization.id);
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: companies } = useQuery({
    queryKey: ['companies', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('organization_id', organization.id);
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('crm_tasks').insert({
        organization_id: organization!.id,
        title: data.title,
        description: data.description || null,
        due_date: data.due_date || null,
        priority: data.priority,
        contact_id: data.contact_id || null,
        opportunity_id: data.opportunity_id || null,
        company_id: data.company_id || null,
        created_by: user?.id,
        assigned_to: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Task created');
    },
    onError: () => toast.error('Failed to create task'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('crm_tasks')
        .update({
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
    },
    onError: () => toast.error('Failed to update task'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
      toast.success('Task deleted');
    },
    onError: () => toast.error('Failed to delete task'),
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      contact_id: '',
      opportunity_id: '',
      company_id: '',
    });
  };

  const filteredTasks = tasks?.filter((task) => {
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'today' && task.due_date) return isToday(parseISO(task.due_date));
    if (filter === 'overdue' && task.due_date) {
      return isPast(parseISO(task.due_date)) && task.status !== 'completed';
    }
    if (filter === 'all') return task.status !== 'completed';
    return true;
  });

  const getDueDateLabel = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = parseISO(dueDate);
    if (isToday(date)) return { label: 'Today', className: 'text-yellow-500' };
    if (isTomorrow(date)) return { label: 'Tomorrow', className: 'text-blue-500' };
    if (isPast(date)) return { label: 'Overdue', className: 'text-red-500' };
    return { label: format(date, 'MMM d'), className: 'text-muted-foreground' };
  };

  const TaskForm = ({ onSubmit, isEdit }: { onSubmit: () => void; isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label>Task Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Follow up with client"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Add details about this task..."
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Due Date</Label>
          <Input
            type="datetime-local"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Contact</Label>
          <Select value={formData.contact_id} onValueChange={(v) => setFormData({ ...formData, contact_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {contacts?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Deal</Label>
          <Select value={formData.opportunity_id} onValueChange={(v) => setFormData({ ...formData, opportunity_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {opportunities?.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Company</Label>
          <Select value={formData.company_id} onValueChange={(v) => setFormData({ ...formData, company_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {companies?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => { isEdit ? setEditingTask(null) : setIsCreateOpen(false); resetForm(); }}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!formData.title}>
          {isEdit ? 'Update' : 'Create'} Task
        </Button>
      </div>
    </div>
  );

  const overdueCount = tasks?.filter(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'completed').length || 0;
  const todayCount = tasks?.filter(t => t.due_date && isToday(parseISO(t.due_date))).length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your CRM tasks and follow-ups</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Task</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <TaskForm onSubmit={() => createMutation.mutate(formData)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({tasks?.filter(t => t.status !== 'completed').length || 0})
        </Button>
        <Button
          variant={filter === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('today')}
        >
          Today ({todayCount})
        </Button>
        <Button
          variant={filter === 'overdue' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('overdue')}
          className={overdueCount > 0 ? 'border-red-500' : ''}
        >
          Overdue ({overdueCount})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredTasks?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found. Create your first task to get started.
            </div>
          ) : (
            <div className="divide-y">
              {filteredTasks?.map((task) => {
                const PriorityIcon = priorityConfig[task.priority]?.icon || Circle;
                const dueDateInfo = getDueDateLabel(task.due_date);
                
                return (
                  <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-muted/50">
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={(checked) => {
                        updateStatusMutation.mutate({
                          id: task.id,
                          status: checked ? 'completed' : 'pending',
                        });
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {task.contact && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.contact.first_name} {task.contact.last_name}
                          </span>
                        )}
                        {task.opportunity && (
                          <span>Deal: {task.opportunity.name}</span>
                        )}
                        {task.company && (
                          <span>Company: {task.company.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PriorityIcon className={`w-4 h-4 ${priorityConfig[task.priority]?.color}`} />
                      {dueDateInfo && (
                        <div className={`flex items-center gap-1 text-xs ${dueDateInfo.className}`}>
                          <Calendar className="w-3 h-3" />
                          {dueDateInfo.label}
                        </div>
                      )}
                      <Badge className={statusConfig[task.status]?.color}>
                        {statusConfig[task.status]?.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingTask(task);
                            setFormData({
                              title: task.title,
                              description: task.description || '',
                              due_date: task.due_date || '',
                              priority: task.priority,
                              contact_id: task.contact_id || '',
                              opportunity_id: task.opportunity_id || '',
                              company_id: task.company_id || '',
                            });
                          }}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(task.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => { setEditingTask(null); resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            isEdit
            onSubmit={() => {
              if (editingTask) {
                supabase
                  .from('crm_tasks')
                  .update({
                    title: formData.title,
                    description: formData.description || null,
                    due_date: formData.due_date || null,
                    priority: formData.priority,
                    contact_id: formData.contact_id || null,
                    opportunity_id: formData.opportunity_id || null,
                    company_id: formData.company_id || null,
                  })
                  .eq('id', editingTask.id)
                  .then(({ error }) => {
                    if (error) {
                      toast.error('Failed to update task');
                    } else {
                      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
                      setEditingTask(null);
                      resetForm();
                      toast.success('Task updated');
                    }
                  });
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
