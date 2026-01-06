import { ThesisRecord, Opportunity, InvestmentThesis } from '../types';

export interface ThesisPerformance {
  totalTheses: number;
  closedTheses: number;
  winRate: number;
  avgReturn: number;
  avgHoldingPeriod: number;
  bestPerforming: ThesisRecord | null;
  worstPerforming: ThesisRecord | null;
}

export interface ThesisPattern {
  pattern: string;
  occurrences: number;
  winRate: number;
  avgReturn: number;
}

export class ThesisHistoryStore {
  private records: ThesisRecord[] = [];

  recordThesis(opportunity: Opportunity): ThesisRecord {
    const record: ThesisRecord = {
      id: `thesis_${Date.now()}`,
      opportunity,
      outcome: 'pending',
      lessons: [],
      createdAt: new Date(),
    };
    this.records.push(record);
    return record;
  }

  closeThesis(
    thesisId: string,
    outcome: 'win' | 'loss' | 'partial',
    actualReturn: number,
    lessons: string[]
  ): ThesisRecord | null {
    const record = this.records.find(r => r.id === thesisId);
    if (!record) return null;

    record.outcome = outcome;
    record.actualReturn = actualReturn;
    record.closedAt = new Date();
    record.holdingPeriod = (record.closedAt.getTime() - record.createdAt.getTime()) / (24 * 60 * 60 * 1000);
    record.lessons = lessons;

    return record;
  }

  getPerformance(symbol?: string): ThesisPerformance {
    let records = this.records;
    if (symbol) {
      records = records.filter(r => r.opportunity.symbol === symbol);
    }

    const closedRecords = records.filter(r => r.outcome !== 'pending');
    const winningRecords = closedRecords.filter(r => r.outcome === 'win');

    const avgReturn = closedRecords.length > 0
      ? closedRecords.reduce((sum, r) => sum + (r.actualReturn || 0), 0) / closedRecords.length
      : 0;

    const avgHoldingPeriod = closedRecords.length > 0
      ? closedRecords.reduce((sum, r) => sum + (r.holdingPeriod || 0), 0) / closedRecords.length
      : 0;

    const sortedByReturn = [...closedRecords].sort(
      (a, b) => (b.actualReturn || 0) - (a.actualReturn || 0)
    );

    return {
      totalTheses: records.length,
      closedTheses: closedRecords.length,
      winRate: closedRecords.length > 0 ? winningRecords.length / closedRecords.length : 0,
      avgReturn,
      avgHoldingPeriod,
      bestPerforming: sortedByReturn[0] || null,
      worstPerforming: sortedByReturn[sortedByReturn.length - 1] || null,
    };
  }

  getPendingTheses(): ThesisRecord[] {
    return this.records.filter(r => r.outcome === 'pending');
  }

  getThesisBySymbol(symbol: string): ThesisRecord[] {
    return this.records.filter(r => r.opportunity.symbol === symbol);
  }

  getLessonsLearned(): { lesson: string; count: number }[] {
    const lessonCounts = new Map<string, number>();

    for (const record of this.records) {
      for (const lesson of record.lessons) {
        const current = lessonCounts.get(lesson) || 0;
        lessonCounts.set(lesson, current + 1);
      }
    }

    return Array.from(lessonCounts.entries())
      .map(([lesson, count]) => ({ lesson, count }))
      .sort((a, b) => b.count - a.count);
  }

  identifyPatterns(): ThesisPattern[] {
    const patterns: Map<string, { wins: number; total: number; returns: number[] }> = new Map();

    for (const record of this.records.filter(r => r.outcome !== 'pending')) {
      // Pattern by signal type combination
      const signalTypes = [...new Set(record.opportunity.signals.map(s => s.type))].sort().join('+');
      const patternKey = `signals:${signalTypes}`;

      if (!patterns.has(patternKey)) {
        patterns.set(patternKey, { wins: 0, total: 0, returns: [] });
      }
      const pattern = patterns.get(patternKey)!;
      pattern.total++;
      if (record.outcome === 'win') pattern.wins++;
      pattern.returns.push(record.actualReturn || 0);

      // Pattern by time horizon
      const horizonKey = `horizon:${record.opportunity.timeHorizon}`;
      if (!patterns.has(horizonKey)) {
        patterns.set(horizonKey, { wins: 0, total: 0, returns: [] });
      }
      const horizonPattern = patterns.get(horizonKey)!;
      horizonPattern.total++;
      if (record.outcome === 'win') horizonPattern.wins++;
      horizonPattern.returns.push(record.actualReturn || 0);

      // Pattern by asset class
      const assetKey = `asset:${record.opportunity.asset.assetClass}`;
      if (!patterns.has(assetKey)) {
        patterns.set(assetKey, { wins: 0, total: 0, returns: [] });
      }
      const assetPattern = patterns.get(assetKey)!;
      assetPattern.total++;
      if (record.outcome === 'win') assetPattern.wins++;
      assetPattern.returns.push(record.actualReturn || 0);
    }

    return Array.from(patterns.entries())
      .filter(([_, data]) => data.total >= 3)
      .map(([pattern, data]) => ({
        pattern,
        occurrences: data.total,
        winRate: data.wins / data.total,
        avgReturn: data.returns.reduce((a, b) => a + b, 0) / data.returns.length,
      }))
      .sort((a, b) => b.winRate - a.winRate);
  }

  getRecentHistory(days: number = 30): ThesisRecord[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.records
      .filter(r => r.createdAt >= cutoff)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  exportRecords(): ThesisRecord[] {
    return [...this.records];
  }

  importRecords(records: ThesisRecord[]): void {
    this.records = records;
  }
}

export const thesisHistoryStore = new ThesisHistoryStore();
