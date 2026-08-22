'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'feed' | 'local' | 'submit'

interface NewsArticle {
  id: string
  title: string
  source_name: string
  source_url: string
  summary: string | null
  ai_summary: string | null
  image_url: string | null
  category: string | null
  relevance_score: number | null
  upvotes: number
  comments_count: number
  published_at: string | null
  submitted_by: string | null
  created_at: string
}

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('feed')
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [localArticles, setLocalArticles] = useState<NewsArticle[]>([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [submitForm, setSubmitForm] = useState({ title: '', source_name: '', source_url: '', summary: '', category: 'general' })
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'feed', label: 'Feed' },
    { key: 'local', label: 'Local' },
    { key: 'submit', label: 'Submit' },
  ]

  const categories = ['general', 'safety', 'housing', 'health', 'education', 'environment', 'politics', 'events']

  useEffect(() => {
    loadArticles()
  }, [])

  async function loadArticles() {
    setLoading(true)
    try {
      const { data: feedData } = await supabase
        .from('news_articles')
        .select('*')
        .order('relevance_score', { ascending: false, nullsFirst: false })
        .order('published_at', { ascending: false })
        .limit(20)

      if (feedData) setArticles(feedData)

      const { data: localData } = await supabase
        .from('news_articles')
        .select('*')
        .not('category', 'is', null)
        .order('published_at', { ascending: false })
        .limit(20)

      if (localData) setLocalArticles(localData)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitStory() {
    if (!submitForm.title || !submitForm.source_name || !submitForm.source_url) {
      toast.error('Please fill in title, source name, and URL')
      return
    }
    const { error } = await supabase.from('news_articles').insert({
      title: submitForm.title,
      source_name: submitForm.source_name,
      source_url: submitForm.source_url,
      summary: submitForm.summary || null,
      category: submitForm.category,
      submitted_by: user?.id || null,
    })
    if (error) {
      toast.error('Failed to submit article')
      return
    }
    toast.success('Story submitted successfully!')
    setSubmitForm({ title: '', source_name: '', source_url: '', summary: '', category: 'general' })
    loadArticles()
  }

  const filteredLocal = categoryFilter === 'all'
    ? localArticles
    : localArticles.filter(a => a.category === categoryFilter)

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-900">Community News</h1>
          <p className="text-harbor-500 mt-1">Local journalism and community reporting</p>
        </div>
        <Link href="/dashboard" className="btn-teal px-4 py-2 rounded-lg text-sm">Back to Dashboard</Link>
      </div>

      <nav className="flex gap-1 bg-harbor-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all', activeTab === tab.key ? 'bg-teal-600 text-white shadow-sm' : 'text-harbor-600 hover:bg-harbor-200')}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'feed' && (
        <div className="space-y-4">
          {articles.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No articles yet. Be the first to submit a story!</p>
            </div>
          ) : articles.map(article => (
            <div key={article.id} className="card p-5 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700">{article.source_name}</span>
                {article.category && <span className="px-2 py-0.5 rounded text-xs font-medium bg-harbor-100 text-harbor-600">{article.category}</span>}
                {article.relevance_score != null && (
                  <span className="text-xs text-harbor-400">Score: {article.relevance_score}</span>
                )}
              </div>
              <h3 className="font-semibold text-harbor-800 mb-1">{article.title}</h3>
              <p className="text-sm text-harbor-500 mb-3 line-clamp-2">{article.ai_summary || article.summary || 'No summary available'}</p>
              <div className="flex items-center justify-between text-xs text-harbor-400">
                <span>{article.published_at ? new Date(article.published_at).toLocaleDateString() : new Date(article.created_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-3">
                  <span>{article.upvotes} upvotes</span>
                  <span className="text-teal-600">{article.comments_count} comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'local' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button onClick={() => setCategoryFilter('all')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap', categoryFilter === 'all' ? 'bg-teal-600 text-white' : 'bg-harbor-100 text-harbor-600')}>All</button>
            {categories.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize', categoryFilter === c ? 'bg-teal-600 text-white' : 'bg-harbor-100 text-harbor-600')}>{c}</button>
            ))}
          </div>
          {filteredLocal.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No articles found for this category.</p>
            </div>
          ) : filteredLocal.map(article => (
            <div key={article.id} className="card p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                {article.category && <span className="px-2 py-0.5 rounded text-xs font-medium bg-mly-100 text-mly-700 capitalize">{article.category}</span>}
                <span className="text-xs text-harbor-400">{article.source_name}</span>
              </div>
              <h3 className="font-semibold text-harbor-800 mb-1">{article.title}</h3>
              <p className="text-sm text-harbor-500 mb-2 line-clamp-2">{article.summary || 'No summary available'}</p>
              <p className="text-xs text-harbor-400">{article.published_at ? new Date(article.published_at).toLocaleDateString() : new Date(article.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'submit' && (
        <div className="card p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Submit a News Story</h2>
          <p className="text-sm text-harbor-500">Share news with the community. Provide a source URL for credibility.</p>
          <input className="input-field w-full px-4 py-2.5 rounded-lg" placeholder="Story headline..." value={submitForm.title} onChange={e => setSubmitForm(p => ({ ...p, title: e.target.value }))} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="input-field px-4 py-2.5 rounded-lg" placeholder="Source name (required)..." value={submitForm.source_name} onChange={e => setSubmitForm(p => ({ ...p, source_name: e.target.value }))} />
            <input className="input-field px-4 py-2.5 rounded-lg" placeholder="Source URL (required)..." value={submitForm.source_url} onChange={e => setSubmitForm(p => ({ ...p, source_url: e.target.value }))} />
          </div>
          <select className="input-field w-full px-4 py-2.5 rounded-lg" value={submitForm.category} onChange={e => setSubmitForm(p => ({ ...p, category: e.target.value }))}>
            {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <textarea className="input-field w-full px-4 py-2.5 rounded-lg min-h-[120px]" placeholder="Provide a summary of the story..." value={submitForm.summary} onChange={e => setSubmitForm(p => ({ ...p, summary: e.target.value }))} />
          <button onClick={handleSubmitStory} className="btn-teal w-full py-3 rounded-lg font-medium">Submit Story</button>
        </div>
      )}
    </div>
  )
}
