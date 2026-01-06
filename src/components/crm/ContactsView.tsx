import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Search, Mail, Phone, Building2, User, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  lifecycle_stage: string;
  source: string | null;
  company_id: string | null;
  company?: { name: string } | null;
  created_at: string;
}

const lifecycleColors: Record<string, string> = {
  lead: 'bg-blue-500/10 text-blue-500',
  mql: 'bg-yellow-500/10 text-yellow-500',
  sql: 'bg-orange-500/10 text-orange-500',
  customer: 'bg-green-500/10 text-green-500',
  evangelist: 'bg-purple-500/10 text-purple-500',
};

export function ContactsView() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    title: '',
    lifecycle_stage: 'lead',
    source: '',
    company_id: '',
  });

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('contacts')
        .select('*, company:companies(name)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!organization?.id,
  });

  const { data: companies } = useQuery({
    queryKey: ['companies', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('organization_id', organization.id);
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('contacts').insert({
        organization_id: organization!.id,
        first_name: data.first_name,
        last_name: data.last_name || null,
        email: data.email || null,
        phone: data.phone || null,
        title: data.title || null,
        lifecycle_stage: data.lifecycle_stage,
        source: data.source || null,
        company_id: data.company_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Contact created');
    },
    onError: () => toast.error('Failed to create contact'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('contacts').update({
        first_name: data.first_name,
        last_name: data.last_name || null,
        email: data.email || null,
        phone: data.phone || null,
        title: data.title || null,
        lifecycle_stage: data.lifecycle_stage,
        source: data.source || null,
        company_id: data.company_id || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setEditingContact(null);
      resetForm();
      toast.success('Contact updated');
    },
    onError: () => toast.error('Failed to update contact'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
    },
    onError: () => toast.error('Failed to delete contact'),
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      title: '',
      lifecycle_stage: 'lead',
      source: '',
      company_id: '',
    });
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      title: contact.title || '',
      lifecycle_stage: contact.lifecycle_stage,
      source: contact.source || '',
      company_id: contact.company_id || '',
    });
  };

  const filteredContacts = contacts?.filter(c => {
    const searchLower = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(searchLower) ||
      c.last_name?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.company?.name?.toLowerCase().includes(searchLower)
    );
  });

  const ContactForm = ({ onSubmit, isEdit }: { onSubmit: () => void; isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>First Name *</Label>
          <Input
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="John"
          />
        </div>
        <div>
          <Label>Last Name</Label>
          <Input
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Doe"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 555 123 4567"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="CEO"
          />
        </div>
        <div>
          <Label>Company</Label>
          <Select value={formData.company_id} onValueChange={(v) => setFormData({ ...formData, company_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No company</SelectItem>
              {companies?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Lifecycle Stage</Label>
          <Select value={formData.lifecycle_stage} onValueChange={(v) => setFormData({ ...formData, lifecycle_stage: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="mql">MQL</SelectItem>
              <SelectItem value="sql">SQL</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="evangelist">Evangelist</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Source</Label>
          <Input
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            placeholder="LinkedIn, Website, Referral..."
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => { isEdit ? setEditingContact(null) : setIsCreateOpen(false); resetForm(); }}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!formData.first_name}>
          {isEdit ? 'Update' : 'Create'} Contact
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage your CRM contacts</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Contact</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Contact</DialogTitle>
            </DialogHeader>
            <ContactForm onSubmit={() => createMutation.mutate(formData)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary">{filteredContacts?.length || 0} contacts</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredContacts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No contacts found. Add your first contact to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts?.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </div>
                          {contact.title && (
                            <div className="text-xs text-muted-foreground">{contact.title}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.company && (
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="w-3 h-3" />
                          {contact.company.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={lifecycleColors[contact.lifecycle_stage] || ''}>
                        {contact.lifecycle_stage.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(contact)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(contact.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingContact} onOpenChange={() => { setEditingContact(null); resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <ContactForm
            isEdit
            onSubmit={() => editingContact && updateMutation.mutate({ id: editingContact.id, data: formData })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
