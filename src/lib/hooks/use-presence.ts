'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  user_id: string;
  display_name: string;
  online_at: string;
  status: 'online' | 'away' | 'offline';
}

interface UsePresenceReturn {
  onlineUsers: Map<string, PresenceState>;
  isUserOnline: (userId: string) => boolean;
  getUserStatus: (userId: string) => 'online' | 'away' | 'offline';
  onlineCount: number;
}

/**
 * Hook for real-time presence tracking using Supabase Realtime.
 * Tracks which users are online in the MiConnect space.
 */
export function usePresence(): UsePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceState>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { user } = useAppStore();

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    const channel = supabase.channel('presence:connect', {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = new Map<string, PresenceState>();

        for (const [, presences] of Object.entries(state)) {
          for (const presence of presences as unknown as PresenceState[]) {
            users.set(presence.user_id, presence);
          }
        }

        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineUsers((prev) => {
          const updated = new Map(prev);
          for (const presence of newPresences as unknown as PresenceState[]) {
            updated.set(presence.user_id, presence);
          }
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setOnlineUsers((prev) => {
          const updated = new Map(prev);
          for (const presence of leftPresences as unknown as PresenceState[]) {
            updated.delete(presence.user_id);
          }
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            display_name: user.display_name || user.email,
            online_at: new Date().toISOString(),
            status: 'online',
          });
        }
      });

    channelRef.current = channel;

    // Handle visibility change for away status
    const handleVisibility = () => {
      if (document.hidden) {
        channel.track({
          user_id: user.id,
          display_name: user.display_name || user.email,
          online_at: new Date().toISOString(),
          status: 'away',
        });
      } else {
        channel.track({
          user_id: user.id,
          display_name: user.display_name || user.email,
          online_at: new Date().toISOString(),
          status: 'online',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      channel.unsubscribe();
    };
  }, [user]);

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers]
  );

  const getUserStatus = useCallback(
    (userId: string): 'online' | 'away' | 'offline' => {
      const presence = onlineUsers.get(userId);
      if (!presence) return 'offline';
      return presence.status;
    },
    [onlineUsers]
  );

  return {
    onlineUsers,
    isUserOnline,
    getUserStatus,
    onlineCount: onlineUsers.size,
  };
}
