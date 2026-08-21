'use client';

import { useNotifications } from '@/lib/hooks/use-notifications';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const typeIcons: Record<string, string> = {
  ubi: '💰',
  message: '💬',
  upvote: '👍',
  order: '🛍️',
  event: '📅',
  system: '🔔',
};

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllRead, requestPushPermission } = useNotifications();
  const router = useRouter();

  const handleClick = (notif: { id: string; read: boolean; link: string | null }) => {
    if (!notif.read) markAsRead(notif.id);
    if (notif.link) router.push(notif.link);
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <button onClick={markAllRead} className="text-xs text-teal-500 font-medium">
            Mark all read
          </button>
        )}
      </div>

      {/* Push permission prompt */}
      {'Notification' in (typeof window !== 'undefined' ? window : {}) &&
        typeof window !== 'undefined' && Notification.permission === 'default' && (
        <div className="card bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Enable push notifications?</p>
              <p className="text-xs text-gray-500">Get notified about messages, UBI drops, and community updates.</p>
            </div>
            <button onClick={requestPushPermission} className="btn-teal text-xs !py-2 !px-3">
              Enable
            </button>
          </div>
        </div>
      )}

      {/* Notifications list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card flex gap-3">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-3 w-60" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-500 dark:text-gray-400">No notifications yet.</p>
          <p className="text-sm text-gray-400 mt-1">You&apos;ll be notified about UBI drops, messages, and community activity.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={cn(
                'card w-full flex items-start gap-3 text-left transition-colors',
                !notif.read && 'bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900'
              )}
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">
                {typeIcons[notif.type] || '🔔'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'text-sm truncate',
                    !notif.read ? 'font-bold text-harbor-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                  )}>
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {getRelativeTime(notif.created_at)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
