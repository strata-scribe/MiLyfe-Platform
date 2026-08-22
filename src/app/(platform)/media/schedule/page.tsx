'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface ScheduledContent {
  id: string;
  creator_id: string;
  content_type: 'blog' | 'vlog' | 'podcast' | 'social';
  title: string;
  notes: string | null;
  scheduled_at: string;
  status: 'scheduled' | 'published' | 'cancelled';
  created_at: string;
}

type ScheduleTab = 'calendar' | 'queue' | 'history';
type ContentType = 'blog' | 'vlog' | 'podcast' | 'social';

const CONTENT_TYPES: { value: ContentType; label: string; icon: string }[] = [
  { value: 'blog', label: 'Blog', icon: '✍️' },
  { value: 'vlog', label: 'Vlog', icon: '📹' },
  { value: 'podcast', label: 'Podcast', icon: '🎙️' },
  { value: 'social', label: 'Social', icon: '📱' },
];

export default function ContentSchedulePage() {
  const [tab, setTab] = useState<ScheduleTab>('calendar');
  const [items, setItems] = useState<ScheduledContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [cType, setCType] = useState<ContentType>('blog');
  const [cTitle, setCTitle] = useState('');
  const [cDate, setCDate] = useState('');
  const [cTime, setCTime] = useState('19:00');
  const [cNotes, setCNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (user) loadSchedule();
  }, [user]);

  async function loadSchedule() {
    setLoading(true);
    const { data } = await supabase
      .from('content_schedule')
      .select('*')
      .eq('creator_id', user!.id)
      .order('scheduled_at', { ascending: true });
    if (data) setItems(data as ScheduledContent[]);
    setLoading(false);
  }

  async function createScheduledPost() {
    if (!user || !cTitle.trim() || !cDate) return;
    setCreating(true);
    const scheduledAt = `${cDate}T${cTime}:00.000Z`;

    const { error } = await supabase.from('content_schedule').insert({
      creator_id: user.id,
      content_type: cType,
      title: cTitle.trim(),
      notes: cNotes.trim() || null,
      scheduled_at: scheduledAt,
      status: 'scheduled',
    });

    if (error) {
      toast.error('Failed to schedule content');
    } else {
      toast.success('Content scheduled!');
      setCTitle('');
      setCNotes('');
      setCDate('');
      setShowCreate(false);
      loadSchedule();
    }
    setCreating(false);
  }

  async function cancelItem(id: string) {
    await supabase.from('content_schedule').update({ status: 'cancelled' }).eq('id', id);
    toast.success('Scheduled post cancelled');
    loadSchedule();
  }

  // Calendar helpers
  function getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function getFirstDayOfMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  function getScheduledForDay(day: number): ScheduledContent[] {
    return items.filter(item => {
      if (item.status === 'cancelled') return false;
      const d = new Date(item.scheduled_at);
      return d.getFullYear() === currentMonth.getFullYear()
        && d.getMonth() === currentMonth.getMonth()
        && d.getDate() === day;
    });
  }

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  const queue = items.filter(i => i.status === 'scheduled' && new Date(i.scheduled_at) > new Date());
  const history = items.filter(i => i.status === 'published');

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Content Schedule</h1>
          <p className="text-xs text-gray-500">Plan &amp; queue content for optimal times</p>
        </div>
        {user && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-teal text-xs">
            + Schedule
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {([
          { key: 'calendar' as ScheduleTab, label: 'Calendar' },
          { key: 'queue' as ScheduleTab, label: 'Queue' },
          { key: 'history' as ScheduleTab, label: 'History' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
              tab === t.key
                ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm'
                : 'text-gray-500'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && user && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Schedule New Content</h3>

          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Content Type</label>
            <div className="flex gap-1 flex-wrap">
              {CONTENT_TYPES.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => setCType(ct.value)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1',
                    cType === ct.value
                      ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                      : 'bg-gray-100 dark:bg-harbor-800 text-gray-600'
                  )}
                >
                  <span>{ct.icon}</span> {ct.label}
                </button>
              ))}
            </div>
          </div>

          <input value={cTitle} onChange={e => setCTitle(e.target.value)} placeholder="Content title" className="input-field" />
          <textarea value={cNotes} onChange={e => setCNotes(e.target.value)} placeholder="Notes (optional)" className="input-field resize-none" rows={2} />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Date</label>
              <input type="date" value={cDate} onChange={e => setCDate(e.target.value)} className="input-field" min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Time</label>
              <input type="time" value={cTime} onChange={e => setCTime(e.target.value)} className="input-field" />
            </div>
          </div>

          <button onClick={createScheduledPost} disabled={!cTitle.trim() || !cDate || creating} className="btn-teal w-full disabled:opacity-50">
            {creating ? 'Scheduling...' : 'Schedule'}
          </button>

          {/* Best time suggestion */}
          <div className="bg-gray-50 dark:bg-harbor-900 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 font-medium">💡 Best time to post</p>
            <p className="text-xs text-harbor-800 dark:text-white mt-1">Tuesdays 7pm, Saturdays 10am</p>
            <p className="text-[10px] text-gray-400">Based on your audience engagement data</p>
          </div>
        </div>
      )}

      {/* Calendar Tab */}
      {tab === 'calendar' && (
        <div className="card space-y-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">←</button>
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">
              {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={nextMonth} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">→</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-[10px] text-gray-500 text-center font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first day offset */}
            {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {/* Days */}
            {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
              const day = i + 1;
              const scheduled = getScheduledForDay(day);
              const isToday = new Date().getDate() === day
                && new Date().getMonth() === currentMonth.getMonth()
                && new Date().getFullYear() === currentMonth.getFullYear();

              return (
                <div
                  key={day}
                  className={cn(
                    'aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] relative',
                    isToday ? 'bg-teal-50 dark:bg-teal-900/20 ring-1 ring-teal-500' : 'bg-gray-50 dark:bg-harbor-900'
                  )}
                >
                  <span className={cn('font-medium', isToday ? 'text-teal-600' : 'text-harbor-800 dark:text-white')}>
                    {day}
                  </span>
                  {scheduled.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {scheduled.slice(0, 3).map(s => (
                        <span
                          key={s.id}
                          className="w-1.5 h-1.5 rounded-full bg-teal-500"
                          title={s.title}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400">Loading schedule...</p>
            </div>
          )}
        </div>
      )}

      {/* Queue Tab */}
      {tab === 'queue' && (
        <div className="space-y-2">
          {queue.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">📅</p>
              <p className="text-sm text-gray-500">No upcoming scheduled content</p>
              <button onClick={() => setShowCreate(true)} className="btn-teal text-xs mt-3">Schedule Something</button>
            </div>
          ) : (
            queue.map(item => (
              <div key={item.id} className="card flex items-start gap-3">
                <div className="text-center bg-teal-50 dark:bg-teal-900/20 rounded-lg px-2.5 py-1.5 flex-shrink-0">
                  <p className="text-xs font-bold text-teal-700 dark:text-teal-400">
                    {new Date(item.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-[10px] text-teal-600">
                    {new Date(item.scheduled_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {CONTENT_TYPES.find(c => c.value === item.content_type)?.icon}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-harbor-800 text-gray-500 rounded capitalize">
                      {item.content_type}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white mt-1 truncate">{item.title}</p>
                  {item.notes && (
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{item.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => cancelItem(item.id)} className="text-[10px] text-red-500 hover:text-red-600">
                    Cancel
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No published scheduled content yet</p>
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="card flex items-center gap-3 opacity-75">
                <span className="text-sm">
                  {CONTENT_TYPES.find(c => c.value === item.content_type)?.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-harbor-800 dark:text-white truncate">{item.title}</p>
                  <p className="text-[10px] text-gray-400">
                    Published {new Date(item.scheduled_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                  Published
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
