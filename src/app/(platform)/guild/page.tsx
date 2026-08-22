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
  status: 'active' | 'completed' | 'scheduled'
  checkpoints: string[]
  assignedTo: string
  startTime: string
}

interface TeamMember {
  id: string
  name: string
  role: 'captain' | 'scout' | 'medic'
  online: boolean
  skills: string[]
  availability: string
}

interface Incident {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  location: string
  reportedAt: string
  status: 'open' | 'investigating' | 'resolved'
  resolution?: string
}

interface Shift {
  id: string
  date: string
  time: string
  zone: string
  filled: boolean
  volunteer?: string
}

export default function GuildPage() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [loading, setLoading] = useState(true)
  const [patrols, setPatrols] = useState<PatrolRoute[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [incidentForm, setIncidentForm] = useState({ type: '', severity: 'medium', location: '', description: '' })
  const supabase = createClient()
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
      setPatrols([
        { id: '1', name: 'Riverside Evening Patrol', status: 'active', checkpoints: ['Park Entrance', 'Main St & 5th', 'Community Center', 'Playground'], assignedTo: 'Captain Rivera', startTime: '6:00 PM' },
        { id: '2', name: 'Downtown Morning Watch', status: 'completed', checkpoints: ['City Hall', 'Library', 'Bus Terminal'], assignedTo: 'Scout Adams', startTime: '7:00 AM' },
        { id: '3', name: 'Northside Night Patrol', status: 'scheduled', checkpoints: ['School Zone', 'Shopping Center', 'Apartment Complex'], assignedTo: 'Scout Williams', startTime: '10:00 PM' },
      ])
      setTeam([
        { id: '1', name: 'Marcus Rivera', role: 'captain', online: true, skills: ['Leadership', 'First Aid', 'De-escalation'], availability: 'Evenings & Weekends' },
        { id: '2', name: 'Tanya Adams', role: 'scout', online: true, skills: ['Navigation', 'Communication', 'Surveillance'], availability: 'Mornings' },
        { id: '3', name: 'Jordan Williams', role: 'scout', online: false, skills: ['Navigation', 'Photography', 'Report Writing'], availability: 'Nights' },
        { id: '4', name: 'Dr. Keisha Brown', role: 'medic', online: true, skills: ['Emergency Medicine', 'CPR', 'Trauma Response'], availability: 'On-call' },
      ])
      setIncidents([
        { id: '1', type: 'Suspicious Activity', severity: 'medium', location: 'Park Entrance - Riverside', reportedAt: '2024-01-15 8:30 PM', status: 'investigating' },
        { id: '2', type: 'Property Damage', severity: 'low', location: 'Main St & 5th Ave', reportedAt: '2024-01-14 2:15 PM', status: 'resolved', resolution: 'Owner notified, cleanup completed' },
        { id: '3', type: 'Medical Emergency', severity: 'high', location: 'Community Center', reportedAt: '2024-01-15 9:00 PM', status: 'open' },
      ])
      setShifts([
        { id: '1', date: '2024-01-16', time: '6:00 AM - 12:00 PM', zone: 'Downtown', filled: true, volunteer: 'Tanya Adams' },
        { id: '2', date: '2024-01-16', time: '12:00 PM - 6:00 PM', zone: 'Riverside', filled: false },
        { id: '3', date: '2024-01-16', time: '6:00 PM - 12:00 AM', zone: 'Northside', filled: true, volunteer: 'Marcus Rivera' },
        { id: '4', date: '2024-01-17', time: '6:00 AM - 12:00 PM', zone: 'Eastside', filled: false },
        { id: '5', date: '2024-01-17', time: '12:00 PM - 6:00 PM', zone: 'Downtown', filled: false },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSignUpShift(shiftId: string) {
    setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, filled: true, volunteer: user?.display_name || 'You' } : s))
    toast.success('Signed up for shift successfully!')
  }

  function handleReportIncident() {
    if (!incidentForm.type || !incidentForm.location) {
      toast.error('Please fill in type and location')
      return
    }
    const newIncident: Incident = {
      id: String(incidents.length + 1),
      type: incidentForm.type,
      severity: incidentForm.severity as Incident['severity'],
      location: incidentForm.location,
      reportedAt: new Date().toLocaleString(),
      status: 'open',
    }
    setIncidents(prev => [newIncident, ...prev])
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
            {[{ label: 'Active Patrols', value: patrols.filter(p => p.status === 'active').length, color: 'text-teal-600' }, { label: 'Team Online', value: team.filter(t => t.online).length, color: 'text-mly-500' }, { label: 'Open Incidents', value: incidents.filter(i => i.status === 'open').length, color: 'text-orange-500' }, { label: 'Shifts Today', value: shifts.filter(s => s.date === '2024-01-16').length, color: 'text-harbor-700' }].map(stat => (
              <div key={stat.label} className="card p-4 rounded-xl">
                <p className="text-harbor-500 text-sm">{stat.label}</p>
                <p className={cn('text-3xl font-bold mt-1', stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Active Patrol Status</h3>
            {patrols.filter(p => p.status === 'active').map(patrol => (
              <div key={patrol.id} className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                <div>
                  <p className="font-medium text-harbor-800">{patrol.name}</p>
                  <p className="text-sm text-harbor-500">Assigned: {patrol.assignedTo} | Started: {patrol.startTime}</p>
                </div>
                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">Live</span>
              </div>
            ))}
          </div>
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Team Members</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {team.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-harbor-50 rounded-lg">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-harbor-200 flex items-center justify-center text-harbor-600 font-bold">{member.name[0]}</div>
                    <span className={cn('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', member.online ? 'bg-green-500' : 'bg-harbor-300')} />
                  </div>
                  <div>
                    <p className="font-medium text-harbor-800">{member.name}</p>
                    <p className="text-xs text-harbor-500 capitalize">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'patrols' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Patrol Routes</h2>
          {patrols.map(patrol => (
            <div key={patrol.id} className="card p-5 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-harbor-800">{patrol.name}</h3>
                <span className={cn('px-3 py-1 rounded-full text-xs font-medium', patrol.status === 'active' ? 'bg-teal-100 text-teal-700' : patrol.status === 'completed' ? 'bg-harbor-100 text-harbor-600' : 'bg-mly-100 text-mly-700')}>{patrol.status}</span>
              </div>
              <p className="text-sm text-harbor-500 mb-2">Assigned: {patrol.assignedTo} | Start: {patrol.startTime}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {patrol.checkpoints.map((cp, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="px-2 py-1 bg-harbor-100 text-harbor-600 rounded text-xs">{cp}</span>
                    {idx < patrol.checkpoints.length - 1 && <span className="text-harbor-300">→</span>}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {team.map(member => (
              <div key={member.id} className="card p-5 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-harbor-200 flex items-center justify-center text-harbor-600 font-bold text-lg">{member.name[0]}</div>
                    <span className={cn('absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white', member.online ? 'bg-green-500' : 'bg-harbor-300')} />
                  </div>
                  <div>
                    <p className="font-semibold text-harbor-800">{member.name}</p>
                    <p className="text-sm text-teal-600 capitalize font-medium">{member.role}</p>
                  </div>
                </div>
                <p className="text-sm text-harbor-500 mb-2">Availability: {member.availability}</p>
                <div className="flex flex-wrap gap-1">
                  {member.skills.map(skill => (
                    <span key={skill} className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-xs">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
          {incidents.map(inc => (
            <div key={inc.id} className="card p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-harbor-800">{inc.type}</h4>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', severityColor(inc.severity))}>{inc.severity}</span>
              </div>
              <p className="text-sm text-harbor-500">Location: {inc.location}</p>
              <p className="text-sm text-harbor-500">Reported: {inc.reportedAt}</p>
              <p className="text-sm text-harbor-500">Status: <span className="capitalize font-medium">{inc.status}</span></p>
              {inc.resolution && <p className="text-sm text-teal-600 mt-1">Resolution: {inc.resolution}</p>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Shift Schedule</h2>
          {shifts.map(shift => (
            <div key={shift.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-harbor-800">{shift.zone} Zone</p>
                <p className="text-sm text-harbor-500">{shift.date} | {shift.time}</p>
                {shift.volunteer && <p className="text-xs text-teal-600 mt-1">Volunteer: {shift.volunteer}</p>}
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
