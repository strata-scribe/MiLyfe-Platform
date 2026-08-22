'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { LiveKitVideoRoom } from '@/components/media/livekit-room';
import { isLiveKitAvailable } from '@/lib/calls/livekit-config';

interface RadioStation {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  genre: string;
  is_live: boolean;
  listener_count: number;
  current_dj: string | null;
  stream_url: string | null;
  created_at: string;
  profiles?: { display_name: string };
}

interface ScheduleSlot {
  id: string;
  station_id: string;
  day_of_week: number;
  start_hour: number;
  show_name: string;
  dj_name: string;
}

interface RadioRequest {
  id: string;
  station_id: string;
  user_id: string;
  song_title: string;
  artist: string;
  dedication_message: string | null;
  status: 'pending' | 'played' | 'skipped';
  created_at: string;
  profiles?: { display_name: string };
}

type RadioTab = 'live-now' | 'schedule' | 'my-station';

const GENRES = ['Hip-Hop', 'R&B', 'Gospel', 'Jazz', 'Reggae', 'Talk', 'News', 'Community'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RadioDJPage() {
  const [tab, setTab] = useState<RadioTab>('live-now');
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [myStation, setMyStation] = useState<RadioStation | null>(null);
  const [requests, setRequests] = useState<RadioRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [listeningTo, setListeningTo] = useState<RadioStation | null>(null);

  // Create station form
  const [showCreate, setShowCreate] = useState(false);
  const [stName, setStName] = useState('');
  const [stGenre, setStGenre] = useState('Hip-Hop');
  const [stDesc, setStDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Request form
  const [reqSong, setReqSong] = useState('');
  const [reqArtist, setReqArtist] = useState('');
  const [reqDedication, setReqDedication] = useState('');

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    loadLiveStations();
    loadSchedule();
  }, []);

  useEffect(() => {
    if (user) loadMyStation();
  }, [user]);

  async function loadLiveStations() {
    setLoading(true);
    const { data } = await supabase
      .from('radio_stations')
      .select('*, profiles!radio_stations_owner_id_fkey(display_name)')
      .eq('is_live', true)
      .order('listener_count', { ascending: false });
    if (data) setStations(data as RadioStation[]);
    setLoading(false);
  }

  async function loadSchedule() {
    const { data } = await supabase
      .from('radio_schedule')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('start_hour', { ascending: true });
    if (data) setScheduleSlots(data as ScheduleSlot[]);
  }

  async function loadMyStation() {
    if (!user) return;
    const { data } = await supabase
      .from('radio_stations')
      .select('*, profiles!radio_stations_owner_id_fkey(display_name)')
      .eq('owner_id', user.id)
      .single();
    if (data) {
      setMyStation(data as RadioStation);
      loadRequests(data.id);
    }
  }

  async function loadRequests(stationId: string) {
    const { data } = await supabase
      .from('radio_requests')
      .select('*, profiles!radio_requests_user_id_fkey(display_name)')
      .eq('station_id', stationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);
    if (data) setRequests(data as RadioRequest[]);
  }

  async function createStation() {
    if (!user || !stName.trim()) return;
    setCreating(true);
    const { error } = await supabase.from('radio_stations').insert({
      owner_id: user.id,
      name: stName.trim(),
      description: stDesc.trim(),
      genre: stGenre,
      is_live: false,
      listener_count: 0,
    });
    if (error) {
      toast.error('Failed to create station');
    } else {
      toast.success('Station created!');
      setStName('');
      setStDesc('');
      setShowCreate(false);
      loadMyStation();
    }
    setCreating(false);
  }

  async function goLive() {
    if (!myStation) return;
    await supabase.from('radio_stations').update({
      is_live: true,
      current_dj: user?.display_name || 'DJ',
    }).eq('id', myStation.id);
    toast.success("You're live! Broadcasting now.");
    setMyStation({ ...myStation, is_live: true, current_dj: user?.display_name || 'DJ' });
    loadLiveStations();
  }

  async function endBroadcast() {
    if (!myStation) return;
    await supabase.from('radio_stations').update({
      is_live: false,
      current_dj: null,
    }).eq('id', myStation.id);
    toast.success('Broadcast ended');
    setMyStation({ ...myStation, is_live: false, current_dj: null });
    loadLiveStations();
  }

  async function submitRequest() {
    if (!user || !reqSong.trim() || !listeningTo) return;
    await supabase.from('radio_requests').insert({
      station_id: listeningTo.id,
      user_id: user.id,
      song_title: reqSong.trim(),
      artist: reqArtist.trim(),
      dedication_message: reqDedication.trim() || null,
      status: 'pending',
    });
    toast.success('Song request submitted!');
    setReqSong('');
    setReqArtist('');
    setReqDedication('');
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Radio</h1>
          <p className="text-xs text-gray-500">Community DJ stations &amp; live audio</p>
        </div>
        {user && !myStation && (
          <button onClick={() => setShowCreate(true)} className="btn-teal text-xs">
            🎧 Create Station
          </button>
        )}
      </div>

      {/* Now Listening */}
      {listeningTo && (
        <div className="card bg-gradient-to-r from-purple-500/10 to-teal-500/10 border border-purple-200 dark:border-purple-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-200 dark:bg-purple-800 rounded-lg flex items-center justify-center animate-pulse">
              <span className="text-lg">📻</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-harbor-800 dark:text-white">{listeningTo.name}</p>
              <p className="text-xs text-gray-500">DJ: {listeningTo.current_dj} · {listeningTo.listener_count} listening</p>
            </div>
            <button onClick={() => setListeningTo(null)} className="text-xs text-red-500">Stop</button>
          </div>
          {/* Request + Dedication */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input value={reqSong} onChange={e => setReqSong(e.target.value)} placeholder="Request a song..." className="input-field flex-1 text-xs" />
              <input value={reqArtist} onChange={e => setReqArtist(e.target.value)} placeholder="Artist" className="input-field w-24 text-xs" />
            </div>
            <input value={reqDedication} onChange={e => setReqDedication(e.target.value)} placeholder="Dedicate this song to... (optional)" className="input-field text-xs" />
            <button onClick={submitRequest} disabled={!reqSong.trim()} className="btn-teal w-full text-xs disabled:opacity-50">
              🎵 Submit Request
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {([
          { key: 'live-now' as RadioTab, label: 'Live Now' },
          { key: 'schedule' as RadioTab, label: 'Schedule' },
          { key: 'my-station' as RadioTab, label: 'My Station' },
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

      {/* Create Station */}
      {showCreate && (
        <div className="card space-y-3 border-2 border-purple-200 dark:border-purple-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Create Radio Station</h3>
          <input value={stName} onChange={e => setStName(e.target.value)} placeholder="Station name" className="input-field" />
          <textarea value={stDesc} onChange={e => setStDesc(e.target.value)} placeholder="Description" className="input-field resize-none" rows={2} />
          <select value={stGenre} onChange={e => setStGenre(e.target.value)} className="input-field">
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={createStation} disabled={!stName.trim() || creating} className="btn-teal w-full disabled:opacity-50">
            {creating ? 'Creating...' : 'Launch Station'}
          </button>
        </div>
      )}

      {/* Live Now Tab */}
      {tab === 'live-now' && (
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />
            ))
          ) : stations.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">📻</p>
              <p className="text-sm text-gray-500">No stations live right now</p>
              <p className="text-xs text-gray-400 mt-1">Check the schedule for upcoming shows</p>
            </div>
          ) : (
            stations.map(station => (
              <div key={station.id} className="card flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center relative">
                  <span className="text-xl">📡</span>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{station.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                      {station.genre}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    DJ: {station.current_dj || (station.profiles as any)?.display_name} · {station.listener_count} listeners
                  </p>
                </div>
                <button
                  onClick={() => setListeningTo(station)}
                  className="btn-teal text-xs !py-1.5 !px-3"
                >
                  Listen
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Schedule Tab */}
      {tab === 'schedule' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Weekly Schedule</h3>
          {scheduleSlots.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">No scheduled shows yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-8 gap-1 text-[10px] font-medium text-gray-500">
                <span>Time</span>
                {DAYS.map(d => <span key={d} className="text-center">{d}</span>)}
              </div>
              {Array.from({ length: 12 }).map((_, hourIdx) => {
                const hour = hourIdx + 8;
                return (
                  <div key={hour} className="grid grid-cols-8 gap-1">
                    <span className="text-[9px] text-gray-400 py-1">{hour}:00</span>
                    {DAYS.map((_, dayIdx) => {
                      const slot = scheduleSlots.find(s => s.day_of_week === dayIdx && s.start_hour === hour);
                      return (
                        <div
                          key={dayIdx}
                          className={cn(
                            'rounded text-[8px] py-1 px-0.5 text-center truncate',
                            slot ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' : 'bg-gray-50 dark:bg-harbor-900'
                          )}
                        >
                          {slot ? slot.show_name : ''}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* My Station Tab */}
      {tab === 'my-station' && (
        <div className="space-y-3">
          {!user ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">Sign in to manage your station</p>
            </div>
          ) : !myStation ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🎧</p>
              <p className="text-sm text-gray-500">You don&apos;t have a station yet</p>
              <button onClick={() => setShowCreate(true)} className="btn-teal text-xs mt-3">Create Station</button>
            </div>
          ) : (
            <>
              <div className="card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-harbor-800 dark:text-white">{myStation.name}</p>
                    <p className="text-xs text-gray-500">{myStation.genre} · {myStation.listener_count} listeners</p>
                  </div>
                  {myStation.is_live ? (
                    <button onClick={endBroadcast} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white">
                      ⏹ End Broadcast
                    </button>
                  ) : (
                    <button onClick={goLive} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 text-white">
                      🎙 Go Live
                    </button>
                  )}
                </div>
                {myStation.is_live && (
                  <>
                    {isLiveKitAvailable() ? (
                      <LiveKitVideoRoom
                        roomName={`radio-${myStation.id}`}
                        participantName={user?.display_name || 'DJ'}
                        mode="audio"
                        onDisconnect={endBroadcast}
                      />
                    ) : (
                      <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-green-700 dark:text-green-400 font-medium animate-pulse">
                          ● Broadcasting live (LiveKit not configured — audio via browser)
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Request Queue */}
              <div className="card space-y-2">
                <h3 className="text-xs font-bold text-harbor-800 dark:text-white">
                  🎵 Song Request Queue ({requests.length})
                </h3>
                {requests.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No pending requests</p>
                ) : (
                  requests.map(req => (
                    <div key={req.id} className="flex items-start gap-2 py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-harbor-800 dark:text-white">
                          {req.song_title} — {req.artist}
                        </p>
                        <p className="text-[10px] text-gray-500">from {(req.profiles as any)?.display_name}</p>
                        {req.dedication_message && (
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5 italic">
                            &quot;Dedicated to: {req.dedication_message}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
