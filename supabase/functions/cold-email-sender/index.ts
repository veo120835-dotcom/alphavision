import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendRequest {
  emailId: string;
  organizationId: string;
  action: 'approve' | 'send' | 'mark_replied' | 'mark_opened';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emailId, organizationId, action } = await req.json() as SendRequest;

    if (!emailId || !organizationId || !action) {
      return new Response(JSON.stringify({ error: 'emailId, organizationId, and action are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the email
    const { data: email, error: emailError } = await supabase
      .from('authority_emails')
      .select('*, website_diagnoses(*)')
      .eq('id', emailId)
      .eq('organization_id', organizationId)
      .single();

    if (emailError || !email) {
      return new Response(JSON.stringify({ error: 'Email not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch sending config
    const { data: config } = await supabase
      .from('email_sending_config')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    // Default config if none exists
    const sendingConfig = config || {
      max_emails_per_day: 30,
      require_approval: true,
      stop_on_reply: true,
    };

    switch (action) {
      case 'approve': {
        if (email.status !== 'draft') {
          return new Response(JSON.stringify({ error: 'Email is not in draft status' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: updated, error: updateError } = await supabase
          .from('authority_emails')
          .update({ status: 'approved' })
          .eq('id', emailId)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify({
          success: true,
          message: 'Email approved and ready to send',
          email: updated
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'send': {
        // Check rate limits
        const today = new Date().toISOString().split('T')[0];
        const { count: sentToday } = await supabase
          .from('authority_emails')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('status', 'sent')
          .gte('sent_at', `${today}T00:00:00Z`);

        if ((sentToday || 0) >= sendingConfig.max_emails_per_day) {
          return new Response(JSON.stringify({ 
            error: 'Daily sending limit reached',
            limit: sendingConfig.max_emails_per_day,
            sent: sentToday
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if approval is required
        if (sendingConfig.require_approval && email.status !== 'approved') {
          return new Response(JSON.stringify({ 
            error: 'Email must be approved before sending',
            currentStatus: email.status
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // TODO: Integrate with actual email provider (SendGrid, Mailgun, etc.)
        // For now, we'll just mark it as sent
        console.log('Would send email:', {
          to: 'prospect@example.com', // Would come from contact
          subject: email.subject_line,
          body: email.email_body,
        });

        const { data: updated, error: updateError } = await supabase
          .from('authority_emails')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', emailId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update pattern performance
        const diagnosis = email.website_diagnoses;
        if (diagnosis) {
          try {
            const { data: currentPerf } = await supabase
              .from('pattern_performance')
              .select('emails_sent')
              .eq('organization_id', organizationId)
              .eq('dominant_pattern', diagnosis.dominant_pattern)
              .single();

            if (currentPerf) {
              await supabase
                .from('pattern_performance')
                .update({ emails_sent: (currentPerf.emails_sent || 0) + 1 })
                .eq('organization_id', organizationId)
                .eq('dominant_pattern', diagnosis.dominant_pattern);
            } else {
              await supabase
                .from('pattern_performance')
                .insert({
                  organization_id: organizationId,
                  dominant_pattern: diagnosis.dominant_pattern,
                  primary_constraint: diagnosis.primary_constraint,
                  emails_sent: 1,
                });
            }
          } catch (e) {
            console.error('Error updating pattern performance:', e);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          email: updated
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'mark_opened': {
        const { data: updated, error: updateError } = await supabase
          .from('authority_emails')
          .update({ opened_at: new Date().toISOString() })
          .eq('id', emailId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update pattern performance
        const diagnosis = email.website_diagnoses;
        if (diagnosis) {
          const { data: currentPerf } = await supabase
            .from('pattern_performance')
            .select('emails_opened')
            .eq('organization_id', organizationId)
            .eq('dominant_pattern', diagnosis.dominant_pattern)
            .single();

          if (currentPerf) {
            await supabase
              .from('pattern_performance')
              .update({ emails_opened: (currentPerf.emails_opened || 0) + 1 })
              .eq('organization_id', organizationId)
              .eq('dominant_pattern', diagnosis.dominant_pattern);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          email: updated
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'mark_replied': {
        const { data: updated, error: updateError } = await supabase
          .from('authority_emails')
          .update({ 
            status: 'replied',
            replied_at: new Date().toISOString()
          })
          .eq('id', emailId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update pattern performance
        const diagnosis = email.website_diagnoses;
        if (diagnosis) {
          const { data: currentPerf } = await supabase
            .from('pattern_performance')
            .select('emails_replied')
            .eq('organization_id', organizationId)
            .eq('dominant_pattern', diagnosis.dominant_pattern)
            .single();

          if (currentPerf) {
            await supabase
              .from('pattern_performance')
              .update({ emails_replied: (currentPerf.emails_replied || 0) + 1 })
              .eq('organization_id', organizationId)
              .eq('dominant_pattern', diagnosis.dominant_pattern);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Email marked as replied',
          email: updated
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Error in cold-email-sender:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});