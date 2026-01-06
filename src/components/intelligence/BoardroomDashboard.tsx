import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Users, Briefcase, DollarSign, TrendingUp, Megaphone, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface AgentResponse {
  position: string;
  reasoning: string;
  key_concerns: string[];
  recommended_action: string;
  confidence: number;
}

const AGENT_CONFIG = {
  ceo: { name: 'CEO', icon: Briefcase, color: 'bg-purple-500', focus: 'Vision & Growth' },
  cfo: { name: 'CFO', icon: DollarSign, color: 'bg-green-500', focus: 'Financial Risk' },
  cro: { name: 'CRO', icon: TrendingUp, color: 'bg-blue-500', focus: 'Revenue & Sales' },
  cmo: { name: 'CMO', icon: Megaphone, color: 'bg-orange-500', focus: 'Brand & Marketing' }
};

export function BoardroomDashboard() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');
  const [activeSession, setActiveSession] = useState<any>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['boardroom-sessions', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('boardroom_sessions')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id || !question.trim()) {
        throw new Error('Missing organization or question');
      }

      const { data, error } = await supabase.functions.invoke('boardroom-council', {
        body: {
          action: 'create_session',
          organization_id: organization.id,
          question: question.trim()
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Boardroom session complete');
      setActiveSession(data.session);
      setQuestion('');
      queryClient.invalidateQueries({ queryKey: ['boardroom-sessions'] });
    },
    onError: (error) => {
      toast.error('Failed to create session: ' + error.message);
    }
  });

  const loadSession = async (sessionId: string) => {
    const session = sessions?.find(s => s.id === sessionId);
    if (session) {
      setActiveSession(session);
    }
  };

  const renderAgentCard = (role: keyof typeof AGENT_CONFIG, response: AgentResponse | null) => {
    const config = AGENT_CONFIG[role];
    const Icon = config.icon;

    return (
      <Card key={role} className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-md ${config.color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm">{config.name}</CardTitle>
              <CardDescription className="text-xs">{config.focus}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {response ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={
                  response.position === 'For' ? 'default' :
                  response.position === 'Against' ? 'destructive' : 'secondary'
                }>
                  {response.position}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {(response.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <p className="text-sm">{response.reasoning}</p>
              {response.key_concerns?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Key Concerns:</p>
                  <ul className="text-xs list-disc list-inside">
                    {response.key_concerns.slice(0, 2).map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs font-medium">{response.recommended_action}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Awaiting response...
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            The Boardroom
          </h1>
          <p className="text-muted-foreground mt-1">
            Multi-agent council. Your virtual C-suite debates strategic decisions.
          </p>
        </div>
      </div>

      {/* Question Input */}
      <Card>
        <CardHeader>
          <CardTitle>Ask a Strategic Question</CardTitle>
          <CardDescription>
            Pose a strategic question to your virtual executive team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Should I raise my prices by 20%? Should I expand into a new market? Should I hire a sales team?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[80px]"
          />
          <Button 
            onClick={() => createSessionMutation.mutate()}
            disabled={createSessionMutation.isPending || !question.trim()}
          >
            {createSessionMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deliberating...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Convene Boardroom
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Session */}
      {activeSession && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Question</CardTitle>
                  <CardDescription>{activeSession.question}</CardDescription>
                </div>
                <Badge variant={activeSession.status === 'complete' ? 'default' : 'secondary'}>
                  {activeSession.status}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Agent Responses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderAgentCard('ceo', activeSession.ceo_response as AgentResponse)}
            {renderAgentCard('cfo', activeSession.cfo_response as AgentResponse)}
            {renderAgentCard('cro', activeSession.cro_response as AgentResponse)}
            {renderAgentCard('cmo', activeSession.cmo_response as AgentResponse)}
          </div>

          {/* Synthesis */}
          {activeSession.synthesis && (
            <Card className="border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Board Synthesis</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Confidence:</span>
                    <Progress value={(activeSession.confidence_score || 0) * 100} className="w-20" />
                    <span className="text-sm">{((activeSession.confidence_score || 0) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap">{activeSession.synthesis}</p>
                {activeSession.recommended_action && (
                  <div className="bg-primary/10 p-4 rounded-md">
                    <p className="font-medium">Recommended Action:</p>
                    <p>{activeSession.recommended_action}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Previous Sessions */}
      {sessions && sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.map(session => (
                <div 
                  key={session.id}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    activeSession?.id === session.id ? 'bg-primary/10' : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={() => loadSession(session.id)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium line-clamp-1">{session.question}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.status === 'complete' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
