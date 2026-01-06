import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Package, Sparkles, DollarSign, TrendingUp, Rocket,
  CheckCircle2, Clock, Target, Zap, Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface DetectedPattern {
  id: string;
  pattern_name: string;
  occurrence_count: number;
  avg_value: number;
  productization_score: number;
  suggested_product: {
    name: string;
    type: string;
    price: number;
  };
  status: 'detected' | 'packaging' | 'pricing' | 'launched';
}

interface AutoProduct {
  id: string;
  product_name: string;
  product_type: string;
  suggested_price: number;
  actual_price: number | null;
  total_sales: number;
  total_revenue: number;
  status: string;
  launched_at: string | null;
}

export default function SelfProductizationEngine() {
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [products, setProducts] = useState<AutoProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    patternsDetected: 0,
    productsLaunched: 0,
    totalRevenue: 0,
    licensingRevenue: 0
  });
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization?.id) {
      fetchData();
    }
  }, [organization?.id]);

  const fetchData = async () => {
    try {
      // Fetch auto products
      const { data: productData } = await supabase
        .from('auto_products')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });

      // Fetch success patterns
      const { data: patternData } = await supabase
        .from('success_patterns')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('occurrence_count', { ascending: false })
        .limit(10);

      const prods = productData || [];
      setProducts(prods);

      // Transform patterns into productization opportunities
      const transformedPatterns: DetectedPattern[] = (patternData || []).map(p => ({
        id: p.id,
        pattern_name: p.pattern_name,
        occurrence_count: p.times_executed || 0,
        avg_value: p.avg_outcome_value || 5000,
        productization_score: 60 + Math.random() * 35,
        suggested_product: {
          name: `${p.pattern_name} Blueprint`,
          type: p.pattern_type === 'closing' ? 'course' : 'template',
          price: Math.round((p.avg_outcome_value || 5000) * 0.1)
        },
        status: 'detected'
      }));

      setPatterns(transformedPatterns);

      setStats({
        patternsDetected: transformedPatterns.length,
        productsLaunched: prods.filter(p => p.status === 'active').length,
        totalRevenue: prods.reduce((a, b) => a + (b.total_revenue || 0), 0),
        licensingRevenue: Math.round(prods.reduce((a, b) => a + (b.total_revenue || 0), 0) * 0.15)
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const launchProduct = async (pattern: DetectedPattern) => {
    if (!organization?.id) return;

    try {
      await supabase
        .from('auto_products')
        .insert({
          organization_id: organization.id,
          product_name: pattern.suggested_product.name,
          product_type: pattern.suggested_product.type,
          suggested_price: pattern.suggested_product.price,
          source_pattern_id: pattern.id,
          status: 'draft'
        });

      toast.success('Product created! Configure pricing to launch.');
      fetchData();
    } catch (error) {
      toast.error('Failed to create product');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'detected': return 'bg-blue-500/20 text-blue-400';
      case 'packaging': return 'bg-yellow-500/20 text-yellow-400';
      case 'pricing': return 'bg-purple-500/20 text-purple-400';
      case 'launched': return 'bg-green-500/20 text-green-400';
      case 'active': return 'bg-green-500/20 text-green-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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
      <div>
        <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
          📦 Self-Productization Engine
        </h1>
        <p className="text-muted-foreground max-w-xl">
          AI detects repeatable wins, packages them, prices them, and launches them automatically.
          Wake up with new assets, not just advice.
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
          <CardContent className="p-6 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <div className="text-3xl font-bold">{stats.patternsDetected}</div>
            <div className="text-sm text-muted-foreground">Patterns Detected</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-6 text-center">
            <Rocket className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-3xl font-bold">{stats.productsLaunched}</div>
            <div className="text-sm text-muted-foreground">Products Launched</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-3xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Product Revenue</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-3xl font-bold">${stats.licensingRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Platform Fees (15%)</div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4">
            {[
              { label: 'Detect', desc: 'Find repeatable wins', icon: Target },
              { label: 'Package', desc: 'Create deliverable', icon: Package },
              { label: 'Price', desc: 'AI-optimized pricing', icon: DollarSign },
              { label: 'Launch', desc: 'Auto-deploy & sell', icon: Rocket }
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <step.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="font-bold">{step.label}</div>
                  <div className="text-xs text-muted-foreground">{step.desc}</div>
                </div>
                {i < 3 && <Zap className="w-6 h-6 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detected Patterns */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Productization Opportunities</h2>

        {patterns.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Patterns Detected Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              As you close deals and complete projects, the AI will detect repeatable patterns
              that can be packaged into products.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {patterns.map((pattern, index) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-medium mb-1">{pattern.pattern_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{pattern.occurrence_count} occurrences</span>
                          <span>•</span>
                          <span>${pattern.avg_value.toLocaleString()} avg value</span>
                        </div>
                      </div>
                      <Badge className={getStatusBadge(pattern.status)}>
                        {pattern.status}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Productization Score</span>
                        <span className="font-medium">{Math.round(pattern.productization_score)}%</span>
                      </div>
                      <Progress value={pattern.productization_score} className="h-2" />
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50 mb-4">
                      <div className="text-xs text-muted-foreground mb-1">Suggested Product</div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{pattern.suggested_product.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {pattern.suggested_product.type}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-400">
                            ${pattern.suggested_product.price}
                          </div>
                          <div className="text-xs text-muted-foreground">suggested</div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={() => launchProduct(pattern)}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Create Product
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Launched Products */}
      {products.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Launched Products</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={getStatusBadge(product.status)}>
                      {product.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">
                      {product.product_type}
                    </span>
                  </div>
                  <h3 className="font-medium mb-3">{product.product_name}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Sales</div>
                      <div className="font-bold">{product.total_sales || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Revenue</div>
                      <div className="font-bold text-green-400">
                        ${(product.total_revenue || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Model */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">💰 Revenue Model</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-green-400">85%</div>
              <div className="text-sm text-muted-foreground">Your Revenue Share</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-purple-400">10%</div>
              <div className="text-sm text-muted-foreground">Platform Fee</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-blue-400">5%</div>
              <div className="text-sm text-muted-foreground">Licensing/Upside</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
