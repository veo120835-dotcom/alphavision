// Finance Event Triggers

import { eventBus, createEvent } from '../event-bus';
import { Trigger } from '../types';

interface PaymentEvent {
  payment_id: string;
  customer_id: string;
  customer_email: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  failure_reason?: string;
  retry_count?: number;
}

interface PortfolioRiskEvent {
  portfolio_id: string;
  metric: string;
  current_value: number;
  threshold: number;
  threshold_type: 'above' | 'below';
  severity: 'warning' | 'critical';
}

interface EarningsEvent {
  symbol: string;
  company_name: string;
  event_type: 'earnings_release' | 'guidance_update' | 'dividend_announcement';
  scheduled_date: Date;
  actual_date?: Date;
  surprise_percent?: number;
}

interface NewsEvent {
  id: string;
  headline: string;
  source: string;
  symbols: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  impact_score: number;
  published_at: Date;
}

class FinanceEventTriggers {
  private triggers: Map<string, Trigger> = new Map();
  private paymentRetryThreshold = 3;
  private newsImpactThreshold = 0.7;

  registerTrigger(trigger: Trigger): void {
    this.triggers.set(trigger.id, trigger);
  }

  removeTrigger(triggerId: string): void {
    this.triggers.delete(triggerId);
  }

  // Handle payment events
  async onPaymentEvent(payment: PaymentEvent): Promise<void> {
    if (payment.status === 'succeeded') {
      const event = createEvent('payment_succeeded', 'finance', {
        payment_id: payment.payment_id,
        customer_id: payment.customer_id,
        customer_email: payment.customer_email,
        amount: payment.amount,
        currency: payment.currency,
      });
      await eventBus.emit(event);
    } else if (payment.status === 'failed') {
      const event = createEvent('payment_failed', 'finance', {
        payment_id: payment.payment_id,
        customer_id: payment.customer_id,
        customer_email: payment.customer_email,
        amount: payment.amount,
        currency: payment.currency,
        failure_reason: payment.failure_reason,
        retry_count: payment.retry_count || 0,
        requires_intervention: (payment.retry_count || 0) >= this.paymentRetryThreshold,
      });
      await eventBus.emit(event);
    }
  }

  // Handle portfolio risk threshold breaches
  async onPortfolioRiskThreshold(risk: PortfolioRiskEvent): Promise<void> {
    const event = createEvent('portfolio_risk_threshold', 'finance', {
      portfolio_id: risk.portfolio_id,
      metric: risk.metric,
      current_value: risk.current_value,
      threshold: risk.threshold,
      threshold_type: risk.threshold_type,
      severity: risk.severity,
      breach_amount: Math.abs(risk.current_value - risk.threshold),
    });

    await eventBus.emit(event);
  }

  // Handle earnings events
  async onEarningsEvent(earnings: EarningsEvent): Promise<void> {
    const event = createEvent('earnings_event', 'finance', {
      symbol: earnings.symbol,
      company_name: earnings.company_name,
      event_type: earnings.event_type,
      scheduled_date: earnings.scheduled_date,
      actual_date: earnings.actual_date,
      surprise_percent: earnings.surprise_percent,
      is_surprise: earnings.surprise_percent !== undefined && Math.abs(earnings.surprise_percent) > 5,
    });

    await eventBus.emit(event);
  }

  // Handle news events
  async onNewsEvent(news: NewsEvent): Promise<void> {
    if (news.impact_score >= this.newsImpactThreshold) {
      const event = createEvent('news_event', 'finance', {
        news_id: news.id,
        headline: news.headline,
        source: news.source,
        symbols: news.symbols,
        sentiment: news.sentiment,
        impact_score: news.impact_score,
        published_at: news.published_at,
      });

      await eventBus.emit(event);
    }
  }

  setPaymentRetryThreshold(threshold: number): void {
    this.paymentRetryThreshold = threshold;
  }

  setNewsImpactThreshold(threshold: number): void {
    this.newsImpactThreshold = threshold;
  }

  getTriggers(): Trigger[] {
    return Array.from(this.triggers.values());
  }
}

export const financeEventTriggers = new FinanceEventTriggers();
