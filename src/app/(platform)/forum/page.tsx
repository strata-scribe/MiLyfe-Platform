'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Space { id: string; name: string; slug: string; description: string; icon: string; member_count: number; post_count: number; }
interface Post { id: string; space_id: string; author_id: string; type: string; title: string; body: string | null; url: string | null; image_url: string | null; upvotes: number; downvotes: number; comment_count: number; pinned: boolean; created_at: string; profiles?: { display_name: string }; forum_spaces?: { name: string; slug: string; icon: string }; }

type ForumTab = 'feed' | 'spaces' | 'create';
type SortMode = 'hot' | 'new' | 'top';

export default function ForumPage() {
  const [tab, setTab] = useState<ForumTab>('feed');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sort, setSort] = useState<SortMode>('hot');
  const [loading, setLoading] = useState(true);

  // Create space form
  const [spaceName, setSpaceName] = useState('');
  const [spaceDesc, setSpaceDesc] = useState('');
  const [spaceIcon, setSpaceIcon] = useState('💬');
  const [creating, setCreating] = useState(false);

  // Create post form
  const [showNewPost, setShowNewPost] = useState(false);
  const [postSpaceId, setPostSpaceId] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postType, setPostType] = useState<'text' | 'link' | 'image'>('text');
  const [postUrl, setPostUrl] = useState('');
  const [posting, setPosting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, [sort]);

  async function loadData() {
    const supabase = createClient();
    const { data: s } = await supabase.from('forum_spaces').select('*').order('member_count', { ascending: false });
    if (s) setSpaces(s);

    let postQuery = supabase.from('forum_posts').select('*, profiles!forum_posts_author_id_fkey(display_name), forum_spaces!forum_posts_space_id_fkey(name, slug, icon)');
    if (sort === 'hot') postQuery = postQuery.order('upvotes', { ascending: false });
    else if (sort === 'new') postQuery = postQuery.order('created_at', { ascending: false });
    else postQuery = postQuery.order('upvotes', { ascending: false });
    const { data: p } = await postQuery.limit(30);
    if (p) setPosts(p as any);
    setLoading(false);
  }

  async function createSpace() {
    if (!user || !spaceName.trim()) return;
    setCreating(true);
    const supabase = createClient();
    const slug = spaceName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { data } = await supabase.from('forum_spaces').insert({ name: spaceName.trim(), slug, description: spaceDesc.trim(), icon: spaceIcon, creator_id: user.id }).select().single();
    if (data) {
      await supabase.from('forum_memberships').insert({ space_id: data.id, user_id: user.id, role: 'creator' });
      setSpaceName(''); setSpaceDesc(''); setTab('spaces');
    }
    setCreating(false); loadData();
  }

  async function createPost() {
    if (!user || !postTitle.trim() || !postSpaceId) return;
    setPosting(true);
    const supabase = createClient();
    await supabase.from('forum_posts').insert({ space_id: postSpaceId, author_id: user.id, type: postType, title: postTitle.trim(), body: postBody.trim() || null, url: postUrl.trim() || null });
    setPostTitle(''); setPostBody(''); setPostUrl(''); setShowNewPost(false); setPosting(false); loadData();
  }

  async function vote(postId: string, direction: 1 | -1) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('forum_votes').upsert({ user_id: user.id, target_type: 'post', target_id: postId, direction }, { onConflict: 'user_id,target_type,target_id' });
    const field = direction === 1 ? 'upvotes' : 'downvotes';
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, [field]: p[field as 'upvotes' | 'downvotes'] + 1 } : p));
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'now'; if (s < 3600) return `${Math.floor(s/60)}m`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`;
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiForum</h1>
        <div className="flex gap-2">
          {user && <button onClick={() => setShowNewPost(!showNewPost)} className="btn-teal text-xs">+ Post</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['feed', 'spaces', 'create'] as ForumTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'create' ? '+ Space' : t}</button>
        ))}
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">New Post</h3>
          <select value={postSpaceId} onChange={e => setPostSpaceId(e.target.value)} className="input-field">
            <option value="">Select a space...</option>
            {spaces.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
          <div className="flex gap-2">
            {(['text', 'link', 'image'] as const).map(t => (
              <button key={t} onClick={() => setPostType(t)} className={cn('px-3 py-1 rounded text-xs capitalize', postType === t ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{t}</button>
            ))}
          </div>
          <input value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="Post title" className="input-field" />
          {postType === 'text' && <textarea value={postBody} onChange={e => setPostBody(e.target.value)} placeholder="What's on your mind?" className="input-field resize-none" rows={4} />}
          {postType === 'link' && <input value={postUrl} onChange={e => setPostUrl(e.target.value)} placeholder="https://..." className="input-field" />}
          <button onClick={createPost} disabled={!postTitle.trim() || !postSpaceId || posting} className="btn-teal w-full disabled:opacity-50">{posting ? 'Posting...' : 'Post to Forum'}</button>
        </div>
      )}

      {/* Feed */}
      {tab === 'feed' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['hot', 'new', 'top'] as SortMode[]).map(s => (
              <button key={s} onClick={() => setSort(s)} className={cn('px-3 py-1 rounded-full text-xs capitalize', sort === s ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>
                {s === 'hot' ? '🔥' : s === 'new' ? '🆕' : '📈'} {s}
              </button>
            ))}
          </div>
          {loading ? [1,2,3].map(i => <div key={i} className="card skeleton h-24" />) :
          posts.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">No posts yet. Be the first!</p></div> :
          posts.map(post => (
            <div key={post.id} className="card flex gap-3">
              {/* Vote buttons */}
              <div className="flex flex-col items-center gap-0.5 text-xs">
                <button onClick={() => vote(post.id, 1)} className="text-gray-400 hover:text-teal-500">▲</button>
                <span className="font-bold text-harbor-800 dark:text-white">{post.upvotes - post.downvotes}</span>
                <button onClick={() => vote(post.id, -1)} className="text-gray-400 hover:text-red-500">▼</button>
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <span>{(post.forum_spaces as any)?.icon} {(post.forum_spaces as any)?.name}</span>
                  <span>·</span>
                  <span>{(post.profiles as any)?.display_name}</span>
                  <span>·</span>
                  <span>{timeAgo(post.created_at)}</span>
                </div>
                <h3 className="text-sm font-medium text-harbor-800 dark:text-white">{post.title}</h3>
                {post.body && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{post.body}</p>}
                {post.url && <a href={post.url} target="_blank" rel="noopener" className="text-xs text-teal-600 hover:underline mt-1 block truncate">🔗 {post.url}</a>}
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  <span>💬 {post.comment_count}</span>
                  <span>📤 Share</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Spaces */}
      {tab === 'spaces' && (
        <div className="space-y-2">
          {spaces.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">No spaces yet. Create the first!</p></div> :
          spaces.map(space => (
            <Link key={space.id} href={`/forum/${space.slug}`} className="card flex items-center gap-3 hover:shadow-md transition-shadow">
              <span className="text-2xl">{space.icon}</span>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-harbor-800 dark:text-white">{space.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-1">{space.description}</p>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>{space.member_count} members</p>
                <p>{space.post_count} posts</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Space */}
      {tab === 'create' && user && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Create a Space</h3>
          <p className="text-xs text-gray-500">Spaces are community pages anyone can join and post in.</p>
          <div className="flex gap-2">
            <input value={spaceIcon} onChange={e => setSpaceIcon(e.target.value)} className="input-field w-14 text-center text-xl" maxLength={2} />
            <input value={spaceName} onChange={e => setSpaceName(e.target.value)} placeholder="Space name" className="input-field flex-1" />
          </div>
          <textarea value={spaceDesc} onChange={e => setSpaceDesc(e.target.value)} placeholder="What is this space about?" className="input-field resize-none" rows={3} />
          <button onClick={createSpace} disabled={!spaceName.trim() || creating} className="btn-teal w-full disabled:opacity-50">{creating ? 'Creating...' : 'Create Space'}</button>
        </div>
      )}
    </div>
  );
}
