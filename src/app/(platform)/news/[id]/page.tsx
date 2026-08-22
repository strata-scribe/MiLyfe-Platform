'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Article {
  id: string;
  author_id: string;
  title: string;
  content: string;
  ai_summary: string | null;
  source_name: string;
  source_url: string | null;
  category: string;
  image_url: string | null;
  published_at: string;
  upvotes: number;
  created_at: string;
  news_sources?: { name: string; bias_rating: number; reliability_score: number };
}

interface NewsComment {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  likes: number;
  created_at: string;
  display_name?: string;
}

interface RelatedArticle {
  id: string;
  title: string;
  category: string;
  source_name: string;
  published_at: string;
  image_url: string | null;
}

export default function NewsArticleDetailPage() {
  const params = useParams();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [upvoted, setUpvoted] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadArticle(); }, [articleId]);

  async function loadArticle() {
    setLoading(true);
    const supabase = createClient();

    const { data: a } = await supabase
      .from('news_articles')
      .select('*, news_sources(name, bias_rating, reliability_score)')
      .eq('id', articleId)
      .single();

    if (a) {
      setArticle(a as any);

      // Load related articles (same category, limit 5)
      const { data: r } = await supabase
        .from('news_articles')
        .select('id, title, category, source_name, published_at, image_url')
        .eq('category', a.category)
        .neq('id', articleId)
        .order('published_at', { ascending: false })
        .limit(5);

      if (r) setRelated(r as RelatedArticle[]);
    }

    // Load comments
    const { data: c } = await supabase
      .from('news_comments')
      .select('*')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (c) setComments(c as NewsComment[]);

    // Check if user already upvoted
    if (user) {
      const { data: vote } = await supabase
        .from('news_upvotes')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .single();

      if (vote) setUpvoted(true);
    }

    setLoading(false);
  }

  async function toggleUpvote() {
    if (!user || !article) return;
    const supabase = createClient();

    if (upvoted) {
      await supabase.from('news_upvotes').delete().eq('article_id', articleId).eq('user_id', user.id);
      setArticle({ ...article, upvotes: article.upvotes - 1 });
      setUpvoted(false);
    } else {
      await supabase.from('news_upvotes').insert({ article_id: articleId, user_id: user.id });
      setArticle({ ...article, upvotes: article.upvotes + 1 });
      setUpvoted(true);
    }
  }

  async function postComment() {
    if (!user || !commentInput.trim()) return;
    const supabase = createClient();

    const { error } = await supabase.from('news_comments').insert({
      article_id: articleId,
      user_id: user.id,
      content: commentInput.trim(),
      likes: 0,
      display_name: user.display_name,
    });

    if (error) {
      toast.error('Failed to post comment');
      return;
    }

    setComments(prev => [{
      id: Date.now().toString(),
      article_id: articleId,
      user_id: user.id,
      content: commentInput.trim(),
      likes: 0,
      created_at: new Date().toISOString(),
      display_name: user.display_name,
    }, ...prev]);
    setCommentInput('');
    toast.success('Comment posted!');
  }

  async function likeComment(commentId: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('news_comments').update({ likes: comments.find(c => c.id === commentId)!.likes + 1 }).eq('id', commentId);
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: c.likes + 1 } : c));
  }

  function getBiasLabel(rating: number): { label: string; color: string } {
    if (rating <= 2) return { label: 'Left', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' };
    if (rating <= 4) return { label: 'Center-Left', color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/30' };
    if (rating <= 6) return { label: 'Center', color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' };
    if (rating <= 8) return { label: 'Center-Right', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' };
    return { label: 'Right', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' };
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="card skeleton h-6 w-32" />
        <div className="card skeleton h-48" />
        <div className="card skeleton h-32" />
        <div className="card skeleton h-64" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-4 animate-slide-up">
        <Link href="/news" className="text-gray-400 hover:text-gray-600 text-sm">← Back to News</Link>
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">📰</p>
          <p className="text-sm text-gray-500">Article not found</p>
        </div>
      </div>
    );
  }

  const bias = article.news_sources ? getBiasLabel(article.news_sources.bias_rating) : null;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Back */}
      <Link href="/news" className="text-gray-400 hover:text-gray-600 text-sm">← Back to News</Link>

      {/* Cover Image */}
      {article.image_url && (
        <div className="aspect-[2/1] bg-gray-100 dark:bg-harbor-800 rounded-xl overflow-hidden">
          <img src={article.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Article Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded capitalize">{article.category}</span>
          {bias && (
            <span className={cn('text-[10px] px-2 py-0.5 rounded', bias.color)}>{bias.label} Bias</span>
          )}
        </div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white leading-tight">{article.title}</h1>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
          <span className="font-medium text-harbor-800 dark:text-white">{article.source_name}</span>
          <span>·</span>
          <span>{new Date(article.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* AI Summary Card */}
      {article.ai_summary && (
        <div className="card bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🤖</span>
            <span className="text-xs font-bold text-teal-700 dark:text-teal-400">AI Summary</span>
          </div>
          <p className="text-sm text-teal-800 dark:text-teal-300 leading-relaxed">{article.ai_summary}</p>
        </div>
      )}

      {/* Bias Rating Indicator */}
      {article.news_sources && (
        <div className="card">
          <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-2">Source Reliability</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{article.news_sources.name}</span>
              {bias && <span className={cn('text-[10px] px-1.5 py-0.5 rounded', bias.color)}>{bias.label}</span>}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Reliability:</span>
              <div className="w-16 h-1.5 bg-gray-200 dark:bg-harbor-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${(article.news_sources.reliability_score / 10) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500">{article.news_sources.reliability_score}/10</span>
            </div>
          </div>
          {/* Bias spectrum bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>Left</span>
              <span>Center</span>
              <span>Right</span>
            </div>
            <div className="h-2 bg-gradient-to-r from-blue-400 via-gray-300 to-red-400 rounded-full relative">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-harbor-800 rounded-full shadow"
                style={{ left: `${(article.news_sources.bias_rating / 10) * 100}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className="card">
        <div className="prose prose-sm dark:prose-invert text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {article.content}
        </div>
      </div>

      {/* Source Link */}
      {article.source_url && (
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="card flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <span className="text-lg">🔗</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-teal-600 truncate">Read Original Article</p>
            <p className="text-xs text-gray-400 truncate">{article.source_url}</p>
          </div>
          <span className="text-gray-400">↗</span>
        </a>
      )}

      {/* Upvote & Actions */}
      <div className="card flex items-center justify-between">
        <button
          onClick={toggleUpvote}
          className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all', upvoted ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 hover:bg-teal-50')}
        >
          {upvoted ? '▲' : '△'} <span className="font-bold">{article.upvotes || 0}</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
            className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded-lg hover:bg-gray-200"
          >
            📤 Share
          </button>
        </div>
      </div>

      {/* Community Discussion */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Community Discussion ({comments.length})</h3>

        {user && (
          <div className="card space-y-2">
            <textarea
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="Share your thoughts on this article..."
              className="input-field resize-none text-sm"
              rows={3}
            />
            <div className="flex justify-end">
              <button onClick={postComment} disabled={!commentInput.trim()} className="btn-teal text-xs disabled:opacity-50">Comment</button>
            </div>
          </div>
        )}

        {comments.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-xs text-gray-500">No comments yet. Start the discussion!</p>
          </div>
        ) : comments.map(c => (
          <div key={c.id} className="card py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="font-medium text-harbor-800 dark:text-white">{c.display_name}</span>
                <span>·</span>
                <span>{timeAgo(c.created_at)}</span>
              </div>
              <button onClick={() => likeComment(c.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-teal-600">
                ♥ {c.likes > 0 && <span>{c.likes}</span>}
              </button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{c.content}</p>
          </div>
        ))}
      </div>

      {/* Related Articles Sidebar */}
      {related.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Related Articles</h3>
          {related.map(r => (
            <Link key={r.id} href={`/news/${r.id}`} className="card flex items-center gap-3 hover:shadow-md transition-shadow py-2.5">
              {r.image_url && (
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-harbor-800 overflow-hidden flex-shrink-0">
                  <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white line-clamp-2">{r.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                  <span>{r.source_name}</span>
                  <span>·</span>
                  <span>{timeAgo(r.published_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
