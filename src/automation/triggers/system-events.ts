// System Event Triggers

import { eventBus, createEvent } from '../event-bus';
import { Trigger, EventType } from '../types';

interface UserAction {
  user_id: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  metadata?: Record<string, unknown>;
}

interface ScheduledTrigger {
  id: string;
  name: string;
  cron_expression: string;
  playbook_id: string;
  last_run?: Date;
}

interface ManualTrigger {
  triggered_by: string;
  playbook_id: string;
  input_data?: Record<string, unknown>;
  reason?: string;
}

class SystemEventTriggers {
  private triggers: Map<string, Trigger> = new Map();
  private scheduledTriggers: Map<string, ScheduledTrigger> = new Map();
  private actionThrottles: Map<string, Date> = new Map();
  private throttleWindowMs = 1000; // 1 second default

  registerTrigger(trigger: Trigger): void {
    this.triggers.set(trigger.id, trigger);
  }

  removeTrigger(triggerId: string): void {
    this.triggers.delete(triggerId);
  }

  // Handle user actions
  async onUserAction(action: UserAction): Promise<void> {
    const throttleKey = `${action.user_id}:${action.action_type}:${action.resource_type}`;
    
    if (this.isThrottled(throttleKey)) {
      console.log(`[System Events] Action throttled: ${throttleKey}`);
      return;
    }

    this.actionThrottles.set(throttleKey, new Date());

    const event = createEvent('user_action', 'system', {
      user_id: action.user_id,
      action_type: action.action_type,
      resource_type: action.resource_type,
      resource_id: action.resource_id,
      ...action.metadata,
    });

    await eventBus.emit(event);
  }

  // Handle scheduled triggers
  async onScheduledTrigger(scheduled: ScheduledTrigger): Promise<void> {
    const event = createEvent('scheduled', 'system', {
      trigger_id: scheduled.id,
      trigger_name: scheduled.name,
      playbook_id: scheduled.playbook_id,
      cron_expression: scheduled.cron_expression,
      last_run: scheduled.last_run,
    });

    // Update last run time
    this.scheduledTriggers.set(scheduled.id, {
      ...scheduled,
      last_run: new Date(),
    });

    await eventBus.emit(event);
  }

  // Handle manual triggers
  async onManualTrigger(manual: ManualTrigger): Promise<void> {
    const event = createEvent('manual', 'system', {
      triggered_by: manual.triggered_by,
      playbook_id: manual.playbook_id,
      input_data: manual.input_data,
      reason: manual.reason,
    });

    await eventBus.emit(event);
  }

  private isThrottled(key: string): boolean {
    const lastAction = this.actionThrottles.get(key);
    if (!lastAction) return false;
    
    return (new Date().getTime() - lastAction.getTime()) < this.throttleWindowMs;
  }

  setThrottleWindow(ms: number): void {
    this.throttleWindowMs = ms;
  }

  registerScheduledTrigger(trigger: ScheduledTrigger): void {
    this.scheduledTriggers.set(trigger.id, trigger);
  }

  removeScheduledTrigger(triggerId: string): void {
    this.scheduledTriggers.delete(triggerId);
  }

  getScheduledTriggers(): ScheduledTrigger[] {
    return Array.from(this.scheduledTriggers.values());
  }

  getTriggers(): Trigger[] {
    return Array.from(this.triggers.values());
  }

  // Emit a custom event
  async emitCustomEvent(
    type: EventType,
    source: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const event = createEvent(type, source, payload);
    await eventBus.emit(event);
  }
}

export const systemEventTriggers = new SystemEventTriggers();
