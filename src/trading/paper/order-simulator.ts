// Order Simulator - Determines when orders should fill

import { Order } from '../types';

class OrderSimulator {
  shouldFill(order: Order, currentPrice: number): boolean {
    switch (order.type) {
      case 'market':
        return true;
        
      case 'limit':
        if (order.side === 'buy') {
          return order.price !== undefined && currentPrice <= order.price;
        } else {
          return order.price !== undefined && currentPrice >= order.price;
        }
        
      case 'stop':
        if (order.side === 'buy') {
          return order.stopPrice !== undefined && currentPrice >= order.stopPrice;
        } else {
          return order.stopPrice !== undefined && currentPrice <= order.stopPrice;
        }
        
      case 'stop_limit':
        if (order.side === 'buy') {
          const stopTriggered = order.stopPrice !== undefined && currentPrice >= order.stopPrice;
          const limitMet = order.price !== undefined && currentPrice <= order.price;
          return stopTriggered && limitMet;
        } else {
          const stopTriggered = order.stopPrice !== undefined && currentPrice <= order.stopPrice;
          const limitMet = order.price !== undefined && currentPrice >= order.price;
          return stopTriggered && limitMet;
        }
        
      default:
        return false;
    }
  }

  estimateFillPrice(order: Order, currentPrice: number): number {
    // Add realistic slippage
    const slippageBps = this.estimateSlippage(order);
    const slippage = slippageBps / 10000;
    
    if (order.side === 'buy') {
      return currentPrice * (1 + slippage);
    } else {
      return currentPrice * (1 - slippage);
    }
  }

  private estimateSlippage(order: Order): number {
    // Base slippage in basis points
    let slippage = 5;
    
    // Market orders have more slippage
    if (order.type === 'market') {
      slippage += 5;
    }
    
    // Larger orders have more slippage
    if (order.quantity > 1000) {
      slippage += Math.floor(order.quantity / 1000) * 2;
    }
    
    return Math.min(slippage, 50); // Cap at 50 bps
  }
}

export const orderSimulator = new OrderSimulator();
