'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

// ─── Types ────────────────────────────────────────────────────────
type TicketCategory = 'bug' | 'feature' | 'account' | 'dispute' | 'safety' | 'other';
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type FeatureStatus = 'open' | 'planned' | 'building' | 'done';

interface SupportTicket {
  id: string;
  user_id: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  response: string | null;
  created_at: string;
  updated_at: string;
}

interface FeatureRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  votes: number;
  status: FeatureStatus;
  created_at: string;
}

interface FeatureVote {
  request_id: string;
  user_id: string;
}

// ─── Constants ────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'How do I earn MLY?',
    a: 'You earn MLY through various activities: completing tasks in MiDev, posting on MiFeed, referring friends, community service through MiImpact, working gigs in MiJobs, and more. Your city\'s economy determines base earning rates, and your Standing multiplier increases your rewards.',
  },
  {
    q: 'How do I report an issue?',
    a: 'Use the ticket form below under "Still need help?" to submit a bug report or issue. Select the appropriate category, describe the problem in detail, and our support team will respond within 24-48 hours.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. MiLyfe uses end-to-end encryption for sensitive data, your information is never sold to third parties, and you can request full data export or deletion at any time through Settings > Privacy. We comply with GDPR and CCPA regulations.',
  },
  {
    q: 'How does Standing work?',
    a: 'Standing is your community reputation score (0-100). It increases with positive contributions: helping others, completing commitments, timely payments, and community involvement. Higher Standing unlocks premium features and better MLY earning multipliers.',
  },
  {
    q: 'Can I delete my account?',
    a: 'Yes. Go to Settings > Account > Delete Account. This will permanently remove your profile, transactions, and associated data after a 30-day grace period. Any MLY balance will be forfeited. Family memberships will be transferred or dissolved.',
  },
  {
    q: 'How do I exchange MLY?',
    a: 'MLY can be exchanged through MiWallet > Exchange. You can transfer MLY to other users, use it at partner businesses, or convert to external currency (subject to city regulations and minimum balance requirements). Exchange rates are updated daily.',
  },
];

const TICKET_CATEGORIES: { value: TicketCategory; label: string; icon: string }[] = [
  { value: 'bug', label: 'Bug Report', icon: '🐛' },
  { value: 'feature', label: 'Feature Request', icon: '💡' },
  { value: 'account', label: 'Account Issue', icon: '👤' },
  { value: 'dispute', label: 'Dispute', icon: '⚖️' },
  { value: 'safety', label: 'Safety Concern', icon: '🛡' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const STATUS_STYLES: Record<TicketStatus, { bg: string; text: string }> = {
  open: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
  in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  resolved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  closed: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
};

const FEATURE_STATUS_STYLES: Record<FeatureStatus, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Open' },
  planned: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Planned' },
  building: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Building' },
  done: { bg: 'bg-green-100', text: 'text-green-700', label: 'Done' },
};

const tabs = ['Help', 'Features', 'My Tickets'] as const;
type Tab = typeof tabs[number];

// ─── Main Component ────────────────────────────────────────────────
export default function SupportPage() {
  const { user } = useAppStore();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('Help');
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ticketsRes, featuresRes, votesRes] = await Promise.all([
        supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('feature_requests').select('*').order('votes', { ascending: false }),
        supabase.from('feature_votes').select('request_id').eq('user_id', user.id),
      ]);

      if (ticketsRes.data) setTickets(ticketsRes.data);
      if (featuresRes.data) setFeatureRequests(featuresRes.data);
      if (votesRes.data) setUserVotes(new Set(votesRes.data.map((v: any) => v.request_id)));
    } catch (err) {
      console.error('Support fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center animate-slide-up">
          <div className="text-4xl mb-4">💬</div>
          <h2 className="text-xl font-bold mb-2">Support</h2>
          <p className="text-gray-500">Sign in to access help and submit requests.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="skeleton h-8 w-32 rounded" />
        <div className="skeleton h-10 w-full rounded-xl" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="skeleton h-5 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24 space-y-6">
      {/* Header */}
      <header className="animate-slide-up">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          Support
        </h1>
        <p className="text-gray-500 mt-1">We're here to help</p>
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 animate-slide-up">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="animate-slide-up">
        {activeTab === 'Help' && (
          <HelpView userId={user.id} onTicketCreated={fetchAll} />
        )}
        {activeTab === 'Features' && (
          <FeaturesView
            requests={featureRequests}
            userVotes={userVotes}
            userId={user.id}
            onVote={handleVote}
            onSubmit={handleSubmitFeature}
          />
        )}
        {activeTab === 'My Tickets' && (
          <TicketsView tickets={tickets} />
        )}
      </div>
    </div>
  );

  async function handleVote(requestId: string) {
    const hasVoted = userVotes.has(requestId);
    if (hasVoted) {
      // Remove vote
      await supabase.from('feature_votes').delete().eq('request_id', requestId).eq('user_id', user!.id);
      await supabase.from('feature_requests').update({ votes: featureRequests.find((r) => r.id === requestId)!.votes - 1 }).eq('id', requestId);
      setUserVotes((prev) => { const s = new Set(prev); s.delete(requestId); return s; });
      setFeatureRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, votes: r.votes - 1 } : r));
    } else {
      // Add vote
      await supabase.from('feature_votes').insert({ request_id: requestId, user_id: user!.id });
      await supabase.from('feature_requests').update({ votes: featureRequests.find((r) => r.id === requestId)!.votes + 1 }).eq('id', requestId);
      setUserVotes((prev) => { const s = new Set(Array.from(prev)); s.add(requestId); return s; });
      setFeatureRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, votes: r.votes + 1 } : r));
    }
  }

  async function handleSubmitFeature(title: string, description: string) {
    const { data } = await supabase
      .from('feature_requests')
      .insert({ user_id: user!.id, title, description, votes: 0, status: 'open' })
      .select()
      .single();
    if (data) setFeatureRequests((prev) => [data, ...prev]);
  }
}

// ─── Help View ───────────────────────────────────────────────────
function HelpView({ userId, onTicketCreated }: { userId: string; onTicketCreated: () => void }) {
  const supabase = createClient();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [category, setCategory] = useState<TicketCategory>('bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from('support_tickets').insert({
        user_id: userId,
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        status: 'open',
      });
      setSubject('');
      setDescription('');
      setSubmitted(true);
      setTimeout(() => { setSubmitted(false); setShowTicketForm(false); }, 2000);
      onTicketCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* FAQ Section */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span>❓</span> Frequently Asked Questions
        </h3>
        <div className="space-y-2">
          {FAQ_ITEMS.map((faq, idx) => (
            <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-sm font-medium pr-4">{faq.q}</span>
                <span className={cn(
                  'text-gray-400 transition-transform duration-200 flex-shrink-0',
                  expandedFaq === idx && 'rotate-180'
                )}>▾</span>
              </button>
              {expandedFaq === idx && (
                <div className="px-4 pb-4 animate-slide-up">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Still need help?</h3>
            <p className="text-sm text-gray-500 mt-0.5">Submit a ticket and we'll get back to you</p>
          </div>
          {!showTicketForm && (
            <button onClick={() => setShowTicketForm(true)} className="btn-primary text-sm">
              Submit Ticket
            </button>
          )}
        </div>

        {showTicketForm && (
          <div className="space-y-4 animate-slide-up">
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-green-600">Ticket submitted successfully!</p>
                <p className="text-sm text-gray-500 mt-1">We'll respond within 24-48 hours</p>
              </div>
            ) : (
              <>
                {/* Category */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Category</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {TICKET_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={cn(
                          'p-2 rounded-lg text-center transition-all text-xs',
                          category === cat.value
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-300 dark:border-indigo-700'
                            : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-100'
                        )}
                      >
                        <span className="text-lg block">{cat.icon}</span>
                        <span className="mt-0.5 block">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Subject</label>
                  <input
                    className="input-field w-full"
                    placeholder="Brief summary of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description</label>
                  <textarea
                    className="input-field w-full min-h-[120px] resize-y"
                    placeholder="Describe the issue in detail. Include steps to reproduce if it's a bug."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Priority</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                          priority === p
                            ? p === 'urgent' ? 'bg-red-100 text-red-700 border-2 border-red-300'
                              : p === 'high' ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                              : p === 'medium' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                              : 'bg-green-100 text-green-700 border-2 border-green-300'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-2 border-transparent hover:bg-gray-100'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSubmitTicket} disabled={submitting} className="btn-primary text-sm">
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                  <button onClick={() => setShowTicketForm(false)} className="text-sm text-gray-500 hover:text-gray-700">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Features View ───────────────────────────────────────────────
function FeaturesView({
  requests,
  userVotes,
  userId,
  onVote,
  onSubmit,
}: {
  requests: FeatureRequest[];
  userVotes: Set<string>;
  userId: string;
  onVote: (id: string) => void;
  onSubmit: (title: string, description: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    onSubmit(title.trim(), description.trim());
    setTitle('');
    setDescription('');
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Feature Requests</h3>
          <p className="text-xs text-gray-500">Vote on features you want to see built</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          + Suggest Feature
        </button>
      </div>

      {/* Submit Form */}
      {showForm && (
        <div className="card p-5 space-y-4 border-2 border-indigo-200 dark:border-indigo-800 animate-slide-up">
          <input
            className="input-field w-full"
            placeholder="Feature title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="input-field w-full min-h-[80px] resize-y"
            placeholder="Describe the feature and why it would be helpful"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="btn-primary text-sm">Submit</button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500">Cancel</button>
          </div>
        </div>
      )}

      {/* Feature List */}
      {requests.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">💡</div>
          <h3 className="text-lg font-semibold mb-2">No feature requests yet</h3>
          <p className="text-gray-500 mb-4">Be the first to suggest a feature</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Suggest a Feature</button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const hasVoted = userVotes.has(request.id);
            const statusStyle = FEATURE_STATUS_STYLES[request.status] || FEATURE_STATUS_STYLES.open;
            return (
              <div key={request.id} className="card p-4 hover:shadow-md transition-all duration-200">
                <div className="flex gap-4">
                  {/* Vote Button */}
                  <button
                    onClick={() => onVote(request.id)}
                    className={cn(
                      'flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 flex-shrink-0',
                      hasVoted
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 border-2 border-indigo-300'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-indigo-50 hover:text-indigo-500 border-2 border-transparent'
                    )}
                  >
                    <span className="text-sm">▲</span>
                    <span className="text-sm font-bold">{request.votes}</span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm">{request.title}</h4>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0',
                        statusStyle.bg, statusStyle.text
                      )}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{request.description}</p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tickets View ────────────────────────────────────────────────
function TicketsView({ tickets }: { tickets: SupportTicket[] }) {
  if (tickets.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">🎫</div>
        <h3 className="text-lg font-semibold mb-2">No tickets yet</h3>
        <p className="text-gray-500">Your support tickets will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">My Tickets</h3>
        <p className="text-xs text-gray-500">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {tickets.map((ticket) => {
          const statusStyle = STATUS_STYLES[ticket.status];
          const catInfo = TICKET_CATEGORIES.find((c) => c.value === ticket.category);
          return (
            <div key={ticket.id} className="relative">
              {/* Ticket Card */}
              <div className="card p-5 border-l-4 border-l-indigo-300 dark:border-l-indigo-700">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{catInfo?.icon || '📋'}</span>
                    <div>
                      <h4 className="font-medium">{ticket.subject}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {catInfo?.label || ticket.category} · {new Date(ticket.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusStyle.bg, statusStyle.text)}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.description}</p>

                {/* Priority Badge */}
                <div className="mt-3 flex items-center gap-2">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-medium uppercase',
                    ticket.priority === 'urgent' && 'bg-red-100 text-red-700',
                    ticket.priority === 'high' && 'bg-orange-100 text-orange-700',
                    ticket.priority === 'medium' && 'bg-yellow-100 text-yellow-700',
                    ticket.priority === 'low' && 'bg-green-100 text-green-700',
                  )}>
                    {ticket.priority}
                  </span>
                  {ticket.updated_at !== ticket.created_at && (
                    <span className="text-[10px] text-gray-400">
                      Updated {new Date(ticket.updated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Response Card */}
              {ticket.response && (
                <div className="ml-6 mt-2 card p-4 bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">M</div>
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">MiLyfe Support</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{ticket.response}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
