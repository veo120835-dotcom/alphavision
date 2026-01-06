// Fills Engine - Generates realistic order fills

import { Order } from '../types';

interface Fill {
  quantity: number;
  price: number;
  commission: number;
}

interface FillConfig {
  commissionRate: number;
  minCommission: number;
  slippageBps: number;
  partialFillProbability: number;
}

class FillsEngine {
  private config: FillConfig = {
    commissionRate: 0.001,      // 0.1%
    minCommission: 1.00,        // $1 minimum
    slippageBps: 5,             // 5 basis points
    partialFillProbability: 0.1 // 10% chance of partial fill
  };

  configure(config: Partial<FillConfig>): void {
    this.config = { ...this.config, ...config };
  }

  generateFill(order: Order, marketPrice: number): Fill {
    // Determine fill quantity (simulate partial fills)
    const quantity = this.determineFillQuantity(order);
    
    // Calculate execution price with slippage
    const price = this.calculateExecutionPrice(order, marketPrice);
    
    // Calculate commission
    const commission = this.calculateCommission(quantity, price);
    
    return { quantity, price, commission };
  }

  generatePartialFills(order: Order, marketPrice: number): Fill[] {
    const fills: Fill[] = [];
    let remainingQuantity = order.quantity;
    
    while (remainingQuantity > 0) {
      const fillQuantity = Math.min(
        remainingQuantity,
        Math.ceil(order.quantity * (0.3 + Math.random() * 0.7))
      );
      
      const price = this.calculateExecutionPrice(order, marketPrice);
      const commission = this.calculateCommission(fillQuantity, price);
      
      fills.push({ quantity: fillQuantity, price, commission });
      remainingQuantity -= fillQuantity;
    }
    
    return fills;
  }

  private determineFillQuantity(order: Order): number {
    // Simulate partial fills occasionally
    if (Math.random() < this.config.partialFillProbability) {
      return Math.ceil(order.quantity * (0.5 + Math.random() * 0.5));
    }
    return order.quantity;
  }

  private calculateExecutionPrice(order: Order, marketPrice: number): number {
    // Add slippage
    const slippage = this.config.slippageBps / 10000;
    const randomSlippage = slippage * (0.5 + Math.random());
    
    if (order.side === 'buy') {
      return marketPrice * (1 + randomSlippage);
    } else {
      return marketPrice * (1 - randomSlippage);
    }
  }

  private calculateCommission(quantity: number, price: number): number {
    const notional = quantity * price;
    const commission = notional * this.config.commissionRate;
    return Math.max(commission, this.config.minCommission);
  }
}

export const fillsEngine = new FillsEngine();
