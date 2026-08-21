'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { MediaPlayer } from '@/components/media/player';
import { useMediaStore } from '@/components/media/global-player';
import { cn } from '@/lib/utils/cn';

interface MediaItem {
  id: string; creator_id: string; type: string; title: string; description: string;
  file_url: string | null; thumbnail_url: string | null; duration: number | null;
  category: string; plays: number; likes: number; created_at: string;
  profiles?: { display_name: string; avatar_url: string | null };
}

interface Comment {
  id: string; user_id: string; content: string; created_at: string;
  profiles?: { display_name: string };
}

export default function MediaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [related, setRelated] = useState<MediaItem[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const { user } = useAppStore();
  const { setTrack } = useMediaStore();
  const supabase = createClient();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      // Fetch media
      const { data } = await supabase
        .from('media_content')
        .select('*, profiles!media_content_creator_id_fkey(display_name, avatar_url)')
        .eq('id', id)
        .single();

      if (!data) { setLoading(false); return; }
      setMedia(data);
      setLikeCount(data.likes);

      // Increment plays
      await supabase.from('media_content').update({ plays: data.plays + 1 }).eq('id', id);

      // Check if user liked
      if (user) {
        const { data: likeData } = await supabase.from('media_likes').select('media_id').eq('media_id', id).eq('user_id', user.id).maybeSingle();
        setLiked(!!likeData);
      }

      // Fetch comments
      const { data: commentsData } = await supabase
        .from('media_comments')
        .select('*, profiles!media_comments_user_id_fkey(display_name)')
        .eq('media_id', id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (commentsData) setComments(commentsData);

      // Fetch related (same type, different id)
      const { data: relatedData } = await supabase
        .from('media_content')
        .select('*, profiles!media_content_creator_id_fkey(display_name, avatar_url)')
        .eq('type', data.type)
        .neq('id', id)
        .eq('status', 'published')
        .order('plays', { ascending: false })
        .limit(5);
      if (relatedData) setRelated(relatedData);

      setLoading(false);
    };
    load();
  }, [id, user, supabase]);

  const handleLike = async () => {
    if (!user || !media) return;
    if (liked) {
      await supabase.from('media_likes').delete().eq('media_id', media.id).eq('user_id', user.id);
      setLiked(false);
      setLikeCount(c => c - 1);
      await supabase.from('media_content').update({ likes: likeCount - 1 }).eq('id', media.id);
    } else {
      await supabase.from('media_likes').insert({ media_id: media.id, user_id: user.id });
      setLiked(true);
      setLikeCount(c => c + 1);
      await supabase.from('media_content').update({ likes: likeCount + 1 }).eq('id', media.id);
    }
  };

  const handleTip = async () => {
    if (!user || !media || user.id === media.creator_id) return;
    await supabase.from('mly_transactions').insert({ from_id: user.id, to_id: media.creator_id, amount: 1, type: 'transfer', description: `Tip: ${media.title}` });
    await supabase.rpc('increment_balance', { user_id: media.creator_id, amount: 1 });
    await supabase.rpc('increment_balance', { user_id: user.id, amount: -1 });
    alert('Tipped $1 MLY!');
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !media || !newComment.trim()) return;
    setPosting(true);
    const { data } = await supabase.from('media_comments').insert({ media_id: media.id, user_id: user.id, content: newComment.trim() }).select('*, profiles!media_comments_user_id_fkey(display_name)').single();
    if (data) setComments(prev => [data, ...prev]);
    setNewComment('');
    setPosting(false);
  };

  const playAudio = (item: MediaItem) => {
    setTrack({ id: item.id, title: item.title, artist: (item.profiles as any)?.display_name || 'Unknown', src: item.file_url!, thumbnail: item.thumbnail_url, type: item.type as any });
  };

  const getRelativeTime = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return 'now'; if (m < 60) return `${m}m`; const h = Math.floor(m / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; };

  if (loading) return <div className="space-y-4 animate-slide-up"><div className="skeleton aspect-video rounded-xl" /><div className="skeleton h-6 w-48" /><div className="skeleton h-4 w-32" /></div>;

  if (!media) return <div className="text-center py-16"><p className="text-4xl mb-2">🎬</p><p className="text-gray-500">Content not found.</p><button onClick={() => router.push('/media')} className="btn-teal mt-4 text-sm">Back to Media</button></div>;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Back nav */}
      <button onClick={() => router.push('/media')} className="text-teal-500 text-sm">← MiMedia</button>

      {/* Player */}
      {media.type === 'video' ? (
        <MediaPlayer src={media.file_url!} type="video" poster={media.thumbnail_url} autoPlay />
      ) : (
        <MediaPlayer src={media.file_url!} type="audio" title={media.title} artist={(media.profiles as any)?.display_name} poster={media.thumbnail_url} autoPlay onPlay={() => playAudio(media)} />
      )}

      {/* Title + Meta */}
      <div>
        <h1 className="text-lg font-bold text-harbor-800 dark:text-white">{media.title}</h1>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>{media.plays + 1} plays</span>
          <span>{getRelativeTime(media.created_at)}</span>
          <span className="capitalize">{media.category}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={handleLike} className={cn('flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all', liked ? 'bg-red-100 dark:bg-red-900/20 text-red-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
          {liked ? '❤️' : '🤍'} {likeCount}
        </button>
        <button onClick={handleTip} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-mly-50 dark:bg-mly-900/20 text-mly-600">
          💰 Tip $1
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300">
          🔗 Share
        </button>
      </div>

      {/* Creator */}
      <div className="card flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-sm font-bold">
          {(media.profiles as any)?.display_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-harbor-800 dark:text-white">{(media.profiles as any)?.display_name}</p>
          <p className="text-xs text-gray-500">Creator</p>
        </div>
      </div>

      {/* Description */}
      {media.description && (
        <div className="card">
          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">{media.description}</p>
        </div>
      )}

      {/* Comments */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500">{comments.length} Comment{comments.length !== 1 ? 's' : ''}</h2>

        <form onSubmit={handleComment} className="flex gap-2">
          <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} className="input-field !py-2 text-sm flex-1" placeholder="Add a comment..." maxLength={300} />
          <button type="submit" disabled={posting || !newComment.trim()} className="btn-teal text-sm !py-2 !px-4 disabled:opacity-50">Post</button>
        </form>

        {comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              {(c.profiles as any)?.display_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-harbor-800 dark:text-white">{(c.profiles as any)?.display_name}</span>
                <span className="text-[10px] text-gray-400">{getRelativeTime(c.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500">More like this</h2>
          {related.map(item => (
            <button key={item.id} onClick={() => router.push(`/media/${item.id}`)} className="card w-full flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-harbor-900 transition-colors">
              <div className="w-16 h-12 rounded-lg bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.thumbnail_url ? <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">{item.type === 'video' ? '🎬' : '🎵'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{item.title}</p>
                <p className="text-xs text-gray-500">{(item.profiles as any)?.display_name} · {item.plays} plays</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
