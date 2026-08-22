'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Vlog {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number;
  status: 'draft' | 'processing' | 'published';
  views: number;
  likes: number;
  comment_count: number;
  tags: string[];
  day_number: number;
  series_title: string | null;
  created_at: string;
  published_at: string | null;
  profiles?: { display_name: string; avatar_url: string | null };
}

type VlogTab = 'feed' | 'trending' | 'record' | 'my';

export default function MiVlogPage() {
  const [tab, setTab] = useState<VlogTab>('feed');
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Record form
  const [showRecord, setShowRecord] = useState(false);
  const [vTitle, setVTitle] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vSeries, setVSeries] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  const { user } = useAppStore();

  useEffect(() => { loadVlogs(); }, [tab]);

  async function loadVlogs() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('media_vlogs').select('*, profiles!media_vlogs_creator_id_fkey(display_name, avatar_url)').eq('status', 'published');

    if (tab === 'trending') query = query.order('views', { ascending: false });
    else query = query.order('published_at', { ascending: false });

    if (tab === 'my' && user) query = supabase.from('media_vlogs').select('*, profiles!media_vlogs_creator_id_fkey(display_name, avatar_url)').eq('creator_id', user.id).order('created_at', { ascending: false });

    const { data } = await query.limit(20);
    if (data) setVlogs(data as any);
    setLoading(false);
  }

  async function publishVlog() {
    if (!user || !vTitle.trim()) return;
    const supabase = createClient();

    // Get current day number
    const { count } = await supabase.from('media_vlogs').select('*', { count: 'exact', head: true }).eq('creator_id', user.id);
    const dayNum = (count || 0) + 1;

    await supabase.from('media_vlogs').insert({
      creator_id: user.id, title: vTitle.trim(), description: vDesc.trim(),
      duration: recordTime, status: 'published', views: 0, likes: 0,
      comment_count: 0, tags: [], day_number: dayNum,
      series_title: vSeries.trim() || null, published_at: new Date().toISOString(),
    });
    setVTitle(''); setVDesc(''); setVSeries(''); setRecordTime(0);
    setShowRecord(false); setRecording(false);
    loadVlogs();
  }

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  // Simulate recording timer
  useEffect(() => {
    if (!recording) return;
    const interval = setInterval(() => setRecordTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [recording]);

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">MiVlog</h1>
          <p className="text-xs text-gray-500">Daily video journals</p>
        </div>
        {user && <button onClick={() => setShowRecord(!showRecord)} className="btn-teal text-xs">📹 Record</button>}
      </div>

      {/* Record Interface */}
      {showRecord && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          {/* Viewfinder */}
          <div className="aspect-[9/16] max-h-64 bg-gray-900 rounded-xl flex items-center justify-center relative mx-auto">
            {recording ? (
              <div className="text-center">
                <p className="text-red-500 text-xs animate-pulse">● REC</p>
                <p className="text-white text-2xl font-mono mt-2">{formatDuration(recordTime)}</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-4xl">📹</p>
                <p className="text-white text-xs mt-2">Tap record to start</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setRecording(!recording)}
              className={cn('w-14 h-14 rounded-full flex items-center justify-center border-4', recording ? 'border-red-500 bg-red-500' : 'border-white bg-red-500')}
            >
              {recording ? <span className="w-5 h-5 bg-white rounded-sm" /> : <span className="w-8 h-8 bg-white rounded-full" />}
            </button>
          </div>

          {recordTime > 0 && !recording && (
            <>
              <input value={vTitle} onChange={e => setVTitle(e.target.value)} placeholder="Vlog title (e.g., Day in my life)" className="input-field" />
              <input value={vDesc} onChange={e => setVDesc(e.target.value)} placeholder="Description (optional)" className="input-field" />
              <input value={vSeries} onChange={e => setVSeries(e.target.value)} placeholder="Series name (optional)" className="input-field" />
              <button onClick={publishVlog} disabled={!vTitle.trim()} className="btn-teal w-full disabled:opacity-50">Publish Vlog ({formatDuration(recordTime)})</button>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['feed', 'trending', 'record', 'my'] as VlogTab[]).map(t => (
          <button key={t} onClick={() => t === 'record' ? setShowRecord(true) : setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t && t !== 'record' ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'my' ? 'My Vlogs' : t}</button>
        ))}
      </div>

      {/* Vlog Feed */}
      {(tab === 'feed' || tab === 'trending' || tab === 'my') && (
        <div className="space-y-3">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-64" />) :
            vlogs.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">📹</p>
                <p className="text-sm text-gray-500">{tab === 'my' ? 'You haven\'t posted any vlogs yet' : 'No vlogs yet'}</p>
                <p className="text-xs text-gray-400 mt-1">Record your first daily vlog!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {vlogs.map(vlog => (
                  <button key={vlog.id} onClick={() => setPlayingId(playingId === vlog.id ? null : vlog.id)} className="text-left">
                    <div className="aspect-[9/16] bg-gray-900 rounded-xl relative overflow-hidden">
                      {vlog.thumbnail_url ? (
                        <img src={vlog.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl">📹</span>
                        </div>
                      )}
                      {playingId === vlog.id && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-3xl">▶️</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-2">
                        <p className="text-white text-xs font-medium line-clamp-2">{vlog.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-gray-300">{(vlog.profiles as any)?.display_name}</span>
                        </div>
                      </div>
                      <span className="absolute top-2 right-2 text-[10px] bg-black/60 text-white px-1 rounded">{formatDuration(vlog.duration)}</span>
                      {vlog.day_number && <span className="absolute top-2 left-2 text-[10px] bg-teal-500 text-white px-1.5 py-0.5 rounded font-bold">Day {vlog.day_number}</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                      <span>👁 {vlog.views}</span>
                      <span>❤️ {vlog.likes}</span>
                      <span>{vlog.published_at ? timeAgo(vlog.published_at) : ''}</span>
                    </div>
                  </button>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}
