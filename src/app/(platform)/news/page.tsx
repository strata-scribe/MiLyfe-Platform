'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'feed' | 'local' | 'verified' | 'submit'

interface NewsArticle {
  id: string
  title: string
  source: string
  credibility: 'high' | 'medium' | 'low'
  bias: 'left' | 'center' | 'right' | 'neutral'
  readTime: string
  discussionCount: number
  publishedAt: string
  excerpt: string
  neighborhood?: string
  verified?: boolean
}

interface VerificationBadge {
  type: 'community-verified' | 'fact-checked' | 'disputed'
  verifiers: number
}

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('feed')
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [localArticles, setLocalArticles] = useState<NewsArticle[]>([])
  const [verifiedArticles, setVerifiedArticles] = useState<NewsArticle[]>([])
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all')
  const [submitForm, setSubmitForm] = useState({ title: '', source: '', url: '', description: '' })
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'feed', label: 'Feed' },
    { key: 'local', label: 'Local' },
    { key: 'verified', label: 'Verified' },
    { key: 'submit', label: 'Submit' },
  ]

  const neighborhoods = ['Riverside', 'Springfield', 'Downtown', 'Eastside', 'Northside', 'San Marco', 'Beaches']

  useEffect(() => {
    loadNewsData()
  }, [])

  async function loadNewsData() {
    setLoading(true)
    try {
      setArticles([
        { id: '1', title: 'City Council Approves New Affordable Housing Initiative', source: 'Jacksonville Times', credibility: 'high', bias: 'center', readTime: '4 min', discussionCount: 89, publishedAt: '2024-01-15', excerpt: 'The Jacksonville City Council voted 12-3 to approve a new $50M affordable housing initiative targeting underserved neighborhoods.' },
        { id: '2', title: 'JTA Announces Extended Bus Routes Starting March', source: 'Transit Authority Blog', credibility: 'high', bias: 'neutral', readTime: '3 min', discussionCount: 45, publishedAt: '2024-01-15', excerpt: 'New routes will serve Springfield, Eastside, and Northside with 30% more frequent service during peak hours.' },
        { id: '3', title: 'Local Business Owners Rally Against Proposed Tax Changes', source: 'Jax Business Journal', credibility: 'medium', bias: 'right', readTime: '6 min', discussionCount: 134, publishedAt: '2024-01-14', excerpt: 'Over 200 small business owners gathered at City Hall to voice concerns about proposed commercial property tax increases.' },
        { id: '4', title: 'Community Garden Produces Record Harvest for Food Banks', source: 'Community Press', credibility: 'high', bias: 'neutral', readTime: '2 min', discussionCount: 67, publishedAt: '2024-01-14', excerpt: 'The Riverside Community Garden donated over 2,000 pounds of fresh produce to local food banks this quarter.' },
        { id: '5', title: 'New Study Questions Effectiveness of Current Policing Strategy', source: 'Florida Independent', credibility: 'medium', bias: 'left', readTime: '8 min', discussionCount: 256, publishedAt: '2024-01-13', excerpt: 'Researchers from UNF found that community-based intervention programs showed better outcomes than increased patrols.' },
      ])
      setLocalArticles([
        { id: '6', title: 'Springfield Farmers Market Expands to Saturdays', source: 'Neighborhood Watch', credibility: 'high', bias: 'neutral', readTime: '2 min', discussionCount: 23, publishedAt: '2024-01-15', excerpt: 'Popular weekday market now open Saturdays 8 AM-1 PM with new vendor slots available.', neighborhood: 'Springfield' },
        { id: '7', title: 'Riverside Park Cleanup Day: 50 Volunteers Needed', source: 'Riverside Community Board', credibility: 'high', bias: 'neutral', readTime: '1 min', discussionCount: 12, publishedAt: '2024-01-15', excerpt: 'Join us this Saturday for the monthly park cleanup. Supplies and refreshments provided.', neighborhood: 'Riverside' },
        { id: '8', title: 'Eastside Youth Center Receives Major Grant', source: 'Duval County News', credibility: 'high', bias: 'center', readTime: '3 min', discussionCount: 34, publishedAt: '2024-01-14', excerpt: 'The Boys & Girls Club Eastside location received a $250,000 federal grant for after-school programs.', neighborhood: 'Eastside' },
      ])
      setVerifiedArticles([
        { id: '9', title: 'FACT CHECK: New Hospital Construction Timeline', source: 'Jacksonville Times', credibility: 'high', bias: 'center', readTime: '5 min', discussionCount: 56, publishedAt: '2024-01-14', excerpt: 'Claims about hospital opening delays have been verified. Actual timeline shows 6-month delay, not 2 years as rumored.', verified: true },
        { id: '10', title: 'VERIFIED: Water Quality Report Shows Improvement', source: 'JEA Official', credibility: 'high', bias: 'neutral', readTime: '4 min', discussionCount: 78, publishedAt: '2024-01-13', excerpt: 'Independent testing confirms JEA water quality metrics have improved 15% year over year across all districts.', verified: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmitStory() {
    if (!submitForm.title || !submitForm.source || !submitForm.url) {
      toast.error('Please fill in title, source, and URL')
      return
    }
    toast.success('Story submitted for community verification!')
    setSubmitForm({ title: '', source: '', url: '', description: '' })
  }

  const credibilityBadge = (cred: string) => {
    switch (cred) {
      case 'high': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-red-100 text-red-700'
      default: return 'bg-harbor-100 text-harbor-600'
    }
  }

  const biasBadge = (bias: string) => {
    switch (bias) {
      case 'left': return 'bg-blue-100 text-blue-700'
      case 'right': return 'bg-red-100 text-red-700'
      case 'center': return 'bg-purple-100 text-purple-700'
      default: return 'bg-harbor-100 text-harbor-600'
    }
  }

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
          <p className="text-harbor-500 mt-1">Verified, unbiased local journalism</p>
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
          {articles.map(article => (
            <div key={article.id} className="card p-5 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', credibilityBadge(article.credibility))}>{article.credibility} credibility</span>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', biasBadge(article.bias))}>{article.bias}</span>
                <span className="text-xs text-harbor-400">{article.readTime} read</span>
              </div>
              <h3 className="font-semibold text-harbor-800 mb-1">{article.title}</h3>
              <p className="text-sm text-harbor-500 mb-3 line-clamp-2">{article.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-harbor-400">
                <span>{article.source} | {article.publishedAt}</span>
                <span className="text-teal-600">{article.discussionCount} discussions</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'local' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button onClick={() => setNeighborhoodFilter('all')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap', neighborhoodFilter === 'all' ? 'bg-teal-600 text-white' : 'bg-harbor-100 text-harbor-600')}>All</button>
            {neighborhoods.map(n => (
              <button key={n} onClick={() => setNeighborhoodFilter(n)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap', neighborhoodFilter === n ? 'bg-teal-600 text-white' : 'bg-harbor-100 text-harbor-600')}>{n}</button>
            ))}
          </div>
          {localArticles.filter(a => neighborhoodFilter === 'all' || a.neighborhood === neighborhoodFilter).map(article => (
            <div key={article.id} className="card p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                {article.neighborhood && <span className="px-2 py-0.5 rounded text-xs font-medium bg-mly-100 text-mly-700">{article.neighborhood}</span>}
                <span className="text-xs text-harbor-400">{article.readTime} read</span>
              </div>
              <h3 className="font-semibold text-harbor-800 mb-1">{article.title}</h3>
              <p className="text-sm text-harbor-500 mb-2">{article.excerpt}</p>
              <p className="text-xs text-harbor-400">{article.source} | {article.publishedAt}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'verified' && (
        <div className="space-y-4">
          <div className="card p-4 rounded-xl bg-green-50 border border-green-100">
            <h3 className="font-semibold text-green-800 text-sm">Community Fact-Checked</h3>
            <p className="text-xs text-green-600">These articles have been verified by community members and independent sources.</p>
          </div>
          {verifiedArticles.map(article => (
            <div key={article.id} className="card p-5 rounded-xl border-l-4 border-green-400">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">✓ Verified</span>
                <span className="text-xs text-harbor-400">{article.readTime} read</span>
              </div>
              <h3 className="font-semibold text-harbor-800 mb-1">{article.title}</h3>
              <p className="text-sm text-harbor-500 mb-2">{article.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-harbor-400">
                <span>{article.source} | {article.publishedAt}</span>
                <span className="text-teal-600">{article.discussionCount} discussions</span>
              </div>
            </div>
          ))}
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-2">Dispute Process</h3>
            <p className="text-sm text-harbor-500">Disagree with a verification? Submit evidence to challenge any fact-check through our community review process.</p>
            <button className="btn-teal px-4 py-2 rounded-lg text-sm mt-3">Start Dispute</button>
          </div>
        </div>
      )}

      {activeTab === 'submit' && (
        <div className="card p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Submit a News Story</h2>
          <p className="text-sm text-harbor-500">Stories require a verifiable source and will go through community verification before publishing.</p>
          <input className="input-field w-full px-4 py-2.5 rounded-lg" placeholder="Story headline..." value={submitForm.title} onChange={e => setSubmitForm(p => ({ ...p, title: e.target.value }))} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="input-field px-4 py-2.5 rounded-lg" placeholder="Source name (required)..." value={submitForm.source} onChange={e => setSubmitForm(p => ({ ...p, source: e.target.value }))} />
            <input className="input-field px-4 py-2.5 rounded-lg" placeholder="Source URL (required)..." value={submitForm.url} onChange={e => setSubmitForm(p => ({ ...p, url: e.target.value }))} />
          </div>
          <textarea className="input-field w-full px-4 py-2.5 rounded-lg min-h-[120px]" placeholder="Provide context or summary of the story..." value={submitForm.description} onChange={e => setSubmitForm(p => ({ ...p, description: e.target.value }))} />
          <div className="bg-harbor-50 p-3 rounded-lg">
            <p className="text-xs text-harbor-600">Verification workflow: Your submission will be reviewed by 3+ community verifiers before publication. You&apos;ll receive updates on the verification status.</p>
          </div>
          <button onClick={handleSubmitStory} className="btn-teal w-full py-3 rounded-lg font-medium">Submit for Verification</button>
        </div>
      )}
    </div>
  )
}
