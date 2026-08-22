'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'browse' | 'recent' | 'create' | 'my-edits'

interface WikiPageRow {
  id: string
  slug: string
  title: string
  content_md: string | null
  category: string
  created_by: string | null
  last_edited_by: string | null
  version: number
  locked: boolean
  views: number
  created_at: string
  updated_at: string
}

interface WikiEdit {
  id: string
  page_id: string
  editor_id: string | null
  editor_name: string | null
  summary: string | null
  type: string | null
  created_at: string
}

export default function WikiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('browse')
  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState<WikiPageRow[]>([])
  const [recentEdits, setRecentEdits] = useState<WikiEdit[]>([])
  const [myEdits, setMyEdits] = useState<WikiEdit[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [createForm, setCreateForm] = useState({ title: '', category: 'general', content_md: '' })
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'browse', label: 'Browse' },
    { key: 'recent', label: 'Recent' },
    { key: 'create', label: 'Create' },
    { key: 'my-edits', label: 'My Edits' },
  ]

  const categories = ['how-to', 'resources', 'history', 'policies', 'faq', 'neighborhoods', 'general']

  useEffect(() => {
    loadWikiData()
  }, [])

  useEffect(() => {
    searchPages()
  }, [searchQuery, selectedCategory])

  async function loadWikiData() {
    setLoading(true)
    try {
      await searchPages()

      const { data: editsData } = await supabase
        .from('wiki_edits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      if (editsData) setRecentEdits(editsData)

      if (user?.id) {
        const { data: myEditsData } = await supabase
          .from('wiki_edits')
          .select('*')
          .eq('editor_id', user.id)
          .order('created_at', { ascending: false })
        if (myEditsData) setMyEdits(myEditsData)
      }
    } finally {
      setLoading(false)
    }
  }

  async function searchPages() {
    let query = supabase.from('wiki_pages').select('*').order('views', { ascending: false }).limit(30)
    if (selectedCategory !== 'all') query = query.eq('category', selectedCategory)
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`)
    const { data } = await query
    if (data) setPages(data)
  }

  function generateSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleCreatePage() {
    if (!createForm.title || !createForm.content_md) {
      toast.error('Please fill in title and content')
      return
    }
    const slug = generateSlug(createForm.title)
    const { error } = await supabase.from('wiki_pages').insert({
      title: createForm.title,
      slug,
      content_md: createForm.content_md,
      category: createForm.category,
      created_by: user?.id || null,
      last_edited_by: user?.id || null,
      version: 1,
      locked: false,
      views: 0,
    })
    if (error) {
      toast.error('Failed to create page. Slug may already exist.')
      return
    }
    toast.success('Wiki page created!')
    setCreateForm({ title: '', category: 'general', content_md: '' })
    loadWikiData()
  }

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'how-to': return 'bg-mly-100 text-mly-700'
      case 'resources': return 'bg-blue-100 text-blue-700'
      case 'history': return 'bg-purple-100 text-purple-700'
      case 'policies': return 'bg-red-100 text-red-700'
      case 'faq': return 'bg-yellow-100 text-yellow-700'
      case 'neighborhoods': return 'bg-teal-100 text-teal-700'
      default: return 'bg-harbor-100 text-harbor-600'
    }
  }

  const editTypeColor = (type: string | null) => {
    switch (type) {
      case 'created': return 'bg-green-100 text-green-700'
      case 'updated': return 'bg-blue-100 text-blue-700'
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
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize', selectedCategory === cat ? 'bg-teal-600 text-white' : 'bg-harbor-100 text-harbor-600')}>{cat}</button>
              ))}
            </div>
          </div>
          {pages.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No wiki pages found. Create the first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pages.map(page => (
                <div key={page.id} className="card p-5 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium capitalize', categoryColor(page.category))}>{page.category}</span>
                    <span className="text-xs text-harbor-400">{page.views} views</span>
                    {page.locked && <span className="text-xs text-harbor-400">🔒</span>}
                  </div>
                  <h3 className="font-semibold text-harbor-800 mb-1">{page.title}</h3>
                  <p className="text-sm text-harbor-500 line-clamp-2 mb-3">{page.content_md?.substring(0, 150) || 'No content'}</p>
                  <p className="text-xs text-harbor-400">Updated {new Date(page.updated_at).toLocaleDateString()} | v{page.version}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Recent Edits</h2>
          {recentEdits.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No recent edits.</p>
            </div>
          ) : recentEdits.map(edit => (
            <div key={edit.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-harbor-800">{edit.summary || 'No summary'}</p>
                <p className="text-xs text-harbor-400 mt-1">by {edit.editor_name || 'Anonymous'} | {new Date(edit.created_at).toLocaleString()}</p>
              </div>
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', editTypeColor(edit.type))}>{edit.type || 'edit'}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="card p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Create Wiki Page</h2>
          <input className="input-field w-full px-4 py-2.5 rounded-lg" placeholder="Page title..." value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} />
          {createForm.title && (
            <p className="text-xs text-harbor-400">Slug: {generateSlug(createForm.title)}</p>
          )}
          <select className="input-field w-full px-4 py-2.5 rounded-lg" value={createForm.category} onChange={e => setCreateForm(p => ({ ...p, category: e.target.value }))}>
            {categories.map(cat => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
          </select>
          <textarea className="input-field w-full px-4 py-2.5 rounded-lg min-h-[200px] resize-none" placeholder="Write your wiki page content in markdown..." value={createForm.content_md} onChange={e => setCreateForm(p => ({ ...p, content_md: e.target.value }))} />
          <button onClick={handleCreatePage} className="btn-teal w-full py-3 rounded-lg font-medium">Publish Page</button>
        </div>
      )}

      {activeTab === 'my-edits' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">My Contributions</h2>
          {myEdits.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">You haven&apos;t made any edits yet. Start contributing!</p>
            </div>
          ) : (
            <>
              <div className="card p-4 rounded-xl text-center">
                <p className="text-xs text-harbor-500">Total Edits</p>
                <p className="text-2xl font-bold text-teal-600 mt-1">{myEdits.length}</p>
              </div>
              {myEdits.map(edit => (
                <div key={edit.id} className="card p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-medium text-harbor-800">{edit.summary || 'No summary'}</p>
                    <p className="text-xs text-harbor-500">{new Date(edit.created_at).toLocaleString()}</p>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', editTypeColor(edit.type))}>{edit.type || 'edit'}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
