'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useMediaStore } from '@/components/media/global-player';
import { cn } from '@/lib/utils/cn';

type MediaTab = 'feed' | 'music' | 'radio' | 'podcasts' | 'upload';

interface MediaItem {
  id: string;
  creator_id: string;
  type: string;
  title: string;
  description: string;
  file_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  category: string;
  plays: number;
  likes: number;
  created_at: string;
  profiles?: { display_name: string };
}

interface RadioStation {
  id: string;
  name: string;
  description: string;
  stream_url: string | null;
  genre: string;
  is_live: boolean;
  listeners: number;
  profiles?: { display_name: string };
}

export default function MediaPage() {
  const [tab, setTab] = useState<MediaTab>('feed');
  const [content, setContent] = useState<MediaItem[]>([]);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Upload state
  const [uTitle, setUTitle] = useState('');
  const [uDesc, setUDesc] = useState('');
  const [uType, setUType] = useState<'video' | 'music' | 'podcast_episode'>('video');
  const [uCategory, setUCategory] = useState('general');
  const [uFile, setUFile] = useState<File | null>(null);
  const [uThumb, setUThumb] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const { user } = useAppStore();
  const { setTrack } = useMediaStore();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('media_content')
        .select('*, profiles!media_content_creator_id_fkey(display_name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(30);

      if (data) setContent(data);

      const { data: radioData } = await supabase
        .from('radio_stations')
        .select('*, profiles!radio_stations_creator_id_fkey(display_name)')
        .order('listeners', { ascending: false });

      if (radioData) setStations(radioData);
      setLoading(false);
    };
    load();
  }, [supabase, uploadSuccess]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !uFile) return;
    setUploading(true);

    // Upload media file
    const fileExt = uFile.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}-${uTitle.replace(/\s+/g, '_')}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, uFile);

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
    let thumbnailUrl = null;

    // Upload thumbnail if provided
    if (uThumb) {
      const thumbPath = `${user.id}/thumb-${Date.now()}.${uThumb.name.split('.').pop()}`;
      await supabase.storage.from('media').upload(thumbPath, uThumb);
      const { data: thumbUrl } = supabase.storage.from('media').getPublicUrl(thumbPath);
      thumbnailUrl = thumbUrl.publicUrl;
    }

    // Create record
    await supabase.from('media_content').insert({
      creator_id: user.id,
      type: uType,
      title: uTitle.trim(),
      description: uDesc.trim(),
      file_url: urlData.publicUrl,
      thumbnail_url: thumbnailUrl,
      category: uCategory,
    });

    // Award MLY
    await supabase.from('mly_transactions').insert({
      to_id: user.id,
      amount: 5,
      type: 'earn',
      description: `Published ${uType}: ${uTitle.trim()}`,
    });

    setUploadSuccess(true);
    setUTitle(''); setUDesc(''); setUFile(null); setUThumb(null);
    setUploading(false);
    setTimeout(() => { setUploadSuccess(false); setTab('feed'); }, 2000);
  };

  const handlePlay = (item: MediaItem) => {
    if (item.type === 'video') {
      router.push(`/media/${item.id}`);
      return;
    }
    // Audio: use global player
    setTrack({
      id: item.id,
      title: item.title,
      artist: (item.profiles as any)?.display_name || 'Unknown',
      src: item.file_url!,
      thumbnail: item.thumbnail_url,
      type: item.type as any,
    });
    setPlaying(item);
    setIsPlaying(true);
    // Increment play count
    supabase.from('media_content').update({ plays: item.plays + 1 }).eq('id', item.id);
  };

  const handleLike = async (item: MediaItem) => {
    if (!user) return;
    await supabase.from('media_likes').insert({ media_id: item.id, user_id: user.id });
    await supabase.from('media_content').update({ likes: item.likes + 1 }).eq('id', item.id);
    setContent(prev => prev.map(c => c.id === item.id ? { ...c, likes: c.likes + 1 } : c));
  };

  const handleTip = async (item: MediaItem) => {
    if (!user || user.id === item.creator_id) return;
    await supabase.from('mly_transactions').insert({
      from_id: user.id,
      to_id: item.creator_id,
      amount: 1,
      type: 'transfer',
      description: `Tip for: ${item.title}`,
    });
    alert('Tipped $1 MLY!');
  };

  const videos = content.filter(c => c.type === 'video');
  const music = content.filter(c => c.type === 'music');
  const podcasts = content.filter(c => c.type === 'podcast_episode');

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiMedia</h1>
        <button onClick={() => setTab('upload')} className="btn-teal text-xs !py-2 !px-3">+ Upload</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {([
          { key: 'feed', label: '🎬 Video' },
          { key: 'music', label: '🎵 Music' },
          { key: 'radio', label: '📻 Radio' },
          { key: 'podcasts', label: '🎙️ Podcasts' },
          { key: 'upload', label: '⬆️ Upload' },
        ] as { key: MediaTab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Video Feed */}
      {tab === 'feed' && (
        <div className="space-y-4">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-48" />) :
          videos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">🎬</p>
              <p className="text-gray-500">No videos yet. Be the first creator.</p>
              <button onClick={() => setTab('upload')} className="btn-teal mt-3 text-sm">Upload Video</button>
            </div>
          ) : videos.map(item => (
            <div key={item.id} className="card overflow-hidden p-0">
              {/* Player */}
              <div className="relative aspect-video bg-black cursor-pointer" onClick={() => handlePlay(item)}>
                {playing?.id === item.id ? (
                  <video
                    src={item.file_url || ''}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    onEnded={() => setIsPlaying(false)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-harbor-900">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl">▶️</span>
                    )}
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-harbor-800 dark:text-white line-clamp-2">{item.title}</h3>
                <p className="text-xs text-gray-500">
                  {(item.profiles as any)?.display_name ?? 'Creator'} · {item.plays} plays · {getRelativeTime(item.created_at)}
                </p>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleLike(item)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-teal-500">
                    ❤️ {item.likes}
                  </button>
                  <button onClick={() => handleTip(item)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-mly-500">
                    💰 Tip $1
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Music */}
      {tab === 'music' && (
        <div className="space-y-3">
          {music.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">🎵</p>
              <p className="text-gray-500">No music uploaded yet.</p>
              <button onClick={() => { setUType('music'); setTab('upload'); }} className="btn-teal mt-3 text-sm">Upload Track</button>
            </div>
          ) : music.map(item => (
            <div key={item.id} className="card flex items-center gap-3">
              <button onClick={() => handlePlay(item)} className="w-12 h-12 rounded-xl bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-xl flex-shrink-0">
                {playing?.id === item.id && isPlaying ? '⏸️' : '▶️'}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{item.title}</p>
                <p className="text-xs text-gray-500">{(item.profiles as any)?.display_name} · {item.plays} plays</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleLike(item)} className="text-xs">❤️ {item.likes}</button>
                <button onClick={() => handleTip(item)} className="text-xs text-mly-500">💰</button>
              </div>
            </div>
          ))}

          {/* Persistent Mini Player */}
          {playing && playing.type === 'music' && (
            <div className="fixed bottom-20 left-0 right-0 z-30 px-4">
              <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto bg-harbor-800 text-white rounded-xl p-3 flex items-center gap-3 shadow-2xl">
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-lg">
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{playing.title}</p>
                  <p className="text-xs text-harbor-300">{(playing.profiles as any)?.display_name}</p>
                </div>
                <button onClick={() => { setPlaying(null); setIsPlaying(false); }} className="text-xs text-harbor-400">✕</button>
                <audio
                  src={playing.file_url || ''}
                  autoPlay={isPlaying}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                  ref={(el) => { if (el) { isPlaying ? el.play() : el.pause(); } }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Radio */}
      {tab === 'radio' && (
        <div className="space-y-3">
          {stations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📻</p>
              <p className="text-gray-500">No community radio stations yet.</p>
              <p className="text-xs text-gray-400 mt-1">Level 3+ members can create stations.</p>
            </div>
          ) : stations.map(station => (
            <div key={station.id} className="card flex items-center gap-3">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-xl',
                station.is_live ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-harbor-800'
              )}>
                {station.is_live ? '🔴' : '📻'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{station.name}</p>
                  {station.is_live && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse-soft">LIVE</span>}
                </div>
                <p className="text-xs text-gray-500">{station.genre} · {station.listeners} listening · {(station.profiles as any)?.display_name}</p>
              </div>
              {station.stream_url && (
                <button
                  onClick={() => {
                    setPlaying({ id: station.id, title: station.name, file_url: station.stream_url, type: 'music', profiles: station.profiles } as any);
                    setIsPlaying(true);
                  }}
                  className="btn-teal text-xs !py-1.5 !px-3"
                >
                  Tune In
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Podcasts */}
      {tab === 'podcasts' && (
        <div className="space-y-3">
          {podcasts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">🎙️</p>
              <p className="text-gray-500">No podcast episodes yet.</p>
              <button onClick={() => { setUType('podcast_episode'); setTab('upload'); }} className="btn-teal mt-3 text-sm">Upload Episode</button>
            </div>
          ) : podcasts.map(item => (
            <div key={item.id} className="card flex items-center gap-3">
              <button onClick={() => handlePlay(item)} className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xl flex-shrink-0">
                {playing?.id === item.id && isPlaying ? '⏸️' : '▶️'}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{item.title}</p>
                <p className="text-xs text-gray-500">{(item.profiles as any)?.display_name} · {item.plays} plays · {getRelativeTime(item.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload */}
      {tab === 'upload' && (
        <form onSubmit={handleUpload} className="card space-y-4">
          {uploadSuccess && (
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 text-sm">✓ Published! +$5 MLY earned.</div>
          )}
          <h2 className="font-medium text-harbor-800 dark:text-white">Upload Content</h2>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'video', icon: '🎬', label: 'Video' },
                { val: 'music', icon: '🎵', label: 'Music' },
                { val: 'podcast_episode', icon: '🎙️', label: 'Podcast' },
              ].map(t => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setUType(t.val as any)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-center transition-all',
                    uType === t.val ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-harbor-700'
                  )}
                >
                  <span className="text-xl">{t.icon}</span>
                  <p className="text-xs mt-1">{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Title</label>
            <input type="text" value={uTitle} onChange={e => setUTitle(e.target.value)} className="input-field !py-2 text-sm" placeholder="Give it a name" required />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea value={uDesc} onChange={e => setUDesc(e.target.value)} className="input-field !py-2 text-sm resize-none h-16" placeholder="What is this about?" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select value={uCategory} onChange={e => setUCategory(e.target.value)} className="input-field !py-2 text-sm">
              <option value="general">General</option>
              <option value="news">News & Journalism</option>
              <option value="education">Education</option>
              <option value="entertainment">Entertainment</option>
              <option value="music">Music</option>
              <option value="community">Community</option>
              <option value="sports">Sports</option>
              <option value="talk">Talk & Discussion</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {uType === 'video' ? 'Video File' : uType === 'music' ? 'Audio File' : 'Episode Audio'}
            </label>
            <input
              type="file"
              accept={uType === 'video' ? 'video/*' : 'audio/*'}
              onChange={e => setUFile(e.target.files?.[0] ?? null)}
              required
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-teal-50 file:text-teal-600"
            />
          </div>

          {uType === 'video' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thumbnail (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setUThumb(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-harbor-100 file:text-harbor-600"
              />
            </div>
          )}

          <button type="submit" disabled={uploading || !uFile || !uTitle.trim()} className="btn-teal w-full disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Publish (+$5 MLY)'}
          </button>
        </form>
      )}
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
