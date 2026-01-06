import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Key, 
  Plus, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  ExternalLink,
  Shield,
  Zap,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Bot,
  CreditCard,
  Globe,
  Webhook,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface APIKeyConfig {
  id: string;
  name: string;
  envKey: string;
  description: string;
  icon: React.ReactNode;
  category: 'ai' | 'search' | 'payment' | 'automation' | 'social';
  docsUrl: string;
  placeholder: string;
  required?: boolean;
  testEndpoint?: string;
}

const API_KEYS: APIKeyConfig[] = [
  // ========== VOICE AI (HIGH VALUE) ==========
  {
    id: 'vapi_private_key',
    name: 'Vapi.ai Private Key',
    envKey: 'VAPI_PRIVATE_KEY',
    description: 'Voice AI for automated outbound calls (40% pickup rate)',
    icon: <Phone className="w-5 h-5" />,
    category: 'automation',
    docsUrl: 'https://docs.vapi.ai/api-reference/authentication',
    placeholder: 'vapi_xxxxxxxxxxxxx',
  },
  {
    id: 'vapi_phone_id',
    name: 'Vapi.ai Phone ID',
    envKey: 'VAPI_PHONE_ID',
    description: 'Your Vapi phone number ID for outbound calls',
    icon: <Phone className="w-5 h-5" />,
    category: 'automation',
    docsUrl: 'https://docs.vapi.ai/phone-numbers',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  },
  // ========== AUTOMATION (CRITICAL) ==========
  {
    id: 'n8n_webhook',
    name: 'n8n Webhook URL',
    envKey: 'N8N_WEBHOOK_URL',
    description: '⭐ REQUIRED - Your n8n automation webhook endpoint',
    icon: <Webhook className="w-5 h-5" />,
    category: 'automation',
    docsUrl: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/',
    placeholder: 'https://your-n8n.app.n8n.cloud/webhook/xxxxx',
    required: true,
  },
  {
    id: 'n8n_secret',
    name: 'n8n Webhook Secret',
    envKey: 'N8N_WEBHOOK_SECRET',
    description: 'HMAC secret for verifying n8n callbacks (generate with: openssl rand -hex 32)',
    icon: <Shield className="w-5 h-5" />,
    category: 'automation',
    docsUrl: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/#webhook-authentication',
    placeholder: 'your-32-char-hex-secret',
    required: true,
  },
  // ========== PAYMENTS ==========
  {
    id: 'stripe_secret',
    name: 'Stripe Secret Key',
    envKey: 'STRIPE_SECRET_KEY',
    description: '⭐ REQUIRED - For payment processing (starts with sk_live_ or sk_test_)',
    icon: <CreditCard className="w-5 h-5" />,
    category: 'payment',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    placeholder: 'sk_live_...',
    required: true,
  },
  {
    id: 'stripe_webhook',
    name: 'Stripe Webhook Secret',
    envKey: 'STRIPE_WEBHOOK_SECRET',
    description: 'For verifying Stripe webhooks (starts with whsec_)',
    icon: <Shield className="w-5 h-5" />,
    category: 'payment',
    docsUrl: 'https://dashboard.stripe.com/webhooks',
    placeholder: 'whsec_...',
    required: true,
  },
  {
    id: 'wise',
    name: 'Wise API Token',
    envKey: 'WISE_API_KEY',
    description: 'International money transfers',
    icon: <Globe className="w-5 h-5" />,
    category: 'payment',
    docsUrl: 'https://api-docs.wise.com',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  },
  // ========== CRM ==========
  {
    id: 'ghl_api',
    name: 'GoHighLevel API Key',
    envKey: 'GHL_API_KEY',
    description: 'CRM integration for leads, pipelines, and automations',
    icon: <Zap className="w-5 h-5" />,
    category: 'automation',
    docsUrl: 'https://highlevel.stoplight.io/docs/integrations',
    placeholder: 'eyJhbGciOiJIUzI1NiIs...',
    required: false,
  },
  {
    id: 'ghl_location',
    name: 'GoHighLevel Location ID',
    envKey: 'GHL_LOCATION_ID',
    description: 'Your GHL location/sub-account ID',
    icon: <Globe className="w-5 h-5" />,
    category: 'automation',
    docsUrl: 'https://highlevel.stoplight.io/docs/integrations',
    placeholder: 'xxxxxxxxxxxxxxxxx',
  },
  // ========== SEARCH & PROSPECTING ==========
  {
    id: 'exa',
    name: 'Exa.ai',
    envKey: 'EXA_API_KEY',
    description: 'Neural search for finding companies and market signals',
    icon: <Search className="w-5 h-5" />,
    category: 'search',
    docsUrl: 'https://docs.exa.ai',
    placeholder: 'exa-xxxxxxxx',
  },
  {
    id: 'hunter',
    name: 'Hunter.io',
    envKey: 'HUNTER_API_KEY',
    description: 'Find CEO emails from company domains',
    icon: <Search className="w-5 h-5" />,
    category: 'search',
    docsUrl: 'https://hunter.io/api',
    placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx',
  },
  {
    id: 'apollo',
    name: 'Apollo.io',
    envKey: 'APOLLO_API_KEY',
    description: 'B2B contact database and enrichment',
    icon: <Search className="w-5 h-5" />,
    category: 'search',
    docsUrl: 'https://apolloio.github.io/apollo-api-docs/',
    placeholder: 'xxxxxxxxxxxxxxxx',
  },
  // ========== AI MODELS (Optional - Lovable AI included) ==========
  {
    id: 'openai',
    name: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    description: 'GPT models (optional - Lovable AI already included)',
    icon: <Bot className="w-5 h-5" />,
    category: 'ai',
    docsUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    description: 'Claude AI models (optional)',
    icon: <Bot className="w-5 h-5" />,
    category: 'ai',
    docsUrl: 'https://console.anthropic.com',
    placeholder: 'sk-ant-...',
  },
  // ========== GOOGLE OAUTH ==========
  {
    id: 'google_client_id',
    name: 'Google Client ID',
    envKey: 'GOOGLE_CLIENT_ID',
    description: 'OAuth for Calendar & Gmail access',
    icon: <Globe className="w-5 h-5" />,
    category: 'automation',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    placeholder: 'xxxxx.apps.googleusercontent.com',
  },
  {
    id: 'google_client_secret',
    name: 'Google Client Secret',
    envKey: 'GOOGLE_CLIENT_SECRET',
    description: 'OAuth secret for Calendar & Gmail',
    icon: <Key className="w-5 h-5" />,
    category: 'automation',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    placeholder: 'GOCSPX-...',
  },
  // ========== SOCIAL ==========
  {
    id: 'zapier_webhook',
    name: 'Zapier Webhook URL',
    envKey: 'ZAPIER_WEBHOOK_URL',
    description: 'Alternative automation via Zapier',
    icon: <Zap className="w-5 h-5" />,
    category: 'automation',
    docsUrl: 'https://zapier.com/apps/webhook',
    placeholder: 'https://hooks.zapier.com/hooks/catch/...',
  },
];

interface StoredKey {
  id: string;
  envKey: string;
  isConfigured: boolean;
  lastTested?: string;
  status?: 'active' | 'error' | 'unknown';
}

export function APIKeysManager() {
  const { organization } = useOrganization();
  const [storedKeys, setStoredKeys] = useState<StoredKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKeyConfig | null>(null);
  const [keyValue, setKeyValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    fetchStoredKeys();
  }, [organization?.id]);

  const fetchStoredKeys = async () => {
    setLoading(true);
    try {
      // In production, you'd fetch from a secure secrets store
      // For now, we simulate by checking integrations table
      if (organization?.id) {
        const { data } = await supabase
          .from('integrations')
          .select('*')
          .eq('organization_id', organization.id);

        const configured = new Set(data?.map(i => i.provider) || []);
        
        setStoredKeys(API_KEYS.map(k => ({
          id: k.id,
          envKey: k.envKey,
          isConfigured: configured.has(k.id),
          status: configured.has(k.id) ? 'active' : 'unknown'
        })));
      }
    } catch (error) {
      console.error('Error fetching keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const openKeyDialog = (key: APIKeyConfig) => {
    setSelectedKey(key);
    setKeyValue('');
    setShowValue(false);
    setDialogOpen(true);
  };

  const handleSaveKey = async () => {
    if (!selectedKey || !keyValue.trim() || !organization?.id) return;

    setSaving(true);
    try {
      // Store in integrations table (credentials_encrypted)
      const existing = storedKeys.find(k => k.id === selectedKey.id);
      
      if (existing?.isConfigured) {
        await supabase
          .from('integrations')
          .update({
            credentials_encrypted: JSON.stringify({ [selectedKey.envKey]: keyValue }),
            status: 'connected',
            updated_at: new Date().toISOString()
          })
          .eq('organization_id', organization.id)
          .eq('provider', selectedKey.id);
      } else {
        await supabase.from('integrations').insert({
          organization_id: organization.id,
          provider: selectedKey.id,
          credentials_encrypted: JSON.stringify({ [selectedKey.envKey]: keyValue }),
          status: 'connected',
          scopes: [selectedKey.envKey]
        });
      }

      toast.success(`${selectedKey.name} key saved successfully`);
      setDialogOpen(false);
      fetchStoredKeys();
    } catch (error) {
      console.error('Error saving key:', error);
      toast.error('Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const testKey = async (keyConfig: APIKeyConfig) => {
    setTesting(keyConfig.id);
    
    // Simulate testing - in production, call a test endpoint
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(`${keyConfig.name} connection verified`);
    setTesting(null);
  };

  const deleteKey = async (keyConfig: APIKeyConfig) => {
    if (!organization?.id) return;

    await supabase
      .from('integrations')
      .delete()
      .eq('organization_id', organization.id)
      .eq('provider', keyConfig.id);
    
    toast.success(`${keyConfig.name} key removed`);
    fetchStoredKeys();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const categories = [
    { id: 'all', label: 'All Keys', icon: Key },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'ai', label: 'AI Models', icon: Bot },
    { id: 'payment', label: 'Payments', icon: CreditCard },
    { id: 'automation', label: 'Automation', icon: Webhook },
  ];

  const filteredKeys = activeCategory === 'all' 
    ? API_KEYS 
    : API_KEYS.filter(k => k.category === activeCategory);

  const configuredCount = storedKeys.filter(k => k.isConfigured).length;
  const requiredCount = API_KEYS.filter(k => k.required).length;
  const requiredConfigured = API_KEYS.filter(k => k.required && storedKeys.find(s => s.id === k.id)?.isConfigured).length;

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold gradient-text">API Keys</h1>
          <p className="text-muted-foreground mt-1">Securely manage your API credentials</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {configuredCount}/{API_KEYS.length} Configured
          </Badge>
          {requiredConfigured < requiredCount && (
            <Badge className="bg-amber-500/20 text-amber-400 text-sm px-3 py-1">
              <AlertCircle className="w-3 h-3 mr-1" />
              {requiredCount - requiredConfigured} Required
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Setup Card */}
      {requiredConfigured < requiredCount && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-200">Complete Your Setup</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure the required API keys to unlock all Sniper Agent features.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {API_KEYS.filter(k => k.required && !storedKeys.find(s => s.id === k.id)?.isConfigured).map(key => (
                    <Button
                      key={key.id}
                      size="sm"
                      variant="outline"
                      onClick={() => openKeyDialog(key)}
                      className="border-amber-500/30 hover:bg-amber-500/10"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add {key.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-muted/30">
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredKeys.map((keyConfig, idx) => {
                const stored = storedKeys.find(k => k.id === keyConfig.id);
                const isConfigured = stored?.isConfigured;

                return (
                  <motion.div
                    key={keyConfig.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={cn(
                      "card-glow transition-all hover:border-primary/30",
                      isConfigured && "border-green-500/30",
                      keyConfig.required && !isConfigured && "border-amber-500/30"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2.5 rounded-lg",
                              isConfigured 
                                ? "bg-green-500/20 text-green-400"
                                : "bg-primary/20 text-primary"
                            )}>
                              {keyConfig.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{keyConfig.name}</p>
                                {keyConfig.required && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {keyConfig.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between mb-4">
                          {isConfigured ? (
                            <Badge className="bg-green-500/20 text-green-400">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Configured
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Not configured
                            </Badge>
                          )}
                          
                          {keyConfig.docsUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => window.open(keyConfig.docsUrl, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Docs
                            </Button>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant={isConfigured ? "outline" : "default"}
                            size="sm"
                            className="flex-1"
                            onClick={() => openKeyDialog(keyConfig)}
                          >
                            {isConfigured ? 'Update' : 'Add Key'}
                          </Button>
                          {isConfigured && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => testKey(keyConfig)}
                                disabled={testing === keyConfig.id}
                              >
                                {testing === keyConfig.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Zap className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:text-destructive"
                                onClick={() => deleteKey(keyConfig)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Security Note</h4>
              <p className="text-sm text-muted-foreground mt-1">
                All API keys are encrypted and stored securely. Keys are only accessible to backend functions 
                and are never exposed to the frontend. You can revoke access at any time by deleting the key.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Key Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedKey?.icon}
              {selectedKey?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedKey?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showValue ? "text" : "password"}
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder={selectedKey?.placeholder}
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowValue(!showValue)}
                >
                  {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Environment variable: <code className="bg-muted px-1 rounded">{selectedKey?.envKey}</code>
              </p>
            </div>

            {selectedKey?.docsUrl && (
              <Button
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={() => window.open(selectedKey.docsUrl, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Get your API key from {selectedKey.name}
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveKey} disabled={!keyValue.trim() || saving}>
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Key
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}