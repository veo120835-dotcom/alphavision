import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Video, MapPin, X, Check, Search, Plus, Settings } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import { toast } from 'sonner';
import { useAlphaVisionStore } from '@/store/alpha-vision-store';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
  completed: 'bg-blue-500/10 text-blue-600',
  no_show: 'bg-yellow-500/10 text-yellow-600',
  rescheduled: 'bg-orange-500/10 text-orange-600',
};

export function BookingsList() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const { setActiveView } = useAlphaVisionStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('upcoming');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_type:booking_types(name, duration_minutes, color),
          contact:contacts(first_name, last_name, email)
        `)
        .eq('organization_id', organization.id)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredBookings = bookings?.filter(b => {
    const searchText = `${b.title || ''} ${b.contact?.first_name || ''} ${b.contact?.last_name || ''} ${b.contact?.email || ''}`.toLowerCase();
    const matchesSearch = searchText.includes(search.toLowerCase());
    
    if (filterStatus === 'upcoming') {
      return matchesSearch && !isPast(new Date(b.end_time)) && b.status === 'confirmed';
    }
    if (filterStatus === 'past') {
      return matchesSearch && isPast(new Date(b.end_time));
    }
    if (filterStatus === 'all') {
      return matchesSearch;
    }
    return matchesSearch && b.status === filterStatus;
  });

  const groupedBookings = filteredBookings?.reduce((acc, booking) => {
    const date = new Date(booking.start_time);
    let label = format(date, 'EEEE, MMMM d');
    if (isToday(date)) label = 'Today';
    else if (isTomorrow(date)) label = 'Tomorrow';
    
    if (!acc[label]) acc[label] = [];
    acc[label].push(booking);
    return acc;
  }, {} as Record<string, any[]>);

  const stats = {
    today: bookings?.filter(b => isToday(new Date(b.start_time)) && b.status === 'confirmed').length || 0,
    upcoming: bookings?.filter(b => !isPast(new Date(b.end_time)) && b.status === 'confirmed').length || 0,
    noShows: bookings?.filter(b => b.status === 'no_show').length || 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage scheduled meetings and appointments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveView('booking-settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <User className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.noShows}</p>
                <p className="text-sm text-muted-foreground">No-Shows</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No-Shows</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading bookings...</div>
      ) : !groupedBookings || Object.keys(groupedBookings).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-4">
              {filterStatus === 'upcoming' ? 'No upcoming appointments scheduled' : 'No bookings match your filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBookings).map(([date, dateBookings]) => (
            <div key={date}>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">{date}</h3>
              <div className="space-y-3">
                {dateBookings.map((booking: any) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-1 h-12 rounded-full"
                            style={{ backgroundColor: booking.booking_type?.color || '#6366f1' }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                {booking.title || booking.booking_type?.name || 'Meeting'}
                              </h4>
                              <Badge variant="outline" className={STATUS_COLORS[booking.status]}>
                                {booking.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                              </span>
                              {booking.contact && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {booking.contact.first_name} {booking.contact.last_name}
                                </span>
                              )}
                              {booking.zoom_link && (
                                <span className="flex items-center gap-1">
                                  <Video className="h-3 w-3" />
                                  Video Call
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {booking.status === 'confirmed' && !isPast(new Date(booking.end_time)) && (
                            <>
                              {booking.zoom_link && (
                                <Button size="sm" asChild>
                                  <a href={booking.zoom_link} target="_blank" rel="noopener noreferrer">
                                    <Video className="h-4 w-4 mr-1" />
                                    Join
                                  </a>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBookingStatus.mutate({ id: booking.id, status: 'completed' })}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateBookingStatus.mutate({ id: booking.id, status: 'cancelled' })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {booking.status === 'confirmed' && isPast(new Date(booking.end_time)) && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBookingStatus.mutate({ id: booking.id, status: 'completed' })}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Completed
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateBookingStatus.mutate({ id: booking.id, status: 'no_show' })}
                              >
                                No-Show
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
