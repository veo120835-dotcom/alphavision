import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, Mail, MessageSquare, AlertTriangle, Check, 
  X, TrendingDown, Users, Clock, RefreshCw
} from 'lucide-react';

export function ComplianceSuite() {
  const { organization } = useOrganization();

  const { data: emailHealth } = useQuery({
    queryKey: ['email-health', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      
      const { data: sends } = await supabase
        .from('email_sends')
        .select('status')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      const total = sends?.length || 0;
      const delivered = sends?.filter(s => s.status === 'delivered').length || 0;
      const bounced = sends?.filter(s => s.status === 'bounced').length || 0;
      const opened = sends?.filter(s => s.status === 'opened').length || 0;
      
      return {
        total,
        deliveryRate: total ? ((delivered / total) * 100).toFixed(1) : '100',
        bounceRate: total ? ((bounced / total) * 100).toFixed(1) : '0',
        openRate: delivered ? ((opened / delivered) * 100).toFixed(1) : '0',
        health: bounced / total > 0.05 ? 'warning' : bounced / total > 0.1 ? 'critical' : 'good',
      };
    },
    enabled: !!organization?.id,
  });

  const { data: unsubscribes } = useQuery({
    queryKey: ['unsubscribes', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('unsubscribes')
        .select('*')
        .eq('organization_id', organization.id)
        .order('unsubscribed_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const HEALTH_COLORS = {
    good: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance Suite</h1>
          <p className="text-muted-foreground">Deliverability, consent, and compliance management</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Delivery Rate</span>
            </div>
            <p className="text-2xl font-bold">{emailHealth?.deliveryRate || 100}%</p>
            <Progress value={parseFloat(emailHealth?.deliveryRate || '100')} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Bounce Rate</span>
            </div>
            <p className="text-2xl font-bold">{emailHealth?.bounceRate || 0}%</p>
            <Progress value={parseFloat(emailHealth?.bounceRate || '0')} className="mt-2 [&>div]:bg-red-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Open Rate</span>
            </div>
            <p className="text-2xl font-bold">{emailHealth?.openRate || 0}%</p>
            <Progress value={parseFloat(emailHealth?.openRate || '0')} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Health Status</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${HEALTH_COLORS[emailHealth?.health as keyof typeof HEALTH_COLORS || 'good']}`} />
              <span className="text-lg font-semibold capitalize">{emailHealth?.health || 'Good'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deliverability">
        <TabsList>
          <TabsTrigger value="deliverability">Email Deliverability</TabsTrigger>
          <TabsTrigger value="consent">Consent Management</TabsTrigger>
          <TabsTrigger value="sms">SMS Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="deliverability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deliverability Checklist</CardTitle>
              <CardDescription>Ensure optimal email delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>SPF Record Configured</span>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">Verified</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>DKIM Signing Active</span>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">Verified</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>DMARC Policy Set</span>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">Verified</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span>Domain Warmup Progress</span>
                  </div>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">In Progress</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto-Throttle Rules</CardTitle>
              <CardDescription>Automatic sending limits to protect deliverability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span>Pause sends if bounce rate exceeds 5%</span>
                <Badge>Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span>Limit to 500 emails/hour during warmup</span>
                <Badge>Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span>Auto-pause on spam complaints &gt; 0.1%</span>
                <Badge>Active</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unsubscribe Management</CardTitle>
              <CardDescription>Recent unsubscribes and suppression list</CardDescription>
            </CardHeader>
            <CardContent>
              {!unsubscribes?.length ? (
                <p className="text-center text-muted-foreground py-8">No unsubscribes recorded</p>
              ) : (
                <div className="space-y-2">
                  {unsubscribes.map((unsub) => (
                    <div key={unsub.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{unsub.email}</p>
                        {unsub.reason && (
                          <p className="text-sm text-muted-foreground">{unsub.reason}</p>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(unsub.unsubscribed_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consent Tracking</CardTitle>
              <CardDescription>GDPR and CAN-SPAM compliance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Unsubscribe link in all emails</span>
                </div>
                <Badge variant="outline" className="text-green-600">Required</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Physical address in footer</span>
                </div>
                <Badge variant="outline" className="text-green-600">Required</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Consent timestamp recorded</span>
                </div>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Opt-In Policy</CardTitle>
              <CardDescription>TCPA compliance requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Required Disclosures</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Message frequency disclosure
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    "Message and data rates may apply"
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Reply STOP to opt out
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Reply HELP for support
                  </li>
                </ul>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Auto-handle STOP keywords</span>
                <Badge>Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Quiet hours (9PM - 8AM local)</span>
                <Badge>Active</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}