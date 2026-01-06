import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  Calendar,
  CreditCard,
  ChevronRight,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Phone,
  Mail,
  MoreVertical,
  Zap,
  DollarSign,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DMConversation {
  id: string;
  lead_id: string | null;
  platform: string;
  status: string;
  last_message_at: string | null;
  messages_count: number | null;
  sentiment_score: number | null;
  ai_handling_mode: string | null;
  lead?: {
    id: string;
    name: string | null;
    email: string | null;
    intent_score: number | null;
    source: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    intent_score?: number;
    cta_type?: string;
  };
}

interface CloserSuggestion {
  intent: string;
  intent_score: number;
  recommended_action: string;
  response: string;
  cta_type: string;
  internal_notes: string;
}

const INTENT_COLORS: Record<string, string> = {
  ready: 'bg-green-500/20 text-green-400',
  warm: 'bg-amber-500/20 text-amber-400',
  curious: 'bg-blue-500/20 text-blue-400',
  skeptical: 'bg-orange-500/20 text-orange-400',
  cold: 'bg-muted text-muted-foreground',
};

const INTENT_ICONS: Record<string, typeof Target> = {
  ready: DollarSign,
  warm: TrendingUp,
  curious: Sparkles,
  skeptical: AlertCircle,
  cold: Clock,
};

export function DMCloserInbox() {
  const { organization } = useOrganization();
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<DMConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<CloserSuggestion | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (organization?.id) {
      fetchConversations();
    }
  }, [organization?.id]);

  useEffect(() => {
    if (selectedConversation) {
      loadConversationMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    if (!organization?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('dm_conversations')
      .select(`
        *,
        lead:leads(id, name, email, intent_score, source)
      `)
      .eq('organization_id', organization.id)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
    } else {
      setConversations(data || []);
      if (data && data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    }
    setLoading(false);
  };

  const loadConversationMessages = async (conversationId: string) => {
    // Simulate loading messages from DM conversation
    // In production, this would fetch from the actual DM platform
    const demoMessages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: "Hey, I saw your post about automating sales. Sounds interesting but I'm skeptical about AI handling my deals.",
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: '2',
        role: 'assistant',
        content: "Totally get the skepticism! Most AI tools are just chatbots. What makes this different is it's built by someone who closed $2M+ in consulting deals manually first. What's your current biggest bottleneck - finding leads or closing them?",
        timestamp: new Date(Date.now() - 3500000),
        metadata: { intent: 'skeptical', intent_score: 40 }
      },
      {
        id: '3',
        role: 'user',
        content: "Honestly, it's the follow-up. I get leads but they go cold because I'm too busy to respond quickly.",
        timestamp: new Date(Date.now() - 3400000),
      }
    ];
    setMessages(demoMessages);
    generateAISuggestion(demoMessages);
  };

  const generateAISuggestion = async (conversationHistory: Message[]) => {
    if (!organization?.id || !selectedConversation?.lead) return;
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('closer-agent', {
        body: {
          conversationHistory: conversationHistory.map(m => ({
            role: m.role,
            content: m.content
          })),
          leadData: {
            id: selectedConversation.lead.id,
            name: selectedConversation.lead.name,
            source: selectedConversation.lead.source,
            intent_score: selectedConversation.lead.intent_score
          },
          productInfo: {
            highTicket: { name: 'Alpha Vision Enterprise', price: 5000 },
            midTicket: { name: 'Alpha Vision Pro', price: 997 },
            downsell: { name: 'Revenue Playbook', price: 27 }
          },
          organizationId: organization.id
        }
      });

      if (error) throw error;

      setSuggestion(data);
      setMessageInput(data.response);
    } catch (error) {
      console.error('Closer error:', error);
      toast.error('Failed to generate suggestion');
    } finally {
      setGenerating(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: messageInput,
      timestamp: new Date(),
      metadata: suggestion ? {
        intent: suggestion.intent,
        intent_score: suggestion.intent_score,
        cta_type: suggestion.cta_type
      } : undefined
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput("");
    setSuggestion(null);

    // Update conversation
    await supabase
      .from('dm_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        messages_count: (selectedConversation.messages_count || 0) + 1
      })
      .eq('id', selectedConversation.id);

    toast.success('Message sent! (Connect platform to auto-send)');
  };

  const useSuggestion = () => {
    if (suggestion) {
      setMessageInput(suggestion.response);
    }
  };

  const regenerateSuggestion = () => {
    generateAISuggestion(messages);
  };

  const getIntentIcon = (intent: string) => {
    const Icon = INTENT_ICONS[intent] || Target;
    return <Icon className="w-4 h-4" />;
  };

  const createDemoConversation = async () => {
    if (!organization?.id) return;

    // First create a demo lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        organization_id: organization.id,
        name: 'Demo Prospect',
        email: 'demo@example.com',
        source: 'Instagram DM',
        intent_score: 50
      })
      .select()
      .single();

    if (leadError) {
      console.error('Lead error:', leadError);
      return;
    }

    // Create conversation
    const { data, error } = await supabase
      .from('dm_conversations')
      .insert({
        organization_id: organization.id,
        lead_id: lead.id,
        platform: 'instagram',
        status: 'active',
        ai_handling_mode: 'suggest'
      })
      .select(`*, lead:leads(id, name, email, intent_score, source)`)
      .single();

    if (error) {
      console.error('Conversation error:', error);
      return;
    }

    setConversations(prev => [data, ...prev]);
    setSelectedConversation(data);
    toast.success('Demo conversation created!');
  };

  return (
    <div className="h-full flex">
      {/* Conversations List */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            DM Closer Inbox
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            AI-powered sales conversations
          </p>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-3">No conversations yet</p>
              <Button size="sm" onClick={createDemoConversation}>
                Create Demo
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                    selectedConversation?.id === conv.id && "bg-muted"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {conv.lead?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {conv.lead?.name || 'Unknown'}
                        </p>
                        {conv.lead?.intent_score && (
                          <Badge className={cn(
                            "text-xs",
                            conv.lead.intent_score >= 70 ? INTENT_COLORS.ready :
                            conv.lead.intent_score >= 50 ? INTENT_COLORS.warm :
                            INTENT_COLORS.curious
                          )}>
                            {conv.lead.intent_score}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.platform} • {conv.messages_count || 0} messages
                      </p>
                      {conv.last_message_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(conv.last_message_at), 'MMM d, h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-border">
          <Button
            variant="outline"
            className="w-full"
            onClick={createDemoConversation}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {selectedConversation.lead?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {selectedConversation.lead?.name || 'Unknown'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.lead?.email || 'No email'} • {selectedConversation.platform}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {suggestion && (
                  <Badge className={INTENT_COLORS[suggestion.intent]}>
                    {getIntentIcon(suggestion.intent)}
                    <span className="ml-1 capitalize">{suggestion.intent}</span>
                    <span className="ml-1">({suggestion.intent_score}%)</span>
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Call
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Send Payment Link
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex",
                      msg.role === 'assistant' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2",
                      msg.role === 'assistant' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    )}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={cn(
                        "text-xs mt-1",
                        msg.role === 'assistant' ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {format(msg.timestamp, 'h:mm a')}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* AI Suggestion Card */}
            {suggestion && (
              <div className="p-4 border-t border-border bg-muted/30">
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-sm">AI Suggestion</span>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.recommended_action.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {suggestion.internal_notes}
                    </p>
                    {suggestion.cta_type !== 'none' && (
                      <div className="flex items-center gap-2 mb-2">
                        {suggestion.cta_type === 'booking_link' && (
                          <Badge className="bg-blue-500/20 text-blue-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            Include Booking Link
                          </Badge>
                        )}
                        {suggestion.cta_type === 'payment_link' && (
                          <Badge className="bg-green-500/20 text-green-400">
                            <CreditCard className="w-3 h-3 mr-1" />
                            Include Payment Link
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={useSuggestion}>
                        Use Suggestion
                      </Button>
                      <Button size="sm" variant="outline" onClick={regenerateSuggestion}>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Regenerate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-3">
                <Textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <div className="flex flex-col gap-2">
                  <Button onClick={sendMessage} disabled={!messageInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => generateAISuggestion(messages)}
                    disabled={generating}
                  >
                    {generating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a conversation to start closing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}