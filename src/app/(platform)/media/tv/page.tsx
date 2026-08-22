'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { LiveKitVideoRoom } from '@/components/media/livekit-room';
import { isLiveKitAvailable } from '@/lib/calls/livekit-config';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

type TVTab = 'live' | 'schedule' | 'go-live';

interface Channel {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  category: string;
  is_live: boolean;
  viewers: number;
  created_at: string;
  owner?: { display_name: string };
}

const categories = ['All', 'News', 'Music', 'Talk', 'Education', 'Community', 'Sports', 'Faith'];

export default function MiTVPage() {
  const [activeTab, setActiveTab] = useState<TVTab>('live');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [watchingChannel, setWatchingChannel] = useState<Channel | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamCategory, setStreamCategory] = useState('Community');
  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadChannels(); }, []);

  async function loadChannels() {
    setLoading(true);
    const { data } = await supabase
      .from('tv_channels')
      .select('*, owner:profiles!tv_channels_owner_id_fkey(display_name)')
      .order('is_live', { ascending: false })
      .order('viewers', { ascending: false });
    if (data) setChannels(data);
    setLoading(false);
  }

  async function goLive() {
    if (!user || !streamTitle.trim()) { toast.error('Enter a stream title'); return; }
    if (!isLiveKitAvailable()) { toast.error('LiveKit not configured — contact admin'); return; }

    // Create/update channel
    const { data, error } = await supabase.from('tv_channels').upsert({
      owner_id: user.id,
      name: streamTitle.trim(),
      category: streamCategory,
      is_live: true,
      viewers: 0,
      description: `Live stream by ${user.display_name || 'Community Member'}`,
    }, { onConflict: 'owner_id' }).select().single();

    if (error) { toast.error('Failed to start stream'); return; }
    setIsStreaming(true);
    setWatchingChannel(data);
    toast.success('You are LIVE! 🔴');
  }

  function endStream() {
    if (user) {
      supabase.from('tv_channels').update({ is_live: false }).eq('owner_id', user.id);
    }
    setIsStreaming(false);
    setWatchingChannel(null);
    toast.success('Stream ended');
    loadChannels();
  }

  const filteredChannels = selectedCategory === 'All'
    ? channels
    : channels.filter(c => c.category === selectedCategory);

  // Watching a stream
  if (watchingChannel) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <button onClick={() => { setWatchingChannel(null); setIsStreaming(false); }} className="text-sm text-teal-600 hover:text-teal-700">← Back to TV</button>
          {watchingChannel.is_live && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">🔴 LIVE</span>}
        </div>

        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">{watchingChannel.name}</h1>
        <p className="text-sm text-gray-500">{watchingChannel.description}</p>

        <LiveKitVideoRoom
          roomName={`mitv-${watchingChannel.id}`}
          participantName={user?.display_name || 'Viewer'}
          onDisconnect={() => { setWatchingChannel(null); setIsStreaming(false); }}
          mode="stream"
        />

        {isStreaming && (
          <button onClick={endStream} className="btn-primary w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg">
            End Stream
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiTV</h1>
          <p className="text-xs text-gray-500">Community live streaming</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['live', 'schedule', 'go-live'] as TVTab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn('flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize', activeTab === tab ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
            {tab === 'go-live' ? '🔴 Go Live' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'live' && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap', selectedCategory === cat ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📺</p>
              <p className="text-gray-500">No streams right now</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to go live!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChannels.map(channel => (
                <button key={channel.id} onClick={() => setWatchingChannel(channel)} className="w-full card flex items-center gap-4 hover:shadow-md transition-shadow text-left">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-harbor-700 to-harbor-900 flex items-center justify-center text-2xl">
                    📺
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-harbor-800 dark:text-white truncate">{channel.name}</h3>
                      {channel.is_live && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">LIVE</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{(channel.owner as any)?.display_name || 'Anonymous'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-harbor-800 px-1.5 py-0.5 rounded">{channel.category}</span>
                      {channel.viewers > 0 && <span className="text-[10px] text-gray-400">👁 {channel.viewers}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">📅</p>
          <p className="text-gray-500">Schedule coming soon</p>
          <p className="text-sm text-gray-400 mt-1">Plan your streams and see what's upcoming</p>
        </div>
      )}

      {activeTab === 'go-live' && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800 dark:text-white">Start Streaming</h2>
          <p className="text-sm text-gray-500">Share your content with the community in real-time</p>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Stream Title</label>
            <input type="text" value={streamTitle} onChange={e => setStreamTitle(e.target.value)} className="input-field w-full" placeholder="What are you streaming today?" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select value={streamCategory} onChange={e => setStreamCategory(e.target.value)} className="input-field w-full">
              {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {!isLiveKitAvailable() && (
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 text-sm">
              ⚠️ LiveKit server not configured. Streaming requires NEXT_PUBLIC_LIVEKIT_URL to be set.
            </div>
          )}

          <button onClick={goLive} disabled={!streamTitle.trim() || !isLiveKitAvailable()} className="btn-teal w-full py-3 rounded-lg font-medium disabled:opacity-50">
            🔴 Go Live
          </button>
        </div>
      )}
    </div>
  );
}
