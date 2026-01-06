import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Target, TrendingUp, Zap, AlertTriangle, CheckCircle, Clock, XCircle, RefreshCw, Loader2, ChevronRight, Brain } from 'lucide-react';

interface LeadScore {
  id: string;
  lead_id: string;
  intent_score: number;
  capacity_score: number;
  efficiency_score: number;
  ear_score: number;
  routing_decision: 'sales' | 'nurture' | 'reject';
  routing_reasoning: string;
  identity_signals: Record<string, any>;
  website_signals: Record<string, any>;
  behavioral_signals: Record<string, any>;
  risk_flags: string[];
  scored_at: string;
}

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  ear_score: number | null;
  nurture_track: string | null;
  status: string | null;
}

const routingColors: Record<string, string> = {
  sales: 'bg-green-500/10 text-green-500 border-green-500/20',
  nurture: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  reject: 'bg-red-500/10 text-red-500 border-red-500/20'
};

const routingIcons: Record<string, React.ReactNode> = {
  sales: <CheckCircle className="h-4 w-4" />,
  nurture: <Clock className="h-4 w-4" />,
  reject: <XCircle className="h-4 w-4" />
};

export function AdvancedLeadScoring() {
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads-with-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, email, ear_score, nurture_track, status')
        .order('ear_score', { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return data as Lead[];
    }
  });

  const { data: scoreDetails, isLoading: scoreLoading } = useQuery({
    queryKey: ['lead-score-details', selectedLead],
    queryFn: async () => {
      if (!selectedLead) return null;
      const { data, error } = await supabase.from('lead_scores').select('*').eq('lead_id', selectedLead).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as LeadScore | null;
    },
    enabled: !!selectedLead
  });

  const { data: scoringStats } = useQuery({
    queryKey: ['scoring-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('lead_scores').select('routing_decision, ear_score');
      if (error) throw error;
      return {
        total: data.length,
        sales: data.filter(d => d.routing_decision === 'sales').length,
        nurture: data.filter(d => d.routing_decision === 'nurture').length,
        reject: data.filter(d => d.routing_decision === 'reject').length,
        avgEar: data.length > 0 ? Math.round(data.reduce((sum, d) => sum + (d.ear_score || 0), 0) / data.length) : 0
      };
    }
  });

  const rescoreMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const { data: membership } = await supabase.from('memberships').select('organization_id').eq('user_id', session.user.id).single();
      if (!membership) throw new Error('No organization found');
      const response = await supabase.functions.invoke('lead-scoring-engine', { body: { lead_id: leadId, organization_id: membership.organization_id, force_rescore: true } });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => { toast.success('Lead rescored'); queryClient.invalidateQueries({ queryKey: ['leads-with-scores'] }); queryClient.invalidateQueries({ queryKey: ['lead-score-details'] }); },
    onError: (error) => { toast.error(`Failed: ${error.message}`); }
  });

  const getScoreColor = (score: number) => score >= 70 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Advanced Lead Scoring</h2><p className="text-muted-foreground">3D scoring: Intent × Capacity ÷ Efficiency = EAR</p></div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Total Scored</CardDescription><CardTitle className="text-3xl">{scoringStats?.total || 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Sales</CardDescription><CardTitle className="text-3xl text-green-500">{scoringStats?.sales || 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Nurture</CardDescription><CardTitle className="text-3xl text-amber-500">{scoringStats?.nurture || 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Rejected</CardDescription><CardTitle className="text-3xl text-red-500">{scoringStats?.reject || 0}</CardTitle></CardHeader></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Scored Leads</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {leadsLoading ? <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin" /></div> : 
               leads?.length === 0 ? <p className="text-center text-muted-foreground">No leads</p> :
               <div className="space-y-2">
                 {leads?.map(lead => (
                   <div key={lead.id} className={`p-3 rounded-lg border cursor-pointer ${selectedLead === lead.id ? 'bg-accent' : 'hover:bg-accent/50'}`} onClick={() => setSelectedLead(lead.id)}>
                     <div className="flex items-center justify-between">
                       <div><div className="font-medium">{lead.name || lead.email || 'Unknown'}</div><div className="text-sm text-muted-foreground">{lead.status}</div></div>
                       <div className="flex items-center gap-2">{lead.ear_score !== null && <span className={`font-bold ${getScoreColor(lead.ear_score)}`}>{Math.round(lead.ear_score)}</span>}<ChevronRight className="h-4 w-4" /></div>
                     </div>
                   </div>
                 ))}
               </div>}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Score Breakdown</CardTitle>
              {selectedLead && <Button variant="outline" size="sm" onClick={() => rescoreMutation.mutate(selectedLead)} disabled={rescoreMutation.isPending}><RefreshCw className="h-4 w-4" /></Button>}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedLead ? <div className="flex flex-col items-center justify-center h-64 text-muted-foreground"><Brain className="h-12 w-12 mb-4" /><p>Select a lead</p></div> :
             scoreLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> :
             !scoreDetails ? <div className="text-center"><AlertTriangle className="h-8 w-8 mx-auto mb-2" /><p>No score data</p><Button variant="outline" size="sm" className="mt-2" onClick={() => rescoreMutation.mutate(selectedLead)}>Score Now</Button></div> :
             <div className="space-y-4">
               <div className="text-center p-4 bg-muted rounded-lg">
                 <div className="text-sm text-muted-foreground">EAR Score</div>
                 <div className={`text-4xl font-bold ${getScoreColor(scoreDetails.ear_score)}`}>{Math.round(scoreDetails.ear_score)}</div>
                 <Badge className={`mt-2 ${routingColors[scoreDetails.routing_decision]}`}>{routingIcons[scoreDetails.routing_decision]}<span className="ml-1 capitalize">{scoreDetails.routing_decision}</span></Badge>
               </div>
               <div><div className="flex justify-between text-sm"><span>Intent</span><span className={getScoreColor(scoreDetails.intent_score)}>{Math.round(scoreDetails.intent_score)}</span></div><Progress value={scoreDetails.intent_score} className="h-2 mt-1" /></div>
               <div><div className="flex justify-between text-sm"><span>Capacity</span><span className={getScoreColor(scoreDetails.capacity_score)}>{Math.round(scoreDetails.capacity_score)}</span></div><Progress value={scoreDetails.capacity_score} className="h-2 mt-1" /></div>
               <div><div className="flex justify-between text-sm"><span>Efficiency</span><span>{Math.round(scoreDetails.efficiency_score)}</span></div><Progress value={scoreDetails.efficiency_score} className="h-2 mt-1" /></div>
               <p className="text-sm text-muted-foreground p-2 bg-muted rounded">{scoreDetails.routing_reasoning}</p>
               {scoreDetails.risk_flags?.length > 0 && <div className="space-y-1">{scoreDetails.risk_flags.map((f, i) => <Badge key={i} variant="destructive" className="mr-1">{f}</Badge>)}</div>}
             </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdvancedLeadScoring;
