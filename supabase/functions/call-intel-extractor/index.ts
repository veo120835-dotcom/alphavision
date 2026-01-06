import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      transcript_text, 
      call_id,
      opportunity_id, 
      contact_id, 
      organization_id,
      call_duration,
      call_date
    } = await req.json();

    if (!transcript_text || !organization_id) {
      throw new Error('transcript_text and organization_id are required');
    }

    // Use Lovable AI to extract intelligence from transcript
    const extractionPrompt = `Analyze this sales call transcript and extract the following information in JSON format:

{
  "buying_intent_signals": ["array of phrases/behaviors indicating buying intent"],
  "objections": [
    {"type": "price|timing|authority|need|trust", "text": "the objection", "severity": "low|medium|high", "resolved": true/false}
  ],
  "decision_criteria": ["what factors will influence their decision"],
  "stakeholders_mentioned": ["names or roles of other decision makers"],
  "next_step_commitments": ["any commitments made for follow-up"],
  "close_probability": 0.0 to 1.0,
  "follow_up_urgency": "immediate|within_24h|within_week|low",
  "key_insights": "2-3 sentence summary of the most important takeaways",
  "recommended_follow_up": "specific action recommendation"
}

TRANSCRIPT:
${transcript_text}

Respond ONLY with valid JSON, no markdown formatting.`;

    let extractedData;

    if (lovableApiKey) {
      // Use Lovable AI API
      const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'user', content: extractionPrompt }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`);
      }

      const aiResult = await response.json();
      const content = aiResult.choices?.[0]?.message?.content || '{}';
      
      // Parse the JSON response
      try {
        extractedData = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
      } catch {
        extractedData = {
          buying_intent_signals: [],
          objections: [],
          decision_criteria: [],
          stakeholders_mentioned: [],
          next_step_commitments: [],
          close_probability: 0.5,
          follow_up_urgency: 'within_week',
          key_insights: 'Unable to parse transcript',
          recommended_follow_up: 'Manual review required'
        };
      }
    } else {
      // Fallback: basic extraction without AI
      extractedData = basicExtraction(transcript_text);
    }

    // Generate follow-up email draft
    const followUpDraft = generateFollowUpEmail(extractedData);

    // Save to call_intelligence table
    const { data: intelligence, error: saveError } = await supabase
      .from('call_intelligence')
      .insert({
        organization_id,
        opportunity_id,
        contact_id,
        call_id,
        transcript_text,
        call_duration,
        call_date: call_date || new Date().toISOString(),
        buying_intent_signals: extractedData.buying_intent_signals,
        objections: extractedData.objections,
        decision_criteria: extractedData.decision_criteria,
        stakeholders_mentioned: extractedData.stakeholders_mentioned,
        next_step_commitments: extractedData.next_step_commitments,
        close_probability: extractedData.close_probability,
        follow_up_urgency: extractedData.follow_up_urgency,
        recommended_actions: {
          key_insights: extractedData.key_insights,
          recommended_follow_up: extractedData.recommended_follow_up
        },
        follow_up_email_draft: followUpDraft
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving intelligence:', saveError);
    }

    // Update opportunity probability if we have one
    if (opportunity_id && extractedData.close_probability) {
      await supabase
        .from('opportunities')
        .update({ probability: Math.round(extractedData.close_probability * 100) })
        .eq('id', opportunity_id);
    }

    // Create CRM note
    const noteContent = formatCRMNote(extractedData);
    if (contact_id) {
      await supabase.from('activities').insert({
        organization_id,
        contact_id,
        opportunity_id,
        activity_type: 'call_summary',
        subject: 'Call Intelligence Summary',
        body: noteContent
      });
    }

    // Create follow-up tasks
    const tasks = generateTasks(extractedData, organization_id);
    if (tasks.length > 0) {
      await supabase.from('crm_tasks').insert(tasks);
    }

    // Log the action
    await supabase.from('autonomous_actions').insert({
      organization_id,
      agent_type: 'call_intel_extractor',
      action_type: 'intelligence_extracted',
      target_entity_type: 'call',
      target_entity_id: call_id || intelligence?.id,
      decision: extractedData.follow_up_urgency,
      reasoning: extractedData.key_insights,
      confidence_score: extractedData.close_probability * 100,
      was_auto_executed: true,
      executed_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      message: 'Call intelligence extracted',
      intelligence: intelligence || extractedData,
      follow_up_email: followUpDraft,
      crm_note: noteContent,
      tasks_created: tasks.length
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    console.error('Call intel extraction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function basicExtraction(transcript: string): any {
  const lower = transcript.toLowerCase();
  
  const buyingSignals = [];
  if (lower.includes('when can we start')) buyingSignals.push('Asked about timeline');
  if (lower.includes('how much')) buyingSignals.push('Price inquiry');
  if (lower.includes('next steps')) buyingSignals.push('Asked about next steps');
  if (lower.includes('contract') || lower.includes('agreement')) buyingSignals.push('Mentioned contract');

  const objections = [];
  if (lower.includes('too expensive') || lower.includes('budget')) {
    objections.push({ type: 'price', text: 'Budget concerns', severity: 'medium', resolved: false });
  }
  if (lower.includes('need to think') || lower.includes('consider')) {
    objections.push({ type: 'timing', text: 'Needs time to consider', severity: 'low', resolved: false });
  }
  if (lower.includes('talk to') || lower.includes('check with')) {
    objections.push({ type: 'authority', text: 'Needs to consult others', severity: 'medium', resolved: false });
  }

  return {
    buying_intent_signals: buyingSignals,
    objections,
    decision_criteria: [],
    stakeholders_mentioned: [],
    next_step_commitments: [],
    close_probability: buyingSignals.length > 2 ? 0.7 : buyingSignals.length > 0 ? 0.5 : 0.3,
    follow_up_urgency: buyingSignals.length > 2 ? 'within_24h' : 'within_week',
    key_insights: 'Basic extraction performed. AI analysis unavailable.',
    recommended_follow_up: 'Review transcript manually for full context.'
  };
}

function generateFollowUpEmail(data: any): string {
  const commitments = data.next_step_commitments?.length > 0
    ? `\n\nAs we discussed, the next steps are:\n${data.next_step_commitments.map((c: string) => `- ${c}`).join('\n')}`
    : '';

  return `Hi [NAME],

Thank you for taking the time to speak with me today.

${data.key_insights || 'It was great learning more about your needs.'}
${commitments}

If you have any questions in the meantime, don't hesitate to reach out.

Best regards`;
}

function formatCRMNote(data: any): string {
  let note = `## Call Summary\n\n`;
  note += `**Close Probability:** ${Math.round((data.close_probability || 0) * 100)}%\n`;
  note += `**Follow-up Urgency:** ${data.follow_up_urgency || 'Unknown'}\n\n`;

  if (data.buying_intent_signals?.length > 0) {
    note += `### Buying Signals\n`;
    data.buying_intent_signals.forEach((s: string) => { note += `- ${s}\n`; });
    note += '\n';
  }

  if (data.objections?.length > 0) {
    note += `### Objections\n`;
    data.objections.forEach((o: any) => {
      note += `- **${o.type}:** ${o.text} (${o.severity}${o.resolved ? ', resolved' : ''})\n`;
    });
    note += '\n';
  }

  if (data.stakeholders_mentioned?.length > 0) {
    note += `### Stakeholders Mentioned\n`;
    data.stakeholders_mentioned.forEach((s: string) => { note += `- ${s}\n`; });
    note += '\n';
  }

  if (data.next_step_commitments?.length > 0) {
    note += `### Next Steps\n`;
    data.next_step_commitments.forEach((s: string) => { note += `- ${s}\n`; });
    note += '\n';
  }

  note += `### Key Insights\n${data.key_insights || 'N/A'}\n\n`;
  note += `### Recommended Action\n${data.recommended_follow_up || 'N/A'}`;

  return note;
}

function generateTasks(data: any, organization_id: string): any[] {
  const tasks = [];
  const now = new Date();

  // Follow-up task based on urgency
  const dueDate = new Date(now);
  switch (data.follow_up_urgency) {
    case 'immediate':
      dueDate.setHours(dueDate.getHours() + 2);
      break;
    case 'within_24h':
      dueDate.setDate(dueDate.getDate() + 1);
      break;
    default:
      dueDate.setDate(dueDate.getDate() + 3);
  }

  tasks.push({
    organization_id,
    title: 'Send follow-up email',
    description: data.recommended_follow_up || 'Follow up on sales call',
    due_date: dueDate.toISOString(),
    priority: data.follow_up_urgency === 'immediate' ? 'high' : 'medium',
    status: 'pending'
  });

  // Tasks for unresolved objections
  data.objections?.forEach((objection: any) => {
    if (!objection.resolved && objection.severity !== 'low') {
      tasks.push({
        organization_id,
        title: `Address ${objection.type} objection`,
        description: objection.text,
        due_date: dueDate.toISOString(),
        priority: objection.severity === 'high' ? 'high' : 'medium',
        status: 'pending'
      });
    }
  });

  return tasks;
}
