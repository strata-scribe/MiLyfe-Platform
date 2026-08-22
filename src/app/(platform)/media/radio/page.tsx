'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface RadioStation {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  genre: string;
  stream_url: string | null;
  is_live: boolean;
  listeners: number;
  current_track: string | null;
  current_dj: string | null;
  schedule: ScheduleSlot[];
  created_at: string;
  profiles?: { display_name: string };
}

interface ScheduleSlot {
  day: number;
  hour: number;
  dj_name: string;
  show_name: string;
  genre: string;
}

interface TrackRequest {
  id: string;
  station_id: string;
  user_id: string;
  track_title: string;
  artist: string;
  status: 'pending' | 'playing' | 'denied';
  votes: number;
  created_at: string;
  display_name?: string;
}

type RadioTab = 'stations' | 'schedule' | 'requests' | 'dj';

const GENRES = ['all', 'hip-hop', 'r&b', 'reggaeton', 'latin', 'afrobeat', 'gospel', 'jazz', 'electronic', 'spoken-word', 'community'];

export default function RadioPage() {
  const [tab, setTab] = useState<RadioTab>('stations');
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [requests, setRequests] = useState<TrackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState('all');
  const [listeningTo, setListeningTo] = useState<RadioStation | null>(null);

  // Request form
  const [reqTrack, setReqTrack] = useState('');
  const [reqArtist, setReqArtist] = useState('');

  // DJ form
  const [showDJ, setShowDJ] = useState(false);
  const [stationName, setStationName] = useState('');
  const [stationGenre, setStationGenre] = useState('hip-hop');
  const [stationDesc, setStationDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, [genre]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('media_radio_stations').select('*, profiles!media_radio_stations_owner_id_fkey(display_name)').order('listeners', { ascending: false });
    if (genre !== 'all') query = query.eq('genre', genre);
    const { data: s } = await query.limit(20);
    if (s) setStations(s as any);

    if (listeningTo) {
      const { data: r } = await supabase.from('media_radio_requests').select('*').eq('station_id', listeningTo.id).eq('status', 'pending').order('votes', { ascending: false }).limit(10);
      if (r) setRequests(r);
    }
    setLoading(false);
  }

  async function createStation() {
    if (!user || !stationName.trim()) return;
    setCreating(true);
    const supabase = createClient();
    await supabase.from('media_radio_stations').insert({
      owner_id: user.id, name: stationName.trim(), description: stationDesc.trim(),
      genre: stationGenre, is_live: false, listeners: 0, schedule: [],
    });
    setStationName(''); setStationDesc(''); setShowDJ(false); setCreating(false);
    loadData();
  }

  async function tuneIn(station: RadioStation) {
    setListeningTo(station);
    const supabase = createClient();
    await supabase.from('media_radio_stations').update({ listeners: station.listeners + 1 }).eq('id', station.id);
    // Load requests for this station
    const { data: r } = await supabase.from('media_radio_requests').select('*').eq('station_id', station.id).eq('status', 'pending').order('votes', { ascending: false }).limit(10);
    if (r) setRequests(r);
  }

  async function requestTrack() {
    if (!user || !reqTrack.trim() || !listeningTo) return;
    const supabase = createClient();
    await supabase.from('media_radio_requests').insert({
      station_id: listeningTo.id, user_id: user.id, track_title: reqTrack.trim(),
      artist: reqArtist.trim(), status: 'pending', votes: 1, display_name: user.display_name,
    });
    setReqTrack(''); setReqArtist('');
    // Reload requests
    const { data: r } = await supabase.from('media_radio_requests').select('*').eq('station_id', listeningTo.id).eq('status', 'pending').order('votes', { ascending: false }).limit(10);
    if (r) setRequests(r);
  }

  async function voteRequest(reqId: string) {
    const supabase = createClient();
    const req = requests.find(r => r.id === reqId);
    if (!req) return;
    await supabase.from('media_radio_requests').update({ votes: req.votes + 1 }).eq('id', reqId);
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, votes: r.votes + 1 } : r));
  }

  async function goLive(stationId: string) {
    const supabase = createClient();
    await supabase.from('media_radio_stations').update({ is_live: true, current_dj: user?.display_name }).eq('id', stationId);
    setStations(prev => prev.map(s => s.id === stationId ? { ...s, is_live: true, current_dj: user?.display_name || null } : s));
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Radio</h1>
          <p className="text-xs text-gray-500">Community stations & DJ sets</p>
        </div>
        {user && <button onClick={() => setShowDJ(!showDJ)} className="btn-teal text-xs">🎧 Create Station</button>}
      </div>

      {/* Now Listening */}
      {listeningTo && (
        <div className="card bg-gradient-to-r from-purple-500/10 to-teal-500/10 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-xl flex items-center justify-center animate-pulse">
              <span className="text-xl">📻</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-harbor-800 dark:text-white">{listeningTo.name}</p>
              <p className="text-xs text-gray-500">{listeningTo.current_track || 'Tuned in'} · {listeningTo.listeners} listening</p>
              {listeningTo.current_dj && <p className="text-[10px] text-purple-600 dark:text-purple-400">DJ: {listeningTo.current_dj}</p>}
            </div>
            <button onClick={() => setListeningTo(null)} className="text-xs text-red-500">Stop</button>
          </div>
          {/* Request form inline */}
          <div className="flex gap-2 mt-3">
            <input value={reqTrack} onChange={e => setReqTrack(e.target.value)} placeholder="Request a song..." className="input-field flex-1 text-xs" />
            <input value={reqArtist} onChange={e => setReqArtist(e.target.value)} placeholder="Artist" className="input-field w-24 text-xs" />
            <button onClick={requestTrack} disabled={!reqTrack.trim()} className="btn-teal text-xs disabled:opacity-50">🎵</button>
          </div>
        </div>
      )}

      {/* Create Station */}
      {showDJ && (
        <div className="card space-y-3 border-2 border-purple-200 dark:border-purple-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Create Radio Station</h3>
          <input value={stationName} onChange={e => setStationName(e.target.value)} placeholder="Station name" className="input-field" />
          <textarea value={stationDesc} onChange={e => setStationDesc(e.target.value)} placeholder="Description" className="input-field resize-none" rows={2} />
          <select value={stationGenre} onChange={e => setStationGenre(e.target.value)} className="input-field">
            {GENRES.filter(g => g !== 'all').map(g => <option key={g} value={g} className="capitalize">{g}</option>)}
          </select>
          <button onClick={createStation} disabled={!stationName.trim() || creating} className="btn-teal w-full disabled:opacity-50">
            {creating ? 'Creating...' : 'Launch Station'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['stations', 'schedule', 'requests', 'dj'] as RadioTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'dj' ? 'My Station' : t}</button>
        ))}
      </div>

      {/* Genre Filters */}
      {tab === 'stations' && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {GENRES.map(g => (
            <button key={g} onClick={() => setGenre(g)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap capitalize', genre === g ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{g}</button>
          ))}
        </div>
      )}

      {/* Stations */}
      {tab === 'stations' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            stations.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">📻</p>
                <p className="text-sm text-gray-500">No radio stations yet</p>
                <button onClick={() => setShowDJ(true)} className="text-xs text-teal-600 hover:underline mt-2">Create one →</button>
              </div>
            ) : stations.map(station => (
              <div key={station.id} className="card flex items-center gap-3">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', station.is_live ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-harbor-800')}>
                  <span className="text-xl">{station.is_live ? '📡' : '📻'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{station.name}</p>
                    {station.is_live && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                  </div>
                  <p className="text-xs text-gray-500 capitalize">{station.genre} · {station.listeners} listening</p>
                  {station.current_track && <p className="text-[10px] text-teal-600 truncate">🎵 {station.current_track}</p>}
                </div>
                <button onClick={() => tuneIn(station)} className={cn('text-xs px-3 py-1.5 rounded-lg font-medium', listeningTo?.id === station.id ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400')}>
                  {listeningTo?.id === station.id ? '⏹ Stop' : '▶ Tune In'}
                </button>
              </div>
            ))
          }
        </div>
      )}

      {/* Schedule */}
      {tab === 'schedule' && (
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">📅</p>
          <p className="text-sm font-medium text-harbor-800 dark:text-white">DJ Schedule</p>
          <p className="text-xs text-gray-500 mt-1">Upcoming shows and time slots</p>
          <div className="grid grid-cols-7 gap-1 mt-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-[10px] text-gray-500 font-medium text-center p-1 bg-gray-50 dark:bg-harbor-900 rounded">{day}</div>
            ))}
          </div>
        </div>
      )}

      {/* Requests */}
      {tab === 'requests' && (
        <div className="space-y-2">
          {!listeningTo ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">Tune in to a station to see & make requests</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No pending requests</p>
            </div>
          ) : requests.map(req => (
            <div key={req.id} className="card flex items-center gap-3">
              <button onClick={() => voteRequest(req.id)} className="flex flex-col items-center text-xs">
                <span className="text-gray-400 hover:text-teal-500">▲</span>
                <span className="font-bold text-harbor-800 dark:text-white">{req.votes}</span>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{req.track_title}</p>
                <p className="text-xs text-gray-500">{req.artist || 'Unknown artist'} · by {req.display_name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DJ Tab */}
      {tab === 'dj' && (
        <div className="space-y-3">
          {(() => {
            const myStations = stations.filter(s => s.owner_id === user?.id);
            return myStations.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🎧</p>
                <p className="text-sm text-gray-500">You don&apos;t have a station yet</p>
                <button onClick={() => setShowDJ(true)} className="btn-teal text-xs mt-4">Create Station</button>
              </div>
            ) : myStations.map(station => (
              <div key={station.id} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-harbor-800 dark:text-white">{station.name}</p>
                    <p className="text-xs text-gray-500">{station.listeners} listeners · {station.genre}</p>
                  </div>
                  <button onClick={() => goLive(station.id)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium', station.is_live ? 'bg-red-500 text-white' : 'bg-green-500 text-white')}>
                    {station.is_live ? '⏹ End' : '🎙 Go Live'}
                  </button>
                </div>
                {station.is_live && (
                  <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium animate-pulse">● You&apos;re live!</p>
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
