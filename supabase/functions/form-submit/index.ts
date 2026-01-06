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

    const { form_id, answers, metadata } = await req.json();
    console.log(`Form submission for form: ${form_id}`);

    // Get the form
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', form_id)
      .single();

    if (formError || !form) {
      return new Response(JSON.stringify({ error: 'Form not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get scoring rules
    const { data: rules } = await supabase
      .from('survey_rules')
      .select('*')
      .eq('form_id', form_id);

    // Calculate score based on answers
    let score = 0;
    let route = 'default';
    const appliedTags: string[] = [];

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        const ruleConfig = rule.rules_json || {};
        
        // Process scoring rules
        if (ruleConfig.scoring) {
          for (const [fieldId, scoreMap] of Object.entries(ruleConfig.scoring)) {
            const answer = answers[fieldId];
            const scoreMapping = scoreMap as Record<string, number>;
            if (answer && scoreMapping[answer]) {
              score += scoreMapping[answer];
            }
          }
        }

        // Process routing rules
        if (ruleConfig.routing) {
          for (const routeRule of ruleConfig.routing) {
            const { field, value, route: routeTo, minScore, maxScore } = routeRule;
            
            if (field && answers[field] === value) {
              route = routeTo;
            }
            
            if (minScore !== undefined && maxScore !== undefined) {
              if (score >= minScore && score <= maxScore) {
                route = routeTo;
              }
            }
          }
        }

        // Process tagging rules
        if (ruleConfig.tags) {
          for (const tagRule of ruleConfig.tags) {
            const { field, value, tag } = tagRule;
            if (answers[field] === value) {
              appliedTags.push(tag);
            }
          }
        }
      }
    }

    // Extract email for contact upsert
    const email = answers.email || answers.Email || metadata?.email;
    let contact_id = null;

    if (email) {
      // Upsert contact
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', form.organization_id)
        .eq('email', email)
        .single();

      if (existingContact) {
        contact_id = existingContact.id;
      } else {
        const { data: newContact } = await supabase
          .from('contacts')
          .insert({
            organization_id: form.organization_id,
            email,
            first_name: answers.first_name || answers.firstName || answers.name?.split(' ')[0] || '',
            last_name: answers.last_name || answers.lastName || answers.name?.split(' ').slice(1).join(' ') || '',
            phone: answers.phone || answers.Phone || '',
            source: 'form',
          })
          .select('id')
          .single();
        
        contact_id = newContact?.id;
      }

      // Apply tags to contact
      if (contact_id && appliedTags.length > 0) {
        for (const tagName of appliedTags) {
          // Find or create tag
          let { data: tag } = await supabase
            .from('tags')
            .select('id')
            .eq('organization_id', form.organization_id)
            .eq('name', tagName)
            .single();

          if (!tag) {
            const { data: newTag } = await supabase
              .from('tags')
              .insert({
                organization_id: form.organization_id,
                name: tagName,
                category: 'form',
              })
              .select('id')
              .single();
            tag = newTag;
          }

          if (tag) {
            await supabase
              .from('tag_applications')
              .upsert({
                tag_id: tag.id,
                entity_type: 'contact',
                entity_id: contact_id,
              }, { onConflict: 'tag_id,entity_type,entity_id' });
          }
        }
      }
    }

    // Create submission
    const { data: submission, error: subError } = await supabase
      .from('form_submissions')
      .insert({
        form_id,
        contact_id,
        answers,
        score,
        route,
        metadata: {
          ...metadata,
          applied_tags: appliedTags,
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent'),
        },
      })
      .select()
      .single();

    if (subError) throw subError;

    // Trigger any workflows
    await supabase.from('workflow_executions').insert({
      organization_id: form.organization_id,
      trigger_event: 'form.submitted',
      trigger_data: {
        form_id,
        submission_id: submission.id,
        contact_id,
        score,
        route,
        answers,
      },
    });

    console.log(`Form submission created: ${submission.id}, score: ${score}, route: ${route}`);

    return new Response(JSON.stringify({
      success: true,
      submission_id: submission.id,
      score,
      route,
      contact_id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Form submit error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});