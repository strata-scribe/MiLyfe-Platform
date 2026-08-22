'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'browse' | 'recent' | 'create' | 'my-edits'

interface WikiPage {
  id: string
  title: string
  category: 'Jacksonville' | 'How-To' | 'History' | 'Resources' | 'Culture'
  excerpt: string
  lastEdited: string
  editedBy: string
  views: number
}

interface RecentEdit {
  id: string
  pageTitle: string
  editSummary: string
  contributor: string
  timestamp: string
  type: 'created' | 'updated' | 'minor-edit'
}

interface MyEdit {
  id: string
  pageTitle: string
  editCount: number
  lastEdited: string
  status: 'published' | 'pending-review'
}

export default function WikiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('browse')
  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState<WikiPage[]>([])
  const [recentEdits, setRecentEdits] = useState<RecentEdit[]>([])
  const [myEdits, setMyEdits] = useState<MyEdit[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [createForm, setCreateForm] = useState({ title: '', category: 'Jacksonville', tags: '', content: '' })
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'browse', label: 'Browse' },
    { key: 'recent', label: 'Recent' },
    { key: 'create', label: 'Create' },
    { key: 'my-edits', label: 'My Edits' },
  ]

  const categories = ['Jacksonville', 'How-To', 'History', 'Resources', 'Culture']

  useEffect(() => {
    loadWikiData()
  }, [])

  async function loadWikiData() {
    setLoading(true)
    try {
      setPages([
        { id: '1', title: 'History of Riverside', category: 'History', excerpt: 'Riverside is one of Jacksonville\'s oldest neighborhoods, dating back to the 1860s when it was a separate town.', lastEdited: '2024-01-14', editedBy: 'HistoryBuff42', views: 342 },
        { id: '2', title: 'How to Apply for JEA Assistance', category: 'How-To', excerpt: 'Step-by-step guide to applying for JEA utility payment assistance programs available to qualifying residents.', lastEdited: '2024-01-15', editedBy: 'CommunityHelper', views: 1205 },
        { id: '3', title: 'Jacksonville Food Deserts Map', category: 'Resources', excerpt: 'Interactive guide to food access challenges in Jacksonville with community solutions and resources.', lastEdited: '2024-01-13', editedBy: 'FoodJustice', views: 567 },
        { id: '4', title: 'Gullah Geechee Culture in Jax', category: 'Culture', excerpt: 'The rich heritage of Gullah Geechee communities in Northeast Florida and their lasting cultural impact.', lastEdited: '2024-01-12', editedBy: 'CulturalArts', views: 890 },
        { id: '5', title: 'Public Transit Tips & Tricks', category: 'Jacksonville', excerpt: 'Insider knowledge for navigating the JTA bus system efficiently, including hidden connections and time savers.', lastEdited: '2024-01-15', editedBy: 'TransitRider', views: 423 },
        { id: '6', title: 'Community Garden Starting Guide', category: 'How-To', excerpt: 'Everything you need to know to start or join a community garden in your Jacksonville neighborhood.', lastEdited: '2024-01-11', editedBy: 'GreenThumb', views: 678 },
      ])
      setRecentEdits([
        { id: '1', pageTitle: 'How to Apply for JEA Assistance', editSummary: 'Updated income eligibility thresholds for 2024', contributor: 'CommunityHelper', timestamp: '2024-01-15 3:42 PM', type: 'updated' },
        { id: '2', pageTitle: 'Public Transit Tips & Tricks', editSummary: 'Added new Skyway extension information', contributor: 'TransitRider', timestamp: '2024-01-15 1:15 PM', type: 'minor-edit' },
        { id: '3', pageTitle: 'New: Eastside Community Resources', editSummary: 'Created comprehensive resource guide for Eastside residents', contributor: 'EastsideAdvocate', timestamp: '2024-01-15 11:00 AM', type: 'created' },
        { id: '4', pageTitle: 'History of Riverside', editSummary: 'Added photos from 1920s riverfront', contributor: 'HistoryBuff42', timestamp: '2024-01-14 8:30 PM', type: 'updated' },
      ])
      setMyEdits([
        { id: '1', pageTitle: 'Community Safety Best Practices', editCount: 12, lastEdited: '2024-01-10', status: 'published' },
        { id: '2', pageTitle: 'Local Business Directory - Springfield', editCount: 3, lastEdited: '2024-01-08', status: 'published' },
        { id: '3', pageTitle: 'Youth Programs in Duval County', editCount: 1, lastEdited: '2024-01-15', status: 'pending-review' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleCreatePage() {
    if (!createForm.title || !createForm.content) {
      toast.error('Please fill in title and content')
      return
    }
    toast.success('Wiki page submitted for review!')
    setCreateForm({ title: '', category: 'Jacksonville', tags: '', content: '' })
  }

  const filteredPages = pages.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'Jacksonville': return 'bg-teal-100 text-teal-700'
      case 'How-To': return 'bg-mly-100 text-mly-700'
      case 'History': return 'bg-purple-100 text-purple-700'
      case 'Resources': return 'bg-blue-100 text-blue-700'
      case 'Culture': return 'bg-orange-100 text-orange-700'
      default: return 'bg-harbor-100 text-harbor-600'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-36 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-900">Community Wiki</h1>
          <p className="text-harbor-500 mt-1">Collective knowledge built by our community</p>
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

      {activeTab === 'browse' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input className="input-field flex-1 px-4 py-2.5 rounded-lg" placeholder="Search wiki pages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <div className="flex gap-1 overflow-x-auto">
              <button onClick={() => setSelectedCategory('all')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap', selectedCategory === 'all' ? 'bg-teal-600 text-white' : 'bg-harbor-100 text-harbor-600')}>All</button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap', selectedCategory === cat ? 'bg-teal-600 text-white' : 'bg-harbor-100 text-harbor-600')}>{cat}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPages.map(page => (
              <div key={page.id} className="card p-5 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', categoryColor(page.category))}>{page.category}</span>
                  <span className="text-xs text-harbor-400">{page.views} views</span>
                </div>
                <h3 className="font-semibold text-harbor-800 mb-1">{page.title}</h3>
                <p className="text-sm text-harbor-500 line-clamp-2 mb-3">{page.excerpt}</p>
                <p className="text-xs text-harbor-400">Edited {page.lastEdited} by {page.editedBy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Recent Edits</h2>
          {recentEdits.map(edit => (
            <div key={edit.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-harbor-800">{edit.pageTitle}</p>
                <p className="text-sm text-harbor-500">{edit.editSummary}</p>
                <p className="text-xs text-harbor-400 mt-1">by {edit.contributor} | {edit.timestamp}</p>
              </div>
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', edit.type === 'created' ? 'bg-green-100 text-green-700' : edit.type === 'updated' ? 'bg-blue-100 text-blue-700' : 'bg-harbor-100 text-harbor-600')}>{edit.type}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="card p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Create Wiki Page</h2>
          <input className="input-field w-full px-4 py-2.5 rounded-lg" placeholder="Page title..." value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select className="input-field px-4 py-2.5 rounded-lg" value={createForm.category} onChange={e => setCreateForm(p => ({ ...p, category: e.target.value }))}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input className="input-field px-4 py-2.5 rounded-lg" placeholder="Tags (comma separated)..." value={createForm.tags} onChange={e => setCreateForm(p => ({ ...p, tags: e.target.value }))} />
          </div>
          <div className="border border-harbor-200 rounded-lg p-4 min-h-[200px] bg-white">
            <p className="text-harbor-400 text-sm mb-2">Novel Rich Text Editor Placeholder</p>
            <textarea className="input-field w-full min-h-[150px] px-3 py-2 rounded-lg resize-none" placeholder="Write your wiki page content here..." value={createForm.content} onChange={e => setCreateForm(p => ({ ...p, content: e.target.value }))} />
          </div>
          <button onClick={handleCreatePage} className="btn-teal w-full py-3 rounded-lg font-medium">Publish Page</button>
        </div>
      )}

      {activeTab === 'my-edits' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="card p-4 rounded-xl text-center">
              <p className="text-xs text-harbor-500">Pages Contributed</p>
              <p className="text-2xl font-bold text-teal-600 mt-1">{myEdits.length}</p>
            </div>
            <div className="card p-4 rounded-xl text-center">
              <p className="text-xs text-harbor-500">Total Edits</p>
              <p className="text-2xl font-bold text-mly-500 mt-1">{myEdits.reduce((acc, e) => acc + e.editCount, 0)}</p>
            </div>
            <div className="card p-4 rounded-xl text-center">
              <p className="text-xs text-harbor-500">Status</p>
              <p className="text-2xl font-bold text-harbor-700 mt-1">Active</p>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-harbor-800">My Contributions</h2>
          {myEdits.map(edit => (
            <div key={edit.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-harbor-800">{edit.pageTitle}</p>
                <p className="text-xs text-harbor-500">{edit.editCount} edits | Last: {edit.lastEdited}</p>
              </div>
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', edit.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>{edit.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
