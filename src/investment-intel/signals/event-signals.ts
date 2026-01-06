import { Signal, SignalStrength, TimeFrame } from '../types';

export type EventType = 
  | 'earnings'
  | 'dividend'
  | 'split'
  | 'merger'
  | 'fda-approval'
  | 'macro-data'
  | 'fed-meeting'
  | 'product-launch'
  | 'guidance-change'
  | 'insider-activity';

export interface MarketEvent {
  id: string;
  symbol?: string;
  type: EventType;
  title: string;
  description: string;
  scheduledAt: Date;
  importance: 'high' | 'medium' | 'low';
  expectedImpact: 'positive' | 'negative' | 'neutral' | 'uncertain';
  historicalVolatility?: number;
  metadata: Record<string, unknown>;
}

export interface EarningsData {
  symbol: string;
  reportDate: Date;
  fiscalQuarter: string;
  estimatedEPS: number;
  actualEPS?: number;
  surprise?: number;
  estimatedRevenue: number;
  actualRevenue?: number;
  revenueSurprise?: number;
  guidanceChange?: 'raised' | 'lowered' | 'maintained' | 'withdrawn';
}

export interface MacroEvent {
  type: string;
  name: string;
  scheduledAt: Date;
  previousValue?: number;
  forecastValue?: number;
  actualValue?: number;
  impact: 'high' | 'medium' | 'low';
}

export class EventSignalGenerator {
  private upcomingEvents: MarketEvent[] = [];
  private earningsCalendar: EarningsData[] = [];
  private macroCalendar: MacroEvent[] = [];

  addEvent(event: MarketEvent): void {
    this.upcomingEvents.push(event);
    this.upcomingEvents.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  addEarnings(earnings: EarningsData): void {
    this.earningsCalendar.push(earnings);
  }

  addMacroEvent(event: MacroEvent): void {
    this.macroCalendar.push(event);
  }

  getUpcomingEvents(symbol?: string, days: number = 7): MarketEvent[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.upcomingEvents.filter(event => {
      const inRange = event.scheduledAt >= now && event.scheduledAt <= cutoff;
      const matchesSymbol = !symbol || event.symbol === symbol;
      return inRange && matchesSymbol;
    });
  }

  getEarningsCalendar(days: number = 14): EarningsData[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.earningsCalendar.filter(
      e => e.reportDate >= now && e.reportDate <= cutoff
    );
  }

  analyzeEarningsSetup(earnings: EarningsData): { signal: 'long' | 'short' | 'neutral'; confidence: number; rationale: string } {
    // Pre-earnings analysis based on historical patterns
    const daysTillEarnings = Math.ceil(
      (earnings.reportDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );

    // Too close to earnings - high uncertainty
    if (daysTillEarnings < 2) {
      return {
        signal: 'neutral',
        confidence: 0.3,
        rationale: 'Too close to earnings announcement for reliable signal',
      };
    }

    // Analyze estimate trends
    if (earnings.guidanceChange === 'raised') {
      return {
        signal: 'long',
        confidence: 0.6,
        rationale: 'Recent guidance raise suggests positive momentum',
      };
    }

    if (earnings.guidanceChange === 'lowered') {
      return {
        signal: 'short',
        confidence: 0.6,
        rationale: 'Lowered guidance suggests potential disappointment',
      };
    }

    return {
      signal: 'neutral',
      confidence: 0.4,
      rationale: 'Mixed signals ahead of earnings',
    };
  }

  analyzePostEarnings(earnings: EarningsData): { signal: 'long' | 'short' | 'neutral'; confidence: number; rationale: string } {
    if (!earnings.actualEPS || !earnings.actualRevenue) {
      return { signal: 'neutral', confidence: 0, rationale: 'No earnings data available' };
    }

    const epsBeat = earnings.actualEPS > earnings.estimatedEPS;
    const revenueBeat = earnings.actualRevenue > earnings.estimatedRevenue;
    const epsSurprise = earnings.surprise || ((earnings.actualEPS - earnings.estimatedEPS) / Math.abs(earnings.estimatedEPS)) * 100;

    // Strong beat on both
    if (epsBeat && revenueBeat && epsSurprise > 5) {
      return {
        signal: 'long',
        confidence: 0.7,
        rationale: `Beat on both EPS (${epsSurprise.toFixed(1)}% surprise) and revenue`,
      };
    }

    // Strong miss on both
    if (!epsBeat && !revenueBeat && epsSurprise < -5) {
      return {
        signal: 'short',
        confidence: 0.7,
        rationale: `Missed on both EPS (${epsSurprise.toFixed(1)}% surprise) and revenue`,
      };
    }

    // Mixed results with guidance change
    if (earnings.guidanceChange === 'raised') {
      return {
        signal: 'long',
        confidence: 0.6,
        rationale: 'Guidance raised despite mixed results',
      };
    }

    if (earnings.guidanceChange === 'lowered') {
      return {
        signal: 'short',
        confidence: 0.6,
        rationale: 'Guidance lowered',
      };
    }

    return {
      signal: 'neutral',
      confidence: 0.4,
      rationale: 'Mixed earnings results',
    };
  }

  analyzeMacroImpact(event: MacroEvent, assetSensitivity: 'positive' | 'negative' | 'neutral'): { direction: 'positive' | 'negative' | 'neutral'; magnitude: number } {
    if (!event.actualValue || !event.forecastValue) {
      return { direction: 'neutral', magnitude: 0 };
    }

    const surprise = event.actualValue - event.forecastValue;
    const magnitude = Math.abs(surprise) / Math.abs(event.forecastValue || 1);

    let direction: 'positive' | 'negative' | 'neutral' = 'neutral';

    // Determine base impact direction based on event type
    const positiveIsBullish = ['gdp', 'employment', 'retail-sales', 'pmi'].some(
      t => event.type.toLowerCase().includes(t)
    );

    if (surprise > 0) {
      direction = positiveIsBullish ? 'positive' : 'negative';
    } else if (surprise < 0) {
      direction = positiveIsBullish ? 'negative' : 'positive';
    }

    // Adjust for asset sensitivity
    if (assetSensitivity === 'negative') {
      direction = direction === 'positive' ? 'negative' : direction === 'negative' ? 'positive' : 'neutral';
    }

    return { direction, magnitude };
  }

  generateSignal(symbol: string, events: MarketEvent[], timeframe: TimeFrame): Signal | null {
    const relevantEvents = events.filter(e => e.symbol === symbol || !e.symbol);
    if (relevantEvents.length === 0) return null;

    let signalScore = 0;
    const eventFactors: string[] = [];

    for (const event of relevantEvents) {
      const daysAway = Math.ceil(
        (event.scheduledAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );

      // Weight based on importance and proximity
      let weight = event.importance === 'high' ? 2 : event.importance === 'medium' ? 1 : 0.5;
      if (daysAway <= 3) weight *= 1.5;
      else if (daysAway <= 7) weight *= 1;
      else weight *= 0.5;

      if (event.expectedImpact === 'positive') signalScore += weight;
      else if (event.expectedImpact === 'negative') signalScore -= weight;

      eventFactors.push(`${event.type}: ${event.title}`);
    }

    if (Math.abs(signalScore) < 1) return null;

    const direction = signalScore > 0 ? 'long' : 'short';
    const confidence = Math.min(Math.abs(signalScore) / 6, 1);
    const strength: SignalStrength = 
      confidence > 0.7 ? 'strong' :
      confidence > 0.4 ? 'moderate' :
      confidence > 0.2 ? 'weak' : 'neutral';

    return {
      id: `event_${symbol}_${Date.now()}`,
      symbol,
      type: 'event-driven',
      direction,
      strength,
      confidence,
      timeframe,
      generatedAt: new Date(),
      metadata: {
        events: eventFactors,
        eventCount: relevantEvents.length,
      },
    };
  }
}

export const eventSignalGenerator = new EventSignalGenerator();
