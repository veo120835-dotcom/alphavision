// Stop Loss Policy - Manages stop loss rules for positions

interface StopLossConfig {
  defaultStopPercent: number;
  trailingStopEnabled: boolean;
  trailingStopPercent: number;
  timeBasedStopEnabled: boolean;
  maxHoldingDays: number;
}

interface StopLevel {
  symbol: string;
  entryPrice: number;
  currentPrice: number;
  stopPrice: number;
  stopType: 'fixed' | 'trailing' | 'time';
  highWaterMark: number;
  entryTime: Date;
}

class StopLossPolicy {
  private config: StopLossConfig = {
    defaultStopPercent: 0.05,
    trailingStopEnabled: true,
    trailingStopPercent: 0.03,
    timeBasedStopEnabled: false,
    maxHoldingDays: 30
  };

  private stops: Map<string, StopLevel> = new Map();

  configure(config: Partial<StopLossConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setStop(symbol: string, entryPrice: number, customStopPercent?: number): StopLevel {
    const stopPercent = customStopPercent || this.config.defaultStopPercent;
    const stopPrice = entryPrice * (1 - stopPercent);
    
    const stop: StopLevel = {
      symbol,
      entryPrice,
      currentPrice: entryPrice,
      stopPrice,
      stopType: 'fixed',
      highWaterMark: entryPrice,
      entryTime: new Date()
    };
    
    this.stops.set(symbol, stop);
    return stop;
  }

  updatePrice(symbol: string, currentPrice: number): { triggered: boolean; stop: StopLevel | null } {
    const stop = this.stops.get(symbol);
    if (!stop) return { triggered: false, stop: null };

    stop.currentPrice = currentPrice;

    // Update trailing stop if enabled
    if (this.config.trailingStopEnabled && currentPrice > stop.highWaterMark) {
      stop.highWaterMark = currentPrice;
      const trailingStop = currentPrice * (1 - this.config.trailingStopPercent);
      if (trailingStop > stop.stopPrice) {
        stop.stopPrice = trailingStop;
        stop.stopType = 'trailing';
      }
    }

    // Check if stop triggered
    if (currentPrice <= stop.stopPrice) {
      return { triggered: true, stop };
    }

    // Check time-based stop
    if (this.config.timeBasedStopEnabled) {
      const holdingDays = (Date.now() - stop.entryTime.getTime()) / (1000 * 60 * 60 * 24);
      if (holdingDays >= this.config.maxHoldingDays) {
        stop.stopType = 'time';
        return { triggered: true, stop };
      }
    }

    return { triggered: false, stop };
  }

  removeStop(symbol: string): void {
    this.stops.delete(symbol);
  }

  getStop(symbol: string): StopLevel | undefined {
    return this.stops.get(symbol);
  }

  getAllStops(): StopLevel[] {
    return Array.from(this.stops.values());
  }

  checkAll(prices: Map<string, number>): StopLevel[] {
    const triggered: StopLevel[] = [];
    
    prices.forEach((price, symbol) => {
      const result = this.updatePrice(symbol, price);
      if (result.triggered && result.stop) {
        triggered.push(result.stop);
      }
    });
    
    return triggered;
  }
}

export const stopLossPolicy = new StopLossPolicy();
