import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays, subWeeks } from 'date-fns';

interface NarrativeEntry {
  id: string;
  date: Date;
  type: 'milestone' | 'decision' | 'insight' | 'warning' | 'win';
  title: string;
  story: string;
  impact?: {
    metric: string;
    before: number;
    after: number;
    unit: string;
  };
  emotionalHook?: string;
}

// Mock narrative data
const mockNarratives: NarrativeEntry[] = [
  {
    id: '1',
    date: new Date(),
    type: 'win',
    title: 'Lazarus Engine Resurrects $47,000',
    story: 'Three leads you wrote off 6 months ago responded to AI-personalized reactivation. One remembered you mentioned their specific pain point about "lead quality" — the AI found that in your old chat and referenced it.',
    impact: {
      metric: 'Recovered Revenue',
      before: 0,
      after: 47000,
      unit: 'USD',
    },
    emotionalHook: 'That lead you thought was dead? They just replied.',
  },
  {
    id: '2',
    date: subDays(new Date(), 2),
    type: 'decision',
    title: 'Boardroom Council Blocked a Bad Deal',
    story: 'You were about to accept a $15K project. The CFO agent flagged it would cost $18K in opportunity cost by blocking capacity for 3 better-fit leads. You passed. One of those leads closed for $28K.',
    impact: {
      metric: 'Net Gain',
      before: 15000,
      after: 28000,
      unit: 'USD',
    },
    emotionalHook: 'The deal you didn\'t take made you more money.',
  },
  {
    id: '3',
    date: subDays(new Date(), 5),
    type: 'insight',
    title: 'Hive Mind Discovered Your Secret Weapon',
    story: 'Across 47 similar businesses, responses mentioning "implementation timeline" in the first message had 3.2x higher close rates. Your AI now leads with this in all outreach.',
    emotionalHook: 'Other businesses taught yours to sell better.',
  },
  {
    id: '4',
    date: subWeeks(new Date(), 1),
    type: 'milestone',
    title: 'First Fully Autonomous Week',
    story: 'This was your first week where AI handled 100% of lead qualification without a single override needed. Trust score reached Level 3. You\'re 28% more replaceable than last month.',
    impact: {
      metric: 'Founder Hours Saved',
      before: 15,
      after: 0,
      unit: 'hours',
    },
    emotionalHook: 'Your business ran itself for 7 days.',
  },
  {
    id: '5',
    date: subWeeks(new Date(), 2),
    type: 'warning',
    title: 'Churn Guard Prevented 3 Cancellations',
    story: 'Three payment failures were detected. Instead of losing $4,500/mo in recurring revenue, the AI waited for payday (the 15th), sent personalized recovery messages, and recovered all three.',
    impact: {
      metric: 'MRR Saved',
      before: 0,
      after: 4500,
      unit: 'USD/mo',
    },
    emotionalHook: 'Revenue you almost lost is still flowing.',
  },
];

export function NarrativeEngine() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');

  const getTypeIcon = (type: NarrativeEntry['type']) => {
    switch (type) {
      case 'win': return <Award className="h-5 w-5 text-green-500" />;
      case 'decision': return <Target className="h-5 w-5 text-blue-500" />;
      case 'insight': return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'milestone': return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
    }
  };

  const getTypeBadge = (type: NarrativeEntry['type']) => {
    const variants: Record<string, string> = {
      win: 'bg-green-500/10 text-green-500 border-green-500/20',
      decision: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      insight: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      warning: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      milestone: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };
    return variants[type];
  };

  const calculateTotalImpact = () => {
    return mockNarratives.reduce((sum, n) => {
      if (n.impact && n.impact.unit === 'USD') {
        return sum + (n.impact.after - n.impact.before);
      }
      return sum;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Your Business Story
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what changed because of you — and your AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={selectedPeriod === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedPeriod('week')}
          >
            This Week
          </Button>
          <Button 
            variant={selectedPeriod === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedPeriod('month')}
          >
            This Month
          </Button>
          <Button 
            variant={selectedPeriod === 'quarter' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedPeriod('quarter')}
          >
            Quarter
          </Button>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Revenue Impact</span>
            </div>
            <p className="text-2xl font-bold">${calculateTotalImpact().toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">AI-influenced this period</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Decisions Made</span>
            </div>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">8 autonomous, 4 approved</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-500 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Hours Saved</span>
            </div>
            <p className="text-2xl font-bold">23.5</p>
            <p className="text-xs text-muted-foreground">That you didn't work</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-500 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Risks Blocked</span>
            </div>
            <p className="text-2xl font-bold">4</p>
            <p className="text-xs text-muted-foreground">Bad deals, churn prevented</p>
          </CardContent>
        </Card>
      </div>

      {/* Story Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">The Story So Far</CardTitle>
          <CardDescription>
            Every decision, every insight, every win — in narrative form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              {mockNarratives.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <NarrativeCard entry={entry} getTypeIcon={getTypeIcon} getTypeBadge={getTypeBadge} />
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function NarrativeCard({ 
  entry, 
  getTypeIcon, 
  getTypeBadge 
}: { 
  entry: NarrativeEntry;
  getTypeIcon: (type: NarrativeEntry['type']) => React.ReactNode;
  getTypeBadge: (type: NarrativeEntry['type']) => string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Emotional Hook Banner */}
        {entry.emotionalHook && (
          <div className="bg-primary/5 px-4 py-2 border-b border-primary/10">
            <p className="text-sm font-medium text-primary italic">
              "{entry.emotionalHook}"
            </p>
          </div>
        )}
        
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                {getTypeIcon(entry.type)}
              </div>
              <div>
                <h3 className="font-semibold">{entry.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getTypeBadge(entry.type)}>
                    {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(entry.date, 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Story */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {entry.story}
          </p>

          {/* Impact */}
          {entry.impact && (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{entry.impact.metric}:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm line-through text-muted-foreground">
                  {entry.impact.unit === 'USD' ? '$' : ''}{entry.impact.before.toLocaleString()}
                  {entry.impact.unit === 'hours' ? 'h' : entry.impact.unit === 'USD/mo' ? '/mo' : ''}
                </span>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                <span className="text-sm font-bold text-green-500">
                  {entry.impact.unit === 'USD' ? '$' : ''}{entry.impact.after.toLocaleString()}
                  {entry.impact.unit === 'hours' ? 'h' : entry.impact.unit === 'USD/mo' ? '/mo' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default NarrativeEngine;
