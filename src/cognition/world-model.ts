/**
 * WORLD MODEL
 * 
 * Global state graph representing the business universe.
 * Time-indexed and queryable by all agents.
 */

import type {
  WorldModelSnapshot,
  BusinessState,
  MarketState,
  ClientState,
  FounderState,
  CapitalState,
  RiskState,
  EntityGraph,
  CausalRelationship,
  RevenueStream,
  Threat,
} from './types';

/**
 * Create a new world model snapshot
 */
export function createWorldModelSnapshot(
  organizationId: string,
  data: Partial<WorldModelSnapshot>
): WorldModelSnapshot {
  return {
    id: crypto.randomUUID(),
    organizationId,
    timestamp: new Date(),
    businessState: data.businessState || createDefaultBusinessState(),
    marketState: data.marketState || createDefaultMarketState(),
    clientState: data.clientState || createDefaultClientState(),
    founderState: data.founderState || createDefaultFounderState(),
    capitalState: data.capitalState || createDefaultCapitalState(),
    riskState: data.riskState || createDefaultRiskState(),
    entityGraph: data.entityGraph || { nodes: [], edges: [] },
    causalRelationships: data.causalRelationships || [],
  };
}

/**
 * Default state creators
 */
function createDefaultBusinessState(): BusinessState {
  return {
    revenueStreams: [],
    activeDeals: 0,
    pipelineValue: 0,
    churnRate: 0,
    customerCount: 0,
    avgDealSize: 0,
  };
}

function createDefaultMarketState(): MarketState {
  return {
    competitorActions: [],
    marketTrends: [],
    pricingPressure: 0.5,
    demandSignals: [],
  };
}

function createDefaultClientState(): ClientState {
  return {
    healthScores: new Map(),
    atRiskClients: [],
    expansionOpportunities: [],
    sentimentTrend: 0,
  };
}

function createDefaultFounderState(): FounderState {
  return {
    energyLevel: 0.7,
    focusScore: 0.7,
    burnoutRisk: 0.3,
    decisionFatigue: 0.3,
    lastCheckIn: new Date(),
  };
}

function createDefaultCapitalState(): CapitalState {
  return {
    cashBalance: 0,
    burnRate: 0,
    runwayMonths: 12,
    receivables: 0,
    payables: 0,
    reserveRatio: 0.2,
  };
}

function createDefaultRiskState(): RiskState {
  return {
    overallRisk: 0.3,
    activeThreats: [],
    mitigatedThreats: [],
    riskTrend: 'stable',
  };
}

/**
 * Update world model with new data
 */
export function updateWorldModel(
  current: WorldModelSnapshot,
  updates: Partial<WorldModelSnapshot>
): WorldModelSnapshot {
  return {
    ...current,
    ...updates,
    id: crypto.randomUUID(),
    timestamp: new Date(),
    businessState: updates.businessState 
      ? { ...current.businessState, ...updates.businessState }
      : current.businessState,
    marketState: updates.marketState
      ? { ...current.marketState, ...updates.marketState }
      : current.marketState,
    clientState: updates.clientState
      ? { ...current.clientState, ...updates.clientState }
      : current.clientState,
    founderState: updates.founderState
      ? { ...current.founderState, ...updates.founderState }
      : current.founderState,
    capitalState: updates.capitalState
      ? { ...current.capitalState, ...updates.capitalState }
      : current.capitalState,
    riskState: updates.riskState
      ? { ...current.riskState, ...updates.riskState }
      : current.riskState,
  };
}

/**
 * Query world model for specific state domains
 */
export function queryWorldModel(
  model: WorldModelSnapshot,
  domain: 'business' | 'market' | 'client' | 'founder' | 'capital' | 'risk'
): unknown {
  switch (domain) {
    case 'business': return model.businessState;
    case 'market': return model.marketState;
    case 'client': return model.clientState;
    case 'founder': return model.founderState;
    case 'capital': return model.capitalState;
    case 'risk': return model.riskState;
  }
}

/**
 * Calculate overall health score from world model
 */
export function calculateHealthScore(model: WorldModelSnapshot): number {
  const weights = {
    business: 0.25,
    capital: 0.25,
    risk: 0.20,
    founder: 0.15,
    client: 0.15,
  };
  
  const scores = {
    business: calculateBusinessHealth(model.businessState),
    capital: calculateCapitalHealth(model.capitalState),
    risk: 1 - model.riskState.overallRisk,
    founder: calculateFounderHealth(model.founderState),
    client: calculateClientHealth(model.clientState),
  };
  
  return Object.entries(weights).reduce(
    (total, [key, weight]) => total + scores[key as keyof typeof scores] * weight,
    0
  );
}

function calculateBusinessHealth(state: BusinessState): number {
  if (state.revenueStreams.length === 0) return 0.3;
  
  const mrrGrowth = state.revenueStreams.reduce((sum, r) => sum + r.growthRate, 0) / state.revenueStreams.length;
  const churnHealth = 1 - Math.min(1, state.churnRate * 10); // 10% churn = 0 health
  
  return (mrrGrowth + churnHealth) / 2;
}

function calculateCapitalHealth(state: CapitalState): number {
  // Runway is most important
  const runwayHealth = Math.min(1, state.runwayMonths / 12);
  
  // Reserve ratio matters
  const reserveHealth = Math.min(1, state.reserveRatio / 0.3);
  
  return runwayHealth * 0.7 + reserveHealth * 0.3;
}

function calculateFounderHealth(state: FounderState): number {
  const burnoutPenalty = state.burnoutRisk * 0.5;
  const fatiguePenalty = state.decisionFatigue * 0.3;
  
  return Math.max(0, (state.energyLevel + state.focusScore) / 2 - burnoutPenalty - fatiguePenalty);
}

function calculateClientHealth(state: ClientState): number {
  const healthScores = Array.from(state.healthScores.values());
  if (healthScores.length === 0) return 0.5;
  
  const avgHealth = healthScores.reduce((sum, h) => sum + h, 0) / healthScores.length;
  const atRiskPenalty = state.atRiskClients.length * 0.1;
  
  return Math.max(0, avgHealth - atRiskPenalty);
}

/**
 * Add causal relationship to world model
 */
export function addCausalRelationship(
  model: WorldModelSnapshot,
  cause: string,
  effect: string,
  strength: number,
  lag: number
): WorldModelSnapshot {
  const relationship: CausalRelationship = {
    cause,
    effect,
    strength,
    lag,
    confidence: 0.5, // Initial confidence
  };
  
  return {
    ...model,
    causalRelationships: [...model.causalRelationships, relationship],
  };
}

/**
 * Find causal chains from one state to another
 */
export function findCausalChain(
  model: WorldModelSnapshot,
  from: string,
  to: string,
  maxDepth: number = 3
): CausalRelationship[][] {
  const chains: CausalRelationship[][] = [];
  
  function dfs(current: string, path: CausalRelationship[], depth: number) {
    if (depth > maxDepth) return;
    
    if (current === to && path.length > 0) {
      chains.push([...path]);
      return;
    }
    
    const outgoing = model.causalRelationships.filter(r => r.cause === current);
    for (const rel of outgoing) {
      if (!path.some(p => p.effect === rel.effect)) {
        path.push(rel);
        dfs(rel.effect, path, depth + 1);
        path.pop();
      }
    }
  }
  
  dfs(from, [], 0);
  return chains;
}

/**
 * Simulate future state based on causal relationships
 */
export function simulateFutureState(
  model: WorldModelSnapshot,
  intervention: { variable: string; change: number },
  timeHorizon: number // hours
): WorldModelSnapshot {
  let simulated = { ...model };
  
  // Find all effects of the intervention
  const affected = model.causalRelationships.filter(r => 
    r.cause === intervention.variable && r.lag <= timeHorizon
  );
  
  for (const effect of affected) {
    const impact = intervention.change * effect.strength;
    simulated = applyEffect(simulated, effect.effect, impact);
  }
  
  return simulated;
}

/**
 * Apply an effect to a world model
 */
function applyEffect(
  model: WorldModelSnapshot,
  variable: string,
  impact: number
): WorldModelSnapshot {
  const updated = { ...model };
  
  // Map variable names to state updates
  if (variable.includes('revenue')) {
    updated.businessState = {
      ...model.businessState,
      pipelineValue: model.businessState.pipelineValue * (1 + impact),
    };
  }
  
  if (variable.includes('churn')) {
    updated.businessState = {
      ...model.businessState,
      churnRate: Math.max(0, model.businessState.churnRate + impact),
    };
  }
  
  if (variable.includes('risk')) {
    updated.riskState = {
      ...model.riskState,
      overallRisk: Math.max(0, Math.min(1, model.riskState.overallRisk + impact)),
    };
  }
  
  if (variable.includes('runway')) {
    updated.capitalState = {
      ...model.capitalState,
      runwayMonths: Math.max(0, model.capitalState.runwayMonths + impact * 12),
    };
  }
  
  return updated;
}

/**
 * Detect anomalies in world model state
 */
export function detectAnomalies(
  current: WorldModelSnapshot,
  historical: WorldModelSnapshot[]
): string[] {
  const anomalies: string[] = [];
  
  if (historical.length < 5) return anomalies;
  
  // Check for unusual changes
  const avgRunway = historical.reduce((sum, h) => sum + h.capitalState.runwayMonths, 0) / historical.length;
  if (current.capitalState.runwayMonths < avgRunway * 0.7) {
    anomalies.push(`Runway dropped significantly: ${current.capitalState.runwayMonths} vs avg ${avgRunway.toFixed(1)}`);
  }
  
  const avgRisk = historical.reduce((sum, h) => sum + h.riskState.overallRisk, 0) / historical.length;
  if (current.riskState.overallRisk > avgRisk * 1.5) {
    anomalies.push(`Risk level elevated: ${(current.riskState.overallRisk * 100).toFixed(0)}% vs avg ${(avgRisk * 100).toFixed(0)}%`);
  }
  
  return anomalies;
}
