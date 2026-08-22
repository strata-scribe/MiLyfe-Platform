'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Article {
  id: string;
  author_id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  cover_image: string | null;
  source: string | null;
  tags: string[];
  views: number;
  likes: number;
  comment_count: number;
  verified: boolean;
  published_at: string;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null };
}

interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  body: string;
  likes: number;
  created_at: string;
  display_name?: string;
}

interface RelatedArticle {
  id: string;
  title: string;
  category: string;
  published_at: string;
  views: number;
}

export default function NewsArticleDetailPage() {
  const params = useParams();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadArticle(); }, [articleId]);

  async function loadArticle() {
    setLoading(true);
    const supabase = createClient();

    const { data: a } = await supabase
      .from('news_articles')
      .select('*, profiles!news_articles_author_id_fkey(display_name, avatar_url)')
      .eq('id', articleId)
      .single();
    if (a) {
      setArticle(a as any);
      // Increment views
      await supabase.from('news_articles').update({ views: (a.views || 0) + 1 }).eq('id', articleId);

      // Load related
      const { data: r } = await supabase
        .from('news_articles')
        .select('id, title, category, published_at, views')
        .eq('category', a.category)
        .neq('id', articleId)
        .order('published_at', { ascending: false })
        .limit(4);
      if (r) setRelated(r);
    }

    const { data: c } = await supabase
      .from('news_comments')
      .select('*')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (c) setComments(c);

    setLoading(false);
  }

  async function likeArticle() {
    if (!user || !article) return;
    const supabase = createClient();
    if (!liked) {
      await supabase.from('news_articles').update({ likes: article.likes + 1 }).eq('id', articleId);
      setArticle({ ...article, likes: article.likes + 1 });
    }
    setLiked(!liked);
  }

  async function postComment() {
    if (!user || !commentInput.trim()) return;
    const supabase = createClient();
    await supabase.from('news_comments').insert({
      article_id: articleId, user_id: user.id, body: commentInput.trim(),
      likes: 0, display_name: user.display_name,
    });
    await supabase.from('news_articles').update({ comment_count: (article?.comment_count || 0) + 1 }).eq('id', articleId);
    setComments(prev => [{ id: Date.now().toString(), article_id: articleId, user_id: user.id, body: commentInput.trim(), likes: 0, created_at: new Date().toISOString(), display_name: user.display_name }, ...prev]);
    setCommentInput('');
    if (article) setArticle({ ...article, comment_count: article.comment_count + 1 });
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  }

  function readTime(content: string): number {
    return Math.max(1, Math.round(content.split(/\s+/).length / 200));
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="card skeleton h-6 w-32" />
        <div className="card skeleton h-48" />
        <div className="card skeleton h-96" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-4 animate-slide-up">
        <Link href="/news" className="text-gray-400 hover:text-gray-600 text-sm">← Back to News</Link>
        <div className="card text-center py-8">
          <p className="text-sm text-gray-500">Article not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Back */}
      <Link href="/news" className="text-gray-400 hover:text-gray-600 text-sm">← Back to News</Link>

      {/* Cover Image */}
      {article.cover_image && (
        <div className="aspect-[2/1] bg-gray-100 dark:bg-harbor-800 rounded-xl overflow-hidden">
          <img src={article.cover_image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Article Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded capitalize">{article.category}</span>
          {article.verified && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">✓ Verified</span>}
          <span className="text-xs text-gray-400">{readTime(article.content)} min read</span>
        </div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white leading-tight">{article.title}</h1>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xs">
            {(article.profiles as any)?.display_name?.charAt(0) || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">{(article.profiles as any)?.display_name}</p>
            <p className="text-xs text-gray-500">{new Date(article.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="card">
        <div className="prose prose-sm dark:prose-invert text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {article.content}
        </div>
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {article.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-1 bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-400 rounded-full">{tag}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={likeArticle} className={cn('flex items-center gap-1 text-sm', liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500')}>
            {liked ? '❤️' : '🤍'} <span className="text-xs">{article.likes}</span>
          </button>
          <span className="flex items-center gap-1 text-sm text-gray-500">💬 <span className="text-xs">{article.comment_count}</span></span>
          <span className="flex items-center gap-1 text-sm text-gray-500">👁 <span className="text-xs">{article.views}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSaved(!saved)} className={cn('text-sm', saved ? 'text-mly-600' : 'text-gray-400')}>{saved ? '🔖' : '📑'}</button>
          <button className="text-sm text-gray-400">📤</button>
        </div>
      </div>

      {/* Source */}
      {article.source && (
        <div className="text-xs text-gray-400">
          Source: <a href={article.source} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">{article.source}</a>
        </div>
      )}

      {/* Related Articles */}
      {related.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Related Stories</h3>
          {related.map(r => (
            <Link key={r.id} href={`/news/${r.id}`} className="card flex items-center gap-3 hover:shadow-md transition-shadow py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white line-clamp-1">{r.title}</p>
                <p className="text-xs text-gray-500 capitalize">{r.category} · {timeAgo(r.published_at)}</p>
              </div>
              <span className="text-xs text-gray-400">{r.views} views</span>
            </Link>
          ))}
        </div>
      )}

      {/* Comments */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Discussion ({comments.length})</h3>

        {user && (
          <div className="card space-y-2">
            <textarea value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="Share your thoughts..." className="input-field resize-none text-sm" rows={3} />
            <div className="flex justify-end">
              <button onClick={postComment} disabled={!commentInput.trim()} className="btn-teal text-xs disabled:opacity-50">Comment</button>
            </div>
          </div>
        )}

        {comments.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-xs text-gray-500">No comments yet</p>
          </div>
        ) : comments.map(c => (
          <div key={c.id} className="card py-2.5">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="font-medium text-harbor-800 dark:text-white">{c.display_name}</span>
              <span>·</span>
              <span>{timeAgo(c.created_at)}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
