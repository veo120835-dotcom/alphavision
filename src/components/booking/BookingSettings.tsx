import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Clock, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAlphaVisionStore } from '@/store/alpha-vision-store';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [`${hour}:00`, `${hour}:30`];
}).flat();

const COLORS = ['#6366f1', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#ec4899', '#a855f7'];

export function BookingSettings() {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setActiveView } = useAlphaVisionStore();
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [typeForm, setTypeForm] = useState({
    name: '',
    slug: '',
    description: '',
    duration_minutes: 30,
    buffer_before_minutes: 0,
    buffer_after_minutes: 15,
    color: '#6366f1',
    price: '',
  });

  const { data: bookingTypes } = useQuery({
    queryKey: ['booking-types', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('booking_types')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: availabilityRules } = useQuery({
    queryKey: ['availability-rules', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('organization_id', organization.id)
        .order('day_of_week', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const createBookingType = useMutation({
    mutationFn: async (data: typeof typeForm) => {
      if (!organization?.id) throw new Error('No organization');
      const { error } = await supabase.from('booking_types').insert({
        organization_id: organization.id,
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        description: data.description,
        duration_minutes: data.duration_minutes,
        buffer_before_minutes: data.buffer_before_minutes,
        buffer_after_minutes: data.buffer_after_minutes,
        color: data.color,
        price: data.price ? parseFloat(data.price) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-types'] });
      toast.success('Booking type created');
      resetTypeForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateBookingType = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof typeForm }) => {
      const { error } = await supabase.from('booking_types').update({
        name: data.name,
        slug: data.slug,
        description: data.description,
        duration_minutes: data.duration_minutes,
        buffer_before_minutes: data.buffer_before_minutes,
        buffer_after_minutes: data.buffer_after_minutes,
        color: data.color,
        price: data.price ? parseFloat(data.price) : null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-types'] });
      toast.success('Booking type updated');
      resetTypeForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteBookingType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('booking_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-types'] });
      toast.success('Booking type deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const saveAvailability = useMutation({
    mutationFn: async (rules: { day_of_week: number; start_time: string; end_time: string; is_active: boolean }[]) => {
      if (!organization?.id || !user?.id) throw new Error('Missing data');
      
      // Delete existing rules
      await supabase.from('availability_rules').delete().eq('organization_id', organization.id);
      
      // Insert new rules
      const { error } = await supabase.from('availability_rules').insert(
        rules.filter(r => r.is_active).map(r => ({
          organization_id: organization.id,
          user_id: user.id,
          day_of_week: r.day_of_week,
          start_time: r.start_time,
          end_time: r.end_time,
        }))
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
      toast.success('Availability saved');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetTypeForm = () => {
    setTypeForm({
      name: '',
      slug: '',
      description: '',
      duration_minutes: 30,
      buffer_before_minutes: 0,
      buffer_after_minutes: 15,
      color: '#6366f1',
      price: '',
    });
    setEditingType(null);
    setIsTypeDialogOpen(false);
  };

  const handleEditType = (type: any) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      slug: type.slug,
      description: type.description || '',
      duration_minutes: type.duration_minutes,
      buffer_before_minutes: type.buffer_before_minutes || 0,
      buffer_after_minutes: type.buffer_after_minutes || 15,
      color: type.color || '#6366f1',
      price: type.price?.toString() || '',
    });
    setIsTypeDialogOpen(true);
  };

  const handleSubmitType = () => {
    if (!typeForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (editingType) {
      updateBookingType.mutate({ id: editingType.id, data: typeForm });
    } else {
      createBookingType.mutate(typeForm);
    }
  };

  const [availability, setAvailability] = useState(
    DAYS.map((_, i) => ({
      day_of_week: i,
      start_time: '09:00',
      end_time: '17:00',
      is_active: i > 0 && i < 6, // Mon-Fri active by default
    }))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setActiveView('booking')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Booking Settings</h1>
          <p className="text-muted-foreground">Configure meeting types and availability</p>
        </div>
      </div>

      <Tabs defaultValue="types">
        <TabsList>
          <TabsTrigger value="types">Meeting Types</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetTypeForm(); setIsTypeDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Meeting Type
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingType ? 'Edit Meeting Type' : 'Create Meeting Type'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={typeForm.name}
                      onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                      placeholder="e.g., Discovery Call"
                    />
                  </div>
                  <div>
                    <Label>Slug (URL-friendly)</Label>
                    <Input
                      value={typeForm.slug}
                      onChange={(e) => setTypeForm({ ...typeForm, slug: e.target.value })}
                      placeholder="e.g., discovery-call"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={typeForm.description}
                      onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                      placeholder="Brief description of this meeting"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Duration (min)</Label>
                      <Input
                        type="number"
                        value={typeForm.duration_minutes}
                        onChange={(e) => setTypeForm({ ...typeForm, duration_minutes: parseInt(e.target.value) || 30 })}
                      />
                    </div>
                    <div>
                      <Label>Buffer Before</Label>
                      <Input
                        type="number"
                        value={typeForm.buffer_before_minutes}
                        onChange={(e) => setTypeForm({ ...typeForm, buffer_before_minutes: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Buffer After</Label>
                      <Input
                        type="number"
                        value={typeForm.buffer_after_minutes}
                        onChange={(e) => setTypeForm({ ...typeForm, buffer_after_minutes: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Price (optional)</Label>
                    <Input
                      type="number"
                      value={typeForm.price}
                      onChange={(e) => setTypeForm({ ...typeForm, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <div className="flex gap-2 mt-2">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          className={`w-8 h-8 rounded-full border-2 ${typeForm.color === c ? 'border-foreground' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setTypeForm({ ...typeForm, color: c })}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetTypeForm}>Cancel</Button>
                    <Button onClick={handleSubmitType}>
                      {editingType ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {bookingTypes?.map((type) => (
              <Card key={type.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-3 h-12 rounded-full"
                        style={{ backgroundColor: type.color || '#6366f1' }}
                      />
                      <div>
                        <h3 className="font-semibold">{type.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {type.duration_minutes} min
                          </span>
                          {type.price && (
                            <span>${type.price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEditType(type)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteBookingType.mutate(type.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!bookingTypes?.length && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No meeting types yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first meeting type to start accepting bookings</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Availability</CardTitle>
              <CardDescription>Set your available hours for each day of the week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availability.map((day, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-28">
                    <Switch
                      checked={day.is_active}
                      onCheckedChange={(checked) => {
                        const updated = [...availability];
                        updated[i].is_active = checked;
                        setAvailability(updated);
                      }}
                    />
                    <span className="ml-2 text-sm">{DAYS[i]}</span>
                  </div>
                  {day.is_active && (
                    <>
                      <Select
                        value={day.start_time}
                        onValueChange={(v) => {
                          const updated = [...availability];
                          updated[i].start_time = v;
                          setAvailability(updated);
                        }}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">to</span>
                      <Select
                        value={day.end_time}
                        onValueChange={(v) => {
                          const updated = [...availability];
                          updated[i].end_time = v;
                          setAvailability(updated);
                        }}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              ))}
              <Button onClick={() => saveAvailability.mutate(availability)} className="mt-4">
                Save Availability
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
