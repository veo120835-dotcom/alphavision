import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Wallet, DollarSign, Zap,
  CheckCircle2, Clock, Target,
  CreditCard, FileText, Trash2, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useOrganization } from "@/hooks/useOrganization";
import { useMockStorage, generateMockId } from "@/hooks/useMockStorage";

interface CashflowOptimization {
  id: string;
  optimization_type: string;
  title: string;
  description: string;
  estimated_monthly_savings: number;
  estimated_one_time_savings: number;
  confidence_score: number;
  status: string;
  auto_executable: boolean;
  risk_level: string;
  detected_at: string;
}

export default function CashflowOptimizationEngine() {
  const { organization } = useOrganization();
  const [autoMode, setAutoMode] = useState(false);

  // Use mock storage for non-existent tables with sample data
  const { data: optimizations, updateItem } = useMockStorage<CashflowOptimization>(`cashflow_optimizations_${organization?.id}`, [
    {
      id: generateMockId(),
      optimization_type: 'waste_detection',
      title: 'Unused Zoom Licenses',
      description: '3 Zoom licenses not used in 60+ days. Cancel to save immediately.',
      estimated_monthly_savings: 45,
      estimated_one_time_savings: 0,
      confidence_score: 95,
      status: 'detected',
      auto_executable: true,
      risk_level: 'low',
      detected_at: new Date().toISOString()
    },
    {
      id: generateMockId(),
      optimization_type: 'invoice_speedup',
      title: 'Accelerate Invoice #4521',
      description: 'Client typically pays within 5 days. Send reminder now to capture $8,500 earlier.',
      estimated_monthly_savings: 0,
      estimated_one_time_savings: 8500,
      confidence_score: 85,
      status: 'detected',
      auto_executable: true,
      risk_level: 'low',
      detected_at: new Date().toISOString()
    },
    {
      id: generateMockId(),
      optimization_type: 'subscription_consolidation',
      title: 'Consolidate Marketing Tools',
      description: 'Replace 3 separate tools with HubSpot starter. Same functionality, 40% less cost.',
      estimated_monthly_savings: 320,
      estimated_one_time_savings: 0,
      confidence_score: 78,
      status: 'detected',
      auto_executable: false,
      risk_level: 'medium',
      detected_at: new Date().toISOString()
    },
    {
      id: generateMockId(),
      optimization_type: 'payment_timing',
      title: 'Delay AWS Payment',
      description: 'Move AWS billing from 1st to 15th. Improves cash position by $2,400 for 2 weeks/month.',
      estimated_monthly_savings: 0,
      estimated_one_time_savings: 2400,
      confidence_score: 90,
      status: 'detected',
      auto_executable: true,
      risk_level: 'low',
      detected_at: new Date().toISOString()
    }
  ]);

  const approveOptimization = (optId: string) => {
    updateItem(optId, { status: 'approved' });
    toast.success('Optimization approved for execution');
  };

  const executeOptimization = (optId: string) => {
    updateItem(optId, { status: 'completed' });
    toast.success('Optimization executed successfully');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'waste_detection': return <Trash2 className="w-5 h-5 text-red-400" />;
      case 'invoice_speedup': return <FileText className="w-5 h-5 text-blue-400" />;
      case 'collection_improvement': return <DollarSign className="w-5 h-5 text-green-400" />;
      case 'payment_timing': return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'tool_elimination': return <Trash2 className="w-5 h-5 text-purple-400" />;
      case 'subscription_consolidation': return <CreditCard className="w-5 h-5 text-orange-400" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const stats = {
    totalMonthlySavings: optimizations.filter(o => o.status === 'completed').reduce((a, b) => a + (b.estimated_monthly_savings || 0), 0),
    totalOneTimeSavings: optimizations.filter(o => o.status === 'completed').reduce((a, b) => a + (b.estimated_one_time_savings || 0), 0),
    pendingOptimizations: optimizations.filter(o => o.status === 'detected' || o.status === 'approved').length,
    completedOptimizations: optimizations.filter(o => o.status === 'completed').length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
            💸 Cashflow Optimization Autopilot
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Zero-downside improvements to cashflow and burn. Detect waste, speed up invoicing, 
            improve collections, optimize payment timing. Quietly creates money.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Auto-Execute (Low Risk)</span>
            <Switch checked={autoMode} onCheckedChange={setAutoMode} />
          </div>
          <Button>
            <RefreshCw className="w-4 h-4 mr-2" />
            Scan for Optimizations
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold text-green-400">
              ${stats.totalMonthlySavings.toLocaleString()}/mo
            </div>
            <div className="text-xs text-muted-foreground">Monthly Savings</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold">${stats.totalOneTimeSavings.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">One-Time Recovered</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold">{stats.pendingOptimizations}</div>
            <div className="text-xs text-muted-foreground">Pending Actions</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold">{stats.completedOptimizations}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-6 gap-3">
            {[
              { type: 'waste_detection', label: 'Waste Detection', icon: Trash2 },
              { type: 'invoice_speedup', label: 'Invoice Speed', icon: FileText },
              { type: 'collection_improvement', label: 'Collections', icon: DollarSign },
              { type: 'payment_timing', label: 'Payment Timing', icon: Clock },
              { type: 'tool_elimination', label: 'Tool Cleanup', icon: Trash2 },
              { type: 'subscription_consolidation', label: 'Consolidation', icon: CreditCard }
            ].map((cat) => (
              <div key={cat.type} className="p-3 rounded-lg bg-muted/50 text-center">
                <cat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-xs font-medium">{cat.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detected Optimizations */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Detected Optimizations</h2>
        
        {optimizations.map((opt, index) => (
          <motion.div
            key={opt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              "border-l-4",
              opt.status === 'completed' ? "border-l-green-500" :
              opt.risk_level === 'low' ? "border-l-blue-500" :
              opt.risk_level === 'medium' ? "border-l-yellow-500" : "border-l-red-500"
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      {getTypeIcon(opt.optimization_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{opt.title}</h3>
                        <Badge variant="outline" className="capitalize text-xs">
                          {opt.optimization_type.replace('_', ' ')}
                        </Badge>
                        <Badge className={cn(
                          opt.risk_level === 'low' ? "bg-green-500/20 text-green-400" :
                          opt.risk_level === 'medium' ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {opt.risk_level} risk
                        </Badge>
                        {opt.auto_executable && (
                          <Badge className="bg-blue-500/20 text-blue-400">
                            <Zap className="w-3 h-3 mr-1" />
                            Auto-executable
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{opt.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-4 mb-2">
                      {opt.estimated_monthly_savings > 0 && (
                        <div>
                          <div className="text-lg font-bold text-green-400">
                            +${opt.estimated_monthly_savings}/mo
                          </div>
                          <div className="text-xs text-muted-foreground">monthly savings</div>
                        </div>
                      )}
                      {opt.estimated_one_time_savings > 0 && (
                        <div>
                          <div className="text-lg font-bold text-blue-400">
                            +${opt.estimated_one_time_savings.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">one-time</div>
                        </div>
                      )}
                    </div>
                    
                    {opt.status === 'detected' && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Dismiss
                        </Button>
                        <Button size="sm" onClick={() => approveOptimization(opt.id)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                    {opt.status === 'approved' && (
                      <Button size="sm" onClick={() => executeOptimization(opt.id)}>
                        <Zap className="w-4 h-4 mr-1" />
                        Execute
                      </Button>
                    )}
                    {opt.status === 'completed' && (
                      <Badge className="bg-green-500/20 text-green-400">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Confidence</span>
                    <span>{opt.confidence_score}%</span>
                  </div>
                  <Progress value={opt.confidence_score} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Key Benefits */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Why This Matters</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Zero Downside', desc: 'No risk - only finds waste and inefficiency' },
              { title: 'Very Sticky', desc: 'Once enabled, savings compound every month' },
              { title: 'Enterprise-Ready', desc: 'Read-only where required, approval for sensitive changes' }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}