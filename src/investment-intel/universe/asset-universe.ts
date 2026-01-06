import { Asset, AssetClass, Exchange, WatchlistItem, PriceAlert } from '../types';

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  items: WatchlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export class AssetUniverse {
  private watchlists: Map<string, Watchlist> = new Map();
  private masterUniverse: Map<string, Asset> = new Map();

  createWatchlist(name: string, description?: string): Watchlist {
    const watchlist: Watchlist = {
      id: `wl_${Date.now()}`,
      name,
      description,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.watchlists.set(watchlist.id, watchlist);
    return watchlist;
  }

  addToWatchlist(watchlistId: string, asset: Asset, notes?: string): WatchlistItem | null {
    const watchlist = this.watchlists.get(watchlistId);
    if (!watchlist) return null;

    const item: WatchlistItem = {
      ...asset,
      addedAt: new Date(),
      notes,
      alerts: [],
      tags: [],
    };

    watchlist.items.push(item);
    watchlist.updatedAt = new Date();
    return item;
  }

  removeFromWatchlist(watchlistId: string, symbol: string): boolean {
    const watchlist = this.watchlists.get(watchlistId);
    if (!watchlist) return false;

    const index = watchlist.items.findIndex(item => item.symbol === symbol);
    if (index === -1) return false;

    watchlist.items.splice(index, 1);
    watchlist.updatedAt = new Date();
    return true;
  }

  addPriceAlert(watchlistId: string, symbol: string, alert: Omit<PriceAlert, 'id' | 'triggered'>): PriceAlert | null {
    const watchlist = this.watchlists.get(watchlistId);
    if (!watchlist) return null;

    const item = watchlist.items.find(i => i.symbol === symbol);
    if (!item) return null;

    const priceAlert: PriceAlert = {
      ...alert,
      id: `alert_${Date.now()}`,
      triggered: false,
    };

    item.alerts = item.alerts || [];
    item.alerts.push(priceAlert);
    return priceAlert;
  }

  getWatchlist(watchlistId: string): Watchlist | undefined {
    return this.watchlists.get(watchlistId);
  }

  getAllWatchlists(): Watchlist[] {
    return Array.from(this.watchlists.values());
  }

  addToUniverse(assets: Asset[]): void {
    for (const asset of assets) {
      this.masterUniverse.set(asset.symbol, asset);
    }
  }

  getAsset(symbol: string): Asset | undefined {
    return this.masterUniverse.get(symbol);
  }

  searchAssets(query: string): Asset[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.masterUniverse.values()).filter(
      asset =>
        asset.symbol.toLowerCase().includes(lowerQuery) ||
        asset.name.toLowerCase().includes(lowerQuery)
    );
  }

  filterByClass(assetClass: AssetClass): Asset[] {
    return Array.from(this.masterUniverse.values()).filter(
      asset => asset.assetClass === assetClass
    );
  }

  filterByExchange(exchange: Exchange): Asset[] {
    return Array.from(this.masterUniverse.values()).filter(
      asset => asset.exchange === exchange
    );
  }

  filterBySector(sector: string): Asset[] {
    return Array.from(this.masterUniverse.values()).filter(
      asset => asset.sector === sector
    );
  }

  getTopByMarketCap(limit: number): Asset[] {
    return Array.from(this.masterUniverse.values())
      .filter(asset => asset.marketCap !== undefined)
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .slice(0, limit);
  }

  getTopByVolume(limit: number): Asset[] {
    return Array.from(this.masterUniverse.values())
      .filter(asset => asset.avgVolume !== undefined)
      .sort((a, b) => (b.avgVolume || 0) - (a.avgVolume || 0))
      .slice(0, limit);
  }
}

export const assetUniverse = new AssetUniverse();
