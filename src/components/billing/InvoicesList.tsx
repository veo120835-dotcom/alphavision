import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Receipt, Search, DollarSign, Send, Eye, Download, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { toast } from 'sonner';
import { useAlphaVisionStore } from '@/store/alpha-vision-store';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-500/10 text-blue-600',
  paid: 'bg-green-500/10 text-green-600',
  overdue: 'bg-red-500/10 text-red-600',
  cancelled: 'bg-muted text-muted-foreground',
  void: 'bg-muted text-muted-foreground',
};

export function InvoicesList() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const { setActiveView } = useAlphaVisionStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          contact:contacts(first_name, last_name, email)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['invoice-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { total: 0, paid: 0, pending: 0, overdue: 0 };
      const { data, error } = await supabase
        .from('invoices')
        .select('status, total')
        .eq('organization_id', organization.id);
      if (error) throw error;
      
      return data.reduce((acc, inv) => {
        acc.total += Number(inv.total) || 0;
        if (inv.status === 'paid') acc.paid += Number(inv.total) || 0;
        if (inv.status === 'sent') acc.pending += Number(inv.total) || 0;
        if (inv.status === 'overdue') acc.overdue += Number(inv.total) || 0;
        return acc;
      }, { total: 0, paid: 0, pending: 0, overdue: 0 });
    },
    enabled: !!organization?.id,
  });

  const sendInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').update({ status: 'sent' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice sent');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').update({ 
        status: 'paid',
        paid_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice marked as paid');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredInvoices = invoices?.filter(inv => {
    const searchText = `${inv.invoice_number || ''} ${inv.contact?.first_name || ''} ${inv.contact?.last_name || ''} ${inv.contact?.email || ''}`.toLowerCase();
    const matchesSearch = searchText.includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage and track customer invoices</p>
        </div>
        <Button onClick={() => setActiveView('invoice-builder')}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats?.total.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Receipt className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats?.paid.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats?.pending.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Receipt className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats?.overdue.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading invoices...</div>
      ) : !filteredInvoices?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No invoices yet</h3>
            <p className="text-muted-foreground mb-4">Create your first invoice to start billing</p>
            <Button onClick={() => setActiveView('invoice-builder')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}</h3>
                        <Badge variant="outline" className={STATUS_COLORS[invoice.status]}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {invoice.contact && (
                          <span>{invoice.contact.first_name} {invoice.contact.last_name}</span>
                        )}
                        {invoice.due_date && (
                          <span>Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold">${Number(invoice.total).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{invoice.currency}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {invoice.status === 'draft' && (
                        <Button size="sm" onClick={() => sendInvoice.mutate(invoice.id)}>
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      )}
                      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <Button size="sm" onClick={() => markPaid.mutate(invoice.id)}>
                          Mark Paid
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
