import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OnboardingConfig {
  path: 'one_on_one' | 'group' | 'productized' | 'hybrid';
  welcome_template: string;
  intake_form_id: string;
  kickoff_booking_page: string;
  asset_links: string[];
  tasks: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      payment_id,
      contact_id,
      opportunity_id,
      organization_id,
      product_type,
      action
    } = await req.json();

    if (!organization_id) {
      throw new Error('organization_id is required');
    }

    switch (action) {
      case 'initiate':
        return await initiateOnboarding(supabase, {
          payment_id,
          contact_id,
          opportunity_id,
          organization_id,
          product_type
        });

      case 'check_intake':
        return await checkIntakeStatus(supabase, contact_id, organization_id);

      case 'send_reminder':
        return await sendIntakeReminder(supabase, contact_id, organization_id);

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: unknown) {
    console.error('Onboarding autopilot error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function initiateOnboarding(supabase: any, params: {
  payment_id?: string;
  contact_id?: string;
  opportunity_id?: string;
  organization_id: string;
  product_type?: string;
}) {
  const { payment_id, contact_id, opportunity_id, organization_id, product_type } = params;

  // Fetch contact info
  let contact;
  if (contact_id) {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contact_id)
      .single();
    contact = data;
  }

  // Fetch business config for onboarding settings
  const { data: businessConfig } = await supabase
    .from('business_config')
    .select('*')
    .eq('organization_id', organization_id)
    .single();

  // Determine onboarding path
  const path = determineOnboardingPath(product_type, businessConfig);
  const config = getOnboardingConfig(path, businessConfig);

  // Apply client tags
  if (contact_id) {
    await applyTags(supabase, organization_id, contact_id, ['Client', 'Onboarding', `Path:${path}`]);
  }

  // Generate welcome email
  const welcomeEmail = generateWelcomeEmail(config, contact);

  // Create onboarding tasks
  const tasks = config.tasks.map((taskTitle, index) => ({
    organization_id,
    title: taskTitle,
    description: `Onboarding task ${index + 1} of ${config.tasks.length}`,
    due_date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
    priority: index === 0 ? 'high' : 'medium',
    status: 'pending',
    related_entity_type: 'contact',
    related_entity_id: contact_id
  }));

  await supabase.from('crm_tasks').insert(tasks);

  // Update opportunity status if exists
  if (opportunity_id) {
    await supabase
      .from('opportunities')
      .update({ status: 'closed_won' })
      .eq('id', opportunity_id);
  }

  // Log activity
  if (contact_id) {
    await supabase.from('activities').insert({
      organization_id,
      contact_id,
      opportunity_id,
      activity_type: 'onboarding_started',
      subject: 'Client Onboarding Initiated',
      body: `Onboarding path: ${path}. ${config.tasks.length} tasks created.`
    });
  }

  // Log autonomous action
  await supabase.from('autonomous_actions').insert({
    organization_id,
    agent_type: 'onboarding_autopilot',
    action_type: 'onboarding_initiated',
    target_entity_type: 'contact',
    target_entity_id: contact_id,
    decision: path,
    reasoning: `Product type: ${product_type || 'default'}. Created ${config.tasks.length} tasks.`,
    confidence_score: 95,
    was_auto_executed: true,
    executed_at: new Date().toISOString()
  });

  return new Response(JSON.stringify({
    message: 'Onboarding initiated',
    path,
    welcome_email: welcomeEmail,
    intake_form_id: config.intake_form_id,
    kickoff_booking_page: config.kickoff_booking_page,
    tasks_created: tasks.length
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function checkIntakeStatus(supabase: any, contact_id: string, organization_id: string) {
  if (!contact_id) {
    throw new Error('contact_id is required');
  }

  // Check for intake form submission
  const { data: submissions } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('organization_id', organization_id)
    .eq('contact_id', contact_id)
    .order('created_at', { ascending: false })
    .limit(1);

  const hasIntake = submissions && submissions.length > 0;
  
  // Get time since onboarding started
  const { data: onboardingActivity } = await supabase
    .from('activities')
    .select('created_at')
    .eq('contact_id', contact_id)
    .eq('activity_type', 'onboarding_started')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let hoursSinceStart = 0;
  if (onboardingActivity) {
    hoursSinceStart = (Date.now() - new Date(onboardingActivity.created_at).getTime()) / (1000 * 60 * 60);
  }

  const needsReminder = !hasIntake && hoursSinceStart > 72;

  return new Response(JSON.stringify({
    intake_completed: hasIntake,
    hours_since_onboarding_start: Math.round(hoursSinceStart),
    needs_reminder: needsReminder,
    submission: hasIntake ? submissions[0] : null
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function sendIntakeReminder(supabase: any, contact_id: string, organization_id: string) {
  if (!contact_id) {
    throw new Error('contact_id is required');
  }

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contact_id)
    .single();

  const reminderEmail = {
    subject: 'Quick reminder: Complete your onboarding',
    body: `Hi ${contact?.first_name || 'there'},

I noticed you haven't completed your onboarding intake form yet. 

This helps me prepare everything for our kickoff call and ensures we can hit the ground running.

It only takes about 5 minutes:
[INTAKE_FORM_LINK]

Looking forward to getting started!`
  };

  // Log the reminder
  await supabase.from('activities').insert({
    organization_id,
    contact_id,
    activity_type: 'intake_reminder_sent',
    subject: 'Intake Reminder',
    body: 'Automated intake reminder sent'
  });

  return new Response(JSON.stringify({
    message: 'Reminder prepared',
    email: reminderEmail
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function determineOnboardingPath(
  productType?: string, 
  businessConfig?: any
): 'one_on_one' | 'group' | 'productized' | 'hybrid' {
  // Use product type if specified
  if (productType) {
    const typeMap: Record<string, 'one_on_one' | 'group' | 'productized' | 'hybrid'> = {
      'coaching': 'one_on_one',
      'consulting': 'one_on_one',
      'course': 'productized',
      'program': 'group',
      'service': 'one_on_one',
      'template': 'productized',
      'membership': 'group'
    };
    return typeMap[productType.toLowerCase()] || 'one_on_one';
  }

  // Default based on business model
  const model = businessConfig?.business_model;
  if (model === 'productized') return 'productized';
  if (model === 'group') return 'group';
  
  return 'one_on_one';
}

function getOnboardingConfig(
  path: 'one_on_one' | 'group' | 'productized' | 'hybrid',
  businessConfig?: any
): OnboardingConfig {
  const baseConfig: OnboardingConfig = {
    path,
    welcome_template: 'WELCOME_01',
    intake_form_id: '',
    kickoff_booking_page: businessConfig?.booking_link || '',
    asset_links: [],
    tasks: []
  };

  switch (path) {
    case 'one_on_one':
      return {
        ...baseConfig,
        tasks: [
          'Send welcome email',
          'Client completes intake form',
          'Schedule kickoff call',
          'Prepare kickoff materials',
          'Conduct kickoff call',
          'Send follow-up resources'
        ]
      };

    case 'group':
      return {
        ...baseConfig,
        tasks: [
          'Send welcome email with group access',
          'Client joins community platform',
          'Client completes intake form',
          'Add to next cohort',
          'Send calendar invite for group calls'
        ]
      };

    case 'productized':
      return {
        ...baseConfig,
        tasks: [
          'Send welcome email with access credentials',
          'Client accesses deliverable',
          'Schedule optional Q&A call',
          'Send feedback request (day 7)'
        ]
      };

    case 'hybrid':
      return {
        ...baseConfig,
        tasks: [
          'Send welcome email',
          'Client completes intake form',
          'Provision course/template access',
          'Schedule kickoff call',
          'Add to support community'
        ]
      };
  }
}

function generateWelcomeEmail(config: OnboardingConfig, contact?: any): { subject: string; body: string } {
  const firstName = contact?.first_name || 'there';

  const pathIntros: Record<string, string> = {
    'one_on_one': "I'm excited to start working with you directly.",
    'group': "Welcome to the group! You're joining an incredible cohort.",
    'productized': "Your purchase is ready and waiting for you.",
    'hybrid': "You've got access to everything you need to get started."
  };

  return {
    subject: `Welcome! Here's how to get started`,
    body: `Hi ${firstName},

${pathIntros[config.path]}

Here's what happens next:

1. **Complete your intake form** (5 minutes)
   This helps me understand your specific situation and prepare for our work together.
   [INTAKE_FORM_LINK]

2. **Book your kickoff call**
   [BOOKING_LINK]

3. **Access your resources**
   [RESOURCE_LINKS]

If you have any questions, just reply to this email.

Looking forward to helping you achieve [THEIR_GOAL]!`
  };
}

async function applyTags(
  supabase: any, 
  organization_id: string, 
  contact_id: string, 
  tagNames: string[]
) {
  for (const tagName of tagNames) {
    // Get or create tag
    let { data: tag } = await supabase
      .from('tags')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('name', tagName)
      .single();

    if (!tag) {
      const { data: newTag } = await supabase
        .from('tags')
        .insert({ organization_id, name: tagName, entity_type: 'contact' })
        .select('id')
        .single();
      tag = newTag;
    }

    if (tag) {
      // Apply tag to contact
      await supabase
        .from('tag_applications')
        .upsert({
          tag_id: tag.id,
          entity_type: 'contact',
          entity_id: contact_id
        }, { onConflict: 'tag_id,entity_type,entity_id' });
    }
  }
}
