'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

type CareerTab = 'resume' | 'skills' | 'prep';

interface ExperienceEntry {
  title: string;
  company: string;
  dates: string;
  description: string;
}

interface EducationEntry {
  school: string;
  degree: string;
  year: string;
}

interface Resume {
  id: string;
  user_id: string;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  created_at: string;
  updated_at: string;
}

interface PrepQuestion {
  category: string;
  question: string;
  example: string;
}

const prepQuestions: PrepQuestion[] = [
  { category: 'behavioral', question: 'Tell me about a time you handled a conflict at work.', example: 'I had a disagreement with a coworker about a project approach. I scheduled a one-on-one conversation, listened to their perspective, shared mine, and we found a middle ground that incorporated both ideas. The project ended up stronger because of it.' },
  { category: 'behavioral', question: 'Describe a situation where you showed leadership.', example: 'When our team lead was out, I stepped up to coordinate our daily standups and unblock teammates. I prioritized communication and made sure everyone knew what they were working toward. The sprint was completed on time.' },
  { category: 'behavioral', question: 'Tell me about a time you failed and what you learned.', example: 'I missed a deadline on a report because I underestimated the research needed. I learned to break tasks into smaller pieces, set intermediate deadlines, and ask for help earlier. Since then I haven\'t missed a deadline.' },
  { category: 'behavioral', question: 'How do you handle pressure or tight deadlines?', example: 'I prioritize ruthlessly — what absolutely must happen vs. what\'s nice to have. I communicate early if timelines are at risk and focus on delivering the highest-impact work first. Staying organized keeps me calm under pressure.' },
  { category: 'technical', question: 'Walk me through your approach to solving a complex problem.', example: 'I break it down: understand the problem fully, research similar solutions, plan my approach on paper, implement in small testable steps, and validate at each stage. I\'m not afraid to step back and try a different approach if something isn\'t working.' },
  { category: 'technical', question: 'How do you stay current with industry trends?', example: 'I follow industry newsletters, participate in online communities, take courses quarterly, and attend local meetups. I also maintain a learning journal where I note new concepts and try to apply at least one new technique per project.' },
  { category: 'technical', question: 'Describe your experience with [relevant technology/tool].', example: 'I\'ve used [tool] for [X months/years] in both personal projects and professional settings. I\'m comfortable with [specific features] and have used it to [specific accomplishment]. I enjoy diving into documentation to learn advanced features.' },
  { category: 'situational', question: 'What would you do if you disagreed with your manager?', example: 'I\'d first try to understand their perspective by asking clarifying questions. If I still disagreed, I\'d present my view with data or examples in a private conversation. Ultimately, I respect the chain of command but believe in advocating for what I think is right.' },
  { category: 'situational', question: 'How would you handle a project with unclear requirements?', example: 'I\'d schedule a meeting with stakeholders to ask targeted questions. I\'d create a simple document outlining my understanding and share it for confirmation. Starting with a small prototype can also help clarify what everyone actually needs.' },
  { category: 'situational', question: 'What would you do if a team member wasn\'t pulling their weight?', example: 'I\'d have a private, non-confrontational conversation to check if they\'re struggling with something. Sometimes people have personal issues or feel stuck. If it continued, I\'d involve our manager while focusing on team success rather than blame.' },
  { category: 'situational', question: 'How would you prioritize if you had multiple urgent requests?', example: 'I\'d assess real impact and actual deadlines (not just perceived urgency). I\'d communicate transparently with all requesters about timelines, ask which items can wait, and focus on one thing at a time to deliver quality work.' },
];

export default function CareerPage() {
  const [tab, setTab] = useState<CareerTab>('resume');
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Resume fields
  const [summary, setSummary] = useState('');
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  // Add experience form
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expDates, setExpDates] = useState('');
  const [expDesc, setExpDesc] = useState('');

  // Add education form
  const [eduSchool, setEduSchool] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduYear, setEduYear] = useState('');

  // Add skill
  const [newSkill, setNewSkill] = useState('');

  // Prep
  const [expandedPrep, setExpandedPrep] = useState<number | null>(null);
  const [prepFilter, setPrepFilter] = useState<string>('all');

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setResume(data);
        setSummary(data.summary || '');
        setExperience(data.experience || []);
        setEducation(data.education || []);
        setSkills(data.skills || []);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const saveResume = async () => {
    if (!user) return;
    setSaving(true);
    setSaveMsg('');

    const payload = {
      user_id: user.id,
      summary,
      experience,
      education,
      skills,
      updated_at: new Date().toISOString(),
    };

    if (resume) {
      await supabase.from('resumes').update(payload).eq('id', resume.id);
    } else {
      const { data } = await supabase.from('resumes').insert(payload).select().single();
      if (data) setResume(data);
    }

    setSaveMsg('Saved!');
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const addExperience = (e: React.FormEvent) => {
    e.preventDefault();
    setExperience(prev => [...prev, { title: expTitle.trim(), company: expCompany.trim(), dates: expDates.trim(), description: expDesc.trim() }]);
    setExpTitle(''); setExpCompany(''); setExpDates(''); setExpDesc('');
  };

  const removeExperience = (index: number) => {
    setExperience(prev => prev.filter((_, i) => i !== index));
  };

  const addEducation = (e: React.FormEvent) => {
    e.preventDefault();
    setEducation(prev => [...prev, { school: eduSchool.trim(), degree: eduDegree.trim(), year: eduYear.trim() }]);
    setEduSchool(''); setEduDegree(''); setEduYear('');
  };

  const removeEducation = (index: number) => {
    setEducation(prev => prev.filter((_, i) => i !== index));
  };

  const addSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  const exportPdf = () => {
    alert('PDF export coming soon! For now, you can screenshot or print this page (Ctrl+P / Cmd+P).');
  };

  const filteredPrep = prepFilter === 'all' ? prepQuestions : prepQuestions.filter(q => q.category === prepFilter);

  const categoryColors: Record<string, string> = {
    behavioral: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    technical: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    situational: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  if (loading) return <div className="space-y-4 animate-slide-up">{[1,2,3].map(i => <div key={i} className="card skeleton h-24" />)}</div>;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiCareer</h1>
          <p className="text-xs text-gray-500">Build your resume, track skills, prep for interviews.</p>
        </div>
        <button onClick={exportPdf} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200">
          Export PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([
          { key: 'resume', label: '📄 Resume' },
          { key: 'skills', label: '💡 Skills' },
          { key: 'prep', label: '🎤 Prep' },
        ] as { key: CareerTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all', tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Resume */}
      {tab === 'resume' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="card space-y-3">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Professional Summary</p>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="input-field text-sm min-h-[80px]"
              placeholder="Write a brief professional summary about yourself..."
            />
          </div>

          {/* Experience */}
          <div className="card space-y-3">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Experience</p>
            {experience.map((exp, i) => (
              <div key={i} className="bg-gray-50 dark:bg-harbor-800 rounded-lg p-3 relative">
                <button onClick={() => removeExperience(i)} className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-600">✕</button>
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{exp.title}</p>
                <p className="text-xs text-teal-600 dark:text-teal-400">{exp.company}</p>
                <p className="text-[10px] text-gray-400">{exp.dates}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{exp.description}</p>
              </div>
            ))}
            <form onSubmit={addExperience} className="space-y-2 pt-2 border-t border-gray-100 dark:border-harbor-800">
              <input type="text" value={expTitle} onChange={e => setExpTitle(e.target.value)} className="input-field text-sm" placeholder="Job Title" required />
              <input type="text" value={expCompany} onChange={e => setExpCompany(e.target.value)} className="input-field text-sm" placeholder="Company" required />
              <input type="text" value={expDates} onChange={e => setExpDates(e.target.value)} className="input-field text-sm" placeholder="Dates (e.g. Jan 2022 - Present)" required />
              <textarea value={expDesc} onChange={e => setExpDesc(e.target.value)} className="input-field text-sm min-h-[50px]" placeholder="Description of responsibilities..." required />
              <button type="submit" className="text-xs text-teal-500 font-medium">+ Add Experience</button>
            </form>
          </div>

          {/* Education */}
          <div className="card space-y-3">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Education</p>
            {education.map((edu, i) => (
              <div key={i} className="bg-gray-50 dark:bg-harbor-800 rounded-lg p-3 relative">
                <button onClick={() => removeEducation(i)} className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-600">✕</button>
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{edu.school}</p>
                <p className="text-xs text-gray-500">{edu.degree} • {edu.year}</p>
              </div>
            ))}
            <form onSubmit={addEducation} className="space-y-2 pt-2 border-t border-gray-100 dark:border-harbor-800">
              <input type="text" value={eduSchool} onChange={e => setEduSchool(e.target.value)} className="input-field text-sm" placeholder="School / Institution" required />
              <input type="text" value={eduDegree} onChange={e => setEduDegree(e.target.value)} className="input-field text-sm" placeholder="Degree / Certificate" required />
              <input type="text" value={eduYear} onChange={e => setEduYear(e.target.value)} className="input-field text-sm" placeholder="Year (e.g. 2020)" required />
              <button type="submit" className="text-xs text-teal-500 font-medium">+ Add Education</button>
            </form>
          </div>

          {/* Skills in resume */}
          <div className="card space-y-3">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Skills</p>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="text-teal-400 hover:text-red-500 ml-1">×</button>
                </span>
              ))}
            </div>
            <form onSubmit={addSkill} className="flex gap-2">
              <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} className="input-field text-sm flex-1" placeholder="Add a skill..." />
              <button type="submit" className="btn-teal text-sm px-4">Add</button>
            </form>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button onClick={saveResume} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Resume'}
            </button>
            {saveMsg && <span className="text-xs text-teal-500 font-medium">{saveMsg}</span>}
          </div>
        </div>
      )}

      {/* Skills */}
      {tab === 'skills' && (
        <div className="space-y-4">
          <div className="card">
            <p className="text-sm font-bold text-harbor-800 dark:text-white mb-3">Your Skills</p>
            {skills.length === 0 ? (
              <p className="text-xs text-gray-400">No skills added yet. Go to the Resume tab to add them.</p>
            ) : (
              <div className="space-y-2">
                {skills.map(skill => (
                  <div key={skill} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      <p className="text-sm text-harbor-800 dark:text-white">{skill}</p>
                    </div>
                    <span className="text-[10px] text-gray-400">0 endorsements</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={addSkill} className="card space-y-3">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Add Skill</p>
            <div className="flex gap-2">
              <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} className="input-field text-sm flex-1" placeholder="e.g. Python, Project Management, Welding..." />
              <button type="submit" className="btn-teal text-sm px-4">Add</button>
            </div>
          </form>

          {/* Link to MiLearn */}
          <div className="card bg-harbor-50 dark:bg-harbor-900 border-harbor-200 dark:border-harbor-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Build New Skills</p>
                <p className="text-xs text-gray-500">Take MiLearn courses to develop your skills and earn MLY.</p>
              </div>
              <Link href="/learn" className="text-xs text-teal-500 font-medium">Go →</Link>
            </div>
          </div>
        </div>
      )}

      {/* Interview Prep */}
      {tab === 'prep' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {['all', 'behavioral', 'technical', 'situational'].map(cat => (
              <button
                key={cat}
                onClick={() => setPrepFilter(cat)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all capitalize', prepFilter === cat ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredPrep.map((q, i) => (
              <div key={i} className="card">
                <button onClick={() => setExpandedPrep(expandedPrep === i ? null : i)} className="w-full text-left">
                  <div className="flex items-start gap-2">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap mt-0.5', categoryColors[q.category])}>
                      {q.category}
                    </span>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white flex-1">{q.question}</p>
                    <span className="text-gray-400 text-xs ml-2">{expandedPrep === i ? '▼' : '▶'}</span>
                  </div>
                </button>
                {expandedPrep === i && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-harbor-800">
                    <p className="text-[10px] font-medium text-teal-500 uppercase mb-1">Example Answer</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{q.example}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="card bg-mly-50 dark:bg-mly-900/20 border-mly-200 dark:border-mly-800">
            <p className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Interview Tips</p>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Use the STAR method: Situation, Task, Action, Result</li>
              <li>• Research the company before your interview</li>
              <li>• Prepare 3-5 questions to ask the interviewer</li>
              <li>• Practice out loud, not just in your head</li>
              <li>• Be early. 10 minutes is professional.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
