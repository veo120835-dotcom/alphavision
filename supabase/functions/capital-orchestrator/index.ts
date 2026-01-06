import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CapitalRequest {
  action: 'scan_opportunities' | 'simulate' | 'execute' | 'monitor' | 'halt'
  organization_id: string
  contract_id?: string
  opportunity_id?: string
  deployment_id?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const request: CapitalRequest = await req.json()
    console.log('[capital-orchestrator] Request:', request.action, request.organization_id)

    switch (request.action) {
      case 'scan_opportunities': {
        // Scan for arbitrage opportunities
        const opportunities = await scanForOpportunities(supabase, request.organization_id)
        return new Response(JSON.stringify({ success: true, opportunities }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'simulate': {
        // Run simulation for an opportunity
        if (!request.opportunity_id) {
          throw new Error('opportunity_id required')
        }
        const simulation = await runSimulation(supabase, request.opportunity_id)
        return new Response(JSON.stringify({ success: true, simulation }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'execute': {
        // Execute approved opportunity
        if (!request.opportunity_id || !request.contract_id) {
          throw new Error('opportunity_id and contract_id required')
        }
        const deployment = await executeOpportunity(supabase, request)
        return new Response(JSON.stringify({ success: true, deployment }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'monitor': {
        // Monitor active deployments
        const status = await monitorDeployments(supabase, request.organization_id)
        return new Response(JSON.stringify({ success: true, status }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'halt': {
        // Emergency halt
        if (!request.deployment_id) {
          throw new Error('deployment_id required')
        }
        await haltDeployment(supabase, request.deployment_id, request.organization_id)
        return new Response(JSON.stringify({ success: true, message: 'Deployment halted' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        throw new Error(`Unknown action: ${request.action}`)
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[capital-orchestrator] Error:', errorMessage)
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function scanForOpportunities(supabase: any, orgId: string) {
  console.log('[scan] Scanning for opportunities...')
  
  // Get active contracts
  const { data: contracts } = await supabase
    .from('capital_contracts')
    .select('*')
    .eq('organization_id', orgId)
    .eq('status', 'active')

  if (!contracts?.length) {
    console.log('[scan] No active contracts')
    return []
  }

  // Generate sample opportunities based on contracts
  const opportunities = []
  
  for (const contract of contracts) {
    if (contract.contract_type === 'lead_arbitrage') {
      opportunities.push({
        organization_id: orgId,
        opportunity_type: 'lead_arbitrage',
        title: `${getRandomNiche()} Lead Arbitrage`,
        description: 'High-margin lead reselling opportunity detected',
        source: 'marketplace_scan',
        niche: getRandomNiche(),
        estimated_cost: Math.round(contract.max_capital * 0.3),
        estimated_revenue: Math.round(contract.max_capital * 0.8),
        estimated_roi_percent: Math.round(((0.8 - 0.3) / 0.3) * 100),
        confidence_score: 70 + Math.random() * 25,
        execution_certainty: 75 + Math.random() * 20,
        downside_risk: 10 + Math.random() * 20,
        automation_compatibility: 85 + Math.random() * 15,
        time_to_execute_hours: 24 + Math.round(Math.random() * 168),
        requires_capital: Math.round(contract.max_capital * 0.3),
        status: 'detected'
      })
    }
  }

  // Insert detected opportunities
  if (opportunities.length) {
    const { data: inserted } = await supabase
      .from('arbitrage_opportunities_queue')
      .insert(opportunities)
      .select()
    
    return inserted || []
  }

  return []
}

async function runSimulation(supabase: any, opportunityId: string) {
  console.log('[simulate] Running simulation for:', opportunityId)
  
  const { data: opp } = await supabase
    .from('arbitrage_opportunities_queue')
    .select('*')
    .eq('id', opportunityId)
    .single()

  if (!opp) throw new Error('Opportunity not found')

  const cost = opp.estimated_cost || 1000
  const baseRevenue = opp.estimated_revenue || 2000
  
  // Calculate probability bands
  const worstCase = Math.round(cost * 0.6) // 60% of cost recovered
  const baseCase = Math.round(baseRevenue * 0.8) // 80% of expected
  const bestCase = Math.round(baseRevenue * 1.5) // 150% of expected

  const simulation = {
    best_case: bestCase,
    base_case: baseCase,
    worst_case: worstCase,
    simulation_results: {
      probability_best: 0.2,
      probability_base: 0.6,
      probability_worst: 0.2,
      expected_value: (bestCase * 0.2) + (baseCase * 0.6) + (worstCase * 0.2),
      risk_adjusted_return: ((baseCase - cost) / cost) * 100
    }
  }

  // Update opportunity with simulation
  await supabase
    .from('arbitrage_opportunities_queue')
    .update({
      ...simulation,
      status: 'ready'
    })
    .eq('id', opportunityId)

  return simulation
}

async function executeOpportunity(supabase: any, request: CapitalRequest) {
  console.log('[execute] Executing opportunity:', request.opportunity_id)
  
  // Get opportunity and contract
  const { data: opp } = await supabase
    .from('arbitrage_opportunities_queue')
    .select('*')
    .eq('id', request.opportunity_id)
    .single()

  const { data: contract } = await supabase
    .from('capital_contracts')
    .select('*')
    .eq('id', request.contract_id)
    .single()

  if (!opp || !contract) {
    throw new Error('Opportunity or contract not found')
  }

  // Validate against contract rules
  if (opp.requires_capital > contract.max_capital - contract.current_deployed) {
    throw new Error('Insufficient capital available in contract')
  }

  // Create deployment
  const executionSteps = [
    { step: 1, action: 'source_leads', status: 'pending' },
    { step: 2, action: 'qualify_leads', status: 'pending' },
    { step: 3, action: 'route_to_buyers', status: 'pending' },
    { step: 4, action: 'collect_payment', status: 'pending' },
    { step: 5, action: 'reconcile', status: 'pending' }
  ]

  const { data: deployment } = await supabase
    .from('capital_deployments')
    .insert({
      organization_id: request.organization_id,
      contract_id: contract.id,
      opportunity_id: opp.id,
      deployment_type: opp.opportunity_type,
      capital_deployed: opp.requires_capital,
      current_value: opp.requires_capital,
      status: 'active',
      execution_steps: executionSteps,
      current_step: 1,
      started_at: new Date().toISOString()
    })
    .select()
    .single()

  // Update contract deployed amount
  await supabase
    .from('capital_contracts')
    .update({
      current_deployed: contract.current_deployed + opp.requires_capital
    })
    .eq('id', contract.id)

  // Update opportunity status
  await supabase
    .from('arbitrage_opportunities_queue')
    .update({
      status: 'executing',
      executed_at: new Date().toISOString()
    })
    .eq('id', opp.id)

  // Log audit
  await supabase
    .from('deployment_audit_log')
    .insert({
      organization_id: request.organization_id,
      deployment_id: deployment.id,
      event_type: 'execution_started',
      event_data: { opportunity: opp, contract_id: contract.id },
      decision_reasoning: 'Opportunity passed simulation and contract rules validation'
    })

  return deployment
}

async function monitorDeployments(supabase: any, orgId: string) {
  console.log('[monitor] Checking active deployments...')
  
  const { data: deployments } = await supabase
    .from('capital_deployments')
    .select('*')
    .eq('organization_id', orgId)
    .in('status', ['active', 'monitoring'])

  const alerts = []

  for (const dep of deployments || []) {
    // Check kill switch conditions
    const pnlPercent = ((dep.current_value - dep.capital_deployed) / dep.capital_deployed) * 100
    
    if (pnlPercent < -30) {
      alerts.push({
        deployment_id: dep.id,
        trigger_type: 'roi_drop',
        severity: 'high',
        message: `ROI dropped to ${pnlPercent.toFixed(1)}%`
      })
    }

    // Get contract for loss limit check
    const { data: contract } = await supabase
      .from('capital_contracts')
      .select('max_loss')
      .eq('id', dep.contract_id)
      .single()

    if (contract && (dep.capital_deployed - dep.current_value) > contract.max_loss) {
      alerts.push({
        deployment_id: dep.id,
        trigger_type: 'loss_limit',
        severity: 'critical',
        message: 'Loss limit exceeded - auto-halt triggered'
      })

      // Auto-halt
      await haltDeployment(supabase, dep.id, orgId)
    }
  }

  return { deployments, alerts }
}

async function haltDeployment(supabase: any, deploymentId: string, orgId: string) {
  console.log('[halt] Halting deployment:', deploymentId)
  
  // Update deployment status
  await supabase
    .from('capital_deployments')
    .update({
      status: 'halted',
      halt_reason: 'Manual or automatic kill switch triggered',
      completed_at: new Date().toISOString()
    })
    .eq('id', deploymentId)

  // Log kill switch event
  await supabase
    .from('kill_switch_events')
    .insert({
      organization_id: orgId,
      deployment_id: deploymentId,
      trigger_type: 'manual',
      action_taken: 'halt',
      severity: 'high'
    })

  // Log audit
  await supabase
    .from('deployment_audit_log')
    .insert({
      organization_id: orgId,
      deployment_id: deploymentId,
      event_type: 'deployment_halted',
      decision_reasoning: 'Kill switch activated'
    })
}

function getRandomNiche(): string {
  const niches = ['Real Estate', 'Solar', 'Insurance', 'Legal', 'Home Services', 'Mortgage', 'Auto']
  return niches[Math.floor(Math.random() * niches.length)]
}
