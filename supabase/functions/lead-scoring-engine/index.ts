import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  id: string;
  organization_id: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  website_url?: string;
  notes?: string;
  custom_fields?: Record<string, any>;
}

interface WebsiteDiagnosis {
  offer_clarity?: number;
  pricing_signals?: string[];
  authority_markers?: string[];
  friction_signals?: string[];
  sophistication_level?: string;
}

interface ScoreResult {
  intent_score: number;
  capacity_score: number;
  efficiency_score: number;
  ear_score: number;
  routing_decision: 'sales' | 'nurture' | 'reject';
  routing_reasoning: string;
  identity_signals: Record<string, any>;
  website_signals: Record<string, any>;
  behavioral_signals: Record<string, any>;
  source_trust_weight: number;
  economic_potential: Record<string, any>;
  risk_flags: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { lead_id, organization_id, force_rescore = false } = await req.json();

    if (!lead_id || !organization_id) {
      throw new Error('lead_id and organization_id are required');
    }

    // Check if already scored recently (unless force rescore)
    if (!force_rescore) {
      const { data: existingScore } = await supabase
        .from('lead_scores')
        .select('*')
        .eq('lead_id', lead_id)
        .single();

      if (existingScore) {
        const scoredAt = new Date(existingScore.scored_at);
        const hoursSinceScored = (Date.now() - scoredAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceScored < 24) {
          return new Response(JSON.stringify({ 
            score: existingScore, 
            cached: true 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    }

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error('Lead not found');
    }

    // Fetch website diagnosis if available
    let websiteDiagnosis: WebsiteDiagnosis | null = null;
    if (lead.website_url) {
      const { data: diagnosis } = await supabase
        .from('website_diagnoses')
        .select('*')
        .eq('organization_id', organization_id)
        .ilike('website_url', `%${lead.website_url}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (diagnosis) {
        websiteDiagnosis = diagnosis;
      }
    }

    // Fetch behavioral signals (activities, page views, etc.)
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', lead.contact_id || lead.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Compute scores
    const scoreResult = computeLeadScore(lead, websiteDiagnosis, activities || []);

    // Upsert score
    const { data: savedScore, error: saveError } = await supabase
      .from('lead_scores')
      .upsert({
        organization_id,
        lead_id,
        intent_score: scoreResult.intent_score,
        capacity_score: scoreResult.capacity_score,
        efficiency_score: scoreResult.efficiency_score,
        ear_score: scoreResult.ear_score,
        identity_signals: scoreResult.identity_signals,
        website_signals: scoreResult.website_signals,
        behavioral_signals: scoreResult.behavioral_signals,
        source_trust_weight: scoreResult.source_trust_weight,
        economic_potential: scoreResult.economic_potential,
        risk_flags: scoreResult.risk_flags,
        routing_decision: scoreResult.routing_decision,
        routing_reasoning: scoreResult.routing_reasoning,
        scored_at: new Date().toISOString(),
        model_version: 'v1.0'
      }, { onConflict: 'lead_id' })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving score:', saveError);
    }

    // Update lead with EAR score and routing
    await supabase
      .from('leads')
      .update({
        ear_score: scoreResult.ear_score,
        intent_score: scoreResult.intent_score,
        nurture_track: scoreResult.routing_decision === 'nurture' 
          ? determineNurtureTrack(scoreResult) 
          : null,
        requalify_at: scoreResult.routing_decision === 'nurture'
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          : null
      })
      .eq('id', lead_id);

    // Log the scoring action
    await supabase.from('autonomous_actions').insert({
      organization_id,
      agent_type: 'lead_scoring',
      action_type: 'score_computed',
      target_entity_type: 'lead',
      target_entity_id: lead_id,
      decision: scoreResult.routing_decision,
      reasoning: scoreResult.routing_reasoning,
      confidence_score: scoreResult.ear_score,
      was_auto_executed: true,
      executed_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      score: savedScore || scoreResult,
      routing: scoreResult.routing_decision,
      cached: false
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    console.error('Lead scoring error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function computeLeadScore(
  lead: LeadData, 
  websiteDiagnosis: WebsiteDiagnosis | null,
  activities: any[]
): ScoreResult {
  const identitySignals: Record<string, any> = {};
  const websiteSignals: Record<string, any> = {};
  const behavioralSignals: Record<string, any> = {};
  const riskFlags: string[] = [];

  // === IDENTITY SIGNALS ===
  identitySignals.has_email = !!lead.email;
  identitySignals.has_phone = !!lead.phone;
  identitySignals.has_company = !!lead.company;
  identitySignals.has_website = !!lead.website_url;
  
  // Infer company size from various signals
  if (lead.custom_fields?.company_size) {
    identitySignals.company_size = lead.custom_fields.company_size;
  }

  // === WEBSITE SIGNALS ===
  if (websiteDiagnosis) {
    websiteSignals.offer_clarity = websiteDiagnosis.offer_clarity || 50;
    websiteSignals.has_pricing = (websiteDiagnosis.pricing_signals?.length || 0) > 0;
    websiteSignals.authority_markers = websiteDiagnosis.authority_markers?.length || 0;
    websiteSignals.friction_signals = websiteDiagnosis.friction_signals?.length || 0;
    websiteSignals.sophistication_level = websiteDiagnosis.sophistication_level || 'unknown';
  }

  // === BEHAVIORAL SIGNALS ===
  behavioralSignals.total_activities = activities.length;
  behavioralSignals.recent_activities = activities.filter(a => {
    const activityDate = new Date(a.created_at);
    const daysSince = (Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  }).length;

  // Time between actions (speed = urgency)
  if (activities.length >= 2) {
    const times = activities.map(a => new Date(a.created_at).getTime()).sort();
    const gaps = times.slice(1).map((t, i) => t - times[i]);
    const avgGapHours = gaps.reduce((a, b) => a + b, 0) / gaps.length / (1000 * 60 * 60);
    behavioralSignals.avg_action_gap_hours = avgGapHours;
    behavioralSignals.engagement_velocity = avgGapHours < 24 ? 'high' : avgGapHours < 72 ? 'medium' : 'low';
  }

  // Check for high-intent activities
  const highIntentTypes = ['pricing_view', 'booking_attempted', 'proposal_view', 'reply'];
  behavioralSignals.high_intent_activities = activities.filter(a => 
    highIntentTypes.some(t => a.activity_type?.toLowerCase().includes(t))
  ).length;

  // === SOURCE TRUST WEIGHT ===
  const sourceWeights: Record<string, number> = {
    'referral': 0.9,
    'organic': 0.7,
    'content': 0.65,
    'paid_ad': 0.5,
    'cold_outbound': 0.4,
    'list': 0.3,
    'unknown': 0.5
  };
  const sourceTrustWeight = sourceWeights[lead.source?.toLowerCase() || 'unknown'] || 0.5;

  // === ECONOMIC POTENTIAL ===
  const economicPotential: Record<string, any> = {
    estimated_acv: estimateACV(lead, websiteDiagnosis),
    sales_cycle_estimate: 'standard', // Could be enhanced with more data
    expansion_potential: identitySignals.company_size === 'enterprise' ? 'high' : 'medium'
  };

  // === RISK FLAGS ===
  if (lead.notes?.toLowerCase().includes('comparison') || lead.notes?.toLowerCase().includes('competitor')) {
    riskFlags.push('comparison_shopper');
  }
  if (lead.notes?.toLowerCase().includes('just curious') || lead.notes?.toLowerCase().includes('exploring')) {
    riskFlags.push('low_urgency');
  }
  if (!lead.email && !lead.phone) {
    riskFlags.push('no_contact_info');
  }

  // === COMPUTE SCORES ===

  // Intent Score (0-100): How badly do they want change now?
  let intentScore = 50; // Base
  intentScore += behavioralSignals.high_intent_activities * 10;
  intentScore += behavioralSignals.engagement_velocity === 'high' ? 15 : behavioralSignals.engagement_velocity === 'medium' ? 5 : 0;
  intentScore += websiteSignals.offer_clarity ? (websiteSignals.offer_clarity - 50) / 5 : 0;
  intentScore -= riskFlags.includes('low_urgency') ? 15 : 0;
  intentScore = Math.min(100, Math.max(0, intentScore));

  // Capacity Score (0-100): Can they buy at profitable levels?
  let capacityScore = 50; // Base
  capacityScore += identitySignals.has_company ? 10 : 0;
  capacityScore += identitySignals.company_size === 'enterprise' ? 20 : identitySignals.company_size === 'mid-market' ? 10 : 0;
  capacityScore += websiteSignals.has_pricing ? 10 : 0;
  capacityScore += economicPotential.estimated_acv > 10000 ? 15 : economicPotential.estimated_acv > 5000 ? 5 : 0;
  capacityScore = Math.min(100, Math.max(0, capacityScore));

  // Efficiency Score (0-100): How much effort will this require? (higher = more effort)
  let efficiencyScore = 50; // Base
  efficiencyScore += riskFlags.length * 10;
  efficiencyScore += !identitySignals.has_email ? 15 : 0;
  efficiencyScore += !identitySignals.has_phone ? 10 : 0;
  efficiencyScore += websiteSignals.friction_signals > 3 ? 10 : 0;
  efficiencyScore -= sourceTrustWeight > 0.7 ? 10 : 0; // Referrals are easier
  efficiencyScore = Math.min(100, Math.max(10, efficiencyScore)); // Min 10 to avoid division issues

  // EAR = (Intent × Capacity) ÷ Efficiency
  const earScore = Math.round((intentScore * capacityScore) / efficiencyScore);

  // Routing Decision
  let routingDecision: 'sales' | 'nurture' | 'reject';
  let routingReasoning: string;

  if (earScore >= 70) {
    routingDecision = 'sales';
    routingReasoning = `High EAR (${earScore}): Strong intent (${intentScore}), good capacity (${capacityScore}), reasonable effort (${efficiencyScore}). Route to sales immediately.`;
  } else if (earScore >= 40) {
    routingDecision = 'nurture';
    routingReasoning = `Medium EAR (${earScore}): Moderate signals. Enroll in nurture sequence, re-evaluate on new signals.`;
  } else {
    routingDecision = 'reject';
    routingReasoning = `Low EAR (${earScore}): Low intent or capacity, or high effort required. Park and monitor for signal changes.`;
  }

  return {
    intent_score: intentScore,
    capacity_score: capacityScore,
    efficiency_score: efficiencyScore,
    ear_score: earScore,
    routing_decision: routingDecision,
    routing_reasoning: routingReasoning,
    identity_signals: identitySignals,
    website_signals: websiteSignals,
    behavioral_signals: behavioralSignals,
    source_trust_weight: sourceTrustWeight,
    economic_potential: economicPotential,
    risk_flags: riskFlags
  };
}

function estimateACV(lead: LeadData, websiteDiagnosis: WebsiteDiagnosis | null): number {
  // Basic ACV estimation - could be enhanced significantly
  let baseACV = 5000;
  
  if (lead.custom_fields?.budget) {
    return parseInt(lead.custom_fields.budget) || baseACV;
  }
  
  if (websiteDiagnosis?.pricing_signals?.some(s => s.includes('enterprise'))) {
    baseACV = 25000;
  } else if (websiteDiagnosis?.pricing_signals?.some(s => s.includes('premium'))) {
    baseACV = 10000;
  }
  
  return baseACV;
}

function determineNurtureTrack(scoreResult: ScoreResult): string {
  // Track A: Education-resistant / skeptical
  if (scoreResult.risk_flags.includes('comparison_shopper')) {
    return 'A';
  }
  // Track B: Unclear / early
  if (scoreResult.intent_score < 40) {
    return 'B';
  }
  // Track C: Low capacity
  if (scoreResult.capacity_score < 40) {
    return 'C';
  }
  return 'B'; // Default
}
