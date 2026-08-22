'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Channel {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  banner_url: string | null;
  category: string;
  subscribers: number;
  is_live: boolean;
  stream_key: string | null;
  created_at: string;
  profiles?: { display_name: string };
}

interface Stream {
  id: string;
  channel_id: string;
  title: string;
  description: string;
  status: 'live' | 'scheduled' | 'ended' | 'recording';
  viewer_count: number;
  started_at: string | null;
  scheduled_for: string | null;
  duration: number | null;
  thumbnail_url: string | null;
  tags: string[];
  category: string;
  tip_total: number;
  chat_enabled: boolean;
  channel?: { name: string; avatar_url: string | null };
}

interface ChatMessage {
  id: string;
  stream_id: string;
  user_id: string;
  message: string;
  type: 'chat' | 'tip' | 'system';
  amount: number | null;
  created_at: string;
  display_name?: string;
}

type TVTab = 'live' | 'channels' | 'schedule' | 'browse';
type Category = 'all' | 'gaming' | 'music' | 'talk' | 'education' | 'sports' | 'creative' | 'community';

const CATEGORIES: Category[] = ['all', 'gaming', 'music', 'talk', 'education', 'sports', 'creative', 'community'];

export default function MiTVPage() {
  const [tab, setTab] = useState<TVTab>('live');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [scheduled, setScheduled] = useState<Stream[]>([]);
  const [category, setCategory] = useState<Category>('all');
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [showTip, setShowTip] = useState(false);

  // Go Live form
  const [showGoLive, setShowGoLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamCategory, setStreamCategory] = useState('talk');
  const [streamDesc, setStreamDesc] = useState('');
  const [starting, setStarting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, [category]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    let channelQuery = supabase.from('media_channels').select('*, profiles!media_channels_owner_id_fkey(display_name)').order('subscribers', { ascending: false });
    const { data: c } = await channelQuery.limit(20);
    if (c) setChannels(c as any);

    let streamQuery = supabase.from('media_streams').select('*, channel:media_channels(name, avatar_url)').eq('status', 'live').order('viewer_count', { ascending: false });
    if (category !== 'all') streamQuery = streamQuery.eq('category', category);
    const { data: s } = await streamQuery.limit(20);
    if (s) setStreams(s as any);

    const { data: sch } = await supabase.from('media_streams').select('*, channel:media_channels(name, avatar_url)').eq('status', 'scheduled').order('scheduled_for', { ascending: true }).limit(10);
    if (sch) setScheduled(sch as any);

    setLoading(false);
  }

  async function goLive() {
    if (!user || !streamTitle.trim()) return;
    setStarting(true);
    const supabase = createClient();

    // Get or create channel
    let { data: channel } = await supabase.from('media_channels').select('id').eq('owner_id', user.id).single();
    if (!channel) {
      const { data: newChannel } = await supabase.from('media_channels').insert({
        owner_id: user.id, name: `${user.display_name}'s Channel`, description: '', category: streamCategory, subscribers: 0, is_live: true,
      }).select('id').single();
      channel = newChannel;
    }

    if (channel) {
      await supabase.from('media_streams').insert({
        channel_id: channel.id, title: streamTitle.trim(), description: streamDesc.trim(),
        status: 'live', viewer_count: 0, started_at: new Date().toISOString(),
        category: streamCategory, tags: [], tip_total: 0, chat_enabled: true,
      });
      await supabase.from('media_channels').update({ is_live: true }).eq('id', channel.id);
    }
    setStreamTitle(''); setStreamDesc(''); setShowGoLive(false); setStarting(false);
    loadData();
  }

  async function sendChat() {
    if (!user || !chatInput.trim() || !selectedStream) return;
    const supabase = createClient();
    await supabase.from('media_chat_messages').insert({
      stream_id: selectedStream.id, user_id: user.id, message: chatInput.trim(),
      type: 'chat', display_name: user.display_name,
    });
    setChatMessages(prev => [...prev, { id: Date.now().toString(), stream_id: selectedStream.id, user_id: user.id, message: chatInput.trim(), type: 'chat', amount: null, created_at: new Date().toISOString(), display_name: user.display_name }]);
    setChatInput('');
  }

  async function sendTip() {
    if (!user || !selectedStream || !tipAmount) return;
    const amount = parseFloat(tipAmount);
    if (amount <= 0) return;
    const supabase = createClient();
    await supabase.from('media_chat_messages').insert({
      stream_id: selectedStream.id, user_id: user.id, message: `Tipped $${amount} MLY!`,
      type: 'tip', amount, display_name: user.display_name,
    });
    setChatMessages(prev => [...prev, { id: Date.now().toString(), stream_id: selectedStream.id, user_id: user.id, message: `Tipped $${amount} MLY!`, type: 'tip', amount, created_at: new Date().toISOString(), display_name: user.display_name }]);
    setTipAmount(''); setShowTip(false);
  }

  async function watchStream(stream: Stream) {
    setSelectedStream(stream);
    const supabase = createClient();
    const { data: msgs } = await supabase.from('media_chat_messages').select('*').eq('stream_id', stream.id).order('created_at', { ascending: true }).limit(50);
    if (msgs) setChatMessages(msgs);
    // Increment viewer count
    await supabase.from('media_streams').update({ viewer_count: stream.viewer_count + 1 }).eq('id', stream.id);
  }

  // Stream viewer
  if (selectedStream) {
    return (
      <div className="space-y-3 animate-slide-up">
        <button onClick={() => setSelectedStream(null)} className="text-sm text-gray-400 hover:text-gray-600">← Back to MiTV</button>

        {/* Stream Player */}
        <div className="card bg-black aspect-video flex items-center justify-center rounded-xl overflow-hidden">
          <div className="text-center">
            <p className="text-4xl">📺</p>
            <p className="text-white text-sm mt-2">{selectedStream.title}</p>
            <p className="text-red-400 text-xs mt-1 animate-pulse">● LIVE</p>
          </div>
        </div>

        {/* Stream Info */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-harbor-800 dark:text-white">{selectedStream.title}</h2>
            <p className="text-xs text-gray-500">{selectedStream.channel?.name} · {selectedStream.viewer_count} watching · {selectedStream.category}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTip(!showTip)} className="px-3 py-1.5 bg-mly-100 text-mly-700 dark:bg-mly-900/30 dark:text-mly-400 text-xs rounded-lg font-medium">💰 Tip</button>
          </div>
        </div>

        {/* Tip Form */}
        {showTip && (
          <div className="card flex gap-2 border-2 border-mly-200 dark:border-mly-800">
            <input value={tipAmount} onChange={e => setTipAmount(e.target.value)} placeholder="Amount ($MLY)" className="input-field flex-1" type="number" />
            <button onClick={sendTip} disabled={!tipAmount} className="btn-teal text-xs disabled:opacity-50">Send Tip</button>
          </div>
        )}

        {/* Chat */}
        <div className="card space-y-2">
          <h3 className="text-xs font-bold text-harbor-800 dark:text-white">Live Chat</h3>
          <div className="h-48 overflow-y-auto space-y-1 bg-gray-50 dark:bg-harbor-900 rounded-lg p-2">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No messages yet</p>
            ) : chatMessages.map(msg => (
              <div key={msg.id} className={cn('text-xs', msg.type === 'tip' ? 'bg-mly-50 dark:bg-mly-900/20 p-1 rounded' : '')}>
                <span className={cn('font-medium', msg.type === 'tip' ? 'text-mly-700 dark:text-mly-400' : 'text-teal-600 dark:text-teal-400')}>{msg.display_name}: </span>
                <span className="text-gray-700 dark:text-gray-300">{msg.message}</span>
              </div>
            ))}
          </div>
          {user && (
            <div className="flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Say something..." className="input-field flex-1 text-xs" onKeyDown={e => e.key === 'Enter' && sendChat()} />
              <button onClick={sendChat} disabled={!chatInput.trim()} className="btn-teal text-xs disabled:opacity-50">Send</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">MiTV</h1>
          <p className="text-xs text-gray-500">Live streaming & channels</p>
        </div>
        {user && <button onClick={() => setShowGoLive(!showGoLive)} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg font-medium">🔴 Go Live</button>}
      </div>

      {/* Go Live Form */}
      {showGoLive && (
        <div className="card space-y-3 border-2 border-red-200 dark:border-red-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Start Streaming</h3>
          <input value={streamTitle} onChange={e => setStreamTitle(e.target.value)} placeholder="Stream title" className="input-field" />
          <textarea value={streamDesc} onChange={e => setStreamDesc(e.target.value)} placeholder="Description (optional)" className="input-field resize-none" rows={2} />
          <select value={streamCategory} onChange={e => setStreamCategory(e.target.value)} className="input-field">
            {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <button onClick={goLive} disabled={!streamTitle.trim() || starting} className="w-full px-4 py-2 bg-red-500 text-white text-sm rounded-lg font-medium disabled:opacity-50">
            {starting ? 'Starting...' : '🔴 Start Stream'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['live', 'channels', 'schedule', 'browse'] as TVTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Live Tab */}
      {tab === 'live' && (
        <div className="space-y-3">
          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap capitalize', category === c ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
            ))}
          </div>

          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-32" />) :
            streams.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">📺</p>
                <p className="text-sm text-gray-500">No live streams right now</p>
                <p className="text-xs text-gray-400 mt-1">Be the first to go live!</p>
              </div>
            ) : streams.map(stream => (
              <button key={stream.id} onClick={() => watchStream(stream)} className="card w-full text-left hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-900 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
                  {stream.thumbnail_url ? (
                    <img src={stream.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">📺</span>
                  )}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded font-bold">LIVE</span>
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">{stream.viewer_count} watching</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xs flex-shrink-0">
                    {stream.channel?.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white line-clamp-1">{stream.title}</p>
                    <p className="text-xs text-gray-500">{stream.channel?.name} · {stream.category}</p>
                  </div>
                </div>
              </button>
            ))
          }
        </div>
      )}

      {/* Channels Tab */}
      {tab === 'channels' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-16" />) :
            channels.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">📡</p>
                <p className="text-sm text-gray-500">No channels yet</p>
                <p className="text-xs text-gray-400 mt-1">Start streaming to create your channel</p>
              </div>
            ) : channels.map(channel => (
              <div key={channel.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <span className="text-sm">{channel.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{channel.name}</p>
                    {channel.is_live && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                  </div>
                  <p className="text-xs text-gray-500">{channel.subscribers} subscribers · {channel.category}</p>
                </div>
                <button className="text-xs px-3 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded-lg">Subscribe</button>
              </div>
            ))
          }
        </div>
      )}

      {/* Schedule Tab */}
      {tab === 'schedule' && (
        <div className="space-y-2">
          {scheduled.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">📅</p>
              <p className="text-sm text-gray-500">No upcoming streams scheduled</p>
            </div>
          ) : scheduled.map(stream => (
            <div key={stream.id} className="card flex items-center gap-3">
              <div className="text-center bg-teal-50 dark:bg-teal-900/20 rounded-lg px-3 py-2">
                <p className="text-xs font-bold text-teal-700 dark:text-teal-400">{stream.scheduled_for ? new Date(stream.scheduled_for).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</p>
                <p className="text-[10px] text-teal-600">{stream.scheduled_for ? new Date(stream.scheduled_for).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{stream.title}</p>
                <p className="text-xs text-gray-500">{stream.channel?.name} · {stream.category}</p>
              </div>
              <button className="text-xs px-2 py-1 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded">Remind</button>
            </div>
          ))}
        </div>
      )}

      {/* Browse/DVR Tab */}
      {tab === 'browse' && (
        <div className="space-y-3">
          <div className="card text-center py-8">
            <p className="text-2xl mb-2">🎬</p>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">DVR & Recordings</p>
            <p className="text-xs text-gray-500 mt-1">Past streams and saved recordings appear here</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['Most Watched', 'Recent', 'Subscriptions', 'Saved'].map(cat => (
              <div key={cat} className="card p-3 text-center">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{cat}</p>
                <p className="text-[10px] text-gray-500">Coming soon</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
