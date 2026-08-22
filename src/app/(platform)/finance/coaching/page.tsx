'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Coach {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  specialties: string[];
  bio: string;
  rating: number;
  sessions_completed: number;
  availability: 'available' | 'busy' | 'offline';
  hourly_rate: number;
}

interface CoachingSession {
  id: string;
  coach_id: string;
  client_id: string;
  coach_name: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes: string | null;
  rating: number | null;
}

type CoachingTab = 'browse' | 'my-sessions' | 'book';

export default function FinancialCoachingPage() {
  const [tab, setTab] = useState<CoachingTab>('browse');
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  // Booking form
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookNotes, setBookNotes] = useState('');
  const [booking, setBooking] = useState(false);

  // Rating
  const [ratingSessionId, setRatingSessionId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    const { data: coachData } = await supabase
      .from('financial_coaches')
      .select('*, profiles(display_name, avatar_url)')
      .order('rating', { ascending: false });

    if (coachData) {
      setCoaches(coachData.map((c: any) => ({
        ...c,
        display_name: c.profiles?.display_name || 'Coach',
        avatar_url: c.profiles?.avatar_url || null,
      })));
    }

    if (user) {
      const { data: sessionData } = await supabase
        .from('coaching_sessions')
        .select('*, coach:financial_coaches(profiles(display_name))')
        .eq('client_id', user.id)
        .order('scheduled_at', { ascending: false });

      if (sessionData) {
        setSessions(sessionData.map((s: any) => ({
          ...s,
          coach_name: s.coach?.profiles?.display_name || 'Coach',
        })));
      }
    }
    setLoading(false);
  }

  async function bookSession() {
    if (!user || !selectedCoach || !bookDate || !bookTime) return;
    setBooking(true);
    const supabase = createClient();

    const scheduledAt = new Date(`${bookDate}T${bookTime}`).toISOString();

    const { error } = await supabase.from('coaching_sessions').insert({
      coach_id: selectedCoach.id,
      client_id: user.id,
      scheduled_at: scheduledAt,
      duration_minutes: 30,
      status: 'upcoming',
      notes: bookNotes.trim() || null,
    });

    if (error) {
      toast.error('Failed to book session');
    } else {
      toast.success(`Session booked with ${selectedCoach.display_name}!`);
      setSelectedCoach(null);
      setBookDate(''); setBookTime(''); setBookNotes('');
      setTab('my-sessions');
      loadData();
    }
    setBooking(false);
  }

  async function rateCoach(sessionId: string) {
    if (!user) return;
    const supabase = createClient();

    const { error } = await supabase.from('coaching_sessions').update({
      rating: ratingValue,
    }).eq('id', sessionId);

    if (!error) {
      await supabase.from('coaching_reviews').insert({
        session_id: sessionId,
        reviewer_id: user.id,
        rating: ratingValue,
        comment: ratingComment.trim() || null,
      });
      toast.success('Rating submitted!');
      setRatingSessionId(null);
      setRatingValue(5);
      setRatingComment('');
      loadData();
    }
  }

  async function cancelSession(sessionId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('coaching_sessions').update({ status: 'cancelled' }).eq('id', sessionId);
    if (!error) {
      toast.success('Session cancelled');
      loadData();
    }
  }

  function getAvailabilityBadge(availability: string) {
    switch (availability) {
      case 'available': return { label: 'Available', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
      case 'busy': return { label: 'Busy', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
      default: return { label: 'Offline', color: 'bg-gray-100 text-gray-600' };
    }
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Financial Coaching</h1>
        <p className="text-xs text-gray-500">Free peer coaching from certified community members</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['browse', 'my-sessions'] as CoachingTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
            {t === 'my-sessions' ? 'My Sessions' : 'Find a Coach'}
          </button>
        ))}
      </div>

      {/* Browse Coaches */}
      {tab === 'browse' && !selectedCoach && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-24" />) :
            coaches.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🎓</p>
                <p className="text-sm text-gray-500">No coaches available yet</p>
                <p className="text-xs text-gray-400 mt-1">Community members who complete financial courses become coaches</p>
              </div>
            ) : coaches.map(coach => {
              const avail = getAvailabilityBadge(coach.availability);
              return (
                <div key={coach.id} className="card space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-bold text-teal-700 dark:text-teal-400">
                      {coach.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-harbor-800 dark:text-white">{coach.display_name}</p>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded', avail.color)}>{avail.label}</span>
                      </div>
                      {coach.bio && <p className="text-xs text-gray-500 mt-0.5 truncate">{coach.bio}</p>}
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1">
                    {coach.specialties.map((s, i) => (
                      <span key={i} className="text-[10px] bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-0.5">
                        {'⭐'.repeat(Math.round(coach.rating))} {coach.rating.toFixed(1)}
                      </span>
                      <span>{coach.sessions_completed} sessions</span>
                    </div>
                    {user && coach.availability === 'available' && (
                      <button onClick={() => { setSelectedCoach(coach); setTab('book'); }} className="btn-teal text-xs px-3 py-1">Book Session</button>
                    )}
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {/* Book Session */}
      {tab === 'book' && selectedCoach && (
        <div className="space-y-3">
          <button onClick={() => { setSelectedCoach(null); setTab('browse'); }} className="text-xs text-gray-400 hover:text-gray-600">← Back to coaches</button>

          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-bold text-teal-700 dark:text-teal-400">
              {selectedCoach.display_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">{selectedCoach.display_name}</p>
              <p className="text-xs text-gray-500">{selectedCoach.specialties.join(', ')}</p>
            </div>
          </div>

          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Book a Session</h3>
            <p className="text-xs text-gray-500">30-minute coaching session. Free for community members.</p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Date</label>
                <input value={bookDate} onChange={e => setBookDate(e.target.value)} className="input-field" type="date" min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Time</label>
                <input value={bookTime} onChange={e => setBookTime(e.target.value)} className="input-field" type="time" />
              </div>
            </div>

            <textarea value={bookNotes} onChange={e => setBookNotes(e.target.value)} placeholder="What would you like to discuss? (optional)" className="input-field resize-none" rows={3} />

            <button onClick={bookSession} disabled={!bookDate || !bookTime || booking} className="btn-teal w-full disabled:opacity-50">
              {booking ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}

      {/* My Sessions */}
      {tab === 'my-sessions' && (
        <div className="space-y-2">
          {!user ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">Sign in to view your sessions</p>
            </div>
          ) : loading ? [1, 2].map(i => <div key={i} className="card skeleton h-20" />) :
            sessions.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">📅</p>
                <p className="text-sm text-gray-500">No sessions booked yet</p>
                <button onClick={() => setTab('browse')} className="btn-teal text-xs mt-3">Find a Coach</button>
              </div>
            ) : (
              <>
                {/* Upcoming */}
                {sessions.filter(s => s.status === 'upcoming').length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-harbor-800 dark:text-white">Upcoming</h3>
                    {sessions.filter(s => s.status === 'upcoming').map(session => (
                      <div key={session.id} className="card space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-harbor-800 dark:text-white">{session.coach_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(session.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(session.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">Upcoming</span>
                        </div>
                        {session.notes && <p className="text-xs text-gray-500">{session.notes}</p>}
                        <button onClick={() => cancelSession(session.id)} className="text-[10px] text-red-400 hover:text-red-600">Cancel Session</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Completed */}
                {sessions.filter(s => s.status === 'completed').length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-harbor-800 dark:text-white">Completed</h3>
                    {sessions.filter(s => s.status === 'completed').map(session => (
                      <div key={session.id} className="card space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-harbor-800 dark:text-white">{session.coach_name}</p>
                            <p className="text-xs text-gray-500">{new Date(session.scheduled_at).toLocaleDateString()}</p>
                          </div>
                          {session.rating ? (
                            <span className="text-xs text-yellow-600">{'⭐'.repeat(session.rating)}</span>
                          ) : (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">Completed</span>
                          )}
                        </div>

                        {/* Rate Button */}
                        {!session.rating && ratingSessionId !== session.id && (
                          <button onClick={() => setRatingSessionId(session.id)} className="text-xs text-teal-600 hover:text-teal-700">⭐ Rate this session</button>
                        )}

                        {/* Rating Form */}
                        {ratingSessionId === session.id && (
                          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-harbor-800">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setRatingValue(star)} className={cn('text-lg', star <= ratingValue ? 'text-yellow-500' : 'text-gray-300')}>⭐</button>
                              ))}
                            </div>
                            <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="How was your experience? (optional)" className="input-field resize-none text-xs" rows={2} />
                            <div className="flex gap-2">
                              <button onClick={() => rateCoach(session.id)} className="btn-teal text-xs flex-1">Submit Rating</button>
                              <button onClick={() => setRatingSessionId(null)} className="text-xs text-gray-400">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Cancelled */}
                {sessions.filter(s => s.status === 'cancelled').length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-400">Cancelled</h3>
                    {sessions.filter(s => s.status === 'cancelled').map(session => (
                      <div key={session.id} className="card opacity-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">{session.coach_name}</p>
                            <p className="text-[10px] text-gray-400">{new Date(session.scheduled_at).toLocaleDateString()}</p>
                          </div>
                          <span className="text-[10px] text-gray-400">Cancelled</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          }
        </div>
      )}
    </div>
  );
}
