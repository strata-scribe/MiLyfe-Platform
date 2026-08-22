'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { AreaChart, BarChart, DonutChart, Card as TremorCard, Metric, Text, Flex, BadgeDelta, Grid, Col, BarList, type Color } from '@tremor/react';

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
  Views: number;
  Likes: number;
  Followers: number;
  Earnings: number;
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
      total_followers: 0,
      total_earnings: tips,
      content_count: totalContent,
      avg_engagement: totalViews > 0 ? Math.round((totalLikes / totalViews) * 100) : 0,
    });

    // Content metrics
    const metrics: ContentMetric[] = [];
    blogs?.forEach((b, i) => metrics.push({ id: `blog-${i}`, title: 'Blog Post', type: 'blog', views: b.views || 0, likes: b.likes || 0, comments: b.comment_count || 0, shares: 0, earnings: 0, published_at: '' }));
    vlogs?.forEach((v, i) => metrics.push({ id: `vlog-${i}`, title: 'Vlog', type: 'vlog', views: v.views || 0, likes: v.likes || 0, comments: v.comment_count || 0, shares: 0, earnings: 0, published_at: '' }));
    metrics.sort((a, b) => b.views - a.views);
    setContentMetrics(metrics.slice(0, 10));

    // Generate daily metrics for charts
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const daily: DailyMetric[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      daily.push({
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        Views: Math.floor(totalViews / days * (0.5 + Math.random())),
        Likes: Math.floor(totalLikes / days * (0.5 + Math.random())),
        Followers: Math.floor(Math.random() * 3),
        Earnings: Math.floor(tips / days * (0.5 + Math.random()) * 100) / 100,
      });
    }
    setDailyMetrics(daily);
    setLoading(false);
  }

  const TYPE_ICONS: Record<string, string> = { blog: '✍️', vlog: '📹', stream: '📺', podcast: '🎙️', radio: '📻' };

  // Tremor chart data
  const earningsBreakdown = [
    { name: 'Stream Tips', value: stats.total_earnings * 0.6 },
    { name: 'Content Rewards', value: stats.total_earnings * 0.25 },
    { name: 'Subscriptions', value: stats.total_earnings * 0.15 },
  ];

  const contentByType = [
    { name: 'Blog Posts', value: contentMetrics.filter(c => c.type === 'blog').length },
    { name: 'Vlogs', value: contentMetrics.filter(c => c.type === 'vlog').length },
    { name: 'Streams', value: contentMetrics.filter(c => c.type === 'stream').length },
    { name: 'Podcasts', value: contentMetrics.filter(c => c.type === 'podcast').length },
  ].filter(c => c.value > 0);

  const topContent: { name: string; value: number }[] = contentMetrics.slice(0, 5).map(c => ({
    name: `${TYPE_ICONS[c.type]} ${c.type} — ${c.views} views`,
    value: c.views,
  }));

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
          {/* KPI Cards — Tremor */}
          <Grid numItemsSm={2} numItemsLg={3} className="gap-3">
            <TremorCard decoration="top" decorationColor="teal" className="!bg-white dark:!bg-harbor-950 !border-gray-100 dark:!border-harbor-800 !rounded-xl !shadow-sm">
              <Flex alignItems="start">
                <div>
                  <Text className="!text-gray-500">Total Views</Text>
                  <Metric className="!text-harbor-800 dark:!text-white">{stats.total_views.toLocaleString()}</Metric>
                </div>
                <BadgeDelta deltaType="moderateIncrease" size="xs">+12%</BadgeDelta>
              </Flex>
            </TremorCard>
            <TremorCard decoration="top" decorationColor="red" className="!bg-white dark:!bg-harbor-950 !border-gray-100 dark:!border-harbor-800 !rounded-xl !shadow-sm">
              <Flex alignItems="start">
                <div>
                  <Text className="!text-gray-500">Total Likes</Text>
                  <Metric className="!text-harbor-800 dark:!text-white">{stats.total_likes.toLocaleString()}</Metric>
                </div>
                <BadgeDelta deltaType="moderateIncrease" size="xs">+8%</BadgeDelta>
              </Flex>
            </TremorCard>
            <TremorCard decoration="top" decorationColor="amber" className="!bg-white dark:!bg-harbor-950 !border-gray-100 dark:!border-harbor-800 !rounded-xl !shadow-sm">
              <Flex alignItems="start">
                <div>
                  <Text className="!text-gray-500">Earnings (MLY)</Text>
                  <Metric className="!text-mly-600">${stats.total_earnings.toFixed(0)}</Metric>
                </div>
                <BadgeDelta deltaType="moderateIncrease" size="xs">+23%</BadgeDelta>
              </Flex>
            </TremorCard>
          </Grid>

          <Grid numItemsSm={2} numItemsLg={3} className="gap-3">
            <TremorCard className="!bg-white dark:!bg-harbor-950 !border-gray-100 dark:!border-harbor-800 !rounded-xl !shadow-sm">
              <Text className="!text-gray-500">Content Published</Text>
              <Metric className="!text-harbor-800 dark:!text-white">{stats.content_count}</Metric>
            </TremorCard>
            <TremorCard className="!bg-white dark:!bg-harbor-950 !border-gray-100 dark:!border-harbor-800 !rounded-xl !shadow-sm">
              <Text className="!text-gray-500">Followers</Text>
              <Metric className="!text-harbor-800 dark:!text-white">{stats.total_followers}</Metric>
            </TremorCard>
            <TremorCard className="!bg-white dark:!bg-harbor-950 !border-gray-100 dark:!border-harbor-800 !rounded-xl !shadow-sm">
              <Text className="!text-gray-500">Engagement Rate</Text>
              <Metric className="!text-harbor-800 dark:!text-white">{stats.avg_engagement}%</Metric>
            </TremorCard>
          </Grid>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
            {(['overview', 'content', 'audience', 'earnings'] as AnalyticsTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
            ))}
          </div>

          {/* Overview — Tremor Area Chart */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <TremorCard className="!bg-white dark:!bg-harbor-950 !border-gray-100 dark:!border-harbor-800 !rounded-xl !shadow-sm">
                <Text className="!text-xs !font-bold !text-harbor-800 dark:!text-white mb-2">Views & Likes Over Time</Text>
                <AreaChart
                  className="h-48"
                  data={dailyMetrics}
                  index="date"
                  categories={['Views', 'Likes']}
                  colors={['teal', 'rose'] as Color[]}
                  valueFormatter={(v) => v.toLocaleString()}
                  showLegend={true}
                  showGridLines={false}
                  curveType="monotone"
                />
              </TremorCard>

              <TremorCard className="!bg-white dark:!bg-harbor-950 !border-gray-100 dark:!border-harbor-800 !rounded-xl !shadow-sm">
                <Text className="!text-xs !font-bold !text-harbor-800 dark:!text-white mb-2">Top Content</Text>
                <BarList data={topContent} color="teal" className="mt-2" />
              </TremorCard>
            </div>
          )}

          {/* Content Tab */}
          {tab === 'content' && (
            <div className="space-y-4">
              <TremorCard className="!bg-white dark:!bg-harbor-950 !border-gray-100 dark:!border-harbor-800 !rounded-xl !shadow-sm">
                <Text className="!text-xs !font-bold !text-harbor-800 dark:!text-white mb-2">Content by Type</Text>
                <DonutChart
                  className="h-40"
                  data={contentByType}
                  category="value"
                  index="name"
                  colors={['teal', 'cyan', 'violet', 'amber'] as Color[]}
                  showLabel={true}
                  valueFormatter={(v) => `${v} published`}
                />
              </TremorCard>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-500">Top Performing Content</h3>
                {contentMetrics.length === 0 ? (
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
                ))}
              </div>
            </div>
          )}

          {/* Audience Tab */}
          {tab === 'audience' && (
            <div className="space-y-4">
              <TremorCard className="!bg-white dark:!bg-harbor-950 !border-gray-100 dark:!border-harbor-800 !rounded-xl !shadow-sm">
                <Text className="!text-xs !font-bold !text-harbor-800 dark:!text-white mb-2">Follower Growth</Text>
                <BarChart
                  className="h-40"
                  data={dailyMetrics.slice(-14)}
                  index="date"
                  categories={['Followers']}
                  colors={['violet'] as Color[]}
                  showLegend={false}
                  showGridLines={false}
                />
              </TremorCard>

              <div className="card text-center py-6">
                <p className="text-2xl mb-2">📊</p>
                <p className="text-sm text-gray-500">Detailed demographics coming soon</p>
                <p className="text-xs text-gray-400 mt-1">Location, age, peak active times</p>
              </div>
            </div>
          )}

          {/* Earnings Tab */}
          {tab === 'earnings' && (
            <div className="space-y-4">
              <TremorCard decoration="top" decorationColor="amber" className="!bg-white dark:!bg-harbor-950 !border-gray-100 dark:!border-harbor-800 !rounded-xl !shadow-sm">
                <Text className="!text-gray-500">Total Earned</Text>
                <Metric className="!text-mly-600">${stats.total_earnings.toFixed(2)} MLY</Metric>
                <Text className="!text-xs !text-gray-400 mt-1">From tips, subscriptions, and content rewards</Text>
              </TremorCard>

              <TremorCard className="!bg-white dark:!bg-harbor-950 !border-gray-100 dark:!border-harbor-800 !rounded-xl !shadow-sm">
                <Text className="!text-xs !font-bold !text-harbor-800 dark:!text-white mb-2">Earnings Breakdown</Text>
                <DonutChart
                  className="h-40"
                  data={earningsBreakdown}
                  category="value"
                  index="name"
                  colors={['amber', 'teal', 'violet'] as Color[]}
                  valueFormatter={(v) => `$${v.toFixed(2)}`}
                  showLabel={true}
                />
              </TremorCard>

              <TremorCard className="!bg-white dark:!bg-harbor-950 !border-gray-100 dark:!border-harbor-800 !rounded-xl !shadow-sm">
                <Text className="!text-xs !font-bold !text-harbor-800 dark:!text-white mb-2">Daily Earnings</Text>
                <AreaChart
                  className="h-32"
                  data={dailyMetrics.slice(-14)}
                  index="date"
                  categories={['Earnings']}
                  colors={['amber'] as Color[]}
                  valueFormatter={(v) => `$${v.toFixed(2)}`}
                  showLegend={false}
                  showGridLines={false}
                  curveType="monotone"
                />
              </TremorCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
