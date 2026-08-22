'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface ScheduledPost {
  id: string;
  creator_id: string;
  type: 'blog' | 'social' | 'vlog' | 'podcast' | 'forum';
  title: string;
  content_preview: string;
  scheduled_for: string;
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  platform_data: Record<string, any>;
  created_at: string;
}

type ScheduleTab = 'upcoming' | 'published' | 'create';
type ContentType = 'blog' | 'social' | 'vlog' | 'podcast' | 'forum';

const CONTENT_TYPES: { value: ContentType; label: string; icon: string }[] = [
  { value: 'blog', label: 'Blog Post', icon: '✍️' },
  { value: 'social', label: 'Social Post', icon: '📱' },
  { value: 'vlog', label: 'Vlog', icon: '📹' },
  { value: 'podcast', label: 'Podcast Episode', icon: '🎙️' },
  { value: 'forum', label: 'Forum Post', icon: '💬' },
];

const OPTIMAL_TIMES = [
  { time: '08:00', label: 'Morning (8 AM)', reason: 'High engagement from commuters' },
  { time: '12:00', label: 'Noon (12 PM)', reason: 'Lunch break browsing peak' },
  { time: '17:00', label: 'Evening (5 PM)', reason: 'Post-work scroll time' },
  { time: '20:00', label: 'Night (8 PM)', reason: 'Relaxation & discovery' },
];

export default function ContentSchedulePage() {
  const [tab, setTab] = useState<ScheduleTab>('upcoming');
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [type, setType] = useState<ContentType>('blog');
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('12:00');
  const [creating, setCreating] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    if (user) {
      const { data } = await supabase.from('media_scheduled_posts').select('*').eq('creator_id', user.id).order('scheduled_for', { ascending: true });
      if (data) setPosts(data);
    }
    setLoading(false);
  }

  async function schedulePost() {
    if (!user || !title.trim() || !schedDate) return;
    setCreating(true);
    const supabase = createClient();
    const scheduledFor = `${schedDate}T${schedTime}:00.000Z`;
    await supabase.from('media_scheduled_posts').insert({
      creator_id: user.id, type, title: title.trim(),
      content_preview: preview.trim(), scheduled_for: scheduledFor,
      status: 'scheduled', platform_data: {},
    });
    setTitle(''); setPreview(''); setSchedDate('');
    setCreating(false);
    toast.success('Post scheduled!');
    setTab('upcoming');
    loadData();
  }

  async function cancelPost(postId: string) {
    const supabase = createClient();
    await supabase.from('media_scheduled_posts').update({ status: 'cancelled' }).eq('id', postId);
    toast.success('Post cancelled');
    loadData();
  }

  const upcoming = posts.filter(p => p.status === 'scheduled');
  const published = posts.filter(p => p.status === 'published');

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Content Schedule</h1>
        <p className="text-xs text-gray-500">Plan & queue content for optimal times</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card text-center py-2.5">
          <p className="text-lg font-bold text-harbor-800 dark:text-white">{upcoming.length}</p>
          <p className="text-[9px] text-gray-400">Scheduled</p>
        </div>
        <div className="card text-center py-2.5">
          <p className="text-lg font-bold text-green-600">{published.length}</p>
          <p className="text-[9px] text-gray-400">Published</p>
        </div>
        <div className="card text-center py-2.5">
          <p className="text-lg font-bold text-teal-600">{posts.length}</p>
          <p className="text-[9px] text-gray-400">Total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['upcoming', 'published', 'create'] as ScheduleTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'create' ? '+ Schedule' : t}</button>
        ))}
      </div>

      {/* Upcoming */}
      {tab === 'upcoming' && (
        <div className="space-y-2">
          {upcoming.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">📅</p>
              <p className="text-sm text-gray-500">No scheduled posts</p>
              <p className="text-xs text-gray-400 mt-1">Queue content for your audience&apos;s peak times</p>
              <button onClick={() => setTab('create')} className="btn-teal text-xs mt-3">Schedule Post</button>
            </div>
          ) : upcoming.map(post => (
            <div key={post.id} className="card flex items-start gap-3">
              <div className="text-center bg-teal-50 dark:bg-teal-900/20 rounded-lg px-2.5 py-1.5 flex-shrink-0">
                <p className="text-xs font-bold text-teal-700 dark:text-teal-400">{new Date(post.scheduled_for).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                <p className="text-[10px] text-teal-600">{new Date(post.scheduled_for).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{CONTENT_TYPES.find(c => c.value === post.type)?.icon}</span>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{post.title}</p>
                </div>
                {post.content_preview && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{post.content_preview}</p>}
              </div>
              <button onClick={() => cancelPost(post.id)} className="text-[10px] text-red-500 hover:text-red-600">Cancel</button>
            </div>
          ))}
        </div>
      )}

      {/* Published */}
      {tab === 'published' && (
        <div className="space-y-2">
          {published.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No published posts from schedule yet</p>
            </div>
          ) : published.map(post => (
            <div key={post.id} className="card flex items-center gap-3 opacity-75">
              <span className="text-sm">{CONTENT_TYPES.find(c => c.value === post.type)?.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-harbor-800 dark:text-white truncate">{post.title}</p>
                <p className="text-[10px] text-gray-400">Published {new Date(post.scheduled_for).toLocaleDateString()}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded">✓ Published</span>
            </div>
          ))}
        </div>
      )}

      {/* Create */}
      {tab === 'create' && user && (
        <div className="space-y-3">
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Schedule New Content</h3>

            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Content Type</label>
              <div className="flex gap-1 flex-wrap">
                {CONTENT_TYPES.map(ct => (
                  <button key={ct.value} onClick={() => setType(ct.value)} className={cn('px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors', type === ct.value ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>
                    <span>{ct.icon}</span> {ct.label}
                  </button>
                ))}
              </div>
            </div>

            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title" className="input-field" />
            <textarea value={preview} onChange={e => setPreview(e.target.value)} placeholder="Content preview / description" className="input-field resize-none" rows={3} />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Date</label>
                <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} className="input-field" min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Time</label>
                <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} className="input-field" />
              </div>
            </div>

            <button onClick={schedulePost} disabled={!title.trim() || !schedDate || creating} className="btn-teal w-full disabled:opacity-50">
              {creating ? 'Scheduling...' : 'Schedule Post'}
            </button>
          </div>

          {/* Optimal Times */}
          <div className="card">
            <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-2">💡 Best Times to Post</h3>
            <div className="space-y-1.5">
              {OPTIMAL_TIMES.map(ot => (
                <button key={ot.time} onClick={() => setSchedTime(ot.time)} className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-harbor-900 transition-colors text-left">
                  <div>
                    <p className="text-xs text-harbor-800 dark:text-white">{ot.label}</p>
                    <p className="text-[10px] text-gray-400">{ot.reason}</p>
                  </div>
                  <span className="text-[10px] text-teal-600">Use →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
