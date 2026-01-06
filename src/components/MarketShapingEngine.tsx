import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Rocket,
  Target,
  Crown,
  TrendingUp,
  Megaphone,
  Lightbulb,
  Plus,
  ArrowUp,
  ArrowRight,
  Sparkles,
  DollarSign,
  Flag,
  Crosshair
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { Json } from '@/integrations/supabase/types';

interface MarketPosition {
  id: string;
  category_name: string;
  current_position: string | null;
  target_position: string | null;
  positioning_strategy: string | null;
  unique_mechanisms: Json;
  price_anchors: Json;
  market_narrative: string | null;
  differentiation_score: number | null;
}

interface CategoryMove {
  id: string;
  position_id: string | null;
  move_type: string;
  move_description: string;
  intended_effect: string | null;
  execution_status: string;
  market_response: Json;
  impact_assessment: string | null;
  created_at: string;
  executed_at: string | null;
}

const positionIcons: Record<string, React.ElementType> = {
  leader: Crown,
  challenger: Rocket,
  follower: ArrowRight,
  niche: Target
};

const strategyLabels: Record<string, string> = {
  category_creation: 'Category Creation',
  premium_anchor: 'Premium Anchor',
  value_reframe: 'Value Reframe',
  standard_setting: 'Standard Setting'
};

export default function MarketShapingEngine() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [showNewPosition, setShowNewPosition] = useState(false);
  const [showNewMove, setShowNewMove] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [newPosition, setNewPosition] = useState({
    category_name: '',
    current_position: 'follower',
    target_position: 'leader',
    positioning_strategy: 'category_creation',
    market_narrative: ''
  });
  const [newMove, setNewMove] = useState({
    move_type: 'new_term',
    move_description: '',
    intended_effect: ''
  });

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ['market-positions', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('market_positions')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MarketPosition[];
    },
    enabled: !!organization?.id
  });

  const { data: moves = [] } = useQuery({
    queryKey: ['category-moves', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('category_moves')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CategoryMove[];
    },
    enabled: !!organization?.id
  });

  const createPositionMutation = useMutation({
    mutationFn: async (pos: typeof newPosition) => {
      if (!organization?.id) throw new Error('No organization');
      const { error } = await supabase.from('market_positions').insert({
        organization_id: organization.id,
        ...pos,
        unique_mechanisms: [],
        price_anchors: {}
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-positions'] });
      setShowNewPosition(false);
      setNewPosition({
        category_name: '',
        current_position: 'follower',
        target_position: 'leader',
        positioning_strategy: 'category_creation',
        market_narrative: ''
      });
      toast.success('Market position created');
    }
  });

  const createMoveMutation = useMutation({
    mutationFn: async (move: typeof newMove & { position_id: string }) => {
      if (!organization?.id) throw new Error('No organization');
      const { error } = await supabase.from('category_moves').insert({
        organization_id: organization.id,
        ...move,
        execution_status: 'planned',
        market_response: {}
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-moves'] });
      setShowNewMove(false);
      setNewMove({ move_type: 'new_term', move_description: '', intended_effect: '' });
      toast.success('Category move created');
    }
  });

  const executeMoveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('category_moves')
        .update({ 
          execution_status: 'complete',
          executed_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-moves'] });
      toast.success('Move executed');
    }
  });

  const getUniqueMechanisms = (pos: MarketPosition): string[] => {
    if (!pos.unique_mechanisms) return [];
    if (Array.isArray(pos.unique_mechanisms)) return pos.unique_mechanisms as string[];
    return [];
  };

  const getPriceAnchors = (pos: MarketPosition): Record<string, number> => {
    if (!pos.price_anchors) return {};
    if (typeof pos.price_anchors === 'object' && !Array.isArray(pos.price_anchors)) {
      return pos.price_anchors as Record<string, number>;
    }
    return {};
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary" />
            Market Shaping Engine
          </h1>
          <p className="text-muted-foreground mt-1">
            Redefine categories, set standards, and anchor pricing
          </p>
        </div>
        <Dialog open={showNewPosition} onOpenChange={setShowNewPosition}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Position</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Define Market Position</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Category name (e.g., 'Revenue Automation')"
                value={newPosition.category_name}
                onChange={e => setNewPosition({ ...newPosition, category_name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Current Position</label>
                  <Select value={newPosition.current_position} onValueChange={v => setNewPosition({ ...newPosition, current_position: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leader">Leader</SelectItem>
                      <SelectItem value="challenger">Challenger</SelectItem>
                      <SelectItem value="follower">Follower</SelectItem>
                      <SelectItem value="niche">Niche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Target Position</label>
                  <Select value={newPosition.target_position} onValueChange={v => setNewPosition({ ...newPosition, target_position: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leader">Leader</SelectItem>
                      <SelectItem value="challenger">Challenger</SelectItem>
                      <SelectItem value="niche">Niche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Select value={newPosition.positioning_strategy} onValueChange={v => setNewPosition({ ...newPosition, positioning_strategy: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="category_creation">Category Creation</SelectItem>
                  <SelectItem value="premium_anchor">Premium Anchor</SelectItem>
                  <SelectItem value="value_reframe">Value Reframe</SelectItem>
                  <SelectItem value="standard_setting">Standard Setting</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Market narrative - the story you're telling..."
                value={newPosition.market_narrative}
                onChange={e => setNewPosition({ ...newPosition, market_narrative: e.target.value })}
              />
              <Button 
                className="w-full" 
                onClick={() => createPositionMutation.mutate(newPosition)}
                disabled={!newPosition.category_name}
              >
                Create Position
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Market Positions</p>
                <p className="text-2xl font-bold">{positions.length}</p>
              </div>
              <Flag className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Category Moves</p>
                <p className="text-2xl font-bold">{moves.length}</p>
              </div>
              <Rocket className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Executed</p>
                <p className="text-2xl font-bold text-green-500">
                  {moves.filter(m => m.execution_status === 'complete').length}
                </p>
              </div>
              <Crosshair className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Differentiation</p>
                <p className="text-2xl font-bold">
                  {positions.length > 0 
                    ? Math.round(positions.reduce((sum, p) => sum + (p.differentiation_score || 0), 0) / positions.length)
                    : 0}%
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="positions">
        <TabsList>
          <TabsTrigger value="positions">Market Positions</TabsTrigger>
          <TabsTrigger value="moves">Category Moves</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          {isLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : positions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No market positions defined</h3>
                <p className="text-muted-foreground mt-1">Define your market position to start shaping</p>
              </CardContent>
            </Card>
          ) : (
            positions.map(pos => {
              const Icon = positionIcons[pos.current_position || 'follower'];
              const TargetIcon = positionIcons[pos.target_position || 'leader'];
              const anchors = getPriceAnchors(pos);
              const mechanisms = getUniqueMechanisms(pos);
              
              return (
                <Card key={pos.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="py-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold">{pos.category_name}</h3>
                          <Badge variant="outline">
                            {strategyLabels[pos.positioning_strategy || ''] || pos.positioning_strategy}
                          </Badge>
                        </div>

                        {/* Position Journey */}
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <span className="capitalize">{pos.current_position}</span>
                          </div>
                          <ArrowRight className="h-5 w-5 text-primary" />
                          <div className="flex items-center gap-2">
                            <TargetIcon className="h-5 w-5 text-primary" />
                            <span className="capitalize font-medium text-primary">{pos.target_position}</span>
                          </div>
                        </div>

                        {/* Narrative */}
                        {pos.market_narrative && (
                          <p className="text-sm text-muted-foreground mt-4 italic">
                            "{pos.market_narrative}"
                          </p>
                        )}

                        {/* Price Anchors */}
                        {Object.keys(anchors).length > 0 && (
                          <div className="flex items-center gap-4 mt-4">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            {Object.entries(anchors).map(([key, value]) => (
                              <span key={key} className="text-sm">
                                <span className="text-muted-foreground capitalize">{key}:</span>{' '}
                                <span className="font-medium">${value.toLocaleString()}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Unique Mechanisms */}
                        {mechanisms.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {mechanisms.map((mech, idx) => (
                              <Badge key={idx} variant="secondary">{mech}</Badge>
                            ))}
                          </div>
                        )}

                        {/* Differentiation Score */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Differentiation Score</span>
                            <span className="font-medium">{pos.differentiation_score || 0}%</span>
                          </div>
                          <Progress value={pos.differentiation_score || 0} />
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedPosition(pos.id);
                          setShowNewMove(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Move
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="moves" className="space-y-4">
          {moves.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No category moves yet</h3>
                <p className="text-muted-foreground mt-1">Add moves to execute your market shaping strategy</p>
              </CardContent>
            </Card>
          ) : (
            moves.map(move => (
              <Card key={move.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{move.move_type.replace('_', ' ')}</Badge>
                        <Badge className={
                          move.execution_status === 'complete' ? 'bg-green-500/10 text-green-500' :
                          move.execution_status === 'executing' ? 'bg-blue-500/10 text-blue-500' :
                          move.execution_status === 'abandoned' ? 'bg-muted text-muted-foreground' :
                          'bg-yellow-500/10 text-yellow-500'
                        }>{move.execution_status}</Badge>
                      </div>
                      <p className="font-medium mt-2">{move.move_description}</p>
                      {move.intended_effect && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <Lightbulb className="h-3 w-3 inline mr-1" />
                          {move.intended_effect}
                        </p>
                      )}
                      {move.impact_assessment && (
                        <p className="text-sm mt-2 p-2 bg-muted/50 rounded">
                          Impact: {move.impact_assessment}
                        </p>
                      )}
                    </div>
                    {move.execution_status === 'planned' && (
                      <Button size="sm" onClick={() => executeMoveMutation.mutate(move.id)}>
                        Execute
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* New Move Dialog */}
      <Dialog open={showNewMove} onOpenChange={setShowNewMove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category Move</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newMove.move_type} onValueChange={v => setNewMove({ ...newMove, move_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new_term">New Term/Concept</SelectItem>
                <SelectItem value="pricing_anchor">Pricing Anchor</SelectItem>
                <SelectItem value="standard_definition">Standard Definition</SelectItem>
                <SelectItem value="narrative_shift">Narrative Shift</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Describe the move..."
              value={newMove.move_description}
              onChange={e => setNewMove({ ...newMove, move_description: e.target.value })}
            />
            <Input
              placeholder="Intended effect..."
              value={newMove.intended_effect}
              onChange={e => setNewMove({ ...newMove, intended_effect: e.target.value })}
            />
            <Button 
              className="w-full" 
              onClick={() => selectedPosition && createMoveMutation.mutate({ ...newMove, position_id: selectedPosition })}
              disabled={!newMove.move_description || !selectedPosition}
            >
              Create Move
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
