import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package,
  Sparkles,
  DollarSign,
  TrendingUp,
  Rocket,
  BookOpen,
  Wrench,
  GraduationCap,
  FileText,
  Plus,
  Play,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { Json } from '@/integrations/supabase/types';

interface SuccessPattern {
  id: string;
  pattern_name: string;
  pattern_type: string;
  description: string;
  steps: Json;
  inputs_required: Json;
  outputs_delivered: Json;
  success_metrics: Json;
  repeatability_score: number | null;
  times_executed: number;
  avg_outcome_value: number | null;
  detected_at: string;
}

interface AutoProduct {
  id: string;
  source_pattern_id: string | null;
  product_type: string;
  product_name: string;
  product_description: string | null;
  pricing_model: string | null;
  suggested_price: number | null;
  actual_price: number | null;
  sales_page_content: Json;
  delivery_mechanism: string | null;
  status: string;
  total_sales: number;
  total_revenue: number | null;
  platform_fee_percent: number | null;
  launched_at: string | null;
}

const productTypeIcons: Record<string, React.ElementType> = {
  offer: Package,
  playbook: BookOpen,
  diagnostic: Target,
  course: GraduationCap,
  template: FileText
};

export default function AutoProductization() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<SuccessPattern | null>(null);
  const [newProduct, setNewProduct] = useState({
    product_type: 'playbook',
    product_name: '',
    pricing_model: 'one_time',
    suggested_price: 97
  });

  const { data: patterns = [], isLoading: patternsLoading } = useQuery({
    queryKey: ['success-patterns', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('success_patterns')
        .select('*')
        .eq('organization_id', organization.id)
        .order('repeatability_score', { ascending: false });
      if (error) throw error;
      return data as SuccessPattern[];
    },
    enabled: !!organization?.id
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['auto-products', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('auto_products')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AutoProduct[];
    },
    enabled: !!organization?.id
  });

  const createProductMutation = useMutation({
    mutationFn: async (product: typeof newProduct & { source_pattern_id: string | null }) => {
      if (!organization?.id) throw new Error('No organization');
      const { error } = await supabase.from('auto_products').insert({
        organization_id: organization.id,
        ...product,
        actual_price: product.suggested_price,
        sales_page_content: {},
        delivery_mechanism: 'automated',
        status: 'draft',
        platform_fee_percent: 10
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-products'] });
      setShowCreateProduct(false);
      setSelectedPattern(null);
      setNewProduct({ product_type: 'playbook', product_name: '', pricing_model: 'one_time', suggested_price: 97 });
      toast.success('Product created');
    }
  });

  const launchProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('auto_products')
        .update({ status: 'launched', launched_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-products'] });
      toast.success('Product launched!');
    }
  });

  const getSteps = (pattern: SuccessPattern): string[] => {
    if (!pattern.steps) return [];
    if (Array.isArray(pattern.steps)) return pattern.steps as string[];
    return [];
  };

  const productizablePatterns = patterns.filter(p => (p.repeatability_score || 0) >= 70);
  const launchedProducts = products.filter(p => p.status === 'launched');
  const totalRevenue = products.reduce((sum, p) => sum + (p.total_revenue || 0), 0);
  const totalSales = products.reduce((sum, p) => sum + p.total_sales, 0);

  const ProductIcon = (type: string) => productTypeIcons[type] || Package;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Auto-Productization Engine
          </h1>
          <p className="text-muted-foreground mt-1">
            Detect repeatable success and automatically package into products
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Productizable Patterns</p>
                <p className="text-2xl font-bold">{productizablePatterns.length}</p>
              </div>
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Products Launched</p>
                <p className="text-2xl font-bold text-green-500">{launchedProducts.length}</p>
              </div>
              <Rocket className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{totalSales}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-500">${totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patterns">
        <TabsList>
          <TabsTrigger value="patterns">Success Patterns ({patterns.length})</TabsTrigger>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          {patternsLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Detecting patterns...</CardContent></Card>
          ) : patterns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No success patterns detected yet</h3>
                <p className="text-muted-foreground mt-1">
                  The engine will detect repeatable success as you work
                </p>
              </CardContent>
            </Card>
          ) : (
            patterns.map(pattern => {
              const isProductizable = (pattern.repeatability_score || 0) >= 70;
              const steps = getSteps(pattern);
              
              return (
                <Card key={pattern.id} className={isProductizable ? 'border-green-500/30' : ''}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{pattern.pattern_name}</p>
                          <Badge variant="outline" className="capitalize">{pattern.pattern_type}</Badge>
                          {isProductizable && (
                            <Badge className="bg-green-500/10 text-green-500">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Productizable
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{pattern.description}</p>

                        {steps.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-2">Steps:</p>
                            <div className="flex flex-wrap gap-1">
                              {steps.slice(0, 4).map((step, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {idx + 1}. {step}
                                </Badge>
                              ))}
                              {steps.length > 4 && (
                                <Badge variant="secondary" className="text-xs">+{steps.length - 4} more</Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-6 mt-3">
                          <div>
                            <span className="text-xs text-muted-foreground">Repeatability</span>
                            <div className="flex items-center gap-2">
                              <Progress value={pattern.repeatability_score || 0} className="w-20 h-2" />
                              <span className="text-sm font-medium">{pattern.repeatability_score || 0}%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Executed</span>
                            <p className="text-sm font-medium">{pattern.times_executed}x</p>
                          </div>
                          {pattern.avg_outcome_value && (
                            <div>
                              <span className="text-xs text-muted-foreground">Avg Value</span>
                              <p className="text-sm font-medium text-green-500">${pattern.avg_outcome_value.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {isProductizable && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedPattern(pattern);
                            setNewProduct({
                              ...newProduct,
                              product_name: `${pattern.pattern_name} Playbook`
                            });
                            setShowCreateProduct(true);
                          }}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Productize
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {productsLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading products...</CardContent></Card>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No products yet</h3>
                <p className="text-muted-foreground mt-1">
                  Productize your success patterns to create new income streams
                </p>
              </CardContent>
            </Card>
          ) : (
            products.map(product => {
              const Icon = ProductIcon(product.product_type);
              return (
                <Card key={product.id} className={product.status === 'launched' ? 'border-green-500/30' : ''}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{product.product_name}</p>
                            <Badge variant="outline" className="capitalize">{product.product_type}</Badge>
                            <Badge className={
                              product.status === 'launched' ? 'bg-green-500/10 text-green-500' :
                              product.status === 'ready' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-muted text-muted-foreground'
                            }>{product.status}</Badge>
                          </div>
                          {product.product_description && (
                            <p className="text-sm text-muted-foreground mt-1">{product.product_description}</p>
                          )}
                          <div className="flex items-center gap-6 mt-3">
                            <div>
                              <span className="text-xs text-muted-foreground">Price</span>
                              <p className="text-sm font-medium">${product.actual_price || product.suggested_price}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Sales</span>
                              <p className="text-sm font-medium">{product.total_sales}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Revenue</span>
                              <p className="text-sm font-medium text-green-500">${(product.total_revenue || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Platform Fee</span>
                              <p className="text-sm font-medium">{product.platform_fee_percent || 10}%</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {product.status === 'draft' && (
                          <Button size="sm" variant="outline">Edit</Button>
                        )}
                        {(product.status === 'draft' || product.status === 'ready') && (
                          <Button size="sm" onClick={() => launchProductMutation.mutate(product.id)}>
                            <Rocket className="h-4 w-4 mr-1" />
                            Launch
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Create Product Dialog */}
      <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Product from Pattern</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPattern && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Source Pattern</p>
                <p className="font-medium">{selectedPattern.pattern_name}</p>
              </div>
            )}
            <Input
              placeholder="Product name"
              value={newProduct.product_name}
              onChange={e => setNewProduct({ ...newProduct, product_name: e.target.value })}
            />
            <Select value={newProduct.product_type} onValueChange={v => setNewProduct({ ...newProduct, product_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="playbook">Playbook</SelectItem>
                <SelectItem value="diagnostic">Diagnostic</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="template">Template</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <Select value={newProduct.pricing_model} onValueChange={v => setNewProduct({ ...newProduct, pricing_model: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-Time</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="usage_based">Usage-Based</SelectItem>
                  <SelectItem value="rev_share">Revenue Share</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  className="pl-7"
                  value={newProduct.suggested_price}
                  onChange={e => setNewProduct({ ...newProduct, suggested_price: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => createProductMutation.mutate({ 
                ...newProduct, 
                source_pattern_id: selectedPattern?.id || null 
              })}
              disabled={!newProduct.product_name}
            >
              Create Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
