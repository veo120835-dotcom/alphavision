import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Building2, 
  Palette, 
  Users, 
  Key,
  DollarSign,
  Settings,
  BookOpen,
  Shield,
  Copy,
  ExternalLink,
  CheckCircle2,
  Plus
} from 'lucide-react';

interface LicenseTenant {
  id: string;
  name: string;
  tier: 'standard' | 'professional' | 'enterprise';
  activeSeats: number;
  seatLimit: number;
  subOrgs: number;
  subOrgLimit: number;
  monthlyFee: number;
  status: 'active' | 'suspended' | 'trial';
  branding: {
    primaryColor: string;
    assistantName: string;
    logoUrl: string | null;
  };
  createdAt: Date;
}

export function LicensingWhiteLabel() {
  const [tenants, setTenants] = useState<LicenseTenant[]>([
    {
      id: '1',
      name: 'Growth Agency Co.',
      tier: 'professional',
      activeSeats: 8,
      seatLimit: 15,
      subOrgs: 4,
      subOrgLimit: 10,
      monthlyFee: 897,
      status: 'active',
      branding: { primaryColor: '#3B82F6', assistantName: 'GrowthBot', logoUrl: null },
      createdAt: new Date(Date.now() - 86400000 * 90)
    },
    {
      id: '2',
      name: 'Sales Mastery Inc.',
      tier: 'enterprise',
      activeSeats: 25,
      seatLimit: 50,
      subOrgs: 12,
      subOrgLimit: 25,
      monthlyFee: 2497,
      status: 'active',
      branding: { primaryColor: '#10B981', assistantName: 'SalesGenius', logoUrl: null },
      createdAt: new Date(Date.now() - 86400000 * 180)
    },
    {
      id: '3',
      name: 'Consulting Pro LLC',
      tier: 'standard',
      activeSeats: 3,
      seatLimit: 5,
      subOrgs: 2,
      subOrgLimit: 5,
      monthlyFee: 499,
      status: 'trial',
      branding: { primaryColor: '#8B5CF6', assistantName: 'ConsultAI', logoUrl: null },
      createdAt: new Date(Date.now() - 86400000 * 10)
    }
  ]);

  const stats = {
    totalLicensees: tenants.length,
    totalSeats: tenants.reduce((sum, t) => sum + t.activeSeats, 0),
    totalSubOrgs: tenants.reduce((sum, t) => sum + t.subOrgs, 0),
    monthlyRecurring: tenants.reduce((sum, t) => sum + t.monthlyFee, 0),
    avgRevenuePerLicense: Math.round(tenants.reduce((sum, t) => sum + t.monthlyFee, 0) / tenants.length),
    retentionRate: 94
  };

  const getTierColor = (tier: LicenseTenant['tier']) => {
    switch (tier) {
      case 'standard': return 'bg-muted text-muted-foreground';
      case 'professional': return 'bg-blue-500/20 text-blue-400';
      case 'enterprise': return 'bg-purple-500/20 text-purple-400';
    }
  };

  const getStatusColor = (status: LicenseTenant['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'suspended': return 'bg-red-500/20 text-red-400';
      case 'trial': return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Licensing & White-Label System
          </h1>
          <p className="text-muted-foreground">Manage licensees, branding, and recurring revenue</p>
        </div>
        <Button className="bg-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Licensee
        </Button>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Monthly Recurring</span>
            </div>
            <div className="text-3xl font-bold text-green-400">
              ${stats.monthlyRecurring.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              from {stats.totalLicensees} licensees
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Active Seats</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalSeats}</div>
            <div className="text-xs text-muted-foreground">across all licenses</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">Sub-Organizations</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalSubOrgs}</div>
            <div className="text-xs text-muted-foreground">client accounts</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Retention Rate</span>
            </div>
            <div className="text-2xl font-bold">{stats.retentionRate}%</div>
            <div className="text-xs text-muted-foreground">12-month average</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="licensees" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="licensees">Licensees</TabsTrigger>
          <TabsTrigger value="tiers">License Tiers</TabsTrigger>
          <TabsTrigger value="playbooks">Playbook Library</TabsTrigger>
          <TabsTrigger value="branding">Branding Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="licensees" className="space-y-4">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: tenant.branding.primaryColor }}
                      >
                        {tenant.name.charAt(0)}
                      </div>
                      <h3 className="font-semibold">{tenant.name}</h3>
                      <Badge className={getTierColor(tenant.tier)}>{tenant.tier}</Badge>
                      <Badge className={getStatusColor(tenant.status)}>{tenant.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground ml-11">
                      Assistant: "{tenant.branding.assistantName}" • 
                      Since {new Date(tenant.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">${tenant.monthlyFee}/mo</div>
                    <div className="text-xs text-muted-foreground">recurring</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Seats</span>
                      <span className="text-sm font-bold">{tenant.activeSeats}/{tenant.seatLimit}</span>
                    </div>
                    <Progress value={(tenant.activeSeats / tenant.seatLimit) * 100} className="h-2" />
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Sub-Orgs</span>
                      <span className="text-sm font-bold">{tenant.subOrgs}/{tenant.subOrgLimit}</span>
                    </div>
                    <Progress value={(tenant.subOrgs / tenant.subOrgLimit) * 100} className="h-2" />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    <Palette className="w-4 h-4 mr-1" />
                    Branding
                  </Button>
                  <Button variant="outline" size="sm">
                    <BookOpen className="w-4 h-4 mr-1" />
                    Playbooks
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-1" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                name: 'Standard',
                price: 499,
                seats: 5,
                subOrgs: 5,
                features: ['Basic branding', '50 decision credits/mo', 'Email support', 'Standard playbooks']
              },
              {
                name: 'Professional',
                price: 897,
                seats: 15,
                subOrgs: 10,
                features: ['Full white-label', '200 decision credits/mo', 'Priority support', 'Custom playbooks', 'API access']
              },
              {
                name: 'Enterprise',
                price: 2497,
                seats: 50,
                subOrgs: 25,
                features: ['Complete customization', 'Unlimited credits', 'Dedicated support', 'Custom integrations', 'SLA guarantee', 'On-premise option']
              }
            ].map((tier, idx) => (
              <Card key={idx} className={`bg-card/50 border-border/50 ${idx === 1 ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {tier.name}
                    {idx === 1 && <Badge className="bg-primary">Popular</Badge>}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold">${tier.price}</span>/month
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-primary" />
                      Up to {tier.seats} seats
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-primary" />
                      Up to {tier.subOrgs} sub-orgs
                    </div>
                  </div>
                  <div className="space-y-2">
                    {tier.features.map((feature, fidx) => (
                      <div key={fidx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" variant={idx === 1 ? 'default' : 'outline'}>
                    Edit Tier
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="playbooks" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Deployable Playbooks
              </CardTitle>
              <CardDescription>
                Playbooks licensees can deploy to their clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'High-Ticket Closing System', deployed: 12, category: 'Sales' },
                { name: 'Client Onboarding Workflow', deployed: 18, category: 'Operations' },
                { name: 'Pricing Power Framework', deployed: 8, category: 'Strategy' },
                { name: 'Lead Qualification Process', deployed: 15, category: 'Sales' }
              ].map((playbook, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <div className="font-medium">{playbook.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {playbook.category} • Deployed to {playbook.deployed} licensees
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Deploy
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Branding Templates
              </CardTitle>
              <CardDescription>
                Pre-configured branding kits for new licensees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Corporate Blue', color: '#3B82F6', usage: 5 },
                { name: 'Growth Green', color: '#10B981', usage: 3 },
                { name: 'Premium Purple', color: '#8B5CF6', usage: 8 },
                { name: 'Sales Orange', color: '#F59E0B', usage: 2 }
              ].map((template, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-lg"
                      style={{ backgroundColor: template.color }}
                    />
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Used by {template.usage} licensees
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              ))}
              <Button className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create New Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LicensingWhiteLabel;
