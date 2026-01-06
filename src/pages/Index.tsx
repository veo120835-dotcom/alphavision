import React, { Suspense, useEffect, useState, lazy } from "react";
import { useAlphaVisionStore } from "@/store/alpha-vision-store";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

// Layout Components
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { AuthPage } from "@/components/AuthPage";
import { FounderStateCheckIn } from "@/components/FounderStateCheckIn";
import { OutcomeLogger } from "@/components/OutcomeLogger";

// Helper for lazy loading named exports
const lazyNamed = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ [key: string]: T }>,
  name: string
) => lazy(() => importFn().then((m) => ({ default: (m as any)[name] as T })));

// Lazy load components with default exports
const UnifiedAgentDashboard = lazy(() => import("@/components/UnifiedAgentDashboard"));
const ChatView = lazy(() => import("@/components/ChatView"));
const DailyBrief = lazy(() => import("@/components/DailyBrief"));
const AdminDashboard = lazy(() => import("@/components/AdminDashboard"));
const RevenueGovernor = lazy(() => import("@/components/RevenueGovernor"));

// Lazy load components with named exports
const DecisionsView = lazyNamed(() => import("@/components/DecisionsView"), "DecisionsView");
const SettingsView = lazyNamed(() => import("@/components/SettingsView"), "SettingsView");
const MemoryVaultView = lazyNamed(() => import("@/components/MemoryVaultView"), "MemoryVaultView");
const IntegrationsView = lazyNamed(() => import("@/components/IntegrationsView"), "IntegrationsView");
const IntegrationsHub = lazyNamed(() => import("@/components/IntegrationsHub"), "IntegrationsHub");
const AnalyticsView = lazyNamed(() => import("@/components/AnalyticsView"), "AnalyticsView");
const BusinessIdentityView = lazyNamed(() => import("@/components/BusinessIdentityView"), "BusinessIdentityView");
const TimeTravelReview = lazyNamed(() => import("@/components/TimeTravelReview"), "TimeTravelReview");
const CategoryDesignEngine = lazyNamed(() => import("@/components/CategoryDesignEngine"), "CategoryDesignEngine");
const AgentSwarmView = lazyNamed(() => import("@/components/AgentSwarmView"), "AgentSwarmView");
const HookOptimizationView = lazyNamed(() => import("@/components/HookOptimizationView"), "HookOptimizationView");
const ContentFactoryView = lazyNamed(() => import("@/components/ContentFactoryView"), "ContentFactoryView");
const SwarmOrchestrator = lazyNamed(() => import("@/components/SwarmOrchestrator"), "SwarmOrchestrator");
const ApprovalDashboardView = lazyNamed(() => import("@/components/ApprovalDashboardView"), "ApprovalDashboardView");
const RevenueTrackingView = lazyNamed(() => import("@/components/RevenueTrackingView"), "RevenueTrackingView");
const LeadPipelineView = lazyNamed(() => import("@/components/LeadPipelineView"), "LeadPipelineView");
const IntentScoringSystem = lazyNamed(() => import("@/components/IntentScoringSystem"), "IntentScoringSystem");
const DMSequenceAutomation = lazyNamed(() => import("@/components/DMSequenceAutomation"), "DMSequenceAutomation");
const PricingPowerAnalyzer = lazyNamed(() => import("@/components/PricingPowerAnalyzer"), "PricingPowerAnalyzer");
const ClientQualityOptimizer = lazyNamed(() => import("@/components/ClientQualityOptimizer"), "ClientQualityOptimizer");
const TimeToMoneyScore = lazyNamed(() => import("@/components/TimeToMoneyScore"), "TimeToMoneyScore");
const WorkflowTemplatesLibrary = lazyNamed(() => import("@/components/workflows/WorkflowTemplatesLibrary"), "WorkflowTemplatesLibrary");
const AdvancedLeadScoring = lazyNamed(() => import("@/components/workflows/AdvancedLeadScoring"), "AdvancedLeadScoring");
const AgentPacksLibrary = lazyNamed(() => import("@/components/AgentPacksLibrary"), "AgentPacksLibrary");
const TrendScouterDashboard = lazyNamed(() => import("@/components/TrendScouterDashboard"), "TrendScouterDashboard");
const AgentExecutionEngine = lazyNamed(() => import("@/components/AgentExecutionEngine"), "AgentExecutionEngine");
const WorkflowTriggersView = lazyNamed(() => import("@/components/WorkflowTriggersView"), "WorkflowTriggersView");
const APIDashboard = lazyNamed(() => import("@/components/APIDashboard"), "APIDashboard");
const VisualWorkflowEditor = lazyNamed(() => import("@/components/VisualWorkflowEditor"), "VisualWorkflowEditor");
const AgentControlCenter = lazyNamed(() => import("@/components/AgentControlCenter"), "AgentControlCenter");
const EvalDashboard = lazyNamed(() => import("@/components/EvalDashboard"), "EvalDashboard");
const TraceViewerUI = lazyNamed(() => import("@/components/TraceViewerUI"), "TraceViewerUI");
const StrategyGuideDashboard = lazyNamed(() => import("@/components/StrategyGuideDashboard"), "StrategyGuideDashboard");
const RevenueFeatures = lazyNamed(() => import("@/components/RevenueFeatures"), "RevenueFeatures");
const APIKeysManager = lazyNamed(() => import("@/components/APIKeysManager"), "APIKeysManager");
const SniperDashboard = lazyNamed(() => import("@/components/SniperDashboard"), "SniperDashboard");
const DMCloserInbox = lazyNamed(() => import("@/components/DMCloserInbox"), "DMCloserInbox");
const OpportunityCostEngine = lazyNamed(() => import("@/components/OpportunityCostEngine"), "OpportunityCostEngine");
const DecisionFatigueSystem = lazyNamed(() => import("@/components/DecisionFatigueSystem"), "DecisionFatigueSystem");
const RevenuePredictabilityIndex = lazyNamed(() => import("@/components/RevenuePredictabilityIndex"), "RevenuePredictabilityIndex");
const AntiCommoditizationEngine = lazyNamed(() => import("@/components/AntiCommoditizationEngine"), "AntiCommoditizationEngine");
const SkillROIPrioritizer = lazyNamed(() => import("@/components/SkillROIPrioritizer"), "SkillROIPrioritizer");
const AsyncClosingEngine = lazyNamed(() => import("@/components/AsyncClosingEngine"), "AsyncClosingEngine");
const DemandCaptureEngine = lazyNamed(() => import("@/components/DemandCaptureEngine"), "DemandCaptureEngine");
const DynamicPricingAgent = lazyNamed(() => import("@/components/DynamicPricingAgent"), "DynamicPricingAgent");
const AutoReinvestmentEngine = lazyNamed(() => import("@/components/AutoReinvestmentEngine"), "AutoReinvestmentEngine");
const IPFactoryEngine = lazyNamed(() => import("@/components/IPFactoryEngine"), "IPFactoryEngine");
const ROIAttributionEngine = lazyNamed(() => import("@/components/ROIAttributionEngine"), "ROIAttributionEngine");
const LeadExchangeMarketplace = lazyNamed(() => import("@/components/LeadExchangeMarketplace"), "LeadExchangeMarketplace");
const LicensingWhiteLabel = lazyNamed(() => import("@/components/LicensingWhiteLabel"), "LicensingWhiteLabel");
const DecisionBillingSystem = lazyNamed(() => import("@/components/DecisionBillingSystem"), "DecisionBillingSystem");
const CertificationEngine = lazyNamed(() => import("@/components/CertificationEngine"), "CertificationEngine");
const APIStatusDashboard = lazyNamed(() => import("@/components/APIStatusDashboard"), "APIStatusDashboard");
const EconomicDigitalTwin = lazyNamed(() => import("@/components/EconomicDigitalTwin"), "EconomicDigitalTwin");
const ArbitrageEngine = lazyNamed(() => import("@/components/ArbitrageEngine"), "ArbitrageEngine");
const SuccessTaxEcosystem = lazyNamed(() => import("@/components/SuccessTaxEcosystem"), "SuccessTaxEcosystem");
const OperatorStatus = lazyNamed(() => import("@/components/OperatorStatus"), "OperatorStatus");
const MarketShapingEngine = lazyNamed(() => import("@/components/MarketShapingEngine"), "MarketShapingEngine");
const DataFlywheel = lazyNamed(() => import("@/components/DataFlywheel"), "DataFlywheel");
const AutoProductization = lazyNamed(() => import("@/components/AutoProductization"), "AutoProductization");
const CapitalAllocator = lazyNamed(() => import("@/components/CapitalAllocator"), "CapitalAllocator");
const DecisionInsurance = lazyNamed(() => import("@/components/DecisionInsurance"), "DecisionInsurance");
const PriorityIntelligence = lazyNamed(() => import("@/components/PriorityIntelligence"), "PriorityIntelligence");
const PrivateDealFlow = lazyNamed(() => import("@/components/PrivateDealFlow"), "PrivateDealFlow");
const ExecutiveShadowMode = lazyNamed(() => import("@/components/ExecutiveShadowMode"), "ExecutiveShadowMode");
const ExclusiveBenchmarks = lazyNamed(() => import("@/components/ExclusiveBenchmarks"), "ExclusiveBenchmarks");
const InnerCircleAccess = lazyNamed(() => import("@/components/InnerCircleAccess"), "InnerCircleAccess");
const FailureModeEngine = lazyNamed(() => import("@/components/FailureModeEngine"), "FailureModeEngine");
const StrategicFrictionEngine = lazyNamed(() => import("@/components/StrategicFrictionEngine"), "StrategicFrictionEngine");
const MarketTimingEngine = lazyNamed(() => import("@/components/MarketTimingEngine"), "MarketTimingEngine");
const EconomicMoatDesigner = lazyNamed(() => import("@/components/EconomicMoatDesigner"), "EconomicMoatDesigner");
const BusinessImmuneSystem = lazyNamed(() => import("@/components/BusinessImmuneSystem"), "BusinessImmuneSystem");
const NoInputMode = lazyNamed(() => import("@/components/NoInputMode"), "NoInputMode");
const TrustReputationEngine = lazyNamed(() => import("@/components/TrustReputationEngine"), "TrustReputationEngine");
const ConsequenceSimulator = lazyNamed(() => import("@/components/ConsequenceSimulator"), "ConsequenceSimulator");
const DecisionQualityScoring = lazyNamed(() => import("@/components/DecisionQualityScoring"), "DecisionQualityScoring");
const OrganizationalIntelligence = lazyNamed(() => import("@/components/OrganizationalIntelligence"), "OrganizationalIntelligence");
const SelfProductizationEngine = lazyNamed(() => import("@/components/SelfProductizationEngine"), "SelfProductizationEngine");
const CapitalDeploymentDashboard = lazyNamed(() => import("@/components/CapitalDeploymentDashboard"), "CapitalDeploymentDashboard");
const LeadArbitrageEngine = lazyNamed(() => import("@/components/LeadArbitrageEngine"), "LeadArbitrageEngine");
const ServiceResellingEngine = lazyNamed(() => import("@/components/ServiceResellingEngine"), "ServiceResellingEngine");
const CashflowOptimizationEngine = lazyNamed(() => import("@/components/CashflowOptimizationEngine"), "CashflowOptimizationEngine");
const AuditLogViewer = lazyNamed(() => import("@/components/AuditLogViewer"), "AuditLogViewer");
const KillSwitchDashboard = lazyNamed(() => import("@/components/KillSwitchDashboard"), "KillSwitchDashboard");
const CapitalRulesEngine = lazyNamed(() => import("@/components/CapitalRulesEngine"), "CapitalRulesEngine");
const UserManagement = lazyNamed(() => import("@/components/UserManagement"), "UserManagement");

// CRM Components
const ContactsView = lazyNamed(() => import("@/components/crm/ContactsView"), "ContactsView");
const CompaniesView = lazyNamed(() => import("@/components/crm/CompaniesView"), "CompaniesView");
const DealsView = lazyNamed(() => import("@/components/crm/DealsView"), "DealsView");
const TasksView = lazyNamed(() => import("@/components/crm/TasksView"), "TasksView");
const ActivityTimeline = lazyNamed(() => import("@/components/crm/ActivityTimeline"), "ActivityTimeline");
const TagManager = lazyNamed(() => import("@/components/crm/TagManager"), "TagManager");

// Marketing & Content Components
const CampaignsList = lazyNamed(() => import("@/components/campaigns/CampaignsList"), "CampaignsList");
const EmailTemplatesList = lazyNamed(() => import("@/components/email/EmailTemplatesList"), "EmailTemplatesList");
const FormsList = lazyNamed(() => import("@/components/forms/FormsList"), "FormsList");
const BookingsList = lazyNamed(() => import("@/components/booking/BookingsList"), "BookingsList");
const BookingSettings = lazyNamed(() => import("@/components/booking/BookingSettings"), "BookingSettings");
const MetaAdsManager = lazyNamed(() => import("@/components/ads/MetaAdsManager"), "MetaAdsManager");
const InvoicesList = lazyNamed(() => import("@/components/billing/InvoicesList"), "InvoicesList");
const ProductsCatalog = lazyNamed(() => import("@/components/billing/ProductsCatalog"), "ProductsCatalog");
const CoursesList = lazyNamed(() => import("@/components/courses/CoursesList"), "CoursesList");
const TemplateLibrary = lazyNamed(() => import("@/components/templates/TemplateLibrary"), "TemplateLibrary");
const ROIDashboard = lazyNamed(() => import("@/components/analytics/ROIDashboard"), "ROIDashboard");
const PricingEngine = lazyNamed(() => import("@/components/pricing/PricingEngine"), "PricingEngine");
const AssetFactory = lazyNamed(() => import("@/components/assets/AssetFactory"), "AssetFactory");
const ComplianceSuite = lazyNamed(() => import("@/components/compliance/ComplianceSuite"), "ComplianceSuite");
const SOPEngine = lazyNamed(() => import("@/components/knowledge/SOPEngine"), "SOPEngine");
const TrainingMode = lazyNamed(() => import("@/components/training/TrainingMode"), "TrainingMode");
const BusinessProfileDashboard = lazyNamed(() => import("@/components/BusinessProfileDashboard"), "BusinessProfileDashboard");
const AIAgentRulesManager = lazyNamed(() => import("@/components/AIAgentRulesManager"), "AIAgentRulesManager");
const KnowledgeDashboard = lazyNamed(() => import("@/components/knowledge/KnowledgeDashboard"), "KnowledgeDashboard");
const RevenuePivotManager = lazyNamed(() => import("@/components/knowledge/RevenuePivotManager"), "RevenuePivotManager");

// Outreach Components
const WebsiteIntelligenceDashboard = lazyNamed(() => import("@/components/outreach/WebsiteIntelligenceDashboard"), "WebsiteIntelligenceDashboard");
const PatternLibrary = lazyNamed(() => import("@/components/outreach/PatternLibrary"), "PatternLibrary");
const ColdEmailSettings = lazyNamed(() => import("@/components/outreach/ColdEmailSettings"), "ColdEmailSettings");

// Intelligence Components
const HiveMindDashboard = lazyNamed(() => import("@/components/intelligence/HiveMindDashboard"), "HiveMindDashboard");
const ShadowModeDashboard = lazyNamed(() => import("@/components/intelligence/ShadowModeDashboard"), "ShadowModeDashboard");
const MysteryShopperDashboard = lazyNamed(() => import("@/components/intelligence/MysteryShopperDashboard"), "MysteryShopperDashboard");
const BoardroomDashboard = lazyNamed(() => import("@/components/intelligence/BoardroomDashboard"), "BoardroomDashboard");

// Automation Components
const LazarusEngineDashboard = lazyNamed(() => import("@/components/automation/LazarusEngineDashboard"), "LazarusEngineDashboard");
const ChurnGuardDashboard = lazyNamed(() => import("@/components/automation/ChurnGuardDashboard"), "ChurnGuardDashboard");
const ReviewMagnetDashboard = lazyNamed(() => import("@/components/automation/ReviewMagnetDashboard"), "ReviewMagnetDashboard");
const PriceSurgeonDashboard = lazyNamed(() => import("@/components/automation/PriceSurgeonDashboard"), "PriceSurgeonDashboard");

// Loading spinner component
const PageLoader = () => (
  <div className="flex h-full w-full flex-col items-center justify-center space-y-4">
    <div className="relative h-16 w-16">
      <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
      <div className="relative flex h-full w-full items-center justify-center rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
    </div>
    <p className="animate-pulse text-sm font-medium text-muted-foreground">Loading...</p>
  </div>
);

// Error boundary for catching render errors
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center p-8">
          <h2 className="text-2xl font-bold text-destructive">Something went wrong</h2>
          <p className="text-muted-foreground mt-2">This module encountered an error.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Index = () => {
  const { activeView, isSidebarOpen, showCheckIn, setShowCheckIn, showOutcomeLogger, setShowOutcomeLogger } =
    useAlphaVisionStore();
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }
      try {
        const { data: membership } = await supabase
          .from("memberships")
          .select("organization_id")
          .eq("user_id", user.id)
          .single();

        if (membership?.organization_id) {
          const { data: config } = await supabase
            .from("business_config")
            .select("product_name")
            .eq("organization_id", membership.organization_id)
            .single();
          setShowOnboarding(!config?.product_name);
        } else {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
        setShowOnboarding(true);
      } finally {
        setCheckingOnboarding(false);
      }
    };
    checkOnboarding();
  }, [user]);

  const renderView = () => {
    switch (activeView) {
      case 'unified-dashboard': return <UnifiedAgentDashboard />;
      case 'chat': return <ChatView />;
      case 'daily-brief': return <DailyBrief />;
      case 'admin': return <AdminDashboard />;
      case 'decisions': return <DecisionsView />;
      case 'settings': return <SettingsView />;
      case 'memory': return <MemoryVaultView />;
      case 'integrations': return <IntegrationsView />;
      case 'integration-hub': return <IntegrationsHub />;
      case 'analytics': return <AnalyticsView />;
      case 'identity': return <BusinessIdentityView />;
      case 'timetravel': return <TimeTravelReview />;
      case 'category': return <CategoryDesignEngine />;
      case 'agent': return <AgentSwarmView />;
      case 'hooks': return <HookOptimizationView />;
      case 'factory': return <ContentFactoryView />;
      case 'swarm': return <SwarmOrchestrator />;
      case 'approvals': return <ApprovalDashboardView />;
      case 'revenue': return <RevenueTrackingView />;
      case 'pipeline': return <LeadPipelineView />;
      case 'scoring': return <IntentScoringSystem />;
      case 'dmsequences': return <DMSequenceAutomation />;
      case 'pricing': return <PricingPowerAnalyzer />;
      case 'clientquality': return <ClientQualityOptimizer />;
      case 'timetomoney': return <TimeToMoneyScore />;
      case 'agent-packs': return <AgentPacksLibrary />;
      case 'workflow-templates': return <WorkflowTemplatesLibrary />;
      case 'advanced-scoring': return <AdvancedLeadScoring />;
      case 'trends': return <TrendScouterDashboard />;
      case 'execution': return <AgentExecutionEngine />;
      case 'triggers': return <WorkflowTriggersView />;
      case 'api': return <APIDashboard />;
      case 'workflow-editor': return <VisualWorkflowEditor />;
      case 'orchestrator': return <SwarmOrchestrator />;
      case 'control-center': return <AgentControlCenter />;
      case 'eval-dashboard': return <EvalDashboard />;
      case 'trace-viewer': return <TraceViewerUI />;
      case 'strategy-guide': return <StrategyGuideDashboard />;
      case 'revenue-features': return <RevenueFeatures />;
      case 'apikeys': return <APIKeysManager />;
      case 'sniper': return <SniperDashboard />;
      case 'dm-inbox': return <DMCloserInbox />;
      case 'opportunity-cost': return <OpportunityCostEngine />;
      case 'decision-fatigue': return <DecisionFatigueSystem />;
      case 'revenue-predictability': return <RevenuePredictabilityIndex />;
      case 'anti-commodity': return <AntiCommoditizationEngine />;
      case 'skill-roi': return <SkillROIPrioritizer />;
      case 'async-closing': return <AsyncClosingEngine />;
      case 'demand-capture': return <DemandCaptureEngine />;
      case 'dynamic-pricing': return <DynamicPricingAgent />;
      case 'auto-reinvestment': return <AutoReinvestmentEngine />;
      case 'ip-factory': return <IPFactoryEngine />;
      case 'roi-attribution': return <ROIAttributionEngine />;
      case 'lead-exchange': return <LeadExchangeMarketplace />;
      case 'licensing': return <LicensingWhiteLabel />;
      case 'decision-billing': return <DecisionBillingSystem />;
      case 'certification': return <CertificationEngine />;
      case 'api-status': return <APIStatusDashboard />;
      case 'revenue-governor': return <RevenueGovernor />;
      case 'digital-twin': return <EconomicDigitalTwin />;
      case 'arbitrage': return <ArbitrageEngine />;
      case 'success-tax': return <SuccessTaxEcosystem />;
      case 'operator-status': return <OperatorStatus />;
      case 'market-shaping': return <MarketShapingEngine />;
      case 'data-flywheel': return <DataFlywheel />;
      case 'auto-productization': return <AutoProductization />;
      case 'capital-allocator': return <CapitalAllocator />;
      case 'decision-insurance': return <DecisionInsurance />;
      case 'priority-intelligence': return <PriorityIntelligence />;
      case 'deal-flow': return <PrivateDealFlow />;
      case 'executive-shadow': return <ExecutiveShadowMode />;
      case 'benchmarks': return <ExclusiveBenchmarks />;
      case 'inner-circle': return <InnerCircleAccess />;
      case 'failure-modes': return <FailureModeEngine />;
      case 'strategic-friction': return <StrategicFrictionEngine />;
      case 'market-timing': return <MarketTimingEngine />;
      case 'moat-designer': return <EconomicMoatDesigner />;
      case 'immune-system': return <BusinessImmuneSystem />;
      case 'no-input-mode': return <NoInputMode />;
      case 'trust-capital': return <TrustReputationEngine />;
      case 'consequence-simulator': return <ConsequenceSimulator />;
      case 'decision-quality': return <DecisionQualityScoring />;
      case 'org-intelligence': return <OrganizationalIntelligence />;
      case 'self-productization': return <SelfProductizationEngine />;
      case 'capital-deployment': return <CapitalDeploymentDashboard />;
      case 'lead-arbitrage': return <LeadArbitrageEngine />;
      case 'service-reselling': return <ServiceResellingEngine />;
      case 'cashflow-optimization': return <CashflowOptimizationEngine />;
      case 'audit-log': return <AuditLogViewer />;
      case 'kill-switch': return <KillSwitchDashboard />;
      case 'capital-rules': return <CapitalRulesEngine />;
      case 'user-management': return <UserManagement />;
      case 'crm-contacts': return <ContactsView />;
      case 'crm-companies': return <CompaniesView />;
      case 'crm-deals': return <DealsView />;
      case 'crm-tasks': return <TasksView />;
      case 'crm-activity': return <ActivityTimeline />;
      case 'campaigns': return <CampaignsList />;
      case 'email-templates': return <EmailTemplatesList />;
      case 'forms': return <FormsList />;
      case 'booking': return <BookingsList />;
      case 'booking-settings': return <BookingSettings />;
      case 'meta-ads': return <MetaAdsManager />;
      case 'invoices': return <InvoicesList />;
      case 'products': return <ProductsCatalog />;
      case 'courses': return <CoursesList />;
      case 'tags': return <TagManager />;
      case 'templates': return <TemplateLibrary />;
      case 'roi-dashboard': return <ROIDashboard />;
      case 'pricing-engine': return <PricingEngine />;
      case 'asset-factory': return <AssetFactory />;
      case 'compliance-suite': return <ComplianceSuite />;
      case 'sop-engine': return <SOPEngine />;
      case 'training-mode': return <TrainingMode />;
      case 'business-profile': return <BusinessProfileDashboard />;
      case 'ai-rules': return <AIAgentRulesManager />;
      case 'knowledge-base': return <KnowledgeDashboard />;
      case 'revenue-pivots': return <RevenuePivotManager />;
      case 'website-intelligence': return <WebsiteIntelligenceDashboard />;
      case 'pattern-library': return <PatternLibrary />;
      case 'cold-email-settings': return <ColdEmailSettings />;
      // Intelligence
      case 'hive-mind': return <HiveMindDashboard />;
      case 'shadow-mode': return <ShadowModeDashboard />;
      case 'mystery-shopper': return <MysteryShopperDashboard />;
      case 'boardroom': return <BoardroomDashboard />;
      // Automation
      case 'lazarus-engine': return <LazarusEngineDashboard />;
      case 'churn-guard': return <ChurnGuardDashboard />;
      case 'review-magnet': return <ReviewMagnetDashboard />;
      case 'price-surgeon': return <PriceSurgeonDashboard />;
      default: return <UnifiedAgentDashboard />;
    }
  };

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (!user) return <AuthPage />;
  if (showOnboarding) return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden flex">
      <Sidebar />

      <main
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out relative",
          isSidebarOpen ? "md:ml-64" : "ml-0",
        )}
      >
        <TopBar />

        <div className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20 p-4 md:p-6 bg-gradient-to-br from-background to-secondary/5">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="h-full max-w-7xl mx-auto"
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      <AnimatePresence>
        {showCheckIn && <FounderStateCheckIn onClose={() => setShowCheckIn(false)} onComplete={() => {}} />}
        {showOutcomeLogger && <OutcomeLogger onClose={() => setShowOutcomeLogger(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
