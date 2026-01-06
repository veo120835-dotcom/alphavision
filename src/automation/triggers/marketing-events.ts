// Marketing Event Triggers

import { eventBus, createEvent } from '../event-bus';
import { Trigger, Event } from '../types';

interface CampaignMetrics {
  campaign_id: string;
  name: string;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  unsubscribe_rate: number;
}

interface CompetitorPricing {
  competitor_id: string;
  competitor_name: string;
  product: string;
  previous_price: number;
  new_price: number;
  change_percent: number;
}

interface MarketSignal {
  signal_type: 'trend' | 'opportunity' | 'threat' | 'shift';
  source: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  affected_segments: string[];
}

class MarketingEventTriggers {
  private triggers: Map<string, Trigger> = new Map();
  private pricingThreshold = 0.10; // 10% change triggers alert
  private signalConfidenceThreshold = 0.7;

  registerTrigger(trigger: Trigger): void {
    this.triggers.set(trigger.id, trigger);
  }

  removeTrigger(triggerId: string): void {
    this.triggers.delete(triggerId);
  }

  // Monitor competitor pricing changes
  async onCompetitorPricingChange(pricing: CompetitorPricing): Promise<void> {
    if (Math.abs(pricing.change_percent) >= this.pricingThreshold) {
      const event = createEvent('competitor_pricing_changed', 'marketing', {
        competitor_id: pricing.competitor_id,
        competitor_name: pricing.competitor_name,
        product: pricing.product,
        previous_price: pricing.previous_price,
        new_price: pricing.new_price,
        change_percent: pricing.change_percent,
        direction: pricing.change_percent > 0 ? 'increase' : 'decrease',
      });

      await eventBus.emit(event);
    }
  }

  // Process market signals
  async onMarketSignal(signal: MarketSignal): Promise<void> {
    if (signal.confidence >= this.signalConfidenceThreshold) {
      const event = createEvent('market_signal_triggered', 'marketing', {
        signal_type: signal.signal_type,
        source: signal.source,
        description: signal.description,
        confidence: signal.confidence,
        impact: signal.impact,
        affected_segments: signal.affected_segments,
      });

      await eventBus.emit(event);
    }
  }

  // Analyze campaign performance and trigger alerts
  async analyzeCampaignPerformance(metrics: CampaignMetrics, benchmarks: { open_rate: number; click_rate: number }): Promise<void> {
    const alerts: string[] = [];

    if (metrics.open_rate < benchmarks.open_rate * 0.7) {
      alerts.push('low_open_rate');
    }

    if (metrics.click_rate < benchmarks.click_rate * 0.7) {
      alerts.push('low_click_rate');
    }

    if (metrics.unsubscribe_rate > 0.02) {
      alerts.push('high_unsubscribe_rate');
    }

    if (alerts.length > 0) {
      const event = createEvent('market_signal_triggered', 'marketing', {
        signal_type: 'performance_alert',
        campaign_id: metrics.campaign_id,
        campaign_name: metrics.name,
        alerts,
        metrics: {
          open_rate: metrics.open_rate,
          click_rate: metrics.click_rate,
          conversion_rate: metrics.conversion_rate,
          unsubscribe_rate: metrics.unsubscribe_rate,
        },
      });

      await eventBus.emit(event);
    }
  }

  setPricingThreshold(threshold: number): void {
    this.pricingThreshold = threshold;
  }

  setSignalConfidenceThreshold(threshold: number): void {
    this.signalConfidenceThreshold = threshold;
  }

  getTriggers(): Trigger[] {
    return Array.from(this.triggers.values());
  }
}

export const marketingEventTriggers = new MarketingEventTriggers();
