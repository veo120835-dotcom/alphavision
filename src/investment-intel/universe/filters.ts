import { Asset, FilterCriteria, AssetClass, Exchange } from '../types';

export interface LiquidityFilter {
  minDailyVolume?: number;
  minDollarVolume?: number;
  maxSpreadPercent?: number;
}

export interface MarketCapFilter {
  min?: number;
  max?: number;
  categories?: ('mega' | 'large' | 'mid' | 'small' | 'micro' | 'nano')[];
}

export interface ExchangeFilter {
  include?: Exchange[];
  exclude?: Exchange[];
}

export class UniverseFilter {
  private marketCapRanges: Record<string, { min: number; max: number }> = {
    mega: { min: 200_000_000_000, max: Infinity },
    large: { min: 10_000_000_000, max: 200_000_000_000 },
    mid: { min: 2_000_000_000, max: 10_000_000_000 },
    small: { min: 300_000_000, max: 2_000_000_000 },
    micro: { min: 50_000_000, max: 300_000_000 },
    nano: { min: 0, max: 50_000_000 },
  };

  filterByLiquidity(assets: Asset[], filter: LiquidityFilter): Asset[] {
    return assets.filter(asset => {
      if (filter.minDailyVolume && (asset.avgVolume || 0) < filter.minDailyVolume) {
        return false;
      }

      if (filter.minDollarVolume) {
        const dollarVolume = (asset.avgVolume || 0) * (asset.price || 0);
        if (dollarVolume < filter.minDollarVolume) return false;
      }

      return true;
    });
  }

  filterByMarketCap(assets: Asset[], filter: MarketCapFilter): Asset[] {
    return assets.filter(asset => {
      const cap = asset.marketCap || 0;

      if (filter.min !== undefined && cap < filter.min) return false;
      if (filter.max !== undefined && cap > filter.max) return false;

      if (filter.categories && filter.categories.length > 0) {
        const inCategory = filter.categories.some(category => {
          const range = this.marketCapRanges[category];
          return cap >= range.min && cap < range.max;
        });
        if (!inCategory) return false;
      }

      return true;
    });
  }

  filterByExchange(assets: Asset[], filter: ExchangeFilter): Asset[] {
    return assets.filter(asset => {
      if (filter.include && !filter.include.includes(asset.exchange)) {
        return false;
      }
      if (filter.exclude && filter.exclude.includes(asset.exchange)) {
        return false;
      }
      return true;
    });
  }

  filterByAssetClass(assets: Asset[], classes: AssetClass[]): Asset[] {
    if (classes.length === 0) return assets;
    return assets.filter(asset => classes.includes(asset.assetClass));
  }

  filterByPrice(assets: Asset[], min?: number, max?: number): Asset[] {
    return assets.filter(asset => {
      const price = asset.price || 0;
      if (min !== undefined && price < min) return false;
      if (max !== undefined && price > max) return false;
      return true;
    });
  }

  filterBySector(assets: Asset[], sectors: string[]): Asset[] {
    if (sectors.length === 0) return assets;
    return assets.filter(asset => asset.sector && sectors.includes(asset.sector));
  }

  applyFilters(assets: Asset[], criteria: FilterCriteria): Asset[] {
    let filtered = [...assets];

    if (criteria.assetClasses) {
      filtered = this.filterByAssetClass(filtered, criteria.assetClasses);
    }

    if (criteria.exchanges) {
      filtered = this.filterByExchange(filtered, { include: criteria.exchanges });
    }

    if (criteria.sectors) {
      filtered = this.filterBySector(filtered, criteria.sectors);
    }

    if (criteria.minMarketCap || criteria.maxMarketCap) {
      filtered = this.filterByMarketCap(filtered, {
        min: criteria.minMarketCap,
        max: criteria.maxMarketCap,
      });
    }

    if (criteria.minVolume) {
      filtered = this.filterByLiquidity(filtered, { minDailyVolume: criteria.minVolume });
    }

    if (criteria.minPrice || criteria.maxPrice) {
      filtered = this.filterByPrice(filtered, criteria.minPrice, criteria.maxPrice);
    }

    return filtered;
  }

  getMarketCapCategory(marketCap: number): string {
    for (const [category, range] of Object.entries(this.marketCapRanges)) {
      if (marketCap >= range.min && marketCap < range.max) {
        return category;
      }
    }
    return 'unknown';
  }

  createScreener(
    baseAssets: Asset[],
    filters: {
      liquidity?: LiquidityFilter;
      marketCap?: MarketCapFilter;
      exchange?: ExchangeFilter;
      assetClasses?: AssetClass[];
      sectors?: string[];
      priceRange?: { min?: number; max?: number };
    }
  ): Asset[] {
    let result = [...baseAssets];

    if (filters.liquidity) {
      result = this.filterByLiquidity(result, filters.liquidity);
    }

    if (filters.marketCap) {
      result = this.filterByMarketCap(result, filters.marketCap);
    }

    if (filters.exchange) {
      result = this.filterByExchange(result, filters.exchange);
    }

    if (filters.assetClasses) {
      result = this.filterByAssetClass(result, filters.assetClasses);
    }

    if (filters.sectors) {
      result = this.filterBySector(result, filters.sectors);
    }

    if (filters.priceRange) {
      result = this.filterByPrice(result, filters.priceRange.min, filters.priceRange.max);
    }

    return result;
  }
}

export const universeFilter = new UniverseFilter();
