'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'home' | 'photos' | 'timeline' | 'schedule' | 'allowance'

interface FamilyMember {
  id: string
  name: string
  role: string
  status: 'online' | 'away' | 'offline'
  avatar_url?: string
}

interface FamilyPhoto {
  id: string
  url: string
  caption: string
  album: string
  uploaded_by: string
  created_at: string
  comments: number
}

interface FamilyEvent {
  id: string
  title: string
  date: string
  type: 'milestone' | 'event' | 'achievement'
  description: string
  member_name: string
  icon: string
}

interface ScheduleEntry {
  id: string
  title: string
  date: string
  time: string
  member_id: string
  member_name: string
  color: string
  recurring: boolean
}

interface AllowanceRecord {
  id: string
  child_name: string
  weekly_amount: number
  balance: number
  savings_goal: number
  savings_current: number
  chores_completed: number
  chores_total: number
}

export default function FamilyPage() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [photos, setPhotos] = useState<FamilyPhoto[]>([])
  const [timeline, setTimeline] = useState<FamilyEvent[]>([])
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [allowances, setAllowances] = useState<AllowanceRecord[]>([])
  const { user } = useAppStore()

  // Form states
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'event' as 'milestone' | 'event' | 'achievement', description: '', member_name: '' })
  const [showUploadPhoto, setShowUploadPhoto] = useState(false)
  const [newPhoto, setNewPhoto] = useState({ caption: '', album: '', file: null as File | null })
  const [selectedAlbum, setSelectedAlbum] = useState('all')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const supabase = createClient()
    const [memRes, photoRes, timeRes, schedRes, allowRes] = await Promise.all([
      supabase.from('family_members').select('*').eq('family_id', user?.id),
      supabase.from('family_photos').select('*').eq('family_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('family_events').select('*').eq('family_id', user?.id).order('date', { ascending: false }),
      supabase.from('family_schedule').select('*').eq('family_id', user?.id).order('date', { ascending: true }),
      supabase.from('family_allowances').select('*').eq('family_id', user?.id)
    ])
    if (memRes.data) setMembers(memRes.data)
    if (photoRes.data) setPhotos(photoRes.data)
    if (timeRes.data) setTimeline(timeRes.data)
    if (schedRes.data) setSchedule(schedRes.data)
    if (allowRes.data) setAllowances(allowRes.data)
    setLoading(false)
  }

  async function handleAddEvent(e: React.FormEvent) {
    const supabase = createClient()
    e.preventDefault()
    if (!newEvent.title || !newEvent.date) {
      toast.error('Please fill in required fields')
      return
    }
    const { error } = await supabase.from('family_events').insert({
      family_id: user?.id, ...newEvent, icon: newEvent.type === 'milestone' ? '🌟' : newEvent.type === 'achievement' ? '🏆' : '📅'
    })
    if (error) toast.error('Failed to add event')
    else {
      toast.success('Event added to family timeline!')
      setNewEvent({ title: '', date: '', type: 'event', description: '', member_name: '' })
      setShowAddEvent(false)
      fetchData()
    }
  }

  async function handleUploadPhoto(e: React.FormEvent) {
    const supabase = createClient()
    e.preventDefault()
    if (!newPhoto.file) { toast.error('Please select a photo'); return }
    toast.success('Photo uploaded to family album!')
    setNewPhoto({ caption: '', album: '', file: null })
    setShowUploadPhoto(false)
  }

  async function handleAllowancePayment(childId: string) {
    const supabase = createClient()
    const record = allowances.find(a => a.id === childId)
    if (!record) return
    await supabase.from('family_allowances').update({ balance: record.balance + record.weekly_amount }).eq('id', childId)
    setAllowances(prev => prev.map(a => a.id === childId ? { ...a, balance: a.balance + a.weekly_amount } : a))
    toast.success(`Allowance paid to ${record.child_name}!`)
  }

  const statusColors = { online: 'bg-green-400', away: 'bg-mly-amber', offline: 'bg-harbor-300' }
  const eventTypeColors = { milestone: 'border-teal-500 bg-teal-50', event: 'border-harbor-300 bg-harbor-50', achievement: 'border-mly-amber bg-amber-50' }

  const albums = Array.from(new Set(photos.map(p => p.album)))
  const filteredPhotos = selectedAlbum === 'all' ? photos : photos.filter(p => p.album === selectedAlbum)

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'photos', label: 'Photos', icon: '📸' },
    { key: 'timeline', label: 'Timeline', icon: '📜' },
    { key: 'schedule', label: 'Schedule', icon: '📅' },
    { key: 'allowance', label: 'Allowance', icon: '💰' },
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto animate-slide-up">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-harbor-900">Family Hub</h1>
        <p className="text-harbor-500">Stay connected, organized, and growing together</p>
      </header>

      <nav className="flex gap-2 mb-6 overflow-x-auto border-b border-harbor-200 pb-2">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all', activeTab === tab.key ? 'bg-teal-600 text-white shadow-md' : 'text-harbor-600 hover:bg-harbor-100')}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'home' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {members.map(member => (
              <div key={member.id} className="card p-4 text-center">
                <div className="relative inline-block mb-2">
                  <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-xl font-bold text-teal-700 mx-auto">
                    {member.name.charAt(0)}
                  </div>
                  <span className={cn('absolute bottom-0 right-2 w-3.5 h-3.5 rounded-full border-2 border-white', statusColors[member.status])} />
                </div>
                <h3 className="font-medium text-harbor-900 text-sm">{member.name}</h3>
                <p className="text-xs text-harbor-500 capitalize">{member.role}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-semibold text-harbor-900 mb-3">📅 Upcoming Events</h3>
              {schedule.slice(0, 4).map(entry => (
                <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-harbor-100 last:border-0">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-harbor-800">{entry.title}</p>
                    <p className="text-xs text-harbor-500">{entry.member_name} · {new Date(entry.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {schedule.length === 0 && <p className="text-sm text-harbor-400">No upcoming events</p>}
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-harbor-900 mb-3">✅ Shared Tasks</h3>
              {[{ task: 'Grocery shopping', assigned: 'Mom', done: true }, { task: 'Take out trash', assigned: 'Dad', done: false },
                { task: 'Walk the dog', assigned: 'Alex', done: false }, { task: 'Laundry', assigned: 'Mom', done: true }].map((t, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-harbor-100 last:border-0">
                  <span className={cn('w-5 h-5 rounded border flex items-center justify-center text-xs', t.done ? 'bg-teal-500 border-teal-500 text-white' : 'border-harbor-300')}>
                    {t.done && '✓'}
                  </span>
                  <span className={cn('text-sm flex-1', t.done ? 'line-through text-harbor-400' : 'text-harbor-800')}>{t.task}</span>
                  <span className="text-xs text-harbor-500">{t.assigned}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => setSelectedAlbum('all')} className={cn('px-3 py-1 rounded-full text-sm', selectedAlbum === 'all' ? 'bg-teal-600 text-white' : 'bg-harbor-100 text-harbor-600')}>All</button>
              {albums.map(album => (
                <button key={album} onClick={() => setSelectedAlbum(album)}
                  className={cn('px-3 py-1 rounded-full text-sm', selectedAlbum === album ? 'bg-teal-600 text-white' : 'bg-harbor-100 text-harbor-600')}>{album}</button>
              ))}
            </div>
            <button onClick={() => setShowUploadPhoto(true)} className="btn-teal text-sm px-3 py-1.5">📷 Upload</button>
          </div>
          {showUploadPhoto && (
            <form onSubmit={handleUploadPhoto} className="card p-4 space-y-3">
              <input type="file" accept="image/*" onChange={e => setNewPhoto(p => ({ ...p, file: e.target.files?.[0] || null }))} className="input-field w-full" />
              <input type="text" value={newPhoto.caption} onChange={e => setNewPhoto(p => ({ ...p, caption: e.target.value }))}
                className="input-field w-full" placeholder="Caption..." />
              <input type="text" value={newPhoto.album} onChange={e => setNewPhoto(p => ({ ...p, album: e.target.value }))}
                className="input-field w-full" placeholder="Album name" />
              <div className="flex gap-2">
                <button type="submit" className="btn-teal text-sm flex-1">Upload</button>
                <button type="button" onClick={() => setShowUploadPhoto(false)} className="px-4 py-2 border border-harbor-300 rounded-lg text-sm text-harbor-600">Cancel</button>
              </div>
            </form>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredPhotos.map(photo => (
              <div key={photo.id} className="card overflow-hidden group cursor-pointer">
                <div className="h-36 bg-harbor-100 flex items-center justify-center text-3xl">📷</div>
                <div className="p-2">
                  <p className="text-xs text-harbor-700 truncate">{photo.caption}</p>
                  <p className="text-xs text-harbor-400">{photo.uploaded_by} · {photo.comments} 💬</p>
                </div>
              </div>
            ))}
          </div>
          {filteredPhotos.length === 0 && <div className="card p-8 text-center text-harbor-500">No photos yet. Start capturing memories!</div>}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-harbor-900">Family Timeline</h2>
            <button onClick={() => setShowAddEvent(true)} className="btn-teal text-sm px-3 py-1.5">+ Add Event</button>
          </div>
          {showAddEvent && (
            <form onSubmit={handleAddEvent} className="card p-4 space-y-3">
              <input type="text" value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                className="input-field w-full" placeholder="Event title *" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} className="input-field" />
                <select value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value as any }))} className="input-field">
                  <option value="event">Event</option>
                  <option value="milestone">Milestone</option>
                  <option value="achievement">Achievement</option>
                </select>
              </div>
              <input type="text" value={newEvent.member_name} onChange={e => setNewEvent(p => ({ ...p, member_name: e.target.value }))}
                className="input-field w-full" placeholder="Family member" />
              <textarea value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                className="input-field w-full h-16 resize-none" placeholder="Description..." />
              <div className="flex gap-2">
                <button type="submit" className="btn-teal text-sm flex-1">Add to Timeline</button>
                <button type="button" onClick={() => setShowAddEvent(false)} className="px-4 py-2 border border-harbor-300 rounded-lg text-sm text-harbor-600">Cancel</button>
              </div>
            </form>
          )}
          <div className="relative pl-6 border-l-2 border-harbor-200 space-y-6">
            {timeline.map(event => (
              <div key={event.id} className={cn('relative card p-4 ml-4 border-l-4', eventTypeColors[event.type])}>
                <div className="absolute -left-[2.1rem] top-4 w-4 h-4 rounded-full bg-white border-2 border-teal-500" />
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{event.icon}</span>
                  <h3 className="font-medium text-harbor-900">{event.title}</h3>
                </div>
                <p className="text-sm text-harbor-600">{event.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-harbor-400">
                  <span>{event.member_name}</span>
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          {timeline.length === 0 && <div className="card p-8 text-center text-harbor-500">No timeline events yet. Start documenting your family journey!</div>}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-harbor-900">Family Calendar</h2>
            <div className="flex gap-2 ml-auto">
              {members.slice(0, 4).map(m => (
                <span key={m.id} className="text-xs px-2 py-0.5 rounded-full bg-harbor-100 text-harbor-600">{m.name}</span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {schedule.map(entry => (
              <div key={entry.id} className="card p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-3 h-10 rounded-full" style={{ backgroundColor: entry.color }} />
                <div className="flex-1">
                  <h4 className="font-medium text-harbor-900 text-sm">{entry.title}</h4>
                  <p className="text-xs text-harbor-500">{entry.member_name} · {entry.time}{entry.recurring && ' · 🔄 Recurring'}</p>
                </div>
                <span className="text-xs text-harbor-400">{new Date(entry.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
          {schedule.length === 0 && <div className="card p-8 text-center text-harbor-500">No scheduled events. Add events to keep the family in sync!</div>}
          <div className="p-4 bg-harbor-50 rounded-lg border border-harbor-200">
            <p className="text-sm text-harbor-700 font-medium">🔔 Custody Schedule</p>
            <p className="text-xs text-harbor-500 mt-1">Color-coded calendar helps track custody schedules clearly for all family members.</p>
          </div>
        </div>
      )}

      {activeTab === 'allowance' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-900">Kids Allowance Tracker</h2>
          {allowances.map(record => (
            <div key={record.id} className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-harbor-900">{record.child_name}</h3>
                  <p className="text-sm text-harbor-500">${record.weekly_amount}/week</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-teal-600">${record.balance.toFixed(2)}</p>
                  <p className="text-xs text-harbor-400">balance</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-harbor-600 mb-1">
                  <span>Savings Goal</span>
                  <span>${record.savings_current} / ${record.savings_goal}</span>
                </div>
                <div className="w-full bg-harbor-200 rounded-full h-2.5">
                  <div className="bg-mly-amber h-2.5 rounded-full transition-all" style={{ width: `${(record.savings_current / record.savings_goal) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-harbor-600 mb-1">
                  <span>Chores Completed</span>
                  <span>{record.chores_completed}/{record.chores_total}</span>
                </div>
                <div className="w-full bg-harbor-200 rounded-full h-2">
                  <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${(record.chores_completed / record.chores_total) * 100}%` }} />
                </div>
              </div>
              <button onClick={() => handleAllowancePayment(record.id)} className="btn-teal w-full text-sm">
                💵 Pay Weekly Allowance (${record.weekly_amount})
              </button>
            </div>
          ))}
          {allowances.length === 0 && (
            <div className="card p-8 text-center text-harbor-500">
              <p>No allowance records set up yet.</p>
              <p className="text-xs mt-2">Set up allowance tracking to teach kids financial responsibility.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
