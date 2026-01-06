import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const META_EVOLUTION_PROMPT = `ACT AS: AI Optimization Engineer specializing in genetic prompt evolution.

TASK: Analyze the performance data and evolve the agent prompts using survival-of-the-fittest logic.

ANALYSIS FRAMEWORK:
1. PERFORMANCE RANKING: Rank variants by success rate (successes / uses)
2. SURVIVOR SELECTION: Keep variants with >10% success rate AND >20 uses
3. ELIMINATION: Kill variants with <5% success rate AND >50 uses (enough data to judge)
4. MUTATION: Create 2-3 new variants from top performers with slight modifications

MUTATION STRATEGIES:
- AGGRESSIVE: More direct, urgency-driven language
- FRIENDLY: Warmer tone, relationship-building focus  
- DATA-DRIVEN: More statistics, proof points, ROI focus
- CONCISE: Shorter, punchier version
- STORYTELLING: Lead with a mini case study or analogy

OUTPUT FORMAT (JSON):
{
  "analysis": {
    "period": "date range analyzed",
    "total_variants": number,
    "top_performer": { "id": "...", "success_rate": number, "variant_tag": "..." },
    "variants_to_kill": ["variant_id1", "variant_id2"],
    "variants_to_keep": ["variant_id1", "variant_id2"]
  },
  "new_variants": [
    {
      "prompt_text": "The evolved prompt text",
      "variant_tag": "mutation_strategy_vN",
      "parent_variant_id": "id of parent variant",
      "mutation_strategy": "AGGRESSIVE|FRIENDLY|DATA-DRIVEN|CONCISE|STORYTELLING",
      "expected_improvement": "Why this should perform better"
    }
  ],
  "evolution_summary": "Brief description of what changed and why",
  "next_evolution_focus": "What to monitor for next evolution cycle"
}`;

interface EvolutionRequest {
  organizationId: string;
  periodDays?: number;
  mode?: 'analyze' | 'breed_all' | 'breed_agent';
  agentType?: string;
  currentPrompts?: {
    closer?: string;
    reflexionCriteria?: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, periodDays = 7, mode = 'analyze', agentType, currentPrompts }: EvolutionRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch performance data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // GENETIC EVOLUTION MODE: Breed new variants from winners
    if (mode === 'breed_all' || mode === 'breed_agent') {
      const agentTypes = mode === 'breed_agent' && agentType 
        ? [agentType] 
        : ['sniper_email', 'closer_chat', 'voice_script'];

      const allEvolutions = [];

      for (const agent of agentTypes) {
        // Get all variants for this agent type
        const { data: variants } = await supabase
          .from('prompt_variants')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('agent_type', agent)
          .eq('is_active', true);

        if (!variants || variants.length === 0) {
          console.log(`[Evolution] No variants for ${agent}, creating seed variants`);
          // Create initial seed variants if none exist
          const seedVariants = [
            {
              organization_id: organizationId,
              agent_type: agent,
              prompt_text: `You are a professional ${agent.replace('_', ' ')} assistant. Be helpful, concise, and focused on delivering value to the prospect.`,
              variant_tag: 'baseline_v1',
              generation: 1
            },
            {
              organization_id: organizationId,
              agent_type: agent,
              prompt_text: `You are an aggressive ${agent.replace('_', ' ')} specialist. Use urgency, scarcity, and direct calls to action. Be bold and confident.`,
              variant_tag: 'aggressive_v1',
              generation: 1
            },
            {
              organization_id: organizationId,
              agent_type: agent,
              prompt_text: `You are a friendly ${agent.replace('_', ' ')} expert. Focus on building rapport, asking questions, and genuinely helping. Avoid pushy tactics.`,
              variant_tag: 'friendly_v1',
              generation: 1
            }
          ];
          
          await supabase.from('prompt_variants').insert(seedVariants);
          allEvolutions.push({ agent, action: 'seeded', variants_created: 3 });
          continue;
        }

        // Calculate success rates
        const variantsWithRates = variants.map(v => ({
          ...v,
          success_rate: v.uses > 0 ? (v.successes / v.uses) * 100 : 0
        }));

        // Sort by success rate
        variantsWithRates.sort((a, b) => b.success_rate - a.success_rate);

        // Identify winners and losers
        const winners = variantsWithRates.filter(v => v.success_rate >= 10 && v.uses >= 20);
        const toKill = variantsWithRates.filter(v => v.success_rate < 5 && v.uses >= 50);

        // Kill underperformers
        if (toKill.length > 0) {
          await supabase
            .from('prompt_variants')
            .update({ is_active: false })
            .in('id', toKill.map(v => v.id));
        }

        // If we have winners, breed new variants
        if (winners.length > 0) {
          const topWinner = winners[0];
          
          // Use AI to generate mutations
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: META_EVOLUTION_PROMPT },
                { 
                  role: "user", 
                  content: `WINNING VARIANT (${topWinner.success_rate.toFixed(1)}% success rate, ${topWinner.uses} uses):
"${topWinner.prompt_text}"

Tag: ${topWinner.variant_tag}
Generation: ${topWinner.generation}

Other active variants:
${variantsWithRates.slice(0, 5).map(v => `- ${v.variant_tag}: ${v.success_rate.toFixed(1)}% (${v.uses} uses)`).join('\n')}

Create 2-3 new mutations of the winning variant using different strategies (AGGRESSIVE, FRIENDLY, DATA-DRIVEN, CONCISE, or STORYTELLING).
The mutations should be for agent type: ${agent}`
                }
              ],
              response_format: { type: "json_object" },
            }),
          });

          if (response.ok) {
            const aiData = await response.json();
            const evolutionResult = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');
            
            // Insert new variants
            if (evolutionResult.new_variants && evolutionResult.new_variants.length > 0) {
              const newVariants = evolutionResult.new_variants.map((v: any) => ({
                organization_id: organizationId,
                agent_type: agent,
                prompt_text: v.prompt_text,
                variant_tag: v.variant_tag || `mutated_v${topWinner.generation + 1}`,
                generation: topWinner.generation + 1,
                parent_variant_id: topWinner.id,
                is_active: true
              }));

              await supabase.from('prompt_variants').insert(newVariants);
              
              allEvolutions.push({
                agent,
                action: 'evolved',
                killed: toKill.length,
                bred: newVariants.length,
                top_performer: topWinner.variant_tag,
                success_rate: topWinner.success_rate
              });
            }
          }
        } else {
          allEvolutions.push({
            agent,
            action: 'insufficient_data',
            message: 'No variants with >10% success rate and >20 uses yet'
          });
        }
      }

      // Log the evolution
      await supabase.from('agent_execution_logs').insert({
        organization_id: organizationId,
        action_type: 'meta_evolution_breed',
        reasoning: `Genetic evolution completed for ${agentTypes.length} agent types`,
        action_details: { evolutions: allEvolutions, period_days: periodDays },
        result: 'completed'
      });

      // Store in memory
      await supabase.from('memory_items').insert({
        organization_id: organizationId,
        type: 'prompt_evolution',
        title: `Genetic Evolution ${new Date().toISOString().split('T')[0]}`,
        content: { evolutions: allEvolutions, mode },
        tags: ['meta-evolution', 'genetic-optimizer', `period-${periodDays}d`]
      });

      return new Response(JSON.stringify({
        success: true,
        mode,
        evolutions: allEvolutions
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ANALYZE MODE: Original behavior - analyze performance without breeding
    // Get agent execution logs
    const { data: executionLogs } = await supabase
      .from('agent_execution_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('executed_at', startDate.toISOString())
      .order('executed_at', { ascending: false });

    // Get revenue events (conversions)
    const { data: revenueEvents } = await supabase
      .from('revenue_events')
      .select('*, leads(*)')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString());

    // Get lead data
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString());

    // Get decision outcomes
    const { data: outcomes } = await supabase
      .from('decision_outcomes')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString());

    // Get prompt variant performance
    const { data: variants } = await supabase
      .from('prompt_variants')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    // Calculate metrics
    const totalLeads = leads?.length || 0;
    const conversions = revenueEvents?.length || 0;
    const conversionRate = totalLeads > 0 ? (conversions / totalLeads * 100).toFixed(2) : 0;

    // Extract patterns from execution logs
    const actionsByType: Record<string, any[]> = {};
    executionLogs?.forEach(log => {
      const type = log.action_type;
      if (!actionsByType[type]) actionsByType[type] = [];
      actionsByType[type].push(log);
    });

    // Build comprehensive data summary for the AI
    const performanceData = {
      period: `${startDate.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
      metrics: {
        totalLeads,
        conversions,
        conversionRate: `${conversionRate}%`,
        totalRevenueEvents: revenueEvents?.length || 0,
        agentActionsExecuted: executionLogs?.length || 0
      },
      variantPerformance: variants?.map(v => ({
        id: v.id,
        agent_type: v.agent_type,
        variant_tag: v.variant_tag,
        uses: v.uses,
        successes: v.successes,
        success_rate: v.uses > 0 ? ((v.successes / v.uses) * 100).toFixed(1) + '%' : '0%',
        generation: v.generation
      })) || [],
      agentPerformance: Object.entries(actionsByType).map(([type, logs]) => ({
        agentType: type,
        actionsCount: logs.length,
        successRate: logs.filter(l => l.result === 'success' || l.result === 'generated').length / logs.length * 100,
        commonReasonings: [...new Set(logs.map(l => l.reasoning).filter(Boolean))].slice(0, 5)
      })),
      leadFunnel: {
        new: leads?.filter(l => l.status === 'new').length || 0,
        qualified: leads?.filter(l => l.status === 'qualified').length || 0,
        proposal: leads?.filter(l => l.status === 'proposal').length || 0,
        negotiation: leads?.filter(l => l.status === 'negotiation').length || 0,
        closed: leads?.filter(l => l.status === 'closed' || l.status === 'won').length || 0,
        lost: leads?.filter(l => l.status === 'lost').length || 0
      },
      outcomeImpacts: outcomes?.map(o => ({
        type: o.outcome_type,
        impact: o.impact_score,
        description: o.outcome_description
      })) || []
    };

    console.log("Performance data compiled:", performanceData.metrics);

    // Call AI for evolution analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: META_EVOLUTION_PROMPT },
          { 
            role: "user", 
            content: `PERFORMANCE DATA:
${JSON.stringify(performanceData, null, 2)}

CURRENT CLOSER PROMPT:
${currentPrompts?.closer || 'Default closer prompt in use'}

CURRENT REFLEXION CRITERIA:
${currentPrompts?.reflexionCriteria?.join('\n') || 'Default criteria in use'}

Analyze this data and provide recommendations for prompt evolution.`
          }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const evolutionResult = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');

    // Store the evolution in memory
    await supabase.from('memory_items').insert({
      organization_id: organizationId,
      type: 'prompt_evolution',
      title: `Analysis ${new Date().toISOString().split('T')[0]}`,
      content: evolutionResult,
      tags: ['meta-evolution', 'prompt-analysis', `period-${periodDays}d`]
    });

    // Log the evolution action
    await supabase.from('agent_execution_logs').insert({
      organization_id: organizationId,
      action_type: 'meta_evolution',
      reasoning: `Analyzed ${periodDays} days of data. Conversion rate: ${conversionRate}%`,
      action_details: {
        metrics: performanceData.metrics,
        changes_proposed: evolutionResult.recommended_changes?.length || 0
      },
      result: 'completed'
    });

    return new Response(JSON.stringify({
      success: true,
      mode: 'analyze',
      evolution: evolutionResult,
      dataAnalyzed: performanceData.metrics
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Meta evolution error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
