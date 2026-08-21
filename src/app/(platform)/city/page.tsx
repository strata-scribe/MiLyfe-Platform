'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type CityTab = 'issues' | 'events' | 'vote' | 'jobs';

interface Issue {
  id: string;
  title: string;
  category: string;
  status: string;
  upvotes: number;
  created_at: string;
  reporter_id: string;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  mly_reward: number;
  organizer_id: string;
  profiles?: { display_name: string };
}

interface Vote {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  ends_at: string;
}

export default function CityPage() {
  const [activeTab, setActiveTab] = useState<CityTab>('issues');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const { user } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  // Load issues
  useEffect(() => {
    const fetchIssues = async () => {
      const { data } = await supabase
        .from('city_issues')
        .select('*')
        .order('upvotes', { ascending: false })
        .limit(30);

      if (data) setIssues(data);

      // Load user's upvotes
      if (user) {
        const { data: upvotes } = await supabase
          .from('issue_upvotes')
          .select('issue_id')
          .eq('user_id', user.id);

        if (upvotes) {
          setUserUpvotes(new Set(upvotes.map((u: any) => u.issue_id)));
        }
      }

      setLoading(false);
    };

    fetchIssues();

    // Realtime updates
    const channel = supabase
      .channel('city-issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'city_issues' }, () => fetchIssues())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, supabase]);

  // Load events
  useEffect(() => {
    if (activeTab !== 'events') return;

    const fetchEvents = async () => {
      const { data } = await supabase
        .from('city_events')
        .select('*, profiles!city_events_organizer_id_fkey(display_name)')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(10);

      if (data) setEvents(data);
    };

    fetchEvents();
  }, [activeTab, supabase]);

  // Load votes
  useEffect(() => {
    if (activeTab !== 'vote') return;

    const fetchVotes = async () => {
      const { data } = await supabase
        .from('community_votes')
        .select('*')
        .gte('ends_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) setVotes(data);
    };

    fetchVotes();
  }, [activeTab, supabase]);

  // Toggle upvote
  const handleUpvote = async (issueId: string) => {
    if (!user) return;

    const hasUpvoted = userUpvotes.has(issueId);

    if (hasUpvoted) {
      // Remove upvote
      await supabase
        .from('issue_upvotes')
        .delete()
        .eq('issue_id', issueId)
        .eq('user_id', user.id);

      // Decrement count
      await supabase
        .from('city_issues')
        .update({ upvotes: issues.find((i) => i.id === issueId)!.upvotes - 1 })
        .eq('id', issueId);

      setUserUpvotes((prev) => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, upvotes: i.upvotes - 1 } : i))
      );
    } else {
      // Add upvote
      await supabase
        .from('issue_upvotes')
        .insert({ issue_id: issueId, user_id: user.id });

      // Increment count
      await supabase
        .from('city_issues')
        .update({ upvotes: issues.find((i) => i.id === issueId)!.upvotes + 1 })
        .eq('id', issueId);

      setUserUpvotes((prev) => new Set(prev).add(issueId));
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, upvotes: i.upvotes + 1 } : i))
      );
    }
  };

  const getRelativeTime = (dateStr: string): string => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiCity</h1>
        <button onClick={() => router.push('/city/report')} className="btn-teal text-sm !py-2 !px-4">+ Report</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1" role="tablist">
        {(['issues', 'events', 'vote', 'jobs'] as CityTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all',
              activeTab === tab
                ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="card flex gap-3">
                <div className="skeleton w-10 h-14 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-48" />
                  <div className="skeleton h-3 w-24" />
                </div>
              </div>
            ))
          ) : issues.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400">No issues reported yet.</p>
              <button onClick={() => router.push('/city/report')} className="btn-teal mt-3 text-sm">
                Be the first to report
              </button>
            </div>
          ) : (
            issues.map((issue) => (
              <div key={issue.id} className="card flex items-start gap-3">
                <button
                  onClick={() => handleUpvote(issue.id)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 pt-1 transition-all',
                    userUpvotes.has(issue.id) ? 'text-teal-500' : 'text-gray-400'
                  )}
                  aria-label={userUpvotes.has(issue.id) ? 'Remove upvote' : 'Upvote'}
                >
                  <span className={cn(
                    'text-lg transition-transform',
                    userUpvotes.has(issue.id) && 'scale-125'
                  )}>
                    {userUpvotes.has(issue.id) ? '▲' : '△'}
                  </span>
                  <span className="text-sm font-bold">{issue.upvotes}</span>
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-harbor-800 dark:text-white">{issue.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      issue.status === 'open' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      issue.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    )}>
                      {issue.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">{issue.category}</span>
                    <span className="text-xs text-gray-400">{getRelativeTime(issue.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <EventsTab />
      )}

      {/* Vote Tab */}
      {activeTab === 'vote' && (
        <div className="space-y-3">
          {votes.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400">No active votes right now.</p>
            </div>
          ) : (
            votes.map((vote) => (
              <div key={vote.id} className="card">
                <h3 className="font-medium text-harbor-800 dark:text-white">{vote.question}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Ends {new Date(vote.ends_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 btn-teal text-sm !py-2">{vote.option_a}</button>
                  <button className="flex-1 btn-primary text-sm !py-2">{vote.option_b}</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-3">
          <div className="card text-center py-8">
            <p className="text-4xl mb-2">💼</p>
            <p className="text-gray-500">Community job board coming soon.</p>
            <p className="text-xs text-gray-400 mt-1">Local businesses will post $MLY-paid gigs here.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Events Tab with RSVP flow
function EventsTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create event form
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newReward, setNewReward] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('city_events')
        .select('*, profiles!city_events_organizer_id_fkey(display_name)')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(20);

      if (data) {
        setEvents(data);

        // Get RSVP counts for each event
        const counts: Record<string, number> = {};
        for (const event of data) {
          const { count } = await supabase
            .from('event_rsvps')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);
          counts[event.id] = count ?? 0;
        }
        setRsvpCounts(counts);
      }

      // Get user's RSVPs
      if (user) {
        const { data: userRsvps } = await supabase
          .from('event_rsvps')
          .select('event_id')
          .eq('user_id', user.id);

        if (userRsvps) {
          setRsvps(new Set(userRsvps.map((r: any) => r.event_id)));
        }
      }

      setLoading(false);
    };

    fetchEvents();
  }, [user, supabase, creating]);

  const handleRsvp = async (eventId: string) => {
    if (!user) return;

    const hasRsvp = rsvps.has(eventId);

    if (hasRsvp) {
      // Cancel RSVP
      await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      setRsvps((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      setRsvpCounts((prev) => ({ ...prev, [eventId]: (prev[eventId] ?? 1) - 1 }));
    } else {
      // RSVP
      await supabase
        .from('event_rsvps')
        .insert({ event_id: eventId, user_id: user.id });

      setRsvps((prev) => new Set(prev).add(eventId));
      setRsvpCounts((prev) => ({ ...prev, [eventId]: (prev[eventId] ?? 0) + 1 }));
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    await supabase.from('city_events').insert({
      organizer_id: user.id,
      title: newTitle.trim(),
      description: newDesc.trim(),
      location: newLocation.trim() || null,
      event_date: new Date(newDate).toISOString(),
      mly_reward: parseFloat(newReward) || 0,
    });

    setShowCreate(false);
    setNewTitle('');
    setNewDate('');
    setNewLocation('');
    setNewReward('');
    setNewDesc('');
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card space-y-2">
            <div className="skeleton h-4 w-48" />
            <div className="skeleton h-3 w-32" />
            <div className="skeleton h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setShowCreate(!showCreate)} className="btn-primary w-full text-sm">
        + Create Event
      </button>

      {showCreate && (
        <form onSubmit={handleCreateEvent} className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-medium text-harbor-800 dark:text-white">New Community Event</h3>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="input-field !py-2 text-sm"
            placeholder="Event name"
            required
          />
          <input
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="input-field !py-2 text-sm"
            required
          />
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            className="input-field !py-2 text-sm"
            placeholder="Location (optional)"
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="input-field !py-2 text-sm resize-none h-16"
            placeholder="Description (optional)"
          />
          <input
            type="number"
            value={newReward}
            onChange={(e) => setNewReward(e.target.value)}
            className="input-field !py-2 text-sm"
            placeholder="$MLY reward for attendees (optional)"
            min="0"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="btn-teal flex-1 text-sm !py-2">
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-primary flex-1 text-sm !py-2">
              Cancel
            </button>
          </div>
        </form>
      )}

      {events.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-4xl mb-2">📅</p>
          <p className="text-gray-400">No upcoming events.</p>
          <p className="text-sm text-gray-400 mt-1">Create one to rally your community!</p>
        </div>
      ) : (
        events.map((event) => {
          const isRsvpd = rsvps.has(event.id);
          const count = rsvpCounts[event.id] ?? 0;

          return (
            <div key={event.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-harbor-800 dark:text-white">{event.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {event.location && `📍 ${event.location} · `}
                    {(event.profiles as any)?.display_name ?? 'Organizer'}
                    {' · '}{count} going
                  </p>
                </div>
                {event.mly_reward > 0 && (
                  <span className="text-xs font-bold text-mly-600 bg-mly-50 dark:bg-mly-900/20 px-2 py-1 rounded-full flex-shrink-0">
                    +{event.mly_reward} MLY
                  </span>
                )}
              </div>
              {event.description && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{event.description}</p>
              )}
              <button
                onClick={() => handleRsvp(event.id)}
                className={cn(
                  'text-sm w-full mt-3 !py-2 font-medium rounded-xl transition-all',
                  isRsvpd
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 border border-teal-300 dark:border-teal-700'
                    : 'btn-teal'
                )}
              >
                {isRsvpd ? '✓ Going — Tap to cancel' : 'RSVP'}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
