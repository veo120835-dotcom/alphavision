// CRM Event Triggers

import { eventBus, createEvent } from '../event-bus';
import { Trigger, TriggerCondition, Event } from '../types';

interface Lead {
  id: string;
  email: string;
  name: string;
  status: string;
  stage: string;
  created_at: Date;
  last_activity_at: Date;
  source: string;
  score: number;
}

interface CRMStageChange {
  lead_id: string;
  previous_stage: string;
  new_stage: string;
  changed_by: string;
}

class CRMEventTriggers {
  private triggers: Map<string, Trigger> = new Map();
  private staleThresholdDays = 7;

  registerTrigger(trigger: Trigger): void {
    this.triggers.set(trigger.id, trigger);
  }

  removeTrigger(triggerId: string): void {
    this.triggers.delete(triggerId);
  }

  // Emit when a new lead is created
  async onLeadCreated(lead: Lead): Promise<void> {
    const event = createEvent('lead_created', 'crm', {
      lead_id: lead.id,
      email: lead.email,
      name: lead.name,
      source: lead.source,
      score: lead.score,
    });

    await this.processEvent(event);
  }

  // Emit when a CRM stage changes
  async onStageChanged(change: CRMStageChange): Promise<void> {
    const event = createEvent('crm_stage_changed', 'crm', {
      lead_id: change.lead_id,
      previous_stage: change.previous_stage,
      new_stage: change.new_stage,
      changed_by: change.changed_by,
    });

    await this.processEvent(event);
  }

  // Check for stale leads and emit events
  async checkStaleLeads(leads: Lead[]): Promise<void> {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - this.staleThresholdDays * 24 * 60 * 60 * 1000);

    for (const lead of leads) {
      if (lead.last_activity_at < staleThreshold && lead.status !== 'closed') {
        const event = createEvent('lead_stale', 'crm', {
          lead_id: lead.id,
          email: lead.email,
          name: lead.name,
          days_inactive: Math.floor((now.getTime() - lead.last_activity_at.getTime()) / (24 * 60 * 60 * 1000)),
          stage: lead.stage,
        });

        await this.processEvent(event);
      }
    }
  }

  private async processEvent(event: Event): Promise<void> {
    const matchingTriggers = this.findMatchingTriggers(event);

    if (matchingTriggers.length > 0) {
      console.log(`[CRM Events] Found ${matchingTriggers.length} matching triggers for ${event.type}`);
    }

    await eventBus.emit(event);
  }

  private findMatchingTriggers(event: Event): Trigger[] {
    return Array.from(this.triggers.values()).filter(trigger => {
      if (!trigger.enabled || trigger.event_type !== event.type) {
        return false;
      }

      return trigger.conditions.every(condition => 
        this.evaluateCondition(condition, event.payload)
      );
    });
  }

  private evaluateCondition(condition: TriggerCondition, payload: Record<string, unknown>): boolean {
    const fieldValue = payload[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  setStaleThreshold(days: number): void {
    this.staleThresholdDays = days;
  }

  getTriggers(): Trigger[] {
    return Array.from(this.triggers.values());
  }
}

export const crmEventTriggers = new CRMEventTriggers();
