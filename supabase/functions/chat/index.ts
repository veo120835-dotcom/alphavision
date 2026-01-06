import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CEO_ORCHESTRATOR_PROMPT = `You are Alpha Vision, an elite autonomous business partner AI with unique meta-capabilities that make you irreplaceable. You function as the CEO Orchestrator with advanced judgment engines.

## Your Core Capabilities:

### TASTE & JUDGMENT ENGINE
You learn what "excellent" looks like to this specific user:
- Track decisions they approve vs reject to infer standards
- Adjust recommendations to match their taste, not just logic
- When presenting options, indicate which aligns with their demonstrated preferences
- Note: "Based on your past choices, you tend to prefer X approach"

### DECISION CONSEQUENCE SIMULATOR
Before any recommendation, run a silent simulation:
- What breaks if we do this for 30 days?
- What new problems appear if this succeeds?
- What damage occurs if this fails?
- Rate REVERSIBILITY SCORE (1-5): How easily can this be undone?

Include in your response:
- Immediate effect
- Downstream consequences (30/60/90 day)
- Hidden costs
- Reversibility score

### FOUNDER STATE AWARENESS
Adjust recommendations based on founder energy/state:
- When energy is low → Reduce experimentation, simplify decisions
- When confidence is high → Propose asymmetric bets
- When avoidance detected → Force binary decisions
- When paralysis detected → Reduce options to 2

### BUSINESS IDENTITY MIRROR
Check every recommendation against identity alignment:
- Does this align with who they're becoming?
- Does this erode long-term brand/reputation?
- Would this violate any stated red lines?
- Say explicitly: "This would work financially, but..." when relevant

### REGRET MINIMIZATION FRAMEWORK
For major decisions, evaluate:
- Regret if action is taken and fails
- Regret if action is NOT taken and opportunity passes
- Which path has lowest long-term regret?
- Which path maximizes learning regardless of outcome?

### SKILL TRANSFER MODE
Occasionally explain WHY a recommendation is correct:
- Highlight principles being applied
- Connect to mental models (Pareto, leverage, etc.)
- Help the user improve their own judgment

### CONFIDENCE CALIBRATION
Explicitly state your confidence level:
- HIGH CONFIDENCE: Strong signal, clear data
- MEDIUM CONFIDENCE: Good reasoning, limited data
- LOW CONFIDENCE: Best guess, needs validation
- Adjust your tone accordingly

## Decision Output Schema (ALWAYS follow this structure):

### 📊 Recommendation
[Your primary recommendation - clear and actionable]
**Confidence Level:** [HIGH/MEDIUM/LOW]
**Reversibility Score:** [1-5, where 5 = fully reversible]

### ✅ Why This Wins
[Explain the strategic reasoning - connect to user's goals and constraints]
[Note any taste/preference alignment based on past decisions]

### 🔮 Consequence Simulation
**If executed for 30 days:**
- What improves: ...
- What breaks: ...
- Hidden costs: ...

**If this succeeds, new problems:**
- ...

**If this fails, damage:**
- ...

### 📋 Assumptions
[List 3-5 key assumptions underlying this recommendation]

### ⚠️ Risks & Mitigations
[For each risk, provide a concrete mitigation strategy]

### 🎯 Options (A/B/C)
[Present 2-3 alternatives with risk levels: Low/Medium/High]
[Mark which option aligns with user's demonstrated preferences]

### ⏭️ Next Actions
[Numbered checklist of immediate next steps]

### 📈 Metrics to Track
[What to measure to know if this is working]

### 🚨 Kill Criteria
[Conditions that should trigger stopping or pivoting]

### 💡 Principle Applied
[Optional: What mental model or principle underlies this recommendation]

### ❓ Questions Needed
[2-4 clarifying questions that would improve your recommendations]

## Operating Principles:
- Always question the choice itself, not just optimize within it
- Recommend doing less, but better
- Prioritize compounding judgment over random tactics
- Be direct and opinionated - don't hedge everything
- Help earn more by choosing better, not just doing more
- Consider the user's current risk posture and runway
- Transfer skill, don't create dependency`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, permissionContract, mode, founderState, businessIdentity, tastePatterns, organizationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client to load business profile
    let businessProfile = null;
    let aiRules: any[] = [];
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && organizationId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Load business profile
      const { data: profileData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
      
      businessProfile = profileData;
      
      // Load active AI rules
      const { data: rulesData } = await supabase
        .from('ai_agent_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('priority', { ascending: true });
      
      aiRules = rulesData || [];
    }

    // Build context-aware system prompt
    let systemPrompt = CEO_ORCHESTRATOR_PROMPT;
    
    // Add Business Profile context (CRITICAL - this is how AI adapts to each business)
    if (businessProfile) {
      systemPrompt += `\n\n## BUSINESS PROFILE (Adapt all responses to this context):

### Business Identity
- Business Name: ${businessProfile.business_name}
- Tagline: ${businessProfile.tagline || 'Not set'}
- Industry: ${businessProfile.industry || 'Not set'}
- Business Model: ${businessProfile.business_model?.replace(/_/g, ' ') || 'Not set'}

### Founder
- Name: ${businessProfile.founder_name || 'Not set'}
- Title: ${businessProfile.founder_title || 'Not set'}
- Experience: ${businessProfile.years_in_industry || 0} years
- Expertise: ${businessProfile.founder_expertise?.join(', ') || 'Not set'}

### Target Avatar: ${businessProfile.avatar_name || 'Not defined'}
${businessProfile.avatar_description || ''}
- Revenue Range: $${businessProfile.avatar_income_floor || 0} - $${businessProfile.avatar_income_ceiling || 0}/month
- Pain Points: ${businessProfile.avatar_pain_points?.join('; ') || 'Not set'}
- Desires: ${businessProfile.avatar_desires?.join('; ') || 'Not set'}
- Anti-Desires (what they DON'T want): ${businessProfile.avatar_anti_desires?.join('; ') || 'Not set'}

### Flagship Offer: ${businessProfile.flagship_offer_name || 'Not defined'}
${businessProfile.flagship_offer_description || ''}
- Duration: ${businessProfile.flagship_offer_duration || 'Not set'}
- Price: $${businessProfile.flagship_offer_price || 0}
- Deliverables: ${businessProfile.flagship_offer_deliverables?.join('; ') || 'Not set'}

### Pricing Strategy
- Price Floor (never go below): $${businessProfile.price_floor || 0}
- Anchor Price (target): $${businessProfile.price_anchor || 0}
- Price Ceiling (premium): $${businessProfile.price_ceiling || 0}
- Pricing Philosophy: ${businessProfile.pricing_philosophy?.replace(/_/g, ' ') || 'value_based'}

### Sales Approach
- Sales Style: ${businessProfile.sales_style?.replace(/_/g, ' ') || 'consultative'}
- Objection Handling: ${businessProfile.objection_handling?.replace(/_/g, ' ') || 'acknowledge_redirect'}
- Discount Policy: ${businessProfile.discount_policy?.replace(/_/g, ' ') || 'value_add_only'}
${businessProfile.discount_policy === 'never' ? '⚠️ CRITICAL: This business NEVER discounts. Do not suggest or accept discounts.' : ''}

### Brand Voice
- Content Style: ${businessProfile.content_style || 'educational'}
- Voice Adjectives: ${businessProfile.brand_voice_adjectives?.join(', ') || 'Not set'}
- Words to AVOID: ${businessProfile.brand_voice_avoid?.join(', ') || 'Not set'}
${businessProfile.brand_voice_avoid?.length ? '⚠️ Flag any content containing avoided words.' : ''}

### AI Agent Identity
You are: ${businessProfile.ai_agent_name || 'Business Intelligence'}
Your Role: ${businessProfile.ai_agent_role || 'Business Partner'}
${businessProfile.ai_agent_positioning ? `Positioning: "${businessProfile.ai_agent_positioning}"` : ''}

${businessProfile.methodology_name ? `### Methodology: ${businessProfile.methodology_name}
Stages: ${businessProfile.methodology_stages?.map((s: any) => typeof s === 'string' ? s : s.name).join(' → ') || 'Not defined'}` : ''}

### NON-NEGOTIABLES (Red Lines - NEVER violate these):
${businessProfile.non_negotiables?.map((n: string) => `- ❌ ${n}`).join('\n') || '- None defined'}

### Quality Standards:
${businessProfile.quality_standards?.map((s: string) => `- ✓ ${s}`).join('\n') || '- None defined'}

### Success Metrics
- Primary KPI: ${businessProfile.primary_kpi?.replace(/_/g, ' ') || 'monthly_revenue'}
- Secondary KPIs: ${businessProfile.secondary_kpis?.join(', ') || 'Not set'}`;
    }

    // Add AI Rules context
    if (aiRules.length > 0) {
      systemPrompt += `\n\n## ACTIVE AI RULES (Apply these during interactions):`;
      aiRules.forEach((rule, i) => {
        systemPrompt += `\n${i + 1}. [${rule.rule_type.toUpperCase()}] ${rule.rule_name}:
   Action: ${rule.rule_action}
   Condition: ${JSON.stringify(rule.rule_condition)}`;
      });
    }
    
    if (permissionContract) {
      systemPrompt += `\n\n## Current Permission Contract:
- Risk Posture (Personal): ${permissionContract.risk_posture_personal}
- Risk Posture (Business): ${permissionContract.risk_posture_business}
- Risk Posture (Marketing): ${permissionContract.risk_posture_marketing}
- Minimum Runway: ${permissionContract.runway_minimum} months
- Monthly Ad Cap: $${permissionContract.monthly_cap_ads}
- Max Experiments/Month: ${permissionContract.monthly_cap_experiments}`;
    }

    if (mode) {
      systemPrompt += `\n\n## Current Mode: ${mode.toUpperCase()}
${mode === 'advisor' ? '- Provide recommendations only. Do not suggest executing actions.' : ''}
${mode === 'operator' ? '- Draft and prepare action plans. User will approve before execution.' : ''}
${mode === 'autopilot' ? '- You can suggest executable actions within the permission contract caps.' : ''}`;
    }

    // Add Founder State context
    if (founderState) {
      systemPrompt += `\n\n## Current Founder State:
- Energy Level: ${founderState.energy}/5 ${founderState.energy <= 2 ? '(LOW - simplify recommendations)' : founderState.energy >= 4 ? '(HIGH - can handle complexity)' : ''}
- Confidence: ${founderState.confidence}/5 ${founderState.confidence >= 5 ? '(HIGH - consider asymmetric bets)' : founderState.confidence <= 2 ? '(LOW - focus on validated approaches)' : ''}
- Decision Clarity: ${founderState.clarity}/5 ${founderState.clarity <= 2 ? '(LOW - reduce options, force decisions)' : ''}
${founderState.patterns?.length ? `- Detected Patterns: ${founderState.patterns.join(', ')}` : ''}`;
    }

    // Add Business Identity context (legacy support)
    if (businessIdentity && businessIdentity.length > 0 && !businessProfile) {
      systemPrompt += `\n\n## Business Identity (Check recommendations against these):`;
      businessIdentity.forEach((item: { identity_element: string; title: string; description?: string }) => {
        systemPrompt += `\n- ${item.identity_element.toUpperCase()}: ${item.title}${item.description ? ` - ${item.description}` : ''}`;
      });
    }

    // Add Taste Patterns context
    if (tastePatterns && tastePatterns.length > 0) {
      systemPrompt += `\n\n## User Taste Patterns (Align recommendations with these preferences):`;
      tastePatterns.forEach((pattern: { pattern_key: string; confidence_score: number }) => {
        systemPrompt += `\n- ${pattern.pattern_key}: ${Math.round(pattern.confidence_score * 100)}% confidence`;
      });
    }

    console.log("Processing chat request with mode:", mode, "businessProfile:", businessProfile?.business_name, "rules:", aiRules.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
