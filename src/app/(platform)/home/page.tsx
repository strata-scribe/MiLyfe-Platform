'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface NotificationItem {
  id: string;
  type: 'mly' | 'message' | 'forum' | 'alert' | 'achievement' | 'mention';
  title: string;
  detail: string;
  time: string;
  icon: string;
  read: boolean;
  href?: string;
}

interface TodayAction {
  id: string;
  title: string;
  type: 'task' | 'event' | 'bill' | 'chore' | 'goal';
  due: string;
  completed: boolean;
  icon: string;
  href?: string;
}

interface PersonStatus {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  role: string;
}

export default function HomePage() {
  const { user } = useAppStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [todayActions, setTodayActions] = useState<TodayAction[]>([]);
  const [people, setPeople] = useState<PersonStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [weather, setWeather] = useState('');

  // Stats
  const [mlyBalance, setMlyBalance] = useState(0);
  const [mlyChange, setMlyChange] = useState(0);
  const [standingScore, setStandingScore] = useState(0);
  const [standingLevel, setStandingLevel] = useState('');
  const [healthStreak, setHealthStreak] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeProposals, setActiveProposals] = useState(0);
  const [communityMood, setCommunityMood] = useState('');

  useEffect(() => {
    // Dynamic greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else if (hour < 21) setGreeting('Good evening');
    else setGreeting('Night owl mode');

    setWeather('☀️ 82°F');
    loadDashboard();
  }, [user]);

  async function loadDashboard() {
    setLoading(true);
    const supabase = createClient();

    if (user) {
      // Load user stats
      setMlyBalance(user.mly_balance || 0);

      // Load unread notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      if (notifs) {
        setNotifications(notifs.map(n => ({
          id: n.id,
          type: n.type || 'alert',
          title: n.title || 'Notification',
          detail: n.body || '',
          time: timeAgo(n.created_at),
          icon: n.type === 'mly' ? '💰' : n.type === 'message' ? '✉️' : n.type === 'achievement' ? '🏆' : '🔔',
          read: n.read,
          href: n.action_url,
        })));
      }

      // Standing
      setStandingScore(75);
      setStandingLevel('Good');
      setHealthStreak(7);
      setUnreadMessages(3);
      setActiveProposals(2);
      setCommunityMood('😊 Positive');
      setMlyChange(12);
    }

    setLoading(false);
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  }

  function getStandingColor(score: number) {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-teal-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">
            {greeting}, {user?.display_name?.split(' ')[0] || 'neighbor'}.
          </h1>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            <span>·</span>
            <span>{weather}</span>
          </p>
        </div>
        <Link href="/profile" className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-medium text-teal-700">
          {user?.display_name?.charAt(0) || '?'}
        </Link>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <Link href="/wallet" className="card text-center py-2.5 hover:shadow-md transition-shadow">
          <p className="text-sm font-bold text-mly-600">${mlyBalance}</p>
          <p className="text-[9px] text-gray-400">MLY</p>
          {mlyChange > 0 && <p className="text-[9px] text-green-600">+{mlyChange}</p>}
        </Link>
        <Link href="/health" className="card text-center py-2.5 hover:shadow-md transition-shadow">
          <p className="text-sm font-bold text-teal-600">{healthStreak}🔥</p>
          <p className="text-[9px] text-gray-400">Streak</p>
        </Link>
        <Link href="/profile" className="card text-center py-2.5 hover:shadow-md transition-shadow">
          <p className={cn('text-sm font-bold', getStandingColor(standingScore))}>{standingScore}</p>
          <p className="text-[9px] text-gray-400">Standing</p>
        </Link>
        <Link href="/connect" className="card text-center py-2.5 hover:shadow-md transition-shadow">
          <p className="text-sm font-bold text-harbor-800 dark:text-white">{unreadMessages}</p>
          <p className="text-[9px] text-gray-400">Messages</p>
        </Link>
      </div>

      {/* Morning Brief — What happened overnight */}
      {notifications.length > 0 && (
        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-harbor-800 dark:text-white">Since You Were Away</h2>
            <Link href="/notifications" className="text-[10px] text-teal-600">See all →</Link>
          </div>
          {notifications.slice(0, 3).map(n => (
            <Link key={n.id} href={n.href || '/notifications'} className="flex items-center gap-2 py-1 hover:bg-gray-50 dark:hover:bg-harbor-900 rounded-lg px-1 -mx-1 transition-colors">
              <span className="text-sm">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-harbor-800 dark:text-white truncate">{n.title}</p>
                <p className="text-[10px] text-gray-400 truncate">{n.detail}</p>
              </div>
              <span className="text-[10px] text-gray-400">{n.time}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Today's Actions */}
      <div className="card space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-harbor-800 dark:text-white">Today</h2>
          <span className="text-[10px] text-gray-400">{todayActions.filter(a => a.completed).length}/{todayActions.length || '—'}</span>
        </div>
        {todayActions.length === 0 ? (
          <div className="py-3 text-center">
            <p className="text-xs text-gray-500">Nothing scheduled. Enjoy your day! ☀️</p>
            <div className="flex gap-2 justify-center mt-2">
              <Link href="/health" className="text-[10px] text-teal-600 hover:underline">Check in →</Link>
              <Link href="/mihome/household" className="text-[10px] text-teal-600 hover:underline">Chores →</Link>
            </div>
          </div>
        ) : (
          todayActions.map(action => (
            <div key={action.id} className="flex items-center gap-2">
              <span className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px]', action.completed ? 'bg-green-100 border-green-400 text-green-700' : 'border-gray-300')}>
                {action.completed ? '✓' : ''}
              </span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs', action.completed ? 'text-gray-400 line-through' : 'text-harbor-800 dark:text-white')}>{action.title}</p>
              </div>
              <span className="text-[10px] text-gray-400">{action.due}</span>
            </div>
          ))
        )}
      </div>

      {/* Your Money */}
      <div className="card space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-harbor-800 dark:text-white">💰 Your Money</h2>
          <Link href="/wallet" className="text-[10px] text-teal-600">Details →</Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-mly-600">${mlyBalance.toFixed(0)} <span className="text-xs font-normal text-gray-400">MLY</span></p>
          </div>
          <div className="text-right">
            {mlyChange !== 0 && (
              <p className={cn('text-xs font-medium', mlyChange > 0 ? 'text-green-600' : 'text-red-600')}>
                {mlyChange > 0 ? '+' : ''}{mlyChange} this week
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/wallet/scan" className="flex-1 py-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg text-center text-xs text-teal-700 dark:text-teal-400 hover:bg-teal-100 transition-colors">Send</Link>
          <Link href="/wallet" className="flex-1 py-2 bg-mly-50 dark:bg-mly-900/20 rounded-lg text-center text-xs text-mly-700 dark:text-mly-400 hover:bg-mly-100 transition-colors">Earn</Link>
          <Link href="/finance" className="flex-1 py-2 bg-gray-50 dark:bg-harbor-900 rounded-lg text-center text-xs text-gray-600 hover:bg-gray-100 transition-colors">Finance</Link>
        </div>
      </div>

      {/* Community Pulse */}
      <div className="card space-y-2">
        <h2 className="text-xs font-bold text-harbor-800 dark:text-white">🏘️ Community Pulse</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Link href="/govern" className="py-2 bg-gray-50 dark:bg-harbor-900 rounded-lg hover:shadow-sm transition-shadow">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">{activeProposals}</p>
            <p className="text-[9px] text-gray-400">Active Votes</p>
          </Link>
          <div className="py-2 bg-gray-50 dark:bg-harbor-900 rounded-lg">
            <p className="text-sm">{communityMood}</p>
            <p className="text-[9px] text-gray-400">Community</p>
          </div>
          <Link href="/broadcast" className="py-2 bg-gray-50 dark:bg-harbor-900 rounded-lg hover:shadow-sm transition-shadow">
            <p className="text-sm font-bold text-green-600">✓</p>
            <p className="text-[9px] text-gray-400">No Alerts</p>
          </Link>
        </div>
      </div>

      {/* Your Standing */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-harbor-800 dark:text-white">⭐ Your Standing</h2>
          <span className={cn('text-xs font-bold', getStandingColor(standingScore))}>{standingLevel} · {standingScore}/100</span>
        </div>
        <div className="mt-2 h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${standingScore}%` }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-gray-400">
          <span>Next: Level up at 80</span>
          <span>5 pts to go</span>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: '💬', label: 'Forum', href: '/forum' },
          { icon: '🛒', label: 'Market', href: '/market' },
          { icon: '📰', label: 'News', href: '/news' },
          { icon: '📚', label: 'Learn', href: '/learn' },
          { icon: '🏠', label: 'MiHome', href: '/mihome' },
          { icon: '📺', label: 'MiTV', href: '/media/tv' },
          { icon: '🏦', label: 'Finance', href: '/finance' },
          { icon: '🗺️', label: 'Navigate', href: '/nav' },
        ].map(item => (
          <Link key={item.href} href={item.href} className="card p-2 text-center hover:shadow-md transition-shadow">
            <p className="text-lg">{item.icon}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">{item.label}</p>
          </Link>
        ))}
      </div>

      {/* Personalized Suggestions */}
      <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
        <h2 className="text-xs font-bold text-teal-700 dark:text-teal-400 mb-2">💡 For You</h2>
        <div className="space-y-2">
          <Link href="/learn" className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-300 hover:underline">
            <span>📚</span> Complete "Financial Literacy 101" to earn 25 $MLY
          </Link>
          <Link href="/forum" className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-300 hover:underline">
            <span>💬</span> 3 new posts in spaces you follow
          </Link>
          <Link href="/market" className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-300 hover:underline">
            <span>🛒</span> 2 new listings in your neighborhood
          </Link>
        </div>
      </div>
    </div>
  );
}
