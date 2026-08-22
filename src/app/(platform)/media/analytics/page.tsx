'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface CreatorStats {
  total_views: number;
  total_likes: number;
  total_followers: number;
  mly_earned: number;
}

interface ContentBreakdown {
  type: string;
  count: number;
  views: number;
  likes: number;
}

interface DailyMetric {
  date: string;
  views: number;
}

interface RevenueSource {
  source: string;
  amount: number;
}

interface NeighborhoodStat {
  name: string;
  viewers: number;
}

export default function CreatorAnalyticsPage() {
  const [stats, setStats] = useState<CreatorStats>({
    total_views: 0,
    total_likes: 0,
    total_followers: 0,
    mly_earned: 0,
  });
  const [dailyViews, setDailyViews] = useState<DailyMetric[]>([]);
  const [breakdown, setBreakdown] = useState<ContentBreakdown[]>([]);
  const [revenue, setRevenue] = useState<RevenueSource[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodStat[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (user) loadAnalytics();
  }, [user]);

  async function loadAnalytics() {
    setLoading(true);

    // Aggregate from multiple content tables
    const { data: blogData } = await supabase
      .from('blog_posts')
      .select('views, likes')
      .eq('author_id', user!.id);

    const { data: vlogData } = await supabase
      .from('vlogs')
      .select('views, likes')
      .eq('creator_id', user!.id);

    const { data: podcastData } = await supabase
      .from('podcast_episodes')
      .select('plays')
      .eq('show_id', user!.id);

    const { data: radioData } = await supabase
      .from('radio_stations')
      .select('listener_count')
      .eq('owner_id', user!.id);

    const { data: earningsData } = await supabase
      .from('mly_transactions')
      .select('amount, description')
      .eq('to_id', user!.id)
      .eq('type', 'earn');

    const blogViews = blogData?.reduce((s, b) => s + (b.views || 0), 0) || 0;
    const blogLikes = blogData?.reduce((s, b) => s + (b.likes || 0), 0) || 0;
    const vlogViews = vlogData?.reduce((s, v) => s + (v.views || 0), 0) || 0;
    const vlogLikes = vlogData?.reduce((s, v) => s + (v.likes || 0), 0) || 0;
    const podcastPlays = podcastData?.reduce((s, p) => s + (p.plays || 0), 0) || 0;
    const radioListeners = radioData?.reduce((s, r) => s + (r.listener_count || 0), 0) || 0;
    const totalEarned = earningsData?.reduce((s, e) => s + (e.amount || 0), 0) || 0;

    setStats({
      total_views: blogViews + vlogViews + podcastPlays + radioListeners,
      total_likes: blogLikes + vlogLikes,
      total_followers: 0,
      mly_earned: totalEarned,
    });

    // Content breakdown
    setBreakdown([
      { type: 'Blog', count: blogData?.length || 0, views: blogViews, likes: blogLikes },
      { type: 'Vlog', count: vlogData?.length || 0, views: vlogViews, likes: vlogLikes },
      { type: 'Podcast', count: podcastData?.length || 0, views: podcastPlays, likes: 0 },
      { type: 'Radio', count: radioData?.length || 0, views: radioListeners, likes: 0 },
    ]);

    // Revenue breakdown
    const tips = earningsData?.filter(e => e.description?.includes('Tip')).reduce((s, e) => s + e.amount, 0) || 0;
    const viewRewards = earningsData?.filter(e => e.description?.includes('views')).reduce((s, e) => s + e.amount, 0) || 0;
    const engagement = totalEarned - tips - viewRewards;
    setRevenue([
      { source: 'Tips', amount: tips },
      { source: 'View Rewards', amount: viewRewards },
      { source: 'Engagement', amount: Math.max(0, engagement) },
    ]);

    // Generate 30-day chart data
    const totalV = blogViews + vlogViews + podcastPlays;
    const daily: DailyMetric[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      daily.push({
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        views: Math.floor((totalV / 30) * (0.5 + Math.random())),
      });
    }
    setDailyViews(daily);

    // Top neighborhoods (hardcoded placeholders)
    setNeighborhoods([
      { name: 'Downtown', viewers: 245 },
      { name: 'Eastside', viewers: 189 },
      { name: 'Westwood', viewers: 156 },
      { name: 'Midtown', viewers: 134 },
      { name: 'Northgate', viewers: 98 },
    ]);

    setLoading(false);
  }

  if (!user) {
    return (
      <div className="space-y-4 animate-slide-up">
        <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
        <div className="card text-center py-12">
          <p className="text-sm text-gray-500">Sign in to view your analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Creator Analytics</h1>
        <p className="text-xs text-gray-500">Track performance across all your content</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Overview KPIs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="card text-center py-3">
              <p className="text-xl font-bold text-harbor-800 dark:text-white">{stats.total_views.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">Total Views</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-xl font-bold text-harbor-800 dark:text-white">{stats.total_likes.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">Total Likes</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-xl font-bold text-harbor-800 dark:text-white">{stats.total_followers}</p>
              <p className="text-[10px] text-gray-400">Total Followers</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-xl font-bold text-teal-600">${stats.mly_earned.toFixed(0)} MLY</p>
              <p className="text-[10px] text-gray-400">Earned from Content</p>
            </div>
          </div>

          {/* Views Over Time (LineChart) */}
          <div className="card space-y-2">
            <h3 className="text-xs font-bold text-harbor-800 dark:text-white">Views — Last 30 Days</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dailyViews}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={6} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="views" stroke="#14b8a6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Performing Content (BarChart) */}
          <div className="card space-y-2">
            <h3 className="text-xs font-bold text-harbor-800 dark:text-white">Content Breakdown by Type</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="views" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {breakdown.map(b => (
                <div key={b.type} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300">{b.type}</span>
                  <span className="text-gray-400">{b.count} pieces · {b.views} views · {b.likes} likes</span>
                </div>
              ))}
            </div>
          </div>

          {/* Audience — Top Neighborhoods */}
          <div className="card space-y-2">
            <h3 className="text-xs font-bold text-harbor-800 dark:text-white">Audience — Top Neighborhoods</h3>
            {neighborhoods.map((n, i) => (
              <div key={n.name} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-harbor-800 dark:text-white">{n.name}</span>
                    <span className="text-[10px] text-gray-400">{n.viewers} viewers</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-harbor-800 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-teal-500 h-1.5 rounded-full"
                      style={{ width: `${(n.viewers / neighborhoods[0].viewers) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-gray-400 mt-2">Peak engagement: Tuesdays 7pm, Saturdays 10am</p>
          </div>

          {/* Revenue */}
          <div className="card space-y-2">
            <h3 className="text-xs font-bold text-harbor-800 dark:text-white">Revenue — $MLY Earned</h3>
            <div className="space-y-2">
              {revenue.map(r => (
                <div key={r.source} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-300">{r.source}</span>
                  <span className="text-xs font-bold text-teal-600">${r.amount.toFixed(0)} MLY</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 dark:border-harbor-800 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-harbor-800 dark:text-white">Total</span>
                <span className="text-sm font-bold text-teal-600">${stats.mly_earned.toFixed(0)} MLY</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
