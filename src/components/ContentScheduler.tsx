import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus,
  Play,
  Pause,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Edit,
  Send,
  Instagram,
  Youtube
} from "lucide-react";
import { useMockStorage } from "@/hooks/useMockStorage";
import { toast } from "sonner";
import { format, addDays, startOfWeek, addHours, isSameDay } from "date-fns";

interface ScheduledContent {
  id: string;
  title: string | null;
  content_type: string;
  variation: string;
  platform: string;
  scheduled_at: string | null;
  status: string;
  hook_text: string | null;
}

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: Play, color: 'text-pink-400' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-purple-400' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-400' },
  { id: 'twitter', name: 'X/Twitter', icon: Send, color: 'text-blue-400' },
  { id: 'linkedin', name: 'LinkedIn', icon: Send, color: 'text-cyan-400' },
  { id: 'facebook', name: 'Facebook', icon: Send, color: 'text-indigo-400' },
  { id: 'threads', name: 'Threads', icon: Send, color: 'text-gray-400' },
];

const DEMO_CONTENT: ScheduledContent[] = [
  {
    id: '1',
    title: 'Morning Motivation Post',
    content_type: 'reel',
    variation: 'A',
    platform: 'instagram',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    status: 'scheduled',
    hook_text: 'The secret no one talks about...'
  },
  {
    id: '2',
    title: 'Product Demo',
    content_type: 'video',
    variation: 'B',
    platform: 'youtube',
    scheduled_at: new Date(Date.now() + 172800000).toISOString(),
    status: 'scheduled',
    hook_text: 'Watch this before buying...'
  }
];

export function ContentScheduler() {
  const { data: scheduledContent, setData: setScheduledContent, loading } = useMockStorage<ScheduledContent>('content_queue', DEMO_CONTENT);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'calendar'>('week');

  const scheduleContent = async (contentId: string, scheduledAt: Date) => {
    const updated = scheduledContent.map(c => 
      c.id === contentId 
        ? { ...c, scheduled_at: scheduledAt.toISOString(), status: 'scheduled' }
        : c
    );
    setScheduledContent(updated);
    toast.success('Content scheduled!');
  };

  const publishContent = async (contentId: string) => {
    const updated = scheduledContent.map(c => 
      c.id === contentId 
        ? { ...c, status: 'published' }
        : c
    );
    setScheduledContent(updated);
    toast.success('Content published!');
  };

  const getContentForDate = (date: Date) => {
    return scheduledContent.filter(c => 
      c.scheduled_at && isSameDay(new Date(c.scheduled_at), date)
    );
  };

  const getPlatformInfo = (platformId: string) => {
    return PLATFORMS.find(p => p.id.toLowerCase() === platformId.toLowerCase()) || PLATFORMS[0];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return { color: 'bg-blue-500/20 text-blue-400', label: 'Scheduled' };
      case 'published': return { color: 'bg-green-500/20 text-green-400', label: 'Published' };
      case 'draft': return { color: 'bg-muted text-muted-foreground', label: 'Draft' };
      default: return { color: 'bg-muted text-muted-foreground', label: status };
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => 
    addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i)
  );

  const scheduledCount = scheduledContent.filter(c => c.status === 'scheduled').length;
  const publishedCount = scheduledContent.filter(c => c.status === 'published').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Content Scheduler</h2>
          <p className="text-muted-foreground">Multi-platform content calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            Calendar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {PLATFORMS.slice(0, 4).map(platform => {
          const Icon = platform.icon;
          const count = scheduledContent.filter(c => 
            c.platform.toLowerCase() === platform.id.toLowerCase()
          ).length;
          
          return (
            <Card key={platform.id} className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className={`w-5 h-5 ${platform.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{platform.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Sidebar */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Scheduled</span>
                <Badge variant="secondary">{scheduledCount}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Published</span>
                <Badge variant="secondary">{publishedCount}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Week View */}
        <div className="lg:col-span-3">
          {viewMode === 'week' ? (
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Week View</CardTitle>
                <CardDescription>
                  {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, idx) => {
                    const dayContent = getContentForDate(day);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = isSameDay(day, selectedDate);
                    
                    return (
                      <div 
                        key={idx}
                        className={`
                          p-2 rounded-lg border min-h-[200px] cursor-pointer transition-all
                          ${isToday ? 'border-primary bg-primary/5' : 'border-border'}
                          ${isSelected ? 'ring-2 ring-primary/50' : ''}
                          hover:bg-muted/50
                        `}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className="text-center mb-2">
                          <p className="text-xs text-muted-foreground">
                            {format(day, 'EEE')}
                          </p>
                          <p className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>
                            {format(day, 'd')}
                          </p>
                        </div>
                        <ScrollArea className="h-[140px]">
                          <div className="space-y-1">
                            {dayContent.map(content => {
                              const platform = getPlatformInfo(content.platform);
                              const PlatformIcon = platform.icon;
                              
                              return (
                                <motion.div
                                  key={content.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="p-2 rounded bg-muted/50 text-xs group"
                                >
                                  <div className="flex items-center gap-1 mb-1">
                                    <PlatformIcon className={`w-3 h-3 ${platform.color}`} />
                                    <span className="truncate font-medium">
                                      {content.title || content.variation}
                                    </span>
                                  </div>
                                  {content.scheduled_at && (
                                    <span className="text-muted-foreground">
                                      {format(new Date(content.scheduled_at), 'HH:mm')}
                                    </span>
                                  )}
                                  <div className="hidden group-hover:flex gap-1 mt-1">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-5 text-xs p-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        publishContent(content.id);
                                      }}
                                    >
                                      <Send className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>All Scheduled Content</CardTitle>
                <CardDescription>Manage your content queue</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    <AnimatePresence>
                      {scheduledContent.map((content, idx) => {
                        const platform = getPlatformInfo(content.platform);
                        const PlatformIcon = platform.icon;
                        const statusBadge = getStatusBadge(content.status);
                        
                        return (
                          <motion.div
                            key={content.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: idx * 0.02 }}
                            className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-background">
                                  <PlatformIcon className={`w-5 h-5 ${platform.color}`} />
                                </div>
                                <div>
                                  <p className="font-medium">{content.title || 'Untitled'}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{platform.name}</span>
                                    <span>•</span>
                                    <span>{content.variation}</span>
                                    {content.scheduled_at && (
                                      <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {format(new Date(content.scheduled_at), 'MMM d, HH:mm')}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={statusBadge.color} variant="secondary">
                                  {statusBadge.label}
                                </Badge>
                                {content.status === 'scheduled' && (
                                  <Button size="sm" onClick={() => publishContent(content.id)}>
                                    <Send className="w-4 h-4 mr-1" />
                                    Publish
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {scheduledContent.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No scheduled content</p>
                        <p className="text-sm">Generate content and schedule it here</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
