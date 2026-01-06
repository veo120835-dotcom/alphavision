import { useAlphaVisionStore } from "@/store/alpha-vision-store";
import { OperationMode, RiskPosture } from "@/types/alpha-vision";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Zap, Brain } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";

export function TopBar() {
  const { mode, setMode, riskPosture, setRiskPosture } = useAlphaVisionStore();

  const modeConfig: Record<OperationMode, { icon: typeof Shield; label: string; description: string }> = {
    advisor: { icon: Brain, label: 'Advisor', description: 'Recommendations only' },
    operator: { icon: Zap, label: 'Operator', description: 'Draft & prepare actions' },
    autopilot: { icon: Shield, label: 'Autopilot', description: 'Execute within caps' },
  };

  const riskConfig: Record<RiskPosture, { color: string; label: string }> = {
    conservative: { color: 'text-blue-400', label: 'Conservative' },
    balanced: { color: 'text-yellow-400', label: 'Balanced' },
    aggressive: { color: 'text-red-400', label: 'Aggressive' },
  };

  return (
    <div className="h-16 glass border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <Select value={mode} onValueChange={(v) => setMode(v as OperationMode)}>
            <SelectTrigger className="w-40 bg-muted/50 border-border">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = modeConfig[mode].icon;
                  return <Icon className="w-4 h-4 text-primary" />;
                })()}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(modeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <config.icon className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs text-muted-foreground">{config.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Risk Posture (Business) */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Risk:</span>
          <Select 
            value={riskPosture.business} 
            onValueChange={(v) => setRiskPosture('business', v as RiskPosture)}
          >
            <SelectTrigger className="w-36 bg-muted/50 border-border">
              <span className={cn("font-medium", riskConfig[riskPosture.business].color)}>
                {riskConfig[riskPosture.business].label}
              </span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(riskConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <span className={config.color}>{config.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Indicators & Notifications */}
      <div className="flex items-center gap-3">
        <NotificationCenter />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Systems Online</span>
        </div>
      </div>
    </div>
  );
}
