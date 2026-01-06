import { useEffect } from "react";
import { useAlphaVisionStore } from "@/store/alpha-vision-store";
import { useOrganization } from "@/hooks/useOrganization";
import { RiskPosture } from "@/types/alpha-vision";
import { cn } from "@/lib/utils";
import { Shield, Zap, AlertTriangle, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export function SettingsView() {
  const { 
    riskPosture, 
    setRiskPosture, 
    runwayMonths, 
    setRunwayMonths 
  } = useAlphaVisionStore();
  
  const { permissionContract, updatePermissionContract, loading } = useOrganization();

  // Sync local state with database on load
  useEffect(() => {
    if (permissionContract) {
      setRiskPosture('personal', permissionContract.risk_posture_personal as RiskPosture);
      setRiskPosture('business', permissionContract.risk_posture_business as RiskPosture);
      setRiskPosture('marketing', permissionContract.risk_posture_marketing as RiskPosture);
      setRunwayMonths(permissionContract.runway_minimum);
    }
  }, [permissionContract]);

  const riskOptions: { value: RiskPosture; label: string; description: string; color: string }[] = [
    { value: 'conservative', label: 'Conservative', description: 'Prioritize safety and stability', color: 'from-blue-500 to-blue-600' },
    { value: 'balanced', label: 'Balanced', description: 'Optimize risk/reward ratio', color: 'from-yellow-500 to-orange-500' },
    { value: 'aggressive', label: 'Aggressive', description: 'Maximize growth potential', color: 'from-red-500 to-red-600' },
  ];

  const domains = [
    { key: 'personal' as const, label: 'Personal', icon: Shield },
    { key: 'business' as const, label: 'Business Ops', icon: Zap },
    { key: 'marketing' as const, label: 'Marketing', icon: AlertTriangle },
  ];

  const handleSave = async () => {
    const { error } = await updatePermissionContract({
      risk_posture_personal: riskPosture.personal,
      risk_posture_business: riskPosture.business,
      risk_posture_marketing: riskPosture.marketing,
      runway_minimum: runwayMonths,
    });

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved successfully");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">Permission Contract</h1>
        <p className="text-muted-foreground">
          Define your risk tolerance and operating parameters. Alpha Vision will respect these constraints in all recommendations.
        </p>
      </div>

      {/* Risk Posture by Domain */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Risk Posture by Domain</h2>
        
        <div className="space-y-6">
          {domains.map((domain) => (
            <div key={domain.key} className="space-y-3">
              <div className="flex items-center gap-2">
                <domain.icon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{domain.label}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {riskOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRiskPosture(domain.key, option.value)}
                    className={cn(
                      "p-3 rounded-lg border transition-all duration-200",
                      riskPosture[domain.key] === option.value
                        ? `bg-gradient-to-r ${option.color} border-transparent text-white`
                        : "border-border hover:border-muted-foreground/50 text-muted-foreground"
                    )}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-80">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Runway Settings */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Runway Protection</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Minimum runway (months)</span>
            <span className="font-mono text-2xl gradient-text">{runwayMonths}</span>
          </div>
          
          <Slider
            value={[runwayMonths]}
            onValueChange={([v]) => setRunwayMonths(v)}
            min={3}
            max={24}
            step={1}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3 months (critical)</span>
            <span>6 months (minimum)</span>
            <span>12+ months (growth)</span>
          </div>
          
          <div className={cn(
            "p-3 rounded-lg text-sm",
            runwayMonths >= 12 ? "bg-green-500/10 text-green-400" :
            runwayMonths >= 9 ? "bg-yellow-500/10 text-yellow-400" :
            runwayMonths >= 6 ? "bg-orange-500/10 text-orange-400" :
            "bg-red-500/10 text-red-400"
          )}>
            {runwayMonths >= 12 
              ? "Growth mode enabled. Alpha Vision will suggest expansion opportunities."
              : runwayMonths >= 9
              ? "Healthy runway. Standard operating mode."
              : runwayMonths >= 6
              ? "Warning zone. Conservative recommendations will be prioritized."
              : "Critical runway. Autopilot disabled. Survival mode active."
            }
          </div>
        </div>
      </div>

      {/* Monthly Caps */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Monthly Caps</h2>
        
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Ad Spend', value: `$${permissionContract?.monthly_cap_ads || 5000}`, icon: '💰' },
            { label: 'Experiments', value: `${permissionContract?.monthly_cap_experiments || 3} max`, icon: '🧪' },
            { label: 'Tool Actions', value: `${permissionContract?.monthly_cap_tool_actions || 50}/day`, icon: '⚡' },
          ].map((cap) => (
            <div key={cap.label} className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl mb-2">{cap.icon}</div>
              <div className="text-sm text-muted-foreground">{cap.label}</div>
              <div className="font-semibold text-foreground">{cap.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <Button 
        onClick={handleSave}
        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
      >
        <Save className="w-4 h-4 mr-2" />
        Save Permission Contract
      </Button>
    </div>
  );
}
