'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

// Dynamic import Novel editor (heavy library — code split)
const NovelEditor = dynamic(() => import('@/components/editor/novel-editor').then(m => ({ default: m.NovelEditor })), {
  ssr: false,
  loading: () => <div className="h-[300px] rounded-lg bg-gray-100 dark:bg-harbor-800 animate-pulse" />,
});

interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string | null;
  series_id: string | null;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  published_at: string | null;
  views: number;
  likes: number;
  comment_count: number;
  read_time: number;
  newsletter_sent: boolean;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null };
  series?: { title: string };
}

interface BlogSeries {
  id: string;
  author_id: string;
  title: string;
  description: string;
  post_count: number;
  subscribers: number;
  created_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes: number;
  created_at: string;
  profiles?: { display_name: string };
}

type BlogTab = 'feed' | 'series' | 'write' | 'my';
type SortMode = 'recent' | 'popular' | 'discussed';

export default function MiBlogPage() {
  const [tab, setTab] = useState<BlogTab>('feed');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [series, setSeries] = useState<BlogSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>('recent');
  const [selectedTag, setSelectedTag] = useState('all');

  // Write form
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [writeTags, setWriteTags] = useState('');
  const [writeExcerpt, setWriteExcerpt] = useState('');
  const [writeSeries, setWriteSeries] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, [sort, selectedTag]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    let postQuery = supabase.from('media_blog_posts').select('*, profiles!media_blog_posts_author_id_fkey(display_name, avatar_url), series:media_blog_series(title)').eq('status', 'published');
    if (sort === 'recent') postQuery = postQuery.order('published_at', { ascending: false });
    else if (sort === 'popular') postQuery = postQuery.order('views', { ascending: false });
    else postQuery = postQuery.order('comment_count', { ascending: false });
    if (selectedTag !== 'all') postQuery = postQuery.contains('tags', [selectedTag]);
    const { data: p } = await postQuery.limit(20);
    if (p) setPosts(p as any);

    const { data: s } = await supabase.from('media_blog_series').select('*').order('subscribers', { ascending: false });
    if (s) setSeries(s);

    setLoading(false);
  }

  async function publishPost() {
    if (!user || !writeTitle.trim() || !writeContent.trim()) return;
    setPublishing(true);
    const supabase = createClient();
    const slug = writeTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 60);
    const tags = writeTags.split(',').map(t => t.trim()).filter(Boolean);
    const wordCount = writeContent.trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.round(wordCount / 200));

    await supabase.from('media_blog_posts').insert({
      author_id: user.id, title: writeTitle.trim(), slug,
      content: writeContent.trim(), excerpt: writeExcerpt.trim() || writeContent.trim().substring(0, 160),
      tags, status: 'published', published_at: new Date().toISOString(),
      views: 0, likes: 0, comment_count: 0, read_time: readTime,
      newsletter_sent: false, series_id: writeSeries || null,
    });
    setWriteTitle(''); setWriteContent(''); setWriteTags(''); setWriteExcerpt('');
    setTab('feed'); setPublishing(false);
    loadData();
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    if (s < 604800) return `${Math.floor(s / 86400)}d`;
    return new Date(date).toLocaleDateString();
  }

  const TAGS = ['all', 'culture', 'tech', 'community', 'health', 'politics', 'art', 'education', 'lifestyle'];

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/media" className="text-gray-400 hover:text-gray-600 text-sm">← Media</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">MiBlog</h1>
          <p className="text-xs text-gray-500">Community stories & writing</p>
        </div>
        {user && <button onClick={() => setTab('write')} className="btn-teal text-xs">✍️ Write</button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['feed', 'series', 'write', 'my'] as BlogTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'my' ? 'My Posts' : t}</button>
        ))}
      </div>

      {/* Feed Tab */}
      {tab === 'feed' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setSelectedTag(tag)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap capitalize', selectedTag === tag ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{tag}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['recent', 'popular', 'discussed'] as SortMode[]).map(s => (
              <button key={s} onClick={() => setSort(s)} className={cn('px-3 py-1 rounded-full text-xs capitalize', sort === s ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{s}</button>
            ))}
          </div>

          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-28" />) :
            posts.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">✍️</p>
                <p className="text-sm text-gray-500">No blog posts yet</p>
                <p className="text-xs text-gray-400 mt-1">Be the first to write something!</p>
              </div>
            ) : posts.map(post => (
              <Link key={post.id} href={`/media/blog/${post.slug}`} className="card block hover:shadow-md transition-shadow">
                {post.cover_image && (
                  <div className="aspect-[3/1] bg-gray-100 dark:bg-harbor-800 rounded-lg mb-3 overflow-hidden">
                    <img src={post.cover_image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-[10px]">
                    {(post.profiles as any)?.display_name?.charAt(0) || '?'}
                  </div>
                  <span className="text-xs text-gray-500">{(post.profiles as any)?.display_name}</span>
                  {post.series && <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">{(post.series as any)?.title}</span>}
                </div>
                <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{post.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{post.excerpt}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                  <span>{post.read_time} min read</span>
                  <span>👁 {post.views}</span>
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comment_count}</span>
                  <span className="ml-auto">{post.published_at ? timeAgo(post.published_at) : ''}</span>
                </div>
                {post.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {post.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-harbor-800 text-gray-500 rounded">{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))
          }
        </div>
      )}

      {/* Series Tab */}
      {tab === 'series' && (
        <div className="space-y-2">
          {series.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">📚</p>
              <p className="text-sm text-gray-500">No blog series yet</p>
              <p className="text-xs text-gray-400 mt-1">Create a series to group related posts</p>
            </div>
          ) : series.map(s => (
            <div key={s.id} className="card flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <span className="text-lg">📚</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{s.title}</p>
                <p className="text-xs text-gray-500">{s.post_count} posts · {s.subscribers} subscribers</p>
              </div>
              <button className="text-xs px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg">Follow</button>
            </div>
          ))}
        </div>
      )}

      {/* Write Tab */}
      {tab === 'write' && user && (
        <div className="space-y-3">
          <div className="card space-y-3">
            <input value={writeTitle} onChange={e => setWriteTitle(e.target.value)} placeholder="Post title" className="input-field text-lg font-bold" />
            <NovelEditor
              placeholder="Start writing your story... (use / for commands)"
              onTextChange={(text) => setWriteContent(text)}
            />
            <input value={writeExcerpt} onChange={e => setWriteExcerpt(e.target.value)} placeholder="Short excerpt (optional — auto-generated from content)" className="input-field text-xs" />
            <input value={writeTags} onChange={e => setWriteTags(e.target.value)} placeholder="Tags (comma separated)" className="input-field text-xs" />
            <select value={writeSeries} onChange={e => setWriteSeries(e.target.value)} className="input-field text-xs">
              <option value="">No series</option>
              {series.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => { publishPost(); toast.success('Blog post published!'); }} disabled={!writeTitle.trim() || !writeContent.trim() || publishing} className="btn-teal flex-1 disabled:opacity-50">
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
              <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 text-xs bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded-lg">Preview</button>
            </div>
          </div>

          {showPreview && writeContent && (
            <div className="card">
              <h2 className="text-lg font-bold text-harbor-800 dark:text-white mb-2">{writeTitle || 'Untitled'}</h2>
              <div className="prose prose-sm dark:prose-invert text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{writeContent}</div>
            </div>
          )}
        </div>
      )}

      {/* My Posts Tab */}
      {tab === 'my' && (
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">📝</p>
          <p className="text-sm text-gray-500">{user ? 'Your published posts will appear here' : 'Sign in to see your posts'}</p>
        </div>
      )}
    </div>
  );
}
