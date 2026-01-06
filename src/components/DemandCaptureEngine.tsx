import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Radio, 
  Globe, 
  Target, 
  TrendingUp, 
  Users, 
  Zap,
  RefreshCw,
  Calendar,
  FileText,
  Mail,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ContentAsset {
  id: string;
  title: string;
  type: 'article' | 'video' | 'diagnostic' | 'lead-magnet';
  status: 'active' | 'updating' | 'retired';
  leadsGenerated: number;
  conversionRate: number;
  lastUpdated: Date;
  nextRefresh: Date;
  autoOptimize: boolean;
}

interface DemandChannel {
  id: string;
  name: string;
  type: 'organic' | 'paid' | 'referral';
  active: boolean;
  leadsPerDay: number;
  cpl: number;
  automationLevel: number;
}

export function DemandCaptureEngine() {
  const [assets, setAssets] = useState<ContentAsset[]>([
    {
      id: '1',
      title: 'The Ultimate Pricing Power Guide',
      type: 'lead-magnet',
      status: 'active',
      leadsGenerated: 847,
      conversionRate: 34,
      lastUpdated: new Date(Date.now() - 86400000 * 3),
      nextRefresh: new Date(Date.now() + 86400000 * 4),
      autoOptimize: true
    },
    {
      id: '2',
      title: 'Revenue Diagnostic Assessment',
      type: 'diagnostic',
      status: 'active',
      leadsGenerated: 423,
      conversionRate: 52,
      lastUpdated: new Date(Date.now() - 86400000 * 7),
      nextRefresh: new Date(Date.now() + 86400000 * 7),
      autoOptimize: true
    },
    {
      id: '3',
      title: 'Client Positioning Framework',
      type: 'article',
      status: 'updating',
      leadsGenerated: 1204,
      conversionRate: 18,
      lastUpdated: new Date(Date.now() - 86400000 * 14),
      nextRefresh: new Date(Date.now() + 86400000),
      autoOptimize: true
    }
  ]);

  const [channels, setChannels] = useState<DemandChannel[]>([
    { id: '1', name: 'LinkedIn Organic', type: 'organic', active: true, leadsPerDay: 8.5, cpl: 0, automationLevel: 85 },
    { id: '2', name: 'SEO Content', type: 'organic', active: true, leadsPerDay: 12.3, cpl: 0, automationLevel: 95 },
    { id: '3', name: 'Retargeting Ads', type: 'paid', active: true, leadsPerDay: 6.2, cpl: 4.80, automationLevel: 90 },
    { id: '4', name: 'Email Nurture', type: 'organic', active: true, leadsPerDay: 3.8, cpl: 0, automationLevel: 100 },
    { id: '5', name: 'Partner Referrals', type: 'referral', active: true, leadsPerDay: 2.1, cpl: 0, automationLevel: 75 }
  ]);

  const stats = {
    totalLeadsToday: 32,
    leadsWhileSleeping: 14,
    automationCoverage: 89,
    avgLeadQuality: 7.8,
    costPerLead: 2.15,
    conversionToCall: 23
  };

  const getTypeIcon = (type: ContentAsset['type']) => {
    switch (type) {
      case 'article': return <FileText className="w-4 h-4" />;
      case 'video': return <Radio className="w-4 h-4" />;
      case 'diagnostic': return <Target className="w-4 h-4" />;
      case 'lead-magnet': return <Mail className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Radio className="w-6 h-6" />
            Always-On Demand Capture Engine
          </h1>
          <p className="text-muted-foreground">24/7 lead generation that runs while you sleep</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-500/20 text-green-400 animate-pulse">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 inline-block" />
            Engine Running
          </Badge>
          <Badge className="bg-primary/20 text-primary text-lg px-4 py-2">
            {stats.totalLeadsToday} Leads Today
          </Badge>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.leadsWhileSleeping}</div>
            <div className="text-xs text-muted-foreground">While You Slept</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.automationCoverage}%</div>
            <div className="text-xs text-muted-foreground">Automation</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.avgLeadQuality}/10</div>
            <div className="text-xs text-muted-foreground">Avg Quality</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">${stats.costPerLead}</div>
            <div className="text-xs text-muted-foreground">Cost/Lead</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.conversionToCall}%</div>
            <div className="text-xs text-muted-foreground">Lead → Call</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {channels.reduce((sum, c) => sum + c.leadsPerDay, 0).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Leads/Day</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="channels">Capture Channels</TabsTrigger>
          <TabsTrigger value="assets">Evergreen Assets</TabsTrigger>
          <TabsTrigger value="routing">Lead Routing</TabsTrigger>
          <TabsTrigger value="optimization">Auto-Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Active Capture Channels</CardTitle>
              <CardDescription>Automated lead generation sources running 24/7</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {channels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Switch 
                      checked={channel.active}
                      onCheckedChange={(checked) => {
                        setChannels(channels.map(c => 
                          c.id === channel.id ? {...c, active: checked} : c
                        ));
                      }}
                    />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        {channel.name}
                        <Badge variant="outline" className="text-xs">
                          {channel.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {channel.leadsPerDay} leads/day • 
                        {channel.cpl > 0 ? ` $${channel.cpl} CPL` : ' Free'} • 
                        {channel.automationLevel}% automated
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <div className="text-xs text-muted-foreground mb-1">Automation</div>
                      <Progress value={channel.automationLevel} className="h-2" />
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              ))}

              <Button className="w-full mt-4" variant="outline">
                <Zap className="w-4 h-4 mr-2" />
                Add New Channel
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Evergreen Content Assets
              </CardTitle>
              <CardDescription>
                Auto-updating content that attracts qualified buyers continuously
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assets.map((asset) => (
                <div key={asset.id} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {getTypeIcon(asset.type)}
                        {asset.title}
                        <Badge 
                          className={
                            asset.status === 'active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : asset.status === 'updating'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {asset.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {asset.leadsGenerated} leads
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {asset.conversionRate}% conversion
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Updated {Math.round((Date.now() - asset.lastUpdated.getTime()) / 86400000)}d ago
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Auto-optimize</span>
                      <Switch 
                        checked={asset.autoOptimize}
                        onCheckedChange={(checked) => {
                          setAssets(assets.map(a => 
                            a.id === asset.id ? {...a, autoOptimize: checked} : a
                          ));
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Next refresh:</span>
                    <span className="text-primary">
                      {Math.round((asset.nextRefresh.getTime() - Date.now()) / 86400000)} days
                    </span>
                    {asset.status === 'updating' && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 ml-2">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        AI updating angles
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routing" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Intelligent Lead Routing</CardTitle>
              <CardDescription>
                Where leads go based on intent signals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { signal: 'High Intent (Score 8+)', destination: 'Async Proposal', count: 12 },
                { signal: 'Medium Intent (Score 5-7)', destination: 'Diagnostic Funnel', count: 34 },
                { signal: 'Low Intent (Score <5)', destination: 'Nurture Sequence', count: 89 },
                { signal: 'Pricing Page Visitor', destination: 'Urgency Offer', count: 28 },
                { signal: 'Returning Visitor (3+)', destination: 'Direct Calendar', count: 8 }
              ].map((route, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Target className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">{route.signal}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        {route.destination}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{route.count}</div>
                    <div className="text-xs text-muted-foreground">this week</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                AI Auto-Optimization
              </CardTitle>
              <CardDescription>
                The engine continuously optimizes for maximum lead quality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { action: 'Headline A/B test completed', result: '+12% CTR', time: '2h ago', type: 'success' },
                { action: 'Retargeting audience refined', result: '-$0.80 CPL', time: '5h ago', type: 'success' },
                { action: 'Lead magnet CTA updated', result: '+8% conversion', time: '12h ago', type: 'success' },
                { action: 'Low-quality traffic source paused', result: 'Saved $45/day', time: '1d ago', type: 'warning' },
                { action: 'New angle detected from market', result: 'Testing started', time: '1d ago', type: 'info' }
              ].map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`w-5 h-5 ${
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                    }`} />
                    <div>
                      <div className="font-medium text-sm">{log.action}</div>
                      <div className="text-xs text-muted-foreground">{log.time}</div>
                    </div>
                  </div>
                  <Badge className={
                    log.type === 'success' ? 'bg-green-500/20 text-green-400' :
                    log.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 
                    'bg-blue-500/20 text-blue-400'
                  }>
                    {log.result}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DemandCaptureEngine;
