/**
 * COGNITIVE ARCHITECTURE TYPES
 * 
 * Formal layer separation for AI cognition:
 * Perception → Reasoning → Decision → Action → Learning
 */

// =============================================================================
// PERCEPTION LAYER - Raw signals → Structured meaning
// =============================================================================

export interface PerceptionInput {
  source: 'database' | 'api' | 'user' | 'agent' | 'external';
  rawData: unknown;
  timestamp: Date;
  confidence: number;
}

export interface StructuredSignal {
  id: string;
  type: SignalType;
  entity: EntityReference;
  value: unknown;
  metadata: Record<string, unknown>;
  perceivedAt: Date;
  confidence: number;
}

export type SignalType = 
  | 'revenue_event'
  | 'lead_activity'
  | 'market_change'
  | 'competitor_action'
  | 'founder_state'
  | 'client_sentiment'
  | 'risk_indicator'
  | 'opportunity_detected';

export interface EntityReference {
  type: 'lead' | 'client' | 'deal' | 'campaign' | 'agent' | 'market' | 'founder';
  id: string;
  organizationId: string;
}

// =============================================================================
// REASONING LAYER - Multi-step inference, constraint solving
// =============================================================================

export interface ReasoningContext {
  signals: StructuredSignal[];
  worldState: WorldModelSnapshot;
  constraints: Constraint[];
  objectives: Objective[];
  priorDecisions: DecisionRecord[];
}

export interface Constraint {
  id: string;
  type: 'hard' | 'soft';
  rule: string;
  priority: number;
  source: 'north_star' | 'user' | 'learned' | 'regulatory';
}

export interface Objective {
  id: string;
  metric: string;
  target: number;
  weight: number;
  timeHorizon: 'immediate' | 'short' | 'medium' | 'long';
}

export interface InferenceChain {
  id: string;
  steps: InferenceStep[];
  conclusion: string;
  confidence: number;
  alternativeConclusions: string[];
}

export interface InferenceStep {
  premise: string;
  reasoning: string;
  evidence: string[];
  confidence: number;
}

// =============================================================================
// DECISION LAYER - Tradeoffs, prioritization, kill rules
// =============================================================================

export interface DecisionContext {
  inference: InferenceChain;
  options: DecisionOption[];
  constraints: Constraint[];
  riskAssessment: RiskAssessment;
  opportunityCost: OpportunityCostAnalysis;
}

export interface DecisionOption {
  id: string;
  action: string;
  expectedOutcome: string;
  probability: number;
  upside: number;
  downside: number;
  reversibility: 'full' | 'partial' | 'none';
  timeToResult: number; // hours
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  mitigations: Mitigation[];
  killTriggers: KillTrigger[];
}

export interface RiskFactor {
  type: string;
  likelihood: number;
  impact: number;
  description: string;
}

export interface Mitigation {
  riskFactorId: string;
  strategy: string;
  cost: number;
  effectiveness: number;
}

export interface KillTrigger {
  condition: string;
  threshold: number;
  action: 'pause' | 'stop' | 'revert' | 'escalate';
}

export interface OpportunityCostAnalysis {
  alternativesConsidered: string[];
  foregoneValue: number;
  confidence: number;
  recommendation: string;
}

export interface DecisionRecord {
  id: string;
  agentId: string;
  organizationId: string;
  context: DecisionContext;
  selectedOption: DecisionOption;
  autonomyLevel: AutonomyLevel;
  reasoning: string;
  createdAt: Date;
  executedAt?: Date;
  outcome?: DecisionOutcome;
}

export interface DecisionOutcome {
  success: boolean;
  actualValue: number;
  expectedValue: number;
  regret: number; // counterfactual loss
  learnings: string[];
  recordedAt: Date;
}

// =============================================================================
// ACTION LAYER - Execution + verification
// =============================================================================

export interface ActionPlan {
  id: string;
  decisionId: string;
  steps: ActionStep[];
  rollbackPlan: RollbackStep[];
  verificationChecks: VerificationCheck[];
  timeout: number; // ms
}

export interface ActionStep {
  id: string;
  order: number;
  type: ActionType;
  tool: string;
  parameters: Record<string, unknown>;
  expectedResult: string;
  dependsOn?: string[];
}

export type ActionType = 
  | 'database_write'
  | 'api_call'
  | 'notification'
  | 'email'
  | 'sms'
  | 'calendar'
  | 'payment'
  | 'content_creation'
  | 'agent_spawn';

export interface RollbackStep {
  actionStepId: string;
  rollbackAction: string;
  parameters: Record<string, unknown>;
}

export interface VerificationCheck {
  id: string;
  afterStep: string;
  condition: string;
  expectedValue: unknown;
  onFailure: 'continue' | 'pause' | 'rollback' | 'escalate';
}

export interface ActionResult {
  actionPlanId: string;
  stepResults: StepResult[];
  overallSuccess: boolean;
  executionTime: number;
  errors: ActionError[];
}

export interface StepResult {
  stepId: string;
  success: boolean;
  result: unknown;
  duration: number;
  verificationPassed?: boolean;
}

export interface ActionError {
  stepId: string;
  error: string;
  recoverable: boolean;
  handled: boolean;
}

// =============================================================================
// LEARNING LAYER - Policy updates, heuristics, bias correction
// =============================================================================

export interface LearningEvent {
  id: string;
  type: LearningType;
  source: DecisionRecord;
  insight: string;
  confidence: number;
  applicability: 'specific' | 'general' | 'universal';
  createdAt: Date;
}

export type LearningType = 
  | 'pattern_discovered'
  | 'policy_update'
  | 'heuristic_refined'
  | 'bias_detected'
  | 'constraint_learned'
  | 'objective_calibrated';

export interface PolicyUpdate {
  id: string;
  agentId: string;
  previousPolicy: string;
  newPolicy: string;
  trigger: LearningEvent;
  validationResults: ValidationResult[];
  deployedAt?: Date;
}

export interface ValidationResult {
  testCase: string;
  passed: boolean;
  notes: string;
}

export interface BiasCorrection {
  id: string;
  biasType: string;
  detectedIn: string;
  correctionApplied: string;
  effectivenessScore: number;
}

// =============================================================================
// AUTONOMY FRAMEWORK
// =============================================================================

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;

export const AUTONOMY_LEVELS = {
  0: {
    name: 'Advisory',
    description: 'Suggest only, never act',
    requiresApproval: true,
    requiresReview: false,
    selfModifying: false,
  },
  1: {
    name: 'Approval Required',
    description: 'Propose + wait for human approval',
    requiresApproval: true,
    requiresReview: true,
    selfModifying: false,
  },
  2: {
    name: 'Execute + Review',
    description: 'Act immediately, flag for review',
    requiresApproval: false,
    requiresReview: true,
    selfModifying: false,
  },
  3: {
    name: 'Autonomous (Bounded)',
    description: 'Act within defined constraints',
    requiresApproval: false,
    requiresReview: false,
    selfModifying: false,
  },
  4: {
    name: 'Self-Modifying',
    description: 'Adjust own rules within meta-bounds',
    requiresApproval: false,
    requiresReview: false,
    selfModifying: true,
  },
} as const;

export interface AgentObjective {
  agentId: string;
  primaryMetric: string;
  constraints: string[];
  costFunction: string;
  killThreshold: number;
  regretTracker: boolean;
  rewardShaping?: RewardShaping;
}

export interface RewardShaping {
  positiveSignals: string[];
  negativeSignals: string[];
  discountFactor: number; // future value discount
}

export interface TrustScore {
  agentId: string;
  organizationId: string;
  currentLevel: AutonomyLevel;
  maxAllowedLevel: AutonomyLevel;
  successCount: number;
  failureCount: number;
  regretSum: number;
  lastUpdated: Date;
}

// =============================================================================
// WORLD MODEL
// =============================================================================

export interface WorldModelSnapshot {
  id: string;
  organizationId: string;
  timestamp: Date;
  
  // State domains
  businessState: BusinessState;
  marketState: MarketState;
  clientState: ClientState;
  founderState: FounderState;
  capitalState: CapitalState;
  riskState: RiskState;
  
  // Relationships
  entityGraph: EntityGraph;
  causalRelationships: CausalRelationship[];
}

export interface BusinessState {
  revenueStreams: RevenueStream[];
  activeDeals: number;
  pipelineValue: number;
  churnRate: number;
  customerCount: number;
  avgDealSize: number;
}

export interface RevenueStream {
  id: string;
  name: string;
  type: 'recurring' | 'one-time' | 'usage-based';
  mrr: number;
  growthRate: number;
  churnRisk: number;
}

export interface MarketState {
  competitorActions: CompetitorAction[];
  marketTrends: Trend[];
  pricingPressure: number;
  demandSignals: DemandSignal[];
}

export interface CompetitorAction {
  competitorId: string;
  action: string;
  detectedAt: Date;
  impact: 'low' | 'medium' | 'high';
}

export interface Trend {
  id: string;
  description: string;
  direction: 'up' | 'down' | 'stable';
  strength: number;
}

export interface DemandSignal {
  source: string;
  strength: number;
  timestamp: Date;
}

export interface ClientState {
  healthScores: Map<string, number>;
  atRiskClients: string[];
  expansionOpportunities: string[];
  sentimentTrend: number;
}

export interface FounderState {
  energyLevel: number;
  focusScore: number;
  burnoutRisk: number;
  decisionFatigue: number;
  lastCheckIn: Date;
}

export interface CapitalState {
  cashBalance: number;
  burnRate: number;
  runwayMonths: number;
  receivables: number;
  payables: number;
  reserveRatio: number;
}

export interface RiskState {
  overallRisk: number;
  activeThreats: Threat[];
  mitigatedThreats: Threat[];
  riskTrend: 'improving' | 'stable' | 'worsening';
}

export interface Threat {
  id: string;
  type: 'strategic' | 'market' | 'operational' | 'financial' | 'reputational';
  severity: number;
  likelihood: number;
  description: string;
  mitigation?: string;
}

export interface EntityGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  weight: number;
}

export interface CausalRelationship {
  cause: string;
  effect: string;
  strength: number;
  lag: number; // time lag in hours
  confidence: number;
}
