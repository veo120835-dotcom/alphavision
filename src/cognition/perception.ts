/**
 * PERCEPTION LAYER
 * 
 * Transforms raw signals into structured meaning.
 * All agents use this layer to interpret inputs consistently.
 */

import type { PerceptionInput, StructuredSignal, SignalType, EntityReference } from './types';

/**
 * Perceive and structure a raw input into a queryable signal
 */
export function perceive(input: PerceptionInput): StructuredSignal {
  const signalType = classifySignal(input);
  const entity = extractEntity(input);
  const normalizedValue = normalizeValue(input.rawData, signalType);
  
  return {
    id: crypto.randomUUID(),
    type: signalType,
    entity,
    value: normalizedValue,
    metadata: extractMetadata(input),
    perceivedAt: new Date(),
    confidence: calculateConfidence(input),
  };
}

/**
 * Classify what type of signal this input represents
 */
function classifySignal(input: PerceptionInput): SignalType {
  const data = input.rawData as Record<string, unknown>;
  
  // Revenue-related signals
  if (data.amount && data.type === 'payment') return 'revenue_event';
  if (data.mrr || data.revenue) return 'revenue_event';
  
  // Lead activity signals
  if (data.lead_id || data.leadId) return 'lead_activity';
  if (data.email_opened || data.link_clicked) return 'lead_activity';
  
  // Market signals
  if (data.competitor || data.market_trend) return 'market_change';
  if (data.competitor_price || data.competitor_offer) return 'competitor_action';
  
  // Internal signals
  if (data.founder_mood || data.energy_level) return 'founder_state';
  if (data.client_feedback || data.nps_score) return 'client_sentiment';
  
  // Risk signals
  if (data.churn_risk || data.payment_failed) return 'risk_indicator';
  
  // Opportunity signals
  if (data.opportunity_score || data.expansion_signal) return 'opportunity_detected';
  
  return 'lead_activity'; // default
}

/**
 * Extract entity reference from input
 */
function extractEntity(input: PerceptionInput): EntityReference {
  const data = input.rawData as Record<string, unknown>;
  
  // Determine entity type and ID
  if (data.lead_id) {
    return { type: 'lead', id: String(data.lead_id), organizationId: String(data.organization_id || '') };
  }
  if (data.client_id) {
    return { type: 'client', id: String(data.client_id), organizationId: String(data.organization_id || '') };
  }
  if (data.deal_id) {
    return { type: 'deal', id: String(data.deal_id), organizationId: String(data.organization_id || '') };
  }
  if (data.campaign_id) {
    return { type: 'campaign', id: String(data.campaign_id), organizationId: String(data.organization_id || '') };
  }
  
  return {
    type: 'market',
    id: 'global',
    organizationId: String(data.organization_id || ''),
  };
}

/**
 * Normalize value based on signal type
 */
function normalizeValue(rawData: unknown, signalType: SignalType): unknown {
  const data = rawData as Record<string, unknown>;
  
  switch (signalType) {
    case 'revenue_event':
      return {
        amount: Number(data.amount || 0),
        currency: data.currency || 'USD',
        type: data.type || 'payment',
        recurring: Boolean(data.recurring),
      };
      
    case 'lead_activity':
      return {
        action: data.action || data.event_type,
        score: Number(data.score || data.engagement_score || 0),
        stage: data.stage || data.funnel_stage,
      };
      
    case 'risk_indicator':
      return {
        riskType: data.risk_type || 'unknown',
        severity: Number(data.severity || data.risk_score || 0.5),
        description: data.description || '',
      };
      
    default:
      return data;
  }
}

/**
 * Extract additional metadata
 */
function extractMetadata(input: PerceptionInput): Record<string, unknown> {
  return {
    source: input.source,
    originalTimestamp: input.timestamp,
    processingLatency: Date.now() - input.timestamp.getTime(),
  };
}

/**
 * Calculate confidence score for perceived signal
 */
function calculateConfidence(input: PerceptionInput): number {
  let confidence = input.confidence;
  
  // Reduce confidence for stale data
  const ageMs = Date.now() - input.timestamp.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours > 24) confidence *= 0.8;
  if (ageHours > 72) confidence *= 0.6;
  
  // Reduce confidence for external sources
  if (input.source === 'external') confidence *= 0.9;
  
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Batch perceive multiple inputs
 */
export function perceiveBatch(inputs: PerceptionInput[]): StructuredSignal[] {
  return inputs.map(perceive);
}

/**
 * Filter signals by type
 */
export function filterSignals(signals: StructuredSignal[], types: SignalType[]): StructuredSignal[] {
  return signals.filter(s => types.includes(s.type));
}

/**
 * Sort signals by recency and confidence
 */
export function prioritizeSignals(signals: StructuredSignal[]): StructuredSignal[] {
  return [...signals].sort((a, b) => {
    // Weight confidence more heavily than recency
    const aScore = a.confidence * 0.6 + (1 - (Date.now() - a.perceivedAt.getTime()) / (24 * 60 * 60 * 1000)) * 0.4;
    const bScore = b.confidence * 0.6 + (1 - (Date.now() - b.perceivedAt.getTime()) / (24 * 60 * 60 * 1000)) * 0.4;
    return bScore - aScore;
  });
}
