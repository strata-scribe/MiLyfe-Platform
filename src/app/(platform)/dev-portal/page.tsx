'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface App { id: string; developer_id: string; name: string; description: string; icon_url: string | null; status: string; downloads: number; rating: number; created_at: string; profiles?: { display_name: string }; }
interface Bounty { id: string; title: string; description: string; reward_mly: number; category: string; status: string; posted_by: string; claimed_by: string | null; github_issue_url: string | null; created_at: string; profiles?: { display_name: string }; }

type DevTab = 'apps' | 'bounties' | 'my-apps' | 'docs';

export default function DevPortalPage() {
  const [tab, setTab] = useState<DevTab>('apps');
  const [apps, setApps] = useState<App[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  // Create bounty form
  const [showBounty, setShowBounty] = useState(false);
  const [bTitle, setBTitle] = useState('');
  const [bDesc, setBDesc] = useState('');
  const [bReward, setBReward] = useState('');
  const [bCategory, setBCategory] = useState('feature');
  const [bGithub, setBGithub] = useState('');
  const [posting, setPosting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: a } = await supabase.from('developer_apps').select('*, profiles!developer_apps_developer_id_fkey(display_name)').eq('status', 'active').order('downloads', { ascending: false });
    if (a) setApps(a as any);
    const { data: b } = await supabase.from('bounties').select('*, profiles!bounties_posted_by_fkey(display_name)').order('created_at', { ascending: false });
    if (b) setBounties(b as any);
    setLoading(false);
  }

  async function postBounty() {
    if (!user || !bTitle.trim() || !bReward) return;
    setPosting(true);
    const supabase = createClient();
    await supabase.from('bounties').insert({ title: bTitle.trim(), description: bDesc.trim(), reward_mly: parseFloat(bReward), category: bCategory, posted_by: user.id, github_issue_url: bGithub.trim() || null });
    setBTitle(''); setBDesc(''); setBReward(''); setBGithub(''); setShowBounty(false); setPosting(false); loadData();
  }

  async function claimBounty(id: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('bounties').update({ claimed_by: user.id, status: 'claimed' }).eq('id', id);
    loadData();
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Dev Portal</h1>
          <p className="text-xs text-gray-500">Build on MiLyfe. Earn $MLY. Shape the platform.</p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([{ key: 'apps', label: '📱 Apps' }, { key: 'bounties', label: '💎 Bounties' }, { key: 'my-apps', label: '🔧 My Apps' }, { key: 'docs', label: '📖 Docs' }] as { key: DevTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap', tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{t.label}</button>
        ))}
      </div>

      {/* Apps */}
      {tab === 'apps' && (
        <div className="space-y-3">
          {apps.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">No community apps yet. Build the first!</p></div> :
          apps.map(app => (
            <div key={app.id} className="card flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-harbor-600 flex items-center justify-center text-xl text-white">{app.icon_url ? <img src={app.icon_url} alt="" className="w-12 h-12 rounded-xl" /> : '📱'}</div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{app.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-1">{app.description}</p>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span>⬇️ {app.downloads}</span>
                  <span>⭐ {app.rating.toFixed(1)}</span>
                  <span>by {(app.profiles as any)?.display_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bounties */}
      {tab === 'bounties' && (
        <div className="space-y-3">
          {user && <button onClick={() => setShowBounty(!showBounty)} className="btn-teal text-xs w-full">+ Post Bounty</button>}
          {showBounty && (
            <div className="card space-y-3 border-2 border-amber-200 dark:border-amber-800">
              <input value={bTitle} onChange={e => setBTitle(e.target.value)} placeholder="Bounty title" className="input-field" />
              <textarea value={bDesc} onChange={e => setBDesc(e.target.value)} placeholder="What needs to be built/fixed?" className="input-field resize-none" rows={3} />
              <div className="grid grid-cols-3 gap-2">
                <input value={bReward} onChange={e => setBReward(e.target.value)} placeholder="Reward $MLY" type="number" className="input-field" />
                <select value={bCategory} onChange={e => setBCategory(e.target.value)} className="input-field">{['feature','bug','design','content','research'].map(c => <option key={c} value={c}>{c}</option>)}</select>
                <input value={bGithub} onChange={e => setBGithub(e.target.value)} placeholder="GitHub link" className="input-field" />
              </div>
              <button onClick={postBounty} disabled={!bTitle.trim() || !bReward || posting} className="btn-teal w-full disabled:opacity-50">{posting ? 'Posting...' : 'Post Bounty'}</button>
            </div>
          )}
          {bounties.filter(b => b.status === 'open').length === 0 ? <div className="card text-center py-6"><p className="text-xs text-gray-500">No open bounties. Post one!</p></div> :
          bounties.filter(b => b.status === 'open').map(b => (
            <div key={b.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 capitalize">{b.category}</span></div>
                  <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{b.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{b.description}</p>
                  {b.github_issue_url && <a href={b.github_issue_url} target="_blank" rel="noopener" className="text-xs text-teal-600 mt-1 inline-block">🔗 GitHub Issue</a>}
                </div>
                <span className="text-sm font-bold text-mly-600">${b.reward_mly}</span>
              </div>
              {user && user.id !== b.posted_by && <button onClick={() => claimBounty(b.id)} className="mt-2 text-xs text-teal-600 font-medium hover:underline">🙋 Claim This Bounty</button>}
            </div>
          ))}
        </div>
      )}

      {/* Docs */}
      {tab === 'docs' && (
        <div className="space-y-3">
          <div className="card"><h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">🔑 API Overview</h3><p className="text-xs text-gray-600 dark:text-gray-300">MiLyfe API uses REST with JSON. Authenticate via API key in the <code className="bg-gray-100 dark:bg-harbor-800 px-1 rounded">Authorization: Bearer YOUR_KEY</code> header.</p></div>
          <div className="card"><h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">📋 Available Endpoints</h3>
            <div className="space-y-1.5 text-xs font-mono">
              <p className="text-green-600">GET /api/notifications</p>
              <p className="text-green-600">GET /api/mly-decay</p>
              <p className="text-blue-600">POST /api/mi (AI assistant)</p>
              <p className="text-blue-600">POST /api/notifications</p>
              <p className="text-amber-600">POST /api/ubi (cron only)</p>
            </div>
          </div>
          <div className="card"><h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">🛠️ SDKs</h3><p className="text-xs text-gray-500">Use the REST API directly with your Supabase credentials.</p></div>
          <div className="card"><h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">🔐 OAuth (Sign in with MiLyfe)</h3><p className="text-xs text-gray-500">Allow users to sign into your app with their MiLyfe account. OAuth 2.0 PKCE flow — documentation in progress.</p></div>
        </div>
      )}

      {/* My Apps */}
      {tab === 'my-apps' && (
        <div className="card text-center py-8">
          <p className="text-3xl mb-2">🔧</p>
          <p className="text-sm text-gray-500">Register an app to get your API key</p>
          <p className="text-xs text-gray-400 mt-1">Register apps via the API — documentation above.</p>
        </div>
      )}
    </div>
  );
}
