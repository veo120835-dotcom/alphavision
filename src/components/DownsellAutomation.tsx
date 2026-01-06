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
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Target,
  Users
} from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { useMockStorage, generateMockId, generateMockTimestamp } from "@/hooks/useMockStorage";
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
  const storageKey = `downsell_events_${organization?.id || 'default'}`;
  const configKey = `downsell_config_${organization?.id || 'default'}`;
  
  const { data: events, addItem, loading } = useMockStorage<DownsellEvent>(storageKey, []);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggerThreshold, setTriggerThreshold] = useState(1000);
  const [autoSequence, setAutoSequence] = useState(true);
  const [products, setProducts] = useState<DownsellProduct[]>([
    { id: '1', name: 'Digital Playbook', price: 27, description: 'Complete guide to [TOPIC]', paymentLink: '' },
    { id: '2', name: 'Mini Course', price: 47, description: '3-part video series', paymentLink: '' },
    { id: '3', name: 'Templates Pack', price: 17, description: 'Ready-to-use templates', paymentLink: '' },
  ]);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, description: '', paymentLink: '' });
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [organization?.id]);

  const loadConfig = () => {
    try {
      const stored = localStorage.getItem(configKey);
      if (stored) {
        const content = JSON.parse(stored);
        if (content.products) setProducts(content.products);
        if (content.triggerThreshold) setTriggerThreshold(content.triggerThreshold);
        if (content.autoSequence !== undefined) setAutoSequence(content.autoSequence);
        if (content.enabled !== undefined) setEnabled(content.enabled);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const configData = { products, triggerThreshold, autoSequence, enabled };
      localStorage.setItem(configKey, JSON.stringify(configData));
      toast.success('Downsell configuration saved!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const simulateDownsell = () => {
    const leadNames = ['Sarah M.', 'John D.', 'Emily R.', 'Michael K.', 'Lisa T.'];
    const originalOffers = ['Premium Coaching ($2,500)', 'Consulting Package ($1,997)', 'Group Program ($997)'];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const originalOffer = originalOffers[Math.floor(Math.random() * originalOffers.length)];
    const converted = Math.random() > 0.3;

    const newEvent: DownsellEvent = {
      id: generateMockId(),
      lead_name: leadNames[Math.floor(Math.random() * leadNames.length)],
      original_offer: originalOffer,
      original_price: parseInt(originalOffer.match(/\$(\d+,?\d*)/)?.[1]?.replace(',', '') || '0'),
      downsell_offer: randomProduct.name,
      downsell_price: randomProduct.price,
      status: converted ? 'converted' : 'pending',
      created_at: generateMockTimestamp()
    };

    addItem(newEvent);

    if (converted) {
      toast.success(`Downsell converted! ${randomProduct.name} sold for $${randomProduct.price}`);
    } else {
      toast.info('Downsell offered, awaiting response...');
    }
  };

  const addProduct = () => {
    if (!newProduct.name || newProduct.price <= 0) {
      toast.error('Please fill in product name and price');
      return;
    }

    const product: DownsellProduct = {
      id: generateMockId(),
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

  const totalDownsellRevenue = events.filter(e => e.status === 'converted').reduce((sum, e) => sum + e.downsell_price, 0);
  const conversionRate = events.length > 0 ? Math.round((events.filter(e => e.status === 'converted').length / events.length) * 100) : 0;
  const avgDownsellValue = events.filter(e => e.status === 'converted').length > 0 
    ? Math.round(totalDownsellRevenue / events.filter(e => e.status === 'converted').length) 
    : 0;

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
                <p className="text-2xl font-bold">{events.filter(e => e.status === 'converted').length}</p>
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

        {/* Recent Events */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400" />
              Recent Downsell Events
            </CardTitle>
            <CardDescription>Track downsell conversions in real-time</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                <AnimatePresence>
                  {events.map((event, idx) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{event.lead_name}</span>
                        <Badge 
                          variant={event.status === 'converted' ? 'default' : 'outline'}
                          className={event.status === 'converted' ? 'bg-green-500/20 text-green-400' : ''}
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="line-through">{event.original_offer}</span>
                        <span className="mx-2">→</span>
                        <span className="text-foreground">{event.downsell_offer} (${event.downsell_price})</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {events.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ArrowDownRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No downsell events yet</p>
                    <p className="text-sm">Simulate a rejection to see the automation</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
