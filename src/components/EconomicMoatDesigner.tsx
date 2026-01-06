import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, Castle, Lock, Sparkles, Plus,
  TrendingUp, Users, Database, Crown, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface Moat {
  id: string;
  moat_type: string;
  title: string;
  description: string;
  current_strength: number;
  target_strength: number;
  time_to_build_months: number;
  switching_cost_score: number;
  copyability_score: number;
  compounds_with_time: boolean;
  progress_percent: number;
  status: string;
}

const moatTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
  pricing_power: { icon: TrendingUp, color: 'text-green-400', label: 'Pricing Power' },
  data_lock_in: { icon: Database, color: 'text-blue-400', label: 'Data Lock-in' },
  workflow_dependency: { icon: Lock, color: 'text-purple-400', label: 'Workflow Dependency' },
  trust_asymmetry: { icon: Shield, color: 'text-amber-400', label: 'Trust Asymmetry' },
  category_ownership: { icon: Crown, color: 'text-pink-400', label: 'Category Ownership' },
  network_effects: { icon: Users, color: 'text-cyan-400', label: 'Network Effects' },
  brand_equity: { icon: Award, color: 'text-orange-400', label: 'Brand Equity' }
};

export default function EconomicMoatDesigner() {
  const [moats, setMoats] = useState<Moat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { organization } = useOrganization();

  const [newMoat, setNewMoat] = useState({
    moat_type: 'pricing_power',
    title: '',
    description: '',
    current_strength: 20,
    target_strength: 80,
    time_to_build_months: 12,
    switching_cost_score: 5,
    copyability_score: 5
  });

  useEffect(() => {
    if (organization?.id) fetchMoats();
  }, [organization?.id]);

  const fetchMoats = async () => {
    try {
      const { data, error } = await supabase
        .from('economic_moats')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('current_strength', { ascending: false });
      
      if (error) throw error;
      setMoats(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMoat = async () => {
    if (!organization?.id || !newMoat.title) return;

    try {
      const { error } = await supabase
        .from('economic_moats')
        .insert({
          organization_id: organization.id,
          ...newMoat,
          compounds_with_time: true,
          progress_percent: Math.round((newMoat.current_strength / newMoat.target_strength) * 100),
          status: newMoat.current_strength >= 60 ? 'established' : 'building'
        });

      if (error) throw error;
      toast.success('Moat added');
      setShowAddModal(false);
      fetchMoats();
    } catch (error) {
      toast.error('Failed to add moat');
    }
  };

  const updateMoatStrength = async (id: string, strength: number) => {
    try {
      const moat = moats.find(m => m.id === id);
      if (!moat) return;

      const { error } = await supabase
        .from('economic_moats')
        .update({ 
          current_strength: strength,
          progress_percent: Math.round((strength / moat.target_strength) * 100),
          status: strength >= 60 ? 'established' : 'building'
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Strength updated');
      fetchMoats();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const overallMoatScore = moats.length > 0 
    ? Math.round(moats.reduce((sum, m) => sum + m.current_strength, 0) / moats.length)
    : 0;

  const establishedCount = moats.filter(m => m.status === 'established').length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
            🏰 Economic Moat Designer
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Design defensibility, not just growth. Why can't someone copy this?
            What compounds with time? Where does switching cost increase?
          </p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Moat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Design New Moat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Moat Type</label>
                <Select value={newMoat.moat_type} onValueChange={v => setNewMoat({...newMoat, moat_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(moatTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input 
                  placeholder="e.g., Proprietary pricing algorithm"
                  value={newMoat.title}
                  onChange={e => setNewMoat({...newMoat, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  placeholder="How does this create defensibility?"
                  value={newMoat.description}
                  onChange={e => setNewMoat({...newMoat, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Current Strength (0-100)</label>
                  <Input 
                    type="number"
                    min={0}
                    max={100}
                    value={newMoat.current_strength}
                    onChange={e => setNewMoat({...newMoat, current_strength: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Target Strength</label>
                  <Input 
                    type="number"
                    min={0}
                    max={100}
                    value={newMoat.target_strength}
                    onChange={e => setNewMoat({...newMoat, target_strength: parseInt(e.target.value) || 80})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Switching Cost (1-10)</label>
                  <Input 
                    type="number"
                    min={1}
                    max={10}
                    value={newMoat.switching_cost_score}
                    onChange={e => setNewMoat({...newMoat, switching_cost_score: parseInt(e.target.value) || 5})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Copyability (1=easy, 10=impossible)</label>
                  <Input 
                    type="number"
                    min={1}
                    max={10}
                    value={newMoat.copyability_score}
                    onChange={e => setNewMoat({...newMoat, copyability_score: parseInt(e.target.value) || 5})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button onClick={addMoat}>Design Moat</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-primary/20">
              <Castle className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold gradient-text">{overallMoatScore}</span>
                <span className="text-muted-foreground">/100 Overall Moat Score</span>
              </div>
              <Progress value={overallMoatScore} className="h-3" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">{establishedCount}</div>
              <div className="text-sm text-muted-foreground">Established Moats</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moats Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {moats.length === 0 ? (
          <Card className="col-span-2 p-8 text-center">
            <Castle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Moats Designed Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start building defensibility. What makes your business hard to copy?
            </p>
            <Button onClick={() => setShowAddModal(true)}>Design First Moat</Button>
          </Card>
        ) : (
          moats.map((moat, index) => {
            const config = moatTypeConfig[moat.moat_type] || moatTypeConfig.pricing_power;
            const Icon = config.icon;

            return (
              <motion.div
                key={moat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn(
                  "h-full",
                  moat.status === 'established' && "border-green-500/30"
                )}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg bg-muted", config.color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{moat.title}</h3>
                          <Badge variant="outline" className="text-xs mt-1">
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                      {moat.status === 'established' && (
                        <Badge className="bg-green-500 text-white">ESTABLISHED</Badge>
                      )}
                    </div>

                    {moat.description && (
                      <p className="text-sm text-muted-foreground mb-4">{moat.description}</p>
                    )}

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Strength</span>
                          <span className="font-medium">{moat.current_strength}%</span>
                        </div>
                        <Progress value={moat.current_strength} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-2 rounded bg-muted/50 text-center">
                          <div className="text-xs text-muted-foreground">Switching Cost</div>
                          <div className="font-bold">{moat.switching_cost_score}/10</div>
                        </div>
                        <div className="p-2 rounded bg-muted/50 text-center">
                          <div className="text-xs text-muted-foreground">Uncopyable</div>
                          <div className="font-bold">{moat.copyability_score}/10</div>
                        </div>
                      </div>

                      {moat.compounds_with_time && (
                        <div className="flex items-center gap-2 text-xs text-green-400">
                          <Sparkles className="w-3 h-3" />
                          Compounds over time
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Philosophy */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">💡 The Asset Mindset</h3>
          <p className="text-muted-foreground">
            "This is what turns businesses into assets, not income streams.
            The AI continuously asks: Why can't someone copy this? What compounds with time?
            Where does switching cost increase?"
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
