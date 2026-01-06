import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';

interface FounderSubstitutionData {
  overallDependency: number;
  replacementReadiness: number;
  trend: 'improving' | 'stable' | 'worsening';
  dependencies: {
    decisions: number;
    creativity: number;
    sales: number;
    authority: number;
    emotional: number;
    relationships: number;
  };
  bottlenecks: string[];
  delegationOpportunities: string[];
  automationOpportunities: string[];
}

// Mock data - would come from database
const mockData: FounderSubstitutionData = {
  overallDependency: 0.72,
  replacementReadiness: 0.28,
  trend: 'improving',
  dependencies: {
    decisions: 0.85,
    creativity: 0.70,
    sales: 0.75,
    authority: 0.80,
    emotional: 0.55,
    relationships: 0.70,
  },
  bottlenecks: [
    'High-ticket sales still require founder presence',
    'Strategic decisions lack documented criteria',
    'Client relationships are personality-dependent',
  ],
  delegationOpportunities: [
    'Initial lead qualification can be fully automated',
    'Content creation can use AI with style training',
    'Meeting scheduling and follow-ups',
  ],
  automationOpportunities: [
    'Shadow Mode: Clone founder communication style',
    'Boardroom: Replace strategic consults with AI council',
    'Lazarus Engine: Automate lead reactivation',
  ],
};

export function FounderSubstitutionIndex() {
  const data = mockData;
  const readinessPercent = Math.round(data.replacementReadiness * 100);
  const dependencyPercent = Math.round(data.overallDependency * 100);
  
  const getTrendIcon = () => {
    switch (data.trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'worsening': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <ArrowRight className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getDependencyColor = (value: number) => {
    if (value > 0.8) return 'bg-red-500';
    if (value > 0.6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getDependencyLabel = (value: number) => {
    if (value > 0.8) return 'Critical';
    if (value > 0.6) return 'High';
    if (value > 0.4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            Founder Substitution Index
          </h1>
          <p className="text-muted-foreground mt-1">
            Measuring how replaceable you are — the goal is 100%
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={`gap-1 ${
            data.trend === 'improving' ? 'border-green-500 text-green-500' :
            data.trend === 'worsening' ? 'border-red-500 text-red-500' :
            'border-yellow-500 text-yellow-500'
          }`}
        >
          {getTrendIcon()}
          {data.trend.charAt(0).toUpperCase() + data.trend.slice(1)}
        </Badge>
      </div>

      {/* Main Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Replacement Readiness */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Replacement Readiness
            </CardTitle>
            <CardDescription>
              How well can the business run without you?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold text-primary">{readinessPercent}%</span>
                <span className="text-muted-foreground pb-2">ready</span>
              </div>
              <Progress value={readinessPercent} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {readinessPercent < 30 && "You are the business. High risk if you're unavailable."}
                {readinessPercent >= 30 && readinessPercent < 60 && "Making progress. Some operations can run independently."}
                {readinessPercent >= 60 && readinessPercent < 80 && "Good progress! Most daily operations are delegated."}
                {readinessPercent >= 80 && "Excellent! Business can operate for extended periods without you."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dependency Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Founder Dependency
            </CardTitle>
            <CardDescription>
              How much does the business need YOU specifically?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold">{dependencyPercent}%</span>
                <span className="text-muted-foreground pb-2">dependent</span>
              </div>
              <Progress value={dependencyPercent} className="h-3 [&>div]:bg-yellow-500" />
              <p className="text-sm text-muted-foreground">
                {dependencyPercent > 80 && "Critical dependency. Business is at risk without you."}
                {dependencyPercent > 60 && dependencyPercent <= 80 && "High dependency. Focus on delegation and automation."}
                {dependencyPercent > 40 && dependencyPercent <= 60 && "Moderate dependency. Good progress toward independence."}
                {dependencyPercent <= 40 && "Low dependency. Business has strong operational independence."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dependency Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dependency Breakdown</CardTitle>
          <CardDescription>Where you're most needed vs. where you're replaceable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.dependencies).map(([key, value]) => (
              <DependencyItem
                key={key}
                label={formatDependencyLabel(key)}
                value={value}
                color={getDependencyColor(value)}
                level={getDependencyLabel(value)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bottlenecks */}
        <Card className="border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Bottlenecks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.bottlenecks.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-500 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Delegation Opportunities */}
        <Card className="border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-500">
              <Briefcase className="h-5 w-5" />
              Delegate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.delegationOpportunities.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-500 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Automation Opportunities */}
        <Card className="border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              Automate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.automationOpportunities.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Path to Independence
          </CardTitle>
          <CardDescription>Estimated timeline to reach 80% replacement readiness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
            <div className="space-y-6">
              <TimelineItem 
                month="Month 1-2" 
                title="Automate Lead Qualification"
                description="Deploy AI scoring and initial outreach automation"
                complete={false}
              />
              <TimelineItem 
                month="Month 2-3" 
                title="Clone Communication Style"
                description="Train Shadow Mode on founder emails and calls"
                complete={false}
              />
              <TimelineItem 
                month="Month 3-4" 
                title="Document Decision Criteria"
                description="Create decision trees for common strategic choices"
                complete={false}
              />
              <TimelineItem 
                month="Month 4-6" 
                title="Transition Client Relationships"
                description="Introduce AI as primary contact, founder as escalation"
                complete={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DependencyItem({ 
  label, 
  value, 
  color, 
  level 
}: { 
  label: string; 
  value: number; 
  color: string;
  level: string;
}) {
  const percent = Math.round(value * 100);
  
  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{label}</span>
        <Badge variant="outline" className="text-xs">{level}</Badge>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={percent} className={`h-2 flex-1 [&>div]:${color}`} />
        <span className="text-sm font-medium w-12 text-right">{percent}%</span>
      </div>
    </div>
  );
}

function TimelineItem({
  month,
  title,
  description,
  complete,
}: {
  month: string;
  title: string;
  description: string;
  complete: boolean;
}) {
  return (
    <div className="relative pl-10">
      <div className={`absolute left-2 w-4 h-4 rounded-full ${complete ? 'bg-green-500' : 'bg-muted-foreground/30'} border-4 border-background`} />
      <div>
        <Badge variant="outline" className="mb-1">{month}</Badge>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function formatDependencyLabel(key: string): string {
  const labels: Record<string, string> = {
    decisions: 'Strategic Decisions',
    creativity: 'Creative Output',
    sales: 'Sales & Closing',
    authority: 'Brand Authority',
    emotional: 'Team Morale',
    relationships: 'Client Relationships',
  };
  return labels[key] || key;
}

export default FounderSubstitutionIndex;
