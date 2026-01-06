import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Scissors, Plus, RefreshCw, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface PricingProduct {
  id: string;
  product_name: string;
  my_price: number;
  my_cogs: number;
  min_margin_percent: number;
  competitor_url: string;
  competitor_price: number;
  price_action_taken: string;
  last_checked: string;
}

export function PriceSurgeonDashboard() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    my_price: '',
    my_cogs: '',
    min_margin_percent: '20',
    competitor_url: ''
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['pricing-products', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase.functions.invoke('price-surgeon', {
        body: {
          action: 'get_products',
          organization_id: organization.id
        }
      });
      
      if (error) throw error;
      return data.products as PricingProduct[];
    },
    enabled: !!organization?.id
  });

  const addProductMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('price-surgeon', {
        body: {
          action: 'add_product',
          organization_id: organization.id,
          product_name: newProduct.product_name,
          my_price: parseFloat(newProduct.my_price),
          my_cogs: parseFloat(newProduct.my_cogs) || 0,
          min_margin_percent: parseFloat(newProduct.min_margin_percent) || 20,
          competitor_url: newProduct.competitor_url
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Product added');
      setDialogOpen(false);
      setNewProduct({ product_name: '', my_price: '', my_cogs: '', min_margin_percent: '20', competitor_url: '' });
      queryClient.invalidateQueries({ queryKey: ['pricing-products'] });
    },
    onError: (error) => {
      toast.error('Failed to add: ' + error.message);
    }
  });

  const scanProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('price-surgeon', {
        body: {
          action: 'scan_competitor_price',
          organization_id: organization.id,
          product_id: productId
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.competitor_price) {
        toast.success(`Found: $${data.competitor_price} - ${data.action}`);
      } else {
        toast.info('Could not extract price');
      }
      queryClient.invalidateQueries({ queryKey: ['pricing-products'] });
    }
  });

  const scanAllMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('price-surgeon', {
        body: {
          action: 'scan_all',
          organization_id: organization.id
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Scanned ${data.scanned} products`);
      queryClient.invalidateQueries({ queryKey: ['pricing-products'] });
    }
  });

  const getActionBadge = (action: string, myPrice: number, competitorPrice: number) => {
    if (!action) return null;

    switch (action) {
      case 'match_price':
        return <Badge className="bg-green-500">Match Price</Badge>;
      case 'hold_price':
        return <Badge variant="secondary">Hold (Unsafe)</Badge>;
      case 'opportunity':
        return <Badge className="bg-blue-500">Price Increase Opportunity</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getMarginHealth = (product: PricingProduct) => {
    if (!product.my_cogs) return 100;
    const margin = ((product.my_price - product.my_cogs) / product.my_price) * 100;
    return Math.min(100, Math.max(0, margin / product.min_margin_percent * 100));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scissors className="h-8 w-8 text-primary" />
            Price Surgeon
          </h1>
          <p className="text-muted-foreground mt-1">
            Margin-aware competitive pricing. Never drop below your safe margin.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Product for Price Monitoring</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    placeholder="Premium Consulting Package"
                    value={newProduct.product_name}
                    onChange={(e) => setNewProduct({...newProduct, product_name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Your Price ($)</Label>
                    <Input
                      type="number"
                      placeholder="999"
                      value={newProduct.my_price}
                      onChange={(e) => setNewProduct({...newProduct, my_price: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Your COGS ($)</Label>
                    <Input
                      type="number"
                      placeholder="200"
                      value={newProduct.my_cogs}
                      onChange={(e) => setNewProduct({...newProduct, my_cogs: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Minimum Margin %</Label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={newProduct.min_margin_percent}
                    onChange={(e) => setNewProduct({...newProduct, min_margin_percent: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Competitor Pricing Page URL</Label>
                  <Input
                    placeholder="https://competitor.com/pricing"
                    value={newProduct.competitor_url}
                    onChange={(e) => setNewProduct({...newProduct, competitor_url: e.target.value})}
                  />
                </div>
                <Button 
                  onClick={() => addProductMutation.mutate()}
                  disabled={addProductMutation.isPending || !newProduct.product_name || !newProduct.my_price}
                  className="w-full"
                >
                  Add Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            onClick={() => scanAllMutation.mutate()}
            disabled={scanAllMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${scanAllMutation.isPending ? 'animate-spin' : ''}`} />
            Scan All
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4">
        {products?.map(product => {
          const minSafePrice = product.my_cogs * (1 + product.min_margin_percent / 100);
          const marginHealth = getMarginHealth(product);
          const priceDiff = product.competitor_price 
            ? product.my_price - product.competitor_price
            : null;

          return (
            <Card key={product.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{product.product_name}</h3>
                      {getActionBadge(product.price_action_taken, product.my_price, product.competitor_price)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Your Price</p>
                        <p className="text-xl font-bold">${product.my_price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Competitor Price</p>
                        <p className="text-xl font-bold">
                          {product.competitor_price ? `$${product.competitor_price}` : '-'}
                        </p>
                        {priceDiff !== null && (
                          <p className={`text-sm flex items-center ${priceDiff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {priceDiff > 0 ? (
                              <><TrendingUp className="h-3 w-3 mr-1" /> ${priceDiff} more</>
                            ) : (
                              <><TrendingDown className="h-3 w-3 mr-1" /> ${Math.abs(priceDiff)} less</>
                            )}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Min Safe Price</p>
                        <p className="text-xl font-bold">${minSafePrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Margin Health</p>
                        <div className="flex items-center gap-2">
                          <Progress value={marginHealth} className="flex-1" />
                          <span className="text-sm">{marginHealth.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    {product.last_checked && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Last checked: {new Date(product.last_checked).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <Button 
                    variant="outline"
                    onClick={() => scanProductMutation.mutate(product.id)}
                    disabled={scanProductMutation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 ${scanProductMutation.isPending ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                {/* Warning for unsafe competitor pricing */}
                {product.competitor_price && product.competitor_price < minSafePrice && (
                  <div className="mt-4 p-3 bg-yellow-500/10 rounded-md flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-600">Competitor Below Safe Margin</p>
                      <p className="text-sm text-muted-foreground">
                        Competitor is pricing at ${product.competitor_price}, which is below your minimum safe price of ${minSafePrice.toFixed(2)}. 
                        They may be selling at a loss. Hold your price.
                      </p>
                    </div>
                  </div>
                )}

                {/* Opportunity alert */}
                {product.price_action_taken === 'opportunity' && (
                  <div className="mt-4 p-3 bg-blue-500/10 rounded-md flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-600">Price Increase Opportunity</p>
                      <p className="text-sm text-muted-foreground">
                        You're ${(product.competitor_price - product.my_price).toFixed(2)} cheaper than the competitor. 
                        Consider raising prices or emphasizing your value proposition.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {products?.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products configured for price monitoring.</p>
              <p className="text-sm text-muted-foreground">Click "Add Product" to start tracking competitor prices.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
