export type AssetClass = 'equity' | 'crypto' | 'etf' | 'bond' | 'commodity' | 'forex';
export type Exchange = 'NYSE' | 'NASDAQ' | 'AMEX' | 'CRYPTO' | 'LSE' | 'TSE' | 'OTHER';
export type SignalStrength = 'strong' | 'moderate' | 'weak' | 'neutral';
export type MarketRegime = 'bull' | 'bear' | 'sideways' | 'volatile' | 'low-volatility';
export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';

export interface Asset {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  exchange: Exchange;
  sector?: string;
  industry?: string;
  marketCap?: number;
  avgVolume?: number;
  price?: number;
  change?: number;
  changePercent?: number;
}

export interface WatchlistItem extends Asset {
  addedAt: Date;
  notes?: string;
  alerts?: PriceAlert[];
  tags?: string[];
}

export interface PriceAlert {
  id: string;
  type: 'above' | 'below' | 'percent-change';
  value: number;
  triggered: boolean;
  triggeredAt?: Date;
}

export interface Signal {
  id: string;
  symbol: string;
  type: SignalType;
  direction: 'long' | 'short' | 'neutral';
  strength: SignalStrength;
  confidence: number;
  timeframe: TimeFrame;
  generatedAt: Date;
  expiresAt?: Date;
  metadata: Record<string, unknown>;
}

export type SignalType = 
  | 'momentum'
  | 'mean-reversion'
  | 'trend-following'
  | 'volatility-breakout'
  | 'event-driven'
  | 'fundamental';

export interface Opportunity {
  id: string;
  symbol: string;
  asset: Asset;
  signals: Signal[];
  thesis: InvestmentThesis;
  opportunityScore: number;
  riskScore: number;
  expectedReturn: number;
  timeHorizon: string;
  invalidationConditions: string[];
  generatedAt: Date;
  status: 'active' | 'expired' | 'invalidated' | 'executed';
}

export interface InvestmentThesis {
  summary: string;
  bullCase: string[];
  bearCase: string[];
  catalysts: string[];
  risks: string[];
  targetPrice?: number;
  stopLoss?: number;
  confidence: number;
}

export interface FundamentalData {
  symbol: string;
  pe?: number;
  forwardPe?: number;
  peg?: number;
  pb?: number;
  ps?: number;
  evToEbitda?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  roe?: number;
  roa?: number;
  roic?: number;
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  fcfYield?: number;
  dividendYield?: number;
}

export interface QualityScore {
  overall: number;
  profitability: number;
  financialStrength: number;
  earningsQuality: number;
  growth: number;
}

export interface ValuationScore {
  overall: number;
  relativeValue: number;
  absoluteValue: number;
  historicalValue: number;
}

export interface GrowthScore {
  overall: number;
  revenueGrowth: number;
  earningsGrowth: number;
  futureGrowth: number;
}

export interface SignalPerformance {
  signalType: SignalType;
  totalSignals: number;
  successfulSignals: number;
  winRate: number;
  avgReturn: number;
  avgHoldingPeriod: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  profitFactor?: number;
}

export interface ThesisRecord {
  id: string;
  opportunity: Opportunity;
  outcome: 'win' | 'loss' | 'partial' | 'pending';
  actualReturn?: number;
  holdingPeriod?: number;
  lessons: string[];
  createdAt: Date;
  closedAt?: Date;
}

export interface FilterCriteria {
  assetClasses?: AssetClass[];
  exchanges?: Exchange[];
  sectors?: string[];
  minMarketCap?: number;
  maxMarketCap?: number;
  minVolume?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface OpportunityDigest {
  id: string;
  generatedAt: Date;
  opportunities: Opportunity[];
  marketContext: string;
  topPicks: Opportunity[];
  alerts: string[];
}
