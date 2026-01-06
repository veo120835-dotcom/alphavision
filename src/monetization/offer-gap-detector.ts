/**
 * Offer Gap Detector
 * Identifies missing offers and monetization opportunities
 */

export interface OfferGap {
  id: string;
  timestamp: Date;
  gap: GapDefinition;
  opportunity: OpportunityAssessment;
  evidence: GapEvidence;
  recommendation: GapRecommendation;
  priority: GapPriority;
}

export interface GapDefinition {
  type: GapType;
  name: string;
  description: string;
  targetSegment: string;
  currentState: string;
  desiredState: string;
  gapSize: number;
}

export type GapType =
  | 'price_point_gap'
  | 'segment_gap'
  | 'feature_gap'
  | 'service_tier_gap'
  | 'lifecycle_gap'
  | 'channel_gap'
  | 'bundle_gap'
  | 'upsell_gap'
  | 'downsell_gap'
  | 'retention_gap';

export interface OpportunityAssessment {
  revenueImpact: RevenueImpact;
  marketSize: number;
  competitiveAdvantage: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  timeToValue: string;
  confidence: number;
}

export interface RevenueImpact {
  estimated: number;
  range: { low: number; high: number };
  basis: string;
  assumptions: string[];
}

export interface GapEvidence {
  signals: EvidenceSignal[];
  dataPoints: DataPoint[];
  customerFeedback: string[];
  competitorAnalysis: CompetitorInsight[];
}

export interface EvidenceSignal {
  signal: string;
  source: string;
  strength: number;
  timestamp: Date;
}

export interface DataPoint {
  metric: string;
  value: number;
  benchmark?: number;
  significance: string;
}

export interface CompetitorInsight {
  competitor: string;
  offering: string;
  relevance: number;
}

export interface GapRecommendation {
  action: string;
  offerDesign: ProposedOffer;
  implementation: ImplementationPlan;
  risks: string[];
  alternatives: string[];
}

export interface ProposedOffer {
  name: string;
  description: string;
  pricing: PricingStrategy;
  positioning: string;
  differentiation: string[];
  targetConversion: number;
}

export interface PricingStrategy {
  model: 'one_time' | 'subscription' | 'usage' | 'hybrid';
  suggestedPrice: number;
  priceRange: { low: number; high: number };
  rationale: string;
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  totalDuration: string;
  resourceRequirements: string[];
  dependencies: string[];
  successMetrics: string[];
}

export interface ImplementationPhase {
  phase: number;
  name: string;
  duration: string;
  activities: string[];
  deliverables: string[];
}

export type GapPriority = 'critical' | 'high' | 'medium' | 'low';

export interface BusinessProfile {
  offers: ExistingOffer[];
  customers: CustomerSegment[];
  revenue: RevenueData;
  churn: ChurnData;
  feedback: CustomerFeedback[];
  competitors: CompetitorInfo[];
}

export interface ExistingOffer {
  id: string;
  name: string;
  price: number;
  model: string;
  segment: string;
  conversionRate: number;
  churnRate: number;
  ltv: number;
}

export interface CustomerSegment {
  name: string;
  size: number;
  avgValue: number;
  needs: string[];
  served: boolean;
}

export interface RevenueData {
  total: number;
  byOffer: Record<string, number>;
  growth: number;
}

export interface ChurnData {
  rate: number;
  reasons: Array<{ reason: string; percentage: number }>;
}

export interface CustomerFeedback {
  type: 'feature_request' | 'complaint' | 'suggestion' | 'praise';
  content: string;
  frequency: number;
}

export interface CompetitorInfo {
  name: string;
  offerings: string[];
  pricing: string;
  positioning: string;
}

class OfferGapDetector {
  private gaps: Map<string, OfferGap> = new Map();

  generateId(): string {
    return `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async analyze(profile: BusinessProfile): Promise<OfferGap[]> {
    const detectedGaps: OfferGap[] = [];

    // Detect various gap types
    const priceGaps = this.detectPricePointGaps(profile);
    const segmentGaps = this.detectSegmentGaps(profile);
    const lifecycleGaps = this.detectLifecycleGaps(profile);
    const bundleGaps = this.detectBundleGaps(profile);
    const retentionGaps = this.detectRetentionGaps(profile);

    const allGaps = [...priceGaps, ...segmentGaps, ...lifecycleGaps, ...bundleGaps, ...retentionGaps];

    // Prioritize and store
    allGaps.forEach((gap) => {
      gap.priority = this.calculatePriority(gap);
      this.gaps.set(gap.id, gap);
      detectedGaps.push(gap);
    });

    return detectedGaps.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private detectPricePointGaps(profile: BusinessProfile): OfferGap[] {
    const gaps: OfferGap[] = [];
    const prices = profile.offers.map((o) => o.price).sort((a, b) => a - b);

    // Check for large gaps between price points
    for (let i = 1; i < prices.length; i++) {
      const ratio = prices[i] / prices[i - 1];
      if (ratio > 3) {
        gaps.push(this.createPriceGap(prices[i - 1], prices[i], profile));
      }
    }

    // Check for missing entry-level offer
    if (prices.length > 0 && prices[0] > 100) {
      gaps.push(this.createEntryLevelGap(prices[0], profile));
    }

    // Check for missing premium tier
    if (prices.length > 0 && prices[prices.length - 1] < profile.revenue.total / profile.customers.reduce((s, c) => s + c.size, 0) * 5) {
      gaps.push(this.createPremiumTierGap(prices[prices.length - 1], profile));
    }

    return gaps;
  }

  private createPriceGap(lowerPrice: number, upperPrice: number, profile: BusinessProfile): OfferGap {
    const midPrice = (lowerPrice + upperPrice) / 2;

    return {
      id: this.generateId(),
      timestamp: new Date(),
      gap: {
        type: 'price_point_gap',
        name: 'Mid-Tier Pricing Gap',
        description: `Large gap between $${lowerPrice} and $${upperPrice} offerings`,
        targetSegment: 'Mid-market customers',
        currentState: `Jump from $${lowerPrice} to $${upperPrice}`,
        desiredState: `Intermediate option around $${midPrice}`,
        gapSize: upperPrice - lowerPrice,
      },
      opportunity: {
        revenueImpact: {
          estimated: midPrice * 100,
          range: { low: midPrice * 50, high: midPrice * 200 },
          basis: 'Estimated conversions from gap segment',
          assumptions: ['10% of lost leads would convert', 'Similar margins to existing offers'],
        },
        marketSize: profile.customers.reduce((s, c) => s + c.size, 0) * 0.2,
        competitiveAdvantage: 0.6,
        implementationComplexity: 'medium',
        timeToValue: '60 days',
        confidence: 0.7,
      },
      evidence: {
        signals: [
          { signal: 'Price objections from mid-market', source: 'sales_calls', strength: 0.8, timestamp: new Date() },
        ],
        dataPoints: [
          { metric: 'Price gap ratio', value: upperPrice / lowerPrice, benchmark: 2, significance: 'Large gap may lose customers' },
        ],
        customerFeedback: ['Looking for something in between', 'Too expensive but basic is not enough'],
        competitorAnalysis: [],
      },
      recommendation: {
        action: 'Create mid-tier offer',
        offerDesign: {
          name: 'Professional Plan',
          description: 'Enhanced features for growing businesses',
          pricing: {
            model: 'subscription',
            suggestedPrice: midPrice,
            priceRange: { low: lowerPrice * 1.5, high: upperPrice * 0.7 },
            rationale: 'Positioned between existing tiers',
          },
          positioning: 'For serious professionals who need more',
          differentiation: ['Additional features', 'Priority support', 'Advanced reporting'],
          targetConversion: 0.15,
        },
        implementation: {
          phases: [
            { phase: 1, name: 'Design', duration: '2 weeks', activities: ['Define features', 'Set pricing'], deliverables: ['Offer specification'] },
            { phase: 2, name: 'Build', duration: '4 weeks', activities: ['Develop features', 'Create materials'], deliverables: ['Offer ready'] },
            { phase: 3, name: 'Launch', duration: '2 weeks', activities: ['Soft launch', 'Gather feedback'], deliverables: ['Live offer'] },
          ],
          totalDuration: '8 weeks',
          resourceRequirements: ['Product team', 'Marketing', 'Sales enablement'],
          dependencies: ['Feature development', 'Pricing approval'],
          successMetrics: ['Conversion rate', 'Revenue per user', 'Customer satisfaction'],
        },
        risks: ['Cannibalization of existing tiers', 'Support complexity'],
        alternatives: ['Feature-based upgrade path', 'Usage-based pricing'],
      },
      priority: 'high',
    };
  }

  private createEntryLevelGap(lowestPrice: number, profile: BusinessProfile): OfferGap {
    const suggestedPrice = Math.round(lowestPrice * 0.3);

    return {
      id: this.generateId(),
      timestamp: new Date(),
      gap: {
        type: 'downsell_gap',
        name: 'Entry-Level Gap',
        description: 'No affordable entry point for price-sensitive customers',
        targetSegment: 'Budget-conscious and trial-seeking customers',
        currentState: `Lowest price is $${lowestPrice}`,
        desiredState: `Entry option around $${suggestedPrice}`,
        gapSize: lowestPrice - suggestedPrice,
      },
      opportunity: {
        revenueImpact: {
          estimated: suggestedPrice * 500,
          range: { low: suggestedPrice * 200, high: suggestedPrice * 1000 },
          basis: 'Volume from price-sensitive segment',
          assumptions: ['High volume at lower price', 'Upsell potential'],
        },
        marketSize: profile.customers.reduce((s, c) => s + c.size, 0) * 0.4,
        competitiveAdvantage: 0.5,
        implementationComplexity: 'low',
        timeToValue: '30 days',
        confidence: 0.75,
      },
      evidence: {
        signals: [
          { signal: 'Lost deals to price', source: 'CRM', strength: 0.9, timestamp: new Date() },
        ],
        dataPoints: [
          { metric: 'Lost deal rate - price', value: 0.3, benchmark: 0.15, significance: 'High price sensitivity in market' },
        ],
        customerFeedback: ['Too expensive to try', 'Need starter option'],
        competitorAnalysis: profile.competitors
          .filter((c) => c.pricing.toLowerCase().includes('free') || c.pricing.toLowerCase().includes('starter'))
          .map((c) => ({ competitor: c.name, offering: c.pricing, relevance: 0.8 })),
      },
      recommendation: {
        action: 'Create entry-level tier',
        offerDesign: {
          name: 'Starter Plan',
          description: 'Essential features to get started',
          pricing: {
            model: 'subscription',
            suggestedPrice,
            priceRange: { low: suggestedPrice * 0.5, high: lowestPrice * 0.5 },
            rationale: 'Low barrier to entry with upsell path',
          },
          positioning: 'Perfect for getting started',
          differentiation: ['Low commitment', 'Easy upgrade path', 'Core functionality'],
          targetConversion: 0.25,
        },
        implementation: {
          phases: [
            { phase: 1, name: 'Scope', duration: '1 week', activities: ['Define feature limits'], deliverables: ['Feature matrix'] },
            { phase: 2, name: 'Build', duration: '2 weeks', activities: ['Implement limits', 'Update billing'], deliverables: ['Ready tier'] },
            { phase: 3, name: 'Launch', duration: '1 week', activities: ['Marketing', 'Sales training'], deliverables: ['Live offer'] },
          ],
          totalDuration: '4 weeks',
          resourceRequirements: ['Engineering', 'Marketing'],
          dependencies: ['Feature gating capability'],
          successMetrics: ['Signup rate', 'Upgrade rate', 'Time to upgrade'],
        },
        risks: ['Margin pressure', 'Support volume increase'],
        alternatives: ['Free trial', 'Freemium model'],
      },
      priority: 'high',
    };
  }

  private createPremiumTierGap(highestPrice: number, profile: BusinessProfile): OfferGap {
    const suggestedPrice = highestPrice * 3;

    return {
      id: this.generateId(),
      timestamp: new Date(),
      gap: {
        type: 'upsell_gap',
        name: 'Premium Tier Gap',
        description: 'No premium offering for high-value customers',
        targetSegment: 'Enterprise and power users',
        currentState: `Highest price is $${highestPrice}`,
        desiredState: `Premium option at $${suggestedPrice}+`,
        gapSize: suggestedPrice - highestPrice,
      },
      opportunity: {
        revenueImpact: {
          estimated: suggestedPrice * 20,
          range: { low: suggestedPrice * 10, high: suggestedPrice * 50 },
          basis: 'High-value customer capture',
          assumptions: ['5-10% of customers want premium', 'Higher willingness to pay exists'],
        },
        marketSize: profile.customers.reduce((s, c) => s + c.size, 0) * 0.05,
        competitiveAdvantage: 0.7,
        implementationComplexity: 'medium',
        timeToValue: '90 days',
        confidence: 0.6,
      },
      evidence: {
        signals: [
          { signal: 'Customers asking for more', source: 'Support', strength: 0.7, timestamp: new Date() },
        ],
        dataPoints: [
          { metric: 'Power user percentage', value: 0.1, significance: 'Segment exists for premium' },
        ],
        customerFeedback: ['Need enterprise features', 'Want dedicated support'],
        competitorAnalysis: [],
      },
      recommendation: {
        action: 'Create enterprise/premium tier',
        offerDesign: {
          name: 'Enterprise Plan',
          description: 'Full-featured solution with premium support',
          pricing: {
            model: 'subscription',
            suggestedPrice,
            priceRange: { low: highestPrice * 2, high: highestPrice * 5 },
            rationale: 'Value-based for high-demand customers',
          },
          positioning: 'For organizations that demand the best',
          differentiation: ['Dedicated support', 'Custom features', 'SLA guarantees', 'Account management'],
          targetConversion: 0.05,
        },
        implementation: {
          phases: [
            { phase: 1, name: 'Research', duration: '2 weeks', activities: ['Customer interviews', 'Feature prioritization'], deliverables: ['Requirements'] },
            { phase: 2, name: 'Build', duration: '6 weeks', activities: ['Develop features', 'Support infrastructure'], deliverables: ['Premium features'] },
            { phase: 3, name: 'Launch', duration: '2 weeks', activities: ['Selective rollout', 'Sales enablement'], deliverables: ['Live tier'] },
          ],
          totalDuration: '10 weeks',
          resourceRequirements: ['Product', 'Engineering', 'Customer Success', 'Sales'],
          dependencies: ['Enterprise feature development', 'Support scaling'],
          successMetrics: ['Enterprise conversions', 'ACV increase', 'NRR'],
        },
        risks: ['Development investment', 'Support expectations'],
        alternatives: ['Custom pricing', 'Add-on features'],
      },
      priority: 'medium',
    };
  }

  private detectSegmentGaps(profile: BusinessProfile): OfferGap[] {
    const gaps: OfferGap[] = [];

    const unservedSegments = profile.customers.filter((c) => !c.served && c.size > 100);

    unservedSegments.forEach((segment) => {
      gaps.push({
        id: this.generateId(),
        timestamp: new Date(),
        gap: {
          type: 'segment_gap',
          name: `Unserved Segment: ${segment.name}`,
          description: `${segment.name} segment not addressed by current offerings`,
          targetSegment: segment.name,
          currentState: 'No tailored offering',
          desiredState: 'Segment-specific solution',
          gapSize: segment.size * segment.avgValue,
        },
        opportunity: {
          revenueImpact: {
            estimated: segment.size * segment.avgValue * 0.2,
            range: { low: segment.size * segment.avgValue * 0.1, high: segment.size * segment.avgValue * 0.3 },
            basis: 'Segment capture rate',
            assumptions: ['20% addressable', 'Similar value to existing customers'],
          },
          marketSize: segment.size,
          competitiveAdvantage: 0.5,
          implementationComplexity: 'medium',
          timeToValue: '90 days',
          confidence: 0.6,
        },
        evidence: {
          signals: [{ signal: 'Segment identified in data', source: 'analytics', strength: 0.8, timestamp: new Date() }],
          dataPoints: [{ metric: 'Segment size', value: segment.size, significance: 'Significant addressable market' }],
          customerFeedback: segment.needs,
          competitorAnalysis: [],
        },
        recommendation: {
          action: `Create ${segment.name}-specific offer`,
          offerDesign: {
            name: `${segment.name} Solution`,
            description: `Tailored for ${segment.name} needs`,
            pricing: {
              model: 'subscription',
              suggestedPrice: segment.avgValue,
              priceRange: { low: segment.avgValue * 0.7, high: segment.avgValue * 1.3 },
              rationale: 'Based on segment value analysis',
            },
            positioning: `Built specifically for ${segment.name}`,
            differentiation: segment.needs,
            targetConversion: 0.15,
          },
          implementation: {
            phases: [
              { phase: 1, name: 'Research', duration: '3 weeks', activities: ['Segment research'], deliverables: ['Segment profile'] },
              { phase: 2, name: 'Design', duration: '4 weeks', activities: ['Offer design'], deliverables: ['Offer spec'] },
              { phase: 3, name: 'Launch', duration: '3 weeks', activities: ['GTM execution'], deliverables: ['Live offer'] },
            ],
            totalDuration: '10 weeks',
            resourceRequirements: ['Product', 'Marketing', 'Sales'],
            dependencies: ['Segment validation'],
            successMetrics: ['Segment conversion', 'Segment NPS'],
          },
          risks: ['Market size uncertainty', 'Segment needs mismatch'],
          alternatives: ['Customize existing offer', 'Partner with segment specialist'],
        },
        priority: 'medium',
      });
    });

    return gaps;
  }

  private detectLifecycleGaps(profile: BusinessProfile): OfferGap[] {
    const gaps: OfferGap[] = [];
    const churnReasons = profile.churn.reasons;

    // Check for graduation/upgrade gap
    const outgrownReason = churnReasons.find((r) => r.reason.toLowerCase().includes('outgrown') || r.reason.toLowerCase().includes('need more'));
    if (outgrownReason && outgrownReason.percentage > 10) {
      gaps.push({
        id: this.generateId(),
        timestamp: new Date(),
        gap: {
          type: 'lifecycle_gap',
          name: 'Customer Graduation Gap',
          description: 'Customers churning because they outgrow current offerings',
          targetSegment: 'Power users ready to scale',
          currentState: `${outgrownReason.percentage}% churn due to outgrowing`,
          desiredState: 'Clear upgrade path for growing customers',
          gapSize: profile.revenue.total * (outgrownReason.percentage / 100),
        },
        opportunity: {
          revenueImpact: {
            estimated: profile.revenue.total * (outgrownReason.percentage / 100) * 1.5,
            range: { low: profile.revenue.total * (outgrownReason.percentage / 100), high: profile.revenue.total * (outgrownReason.percentage / 100) * 2 },
            basis: 'Retained and expanded revenue',
            assumptions: ['50% of churning customers would upgrade if option existed'],
          },
          marketSize: profile.churn.rate * profile.customers.reduce((s, c) => s + c.size, 0) * (outgrownReason.percentage / 100),
          competitiveAdvantage: 0.6,
          implementationComplexity: 'medium',
          timeToValue: '60 days',
          confidence: 0.75,
        },
        evidence: {
          signals: [{ signal: 'Churn reason data', source: 'exit_surveys', strength: 0.9, timestamp: new Date() }],
          dataPoints: [{ metric: 'Outgrown churn %', value: outgrownReason.percentage, benchmark: 5, significance: 'High preventable churn' }],
          customerFeedback: ['Need more capacity', 'Looking for enterprise features'],
          competitorAnalysis: [],
        },
        recommendation: {
          action: 'Create scalable tier or expansion options',
          offerDesign: {
            name: 'Scale Plan',
            description: 'For customers ready to grow',
            pricing: {
              model: 'usage',
              suggestedPrice: profile.offers[profile.offers.length - 1]?.price * 2 || 500,
              priceRange: { low: 300, high: 1000 },
              rationale: 'Usage-based to scale with customer',
            },
            positioning: 'Grow without limits',
            differentiation: ['Unlimited scaling', 'Advanced features', 'Premium support'],
            targetConversion: 0.3,
          },
          implementation: {
            phases: [
              { phase: 1, name: 'Analysis', duration: '2 weeks', activities: ['Usage pattern analysis'], deliverables: ['Scaling model'] },
              { phase: 2, name: 'Build', duration: '4 weeks', activities: ['Usage tracking', 'Billing integration'], deliverables: ['Scalable tier'] },
            ],
            totalDuration: '6 weeks',
            resourceRequirements: ['Product', 'Engineering', 'Finance'],
            dependencies: ['Usage metering'],
            successMetrics: ['Retention improvement', 'Expansion revenue'],
          },
          risks: ['Pricing complexity', 'Revenue unpredictability'],
          alternatives: ['Enterprise tier', 'Add-on packages'],
        },
        priority: 'critical',
      });
    }

    return gaps;
  }

  private detectBundleGaps(profile: BusinessProfile): OfferGap[] {
    const gaps: OfferGap[] = [];

    // Check if no bundles exist
    const hasBundles = profile.offers.some((o) => o.name.toLowerCase().includes('bundle') || o.name.toLowerCase().includes('suite'));

    if (!hasBundles && profile.offers.length > 2) {
      gaps.push({
        id: this.generateId(),
        timestamp: new Date(),
        gap: {
          type: 'bundle_gap',
          name: 'Product Bundle Gap',
          description: 'No bundled offerings to increase deal value',
          targetSegment: 'Multi-need customers',
          currentState: 'Products sold separately',
          desiredState: 'Strategic bundles available',
          gapSize: profile.revenue.total * 0.15,
        },
        opportunity: {
          revenueImpact: {
            estimated: profile.revenue.total * 0.15,
            range: { low: profile.revenue.total * 0.08, high: profile.revenue.total * 0.25 },
            basis: 'Average bundle uplift',
            assumptions: ['15% revenue increase from bundling'],
          },
          marketSize: profile.customers.reduce((s, c) => s + c.size, 0) * 0.3,
          competitiveAdvantage: 0.5,
          implementationComplexity: 'low',
          timeToValue: '30 days',
          confidence: 0.7,
        },
        evidence: {
          signals: [{ signal: 'Cross-purchase patterns', source: 'sales_data', strength: 0.7, timestamp: new Date() }],
          dataPoints: [{ metric: 'Multi-product customers', value: 0.2, significance: 'Cross-buy potential exists' }],
          customerFeedback: ['Discount for multiple products?', 'Package deal available?'],
          competitorAnalysis: [],
        },
        recommendation: {
          action: 'Create strategic bundles',
          offerDesign: {
            name: 'Complete Solution Bundle',
            description: 'Everything you need in one package',
            pricing: {
              model: 'subscription',
              suggestedPrice: profile.offers.reduce((s, o) => s + o.price, 0) * 0.8,
              priceRange: { low: profile.offers.reduce((s, o) => s + o.price, 0) * 0.7, high: profile.offers.reduce((s, o) => s + o.price, 0) * 0.85 },
              rationale: '15-20% discount for commitment',
            },
            positioning: 'Best value for complete solution',
            differentiation: ['Simplified purchasing', 'Cost savings', 'Integrated experience'],
            targetConversion: 0.2,
          },
          implementation: {
            phases: [
              { phase: 1, name: 'Design', duration: '1 week', activities: ['Bundle composition'], deliverables: ['Bundle spec'] },
              { phase: 2, name: 'Launch', duration: '2 weeks', activities: ['Pricing update', 'Sales training'], deliverables: ['Live bundle'] },
            ],
            totalDuration: '3 weeks',
            resourceRequirements: ['Product', 'Sales', 'Finance'],
            dependencies: ['Pricing approval'],
            successMetrics: ['Bundle attach rate', 'ACV increase'],
          },
          risks: ['Margin dilution', 'Complexity'],
          alternatives: ['Volume discounts', 'Loyalty pricing'],
        },
        priority: 'medium',
      });
    }

    return gaps;
  }

  private detectRetentionGaps(profile: BusinessProfile): OfferGap[] {
    const gaps: OfferGap[] = [];

    if (profile.churn.rate > 5) {
      const priceChurn = profile.churn.reasons.find((r) => r.reason.toLowerCase().includes('price'));

      if (priceChurn && priceChurn.percentage > 15) {
        gaps.push({
          id: this.generateId(),
          timestamp: new Date(),
          gap: {
            type: 'retention_gap',
            name: 'Retention Offer Gap',
            description: 'No save offers for at-risk customers',
            targetSegment: 'Price-sensitive churning customers',
            currentState: 'Customers leave due to price',
            desiredState: 'Retention offers capture at-risk',
            gapSize: profile.revenue.total * profile.churn.rate / 100 * priceChurn.percentage / 100,
          },
          opportunity: {
            revenueImpact: {
              estimated: profile.revenue.total * profile.churn.rate / 100 * priceChurn.percentage / 100 * 0.5,
              range: { low: profile.revenue.total * profile.churn.rate / 100 * priceChurn.percentage / 100 * 0.3, high: profile.revenue.total * profile.churn.rate / 100 * priceChurn.percentage / 100 * 0.7 },
              basis: 'Retention improvement potential',
              assumptions: ['50% of price churners saveable'],
            },
            marketSize: profile.churn.rate * profile.customers.reduce((s, c) => s + c.size, 0) / 100,
            competitiveAdvantage: 0.4,
            implementationComplexity: 'low',
            timeToValue: '14 days',
            confidence: 0.8,
          },
          evidence: {
            signals: [{ signal: 'Price-based churn', source: 'cancellation_surveys', strength: 0.9, timestamp: new Date() }],
            dataPoints: [{ metric: 'Price churn %', value: priceChurn.percentage, benchmark: 10, significance: 'High saveable churn' }],
            customerFeedback: ['Too expensive', 'Found cheaper alternative'],
            competitorAnalysis: [],
          },
          recommendation: {
            action: 'Create retention offer system',
            offerDesign: {
              name: 'Loyalty Discount',
              description: 'Special pricing for loyal customers',
              pricing: {
                model: 'subscription',
                suggestedPrice: profile.offers[0]?.price * 0.7 || 50,
                priceRange: { low: profile.offers[0]?.price * 0.5 || 30, high: profile.offers[0]?.price * 0.8 || 70 },
                rationale: 'Discount to retain at-risk customers',
              },
              positioning: 'We value your loyalty',
              differentiation: ['Discounted pricing', 'Same great service'],
              targetConversion: 0.4,
            },
            implementation: {
              phases: [
                { phase: 1, name: 'Design', duration: '1 week', activities: ['Retention offer design', 'Trigger definition'], deliverables: ['Retention playbook'] },
                { phase: 2, name: 'Implement', duration: '1 week', activities: ['System integration', 'Team training'], deliverables: ['Live system'] },
              ],
              totalDuration: '2 weeks',
              resourceRequirements: ['Customer Success', 'Product'],
              dependencies: ['Churn prediction model'],
              successMetrics: ['Save rate', 'Retained revenue'],
            },
            risks: ['Margin impact', 'Gaming'],
            alternatives: ['Pause option', 'Downgrade path'],
          },
          priority: 'high',
        });
      }
    }

    return gaps;
  }

  private calculatePriority(gap: OfferGap): GapPriority {
    const impact = gap.opportunity.revenueImpact.estimated;
    const confidence = gap.opportunity.confidence;
    const complexity = gap.opportunity.implementationComplexity;

    const complexityScore = { low: 1, medium: 0.7, high: 0.4 };
    const score = (impact / 10000) * confidence * complexityScore[complexity];

    if (score > 100) return 'critical';
    if (score > 50) return 'high';
    if (score > 20) return 'medium';
    return 'low';
  }

  getGap(gapId: string): OfferGap | undefined {
    return this.gaps.get(gapId);
  }

  getAllGaps(): OfferGap[] {
    return Array.from(this.gaps.values());
  }

  getGapsByPriority(priority: GapPriority): OfferGap[] {
    return Array.from(this.gaps.values()).filter((g) => g.priority === priority);
  }

  getStats(): {
    totalGaps: number;
    byPriority: Record<GapPriority, number>;
    totalOpportunity: number;
  } {
    const gaps = Array.from(this.gaps.values());
    const byPriority: Record<GapPriority, number> = { critical: 0, high: 0, medium: 0, low: 0 };

    gaps.forEach((g) => {
      byPriority[g.priority]++;
    });

    return {
      totalGaps: gaps.length,
      byPriority,
      totalOpportunity: gaps.reduce((sum, g) => sum + g.opportunity.revenueImpact.estimated, 0),
    };
  }
}

export const offerGapDetector = new OfferGapDetector();
export { OfferGapDetector };
