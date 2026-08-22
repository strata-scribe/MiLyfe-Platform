'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Article { id: string; source_url: string; source_name: string; title: string; summary: string | null; ai_summary: string | null; image_url: string | null; category: string; relevance_score: number; upvotes: number; comments_count: number; published_at: string | null; created_at: string; }

const CATEGORIES = ['all', 'local', 'national', 'world', 'tech', 'economy', 'justice', 'community'] as const;

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitCategory, setSubmitCategory] = useState('local');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAppStore();

  useEffect(() => { loadArticles(); }, [category]);

  async function loadArticles() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('news_articles').select('*').order('created_at', { ascending: false }).limit(30);
    if (category !== 'all') query = query.eq('category', category);
    const { data } = await query;
    if (data) setArticles(data);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!user || !submitUrl.trim() || !submitTitle.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from('news_articles').insert({ source_url: submitUrl.trim(), source_name: new URL(submitUrl.trim()).hostname, title: submitTitle.trim(), category: submitCategory, submitted_by: user.id });
    setSubmitUrl(''); setSubmitTitle(''); setShowSubmit(false); setSubmitting(false); loadArticles();
  }

  async function handleUpvote(id: string) {
    const supabase = createClient();
    setArticles(prev => prev.map(a => a.id === id ? { ...a, upvotes: a.upvotes + 1 } : a));
    await supabase.from('news_articles').update({ upvotes: articles.find(a => a.id === id)!.upvotes + 1 }).eq('id', id);
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiNews</h1>
          <p className="text-xs text-gray-500">World news relevant to our community</p>
        </div>
        {user && <button onClick={() => setShowSubmit(!showSubmit)} className="btn-teal text-xs">+ Submit Link</button>}
      </div>

      {showSubmit && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <input value={submitUrl} onChange={e => setSubmitUrl(e.target.value)} placeholder="Article URL" className="input-field" />
          <input value={submitTitle} onChange={e => setSubmitTitle(e.target.value)} placeholder="Headline" className="input-field" />
          <select value={submitCategory} onChange={e => setSubmitCategory(e.target.value)} className="input-field">
            {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={handleSubmit} disabled={!submitUrl.trim() || !submitTitle.trim() || submitting} className="btn-teal w-full disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Article'}</button>
        </div>
      )}

      {/* Category filters */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap', category === c ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
        ))}
      </div>

      {/* Articles */}
      {loading ? [1,2,3].map(i => <div key={i} className="card skeleton h-28" />) :
      articles.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">No articles in this category yet.</p></div> :
      articles.map(article => (
        <a key={article.id} href={article.source_url} target="_blank" rel="noopener noreferrer" className="card flex gap-3 hover:shadow-md transition-shadow group">
          {article.image_url && <img src={article.image_url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span className="capitalize bg-gray-100 dark:bg-harbor-800 px-1.5 py-0.5 rounded">{article.category}</span>
              <span>{article.source_name}</span>
              {article.published_at && <span>· {new Date(article.published_at).toLocaleDateString()}</span>}
            </div>
            <h3 className="text-sm font-medium text-harbor-800 dark:text-white group-hover:text-teal-600 transition-colors line-clamp-2">{article.title}</h3>
            {(article.ai_summary || article.summary) && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.ai_summary || article.summary}</p>}
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              <button onClick={(e) => { e.preventDefault(); handleUpvote(article.id); }} className="hover:text-teal-600">▲ {article.upvotes}</button>
              <span>💬 {article.comments_count}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
