import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  DollarSign, 
  ArrowLeftRight,
  Star,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  ShoppingCart,
  Tag
} from 'lucide-react';

interface LeadListing {
  id: string;
  companyName: string;
  industry: string;
  companySize: string;
  intentLevel: 'hot' | 'warm' | 'cold';
  qualityScore: number;
  askingPrice: number;
  sellerRating: number;
  description: string;
  daysListed: number;
  verified: boolean;
}

export function LeadExchangeMarketplace() {
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [listings] = useState<LeadListing[]>([
    {
      id: '1',
      companyName: 'TechScale Inc.',
      industry: 'SaaS',
      companySize: '50-200',
      intentLevel: 'hot',
      qualityScore: 9.2,
      askingPrice: 450,
      sellerRating: 4.8,
      description: 'Completed pricing diagnostic, ready to buy. Looking for consulting help.',
      daysListed: 2,
      verified: true
    },
    {
      id: '2',
      companyName: 'Growth Agency Partners',
      industry: 'Marketing Agency',
      companySize: '10-50',
      intentLevel: 'warm',
      qualityScore: 7.8,
      askingPrice: 280,
      sellerRating: 4.5,
      description: 'Engaged with content, attended webinar, expressed interest in coaching.',
      daysListed: 5,
      verified: true
    },
    {
      id: '3',
      companyName: 'Enterprise Solutions Ltd',
      industry: 'Enterprise Software',
      companySize: '500+',
      intentLevel: 'hot',
      qualityScore: 9.5,
      askingPrice: 850,
      sellerRating: 4.9,
      description: 'VP of Sales seeking strategic advisor. Budget approved.',
      daysListed: 1,
      verified: true
    },
    {
      id: '4',
      companyName: 'Startup Ventures',
      industry: 'FinTech',
      companySize: '10-50',
      intentLevel: 'warm',
      qualityScore: 6.5,
      askingPrice: 150,
      sellerRating: 4.2,
      description: 'Downloaded lead magnet, responded to nurture emails.',
      daysListed: 8,
      verified: false
    }
  ]);

  const stats = {
    availableLeads: 47,
    avgQualityScore: 7.8,
    yourListings: 5,
    yourSales: 12,
    revenueEarned: 3840,
    leadsPurchased: 8,
    conversionRate: 62
  };

  const getIntentColor = (intent: LeadListing['intentLevel']) => {
    switch (intent) {
      case 'hot': return 'bg-red-500/20 text-red-400';
      case 'warm': return 'bg-orange-500/20 text-orange-400';
      case 'cold': return 'bg-blue-500/20 text-blue-400';
    }
  };

  const filteredListings = listings.filter(l => {
    if (filter !== 'all' && l.intentLevel !== filter) return false;
    if (searchTerm && !l.companyName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !l.industry.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6" />
            Lead Exchange Marketplace
          </h1>
          <p className="text-muted-foreground">Buy, sell, and trade qualified leads with verified users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Tag className="w-4 h-4 mr-2" />
            My Listings
          </Button>
          <Button className="bg-primary">
            <DollarSign className="w-4 h-4 mr-2" />
            List a Lead
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{stats.availableLeads}</div>
            <div className="text-xs text-muted-foreground">Available Leads</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Star className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
            <div className="text-2xl font-bold">{stats.avgQualityScore}/10</div>
            <div className="text-xs text-muted-foreground">Avg Quality</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-400" />
            <div className="text-2xl font-bold text-green-400">${stats.revenueEarned}</div>
            <div className="text-xs text-muted-foreground">Revenue Earned</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <div className="text-xs text-muted-foreground">Conversion Rate</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="browse">Browse Leads</TabsTrigger>
          <TabsTrigger value="my-listings">My Listings ({stats.yourListings})</TabsTrigger>
          <TabsTrigger value="purchases">Purchases ({stats.leadsPurchased})</TabsTrigger>
          <TabsTrigger value="analytics">Marketplace Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input 
                placeholder="Search by company or industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {(['all', 'hot', 'warm'] as const).map((f) => (
                <Button 
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'hot' ? '🔥 Hot' : '🌡️ Warm'}
                </Button>
              ))}
            </div>
          </div>

          {/* Listings */}
          <div className="grid gap-4">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{listing.companyName}</h3>
                        <Badge className={getIntentColor(listing.intentLevel)}>
                          {listing.intentLevel === 'hot' ? '🔥' : '🌡️'} {listing.intentLevel}
                        </Badge>
                        {listing.verified && (
                          <Badge variant="outline" className="text-green-400 border-green-400/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {listing.industry} • {listing.companySize} employees
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${listing.askingPrice}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        {listing.sellerRating} seller rating
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{listing.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-primary" />
                        Quality: <span className="font-bold">{listing.qualityScore}/10</span>
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Listed {listing.daysListed}d ago
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      <Button size="sm" className="bg-primary">
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Purchase Lead
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-listings" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Your Active Listings</CardTitle>
              <CardDescription>Manage leads you're selling on the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>You have {stats.yourListings} active listings</p>
                <Button variant="outline" className="mt-4">
                  <Tag className="w-4 h-4 mr-2" />
                  View All Listings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>Leads you've acquired from the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold">{stats.leadsPurchased}</div>
                    <div className="text-xs text-muted-foreground">Leads Purchased</div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-400">{stats.conversionRate}%</div>
                    <div className="text-xs text-muted-foreground">Conversion Rate</div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold">$4,250</div>
                    <div className="text-xs text-muted-foreground">Avg Deal Value</div>
                  </div>
                </div>
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Your purchased leads are performing well!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Market Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { industry: 'SaaS', avgPrice: 380, demand: 'high' },
                  { industry: 'Marketing Agency', avgPrice: 220, demand: 'medium' },
                  { industry: 'E-commerce', avgPrice: 310, demand: 'high' },
                  { industry: 'Consulting', avgPrice: 450, demand: 'medium' }
                ].map((trend, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">{trend.industry}</span>
                    <div className="flex items-center gap-4">
                      <span>${trend.avgPrice} avg</span>
                      <Badge className={trend.demand === 'high' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                        {trend.demand} demand
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Platform Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-xs text-muted-foreground">Total Trades</div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold">$186k</div>
                    <div className="text-xs text-muted-foreground">Total Volume</div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold">15%</div>
                    <div className="text-xs text-muted-foreground">Platform Fee</div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold">4.6</div>
                    <div className="text-xs text-muted-foreground">Avg Seller Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LeadExchangeMarketplace;
