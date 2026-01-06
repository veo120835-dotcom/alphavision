// Data Loader - Fetches and prepares historical data for backtesting

import { OHLCV } from '../types';

export interface DataSource {
  name: string;
  fetchData(symbol: string, start: Date, end: Date, interval: string): Promise<OHLCV[]>;
}

class DataLoader {
  private sources: Map<string, DataSource> = new Map();
  private cache: Map<string, OHLCV[]> = new Map();

  registerSource(source: DataSource): void {
    this.sources.set(source.name, source);
  }

  private getCacheKey(symbol: string, start: Date, end: Date, interval: string): string {
    return `${symbol}-${start.toISOString()}-${end.toISOString()}-${interval}`;
  }

  async load(
    symbol: string,
    start: Date,
    end: Date,
    interval: string = '1d',
    sourceName?: string
  ): Promise<OHLCV[]> {
    const cacheKey = this.getCacheKey(symbol, start, end, interval);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const source = sourceName 
      ? this.sources.get(sourceName) 
      : this.sources.values().next().value;

    if (!source) {
      throw new Error('No data source available');
    }

    const data = await source.fetchData(symbol, start, end, interval);
    this.cache.set(cacheKey, data);
    return data;
  }

  async loadMultiple(
    symbols: string[],
    start: Date,
    end: Date,
    interval: string = '1d'
  ): Promise<Map<string, OHLCV[]>> {
    const results = new Map<string, OHLCV[]>();
    
    await Promise.all(
      symbols.map(async (symbol) => {
        const data = await this.load(symbol, start, end, interval);
        results.set(symbol, data);
      })
    );
    
    return results;
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Generate mock data for testing
  generateMockData(symbol: string, days: number): OHLCV[] {
    const data: OHLCV[] = [];
    let price = 100;
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * 2 * volatility;
      price = price * (1 + change);
      
      const high = price * (1 + Math.random() * 0.01);
      const low = price * (1 - Math.random() * 0.01);
      const open = low + Math.random() * (high - low);
      const close = low + Math.random() * (high - low);
      
      data.push({
        timestamp: date,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000000) + 100000
      });
    }

    return data;
  }
}

export const dataLoader = new DataLoader();
