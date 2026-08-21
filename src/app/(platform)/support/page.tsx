'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type SupportTab = 'help' | 'features' | 'tickets';

interface SupportTicket {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  response: string | null;
  created_at: string;
}

interface FeatureRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  votes: number;
  status: string;
  created_at: string;
}

const faqItems = [
  { q: 'How do I earn MLY?', a: 'Complete daily check-ins, report community issues, finish courses, participate in the guild, and maintain habit streaks. You also receive 10 MLY UBI daily for staying active.' },
  { q: 'How do I send MLY to someone?', a: 'Go to your Wallet, tap "Send", and enter the recipient\'s email or display name along with the amount.' },
  { q: 'How do I join a guild?', a: 'Go to the Guild page, tap the "Join" tab, select your role and block area, then submit the enrollment form.' },
  { q: 'What is MiLyfe?', a: 'MiLyfe is a community-powered platform for peace economics, civic engagement, education, and mutual aid. All centered around the $MLY token economy.' },
  { q: 'How do I report a safety issue?', a: 'Use the "Help" tab below to submit a ticket with category "Safety". For emergencies, always call 911 first.' },
  { q: 'How do I reset my password?', a: 'Use the "Forgot Password" link on the login screen. You\'ll receive an email to reset it.' },
];

export default function SupportPage() {
  const [tab, setTab] = useState<SupportTab>('help');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Ticket form
  const [ticketCategory, setTicketCategory] = useState('bug');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Feature request form
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDesc, setFeatureDesc] = useState('');
  const [submittingFeature, setSubmittingFeature] = useState(false);
  const [showFeatureForm, setShowFeatureForm] = useState(false);

  // FAQ expansion
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // User's tickets
      const { data: ticketData } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (ticketData) setTickets(ticketData);

      // Feature requests
      const { data: featureData } = await supabase
        .from('feature_requests')
        .select('*')
        .order('votes', { ascending: false })
        .limit(30);
      if (featureData) setFeatures(featureData);

      // User's votes
      const { data: voteData } = await supabase
        .from('feature_votes')
        .select('feature_id')
        .eq('user_id', user.id);
      if (voteData) setUserVotes(voteData.map((v: any) => v.feature_id));

      setLoading(false);
    };
    load();
  }, [user]);

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingTicket(true);
    setTicketSuccess(false);
    const { data } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      category: ticketCategory,
      subject: ticketSubject.trim(),
      description: ticketDesc.trim(),
      status: 'open',
    }).select().single();
    if (data) {
      setTickets(prev => [data, ...prev]);
      setTicketSuccess(true);
      setTicketSubject('');
      setTicketDesc('');
    }
    setSubmittingTicket(false);
  };

  const submitFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingFeature(true);
    const { data } = await supabase.from('feature_requests').insert({
      user_id: user.id,
      title: featureTitle.trim(),
      description: featureDesc.trim(),
      votes: 1,
      status: 'open',
    }).select().single();
    if (data) {
      // Auto-vote for your own request
      await supabase.from('feature_votes').insert({ user_id: user.id, feature_id: data.id });
      setFeatures(prev => [data, ...prev]);
      setUserVotes(prev => [...prev, data.id]);
      setShowFeatureForm(false);
      setFeatureTitle('');
      setFeatureDesc('');
    }
    setSubmittingFeature(false);
  };

  const toggleVote = async (featureId: string) => {
    if (!user) return;
    const hasVoted = userVotes.includes(featureId);

    if (hasVoted) {
      await supabase.from('feature_votes').delete().eq('user_id', user.id).eq('feature_id', featureId);
      setUserVotes(prev => prev.filter(id => id !== featureId));
      setFeatures(prev => prev.map(f => f.id === featureId ? { ...f, votes: f.votes - 1 } : f));
    } else {
      await supabase.from('feature_votes').insert({ user_id: user.id, feature_id: featureId });
      setUserVotes(prev => [...prev, featureId]);
      setFeatures(prev => prev.map(f => f.id === featureId ? { ...f, votes: f.votes + 1 } : f));
    }
  };

  const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    planned: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  if (loading) return <div className="space-y-4 animate-slide-up">{[1,2,3].map(i => <div key={i} className="card skeleton h-24" />)}</div>;

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Support</h1>
        <p className="text-xs text-gray-500">Get help, request features, track your tickets.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([
          { key: 'help', label: '❓ Help' },
          { key: 'features', label: '💡 Features' },
          { key: 'tickets', label: '🎫 My Tickets' },
        ] as { key: SupportTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all', tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Help */}
      {tab === 'help' && (
        <div className="space-y-4">
          {/* FAQ */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Quick Answers</p>
            {faqItems.map((faq, i) => (
              <div key={i} className="card !py-3">
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full text-left flex items-center justify-between">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{faq.q}</p>
                  <span className="text-gray-400 text-xs">{expandedFaq === i ? '▼' : '▶'}</span>
                </button>
                {expandedFaq === i && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{faq.a}</p>
                )}
              </div>
            ))}
          </div>

          {/* Submit ticket form */}
          <form onSubmit={submitTicket} className="card space-y-3">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Submit a Ticket</p>
            {ticketSuccess && <p className="text-xs text-teal-500 font-medium">Ticket submitted! We&apos;ll get back to you soon.</p>}
            <select
              value={ticketCategory}
              onChange={e => setTicketCategory(e.target.value)}
              className="input-field text-sm"
            >
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="account">Account Issue</option>
              <option value="dispute">Dispute</option>
              <option value="safety">Safety Concern</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              value={ticketSubject}
              onChange={e => setTicketSubject(e.target.value)}
              className="input-field text-sm"
              placeholder="Subject"
              required
            />
            <textarea
              value={ticketDesc}
              onChange={e => setTicketDesc(e.target.value)}
              className="input-field text-sm min-h-[80px]"
              placeholder="Describe your issue or question..."
              required
            />
            <button type="submit" disabled={submittingTicket} className="btn-primary w-full text-sm disabled:opacity-50">
              {submittingTicket ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      )}

      {/* Feature Requests */}
      {tab === 'features' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Community Requests</p>
            <button onClick={() => setShowFeatureForm(!showFeatureForm)} className="text-xs text-teal-500 font-medium">
              {showFeatureForm ? 'Cancel' : '+ New Request'}
            </button>
          </div>

          {showFeatureForm && (
            <form onSubmit={submitFeature} className="card space-y-3">
              <p className="text-sm font-bold text-harbor-800 dark:text-white">New Feature Request</p>
              <input
                type="text"
                value={featureTitle}
                onChange={e => setFeatureTitle(e.target.value)}
                className="input-field text-sm"
                placeholder="Feature title"
                required
              />
              <textarea
                value={featureDesc}
                onChange={e => setFeatureDesc(e.target.value)}
                className="input-field text-sm min-h-[60px]"
                placeholder="Describe what you'd like to see..."
                required
              />
              <button type="submit" disabled={submittingFeature} className="btn-teal w-full text-sm disabled:opacity-50">
                {submittingFeature ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          )}

          <div className="space-y-2">
            {features.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-xs">No feature requests yet. Be the first!</p>
            ) : features.map(feature => (
              <div key={feature.id} className="card flex items-center gap-3 !py-3">
                <button
                  onClick={() => toggleVote(feature.id)}
                  className={cn('flex flex-col items-center min-w-[40px] py-1 rounded-lg transition-all', userVotes.includes(feature.id) ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600' : 'bg-gray-50 dark:bg-harbor-800 text-gray-400')}
                >
                  <span className="text-xs">▲</span>
                  <span className="text-xs font-bold">{feature.votes}</span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{feature.title}</p>
                  <p className="text-[10px] text-gray-400 truncate">{feature.description}</p>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap', statusColors[feature.status] || statusColors.open)}>
                  {feature.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Tickets */}
      {tab === 'tickets' && (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400 text-sm">No tickets yet.</p>
              <p className="text-xs text-gray-400 mt-1">Submit one from the Help tab if you need assistance.</p>
            </div>
          ) : tickets.map(ticket => (
            <div key={ticket.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-bold text-harbor-800 dark:text-white">{ticket.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-harbor-800 text-gray-500 capitalize">{ticket.category}</span>
                    <span className="text-[10px] text-gray-400">{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-medium', statusColors[ticket.status] || statusColors.open)}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{ticket.description}</p>
              {ticket.response && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-harbor-800">
                  <p className="text-[10px] font-medium text-teal-500 mb-1">Response:</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{ticket.response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
