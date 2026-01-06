import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, Mail, Phone, Calendar, FileText, TrendingUp, CheckSquare, 
  ArrowRightLeft, MessageSquare, Clock, User, Building2 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  activity_type: string;
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  contact_id: string | null;
  opportunity_id: string | null;
  company_id: string | null;
  created_by: string | null;
  created_at: string;
  contact?: { first_name: string; last_name: string | null } | null;
  opportunity?: { name: string } | null;
  company?: { name: string } | null;
}

const activityIcons: Record<string, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: FileText,
  deal_update: TrendingUp,
  task: CheckSquare,
  stage_change: ArrowRightLeft,
  message: MessageSquare,
};

const activityColors: Record<string, string> = {
  email: 'bg-blue-500/10 text-blue-500',
  call: 'bg-green-500/10 text-green-500',
  meeting: 'bg-purple-500/10 text-purple-500',
  note: 'bg-yellow-500/10 text-yellow-500',
  deal_update: 'bg-orange-500/10 text-orange-500',
  task: 'bg-cyan-500/10 text-cyan-500',
  stage_change: 'bg-pink-500/10 text-pink-500',
  message: 'bg-indigo-500/10 text-indigo-500',
};

interface ActivityTimelineProps {
  contactId?: string;
  opportunityId?: string;
  companyId?: string;
  showHeader?: boolean;
  limit?: number;
}

export function ActivityTimeline({ 
  contactId, 
  opportunityId, 
  companyId, 
  showHeader = true,
  limit 
}: ActivityTimelineProps) {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: 'note',
    subject: '',
    body: '',
    contact_id: contactId || '',
    opportunity_id: opportunityId || '',
    company_id: companyId || '',
  });

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', organization?.id, contactId, opportunityId, companyId],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      let query = supabase
        .from('activities')
        .select('*, contact:contacts(first_name, last_name), opportunity:opportunities(name), company:companies(name)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (contactId) query = query.eq('contact_id', contactId);
      if (opportunityId) query = query.eq('opportunity_id', opportunityId);
      if (companyId) query = query.eq('company_id', companyId);
      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data as Activity[];
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
    enabled: !!organization?.id && !contactId,
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
    enabled: !!organization?.id && !opportunityId,
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
    enabled: !!organization?.id && !companyId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('activities').insert({
        organization_id: organization!.id,
        activity_type: data.activity_type,
        subject: data.subject || null,
        body: data.body || null,
        contact_id: data.contact_id || null,
        opportunity_id: data.opportunity_id || null,
        company_id: data.company_id || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Activity logged');
    },
    onError: () => toast.error('Failed to log activity'),
  });

  const resetForm = () => {
    setFormData({
      activity_type: 'note',
      subject: '',
      body: '',
      contact_id: contactId || '',
      opportunity_id: opportunityId || '',
      company_id: companyId || '',
    });
  };

  const ActivityForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Activity Type</Label>
        <Select value={formData.activity_type} onValueChange={(v) => setFormData({ ...formData, activity_type: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="note">Note</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="message">Message</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Subject</Label>
        <Input
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Brief summary..."
        />
      </div>
      <div>
        <Label>Details</Label>
        <Textarea
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          placeholder="Add notes or details..."
          rows={4}
        />
      </div>
      {!contactId && (
        <div>
          <Label>Contact</Label>
          <Select value={formData.contact_id} onValueChange={(v) => setFormData({ ...formData, contact_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select contact" />
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
      )}
      {!opportunityId && (
        <div>
          <Label>Deal</Label>
          <Select value={formData.opportunity_id} onValueChange={(v) => setFormData({ ...formData, opportunity_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select deal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {opportunities?.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {!companyId && (
        <div>
          <Label>Company</Label>
          <Select value={formData.company_id} onValueChange={(v) => setFormData({ ...formData, company_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {companies?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
          Cancel
        </Button>
        <Button onClick={() => createMutation.mutate(formData)}>
          Log Activity
        </Button>
      </div>
    </div>
  );

  const content = (
    <>
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : activities?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No activities yet. Log your first activity to start tracking.
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {activities?.map((activity) => {
              const Icon = activityIcons[activity.activity_type] || FileText;
              
              return (
                <div key={activity.id} className="relative pl-10">
                  <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${activityColors[activity.activity_type] || 'bg-muted'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {activity.activity_type.replace('_', ' ')}
                            </Badge>
                            {activity.subject && (
                              <span className="font-medium">{activity.subject}</span>
                            )}
                          </div>
                          {activity.body && (
                            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                              {activity.body}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            {activity.contact && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {activity.contact.first_name} {activity.contact.last_name}
                              </span>
                            )}
                            {activity.company && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {activity.company.name}
                              </span>
                            )}
                            {activity.opportunity && (
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {activity.opportunity.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  if (!showHeader) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Log Activity</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Log Activity</DialogTitle>
              </DialogHeader>
              <ActivityForm />
            </DialogContent>
          </Dialog>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity Timeline</h1>
          <p className="text-muted-foreground">Track all interactions and activities</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Log Activity</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Log Activity</DialogTitle>
            </DialogHeader>
            <ActivityForm />
          </DialogContent>
        </Dialog>
      </div>

      {content}
    </div>
  );
}
