import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Pause, Play, AlertTriangle, CheckCircle2, 
  Lock, Unlock, Plus, Clock, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface FrictionBlock {
  id: string;
  block_type: string;
  target_action: string;
  reason: string;
  prerequisites: any;
  severity: string;
  is_active: boolean;
  override_allowed: boolean;
}

const blockTypeLabels: Record<string, string> = {
  launch_block: '🚀 Launch Block',
  scaling_block: '📈 Scaling Block',
  spending_block: '💰 Spending Block',
  hiring_block: '👥 Hiring Block'
};

const severityColors: Record<string, string> = {
  info: 'border-blue-500/30 bg-blue-500/5',
  warning: 'border-yellow-500/30 bg-yellow-500/5',
  hard_block: 'border-red-500/30 bg-red-500/5'
};

export default function StrategicFrictionEngine() {
  const [blocks, setBlocks] = useState<FrictionBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { organization } = useOrganization();

  const [newBlock, setNewBlock] = useState({
    block_type: 'launch_block',
    target_action: '',
    reason: '',
    severity: 'warning'
  });

  useEffect(() => {
    if (organization?.id) fetchBlocks();
  }, [organization?.id]);

  const fetchBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from('strategic_friction_blocks')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBlocks(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBlock = async () => {
    if (!organization?.id || !newBlock.target_action) return;

    try {
      const { error } = await supabase
        .from('strategic_friction_blocks')
        .insert({
          organization_id: organization.id,
          ...newBlock,
          is_active: true,
          override_allowed: newBlock.severity !== 'hard_block'
        });

      if (error) throw error;
      toast.success('Friction block added');
      setShowAddModal(false);
      setNewBlock({ block_type: 'launch_block', target_action: '', reason: '', severity: 'warning' });
      fetchBlocks();
    } catch (error) {
      toast.error('Failed to add block');
    }
  };

  const overrideBlock = async (id: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('strategic_friction_blocks')
        .update({ 
          is_active: false,
          overridden_at: new Date().toISOString(),
          override_reason: reason
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Block overridden');
      fetchBlocks();
    } catch (error) {
      toast.error('Failed to override');
    }
  };

  const resolveBlock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('strategic_friction_blocks')
        .update({ 
          is_active: false,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Block resolved');
      fetchBlocks();
    } catch (error) {
      toast.error('Failed to resolve');
    }
  };

  const activeBlocks = blocks.filter(b => b.is_active);
  const resolvedBlocks = blocks.filter(b => !b.is_active);

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
            ⏸️ Strategic Friction Engine
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Productive friction that prevents premature scaling and costly mistakes.
            Speed without readiness destroys businesses.
          </p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Block
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Strategic Block</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Block Type</label>
                <Select value={newBlock.block_type} onValueChange={v => setNewBlock({...newBlock, block_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="launch_block">Launch Block</SelectItem>
                    <SelectItem value="scaling_block">Scaling Block</SelectItem>
                    <SelectItem value="spending_block">Spending Block</SelectItem>
                    <SelectItem value="hiring_block">Hiring Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">What Action is Blocked?</label>
                <Input 
                  placeholder="e.g., Scale Facebook ads to $10k/day"
                  value={newBlock.target_action}
                  onChange={e => setNewBlock({...newBlock, target_action: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Why is it Blocked?</label>
                <Textarea 
                  placeholder="e.g., Pricing narrative not fixed yet..."
                  value={newBlock.reason}
                  onChange={e => setNewBlock({...newBlock, reason: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select value={newBlock.severity} onValueChange={v => setNewBlock({...newBlock, severity: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info (Reminder)</SelectItem>
                    <SelectItem value="warning">Warning (Override allowed)</SelectItem>
                    <SelectItem value="hard_block">Hard Block (No override)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button onClick={addBlock}>Add Block</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 text-center">
            <Pause className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <div className="text-2xl font-bold text-red-400">{activeBlocks.length}</div>
            <div className="text-sm text-muted-foreground">Active Blocks</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold text-green-400">{resolvedBlocks.length}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-primary">
              ${(activeBlocks.length * 15000).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Est. Mistakes Prevented</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Blocks */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Lock className="w-5 h-5 text-red-400" />
          Active Blocks
        </h2>

        {activeBlocks.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Play className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h3 className="font-medium mb-2">No Active Blocks</h3>
            <p className="text-sm text-muted-foreground">
              All systems go! But consider if there's anything that should wait.
            </p>
          </Card>
        ) : (
          activeBlocks.map((block, index) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={cn(severityColors[block.severity])}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{blockTypeLabels[block.block_type]}</Badge>
                        {block.severity === 'hard_block' && (
                          <Badge className="bg-red-500 text-white">HARD BLOCK</Badge>
                        )}
                      </div>
                      <h3 className="font-medium mb-1">
                        ⛔ {block.target_action}
                      </h3>
                      <p className="text-sm text-muted-foreground">{block.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => resolveBlock(block.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                      {block.override_allowed && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => overrideBlock(block.id, 'User override')}
                        >
                          <Unlock className="w-4 h-4 mr-1" />
                          Override
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Philosophy Card */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-primary/10 border-purple-500/30">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-2">💡 The Counter-Intuitive Truth</h3>
          <p className="text-muted-foreground">
            "The most expensive mistakes are fast ones. People pay a lot for someone who says 'no' correctly.
            This engine intentionally slows you down when speed would destroy leverage."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
