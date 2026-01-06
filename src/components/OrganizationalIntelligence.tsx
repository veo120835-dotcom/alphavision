import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, Cpu, Clock, AlertTriangle, TrendingUp,
  Zap, Bot, UserPlus, UserMinus, RefreshCw, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  role: string;
  capacity: number;
  utilization: number;
  decisionLatency: number;
  automationPotential: number;
  overlap: string[];
}

interface Recommendation {
  id: string;
  type: 'hire' | 'delay' | 'automate' | 'restructure';
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

export default function OrganizationalIntelligence() {
  const [loading, setLoading] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>([
    {
      id: '1',
      role: 'Founder/CEO',
      capacity: 60,
      utilization: 95,
      decisionLatency: 2,
      automationPotential: 40,
      overlap: ['Sales', 'Strategy']
    },
    {
      id: '2', 
      role: 'Sales',
      capacity: 40,
      utilization: 80,
      decisionLatency: 4,
      automationPotential: 65,
      overlap: ['Customer Success']
    },
    {
      id: '3',
      role: 'Operations',
      capacity: 40,
      utilization: 70,
      decisionLatency: 8,
      automationPotential: 75,
      overlap: ['Customer Success']
    }
  ]);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: '1',
      type: 'automate',
      title: 'Automate Lead Qualification',
      description: 'Current sales role spends 65% of time on tasks that can be automated. Deploy AI lead scoring.',
      impact: 'Free up 26 hours/week for closing',
      priority: 'high'
    },
    {
      id: '2',
      type: 'delay',
      title: 'Delay Customer Success Hire',
      description: 'Operations has 30% spare capacity that overlaps with CS responsibilities.',
      impact: 'Save $75k/year hiring cost',
      priority: 'high'
    },
    {
      id: '3',
      type: 'restructure',
      title: 'Consolidate Decision Authority',
      description: 'Decision latency averages 8 hours due to unclear ownership. Assign explicit owners.',
      impact: 'Reduce deal cycle by 2 days',
      priority: 'medium'
    },
    {
      id: '4',
      type: 'hire',
      title: 'Hire Technical Lead (Q3)',
      description: 'Founder bottleneck on technical decisions reaching critical levels.',
      impact: 'Unblock $200k pipeline',
      priority: 'medium'
    }
  ]);

  const [stats] = useState({
    totalCapacity: 140,
    totalUtilization: 82,
    avgDecisionLatency: 4.7,
    automationOpportunity: 60,
    executionDrag: 15
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hire': return <UserPlus className="w-5 h-5 text-green-400" />;
      case 'delay': return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'automate': return <Bot className="w-5 h-5 text-blue-400" />;
      case 'restructure': return <RefreshCw className="w-5 h-5 text-purple-400" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'hire': return 'bg-green-500/20 text-green-400';
      case 'delay': return 'bg-yellow-500/20 text-yellow-400';
      case 'automate': return 'bg-blue-500/20 text-blue-400';
      case 'restructure': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
          🏢 Organizational Intelligence
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Model team capacity, role overlap, decision latency, and execution drag.
          This is how companies scale without bloat.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-5 gap-4">
        {[
          { label: 'Total Capacity', value: `${stats.totalCapacity}h/wk`, icon: Users },
          { label: 'Avg Utilization', value: `${stats.totalUtilization}%`, icon: TrendingUp },
          { label: 'Decision Latency', value: `${stats.avgDecisionLatency}h`, icon: Clock },
          { label: 'Automation Opp.', value: `${stats.automationOpportunity}%`, icon: Bot },
          { label: 'Execution Drag', value: `${stats.executionDrag}%`, icon: AlertTriangle }
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Capacity View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Capacity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {team.map((member) => (
              <div key={member.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">{member.role}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.capacity}h/week capacity
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {member.overlap.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Overlaps with: {member.overlap.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className={cn(
                        member.utilization > 90 ? "text-red-400" : 
                        member.utilization > 75 ? "text-yellow-400" : "text-green-400"
                      )}>
                        {member.utilization}%
                      </span>
                    </div>
                    <Progress 
                      value={member.utilization} 
                      className={cn(
                        "h-2",
                        member.utilization > 90 ? "[&>div]:bg-red-500" : 
                        member.utilization > 75 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"
                      )}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Decision Latency</span>
                      <span>{member.decisionLatency}h</span>
                    </div>
                    <Progress 
                      value={Math.min(member.decisionLatency * 10, 100)} 
                      className="h-2 [&>div]:bg-blue-500"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Automation Potential</span>
                      <span className="text-purple-400">{member.automationPotential}%</span>
                    </div>
                    <Progress 
                      value={member.automationPotential} 
                      className="h-2 [&>div]:bg-purple-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          AI Recommendations
        </h2>

        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              "border-l-4",
              rec.priority === 'high' ? "border-l-red-500" :
              rec.priority === 'medium' ? "border-l-yellow-500" : "border-l-green-500"
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      {getTypeIcon(rec.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{rec.title}</h3>
                        <Badge className={getTypeBadge(rec.type)}>
                          {rec.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {rec.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <TrendingUp className="w-3 h-3" />
                        {rec.impact}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Implement
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Scale Without Bloat */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-green-500/20">
              <Cpu className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Scale Without Bloat</h3>
              <p className="text-muted-foreground">
                Most companies hire when they hit capacity. Elite operators first:
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Automate what can be automated
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Eliminate role overlap
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Reduce decision latency
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Only then consider hiring
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
