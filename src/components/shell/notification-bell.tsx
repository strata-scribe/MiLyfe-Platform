'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, Check, Gift, Landmark, Users, Shield, Info, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  ubi: Gift,
  reward: Gift,
  governance: Landmark,
  social: Users,
  safety: Shield,
  system: Info,
  info: Info,
};

const TYPE_COLORS: Record<string, string> = {
  ubi: 'text-mly-500',
  reward: 'text-mly-500',
  governance: 'text-purple-500',
  social: 'text-teal-500',
  safety: 'text-red-500',
  system: 'text-harbor-500',
  info: 'text-blue-500',
};

export function NotificationBell() {
  const { user } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setNotifications(data as Notification[]);
      setLoading(false);
    }

    load();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function markAllRead() {
    if (!user) return;
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-harbor-800 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse-soft">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-12 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950 shadow-xl z-50 animate-slide-up"
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-harbor-800">
            <h2 className="text-sm font-bold text-harbor-800 dark:text-white">Notifications</h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-teal-600 hover:underline font-medium flex items-center gap-1 min-h-0 min-w-0"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-harbor-800 min-h-0 min-w-0"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto max-h-[calc(70vh-52px)]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <ul aria-label="Notification list">
                {notifications.map((notif) => {
                  const Icon = TYPE_ICONS[notif.type] || Bell;
                  const color = TYPE_COLORS[notif.type] || 'text-gray-500';

                  return (
                    <li
                      key={notif.id}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-harbor-800 last:border-0 transition-colors',
                        !notif.read && 'bg-teal-50/50 dark:bg-teal-900/10'
                      )}
                    >
                      <div className={cn('mt-0.5 p-1.5 rounded-lg bg-gray-50 dark:bg-harbor-900', color)}>
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm truncate', !notif.read ? 'font-semibold text-harbor-800 dark:text-white' : 'text-gray-700 dark:text-gray-300')}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <button
                              onClick={() => markRead(notif.id)}
                              className="shrink-0 h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-harbor-800 min-h-0 min-w-0"
                              aria-label="Mark as read"
                            >
                              <Check className="h-3 w-3 text-gray-400" />
                            </button>
                          )}
                        </div>
                        {notif.body && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{notif.body}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }).replace('about ', '')}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
