import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

interface RealtimeEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export function useRealtimeEvents() {
  const { organization } = useOrganization();
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!organization?.id) return;

    const channelName = `org:${organization.id}`;
    
    const channel = supabase.channel(channelName)
      .on('broadcast', { event: '*' }, (payload) => {
        console.log('Realtime event:', payload);
        setEvents(prev => [{
          type: payload.event,
          payload: payload.payload as Record<string, unknown>,
          timestamp: new Date()
        }, ...prev.slice(0, 99)]);
      })
      .subscribe((status) => {
        console.log('Realtime status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id]);

  return { events, isConnected };
}

// Hook for action updates
export function useActionUpdates(onUpdate?: (action: { action_id: string; status: string }) => void) {
  const { organization } = useOrganization();

  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase.channel(`org:${organization.id}:actions`)
      .on('broadcast', { event: 'action_update' }, (payload) => {
        if (onUpdate && payload.payload) {
          onUpdate(payload.payload as { action_id: string; status: string });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, onUpdate]);
}

// Hook for message updates (streaming)
export function useMessageStream(sessionId: string | null, onMessage?: (message: unknown) => void) {
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`session:${sessionId}`)
      .on('broadcast', { event: 'message_stream' }, (payload) => {
        if (onMessage) {
          onMessage(payload.payload);
        }
      })
      .on('broadcast', { event: 'message_received' }, (payload) => {
        if (onMessage) {
          onMessage(payload.payload);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, onMessage]);
}

// Hook for payment/revenue updates
export function useRevenueUpdates(onPayment?: (event: { type: string; amount: number }) => void) {
  const { organization } = useOrganization();

  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase.channel(`org:${organization.id}:revenue`)
      .on('broadcast', { event: 'payment_received' }, (payload) => {
        if (onPayment && payload.payload) {
          onPayment(payload.payload as { type: string; amount: number });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, onPayment]);
}

// Presence tracking for collaborative features
export function usePresence(roomId: string) {
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: 'user' } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userList = Object.values(state).flat();
        setUsers(userList as Record<string, unknown>[]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({
              user_id: user.id,
              email: user.email,
              online_at: new Date().toISOString()
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { users };
}
