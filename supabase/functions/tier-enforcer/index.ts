import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Feature requirements by agent type
const AGENT_TIER_REQUIREMENTS: Record<string, string> = {
  'sniper_outreach': 'standard',    // $99/mo
  'closer_agent': 'professional',   // $299/mo
  'voice_dialer': 'enterprise',     // $999/mo
  'meta_evolution': 'enterprise',   // $999/mo
  'genetic_optimizer': 'enterprise' // $999/mo
};

const TIER_HIERARCHY: Record<string, number> = {
  'free': 0,
  'trialing': 1,
  'standard': 1,
  'professional': 2,
  'enterprise': 3
};

interface TierCheckRequest {
  organizationId: string;
  tenantId?: string;
  agentType: string;
  action?: string;
}

interface TierCheckResponse {
  allowed: boolean;
  currentTier: string;
  requiredTier: string;
  message?: string;
  upgradeUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, tenantId, agentType, action }: TierCheckRequest = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get current tier from license_tenants
    let currentTier = 'free';
    let subscriptionStatus = 'none';
    let featuresEnabled: Record<string, boolean> = {};

    if (tenantId) {
      const { data: tenant } = await supabase
        .from('license_tenants')
        .select('current_tier, subscription_status, features_enabled')
        .eq('id', tenantId)
        .single();

      if (tenant) {
        currentTier = tenant.current_tier || 'standard';
        subscriptionStatus = tenant.subscription_status || 'trialing';
        featuresEnabled = (tenant.features_enabled as Record<string, boolean>) || {};
      }
    } else if (organizationId) {
      // Check if org has a tenant record
      const { data: tenant } = await supabase
        .from('license_tenants')
        .select('current_tier, subscription_status, features_enabled')
        .eq('organization_id', organizationId)
        .single();

      if (tenant) {
        currentTier = tenant.current_tier || 'standard';
        subscriptionStatus = tenant.subscription_status || 'trialing';
        featuresEnabled = (tenant.features_enabled as Record<string, boolean>) || {};
      } else {
        // No tenant record - check if it's the platform owner (always allowed)
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .single();

        if (org) {
          // Platform owner gets enterprise access
          currentTier = 'enterprise';
          subscriptionStatus = 'active';
        }
      }
    }

    // Check if subscription is active
    const validStatuses = ['active', 'trialing'];
    if (!validStatuses.includes(subscriptionStatus)) {
      return new Response(JSON.stringify({
        allowed: false,
        currentTier: currentTier,
        requiredTier: 'active subscription',
        message: `Your subscription is ${subscriptionStatus}. Please update your payment method to continue.`,
        upgradeUrl: '/settings?tab=billing'
      } as TierCheckResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get required tier for the agent
    const requiredTier = AGENT_TIER_REQUIREMENTS[agentType] || 'standard';
    const currentLevel = TIER_HIERARCHY[currentTier] || 0;
    const requiredLevel = TIER_HIERARCHY[requiredTier] || 0;

    // Check feature-level access (more granular)
    const featureKey = agentType.replace(/_/g, '_');
    if (featuresEnabled[featureKey] === false) {
      return new Response(JSON.stringify({
        allowed: false,
        currentTier: currentTier,
        requiredTier: requiredTier,
        message: `${agentType.replace(/_/g, ' ').toUpperCase()} is not included in your ${currentTier} plan. Upgrade to ${requiredTier} to unlock this feature.`,
        upgradeUrl: '/settings?tab=billing'
      } as TierCheckResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check tier level
    if (currentLevel < requiredLevel) {
      const tierPricing: Record<string, string> = {
        standard: '$99/mo',
        professional: '$299/mo',
        enterprise: '$999/mo'
      };

      return new Response(JSON.stringify({
        allowed: false,
        currentTier: currentTier,
        requiredTier: requiredTier,
        message: `${agentType.replace(/_/g, ' ').toUpperCase()} requires ${requiredTier} tier (${tierPricing[requiredTier]}). You're on ${currentTier}.`,
        upgradeUrl: '/settings?tab=billing'
      } as TierCheckResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the access check
    await supabase.from('agent_execution_logs').insert({
      organization_id: organizationId,
      action_type: 'tier_check',
      reasoning: `Access granted: ${agentType} on ${currentTier} tier`,
      action_details: { 
        agentType, 
        currentTier, 
        requiredTier,
        action,
        allowed: true
      },
      result: 'allowed'
    });

    return new Response(JSON.stringify({
      allowed: true,
      currentTier: currentTier,
      requiredTier: requiredTier,
      message: 'Access granted'
    } as TierCheckResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[Tier Enforcer] Error:", e);
    // On error, allow access but log warning
    return new Response(JSON.stringify({
      allowed: true,
      currentTier: 'unknown',
      requiredTier: 'unknown',
      message: 'Tier check failed - allowing access by default'
    } as TierCheckResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
