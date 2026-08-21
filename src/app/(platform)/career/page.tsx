'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

// ─── Types ────────────────────────────────────────────────────────
interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  year: string;
}

interface Resume {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  created_at: string;
  updated_at: string;
}

interface Job {
  id: string;
  poster_id: string;
  title: string;
  description: string;
  category: string;
  pay_mly: number;
  pay_type: string;
  location: string;
  status: string;
  created_at: string;
  poster?: { display_name: string };
}

interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  message: string;
  status: string;
  rating: number | null;
  created_at: string;
  job?: { title: string; poster?: { display_name: string } };
}

// ─── Constants ────────────────────────────────────────────────────
const JOB_CATEGORIES = ['technology', 'creative', 'education', 'business', 'service', 'community', 'other'];

const BEHAVIORAL_QUESTIONS = [
  { q: "Tell me about a time you led a team through a difficult project.", tip: "Situation: Set the scene. Task: Your responsibility. Action: Steps you took. Result: Outcome with metrics." },
  { q: "Describe a time you had a conflict with a coworker. How did you handle it?", tip: "Focus on resolution, communication, and what you learned. Avoid blaming others." },
  { q: "Give an example of when you failed. What did you learn?", tip: "Choose a real failure. Show self-awareness and concrete changes you made afterward." },
  { q: "Tell me about a time you went above and beyond.", tip: "Quantify the extra effort and its impact. Show initiative without being asked." },
  { q: "Describe a time you had to make a decision with incomplete information.", tip: "Explain your reasoning process, risk assessment, and outcome." },
];

const TECHNICAL_QUESTIONS = [
  { q: "Walk me through a project you architected from scratch.", tip: "Cover requirements gathering, tech choices, tradeoffs, and lessons learned." },
  { q: "How do you approach debugging a complex production issue?", tip: "Show systematic thinking: reproduce, isolate, fix, verify, document." },
  { q: "Explain a technical concept to me as if I'm non-technical.", tip: "Use analogies, avoid jargon, and check understanding." },
];

const SITUATIONAL_QUESTIONS = [
  { q: "Your team disagrees on the approach. How do you move forward?", tip: "Facilitate discussion, find common ground, and make data-driven decisions." },
  { q: "A deadline is unrealistic. What do you do?", tip: "Communicate early, propose alternatives, and prioritize ruthlessly." },
  { q: "You notice a colleague is struggling. How do you help?", tip: "Approach with empathy, offer specific help, respect their autonomy." },
];

const tabs = ['Resume', 'Skills', 'Jobs', 'Prep'] as const;
type Tab = typeof tabs[number];

// ─── Main Component ────────────────────────────────────────────────
export default function MiCareerPage() {
  const { user } = useAppStore();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('Resume');
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<Resume | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [resumeRes, jobsRes, appsRes] = await Promise.all([
        supabase.from('resumes').select('*').eq('user_id', user.id).single(),
        supabase.from('jobs').select('*, poster:profiles!poster_id(display_name)').eq('status', 'open').order('created_at', { ascending: false }),
        supabase.from('job_applications').select('*, job:jobs(title, poster:profiles!poster_id(display_name))').eq('applicant_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (resumeRes.data) setResume(resumeRes.data as any);
      if (jobsRes.data) setJobs(jobsRes.data as any);
      if (appsRes.data) setApplications(appsRes.data as any);
    } catch (err) {
      console.error('MiCareer fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center animate-slide-up">
          <div className="text-4xl mb-4">💼</div>
          <h2 className="text-xl font-bold mb-2">MiCareer</h2>
          <p className="text-gray-500">Sign in to build your professional profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="skeleton h-8 w-40 rounded" />
        <div className="skeleton h-10 w-full rounded-xl" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="skeleton h-5 w-2/3 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24 space-y-6">
      {/* Header */}
      <header className="animate-slide-up">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          MiCareer
        </h1>
        <p className="text-gray-500 mt-1">Build your professional future</p>
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 animate-slide-up">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="animate-slide-up">
        {activeTab === 'Resume' && (
          <ResumeView resume={resume} onSave={handleSaveResume} />
        )}
        {activeTab === 'Skills' && (
          <SkillsView resume={resume} />
        )}
        {activeTab === 'Jobs' && (
          <JobsView jobs={jobs} applications={applications} userId={user.id} onApply={handleApply} />
        )}
        {activeTab === 'Prep' && (
          <PrepView />
        )}
      </div>
    </div>
  );

  async function handleSaveResume(data: Partial<Resume>) {
    if (resume) {
      const { data: updated } = await supabase
        .from('resumes')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', resume.id)
        .select()
        .single();
      if (updated) setResume(updated as any);
    } else {
      const { data: created } = await supabase
        .from('resumes')
        .insert({ ...data, user_id: user!.id })
        .select()
        .single();
      if (created) setResume(created as any);
    }
  }

  async function handleApply(jobId: string, message: string) {
    const { data } = await supabase
      .from('job_applications')
      .insert({ job_id: jobId, applicant_id: user!.id, message, status: 'pending' })
      .select('*, job:jobs(title, poster:profiles!poster_id(display_name))')
      .single();
    if (data) setApplications((prev) => [data as any, ...prev]);
  }
}

// ─── Resume View ─────────────────────────────────────────────────
function ResumeView({
  resume,
  onSave,
}: {
  resume: Resume | null;
  onSave: (data: Partial<Resume>) => void;
}) {
  const [preview, setPreview] = useState(false);
  const [title, setTitle] = useState(resume?.title || '');
  const [summary, setSummary] = useState(resume?.summary || '');
  const [experience, setExperience] = useState<ExperienceEntry[]>(resume?.experience || []);
  const [education, setEducation] = useState<EducationEntry[]>(resume?.education || []);
  const [skills, setSkills] = useState<string[]>(resume?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Experience form
  const [showExpForm, setShowExpForm] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [expBullets, setExpBullets] = useState('');

  // Education form
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduSchool, setEduSchool] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduYear, setEduYear] = useState('');

  const handleSave = async () => {
    setSaving(true);
    await onSave({ title, summary, experience, education, skills });
    setSaving(false);
  };

  const addExperience = () => {
    if (!expTitle.trim() || !expCompany.trim()) return;
    const entry: ExperienceEntry = {
      id: crypto.randomUUID(),
      title: expTitle.trim(),
      company: expCompany.trim(),
      startDate: expStart,
      endDate: expEnd,
      bullets: expBullets.split('\n').filter((b) => b.trim()),
    };
    setExperience((prev) => [...prev, entry]);
    setExpTitle(''); setExpCompany(''); setExpStart(''); setExpEnd(''); setExpBullets('');
    setShowExpForm(false);
  };

  const addEducation = () => {
    if (!eduSchool.trim() || !eduDegree.trim()) return;
    const entry: EducationEntry = {
      id: crypto.randomUUID(),
      school: eduSchool.trim(),
      degree: eduDegree.trim(),
      year: eduYear,
    };
    setEducation((prev) => [...prev, entry]);
    setEduSchool(''); setEduDegree(''); setEduYear('');
    setShowEduForm(false);
  };

  const addSkill = () => {
    if (!skillInput.trim() || skills.includes(skillInput.trim())) return;
    setSkills((prev) => [...prev, skillInput.trim()]);
    setSkillInput('');
  };

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Resume Preview</h3>
          <div className="flex gap-2">
            <button onClick={() => alert('PDF export coming soon!')} className="btn-gold text-sm">Export PDF</button>
            <button onClick={() => setPreview(false)} className="btn-teal text-sm">Edit</button>
          </div>
        </div>
        <div className="card p-8 space-y-6 font-serif max-w-[700px] mx-auto border-2">
          {/* Preview Layout */}
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold">{title || 'Your Name'}</h1>
            {summary && <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto">{summary}</p>}
          </div>

          {experience.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Experience</h2>
              {experience.map((exp) => (
                <div key={exp.id} className="mb-4">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-bold">{exp.title}</h3>
                    <span className="text-xs text-gray-500">{exp.startDate} — {exp.endDate || 'Present'}</span>
                  </div>
                  <p className="text-sm text-gray-600 italic">{exp.company}</p>
                  {exp.bullets.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {exp.bullets.map((b, i) => (
                        <li key={i} className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {education.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Education</h2>
              {education.map((edu) => (
                <div key={edu.id} className="mb-2 flex justify-between">
                  <div>
                    <p className="font-bold text-sm">{edu.degree}</p>
                    <p className="text-sm text-gray-600">{edu.school}</p>
                  </div>
                  <span className="text-xs text-gray-500">{edu.year}</span>
                </div>
              ))}
            </section>
          )}

          {skills.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Skills</h2>
              <p className="text-sm text-gray-700">{skills.join(' · ')}</p>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Resume Builder</h3>
        <div className="flex gap-2">
          <button onClick={() => setPreview(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Preview →
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Title & Summary */}
      <div className="card p-5 space-y-4">
        <input
          className="input-field w-full text-lg font-semibold"
          placeholder="Resume title (e.g. Full Stack Developer)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="input-field w-full min-h-[80px] resize-y"
          placeholder="Professional summary — 2-3 sentences about your expertise and goals"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>

      {/* Experience */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Experience</h4>
          <button onClick={() => setShowExpForm(!showExpForm)} className="text-sm text-blue-600 hover:text-blue-700">
            + Add
          </button>
        </div>

        {showExpForm && (
          <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-3 animate-slide-up">
            <input className="input-field w-full" placeholder="Job Title" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} />
            <input className="input-field w-full" placeholder="Company" value={expCompany} onChange={(e) => setExpCompany(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder="Start (e.g. Jan 2022)" value={expStart} onChange={(e) => setExpStart(e.target.value)} />
              <input className="input-field" placeholder="End (or blank for Present)" value={expEnd} onChange={(e) => setExpEnd(e.target.value)} />
            </div>
            <textarea className="input-field w-full min-h-[60px]" placeholder="Bullet points (one per line)" value={expBullets} onChange={(e) => setExpBullets(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={addExperience} className="btn-primary text-xs">Add</button>
              <button onClick={() => setShowExpForm(false)} className="text-xs text-gray-500">Cancel</button>
            </div>
          </div>
        )}

        {experience.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No experience added yet</p>
        ) : (
          <div className="space-y-3">
            {experience.map((exp, idx) => (
              <div key={exp.id} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div>
                  <p className="font-medium text-sm">{exp.title}</p>
                  <p className="text-xs text-gray-500">{exp.company} · {exp.startDate} — {exp.endDate || 'Present'}</p>
                  {exp.bullets.length > 0 && (
                    <ul className="mt-1 text-xs text-gray-600 space-y-0.5">
                      {exp.bullets.map((b, i) => <li key={i}>• {b}</li>)}
                    </ul>
                  )}
                </div>
                <button
                  onClick={() => setExperience((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-gray-400 hover:text-red-500 text-sm ml-2"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Education */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Education</h4>
          <button onClick={() => setShowEduForm(!showEduForm)} className="text-sm text-blue-600 hover:text-blue-700">
            + Add
          </button>
        </div>

        {showEduForm && (
          <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-3 animate-slide-up">
            <input className="input-field w-full" placeholder="School" value={eduSchool} onChange={(e) => setEduSchool(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder="Degree" value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} />
              <input className="input-field" placeholder="Year" value={eduYear} onChange={(e) => setEduYear(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={addEducation} className="btn-primary text-xs">Add</button>
              <button onClick={() => setShowEduForm(false)} className="text-xs text-gray-500">Cancel</button>
            </div>
          </div>
        )}

        {education.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No education added yet</p>
        ) : (
          <div className="space-y-2">
            {education.map((edu, idx) => (
              <div key={edu.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div>
                  <p className="font-medium text-sm">{edu.degree}</p>
                  <p className="text-xs text-gray-500">{edu.school} · {edu.year}</p>
                </div>
                <button
                  onClick={() => setEducation((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="card p-5">
        <h4 className="font-semibold mb-3">Skills</h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {skills.map((skill, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
              {skill}
              <button
                onClick={() => setSkills((prev) => prev.filter((_, i) => i !== idx))}
                className="ml-1 text-blue-400 hover:text-red-500"
              >×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="Add a skill..."
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
          />
          <button onClick={addSkill} className="btn-teal text-sm">Add</button>
        </div>
      </div>
    </div>
  );
}

// ─── Skills View ─────────────────────────────────────────────────
function SkillsView({ resume }: { resume: Resume | null }) {
  const [wantToLearn, setWantToLearn] = useState<string[]>([]);
  const [learnInput, setLearnInput] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const skills = resume?.skills || [];

  return (
    <div className="space-y-6">
      {/* Current Skills */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4">My Skills</h3>
        {skills.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-gray-500">Add skills in your resume to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {skills.map((skill) => (
              <div key={skill} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {skill.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{skill}</p>
                    <p className="text-xs text-gray-500">0 endorsements</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatings((prev) => ({ ...prev, [skill]: star }))}
                      className={cn(
                        'w-6 h-6 text-sm transition-colors',
                        (ratings[skill] || 0) >= star ? 'text-yellow-400' : 'text-gray-300'
                      )}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills I Want to Learn */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4">Skills I Want to Learn</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {wantToLearn.map((skill, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm">
              {skill}
              <button onClick={() => setWantToLearn((prev) => prev.filter((_, i) => i !== idx))} className="ml-1 text-emerald-400 hover:text-red-500">×</button>
            </span>
          ))}
          {wantToLearn.length === 0 && (
            <p className="text-sm text-gray-500">Add skills you want to develop</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="What do you want to learn?"
            value={learnInput}
            onChange={(e) => setLearnInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && learnInput.trim()) {
                setWantToLearn((prev) => [...prev, learnInput.trim()]);
                setLearnInput('');
              }
            }}
          />
          <button
            onClick={() => {
              if (learnInput.trim()) {
                setWantToLearn((prev) => [...prev, learnInput.trim()]);
                setLearnInput('');
              }
            }}
            className="btn-teal text-sm"
          >
            Add
          </button>
        </div>
        {wantToLearn.length > 0 && (
          <p className="text-xs text-gray-500 mt-3">
            💡 Check MiLearn for courses matching: {wantToLearn.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Jobs View ───────────────────────────────────────────────────
function JobsView({
  jobs,
  applications,
  userId,
  onApply,
}: {
  jobs: Job[];
  applications: JobApplication[];
  userId: string;
  onApply: (jobId: string, message: string) => void;
}) {
  const [filter, setFilter] = useState('all');
  const [showApps, setShowApps] = useState(false);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState('');

  const appliedJobIds = new Set(applications.map((a) => a.job_id));
  const filtered = filter === 'all' ? jobs : jobs.filter((j) => j.category === filter);

  const handleApply = (jobId: string) => {
    onApply(jobId, applyMessage);
    setApplyMessage('');
    setApplyingTo(null);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', filter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100')}
          >All</button>
          {JOB_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors', filter === cat ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100')}
            >{cat}</button>
          ))}
        </div>
        <button onClick={() => setShowApps(!showApps)} className={cn('text-sm font-medium', showApps ? 'text-blue-600' : 'text-gray-500')}>
          My Applications ({applications.length})
        </button>
      </div>

      {/* My Applications */}
      {showApps && (
        <div className="space-y-2 animate-slide-up">
          <h4 className="text-sm font-semibold text-gray-500">Your Applications</h4>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No applications yet</p>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{app.job?.title || 'Job'}</p>
                  <p className="text-xs text-gray-500">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium',
                  app.status === 'pending' && 'bg-yellow-100 text-yellow-700',
                  app.status === 'accepted' && 'bg-green-100 text-green-700',
                  app.status === 'rejected' && 'bg-red-100 text-red-700',
                  app.status === 'interview' && 'bg-blue-100 text-blue-700',
                )}>
                  {app.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Job Listings */}
      {!showApps && (
        <>
          {filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">No open positions</h3>
              <p className="text-gray-500">Check back soon for new opportunities</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((job) => {
                const applied = appliedJobIds.has(job.id);
                return (
                  <div key={job.id} className="card p-5 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{job.title}</h4>
                        <p className="text-xs text-gray-500">{job.poster?.display_name || 'Anonymous'} · {job.location || 'Remote'}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">
                        ${job.pay_mly} {job.pay_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{job.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 capitalize">{job.category}</span>
                      {applied ? (
                        <span className="text-xs text-green-600 font-medium">✓ Applied</span>
                      ) : applyingTo === job.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            className="input-field text-xs py-1 px-2 w-32"
                            placeholder="Short message..."
                            value={applyMessage}
                            onChange={(e) => setApplyMessage(e.target.value)}
                          />
                          <button onClick={() => handleApply(job.id)} className="btn-primary text-xs py-1">Send</button>
                        </div>
                      ) : (
                        <button onClick={() => setApplyingTo(job.id)} className="btn-teal text-xs">Quick Apply</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Prep View ───────────────────────────────────────────────────
function PrepView() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const renderQuestions = (
    title: string,
    icon: string,
    questions: { q: string; tip: string }[],
    prefix: string
  ) => (
    <div className="card p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <div className="space-y-2">
        {questions.map((item, idx) => {
          const id = `${prefix}-${idx}`;
          const isOpen = expanded === id;
          return (
            <div key={id} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => toggle(id)}
                className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-sm font-medium pr-4">{item.q}</span>
                <span className={cn('text-gray-400 transition-transform', isOpen && 'rotate-180')}>▾</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 animate-slide-up">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>STAR Tip:</strong> {item.tip}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="card p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-none">
        <h3 className="font-semibold mb-2">Interview Preparation</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Practice answering common questions using the STAR method (Situation, Task, Action, Result).
        </p>
        <button className="btn-teal text-sm mt-3">Practice with Mi →</button>
      </div>

      {renderQuestions('Behavioral Questions', '🗣', BEHAVIORAL_QUESTIONS, 'behavioral')}
      {renderQuestions('Technical Questions', '💻', TECHNICAL_QUESTIONS, 'technical')}
      {renderQuestions('Situational Questions', '🎭', SITUATIONAL_QUESTIONS, 'situational')}

      {/* Tips */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4">📋 Interview Tips</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: 'Research the Company', desc: 'Know their mission, products, and recent news' },
            { title: 'Prepare Questions', desc: 'Ask thoughtful questions about role and culture' },
            { title: 'Practice Out Loud', desc: 'Rehearse answers to hear how they sound' },
            { title: 'Follow Up', desc: 'Send a thank-you note within 24 hours' },
          ].map((tip) => (
            <div key={tip.title} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="font-medium text-sm">{tip.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
