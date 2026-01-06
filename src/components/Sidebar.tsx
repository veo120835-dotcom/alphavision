import { useAlphaVisionStore } from "@/store/alpha-vision-store";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { 
  MessageSquare, 
  ClipboardList, 
  Settings, 
  Database, 
  Link, 
  Menu,
  LogOut,
  BarChart3,
  Shield,
  Heart,
  Clock,
  Crown,
  CheckCircle2,
  Bot,
  Sparkles,
  Factory,
  Network,
  ShieldCheck,
  DollarSign,
  Users,
  Target,
  Mail,
  Calculator,
  Star,
  Timer,
  TrendingUp,
  Cpu,
  Zap,
  Key,
  Workflow,
  Brain,
  LayoutDashboard,
  FlaskConical,
  Activity,
  Stethoscope,
  Briefcase,
  Plug,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Share2,
  Eye,
  Search,
  UsersRound,
  Skull,
  CreditCard,
  MessageCircle,
  Scissors
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type NavSection = {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

type NavItem = {
  id: string;
  icon: any;
  label: string;
};

export function Sidebar() {
  const { isSidebarOpen, setSidebarOpen, activeView, setActiveView, setShowCheckIn, setShowOutcomeLogger } = useAlphaVisionStore();
  const { signOut } = useAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    core: true,
    premium: false,
    worldclass: false,
    agents: false,
    content: false,
    revenue: false,
    settings: true,
    intelligence: false,
    automation: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const navSections: NavSection[] = [
    {
      title: "Core",
      items: [
        { id: 'unified-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'daily-brief', icon: Sparkles, label: '☀️ Daily Brief' },
        { id: 'business-profile', icon: Briefcase, label: '🏢 Business Profile' },
        { id: 'knowledge-base', icon: Brain, label: '🧠 Knowledge Base' },
        { id: 'revenue-pivots', icon: DollarSign, label: '💰 Revenue Pivots' },
        { id: 'ai-rules', icon: Bot, label: '🤖 AI Rules' },
        { id: 'admin', icon: Settings, label: '⚙️ Mission Control' },
        { id: 'user-management', icon: Users, label: '👥 User Management' },
        { id: 'integration-hub', icon: Plug, label: '🔌 Integration Hub' },
      ],
      defaultOpen: true
    },
    {
      title: "📇 CRM",
      items: [
        { id: 'crm-contacts', icon: Users, label: 'Contacts' },
        { id: 'crm-companies', icon: Briefcase, label: 'Companies' },
        { id: 'crm-deals', icon: Target, label: 'Deals' },
        { id: 'crm-tasks', icon: CheckCircle2, label: 'Tasks' },
        { id: 'crm-activity', icon: Activity, label: 'Activity' },
        { id: 'tags', icon: Target, label: '🏷️ Tags' },
      ],
      defaultOpen: true
    },
    {
      title: "📧 Marketing",
      items: [
        { id: 'campaigns', icon: Mail, label: '📬 Campaigns' },
        { id: 'email-templates', icon: Mail, label: '✉️ Email Templates' },
        { id: 'forms', icon: ClipboardList, label: '📝 Forms & Surveys' },
      ],
      defaultOpen: true
    },
    {
      title: "📅 Calendar",
      items: [
        { id: 'booking', icon: Clock, label: '📅 Bookings' },
        { id: 'booking-settings', icon: Settings, label: '⚙️ Booking Settings' },
      ],
      defaultOpen: true
    },
    {
      title: "💳 Billing",
      items: [
        { id: 'invoices', icon: DollarSign, label: '🧾 Invoices' },
        { id: 'products', icon: Factory, label: '📦 Products' },
      ],
      defaultOpen: true
    },
    {
      title: "📚 Courses",
      items: [
        { id: 'courses', icon: Brain, label: '📚 Course Library' },
      ],
      defaultOpen: true
    },
    {
      title: "📊 Ads",
      items: [
        { id: 'meta-ads', icon: Target, label: '📊 Meta Ads' },
      ],
      defaultOpen: true
    },
    {
      title: "🚀 Capital",
      items: [
        { id: 'capital-deployment', icon: DollarSign, label: '🚀 Capital Engine' },
        { id: 'capital-rules', icon: Settings, label: '⚙️ Rules Engine' },
        { id: 'lead-arbitrage', icon: Target, label: '🎯 Lead Arbitrage' },
        { id: 'service-reselling', icon: Factory, label: '📦 Service Reselling' },
        { id: 'cashflow-optimization', icon: Calculator, label: '💸 Cashflow Optimizer' },
        { id: 'kill-switch', icon: Shield, label: '🛑 Kill Switch' },
        { id: 'audit-log', icon: ClipboardList, label: '📋 Audit Log' },
      ]
    },
    {
      title: "💎 Premium",
      items: [
        { id: 'decision-insurance', icon: Shield, label: '🛡️ Decision Insurance' },
        { id: 'priority-intelligence', icon: Zap, label: '⚡ Priority Intel' },
        { id: 'deal-flow', icon: Briefcase, label: '💼 Deal Flow' },
        { id: 'executive-shadow', icon: Users, label: '👔 Executive Shadow' },
        { id: 'benchmarks', icon: BarChart3, label: '📊 Benchmarks' },
        { id: 'inner-circle', icon: Crown, label: '👑 Inner Circle' },
        { id: 'roi-dashboard', icon: BarChart3, label: '📈 ROI Dashboard' },
        { id: 'pricing-engine', icon: DollarSign, label: '💰 Pricing Engine' },
        { id: 'asset-factory', icon: Factory, label: '🏭 Asset Factory' },
      ]
    },
    {
      title: "🏆 World-Class",
      items: [
        { id: 'revenue-governor', icon: ShieldCheck, label: '⚖️ Revenue Governor' },
        { id: 'digital-twin', icon: Brain, label: '🧠 Digital Twin' },
        { id: 'arbitrage', icon: Target, label: '🎯 Arbitrage Engine' },
        { id: 'market-shaping', icon: TrendingUp, label: '📈 Market Shaping' },
        { id: 'data-flywheel', icon: Database, label: '🔄 Data Flywheel' },
        { id: 'auto-productization', icon: Factory, label: '📦 Auto-Products' },
        { id: 'capital-allocator', icon: DollarSign, label: '💰 Capital Allocator' },
        { id: 'success-tax', icon: DollarSign, label: '🤝 Success Tax' },
        { id: 'operator-status', icon: Star, label: '⭐ Operator Status' },
        { id: 'failure-modes', icon: AlertTriangle, label: '🚨 Failure Modes' },
        { id: 'strategic-friction', icon: Timer, label: '⏸️ Strategic Friction' },
        { id: 'market-timing', icon: Clock, label: '⏰ Market Timing' },
        { id: 'moat-designer', icon: Shield, label: '🏰 Moat Designer' },
        { id: 'decision-quality', icon: Brain, label: '🧠 Decision Quality' },
        { id: 'opportunity-cost', icon: Calculator, label: '💸 Opportunity Cost' },
        { id: 'org-intelligence', icon: Users, label: '🏢 Org Intelligence' },
        { id: 'self-productization', icon: Factory, label: '📦 Self-Productize' },
        { id: 'immune-system', icon: ShieldCheck, label: '🛡️ Immune System' },
        { id: 'trust-capital', icon: Heart, label: '💖 Trust Capital' },
        { id: 'consequence-simulator', icon: Network, label: '🔮 Consequences' },
        { id: 'no-input-mode', icon: Sparkles, label: '🧘 No-Input Mode' },
        { id: 'compliance-suite', icon: Shield, label: '✅ Compliance Suite' },
        { id: 'sop-engine', icon: ClipboardList, label: '📋 SOP Engine' },
        { id: 'training-mode', icon: Users, label: '🎓 Training Mode' },
      ]
    },
    {
      title: "🎯 Outreach",
      items: [
        { id: 'website-intelligence', icon: Stethoscope, label: '🔍 Website Intel' },
        { id: 'pattern-library', icon: BarChart3, label: '📊 Pattern Library' },
        { id: 'cold-email-settings', icon: Settings, label: '⚙️ Email Settings' },
      ]
    },
    {
      title: "🤖 Agents",
      items: [
        { id: 'control-center', icon: Cpu, label: 'Control Center' },
        { id: 'sniper', icon: Target, label: '🎯 Sniper' },
        { id: 'dm-inbox', icon: MessageSquare, label: '💬 DM Closer' },
        { id: 'chat', icon: MessageSquare, label: 'Chat' },
        { id: 'agent', icon: Bot, label: 'Income Agent' },
        { id: 'swarm', icon: Network, label: 'Agent Swarm' },
        { id: 'orchestrator', icon: Brain, label: 'Orchestrator' },
        { id: 'execution', icon: Zap, label: 'Execution Engine' },
        { id: 'triggers', icon: Workflow, label: 'Workflow Triggers' },
        { id: 'workflow-templates', icon: Factory, label: '📋 Workflow Templates' },
        { id: 'advanced-scoring', icon: Target, label: '🎯 EAR Scoring' },
      ]
    },
    {
      title: "🧠 Intelligence",
      items: [
        { id: 'hive-mind', icon: Share2, label: '🐝 Hive Mind' },
        { id: 'shadow-mode', icon: Eye, label: '👤 Shadow Mode' },
        { id: 'mystery-shopper', icon: Search, label: '🕵️ Mystery Shopper' },
        { id: 'boardroom', icon: UsersRound, label: '🏛️ Boardroom' },
      ]
    },
    {
      title: "🔄 Automation",
      items: [
        { id: 'lazarus-engine', icon: Skull, label: '💀 Lazarus Engine' },
        { id: 'churn-guard', icon: CreditCard, label: '💳 Churn Guard' },
        { id: 'review-magnet', icon: MessageCircle, label: '⭐ Review Magnet' },
        { id: 'price-surgeon', icon: Scissors, label: '✂️ Price Surgeon' },
      ]
    },
    {
      title: "📝 Content",
      items: [
        { id: 'factory', icon: Factory, label: 'Content Factory' },
        { id: 'trends', icon: TrendingUp, label: 'Trend Scouter' },
        { id: 'pipeline', icon: Users, label: 'Lead Pipeline' },
      ]
    },
    {
      title: "💵 Revenue",
      items: [
        { id: 'revenue', icon: DollarSign, label: 'Revenue' },
        { id: 'revenue-features', icon: Target, label: 'Revenue Tools' },
        { id: 'approvals', icon: ShieldCheck, label: 'HITL Approvals' },
        { id: 'decisions', icon: ClipboardList, label: 'Decisions' },
        { id: 'analytics', icon: BarChart3, label: 'Analytics' },
      ]
    },
    {
      title: "⚙️ Settings",
      items: [
        { id: 'memory', icon: Database, label: 'Memory Vault' },
        { id: 'apikeys', icon: Key, label: 'API Keys' },
        { id: 'integrations', icon: Link, label: 'Integrations (Legacy)' },
        { id: 'settings', icon: Settings, label: 'Settings' },
        { id: 'templates', icon: Factory, label: '📋 Templates' },
      ],
      defaultOpen: true
    }
  ];

  return (
    <nav className={cn(
      "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 flex flex-col",
      isSidebarOpen ? "w-64" : "w-0 md:w-16 overflow-hidden"
    )}>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-background rounded-lg border border-border"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <img 
          src={logo} 
          alt="Alpha Vision Logo" 
          className="w-10 h-10 rounded-lg"
        />
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-serif text-xl font-semibold gradient-text"
            >
              Alpha Vision
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-sidebar-border space-y-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full justify-start gap-2",
            !isSidebarOpen && "justify-center px-2"
          )}
          onClick={() => setShowCheckIn(true)}
        >
          <Heart className="w-4 h-4 text-pink-400" />
          {isSidebarOpen && <span>Check In</span>}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full justify-start gap-2",
            !isSidebarOpen && "justify-center px-2"
          )}
          onClick={() => setShowOutcomeLogger(true)}
        >
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          {isSidebarOpen && <span>Log Outcome</span>}
        </Button>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {navSections.map((section) => {
          const sectionKey = section.title.toLowerCase().replace(/[^a-z]/g, '');
          const isOpen = openSections[sectionKey] ?? section.defaultOpen ?? false;
          
          return (
            <div key={section.title} className="mb-2">
              {/* Section Header */}
              {isSidebarOpen ? (
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  <span>{section.title}</span>
                  {isOpen ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              ) : (
                <div className="h-px bg-sidebar-border my-2" />
              )}
              
              {/* Section Items */}
              <AnimatePresence>
                {(isOpen || !isSidebarOpen) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveView(item.id as any)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                          activeView === item.id 
                            ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <AnimatePresence>
                          {isSidebarOpen && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="text-sm"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Runway Indicator */}
      <RunwayIndicator isOpen={isSidebarOpen} />

      {/* Sign Out */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={signOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-sm font-medium"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </nav>
  );
}

function RunwayIndicator({ isOpen }: { isOpen: boolean }) {
  const { runwayMonths } = useAlphaVisionStore();
  
  const getRunwayStatus = () => {
    if (runwayMonths >= 12) return { color: 'bg-green-500', label: 'Growth Mode' };
    if (runwayMonths >= 9) return { color: 'bg-yellow-500', label: 'Healthy' };
    if (runwayMonths >= 6) return { color: 'bg-orange-500', label: 'Warning' };
    return { color: 'bg-red-500', label: 'Critical' };
  };

  const status = getRunwayStatus();

  return (
    <div className="p-3 border-t border-sidebar-border">
      <div className={cn(
        "p-3 rounded-lg bg-muted/50",
        !isOpen && "flex items-center justify-center"
      )}>
        {isOpen ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Runway Protected</span>
              <span className={cn("w-2 h-2 rounded-full animate-pulse", status.color)} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold gradient-text">{runwayMonths}</span>
              <span className="text-sm text-muted-foreground">months</span>
            </div>
            <span className="text-xs text-muted-foreground">{status.label}</span>
          </>
        ) : (
          <div className="text-center">
            <span className={cn("w-2 h-2 rounded-full animate-pulse inline-block mb-1", status.color)} />
            <span className="text-lg font-bold gradient-text block">{runwayMonths}</span>
          </div>
        )}
      </div>
    </div>
  );
}
