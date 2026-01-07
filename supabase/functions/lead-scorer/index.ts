import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function calculateIntentScore(signals: any): number {
  let score = 0;
  
  if (signals.askedAboutPricing) score += 30;
  if (signals.requestedDemo) score += 40;
  if (signals.discussedTimeline) score += 20;
  if (signals.mentionedBudget) score += 10;
  
  return Math.min(score, 100);
}

function calculateFitScore(contact: any, ideal: any): number {
  let score = 50;
  
  if (contact.company && ideal.industries?.includes(contact.company)) {
    score += 20;
  }
  
  if (contact.title && ideal.titles?.some((t: string) => contact.title.toLowerCase().includes(t.toLowerCase()))) {
    score += 30;
  }
  
  return Math.min(score, 100);
}

function calculateUrgencyScore(signals: any): number {
  let score = 30;
  
  if (signals.mentionedDeadline) score += 40;
  if (signals.activelyComparing) score += 20;
  if (signals.budgetApproved) score += 10;
  
  return Math.min(score, 100);
}

function calculateEngagementScore(activity: any): number {
  let score = 0;
  
  score += Math.min(activity.messageCount * 5, 40);
  score += Math.min(activity.responseRate * 30, 30);
  score += activity.daysActive * 2;
  
  return Math.min(score, 100);
}

function determineBuyingSignals(messages: any[], contact: any): string[] {
  const signals = [];
  
  const combinedText = messages.map(m => m.content?.toLowerCase() || '').join(' ');
  
  if (combinedText.includes('price') || combinedText.includes('cost') || combinedText.includes('pricing')) {
    signals.push('Pricing inquiry');
  }
  if (combinedText.includes('demo') || combinedText.includes('trial')) {
    signals.push('Demo requested');
  }
  if (combinedText.includes('when') || combinedText.includes('timeline') || combinedText.includes('start')) {
    signals.push('Timeline discussed');
  }
  if (combinedText.includes('budget') || combinedText.includes('approved')) {
    signals.push('Budget mentioned');
  }
  if (combinedText.includes('decision') || combinedText.includes('choose')) {
    signals.push('Decision-making stage');
  }
  
  return signals;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      throw new Error('No organization found');
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(p => p).pop();

    if (path === 'score-lead' && req.method === 'POST') {
      const { contactId, leadId, conversationId } = await req.json();
      
      const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .eq('organization_id', membership.organization_id)
        .maybeSingle();

      if (!contact) {
        throw new Error('Contact not found');
      }

      const { data: messages } = await supabase
        .from('provider_messages')
        .select('*')
        .eq('contact_id', contactId)
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: true });

      const buyingSignals = determineBuyingSignals(messages || [], contact);
      
      const signals = {
        askedAboutPricing: buyingSignals.includes('Pricing inquiry'),
        requestedDemo: buyingSignals.includes('Demo requested'),
        discussedTimeline: buyingSignals.includes('Timeline discussed'),
        mentionedBudget: buyingSignals.includes('Budget mentioned'),
        mentionedDeadline: buyingSignals.includes('Timeline discussed'),
        activelyComparing: buyingSignals.includes('Decision-making stage'),
        budgetApproved: buyingSignals.includes('Budget mentioned'),
      };

      const idealProfile = {
        industries: ['technology', 'saas', 'software'],
        titles: ['ceo', 'founder', 'vp', 'director', 'manager'],
      };

      const activity = {
        messageCount: messages?.length || 0,
        responseRate: messages ? (messages.filter(m => m.direction === 'inbound').length / Math.max(messages.length, 1)) : 0,
        daysActive: messages && messages.length > 0 
          ? Math.floor((Date.now() - new Date(messages[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      };

      const intentScore = calculateIntentScore(signals);
      const fitScore = calculateFitScore(contact, idealProfile);
      const urgencyScore = calculateUrgencyScore(signals);
      const engagementScore = calculateEngagementScore(activity);
      
      const overallScore = Math.round(
        (intentScore * 0.35) + 
        (fitScore * 0.25) + 
        (urgencyScore * 0.25) + 
        (engagementScore * 0.15)
      );

      let nextBestAction = 'Continue nurturing';
      let confidenceLevel = 'medium';
      
      if (overallScore >= 80) {
        nextBestAction = 'Send proposal immediately';
        confidenceLevel = 'very_high';
      } else if (overallScore >= 60) {
        nextBestAction = 'Schedule discovery call';
        confidenceLevel = 'high';
      } else if (overallScore >= 40) {
        nextBestAction = 'Share case studies';
      } else {
        nextBestAction = 'Qualify further';
        confidenceLevel = 'low';
      }

      const { data: leadScore, error } = await supabase
        .from('lead_scores')
        .insert({
          organization_id: membership.organization_id,
          lead_id: leadId || null,
          contact_id: contactId,
          conversation_id: conversationId || null,
          overall_score: overallScore,
          intent_score: intentScore,
          fit_score: fitScore,
          urgency_score: urgencyScore,
          engagement_score: engagementScore,
          buying_signals: buyingSignals,
          risk_flags: [],
          confidence_level: confidenceLevel,
          next_best_action: nextBestAction,
          reasoning: `Score based on: ${buyingSignals.length} buying signals, ${messages?.length || 0} messages exchanged`,
          scored_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      if (leadId) {
        await supabase
          .from('leads')
          .update({ score: overallScore })
          .eq('id', leadId);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          leadScore,
          breakdown: {
            intent: intentScore,
            fit: fitScore,
            urgency: urgencyScore,
            engagement: engagementScore,
          },
          signals: buyingSignals,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'batch-score' && req.method === 'POST') {
      const { contactIds } = await req.json();
      
      const results = [];
      for (const contactId of contactIds.slice(0, 10)) {
        try {
          const scoreResponse = await fetch(
            `${supabaseUrl}/functions/v1/lead-scorer/score-lead`,
            {
              method: 'POST',
              headers: {
                'Authorization': req.headers.get('Authorization')!,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ contactId }),
            }
          );
          
          const scoreData = await scoreResponse.json();
          results.push({ contactId, ...scoreData });
        } catch (error) {
          results.push({ contactId, error: error.message });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === 'get-scores' && req.method === 'GET') {
      const minScore = url.searchParams.get('minScore');
      
      let query = supabase
        .from('lead_scores')
        .select('*, contacts(first_name, last_name, email)')
        .eq('organization_id', membership.organization_id)
        .order('scored_at', { ascending: false })
        .limit(100);

      if (minScore) {
        query = query.gte('overall_score', parseInt(minScore));
      }

      const { data: scores, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, scores }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Lead scorer error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});