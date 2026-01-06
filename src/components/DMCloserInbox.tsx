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
import { useMockStorage, generateMockId } from "@/hooks/useMockStorage";
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

const DEMO_CONVERSATIONS: DMConversation[] = [
  {
    id: '1',
    lead_id: 'lead-1',
    platform: 'instagram',
    status: 'active',
    last_message_at: new Date(Date.now() - 3600000).toISOString(),
    messages_count: 5,
    sentiment_score: 75,
    ai_handling_mode: 'suggest',
    lead: {
      id: 'lead-1',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      intent_score: 65,
      source: 'Instagram DM'
    }
  },
  {
    id: '2',
    lead_id: 'lead-2',
    platform: 'twitter',
    status: 'active',
    last_message_at: new Date(Date.now() - 7200000).toISOString(),
    messages_count: 3,
    sentiment_score: 50,
    ai_handling_mode: 'suggest',
    lead: {
      id: 'lead-2',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      intent_score: 45,
      source: 'Twitter DM'
    }
  }
];

export function DMCloserInbox() {
  const { data: conversations, setData: setConversations, loading } = useMockStorage<DMConversation>('dm_conversations', DEMO_CONVERSATIONS);
  const [selectedConversation, setSelectedConversation] = useState<DMConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<CloserSuggestion | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadConversationMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversationMessages = async (conversationId: string) => {
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
    if (!selectedConversation?.lead) return;
    setGenerating(true);

    // Simulate AI suggestion
    setTimeout(() => {
      setSuggestion({
        intent: 'warm',
        intent_score: 65,
        recommended_action: 'book_call',
        response: "That's exactly why I built this! The speed-to-lead problem kills more deals than anything. What if I showed you how it works with your actual leads? I have a 15-min slot tomorrow - would that work?",
        cta_type: 'booking',
        internal_notes: "Lead is showing buying signals. Pain point identified. Move to booking."
      });
      setMessageInput("That's exactly why I built this! The speed-to-lead problem kills more deals than anything. What if I showed you how it works with your actual leads? I have a 15-min slot tomorrow - would that work?");
      setGenerating(false);
    }, 1000);
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: generateMockId(),
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
    const updated = conversations.map(c => 
      c.id === selectedConversation.id 
        ? { ...c, last_message_at: new Date().toISOString(), messages_count: (c.messages_count || 0) + 1 }
        : c
    );
    setConversations(updated);

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
    const newConv: DMConversation = {
      id: generateMockId(),
      lead_id: generateMockId(),
      platform: 'instagram',
      status: 'active',
      last_message_at: new Date().toISOString(),
      messages_count: 0,
      sentiment_score: 50,
      ai_handling_mode: 'suggest',
      lead: {
        id: generateMockId(),
        name: 'Demo Prospect',
        email: 'demo@example.com',
        intent_score: 50,
        source: 'Instagram DM'
      }
    };

    const updated = [newConv, ...conversations];
    setConversations(updated);
    setSelectedConversation(newConv);
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
                    <div className="flex items-center gap-2">
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
              <div className="flex items-end gap-2">
                <Textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="min-h-[80px] resize-none"
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
                    onClick={regenerateSuggestion}
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
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm">Choose from the list or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
