import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowDownRight, 
  DollarSign, 
  Package, 
  Zap,
  Settings,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Target,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface DownsellProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  paymentLink: string;
}

interface DownsellEvent {
  id: string;
  lead_name: string;
  original_offer: string;
  original_price: number;
  downsell_offer: string;
  downsell_price: number;
  status: 'pending' | 'converted' | 'rejected';
  created_at: string;
}

export function DownsellAutomation() {
  const { organization } = useOrganization();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggerThreshold, setTriggerThreshold] = useState(1000); // Trigger downsell for rejections > $1000
  const [autoSequence, setAutoSequence] = useState(true);
  const [products, setProducts] = useState<DownsellProduct[]>([
    { id: '1', name: 'Digital Playbook', price: 27, description: 'Complete guide to [TOPIC]', paymentLink: '' },
    { id: '2', name: 'Mini Course', price: 47, description: '3-part video series', paymentLink: '' },
    { id: '3', name: 'Templates Pack', price: 17, description: 'Ready-to-use templates', paymentLink: '' },
  ]);
  const [events, setEvents] = useState<DownsellEvent[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, description: '', paymentLink: '' });
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      loadEvents();
      loadConfig();

      // Real-time subscription for downsell events
      const channel = supabase
        .channel('downsell-events-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'revenue_events',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            const event = payload.new as any;
            if (event.event_type === 'downsell_converted') {
              toast.success(`Downsell converted! +$${event.amount}`);
              loadEvents();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [organization?.id]);

  const loadConfig = async () => {
    if (!organization?.id) return;
    
    const { data } = await supabase
      .from('memory_items')
      .select('content')
      .eq('organization_id', organization.id)
      .eq('type', 'config')
      .eq('title', 'downsell_automation')
      .single();
    
    if (data?.content) {
      const content = data.content as any;
      if (content.products) setProducts(content.products);
      if (content.triggerThreshold) setTriggerThreshold(content.triggerThreshold);
      if (content.autoSequence !== undefined) setAutoSequence(content.autoSequence);
      if (content.enabled !== undefined) setEnabled(content.enabled);
    }
  };

  const saveConfig = async () => {
    if (!organization?.id) return;
    
    setSaving(true);
    try {
      const configData = { products, triggerThreshold, autoSequence, enabled };
      
      const { data: existing } = await supabase
        .from('memory_items')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('type', 'config')
        .eq('title', 'downsell_automation')
        .single();

      if (existing) {
        await supabase
          .from('memory_items')
          .update({ content: configData as any })
          .eq('id', existing.id);
      } else {
        await supabase.from('memory_items').insert({
          organization_id: organization.id,
          type: 'config',
          title: 'downsell_automation',
          content: configData as any
        });
      }
      
      toast.success('Downsell configuration saved!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const loadEvents = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      // Load revenue events that are downsells
      const { data } = await supabase
        .from('revenue_events')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('event_type', 'downsell_converted')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        // Transform to DownsellEvent format
        const transformedEvents: DownsellEvent[] = data.map(e => ({
          id: e.id,
          lead_name: (e.metadata as any)?.lead_name || 'Unknown Lead',
          original_offer: (e.metadata as any)?.original_offer || 'High-Ticket Service',
          original_price: (e.metadata as any)?.original_price || 2500,
          downsell_offer: (e.metadata as any)?.downsell_offer || 'Digital Product',
          downsell_price: e.amount || 27,
          status: 'converted',
          created_at: e.created_at
        }));
        setEvents(transformedEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulateDownsell = async () => {
    if (!organization?.id) return;

    const leadNames = ['Sarah M.', 'John D.', 'Emily R.', 'Michael K.', 'Lisa T.'];
    const originalOffers = ['Premium Coaching ($2,500)', 'Consulting Package ($1,997)', 'Group Program ($997)'];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const originalOffer = originalOffers[Math.floor(Math.random() * originalOffers.length)];

    try {
      // Log the agent action
      await supabase.from('agent_execution_logs').insert({
        organization_id: organization.id,
        action_type: 'closer',
        reasoning: `Lead rejected ${originalOffer}. Downsell logic triggered.`,
        result: `Offered ${randomProduct.name} at $${randomProduct.price} as alternative`
      });

      // Create revenue event if converted
      const converted = Math.random() > 0.3; // 70% conversion simulation
      if (converted) {
        await supabase.from('revenue_events').insert({
          organization_id: organization.id,
          event_type: 'downsell_converted',
          amount: randomProduct.price,
          currency: 'USD',
          payment_provider: 'stripe',
          metadata: {
            lead_name: leadNames[Math.floor(Math.random() * leadNames.length)],
            original_offer: originalOffer,
            original_price: parseInt(originalOffer.match(/\$(\d+,?\d*)/)?.[1]?.replace(',', '') || '0'),
            downsell_offer: randomProduct.name
          }
        });
        toast.success(`Downsell converted! ${randomProduct.name} sold for $${randomProduct.price}`);
      } else {
        toast.info('Downsell offered, awaiting response...');
      }

      loadEvents();
    } catch (error) {
      console.error('Error simulating downsell:', error);
      toast.error('Failed to simulate downsell');
    }
  };

  const addProduct = () => {
    if (!newProduct.name || newProduct.price <= 0) {
      toast.error('Please fill in product name and price');
      return;
    }

    const product: DownsellProduct = {
      id: Date.now().toString(),
      ...newProduct
    };

    setProducts(prev => [...prev, product]);
    setNewProduct({ name: '', price: 0, description: '', paymentLink: '' });
    setShowAddProduct(false);
    toast.success('Downsell product added!');
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Product removed');
  };

  const totalDownsellRevenue = events.reduce((sum, e) => sum + e.downsell_price, 0);
  const conversionRate = events.length > 0 ? Math.round((events.filter(e => e.status === 'converted').length / events.length) * 100) : 0;
  const avgDownsellValue = events.length > 0 ? Math.round(totalDownsellRevenue / events.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            <ArrowDownRight className="w-6 h-6 text-orange-400" />
            Downsell Automation
          </h2>
          <p className="text-muted-foreground mt-1">Auto-pivot to $27 assets when high-ticket offers are rejected</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 glass rounded-full px-4 py-2">
            <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-sm font-medium">{enabled ? 'Active' : 'Paused'}</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <Button onClick={saveConfig} variant="outline" size="sm" disabled={saving}>
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Save
          </Button>
          <Button onClick={simulateDownsell} variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Simulate Rejection
          </Button>
        </div>
      </div>

      {/* Trigger Settings */}
      <Card className="card-glow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Trigger Threshold:</span>
                <Badge variant="secondary">${triggerThreshold}+</Badge>
              </div>
              <div className="flex gap-2">
                {[500, 1000, 2000, 5000].map(threshold => (
                  <Button
                    key={threshold}
                    size="sm"
                    variant={triggerThreshold === threshold ? 'default' : 'outline'}
                    onClick={() => setTriggerThreshold(threshold)}
                  >
                    ${threshold}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Auto-Sequence</span>
              <Switch checked={autoSequence} onCheckedChange={setAutoSequence} />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-glow border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <DollarSign className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalDownsellRevenue}</p>
                <p className="text-sm text-muted-foreground">Recovered Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <p className="text-sm text-muted-foreground">Downsell Conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${avgDownsellValue}</p>
                <p className="text-sm text-muted-foreground">Avg Downsell Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-sm text-muted-foreground">Leads Recovered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downsell Products */}
        <Card className="card-glow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Downsell Products
                </CardTitle>
                <CardDescription>Low-tier offers for rejected leads</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddProduct(!showAddProduct)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Product Form */}
            <AnimatePresence>
              {showAddProduct && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-lg bg-muted/50 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Product name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Price ($)"
                      value={newProduct.price || ''}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <Input
                    placeholder="Payment link (optional)"
                    value={newProduct.paymentLink}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, paymentLink: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button onClick={addProduct} size="sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowAddProduct(false)}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Product List */}
            <div className="space-y-3">
              {products.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Package className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.name}</span>
                      <Badge className="bg-green-500/20 text-green-400">${product.price}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProduct(product.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Downsell Flow Visualization */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-orange-400" />
              Downsell Logic Flow
            </CardTitle>
            <CardDescription>Automatic fallback sequence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Flow Steps */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-500/20">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">High-Ticket Offer Rejected</p>
                  <p className="text-sm text-muted-foreground">$997+ service declined</p>
                </div>
              </div>

              <div className="ml-6 border-l-2 border-dashed border-muted-foreground/30 pl-6 py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-primary" />
                  Closer Agent triggers downsell logic
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-500/20">
                  <ArrowDownRight className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Pivot to Low-Tier Offer</p>
                  <p className="text-sm text-muted-foreground">Offer $27-$97 digital product</p>
                </div>
              </div>

              <div className="ml-6 border-l-2 border-dashed border-muted-foreground/30 pl-6 py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  "I understand [OFFER] isn't right for you right now. Would this help?"
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Revenue Recovered</p>
                  <p className="text-sm text-muted-foreground">Lead enters nurture sequence</p>
                </div>
              </div>
            </div>

            {/* Recent Downsells */}
            <div className="pt-4 border-t border-border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                Recent Downsell Events
              </h4>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <div className="flex-1">
                        <p className="text-sm">{event.lead_name}: {event.downsell_offer}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.original_offer} → ${event.downsell_price}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-green-400">+${event.downsell_price}</span>
                    </div>
                  ))}

                  {events.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No downsell events yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}