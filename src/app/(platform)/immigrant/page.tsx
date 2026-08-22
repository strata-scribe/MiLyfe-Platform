'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Attorney { id: string; name: string; firm: string; specialties: string[]; languages: string[]; pro_bono: boolean; location: string; contact: string; }
interface ESLClass { id: string; name: string; provider: string; level: string; schedule: string; location: string; format: 'in-person' | 'virtual' | 'hybrid'; free: boolean; }
interface Employer { id: string; company: string; industry: string; hires_regardless: boolean; work_auth_required: boolean; location: string; languages_spoken: string[]; }
interface Organization { id: string; name: string; community: string; services: string[]; location: string; contact: string; languages: string[]; }

type ImmigrantTab = 'home' | 'legal' | 'language' | 'work' | 'community';

const LANGUAGES = ['English', 'Español', 'Kreyòl Ayisyen', 'العربية', 'Português', 'Français'];
const WELCOME_MESSAGES: Record<string, string> = {
  'English': 'Welcome. You belong here.',
  'Español': 'Bienvenido. Perteneces aquí.',
  'Kreyòl Ayisyen': 'Byenveni. Ou fè pati isit la.',
  'العربية': 'مرحبا. أنت تنتمي هنا.',
  'Português': 'Bem-vindo. Você pertence aqui.',
  'Français': 'Bienvenue. Vous appartenez ici.',
};

export default function ImmigrantPage() {
  const [tab, setTab] = useState<ImmigrantTab>('home');
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [classes, setClasses] = useState<ESLClass[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState('English');
  const [classFilter, setClassFilter] = useState('All');

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: att } = await supabase.from('pop_immigrant_attorneys').select('*').order('pro_bono', { ascending: false });
    if (att) setAttorneys(att);
    const { data: cls } = await supabase.from('pop_immigrant_classes').select('*').order('level');
    if (cls) setClasses(cls);
    const { data: emp } = await supabase.from('pop_immigrant_employers').select('*');
    if (emp) setEmployers(emp);
    const { data: org } = await supabase.from('pop_immigrant_orgs').select('*');
    if (org) setOrgs(org);
    setLoading(false);
  }

  async function requestConsultation(attorneyId: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('pop_immigrant_consultations').insert({ user_id: user.id, attorney_id: attorneyId, status: 'requested' });
    toast.success('Consultation request sent. An attorney will reach out.');
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Immigrant &amp; Refugee Services</h1>
        <p className="text-xs text-gray-500">{WELCOME_MESSAGES[selectedLang]}</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {LANGUAGES.map(lang => (
          <button key={lang} onClick={() => setSelectedLang(lang)} className={cn('px-2 py-1 rounded-full text-[10px] whitespace-nowrap', selectedLang === lang ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{lang}</button>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['home', 'legal', 'language', 'work', 'community'] as ImmigrantTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {tab === 'home' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">🌍 {WELCOME_MESSAGES[selectedLang]}</p>
            <p className="text-xs text-teal-600 dark:text-teal-300 mt-1 leading-relaxed">Regardless of your status, you have rights and you deserve support. This space connects you with legal help, language resources, employment, and your community.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '⚖️', label: 'Legal Help', action: () => setTab('legal') },
              { icon: '🗣️', label: 'Learn English', action: () => setTab('language') },
              { icon: '💼', label: 'Find Work', action: () => setTab('work') },
              { icon: '🌐', label: 'My Community', action: () => setTab('community') },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="card p-3 text-center hover:shadow-md transition-shadow">
                <p className="text-2xl">{item.icon}</p>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">{item.label}</p>
              </button>
            ))}
          </div>
          <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <p className="text-xs font-bold text-red-700 dark:text-red-400">🛡️ Know Your Rights During ICE Encounters</p>
            <ul className="mt-1 space-y-1 text-[11px] text-red-600 dark:text-red-300">
              <li>• You have the right to remain silent</li>
              <li>• You do NOT have to open your door without a judicial warrant</li>
              <li>• You have the right to speak with an attorney</li>
              <li>• Do not sign anything you don&apos;t understand</li>
            </ul>
          </div>
        </div>
      )}

      {tab === 'legal' && (
        <div className="space-y-3">
          <div className="card bg-harbor-50 dark:bg-harbor-900/50">
            <p className="text-xs text-harbor-600 dark:text-harbor-300 font-medium">Immigration Legal Resources</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['DACA Renewal', 'Asylum Process', 'Work Permits', 'Family Petitions', 'Naturalization', 'TPS Info'].map(topic => (
                <button key={topic} className="text-[10px] px-2 py-1.5 bg-white dark:bg-harbor-800 rounded-lg text-harbor-700 dark:text-harbor-300 hover:shadow-sm transition-shadow">{topic}</button>
              ))}
            </div>
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-24" />) :
            attorneys.map(att => (
              <div key={att.id} className="card flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-sm font-bold text-harbor-600">{att.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{att.name}</p>
                    {att.pro_bono && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Pro Bono</span>}
                  </div>
                  <p className="text-xs text-gray-500">{att.firm}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {att.languages.map(l => (
                      <span key={l} className="text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded">{l}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {att.specialties.slice(0, 3).map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => requestConsultation(att.id)} className="btn-teal text-xs">Consult</button>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'language' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['All', 'Beginner', 'Intermediate', 'Advanced'].map(f => (
              <button key={f} onClick={() => setClassFilter(f)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', classFilter === f ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{f}</button>
            ))}
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            classes.filter(c => classFilter === 'All' || c.level === classFilter).map(cls => (
              <div key={cls.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{cls.name}</p>
                  {cls.free && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Free</span>}
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded', cls.format === 'virtual' ? 'bg-blue-100 text-blue-700' : cls.format === 'hybrid' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700')}>{cls.format}</span>
                </div>
                <p className="text-xs text-gray-500">{cls.provider} • Level: {cls.level}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>📅 {cls.schedule}</span>
                  <span>📍 {cls.location}</span>
                </div>
              </div>
            ))
          }
          <div className="card">
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Language Exchange</p>
            <p className="text-xs text-gray-500 mt-1">Find a partner to practice with. You teach your language, they teach theirs.</p>
            <button onClick={() => toast.success('Language exchange: Post in the forum with tag #language-exchange to find partners')} className="btn-teal text-xs mt-2 w-full">Find a Partner</button>
          </div>
        </div>
      )}

      {tab === 'work' && (
        <div className="space-y-3">
          <div className="card bg-harbor-50 dark:bg-harbor-900/50">
            <p className="text-xs text-harbor-600 dark:text-harbor-300">Work authorization information and employers committed to inclusive hiring. Your skills matter regardless of where you&apos;re from.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['Work Authorization Types', 'ITIN Application', 'Skills Recognition', 'Credential Evaluation'].map(topic => (
              <button key={topic} className="card p-2 text-center text-[10px] font-medium text-harbor-700 dark:text-harbor-300 hover:shadow-md transition-shadow">{topic}</button>
            ))}
          </div>
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-20" />) :
            employers.map(emp => (
              <div key={emp.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{emp.company}</p>
                  {emp.hires_regardless && <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">🌍 Inclusive Hiring</span>}
                </div>
                <p className="text-xs text-gray-500">{emp.industry} • {emp.location}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {emp.languages_spoken.map(l => (
                    <span key={l} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded">{l}</span>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'community' && (
        <div className="space-y-3">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            orgs.map(org => (
              <div key={org.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{org.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-mly-100 text-mly-700 rounded">{org.community}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {org.services.map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded">{s}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>📍 {org.location}</span>
                  <span>🗣️ {org.languages.join(', ')}</span>
                </div>
              </div>
            ))
          }
          <div className="card">
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Newcomer Orientation</p>
            <p className="text-xs text-gray-500 mt-1">New to the area? Our community orientation helps you understand local services, transportation, schools, and connects you with others from your home country.</p>
            <button onClick={() => toast.success('Contact your nearest community center to schedule an orientation')} className="btn-teal text-xs mt-2 w-full">Schedule Orientation</button>
          </div>
        </div>
      )}
    </div>
  );
}
