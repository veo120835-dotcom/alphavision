// Order Router - Routes orders through risk checks before execution

import { Order } from '../types';
import { BrokerAdapter } from './broker-adapter';
import { positionLimits } from '../risk/position-limits';
import { exposureLimits } from '../risk/exposure-limits';
import { killSwitch } from '../risk/kill-switch';
import { idempotencyGuard } from './idempotency';

export interface OrderValidation {
  valid: boolean;
  rejectionReason?: string;
}

export interface RoutedOrder extends Order {
  routedAt: Date;
  validationPassed: boolean;
  broker: string;
}

class OrderRouter {
  private broker: BrokerAdapter | null = null;

  setBroker(broker: BrokerAdapter): void {
    this.broker = broker;
  }

  async route(
    order: Omit<Order, 'id' | 'status' | 'filledQuantity' | 'createdAt' | 'updatedAt'>,
    idempotencyKey: string
  ): Promise<RoutedOrder | null> {
    // Check kill switch
    if (killSwitch.isActive()) {
      console.error('[ORDER ROUTER] Kill switch active - rejecting order');
      return null;
    }

    // Check idempotency
    if (!idempotencyGuard.checkAndRecord(idempotencyKey, order)) {
      console.warn('[ORDER ROUTER] Duplicate order detected');
      return null;
    }

    // Validate order
    const validation = await this.validate(order);
    if (!validation.valid) {
      console.warn(`[ORDER ROUTER] Order rejected: ${validation.rejectionReason}`);
      return null;
    }

    // Route to broker
    if (!this.broker) {
      console.error('[ORDER ROUTER] No broker configured');
      return null;
    }

    try {
      const submittedOrder = await this.broker.submitOrder(order);
      
      return {
        ...submittedOrder,
        routedAt: new Date(),
        validationPassed: true,
        broker: this.broker.name
      };
    } catch (error) {
      console.error('[ORDER ROUTER] Failed to submit order:', error);
      return null;
    }
  }

  async validate(order: Omit<Order, 'id' | 'status' | 'filledQuantity' | 'createdAt' | 'updatedAt'>): Promise<OrderValidation> {
    // Check position limits
    const positionCheck = await positionLimits.check(order.symbol, order.quantity, order.side);
    if (!positionCheck.allowed) {
      return { valid: false, rejectionReason: positionCheck.reason };
    }

    // Check exposure limits
    const exposureCheck = await exposureLimits.check(
      order.symbol,
      order.quantity * (order.price || 0)
    );
    if (!exposureCheck.allowed) {
      return { valid: false, rejectionReason: exposureCheck.reason };
    }

    return { valid: true };
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.broker) return false;
    return this.broker.cancelOrder(orderId);
  }
}

export const orderRouter = new OrderRouter();
