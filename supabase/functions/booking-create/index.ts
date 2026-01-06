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

    const { 
      booking_type_id, 
      start_time, 
      contact_email, 
      contact_name, 
      contact_phone,
      notes,
      metadata 
    } = await req.json();

    console.log(`Creating booking for: ${contact_email} at ${start_time}`);

    // Get booking type
    const { data: bookingType, error: btError } = await supabase
      .from('booking_types')
      .select('*')
      .eq('id', booking_type_id)
      .single();

    if (btError || !bookingType) {
      return new Response(JSON.stringify({ error: 'Booking type not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate end time
    const duration = bookingType.duration_minutes || 30;
    const startDate = new Date(start_time);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    // Check for conflicts
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('id')
      .eq('organization_id', bookingType.organization_id)
      .neq('status', 'cancelled')
      .lt('start_time', endDate.toISOString())
      .gt('end_time', startDate.toISOString());

    if (conflicts && conflicts.length > 0) {
      return new Response(JSON.stringify({ error: 'Time slot is no longer available' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upsert contact
    let contact_id = null;
    if (contact_email) {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', bookingType.organization_id)
        .eq('email', contact_email)
        .single();

      if (existingContact) {
        contact_id = existingContact.id;
        // Update contact info if provided
        if (contact_name || contact_phone) {
          await supabase
            .from('contacts')
            .update({
              first_name: contact_name?.split(' ')[0] || undefined,
              last_name: contact_name?.split(' ').slice(1).join(' ') || undefined,
              phone: contact_phone || undefined,
            })
            .eq('id', contact_id);
        }
      } else {
        const { data: newContact } = await supabase
          .from('contacts')
          .insert({
            organization_id: bookingType.organization_id,
            email: contact_email,
            first_name: contact_name?.split(' ')[0] || '',
            last_name: contact_name?.split(' ').slice(1).join(' ') || '',
            phone: contact_phone || '',
            source: 'booking',
          })
          .select('id')
          .single();
        
        contact_id = newContact?.id;
      }
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        organization_id: bookingType.organization_id,
        booking_type_id,
        contact_id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        title: `${bookingType.name} - ${contact_name || contact_email}`,
        notes,
        status: 'confirmed',
        metadata: {
          ...metadata,
          booked_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Trigger workflows
    await supabase.from('workflow_executions').insert({
      organization_id: bookingType.organization_id,
      trigger_event: 'booking.created',
      trigger_data: {
        booking_id: booking.id,
        contact_id,
        booking_type_id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      },
    });

    // TODO: Create Google Calendar event if connected
    // TODO: Send confirmation email

    console.log(`Booking created: ${booking.id}`);

    return new Response(JSON.stringify({
      success: true,
      booking: {
        id: booking.id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        title: booking.title,
        status: booking.status,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Booking create error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});