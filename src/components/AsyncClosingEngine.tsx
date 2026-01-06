import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Video, 
  FileText, 
  MessageSquare, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Play,
  Send,
  Zap,
  Target,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface AsyncProposal {
  id: string;
  leadName: string;
  dealValue: number;
  status: 'draft' | 'sent' | 'viewed' | 'engaged' | 'closed' | 'expired';
  videoWalkthrough: boolean;
  objectionHandling: string[];
  viewCount: number;
  timeSpent: number;
  lastViewed: Date | null;
  sentAt: Date;
  closedAt: Date | null;
}

export function AsyncClosingEngine() {
  const [proposals, setProposals] = useState<AsyncProposal[]>([
    {
      id: '1',
      leadName: 'Sarah Chen - TechCorp',
      dealValue: 15000,
      status: 'engaged',
      videoWalkthrough: true,
      objectionHandling: ['Price', 'Timeline', 'ROI'],
      viewCount: 4,
      timeSpent: 847,
      lastViewed: new Date(Date.now() - 3600000),
      sentAt: new Date(Date.now() - 86400000 * 2),
      closedAt: null
    },
    {
      id: '2',
      leadName: 'Michael Rivera - StartupXYZ',
      dealValue: 8500,
      status: 'viewed',
      videoWalkthrough: true,
      objectionHandling: ['Budget', 'Competing priorities'],
      viewCount: 2,
      timeSpent: 320,
      lastViewed: new Date(Date.now() - 7200000),
      sentAt: new Date(Date.now() - 86400000),
      closedAt: null
    },
    {
      id: '3',
      leadName: 'Emma Watson - AgencyPro',
      dealValue: 25000,
      status: 'closed',
      videoWalkthrough: true,
      objectionHandling: ['Implementation', 'Support'],
      viewCount: 6,
      timeSpent: 1240,
      lastViewed: new Date(Date.now() - 86400000),
      sentAt: new Date(Date.now() - 86400000 * 5),
      closedAt: new Date(Date.now() - 86400000)
    }
  ]);

  const [newProposal, setNewProposal] = useState({
    leadName: '',
    dealValue: '',
    summary: '',
    keyBenefits: ''
  });

  const stats = {
    activeProposals: proposals.filter(p => !['closed', 'expired'].includes(p.status)).length,
    totalValue: proposals.filter(p => p.status !== 'expired').reduce((sum, p) => sum + p.dealValue, 0),
    closedValue: proposals.filter(p => p.status === 'closed').reduce((sum, p) => sum + p.dealValue, 0),
    avgCloseTime: 3.2, // days
    conversionRate: 67, // %
    viewToCloseRate: 45 // %
  };

  const getStatusColor = (status: AsyncProposal['status']) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'sent': return 'bg-blue-500/20 text-blue-400';
      case 'viewed': return 'bg-yellow-500/20 text-yellow-400';
      case 'engaged': return 'bg-orange-500/20 text-orange-400';
      case 'closed': return 'bg-green-500/20 text-green-400';
      case 'expired': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Video className="w-6 h-6" />
            Async High-Ticket Closing Engine
          </h1>
          <p className="text-muted-foreground">Close premium deals without live calls — 24/7</p>
        </div>
        <Badge className="bg-green-500/20 text-green-400 text-lg px-4 py-2">
          ${stats.closedValue.toLocaleString()} Closed This Month
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Active Proposals</span>
            </div>
            <div className="text-2xl font-bold">{stats.activeProposals}</div>
            <div className="text-sm text-muted-foreground">
              ${stats.totalValue.toLocaleString()} pipeline
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Avg Close Time</span>
            </div>
            <div className="text-2xl font-bold">{stats.avgCloseTime} days</div>
            <div className="text-sm text-green-400">No calls needed</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Conversion Rate</span>
            </div>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <div className="text-sm text-muted-foreground">
              Sent → Closed
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm">View → Close</span>
            </div>
            <div className="text-2xl font-bold">{stats.viewToCloseRate}%</div>
            <div className="text-sm text-muted-foreground">
              Engaged viewers convert
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="proposals" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="proposals">Active Proposals</TabsTrigger>
          <TabsTrigger value="create">Create Proposal</TabsTrigger>
          <TabsTrigger value="templates">Objection Library</TabsTrigger>
          <TabsTrigger value="analytics">Close Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="space-y-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{proposal.leadName}</h3>
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${proposal.dealValue.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {proposal.viewCount} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(proposal.timeSpent)} spent
                      </span>
                      {proposal.videoWalkthrough && (
                        <span className="flex items-center gap-1 text-green-400">
                          <Video className="w-4 h-4" />
                          Video included
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    {proposal.status !== 'closed' && (
                      <Button size="sm" className="bg-primary">
                        <Send className="w-4 h-4 mr-1" />
                        Follow Up
                      </Button>
                    )}
                  </div>
                </div>

                {/* Engagement Timeline */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Engagement Progress</span>
                    <span className="text-muted-foreground">
                      {proposal.lastViewed 
                        ? `Last viewed ${Math.round((Date.now() - proposal.lastViewed.getTime()) / 3600000)}h ago`
                        : 'Not viewed yet'}
                    </span>
                  </div>
                  <Progress 
                    value={
                      proposal.status === 'closed' ? 100 :
                      proposal.status === 'engaged' ? 75 :
                      proposal.status === 'viewed' ? 50 :
                      proposal.status === 'sent' ? 25 : 10
                    } 
                    className="h-2" 
                  />
                </div>

                {/* Objections Handled */}
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Objections addressed:</span>
                  {proposal.objectionHandling.map((objection, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-green-400" />
                      {objection}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                AI-Powered Proposal Generator
              </CardTitle>
              <CardDescription>
                Create personalized async proposals with video walkthroughs and objection handling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Lead Name & Company</label>
                  <Input 
                    placeholder="e.g. John Smith - Acme Inc"
                    value={newProposal.leadName}
                    onChange={(e) => setNewProposal({...newProposal, leadName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Deal Value ($)</label>
                  <Input 
                    type="number"
                    placeholder="e.g. 15000"
                    value={newProposal.dealValue}
                    onChange={(e) => setNewProposal({...newProposal, dealValue: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Proposal Summary</label>
                <Textarea 
                  placeholder="Brief overview of the offer and key outcomes..."
                  value={newProposal.summary}
                  onChange={(e) => setNewProposal({...newProposal, summary: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Key Benefits (one per line)</label>
                <Textarea 
                  placeholder="Increase revenue by 40%&#10;Save 10 hours per week&#10;Reduce churn by 25%"
                  value={newProposal.keyBenefits}
                  onChange={(e) => setNewProposal({...newProposal, keyBenefits: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm">Generate Video Walkthrough</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm">Auto Objection Handling</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm">Smart Follow-up Sequence</span>
                </div>
              </div>

              <Button className="w-full bg-primary">
                <Zap className="w-4 h-4 mr-2" />
                Generate Async Proposal
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Objection Handling Library</CardTitle>
              <CardDescription>
                Pre-built responses that trigger based on buyer behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { trigger: 'Price Hesitation', response: 'ROI breakdown + payment plan option', effectiveness: 78 },
                { trigger: 'Timeline Concerns', response: 'Implementation roadmap + quick wins', effectiveness: 82 },
                { trigger: 'Competitor Comparison', response: 'Differentiation matrix + case study', effectiveness: 71 },
                { trigger: 'Need Approval', response: 'Executive summary + decision framework', effectiveness: 65 },
                { trigger: 'Not Ready Yet', response: 'Value drip sequence + limited offer', effectiveness: 59 }
              ].map((objection, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      {objection.trigger}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      → {objection.response}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">{objection.effectiveness}%</div>
                    <div className="text-xs text-muted-foreground">Effectiveness</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Close Rate by Proposal Element</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { element: 'Video Walkthrough', rate: 72, baseline: 45 },
                  { element: 'Interactive Pricing', rate: 68, baseline: 52 },
                  { element: 'Case Study Included', rate: 64, baseline: 48 },
                  { element: 'Objection Handlers', rate: 61, baseline: 41 },
                  { element: 'Limited Time Offer', rate: 58, baseline: 39 }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{item.element}</span>
                      <span className="text-green-400">+{item.rate - item.baseline}% vs baseline</span>
                    </div>
                    <Progress value={item.rate} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Sleep Revenue Generated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-lg">
                    <div className="text-4xl font-bold text-green-400">$47,500</div>
                    <div className="text-muted-foreground">Closed while you slept (last 30 days)</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-muted-foreground">Avg Deal Size</div>
                      <div className="font-bold">$12,800</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-muted-foreground">Deals/Month</div>
                      <div className="font-bold">4.2</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-muted-foreground">Calls Avoided</div>
                      <div className="font-bold text-green-400">38</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-muted-foreground">Hours Saved</div>
                      <div className="font-bold text-green-400">47</div>
                    </div>
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

export default AsyncClosingEngine;
