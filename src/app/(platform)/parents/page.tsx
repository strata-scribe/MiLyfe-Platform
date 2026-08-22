'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Childcare { id: string; name: string; type: 'daycare' | 'after-school' | 'babysitter-exchange'; cost: string; location: string; ages: string; hours: string; subsidized: boolean; }
interface SupportGroup { id: string; name: string; type: string; schedule: string; format: 'in-person' | 'virtual'; description: string; members_count: number; }
interface Resource { id: string; title: string; category: string; description: string; eligibility: string; contact: string; link: string; }
interface DailyWin { id: string; user_id: string; date: string; win: string; }

type ParentTab = 'home' | 'childcare' | 'support' | 'resources' | 'emergency';

const RESOURCE_CATEGORIES = ['SNAP/WIC', 'Housing', 'Legal Aid', 'Education', 'Healthcare', 'Financial'];
const SCHEDULE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ParentsPage() {
  const [tab, setTab] = useState<ParentTab>('home');
  const [childcare, setChildcare] = useState<Childcare[]>([]);
  const [groups, setGroups] = useState<SupportGroup[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [wins, setWins] = useState<DailyWin[]>([]);
  const [loading, setLoading] = useState(true);
  const [childcareFilter, setChildcareFilter] = useState('All');
  const [resourceFilter, setResourceFilter] = useState('All');
  const [winInput, setWinInput] = useState('');
  const [scheduleView, setScheduleView] = useState<string>(SCHEDULE_DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: cc } = await supabase.from('pop_parents_childcare').select('*').order('subsidized', { ascending: false });
    if (cc) setChildcare(cc);
    const { data: sg } = await supabase.from('pop_parents_groups').select('*').order('members_count', { ascending: false });
    if (sg) setGroups(sg);
    const { data: res } = await supabase.from('pop_parents_resources').select('*').order('category');
    if (res) setResources(res);
    if (user) {
      const { data: w } = await supabase.from('pop_parents_wins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(14);
      if (w) setWins(w);
    }
    setLoading(false);
  }

  async function saveDailyWin() {
    if (!user || !winInput.trim()) return;
    const supabase = createClient();
    await supabase.from('pop_parents_wins').insert({ user_id: user.id, date: new Date().toISOString().split('T')[0], win: winInput });
    toast.success('Win logged! You\u2019re doing amazing. 🌟');
    setWinInput('');
    loadData();
  }

  async function joinGroup(groupId: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('pop_parents_group_members').insert({ user_id: user.id, group_id: groupId });
    toast.success('Welcome to the group!');
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Single Parent Support</h1>
        <p className="text-xs text-gray-500">You&apos;re doing more than enough. Let us help.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['home', 'childcare', 'support', 'resources', 'emergency'] as ParentTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {tab === 'home' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">💛 You are enough.</p>
            <p className="text-xs text-teal-600 dark:text-teal-300 mt-1 leading-relaxed">Being a single parent takes extraordinary strength. This space is built to lighten your load — from childcare to co-parenting tools to just reminding you that you&apos;re doing great.</p>
          </div>
          <div className="card">
            <p className="text-sm font-medium text-harbor-800 dark:text-white mb-2">Today&apos;s Win 🌟</p>
            <p className="text-xs text-gray-500 mb-2">Big or small, name something that went right today.</p>
            <div className="flex gap-2">
              <input value={winInput} onChange={e => setWinInput(e.target.value)} className="input-field flex-1" placeholder="I made it to school drop-off on time..." />
              <button onClick={saveDailyWin} className="btn-teal text-xs">Save</button>
            </div>
            {wins.length > 0 && (
              <div className="mt-3 space-y-1">
                {wins.slice(0, 3).map(w => (
                  <div key={w.id} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="text-teal-500">✓</span>
                    <span className="flex-1 truncate">{w.win}</span>
                    <span className="text-[10px] text-gray-400">{w.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <p className="text-sm font-medium text-harbor-800 dark:text-white mb-2">Schedule — {scheduleView}</p>
            <div className="flex gap-1 mb-3">
              {SCHEDULE_DAYS.map(day => (
                <button key={day} onClick={() => setScheduleView(day)} className={cn('flex-1 py-1 rounded text-[10px] font-medium', scheduleView === day ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-500')}>{day}</button>
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300"><span className="w-12 text-[10px] text-gray-400">7:00</span><span>School drop-off</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300"><span className="w-12 text-[10px] text-gray-400">3:30</span><span>After-school pickup</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300"><span className="w-12 text-[10px] text-gray-400">6:00</span><span>Dinner & homework</span></div>
            </div>
            <button onClick={() => toast.info('Full calendar coming soon')} className="text-xs text-teal-600 mt-2">+ Add to schedule</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '👶', label: 'Find Childcare', action: () => setTab('childcare') },
              { icon: '👥', label: 'Parent Groups', action: () => setTab('support') },
              { icon: '📋', label: 'Benefits Help', action: () => setTab('resources') },
              { icon: '🆘', label: 'Emergency', action: () => setTab('emergency') },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="card p-3 text-center hover:shadow-md transition-shadow">
                <p className="text-2xl">{item.icon}</p>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'childcare' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['All', 'Daycare', 'After-School', 'Babysitter Exchange'].map(f => (
              <button key={f} onClick={() => setChildcareFilter(f)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', childcareFilter === f ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{f}</button>
            ))}
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            childcare.filter(c => childcareFilter === 'All' || c.type === childcareFilter.toLowerCase().replace(' ', '-')).map(cc => (
              <div key={cc.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{cc.name}</p>
                  {cc.subsidized && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Subsidized</span>}
                  <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded capitalize">{cc.type.replace('-', ' ')}</span>
                </div>
                <p className="text-xs text-gray-500">Ages: {cc.ages} • {cc.hours}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>📍 {cc.location}</span>
                  <span>💰 {cc.cost}</span>
                </div>
              </div>
            ))
          }
          <div className="card bg-mly-50 dark:bg-mly-900/10 border border-mly-200 dark:border-mly-800">
            <p className="text-sm font-medium text-mly-700 dark:text-mly-400">🤝 Babysitter Exchange</p>
            <p className="text-xs text-mly-600 dark:text-mly-300 mt-1">Trade watching hours with other parents. You watch theirs, they watch yours. No money needed.</p>
            <button onClick={() => toast.info('Exchange matching coming soon')} className="btn-teal text-xs mt-2 w-full">Join the Exchange</button>
          </div>
        </div>
      )}

      {tab === 'support' && (
        <div className="space-y-3">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            groups.map(group => (
              <div key={group.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{group.name}</p>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded', group.format === 'virtual' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700')}>{group.format}</span>
                </div>
                <p className="text-xs text-gray-500">{group.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>📅 {group.schedule}</span>
                  <span>👥 {group.members_count} members</span>
                </div>
                <button onClick={() => joinGroup(group.id)} className="btn-teal text-xs mt-1">Join Group</button>
              </div>
            ))
          }
          <div className="card">
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Co-Parenting Tools</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['Custody Calendar', 'Expense Splitting', 'Communication Log', 'Mediation Request'].map(tool => (
                <button key={tool} onClick={() => toast.info(`${tool} coming soon`)} className="text-[10px] px-2 py-2 bg-gray-50 dark:bg-harbor-800 rounded-lg text-harbor-700 dark:text-harbor-300 hover:shadow-sm transition-shadow">{tool}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'resources' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['All', ...RESOURCE_CATEGORIES].map(f => (
              <button key={f} onClick={() => setResourceFilter(f)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', resourceFilter === f ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{f}</button>
            ))}
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            resources.filter(r => resourceFilter === 'All' || r.category === resourceFilter).map(res => (
              <div key={res.id} className="card space-y-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{res.title}</p>
                <p className="text-xs text-gray-500">{res.description}</p>
                <p className="text-[10px] text-teal-600">Eligibility: {res.eligibility}</p>
                {res.contact && <p className="text-[10px] text-gray-400">📞 {res.contact}</p>}
              </div>
            ))
          }
        </div>
      )}

      {tab === 'emergency' && (
        <div className="space-y-3">
          <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400">🆘 Emergency Support</h3>
            <p className="text-xs text-red-600 mt-1">You and your children deserve safety. Help is available now.</p>
          </div>
          {[
            { label: 'National DV Hotline', number: '1-800-799-7233', desc: 'Domestic violence help, safety planning' },
            { label: 'Childhelp National Hotline', number: '1-800-422-4453', desc: 'Child abuse prevention and support' },
            { label: 'Emergency Childcare', number: '211', desc: 'Immediate childcare assistance' },
            { label: 'Food Assistance (SNAP)', number: '1-800-221-5689', desc: 'Emergency food benefits' },
            { label: 'Crisis Text Line', number: 'Text HOME to 741741', desc: 'Free crisis support via text' },
          ].map(item => (
            <div key={item.label} className="card flex items-center gap-3">
              <span className="text-xl">📞</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <a href={`tel:${item.number.replace(/\D/g, '')}`} className="text-xs font-bold text-teal-600">{item.number}</a>
            </div>
          ))}
          <div className="card bg-harbor-50 dark:bg-harbor-900/50">
            <p className="text-xs text-harbor-600 dark:text-harbor-300 text-center">Your strength as a parent is remarkable. Asking for help is part of that strength.</p>
          </div>
        </div>
      )}
    </div>
  );
}
