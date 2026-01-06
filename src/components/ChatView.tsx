import { useState, useRef, useEffect } from "react";
import { useAlphaVisionStore } from "@/store/alpha-vision-store";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import { Send, Paperclip, FileText, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function ChatView() {
  const { mode } = useAlphaVisionStore();
  const { messages, isLoading, sendMessage, clearMessages } = useChat({ mode });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput("");
    await sendMessage(message);
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <WelcomeScreen onQuickAction={handleQuickAction} />
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>
        )}
        
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <QuickActionButton 
              icon={FileText} 
              label="Request Plan" 
              onClick={() => handleQuickAction("Help me create a strategic plan for this quarter")}
            />
            <QuickActionButton 
              icon={Sparkles} 
              label="Diagnose Funnel" 
              onClick={() => handleQuickAction("Analyze my current sales funnel and identify bottlenecks")}
            />
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-sm text-destructive transition-colors ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
          
          <div className="relative flex items-center gap-2 glass rounded-xl p-2">
            <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Paperclip className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask your business partner anything..."
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground mt-2">
            Mode: <span className="text-primary capitalize">{mode}</span> • All recommendations follow your Permission Contract
          </p>
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onQuickAction }: { onQuickAction: (action: string) => void }) {
  const quickPrompts = [
    "Help me allocate this month's marketing budget",
    "Analyze my sales funnel for bottlenecks",
    "Evaluate the opportunity cost of this new project",
    "What should I prioritize this week?"
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 glow-primary">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-serif text-3xl font-semibold mb-2 gradient-text">Welcome to Alpha Vision</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Your autonomous business partner. I can help with strategy, growth, sales, operations, 
        and financial planning—all within your defined risk parameters.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onQuickAction(prompt)}
            className="p-4 rounded-xl glass hover:bg-muted/50 text-left transition-colors group"
          >
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn(
        "max-w-3xl rounded-2xl p-4",
        isUser 
          ? "bg-gradient-to-r from-primary/20 to-secondary/20 ml-12" 
          : "glass mr-12"
      )}>
        <div className="prose prose-invert prose-sm max-w-none">
          <FormattedContent content={message.content} />
        </div>
        
        <span className="text-xs text-muted-foreground mt-2 block">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}

function FormattedContent({ content }: { content: string }) {
  // Split content by markdown headers and format nicely
  const sections = content.split(/(?=###?\s)/);
  
  return (
    <div className="space-y-3">
      {sections.map((section, i) => {
        if (section.startsWith('### ')) {
          const [header, ...rest] = section.split('\n');
          return (
            <div key={i} className="space-y-1">
              <h4 className="text-sm font-semibold text-primary">{header.replace('### ', '')}</h4>
              <p className="text-foreground whitespace-pre-wrap">{rest.join('\n').trim()}</p>
            </div>
          );
        }
        if (section.startsWith('## ')) {
          const [header, ...rest] = section.split('\n');
          return (
            <div key={i} className="space-y-1">
              <h3 className="text-base font-semibold text-accent">{header.replace('## ', '')}</h3>
              <p className="text-foreground whitespace-pre-wrap">{rest.join('\n').trim()}</p>
            </div>
          );
        }
        return <p key={i} className="text-foreground whitespace-pre-wrap">{section.trim()}</p>;
      })}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      <span className="text-sm">Alpha Vision is thinking...</span>
    </div>
  );
}

function QuickActionButton({ 
  icon: Icon, 
  label, 
  onClick 
}: { 
  icon: typeof FileText; 
  label: string; 
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

export default ChatView;
