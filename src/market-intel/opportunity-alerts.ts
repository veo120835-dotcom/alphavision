// Opportunity Alerts - Surface actionable opportunities

import { OpportunityAlert, Competitor, TrendSignal, CustomerShift } from './types';

interface AlertPrioritization {
  alert: OpportunityAlert;
  score: number;
  time_sensitivity: 'urgent' | 'soon' | 'flexible';
  resource_requirement: 'minimal' | 'moderate' | 'significant';
  success_probability: number;
}

interface OpportunitySummary {
  total_alerts: number;
  critical_count: number;
  high_count: number;
  expiring_soon: OpportunityAlert[];
  top_opportunities: OpportunityAlert[];
  estimated_total_impact: number;
}

class OpportunityAlertsService {
  private alerts: OpportunityAlert[] = [];

  addAlert(alert: OpportunityAlert): void {
    const existing = this.alerts.findIndex(a => a.id === alert.id);
    if (existing >= 0) {
      this.alerts[existing] = alert;
    } else {
      this.alerts.push(alert);
    }
  }

  generateFromCompetitorWeakness(competitor: Competitor, weakness: string): OpportunityAlert {
    const alert: OpportunityAlert = {
      id: `comp-weakness-${competitor.id}-${Date.now()}`,
      priority: competitor.category === 'direct' ? 'high' : 'medium',
      type: 'competitor_weakness',
      title: `Competitor Weakness: ${competitor.name}`,
      description: `${competitor.name} shows weakness in: ${weakness}. This creates an opportunity to capture their customers.`,
      action_required: `Develop targeted campaign highlighting our strength in ${weakness}`,
      potential_impact: competitor.market_share_estimate || 5,
    };

    this.addAlert(alert);
    return alert;
  }

  generateFromTrend(trend: TrendSignal): OpportunityAlert {
    const priority = trend.signal_type === 'emerging' && trend.confidence > 0.7 ? 'high' :
                    trend.signal_type === 'disruption' ? 'critical' : 'medium';

    const alert: OpportunityAlert = {
      id: `trend-${trend.id}-${Date.now()}`,
      priority,
      type: 'trend_alignment',
      title: `Trend Opportunity: ${trend.title}`,
      description: `${trend.description} Alignment with this trend could provide competitive advantage.`,
      action_required: 'Evaluate product/service alignment with trend and identify gaps',
      potential_impact: trend.relevance_score * 20,
      expires_at: trend.time_horizon === 'immediate' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    };

    this.addAlert(alert);
    return alert;
  }

  generateFromMarketGap(gap: string, size: number, competition: 'none' | 'low' | 'medium' | 'high'): OpportunityAlert {
    const priority = competition === 'none' ? 'critical' :
                    competition === 'low' ? 'high' : 'medium';

    const alert: OpportunityAlert = {
      id: `gap-${Date.now()}`,
      priority,
      type: 'market_gap',
      title: `Market Gap Identified`,
      description: `Underserved market segment: ${gap}. Competition level: ${competition}. Estimated market size potential: ${size}%`,
      action_required: 'Validate market gap with customer research and develop entry strategy',
      potential_impact: size,
      expires_at: competition === 'none'
        ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    };

    this.addAlert(alert);
    return alert;
  }

  generateFromCustomerShift(shift: CustomerShift): OpportunityAlert | null {
    if (shift.opportunity_or_threat === 'threat') return null;

    const alert: OpportunityAlert = {
      id: `shift-${shift.id}-${Date.now()}`,
      priority: shift.magnitude === 'transformational' ? 'critical' :
               shift.magnitude === 'major' ? 'high' : 'medium',
      type: 'timing_window',
      title: `Customer Shift Opportunity`,
      description: `${shift.description}. Early response could capture shifting customer segment.`,
      action_required: shift.recommended_response,
      potential_impact: shift.affected_segments.length * 5,
    };

    this.addAlert(alert);
    return alert;
  }

  prioritizeAlerts(): AlertPrioritization[] {
    return this.alerts.map(alert => {
      const baseScore = { critical: 100, high: 75, medium: 50, low: 25 }[alert.priority];
      const impactBonus = alert.potential_impact * 2;
      const expiryUrgency = this.calculateExpiryUrgency(alert.expires_at);

      const score = baseScore + impactBonus + expiryUrgency;

      const timeSensitivity: 'urgent' | 'soon' | 'flexible' = 
        expiryUrgency > 20 ? 'urgent' : expiryUrgency > 10 ? 'soon' : 'flexible';

      return {
        alert,
        score,
        time_sensitivity: timeSensitivity,
        resource_requirement: this.estimateResourceRequirement(alert),
        success_probability: this.estimateSuccessProbability(alert),
      };
    }).sort((a, b) => b.score - a.score);
  }

  private calculateExpiryUrgency(expiresAt?: string): number {
    if (!expiresAt) return 0;

    const daysUntilExpiry = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    
    if (daysUntilExpiry < 7) return 30;
    if (daysUntilExpiry < 14) return 20;
    if (daysUntilExpiry < 30) return 10;
    return 0;
  }

  private estimateResourceRequirement(alert: OpportunityAlert): 'minimal' | 'moderate' | 'significant' {
    if (alert.type === 'market_gap') return 'significant';
    if (alert.type === 'competitor_weakness') return 'moderate';
    if (alert.potential_impact > 15) return 'significant';
    if (alert.potential_impact > 8) return 'moderate';
    return 'minimal';
  }

  private estimateSuccessProbability(alert: OpportunityAlert): number {
    let baseProbability = 0.5;

    if (alert.type === 'competitor_weakness') baseProbability += 0.2;
    if (alert.type === 'market_gap') baseProbability += 0.15;
    if (alert.priority === 'critical') baseProbability += 0.1;
    if (alert.expires_at) baseProbability -= 0.1;

    return Math.min(0.9, Math.max(0.2, baseProbability));
  }

  getSummary(): OpportunitySummary {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringSoon = this.alerts.filter(a => 
      a.expires_at && new Date(a.expires_at) <= sevenDaysFromNow
    );

    const prioritized = this.prioritizeAlerts();

    return {
      total_alerts: this.alerts.length,
      critical_count: this.alerts.filter(a => a.priority === 'critical').length,
      high_count: this.alerts.filter(a => a.priority === 'high').length,
      expiring_soon: expiringSoon,
      top_opportunities: prioritized.slice(0, 5).map(p => p.alert),
      estimated_total_impact: this.alerts.reduce((sum, a) => sum + a.potential_impact, 0),
    };
  }

  getAlertsByType(type: OpportunityAlert['type']): OpportunityAlert[] {
    return this.alerts.filter(a => a.type === type);
  }

  dismissAlert(alertId: string): void {
    this.alerts = this.alerts.filter(a => a.id !== alertId);
  }

  getActiveAlerts(): OpportunityAlert[] {
    const now = new Date().toISOString();
    return this.alerts.filter(a => !a.expires_at || a.expires_at > now);
  }
}

export const opportunityAlertsService = new OpportunityAlertsService();
