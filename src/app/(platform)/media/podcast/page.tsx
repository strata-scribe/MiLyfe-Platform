'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Podcast {
  id: string;
  host_id: string;
  title: string;
  description: string;
  cover_url: string | null;
  category: string;
  language: string;
  rss_url: string | null;
  subscribers: number;
  episode_count: number;
  total_plays: number;
  explicit: boolean;
  created_at: string;
  profiles?: { display_name: string };
}

interface Episode {
  id: string;
  podcast_id: string;
  title: string;
  description: string;
  audio_url: string | null;
  duration: number;
  episode_number: number;
  season: number;
  status: 'draft' | 'published' | 'scheduled';
  published_at: string | null;
  plays: number;
  downloads: number;
  show_notes: string | null;
  guests: string[];
  created_at: string;
  podcast?: { title: string; cover_url: string | null };
}

type PodcastTab = 'discover' | 'episodes' | 'subscribed' | 'create';

const CATEGORIES = ['all', 'community', 'education', 'storytelling', 'interviews', 'news', 'culture', 'tech', 'health', 'comedy'];

export default function PodcastPage() {
  const [tab, setTab] = useState<PodcastTab>('discover');
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [playingEpisode, setPlayingEpisode] = useState<Episode | null>(null);

  // Create podcast form
  const [showCreate, setShowCreate] = useState(false);
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCategory, setPCategory] = useState('community');
  const [creating, setCreating] = useState(false);

  // Episode form
  const [showAddEpisode, setShowAddEpisode] = useState(false);
  const [epTitle, setEpTitle] = useState('');
  const [epDesc, setEpDesc] = useState('');
  const [epNotes, setEpNotes] = useState('');
  const [epGuests, setEpGuests] = useState('');
  const [epPodcastId, setEpPodcastId] = useState('');
  const [publishing, setPublishing] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, [category]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    let podQuery = supabase.from('media_podcasts').select('*, profiles!media_podcasts_host_id_fkey(display_name)').order('subscribers', { ascending: false });
    if (category !== 'all') podQuery = podQuery.eq('category', category);
    const { data: p } = await podQuery.limit(20);
    if (p) setPodcasts(p as any);

    const { data: e } = await supabase.from('media_episodes').select('*, podcast:media_podcasts(title, cover_url)').eq('status', 'published').order('published_at', { ascending: false }).limit(20);
    if (e) setEpisodes(e as any);

    setLoading(false);
  }

  async function createPodcast() {
    if (!user || !pTitle.trim()) return;
    setCreating(true);
    const supabase = createClient();
    await supabase.from('media_podcasts').insert({
      host_id: user.id, title: pTitle.trim(), description: pDesc.trim(),
      category: pCategory, language: 'en', subscribers: 0, episode_count: 0,
      total_plays: 0, explicit: false,
    });
    setPTitle(''); setPDesc(''); setShowCreate(false); setCreating(false);
    loadData();
  }

  async function publishEpisode() {
    if (!user || !epTitle.trim() || !epPodcastId) return;
    setPublishing(true);
    const supabase = createClient();

    const { count } = await supabase.from('media_episodes').select('*', { count: 'exact', head: true }).eq('podcast_id', epPodcastId);
    const epNum = (count || 0) + 1;

    await supabase.from('media_episodes').insert({
      podcast_id: epPodcastId, title: epTitle.trim(), description: epDesc.trim(),
      duration: 0, episode_number: epNum, season: 1, status: 'published',
      published_at: new Date().toISOString(), plays: 0, downloads: 0,
      show_notes: epNotes.trim() || null,
      guests: epGuests.split(',').map(g => g.trim()).filter(Boolean),
    });
    await supabase.from('media_podcasts').update({ episode_count: epNum }).eq('id', epPodcastId);
    setEpTitle(''); setEpDesc(''); setEpNotes(''); setEpGuests('');
    setShowAddEpisode(false); setPublishing(false);
    loadData();
  }

  function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Podcasts</h1>
          <p className="text-xs text-gray-500">Community audio · RSS powered</p>
        </div>
        <div className="flex gap-2">
          {user && <button onClick={() => setShowAddEpisode(!showAddEpisode)} className="btn-teal text-xs">+ Episode</button>}
        </div>
      </div>

      {/* Now Playing */}
      {playingEpisode && (
        <div className="card flex items-center gap-3 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
          <div className="w-10 h-10 bg-teal-200 dark:bg-teal-800 rounded-lg flex items-center justify-center">
            <span className="text-sm">🎧</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-harbor-800 dark:text-white truncate">{playingEpisode.title}</p>
            <p className="text-[10px] text-gray-500">{(playingEpisode.podcast as any)?.title}</p>
          </div>
          <button onClick={() => setPlayingEpisode(null)} className="text-xs text-gray-400">✕</button>
        </div>
      )}

      {/* Create Podcast */}
      {showCreate && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Create Podcast</h3>
          <input value={pTitle} onChange={e => setPTitle(e.target.value)} placeholder="Podcast name" className="input-field" />
          <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Description" className="input-field resize-none" rows={3} />
          <select value={pCategory} onChange={e => setPCategory(e.target.value)} className="input-field">
            {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <button onClick={createPodcast} disabled={!pTitle.trim() || creating} className="btn-teal w-full disabled:opacity-50">
            {creating ? 'Creating...' : 'Create Podcast'}
          </button>
        </div>
      )}

      {/* Add Episode */}
      {showAddEpisode && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">New Episode</h3>
          <select value={epPodcastId} onChange={e => setEpPodcastId(e.target.value)} className="input-field">
            <option value="">Select podcast...</option>
            {podcasts.filter(p => p.host_id === user?.id).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <input value={epTitle} onChange={e => setEpTitle(e.target.value)} placeholder="Episode title" className="input-field" />
          <textarea value={epDesc} onChange={e => setEpDesc(e.target.value)} placeholder="Episode description" className="input-field resize-none" rows={3} />
          <textarea value={epNotes} onChange={e => setEpNotes(e.target.value)} placeholder="Show notes (links, timestamps)" className="input-field resize-none text-xs" rows={3} />
          <input value={epGuests} onChange={e => setEpGuests(e.target.value)} placeholder="Guests (comma separated)" className="input-field" />
          <button onClick={publishEpisode} disabled={!epTitle.trim() || !epPodcastId || publishing} className="btn-teal w-full disabled:opacity-50">
            {publishing ? 'Publishing...' : 'Publish Episode'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['discover', 'episodes', 'subscribed', 'create'] as PodcastTab[]).map(t => (
          <button key={t} onClick={() => t === 'create' ? setShowCreate(!showCreate) : setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t && t !== 'create' ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'create' ? '+ Show' : t}</button>
        ))}
      </div>

      {/* Category Filters */}
      {tab === 'discover' && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap capitalize', category === c ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
          ))}
        </div>
      )}

      {/* Discover */}
      {tab === 'discover' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            podcasts.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🎙️</p>
                <p className="text-sm text-gray-500">No podcasts yet</p>
                <button onClick={() => setShowCreate(true)} className="text-xs text-teal-600 hover:underline mt-2">Start one →</button>
              </div>
            ) : podcasts.map(pod => (
              <div key={pod.id} className="card flex items-center gap-3">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  {pod.cover_url ? <img src={pod.cover_url} alt="" className="w-full h-full rounded-xl object-cover" /> : <span className="text-2xl">🎙️</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{pod.title}</p>
                  <p className="text-xs text-gray-500">{(pod.profiles as any)?.display_name} · {pod.episode_count} episodes</p>
                  <p className="text-[10px] text-gray-400 capitalize">{pod.category} · {pod.subscribers} subscribers</p>
                </div>
                <button className="text-xs px-3 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded-lg flex-shrink-0">Subscribe</button>
              </div>
            ))
          }
        </div>
      )}

      {/* Episodes */}
      {tab === 'episodes' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-16" />) :
            episodes.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-sm text-gray-500">No episodes published yet</p>
              </div>
            ) : episodes.map(ep => (
              <button key={ep.id} onClick={() => setPlayingEpisode(ep)} className="card w-full text-left flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-gray-100 dark:bg-harbor-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">▶️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white line-clamp-1">{ep.title}</p>
                  <p className="text-xs text-gray-500">{(ep.podcast as any)?.title} · Ep {ep.episode_number}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">{formatDuration(ep.duration)}</p>
                  <p className="text-[10px] text-gray-400">{ep.plays} plays</p>
                </div>
              </button>
            ))
          }
        </div>
      )}

      {/* Subscribed */}
      {tab === 'subscribed' && (
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">🎧</p>
          <p className="text-sm text-gray-500">{user ? 'Your subscribed podcasts will appear here' : 'Sign in to subscribe to podcasts'}</p>
        </div>
      )}
    </div>
  );
}
