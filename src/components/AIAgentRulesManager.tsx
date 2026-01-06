import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Bot, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  DollarSign, 
  MessageSquare, 
  Target, 
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";

interface AIAgentRule {
  id: string;
  organization_id: string;
  rule_type: string;
  rule_name: string;
  rule_condition: any;
  rule_action: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

const RULE_TYPES = [
  { id: 'qualification', label: 'Qualification', icon: Target, description: 'When to flag bad-fit leads' },
  { id: 'pricing', label: 'Pricing', icon: DollarSign, description: 'Pricing integrity checks' },
  { id: 'content', label: 'Content', icon: FileText, description: 'Content signal filtering' },
  { id: 'sales', label: 'Sales', icon: MessageSquare, description: 'Sales behavior rules' },
  { id: 'diagnostic', label: 'Diagnostic', icon: Shield, description: 'Diagnostic triggers' },
];

const RULE_TEMPLATES = [
  {
    type: 'qualification',
    name: 'Revenue Floor Check',
    condition: { field: 'revenue', operator: 'less_than', value: 5000 },
    action: 'Flag as potential misfit: Revenue below $5,000/month threshold. Consider qualification call focus.',
  },
  {
    type: 'pricing',
    name: 'Discount Prevention',
    condition: { trigger: 'discount_request' },
    action: 'Block discount. Remind: Our pricing philosophy is [pricing_philosophy]. Consider value-add instead.',
  },
  {
    type: 'content',
    name: 'Buzzword Detection',
    condition: { contains_any: ['hustle', 'grind', 'scale fast', '6-figures'] },
    action: 'Flag content for review: Contains brand voice violations. Suggest alternatives.',
  },
  {
    type: 'sales',
    name: 'Objection Response',
    condition: { trigger: 'price_objection' },
    action: 'Use [objection_handling] approach. Do not offer discount. Reframe value proposition.',
  },
  {
    type: 'diagnostic',
    name: 'Positioning Audit',
    condition: { trigger: 'new_lead_website' },
    action: 'Run website diagnostic using positioning_review template. Score and report findings.',
  },
];

export function AIAgentRulesManager() {
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const [rules, setRules] = useState<AIAgentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AIAgentRule | null>(null);
  const [activeTab, setActiveTab] = useState('qualification');

  const [formData, setFormData] = useState({
    rule_type: 'qualification',
    rule_name: '',
    rule_condition: {},
    rule_action: '',
    priority: 1,
    is_active: true,
  });

  useEffect(() => {
    if (organizationId) {
      loadRules();
    }
  }, [organizationId]);

  const loadRules = async () => {
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_agent_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .order('priority', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error loading rules:', error);
      toast.error('Failed to load AI rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organizationId || !formData.rule_name || !formData.rule_action) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingRule) {
        const { error } = await supabase
          .from('ai_agent_rules')
          .update({
            rule_type: formData.rule_type,
            rule_name: formData.rule_name,
            rule_condition: formData.rule_condition,
            rule_action: formData.rule_action,
            priority: formData.priority,
            is_active: formData.is_active,
          })
          .eq('id', editingRule.id);

        if (error) throw error;
        toast.success('Rule updated');
      } else {
        const { error } = await supabase
          .from('ai_agent_rules')
          .insert({
            organization_id: organizationId,
            rule_type: formData.rule_type,
            rule_name: formData.rule_name,
            rule_condition: formData.rule_condition,
            rule_action: formData.rule_action,
            priority: formData.priority,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast.success('Rule created');
      }

      setShowCreateDialog(false);
      setEditingRule(null);
      resetForm();
      loadRules();
    } catch (error: any) {
      console.error('Error saving rule:', error);
      toast.error(error.message || 'Failed to save rule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const { error } = await supabase
        .from('ai_agent_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Rule deleted');
      loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const toggleRuleActive = async (rule: AIAgentRule) => {
    try {
      const { error } = await supabase
        .from('ai_agent_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);

      if (error) throw error;
      loadRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      rule_type: 'qualification',
      rule_name: '',
      rule_condition: {},
      rule_action: '',
      priority: 1,
      is_active: true,
    });
  };

  const applyTemplate = (template: typeof RULE_TEMPLATES[0]) => {
    setFormData({
      rule_type: template.type,
      rule_name: template.name,
      rule_condition: template.condition,
      rule_action: template.action,
      priority: 1,
      is_active: true,
    });
  };

  const getRuleIcon = (type: string) => {
    const ruleType = RULE_TYPES.find(r => r.id === type);
    return ruleType?.icon || Shield;
  };

  const filteredRules = rules.filter(r => r.rule_type === activeTab);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            AI Agent Rules
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure custom rules for how your AI adapts to your business
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingRule(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Rule' : 'Create AI Rule'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Templates */}
              {!editingRule && (
                <div className="space-y-2">
                  <Label>Quick Templates</Label>
                  <div className="flex flex-wrap gap-2">
                    {RULE_TEMPLATES.map((t, i) => (
                      <Button key={i} variant="outline" size="sm" onClick={() => applyTemplate(t)}>
                        {t.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rule Type</Label>
                  <Select value={formData.rule_type} onValueChange={(v) => setFormData({ ...formData, rule_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RULE_TYPES.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <span className="flex items-center gap-2">
                            <t.icon className="h-4 w-4" />
                            {t.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority (1 = highest)</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                    min={1}
                    max={10}
                  />
                </div>
              </div>

              <div>
                <Label>Rule Name *</Label>
                <Input
                  value={formData.rule_name}
                  onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                  placeholder="e.g., Revenue Floor Check"
                />
              </div>

              <div>
                <Label>Condition (JSON)</Label>
                <Textarea
                  value={JSON.stringify(formData.rule_condition, null, 2)}
                  onChange={(e) => {
                    try {
                      setFormData({ ...formData, rule_condition: JSON.parse(e.target.value) });
                    } catch {}
                  }}
                  placeholder='{ "field": "revenue", "operator": "less_than", "value": 5000 }'
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label>Action (What the AI should do) *</Label>
                <Textarea
                  value={formData.rule_action}
                  onChange={(e) => setFormData({ ...formData, rule_action: e.target.value })}
                  placeholder="Flag as potential misfit. Consider qualification call focus."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use [pricing_philosophy], [discount_policy], etc. to reference your business profile
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label>Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingRule(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">How AI Rules Work</p>
              <p className="text-sm text-muted-foreground">
                Rules are triggered when specific conditions are met during AI interactions. 
                The AI will follow your defined actions to maintain your business standards.
                Higher priority rules (lower numbers) are checked first.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules by Type */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {RULE_TYPES.map(type => {
            const Icon = type.icon;
            const count = rules.filter(r => r.rule_type === type.id).length;
            return (
              <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {type.label}
                {count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {RULE_TYPES.map(type => (
          <TabsContent key={type.id} value={type.id} className="space-y-4">
            <p className="text-sm text-muted-foreground">{type.description}</p>
            
            {filteredRules.length === 0 ? (
              <Card className="p-8 text-center">
                <type.icon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No {type.label.toLowerCase()} rules configured yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    resetForm();
                    setFormData(prev => ({ ...prev, rule_type: type.id }));
                    setShowCreateDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {type.label} Rule
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredRules.map((rule) => {
                  const Icon = getRuleIcon(rule.rule_type);
                  return (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className={`transition-all ${!rule.is_active ? 'opacity-50' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${rule.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                                <Icon className={`h-5 w-5 ${rule.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{rule.rule_name}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    Priority: {rule.priority}
                                  </Badge>
                                  {rule.is_active ? (
                                    <Badge variant="default" className="bg-green-500">Active</Badge>
                                  ) : (
                                    <Badge variant="secondary">Inactive</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {rule.rule_action}
                                </p>
                                {Object.keys(rule.rule_condition || {}).length > 0 && (
                                  <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                                    {JSON.stringify(rule.rule_condition)}
                                  </code>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.is_active}
                                onCheckedChange={() => toggleRuleActive(rule)}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingRule(rule);
                                  setFormData({
                                    rule_type: rule.rule_type,
                                    rule_name: rule.rule_name,
                                    rule_condition: rule.rule_condition || {},
                                    rule_action: rule.rule_action,
                                    priority: rule.priority,
                                    is_active: rule.is_active,
                                  });
                                  setShowCreateDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(rule.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default AIAgentRulesManager;
