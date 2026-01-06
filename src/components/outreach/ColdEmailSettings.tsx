import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Shield,
  Clock,
  Mail,
  AlertTriangle,
  Save,
  RefreshCw,
} from "lucide-react";

interface EmailConfig {
  id: string;
  max_emails_per_day: number;
  max_emails_per_week: number;
  send_window_start: string;
  send_window_end: string;
  send_days: string[];
  require_approval: boolean;
  stop_on_reply: boolean;
  plain_text_only: boolean;
  no_links: boolean;
  no_attachments: boolean;
  auto_followup_enabled: boolean;
  followup_days: number;
  max_followups: number;
}

const DEFAULT_CONFIG: Omit<EmailConfig, 'id'> = {
  max_emails_per_day: 30,
  max_emails_per_week: 150,
  send_window_start: '09:00',
  send_window_end: '17:00',
  send_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  require_approval: true,
  stop_on_reply: true,
  plain_text_only: true,
  no_links: true,
  no_attachments: true,
  auto_followup_enabled: false,
  followup_days: 7,
  max_followups: 2,
};

const WEEKDAYS = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

export function ColdEmailSettings() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<Omit<EmailConfig, 'id'>>(DEFAULT_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedConfig, isLoading } = useQuery({
    queryKey: ['email-sending-config', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('email_sending_config')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();
      if (error) throw error;
      return data as EmailConfig | null;
    },
    enabled: !!organization?.id,
  });

  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [savedConfig]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization');
      
      const payload = {
        organization_id: organization.id,
        ...config,
      };

      if (savedConfig?.id) {
        const { error } = await supabase
          .from('email_sending_config')
          .update(payload)
          .eq('id', savedConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_sending_config')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Settings saved!');
      queryClient.invalidateQueries({ queryKey: ['email-sending-config'] });
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const updateConfig = <K extends keyof typeof config>(key: K, value: typeof config[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleDay = (day: string) => {
    const newDays = config.send_days.includes(day)
      ? config.send_days.filter(d => d !== day)
      : [...config.send_days, day];
    updateConfig('send_days', newDays);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Cold Email Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure safety guardrails for your cold outreach
          </p>
        </div>
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={!hasChanges || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Rate Limits
            </CardTitle>
            <CardDescription>
              Control how many emails are sent to protect deliverability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="daily-limit">Max Emails Per Day</Label>
              <Input
                id="daily-limit"
                type="number"
                min={1}
                max={100}
                value={config.max_emails_per_day}
                onChange={(e) => updateConfig('max_emails_per_day', parseInt(e.target.value) || 30)}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 20-50 for warm domains, 10-20 for new domains
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekly-limit">Max Emails Per Week</Label>
              <Input
                id="weekly-limit"
                type="number"
                min={1}
                max={500}
                value={config.max_emails_per_week}
                onChange={(e) => updateConfig('max_emails_per_week', parseInt(e.target.value) || 150)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Send Windows */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Send Windows
            </CardTitle>
            <CardDescription>
              When emails should be sent (randomized within window)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={config.send_window_start}
                  onChange={(e) => updateConfig('send_window_start', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={config.send_window_end}
                  onChange={(e) => updateConfig('send_window_end', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Send Days</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <Badge
                    key={day.value}
                    variant={config.send_days.includes(day.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Rules
            </CardTitle>
            <CardDescription>
              Protect your domain reputation and stay compliant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Require Approval</p>
                <p className="text-sm text-muted-foreground">Review emails before sending</p>
              </div>
              <Switch
                checked={config.require_approval}
                onCheckedChange={(checked) => updateConfig('require_approval', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Stop on Reply</p>
                <p className="text-sm text-muted-foreground">Pause follow-ups when they respond</p>
              </div>
              <Switch
                checked={config.stop_on_reply}
                onCheckedChange={(checked) => updateConfig('stop_on_reply', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Plain Text Only</p>
                <p className="text-sm text-muted-foreground">No HTML formatting</p>
              </div>
              <Switch
                checked={config.plain_text_only}
                onCheckedChange={(checked) => updateConfig('plain_text_only', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">No Links</p>
                <p className="text-sm text-muted-foreground">Avoid spam filters</p>
              </div>
              <Switch
                checked={config.no_links}
                onCheckedChange={(checked) => updateConfig('no_links', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">No Attachments</p>
                <p className="text-sm text-muted-foreground">Keep emails lightweight</p>
              </div>
              <Switch
                checked={config.no_attachments}
                onCheckedChange={(checked) => updateConfig('no_attachments', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Follow-up Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Auto Follow-up
            </CardTitle>
            <CardDescription>
              Automatically send follow-ups if no response
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Auto Follow-up</p>
                <p className="text-sm text-muted-foreground">Automatically queue follow-ups</p>
              </div>
              <Switch
                checked={config.auto_followup_enabled}
                onCheckedChange={(checked) => updateConfig('auto_followup_enabled', checked)}
              />
            </div>

            {config.auto_followup_enabled && (
              <>
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="followup-days">Days Before Follow-up</Label>
                  <Input
                    id="followup-days"
                    type="number"
                    min={3}
                    max={30}
                    value={config.followup_days}
                    onChange={(e) => updateConfig('followup_days', parseInt(e.target.value) || 7)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-followups">Max Follow-ups</Label>
                  <Input
                    id="max-followups"
                    type="number"
                    min={1}
                    max={5}
                    value={config.max_followups}
                    onChange={(e) => updateConfig('max_followups', parseInt(e.target.value) || 2)}
                  />
                </div>
              </>
            )}

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Follow-ups maintain the same calm, non-salesy tone as original emails.
                They reference the previous message without pressure.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}