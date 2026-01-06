import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle2, 
  XCircle,
  Clock,
  User,
  TrendingUp,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface ApprovalRequest {
  id: string;
  request_type: string;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string | null;
  agent_recommendation: string | null;
  risk_assessment: any;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  decision: string | null;
  decision_notes: string | null;
  lead_id: string | null;
}

export function ApprovalDashboardView() {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchRequests();

      // Subscribe to real-time approval updates
      const channel = supabase
        .channel('approval-requests-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'approval_requests',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            console.log('Approval request update:', payload);
            if (payload.eventType === 'INSERT') {
              setRequests(prev => [payload.new as ApprovalRequest, ...prev]);
              toast.info('New approval request received!');
            } else if (payload.eventType === 'UPDATE') {
              setRequests(prev => 
                prev.map(r => r.id === (payload.new as ApprovalRequest).id ? payload.new as ApprovalRequest : r)
              );
            } else if (payload.eventType === 'DELETE') {
              setRequests(prev => prev.filter(r => r.id !== (payload.old as any).id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [organization?.id]);

  const fetchRequests = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('approval_requests')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as ApprovalRequest[]);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (requestId: string, decision: 'approved' | 'rejected') => {
    if (!user?.id) return;
    
    setProcessing(true);
    try {
      const { error } = await (supabase as any)
        .from('approval_requests')
        .update({
          status: decision,
          resolved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(`Request ${decision}!`);
      setSelectedRequest(null);
      setDecisionNotes("");
      fetchRequests();
    } catch (error) {
      console.error('Error processing decision:', error);
      toast.error('Failed to process decision');
    } finally {
      setProcessing(false);
    }
  };

  const createTestRequest = async () => {
    if (!organization?.id) return;

    const testRequests = [
      {
        title: 'High-Value Coaching Package',
        amount: 2500,
        description: 'Lead expressed strong interest in premium coaching. Agent recommends closing.',
        agent_recommendation: 'High-probability close. Lead has engaged with 8 content pieces and responded positively in DMs.',
        risk_assessment: { confidence: 0.85, objections: ['price'], urgency: 'high' }
      },
      {
        title: 'Enterprise Consulting Deal',
        amount: 5000,
        description: 'B2B prospect requesting custom solution.',
        agent_recommendation: 'Qualified lead with budget authority. Recommend proceeding with proposal.',
        risk_assessment: { confidence: 0.72, objections: ['timeline'], urgency: 'medium' }
      },
      {
        title: 'Group Program Enrollment',
        amount: 1500,
        description: 'Multiple leads interested in upcoming cohort.',
        agent_recommendation: 'Bundle opportunity. 3 leads from same company.',
        risk_assessment: { confidence: 0.90, objections: [], urgency: 'high' }
      }
    ];

    const randomRequest = testRequests[Math.floor(Math.random() * testRequests.length)];

    try {
      await supabase.from('approval_requests').insert({
        organization_id: organization.id,
        request_type: 'high_value_deal',
        ...randomRequest,
        status: 'pending'
      });

      toast.success('Test approval request created!');
      fetchRequests();
    } catch (error) {
      console.error('Error creating test request:', error);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  const totalPendingValue = pendingRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalApprovedValue = approvedRequests.reduce((sum, r) => sum + (r.amount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock };
      case 'approved': return { color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 };
      case 'rejected': return { color: 'bg-red-500/20 text-red-400', icon: XCircle };
      default: return { color: 'bg-muted text-muted-foreground', icon: Clock };
    }
  };

  const formatCurrency = (amount: number | null, currency: string | null = 'USD') => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const RequestCard = ({ request }: { request: ApprovalRequest }) => {
    const statusBadge = getStatusBadge(request.status);
    const StatusIcon = statusBadge.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => setSelectedRequest(request)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{request.title}</h3>
              <Badge className={statusBadge.color} variant="secondary">
                <StatusIcon className="w-3 h-3 mr-1" />
                {request.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
          </div>
          <div className="text-right ml-4">
            <p className="text-xl font-bold text-primary">
              {formatCurrency(request.amount, request.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {request.agent_recommendation && (
          <div className="mt-3 p-2 rounded bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <MessageSquare className="w-3 h-3" />
              AI Recommendation
            </div>
            <p className="text-sm">{request.agent_recommendation}</p>
          </div>
        )}

        {request.status === 'pending' && (
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRequest(request);
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              Review
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold gradient-text">HITL Approvals</h1>
          <p className="text-muted-foreground mt-1">Human-in-the-Loop for high-value decisions ($1,000+)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createTestRequest} variant="outline" size="sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Test Request
          </Button>
          <Button onClick={fetchRequests} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-glow border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalPendingValue)}</p>
                <p className="text-sm text-muted-foreground">Pending Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedRequests.length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalApprovedValue)}</p>
                <p className="text-sm text-muted-foreground">Approved Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="w-4 h-4" />
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-yellow-400" />
                Awaiting Your Decision
              </CardTitle>
              <CardDescription>High-value deals requiring human confirmation</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  <AnimatePresence>
                    {pendingRequests.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                  </AnimatePresence>

                  {pendingRequests.length === 0 && !loading && (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-50 text-green-400" />
                      <p className="text-lg">All caught up!</p>
                      <p className="text-sm">No pending approvals at this time</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <Card className="card-glow">
            <CardContent className="pt-6">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {approvedRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}

                  {approvedRequests.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No approved requests yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <Card className="card-glow">
            <CardContent className="pt-6">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {rejectedRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}

                  {rejectedRequests.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No rejected requests</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Decision Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Review: {selectedRequest?.title}
            </DialogTitle>
            <DialogDescription>
              This decision requires human approval before the agent can proceed
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Deal Value */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deal Value</span>
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(selectedRequest.amount, selectedRequest.currency)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedRequest.description}</p>
              </div>

              {/* AI Recommendation */}
              {selectedRequest.agent_recommendation && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">AI Recommendation</span>
                  </div>
                  <p className="text-sm">{selectedRequest.agent_recommendation}</p>
                </div>
              )}

              {/* Risk Assessment */}
              {selectedRequest.risk_assessment && Object.keys(selectedRequest.risk_assessment).length > 0 && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Risk Assessment</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedRequest.risk_assessment.confidence && (
                      <div>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className="text-lg font-bold">{Math.round(selectedRequest.risk_assessment.confidence * 100)}%</p>
                      </div>
                    )}
                    {selectedRequest.risk_assessment.urgency && (
                      <div>
                        <p className="text-xs text-muted-foreground">Urgency</p>
                        <Badge variant="outline" className="capitalize">
                          {selectedRequest.risk_assessment.urgency}
                        </Badge>
                      </div>
                    )}
                    {selectedRequest.risk_assessment.objections && (
                      <div>
                        <p className="text-xs text-muted-foreground">Objections</p>
                        <p className="text-sm">{selectedRequest.risk_assessment.objections.length || 'None'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Decision Notes */}
              {selectedRequest.status === 'pending' && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Decision Notes (optional)</h4>
                  <Textarea
                    placeholder="Add notes about your decision..."
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleDecision(selectedRequest.id, 'rejected')}
                  disabled={processing}
                  className="gap-2"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleDecision(selectedRequest.id, 'approved')}
                  disabled={processing}
                  className="gap-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Approve Deal
                </Button>
              </>
            )}

            {selectedRequest?.status !== 'pending' && (
              <div className="w-full text-center">
                <Badge className={getStatusBadge(selectedRequest?.status || '').color} variant="secondary">
                  Decision: {selectedRequest?.status}
                </Badge>
                {selectedRequest?.decision_notes && (
                  <p className="text-sm text-muted-foreground mt-2">{selectedRequest.decision_notes}</p>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}