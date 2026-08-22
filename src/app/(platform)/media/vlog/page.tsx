'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Vlog {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number;
  views: number;
  likes: number;
  tags: string[];
  created_at: string;
  published_at: string | null;
  profiles?: { display_name: string; avatar_url: string | null };
}

interface VlogChallenge {
  id: string;
  title: string;
  description: string;
  participant_count: number;
  deadline: string;
  created_at: string;
}

type VlogTab = 'feed' | 'record' | 'my-vlogs';

export default function MiVlogPage() {
  const [tab, setTab] = useState<VlogTab>('feed');
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [myVlogs, setMyVlogs] = useState<Vlog[]>([]);
  const [challenges, setChallenges] = useState<VlogChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  // Record state
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [vTitle, setVTitle] = useState('');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    loadFeed();
    loadChallenges();
  }, []);

  useEffect(() => {
    if (tab === 'my-vlogs' && user) loadMyVlogs();
  }, [tab, user]);

  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mediaStream]);

  async function loadFeed() {
    setLoading(true);
    const { data } = await supabase
      .from('vlogs')
      .select('*, profiles!vlogs_creator_id_fkey(display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setVlogs(data as Vlog[]);
    setLoading(false);
  }

  async function loadMyVlogs() {
    if (!user) return;
    const { data } = await supabase
      .from('vlogs')
      .select('*, profiles!vlogs_creator_id_fkey(display_name, avatar_url)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setMyVlogs(data as Vlog[]);
  }

  async function loadChallenges() {
    const { data } = await supabase
      .from('vlog_challenges')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setChallenges(data as VlogChallenge[]);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
    } catch {
      toast.error('Camera access denied');
    }
  }

  function stopRecording() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      setMediaStream(null);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  }

  async function postVlog() {
    if (!user || !vTitle.trim()) return;
    const { error } = await supabase.from('vlogs').insert({
      creator_id: user.id,
      title: vTitle.trim(),
      description: '',
      duration: recordTime,
      views: 0,
      likes: 0,
      tags: [],
      published_at: new Date().toISOString(),
    });

    if (error) {
      toast.error('Failed to post vlog');
    } else {
      toast.success('Vlog posted!');
      setVTitle('');
      setRecordTime(0);
      setTab('feed');
      loadFeed();
    }
  }

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function timeAgo(date: string): string {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">MiVlog</h1>
          <p className="text-xs text-gray-500">Daily video journals &amp; day-in-the-life</p>
        </div>
        {user && (
          <button onClick={() => setTab('record')} className="btn-teal text-xs">
            📹 Record
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {([
          { key: 'feed' as VlogTab, label: 'Feed' },
          { key: 'record' as VlogTab, label: 'Record' },
          { key: 'my-vlogs' as VlogTab, label: 'My Vlogs' },
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

      {/* Feed Tab */}
      {tab === 'feed' && (
        <div className="space-y-4">
          {/* Challenges Section */}
          {challenges.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-harbor-800 dark:text-white">🏆 Challenges</h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {challenges.map(ch => (
                  <div key={ch.id} className="card min-w-[200px] flex-shrink-0">
                    <p className="text-xs font-bold text-harbor-800 dark:text-white">{ch.title}</p>
                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{ch.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-gray-400">{ch.participant_count} participants</span>
                      <button className="text-[10px] px-2 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded-lg">
                        Participate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vlog Grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[9/16] rounded-xl animate-pulse bg-gray-100 dark:bg-harbor-800" />
              ))}
            </div>
          ) : vlogs.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-3xl mb-2">📹</p>
              <p className="text-sm text-gray-500">No vlogs yet</p>
              <p className="text-xs text-gray-400 mt-1">Record your first day-in-the-life vlog</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {vlogs.map(vlog => (
                <div key={vlog.id} className="relative aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden">
                  {vlog.thumbnail_url ? (
                    <img src={vlog.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl">📹</span>
                    </div>
                  )}
                  <span className="absolute top-2 right-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                    {formatDuration(vlog.duration)}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-2">
                    <p className="text-white text-xs font-medium line-clamp-2">{vlog.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-300">
                      <span>{(vlog.profiles as any)?.display_name}</span>
                      <span>👁 {vlog.views}</span>
                      <span>❤️ {vlog.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Record Tab */}
      {tab === 'record' && (
        <div className="card space-y-4 border-2 border-teal-200 dark:border-teal-800">
          <div className="aspect-[9/16] max-h-72 bg-gray-900 rounded-xl overflow-hidden relative mx-auto">
            {mediaStream ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <p className="text-4xl">📹</p>
                <p className="text-white text-xs mt-2">Tap to start recording</p>
              </div>
            )}
            {recording && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-xs font-mono">{formatDuration(recordTime)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {!recording ? (
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-red-500 border-4 border-white shadow-lg flex items-center justify-center"
              >
                <span className="w-6 h-6 bg-white rounded-full" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-500 border-4 border-white shadow-lg flex items-center justify-center"
              >
                <span className="w-5 h-5 bg-white rounded-sm" />
              </button>
            )}
          </div>

          {!recording && recordTime > 0 && (
            <div className="space-y-3">
              <input
                value={vTitle}
                onChange={e => setVTitle(e.target.value)}
                placeholder="Vlog title (e.g., Day in my life #12)"
                className="input-field"
              />
              <button
                onClick={postVlog}
                disabled={!vTitle.trim()}
                className="btn-teal w-full disabled:opacity-50"
              >
                Post Vlog ({formatDuration(recordTime)})
              </button>
            </div>
          )}

          <p className="text-[10px] text-gray-400 text-center">
            Template: &quot;Day in the life&quot; · Diary-style chronological format
          </p>
        </div>
      )}

      {/* My Vlogs Tab */}
      {tab === 'my-vlogs' && (
        <div className="space-y-3">
          {!user ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">Sign in to see your vlogs</p>
            </div>
          ) : myVlogs.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">📹</p>
              <p className="text-sm text-gray-500">No vlogs posted yet</p>
              <button onClick={() => setTab('record')} className="btn-teal text-xs mt-3">Record First Vlog</button>
            </div>
          ) : (
            myVlogs.map(vlog => (
              <div key={vlog.id} className="card flex items-center gap-3">
                <div className="w-16 h-20 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {vlog.thumbnail_url ? (
                    <img src={vlog.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">📹</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{vlog.title}</p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                    <span>👁 {vlog.views}</span>
                    <span>❤️ {vlog.likes}</span>
                    <span>{formatDuration(vlog.duration)}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {vlog.published_at ? timeAgo(vlog.published_at) : 'Draft'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
