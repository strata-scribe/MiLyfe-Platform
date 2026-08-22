'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface ResearchProject {
  id: string;
  lead_id: string;
  title: string;
  abstract: string;
  body: string;
  field: string;
  status: 'proposal' | 'active' | 'peer_review' | 'published' | 'archived';
  methodology: string | null;
  findings: string | null;
  tags: string[];
  collaborators: string[];
  citations: number;
  views: number;
  peer_reviews: number;
  funding_needed: number;
  funding_received: number;
  created_at: string;
  published_at: string | null;
  profiles?: { display_name: string };
}

interface PeerReview {
  id: string;
  project_id: string;
  reviewer_id: string;
  rating: number;
  feedback: string;
  methodology_score: number;
  rigor_score: number;
  impact_score: number;
  created_at: string;
  display_name?: string;
}

interface Citation {
  id: string;
  project_id: string;
  cited_by_project_id: string;
  cited_by_title: string;
  created_at: string;
}

type ProjectTab = 'paper' | 'reviews' | 'data' | 'fund';

const STATUS_COLORS: Record<string, string> = {
  proposal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  peer_review: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function ResearchProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ResearchProject | null>(null);
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ProjectTab>('paper');

  // Review form
  const [showReview, setShowReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewMethodology, setReviewMethodology] = useState(3);
  const [reviewRigor, setReviewRigor] = useState(3);
  const [reviewImpact, setReviewImpact] = useState(3);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fund form
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadProject(); }, [projectId]);

  async function loadProject() {
    setLoading(true);
    const supabase = createClient();

    const { data: p } = await supabase
      .from('research_projects')
      .select('*, profiles!research_projects_lead_id_fkey(display_name)')
      .eq('id', projectId)
      .single();
    if (p) {
      setProject(p as any);
      await supabase.from('research_projects').update({ views: (p.views || 0) + 1 }).eq('id', projectId);
    }

    const { data: r } = await supabase
      .from('peer_reviews')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (r) setReviews(r);

    const { data: c } = await supabase
      .from('research_citations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (c) setCitations(c);

    setLoading(false);
  }

  async function submitReview() {
    if (!user || !reviewFeedback.trim()) return;
    setSubmittingReview(true);
    const supabase = createClient();
    const rating = Math.round((reviewMethodology + reviewRigor + reviewImpact) / 3 * 10) / 10;

    await supabase.from('peer_reviews').insert({
      project_id: projectId, reviewer_id: user.id, rating,
      feedback: reviewFeedback.trim(), methodology_score: reviewMethodology,
      rigor_score: reviewRigor, impact_score: reviewImpact,
      display_name: user.display_name,
    });
    await supabase.from('research_projects').update({ peer_reviews: (project?.peer_reviews || 0) + 1 }).eq('id', projectId);

    setReviewFeedback(''); setShowReview(false); setSubmittingReview(false);
    loadProject();
  }

  async function fundProject() {
    if (!user || !fundAmount || !project) return;
    setFunding(true);
    const supabase = createClient();
    const amount = parseFloat(fundAmount);

    await supabase.from('research_funding').insert({
      project_id: projectId, funder_id: user.id, amount,
    });
    await supabase.from('research_projects').update({
      funding_received: project.funding_received + amount,
    }).eq('id', projectId);

    setProject({ ...project, funding_received: project.funding_received + amount });
    setFundAmount(''); setFunding(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="card skeleton h-6 w-32" />
        <div className="card skeleton h-48" />
        <div className="card skeleton h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4 animate-slide-up">
        <Link href="/academia" className="text-gray-400 hover:text-gray-600 text-sm">← Back to Research</Link>
        <div className="card text-center py-8">
          <p className="text-sm text-gray-500">Project not found</p>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 'N/A';
  const fundingPct = project.funding_needed > 0 ? Math.min(100, Math.round((project.funding_received / project.funding_needed) * 100)) : 0;

  return (
    <div className="space-y-4 animate-slide-up">
      <Link href="/academia" className="text-gray-400 hover:text-gray-600 text-sm">← Back to Research</Link>

      {/* Project Header */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-[10px] px-2 py-0.5 rounded capitalize', STATUS_COLORS[project.status])}>{project.status.replace('_', ' ')}</span>
          <span className="text-xs text-gray-500 capitalize">{project.field}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400">{project.views} views</span>
        </div>

        <h1 className="text-lg font-bold text-harbor-800 dark:text-white leading-tight">{project.title}</h1>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xs">
            {(project.profiles as any)?.display_name?.charAt(0) || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">{(project.profiles as any)?.display_name}</p>
            <p className="text-xs text-gray-500">Lead Researcher</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>📊 {reviews.length} reviews</span>
          <span>⭐ {avgRating} rating</span>
          <span>📎 {project.citations} citations</span>
          <span>👥 {project.collaborators?.length || 0} collaborators</span>
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {project.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-harbor-800 text-gray-500 rounded-full">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['paper', 'reviews', 'data', 'fund'] as ProjectTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'fund' ? 'Fund' : t}</button>
        ))}
      </div>

      {/* Paper Tab */}
      {tab === 'paper' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Abstract</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{project.abstract}</p>
          </div>

          {project.body && (
            <div className="card">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Full Paper</h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {project.body}
              </div>
            </div>
          )}

          {project.methodology && (
            <div className="card">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Methodology</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{project.methodology}</p>
            </div>
          )}

          {project.findings && (
            <div className="card">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Key Findings</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{project.findings}</p>
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === 'reviews' && (
        <div className="space-y-3">
          {user && project.lead_id !== user.id && (
            !showReview ? (
              <button onClick={() => setShowReview(true)} className="card w-full text-center py-3 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 border-2 border-dashed border-gray-200 dark:border-harbor-700">📝 Write Peer Review</button>
            ) : (
              <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
                <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Peer Review</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Methodology', value: reviewMethodology, set: setReviewMethodology },
                    { label: 'Rigor', value: reviewRigor, set: setReviewRigor },
                    { label: 'Impact', value: reviewImpact, set: setReviewImpact },
                  ].map(({ label, value, set }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{label}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => set(n)} className={cn('w-6 h-6 rounded text-xs', n <= value ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-500')}>{n}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <textarea value={reviewFeedback} onChange={e => setReviewFeedback(e.target.value)} placeholder="Detailed feedback, suggestions, and critique..." className="input-field resize-none" rows={4} />
                <div className="flex gap-2">
                  <button onClick={submitReview} disabled={!reviewFeedback.trim() || submittingReview} className="btn-teal flex-1 disabled:opacity-50">{submittingReview ? 'Submitting...' : 'Submit Review'}</button>
                  <button onClick={() => setShowReview(false)} className="px-4 py-2 text-xs bg-gray-100 rounded-lg">Cancel</button>
                </div>
              </div>
            )
          )}

          {reviews.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No peer reviews yet</p>
            </div>
          ) : reviews.map(review => (
            <div key={review.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-harbor-800 dark:text-white">{review.display_name}</span>
                <span className="text-xs text-mly-600 font-bold">⭐ {review.rating.toFixed(1)}</span>
              </div>
              <div className="flex gap-3 text-[10px] text-gray-500">
                <span>Method: {review.methodology_score}/5</span>
                <span>Rigor: {review.rigor_score}/5</span>
                <span>Impact: {review.impact_score}/5</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{review.feedback}</p>
              <p className="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Data Tab */}
      {tab === 'data' && (
        <div className="space-y-3">
          <div className="card text-center py-8">
            <p className="text-2xl mb-2">📊</p>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Research Data & Datasets</p>
            <p className="text-xs text-gray-500 mt-1">Open data, supplementary materials, and raw datasets</p>
          </div>

          {citations.length > 0 && (
            <div className="card">
              <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-2">Citations ({citations.length})</h3>
              {citations.map(c => (
                <div key={c.id} className="py-1.5 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                  <p className="text-xs text-teal-600">{c.cited_by_title}</p>
                  <p className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fund Tab */}
      {tab === 'fund' && (
        <div className="space-y-3">
          <div className="card">
            <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-2">Research Funding</h3>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-500">${project.funding_received.toFixed(0)} raised</span>
              <span className="text-gray-500">Goal: ${project.funding_needed.toFixed(0)} MLY</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
              <div className="h-full bg-mly-500 rounded-full transition-all" style={{ width: `${fundingPct}%` }} />
            </div>
            <p className="text-xs text-mly-600 font-bold mt-2">{fundingPct}% funded</p>
          </div>

          {user && project.lead_id !== user.id && (
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Support This Research</h3>
              <p className="text-xs text-gray-500">Fund community research with $MLY</p>
              <div className="flex gap-2">
                {[5, 10, 25, 50, 100].map(amt => (
                  <button key={amt} onClick={() => setFundAmount(amt.toString())} className={cn('px-3 py-1.5 rounded-lg text-xs', fundAmount === amt.toString() ? 'bg-mly-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>${amt}</button>
                ))}
              </div>
              <input value={fundAmount} onChange={e => setFundAmount(e.target.value)} placeholder="Custom amount" className="input-field" type="number" />
              <button onClick={fundProject} disabled={!fundAmount || funding} className="btn-teal w-full disabled:opacity-50">
                {funding ? 'Processing...' : `Fund $${fundAmount || '0'} MLY`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
