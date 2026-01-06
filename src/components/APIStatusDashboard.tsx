import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity,
  Wifi,
  WifiOff,
  Zap,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Code
} from 'lucide-react';
import { useRealtimeEvents, useActionUpdates, useRevenueUpdates } from '@/hooks/useRealtimeEvents';
import { api } from '@/lib/api-client';

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  requiresAuth: boolean;
}

export function APIStatusDashboard() {
  const { events, isConnected } = useRealtimeEvents();
  const [apiHealth, setApiHealth] = useState<'healthy' | 'degraded' | 'down'>('healthy');
  const [recentActions, setRecentActions] = useState<unknown[]>([]);
  const [testResult, setTestResult] = useState<string | null>(null);

  useActionUpdates((action) => {
    console.log('Action update received:', action);
  });

  useRevenueUpdates((payment) => {
    console.log('Payment received:', payment);
  });

  useEffect(() => {
    // Fetch recent actions
    api.actions.list('pending', 10).then(data => {
      setRecentActions(data.actions || []);
    }).catch(console.error);
  }, []);

  const endpoints: APIEndpoint[] = [
    { method: 'POST', path: '/v1/sessions', description: 'Create chat session', requiresAuth: true },
    { method: 'GET', path: '/v1/sessions/:id', description: 'Get session with messages', requiresAuth: true },
    { method: 'POST', path: '/v1/chat/send', description: 'Send message, get AI response', requiresAuth: true },
    { method: 'GET', path: '/v1/policy', description: 'Get permission contract', requiresAuth: true },
    { method: 'PUT', path: '/v1/policy', description: 'Update policy (admin)', requiresAuth: true },
    { method: 'GET', path: '/v1/actions', description: 'List actions for approval', requiresAuth: true },
    { method: 'POST', path: '/v1/actions/:id/approve', description: 'Approve action', requiresAuth: true },
    { method: 'POST', path: '/v1/actions/:id/deny', description: 'Deny action', requiresAuth: true },
    { method: 'GET', path: '/v1/decisions', description: 'Decision log list', requiresAuth: true },
    { method: 'GET', path: '/v1/decisions/:id', description: 'Full decision details', requiresAuth: true },
    { method: 'GET', path: '/v1/impact/report', description: 'ROI attribution report', requiresAuth: true },
    { method: 'POST', path: '/v1/uploads/sign', description: 'Get presigned upload URL', requiresAuth: true },
    { method: 'POST', path: '/v1/tools/callback', description: 'n8n callback (webhook)', requiresAuth: false },
    { method: 'POST', path: '/v1/webhooks/stripe', description: 'Stripe events', requiresAuth: false },
    { method: 'POST', path: '/v1/webhooks/ghl', description: 'GoHighLevel events', requiresAuth: false },
  ];

  const testAPI = async () => {
    setTestResult('Testing...');
    try {
      const policy = await api.policy.get();
      setTestResult(`✅ API Working! Policy version: ${policy.policy?.version || 1}`);
      setApiHealth('healthy');
    } catch (error) {
      setTestResult(`❌ API Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      setApiHealth('degraded');
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-500/20 text-green-400';
      case 'POST': return 'bg-blue-500/20 text-blue-400';
      case 'PUT': return 'bg-yellow-500/20 text-yellow-400';
      case 'DELETE': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Activity className="w-6 h-6" />
            API & Real-Time Status
          </h1>
          <p className="text-muted-foreground">Monitor API endpoints, webhooks, and real-time events</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
            {isConnected ? <Wifi className="w-4 h-4 mr-1" /> : <WifiOff className="w-4 h-4 mr-1" />}
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Badge className={
            apiHealth === 'healthy' ? "bg-green-500/20 text-green-400" :
            apiHealth === 'degraded' ? "bg-yellow-500/20 text-yellow-400" :
            "bg-red-500/20 text-red-400"
          }>
            API: {apiHealth}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
            <div className="text-2xl font-bold">{endpoints.length}</div>
            <div className="text-xs text-muted-foreground">Endpoints</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Activity className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <div className="text-2xl font-bold">{events.length}</div>
            <div className="text-xs text-muted-foreground">Recent Events</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-orange-400" />
            <div className="text-2xl font-bold">{recentActions.length}</div>
            <div className="text-xs text-muted-foreground">Pending Actions</div>
          </CardContent>
        </Card>
        <Card className={`border-border/50 ${isConnected ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <CardContent className="p-4 text-center">
            {isConnected ? (
              <Wifi className="w-5 h-5 mx-auto mb-1 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 mx-auto mb-1 text-red-400" />
            )}
            <div className="text-2xl font-bold">{isConnected ? 'Live' : 'Offline'}</div>
            <div className="text-xs text-muted-foreground">Real-time</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
          <TabsTrigger value="realtime">Real-Time Events</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="test">API Test</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Unified API Endpoints
              </CardTitle>
              <CardDescription>
                Base URL: {import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-api
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {endpoints.map((endpoint, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getMethodColor(endpoint.method)}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono">{endpoint.path}</code>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                        {endpoint.requiresAuth ? (
                          <Badge variant="outline" className="text-xs">Auth Required</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">Public</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Live Event Stream
                {isConnected && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
              </CardTitle>
              <CardDescription>
                Real-time events from your organization channel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Waiting for events...</p>
                    <p className="text-sm mt-2">Events will appear here in real-time</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {events.map((event, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          {event.type.includes('action') ? <Zap className="w-4 h-4 text-yellow-400" /> :
                           event.type.includes('payment') ? <DollarSign className="w-4 h-4 text-green-400" /> :
                           event.type.includes('message') ? <MessageSquare className="w-4 h-4 text-blue-400" /> :
                           <Activity className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{event.type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {event.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <pre className="text-xs text-muted-foreground mt-1 overflow-hidden">
                            {JSON.stringify(event.payload, null, 2).slice(0, 200)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Webhook Endpoints</CardTitle>
              <CardDescription>
                Configure these URLs in your external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'n8n Callback', path: '/v1/tools/callback', description: 'Receives execution results from n8n workflows' },
                { name: 'Stripe Webhook', path: '/v1/webhooks/stripe', description: 'Receives Stripe payment events' },
                { name: 'GoHighLevel Webhook', path: '/v1/webhooks/ghl', description: 'Receives GHL CRM events' },
                { name: 'Tool Trigger', path: '/v1/tools/trigger', description: 'Trigger n8n workflows from the app' }
              ].map((webhook, idx) => (
                <div key={idx} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{webhook.name}</span>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Copy URL
                    </Button>
                  </div>
                  <code className="text-sm text-primary block mb-2">
                    {import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhooks{webhook.path}
                  </code>
                  <p className="text-sm text-muted-foreground">{webhook.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>API Health Check</CardTitle>
              <CardDescription>Test the unified API endpoint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testAPI} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Test API Connection
              </Button>
              
              {testResult && (
                <div className={`p-4 rounded-lg ${
                  testResult.includes('✅') ? 'bg-green-500/10 border border-green-500/30' :
                  testResult.includes('❌') ? 'bg-red-500/10 border border-red-500/30' :
                  'bg-muted/30'
                }`}>
                  <pre className="text-sm font-mono">{testResult}</pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4">
                <Button variant="outline" onClick={() => api.actions.list().then(console.log)}>
                  Test Actions List
                </Button>
                <Button variant="outline" onClick={() => api.decisions.list().then(console.log)}>
                  Test Decisions List
                </Button>
                <Button variant="outline" onClick={() => api.impact.report().then(console.log)}>
                  Test Impact Report
                </Button>
                <Button variant="outline" onClick={() => api.sessions.create('Test Session').then(console.log)}>
                  Test Create Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default APIStatusDashboard;
