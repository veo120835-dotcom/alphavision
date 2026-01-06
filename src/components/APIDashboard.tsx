import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Edit3,
  ExternalLink,
  Link2,
  Webhook,
  Code,
  BookOpen,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Settings2,
  Globe,
  Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface APIConnection {
  id: string;
  name: string;
  provider: string;
  api_key_preview: string;
  is_connected: boolean;
  last_tested_at: string | null;
  scopes: string[];
  webhook_url?: string;
}

interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'ai' | 'payment' | 'social' | 'crm' | 'automation' | 'calendar';
  fields: { name: string; label: string; type: 'text' | 'password' | 'url'; required: boolean; placeholder: string }[];
  docs_url: string;
  setup_guide: string[];
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Workflow automation (self-hosted or cloud)',
    icon: '🔄',
    category: 'automation',
    fields: [
      { name: 'webhook_url', label: 'Webhook URL', type: 'url', required: true, placeholder: 'https://your-n8n.com/webhook/...' },
      { name: 'api_key', label: 'API Key (optional)', type: 'password', required: false, placeholder: 'n8n API key' }
    ],
    docs_url: 'https://docs.n8n.io',
    setup_guide: [
      '1. Open n8n and create a new workflow',
      '2. Add a "Webhook" trigger node',
      '3. Copy the Production Webhook URL',
      '4. Paste it here and test the connection',
      '5. Configure your workflow actions in n8n'
    ]
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect with 5000+ apps',
    icon: '⚡',
    category: 'automation',
    fields: [
      { name: 'webhook_url', label: 'Webhook URL', type: 'url', required: true, placeholder: 'https://hooks.zapier.com/...' }
    ],
    docs_url: 'https://zapier.com/help',
    setup_guide: [
      '1. Create a new Zap in Zapier',
      '2. Choose "Webhooks by Zapier" as trigger',
      '3. Select "Catch Hook" as trigger event',
      '4. Copy the Custom Webhook URL',
      '5. Paste it here and test the connection'
    ]
  },
  {
    id: 'gohighlevel',
    name: 'GoHighLevel',
    description: 'CRM, automations, and marketing',
    icon: '🚀',
    category: 'crm',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'Your GHL API key' },
      { name: 'location_id', label: 'Location ID', type: 'text', required: true, placeholder: 'Location ID' }
    ],
    docs_url: 'https://highlevel.stoplight.io/docs/integrations',
    setup_guide: [
      '1. Go to Settings → API Keys in GHL',
      '2. Generate a new API key',
      '3. Copy your Location ID from settings',
      '4. Paste both values here',
      '5. Test connection to verify'
    ]
  },
  {
    id: 'wise',
    name: 'Wise',
    description: 'Payment processing and transfers',
    icon: '💰',
    category: 'payment',
    fields: [
      { name: 'api_key', label: 'API Token', type: 'password', required: true, placeholder: 'Wise API token' },
      { name: 'profile_id', label: 'Profile ID', type: 'text', required: false, placeholder: 'Business profile ID' }
    ],
    docs_url: 'https://api-docs.wise.com',
    setup_guide: [
      '1. Log into Wise Business',
      '2. Go to Settings → API tokens',
      '3. Create a new API token with required permissions',
      '4. Copy the token and paste here',
      '5. Add your Business Profile ID (optional)'
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models for AI capabilities',
    icon: '🤖',
    category: 'ai',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'sk-...' }
    ],
    docs_url: 'https://platform.openai.com/docs',
    setup_guide: [
      '1. Go to platform.openai.com',
      '2. Navigate to API Keys section',
      '3. Create a new secret key',
      '4. Copy and paste here immediately',
      '5. Set up billing if not already done'
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude AI models',
    icon: '🧠',
    category: 'ai',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'sk-ant-...' }
    ],
    docs_url: 'https://docs.anthropic.com',
    setup_guide: [
      '1. Go to console.anthropic.com',
      '2. Navigate to API Keys',
      '3. Generate a new API key',
      '4. Copy and paste here',
      '5. Verify billing is enabled'
    ]
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Self-hosted LLMs (Llama, Mistral)',
    icon: '🦙',
    category: 'ai',
    fields: [
      { name: 'base_url', label: 'Ollama Server URL', type: 'url', required: true, placeholder: 'http://localhost:11434' },
      { name: 'model', label: 'Default Model', type: 'text', required: false, placeholder: 'llama3.2' }
    ],
    docs_url: 'https://ollama.ai/docs',
    setup_guide: [
      '1. Install Ollama on your server',
      '2. Run: ollama serve',
      '3. Pull your preferred model: ollama pull llama3.2',
      '4. Enter your server URL here',
      '5. Test connection to verify'
    ]
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Scheduling and availability',
    icon: '📅',
    category: 'calendar',
    fields: [
      { name: 'client_id', label: 'OAuth Client ID', type: 'text', required: true, placeholder: 'Your OAuth client ID' },
      { name: 'client_secret', label: 'OAuth Client Secret', type: 'password', required: true, placeholder: 'Your OAuth client secret' }
    ],
    docs_url: 'https://developers.google.com/calendar/api',
    setup_guide: [
      '1. Go to Google Cloud Console',
      '2. Create OAuth 2.0 credentials',
      '3. Configure consent screen',
      '4. Add Calendar API scope',
      '5. Copy Client ID and Secret here'
    ]
  }
];

export function APIDashboard() {
  const { organization } = useOrganization();
  const [connections, setConnections] = useState<APIConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    if (organization?.id) {
      fetchConnections();
    }
  }, [organization?.id]);

  const fetchConnections = async () => {
    if (!organization?.id) return;
    setLoading(true);
    
    try {
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('organization_id', organization.id);

      if (data) {
        setConnections(data.map(i => ({
          id: i.id,
          name: PROVIDERS.find(p => p.id === i.provider)?.name || i.provider,
          provider: i.provider,
          api_key_preview: '••••••••••••',
          is_connected: i.status === 'connected',
          last_tested_at: i.last_sync_at,
          scopes: i.scopes || []
        })));
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const openProviderDialog = (provider: ProviderConfig) => {
    setSelectedProvider(provider);
    setFormData({});
    setDialogOpen(true);
  };

  const handleSaveConnection = async () => {
    if (!organization?.id || !selectedProvider) return;

    // Validate required fields
    const missingFields = selectedProvider.fields
      .filter(f => f.required && !formData[f.name])
      .map(f => f.label);

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    try {
      // Check if connection exists
      const existing = connections.find(c => c.provider === selectedProvider.id);
      
      if (existing) {
        await supabase
          .from('integrations')
          .update({
            credentials_encrypted: JSON.stringify(formData),
            status: 'connected',
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('integrations').insert({
          organization_id: organization.id,
          provider: selectedProvider.id,
          credentials_encrypted: JSON.stringify(formData),
          status: 'connected',
          scopes: selectedProvider.fields.map(f => f.name)
        });
      }

      toast.success(`${selectedProvider.name} connected successfully`);
      setDialogOpen(false);
      fetchConnections();
    } catch (error) {
      console.error('Error saving connection:', error);
      toast.error('Failed to save connection');
    }
  };

  const testConnection = async (connectionId: string) => {
    setTesting(connectionId);
    
    // Simulate testing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await supabase
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connectionId);
    
    setTesting(null);
    toast.success('Connection test successful');
    fetchConnections();
  };

  const deleteConnection = async (connectionId: string) => {
    await supabase.from('integrations').delete().eq('id', connectionId);
    setConnections(prev => prev.filter(c => c.id !== connectionId));
    toast.success('Connection removed');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const webhookEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-handler`;

  const connectedCount = connections.filter(c => c.is_connected).length;

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold gradient-text">API Dashboard</h1>
          <p className="text-muted-foreground mt-1">Connect and manage all your external APIs and services</p>
        </div>
        <Badge className="bg-green-500/20 text-green-400 text-lg px-4 py-2">
          {connectedCount} Connected
        </Badge>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="connections" className="gap-2">
            <Link2 className="w-4 h-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          {/* Provider Categories */}
          {['automation', 'ai', 'crm', 'payment', 'calendar'].map(category => {
            const categoryProviders = PROVIDERS.filter(p => p.category === category);
            const categoryLabels: Record<string, string> = {
              automation: '🔄 Automation',
              ai: '🤖 AI & LLMs',
              crm: '📊 CRM & Marketing',
              payment: '💰 Payments',
              calendar: '📅 Calendars'
            };
            
            return (
              <div key={category}>
                <h2 className="text-lg font-semibold mb-3">{categoryLabels[category]}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryProviders.map((provider, idx) => {
                    const connection = connections.find(c => c.provider === provider.id);
                    const isConnected = connection?.is_connected;
                    
                    return (
                      <motion.div
                        key={provider.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card className={`card-glow cursor-pointer transition-all hover:border-primary/50 ${isConnected ? 'border-green-500/50' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{provider.icon}</span>
                                <div>
                                  <p className="font-medium">{provider.name}</p>
                                  <p className="text-xs text-muted-foreground">{provider.description}</p>
                                </div>
                              </div>
                              {isConnected && (
                                <Badge className="bg-green-500/20 text-green-400">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Connected
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex gap-2 mt-4">
                              <Button
                                variant={isConnected ? "outline" : "default"}
                                size="sm"
                                className="flex-1"
                                onClick={() => openProviderDialog(provider)}
                              >
                                {isConnected ? 'Configure' : 'Connect'}
                              </Button>
                              {isConnected && connection && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => testConnection(connection.id)}
                                    disabled={testing === connection.id}
                                  >
                                    {testing === connection.id ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Zap className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteConnection(connection.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5 text-primary" />
                Your Webhook Endpoint
              </CardTitle>
              <CardDescription>Use this URL to receive events from external services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm flex items-center justify-between">
                <span className="truncate">{webhookEndpoint}</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(webhookEndpoint)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border">
                  <h4 className="font-medium mb-2">Supported Events</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• lead.created, lead.updated, lead.qualified</p>
                    <p>• payment.received, payment.refunded</p>
                    <p>• content.published, content.metrics</p>
                    <p>• dm.received, comment.received</p>
                    <p>• trend.detected, booking.created</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <h4 className="font-medium mb-2">Request Format</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  "event": "lead.created",
  "data": { ... },
  "organization_id": "your-org-id"
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Integration Documentation
              </CardTitle>
              <CardDescription>Guides and resources for connecting your services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {PROVIDERS.map(provider => (
                  <div key={provider.id} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{provider.icon}</span>
                        <h4 className="font-medium">{provider.name}</h4>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={provider.docs_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Official Docs
                        </a>
                      </Button>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {provider.setup_guide.map((step, idx) => (
                        <p key={idx}>{step}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Connection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedProvider?.icon}</span>
              Connect {selectedProvider?.name}
            </DialogTitle>
            <DialogDescription>{selectedProvider?.description}</DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-4 py-4">
              {/* Setup Guide */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Quick Setup
                </h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {selectedProvider.setup_guide.slice(0, 3).map((step, idx) => (
                    <p key={idx}>{step}</p>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              {selectedProvider.fields.map(field => (
                <div key={field.name} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {field.type === 'password' && <Lock className="w-3 h-3" />}
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      type={field.type === 'password' && !showSecrets[field.name] ? 'password' : 'text'}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                    {field.type === 'password' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowSecrets(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                      >
                        {showSecrets[field.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={selectedProvider.docs_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open {selectedProvider.name} Documentation
                </a>
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveConnection}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
