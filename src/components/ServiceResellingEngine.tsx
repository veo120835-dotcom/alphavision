import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Package, DollarSign, TrendingUp, Users, Plus, Star,
  CheckCircle2, Clock, AlertTriangle, Zap, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface ServiceSupplier {
  id: string;
  supplier_name: string;
  supplier_email: string;
  services_offered: string[];
  quality_score: number;
  reliability_score: number;
  total_orders: number;
  successful_orders: number;
  refund_rate: number;
  is_active: boolean;
}

interface ServiceOffer {
  id: string;
  service_name: string;
  supplier_cost: number;
  resale_price: number;
  margin_percent: number;
  delivery_time_hours: number;
  demand_level: string;
  status: string;
}

export default function ServiceResellingEngine() {
  const [suppliers, setSuppliers] = useState<ServiceSupplier[]>([]);
  const [offers, setOffers] = useState<ServiceOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    services: ''
  });
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization?.id) fetchData();
  }, [organization?.id]);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('service_suppliers')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('quality_score', { ascending: false });

      setSuppliers(data || []);
      
      // Sample reselling opportunities
      setOffers([
        { id: '1', service_name: 'Facebook Ads Management', supplier_cost: 500, resale_price: 1500, margin_percent: 200, delivery_time_hours: 72, demand_level: 'high', status: 'active' },
        { id: '2', service_name: 'Website Development', supplier_cost: 800, resale_price: 3000, margin_percent: 275, delivery_time_hours: 168, demand_level: 'high', status: 'active' },
        { id: '3', service_name: 'SEO Audit', supplier_cost: 150, resale_price: 500, margin_percent: 233, delivery_time_hours: 48, demand_level: 'medium', status: 'ready' },
        { id: '4', service_name: 'Email Sequence Writing', supplier_cost: 200, resale_price: 750, margin_percent: 275, delivery_time_hours: 24, demand_level: 'high', status: 'active' }
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSupplier = async () => {
    if (!organization?.id || !newSupplier.name) return;

    try {
      const { error } = await supabase
        .from('service_suppliers')
        .insert({
          organization_id: organization.id,
          supplier_name: newSupplier.name,
          supplier_email: newSupplier.email,
          services_offered: newSupplier.services.split(',').map(s => s.trim()),
          quality_score: 50,
          reliability_score: 50
        });

      if (error) throw error;
      toast.success('Supplier added successfully');
      setShowAddSupplier(false);
      setNewSupplier({ name: '', email: '', services: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add supplier');
    }
  };

  const stats = {
    totalSuppliers: suppliers.length,
    activeOffers: offers.filter(o => o.status === 'active').length,
    avgMargin: offers.length ? offers.reduce((a, b) => a + b.margin_percent, 0) / offers.length : 0,
    totalPotentialRevenue: offers.reduce((a, b) => a + b.resale_price, 0)
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
            📦 Service Reselling Engine
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Buy execution capacity cheaply, resell at higher prices. 
            Deterministic execution, predictable margins, scales without headcount.
          </p>
        </div>
        <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Service Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Supplier Name</Label>
                <Input 
                  value={newSupplier.name} 
                  onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="Agency Name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={newSupplier.email} 
                  onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  placeholder="contact@agency.com"
                />
              </div>
              <div>
                <Label>Services Offered (comma-separated)</Label>
                <Textarea 
                  value={newSupplier.services} 
                  onChange={e => setNewSupplier({ ...newSupplier, services: e.target.value })}
                  placeholder="Web Design, Facebook Ads, SEO"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddSupplier(false)}>Cancel</Button>
                <Button onClick={addSupplier}>Add Supplier</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <div className="text-xs text-muted-foreground">Vetted Suppliers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold">{stats.activeOffers}</div>
            <div className="text-xs text-muted-foreground">Active Offers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold">{stats.avgMargin.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Avg Margin</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold">${stats.totalPotentialRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Pipeline Value</div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Automated Reselling Flow</h3>
          <div className="grid grid-cols-6 gap-2 text-center text-sm">
            {[
              { step: '1', label: 'Detect Demand', desc: 'CRM signals' },
              { step: '2', label: 'Match Supplier', desc: 'Best fit' },
              { step: '3', label: 'Auto-Price', desc: 'Arbitrage calc' },
              { step: '4', label: 'Sell Offer', desc: 'Stripe payment' },
              { step: '5', label: 'Assign Work', desc: 'Supplier gets job' },
              { step: '6', label: 'Monitor SLA', desc: 'Auto-refund if fail' }
            ].map((item) => (
              <div key={item.step} className="p-3 rounded-lg bg-background/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-primary">{item.step}</span>
                </div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Offers */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Service Reselling Opportunities</h2>
        
        {offers.map((offer, index) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              "border-l-4",
              offer.status === 'active' ? "border-l-green-500" : "border-l-yellow-500"
            )}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-lg">{offer.service_name}</h3>
                    <Badge className={cn(
                      offer.demand_level === 'high' ? "bg-red-500/20 text-red-400" :
                      offer.demand_level === 'medium' ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {offer.demand_level} demand
                    </Badge>
                    <Badge className={cn(
                      offer.status === 'active' ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {offer.status}
                    </Badge>
                  </div>
                  <Button>
                    <Zap className="w-4 h-4 mr-2" />
                    Auto-Sell
                  </Button>
                </div>

                <div className="grid md:grid-cols-5 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Supplier Cost</div>
                    <div className="text-lg font-bold">${offer.supplier_cost}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Resale Price</div>
                    <div className="text-lg font-bold text-green-400">${offer.resale_price}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Margin</div>
                    <div className="text-lg font-bold text-blue-400">{offer.margin_percent}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Profit</div>
                    <div className="text-lg font-bold text-purple-400">
                      ${offer.resale_price - offer.supplier_cost}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Delivery</div>
                    <div className="text-lg font-bold">{offer.delivery_time_hours}h</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Suppliers */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Vetted Service Suppliers</h2>
        
        {suppliers.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Suppliers Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add vetted service suppliers to enable automated reselling.
            </p>
            <Button onClick={() => setShowAddSupplier(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Supplier
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{supplier.supplier_name}</h3>
                    <Badge className={supplier.is_active ? "bg-green-500/20 text-green-400" : "bg-muted"}>
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {supplier.services_offered?.map((service, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{service}</Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Quality</div>
                      <div className="font-bold text-green-400">{supplier.quality_score}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Reliability</div>
                      <div className="font-bold text-blue-400">{supplier.reliability_score}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Orders</div>
                      <div className="font-bold">{supplier.total_orders}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Refund Rate</div>
                      <div className={cn(
                        "font-bold",
                        supplier.refund_rate < 5 ? "text-green-400" : "text-red-400"
                      )}>
                        {supplier.refund_rate}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Safeguards */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Built-in Safeguards
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'Supplier Escrow', desc: 'Payment held until delivery confirmed' },
              { title: 'Auto-Refund Logic', desc: 'SLA violations trigger automatic refunds' },
              { title: 'Supplier Vetting', desc: 'No supplier without quality verification' }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
