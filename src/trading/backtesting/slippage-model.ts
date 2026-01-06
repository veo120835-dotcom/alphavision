// Slippage Model - Estimates execution slippage

interface SlippageParams {
  baseSlippage: number;
  volumeImpactFactor: number;
  spreadEstimate: number;
}

class SlippageModel {
  private params: SlippageParams = {
    baseSlippage: 0.0005,      // 0.05% base slippage
    volumeImpactFactor: 0.1,   // Impact per % of volume
    spreadEstimate: 0.001      // 0.1% spread estimate
  };

  configure(params: Partial<SlippageParams>): void {
    this.params = { ...this.params, ...params };
  }

  calculate(price: number, quantity: number, volume: number): number {
    // Base slippage
    let slippage = this.params.baseSlippage;
    
    // Add spread cost
    slippage += this.params.spreadEstimate / 2;
    
    // Volume impact - larger orders relative to volume have more impact
    if (volume > 0) {
      const volumePercent = (quantity * price) / (volume * price);
      slippage += volumePercent * this.params.volumeImpactFactor;
    }
    
    // Cap slippage at reasonable maximum
    return Math.min(slippage, 0.05); // Max 5% slippage
  }

  estimateCost(price: number, quantity: number, volume: number): number {
    const slippage = this.calculate(price, quantity, volume);
    return price * quantity * slippage;
  }

  // More sophisticated model based on market microstructure
  calculateAdvanced(
    price: number,
    quantity: number,
    volume: number,
    volatility: number,
    bidAskSpread?: number
  ): number {
    // Kyle's lambda-style permanent impact
    const sigma = volatility || 0.02;
    const permanentImpact = sigma * Math.sqrt(quantity / (volume || 1));
    
    // Temporary impact
    const temporaryImpact = this.params.baseSlippage * Math.pow(quantity / (volume || 1), 0.5);
    
    // Spread cost
    const spreadCost = (bidAskSpread || this.params.spreadEstimate) / 2;
    
    return permanentImpact + temporaryImpact + spreadCost;
  }
}

export const slippageModel = new SlippageModel();
