import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DollarSign, Link as LinkIcon, Copy, Check, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentLink {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  link_url: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  paid_at: string | null;
}

export function PaymentLinksManager() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    expiresInHours: '72',
  });

  useEffect(() => {
    loadPaymentLinks();
  }, []);

  async function loadPaymentLinks() {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      toast.error('Failed to load payment links');
    } finally {
      setLoading(false);
    }
  }

  async function createPaymentLink() {
    try {
      setCreating(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Please log in');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-processor/create-payment-link`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            amount: parseFloat(formData.amount),
            expiresInHours: parseInt(formData.expiresInHours),
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment link');
      }

      toast.success('Payment link created successfully');
      setFormData({ title: '', description: '', amount: '', expiresInHours: '72' });
      loadPaymentLinks();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  }

  function copyLink(link: PaymentLink) {
    navigator.clipboard.writeText(link.link_url);
    setCopiedId(link.id);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paid': return 'bg-blue-500';
      case 'expired': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  if (loading) {
    return <div className="text-center p-8">Loading payment links...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payment Links</h2>
          <p className="text-muted-foreground">Create instant payment links to collect payments</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <DollarSign className="h-4 w-4 mr-2" />
              Create Payment Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Payment Link</DialogTitle>
              <DialogDescription>
                Generate a shareable link to collect payment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Service Name or Product"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of what this payment is for"
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="100.00"
                />
              </div>

              <div>
                <Label htmlFor="expires">Expires In (Hours)</Label>
                <Input
                  id="expires"
                  type="number"
                  value={formData.expiresInHours}
                  onChange={(e) => setFormData({ ...formData, expiresInHours: e.target.value })}
                  placeholder="72"
                />
              </div>

              <Button
                onClick={createPaymentLink}
                disabled={creating || !formData.title || !formData.amount}
                className="w-full"
              >
                {creating ? 'Creating...' : 'Create Payment Link'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {links.map((link) => (
          <Card key={link.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {link.title}
                    <Badge className={getStatusColor(link.status)}>
                      {link.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {link.description || 'No description'}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${link.amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {link.currency}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={link.link_url}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyLink(link)}
                  >
                    {copiedId === link.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(link.link_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    Created: {new Date(link.created_at).toLocaleDateString()}
                  </span>
                  {link.expires_at && (
                    <span>
                      Expires: {new Date(link.expires_at).toLocaleDateString()}
                    </span>
                  )}
                  {link.paid_at && (
                    <span className="text-green-600">
                      Paid: {new Date(link.paid_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {links.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No payment links yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first payment link to start collecting payments
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
