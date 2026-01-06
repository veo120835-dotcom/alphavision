import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3,
  TrendingUp,
  DollarSign,
  Lock,
  ArrowUp,
  ArrowDown,
  Minus,
  Crown,
  Database
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMockStorage, generateMockId } from '@/hooks/useMockStorage';

interface BenchmarkCategory {
  id: string;
  category_name: string;
  description: string | null;
  is_premium: boolean;
}

interface BenchmarkIndex {
  id: string;
  category_id: string;
  index_name: string;
  current_value: number;
  previous_value: number | null;
  change_percent: number | null;
  sample_size: number;
  confidence_level: number | null;
  calculated_at: string;
}

interface BenchmarkAccess {
  id: string;
  access_level: string;
  categories_accessible: string[];
  data_export_enabled: boolean;
  api_access_enabled: boolean;
}

// Default sample data
const defaultCategories: BenchmarkCategory[] = [
  { id: '1', category_name: 'Revenue Metrics', description: 'Key revenue benchmarks', is_premium: false },
  { id: '2', category_name: 'Conversion Rates', description: 'Sales and marketing conversion benchmarks', is_premium: false },
  { id: '3', category_name: 'Premium Insights', description: 'Advanced competitive analysis', is_premium: true },
  { id: '4', category_name: 'Enterprise Metrics', description: 'Enterprise-grade benchmarks', is_premium: true }
];

const defaultIndexes: BenchmarkIndex[] = [
  { id: '1', category_id: '1', index_name: 'Avg MRR', current_value: 15200, previous_value: 14500, change_percent: 4.8, sample_size: 1250, confidence_level: 95, calculated_at: new Date().toISOString() },
  { id: '2', category_id: '1', index_name: 'Revenue Growth', current_value: 12.5, previous_value: 11.2, change_percent: 11.6, sample_size: 1180, confidence_level: 92, calculated_at: new Date().toISOString() },
  { id: '3', category_id: '2', index_name: 'Lead-to-Close', current_value: 8.2, previous_value: 7.8, change_percent: 5.1, sample_size: 890, confidence_level: 88, calculated_at: new Date().toISOString() },
  { id: '4', category_id: '2', index_name: 'Demo Show Rate', current_value: 72.5, previous_value: 70.1, change_percent: 3.4, sample_size: 750, confidence_level: 90, calculated_at: new Date().toISOString() }
];

export default function ExclusiveBenchmarks() {
  const { organization } = useOrganization();
  const categoriesKey = `benchmark_categories_${organization?.id || 'default'}`;
  const indexesKey = `benchmark_indexes_${organization?.id || 'default'}`;
  const accessKey = `benchmark_access_${organization?.id || 'default'}`;

  const { data: categories } = useMockStorage<BenchmarkCategory>(categoriesKey, defaultCategories);
  const { data: indexes } = useMockStorage<BenchmarkIndex>(indexesKey, defaultIndexes);
  const { data: accessData } = useMockStorage<BenchmarkAccess>(accessKey, []);

  const access = accessData[0];
  const accessLevel = access?.access_level || 'free';
  const isPremium = accessLevel === 'premium' || accessLevel === 'enterprise';
  const premiumCategories = categories.filter(c => c.is_premium);
  const freeCategories = categories.filter(c => !c.is_premium);

  const getIndexesForCategory = (categoryId: string) => {
    return indexes.filter(i => i.category_id === categoryId);
  };

  const getChangeIcon = (change: number | null) => {
    if (!change) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    return <ArrowDown className="h-4 w-4 text-red-500" />;
  };

  const getChangeColor = (change: number | null) => {
    if (!change) return 'text-muted-foreground';
    if (change > 0) return 'text-green-500';
    return 'text-red-500';
  };

  const chartData = [
    { month: 'Jan', yourValue: 42, benchmark: 38 },
    { month: 'Feb', yourValue: 45, benchmark: 39 },
    { month: 'Mar', yourValue: 48, benchmark: 40 },
    { month: 'Apr', yourValue: 52, benchmark: 41 },
    { month: 'May', yourValue: 49, benchmark: 42 },
    { month: 'Jun', yourValue: 55, benchmark: 43 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Exclusive Benchmarks
          </h1>
          <p className="text-muted-foreground mt-1">
            Private industry indexes powered by anonymized performance data
          </p>
        </div>
        {!isPremium && (
          <Button>
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Button>
        )}
      </div>

      {/* Value Prop */}
      <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <Database className="h-12 w-12 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Your Mini Bloomberg Terminal</h2>
              <p className="text-muted-foreground">
                Benchmarks determine confidence. Confidence determines pricing. 
                Know exactly how you compare to your peers—anonymized data from operators just like you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Benchmark Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Indexes</p>
                <p className="text-2xl font-bold">{indexes.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Premium Access</p>
                <p className="text-2xl font-bold capitalize">{accessLevel}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Data Points</p>
                <p className="text-2xl font-bold">
                  {indexes.reduce((sum, i) => sum + i.sample_size, 0).toLocaleString()}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Your Performance vs Benchmark */}
      <Card>
        <CardHeader>
          <CardTitle>Your Performance vs Industry Benchmark</CardTitle>
          <CardDescription>See how you compare over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="yourValue" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary)/0.2)" 
                name="Your Value"
              />
              <Area 
                type="monotone" 
                dataKey="benchmark" 
                stroke="hsl(var(--muted-foreground))" 
                fill="hsl(var(--muted-foreground)/0.1)" 
                name="Industry Benchmark"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Categories</TabsTrigger>
          <TabsTrigger value="free">Free ({freeCategories.length})</TabsTrigger>
          <TabsTrigger value="premium">Premium ({premiumCategories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {categories.map(category => {
            const categoryIndexes = getIndexesForCategory(category.id);
            const hasAccess = !category.is_premium || isPremium;
            
            return (
              <Card key={category.id} className={!hasAccess ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle>{category.category_name}</CardTitle>
                      {category.is_premium && (
                        <Badge className="bg-yellow-500/10 text-yellow-500">
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    {!hasAccess && (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  {category.description && (
                    <CardDescription>{category.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {hasAccess ? (
                    categoryIndexes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {categoryIndexes.map(index => (
                          <div key={index.id} className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">{index.index_name}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-2xl font-bold">{index.current_value.toFixed(1)}</span>
                              <div className={`flex items-center gap-1 ${getChangeColor(index.change_percent)}`}>
                                {getChangeIcon(index.change_percent)}
                                <span className="text-sm">
                                  {index.change_percent ? `${index.change_percent > 0 ? '+' : ''}${index.change_percent.toFixed(1)}%` : '—'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{index.sample_size} samples</span>
                              {index.confidence_level && (
                                <>
                                  <span>•</span>
                                  <span>{index.confidence_level}% confidence</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No indexes available yet</p>
                    )
                  ) : (
                    <div className="text-center py-6">
                      <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Upgrade to Premium to access this benchmark</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="free" className="space-y-6">
          {freeCategories.map(category => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>{category.category_name}</CardTitle>
                {category.description && (
                  <CardDescription>{category.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getIndexesForCategory(category.id).map(index => (
                    <div key={index.id} className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{index.index_name}</p>
                      <p className="text-2xl font-bold mt-1">{index.current_value.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="premium" className="space-y-6">
          {premiumCategories.map(category => (
            <Card key={category.id} className={!isPremium ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>{category.category_name}</CardTitle>
                    <Badge className="bg-yellow-500/10 text-yellow-500">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                  {!isPremium && <Lock className="h-5 w-5 text-muted-foreground" />}
                </div>
              </CardHeader>
              <CardContent>
                {isPremium ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {getIndexesForCategory(category.id).map(index => (
                      <div key={index.id} className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">{index.index_name}</p>
                        <p className="text-2xl font-bold mt-1">{index.current_value.toFixed(1)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Upgrade to access</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
