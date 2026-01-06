import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AGENT_PERSONAS = {
  ceo: {
    name: 'CEO Agent',
    focus: 'Vision, Growth, Strategic Direction',
    prompt: `You are the CEO of this business. Your focus is on:
- Long-term vision and strategic direction
- Market positioning and competitive advantage
- Company culture and team morale
- Big-picture growth opportunities
Argue from the perspective of sustainable growth and market leadership.`
  },
  cfo: {
    name: 'CFO Agent',
    focus: 'Financial Risk, Cash Flow, ROI',
    prompt: `You are the CFO of this business. Your focus is on:
- Financial risk and runway management
- Cash flow implications
- ROI and payback periods
- Cost control and margin protection
Argue from the perspective of financial prudence and sustainable economics.`
  },
  cro: {
    name: 'CRO Agent',
    focus: 'Revenue, Sales, Customer Acquisition',
    prompt: `You are the CRO (Chief Revenue Officer) of this business. Your focus is on:
- Revenue growth and sales velocity
- Customer acquisition and pipeline health
- Deal size optimization
- Sales team capacity and efficiency
Argue from the perspective of revenue acceleration and sales effectiveness.`
  },
  cmo: {
    name: 'CMO Agent',
    focus: 'Brand, Marketing, Positioning',
    prompt: `You are the CMO of this business. Your focus is on:
- Brand perception and market positioning
- Marketing effectiveness and CAC
- Customer messaging and value proposition
- Competitive differentiation
Argue from the perspective of brand value and market perception.`
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, organization_id, question, context, session_id } = await req.json();

    if (action === 'create_session') {
      // Create a new boardroom session
      const { data: session, error } = await supabase
        .from('boardroom_sessions')
        .insert({
          organization_id,
          question,
          context: context || {},
          status: 'deliberating'
        })
        .select()
        .single();

      if (error) throw error;

      // Start the debate asynchronously
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
      
      // Get business context
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('organization_id', organization_id)
        .single();

      const businessContext = businessProfile 
        ? `Business: ${businessProfile.business_name}, Industry: ${businessProfile.industry}, Model: ${businessProfile.business_model}`
        : 'General business';

      // Run all agents in parallel
      const agentPromises = Object.entries(AGENT_PERSONAS).map(async ([role, persona]) => {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${persona.prompt}

BUSINESS CONTEXT:
${businessContext}
${JSON.stringify(context || {})}

STRATEGIC QUESTION:
${question}

Provide your perspective in this format:
{
  "position": "Your stance (For/Against/Conditional)",
  "reasoning": "Your 2-3 sentence argument",
  "key_concerns": ["concern 1", "concern 2"],
  "recommended_action": "What you'd suggest",
  "confidence": 0.0 to 1.0
}

Be opinionated and argue your perspective strongly.
Return ONLY valid JSON.`
                }]
              }],
              generationConfig: { temperature: 0.7 }
            })
          }
        );

        if (!response.ok) {
          return { role, response: { position: 'Unable to respond', reasoning: 'Error', key_concerns: [], recommended_action: 'Retry', confidence: 0 } };
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          return { role, response: jsonMatch ? JSON.parse(jsonMatch[0]) : {} };
        } catch (e) {
          return { role, response: { position: 'Error parsing', reasoning: text.substring(0, 200), key_concerns: [], recommended_action: 'Review manually', confidence: 0.5 } };
        }
      });

      const agentResponses = await Promise.all(agentPromises);

      // Update session with responses
      const updates: any = { status: 'synthesizing' };
      for (const { role, response } of agentResponses) {
        updates[`${role}_response`] = response;
      }

      await supabase
        .from('boardroom_sessions')
        .update(updates)
        .eq('id', session.id);

      // Generate synthesis
      const synthesisResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are the board moderator. Synthesize these executive perspectives into a balanced recommendation.

QUESTION: ${question}

CEO (Growth Focus):
${JSON.stringify(agentResponses.find(r => r.role === 'ceo')?.response)}

CFO (Financial Focus):
${JSON.stringify(agentResponses.find(r => r.role === 'cfo')?.response)}

CRO (Revenue Focus):
${JSON.stringify(agentResponses.find(r => r.role === 'cro')?.response)}

CMO (Brand Focus):
${JSON.stringify(agentResponses.find(r => r.role === 'cmo')?.response)}

Provide a synthesis:
1. Where do they agree?
2. Key points of contention
3. The recommended path forward
4. Key risks to mitigate

Keep it actionable and under 200 words.`
              }]
            }],
            generationConfig: { temperature: 0.5 }
          })
        }
      );

      let synthesis = 'Unable to synthesize';
      let recommendedAction = 'Review individual perspectives';
      let confidenceScore = 0.5;

      if (synthesisResponse.ok) {
        const result = await synthesisResponse.json();
        synthesis = result.candidates?.[0]?.content?.parts?.[0]?.text || synthesis;
        
        // Calculate confidence based on agreement
        const positions = agentResponses.map(r => r.response.position);
        const agreement = positions.filter(p => p === positions[0]).length / positions.length;
        confidenceScore = agreement;
        
        // Extract recommended action
        const actionMatch = synthesis.match(/recommend[^.]*\./i);
        if (actionMatch) {
          recommendedAction = actionMatch[0];
        }
      }

      // Final update
      await supabase
        .from('boardroom_sessions')
        .update({
          synthesis,
          recommended_action: recommendedAction,
          confidence_score: confidenceScore,
          status: 'complete'
        })
        .eq('id', session.id);

      // Return the complete session
      const { data: completeSession } = await supabase
        .from('boardroom_sessions')
        .select('*')
        .eq('id', session.id)
        .single();

      return new Response(
        JSON.stringify({ success: true, session: completeSession }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_session') {
      const { data: session, error } = await supabase
        .from('boardroom_sessions')
        .select('*')
        .eq('id', session_id)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, session }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list_sessions') {
      const { data: sessions, error } = await supabase
        .from('boardroom_sessions')
        .select('id, question, status, confidence_score, created_at')
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, sessions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Boardroom Council Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
