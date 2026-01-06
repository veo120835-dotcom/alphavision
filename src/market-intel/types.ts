// Market Intelligence Types

export interface Competitor {
  id: string;
  name: string;
  website: string;
  category: 'direct' | 'indirect' | 'potential';
  market_share_estimate?: number;
  strengths: string[];
  weaknesses: string[];
  last_updated: string;
}

export interface PricingData {
  competitor_id: string;
  product_name: string;
  price: number;
  price_model: 'one_time' | 'subscription' | 'usage_based' | 'freemium';
  tier?: string;
  features_included: string[];
  last_checked: string;
  price_change?: {
    previous_price: number;
    change_date: string;
    change_percent: number;
  };
}

export interface OfferDiff {
  competitor_id: string;
  feature: string;
  our_status: 'has' | 'missing' | 'better' | 'worse';
  competitor_status: 'has' | 'missing' | 'better' | 'worse';
  importance: 'critical' | 'important' | 'nice_to_have';
  gap_analysis: string;
}

export interface TrendSignal {
  id: string;
  signal_type: 'emerging' | 'growing' | 'declining' | 'disruption';
  category: string;
  title: string;
  description: string;
  confidence: number;
  time_horizon: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  relevance_score: number;
  sources: string[];
  detected_at: string;
}

export interface CustomerShift {
  id: string;
  shift_type: 'preference' | 'behavior' | 'demographic' | 'need';
  description: string;
  magnitude: 'minor' | 'moderate' | 'major' | 'transformational';
  affected_segments: string[];
  opportunity_or_threat: 'opportunity' | 'threat' | 'both';
  recommended_response: string;
}

export interface OpportunityAlert {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'market_gap' | 'competitor_weakness' | 'trend_alignment' | 'timing_window';
  title: string;
  description: string;
  action_required: string;
  expires_at?: string;
  potential_impact: number;
}

export interface MarketIntelligenceReport {
  generated_at: string;
  competitors: Competitor[];
  pricing_landscape: PricingData[];
  offer_gaps: OfferDiff[];
  trend_signals: TrendSignal[];
  customer_shifts: CustomerShift[];
  alerts: OpportunityAlert[];
  strategic_recommendations: string[];
}
