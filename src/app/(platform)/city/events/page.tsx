'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface Event { id: string; title: string; description: string; location: string | null; event_date: string; mly_reward: number; organizer_id: string; profiles?: { display_name: string }; rsvp_count?: number; checked_in?: boolean; rsvped?: boolean; }

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const { user } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('city_events').select('*, profiles!city_events_organizer_id_fkey(display_name)').gte('event_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).order('event_date', { ascending: true });
      if (data && user) {
        const { data: rsvps } = await supabase.from('event_rsvps').select('event_id').eq('user_id', user.id);
        const { data: checkins } = await supabase.from('event_checkins').select('event_id').eq('user_id', user.id);
        const rsvpSet = new Set((rsvps || []).map((r: any) => r.event_id));
        const checkinSet = new Set((checkins || []).map((c: any) => c.event_id));
        const enriched = await Promise.all(data.map(async (e) => {
          const { count } = await supabase.from('event_rsvps').select('*', { count: 'exact', head: true }).eq('event_id', e.id);
          return { ...e, rsvp_count: count ?? 0, rsvped: rsvpSet.has(e.id), checked_in: checkinSet.has(e.id) };
        }));
        setEvents(enriched);
      }
      setLoading(false);
    };
    load();
  }, [user, supabase]);

  const handleCheckIn = async (event: Event) => {
    if (!user) return;
    setActionId(event.id);
    const { error } = await supabase.from('event_checkins').insert({ event_id: event.id, user_id: user.id });
    if (!error && event.mly_reward > 0) {
      await supabase.from('mly_transactions').insert({ to_id: user.id, amount: event.mly_reward, type: 'earn', description: `Attended: ${event.title}` });
      await supabase.rpc('increment_balance', { user_id: user.id, amount: event.mly_reward });
      await supabase.from('event_checkins').update({ mly_paid: true }).eq('event_id', event.id).eq('user_id', user.id);
      await supabase.from('notifications').insert({ user_id: user.id, type: 'event', title: `+$${event.mly_reward} MLY earned!`, body: `Thanks for attending ${event.title}`, link: '/wallet' });
    }
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, checked_in: true } : e));
    setActionId(null);
  };

  const handleRSVP = async (eventId: string, rsvped: boolean) => {
    if (!user) return;
    setActionId(eventId);
    if (rsvped) { await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id); }
    else { await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: user.id }); }
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, rsvped: !rsvped, rsvp_count: (e.rsvp_count || 0) + (rsvped ? -1 : 1) } : e));
    setActionId(null);
  };

  const isHappeningNow = (dateStr: string) => { const d = new Date(dateStr); const now = new Date(); return Math.abs(d.getTime() - now.getTime()) < 4 * 60 * 60 * 1000; };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/city')} className="text-teal-500 text-sm">← City</button>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Community Events</h1>
      </div>
      {loading ? [1,2,3].map(i => <div key={i} className="card skeleton h-32" />) :
      events.length === 0 ? <div className="text-center py-12"><p className="text-4xl mb-2">📅</p><p className="text-gray-500">No upcoming events.</p></div> :
      events.map(event => (
        <div key={event.id} className="card space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{event.title}</h3>
                {isHappeningNow(event.event_date) && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse-soft">LIVE NOW</span>}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              {event.location && <p className="text-xs text-gray-400">📍 {event.location}</p>}
              <p className="text-xs text-gray-500">by {(event.profiles as any)?.display_name} · {event.rsvp_count} going</p>
            </div>
            {event.mly_reward > 0 && <span className="text-xs font-bold text-mly-600 bg-mly-50 dark:bg-mly-900/20 px-2 py-1 rounded-full">+${event.mly_reward}</span>}
          </div>
          {event.description && <p className="text-xs text-gray-600 dark:text-gray-300">{event.description}</p>}
          <div className="flex gap-2">
            {event.checked_in ? (
              <div className="flex-1 py-2 rounded-xl text-sm font-medium text-center bg-teal-100 dark:bg-teal-900/30 text-teal-700">✓ Checked In{event.mly_reward > 0 ? ` (+$${event.mly_reward} earned)` : ''}</div>
            ) : isHappeningNow(event.event_date) ? (
              <button onClick={() => handleCheckIn(event)} disabled={actionId === event.id} className="flex-1 btn-teal text-sm !py-2 disabled:opacity-50">
                {actionId === event.id ? '...' : `📍 Check In${event.mly_reward > 0 ? ` (+$${event.mly_reward})` : ''}`}
              </button>
            ) : (
              <button onClick={() => handleRSVP(event.id, !!event.rsvped)} disabled={actionId === event.id} className={cn('flex-1 text-sm !py-2 font-medium rounded-xl transition-all', event.rsvped ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 border border-teal-300 dark:border-teal-700' : 'btn-teal')}>
                {actionId === event.id ? '...' : event.rsvped ? '✓ Going' : 'RSVP'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
