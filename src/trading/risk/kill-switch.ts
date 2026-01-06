// Kill Switch - Emergency trading halt

import { RiskLimits } from '../types';

interface KillSwitchState {
  isActive: boolean;
  triggeredAt?: Date;
  reason?: string;
  triggeredBy?: 'manual' | 'automatic';
}

class KillSwitch {
  private state: KillSwitchState = { isActive: false };
  private listeners: Array<(state: KillSwitchState) => void> = [];

  activate(reason: string, triggeredBy: 'manual' | 'automatic' = 'automatic'): void {
    this.state = {
      isActive: true,
      triggeredAt: new Date(),
      reason,
      triggeredBy
    };
    this.notifyListeners();
    console.error(`[KILL SWITCH ACTIVATED] ${reason}`);
  }

  deactivate(): void {
    if (this.state.isActive) {
      console.log(`[KILL SWITCH DEACTIVATED] Was active since ${this.state.triggeredAt}`);
    }
    this.state = { isActive: false };
    this.notifyListeners();
  }

  isActive(): boolean {
    return this.state.isActive;
  }

  getState(): KillSwitchState {
    return { ...this.state };
  }

  onStateChange(listener: (state: KillSwitchState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l(this.state));
  }

  checkLimits(
    currentLoss: number,
    currentDrawdown: number,
    limits: RiskLimits
  ): boolean {
    if (currentLoss >= limits.maxDailyLoss) {
      this.activate(`Max daily loss exceeded: ${currentLoss} >= ${limits.maxDailyLoss}`);
      return true;
    }
    if (currentDrawdown >= limits.maxDrawdown) {
      this.activate(`Max drawdown exceeded: ${currentDrawdown} >= ${limits.maxDrawdown}`);
      return true;
    }
    return false;
  }
}

export const killSwitch = new KillSwitch();
