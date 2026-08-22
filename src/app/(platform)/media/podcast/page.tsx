'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface PodcastShow {
  id: string;
  host_id: string;
  title: string;
  description: string;
  cover_art: string | null;
  category: string;
  episode_count: number;
  subscriber_count: number;
  rss_feed_url: string | null;
  created_at: string;
  profiles?: { display_name: string };
}

interface Episode {
  id: string;
  show_id: string;
  title: string;
  description: string;
  audio_url: string | null;
  duration: number;
  plays: number;
  show_notes: string | null;
  published_at: string | null;
  created_at: string;
  podcast_shows?: { title: string; cover_art: string | null };
}

type PodcastTab = 'shows' | 'episodes' | 'my-shows';

export default function PodcastHostingPage() {
  const [tab, setTab] = useState<PodcastTab>('shows');
  const [shows, setShows] = useState<PodcastShow[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [myShows, setMyShows] = useState<PodcastShow[]>([]);
  const [loading, setLoading] = useState(true);

  // Create show form
  const [showCreate, setShowCreate] = useState(false);
  const [sTitle, setSTitle] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sCategory, setSCategory] = useState('Community');
  const [sCoverFile, setSCoverFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  // Add episode form
  const [showAddEp, setShowAddEp] = useState(false);
  const [epShowId, setEpShowId] = useState('');
  const [epTitle, setEpTitle] = useState('');
  const [epDesc, setEpDesc] = useState('');
  const [epNotes, setEpNotes] = useState('');
  const [epAudioFile, setEpAudioFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    loadShows();
    loadEpisodes();
  }, []);

  useEffect(() => {
    if (tab === 'my-shows' && user) loadMyShows();
  }, [tab, user]);

  async function loadShows() {
    setLoading(true);
    const { data } = await supabase
      .from('podcast_shows')
      .select('*, profiles!podcast_shows_host_id_fkey(display_name)')
      .order('subscriber_count', { ascending: false })
      .limit(20);
    if (data) setShows(data as PodcastShow[]);
    setLoading(false);
  }

  async function loadEpisodes() {
    const { data } = await supabase
      .from('podcast_episodes')
      .select('*, podcast_shows!podcast_episodes_show_id_fkey(title, cover_art)')
      .order('published_at', { ascending: false })
      .limit(20);
    if (data) setEpisodes(data as Episode[]);
  }

  async function loadMyShows() {
    if (!user) return;
    const { data } = await supabase
      .from('podcast_shows')
      .select('*, profiles!podcast_shows_host_id_fkey(display_name)')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setMyShows(data as PodcastShow[]);
  }

  async function createShow() {
    if (!user || !sTitle.trim()) return;
    setCreating(true);

    let coverUrl: string | null = null;
    if (sCoverFile) {
      const path = `podcast/${user.id}/${Date.now()}-cover.${sCoverFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('media').upload(path, sCoverFile);
      if (!error) {
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from('podcast_shows').insert({
      host_id: user.id,
      title: sTitle.trim(),
      description: sDesc.trim(),
      cover_art: coverUrl,
      category: sCategory,
      episode_count: 0,
      subscriber_count: 0,
    });

    if (error) {
      toast.error('Failed to create show');
    } else {
      toast.success('Podcast show created!');
      setSTitle('');
      setSDesc('');
      setSCoverFile(null);
      setShowCreate(false);
      loadShows();
      loadMyShows();
    }
    setCreating(false);
  }

  async function publishEpisode() {
    if (!user || !epTitle.trim() || !epShowId) return;
    setPublishing(true);

    let audioUrl: string | null = null;
    if (epAudioFile) {
      const path = `podcast/${user.id}/ep-${Date.now()}.${epAudioFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('media').upload(path, epAudioFile);
      if (!error) {
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
        audioUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from('podcast_episodes').insert({
      show_id: epShowId,
      title: epTitle.trim(),
      description: epDesc.trim(),
      audio_url: audioUrl,
      duration: 0,
      plays: 0,
      show_notes: epNotes.trim() || null,
      published_at: new Date().toISOString(),
    });

    if (error) {
      toast.error('Failed to publish episode');
    } else {
      toast.success('Episode published!');
      setEpTitle('');
      setEpDesc('');
      setEpNotes('');
      setEpAudioFile(null);
      setShowAddEp(false);
      loadEpisodes();
    }
    setPublishing(false);
  }

  function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  }

  function timeAgo(date: string): string {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Podcasts</h1>
          <p className="text-xs text-gray-500">Host &amp; discover community podcasts</p>
        </div>
        <div className="flex gap-2">
          {user && (
            <button onClick={() => setShowAddEp(!showAddEp)} className="btn-teal text-xs">
              + Episode
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {([
          { key: 'shows' as PodcastTab, label: 'Shows' },
          { key: 'episodes' as PodcastTab, label: 'Episodes' },
          { key: 'my-shows' as PodcastTab, label: 'My Shows' },
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

      {/* Create Show Form */}
      {showCreate && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Create Podcast Show</h3>
          <input value={sTitle} onChange={e => setSTitle(e.target.value)} placeholder="Show title" className="input-field" />
          <textarea value={sDesc} onChange={e => setSDesc(e.target.value)} placeholder="Show description" className="input-field resize-none" rows={3} />
          <select value={sCategory} onChange={e => setSCategory(e.target.value)} className="input-field">
            {['Community', 'Education', 'Storytelling', 'Interviews', 'News', 'Culture', 'Tech', 'Health'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Cover Art</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setSCoverFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-teal-50 file:text-teal-600"
            />
          </div>
          <button onClick={createShow} disabled={!sTitle.trim() || creating} className="btn-teal w-full disabled:opacity-50">
            {creating ? 'Creating...' : 'Create Show'}
          </button>
        </div>
      )}

      {/* Add Episode Form */}
      {showAddEp && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">New Episode</h3>
          <select value={epShowId} onChange={e => setEpShowId(e.target.value)} className="input-field">
            <option value="">Select show...</option>
            {myShows.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <input value={epTitle} onChange={e => setEpTitle(e.target.value)} placeholder="Episode title" className="input-field" />
          <textarea value={epDesc} onChange={e => setEpDesc(e.target.value)} placeholder="Episode description" className="input-field resize-none" rows={2} />
          <textarea value={epNotes} onChange={e => setEpNotes(e.target.value)} placeholder="Show notes (links, timestamps)" className="input-field resize-none text-xs" rows={2} />
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Audio File</label>
            <input
              type="file"
              accept="audio/*"
              onChange={e => setEpAudioFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-teal-50 file:text-teal-600"
            />
          </div>
          <button onClick={publishEpisode} disabled={!epTitle.trim() || !epShowId || publishing} className="btn-teal w-full disabled:opacity-50">
            {publishing ? 'Publishing...' : 'Publish Episode'}
          </button>
        </div>
      )}

      {/* Shows Tab */}
      {tab === 'shows' && (
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />
            ))
          ) : shows.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🎙️</p>
              <p className="text-sm text-gray-500">No podcast shows yet</p>
              <button onClick={() => setShowCreate(true)} className="btn-teal text-xs mt-3">Start a Show</button>
            </div>
          ) : (
            shows.map(show => (
              <div key={show.id} className="card flex items-center gap-3">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {show.cover_art ? (
                    <img src={show.cover_art} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🎙️</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{show.title}</p>
                  <p className="text-xs text-gray-500">{(show.profiles as any)?.display_name}</p>
                  <p className="text-[10px] text-gray-400">
                    {show.episode_count} episodes · {show.subscriber_count} subscribers
                  </p>
                </div>
                <button className="text-xs px-3 py-1.5 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded-lg flex-shrink-0">
                  Subscribe
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Episodes Tab */}
      {tab === 'episodes' && (
        <div className="space-y-2">
          {episodes.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No episodes published yet</p>
            </div>
          ) : (
            episodes.map(ep => (
              <div key={ep.id} className="card flex items-center gap-3">
                <button className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">▶️</span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white line-clamp-1">{ep.title}</p>
                  <p className="text-xs text-gray-500">
                    {(ep.podcast_shows as any)?.title} · {formatDuration(ep.duration)}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {ep.plays} plays · {ep.published_at ? timeAgo(ep.published_at) : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* My Shows Tab */}
      {tab === 'my-shows' && (
        <div className="space-y-3">
          {!user ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">Sign in to manage your shows</p>
            </div>
          ) : (
            <>
              <button onClick={() => setShowCreate(true)} className="btn-teal w-full text-xs">
                + Create New Show
              </button>

              {myShows.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-2xl mb-2">🎙️</p>
                  <p className="text-sm text-gray-500">You haven&apos;t created any shows yet</p>
                </div>
              ) : (
                myShows.map(show => (
                  <div key={show.id} className="card space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                        {show.cover_art ? (
                          <img src={show.cover_art} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">🎙️</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-harbor-800 dark:text-white">{show.title}</p>
                        <p className="text-xs text-gray-500">
                          {show.episode_count} episodes · {show.subscriber_count} subscribers
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-harbor-900 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 mb-1">RSS Feed URL</p>
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-mono break-all">
                        /api/podcast/{show.id}/feed.xml
                      </p>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
