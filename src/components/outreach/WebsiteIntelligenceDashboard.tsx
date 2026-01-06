import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe,
  FileText,
  Sparkles,
  Send,
  CheckCircle,
  AlertTriangle,
  Target,
  TrendingUp,
  Clock,
  Copy,
  Edit,
  RefreshCw,
  Mail,
  Stethoscope,
} from "lucide-react";

interface Diagnosis {
  id: string;
  website_url: string | null;
  input_type: string;
  clarity: string | null;
  offer_structure: string | null;
  language_style: string | null;
  credibility_type: string | null;
  sales_entry: string | null;
  revenue_stage: string | null;
  primary_constraint: string | null;
  pressure_signals: string[] | null;
  dominant_pattern: string | null;
  confidence_score: number | null;
  created_at: string;
}

interface AuthorityEmail {
  id: string;
  diagnosis_id: string;
  subject_line: string;
  email_body: string;
  closing_loop: string | null;
  status: string;
  personalization_hooks: string[] | null;
  confidence_score: number | null;
  created_at: string;
}

export function WebsiteIntelligenceDashboard() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [inputMode, setInputMode] = useState<'url' | 'paste'>('url');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<AuthorityEmail | null>(null);
  const [editedEmail, setEditedEmail] = useState({ subject: '', body: '' });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch diagnoses
  const { data: diagnoses, isLoading: loadingDiagnoses } = useQuery({
    queryKey: ['website-diagnoses', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('website_diagnoses')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Diagnosis[];
    },
    enabled: !!organization?.id,
  });

  // Fetch emails for selected diagnosis
  const { data: emails, isLoading: loadingEmails } = useQuery({
    queryKey: ['authority-emails', selectedDiagnosis?.id],
    queryFn: async () => {
      if (!selectedDiagnosis?.id) return [];
      const { data, error } = await supabase
        .from('authority_emails')
        .select('*')
        .eq('diagnosis_id', selectedDiagnosis.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AuthorityEmail[];
    },
    enabled: !!selectedDiagnosis?.id,
  });

  // Analyze website mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('website-diagnosis', {
        body: {
          organizationId: organization?.id,
          websiteUrl: inputMode === 'url' ? websiteUrl : undefined,
          pastedContent: inputMode === 'paste' ? pastedContent : undefined,
        },
      });
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Website analyzed successfully!');
      queryClient.invalidateQueries({ queryKey: ['website-diagnoses'] });
      if (data.diagnosis) {
        setSelectedDiagnosis(data.diagnosis);
      }
      setWebsiteUrl('');
      setPastedContent('');
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  // Generate email mutation
  const generateEmailMutation = useMutation({
    mutationFn: async (diagnosisId: string) => {
      const response = await supabase.functions.invoke('authority-email-generator', {
        body: {
          diagnosisId,
          organizationId: organization?.id,
        },
      });
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Email generated!');
      queryClient.invalidateQueries({ queryKey: ['authority-emails'] });
      if (data.email) {
        setSelectedEmail(data.email);
        setEditedEmail({
          subject: data.email.subject_line,
          body: data.email.email_body,
        });
      }
    },
    onError: (error) => {
      toast.error(`Generation failed: ${error.message}`);
    },
  });

  // Approve email mutation
  const approveMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const response = await supabase.functions.invoke('cold-email-sender', {
        body: {
          emailId,
          organizationId: organization?.id,
          action: 'approve',
        },
      });
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Email approved!');
      queryClient.invalidateQueries({ queryKey: ['authority-emails'] });
    },
    onError: (error) => {
      toast.error(`Approval failed: ${error.message}`);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getConstraintColor = (constraint: string | null) => {
    const colors: Record<string, string> = {
      positioning: 'bg-purple-500/10 text-purple-500',
      pricing: 'bg-green-500/10 text-green-500',
      offer: 'bg-blue-500/10 text-blue-500',
      sales: 'bg-orange-500/10 text-orange-500',
      authority: 'bg-yellow-500/10 text-yellow-500',
      systems: 'bg-gray-500/10 text-gray-500',
    };
    return colors[constraint || ''] || 'bg-muted text-muted-foreground';
  };

  const getStageColor = (stage: string | null) => {
    const colors: Record<string, string> = {
      early: 'bg-blue-500/10 text-blue-500',
      mid: 'bg-yellow-500/10 text-yellow-500',
      established: 'bg-green-500/10 text-green-500',
    };
    return colors[stage || ''] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-primary" />
            Website Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Diagnose prospect websites and generate authority-based cold emails
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Analyze Website</CardTitle>
            <CardDescription>Enter a URL or paste website content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'url' | 'paste')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" /> URL
                </TabsTrigger>
                <TabsTrigger value="paste" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Paste
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="space-y-4">
                <Input
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </TabsContent>
              
              <TabsContent value="paste" className="space-y-4">
                <Textarea
                  placeholder="Paste website content here (homepage, about page, offers, etc.)"
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  rows={8}
                />
              </TabsContent>
            </Tabs>

            <Button
              className="w-full"
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending || (!websiteUrl && !pastedContent)}
            >
              {analyzeMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Website
                </>
              )}
            </Button>

            <Separator />

            {/* Recent Diagnoses */}
            <div>
              <h3 className="font-medium text-sm mb-3">Recent Analyses</h3>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {loadingDiagnoses ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))
                  ) : diagnoses?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No analyses yet. Start by analyzing a website above.
                    </p>
                  ) : (
                    diagnoses?.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDiagnosis(d)}
                        className={`w-full p-3 text-left rounded-lg border transition-all ${
                          selectedDiagnosis?.id === d.id
                            ? 'bg-primary/10 border-primary'
                            : 'bg-muted/50 border-transparent hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {d.website_url || 'Pasted Content'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {d.dominant_pattern || 'Analyzing...'}
                            </p>
                          </div>
                          <Badge variant="secondary" className={getConstraintColor(d.primary_constraint)}>
                            {d.primary_constraint || '?'}
                          </Badge>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Diagnosis Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Diagnosis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDiagnosis ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Select a diagnosis to view details</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Dominant Pattern */}
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Dominant Pattern
                  </p>
                  <p className="font-semibold text-lg">
                    {selectedDiagnosis.dominant_pattern || 'Analyzing...'}
                  </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Constraint</p>
                    <Badge className={getConstraintColor(selectedDiagnosis.primary_constraint)}>
                      {selectedDiagnosis.primary_constraint || '-'}
                    </Badge>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Stage</p>
                    <Badge className={getStageColor(selectedDiagnosis.revenue_stage)}>
                      {selectedDiagnosis.revenue_stage || '-'}
                    </Badge>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Clarity</p>
                    <p className="font-medium capitalize">{selectedDiagnosis.clarity || '-'}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Credibility</p>
                    <p className="font-medium capitalize">{selectedDiagnosis.credibility_type || '-'}</p>
                  </div>
                </div>

                {/* Pressure Signals */}
                {selectedDiagnosis.pressure_signals && selectedDiagnosis.pressure_signals.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                      Pressure Signals
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDiagnosis.pressure_signals.map((signal, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence Score */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Confidence</span>
                  <span className="font-bold">
                    {Math.round((selectedDiagnosis.confidence_score || 0) * 100)}%
                  </span>
                </div>

                <Button
                  className="w-full"
                  onClick={() => generateEmailMutation.mutate(selectedDiagnosis.id)}
                  disabled={generateEmailMutation.isPending}
                >
                  {generateEmailMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Generate Email
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Authority Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEmails ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : !emails || emails.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Generate an email from your diagnosis</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Email List */}
                {emails.length > 1 && (
                  <ScrollArea className="h-[100px]">
                    <div className="flex gap-2 pb-2">
                      {emails.map((email) => (
                        <Button
                          key={email.id}
                          variant={selectedEmail?.id === email.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setSelectedEmail(email);
                            setEditedEmail({ subject: email.subject_line, body: email.email_body });
                            setIsEditing(false);
                          }}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {(selectedEmail || emails[0]) && (
                  <>
                    {/* Subject Line */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground uppercase">Subject</p>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard((selectedEmail || emails[0]).subject_line)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {isEditing ? (
                        <Input
                          value={editedEmail.subject}
                          onChange={(e) => setEditedEmail({ ...editedEmail, subject: e.target.value })}
                        />
                      ) : (
                        <p className="font-medium">{(selectedEmail || emails[0]).subject_line}</p>
                      )}
                    </div>

                    {/* Email Body */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground uppercase">Body</p>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard((selectedEmail || emails[0]).email_body)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {isEditing ? (
                        <Textarea
                          value={editedEmail.body}
                          onChange={(e) => setEditedEmail({ ...editedEmail, body: e.target.value })}
                          rows={8}
                        />
                      ) : (
                        <div className="p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                          {(selectedEmail || emails[0]).email_body}
                        </div>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <Badge variant={(selectedEmail || emails[0]).status === 'approved' ? 'default' : 'secondary'}>
                        {(selectedEmail || emails[0]).status}
                      </Badge>
                      <div className="flex gap-2">
                        {(selectedEmail || emails[0]).status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate((selectedEmail || emails[0]).id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {(selectedEmail || emails[0]).status === 'approved' && (
                          <Button size="sm" variant="secondary">
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Personalization Hooks */}
                    {(selectedEmail || emails[0]).personalization_hooks && (selectedEmail || emails[0]).personalization_hooks!.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Personalization Hooks</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedEmail || emails[0]).personalization_hooks!.map((hook, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {hook}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}