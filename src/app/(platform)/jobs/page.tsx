'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type JobTab = 'browse' | 'post' | 'my';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  pay_mly: number;
  pay_type: string;
  location: string | null;
  status: string;
  poster_id: string;
  created_at: string;
  profiles?: { display_name: string };
  application_count?: number;
  user_applied?: boolean;
}

export default function JobsPage() {
  const [tab, setTab] = useState<JobTab>('browse');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  // Post form
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCategory, setPCategory] = useState('general');
  const [pPay, setPPay] = useState('');
  const [pPayType, setPPayType] = useState('fixed');
  const [pLocation, setPLocation] = useState('');
  const [posting, setPosting] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*, profiles!jobs_poster_id_fkey(display_name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (data) {
        const enriched: Job[] = [];
        for (const job of data) {
          const { count } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);

          let userApplied = false;
          if (user) {
            const { data: app } = await supabase
              .from('job_applications')
              .select('id')
              .eq('job_id', job.id)
              .eq('applicant_id', user.id)
              .maybeSingle();
            userApplied = !!app;
          }

          enriched.push({ ...job, application_count: count ?? 0, user_applied: userApplied });
        }
        setJobs(enriched);
      }

      // My posted jobs
      if (user) {
        const { data: mine } = await supabase
          .from('jobs')
          .select('*')
          .eq('poster_id', user.id)
          .order('created_at', { ascending: false });
        if (mine) setMyJobs(mine);
      }

      setLoading(false);
    };
    load();
  }, [user, supabase, posting]);

  const handleApply = async (jobId: string) => {
    if (!user) return;
    setApplying(jobId);

    await supabase.from('job_applications').insert({
      job_id: jobId,
      applicant_id: user.id,
      message: 'Interested in this opportunity',
    });

    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, user_applied: true, application_count: (j.application_count ?? 0) + 1 } : j));
    setApplying(null);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPosting(true);

    await supabase.from('jobs').insert({
      poster_id: user.id,
      title: pTitle.trim(),
      description: pDesc.trim(),
      category: pCategory,
      pay_mly: parseFloat(pPay),
      pay_type: pPayType,
      location: pLocation.trim() || null,
    });

    setPTitle(''); setPDesc(''); setPPay(''); setPLocation('');
    setPosting(false);
    setTab('browse');
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Jobs & Gigs</h1>
        <p className="text-xs text-gray-500">Earn $MLY. Hire local. Build community.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1" role="tablist">
        {([{ key: 'browse', label: 'Browse' }, { key: 'post', label: '+ Post Job' }, { key: 'my', label: 'My Jobs' }] as { key: JobTab; label: string }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div className="space-y-3">
          {loading ? [1, 2, 3].map((i) => <div key={i} className="card skeleton h-24" />) : jobs.length === 0 ? (
            <div className="text-center py-12"><p className="text-4xl mb-2">💼</p><p className="text-gray-500">No open jobs yet.</p><button onClick={() => setTab('post')} className="btn-teal mt-3 text-sm">Post the first one</button></div>
          ) : jobs.map((job) => (
            <div key={job.id} className="card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{job.title}</h3>
                  <p className="text-xs text-gray-500">{(job.profiles as any)?.display_name} · {job.location || 'Remote/Flexible'}</p>
                </div>
                <span className="text-sm font-bold text-mly-600 bg-mly-50 dark:bg-mly-900/20 px-2 py-1 rounded-full">
                  {job.pay_mly} MLY{job.pay_type === 'hourly' ? '/hr' : ''}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{job.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{job.application_count} applicant{job.application_count !== 1 ? 's' : ''}</span>
                {job.poster_id === user?.id ? (
                  <span className="text-xs text-gray-400">Your post</span>
                ) : job.user_applied ? (
                  <span className="text-xs text-teal-500 font-medium">✓ Applied</span>
                ) : (
                  <button onClick={() => handleApply(job.id)} disabled={applying === job.id} className="btn-teal text-xs !py-1.5 !px-3">
                    {applying === job.id ? '...' : 'Apply'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'post' && (
        <form onSubmit={handlePost} className="card space-y-3">
          <h2 className="font-medium text-harbor-800 dark:text-white">Post a Job/Gig</h2>
          <input type="text" value={pTitle} onChange={(e) => setPTitle(e.target.value)} className="input-field !py-2 text-sm" placeholder="Job title" required />
          <textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} className="input-field !py-2 text-sm resize-none h-20" placeholder="What's the work? Requirements?" required />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={pPay} onChange={(e) => setPPay(e.target.value)} className="input-field !py-2 text-sm" placeholder="Pay (MLY)" required min="1" />
            <select value={pPayType} onChange={(e) => setPPayType(e.target.value)} className="input-field !py-2 text-sm">
              <option value="fixed">Fixed</option>
              <option value="hourly">Per hour</option>
            </select>
          </div>
          <input type="text" value={pLocation} onChange={(e) => setPLocation(e.target.value)} className="input-field !py-2 text-sm" placeholder="Location (optional)" />
          <button type="submit" disabled={posting} className="btn-gold w-full disabled:opacity-50">{posting ? 'Posting...' : 'Post Job'}</button>
        </form>
      )}

      {tab === 'my' && (
        <div className="space-y-3">
          {myJobs.length === 0 ? <p className="text-center py-8 text-gray-400">You haven&apos;t posted any jobs.</p> : myJobs.map((job) => (
            <div key={job.id} className="card flex items-center justify-between">
              <div><p className="text-sm font-medium text-harbor-800 dark:text-white">{job.title}</p><p className="text-xs text-gray-500 capitalize">{job.status} · {job.pay_mly} MLY</p></div>
              <span className={cn('text-xs px-2 py-1 rounded-full', job.status === 'open' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500')}>{job.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
