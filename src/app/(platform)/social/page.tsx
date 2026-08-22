'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface SocialPost { id: string; user_id: string; content: string; image_url: string | null; type: string; likes: number; comments_count: number; created_at: string; profiles?: { display_name: string; avatar_url: string | null }; }
interface Story { id: string; user_id: string; media_url: string; type: string; text_overlay: string | null; views: number; expires_at: string; profiles?: { display_name: string }; }
interface Reel { id: string; user_id: string; video_url: string; thumbnail_url: string | null; caption: string | null; likes: number; views: number; duration: number; created_at: string; profiles?: { display_name: string }; }

type SocialTab = 'feed' | 'stories' | 'reels' | 'discover';
type FeedMode = 'following' | 'foryou';

const REACTIONS = ['❤️', '🔥', '💪', '🤝', '👑', '😂'];

export default function SocialPage() {
  const [tab, setTab] = useState<SocialTab>('feed');
  const [feedMode, setFeedMode] = useState<FeedMode>('foryou');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  // New post
  const [newContent, setNewContent] = useState('');
  const [posting, setPosting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, [feedMode]);

  async function loadData() {
    const supabase = createClient();

    // Posts
    let query = supabase.from('feed_posts').select('*, profiles!feed_posts_user_id_fkey(display_name, avatar_url)');
    if (feedMode === 'following' && user) {
      const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
      const ids = following?.map(f => f.following_id) || [];
      if (ids.length > 0) query = query.in('user_id', ids);
    }
    const { data: p } = await query.order('created_at', { ascending: false }).limit(30);
    if (p) setPosts(p as any);

    // Stories (not expired)
    const { data: s } = await supabase.from('stories').select('*, profiles!stories_user_id_fkey(display_name)').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(20);
    if (s) setStories(s as any);

    // Reels
    const { data: r } = await supabase.from('reels').select('*, profiles!reels_user_id_fkey(display_name)').order('views', { ascending: false }).limit(20);
    if (r) setReels(r as any);

    setLoading(false);
  }

  async function handlePost() {
    if (!user || !newContent.trim()) return;
    setPosting(true);
    const supabase = createClient();
    await supabase.from('feed_posts').insert({ user_id: user.id, content: newContent.trim(), type: 'text' });
    setNewContent(''); setPosting(false); loadData();
  }

  async function handleReact(postId: string, reaction: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('social_reactions').upsert({ user_id: user.id, target_type: 'post', target_id: postId, reaction }, { onConflict: 'user_id,target_type,target_id' });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  }

  async function handleFollow(userId: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
  }

  function timeAgo(d: string) { const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 60) return 'now'; if (s < 3600) return `${Math.floor(s/60)}m`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`; }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiSocial</h1>
        <Link href="/social/profile" className="text-xs text-teal-600 font-medium">My Profile →</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([{ key: 'feed', label: '📰 Feed' }, { key: 'stories', label: '📷 Stories' }, { key: 'reels', label: '🎬 Reels' }, { key: 'discover', label: '🔍 Discover' }] as { key: SocialTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap', tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{t.label}</button>
        ))}
      </div>

      {/* Stories Bar */}
      {tab === 'feed' && stories.length > 0 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1">
          {stories.map(s => (
            <div key={s.id} className="flex-shrink-0 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-purple-500 p-0.5">
                <div className="w-full h-full rounded-full bg-white dark:bg-harbor-900 flex items-center justify-center text-lg">
                  📷
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5 truncate w-14">{(s.profiles as any)?.display_name?.split(' ')[0]}</p>
            </div>
          ))}
        </div>
      )}

      {/* Feed Tab */}
      {tab === 'feed' && (
        <div className="space-y-3">
          {/* Feed mode toggle */}
          <div className="flex gap-2">
            <button onClick={() => setFeedMode('foryou')} className={cn('px-3 py-1 rounded-full text-xs', feedMode === 'foryou' ? 'bg-harbor-800 text-white' : 'bg-gray-100 text-gray-600')}>For You</button>
            <button onClick={() => setFeedMode('following')} className={cn('px-3 py-1 rounded-full text-xs', feedMode === 'following' ? 'bg-harbor-800 text-white' : 'bg-gray-100 text-gray-600')}>Following</button>
          </div>

          {/* Compose */}
          {user && (
            <div className="card flex gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-bold text-teal-700 flex-shrink-0">{user.display_name?.charAt(0) || '?'}</div>
              <div className="flex-1">
                <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="What's happening?" className="w-full bg-transparent outline-none text-sm resize-none" rows={2} />
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-2 text-gray-400 text-sm">📷 🎥 📊</div>
                  <button onClick={handlePost} disabled={!newContent.trim() || posting} className="btn-teal text-xs !py-1.5 !px-4 disabled:opacity-50">{posting ? '...' : 'Post'}</button>
                </div>
              </div>
            </div>
          )}

          {/* Posts */}
          {loading ? [1,2,3].map(i => <div key={i} className="card skeleton h-32" />) :
          posts.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">No posts yet. Follow people or post something!</p></div> :
          posts.map(post => (
            <div key={post.id} className="card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-xs font-bold">{(post.profiles as any)?.display_name?.charAt(0) || '?'}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{(post.profiles as any)?.display_name}</p>
                  <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
                </div>
                <button onClick={() => handleFollow(post.user_id)} className="text-xs text-teal-600 font-medium">Follow</button>
              </div>
              <p className="text-sm text-harbor-700 dark:text-gray-200">{post.content}</p>
              {post.image_url && <img src={post.image_url} alt="" className="w-full rounded-lg mt-2 max-h-64 object-cover" />}
              <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-100 dark:border-harbor-800">
                <div className="flex gap-1">
                  {REACTIONS.slice(0, 3).map(r => (
                    <button key={r} onClick={() => handleReact(post.id, r)} className="text-sm hover:scale-125 transition-transform">{r}</button>
                  ))}
                </div>
                <span className="text-xs text-gray-400">{post.likes} reactions</span>
                <span className="text-xs text-gray-400">💬 {post.comments_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stories Tab */}
      {tab === 'stories' && (
        <div className="grid grid-cols-2 gap-3">
          {stories.length === 0 ? <div className="col-span-2 card text-center py-8"><p className="text-sm text-gray-500">No active stories.</p></div> :
          stories.map(s => (
            <div key={s.id} className="aspect-[9/16] rounded-xl overflow-hidden relative bg-gradient-to-br from-harbor-800 to-teal-600">
              {s.type === 'image' && <img src={s.media_url} alt="" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                {s.text_overlay && <p className="text-xs text-white font-medium">{s.text_overlay}</p>}
                <p className="text-[10px] text-white/70 mt-1">{(s.profiles as any)?.display_name} · {s.views} views</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reels Tab */}
      {tab === 'reels' && (
        <div className="space-y-3">
          {reels.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">No reels yet. Upload short videos!</p></div> :
          reels.map(r => (
            <div key={r.id} className="card flex gap-3">
              <div className="w-20 h-28 rounded-lg bg-gray-100 dark:bg-harbor-800 flex items-center justify-center text-2xl flex-shrink-0">🎬</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{(r.profiles as any)?.display_name}</p>
                {r.caption && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{r.caption}</p>}
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  <span>❤️ {r.likes}</span>
                  <span>👁️ {r.views}</span>
                  <span>⏱️ {r.duration}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discover Tab */}
      {tab === 'discover' && (
        <div className="space-y-3">
          <div className="card"><h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">🔥 Trending Hashtags</h3><div className="flex flex-wrap gap-2">{['#jacksonville','#milyfe','#community','#mly','#justice','#localfood','#creators'].map(tag => <span key={tag} className="text-xs bg-gray-100 dark:bg-harbor-800 px-2 py-1 rounded-full text-teal-600">{tag}</span>)}</div></div>
          <div className="card"><h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">👥 Suggested Follows</h3><p className="text-xs text-gray-500">Coming soon — based on your interests and neighborhood.</p></div>
        </div>
      )}
    </div>
  );
}
