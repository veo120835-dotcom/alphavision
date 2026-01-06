import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, DollarSign, TrendingUp, Target, Zap, Plus,
  Mail, CheckCircle2, Clock, BarChart3, RefreshCw, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface LeadBuyer {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_company: string;
  niches: string[];
  max_cpl: number;
  trust_score: number;
  total_leads_purchased: number;
  total_spent: number;
  is_active: boolean;
}

interface ArbitragePlay {
  id: string;
  niche: string;
  source_cpl: number;
  resale_price: number;
  margin: number;
  volume_available: number;
  buyer_demand: number;
  status: string;
}

export default function LeadArbitrageEngine() {
  const [buyers, setBuyers] = useState<LeadBuyer[]>([]);
  const [plays, setPlays] = useState<ArbitragePlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBuyer, setShowAddBuyer] = useState(false);
  const [newBuyer, setNewBuyer] = useState({
    name: '',
    email: '',
    company: '',
    niches: '',
    maxCpl: 50
  });
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization?.id) fetchData();
  }, [organization?.id]);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('lead_buyers')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('total_spent', { ascending: false });

      setBuyers(data || []);
      
      // Generate sample arbitrage plays
      setPlays([
        { id: '1', niche: 'Real Estate', source_cpl: 15, resale_price: 45, margin: 200, volume_available: 500, buyer_demand: 800, status: 'active' },
        { id: '2', niche: 'Solar', source_cpl: 25, resale_price: 75, margin: 200, volume_available: 300, buyer_demand: 450, status: 'active' },
        { id: '3', niche: 'Insurance', source_cpl: 20, resale_price: 55, margin: 175, volume_available: 1000, buyer_demand: 600, status: 'ready' },
        { id: '4', niche: 'Legal', source_cpl: 35, resale_price: 120, margin: 243, volume_available: 150, buyer_demand: 200, status: 'monitoring' }
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBuyer = async () => {
    if (!organization?.id || !newBuyer.name) return;

    try {
      const { error } = await supabase
        .from('lead_buyers')
        .insert({
          organization_id: organization.id,
          buyer_name: newBuyer.name,
          buyer_email: newBuyer.email,
          buyer_company: newBuyer.company,
          niches: newBuyer.niches.split(',').map(n => n.trim()),
          max_cpl: newBuyer.maxCpl
        });

      if (error) throw error;
      toast.success('Buyer added successfully');
      setShowAddBuyer(false);
      setNewBuyer({ name: '', email: '', company: '', niches: '', maxCpl: 50 });
      fetchData();
    } catch (error) {
      toast.error('Failed to add buyer');
    }
  };

  const stats = {
    totalBuyers: buyers.length,
    activePlays: plays.filter(p => p.status === 'active').length,
    avgMargin: plays.length ? plays.reduce((a, b) => a + b.margin, 0) / plays.length : 0,
    totalDemand: plays.reduce((a, b) => a + b.buyer_demand, 0)
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
            🎯 Lead Arbitrage Engine
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Automated buying, filtering, and reselling of leads. Short cycles, 
            deterministic execution, fast capital turns.
          </p>
        </div>
        <Dialog open={showAddBuyer} onOpenChange={setShowAddBuyer}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Lead Buyer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Lead Buyer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Buyer Name</Label>
                <Input 
                  value={newBuyer.name} 
                  onChange={e => setNewBuyer({ ...newBuyer, name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={newBuyer.email} 
                  onChange={e => setNewBuyer({ ...newBuyer, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input 
                  value={newBuyer.company} 
                  onChange={e => setNewBuyer({ ...newBuyer, company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <Label>Niches (comma-separated)</Label>
                <Input 
                  value={newBuyer.niches} 
                  onChange={e => setNewBuyer({ ...newBuyer, niches: e.target.value })}
                  placeholder="Real Estate, Solar, Insurance"
                />
              </div>
              <div>
                <Label>Max CPL: ${newBuyer.maxCpl}</Label>
                <Input 
                  type="number"
                  value={newBuyer.maxCpl} 
                  onChange={e => setNewBuyer({ ...newBuyer, maxCpl: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddBuyer(false)}>Cancel</Button>
                <Button onClick={addBuyer}>Add Buyer</Button>
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
            <div className="text-2xl font-bold">{stats.totalBuyers}</div>
            <div className="text-xs text-muted-foreground">Vetted Buyers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold">{stats.activePlays}</div>
            <div className="text-xs text-muted-foreground">Active Plays</div>
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
            <Target className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold">{stats.totalDemand.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Demand</div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Automated Arbitrage Flow</h3>
          <div className="flex items-center justify-between">
            {[
              { label: 'Source Leads', desc: 'Ads / Marketplaces', icon: Target },
              { label: 'Auto-Qualify', desc: 'AI Scoring', icon: CheckCircle2 },
              { label: 'Route to Buyer', desc: 'Best Match', icon: Users },
              { label: 'Invoice', desc: 'Stripe', icon: DollarSign },
              { label: 'Monitor ROI', desc: 'Kill Switch', icon: BarChart3 }
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mx-auto mb-2">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-sm font-medium">{step.label}</div>
                  <div className="text-xs text-muted-foreground">{step.desc}</div>
                </div>
                {i < 4 && <ArrowRight className="w-5 h-5 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Arbitrage Plays */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Active Arbitrage Plays</h2>
        
        {plays.map((play, index) => (
          <motion.div
            key={play.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              "border-l-4",
              play.status === 'active' ? "border-l-green-500" :
              play.status === 'ready' ? "border-l-yellow-500" : "border-l-blue-500"
            )}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-lg">{play.niche} Leads</h3>
                    <Badge className={cn(
                      play.status === 'active' ? "bg-green-500/20 text-green-400" :
                      play.status === 'ready' ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-blue-500/20 text-blue-400"
                    )}>
                      {play.status}
                    </Badge>
                  </div>
                  <Button>
                    <Zap className="w-4 h-4 mr-2" />
                    Execute Play
                  </Button>
                </div>

                <div className="grid md:grid-cols-5 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Source CPL</div>
                    <div className="text-lg font-bold">${play.source_cpl}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Resale Price</div>
                    <div className="text-lg font-bold text-green-400">${play.resale_price}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Margin</div>
                    <div className="text-lg font-bold text-blue-400">{play.margin}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Available</div>
                    <div className="text-lg font-bold">{play.volume_available}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Buyer Demand</div>
                    <div className="text-lg font-bold text-purple-400">{play.buyer_demand}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Supply vs Demand Match</span>
                    <span>{((play.volume_available / play.buyer_demand) * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={(play.volume_available / play.buyer_demand) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Lead Buyers */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Vetted Lead Buyers</h2>
        
        {buyers.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Lead Buyers Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add vetted buyers to enable automated lead routing and invoicing.
            </p>
            <Button onClick={() => setShowAddBuyer(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Buyer
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {buyers.map((buyer) => (
              <Card key={buyer.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{buyer.buyer_name}</h3>
                    <Badge className={buyer.is_active ? "bg-green-500/20 text-green-400" : "bg-muted"}>
                      {buyer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">{buyer.buyer_company}</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {buyer.niches?.map((niche, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{niche}</Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Max CPL</div>
                      <div className="font-bold">${buyer.max_cpl}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Purchased</div>
                      <div className="font-bold">{buyer.total_leads_purchased}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Trust</div>
                      <div className="font-bold text-green-400">{buyer.trust_score}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
