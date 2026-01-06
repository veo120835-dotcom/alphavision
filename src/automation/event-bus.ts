// Event Bus - Central event routing and distribution

import { Event, EventHandler, EventType } from './types';

interface EventSubscription {
  id: string;
  handler: EventHandler;
  unsubscribe: () => void;
}

class EventBus {
  private handlers: Map<EventType, EventHandler[]> = new Map();
  private eventHistory: Event[] = [];
  private maxHistorySize = 1000;
  private paused = false;

  subscribe(handler: EventHandler): EventSubscription {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    handler.event_types.forEach(eventType => {
      const existing = this.handlers.get(eventType) || [];
      existing.push(handler);
      existing.sort((a, b) => b.priority - a.priority);
      this.handlers.set(eventType, existing);
    });

    return {
      id: subscriptionId,
      handler,
      unsubscribe: () => this.unsubscribe(handler),
    };
  }

  unsubscribe(handler: EventHandler): void {
    handler.event_types.forEach(eventType => {
      const existing = this.handlers.get(eventType) || [];
      const filtered = existing.filter(h => h.id !== handler.id);
      this.handlers.set(eventType, filtered);
    });
  }

  async emit(event: Event): Promise<void> {
    if (this.paused) {
      console.log(`[EventBus] Paused - event ${event.type} queued`);
      return;
    }

    this.recordEvent(event);

    const handlers = this.handlers.get(event.type) || [];
    const enabledHandlers = handlers.filter(h => h.enabled);

    console.log(`[EventBus] Emitting ${event.type} to ${enabledHandlers.length} handlers`);

    for (const handler of enabledHandlers) {
      try {
        await handler.handler(event);
      } catch (error) {
        console.error(`[EventBus] Handler ${handler.id} failed:`, error);
      }
    }
  }

  async emitBatch(events: Event[]): Promise<void> {
    for (const event of events) {
      await this.emit(event);
    }
  }

  private recordEvent(event: Event): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  pause(): void {
    this.paused = true;
    console.log('[EventBus] Paused');
  }

  resume(): void {
    this.paused = false;
    console.log('[EventBus] Resumed');
  }

  getHistory(filter?: { type?: EventType; since?: Date; limit?: number }): Event[] {
    let events = [...this.eventHistory];

    if (filter?.type) {
      events = events.filter(e => e.type === filter.type);
    }

    if (filter?.since) {
      events = events.filter(e => e.timestamp >= filter.since!);
    }

    if (filter?.limit) {
      events = events.slice(-filter.limit);
    }

    return events;
  }

  getHandlerCount(eventType?: EventType): number {
    if (eventType) {
      return (this.handlers.get(eventType) || []).length;
    }
    return Array.from(this.handlers.values()).reduce((sum, h) => sum + h.length, 0);
  }

  clear(): void {
    this.handlers.clear();
    this.eventHistory = [];
  }
}

export const eventBus = new EventBus();

// Helper to create events
export function createEvent(
  type: EventType,
  source: string,
  payload: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Event {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    source,
    payload,
    timestamp: new Date(),
    metadata,
  };
}
