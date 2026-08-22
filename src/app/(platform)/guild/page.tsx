'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'home' | 'patrols' | 'team' | 'incidents' | 'schedule'

interface PatrolRoute {
  id: string
  name: string
  status: string
  checkpoints: string[]
  assigned_to: string
  start_time: string
  zone: string
}

interface TeamMember {
  id: string
  user_id: string
  role: string
  block_area: string
  daily_rate: number
  active: boolean
  tasks_completed: number
  total_earned: number
  joined_at: string
}

interface Incident {
  id: string
  reporter_id: string
  type: string
  severity: string
  location: string
  description: string
  status: string
  resolution: string | null
  reported_at: string
}

interface Shift {
  id: string
  date: string
  time_slot: string
  zone: string
  filled: boolean
  volunteer_id: string | null
  volunteer_name: string | null
}

export default function GuildPage() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [loading, setLoading] = useState(true)
  const [patrols, setPatrols] = useState<PatrolRoute[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [incidentForm, setIncidentForm] = useState({ type: '', severity: 'medium', location: '', description: '' })
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'patrols', label: 'Patrols' },
    { key: 'team', label: 'Team' },
    { key: 'incidents', label: 'Incidents' },
    { key: 'schedule', label: 'Schedule' },
  ]

  useEffect(() => {
    loadGuildData()
  }, [])

  async function loadGuildData() {
    setLoading(true)
    try {
      const supabase = createClient()

      const [patrolRes, teamRes, incidentRes, shiftRes] = await Promise.all([
        supabase.from('guild_patrols').select('*').order('created_at', { ascending: false }),
        supabase.from('guild_members').select('*').order('joined_at', { ascending: false }),
        supabase.from('guild_incidents').select('*').order('reported_at', { ascending: false }),
        supabase.from('guild_shifts').select('*').order('date', { ascending: true }),
      ])

      setPatrols(patrolRes.data || [])
      setTeam(teamRes.data || [])
      setIncidents(incidentRes.data || [])
      setShifts(shiftRes.data || [])
    } catch (err) {
      toast.error('Failed to load guild data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUpShift(shiftId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('guild_shifts')
      .update({ filled: true, volunteer_id: user?.id, volunteer_name: user?.display_name || 'Volunteer' })
      .eq('id', shiftId)

    if (error) {
      toast.error('Failed to sign up for shift')
      return
    }
    setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, filled: true, volunteer_name: user?.display_name || 'You' } : s))
    toast.success('Signed up for shift successfully!')
  }

  async function handleReportIncident() {
    if (!incidentForm.type || !incidentForm.location) {
      toast.error('Please fill in type and location')
      return
    }
    const supabase = createClient()
    const { data, error } = await supabase.from('guild_incidents').insert({
      reporter_id: user?.id,
      type: incidentForm.type,
      severity: incidentForm.severity,
      location: incidentForm.location,
      description: incidentForm.description,
      status: 'open',
    }).select().single()

    if (error) {
      toast.error('Failed to report incident')
      return
    }
    setIncidents(prev => [data, ...prev])
    setIncidentForm({ type: '', severity: 'medium', location: '', description: '' })
    toast.success('Incident reported successfully')
  }

  const severityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'text-red-500 bg-red-500/10'
      case 'high': return 'text-orange-500 bg-orange-500/10'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10'
      default: return 'text-teal-500 bg-teal-500/10'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-900">Community Safety Guild</h1>
          <p className="text-harbor-500 mt-1">Protecting our neighborhood together</p>
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

      {activeTab === 'home' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Patrols', value: patrols.filter(p => p.status === 'active').length, color: 'text-teal-600' },
              { label: 'Team Members', value: team.filter(t => t.active).length, color: 'text-mly-500' },
              { label: 'Open Incidents', value: incidents.filter(i => i.status === 'open').length, color: 'text-orange-500' },
              { label: 'Shifts Today', value: shifts.filter(s => s.date === new Date().toISOString().split('T')[0]).length, color: 'text-harbor-700' },
            ].map(stat => (
              <div key={stat.label} className="card p-4 rounded-xl">
                <p className="text-harbor-500 text-sm">{stat.label}</p>
                <p className={cn('text-3xl font-bold mt-1', stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Active Patrol Status</h3>
            {patrols.filter(p => p.status === 'active').length === 0 ? (
              <p className="text-sm text-harbor-500">No active patrols at the moment.</p>
            ) : patrols.filter(p => p.status === 'active').map(patrol => (
              <div key={patrol.id} className="flex items-center justify-between p-3 bg-teal-50 rounded-lg mb-2">
                <div>
                  <p className="font-medium text-harbor-800">{patrol.name}</p>
                  <p className="text-sm text-harbor-500">Assigned: {patrol.assigned_to} | Started: {patrol.start_time}</p>
                </div>
                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">Live</span>
              </div>
            ))}
          </div>
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Team Members</h3>
            {team.length === 0 ? (
              <p className="text-sm text-harbor-500">No team members yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {team.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-harbor-50 rounded-lg">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-harbor-200 flex items-center justify-center text-harbor-600 font-bold">{member.role[0]?.toUpperCase()}</div>
                      <span className={cn('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', member.active ? 'bg-green-500' : 'bg-harbor-300')} />
                    </div>
                    <div>
                      <p className="font-medium text-harbor-800 capitalize">{member.role}</p>
                      <p className="text-xs text-harbor-500">{member.block_area}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'patrols' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Patrol Routes</h2>
          {patrols.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No patrols scheduled yet.</p>
            </div>
          ) : patrols.map(patrol => (
            <div key={patrol.id} className="card p-5 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-harbor-800">{patrol.name}</h3>
                <span className={cn('px-3 py-1 rounded-full text-xs font-medium', patrol.status === 'active' ? 'bg-teal-100 text-teal-700' : patrol.status === 'completed' ? 'bg-harbor-100 text-harbor-600' : 'bg-mly-100 text-mly-700')}>{patrol.status}</span>
              </div>
              <p className="text-sm text-harbor-500 mb-2">Assigned: {patrol.assigned_to} | Start: {patrol.start_time} | Zone: {patrol.zone}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {(patrol.checkpoints || []).map((cp, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="px-2 py-1 bg-harbor-100 text-harbor-600 rounded text-xs">{cp}</span>
                    {idx < (patrol.checkpoints?.length || 0) - 1 && <span className="text-harbor-300">→</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Guild Members</h2>
          {team.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No guild members yet. Be the first to join!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {team.map(member => (
                <div key={member.id} className="card p-5 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-harbor-200 flex items-center justify-center text-harbor-600 font-bold text-lg">{member.role[0]?.toUpperCase()}</div>
                      <span className={cn('absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white', member.active ? 'bg-green-500' : 'bg-harbor-300')} />
                    </div>
                    <div>
                      <p className="font-semibold text-harbor-800 capitalize">{member.role}</p>
                      <p className="text-sm text-teal-600 font-medium">{member.block_area}</p>
                    </div>
                  </div>
                  <p className="text-sm text-harbor-500 mb-2">Daily Rate: ${member.daily_rate} | Tasks: {member.tasks_completed}</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-xs">Earned: ${member.total_earned}</span>
                    <span className="px-2 py-0.5 bg-harbor-50 text-harbor-600 rounded text-xs">Joined: {new Date(member.joined_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Report New Incident</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input-field px-3 py-2 rounded-lg" placeholder="Incident type..." value={incidentForm.type} onChange={e => setIncidentForm(p => ({ ...p, type: e.target.value }))} />
              <input className="input-field px-3 py-2 rounded-lg" placeholder="Location..." value={incidentForm.location} onChange={e => setIncidentForm(p => ({ ...p, location: e.target.value }))} />
              <select className="input-field px-3 py-2 rounded-lg" value={incidentForm.severity} onChange={e => setIncidentForm(p => ({ ...p, severity: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <button onClick={handleReportIncident} className="btn-teal px-4 py-2 rounded-lg">Report Incident</button>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-harbor-800">Incident Log</h2>
          {incidents.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No incidents reported. The community is safe!</p>
            </div>
          ) : incidents.map(inc => (
            <div key={inc.id} className="card p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-harbor-800">{inc.type}</h4>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', severityColor(inc.severity))}>{inc.severity}</span>
              </div>
              <p className="text-sm text-harbor-500">Location: {inc.location}</p>
              <p className="text-sm text-harbor-500">Reported: {new Date(inc.reported_at).toLocaleString()}</p>
              <p className="text-sm text-harbor-500">Status: <span className="capitalize font-medium">{inc.status}</span></p>
              {inc.resolution && <p className="text-sm text-teal-600 mt-1">Resolution: {inc.resolution}</p>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Shift Schedule</h2>
          {shifts.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No shifts scheduled yet.</p>
            </div>
          ) : shifts.map(shift => (
            <div key={shift.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-harbor-800">{shift.zone} Zone</p>
                <p className="text-sm text-harbor-500">{shift.date} | {shift.time_slot}</p>
                {shift.volunteer_name && <p className="text-xs text-teal-600 mt-1">Volunteer: {shift.volunteer_name}</p>}
              </div>
              {shift.filled ? (
                <span className="px-3 py-1 bg-harbor-100 text-harbor-500 rounded-full text-xs">Filled</span>
              ) : (
                <button onClick={() => handleSignUpShift(shift.id)} className="btn-teal px-3 py-1.5 rounded-lg text-xs">Sign Up</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
