import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Check, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { GHLConnectionTester } from "./GHLConnectionTester";

interface GHLConnectionFlowProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function GHLConnectionFlow({ onConnectionChange }: GHLConnectionFlowProps) {
  const { organization } = useOrganization();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    checkConnection();
    handleOAuthCallback();
  }, [organization?.id]);

  const checkConnection = async () => {
    if (!organization?.id) return;

    const { data } = await supabase
      .from('integrations')
      .select('status, credentials_encrypted')
      .eq('organization_id', organization.id)
      .eq('provider', 'gohighlevel')
      .single();

    const connected = data?.status === 'connected';
    setIsConnected(connected);
    
    if (connected && data?.credentials_encrypted) {
      try {
        const creds = JSON.parse(data.credentials_encrypted as string);
        setLocationId(creds.location_id);
      } catch {}
    }

    onConnectionChange?.(connected);
  };

  const handleOAuthCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('ghl_code');
    const orgId = params.get('org_id');
    const error = params.get('ghl_error');

    if (error) {
      toast.error(`GHL Connection failed: ${error}`);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (code && orgId && organization?.id === orgId) {
      setIsConnecting(true);
      
      try {
        const { data, error: fnError } = await supabase.functions.invoke('crm-oauth', {
          body: {
            action: 'exchange_code',
            code,
            organization_id: organization.id,
            redirect_uri: `${window.location.origin}/integrations`
          }
        });

        if (fnError || data?.error) {
          throw new Error(data?.error || fnError?.message || 'Failed to complete connection');
        }

        toast.success('GoHighLevel connected successfully!');
        setIsConnected(true);
        setLocationId(data.location_id);
        onConnectionChange?.(true);
      } catch (err: any) {
        toast.error(err.message || 'Failed to connect GoHighLevel');
      } finally {
        setIsConnecting(false);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  };

  const handleConnect = async () => {
    if (!organization?.id) {
      toast.error('Please sign in first');
      return;
    }

    setIsConnecting(true);

    try {
      const { data, error } = await supabase.functions.invoke('crm-oauth', {
        body: {
          action: 'get_auth_url',
          organization_id: organization.id,
          redirect_uri: `${window.location.origin}/integrations`
        }
      });

      if (error || data?.error) {
        if (data?.setup_required) {
          setNeedsSetup(true);
          toast.error('GHL OAuth not configured. Admin setup required.');
        } else {
          throw new Error(data?.error || error?.message);
        }
        return;
      }

      // Redirect to GHL OAuth
      window.location.href = data.auth_url;
    } catch (err: any) {
      toast.error(err.message || 'Failed to start connection');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!organization?.id) return;

    setIsDisconnecting(true);

    try {
      const { error } = await supabase.functions.invoke('crm-oauth', {
        body: {
          action: 'revoke',
          organization_id: organization.id
        }
      });

      if (error) throw error;

      toast.success('GoHighLevel disconnected');
      setIsConnected(false);
      setLocationId(null);
      onConnectionChange?.(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (needsSetup) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-200">Admin Setup Required</h3>
              <p className="text-sm text-muted-foreground mt-1">
                GHL OAuth requires admin configuration. Add GHL_CLIENT_ID and GHL_CLIENT_SECRET to enable OAuth.
              </p>
              <Button
                size="sm"
                variant="link"
                className="text-amber-400 p-0 h-auto mt-2"
                onClick={() => window.open('https://marketplace.gohighlevel.com/apps', '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Register GHL App
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={isConnected ? "border-green-500/30" : "border-primary/20"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${isConnected ? 'bg-green-500/20' : 'bg-primary/20'}`}>
                <Zap className={`w-5 h-5 ${isConnected ? 'text-green-400' : 'text-primary'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">GoHighLevel</h3>
                  {isConnected && (
                    <Badge className="bg-green-500/20 text-green-400">
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isConnected 
                    ? `Location: ${locationId?.substring(0, 8)}...` 
                    : 'Connect via OAuth - no API key needed'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {isConnected ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  {isDisconnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Disconnect'
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Connect with OAuth
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Show tester when connected */}
          {isConnected && organization?.id && (
            <GHLConnectionTester 
              organizationId={organization.id} 
              locationId={locationId} 
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
