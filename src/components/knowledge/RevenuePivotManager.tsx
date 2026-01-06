import { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Save,
  Lightbulb,
  MessageSquare,
  Target,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface RevenuePivot {
  id: string;
  trigger_category: string;
  trigger_patterns: string[];
  librarian_response: string | null;
  revenue_response: string;
  cta_type: string | null;
  cta_link: string | null;
  priority: number;
  is_active: boolean;
}

interface IndustryPreset {
  id: string;
  industry_code: string;
  industry_name: string;
  pivot_patterns: any;
  closing_loops: any;
  default_cta: string | null;
}

export function RevenuePivotManager() {
  const { organization } = useOrganization();
  const [pivots, setPivots] = useState<RevenuePivot[]>([]);
  const [presets, setPresets] = useState<IndustryPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // New pivot form
  const [newPivot, setNewPivot] = useState({
    trigger_category: '',
    trigger_patterns: '',
    librarian_response: '',
    revenue_response: '',
    cta_type: '',
    cta_link: ''
  });

  useEffect(() => {
    if (organization?.id) {
      fetchData();
    }
  }, [organization?.id]);

  async function fetchData() {
    if (!organization?.id) return;
    
    setLoading(true);
    
    const [pivotsRes, presetsRes] = await Promise.all([
      supabase
        .from('revenue_pivots')
        .select('*')
        .eq('organization_id', organization.id)
        .order('priority', { ascending: false }),
      supabase
        .from('industry_presets')
        .select('*')
        .order('industry_name')
    ]);

    if (pivotsRes.data) setPivots(pivotsRes.data);
    if (presetsRes.data) setPresets(presetsRes.data);
    
    setLoading(false);
  }

  async function importFromPreset(presetId: string) {
    if (!organization?.id) return;

    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    setSaving(true);

    try {
      const pivotPatterns = preset.pivot_patterns || [];
      
      for (const pattern of pivotPatterns) {
        await supabase.from('revenue_pivots').insert({
          organization_id: organization.id,
          trigger_category: 'imported',
          trigger_patterns: [pattern.trigger],
          librarian_response: pattern.librarian,
          revenue_response: pattern.revenue,
          cta_type: 'default',
          priority: 1,
          is_active: true
        });
      }

      toast.success(`Imported ${pivotPatterns.length} revenue pivots from ${preset.industry_name}`);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to import pivots');
    } finally {
      setSaving(false);
    }
  }

  async function createPivot() {
    if (!organization?.id || !newPivot.trigger_category || !newPivot.revenue_response) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from('revenue_pivots').insert({
        organization_id: organization.id,
        trigger_category: newPivot.trigger_category,
        trigger_patterns: newPivot.trigger_patterns.split(',').map(s => s.trim()).filter(Boolean),
        librarian_response: newPivot.librarian_response || null,
        revenue_response: newPivot.revenue_response,
        cta_type: newPivot.cta_type || null,
        cta_link: newPivot.cta_link || null,
        priority: 1,
        is_active: true
      });

      if (error) throw error;

      toast.success('Revenue pivot created');
      setNewPivot({
        trigger_category: '',
        trigger_patterns: '',
        librarian_response: '',
        revenue_response: '',
        cta_type: '',
        cta_link: ''
      });
      fetchData();
    } catch (error: any) {
      toast.error('Failed to create pivot');
    } finally {
      setSaving(false);
    }
  }

  async function togglePivot(pivot: RevenuePivot) {
    const { error } = await supabase
      .from('revenue_pivots')
      .update({ is_active: !pivot.is_active })
      .eq('id', pivot.id);

    if (!error) {
      setPivots(pivots.map(p => 
        p.id === pivot.id ? { ...p, is_active: !p.is_active } : p
      ));
    }
  }

  async function deletePivot(pivotId: string) {
    const { error } = await supabase
      .from('revenue_pivots')
      .delete()
      .eq('id', pivotId);

    if (!error) {
      setPivots(pivots.filter(p => p.id !== pivotId));
      toast.success('Pivot deleted');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-500" />
            Revenue Pivots
          </h1>
          <p className="text-muted-foreground">
            Transform librarian answers into sales conversations
          </p>
        </div>
      </div>

      {/* Philosophy Card */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Lightbulb className="w-8 h-8 text-green-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg">The Revenue Pivot Rule</h3>
              <p className="text-muted-foreground mt-1">
                <strong>Librarian AI:</strong> "Yes, we do implants." (Cost Center)
              </p>
              <p className="text-primary mt-1">
                <strong>Revenue AI:</strong> "Yes, Dr. Smith is board-certified. We have a free consultation 
                slot tomorrow at 10 AM—should I reserve it?" (Revenue Generator)
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Every answer = <strong>FACT</strong> + <strong>CLOSING LOOP</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pivots" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pivots">Your Pivots ({pivots.length})</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="import">Import from Industry</TabsTrigger>
        </TabsList>

        <TabsContent value="pivots">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {pivots.map((pivot) => (
                <Card key={pivot.id} className={!pivot.is_active ? 'opacity-50' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{pivot.trigger_category}</Badge>
                          {pivot.trigger_patterns.map((pattern, idx) => (
                            <Badge key={idx} variant="secondary">{pattern}</Badge>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                              <MessageSquare className="w-4 h-4" />
                              <span className="text-xs font-medium">Librarian Would Say:</span>
                            </div>
                            <p className="text-sm">{pivot.librarian_response || 'N/A'}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <div className="flex items-center gap-2 mb-2 text-green-600">
                              <Target className="w-4 h-4" />
                              <span className="text-xs font-medium">Revenue AI Says:</span>
                            </div>
                            <p className="text-sm">{pivot.revenue_response}</p>
                          </div>
                        </div>

                        {pivot.cta_link && (
                          <p className="text-xs text-muted-foreground">
                            CTA: {pivot.cta_type} → {pivot.cta_link}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Switch
                          checked={pivot.is_active}
                          onCheckedChange={() => togglePivot(pivot)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deletePivot(pivot.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {pivots.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No revenue pivots configured</p>
                  <p className="text-sm">Import from an industry preset or create your own</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Revenue Pivot
              </CardTitle>
              <CardDescription>
                Define how your AI should pivot from answering to selling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trigger Category</Label>
                  <Select
                    value={newPivot.trigger_category}
                    onValueChange={(v) => setNewPivot({ ...newPivot, trigger_category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pricing_question">Pricing Question</SelectItem>
                      <SelectItem value="service_inquiry">Service Inquiry</SelectItem>
                      <SelectItem value="availability">Availability Check</SelectItem>
                      <SelectItem value="comparison">Comparison/Competition</SelectItem>
                      <SelectItem value="objection">Objection Handling</SelectItem>
                      <SelectItem value="general">General Information</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Trigger Patterns (comma-separated)</Label>
                  <Input
                    placeholder="price, cost, how much, investment"
                    value={newPivot.trigger_patterns}
                    onChange={(e) => setNewPivot({ ...newPivot, trigger_patterns: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Librarian Response (what a basic AI would say)</Label>
                <Textarea
                  placeholder="Our service costs $X."
                  value={newPivot.librarian_response}
                  onChange={(e) => setNewPivot({ ...newPivot, librarian_response: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-green-600">Revenue Response (what YOUR AI says) *</Label>
                <Textarea
                  placeholder="That investment includes [value]. Most clients see ROI within [timeframe]. Want me to show you the case study?"
                  value={newPivot.revenue_response}
                  onChange={(e) => setNewPivot({ ...newPivot, revenue_response: e.target.value })}
                  className="border-green-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CTA Type</Label>
                  <Select
                    value={newPivot.cta_type}
                    onValueChange={(v) => setNewPivot({ ...newPivot, cta_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select CTA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Book Appointment</SelectItem>
                      <SelectItem value="checkout">Checkout</SelectItem>
                      <SelectItem value="demo">Request Demo</SelectItem>
                      <SelectItem value="download">Download</SelectItem>
                      <SelectItem value="call">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>CTA Link (optional)</Label>
                  <Input
                    placeholder="https://calendly.com/..."
                    value={newPivot.cta_link}
                    onChange={(e) => setNewPivot({ ...newPivot, cta_link: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={createPivot} disabled={saving} className="w-full">
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Revenue Pivot
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Industry Presets</CardTitle>
              <CardDescription>
                Quickly add proven revenue pivots for your industry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {presets.map((preset) => {
                  const pivotCount = (preset.pivot_patterns || []).length;
                  return (
                    <Card 
                      key={preset.id} 
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => importFromPreset(preset.id)}
                    >
                      <CardContent className="pt-6 text-center">
                        <h4 className="font-semibold">{preset.industry_name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {pivotCount} pivot patterns
                        </p>
                        <Badge variant="secondary" className="mt-2">
                          {preset.default_cta || 'Click to import'}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}