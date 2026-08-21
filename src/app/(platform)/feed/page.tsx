'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes: number;
  comments_count: number;
  created_at: string;
  profiles?: { display_name: string };
  user_liked?: boolean;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('feed_posts')
        .select('*, profiles!feed_posts_user_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(30);

      if (data && user) {
        const { data: likes } = await supabase.from('feed_likes').select('post_id').eq('user_id', user.id);
        const likedSet = new Set((likes || []).map((l: any) => l.post_id));
        setPosts(data.map(p => ({ ...p, user_liked: likedSet.has(p.id) })));
      } else if (data) {
        setPosts(data);
      }
      setLoading(false);
    };
    load();

    const channel = supabase.channel('feed').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_posts' }, () => load()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, supabase, posting]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPost.trim()) return;
    setPosting(true);

    let imageUrl = null;
    if (postImage) {
      const path = `${user.id}/feed-${Date.now()}.${postImage.name.split('.').pop()}`;
      await supabase.storage.from('media').upload(path, postImage);
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    await supabase.from('feed_posts').insert({ user_id: user.id, content: newPost.trim(), image_url: imageUrl });
    setNewPost(''); setPostImage(null); setPosting(false);
  };

  const handleLike = async (post: Post) => {
    if (!user) return;
    if (post.user_liked) {
      await supabase.from('feed_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      await supabase.from('feed_posts').update({ likes: post.likes - 1 }).eq('id', post.id);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: p.likes - 1, user_liked: false } : p));
    } else {
      await supabase.from('feed_likes').insert({ post_id: post.id, user_id: user.id });
      await supabase.from('feed_posts').update({ likes: post.likes + 1 }).eq('id', post.id);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: p.likes + 1, user_liked: true } : p));
    }
  };

  const getRelativeTime = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return 'now'; if (m < 60) return `${m}m`; const h = Math.floor(m / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; };

  return (
    <div className="space-y-4 animate-slide-up">
      <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Neighborhood Feed</h1>

      {/* Create Post */}
      <form onSubmit={handlePost} className="card space-y-3">
        <textarea value={newPost} onChange={e => setNewPost(e.target.value)} className="input-field !py-2 text-sm resize-none h-20" placeholder="What's happening on your block?" maxLength={500} />
        <div className="flex items-center justify-between">
          <label className="text-xs text-teal-500 cursor-pointer flex items-center gap-1">
            📷 <span>Photo</span>
            <input type="file" accept="image/*" onChange={e => setPostImage(e.target.files?.[0] || null)} className="hidden" />
          </label>
          <button type="submit" disabled={posting || !newPost.trim()} className="btn-teal text-xs !py-2 !px-4 disabled:opacity-50">
            {posting ? '...' : 'Post'}
          </button>
        </div>
        {postImage && <p className="text-xs text-gray-400">📎 {postImage.name}</p>}
      </form>

      {/* Posts */}
      {loading ? [1,2,3].map(i => <div key={i} className="card skeleton h-24" />) :
      posts.length === 0 ? (
        <div className="text-center py-12"><p className="text-4xl mb-2">📝</p><p className="text-gray-500">No posts yet. Say something!</p></div>
      ) : posts.map(post => (
        <div key={post.id} className="card space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-xs font-bold">
              {(post.profiles as any)?.display_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">{(post.profiles as any)?.display_name || 'Someone'}</p>
              <p className="text-[10px] text-gray-400">{getRelativeTime(post.created_at)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">{post.content}</p>
          {post.image_url && <img src={post.image_url} alt="" className="w-full rounded-xl max-h-64 object-cover" />}
          <div className="flex items-center gap-4 pt-1">
            <button onClick={() => handleLike(post)} className={cn('flex items-center gap-1 text-xs', post.user_liked ? 'text-red-500' : 'text-gray-400')}>
              {post.user_liked ? '❤️' : '🤍'} {post.likes}
            </button>
            <span className="text-xs text-gray-400">💬 {post.comments_count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
