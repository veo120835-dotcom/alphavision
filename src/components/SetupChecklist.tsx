import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight,
  Webhook,
  CreditCard,
  Database,
  Bot,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useAlphaVisionStore } from '@/store/alpha-vision-store';

interface SetupItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  checkFn: () => Promise<boolean>;
  fixView?: string;
}

export function SetupChecklist() {
  const { organization } = useOrganization();
  const { setActiveView } = useAlphaVisionStore();
  const [checks, setChecks] = useState<Record<string, boolean | null>>({});
  const [loading, setLoading] = useState(true);

  const setupItems: SetupItem[] = [
    {
      id: 'business_config',
      name: 'Business Configuration',
      description: 'Product name, pricing, and target audience',
      icon: <Database className="w-5 h-5" />,
      required: true,
      checkFn: async () => {
        if (!organization?.id) return false;
        const { data } = await supabase
          .from('business_config')
          .select('product_name')
          .eq('organization_id', organization.id)
          .single();
        return !!data?.product_name;
      },
      fixView: 'settings',
    },
    {
      id: 'n8n_webhook',
      name: 'n8n Automation',
      description: 'Webhook URL for executing actions',
      icon: <Webhook className="w-5 h-5" />,
      required: true,
      checkFn: async () => {
        if (!organization?.id) return false;
        const { data } = await supabase
          .from('integrations')
          .select('id')
          .eq('organization_id', organization.id)
          .eq('provider', 'n8n_webhook')
          .single();
        return !!data;
      },
      fixView: 'apikeys',
    },
    {
      id: 'stripe',
      name: 'Stripe Payments',
      description: 'Payment processing and revenue tracking',
      icon: <CreditCard className="w-5 h-5" />,
      required: true,
      checkFn: async () => {
        if (!organization?.id) return false;
        const { data } = await supabase
          .from('integrations')
          .select('id')
          .eq('organization_id', organization.id)
          .eq('provider', 'stripe_secret')
          .single();
        return !!data;
      },
      fixView: 'apikeys',
    },
    {
      id: 'permission_contract',
      name: 'Permission Contract',
      description: 'Risk posture and spending caps',
      icon: <Bot className="w-5 h-5" />,
      required: false,
      checkFn: async () => {
        if (!organization?.id) return false;
        const { data } = await supabase
          .from('permission_contracts')
          .select('id')
          .eq('organization_id', organization.id)
          .single();
        return !!data;
      },
      fixView: 'settings',
    },
    {
      id: 'first_chat',
      name: 'First AI Conversation',
      description: 'Chat with Alpha Vision',
      icon: <Zap className="w-5 h-5" />,
      required: false,
      checkFn: async () => {
        if (!organization?.id) return false;
        const { data } = await supabase
          .from('sessions')
          .select('id')
          .eq('organization_id', organization.id)
          .limit(1);
        return (data?.length || 0) > 0;
      },
      fixView: 'chat',
    },
  ];

  useEffect(() => {
    runChecks();
  }, [organization?.id]);

  const runChecks = async () => {
    setLoading(true);
    const results: Record<string, boolean | null> = {};
    
    for (const item of setupItems) {
      try {
        results[item.id] = await item.checkFn();
      } catch (error) {
        results[item.id] = null;
      }
    }
    
    setChecks(results);
    setLoading(false);
  };

  const completedCount = Object.values(checks).filter(v => v === true).length;
  const requiredCount = setupItems.filter(i => i.required).length;
  const completedRequired = setupItems.filter(i => i.required && checks[i.id] === true).length;
  const progress = (completedCount / setupItems.length) * 100;

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    if (status) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-muted-foreground">Checking setup status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If all required are complete, show minimal view
  if (completedRequired === requiredCount) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-medium text-green-400">Setup Complete</p>
                <p className="text-sm text-muted-foreground">
                  {completedCount}/{setupItems.length} items configured
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={runChecks}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Setup Checklist</CardTitle>
          <Badge variant="outline">
            {completedRequired}/{requiredCount} Required
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-2">
          {setupItems.map(item => (
            <div 
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(checks[item.id])}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.required && (
                      <Badge variant="outline" className="text-[10px] px-1">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              
              {!checks[item.id] && item.fixView && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setActiveView(item.fixView as any)}
                >
                  Setup
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default SetupChecklist;
