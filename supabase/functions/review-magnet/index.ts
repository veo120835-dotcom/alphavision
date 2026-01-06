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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, organization_id } = body;

    if (action === 'analyze_sentiment') {
      const { contact_id, chat_history } = body;

      const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analyze this customer interaction for satisfaction level.

CHAT HISTORY:
${JSON.stringify(chat_history)}

Score the customer satisfaction from 0-100 based on:
- Tone of messages (positive words, emojis, gratitude)
- Resolution of their issue
- Engagement level
- Any complaints or frustrations

Return JSON:
{
  "score": 0-100,
  "sentiment": "ecstatic" | "satisfied" | "neutral" | "dissatisfied" | "angry",
  "key_indicators": ["what made you score this way"],
  "summary": "1-sentence summary of their experience"
}

Return ONLY valid JSON.`
              }]
            }],
            generationConfig: { temperature: 0.2 }
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze sentiment');
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      let analysis;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 50, sentiment: 'neutral' };
      } catch (e) {
        analysis = { score: 50, sentiment: 'neutral', key_indicators: [], summary: 'Unable to analyze' };
      }

      // Store the analysis
      const { data: log, error } = await supabase
        .from('reputation_logs')
        .insert({
          organization_id,
          contact_id,
          sentiment_score: analysis.score,
          chat_history_summary: analysis.summary,
          status: 'analyzed'
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, analysis, log_id: log.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'request_review') {
      const { log_id, platform, review_link } = body;

      // Get the log
      const { data: log, error: logError } = await supabase
        .from('reputation_logs')
        .select('*, contacts(*)')
        .eq('id', log_id)
        .single();

      if (logError || !log) {
        throw new Error('Log not found');
      }

      const score = log.sentiment_score || 50;
      let messageType: 'public_review' | 'private_feedback' | 'rescue_call' = 'public_review';
      let message = '';

      if (score >= 90) {
        // ECSTATIC - Ask for public review
        messageType = 'public_review';
        message = `🌟 Thank you so much for being amazing! Would you mind sharing your experience on ${platform || 'Google'}? It helps small businesses like ours tremendously!\n\n${review_link || '[Review Link]'}`;
      } else if (score >= 70) {
        // SATISFIED - Ask for private feedback
        messageType = 'private_feedback';
        message = `Thanks for choosing us! We're always looking to improve - would you mind sharing quick feedback on what we could do better? [Private Feedback Form]`;
      } else {
        // DANGER - Alert for rescue call
        messageType = 'rescue_call';
        
        // Create approval request for human intervention
        await supabase
          .from('approval_requests')
          .insert({
            organization_id: log.organization_id,
            request_type: 'unhappy_customer',
            title: `Unhappy Customer Alert - Score: ${score}`,
            description: `Customer ${(log.contacts as any)?.name || 'Unknown'} appears dissatisfied. Immediate personal outreach recommended.`,
            status: 'pending',
            agent_recommendation: 'Call immediately to understand concerns and salvage relationship'
          });

        message = 'Internal alert created for personal outreach';
      }

      // Update log
      await supabase
        .from('reputation_logs')
        .update({
          status: messageType === 'public_review' ? 'review_requested' : messageType,
          review_platform: platform,
          review_link
        })
        .eq('id', log_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message_type: messageType,
          message,
          score
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'mark_review_posted') {
      const { log_id } = body;

      await supabase
        .from('reputation_logs')
        .update({ status: 'posted' })
        .eq('id', log_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'record_feedback') {
      const { log_id, feedback_text } = body;

      await supabase
        .from('reputation_logs')
        .update({ 
          status: 'feedback_received',
          feedback_text 
        })
        .eq('id', log_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_stats') {
      const { data: logs, error } = await supabase
        .from('reputation_logs')
        .select('sentiment_score, status, review_platform')
        .eq('organization_id', organization_id);

      if (error) throw error;

      const stats = {
        total_analyzed: logs?.length || 0,
        avg_sentiment: 0,
        by_status: {} as Record<string, number>,
        by_platform: {} as Record<string, number>,
        sentiment_distribution: {
          ecstatic: 0,
          satisfied: 0,
          neutral: 0,
          dissatisfied: 0,
          angry: 0
        }
      };

      let totalScore = 0;
      for (const log of logs || []) {
        totalScore += log.sentiment_score || 0;
        stats.by_status[log.status] = (stats.by_status[log.status] || 0) + 1;
        if (log.review_platform) {
          stats.by_platform[log.review_platform] = (stats.by_platform[log.review_platform] || 0) + 1;
        }

        const score = log.sentiment_score || 50;
        if (score >= 90) stats.sentiment_distribution.ecstatic++;
        else if (score >= 70) stats.sentiment_distribution.satisfied++;
        else if (score >= 50) stats.sentiment_distribution.neutral++;
        else if (score >= 30) stats.sentiment_distribution.dissatisfied++;
        else stats.sentiment_distribution.angry++;
      }

      stats.avg_sentiment = logs?.length ? Math.round(totalScore / logs.length) : 0;

      return new Response(
        JSON.stringify({ success: true, stats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_pending_reviews') {
      const { data: pending, error } = await supabase
        .from('reputation_logs')
        .select('*, contacts(name, email)')
        .eq('organization_id', organization_id)
        .in('status', ['analyzed', 'review_requested'])
        .gte('sentiment_score', 70)
        .order('sentiment_score', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, pending }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Review Magnet Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
