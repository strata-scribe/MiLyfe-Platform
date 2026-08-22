'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'report' | 'issues' | 'projects' | 'leaderboard'
type IssueCategory = 'pothole' | 'streetlight' | 'graffiti' | 'flooding' | 'trash' | 'sidewalk' | 'noise' | 'other'
type IssueStatus = 'reported' | 'acknowledged' | 'in-progress' | 'resolved'
type Priority = 'low' | 'medium' | 'high' | 'critical'

interface CityIssue {
  id: string
  category: IssueCategory
  title: string
  description: string
  location: string
  priority: Priority
  status: IssueStatus
  upvotes: number
  reporter: string
  created_at: string
  photo_url?: string
}

interface CityProject {
  id: string
  name: string
  description: string
  category: string
  progress: number
  volunteers_needed: number
  volunteers_signed: number
  start_date: string
  status: string
}

export default function CityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('report')
  const [loading, setLoading] = useState(true)
  const [issues, setIssues] = useState<CityIssue[]>([])
  const [projects, setProjects] = useState<CityProject[]>([])
  const [filterCategory, setFilterCategory] = useState<IssueCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all')
  const { user } = useAppStore()

  // Report form state
  const [reportForm, setReportForm] = useState({
    category: '' as IssueCategory | '',
    title: '',
    description: '',
    location: '',
    priority: 'medium' as Priority,
    photo: null as File | null
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const supabase = createClient()
    const [issuesRes, projectsRes] = await Promise.all([
      supabase.from('city_issues').select('*').order('created_at', { ascending: false }),
      supabase.from('city_projects').select('*').order('start_date', { ascending: false })
    ])
    if (issuesRes.data) setIssues(issuesRes.data)
    if (projectsRes.data) setProjects(projectsRes.data)
    setLoading(false)
  }

  async function handleReportSubmit(e: React.FormEvent) {
    const supabase = createClient()
    e.preventDefault()
    if (!reportForm.category || !reportForm.title || !reportForm.location) {
      toast.error('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('city_issues').insert({
      category: reportForm.category,
      title: reportForm.title,
      description: reportForm.description,
      location: reportForm.location,
      priority: reportForm.priority,
      status: 'reported',
      upvotes: 0,
      reporter: user?.id
    })
    if (error) {
      toast.error('Failed to submit report')
    } else {
      toast.success('Issue reported successfully! Your community thanks you.')
      setReportForm({ category: '', title: '', description: '', location: '', priority: 'medium', photo: null })
      fetchData()
    }
    setSubmitting(false)
  }

  async function handleUpvote(issueId: string) {
    const supabase = createClient()
    const issue = issues.find(i => i.id === issueId)
    if (!issue) return
    await supabase.from('city_issues').update({ upvotes: issue.upvotes + 1 }).eq('id', issueId)
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, upvotes: i.upvotes + 1 } : i))
    toast.success('Issue upvoted')
  }

  async function handleVolunteer(projectId: string) {
    const supabase = createClient()
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    await supabase.from('city_projects').update({ volunteers_signed: project.volunteers_signed + 1 }).eq('id', projectId)
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, volunteers_signed: p.volunteers_signed + 1 } : p))
    toast.success('You signed up as a volunteer!')
  }

  const filteredIssues = issues.filter(i => {
    if (filterCategory !== 'all' && i.category !== filterCategory) return false
    if (filterStatus !== 'all' && i.status !== filterStatus) return false
    return true
  })

  const categories: IssueCategory[] = ['pothole', 'streetlight', 'graffiti', 'flooding', 'trash', 'sidewalk', 'noise', 'other']
  const statusColors: Record<IssueStatus, string> = {
    'reported': 'bg-harbor-400 text-white',
    'acknowledged': 'bg-mly-amber text-harbor-900',
    'in-progress': 'bg-teal-500 text-white',
    'resolved': 'bg-green-600 text-white'
  }
  const priorityColors: Record<Priority, string> = {
    'low': 'text-harbor-400', 'medium': 'text-mly-amber', 'high': 'text-orange-500', 'critical': 'text-red-600'
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'report', label: 'Report', icon: '📢' },
    { key: 'issues', label: 'Issues', icon: '🔍' },
    { key: 'projects', label: 'Projects', icon: '🏗️' },
    { key: 'leaderboard', label: 'Leaderboard', icon: '🏆' }
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto animate-slide-up">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-harbor-900">City Hub</h1>
        <p className="text-harbor-500">Report issues, join projects, improve your neighborhood</p>
      </header>

      <nav className="flex gap-2 mb-6 border-b border-harbor-200 pb-2">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === tab.key ? 'bg-teal-600 text-white shadow-md' : 'text-harbor-600 hover:bg-harbor-100')}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'report' && (
        <form onSubmit={handleReportSubmit} className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-harbor-900">Report a Civic Issue</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-harbor-700 mb-1">Category *</label>
              <select value={reportForm.category} onChange={e => setReportForm(p => ({ ...p, category: e.target.value as IssueCategory }))}
                className="input-field w-full">
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-harbor-700 mb-1">Priority</label>
              <select value={reportForm.priority} onChange={e => setReportForm(p => ({ ...p, priority: e.target.value as Priority }))}
                className="input-field w-full">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-harbor-700 mb-1">Title *</label>
            <input type="text" value={reportForm.title} onChange={e => setReportForm(p => ({ ...p, title: e.target.value }))}
              className="input-field w-full" placeholder="Brief description of the issue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-harbor-700 mb-1">Location *</label>
            <input type="text" value={reportForm.location} onChange={e => setReportForm(p => ({ ...p, location: e.target.value }))}
              className="input-field w-full" placeholder="Street address or intersection" />
          </div>
          <div>
            <label className="block text-sm font-medium text-harbor-700 mb-1">Description</label>
            <textarea value={reportForm.description} onChange={e => setReportForm(p => ({ ...p, description: e.target.value }))}
              className="input-field w-full h-24 resize-none" placeholder="Provide more details about the issue..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-harbor-700 mb-1">Photo (optional)</label>
            <input type="file" accept="image/*" onChange={e => setReportForm(p => ({ ...p, photo: e.target.files?.[0] || null }))}
              className="input-field w-full" />
          </div>
          <button type="submit" disabled={submitting} className="btn-teal w-full">
            {submitting ? 'Submitting...' : '📢 Submit Report'}
          </button>
        </form>
      )}

      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)} className="input-field">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="input-field">
              <option value="all">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          {filteredIssues.length === 0 ? (
            <div className="card p-8 text-center text-harbor-500">No issues found matching your filters.</div>
          ) : (
            filteredIssues.map(issue => (
              <div key={issue.id} className="card p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusColors[issue.status])}>{issue.status}</span>
                      <span className={cn('text-xs font-semibold', priorityColors[issue.priority])}>{issue.priority.toUpperCase()}</span>
                    </div>
                    <h3 className="font-semibold text-harbor-900">{issue.title}</h3>
                    <p className="text-sm text-harbor-600 mt-1">{issue.location}</p>
                    <p className="text-sm text-harbor-500 mt-1 line-clamp-2">{issue.description}</p>
                  </div>
                  <button onClick={() => handleUpvote(issue.id)} className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-harbor-100 transition">
                    <span className="text-teal-600 font-bold">▲</span>
                    <span className="text-sm font-semibold text-harbor-700">{issue.upvotes}</span>
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-harbor-400">
                  <span>📍 {issue.category}</span>
                  <span>🕐 {new Date(issue.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => (
            <div key={project.id} className="card p-5 space-y-3">
              <h3 className="font-semibold text-harbor-900">{project.name}</h3>
              <p className="text-sm text-harbor-600">{project.description}</p>
              <div className="w-full bg-harbor-200 rounded-full h-2">
                <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-harbor-500">{project.volunteers_signed}/{project.volunteers_needed} volunteers</span>
                <span className="text-teal-600 font-medium">{project.progress}% complete</span>
              </div>
              <button onClick={() => handleVolunteer(project.id)} disabled={project.volunteers_signed >= project.volunteers_needed}
                className="btn-teal w-full text-sm">
                {project.volunteers_signed >= project.volunteers_needed ? 'Fully Staffed' : '🙋 Volunteer'}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-harbor-900 mb-4">🏆 Community Champions</h2>
          <div className="space-y-3">
            {[
              { rank: 1, name: 'Maria G.', reports: 47, resolved: 38, badge: '🥇' },
              { rank: 2, name: 'James T.', reports: 34, resolved: 29, badge: '🥈' },
              { rank: 3, name: 'Aisha K.', reports: 28, resolved: 24, badge: '🥉' },
              { rank: 4, name: 'David R.', reports: 22, resolved: 18, badge: '4th' },
              { rank: 5, name: 'Lin W.', reports: 19, resolved: 15, badge: '5th' },
            ].map(entry => (
              <div key={entry.rank} className="flex items-center gap-4 p-3 rounded-lg hover:bg-harbor-50 transition">
                <span className="text-2xl w-10 text-center">{entry.badge}</span>
                <div className="flex-1">
                  <p className="font-medium text-harbor-900">{entry.name}</p>
                  <p className="text-xs text-harbor-500">{entry.reports} reported · {entry.resolved} resolved</p>
                </div>
                <span className="text-teal-600 font-semibold text-sm">{entry.resolved * 10} $MLY</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <p className="text-sm text-teal-800 font-medium">Earn $MLY tokens for every verified civic report!</p>
            <p className="text-xs text-teal-600 mt-1">Reports that get resolved earn 10 $MLY. Top reporters get bonus rewards monthly.</p>
          </div>
        </div>
      )}
    </div>
  )
}
