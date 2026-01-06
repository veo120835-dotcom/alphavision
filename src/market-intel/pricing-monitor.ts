// Pricing Monitor - Track competitor pricing changes

import { PricingData } from './types';

interface PricingAlert {
  competitor_id: string;
  product_name: string;
  alert_type: 'price_drop' | 'price_increase' | 'new_tier' | 'model_change';
  description: string;
  urgency: 'low' | 'medium' | 'high';
  recommended_action: string;
}

interface PricingPositionAnalysis {
  our_position: 'cheapest' | 'mid_range' | 'premium' | 'luxury';
  market_average: number;
  our_vs_average_percent: number;
  price_sensitivity_risk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

class PricingMonitorService {
  private pricingData: PricingData[] = [];
  private ourPricing: Map<string, number> = new Map();

  recordCompetitorPricing(pricing: PricingData): void {
    const existingIndex = this.pricingData.findIndex(
      p => p.competitor_id === pricing.competitor_id && p.product_name === pricing.product_name
    );

    if (existingIndex >= 0) {
      const existing = this.pricingData[existingIndex];
      if (existing.price !== pricing.price) {
        pricing.price_change = {
          previous_price: existing.price,
          change_date: new Date().toISOString(),
          change_percent: ((pricing.price - existing.price) / existing.price) * 100,
        };
      }
      this.pricingData[existingIndex] = pricing;
    } else {
      this.pricingData.push(pricing);
    }
  }

  setOurPricing(productName: string, price: number): void {
    this.ourPricing.set(productName, price);
  }

  detectPricingAlerts(): PricingAlert[] {
    const alerts: PricingAlert[] = [];

    this.pricingData.forEach(pricing => {
      if (pricing.price_change) {
        const change = pricing.price_change;
        
        if (change.change_percent <= -10) {
          alerts.push({
            competitor_id: pricing.competitor_id,
            product_name: pricing.product_name,
            alert_type: 'price_drop',
            description: `Price dropped ${Math.abs(change.change_percent).toFixed(1)}% from $${change.previous_price} to $${pricing.price}`,
            urgency: change.change_percent <= -20 ? 'high' : 'medium',
            recommended_action: 'Review pricing strategy and value proposition',
          });
        } else if (change.change_percent >= 15) {
          alerts.push({
            competitor_id: pricing.competitor_id,
            product_name: pricing.product_name,
            alert_type: 'price_increase',
            description: `Price increased ${change.change_percent.toFixed(1)}% from $${change.previous_price} to $${pricing.price}`,
            urgency: 'low',
            recommended_action: 'Opportunity to capture price-sensitive customers',
          });
        }
      }
    });

    return alerts;
  }

  analyzeMarketPosition(productName: string): PricingPositionAnalysis | null {
    const ourPrice = this.ourPricing.get(productName);
    if (ourPrice === undefined) return null;

    const competitorPrices = this.pricingData
      .filter(p => p.product_name === productName)
      .map(p => p.price);

    if (competitorPrices.length === 0) {
      return {
        our_position: 'mid_range',
        market_average: ourPrice,
        our_vs_average_percent: 0,
        price_sensitivity_risk: 'medium',
        recommendations: ['Insufficient competitor data for analysis'],
      };
    }

    const allPrices = [...competitorPrices, ourPrice];
    const marketAverage = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
    const ourVsAveragePercent = ((ourPrice - marketAverage) / marketAverage) * 100;

    const sortedPrices = [...allPrices].sort((a, b) => a - b);
    const ourIndex = sortedPrices.indexOf(ourPrice);
    const percentile = (ourIndex / (sortedPrices.length - 1)) * 100;

    let position: 'cheapest' | 'mid_range' | 'premium' | 'luxury';
    if (percentile <= 20) position = 'cheapest';
    else if (percentile <= 60) position = 'mid_range';
    else if (percentile <= 85) position = 'premium';
    else position = 'luxury';

    const recommendations = this.generatePricingRecommendations(position, ourVsAveragePercent);

    return {
      our_position: position,
      market_average: marketAverage,
      our_vs_average_percent: ourVsAveragePercent,
      price_sensitivity_risk: position === 'luxury' ? 'high' : position === 'cheapest' ? 'low' : 'medium',
      recommendations,
    };
  }

  private generatePricingRecommendations(position: string, vsAverage: number): string[] {
    const recommendations: string[] = [];

    if (position === 'cheapest') {
      recommendations.push('Consider value-add services to increase perceived value');
      recommendations.push('Test price increases in less competitive segments');
    } else if (position === 'luxury') {
      recommendations.push('Ensure premium positioning is matched by premium experience');
      recommendations.push('Create entry-level tier to capture price-sensitive market');
    } else if (vsAverage < -15) {
      recommendations.push('Room to increase prices without losing competitiveness');
    } else if (vsAverage > 20) {
      recommendations.push('Strong differentiation needed to justify premium');
    }

    return recommendations;
  }

  getPricingTrends(competitorId: string): {
    product_name: string;
    trend: 'increasing' | 'stable' | 'decreasing';
    change_percent: number;
  }[] {
    return this.pricingData
      .filter(p => p.competitor_id === competitorId && p.price_change)
      .map(p => ({
        product_name: p.product_name,
        trend: p.price_change!.change_percent > 5 ? 'increasing' :
               p.price_change!.change_percent < -5 ? 'decreasing' : 'stable',
        change_percent: p.price_change!.change_percent,
      }));
  }
}

export const pricingMonitorService = new PricingMonitorService();
