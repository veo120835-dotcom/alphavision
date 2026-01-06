import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Search, Building2, Globe, Users, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  website: string | null;
  linkedin_url: string | null;
  annual_revenue: string | null;
  created_at: string;
  contacts_count?: number;
}

const sizeLabels: Record<string, string> = {
  '1-10': '1-10 employees',
  '10-50': '10-50 employees',
  '50-200': '50-200 employees',
  '200+': '200+ employees',
};

export function CompaniesView() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    industry: '',
    size: '',
    website: '',
    linkedin_url: '',
    annual_revenue: '',
  });

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies-with-counts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Get contact counts
      const { data: contactCounts } = await supabase
        .from('contacts')
        .select('company_id')
        .eq('organization_id', organization.id)
        .not('company_id', 'is', null);

      const countMap: Record<string, number> = {};
      contactCounts?.forEach(c => {
        countMap[c.company_id] = (countMap[c.company_id] || 0) + 1;
      });

      return companiesData.map(company => ({
        ...company,
        contacts_count: countMap[company.id] || 0,
      })) as Company[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('companies').insert({
        organization_id: organization!.id,
        name: data.name,
        domain: data.domain || null,
        industry: data.industry || null,
        size: data.size || null,
        website: data.website || null,
        linkedin_url: data.linkedin_url || null,
        annual_revenue: data.annual_revenue || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies-with-counts'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Company created');
    },
    onError: () => toast.error('Failed to create company'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('companies').update({
        name: data.name,
        domain: data.domain || null,
        industry: data.industry || null,
        size: data.size || null,
        website: data.website || null,
        linkedin_url: data.linkedin_url || null,
        annual_revenue: data.annual_revenue || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies-with-counts'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setEditingCompany(null);
      resetForm();
      toast.success('Company updated');
    },
    onError: () => toast.error('Failed to update company'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies-with-counts'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted');
    },
    onError: () => toast.error('Failed to delete company'),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      domain: '',
      industry: '',
      size: '',
      website: '',
      linkedin_url: '',
      annual_revenue: '',
    });
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      domain: company.domain || '',
      industry: company.industry || '',
      size: company.size || '',
      website: company.website || '',
      linkedin_url: company.linkedin_url || '',
      annual_revenue: company.annual_revenue || '',
    });
  };

  const filteredCompanies = companies?.filter(c => {
    const searchLower = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(searchLower) ||
      c.domain?.toLowerCase().includes(searchLower) ||
      c.industry?.toLowerCase().includes(searchLower)
    );
  });

  const CompanyForm = ({ onSubmit, isEdit }: { onSubmit: () => void; isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Company Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Acme Inc"
          />
        </div>
        <div>
          <Label>Domain</Label>
          <Input
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            placeholder="acme.com"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Industry</Label>
          <Input
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            placeholder="Technology, Finance, Healthcare..."
          />
        </div>
        <div>
          <Label>Company Size</Label>
          <Select value={formData.size} onValueChange={(v) => setFormData({ ...formData, size: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10 employees</SelectItem>
              <SelectItem value="10-50">10-50 employees</SelectItem>
              <SelectItem value="50-200">50-200 employees</SelectItem>
              <SelectItem value="200+">200+ employees</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Website</Label>
          <Input
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://acme.com"
          />
        </div>
        <div>
          <Label>LinkedIn URL</Label>
          <Input
            value={formData.linkedin_url}
            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            placeholder="https://linkedin.com/company/acme"
          />
        </div>
      </div>
      <div>
        <Label>Annual Revenue</Label>
        <Input
          value={formData.annual_revenue}
          onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
          placeholder="$1M - $10M"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => { isEdit ? setEditingCompany(null) : setIsCreateOpen(false); resetForm(); }}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!formData.name}>
          {isEdit ? 'Update' : 'Create'} Company
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Manage your B2B company profiles</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Company</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Company</DialogTitle>
            </DialogHeader>
            <CompanyForm onSubmit={() => createMutation.mutate(formData)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary">{filteredCompanies?.length || 0} companies</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredCompanies?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No companies found. Add your first company to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies?.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{company.name}</div>
                          {company.domain && (
                            <div className="text-xs text-muted-foreground">{company.domain}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.industry && (
                        <Badge variant="outline">{company.industry}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.size && (
                        <span className="text-sm">{sizeLabels[company.size] || company.size}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Globe className="w-3 h-3" />
                          Visit
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="w-3 h-3" />
                        {company.contacts_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(company)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(company.id)}
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
      <Dialog open={!!editingCompany} onOpenChange={() => { setEditingCompany(null); resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
          </DialogHeader>
          <CompanyForm
            isEdit
            onSubmit={() => editingCompany && updateMutation.mutate({ id: editingCompany.id, data: formData })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
