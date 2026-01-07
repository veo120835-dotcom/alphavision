import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ShoppingCart, TrendingUp, DollarSign, Award, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MarketplaceOffer {
  id: string;
  title: string;
  description: string;
  asking_price: number;
  minimum_price: number;
  currency: string;
  lead_quality_score: number;
  industry: string;
  location: string;
  lead_age_days: number;
  bids_count: number;
  status: string;
  created_at: string;
}

interface Bid {
  id: string;
  offer_id: string;
  bid_amount: number;
  status: string;
  message: string;
  created_at: string;
  marketplace_offers: any;
}

export function LeadMarketplace() {
  const [activeTab, setActiveTab] = useState('browse');
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [myOffers, setMyOffers] = useState<MarketplaceOffer[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<MarketplaceOffer | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      if (activeTab === 'browse') {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-marketplace/list-offers`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );
        const result = await response.json();
        if (result.success) {
          setOffers(result.offers || []);
        }
      } else if (activeTab === 'my-offers') {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-marketplace/my-offers`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );
        const result = await response.json();
        if (result.success) {
          setMyOffers(result.offers || []);
        }
      } else if (activeTab === 'my-bids') {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-marketplace/my-bids`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );
        const result = await response.json();
        if (result.success) {
          setMyBids(result.bids || []);
        }
      }
    } catch (error: any) {
      toast.error('Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  }

  async function placeBid(offerId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-marketplace/create-bid`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            offerId,
            bidAmount: parseFloat(bidAmount),
            message: bidMessage,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to place bid');
      }

      toast.success('Bid placed successfully');
      setSelectedOffer(null);
      setBidAmount('');
      setBidMessage('');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  function getQualityColor(score: number) {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  }

  function getBidStatusColor(status: string) {
    switch (status) {
      case 'accepted': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Lead Marketplace</h2>
        <p className="text-muted-foreground">Buy and sell qualified leads</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Browse Offers
          </TabsTrigger>
          <TabsTrigger value="my-offers">
            <TrendingUp className="h-4 w-4 mr-2" />
            My Offers
          </TabsTrigger>
          <TabsTrigger value="my-bids">
            <MessageSquare className="h-4 w-4 mr-2" />
            My Bids
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {loading ? (
            <div className="text-center p-8">Loading offers...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{offer.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {offer.industry} • {offer.location}
                        </CardDescription>
                      </div>
                      {offer.lead_quality_score && (
                        <Badge variant="outline" className={getQualityColor(offer.lead_quality_score)}>
                          <Award className="h-3 w-3 mr-1" />
                          {offer.lead_quality_score}/100
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {offer.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Asking Price:</span>
                        <span className="font-semibold">${offer.asking_price.toFixed(2)}</span>
                      </div>
                      {offer.minimum_price && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Minimum:</span>
                          <span>${offer.minimum_price.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Age:</span>
                        <span>{offer.lead_age_days} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bids:</span>
                        <span>{offer.bids_count}</span>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full"
                          onClick={() => setSelectedOffer(offer)}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Place Bid
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Place Your Bid</DialogTitle>
                          <DialogDescription>
                            Make an offer for: {selectedOffer?.title}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div>
                            <Label>Bid Amount (USD)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              placeholder={selectedOffer?.minimum_price?.toString() || '0'}
                            />
                            {selectedOffer?.minimum_price && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Minimum: ${selectedOffer.minimum_price}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label>Message (Optional)</Label>
                            <Textarea
                              value={bidMessage}
                              onChange={(e) => setBidMessage(e.target.value)}
                              placeholder="Add a message to the seller"
                            />
                          </div>

                          <Button
                            onClick={() => selectedOffer && placeBid(selectedOffer.id)}
                            disabled={!bidAmount}
                            className="w-full"
                          >
                            Submit Bid
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}

              {offers.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No offers available</h3>
                  <p className="text-muted-foreground">
                    Check back later for new lead opportunities
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-offers">
          {loading ? (
            <div className="text-center p-8">Loading your offers...</div>
          ) : (
            <div className="space-y-4">
              {myOffers.map((offer) => (
                <Card key={offer.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{offer.title}</CardTitle>
                        <CardDescription>{offer.description}</CardDescription>
                      </div>
                      <Badge className={offer.status === 'sold' ? 'bg-green-500' : 'bg-blue-500'}>
                        {offer.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Asking Price:</span>
                        <div className="font-semibold">${offer.asking_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bids Received:</span>
                        <div className="font-semibold">{offer.bids_count}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quality Score:</span>
                        <div className="font-semibold">{offer.lead_quality_score || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Listed:</span>
                        <div>{new Date(offer.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {myOffers.length === 0 && (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                  <p className="text-muted-foreground">
                    Start by listing your qualified leads for sale
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-bids">
          {loading ? (
            <div className="text-center p-8">Loading your bids...</div>
          ) : (
            <div className="space-y-4">
              {myBids.map((bid) => (
                <Card key={bid.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{bid.marketplace_offers?.title}</CardTitle>
                        <CardDescription>
                          Bid Amount: ${bid.bid_amount.toFixed(2)}
                        </CardDescription>
                      </div>
                      <Badge className={getBidStatusColor(bid.status)}>
                        {bid.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  {bid.message && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        <strong>Your Message:</strong> {bid.message}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}

              {myBids.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
                  <p className="text-muted-foreground">
                    Browse offers and place your first bid
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
