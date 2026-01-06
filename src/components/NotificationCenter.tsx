import { useState, useEffect } from "react";
import { Bell, X, Check, AlertTriangle, Info, DollarSign, Users, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: 'approval' | 'revenue' | 'lead' | 'agent' | 'trend' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

const notificationIcons = {
  approval: AlertTriangle,
  revenue: DollarSign,
  lead: Users,
  agent: Zap,
  trend: TrendingUp,
  info: Info,
  warning: AlertTriangle,
};

const notificationColors = {
  approval: 'text-amber-400 bg-amber-400/10',
  revenue: 'text-emerald-400 bg-emerald-400/10',
  lead: 'text-blue-400 bg-blue-400/10',
  agent: 'text-purple-400 bg-purple-400/10',
  trend: 'text-pink-400 bg-pink-400/10',
  info: 'text-slate-400 bg-slate-400/10',
  warning: 'text-orange-400 bg-orange-400/10',
};

export function NotificationCenter() {
  const { organization } = useOrganization();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!organization?.id) return;

    // Load initial notifications from approval_requests and agent_execution_logs
    loadNotifications();

    // Subscribe to real-time updates
    const approvalChannel = supabase
      .channel('approval-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'approval_requests',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'approval',
            title: 'New Approval Required',
            message: payload.new.title,
            timestamp: new Date(payload.new.created_at),
            read: false,
            metadata: payload.new,
          };
          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .subscribe();

    const revenueChannel = supabase
      .channel('revenue-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'revenue_events',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'revenue',
            title: payload.new.event_type === 'payment' ? 'Payment Received!' : 'Revenue Event',
            message: `$${payload.new.amount} ${payload.new.currency || 'USD'} via ${payload.new.payment_provider || 'unknown'}`,
            timestamp: new Date(payload.new.created_at),
            read: false,
            metadata: payload.new,
          };
          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .subscribe();

    const leadChannel = supabase
      .channel('lead-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'lead',
            title: 'New Lead Captured',
            message: `${payload.new.name || 'Unknown'} from ${payload.new.source || 'unknown source'}`,
            timestamp: new Date(payload.new.created_at),
            read: false,
            metadata: payload.new,
          };
          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .subscribe();

    const agentChannel = supabase
      .channel('agent-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agent_states',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          if (payload.new.status === 'completed' || payload.new.status === 'error') {
            const newNotification: Notification = {
              id: `agent-${payload.new.id}-${Date.now()}`,
              type: 'agent',
              title: `Agent ${payload.new.agent_name}`,
              message: payload.new.status === 'completed' 
                ? `Completed: ${payload.new.last_action || 'Task finished'}` 
                : `Error in task`,
              timestamp: new Date(),
              read: false,
              metadata: payload.new,
            };
            setNotifications(prev => [newNotification, ...prev]);
          }
        }
      )
      .subscribe();

    const trendChannel = supabase
      .channel('trend-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trend_topics',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'trend',
            title: 'Trend Detected',
            message: payload.new.topic,
            timestamp: new Date(payload.new.created_at),
            read: false,
            metadata: payload.new,
          };
          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(approvalChannel);
      supabase.removeChannel(revenueChannel);
      supabase.removeChannel(leadChannel);
      supabase.removeChannel(agentChannel);
      supabase.removeChannel(trendChannel);
    };
  }, [organization?.id]);

  const loadNotifications = async () => {
    if (!organization?.id) return;

    try {
      // Load recent approval requests
      const { data: approvals } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Load recent revenue events
      const { data: revenues } = await supabase
        .from('revenue_events')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Load recent leads
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const combinedNotifications: Notification[] = [];

      approvals?.forEach(a => {
        combinedNotifications.push({
          id: a.id,
          type: 'approval',
          title: a.status === 'pending' ? 'Approval Required' : `Approval ${a.status}`,
          message: a.title,
          timestamp: new Date(a.created_at),
          read: a.status !== 'pending',
          metadata: a,
        });
      });

      revenues?.forEach(r => {
        combinedNotifications.push({
          id: r.id,
          type: 'revenue',
          title: r.event_type === 'payment' ? 'Payment Received' : 'Revenue Event',
          message: `$${r.amount} ${r.currency || 'USD'}`,
          timestamp: new Date(r.created_at),
          read: true,
          metadata: r,
        });
      });

      leads?.forEach(l => {
        combinedNotifications.push({
          id: l.id,
          type: 'lead',
          title: 'New Lead',
          message: l.name || l.email || 'Unknown lead',
          timestamp: new Date(l.created_at),
          read: true,
          metadata: l,
        });
      });

      // Sort by timestamp
      combinedNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setNotifications(combinedNotifications.slice(0, 20));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge 
                  variant="destructive" 
                  className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-gradient-to-r from-purple-500 to-pink-500 border-0"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-slate-900/95 border-slate-700/50 backdrop-blur-xl">
        <SheetHeader className="pb-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-400" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                  {unreadCount} new
                </Badge>
              )}
            </SheetTitle>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-slate-400 hover:text-white"
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAll}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Bell className="h-12 w-12 mb-4 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">You'll see updates here in real-time</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification, index) => {
                  const Icon = notificationIcons[notification.type];
                  const colorClass = notificationColors[notification.type];

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        notification.read 
                          ? 'bg-slate-800/30 border-slate-700/30' 
                          : 'bg-slate-800/60 border-purple-500/30 shadow-lg shadow-purple-500/10'
                      } hover:bg-slate-800/50`}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-medium ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-purple-400 flex-shrink-0 mt-2" />
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mt-0.5 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
