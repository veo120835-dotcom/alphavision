import { Opportunity, OpportunityDigest, Signal, Asset } from '../types';

export interface DigestConfig {
  maxOpportunities: number;
  minScore: number;
  includeRisks: boolean;
  timeHorizonFilter?: string[];
  assetClassFilter?: string[];
}

export interface DigestSection {
  title: string;
  content: string;
  opportunities: Opportunity[];
}

export class OpportunityDigestGenerator {
  private defaultConfig: DigestConfig = {
    maxOpportunities: 10,
    minScore: 50,
    includeRisks: true,
  };

  generateDigest(
    opportunities: Opportunity[],
    config: Partial<DigestConfig> = {}
  ): OpportunityDigest {
    const cfg = { ...this.defaultConfig, ...config };
    
    // Filter opportunities
    let filtered = opportunities.filter(o => o.opportunityScore >= cfg.minScore);
    
    if (cfg.timeHorizonFilter && cfg.timeHorizonFilter.length > 0) {
      filtered = filtered.filter(o => cfg.timeHorizonFilter!.includes(o.timeHorizon));
    }

    if (cfg.assetClassFilter && cfg.assetClassFilter.length > 0) {
      filtered = filtered.filter(o => cfg.assetClassFilter!.includes(o.asset.assetClass));
    }

    // Sort by score
    filtered.sort((a, b) => b.opportunityScore - a.opportunityScore);

    // Get top picks
    const topPicks = filtered.slice(0, 3);
    const allOpportunities = filtered.slice(0, cfg.maxOpportunities);

    // Generate market context
    const marketContext = this.generateMarketContext(allOpportunities);

    // Generate alerts
    const alerts = this.generateAlerts(allOpportunities);

    return {
      id: `digest_${Date.now()}`,
      generatedAt: new Date(),
      opportunities: allOpportunities,
      marketContext,
      topPicks,
      alerts,
    };
  }

  private generateMarketContext(opportunities: Opportunity[]): string {
    if (opportunities.length === 0) {
      return 'No significant opportunities identified at this time.';
    }

    const longOpps = opportunities.filter(
      o => o.signals.filter(s => s.direction === 'long').length > 
           o.signals.filter(s => s.direction === 'short').length
    );
    const shortOpps = opportunities.filter(
      o => o.signals.filter(s => s.direction === 'short').length > 
           o.signals.filter(s => s.direction === 'long').length
    );

    const avgScore = opportunities.reduce((sum, o) => sum + o.opportunityScore, 0) / opportunities.length;
    const avgRisk = opportunities.reduce((sum, o) => sum + o.riskScore, 0) / opportunities.length;

    const parts: string[] = [];

    parts.push(`Found ${opportunities.length} opportunities with average score of ${avgScore.toFixed(0)}.`);
    
    if (longOpps.length > shortOpps.length * 2) {
      parts.push('Market bias is strongly bullish.');
    } else if (shortOpps.length > longOpps.length * 2) {
      parts.push('Market bias is strongly bearish.');
    } else if (longOpps.length > shortOpps.length) {
      parts.push('Slight bullish bias in opportunities.');
    } else if (shortOpps.length > longOpps.length) {
      parts.push('Slight bearish bias in opportunities.');
    } else {
      parts.push('Mixed market signals.');
    }

    if (avgRisk > 60) {
      parts.push('Risk levels are elevated - consider reduced position sizes.');
    } else if (avgRisk < 30) {
      parts.push('Risk levels are low - favorable conditions for positioning.');
    }

    return parts.join(' ');
  }

  private generateAlerts(opportunities: Opportunity[]): string[] {
    const alerts: string[] = [];

    // High-score opportunities
    const highScoreOpps = opportunities.filter(o => o.opportunityScore >= 75);
    if (highScoreOpps.length > 0) {
      alerts.push(`🎯 ${highScoreOpps.length} high-conviction opportunity(ies): ${highScoreOpps.map(o => o.symbol).join(', ')}`);
    }

    // High-risk opportunities
    const highRiskOpps = opportunities.filter(o => o.riskScore >= 70);
    if (highRiskOpps.length > 0) {
      alerts.push(`⚠️ ${highRiskOpps.length} opportunity(ies) with elevated risk: ${highRiskOpps.map(o => o.symbol).join(', ')}`);
    }

    // Time-sensitive opportunities
    const shortTermOpps = opportunities.filter(o => o.timeHorizon === 'Intraday' || o.timeHorizon === '1-3 Days');
    if (shortTermOpps.length > 0) {
      alerts.push(`⏰ ${shortTermOpps.length} time-sensitive opportunity(ies): ${shortTermOpps.map(o => o.symbol).join(', ')}`);
    }

    return alerts;
  }

  generateSections(digest: OpportunityDigest): DigestSection[] {
    const sections: DigestSection[] = [];

    // Executive Summary
    sections.push({
      title: 'Executive Summary',
      content: digest.marketContext,
      opportunities: [],
    });

    // Top Picks
    if (digest.topPicks.length > 0) {
      sections.push({
        title: 'Top Picks',
        content: `Our highest conviction opportunities based on combined technical and fundamental analysis.`,
        opportunities: digest.topPicks,
      });
    }

    // By Asset Class
    const byAssetClass = this.groupByAssetClass(digest.opportunities);
    for (const [assetClass, opps] of Object.entries(byAssetClass)) {
      if (opps.length > 0) {
        sections.push({
          title: `${assetClass.charAt(0).toUpperCase() + assetClass.slice(1)} Opportunities`,
          content: `${opps.length} opportunities in ${assetClass}`,
          opportunities: opps,
        });
      }
    }

    // By Time Horizon
    const byTimeHorizon = this.groupByTimeHorizon(digest.opportunities);
    for (const [horizon, opps] of Object.entries(byTimeHorizon)) {
      if (opps.length > 0 && opps.length !== digest.opportunities.length) {
        sections.push({
          title: `${horizon} Opportunities`,
          content: `Opportunities with ${horizon.toLowerCase()} time horizon`,
          opportunities: opps,
        });
      }
    }

    return sections;
  }

  private groupByAssetClass(opportunities: Opportunity[]): Record<string, Opportunity[]> {
    const groups: Record<string, Opportunity[]> = {};
    for (const opp of opportunities) {
      const assetClass = opp.asset.assetClass;
      if (!groups[assetClass]) groups[assetClass] = [];
      groups[assetClass].push(opp);
    }
    return groups;
  }

  private groupByTimeHorizon(opportunities: Opportunity[]): Record<string, Opportunity[]> {
    const groups: Record<string, Opportunity[]> = {};
    for (const opp of opportunities) {
      const horizon = opp.timeHorizon;
      if (!groups[horizon]) groups[horizon] = [];
      groups[horizon].push(opp);
    }
    return groups;
  }

  formatDigestAsText(digest: OpportunityDigest): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('OPPORTUNITY DIGEST');
    lines.push(`Generated: ${digest.generatedAt.toLocaleString()}`);
    lines.push('='.repeat(60));
    lines.push('');

    // Alerts
    if (digest.alerts.length > 0) {
      lines.push('ALERTS:');
      for (const alert of digest.alerts) {
        lines.push(`  ${alert}`);
      }
      lines.push('');
    }

    // Market Context
    lines.push('MARKET CONTEXT:');
    lines.push(digest.marketContext);
    lines.push('');

    // Top Picks
    if (digest.topPicks.length > 0) {
      lines.push('TOP PICKS:');
      for (const opp of digest.topPicks) {
        lines.push(`  ${opp.symbol} - Score: ${opp.opportunityScore.toFixed(0)} | ${opp.thesis.summary}`);
      }
      lines.push('');
    }

    // All Opportunities
    lines.push('ALL OPPORTUNITIES:');
    for (const opp of digest.opportunities) {
      const direction = opp.signals.filter(s => s.direction === 'long').length >= 
                       opp.signals.filter(s => s.direction === 'short').length
        ? 'LONG' : 'SHORT';
      lines.push(`  ${opp.symbol} | ${direction} | Score: ${opp.opportunityScore.toFixed(0)} | Risk: ${opp.riskScore.toFixed(0)} | ${opp.timeHorizon}`);
    }

    lines.push('');
    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  formatDigestAsHTML(digest: OpportunityDigest): string {
    const sections = this.generateSections(digest);
    
    let html = `
      <div class="opportunity-digest">
        <header>
          <h1>Opportunity Digest</h1>
          <p class="timestamp">${digest.generatedAt.toLocaleString()}</p>
        </header>
    `;

    if (digest.alerts.length > 0) {
      html += `<div class="alerts">`;
      for (const alert of digest.alerts) {
        html += `<div class="alert">${alert}</div>`;
      }
      html += `</div>`;
    }

    for (const section of sections) {
      html += `
        <section>
          <h2>${section.title}</h2>
          <p>${section.content}</p>
      `;

      if (section.opportunities.length > 0) {
        html += `<ul class="opportunities">`;
        for (const opp of section.opportunities) {
          html += `
            <li>
              <strong>${opp.symbol}</strong>
              <span class="score">Score: ${opp.opportunityScore.toFixed(0)}</span>
              <span class="risk">Risk: ${opp.riskScore.toFixed(0)}</span>
              <p>${opp.thesis.summary}</p>
            </li>
          `;
        }
        html += `</ul>`;
      }

      html += `</section>`;
    }

    html += `</div>`;
    return html;
  }
}

export const opportunityDigestGenerator = new OpportunityDigestGenerator();
