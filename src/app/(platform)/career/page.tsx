'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'jobs' | 'applications' | 'resume' | 'skills' | 'coaching'
type JobType = 'full-time' | 'part-time' | 'gig' | 'contract'
type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'accepted' | 'rejected'

interface Job {
  id: string
  title: string
  company: string
  type: JobType
  category: string
  location: string
  remote: boolean
  mly_payment: boolean
  salary_range: string
  description: string
  posted_at: string
}

interface Application {
  id: string
  job_title: string
  company: string
  status: ApplicationStatus
  applied_at: string
  notes: string
  next_step?: string
}

interface Skill {
  id: string
  name: string
  category: string
  proficiency: number
  endorsements: number
}

interface Coach {
  id: string
  name: string
  specialty: string
  rating: number
  sessions_completed: number
  price_per_session: number
  available: boolean
}

export default function CareerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('jobs')
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [filterType, setFilterType] = useState<JobType | 'all'>('all')
  const [filterRemote, setFilterRemote] = useState(false)
  const { user } = useAppStore()

  // Resume state
  const [resume, setResume] = useState({
    summary: '', experience: [{ title: '', company: '', duration: '', description: '' }],
    education: [{ school: '', degree: '', year: '' }],
    skills: [] as string[], references: [{ name: '', relationship: '', contact: '' }]
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const supabase = createClient()
    const [jobsRes, appsRes, skillsRes, coachRes] = await Promise.all([
      supabase.from('career_jobs').select('*').order('posted_at', { ascending: false }),
      supabase.from('career_applications').select('*').eq('user_id', user?.id).order('applied_at', { ascending: false }),
      supabase.from('career_skills').select('*').eq('user_id', user?.id),
      supabase.from('career_coaches').select('*').order('rating', { ascending: false })
    ])
    if (jobsRes.data) setJobs(jobsRes.data)
    if (appsRes.data) setApplications(appsRes.data)
    if (skillsRes.data) setSkills(skillsRes.data)
    if (coachRes.data) setCoaches(coachRes.data)
    setLoading(false)
  }

  async function handleApply(jobId: string) {
    const supabase = createClient()
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    const { error } = await supabase.from('career_applications').insert({
      user_id: user?.id, job_id: jobId, job_title: job.title, company: job.company, status: 'applied', notes: ''
    })
    if (error) {
      toast.error('Failed to submit application')
    } else {
      toast.success(`Applied to ${job.title} at ${job.company}!`)
      fetchData()
    }
  }

  async function handleSaveResume() {
    const supabase = createClient()
    const { error } = await supabase.from('career_resumes').upsert({
      user_id: user?.id, content: resume, updated_at: new Date().toISOString()
    })
    if (error) toast.error('Failed to save resume')
    else toast.success('Resume saved successfully')
  }

  async function handleBookCoach(coachId: string) {
    const coach = coaches.find(c => c.id === coachId)
    if (!coach) return
    toast.success(`Session requested with ${coach.name}! They'll confirm within 24h.`)
  }

  const filteredJobs = jobs.filter(j => {
    if (filterType !== 'all' && j.type !== filterType) return false
    if (filterRemote && !j.remote) return false
    return true
  })

  const statusColors: Record<ApplicationStatus, string> = {
    'applied': 'bg-harbor-400 text-white',
    'interview': 'bg-teal-500 text-white',
    'offer': 'bg-mly-amber text-harbor-900',
    'accepted': 'bg-green-600 text-white',
    'rejected': 'bg-red-400 text-white'
  }

  const typeIcons: Record<JobType, string> = { 'full-time': '💼', 'part-time': '⏰', 'gig': '⚡', 'contract': '📋' }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'jobs', label: 'Jobs', icon: '💼' },
    { key: 'applications', label: 'Applications', icon: '📋' },
    { key: 'resume', label: 'Resume', icon: '📄' },
    { key: 'skills', label: 'Skills', icon: '🎯' },
    { key: 'coaching', label: 'Coaching', icon: '🧭' },
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-56 rounded-lg" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto animate-slide-up">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-harbor-900">Career Hub</h1>
        <p className="text-harbor-500">Find opportunities, build skills, grow your career</p>
      </header>

      <nav className="flex gap-2 mb-6 overflow-x-auto border-b border-harbor-200 pb-2">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all', activeTab === tab.key ? 'bg-teal-600 text-white shadow-md' : 'text-harbor-600 hover:bg-harbor-100')}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="input-field">
              <option value="all">All Types</option>
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="gig">Gig</option>
              <option value="contract">Contract</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-harbor-700 cursor-pointer">
              <input type="checkbox" checked={filterRemote} onChange={e => setFilterRemote(e.target.checked)} className="rounded border-harbor-300" />
              Remote only
            </label>
          </div>
          {filteredJobs.map(job => (
            <div key={job.id} className="card p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{typeIcons[job.type]}</span>
                    <h3 className="font-semibold text-harbor-900">{job.title}</h3>
                    {job.mly_payment && <span className="text-xs bg-mly-amber/20 text-mly-amber px-2 py-0.5 rounded-full font-medium">$MLY</span>}
                  </div>
                  <p className="text-sm text-harbor-600">{job.company}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-harbor-500">
                    <span>📍 {job.location}</span>
                    {job.remote && <span className="text-teal-600">🌐 Remote</span>}
                    <span>💰 {job.salary_range}</span>
                    <span className="capitalize bg-harbor-100 px-2 py-0.5 rounded">{job.type}</span>
                  </div>
                </div>
                <button onClick={() => handleApply(job.id)} className="btn-teal text-sm px-4 py-2">Apply</button>
              </div>
            </div>
          ))}
          {filteredJobs.length === 0 && (
            <div className="card p-8 text-center text-harbor-500">No jobs match your filters. Try broadening your search.</div>
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-harbor-500">No applications yet.</p>
              <button onClick={() => setActiveTab('jobs')} className="btn-teal mt-3 text-sm">Browse Jobs</button>
            </div>
          ) : applications.map(app => (
            <div key={app.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-harbor-900">{app.job_title}</h3>
                  <p className="text-sm text-harbor-600">{app.company}</p>
                </div>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusColors[app.status])}>{app.status}</span>
              </div>
              <div className="mt-2 flex gap-1">
                {(['applied', 'interview', 'offer', 'accepted'] as ApplicationStatus[]).map((s, i) => (
                  <div key={s} className={cn('h-1.5 flex-1 rounded-full', ['applied', 'interview', 'offer', 'accepted'].indexOf(app.status) >= i ? 'bg-teal-500' : app.status === 'rejected' ? 'bg-red-300' : 'bg-harbor-200')} />
                ))}
              </div>
              {app.next_step && <p className="text-xs text-teal-600 mt-2 font-medium">Next: {app.next_step}</p>}
              <p className="text-xs text-harbor-400 mt-1">Applied {new Date(app.applied_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'resume' && (
        <div className="card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-harbor-900">Resume Builder</h2>
          <div>
            <label className="block text-sm font-medium text-harbor-700 mb-1">Professional Summary</label>
            <textarea value={resume.summary} onChange={e => setResume(p => ({ ...p, summary: e.target.value }))}
              className="input-field w-full h-20 resize-none" placeholder="Brief summary of your professional background..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-harbor-700 mb-2">Experience</label>
            {resume.experience.map((exp, i) => (
              <div key={i} className="grid grid-cols-2 gap-3 mb-3 p-3 bg-harbor-50 rounded-lg">
                <input type="text" value={exp.title} onChange={e => { const ex = [...resume.experience]; ex[i].title = e.target.value; setResume(p => ({ ...p, experience: ex })) }}
                  className="input-field" placeholder="Job Title" />
                <input type="text" value={exp.company} onChange={e => { const ex = [...resume.experience]; ex[i].company = e.target.value; setResume(p => ({ ...p, experience: ex })) }}
                  className="input-field" placeholder="Company" />
                <input type="text" value={exp.duration} onChange={e => { const ex = [...resume.experience]; ex[i].duration = e.target.value; setResume(p => ({ ...p, experience: ex })) }}
                  className="input-field" placeholder="Duration" />
                <input type="text" value={exp.description} onChange={e => { const ex = [...resume.experience]; ex[i].description = e.target.value; setResume(p => ({ ...p, experience: ex })) }}
                  className="input-field" placeholder="Key achievements" />
              </div>
            ))}
            <button type="button" onClick={() => setResume(p => ({ ...p, experience: [...p.experience, { title: '', company: '', duration: '', description: '' }] }))}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium">+ Add Experience</button>
          </div>
          <div>
            <label className="block text-sm font-medium text-harbor-700 mb-2">Education</label>
            {resume.education.map((edu, i) => (
              <div key={i} className="grid grid-cols-3 gap-3 mb-3">
                <input type="text" value={edu.school} onChange={e => { const ed = [...resume.education]; ed[i].school = e.target.value; setResume(p => ({ ...p, education: ed })) }}
                  className="input-field" placeholder="School" />
                <input type="text" value={edu.degree} onChange={e => { const ed = [...resume.education]; ed[i].degree = e.target.value; setResume(p => ({ ...p, education: ed })) }}
                  className="input-field" placeholder="Degree" />
                <input type="text" value={edu.year} onChange={e => { const ed = [...resume.education]; ed[i].year = e.target.value; setResume(p => ({ ...p, education: ed })) }}
                  className="input-field" placeholder="Year" />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={handleSaveResume} className="btn-teal flex-1">💾 Save Resume</button>
            <button className="flex-1 px-4 py-2 border border-harbor-300 rounded-lg text-harbor-700 hover:bg-harbor-50">📥 Export PDF</button>
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map(skill => (
              <div key={skill.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-harbor-900">{skill.name}</h3>
                  <span className="text-xs text-harbor-500">{skill.endorsements} endorsements</span>
                </div>
                <div className="w-full bg-harbor-200 rounded-full h-2.5">
                  <div className="bg-teal-500 h-2.5 rounded-full transition-all" style={{ width: `${skill.proficiency}%` }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-harbor-500">{skill.category}</span>
                  <span className="text-xs font-medium text-teal-600">{skill.proficiency}%</span>
                </div>
              </div>
            ))}
          </div>
          {skills.length === 0 && (
            <div className="card p-8 text-center text-harbor-500">
              <p>No skills added yet.</p>
              <Link href="/learn" className="text-teal-600 hover:underline text-sm mt-2 inline-block">Browse courses to build skills →</Link>
            </div>
          )}
          <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
            <p className="text-sm text-teal-800 font-medium">Level up your skills</p>
            <p className="text-xs text-teal-600 mt-1">Complete courses on <Link href="/learn" className="underline">MiLyfe Learn</Link> to increase proficiency and earn endorsements from peers.</p>
          </div>
        </div>
      )}

      {activeTab === 'coaching' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coaches.map(coach => (
            <div key={coach.id} className="card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-lg font-bold text-teal-700">
                  {coach.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-harbor-900">{coach.name}</h3>
                  <p className="text-xs text-harbor-500">{coach.specialty}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-harbor-500">
                <span>⭐ {coach.rating}</span>
                <span>{coach.sessions_completed} sessions</span>
                <span className="text-teal-600 font-medium">${coach.price_per_session}/session</span>
              </div>
              <button onClick={() => handleBookCoach(coach.id)} disabled={!coach.available}
                className={cn('w-full text-sm py-2 rounded-lg font-medium transition', coach.available ? 'btn-teal' : 'bg-harbor-200 text-harbor-400 cursor-not-allowed')}>
                {coach.available ? '📅 Book Session' : 'Unavailable'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
