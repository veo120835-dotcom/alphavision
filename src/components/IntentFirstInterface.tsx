import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, MessageSquare, Target, Zap, ArrowRight, Brain, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlphaVisionStore } from '@/store/alpha-vision-store';

interface IntentOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  view: string;
  keywords: string[];
}

const intentOptions: IntentOption[] = [
  {
    id: 'revenue',
    label: 'Grow Revenue',
    description: 'Find new leads, close deals, optimize pricing',
    icon: <Target className="h-5 w-5" />,
    view: 'revenue',
    keywords: ['revenue', 'sales', 'leads', 'money', 'income', 'grow', 'close', 'deals'],
  },
  {
    id: 'automate',
    label: 'Automate Tasks',
    description: 'Set up workflows, reduce manual work',
    icon: <Zap className="h-5 w-5" />,
    view: 'triggers',
    keywords: ['automate', 'workflow', 'automatic', 'trigger', 'schedule', 'recurring'],
  },
  {
    id: 'strategize',
    label: 'Strategic Decision',
    description: 'Get advice on pricing, positioning, growth',
    icon: <Brain className="h-5 w-5" />,
    view: 'boardroom',
    keywords: ['strategy', 'decision', 'advice', 'pricing', 'position', 'plan', 'should i'],
  },
  {
    id: 'communicate',
    label: 'Reach Out',
    description: 'Send emails, follow up, re-engage leads',
    icon: <MessageSquare className="h-5 w-5" />,
    view: 'dm-inbox',
    keywords: ['email', 'message', 'reach', 'contact', 'follow up', 'send', 'outreach'],
  },
];

export function IntentFirstInterface() {
  const [intent, setIntent] = useState('');
  const [selectedIntent, setSelectedIntent] = useState<IntentOption | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { setActiveView } = useAlphaVisionStore();

  const detectIntent = (text: string): IntentOption | null => {
    const lower = text.toLowerCase();
    
    for (const option of intentOptions) {
      if (option.keywords.some(k => lower.includes(k))) {
        return option;
      }
    }
    
    return null;
  };

  const handleIntentChange = (value: string) => {
    setIntent(value);
    const detected = detectIntent(value);
    setSelectedIntent(detected);
  };

  const handleSubmit = () => {
    if (!intent.trim()) return;
    
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      if (selectedIntent) {
        setActiveView(selectedIntent.view as any);
      } else {
        // Default to chat for unrecognized intents
        setActiveView('chat');
      }
      setIsProcessing(false);
    }, 500);
  };

  const handleQuickAction = (option: IntentOption) => {
    setActiveView(option.view as any);
  };

  return (
    <div className="space-y-6">
      {/* Main Intent Input */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Wand2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">What do you want to accomplish?</CardTitle>
          <CardDescription className="text-base">
            Tell me your goal — I'll activate the right systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Textarea
              value={intent}
              onChange={(e) => handleIntentChange(e.target.value)}
              placeholder="e.g., 'I want to close more deals this month' or 'Help me decide if I should raise prices'"
              className="min-h-[100px] text-lg pr-12 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <AnimatePresence>
              {selectedIntent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-3 top-3"
                >
                  <Badge variant="secondary" className="gap-1">
                    {selectedIntent.icon}
                    {selectedIntent.label}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            size="lg"
            disabled={!intent.trim() || isProcessing}
          >
            {isProcessing ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Activating...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Let's Go
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {intentOptions.map((option) => (
          <motion.div
            key={option.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-all h-full"
              onClick={() => handleQuickAction(option)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {option.icon}
                </div>
                <h3 className="font-medium text-sm">{option.label}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {option.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity / Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Suggested Actions
          </CardTitle>
          <CardDescription>Based on your current business state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <SuggestionItem
              title="Follow up with 3 stalled leads"
              description="These leads haven't responded in 7+ days"
              action="Lazarus Engine"
              onClick={() => setActiveView('lazarus-engine')}
            />
            <SuggestionItem
              title="Review pricing vs competitors"
              description="2 competitors changed prices this week"
              action="Mystery Shopper"
              onClick={() => setActiveView('mystery-shopper')}
            />
            <SuggestionItem
              title="Request reviews from happy clients"
              description="4 clients scored 90+ satisfaction"
              action="Review Magnet"
              onClick={() => setActiveView('review-magnet')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SuggestionItem({ 
  title, 
  description, 
  action, 
  onClick 
}: { 
  title: string; 
  description: string; 
  action: string;
  onClick: () => void;
}) {
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Button variant="ghost" size="sm">
        {action}
        <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
}

export default IntentFirstInterface;
