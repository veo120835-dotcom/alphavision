/**
 * Lead Autopsy
 * Diagnoses why leads went cold with precision
 */

export interface LeadAutopsy {
  leadId: string;
  timestamp: Date;
  diagnosis: AutopsyDiagnosis;
  timeline: EngagementTimeline;
  deathSignals: DeathSignal[];
  rootCause: RootCause;
  revivability: RevivabilityAssessment;
  recommendations: string[];
}

export interface AutopsyDiagnosis {
  primaryCause: DeathCause;
  secondaryCauses: DeathCause[];
  confidence: number;
  evidenceStrength: 'strong' | 'moderate' | 'weak';
  dataCompleteness: number;
}

export type DeathCause =
  | 'price_objection'
  | 'timing_mismatch'
  | 'trust_deficit'
  | 'identity_misalignment'
  | 'fear_of_change'
  | 'competitor_chosen'
  | 'internal_blockers'
  | 'budget_freeze'
  | 'poor_follow_up'
  | 'wrong_offer'
  | 'communication_breakdown'
  | 'ghosting_pattern'
  | 'decision_paralysis'
  | 'stakeholder_conflict'
  | 'unknown';

export interface EngagementTimeline {
  firstContact: Date;
  lastContact: Date;
  peakEngagement: Date;
  dropoffPoint: Date;
  totalTouchpoints: number;
  engagementPattern: EngagementPattern;
}

export type EngagementPattern =
  | 'steady_decline'
  | 'sudden_drop'
  | 'oscillating'
  | 'never_engaged'
  | 'ghosted_after_proposal'
  | 'ghosted_after_call'
  | 'slow_fade';

export interface DeathSignal {
  type: SignalType;
  timestamp: Date;
  description: string;
  severity: number;
  wasAddressed: boolean;
}

export type SignalType =
  | 'response_delay_increase'
  | 'shorter_responses'
  | 'questions_stopped'
  | 'objection_raised'
  | 'competitor_mentioned'
  | 'budget_concern'
  | 'timing_pushback'
  | 'stakeholder_introduced'
  | 'meeting_cancelled'
  | 'proposal_ignored'
  | 'unsubscribed';

export interface RootCause {
  category: RootCauseCategory;
  specificCause: string;
  evidence: string[];
  counterfactual: string;
  preventable: boolean;
}

export type RootCauseCategory =
  | 'offer_market_fit'
  | 'sales_process'
  | 'timing_context'
  | 'relationship_trust'
  | 'competitive_pressure'
  | 'internal_dynamics'
  | 'external_factors';

export interface RevivabilityAssessment {
  score: number;
  classification: 'high' | 'medium' | 'low' | 'dead';
  optimalWindow: { start: Date; end: Date } | null;
  requiredApproach: string;
  estimatedConversionProbability: number;
  effortToRevive: 'minimal' | 'moderate' | 'significant' | 'heroic';
}

export interface LeadData {
  leadId: string;
  contactInfo: Record<string, unknown>;
  interactions: Interaction[];
  proposals: Proposal[];
  objections: string[];
  source: string;
  value: number;
  stage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Interaction {
  type: string;
  timestamp: Date;
  channel: string;
  direction: 'inbound' | 'outbound';
  content?: string;
  sentiment?: number;
  responseTime?: number;
}

export interface Proposal {
  id: string;
  sentAt: Date;
  value: number;
  opened: boolean;
  responded: boolean;
  outcome?: 'accepted' | 'rejected' | 'ignored' | 'countered';
}

class LeadAutopsySystem {
  private autopsies: Map<string, LeadAutopsy> = new Map();
  private deathPatterns: Map<DeathCause, number> = new Map();

  async performAutopsy(lead: LeadData): Promise<LeadAutopsy> {
    const timeline = this.buildTimeline(lead);
    const deathSignals = this.detectDeathSignals(lead);
    const diagnosis = this.diagnose(lead, timeline, deathSignals);
    const rootCause = this.identifyRootCause(lead, diagnosis, deathSignals);
    const revivability = this.assessRevivability(lead, diagnosis, rootCause);
    const recommendations = this.generateRecommendations(diagnosis, rootCause, revivability);

    const autopsy: LeadAutopsy = {
      leadId: lead.leadId,
      timestamp: new Date(),
      diagnosis,
      timeline,
      deathSignals,
      rootCause,
      revivability,
      recommendations,
    };

    this.autopsies.set(lead.leadId, autopsy);
    this.updatePatterns(diagnosis.primaryCause);

    return autopsy;
  }

  private buildTimeline(lead: LeadData): EngagementTimeline {
    const interactions = [...lead.interactions].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    if (interactions.length === 0) {
      return {
        firstContact: lead.createdAt,
        lastContact: lead.createdAt,
        peakEngagement: lead.createdAt,
        dropoffPoint: lead.createdAt,
        totalTouchpoints: 0,
        engagementPattern: 'never_engaged',
      };
    }

    const firstContact = interactions[0].timestamp;
    const lastContact = interactions[interactions.length - 1].timestamp;

    // Find peak engagement (most interactions in a week)
    let peakEngagement = firstContact;
    let maxWeeklyInteractions = 0;

    for (const interaction of interactions) {
      const weekStart = interaction.timestamp.getTime();
      const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
      const weeklyCount = interactions.filter(
        (i) => i.timestamp.getTime() >= weekStart && i.timestamp.getTime() < weekEnd
      ).length;

      if (weeklyCount > maxWeeklyInteractions) {
        maxWeeklyInteractions = weeklyCount;
        peakEngagement = interaction.timestamp;
      }
    }

    // Find dropoff point
    const dropoffPoint = this.findDropoffPoint(interactions);

    // Determine engagement pattern
    const engagementPattern = this.classifyEngagementPattern(lead, interactions, dropoffPoint);

    return {
      firstContact,
      lastContact,
      peakEngagement,
      dropoffPoint,
      totalTouchpoints: interactions.length,
      engagementPattern,
    };
  }

  private findDropoffPoint(interactions: Interaction[]): Date {
    if (interactions.length < 3) {
      return interactions[interactions.length - 1]?.timestamp || new Date();
    }

    // Look for significant gap increase
    let maxGapIncrease = 0;
    let dropoffIndex = interactions.length - 1;

    for (let i = 2; i < interactions.length; i++) {
      const prevGap = interactions[i - 1].timestamp.getTime() - interactions[i - 2].timestamp.getTime();
      const currGap = interactions[i].timestamp.getTime() - interactions[i - 1].timestamp.getTime();

      const gapIncrease = currGap / Math.max(prevGap, 1);
      if (gapIncrease > maxGapIncrease && gapIncrease > 2) {
        maxGapIncrease = gapIncrease;
        dropoffIndex = i - 1;
      }
    }

    return interactions[dropoffIndex].timestamp;
  }

  private classifyEngagementPattern(
    lead: LeadData,
    interactions: Interaction[],
    dropoffPoint: Date
  ): EngagementPattern {
    if (interactions.length === 0) return 'never_engaged';

    // Check for ghosting after proposal
    const proposalDates = lead.proposals.map((p) => p.sentAt.getTime());
    const lastInteractionAfterProposal = interactions.filter(
      (i) => proposalDates.some((pd) => i.timestamp.getTime() > pd)
    );
    if (lead.proposals.length > 0 && lastInteractionAfterProposal.length < 2) {
      return 'ghosted_after_proposal';
    }

    // Check for sudden drop
    const timeToDropoff = dropoffPoint.getTime() - interactions[0].timestamp.getTime();
    const totalTime = interactions[interactions.length - 1].timestamp.getTime() - interactions[0].timestamp.getTime();
    if (timeToDropoff / totalTime < 0.3) {
      return 'sudden_drop';
    }

    // Check for oscillating
    const sentimentChanges = interactions
      .filter((i) => i.sentiment !== undefined)
      .reduce((count, i, idx, arr) => {
        if (idx === 0) return 0;
        const prev = arr[idx - 1].sentiment!;
        const curr = i.sentiment!;
        return Math.abs(curr - prev) > 0.3 ? count + 1 : count;
      }, 0);

    if (sentimentChanges > interactions.length / 3) {
      return 'oscillating';
    }

    // Check for slow fade
    const avgGapFirst = this.avgGap(interactions.slice(0, Math.floor(interactions.length / 2)));
    const avgGapLast = this.avgGap(interactions.slice(Math.floor(interactions.length / 2)));
    if (avgGapLast > avgGapFirst * 1.5) {
      return 'slow_fade';
    }

    return 'steady_decline';
  }

  private avgGap(interactions: Interaction[]): number {
    if (interactions.length < 2) return 0;
    let totalGap = 0;
    for (let i = 1; i < interactions.length; i++) {
      totalGap += interactions[i].timestamp.getTime() - interactions[i - 1].timestamp.getTime();
    }
    return totalGap / (interactions.length - 1);
  }

  private detectDeathSignals(lead: LeadData): DeathSignal[] {
    const signals: DeathSignal[] = [];
    const interactions = lead.interactions;

    // Response delay increase
    for (let i = 2; i < interactions.length; i++) {
      if (interactions[i].direction === 'inbound') {
        const prevResponse = interactions.slice(0, i).reverse().find((int) => int.direction === 'inbound');
        if (prevResponse && interactions[i].responseTime && prevResponse.responseTime) {
          if (interactions[i].responseTime > prevResponse.responseTime * 2) {
            signals.push({
              type: 'response_delay_increase',
              timestamp: interactions[i].timestamp,
              description: `Response time increased from ${prevResponse.responseTime}h to ${interactions[i].responseTime}h`,
              severity: Math.min(1, (interactions[i].responseTime - prevResponse.responseTime) / 48),
              wasAddressed: false,
            });
          }
        }
      }
    }

    // Objection raised
    lead.objections.forEach((objection, idx) => {
      signals.push({
        type: 'objection_raised',
        timestamp: new Date(lead.createdAt.getTime() + idx * 24 * 60 * 60 * 1000),
        description: objection,
        severity: 0.7,
        wasAddressed: false,
      });
    });

    // Proposal ignored
    lead.proposals
      .filter((p) => !p.responded && p.opened)
      .forEach((proposal) => {
        signals.push({
          type: 'proposal_ignored',
          timestamp: proposal.sentAt,
          description: `Proposal ${proposal.id} opened but not responded`,
          severity: 0.8,
          wasAddressed: false,
        });
      });

    // Meeting cancelled (check for cancellation keywords in interactions)
    interactions
      .filter((i) => i.content?.toLowerCase().includes('cancel') || i.content?.toLowerCase().includes('reschedule'))
      .forEach((interaction) => {
        signals.push({
          type: 'meeting_cancelled',
          timestamp: interaction.timestamp,
          description: 'Meeting was cancelled or rescheduled',
          severity: 0.6,
          wasAddressed: false,
        });
      });

    return signals.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private diagnose(
    lead: LeadData,
    timeline: EngagementTimeline,
    signals: DeathSignal[]
  ): AutopsyDiagnosis {
    const causeScores: Map<DeathCause, number> = new Map();

    // Analyze objections for cause hints
    const objectionText = lead.objections.join(' ').toLowerCase();

    if (objectionText.includes('price') || objectionText.includes('budget') || objectionText.includes('cost')) {
      causeScores.set('price_objection', (causeScores.get('price_objection') || 0) + 0.8);
    }

    if (objectionText.includes('time') || objectionText.includes('busy') || objectionText.includes('later')) {
      causeScores.set('timing_mismatch', (causeScores.get('timing_mismatch') || 0) + 0.7);
    }

    if (objectionText.includes('trust') || objectionText.includes('sure') || objectionText.includes('guarantee')) {
      causeScores.set('trust_deficit', (causeScores.get('trust_deficit') || 0) + 0.7);
    }

    if (objectionText.includes('competitor') || objectionText.includes('other option') || objectionText.includes('alternative')) {
      causeScores.set('competitor_chosen', (causeScores.get('competitor_chosen') || 0) + 0.8);
    }

    // Analyze engagement pattern
    switch (timeline.engagementPattern) {
      case 'ghosted_after_proposal':
        causeScores.set('price_objection', (causeScores.get('price_objection') || 0) + 0.5);
        causeScores.set('wrong_offer', (causeScores.get('wrong_offer') || 0) + 0.4);
        break;
      case 'sudden_drop':
        causeScores.set('competitor_chosen', (causeScores.get('competitor_chosen') || 0) + 0.4);
        causeScores.set('internal_blockers', (causeScores.get('internal_blockers') || 0) + 0.4);
        break;
      case 'slow_fade':
        causeScores.set('timing_mismatch', (causeScores.get('timing_mismatch') || 0) + 0.5);
        causeScores.set('poor_follow_up', (causeScores.get('poor_follow_up') || 0) + 0.3);
        break;
      case 'never_engaged':
        causeScores.set('identity_misalignment', (causeScores.get('identity_misalignment') || 0) + 0.6);
        break;
    }

    // Analyze signals
    for (const signal of signals) {
      switch (signal.type) {
        case 'objection_raised':
          causeScores.set('price_objection', (causeScores.get('price_objection') || 0) + 0.2);
          break;
        case 'competitor_mentioned':
          causeScores.set('competitor_chosen', (causeScores.get('competitor_chosen') || 0) + 0.6);
          break;
        case 'budget_concern':
          causeScores.set('budget_freeze', (causeScores.get('budget_freeze') || 0) + 0.7);
          break;
      }
    }

    // Sort causes by score
    const sortedCauses = Array.from(causeScores.entries())
      .sort(([, a], [, b]) => b - a);

    const primaryCause = sortedCauses[0]?.[0] || 'unknown';
    const secondaryCauses = sortedCauses.slice(1, 3).map(([cause]) => cause);
    const confidence = sortedCauses[0]?.[1] || 0;

    return {
      primaryCause,
      secondaryCauses,
      confidence: Math.min(1, confidence),
      evidenceStrength: confidence > 0.7 ? 'strong' : confidence > 0.4 ? 'moderate' : 'weak',
      dataCompleteness: Math.min(1, lead.interactions.length / 10),
    };
  }

  private identifyRootCause(
    lead: LeadData,
    diagnosis: AutopsyDiagnosis,
    signals: DeathSignal[]
  ): RootCause {
    const categoryMap: Record<DeathCause, RootCauseCategory> = {
      price_objection: 'offer_market_fit',
      timing_mismatch: 'timing_context',
      trust_deficit: 'relationship_trust',
      identity_misalignment: 'offer_market_fit',
      fear_of_change: 'relationship_trust',
      competitor_chosen: 'competitive_pressure',
      internal_blockers: 'internal_dynamics',
      budget_freeze: 'external_factors',
      poor_follow_up: 'sales_process',
      wrong_offer: 'offer_market_fit',
      communication_breakdown: 'sales_process',
      ghosting_pattern: 'relationship_trust',
      decision_paralysis: 'internal_dynamics',
      stakeholder_conflict: 'internal_dynamics',
      unknown: 'external_factors',
    };

    const category = categoryMap[diagnosis.primaryCause];
    const evidence = signals.map((s) => s.description);

    return {
      category,
      specificCause: this.getSpecificCauseDescription(diagnosis.primaryCause, lead),
      evidence,
      counterfactual: this.generateCounterfactual(diagnosis.primaryCause),
      preventable: ['poor_follow_up', 'wrong_offer', 'communication_breakdown'].includes(diagnosis.primaryCause),
    };
  }

  private getSpecificCauseDescription(cause: DeathCause, lead: LeadData): string {
    const descriptions: Record<DeathCause, string> = {
      price_objection: `Lead perceived value gap at $${lead.value} price point`,
      timing_mismatch: 'Lead was not ready to buy due to timing constraints',
      trust_deficit: 'Insufficient trust or proof elements presented',
      identity_misalignment: 'Offer did not resonate with lead\'s self-image or needs',
      fear_of_change: 'Lead exhibited risk aversion to new solutions',
      competitor_chosen: 'Lead chose alternative solution',
      internal_blockers: 'Internal stakeholders blocked the decision',
      budget_freeze: 'External budget constraints prevented purchase',
      poor_follow_up: 'Inadequate follow-up cadence or messaging',
      wrong_offer: 'Presented offer did not match lead needs',
      communication_breakdown: 'Communication quality or frequency issues',
      ghosting_pattern: 'Lead has history of disengaging without explanation',
      decision_paralysis: 'Lead unable to make decision due to overwhelm',
      stakeholder_conflict: 'Conflicting priorities among decision makers',
      unknown: 'Insufficient data to determine cause',
    };

    return descriptions[cause];
  }

  private generateCounterfactual(cause: DeathCause): string {
    const counterfactuals: Record<DeathCause, string> = {
      price_objection: 'If value had been better established before price reveal, objection may have been prevented',
      timing_mismatch: 'If timing had been validated earlier, resources could have been redirected',
      trust_deficit: 'If more proof elements were introduced, trust threshold may have been met',
      identity_misalignment: 'If qualification had been deeper, misalignment could have been detected',
      fear_of_change: 'If risk reversal had been offered, fear may have been mitigated',
      competitor_chosen: 'If differentiation had been clearer, competitive comparison may have favored us',
      internal_blockers: 'If all stakeholders had been mapped, blockers could have been addressed',
      budget_freeze: 'If budget timeline had been confirmed, deal could have been staged',
      poor_follow_up: 'If follow-up had been more strategic, engagement may have been maintained',
      wrong_offer: 'If needs assessment had been thorough, correct offer would have been presented',
      communication_breakdown: 'If communication preferences had been established, connection would have been stronger',
      ghosting_pattern: 'If commitment mechanisms had been used, ghosting pattern could have been interrupted',
      decision_paralysis: 'If decision framework had been provided, paralysis could have been prevented',
      stakeholder_conflict: 'If stakeholder alignment had been facilitated, conflict could have been resolved',
      unknown: 'Insufficient data to generate counterfactual',
    };

    return counterfactuals[cause];
  }

  private assessRevivability(
    lead: LeadData,
    diagnosis: AutopsyDiagnosis,
    rootCause: RootCause
  ): RevivabilityAssessment {
    let score = 0.5;

    // Adjust based on cause
    const revivableCauses: DeathCause[] = ['timing_mismatch', 'budget_freeze', 'poor_follow_up', 'wrong_offer'];
    const hardCauses: DeathCause[] = ['competitor_chosen', 'identity_misalignment'];

    if (revivableCauses.includes(diagnosis.primaryCause)) {
      score += 0.2;
    }
    if (hardCauses.includes(diagnosis.primaryCause)) {
      score -= 0.2;
    }

    // Adjust based on engagement history
    const daysSinceLastContact = (Date.now() - lead.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastContact < 30) score += 0.1;
    if (daysSinceLastContact > 180) score -= 0.2;

    // Adjust based on lead value
    if (lead.value > 10000) score += 0.1;

    score = Math.max(0, Math.min(1, score));

    const classification: RevivabilityAssessment['classification'] =
      score > 0.7 ? 'high' : score > 0.5 ? 'medium' : score > 0.3 ? 'low' : 'dead';

    // Calculate optimal window
    const optimalWindow = score > 0.3 ? {
      start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    } : null;

    return {
      score,
      classification,
      optimalWindow,
      requiredApproach: this.getRequiredApproach(diagnosis.primaryCause),
      estimatedConversionProbability: score * 0.3,
      effortToRevive: score > 0.7 ? 'minimal' : score > 0.5 ? 'moderate' : score > 0.3 ? 'significant' : 'heroic',
    };
  }

  private getRequiredApproach(cause: DeathCause): string {
    const approaches: Record<DeathCause, string> = {
      price_objection: 'Value reframe with ROI focus and flexible payment options',
      timing_mismatch: 'Nurture sequence with periodic value touchpoints',
      trust_deficit: 'Case study and social proof heavy reengagement',
      identity_misalignment: 'Complete repositioning with different offer angle',
      fear_of_change: 'Risk reversal guarantee and implementation support emphasis',
      competitor_chosen: 'Differentiation-focused competitive displacement',
      internal_blockers: 'Stakeholder mapping and champion enablement',
      budget_freeze: 'Budget planning support and staged implementation',
      poor_follow_up: 'Fresh start with apology and value-first approach',
      wrong_offer: 'Needs reassessment and new offer presentation',
      communication_breakdown: 'Channel switch and communication style adjustment',
      ghosting_pattern: 'Pattern interrupt with high-value hook',
      decision_paralysis: 'Decision framework provision and deadline creation',
      stakeholder_conflict: 'Facilitated alignment session offer',
      unknown: 'Exploratory reengagement to gather intelligence',
    };

    return approaches[cause];
  }

  private generateRecommendations(
    diagnosis: AutopsyDiagnosis,
    rootCause: RootCause,
    revivability: RevivabilityAssessment
  ): string[] {
    const recommendations: string[] = [];

    if (revivability.classification === 'dead') {
      recommendations.push('Archive lead and apply learnings to similar profiles');
      recommendations.push('Add to long-term nurture list only');
      return recommendations;
    }

    recommendations.push(`Primary approach: ${revivability.requiredApproach}`);

    if (rootCause.preventable) {
      recommendations.push(`Process improvement: Address ${rootCause.category} in sales process`);
    }

    if (revivability.optimalWindow) {
      recommendations.push(
        `Optimal reentry window: ${revivability.optimalWindow.start.toDateString()} to ${revivability.optimalWindow.end.toDateString()}`
      );
    }

    if (diagnosis.confidence < 0.5) {
      recommendations.push('Gather more intelligence before reengagement');
    }

    return recommendations;
  }

  private updatePatterns(cause: DeathCause): void {
    this.deathPatterns.set(cause, (this.deathPatterns.get(cause) || 0) + 1);
  }

  getAutopsy(leadId: string): LeadAutopsy | undefined {
    return this.autopsies.get(leadId);
  }

  getDeathPatterns(): Map<DeathCause, number> {
    return new Map(this.deathPatterns);
  }

  getStats(): {
    totalAutopsies: number;
    avgRevivability: number;
    topDeathCauses: Array<{ cause: DeathCause; count: number }>;
    preventableRate: number;
  } {
    const autopsies = Array.from(this.autopsies.values());
    const preventable = autopsies.filter((a) => a.rootCause.preventable).length;

    return {
      totalAutopsies: autopsies.length,
      avgRevivability: autopsies.length > 0
        ? autopsies.reduce((sum, a) => sum + a.revivability.score, 0) / autopsies.length
        : 0,
      topDeathCauses: Array.from(this.deathPatterns.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cause, count]) => ({ cause, count })),
      preventableRate: autopsies.length > 0 ? preventable / autopsies.length : 0,
    };
  }
}

export const leadAutopsy = new LeadAutopsySystem();
export { LeadAutopsySystem };
