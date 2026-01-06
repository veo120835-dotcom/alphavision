import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit3,
  Clock,
  Webhook,
  Calendar,
  Mail,
  MessageCircle,
  DollarSign,
  Users,
  TrendingUp,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface WorkflowTrigger {
  id: string;
  name: string;
  trigger_type: 'webhook' | 'schedule' | 'event' | 'manual';
  event_type: string;
  is_active: boolean;
  actions: any[];
  last_triggered_at: string | null;
  trigger_count: number;
  conditions: any;
}

const TRIGGER_TYPES = [
  { id: 'webhook', label: 'Webhook', icon: Webhook, description: 'Triggered by external HTTP request' },
  { id: 'schedule', label: 'Schedule', icon: Clock, description: 'Triggered on a recurring schedule' },
  { id: 'event', label: 'Event', icon: Zap, description: 'Triggered by internal events' },
  { id: 'manual', label: 'Manual', icon: Play, description: 'Triggered manually by user' }
];

const EVENT_TYPES = [
  { id: 'lead.created', label: 'New Lead', icon: Users },
  { id: 'lead.qualified', label: 'Lead Qualified', icon: Target },
  { id: 'payment.received', label: 'Payment Received', icon: DollarSign },
  { id: 'dm.received', label: 'DM Received', icon: MessageCircle },
  { id: 'content.published', label: 'Content Published', icon: TrendingUp },
  { id: 'trend.detected', label: 'Trend Detected', icon: TrendingUp },
  { id: 'booking.created', label: 'Booking Created', icon: Calendar },
  { id: 'comment.received', label: 'Comment Received', icon: MessageCircle }
];

const ACTION_TYPES = [
  { id: 'send_dm', label: 'Send DM', description: 'Send automated DM response' },
  { id: 'create_lead', label: 'Create Lead', description: 'Add to lead pipeline' },
  { id: 'update_lead', label: 'Update Lead', description: 'Update lead status/score' },
  { id: 'send_email', label: 'Send Email', description: 'Trigger email sequence' },
  { id: 'notify', label: 'Send Notification', description: 'Alert in dashboard' },
  { id: 'trigger_agent', label: 'Trigger Agent', description: 'Activate specific agent' },
  { id: 'webhook_call', label: 'Call Webhook', description: 'Send to external webhook' },
  { id: 'create_approval', label: 'Request Approval', description: 'Create approval request' }
];

export function WorkflowTriggersView() {
  const { organization } = useOrganization();
  const [triggers, setTriggers] = useState<WorkflowTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<WorkflowTrigger | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    trigger_type: 'webhook' | 'schedule' | 'event' | 'manual';
    event_type: string;
    actions: string[];
    is_active: boolean;
  }>({
    name: '',
    trigger_type: 'webhook',
    event_type: 'lead.created',
    actions: [],
    is_active: true
  });

  const webhookUrl = organization?.id 
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-handler`
    : '';

  useEffect(() => {
    if (organization?.id) {
      fetchTriggers();
    }
  }, [organization?.id]);

  const fetchTriggers = async () => {
    if (!organization?.id) return;
    setLoading(true);
    
    try {
      const { data } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (data) {
        setTriggers(data.map(w => ({
          id: w.id,
          name: w.name,
          trigger_type: w.trigger_type as any,
          event_type: w.stage,
          is_active: w.is_active || false,
          actions: w.actions as any[] || [],
          last_triggered_at: w.last_executed_at,
          trigger_count: w.execution_count || 0,
          conditions: w.trigger_config
        })));
      }
    } catch (error) {
      console.error('Error fetching triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization?.id || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingTrigger) {
        await supabase
          .from('automation_workflows')
          .update({
            name: formData.name,
            trigger_type: formData.trigger_type,
            stage: formData.event_type,
            actions: formData.actions,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTrigger.id);
        toast.success('Trigger updated');
      } else {
        await supabase.from('automation_workflows').insert({
          organization_id: organization.id,
          name: formData.name,
          trigger_type: formData.trigger_type,
          stage: formData.event_type,
          actions: formData.actions,
          is_active: formData.is_active
        });
        toast.success('Trigger created');
      }
      
      setDialogOpen(false);
      setEditingTrigger(null);
      setFormData({ name: '', trigger_type: 'webhook', event_type: 'lead.created', actions: [], is_active: true });
      fetchTriggers();
    } catch (error) {
      console.error('Error saving trigger:', error);
      toast.error('Failed to save trigger');
    }
  };

  const toggleTrigger = async (id: string, isActive: boolean) => {
    await supabase
      .from('automation_workflows')
      .update({ is_active: !isActive })
      .eq('id', id);
    
    setTriggers(prev => prev.map(t => t.id === id ? { ...t, is_active: !isActive } : t));
    toast.success(`Trigger ${!isActive ? 'activated' : 'paused'}`);
  };

  const deleteTrigger = async (id: string) => {
    await supabase.from('automation_workflows').delete().eq('id', id);
    setTriggers(prev => prev.filter(t => t.id !== id));
    toast.success('Trigger deleted');
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied to clipboard');
  };

  const testTrigger = async (trigger: WorkflowTrigger) => {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          event: trigger.event_type,
          data: { test: true, trigger_name: trigger.name },
          organization_id: organization?.id
        })
      });
      toast.success('Test event sent! Check execution logs.');
    } catch (error) {
      toast.error('Failed to send test event');
    }
  };

  const openEdit = (trigger: WorkflowTrigger) => {
    setEditingTrigger(trigger);
    setFormData({
      name: trigger.name,
      trigger_type: trigger.trigger_type as 'webhook' | 'schedule' | 'event' | 'manual',
      event_type: trigger.event_type,
      actions: trigger.actions.map((a: any) => a.type || a),
      is_active: trigger.is_active
    });
    setDialogOpen(true);
  };

  const getTriggerIcon = (type: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.id === type);
    return trigger?.icon || Zap;
  };

  const getEventIcon = (type: string) => {
    const event = EVENT_TYPES.find(e => e.id === type);
    return event?.icon || Zap;
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold gradient-text">Workflow Triggers</h1>
          <p className="text-muted-foreground mt-1">Automate actions based on events and schedules</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTrigger(null);
              setFormData({ name: '', trigger_type: 'webhook', event_type: 'lead.created', actions: [], is_active: true });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New Trigger
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingTrigger ? 'Edit Trigger' : 'Create New Trigger'}</DialogTitle>
              <DialogDescription>Configure when and how this workflow should run</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Trigger Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., New Lead Notification"
                />
              </div>

              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, trigger_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        <div className="flex items-center gap-2">
                          <event.icon className="w-4 h-4" />
                          {event.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Actions (select multiple)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTION_TYPES.map(action => (
                    <div
                      key={action.id}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          actions: prev.actions.includes(action.id)
                            ? prev.actions.filter(a => a !== action.id)
                            : [...prev.actions, action.id]
                        }));
                      }}
                      className={`p-2 rounded-lg border cursor-pointer transition-all ${
                        formData.actions.includes(action.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <p className="text-sm font-medium">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                {editingTrigger ? 'Update' : 'Create'} Trigger
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhook URL Card */}
      <Card className="card-glow border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Webhook className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Webhook Endpoint</p>
                <p className="text-sm text-muted-foreground font-mono truncate max-w-[400px]">{webhookUrl}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://docs.n8n.io" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  n8n Docs
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{triggers.filter(t => t.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Triggers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{triggers.reduce((sum, t) => sum + t.trigger_count, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Executions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Webhook className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{triggers.filter(t => t.trigger_type === 'webhook').length}</p>
                <p className="text-sm text-muted-foreground">Webhook Triggers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{triggers.filter(t => t.trigger_type === 'schedule').length}</p>
                <p className="text-sm text-muted-foreground">Scheduled Triggers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Triggers List */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            All Triggers
          </CardTitle>
          <CardDescription>Manage your automation triggers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence>
              {triggers.map((trigger, idx) => {
                const TriggerIcon = getTriggerIcon(trigger.trigger_type);
                const EventIcon = getEventIcon(trigger.event_type);
                
                return (
                  <motion.div
                    key={trigger.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${trigger.is_active ? 'bg-green-500/20' : 'bg-muted'}`}>
                          <TriggerIcon className={`w-5 h-5 ${trigger.is_active ? 'text-green-400' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{trigger.name}</p>
                            <Badge variant="secondary" className="text-xs">
                              {trigger.trigger_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <EventIcon className="w-3 h-3" />
                            <span>{trigger.event_type}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span>{trigger.actions.length} action(s)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <p className="text-sm font-medium">{trigger.trigger_count} runs</p>
                          {trigger.last_triggered_at && (
                            <p className="text-xs text-muted-foreground">
                              Last: {formatDistanceToNow(new Date(trigger.last_triggered_at), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => testTrigger(trigger)}>
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(trigger)}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTrigger(trigger.id, trigger.is_active)}
                        >
                          {trigger.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTrigger(trigger.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {triggers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No triggers yet</p>
                <p className="text-sm">Create your first automation trigger to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
