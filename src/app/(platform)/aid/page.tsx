'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type AidTab = 'requests' | 'ask' | 'helping';

interface AidRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  requester_id: string;
  helper_id: string | null;
  location: string | null;
  anonymous: boolean;
  created_at: string;
  profiles?: { display_name: string };
}

const categoryIcons: Record<string, string> = { food: '🍽️', transport: '🚗', childcare: '👶', repair: '🔧', financial: '💸', companionship: '🤝', other: '💫' };
const urgencyColors: Record<string, string> = { low: 'bg-gray-100 text-gray-600', normal: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };

export default function AidPage() {
  const [tab, setTab] = useState<AidTab>('requests');
  const [requests, setRequests] = useState<AidRequest[]>([]);
  const [myHelping, setMyHelping] = useState<AidRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('other');
  const [urgency, setUrgency] = useState('normal');
  const [location, setLocation] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('aid_requests')
        .select('*, profiles!aid_requests_requester_id_fkey(display_name)')
        .eq('status', 'open')
        .order('urgency', { ascending: false })
        .order('created_at', { ascending: false });
      if (data) setRequests(data);

      if (user) {
        const { data: helping } = await supabase
          .from('aid_requests')
          .select('*, profiles!aid_requests_requester_id_fkey(display_name)')
          .eq('helper_id', user.id)
          .in('status', ['matched', 'fulfilled']);
        if (helping) setMyHelping(helping);
      }
      setLoading(false);
    };
    load();
  }, [user, supabase, submitting]);

  const handleHelp = async (requestId: string) => {
    if (!user) return;
    await supabase.from('aid_requests').update({ helper_id: user.id, status: 'matched' }).eq('id', requestId);
    await supabase.from('mly_transactions').insert({ to_id: user.id, amount: 15, type: 'earn', description: 'Offered mutual aid' });
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    await supabase.from('aid_requests').insert({
      requester_id: user.id, title: title.trim(), description: desc.trim(),
      category, urgency, location: location.trim() || null, anonymous,
    });
    setTitle(''); setDesc(''); setLocation(''); setSubmitting(false); setTab('requests');
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Mutual Aid</h1>
        <p className="text-xs text-gray-500">Neighbors helping neighbors. Earn +15 $MLY per assist.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1" role="tablist">
        {([{ key: 'requests', label: 'Needs' }, { key: 'ask', label: '+ Ask' }, { key: 'helping', label: 'My Helps' }] as { key: AidTab; label: string }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t.label}</button>
        ))}
      </div>

      {tab === 'requests' && (
        <div className="space-y-3">
          {loading ? [1, 2, 3].map((i) => <div key={i} className="card skeleton h-20" />) : requests.length === 0 ? (
            <div className="text-center py-12"><p className="text-4xl mb-2">🤝</p><p className="text-gray-500">No open requests. Community is good!</p></div>
          ) : requests.map((r) => (
            <div key={r.id} className="card space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xl">{categoryIcons[r.category] || '💫'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{r.title}</h3>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', urgencyColors[r.urgency])}>{r.urgency}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.description}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {r.anonymous ? 'Anonymous' : (r.profiles as any)?.display_name}
                    {r.location && ` · 📍 ${r.location}`}
                  </p>
                </div>
              </div>
              {r.requester_id !== user?.id && (
                <button onClick={() => handleHelp(r.id)} className="btn-teal w-full text-sm !py-2">I Can Help (+15 MLY)</button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'ask' && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <h2 className="font-medium text-harbor-800 dark:text-white">Request Help</h2>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field !py-2 text-sm" placeholder="What do you need?" required />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="input-field !py-2 text-sm resize-none h-16" placeholder="More details..." />
          <div className="grid grid-cols-2 gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field !py-2 text-sm">
              <option value="food">Food</option><option value="transport">Transport</option><option value="childcare">Childcare</option>
              <option value="repair">Repair</option><option value="financial">Financial</option><option value="companionship">Companionship</option><option value="other">Other</option>
            </select>
            <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="input-field !py-2 text-sm">
              <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </div>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="input-field !py-2 text-sm" placeholder="Location (optional)" />
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="rounded accent-teal-500" />
            Post anonymously
          </label>
          <button type="submit" disabled={submitting} className="btn-teal w-full disabled:opacity-50">{submitting ? 'Posting...' : 'Ask for Help'}</button>
        </form>
      )}

      {tab === 'helping' && (
        <div className="space-y-3">
          {myHelping.length === 0 ? <p className="text-center py-8 text-gray-400">You haven&apos;t helped anyone yet. Browse the Needs tab!</p> : myHelping.map((r) => (
            <div key={r.id} className="card flex items-center gap-3">
              <span className="text-xl">{categoryIcons[r.category]}</span>
              <div className="flex-1"><p className="text-sm font-medium text-harbor-800 dark:text-white">{r.title}</p><p className="text-xs text-gray-500 capitalize">{r.status}</p></div>
              <span className="text-xs text-teal-500 font-medium">+15 MLY</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
