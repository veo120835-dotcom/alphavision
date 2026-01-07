import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Mail, Phone, MessageCircle, Users, CheckCircle2, XCircle, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import { ProviderAdapters } from '@/providers';
import type { ProviderConfig } from '@/providers/types';

export function ProviderConfigPanel() {
  const { currentOrganization } = useOrganization();
  const [config, setConfig] = useState<ProviderConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentOrganization?.id) return;
    loadConfig();
  }, [currentOrganization?.id]);

  async function loadConfig() {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('provider_config')
        .eq('id', currentOrganization.id)
        .single();

      if (error) {
        console.error('Error loading config:', error);
        return;
      }

      setConfig(data?.provider_config || {});
    } catch (error) {
      console.error('Error in loadConfig:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    if (!currentOrganization?.id) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('organizations')
        .update({ provider_config: config })
        .eq('id', currentOrganization.id);

      if (error) {
        console.error('Error saving config:', error);
        toast.error('Failed to save configuration');
        return;
      }

      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Error in saveConfig:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  function updateConfig(key: keyof ProviderConfig, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  const whatsappConfigured = ProviderAdapters.whatsapp.isConfigured(config);
  const smsConfigured = ProviderAdapters.sms.isConfigured(config);
  const emailConfigured = ProviderAdapters.email.isConfigured(config);
  const manychatConfigured = ProviderAdapters.manychat.isConfigured(config);
  const ghlConfigured = ProviderAdapters.ghl.isConfigured(config);

  if (loading) {
    return <div className="text-center py-8">Loading configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Messaging Providers</h2>
          <p className="text-muted-foreground mt-1">
            Configure your messaging channels to start conversations
          </p>
        </div>
        <Button onClick={saveConfig} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <MessageSquare className="h-5 w-5" />
              {whatsappConfigured ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-medium">WhatsApp</p>
            <Badge variant={whatsappConfigured ? 'default' : 'secondary'} className="mt-2">
              {whatsappConfigured ? 'Configured' : 'Not Configured'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Phone className="h-5 w-5" />
              {smsConfigured ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-medium">SMS</p>
            <Badge variant={smsConfigured ? 'default' : 'secondary'} className="mt-2">
              {smsConfigured ? 'Configured' : 'Not Configured'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Mail className="h-5 w-5" />
              {emailConfigured ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-medium">Email</p>
            <Badge variant={emailConfigured ? 'default' : 'secondary'} className="mt-2">
              {emailConfigured ? 'Configured' : 'Not Configured'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <MessageCircle className="h-5 w-5" />
              {manychatConfigured ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-medium">ManyChat</p>
            <Badge variant={manychatConfigured ? 'default' : 'secondary'} className="mt-2">
              {manychatConfigured ? 'Configured' : 'Not Configured'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5" />
              {ghlConfigured ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-medium">GoHighLevel</p>
            <Badge variant={ghlConfigured ? 'default' : 'secondary'} className="mt-2">
              {ghlConfigured ? 'Configured' : 'Not Configured'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="manychat">ManyChat</TabsTrigger>
          <TabsTrigger value="ghl">GoHighLevel</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Configuration</CardTitle>
              <CardDescription>
                Configure your WhatsApp Business API credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  You need a WhatsApp Business API account. Get started at{' '}
                  <a
                    href="https://business.facebook.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Meta Business Suite
                  </a>
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_business_account_id">Business Account ID</Label>
                <Input
                  id="whatsapp_business_account_id"
                  value={config.whatsapp_business_account_id || ''}
                  onChange={(e) => updateConfig('whatsapp_business_account_id', e.target.value)}
                  placeholder="Enter your Business Account ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_phone_number_id">Phone Number ID</Label>
                <Input
                  id="whatsapp_phone_number_id"
                  value={config.whatsapp_phone_number_id || ''}
                  onChange={(e) => updateConfig('whatsapp_phone_number_id', e.target.value)}
                  placeholder="Enter your Phone Number ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_access_token">Access Token</Label>
                <Input
                  id="whatsapp_access_token"
                  type="password"
                  value={config.whatsapp_access_token || ''}
                  onChange={(e) => updateConfig('whatsapp_access_token', e.target.value)}
                  placeholder="Enter your Access Token"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle>SMS Configuration (Twilio)</CardTitle>
              <CardDescription>Configure your Twilio SMS credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Create a Twilio account at{' '}
                  <a
                    href="https://www.twilio.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    twilio.com
                  </a>
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="twilio_account_sid">Account SID</Label>
                <Input
                  id="twilio_account_sid"
                  value={config.twilio_account_sid || ''}
                  onChange={(e) => updateConfig('twilio_account_sid', e.target.value)}
                  placeholder="Enter your Twilio Account SID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilio_auth_token">Auth Token</Label>
                <Input
                  id="twilio_auth_token"
                  type="password"
                  value={config.twilio_auth_token || ''}
                  onChange={(e) => updateConfig('twilio_auth_token', e.target.value)}
                  placeholder="Enter your Twilio Auth Token"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilio_phone_number">Phone Number</Label>
                <Input
                  id="twilio_phone_number"
                  value={config.twilio_phone_number || ''}
                  onChange={(e) => updateConfig('twilio_phone_number', e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration (SendGrid)</CardTitle>
              <CardDescription>Configure your SendGrid email credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Create a SendGrid account at{' '}
                  <a
                    href="https://sendgrid.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    sendgrid.com
                  </a>
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="sendgrid_api_key">API Key</Label>
                <Input
                  id="sendgrid_api_key"
                  type="password"
                  value={config.sendgrid_api_key || ''}
                  onChange={(e) => updateConfig('sendgrid_api_key', e.target.value)}
                  placeholder="Enter your SendGrid API Key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sendgrid_from_email">From Email</Label>
                <Input
                  id="sendgrid_from_email"
                  type="email"
                  value={config.sendgrid_from_email || ''}
                  onChange={(e) => updateConfig('sendgrid_from_email', e.target.value)}
                  placeholder="noreply@yourdomain.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manychat">
          <Card>
            <CardHeader>
              <CardTitle>ManyChat Configuration</CardTitle>
              <CardDescription>Configure your ManyChat API credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Get your API key from{' '}
                  <a
                    href="https://manychat.com/settings/integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    ManyChat Settings
                  </a>
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="manychat_api_key">API Key</Label>
                <Input
                  id="manychat_api_key"
                  type="password"
                  value={config.manychat_api_key || ''}
                  onChange={(e) => updateConfig('manychat_api_key', e.target.value)}
                  placeholder="Enter your ManyChat API Key"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ghl">
          <Card>
            <CardHeader>
              <CardTitle>GoHighLevel Configuration</CardTitle>
              <CardDescription>Configure your GoHighLevel API credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Get your credentials from your GoHighLevel account settings
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="ghl_access_token">Access Token</Label>
                <Input
                  id="ghl_access_token"
                  type="password"
                  value={config.ghl_access_token || ''}
                  onChange={(e) => updateConfig('ghl_access_token', e.target.value)}
                  placeholder="Enter your GHL Access Token"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ghl_location_id">Location ID</Label>
                <Input
                  id="ghl_location_id"
                  value={config.ghl_location_id || ''}
                  onChange={(e) => updateConfig('ghl_location_id', e.target.value)}
                  placeholder="Enter your GHL Location ID"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
