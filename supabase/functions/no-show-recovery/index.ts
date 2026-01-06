import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NoShowAnalysis {
  reason_likelihood: {
    forgot: number;
    avoidance: number;
    low_intent: number;
    schedule_conflict: number;
  };
  recovery_track: 'A' | 'B' | 'C';
  recommended_action: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { booking_id, organization_id } = await req.json();

    if (!booking_id || !organization_id) {
      throw new Error('booking_id and organization_id are required');
    }

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, contact:contacts(*), booking_type:booking_types(*)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Check if already tracked
    const { data: existingTracking } = await supabase
      .from('no_show_tracking')
      .select('*')
      .eq('booking_id', booking_id)
      .single();

    if (existingTracking && existingTracking.recovered) {
      return new Response(JSON.stringify({ 
        message: 'Already recovered',
        tracking: existingTracking 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get prior engagement data
    const { data: priorActivities } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', booking.contact_id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate engagement score
    const engagementScore = calculateEngagementScore(priorActivities || []);
    
    // Calculate time between booking and no-show
    const bookingTime = new Date(booking.created_at);
    const appointmentTime = new Date(booking.start_time);
    const hoursBetween = (appointmentTime.getTime() - bookingTime.getTime()) / (1000 * 60 * 60);

    // Analyze no-show reason
    const analysis = analyzeNoShow(booking, priorActivities || [], engagementScore, hoursBetween);

    // Get current no-show count
    const currentNoShowCount = existingTracking?.no_show_count || (booking.no_show_count || 0);
    const newNoShowCount = currentNoShowCount + 1;

    // Check if max no-shows exceeded (governance rule)
    const MAX_NOSHOWS = 2;
    if (newNoShowCount > MAX_NOSHOWS) {
      // Close out, no more recovery attempts
      const trackingData = {
        organization_id,
        booking_id,
        contact_id: booking.contact_id,
        no_show_count: newNoShowCount,
        no_show_reason_likelihood: analysis.reason_likelihood,
        recovery_track: null,
        recovered: false,
        pre_call_engagement_score: engagementScore,
        time_between_book_and_noshow: Math.round(hoursBetween)
      };

      if (existingTracking) {
        await supabase
          .from('no_show_tracking')
          .update(trackingData)
          .eq('id', existingTracking.id);
      } else {
        await supabase.from('no_show_tracking').insert(trackingData);
      }

      return new Response(JSON.stringify({
        message: 'Max no-shows exceeded, no recovery attempted',
        no_show_count: newNoShowCount,
        analysis
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create/update tracking record
    const trackingData = {
      organization_id,
      booking_id,
      contact_id: booking.contact_id,
      no_show_count: newNoShowCount,
      no_show_reason_likelihood: analysis.reason_likelihood,
      recovery_track: analysis.recovery_track,
      recovery_attempts: existingTracking?.recovery_attempts || [],
      recovered: false,
      pre_call_engagement_score: engagementScore,
      time_between_book_and_noshow: Math.round(hoursBetween)
    };

    let trackingId;
    if (existingTracking) {
      await supabase
        .from('no_show_tracking')
        .update(trackingData)
        .eq('id', existingTracking.id);
      trackingId = existingTracking.id;
    } else {
      const { data: newTracking } = await supabase
        .from('no_show_tracking')
        .insert(trackingData)
        .select()
        .single();
      trackingId = newTracking?.id;
    }

    // Update booking no-show count
    await supabase
      .from('bookings')
      .update({ no_show_count: newNoShowCount })
      .eq('id', booking_id);

    // Generate recovery email based on track
    const emailTemplate = getRecoveryEmailTemplate(analysis.recovery_track, booking, booking.contact);

    // Log the recovery action
    await supabase.from('autonomous_actions').insert({
      organization_id,
      agent_type: 'no_show_recovery',
      action_type: 'recovery_initiated',
      target_entity_type: 'booking',
      target_entity_id: booking_id,
      decision: `Recovery Track ${analysis.recovery_track}`,
      reasoning: `Reason likelihood: forgot=${analysis.reason_likelihood.forgot.toFixed(2)}, avoidance=${analysis.reason_likelihood.avoidance.toFixed(2)}. Engagement score: ${engagementScore.toFixed(2)}`,
      confidence_score: Math.max(...Object.values(analysis.reason_likelihood)) * 100,
      was_auto_executed: false,
      requires_approval: true
    });

    return new Response(JSON.stringify({
      message: 'No-show recovery initiated',
      tracking_id: trackingId,
      no_show_count: newNoShowCount,
      analysis,
      email_template: emailTemplate,
      recommended_action: analysis.recommended_action
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    console.error('No-show recovery error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function calculateEngagementScore(activities: any[]): number {
  if (activities.length === 0) return 0.3;

  let score = 0.5;
  
  // More activities = higher engagement
  score += Math.min(activities.length * 0.05, 0.25);
  
  // Recent activity boost
  const recentActivities = activities.filter(a => {
    const daysSince = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });
  score += recentActivities.length * 0.05;

  // High-intent activities
  const highIntentTypes = ['reply', 'pricing', 'proposal'];
  const highIntentCount = activities.filter(a => 
    highIntentTypes.some(t => a.activity_type?.toLowerCase().includes(t))
  ).length;
  score += highIntentCount * 0.1;

  return Math.min(1, Math.max(0, score));
}

function analyzeNoShow(
  booking: any, 
  activities: any[], 
  engagementScore: number,
  hoursBetween: number
): NoShowAnalysis {
  // Initialize probabilities
  const reasons = {
    forgot: 0.25,
    avoidance: 0.25,
    low_intent: 0.25,
    schedule_conflict: 0.25
  };

  // Short notice bookings more likely to be forgotten
  if (hoursBetween < 24) {
    reasons.forgot += 0.15;
    reasons.schedule_conflict -= 0.05;
  } else if (hoursBetween > 168) { // > 1 week
    reasons.forgot += 0.2;
  }

  // Low engagement suggests low intent or avoidance
  if (engagementScore < 0.4) {
    reasons.low_intent += 0.2;
    reasons.avoidance += 0.1;
    reasons.forgot -= 0.1;
  } else if (engagementScore > 0.7) {
    reasons.forgot += 0.15;
    reasons.low_intent -= 0.15;
  }

  // If they rescheduled before, schedule conflict is likely
  if (booking.metadata?.prior_reschedules > 0) {
    reasons.schedule_conflict += 0.2;
    reasons.avoidance -= 0.1;
  }

  // Normalize probabilities
  const total = Object.values(reasons).reduce((a, b) => a + b, 0);
  Object.keys(reasons).forEach(k => {
    reasons[k as keyof typeof reasons] /= total;
  });

  // Determine recovery track
  let track: 'A' | 'B' | 'C';
  let recommendedAction: string;

  if (reasons.forgot > 0.35 || reasons.schedule_conflict > 0.35) {
    // Track A: Friendly + easy reschedule
    track = 'A';
    recommendedAction = 'Send friendly reminder with easy 1-click reschedule link';
  } else if (reasons.avoidance > 0.35) {
    // Track B: Firm + decision framing
    track = 'B';
    recommendedAction = 'Send firm but calm message framing this as a decision point';
  } else {
    // Track C: Downgrade to async
    track = 'C';
    recommendedAction = 'Offer async diagnostic instead of live call';
  }

  return {
    reason_likelihood: reasons,
    recovery_track: track,
    recommended_action: recommendedAction
  };
}

function getRecoveryEmailTemplate(
  track: 'A' | 'B' | 'C', 
  booking: any, 
  contact: any
): { subject: string; body: string } {
  const firstName = contact?.first_name || 'there';
  const bookingTitle = booking?.title || 'our call';

  switch (track) {
    case 'A':
      return {
        subject: `Quick note about ${bookingTitle}`,
        body: `Hi ${firstName},

I noticed we missed connecting for ${bookingTitle}. No worries – these things happen.

If you'd still like to chat, here's my calendar to pick a time that works better:

[BOOKING_LINK]

Either way, I hope your day is going well.`
      };

    case 'B':
      return {
        subject: `Checking in - ${bookingTitle}`,
        body: `Hi ${firstName},

We had ${bookingTitle} scheduled but didn't connect.

I want to be respectful of both our time, so I wanted to check: is this still something you want to explore, or has your situation changed?

Either answer is completely fine – just let me know where you're at.`
      };

    case 'C':
      return {
        subject: `Alternative to a call`,
        body: `Hi ${firstName},

Since scheduling a call seems tricky right now, I wanted to offer an alternative.

I've put together a quick diagnostic you can complete on your own time. It takes about 5 minutes and will help me understand your situation before we connect.

[DIAGNOSTIC_LINK]

This way, when we do eventually talk, we can jump straight to what matters.`
      };
  }
}
