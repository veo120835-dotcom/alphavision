import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  DollarSign,
  Target,
  Users,
  Bot,
  Zap,
  Save,
  RefreshCw,
  CreditCard,
  Link2,
  Calendar,
  TrendingUp,
  Gift,
  ShieldCheck,
  Sparkles,
  Building2,
  Globe,
  MessageSquare,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BusinessConfig {
  id?: string;
  organization_id: string;
  product_name: string;
  product_description: string;
  base_price: number;
  upsell_price: number;
  downsell_price: number;
  currency: string;
  stripe_payment_link: string;
  stripe_upsell_link: string;
  stripe_downsell_link: string;
  booking_link: string;
  system_persona: string;
  brand_voice: string;
  closing_style: string;
  target_niche: string;
  target_location: string;
  target_company_size: string;
  ideal_deal_value: number;
  upsell_enabled: boolean;
  upsell_name: string;
  upsell_pitch: string;
  upsell_delay_seconds: number;
  referral_enabled: boolean;
  referral_bonus: number;
  referral_discount: number;
  referral_pitch: string;
  retention_enabled: boolean;
  save_offer_type: string;
  save_offer_duration_days: number;
  save_offer_pitch: string;
}

const defaultConfig: Omit<BusinessConfig, 'organization_id'> = {
  product_name: 'High-Ticket Consulting',
  product_description: 'Expert consulting services that transform businesses',
  base_price: 5000,
  upsell_price: 1000,
  downsell_price: 27,
  currency: 'USD',
  stripe_payment_link: '',
  stripe_upsell_link: '',
  stripe_downsell_link: '',
  booking_link: '',
  system_persona: 'You are a direct, friendly sales closer who focuses on value and results.',
  brand_voice: 'Professional Maverick',
  closing_style: 'consultative',
  target_niche: 'SaaS Founders',
  target_location: '',
  target_company_size: '10-50',
  ideal_deal_value: 5000,
  upsell_enabled: true,
  upsell_name: 'Fast-Track Package',
  upsell_pitch: 'Get results in half the time with priority support and weekly calls.',
  upsell_delay_seconds: 60,
  referral_enabled: true,
  referral_bonus: 500,
  referral_discount: 500,
  referral_pitch: 'Know someone who needs this? Refer them for $500 each!',
  retention_enabled: true,
  save_offer_type: 'pause_billing',
  save_offer_duration_days: 30,
  save_offer_pitch: 'Let me pause your billing for a month so you can catch up on the features.',
};

export function AdminDashboard() {
  const { organization } = useOrganization();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("product");

  useEffect(() => {
    if (organization?.id) {
      fetchConfig();
    }
  }, [organization?.id]);

  const fetchConfig = async () => {
    if (!organization?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('business_config')
      .select('*')
      .eq('organization_id', organization.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No config exists, create default
      setConfig({ ...defaultConfig, organization_id: organization.id } as BusinessConfig);
    } else if (data) {
      setConfig(data as BusinessConfig);
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    if (!config || !organization?.id) return;
    setSaving(true);

    try {
      if (config.id) {
        const { error } = await supabase
          .from('business_config')
          .update(config)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('business_config')
          .insert({ ...config, organization_id: organization.id })
          .select()
          .single();
        if (error) throw error;
        setConfig(data as BusinessConfig);
      }
      toast.success('Configuration saved! Your AI agents are now updated.');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof BusinessConfig, value: any) => {
    if (config) {
      setConfig({ ...config, [field]: value });
    }
  };

  if (adminLoading || loading || !config) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="border-destructive max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              You don't have permission to access Mission Control. Please contact an administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold gradient-text flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Mission Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your AI agents, pricing, and automation rules
          </p>
        </div>
        <Button onClick={saveConfig} disabled={saving} size="lg">
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${config.base_price.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Base Price</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${config.upsell_price.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Upsell Price</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Gift className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${config.referral_bonus}</p>
                <p className="text-xs text-muted-foreground">Referral Bonus</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Target className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{config.target_niche}</p>
                <p className="text-xs text-muted-foreground">Target Market</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/30 p-1">
          <TabsTrigger value="product" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Product & Pricing
          </TabsTrigger>
          <TabsTrigger value="persona" className="gap-2">
            <Bot className="w-4 h-4" />
            AI Persona
          </TabsTrigger>
          <TabsTrigger value="upsell" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Upsell Agent
          </TabsTrigger>
          <TabsTrigger value="referral" className="gap-2">
            <Gift className="w-4 h-4" />
            Referral Agent
          </TabsTrigger>
          <TabsTrigger value="retention" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            Retention Agent
          </TabsTrigger>
        </TabsList>

        {/* Product & Pricing Tab */}
        <TabsContent value="product" className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Product Information
                </CardTitle>
                <CardDescription>Define what you're selling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    value={config.product_name}
                    onChange={(e) => updateConfig('product_name', e.target.value)}
                    placeholder="e.g., Executive Coaching Package"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={config.product_description}
                    onChange={(e) => updateConfig('product_description', e.target.value)}
                    placeholder="What makes your offer unique?"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={config.currency} onValueChange={(v) => updateConfig('currency', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Base Price</Label>
                    <Input
                      type="number"
                      value={config.base_price}
                      onChange={(e) => updateConfig('base_price', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" />
                  Payment & Booking Links
                </CardTitle>
                <CardDescription>Connect your payment and scheduling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Stripe Payment Link</Label>
                  <Input
                    value={config.stripe_payment_link}
                    onChange={(e) => updateConfig('stripe_payment_link', e.target.value)}
                    placeholder="https://buy.stripe.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upsell Payment Link</Label>
                  <Input
                    value={config.stripe_upsell_link}
                    onChange={(e) => updateConfig('stripe_upsell_link', e.target.value)}
                    placeholder="https://buy.stripe.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Downsell Payment Link (${config.downsell_price})</Label>
                  <Input
                    value={config.stripe_downsell_link}
                    onChange={(e) => updateConfig('stripe_downsell_link', e.target.value)}
                    placeholder="https://buy.stripe.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Booking/Calendar Link</Label>
                  <Input
                    value={config.booking_link}
                    onChange={(e) => updateConfig('booking_link', e.target.value)}
                    placeholder="https://calendly.com/..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Target Market
              </CardTitle>
              <CardDescription>Define your ideal customer profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Target Niche</Label>
                  <Input
                    value={config.target_niche}
                    onChange={(e) => updateConfig('target_niche', e.target.value)}
                    placeholder="e.g., SaaS Founders"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location (Optional)</Label>
                  <Input
                    value={config.target_location || ''}
                    onChange={(e) => updateConfig('target_location', e.target.value)}
                    placeholder="e.g., Austin, TX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Size</Label>
                  <Select value={config.target_company_size || ''} onValueChange={(v) => updateConfig('target_company_size', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="10-50">10-50 employees</SelectItem>
                      <SelectItem value="50-200">50-200 employees</SelectItem>
                      <SelectItem value="200+">200+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ideal Deal Value</Label>
                  <Input
                    type="number"
                    value={config.ideal_deal_value}
                    onChange={(e) => updateConfig('ideal_deal_value', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Persona Tab */}
        <TabsContent value="persona" className="mt-6 space-y-6">
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                AI Agent Personality
              </CardTitle>
              <CardDescription>Customize how your AI agents communicate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>System Persona (Master Prompt)</Label>
                <Textarea
                  value={config.system_persona}
                  onChange={(e) => updateConfig('system_persona', e.target.value)}
                  placeholder="Describe the personality and approach your AI should use..."
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  This is injected into every AI agent. Be specific about tone, style, and values.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand Voice</Label>
                  <Select value={config.brand_voice} onValueChange={(v) => updateConfig('brand_voice', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional Maverick">Professional Maverick</SelectItem>
                      <SelectItem value="Friendly Expert">Friendly Expert</SelectItem>
                      <SelectItem value="Direct Closer">Direct Closer</SelectItem>
                      <SelectItem value="Consultative Advisor">Consultative Advisor</SelectItem>
                      <SelectItem value="Casual Coach">Casual Coach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Closing Style</Label>
                  <Select value={config.closing_style} onValueChange={(v) => updateConfig('closing_style', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultative">Consultative (Ask questions)</SelectItem>
                      <SelectItem value="assumptive">Assumptive (Assume the sale)</SelectItem>
                      <SelectItem value="urgency">Urgency-Based (Scarcity)</SelectItem>
                      <SelectItem value="value">Value-Led (ROI focused)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upsell Agent Tab */}
        <TabsContent value="upsell" className="mt-6 space-y-6">
          <Card className="card-glow border-blue-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    Upsell Agent - "The McDonald's Logic"
                  </CardTitle>
                  <CardDescription>
                    30% of customers will buy a VIP version if asked immediately after purchase
                  </CardDescription>
                </div>
                <Switch
                  checked={config.upsell_enabled}
                  onCheckedChange={(v) => updateConfig('upsell_enabled', v)}
                />
              </div>
            </CardHeader>
            <CardContent className={cn("space-y-4", !config.upsell_enabled && "opacity-50 pointer-events-none")}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Upsell Name</Label>
                  <Input
                    value={config.upsell_name}
                    onChange={(e) => updateConfig('upsell_name', e.target.value)}
                    placeholder="e.g., Fast-Track Package"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upsell Price</Label>
                  <Input
                    type="number"
                    value={config.upsell_price}
                    onChange={(e) => updateConfig('upsell_price', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Upsell Pitch</Label>
                <Textarea
                  value={config.upsell_pitch}
                  onChange={(e) => updateConfig('upsell_pitch', e.target.value)}
                  placeholder="What's the benefit of the upsell?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Delay After Purchase (seconds)</Label>
                <Input
                  type="number"
                  value={config.upsell_delay_seconds}
                  onChange={(e) => updateConfig('upsell_delay_seconds', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Wait this many seconds after payment confirmation before sending upsell message
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referral Agent Tab */}
        <TabsContent value="referral" className="mt-6 space-y-6">
          <Card className="card-glow border-purple-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-400" />
                    Referral Agent - "The Viral Logic"
                  </CardTitle>
                  <CardDescription>
                    Happy customers are your best sales reps - make it easy for them to refer
                  </CardDescription>
                </div>
                <Switch
                  checked={config.referral_enabled}
                  onCheckedChange={(v) => updateConfig('referral_enabled', v)}
                />
              </div>
            </CardHeader>
            <CardContent className={cn("space-y-4", !config.referral_enabled && "opacity-50 pointer-events-none")}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Referral Bonus (to referrer)</Label>
                  <Input
                    type="number"
                    value={config.referral_bonus}
                    onChange={(e) => updateConfig('referral_bonus', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount (to referred)</Label>
                  <Input
                    type="number"
                    value={config.referral_discount}
                    onChange={(e) => updateConfig('referral_discount', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Referral Pitch</Label>
                <Textarea
                  value={config.referral_pitch}
                  onChange={(e) => updateConfig('referral_pitch', e.target.value)}
                  placeholder="The message sent to happy customers..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Agent Tab */}
        <TabsContent value="retention" className="mt-6 space-y-6">
          <Card className="card-glow border-amber-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    Retention Agent - "Anti-Churn Logic"
                  </CardTitle>
                  <CardDescription>
                    Detect cancellation intent and save customers before they leave
                  </CardDescription>
                </div>
                <Switch
                  checked={config.retention_enabled}
                  onCheckedChange={(v) => updateConfig('retention_enabled', v)}
                />
              </div>
            </CardHeader>
            <CardContent className={cn("space-y-4", !config.retention_enabled && "opacity-50 pointer-events-none")}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Save Offer Type</Label>
                  <Select value={config.save_offer_type} onValueChange={(v) => updateConfig('save_offer_type', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pause_billing">Pause Billing</SelectItem>
                      <SelectItem value="discount">Offer Discount</SelectItem>
                      <SelectItem value="downgrade">Downgrade Plan</SelectItem>
                      <SelectItem value="call">Schedule Save Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pause Duration (days)</Label>
                  <Input
                    type="number"
                    value={config.save_offer_duration_days}
                    onChange={(e) => updateConfig('save_offer_duration_days', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Save Offer Pitch</Label>
                <Textarea
                  value={config.save_offer_pitch}
                  onChange={(e) => updateConfig('save_offer_pitch', e.target.value)}
                  placeholder="What to say when customer wants to cancel..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;