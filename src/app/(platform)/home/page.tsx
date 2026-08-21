'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface FeedItem {
  id: string;
  type: 'issue' | 'checkin' | 'listing' | 'event';
  user_name: string;
  action: string;
  detail: string;
  time: string;
  icon: string;
}

export default function HomePage() {
  const { user } = useAppStore();
  const supabase = createClient();

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [stats, setStats] = useState({ streak: 0, balance: 0, issues: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      // Load stats from profile
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('mly_balance, health_streak')
          .eq('id', user.id)
          .single();

        if (profile) {
          setStats((prev) => ({
            ...prev,
            streak: profile.health_streak,
            balance: profile.mly_balance,
          }));
        }
      }

      // Load community feed — recent activity across all public tables
      const feedItems: FeedItem[] = [];

      // Recent issues
      const { data: issues } = await supabase
        .from('city_issues')
        .select('id, title, created_at, reporter_id, profiles!city_issues_reporter_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (issues) {
        issues.forEach((issue: any) => {
          feedItems.push({
            id: `issue-${issue.id}`,
            type: 'issue',
            user_name: issue.profiles?.display_name ?? 'Someone',
            action: 'reported an issue',
            detail: issue.title,
            time: issue.created_at,
            icon: '🏛️',
          });
        });
      }

      // Recent shop listings
      const { data: listings } = await supabase
        .from('shop_listings')
        .select('id, title, created_at, seller_id, profiles!shop_listings_seller_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (listings) {
        listings.forEach((listing: any) => {
          feedItems.push({
            id: `listing-${listing.id}`,
            type: 'listing',
            user_name: listing.profiles?.display_name ?? 'Someone',
            action: 'listed on MiShop',
            detail: listing.title,
            time: listing.created_at,
            icon: '🛍️',
          });
        });
      }

      // Recent events
      const { data: events } = await supabase
        .from('city_events')
        .select('id, title, created_at, organizer_id, profiles!city_events_organizer_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(3);

      if (events) {
        events.forEach((event: any) => {
          feedItems.push({
            id: `event-${event.id}`,
            type: 'event',
            user_name: event.profiles?.display_name ?? 'Someone',
            action: 'created an event',
            detail: event.title,
            time: event.created_at,
            icon: '📅',
          });
        });
      }

      // Sort by time descending
      feedItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setFeed(feedItems.slice(0, 10));

      // Count open issues
      const { count } = await supabase
        .from('city_issues')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      setStats((prev) => ({ ...prev, issues: count ?? 0 }));

      setLoading(false);
    };

    loadDashboard();

    // Realtime feed updates
    const channel = supabase
      .channel('home-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'city_issues' }, () => loadDashboard())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shop_listings' }, () => loadDashboard())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, supabase]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Greeting */}
      <section>
        <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">
          Hey, {user?.display_name || 'neighbor'} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Your community is active today.
        </p>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-mly-600">{stats.balance.toFixed(0)}</p>
          <p className="text-xs text-gray-500">$MLY</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-teal-500">{stats.streak}</p>
          <p className="text-xs text-gray-500">Day streak</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-harbor-800 dark:text-white">{stats.issues}</p>
          <p className="text-xs text-gray-500">Open issues</p>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/city/report', icon: '📋', label: 'Report Issue', color: 'border-l-harbor-400' },
            { href: '/health', icon: '💚', label: 'Check In', color: 'border-l-teal-500' },
            { href: '/shop', icon: '🛍️', label: 'Browse Shop', color: 'border-l-mly-500' },
            { href: '/connect', icon: '💬', label: 'Messages', color: 'border-l-blue-500' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`card border-l-4 ${action.color} flex items-center gap-3 hover:scale-105 transition-transform`}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-harbor-800 dark:text-white">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Community Feed */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Community Pulse</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card flex gap-3">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-48" />
                  <div className="skeleton h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400">No activity yet. Be the first to contribute!</p>
            <Link href="/city/report" className="btn-teal mt-3 inline-block text-sm">
              Report an Issue
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {feed.map((item) => (
              <div key={item.id} className="card flex items-start gap-3">
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-harbor-800 dark:text-white">
                    <strong>{item.user_name}</strong> {item.action}
                  </p>
                  {item.detail && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{item.detail}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">{getRelativeTime(item.time)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* UBI Info */}
      <section className="card bg-gradient-to-r from-mly-50 to-teal-50 dark:from-mly-900/20 dark:to-teal-900/20 border-mly-200 dark:border-mly-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Daily $MLY UBI</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Stay active (check-in or report issues) to receive 10 $MLY daily.
            </p>
          </div>
        </div>
      </section>
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
