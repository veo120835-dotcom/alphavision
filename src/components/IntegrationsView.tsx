import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Link2, 
  Check, 
  ArrowRight, 
  Mail, 
  Calendar, 
  BarChart3,
  MessageSquare,
  Zap,
  Database,
  CreditCard,
  Webhook,
  ExternalLink,
  AlertCircle,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAlphaVisionStore } from "@/store/alpha-vision-store";
import { GHLConnectionFlow } from "./GHLConnectionFlow";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: typeof Link2;
  status: 'connected' | 'available' | 'coming_soon' | 'required' | 'oauth';
  category: 'automation' | 'crm' | 'email' | 'calendar' | 'analytics' | 'payment';
  setupUrl?: string;
  docsUrl?: string;
  secretKeys?: string[];
}

const integrations: Integration[] = [
  // REQUIRED - Automation
  {
    id: 'n8n',
    name: 'n8n (Required)',
    description: 'Automation engine - executes all AI-approved actions',
    icon: Webhook,
    status: 'required',
    category: 'automation',
    docsUrl: '/docs/N8N_COMPLETE_SETUP_GUIDE.md',
    secretKeys: ['N8N_WEBHOOK_URL', 'N8N_WEBHOOK_SECRET'],
  },
  // REQUIRED - Payments
  {
    id: 'stripe',
    name: 'Stripe (Required)',
    description: 'Payment processing, invoicing, and revenue tracking',
    icon: CreditCard,
    status: 'required',
    category: 'payment',
    setupUrl: 'https://dashboard.stripe.com/apikeys',
    secretKeys: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
  },
  // CRM - Now OAuth based
  {
    id: 'gohighlevel',
    name: 'GoHighLevel',
    description: 'CRM via OAuth - no API key needed',
    icon: Zap,
    status: 'oauth',
    category: 'crm',
  },
  // Email & Calendar
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send sequences and monitor replies',
    icon: Mail,
    status: 'available',
    category: 'email',
    secretKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Schedule availability and booking management',
    icon: Calendar,
    status: 'available',
    category: 'calendar',
    secretKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Import/export metrics and lightweight reporting',
    icon: Database,
    status: 'available',
    category: 'analytics',
    secretKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  },
  // Coming Soon
  {
    id: 'slack',
    name: 'Slack',
    description: 'Receive notifications and quick approvals',
    icon: MessageSquare,
    status: 'coming_soon',
    category: 'automation',
  },
  {
    id: 'meta-ads',
    name: 'Meta Ads',
    description: 'Budget adjustments and campaign management',
    icon: BarChart3,
    status: 'coming_soon',
    category: 'analytics',
  },
];

export function IntegrationsView() {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const { setActiveView } = useAlphaVisionStore();

  const handleConnect = async (id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;

    // If it has secret keys, navigate to API Keys page
    if (integration.secretKeys && integration.secretKeys.length > 0) {
      setActiveView('apikeys');
      toast.info(`Configure ${integration.name} API keys to connect`);
      return;
    }

    setConnecting(id);
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    setConnected(prev => new Set([...prev, id]));
    setConnecting(null);
    toast.success(`${integration.name} connected successfully`);
  };

  const openDocs = (integration: Integration) => {
    if (integration.docsUrl) {
      if (integration.docsUrl.startsWith('/')) {
        // Internal docs - show toast with info
        toast.info('Check the /docs folder for setup instructions');
      } else {
        window.open(integration.docsUrl, '_blank');
      }
    }
  };

  const getStatusBadge = (integration: Integration) => {
    if (connected.has(integration.id)) {
      return (
        <Badge className="bg-green-500/20 text-green-400">
          <Check className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    }
    if (integration.status === 'required') {
      return (
        <Badge className="bg-amber-500/20 text-amber-400">
          <AlertCircle className="w-3 h-3 mr-1" />
          Required
        </Badge>
      );
    }
    if (integration.status === 'coming_soon') {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Coming Soon
        </Badge>
      );
    }
    return null;
  };

  const requiredIntegrations = integrations.filter(i => i.status === 'required');
  const connectedRequired = requiredIntegrations.filter(i => connected.has(i.id)).length;
  const setupProgress = (connectedRequired / requiredIntegrations.length) * 100;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your tools to enable Alpha Vision to take actions on your behalf.
        </p>
      </div>

      {/* Setup Progress */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Setup Progress</h3>
              <p className="text-sm text-muted-foreground">
                {connectedRequired}/{requiredIntegrations.length} required integrations connected
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{Math.round(setupProgress)}%</span>
            </div>
          </div>
          <Progress value={setupProgress} className="h-2" />
          
          {setupProgress < 100 && (
            <div className="mt-4 flex gap-2">
              {requiredIntegrations.filter(i => !connected.has(i.id)).map(integration => (
                <Button
                  key={integration.id}
                  size="sm"
                  variant="outline"
                  onClick={() => handleConnect(integration.id)}
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                >
                  <integration.icon className="w-4 h-4 mr-2" />
                  Setup {integration.name.replace(' (Required)', '')}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-200">New to Alpha Vision?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Follow our step-by-step guide to connect n8n and start automating.
              </p>
              <Button 
                size="sm" 
                variant="link" 
                className="text-blue-400 p-0 h-auto mt-2"
                onClick={() => toast.info('Check docs/N8N_COMPLETE_SETUP_GUIDE.md for full instructions')}
              >
                View n8n Setup Guide →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Integrations */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          Required Integrations
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.filter(i => i.status === 'required').map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "transition-all duration-200 hover:border-primary/30",
                connected.has(integration.id) ? "border-green-500/30" : "border-amber-500/30"
              )}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-3 rounded-lg",
                        connected.has(integration.id) 
                          ? "bg-green-500/10" 
                          : "bg-amber-500/10"
                      )}>
                        <integration.icon className={cn(
                          "w-6 h-6",
                          connected.has(integration.id) ? "text-green-400" : "text-amber-400"
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {getStatusBadge(integration)}
                    
                    <div className="flex gap-2">
                      {integration.docsUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDocs(integration)}
                        >
                          <BookOpen className="w-4 h-4 mr-1" />
                          Docs
                        </Button>
                      )}
                      
                      {!connected.has(integration.id) && (
                        <Button
                          size="sm"
                          onClick={() => handleConnect(integration.id)}
                          disabled={connecting === integration.id}
                        >
                          {connecting === integration.id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-white rounded-full animate-spin" />
                              Setting up...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              Configure
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* GHL OAuth Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          CRM Integration
        </h2>
        <GHLConnectionFlow onConnectionChange={(connected) => {
          if (connected) {
            setConnected(prev => new Set([...prev, 'gohighlevel']));
          }
        }} />
      </div>

      {/* Optional Integrations */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Optional Integrations</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.filter(i => i.status !== 'required' && i.status !== 'oauth').map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                integration.status === 'coming_soon' && "opacity-60"
              )}
            >
              <Card className="h-full transition-all hover:border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <integration.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{integration.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{integration.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {getStatusBadge(integration)}
                    
                    {integration.status !== 'coming_soon' && !connected.has(integration.id) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConnect(integration.id)}
                        disabled={connecting === integration.id}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            About Tool Permissions
          </h4>
          <p className="text-sm text-muted-foreground">
            Alpha Vision requires explicit permission for every external action. In Advisor and Operator mode, 
            actions are drafted for your approval. In Autopilot mode, actions execute within your defined caps 
            and are fully auditable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
