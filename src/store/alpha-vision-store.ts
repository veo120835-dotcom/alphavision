import { create } from 'zustand';
import { OperationMode, RiskPosture, DecisionLogEntry } from '@/types/alpha-vision';

type ViewType = 'unified-dashboard' | 'chat' | 'decisions' | 'settings' | 'memory' | 'integrations' | 'integration-hub' | 'analytics' | 'identity' | 'timetravel' | 'category' | 'agent' | 'hooks' | 'factory' | 'swarm' | 'approvals' | 'revenue' | 'pipeline' | 'scoring' | 'dmsequences' | 'pricing' | 'clientquality' | 'timetomoney' | 'trends' | 'execution' | 'triggers' | 'api' | 'workflow-editor' | 'orchestrator' | 'control-center' | 'eval-dashboard' | 'trace-viewer' | 'strategy-guide' | 'revenue-features' | 'apikeys' | 'sniper' | 'dm-inbox' | 'admin' | 'opportunity-cost' | 'decision-fatigue' | 'revenue-predictability' | 'anti-commodity' | 'skill-roi' | 'async-closing' | 'demand-capture' | 'dynamic-pricing' | 'auto-reinvestment' | 'ip-factory' | 'roi-attribution' | 'lead-exchange' | 'licensing' | 'decision-billing' | 'certification' | 'api-status' | 'revenue-governor' | 'digital-twin' | 'arbitrage' | 'daily-brief' | 'success-tax' | 'operator-status' | 'market-shaping' | 'data-flywheel' | 'auto-productization' | 'capital-allocator' | 'decision-insurance' | 'priority-intelligence' | 'deal-flow' | 'executive-shadow' | 'benchmarks' | 'inner-circle' | 'failure-modes' | 'strategic-friction' | 'market-timing' | 'moat-designer' | 'immune-system' | 'no-input-mode' | 'trust-capital' | 'consequence-simulator' | 'decision-quality' | 'org-intelligence' | 'self-productization' | 'capital-deployment' | 'lead-arbitrage' | 'service-reselling' | 'cashflow-optimization' | 'audit-log' | 'kill-switch' | 'capital-rules' | 'user-management' | 'crm-contacts' | 'crm-companies' | 'crm-deals' | 'crm-tasks' | 'crm-activity' | 'campaigns' | 'campaign-builder' | 'email-templates' | 'email-editor' | 'forms' | 'form-builder' | 'booking' | 'booking-settings' | 'meta-ads' | 'invoices' | 'invoice-builder' | 'products' | 'courses' | 'course-editor' | 'tags' | 'templates' | 'roi-dashboard' | 'pricing-engine' | 'asset-factory' | 'compliance-suite' | 'sop-engine' | 'training-mode' | 'business-profile' | 'ai-rules' | 'knowledge-base' | 'revenue-pivots' | 'website-intelligence' | 'pattern-library' | 'cold-email-settings' | 'workflow-templates' | 'advanced-scoring' | 'hive-mind' | 'shadow-mode' | 'mystery-shopper' | 'boardroom' | 'lazarus-engine' | 'churn-guard' | 'review-magnet' | 'price-surgeon' | 'intent-first' | 'founder-index' | 'narrative';

interface StoreState {
  showOutcomeLogger: boolean;
}

interface AlphaVisionState {
  // Mode & Settings
  mode: OperationMode;
  setMode: (mode: OperationMode) => void;
  
  riskPosture: {
    personal: RiskPosture;
    business: RiskPosture;
    marketing: RiskPosture;
  };
  setRiskPosture: (domain: 'personal' | 'business' | 'marketing', posture: RiskPosture) => void;
  
  runwayMonths: number;
  setRunwayMonths: (months: number) => void;
  
  // Decision Log
  decisionLog: DecisionLogEntry[];
  addDecisionLogEntry: (entry: DecisionLogEntry) => void;
  
  // UI State
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  
  // Check-in State
  showCheckIn: boolean;
  setShowCheckIn: (show: boolean) => void;
  
  // Outcome Logger State
  showOutcomeLogger: boolean;
  setShowOutcomeLogger: (show: boolean) => void;
}

export const useAlphaVisionStore = create<AlphaVisionState>((set) => ({
  // Mode & Settings
  mode: 'operator',
  setMode: (mode) => set({ mode }),
  
  riskPosture: {
    personal: 'conservative',
    business: 'balanced',
    marketing: 'balanced',
  },
  setRiskPosture: (domain, posture) => set((state) => ({
    riskPosture: { ...state.riskPosture, [domain]: posture }
  })),
  
  runwayMonths: 9,
  setRunwayMonths: (runwayMonths) => set({ runwayMonths }),
  
  // Decision Log
  decisionLog: [],
  addDecisionLogEntry: (entry) => set((state) => ({
    decisionLog: [entry, ...state.decisionLog]
  })),
  
  // UI State
  isSidebarOpen: true,
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  activeView: 'unified-dashboard',
  setActiveView: (activeView) => set({ activeView }),
  
  // Check-in State
  showCheckIn: false,
  setShowCheckIn: (showCheckIn) => set({ showCheckIn }),
  
  // Outcome Logger State
  showOutcomeLogger: false,
  setShowOutcomeLogger: (showOutcomeLogger) => set({ showOutcomeLogger }),
}));
