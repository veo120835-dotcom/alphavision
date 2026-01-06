import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link2, Check, ArrowRight, Mail, Calendar, BarChart3, MessageSquare,
  Zap, Database, CreditCard, Webhook, ExternalLink, AlertCircle, BookOpen,
  Eye, EyeOff, RefreshCw, Settings2, Clock, Users, Video, Mic, FileText,
  Linkedin, Twitter, Instagram, Youtube, Cloud, Building2, Wallet, Calculator,
  Timer, Layers, MousePointer, HardDrive, Box, Briefcase, FileSignature,
  UserPlus, Share2, GitBranch, Activity, Shield, TrendingUp, Brain, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, any> = {
  CreditCard, Wallet, Calculator, Building2, Zap, Users, Cloud, GitBranch,
  Calendar, Clock, Timer, Linkedin, Twitter, Instagram, Youtube, BarChart3,
  Layers, MousePointer, Video, FileText, Mic, Mail, MessageSquare, BookOpen,
  HardDrive, Box, Webhook, Share2, UserPlus, Briefcase, FileSignature
};

interface IntegrationDefinition {
  id: string;
  integration_key: string;
  name: string;
  description: string;
  category: string;
  priority: number;
  is_required: boolean;
  is_read_only: boolean;
  data_types_collected: string[];
  ai_capabilities: string[];
  setup_url: string | null;
  icon_name: string;
  secret_keys: string[];
  oauth_required: boolean;
  status: string;
}

interface IntegrationConnection {
  id: string;
  integration_key: string;
  status: string;
  last_sync_at: string | null;
  is_active: boolean;
}

const categoryInfo: Record<string, { label: string; description: string; icon: any; priority: number }> = {
  financial: { 
    label: "Financial Systems", 
    description: "Real revenue, cash flow, margins, burn rate", 
    icon: CreditCard,
    priority: 1
  },
  crm: { 
    label: "CRM & Pipeline", 
    description: "Leads, deals, objections, close rates", 
    icon: Users,
    priority: 2
  },
  calendar: { 
    label: "Calendar & Time", 
    description: "Revenue per hour, meeting ROI, burnout risk", 
    icon: Calendar,
    priority: 3
  },
  communication: { 
    label: "Communication", 
    description: "Emails, calls, transcripts, sentiment", 
    icon: MessageSquare,
    priority: 4
  },
  social: { 
    label: "Social Platforms", 
    description: "Content performance, demand signals", 
    icon: Share2,
    priority: 5
  },
  analytics: { 
    label: "Website Analytics", 
    description: "Funnels, conversions, friction points", 
    icon: BarChart3,
    priority: 6
  },
  knowledge: { 
    label: "Knowledge Repos", 
    description: "Docs, SOPs, institutional memory", 
    icon: BookOpen,
    priority: 7
  },
  automation: { 
    label: "Automation", 
    description: "Execution, workflows, rollback", 
    icon: Webhook,
    priority: 8
  },
  talent: { 
    label: "Talent & Hiring", 
    description: "Hire timing, role design", 
    icon: UserPlus,
    priority: 9
  },
  legal: { 
    label: "Contracts & Legal", 
    description: "E-signatures, faster closes", 
    icon: FileSignature,
    priority: 10
  }
};

export function IntegrationsHub() {
  const [definitions, setDefinitions] = useState<IntegrationDefinition[]>([]);
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [passiveMode, setPassiveMode] = useState(false);
  const { organization } = useOrganization();

  useEffect(() => {
    fetchIntegrations();
  }, [organization?.id]);

  const fetchIntegrations = async () => {
    try {
      // Fetch integration definitions
      const { data: defs, error: defsError } = await supabase
        .from('integration_definitions')
        .select('*')
        .order('priority', { ascending: false });

      if (defsError) throw defsError;
      setDefinitions(defs || []);

      // Fetch user's connections if org exists
      if (organization?.id) {
        const { data: conns, error: connsError } = await supabase
          .from('integration_connections')
          .select('*')
          .eq('organization_id', organization.id);

        if (connsError) throw connsError;
        setConnections(conns || []);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (integrationKey: string) => {
    const def = definitions.find(d => d.integration_key === integrationKey);
    if (!def || !organization?.id) return;

    setConnecting(integrationKey);

    try {
      // Check if connection already exists
      const existingConn = connections.find(c => c.integration_key === integrationKey);
      
      if (existingConn) {
        // Update existing connection
        const { error } = await supabase
          .from('integration_connections')
          .update({ 
            status: 'connected', 
            connected_at: new Date().toISOString(),
            is_active: true 
          })
          .eq('id', existingConn.id);

        if (error) throw error;
      } else {
        // Create new connection
        const { error } = await supabase
          .from('integration_connections')
          .insert({
            organization_id: organization.id,
            integration_key: integrationKey,
            status: 'connected',
            connected_at: new Date().toISOString(),
            is_active: true
          });

        if (error) throw error;
      }

      toast.success(`${def.name} connected successfully`);
      fetchIntegrations();
    } catch (error) {
      console.error('Error connecting:', error);
      toast.error('Failed to connect integration');
    } finally {
      setConnecting(null);
    }
  };

  const handleSync = async (integrationKey: string) => {
    if (!organization?.id) return;
    
    setSyncing(integrationKey);
    
    try {
      // Log sync attempt
      await supabase
        .from('integration_sync_logs')
        .insert({
          organization_id: organization.id,
          integration_key: integrationKey,
          sync_type: 'manual',
          status: 'started'
        });

      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update connection last_sync_at
      await supabase
        .from('integration_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('organization_id', organization.id)
        .eq('integration_key', integrationKey);

      toast.success('Sync completed');
      fetchIntegrations();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Sync failed');
    } finally {
      setSyncing(null);
    }
  };

  const getConnectionStatus = (integrationKey: string) => {
    return connections.find(c => c.integration_key === integrationKey);
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Link2;
  };

  // Group integrations by category
  const groupedIntegrations = definitions.reduce((acc, def) => {
    if (!acc[def.category]) acc[def.category] = [];
    acc[def.category].push(def);
    return acc;
  }, {} as Record<string, IntegrationDefinition[]>);

  // Sort categories by priority
  const sortedCategories = Object.keys(groupedIntegrations).sort((a, b) => {
    return (categoryInfo[a]?.priority || 99) - (categoryInfo[b]?.priority || 99);
  });

  // Calculate overall progress
  const requiredIntegrations = definitions.filter(d => d.is_required);
  const connectedRequired = requiredIntegrations.filter(d => 
    getConnectionStatus(d.integration_key)?.status === 'connected'
  ).length;
  const overallProgress = requiredIntegrations.length > 0 
    ? (connectedRequired / requiredIntegrations.length) * 100 
    : 0;

  const totalConnected = connections.filter(c => c.status === 'connected').length;
  const totalAvailable = definitions.filter(d => d.status === 'available').length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
            Integration Hub
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Connect your business systems so Alpha Vision can observe, learn, and act autonomously.
            The less you type, the smarter it becomes.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{totalConnected}/{totalAvailable} Connected</span>
          </div>
        </div>
      </div>

      {/* Passive Observation Mode Banner */}
      <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Passive Observation Mode</h3>
                <p className="text-sm text-muted-foreground">
                  AI watches, learns, and prepares decisions. Alerts only when necessary.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-sm",
                passiveMode ? "text-purple-400" : "text-muted-foreground"
              )}>
                {passiveMode ? "Active" : "Disabled"}
              </span>
              <Switch 
                checked={passiveMode} 
                onCheckedChange={setPassiveMode}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Progress */}
      {overallProgress < 100 && (
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  Required Integrations
                </h3>
                <p className="text-sm text-muted-foreground">
                  {connectedRequired}/{requiredIntegrations.length} required integrations connected
                </p>
              </div>
              <span className="text-2xl font-bold">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2 mb-4" />
            <div className="flex gap-2 flex-wrap">
              {requiredIntegrations
                .filter(d => getConnectionStatus(d.integration_key)?.status !== 'connected')
                .map(def => {
                  const Icon = getIcon(def.icon_name);
                  return (
                    <Button
                      key={def.integration_key}
                      size="sm"
                      variant="outline"
                      onClick={() => handleConnect(def.integration_key)}
                      disabled={connecting === def.integration_key}
                      className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      Setup {def.name}
                    </Button>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Capabilities Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">AI Capabilities Unlocked</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(
              definitions
                .filter(d => getConnectionStatus(d.integration_key)?.status === 'connected')
                .flatMap(d => d.ai_capabilities)
            )).map(cap => (
              <Badge key={cap} variant="secondary" className="text-xs">
                {cap.replace(/_/g, ' ')}
              </Badge>
            ))}
            {totalConnected === 0 && (
              <span className="text-sm text-muted-foreground">
                Connect integrations to unlock AI capabilities
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            All
          </TabsTrigger>
          {sortedCategories.map(cat => {
            const info = categoryInfo[cat];
            const Icon = info?.icon || Link2;
            const catConnected = groupedIntegrations[cat]?.filter(
              d => getConnectionStatus(d.integration_key)?.status === 'connected'
            ).length || 0;
            return (
              <TabsTrigger 
                key={cat} 
                value={cat}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="w-4 h-4 mr-1" />
                {info?.label || cat}
                {catConnected > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {catConnected}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* All Integrations View */}
        <TabsContent value="all" className="space-y-8">
          {sortedCategories.map(cat => (
            <IntegrationCategory
              key={cat}
              category={cat}
              integrations={groupedIntegrations[cat]}
              getConnectionStatus={getConnectionStatus}
              getIcon={getIcon}
              connecting={connecting}
              syncing={syncing}
              onConnect={handleConnect}
              onSync={handleSync}
            />
          ))}
        </TabsContent>

        {/* Individual Category Views */}
        {sortedCategories.map(cat => (
          <TabsContent key={cat} value={cat}>
            <IntegrationCategory
              category={cat}
              integrations={groupedIntegrations[cat]}
              getConnectionStatus={getConnectionStatus}
              getIcon={getIcon}
              connecting={connecting}
              syncing={syncing}
              onConnect={handleConnect}
              onSync={handleSync}
              expanded
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* What Gets Unlocked Section */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            What The AI Learns From Your Integrations
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background/50">
              <h4 className="font-medium mb-2">From Financial Data</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Real revenue (not hypotheticals)</li>
                <li>• Burn rate & runway</li>
                <li>• Customer LTV & churn</li>
                <li>• Budget allocation</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <h4 className="font-medium mb-2">From CRM & Calendar</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Deal velocity & objections</li>
                <li>• Revenue per hour</li>
                <li>• Meeting ROI</li>
                <li>• Burnout risk signals</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <h4 className="font-medium mb-2">From Content & Calls</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• What actually resonates</li>
                <li>• Buyer language patterns</li>
                <li>• Demand signals</li>
                <li>• Deal killers & accelerators</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Integration Category Component
interface IntegrationCategoryProps {
  category: string;
  integrations: IntegrationDefinition[];
  getConnectionStatus: (key: string) => IntegrationConnection | undefined;
  getIcon: (name: string) => any;
  connecting: string | null;
  syncing: string | null;
  onConnect: (key: string) => void;
  onSync: (key: string) => void;
  expanded?: boolean;
}

function IntegrationCategory({
  category,
  integrations,
  getConnectionStatus,
  getIcon,
  connecting,
  syncing,
  onConnect,
  onSync,
  expanded = false
}: IntegrationCategoryProps) {
  const info = categoryInfo[category];
  const CategoryIcon = info?.icon || Link2;
  
  const connected = integrations.filter(
    d => getConnectionStatus(d.integration_key)?.status === 'connected'
  ).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <CategoryIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">{info?.label || category}</h2>
          <p className="text-sm text-muted-foreground">{info?.description}</p>
        </div>
        <Badge variant="outline" className="ml-auto">
          {connected}/{integrations.length}
        </Badge>
      </div>

      <div className={cn(
        "grid gap-4",
        expanded ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"
      )}>
        {integrations.map((def, index) => {
          const Icon = getIcon(def.icon_name);
          const conn = getConnectionStatus(def.integration_key);
          const isConnected = conn?.status === 'connected';
          const isComingSoon = def.status === 'coming_soon';

          return (
            <motion.div
              key={def.integration_key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={cn(
                "h-full transition-all duration-200",
                isConnected && "border-green-500/30",
                def.is_required && !isConnected && "border-amber-500/30",
                isComingSoon && "opacity-60"
              )}>
                <CardContent className={cn(
                  "p-4",
                  expanded && "p-5"
                )}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isConnected ? "bg-green-500/10" : "bg-primary/10"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          isConnected ? "text-green-400" : "text-primary"
                        )} />
                      </div>
                      <div>
                        <h3 className="font-medium">{def.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {def.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Data Types */}
                  {expanded && def.data_types_collected.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Collects:</p>
                      <div className="flex flex-wrap gap-1">
                        {def.data_types_collected.slice(0, 5).map(dt => (
                          <Badge key={dt} variant="outline" className="text-xs">
                            {dt}
                          </Badge>
                        ))}
                        {def.data_types_collected.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{def.data_types_collected.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <Badge className="bg-green-500/20 text-green-400 border-0">
                          <Check className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      ) : def.is_required ? (
                        <Badge className="bg-amber-500/20 text-amber-400 border-0">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Required
                        </Badge>
                      ) : isComingSoon ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Coming Soon
                        </Badge>
                      ) : def.is_read_only ? (
                        <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                          <Eye className="w-3 h-3 mr-1" />
                          Read-Only
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      {isConnected && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSync(def.integration_key)}
                          disabled={syncing === def.integration_key}
                          className="h-8"
                        >
                          <RefreshCw className={cn(
                            "w-3 h-3",
                            syncing === def.integration_key && "animate-spin"
                          )} />
                        </Button>
                      )}
                      
                      {!isConnected && !isComingSoon && (
                        <Button
                          size="sm"
                          onClick={() => onConnect(def.integration_key)}
                          disabled={connecting === def.integration_key}
                          className="h-8"
                        >
                          {connecting === def.integration_key ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              Connect
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Last Sync */}
                  {isConnected && conn?.last_sync_at && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last sync: {new Date(conn.last_sync_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
