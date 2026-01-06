import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface MemoryItem {
  id: string;
  title: string;
  type: string;
  content: any;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface UseRealtimeMemoryOptions {
  onNewMemory?: (item: MemoryItem) => void;
  onUpdateMemory?: (item: MemoryItem) => void;
  onDeleteMemory?: (id: string) => void;
  showToasts?: boolean;
}

export function useRealtimeMemory(options: UseRealtimeMemoryOptions = {}) {
  const { organization } = useOrganization();
  const { onNewMemory, onUpdateMemory, onDeleteMemory, showToasts = true } = options;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!organization?.id) return;

    // Subscribe to real-time changes on memory_items table
    const channel = supabase
      .channel('memory-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'memory_items',
          filter: `organization_id=eq.${organization.id}`
        },
        (payload) => {
          const newItem = payload.new as MemoryItem;
          console.log('[MEMORY SYNC] New memory item:', newItem.title);
          
          if (showToasts) {
            toast.info(`New memory: ${newItem.title}`, {
              description: `Type: ${newItem.type}`
            });
          }
          
          onNewMemory?.(newItem);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'memory_items',
          filter: `organization_id=eq.${organization.id}`
        },
        (payload) => {
          const updatedItem = payload.new as MemoryItem;
          console.log('[MEMORY SYNC] Memory updated:', updatedItem.title);
          onUpdateMemory?.(updatedItem);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'memory_items',
          filter: `organization_id=eq.${organization.id}`
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          console.log('[MEMORY SYNC] Memory deleted:', deletedId);
          onDeleteMemory?.(deletedId);
        }
      )
      .subscribe((status) => {
        console.log('[MEMORY SYNC] Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [organization?.id, onNewMemory, onUpdateMemory, onDeleteMemory, showToasts]);

  // Function to immediately sync a learned fact
  const syncMemory = useCallback(async (
    title: string, 
    type: string, 
    content: any, 
    tags?: string[]
  ): Promise<MemoryItem | null> => {
    if (!organization?.id) return null;

    const { data, error } = await supabase
      .from('memory_items')
      .insert({
        organization_id: organization.id,
        title,
        type,
        content,
        tags
      })
      .select()
      .single();

    if (error) {
      console.error('[MEMORY SYNC] Failed to sync:', error);
      toast.error('Failed to save memory');
      return null;
    }

    console.log('[MEMORY SYNC] Synced immediately:', title);
    return data as MemoryItem;
  }, [organization?.id]);

  return { syncMemory };
}

// Hook for agent states real-time sync
export function useRealtimeAgentStates(onUpdate?: (state: any) => void) {
  const { organization } = useOrganization();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel('agent-states-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_states',
          filter: `organization_id=eq.${organization.id}`
        },
        (payload) => {
          console.log('[AGENT SYNC] State change:', payload.eventType);
          onUpdate?.(payload.new || payload.old);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [organization?.id, onUpdate]);
}
