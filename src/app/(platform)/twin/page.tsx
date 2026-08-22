'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface TwinConfig { avatar_config: any; personality: string; automation: any; active: boolean; }
interface TwinInsight { id: string; insight_type: string; title: string; data: any; generated_at: string; }
interface TwinAction { id: string; action_type: string; payload: any; status: string; executed_at: string | null; created_at: string; }

type TwinTab = 'avatar' | 'automation' | 'insights' | 'actions';

const AVATAR_STYLES = ['default', 'professional', 'casual', 'creative', 'minimal'];
const SKIN_TONES = ['light', 'medium-light', 'medium', 'medium-dark', 'dark'];
const HAIR_STYLES = ['short', 'medium', 'long', 'buzz', 'braids', 'locs', 'afro', 'bald'];
const OUTFITS = ['casual', 'professional', 'streetwear', 'athletic', 'creative'];
const PERSONALITIES = ['friendly', 'professional', 'witty', 'calm', 'energetic', 'wise'];

export default function TwinPage() {
  const [tab, setTab] = useState<TwinTab>('avatar');
  const [twin, setTwin] = useState<TwinConfig | null>(null);
  const [insights, setInsights] = useState<TwinInsight[]>([]);
  const [actions, setActions] = useState<TwinAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Avatar config
  const [style, setStyle] = useState('default');
  const [skinTone, setSkinTone] = useState('medium');
  const [hairStyle, setHairStyle] = useState('short');
  const [outfit, setOutfit] = useState('casual');
  const [personality, setPersonality] = useState('friendly');

  // Automation
  const [autoVote, setAutoVote] = useState(false);
  const [autoCheckin, setAutoCheckin] = useState(false);
  const [autoRespond, setAutoRespond] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    const supabase = createClient();
    const { data: t } = await supabase.from('digital_twins').select('*').eq('user_id', user!.id).single();
    if (t) {
      setTwin(t as any);
      const cfg = t.avatar_config as any;
      setStyle(cfg?.style || 'default'); setSkinTone(cfg?.skinTone || 'medium'); setHairStyle(cfg?.hairStyle || 'short'); setOutfit(cfg?.outfit || 'casual');
      setPersonality(t.personality);
      const auto = t.automation as any;
      setAutoVote(auto?.auto_vote_delegated || false); setAutoCheckin(auto?.auto_checkin || false); setAutoRespond(auto?.auto_respond_messages || false);
    }
    const { data: i } = await supabase.from('twin_insights').select('*').eq('user_id', user!.id).order('generated_at', { ascending: false }).limit(10);
    if (i) setInsights(i);
    const { data: a } = await supabase.from('twin_actions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20);
    if (a) setActions(a);
    setLoading(false);
  }

  async function saveTwin() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const config = { avatar_config: { style, skinTone, hairStyle, outfit }, personality, automation: { auto_vote_delegated: autoVote, auto_checkin: autoCheckin, auto_respond_messages: autoRespond }, active: true };
    await supabase.from('digital_twins').upsert({ user_id: user.id, ...config }, { onConflict: 'user_id' });
    setTwin(config as any);
    setSaving(false);
  }

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 bg-gray-200 dark:bg-harbor-800 rounded w-32" /><div className="h-64 bg-gray-200 dark:bg-harbor-800 rounded-xl" /></div>;

  return (
    <div className="space-y-4 animate-slide-up">
      <div><h1 className="text-xl font-bold text-harbor-800 dark:text-white">🪞 MiTwin</h1><p className="text-xs text-gray-500">Your digital twin — avatar, AI personality, and automation.</p></div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['avatar', 'automation', 'insights', 'actions'] as TwinTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Avatar */}
      {tab === 'avatar' && (
        <div className="space-y-4">
          {/* Avatar preview */}
          <div className="card flex flex-col items-center py-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 via-harbor-600 to-purple-500 flex items-center justify-center text-4xl text-white shadow-xl">{user?.display_name?.charAt(0) || '?'}</div>
            <p className="text-sm font-bold text-harbor-800 dark:text-white mt-3">{user?.display_name}&apos;s Twin</p>
            <p className="text-xs text-gray-500 capitalize">{personality} · {style}</p>
          </div>
          {/* Config */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Customize Avatar</h3>
            <div><label className="text-xs text-gray-500 block mb-1">Style</label><div className="flex gap-1 flex-wrap">{AVATAR_STYLES.map(s => <button key={s} onClick={() => setStyle(s)} className={cn('px-2 py-1 rounded text-xs capitalize', style === s ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{s}</button>)}</div></div>
            <div><label className="text-xs text-gray-500 block mb-1">Skin Tone</label><div className="flex gap-1">{SKIN_TONES.map(s => <button key={s} onClick={() => setSkinTone(s)} className={cn('px-2 py-1 rounded text-xs capitalize', skinTone === s ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{s}</button>)}</div></div>
            <div><label className="text-xs text-gray-500 block mb-1">Hair</label><div className="flex gap-1 flex-wrap">{HAIR_STYLES.map(s => <button key={s} onClick={() => setHairStyle(s)} className={cn('px-2 py-1 rounded text-xs capitalize', hairStyle === s ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{s}</button>)}</div></div>
            <div><label className="text-xs text-gray-500 block mb-1">Outfit</label><div className="flex gap-1">{OUTFITS.map(s => <button key={s} onClick={() => setOutfit(s)} className={cn('px-2 py-1 rounded text-xs capitalize', outfit === s ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{s}</button>)}</div></div>
            <div><label className="text-xs text-gray-500 block mb-1">Personality</label><div className="flex gap-1 flex-wrap">{PERSONALITIES.map(p => <button key={p} onClick={() => setPersonality(p)} className={cn('px-2 py-1 rounded text-xs capitalize', personality === p ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{p}</button>)}</div></div>
            <button onClick={saveTwin} disabled={saving} className="btn-teal w-full">{saving ? 'Saving...' : 'Save Twin'}</button>
          </div>
        </div>
      )}

      {/* Automation */}
      {tab === 'automation' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Twin Automation</h3>
          <p className="text-xs text-gray-500">Your twin can act on your behalf. You can always override.</p>
          {[
            { key: 'vote', label: 'Auto-vote on delegated proposals', desc: 'Twin votes according to your stated preferences', value: autoVote, set: setAutoVote },
            { key: 'checkin', label: 'Auto health check-in', desc: 'Twin checks in daily based on your patterns', value: autoCheckin, set: setAutoCheckin },
            { key: 'respond', label: 'Auto-respond to messages', desc: 'Twin sends a "busy" response when you\'re inactive', value: autoRespond, set: setAutoRespond },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
              <div><p className="text-sm text-harbor-800 dark:text-white">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
              <button onClick={() => item.set(!item.value)} className={cn('w-10 h-6 rounded-full transition-colors relative', item.value ? 'bg-teal-500' : 'bg-gray-300 dark:bg-harbor-700')}>
                <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', item.value ? 'translate-x-4.5 left-0.5' : 'left-0.5')} />
              </button>
            </div>
          ))}
          <button onClick={saveTwin} disabled={saving} className="btn-teal w-full text-sm">{saving ? 'Saving...' : 'Save Settings'}</button>
        </div>
      )}

      {/* Insights */}
      {tab === 'insights' && (
        <div className="space-y-3">
          {insights.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">Your twin is still learning your patterns.</p><p className="text-xs text-gray-400 mt-1">Insights appear after a week of activity.</p></div> :
          insights.map(i => (
            <div key={i.id} className="card">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{i.insight_type === 'spending' ? '💰' : i.insight_type === 'health' ? '❤️' : i.insight_type === 'social' ? '👥' : i.insight_type === 'civic' ? '🏛️' : '📈'}</span>
                <span className="text-xs text-gray-400 capitalize">{i.insight_type}</span>
              </div>
              <p className="text-sm text-harbor-800 dark:text-white">{i.title}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(i.generated_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {tab === 'actions' && (
        <div className="space-y-2">
          {actions.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">No twin actions yet.</p></div> :
          actions.map(a => (
            <div key={a.id} className="card flex items-center gap-3 !py-2">
              <span className={cn('w-2 h-2 rounded-full', a.status === 'executed' ? 'bg-green-500' : a.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500')} />
              <div className="flex-1"><p className="text-xs text-harbor-800 dark:text-white capitalize">{a.action_type.replace(/_/g, ' ')}</p><p className="text-xs text-gray-400">{a.status} · {new Date(a.created_at).toLocaleString()}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
