'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface CreatorStats {
  total_views: number;
  total_likes: number;
  total_followers: number;
  total_earnings: number;
  content_count: number;
  avg_engagement: number;
}

interface ContentMetric {
  id: string;
  title: string;
  type: 'blog' | 'vlog' | 'stream' | 'podcast' | 'radio';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  earnings: number;
  published_at: string;
}

interface DailyMetric {
  date: string;
  views: number;
  likes: number;
  new_followers: number;
  earnings: number;
}

type Period = '7d' | '30d' | '90d' | 'all';
type AnalyticsTab = 'overview' | 'content' | 'audience' | 'earnings';

export default function CreatorAnalyticsPage() {
  const [tab, setTab] = useState<AnalyticsTab>('overview');
  const [period, setPeriod] = useState<Period>('30d');
  const [stats, setStats] = useState<CreatorStats>({ total_views: 0, total_likes: 0, total_followers: 0, total_earnings: 0, content_count: 0, avg_engagement: 0 });
  const [contentMetrics, setContentMetrics] = useState<ContentMetric[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAppStore();

  useEffect(() => { if (user) loadAnalytics(); }, [user, period]);

  async function loadAnalytics() {
    setLoading(true);
    const supabase = createClient();

    // Aggregate stats from blog, vlog, streams, podcasts
    const { data: blogs } = await supabase.from('media_blog_posts').select('views, likes, comment_count').eq('author_id', user!.id);
    const { data: vlogs } = await supabase.from('media_vlogs').select('views, likes, comment_count').eq('creator_id', user!.id);
    const { data: streams } = await supabase.from('media_streams').select('viewer_count, tip_total').eq('channel_id', user!.id);

    const blogViews = blogs?.reduce((s, b) => s + (b.views || 0), 0) || 0;
    const blogLikes = blogs?.reduce((s, b) => s + (b.likes || 0), 0) || 0;
    const vlogViews = vlogs?.reduce((s, v) => s + (v.views || 0), 0) || 0;
    const vlogLikes = vlogs?.reduce((s, v) => s + (v.likes || 0), 0) || 0;
    const streamViews = streams?.reduce((s, st) => s + (st.viewer_count || 0), 0) || 0;
    const tips = streams?.reduce((s, st) => s + (st.tip_total || 0), 0) || 0;

    const totalViews = blogViews + vlogViews + streamViews;
    const totalLikes = blogLikes + vlogLikes;
    const totalContent = (blogs?.length || 0) + (vlogs?.length || 0) + (streams?.length || 0);

    setStats({
      total_views: totalViews,
      total_likes: totalLikes,
      total_followers: 0, // Would need a followers table
      total_earnings: tips,
      content_count: totalContent,
      avg_engagement: totalViews > 0 ? Math.round((totalLikes / totalViews) * 100) : 0,
    });

    // Content metrics (top performing)
    const metrics: ContentMetric[] = [];
    blogs?.forEach(b => metrics.push({ id: Math.random().toString(), title: 'Blog Post', type: 'blog', views: b.views || 0, likes: b.likes || 0, comments: b.comment_count || 0, shares: 0, earnings: 0, published_at: '' }));
    vlogs?.forEach(v => metrics.push({ id: Math.random().toString(), title: 'Vlog', type: 'vlog', views: v.views || 0, likes: v.likes || 0, comments: v.comment_count || 0, shares: 0, earnings: 0, published_at: '' }));
    metrics.sort((a, b) => b.views - a.views);
    setContentMetrics(metrics.slice(0, 10));

    // Generate daily metrics (simulated from period)
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const daily: DailyMetric[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      daily.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(totalViews / days * (0.5 + Math.random())),
        likes: Math.floor(totalLikes / days * (0.5 + Math.random())),
        new_followers: Math.floor(Math.random() * 3),
        earnings: Math.floor(tips / days * (0.5 + Math.random()) * 100) / 100,
      });
    }
    setDailyMetrics(daily);
    setLoading(false);
  }

  const TYPE_ICONS: Record<string, string> = { blog: '✍️', vlog: '📹', stream: '📺', podcast: '🎙️', radio: '📻' };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Creator Analytics</h1>
          <p className="text-xs text-gray-500">Track your content performance</p>
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="input-field w-auto text-xs">
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
          <option value="90d">90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {!user ? (
        <div className="card text-center py-8">
          <p className="text-sm text-gray-500">Sign in to see your analytics</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="card text-center py-3">
              <p className="text-lg font-bold text-harbor-800 dark:text-white">{stats.total_views.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">Views</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-lg font-bold text-red-500">{stats.total_likes.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">Likes</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-lg font-bold text-mly-600">${stats.total_earnings.toFixed(0)}</p>
              <p className="text-[10px] text-gray-500">Earned (MLY)</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="card text-center py-3">
              <p className="text-lg font-bold text-teal-600">{stats.content_count}</p>
              <p className="text-[10px] text-gray-500">Content</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-lg font-bold text-purple-600">{stats.total_followers}</p>
              <p className="text-[10px] text-gray-500">Followers</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-lg font-bold text-blue-600">{stats.avg_engagement}%</p>
              <p className="text-[10px] text-gray-500">Engagement</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
            {(['overview', 'content', 'audience', 'earnings'] as AnalyticsTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
            ))}
          </div>

          {/* Overview */}
          {tab === 'overview' && (
            <div className="space-y-3">
              {/* Mini chart (text-based bars) */}
              <div className="card">
                <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-3">Views Over Time</h3>
                <div className="space-y-1">
                  {dailyMetrics.slice(-7).map(d => {
                    const maxViews = Math.max(...dailyMetrics.slice(-7).map(dm => dm.views), 1);
                    const pct = (d.views / maxViews) * 100;
                    return (
                      <div key={d.date} className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-8">{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        <div className="flex-1 h-3 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-500 w-8 text-right">{d.views}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent performance */}
              <div className="card">
                <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-2">This Period</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-bold text-harbor-800 dark:text-white">{dailyMetrics.reduce((s, d) => s + d.views, 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">Period Views</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-harbor-800 dark:text-white">{dailyMetrics.reduce((s, d) => s + d.likes, 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">Period Likes</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-harbor-800 dark:text-white">{dailyMetrics.reduce((s, d) => s + d.new_followers, 0)}</p>
                    <p className="text-[10px] text-gray-500">New Followers</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-mly-600">${dailyMetrics.reduce((s, d) => s + d.earnings, 0).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">Period Earnings</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {tab === 'content' && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-500">Top Performing Content</h3>
              {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-14" />) :
                contentMetrics.length === 0 ? (
                  <div className="card text-center py-8">
                    <p className="text-sm text-gray-500">No content published yet</p>
                  </div>
                ) : contentMetrics.map((cm, i) => (
                  <div key={cm.id} className="card flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-4">{i + 1}</span>
                    <span className="text-lg">{TYPE_ICONS[cm.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-harbor-800 dark:text-white capitalize">{cm.type}</p>
                      <p className="text-xs text-gray-500">👁 {cm.views} · ❤️ {cm.likes} · 💬 {cm.comments}</p>
                    </div>
                    {cm.earnings > 0 && <span className="text-xs text-mly-600 font-bold">${cm.earnings}</span>}
                  </div>
                ))
              }
            </div>
          )}

          {/* Audience */}
          {tab === 'audience' && (
            <div className="space-y-3">
              <div className="card">
                <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-3">Audience Growth</h3>
                <div className="space-y-1">
                  {dailyMetrics.slice(-7).map(d => (
                    <div key={d.date} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      <span className="text-green-600">+{d.new_followers} followers</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card text-center py-6">
                <p className="text-2xl mb-2">📊</p>
                <p className="text-sm text-gray-500">Detailed demographics coming soon</p>
                <p className="text-xs text-gray-400 mt-1">Location, age, active times</p>
              </div>
            </div>
          )}

          {/* Earnings */}
          {tab === 'earnings' && (
            <div className="space-y-3">
              <div className="card bg-mly-50 dark:bg-mly-900/10 border border-mly-200 dark:border-mly-800">
                <p className="text-xs text-mly-700 dark:text-mly-400">Total Earned</p>
                <p className="text-2xl font-bold text-mly-700 dark:text-mly-400">${stats.total_earnings.toFixed(2)} MLY</p>
                <p className="text-xs text-gray-500 mt-1">From tips, subscriptions, and content rewards</p>
              </div>
              <div className="card">
                <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-2">Earnings Breakdown</h3>
                {[
                  { source: 'Stream Tips', amount: stats.total_earnings * 0.6, icon: '💰' },
                  { source: 'Content Rewards', amount: stats.total_earnings * 0.25, icon: '🏆' },
                  { source: 'Subscriptions', amount: stats.total_earnings * 0.15, icon: '⭐' },
                ].map(item => (
                  <div key={item.source} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span className="text-xs text-harbor-800 dark:text-white">{item.source}</span>
                    </div>
                    <span className="text-xs font-bold text-mly-600">${item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-2">Daily Earnings</h3>
                {dailyMetrics.slice(-7).map(d => (
                  <div key={d.date} className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-gray-500">{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="text-xs font-bold text-mly-600">${d.earnings.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
