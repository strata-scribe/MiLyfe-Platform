'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

const NovelEditor = dynamic(
  () => import('@/components/editor/novel-editor').then(m => ({ default: m.NovelEditor })),
  { ssr: false, loading: () => <div className="h-[300px] rounded-lg bg-gray-100 dark:bg-harbor-800 animate-pulse" /> }
);

interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  category: string;
  series_id: string | null;
  status: 'draft' | 'published';
  reading_time: number;
  likes: number;
  published_at: string | null;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null };
}

type BlogTab = 'feed' | 'write' | 'my-posts';

const CATEGORIES = ['Tech', 'Community', 'Personal', 'Tutorial', 'Opinion', 'News'];

export default function MiBlogPage() {
  const [tab, setTab] = useState<BlogTab>('feed');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [myPosts, setMyPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Write form
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [writeCategory, setWriteCategory] = useState('Community');
  const [writeSeries, setWriteSeries] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    if (tab === 'my-posts' && user) loadMyPosts();
  }, [tab, user]);

  async function loadFeed() {
    setLoading(true);
    const { data } = await supabase
      .from('blog_posts')
      .select('*, profiles!blog_posts_author_id_fkey(display_name, avatar_url)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);
    if (data) setPosts(data as BlogPost[]);
    setLoading(false);
  }

  async function loadMyPosts() {
    if (!user) return;
    const { data } = await supabase
      .from('blog_posts')
      .select('*, profiles!blog_posts_author_id_fkey(display_name, avatar_url)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setMyPosts(data as BlogPost[]);
  }

  async function publishPost() {
    if (!user || !writeTitle.trim() || !writeContent.trim()) return;
    setPublishing(true);

    let coverUrl: string | null = null;
    if (coverFile) {
      const path = `blog/${user.id}/${Date.now()}-cover.${coverFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('media').upload(path, coverFile);
      if (!error) {
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }
    }

    const wordCount = writeContent.trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.round(wordCount / 200));

    const { error } = await supabase.from('blog_posts').insert({
      author_id: user.id,
      title: writeTitle.trim(),
      content: writeContent.trim(),
      excerpt: writeContent.trim().substring(0, 160),
      cover_image: coverUrl,
      category: writeCategory,
      series_id: writeSeries || null,
      status: 'published',
      reading_time: readingTime,
      likes: 0,
      published_at: new Date().toISOString(),
    });

    if (error) {
      toast.error('Failed to publish post');
    } else {
      toast.success('Blog post published!');
      setWriteTitle('');
      setWriteContent('');
      setCoverFile(null);
      setTab('feed');
      loadFeed();
    }
    setPublishing(false);
  }

  async function deletePost(postId: string) {
    await supabase.from('blog_posts').delete().eq('id', postId);
    toast.success('Post deleted');
    loadMyPosts();
  }

  function timeAgo(date: string): string {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">MiBlog</h1>
          <p className="text-xs text-gray-500">Community stories & knowledge sharing</p>
        </div>
        {user && (
          <button onClick={() => setTab('write')} className="btn-teal text-xs">
            ✍️ Write
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {([
          { key: 'feed' as BlogTab, label: 'Feed' },
          { key: 'write' as BlogTab, label: 'Write' },
          { key: 'my-posts' as BlogTab, label: 'My Posts' },
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

      {/* Feed Tab */}
      {tab === 'feed' && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-32 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />
            ))
          ) : posts.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-3xl mb-2">✍️</p>
              <p className="text-sm text-gray-500">No blog posts yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to share your story</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="card space-y-2">
                {post.cover_image && (
                  <div className="aspect-[3/1] rounded-lg overflow-hidden bg-gray-100 dark:bg-harbor-800">
                    <img src={post.cover_image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-[10px] font-bold">
                    {(post.profiles as any)?.display_name?.charAt(0) || '?'}
                  </div>
                  <span className="text-xs text-gray-500">{(post.profiles as any)?.display_name}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-harbor-800 rounded-full text-gray-500">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{post.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>{post.reading_time} min read</span>
                  <span>❤️ {post.likes}</span>
                  <span className="ml-auto">{post.published_at ? timeAgo(post.published_at) : ''}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Write Tab */}
      {tab === 'write' && user && (
        <div className="card space-y-4">
          <input
            value={writeTitle}
            onChange={e => setWriteTitle(e.target.value)}
            placeholder="Post title"
            className="input-field text-lg font-bold"
          />

          <NovelEditor
            placeholder="Start writing... (use / for commands)"
            onTextChange={(text) => setWriteContent(text)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Category</label>
              <select
                value={writeCategory}
                onChange={e => setWriteCategory(e.target.value)}
                className="input-field"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Series (optional)</label>
              <input
                value={writeSeries}
                onChange={e => setWriteSeries(e.target.value)}
                placeholder="Series name"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Cover Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setCoverFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-teal-50 file:text-teal-600"
            />
          </div>

          <button
            onClick={publishPost}
            disabled={!writeTitle.trim() || !writeContent.trim() || publishing}
            className="btn-teal w-full disabled:opacity-50"
          >
            {publishing ? 'Publishing...' : 'Publish Post'}
          </button>
        </div>
      )}

      {/* My Posts Tab */}
      {tab === 'my-posts' && (
        <div className="space-y-3">
          {!user ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">Sign in to see your posts</p>
            </div>
          ) : myPosts.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">📝</p>
              <p className="text-sm text-gray-500">You haven&apos;t written any posts yet</p>
              <button onClick={() => setTab('write')} className="btn-teal text-xs mt-3">Write Your First Post</button>
            </div>
          ) : (
            myPosts.map(post => (
              <div key={post.id} className="card flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-medium',
                      post.status === 'published'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    )}>
                      {post.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{post.category}</span>
                  </div>
                  <h3 className="text-sm font-medium text-harbor-800 dark:text-white mt-1">{post.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {post.reading_time} min read · ❤️ {post.likes} · {post.published_at ? timeAgo(post.published_at) : 'Draft'}
                  </p>
                </div>
                <button
                  onClick={() => deletePost(post.id)}
                  className="text-xs text-red-500 hover:text-red-600 flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
