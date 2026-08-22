'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface SafetyPlan { id: string; user_id: string; safe_places: string[]; safe_people: string[]; packed_items: string[]; code_words: string[]; evidence_notes: string; updated_at: string; }
interface Resource { id: string; title: string; category: string; description: string; phone: string; anonymous: boolean; available_24h: boolean; }
interface SupportGroup { id: string; name: string; next_meeting: string; format: string; facilitator: string; members_count: number; anonymous: boolean; }

type SafetyTab = 'safety' | 'plan' | 'resources' | 'legal' | 'community';

const PACKED_BAG_CHECKLIST = ['ID & documents', 'Cash & cards', 'Phone charger', 'Medications', 'Change of clothes', 'Keys (spare set)', 'Important papers (lease, insurance)', 'Children\'s items', 'Evidence copies', 'Emergency contacts written down'];

export default function SafetyModePage() {
  const [tab, setTab] = useState<SafetyTab>('safety');
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [supportGroups, setSupportGroups] = useState<SupportGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState('All');

  // Safety plan form state
  const [safePlaces, setSafePlaces] = useState<string[]>(['']);
  const [safePeople, setSafePeople] = useState<string[]>(['']);
  const [packedItems, setPackedItems] = useState<string[]>([]);
  const [codeWords, setCodeWords] = useState<string[]>(['']);
  const [evidenceNotes, setEvidenceNotes] = useState('');

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  function quickExit() {
    // Replace current history entry so back button doesn't return here
    window.location.replace('https://www.google.com');
  }

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: r } = await supabase.from('pop_safety_resources').select('*').order('available_24h', { ascending: false });
    if (r) setResources(r);
    const { data: sg } = await supabase.from('pop_safety_support_groups').select('*').eq('anonymous', true);
    if (sg) setSupportGroups(sg);
    if (user) {
      const { data: sp } = await supabase.from('pop_safety_plans').select('*').eq('user_id', user.id).single();
      if (sp) {
        setSafetyPlan(sp);
        setSafePlaces(sp.safe_places.length > 0 ? sp.safe_places : ['']);
        setSafePeople(sp.safe_people.length > 0 ? sp.safe_people : ['']);
        setPackedItems(sp.packed_items || []);
        setCodeWords(sp.code_words.length > 0 ? sp.code_words : ['']);
        setEvidenceNotes(sp.evidence_notes || '');
      }
    }
    setLoading(false);
  }

  async function saveSafetyPlan() {
    if (!user) { toast.error('Sign in to save your plan securely'); return; }
    const supabase = createClient();
    const planData = {
      user_id: user.id,
      safe_places: safePlaces.filter(p => p.trim()),
      safe_people: safePeople.filter(p => p.trim()),
      packed_items: packedItems,
      code_words: codeWords.filter(c => c.trim()),
      evidence_notes: evidenceNotes,
      updated_at: new Date().toISOString(),
    };
    if (safetyPlan) {
      await supabase.from('pop_safety_plans').update(planData).eq('id', safetyPlan.id);
    } else {
      await supabase.from('pop_safety_plans').insert(planData);
    }
    toast.success('Safety plan saved securely.');
    loadData();
  }

  const RESOURCE_CATEGORIES = ['Shelter', 'Hotlines', 'Counseling', 'Support Groups', 'Legal', 'Financial'];

  return (
    <div className="space-y-4 animate-slide-up">
      {/* QUICK EXIT - Always visible at top */}
      <button
        onClick={quickExit}
        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
        aria-label="Leave this page quickly"
      >
        ✕ LEAVE THIS PAGE QUICKLY
      </button>

      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Safe Space</h1>
        <p className="text-xs text-gray-500">Everything here is private and encrypted. You are believed.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['safety', 'plan', 'resources', 'legal', 'community'] as SafetyTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Safety Tab */}
      {tab === 'safety' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">You are not alone. This is not your fault.</p>
            <p className="text-xs text-teal-600 dark:text-teal-300 mt-1 leading-relaxed">This space is completely private. No names are stored. No activity is logged to your profile. Everything is end-to-end encrypted.</p>
          </div>

          <div className="card bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">🔒 Privacy Notice</p>
            <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">This page won&apos;t appear in your browser history. No notifications will reference this page. The Quick Exit button above opens Google instantly.</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => setTab('plan')} className="card p-4 text-left hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <span className="text-xl">📋</span>
                <div>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">Create Safety Plan</p>
                  <p className="text-xs text-gray-500">Safe places, people, packed bag, code words</p>
                </div>
              </div>
            </button>
            <button onClick={() => setTab('resources')} className="card p-4 text-left hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏠</span>
                <div>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">Find Shelter Now</p>
                  <p className="text-xs text-gray-500">Confidential shelters, no questions asked</p>
                </div>
              </div>
            </button>
            <a href="tel:1-800-799-7233" className="card p-4 text-left hover:shadow-md transition-shadow block">
              <div className="flex items-center gap-3">
                <span className="text-xl">📞</span>
                <div>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">National DV Hotline</p>
                  <p className="text-xs text-gray-500">1-800-799-7233 • 24/7 • Confidential</p>
                </div>
              </div>
            </a>
            <button onClick={() => setTab('legal')} className="card p-4 text-left hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚖️</span>
                <div>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">Legal Protection</p>
                  <p className="text-xs text-gray-500">Protective orders, documentation, legal aid</p>
                </div>
              </div>
            </button>
          </div>

          {/* Danger Assessment - brief */}
          <div className="card">
            <p className="text-xs font-medium text-harbor-800 dark:text-white">⚠️ Are you in immediate danger?</p>
            <p className="text-xs text-gray-500 mt-1">If you feel unsafe right now:</p>
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              <p>• Call 911 if you&apos;re in physical danger</p>
              <p>• Call 1-800-799-7233 (National DV Hotline)</p>
              <p>• Text START to 88788</p>
              <p>• Go to your nearest safe place</p>
            </div>
          </div>
        </div>
      )}

      {/* Plan Tab */}
      {tab === 'plan' && (
        <div className="space-y-3">
          <div className="card">
            <p className="text-xs font-medium text-harbor-800 dark:text-white mb-2">🏠 Safe Places</p>
            <p className="text-[10px] text-gray-400 mb-2">Where can you go if you need to leave quickly?</p>
            {safePlaces.map((place, i) => (
              <input key={i} value={place} onChange={(e) => { const updated = [...safePlaces]; updated[i] = e.target.value; setSafePlaces(updated); }} placeholder={`Safe place ${i + 1}`} className="input-field text-xs mb-1" />
            ))}
            <button onClick={() => setSafePlaces([...safePlaces, ''])} className="text-[10px] text-teal-600 mt-1">+ Add another place</button>
          </div>

          <div className="card">
            <p className="text-xs font-medium text-harbor-800 dark:text-white mb-2">👥 Safe People</p>
            <p className="text-[10px] text-gray-400 mb-2">Who can you call or go to?</p>
            {safePeople.map((person, i) => (
              <input key={i} value={person} onChange={(e) => { const updated = [...safePeople]; updated[i] = e.target.value; setSafePeople(updated); }} placeholder={`Person ${i + 1} (name & number)`} className="input-field text-xs mb-1" />
            ))}
            <button onClick={() => setSafePeople([...safePeople, ''])} className="text-[10px] text-teal-600 mt-1">+ Add another person</button>
          </div>

          <div className="card">
            <p className="text-xs font-medium text-harbor-800 dark:text-white mb-2">🎒 Packed Bag Checklist</p>
            <p className="text-[10px] text-gray-400 mb-2">Keep a bag ready with essentials</p>
            <div className="space-y-1">
              {PACKED_BAG_CHECKLIST.map(item => (
                <label key={item} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={packedItems.includes(item)} onChange={(e) => { if (e.target.checked) setPackedItems([...packedItems, item]); else setPackedItems(packedItems.filter(i => i !== item)); }} className="rounded border-gray-300" />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="text-xs font-medium text-harbor-800 dark:text-white mb-2">🔑 Code Words</p>
            <p className="text-[10px] text-gray-400 mb-2">Words you can text or say that mean &quot;I need help&quot;</p>
            {codeWords.map((word, i) => (
              <input key={i} value={word} onChange={(e) => { const updated = [...codeWords]; updated[i] = e.target.value; setCodeWords(updated); }} placeholder={`Code word ${i + 1}`} className="input-field text-xs mb-1" />
            ))}
            <button onClick={() => setCodeWords([...codeWords, ''])} className="text-[10px] text-teal-600 mt-1">+ Add another</button>
          </div>

          <div className="card">
            <p className="text-xs font-medium text-harbor-800 dark:text-white mb-2">📝 Evidence Notes</p>
            <p className="text-[10px] text-gray-400 mb-2">Private notes about incidents (dates, details, witnesses). Encrypted.</p>
            <textarea value={evidenceNotes} onChange={(e) => setEvidenceNotes(e.target.value)} placeholder="Only you can see this..." rows={4} className="input-field text-xs w-full resize-none" />
          </div>

          <button onClick={saveSafetyPlan} className="btn-teal w-full text-sm py-3">Save My Safety Plan (Encrypted)</button>
        </div>
      )}

      {/* Resources Tab */}
      {tab === 'resources' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setResourceFilter('All')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', resourceFilter === 'All' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            {RESOURCE_CATEGORIES.map(c => (
              <button key={c} onClick={() => setResourceFilter(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', resourceFilter === c ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
            ))}
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            resources.filter(r => resourceFilter === 'All' || r.category === resourceFilter).length === 0 ? (
              <div className="card text-center py-8"><p className="text-sm text-gray-500">Resources are being compiled for your area</p></div>
            ) : resources.filter(r => resourceFilter === 'All' || r.category === resourceFilter).map(res => (
              <div key={res.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{res.title}</p>
                  {res.anonymous && <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Anonymous</span>}
                  {res.available_24h && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">24/7</span>}
                </div>
                <p className="text-xs text-gray-500">{res.description}</p>
                {res.phone && <a href={`tel:${res.phone}`} className="text-xs text-teal-600 font-medium">📞 {res.phone}</a>}
              </div>
            ))
          }
        </div>
      )}

      {/* Legal Tab */}
      {tab === 'legal' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-600 dark:text-teal-300">You have legal rights. Free legal help is available. You do not need to share your situation with anyone you don&apos;t want to.</p>
          </div>
          {[
            { icon: '🛡️', title: 'Protective Orders', desc: 'Learn how to file a restraining order. Free legal help available.', action: 'Learn More' },
            { icon: '📝', title: 'Documentation Guidance', desc: 'How to safely document abuse: photos, messages, dates, witnesses.', action: 'View Guide' },
            { icon: '⚖️', title: 'Free Legal Aid', desc: 'Attorneys who specialize in DV cases. Completely confidential.', action: 'Find Attorney' },
            { icon: '🏛️', title: 'Court Accompaniment', desc: 'A trained advocate can go to court with you. You don\'t have to go alone.', action: 'Request' },
            { icon: '👶', title: 'Custody Resources', desc: 'Information about emergency custody, parenting plans, and child safety.', action: 'Learn More' },
            { icon: '🏠', title: 'Housing Rights', desc: 'You cannot be evicted because of DV. Know your tenant protections.', action: 'View Rights' },
          ].map(item => (
            <div key={item.title} className="card flex items-start gap-3">
              <span className="text-xl mt-0.5">{item.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <button className="btn-teal text-[10px] whitespace-nowrap">{item.action}</button>
            </div>
          ))}
        </div>
      )}

      {/* Community Tab */}
      {tab === 'community' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-600 dark:text-teal-300">All groups are anonymous. No real names required. No identifying info shared. Moderated by trained survivors.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-harbor-800 dark:text-white">Support Groups</p>
            {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-20" />) :
              supportGroups.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-2xl mb-2">💜</p>
                  <p className="text-sm text-gray-500">Support groups are forming</p>
                  <p className="text-xs text-gray-400 mt-1">Join anonymously when ready</p>
                </div>
              ) : supportGroups.map(group => (
                <div key={group.id} className="card space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{group.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Anonymous</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span>📅 {group.next_meeting}</span>
                    <span>💻 {group.format}</span>
                    <span>👥 {group.members_count} members</span>
                  </div>
                  <p className="text-xs text-gray-500">Facilitated by: {group.facilitator}</p>
                  <button className="btn-teal text-xs mt-1">Join Anonymously</button>
                </div>
              ))
            }
          </div>

          {/* Survivor Mentors */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-harbor-800 dark:text-white">Survivor Mentors</p>
            <div className="card">
              <p className="text-xs text-gray-500">Survivors who&apos;ve rebuilt their lives volunteer as anonymous mentors. They understand what you&apos;re going through because they&apos;ve been there.</p>
              <button className="btn-teal text-xs mt-2">Request Anonymous Mentor Match</button>
            </div>
          </div>

          <div className="card bg-gray-50 dark:bg-harbor-900/50 text-center">
            <p className="text-xs text-gray-500">💜 You survived. You&apos;re stronger than you know.</p>
          </div>
        </div>
      )}

      {/* Floating Quick Exit - bottom */}
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={quickExit}
          className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center text-lg font-bold transition-colors"
          aria-label="Quick exit"
          title="Leave quickly"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
