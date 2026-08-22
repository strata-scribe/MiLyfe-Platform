'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { ReadAloudButton } from '@/components/ui/read-aloud-button';
import { cn } from '@/lib/utils/cn';

interface Article {
  id: string;
  number: number;
  title: string;
  content_md: string;
  status: string;
}

interface Amendment {
  id: string;
  article_id: string | null;
  proposed_by: string;
  proposal_text: string;
  rationale: string;
  status: string;
  votes_for: number;
  votes_against: number;
  required_votes: number;
  voting_ends_at: string;
  created_at: string;
  profiles?: { display_name: string };
}

interface Annotation {
  id: string;
  article_id: string;
  user_id: string;
  annotation: string;
  likes: number;
  created_at: string;
  profiles?: { display_name: string };
}

type ConstitutionTab = 'articles' | 'amendments' | 'propose' | 'history';

// Default constitution articles
const DEFAULT_ARTICLES: Omit<Article, 'id'>[] = [
  { number: 1, title: 'Purpose', content_md: 'MiLyfe exists to empower community members through democratic participation, mutual aid, and transparent governance. Every member has an equal voice in shaping the platform\'s direction and policies. The platform serves the people — never the other way around.', status: 'active' },
  { number: 2, title: 'Membership & Rights', content_md: 'Every person who joins MiLyfe is a full member with equal rights. No membership fees. No pay-to-win. No discrimination based on race, gender, religion, sexuality, disability, or economic status. Your data belongs to you. You can export or delete it at any time.', status: 'active' },
  { number: 3, title: 'Community Currency ($MLY)', content_md: '$MLY is earned through participation, never purchased. 1 MLY = $1 USD. Daily UBI of $10 MLY for active members. The currency exists to circulate — hoarding is taxed, inactivity decays balances. The economic rules are transparent and community-controlled.', status: 'active' },
  { number: 4, title: 'Governance', content_md: 'All major platform decisions are made by community vote. Proposals require a quorum to pass. Vote delegation is supported for those who can\'t participate directly. Governance is liquid — you can delegate, revoke, or vote directly at any time.', status: 'active' },
  { number: 5, title: 'Transparency', content_md: 'All platform finances, moderation actions, and governance decisions are publicly visible. The transparency dashboard shows everything. No secret algorithms. No hidden rules. If it affects you, you can see it.', status: 'active' },
  { number: 6, title: 'Accountability', content_md: 'Consequences are proportional, transparent, and community-controlled. Every enforcement action can be appealed. Community juries (not admins) decide serious cases. Standing can always be rebuilt through positive participation.', status: 'active' },
  { number: 7, title: 'Privacy & Safety', content_md: 'Health data is private. Messages are private. Vault documents are encrypted. The platform will never sell user data. Safety mode exists for those in danger. Emergency features are available 24/7.', status: 'active' },
  { number: 8, title: 'Amendment Process', content_md: 'This constitution can be amended by the community. Amendments require: (1) A proposal from any Level 2+ member, (2) A 14-day discussion period, (3) A supermajority vote (67%+) with quorum. No article is above amendment — including this one.', status: 'active' },
  { number: 9, title: 'Platform Independence', content_md: 'MiLyfe is not owned by a corporation. It is a community utility. If the founding team ever attempts to sell, exploit, or restrict the platform against community will, this constitution grants the community the right to fork and continue independently.', status: 'active' },
  { number: 10, title: 'Local Sovereignty', content_md: 'Each city/community that adopts MiLyfe governs itself. Jacksonville\'s MiLyfe is governed by Jacksonville\'s community. Platform-wide standards exist, but local governance decides local policy.', status: 'active' },
];

export default function ConstitutionInteractivePage() {
  const [tab, setTab] = useState<ConstitutionTab>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Propose form
  const [propArticleId, setPropArticleId] = useState<string>('');
  const [propText, setPropText] = useState('');
  const [propRationale, setPropRationale] = useState('');
  const [proposing, setProposing] = useState(false);

  // Annotation form
  const [annotating, setAnnotating] = useState<string | null>(null);
  const [annotationText, setAnnotationText] = useState('');

  const { user } = useAppStore();

  useEffect(() => {
    loadConstitution();
  }, []);

  async function loadConstitution() {
    const supabase = createClient();

    const { data: arts } = await supabase
      .from('constitution_articles')
      .select('*')
      .order('number');

    if (arts && arts.length > 0) {
      setArticles(arts);
    } else {
      // Use defaults if DB is empty
      setArticles(DEFAULT_ARTICLES.map((a, i) => ({ ...a, id: `default-${i}` })));
    }

    const { data: amends } = await supabase
      .from('constitution_amendments')
      .select('*, profiles!constitution_amendments_proposed_by_fkey(display_name)')
      .order('created_at', { ascending: false });

    if (amends) setAmendments(amends as any);

    const { data: annots } = await supabase
      .from('constitution_annotations')
      .select('*, profiles!constitution_annotations_user_id_fkey(display_name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (annots) setAnnotations(annots as any);
    setLoading(false);
  }

  async function handlePropose() {
    if (!user || !propText.trim()) return;
    setProposing(true);

    const supabase = createClient();
    const votingEnds = new Date();
    votingEnds.setDate(votingEnds.getDate() + 14); // 14-day voting period

    await supabase.from('constitution_amendments').insert({
      article_id: propArticleId || null,
      proposed_by: user.id,
      proposal_text: propText.trim(),
      rationale: propRationale.trim(),
      required_votes: 10,
      voting_ends_at: votingEnds.toISOString(),
    });

    setPropText('');
    setPropRationale('');
    setPropArticleId('');
    setProposing(false);
    setTab('amendments');
    loadConstitution();
  }

  async function handleVoteAmendment(amendmentId: string, support: boolean) {
    if (!user) return;
    const supabase = createClient();
    const field = support ? 'votes_for' : 'votes_against';

    await supabase.from('constitution_amendments')
      .update({ [field]: amendments.find(a => a.id === amendmentId)?.[field as 'votes_for' | 'votes_against']! + 1 })
      .eq('id', amendmentId);

    loadConstitution();
  }

  async function handleAnnotate(articleId: string) {
    if (!user || !annotationText.trim()) return;
    const supabase = createClient();

    await supabase.from('constitution_annotations').insert({
      article_id: articleId,
      user_id: user.id,
      annotation: annotationText.trim(),
    });

    setAnnotationText('');
    setAnnotating(null);
    loadConstitution();
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">📜 MiLyfe Constitution</h1>
          <p className="text-xs text-gray-500">The founding document of our community. Living, amendable, yours.</p>
        </div>
        <ReadAloudButton
          texts={articles.map(a => `Article ${a.number}. ${a.title}. ${a.content_md}`)}
          size="sm"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([
          { key: 'articles', label: '📜 Articles' },
          { key: 'amendments', label: `✏️ Amendments (${amendments.filter(a => a.status === 'voting').length})` },
          { key: 'propose', label: '➕ Propose' },
          { key: 'history', label: '📋 History' },
        ] as { key: ConstitutionTab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Articles */}
      {tab === 'articles' && (
        <div className="space-y-3">
          {articles.map((article) => {
            const isExpanded = expandedArticle === article.number;
            const articleAnnotations = annotations.filter(a => a.article_id === article.id);

            return (
              <div key={article.id} className="card">
                <button
                  onClick={() => setExpandedArticle(isExpanded ? null : article.number)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-xs font-bold text-harbor-600 dark:text-harbor-300 flex-shrink-0">
                      {article.number}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{article.title}</h3>
                      {!isExpanded && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{article.content_md}</p>
                      )}
                    </div>
                    <span className="text-gray-400 text-sm">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-harbor-800 space-y-3">
                    <p className="text-sm text-harbor-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {article.content_md}
                    </p>

                    <div className="flex items-center gap-2">
                      <ReadAloudButton texts={[`Article ${article.number}. ${article.title}. ${article.content_md}`]} size="sm" />
                      {user && (
                        <button
                          onClick={() => setAnnotating(annotating === article.id ? null : article.id)}
                          className="text-xs text-teal-600 hover:underline"
                        >
                          💬 Annotate
                        </button>
                      )}
                    </div>

                    {/* Annotation form */}
                    {annotating === article.id && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={annotationText}
                          onChange={(e) => setAnnotationText(e.target.value)}
                          placeholder="Add your interpretation or comment..."
                          className="input-field flex-1 !py-2 text-xs"
                        />
                        <button onClick={() => handleAnnotate(article.id)} className="btn-teal text-xs !py-2">
                          Post
                        </button>
                      </div>
                    )}

                    {/* Annotations */}
                    {articleAnnotations.length > 0 && (
                      <div className="space-y-2 pl-3 border-l-2 border-teal-200 dark:border-teal-800">
                        {articleAnnotations.slice(0, 5).map((ann) => (
                          <div key={ann.id} className="text-xs">
                            <span className="font-medium text-harbor-800 dark:text-white">
                              {ann.profiles?.display_name || 'Member'}:
                            </span>{' '}
                            <span className="text-gray-600 dark:text-gray-300">{ann.annotation}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Active Amendments */}
      {tab === 'amendments' && (
        <div className="space-y-3">
          {amendments.filter(a => a.status === 'voting').length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No active amendment proposals.</p>
              <button onClick={() => setTab('propose')} className="text-xs text-teal-600 mt-2 hover:underline">
                Propose one →
              </button>
            </div>
          ) : amendments.filter(a => a.status === 'voting').map((amendment) => {
            const totalVotes = amendment.votes_for + amendment.votes_against;
            const forPct = totalVotes > 0 ? Math.round((amendment.votes_for / totalVotes) * 100) : 0;
            const isExpired = new Date(amendment.voting_ends_at) < new Date();
            const ratified = forPct >= 67 && totalVotes >= amendment.required_votes;

            return (
              <div key={amendment.id} className="card space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">
                      Proposed by {amendment.profiles?.display_name || 'Member'} ·{' '}
                      {new Date(amendment.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white mt-1">
                      {amendment.proposal_text}
                    </p>
                    {amendment.rationale && (
                      <p className="text-xs text-gray-500 mt-1 italic">Rationale: {amendment.rationale}</p>
                    )}
                  </div>
                </div>

                {/* Vote bar */}
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 dark:bg-harbor-800 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${forPct}%` }} />
                    <div className="h-full bg-red-400 transition-all" style={{ width: `${100 - forPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>For: {amendment.votes_for} ({forPct}%)</span>
                    <span>Against: {amendment.votes_against}</span>
                    <span>Need: 67% + {amendment.required_votes} votes</span>
                  </div>
                </div>

                {/* Vote buttons */}
                {user && !isExpired && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVoteAmendment(amendment.id, true)}
                      className="flex-1 py-2 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      ✓ Support
                    </button>
                    <button
                      onClick={() => handleVoteAmendment(amendment.id, false)}
                      className="flex-1 py-2 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      ✗ Oppose
                    </button>
                  </div>
                )}

                {isExpired && (
                  <p className={cn('text-xs font-medium text-center py-1 rounded', ratified ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50')}>
                    {ratified ? '✓ Ratified' : '✗ Failed'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Propose */}
      {tab === 'propose' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Propose a Constitutional Amendment</h3>
          <p className="text-xs text-gray-500">
            Your proposal will be open for 14 days of discussion and voting. 
            Ratification requires 67%+ approval with quorum.
          </p>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Related Article (optional)</label>
            <select
              value={propArticleId}
              onChange={(e) => setPropArticleId(e.target.value)}
              className="input-field"
            >
              <option value="">New article / General</option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>Article {a.number}: {a.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Amendment Text</label>
            <textarea
              value={propText}
              onChange={(e) => setPropText(e.target.value)}
              placeholder="What should be added, changed, or removed?"
              className="input-field resize-none"
              rows={4}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Rationale</label>
            <textarea
              value={propRationale}
              onChange={(e) => setPropRationale(e.target.value)}
              placeholder="Why is this amendment needed? What problem does it solve?"
              className="input-field resize-none"
              rows={3}
            />
          </div>

          <button
            onClick={handlePropose}
            disabled={!propText.trim() || proposing || !user}
            className="btn-teal w-full disabled:opacity-50"
          >
            {proposing ? 'Submitting...' : '📜 Submit Amendment Proposal'}
          </button>
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="space-y-3">
          {amendments.filter(a => a.status !== 'voting').length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No amendment history yet.</p>
            </div>
          ) : amendments.filter(a => a.status !== 'voting').map((amendment) => (
            <div key={amendment.id} className="card">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{new Date(amendment.created_at).toLocaleDateString()}</span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  amendment.status === 'ratified' ? 'bg-green-100 text-green-600' :
                  amendment.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {amendment.status}
                </span>
              </div>
              <p className="text-sm text-harbor-800 dark:text-white mt-2">{amendment.proposal_text}</p>
              <p className="text-xs text-gray-500 mt-1">
                For: {amendment.votes_for} · Against: {amendment.votes_against}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
