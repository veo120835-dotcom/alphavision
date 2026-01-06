import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Trash2,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  Settings,
  Zap,
  Users,
  ArrowRight,
  Edit
} from "lucide-react";
import { useMockStorage } from "@/hooks/useMockStorage";
import { toast } from "sonner";

interface DMStep {
  id: string;
  message: string;
  delayHours: number;
  condition: 'always' | 'no_reply' | 'opened' | 'clicked';
}

interface DMSequence {
  id: string;
  name: string;
  trigger: string;
  steps: DMStep[];
  isActive: boolean;
  stats: {
    sent: number;
    opened: number;
    replied: number;
  };
}

const DEFAULT_SEQUENCES: DMSequence[] = [
  {
    id: '1',
    name: 'New Follower Welcome',
    trigger: 'new_follower',
    isActive: true,
    steps: [
      { id: '1a', message: 'Hey! Thanks for following 🙏 I noticed you\'re into [topic]. What brought you here?', delayHours: 0, condition: 'always' },
      { id: '1b', message: 'By the way, I have a free resource on [topic] if you\'re interested!', delayHours: 24, condition: 'no_reply' },
    ],
    stats: { sent: 145, opened: 98, replied: 34 }
  },
  {
    id: '2',
    name: 'Post Engagement Follow-up',
    trigger: 'post_engagement',
    isActive: true,
    steps: [
      { id: '2a', message: 'Hey! Saw you liked my post about [topic]. What resonated with you?', delayHours: 1, condition: 'always' },
      { id: '2b', message: 'I\'m curious - are you working on something similar?', delayHours: 48, condition: 'no_reply' },
    ],
    stats: { sent: 89, opened: 67, replied: 22 }
  },
  {
    id: '3',
    name: 'Lead Nurture Sequence',
    trigger: 'qualified_lead',
    isActive: false,
    steps: [
      { id: '3a', message: 'Hey [name]! Quick question - what\'s your biggest challenge with [topic] right now?', delayHours: 0, condition: 'always' },
      { id: '3b', message: 'I help people solve exactly that. Would a quick 15-min call help?', delayHours: 24, condition: 'opened' },
      { id: '3c', message: 'No pressure at all! Here\'s a free guide in the meantime: [link]', delayHours: 72, condition: 'no_reply' },
    ],
    stats: { sent: 45, opened: 38, replied: 15 }
  }
];

export function DMSequenceAutomation() {
  const { data: sequences, setData: setSequences } = useMockStorage<DMSequence>('dm_sequences', DEFAULT_SEQUENCES);
  const [selectedSequence, setSelectedSequence] = useState<DMSequence | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const saveSequences = async () => {
    toast.success('Sequences saved!');
  };

  const toggleSequence = (id: string) => {
    setSequences(sequences.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const addStep = (sequenceId: string) => {
    setSequences(sequences.map(s => {
      if (s.id === sequenceId) {
        return {
          ...s,
          steps: [...s.steps, {
            id: `${sequenceId}-${Date.now()}`,
            message: 'New message...',
            delayHours: 24,
            condition: 'no_reply' as const
          }]
        };
      }
      return s;
    }));
  };

  const updateStep = (sequenceId: string, stepId: string, updates: Partial<DMStep>) => {
    setSequences(sequences.map(s => {
      if (s.id === sequenceId) {
        return {
          ...s,
          steps: s.steps.map(step => 
            step.id === stepId ? { ...step, ...updates } : step
          )
        };
      }
      return s;
    }));
  };

  const deleteStep = (sequenceId: string, stepId: string) => {
    setSequences(sequences.map(s => {
      if (s.id === sequenceId) {
        return {
          ...s,
          steps: s.steps.filter(step => step.id !== stepId)
        };
      }
      return s;
    }));
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'new_follower': return 'New Follower';
      case 'post_engagement': return 'Post Engagement';
      case 'qualified_lead': return 'Qualified Lead';
      case 'story_reply': return 'Story Reply';
      default: return trigger;
    }
  };

  const totalSent = sequences.reduce((sum, s) => sum + s.stats.sent, 0);
  const totalReplied = sequences.reduce((sum, s) => sum + s.stats.replied, 0);
  const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;
  const activeSequences = sequences.filter(s => s.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">DM Sequence Automation</h2>
          <p className="text-muted-foreground">Automated follow-up sequences for leads</p>
        </div>
        <Button onClick={saveSequences}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Save All
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSent}</p>
                <p className="text-sm text-muted-foreground">DMs Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Send className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalReplied}</p>
                <p className="text-sm text-muted-foreground">Replies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{replyRate}%</p>
                <p className="text-sm text-muted-foreground">Reply Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Play className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSequences}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sequences.map((sequence, idx) => (
          <motion.div
            key={sequence.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="card-glow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    {sequence.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getTriggerLabel(sequence.trigger)}</Badge>
                    <Switch
                      checked={sequence.isActive}
                      onCheckedChange={() => toggleSequence(sequence.id)}
                    />
                  </div>
                </div>
                <CardDescription>
                  {sequence.steps.length} steps • {sequence.stats.sent} sent • {Math.round((sequence.stats.replied / sequence.stats.sent) * 100) || 0}% reply rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sequence.steps.map((step, stepIdx) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: stepIdx * 0.05 }}
                      className="p-3 rounded-lg bg-muted/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                            {stepIdx + 1}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {step.delayHours === 0 ? 'Immediate' : `+${step.delayHours}h`}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {step.condition.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteStep(sequence.id, step.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <Textarea
                        value={step.message}
                        onChange={(e) => updateStep(sequence.id, step.id, { message: e.target.value })}
                        className="text-sm min-h-[60px]"
                        placeholder="Enter message..."
                      />
                      <div className="flex items-center gap-2">
                        <Select
                          value={String(step.delayHours)}
                          onValueChange={(v) => updateStep(sequence.id, step.id, { delayHours: Number(v) })}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Immediate</SelectItem>
                            <SelectItem value="1">+1 hour</SelectItem>
                            <SelectItem value="6">+6 hours</SelectItem>
                            <SelectItem value="12">+12 hours</SelectItem>
                            <SelectItem value="24">+24 hours</SelectItem>
                            <SelectItem value="48">+48 hours</SelectItem>
                            <SelectItem value="72">+72 hours</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={step.condition}
                          onValueChange={(v: DMStep['condition']) => updateStep(sequence.id, step.id, { condition: v })}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="always">Always send</SelectItem>
                            <SelectItem value="no_reply">If no reply</SelectItem>
                            <SelectItem value="opened">If opened</SelectItem>
                            <SelectItem value="clicked">If clicked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  ))}

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => addStep(sequence.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Step
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
