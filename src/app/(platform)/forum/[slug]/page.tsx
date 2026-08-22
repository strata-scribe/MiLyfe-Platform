'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Space { id: string; name: string; slug: string; description: string; icon: string; rules: string | null; member_count: number; post_count: number; creator_id: string; }
interface Post { id: string; author_id: string; type: string; title: string; body: string | null; url: string | null; upvotes: number; downvotes: number; comment_count: number; pinned: boolean; created_at: string; profiles?: { display_name: string }; }

type SortMode = 'hot' | 'new' | 'top';

export default function ForumSpacePage() {
  const { slug } = useParams();
  const [space, setSpace] = useState<Space | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sort, setSort] = useState<SortMode>('hot');
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  // New post
  const [showPost, setShowPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [posting, setPosting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadSpace(); }, [slug, sort]);

  async function loadSpace() {
    const supabase = createClient();
    const { data: s } = await supabase.from('forum_spaces').select('*').eq('slug', slug).single();
    if (s) {
      setSpace(s);
      // Check membership
      if (user) {
        const { data: mem } = await supabase.from('forum_memberships').select('user_id').eq('space_id', s.id).eq('user_id', user.id).single();
        setIsMember(!!mem);
      }
      // Load posts
      let q = supabase.from('forum_posts').select('*, profiles!forum_posts_author_id_fkey(display_name)').eq('space_id', s.id);
      if (sort === 'hot') q = q.order('upvotes', { ascending: false });
      else if (sort === 'new') q = q.order('created_at', { ascending: false });
      else q = q.order('upvotes', { ascending: false });
      const { data: p } = await q.limit(30);
      if (p) setPosts(p as any);
    }
    setLoading(false);
  }

  async function joinSpace() {
    if (!user || !space) return;
    const supabase = createClient();
    await supabase.from('forum_memberships').insert({ space_id: space.id, user_id: user.id });
    setIsMember(true);
  }

  async function createPost() {
    if (!user || !space || !postTitle.trim()) return;
    setPosting(true);
    const supabase = createClient();
    await supabase.from('forum_posts').insert({ space_id: space.id, author_id: user.id, type: 'text', title: postTitle.trim(), body: postBody.trim() || null });
    setPostTitle(''); setPostBody(''); setShowPost(false); setPosting(false); loadSpace();
  }

  async function vote(postId: string, direction: 1 | -1) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('forum_votes').upsert({ user_id: user.id, target_type: 'post', target_id: postId, direction }, { onConflict: 'user_id,target_type,target_id' });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, [direction === 1 ? 'upvotes' : 'downvotes']: p[direction === 1 ? 'upvotes' : 'downvotes'] + 1 } : p));
  }

  function timeAgo(d: string) { const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 60) return 'now'; if (s < 3600) return `${Math.floor(s/60)}m`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`; }

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-20 bg-gray-200 dark:bg-harbor-800 rounded-xl" /><div className="h-32 bg-gray-200 dark:bg-harbor-800 rounded-xl" /></div>;
  if (!space) return <div className="text-center py-12"><p className="text-sm text-gray-500">Space not found.</p><Link href="/forum" className="text-xs text-teal-600">← Back to Forum</Link></div>;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{space.icon}</span>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-harbor-800 dark:text-white">{space.name}</h1>
            <p className="text-xs text-gray-500">{space.description}</p>
            <p className="text-xs text-gray-400 mt-1">{space.member_count} members · {space.post_count} posts</p>
          </div>
          {user && !isMember && <button onClick={joinSpace} className="btn-teal text-xs">Join</button>}
          {isMember && <span className="text-xs text-teal-600 font-medium">✓ Joined</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['hot', 'new', 'top'] as SortMode[]).map(s => (
            <button key={s} onClick={() => setSort(s)} className={cn('px-3 py-1 rounded-full text-xs capitalize', sort === s ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{s}</button>
          ))}
        </div>
        {isMember && <button onClick={() => setShowPost(!showPost)} className="btn-teal text-xs">+ Post</button>}
      </div>

      {/* New post form */}
      {showPost && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <input value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="Post title" className="input-field" />
          <textarea value={postBody} onChange={e => setPostBody(e.target.value)} placeholder="Body (optional)" className="input-field resize-none" rows={4} />
          <button onClick={createPost} disabled={!postTitle.trim() || posting} className="btn-teal w-full disabled:opacity-50">{posting ? 'Posting...' : 'Post'}</button>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="card text-center py-8"><p className="text-sm text-gray-500">No posts in this space yet.</p></div>
      ) : posts.map(post => (
        <div key={post.id} className={cn('card flex gap-3', post.pinned && 'border-l-4 border-l-amber-400')}>
          <div className="flex flex-col items-center gap-0.5 text-xs">
            <button onClick={() => vote(post.id, 1)} className="text-gray-400 hover:text-teal-500">▲</button>
            <span className="font-bold text-harbor-800 dark:text-white">{post.upvotes - post.downvotes}</span>
            <button onClick={() => vote(post.id, -1)} className="text-gray-400 hover:text-red-500">▼</button>
          </div>
          <div className="flex-1 min-w-0">
            {post.pinned && <span className="text-xs text-amber-600 font-medium">📌 Pinned</span>}
            <h3 className="text-sm font-medium text-harbor-800 dark:text-white">{post.title}</h3>
            {post.body && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-3">{post.body}</p>}
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              <span>{(post.profiles as any)?.display_name}</span>
              <span>{timeAgo(post.created_at)}</span>
              <span>💬 {post.comment_count}</span>
            </div>
          </div>
        </div>
      ))}

      <Link href="/forum" className="text-xs text-teal-600 hover:underline">← All Spaces</Link>
    </div>
  );
}
