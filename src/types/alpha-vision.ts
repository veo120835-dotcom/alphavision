export type OperationMode = 'advisor' | 'operator' | 'autopilot';
export type RiskPosture = 'conservative' | 'balanced' | 'aggressive';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  decision?: DecisionOutput;
  actions?: ActionCard[];
}

export interface DecisionOutput {
  recommendation: string;
  whyThisWins: string;
  assumptions: string[];
  risks: RiskItem[];
  options: Option[];
  nextActions: string[];
  metricsToTrack: string[];
  killCriteria: string[];
  questionsNeeded: string[];
}

export interface RiskItem {
  risk: string;
  mitigation: string;
}

export interface Option {
  label: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ActionCard {
  id: string;
  type: 'checklist' | 'budget' | 'sequence' | 'approval';
  title: string;
  items: string[];
  status: 'pending' | 'approved' | 'executed';
}

export interface PermissionContract {
  riskPosture: {
    personal: RiskPosture;
    business: RiskPosture;
    marketing: RiskPosture;
  };
  runwayMinimum: number; // months
  monthlyCaps: {
    ads: number;
    experiments: number;
    tools: number;
  };
  allowedTools: string[];
  nonNegotiables: string[];
}

export interface DecisionLogEntry {
  id: string;
  timestamp: Date;
  summary: string;
  recommendation: string;
  assumptions: string[];
  metrics: string[];
  killCriteria: string[];
  status: 'pending' | 'approved' | 'rejected' | 'executed';
}
