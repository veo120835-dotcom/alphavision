import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const bookingTypeId = url.searchParams.get('booking_type_id');
    const date = url.searchParams.get('date'); // YYYY-MM-DD
    const timezone = url.searchParams.get('timezone') || 'UTC';

    if (!bookingTypeId || !date) {
      return new Response(JSON.stringify({ error: 'booking_type_id and date are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Getting slots for booking type: ${bookingTypeId}, date: ${date}`);

    // Get booking type
    const { data: bookingType, error: btError } = await supabase
      .from('booking_types')
      .select('*')
      .eq('id', bookingTypeId)
      .single();

    if (btError || !bookingType) {
      return new Response(JSON.stringify({ error: 'Booking type not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get day of week (0 = Sunday)
    const requestedDate = new Date(date + 'T00:00:00Z');
    const dayOfWeek = requestedDate.getUTCDay();

    // Get availability rules for this day
    const { data: availabilityRules } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('organization_id', bookingType.organization_id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (!availabilityRules || availabilityRules.length === 0) {
      return new Response(JSON.stringify({ slots: [], message: 'No availability on this day' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get existing bookings for this date
    const startOfDay = `${date}T00:00:00Z`;
    const endOfDay = `${date}T23:59:59Z`;

    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('organization_id', bookingType.organization_id)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .neq('status', 'cancelled');

    // Generate available slots
    const slots: { start_time: string; end_time: string; available: boolean }[] = [];
    const duration = bookingType.duration_minutes || 30;
    const bufferBefore = bookingType.buffer_before_minutes || 0;
    const bufferAfter = bookingType.buffer_after_minutes || 0;

    for (const rule of availabilityRules) {
      const [startHour, startMin] = rule.start_time.split(':').map(Number);
      const [endHour, endMin] = rule.end_time.split(':').map(Number);

      let currentTime = new Date(date + 'T00:00:00Z');
      currentTime.setUTCHours(startHour, startMin, 0, 0);

      const endTime = new Date(date + 'T00:00:00Z');
      endTime.setUTCHours(endHour, endMin, 0, 0);

      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + duration * 60000);
        
        if (slotEnd <= endTime) {
          // Check for conflicts with existing bookings (including buffer)
          const slotStartWithBuffer = new Date(currentTime.getTime() - bufferBefore * 60000);
          const slotEndWithBuffer = new Date(slotEnd.getTime() + bufferAfter * 60000);
          
          const hasConflict = existingBookings?.some(booking => {
            const bookingStart = new Date(booking.start_time);
            const bookingEnd = new Date(booking.end_time);
            return (
              (slotStartWithBuffer < bookingEnd && slotEndWithBuffer > bookingStart)
            );
          });

          // Check if slot is in the past
          const isPast = currentTime < new Date();

          slots.push({
            start_time: currentTime.toISOString(),
            end_time: slotEnd.toISOString(),
            available: !hasConflict && !isPast,
          });
        }

        // Move to next slot
        currentTime = new Date(currentTime.getTime() + duration * 60000);
      }
    }

    return new Response(JSON.stringify({
      booking_type: {
        id: bookingType.id,
        name: bookingType.name,
        duration_minutes: duration,
        price: bookingType.price,
      },
      date,
      timezone,
      slots: slots.filter(s => s.available),
      all_slots: slots,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Booking slots error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});