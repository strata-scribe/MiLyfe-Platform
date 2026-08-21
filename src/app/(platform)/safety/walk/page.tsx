'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

export default function WalkWithMePage() {
  const [active, setActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [contactId, setContactId] = useState('');
  const [contactName, setContactName] = useState('');
  const [resolvedContact, setResolvedContact] = useState<{ id: string; name: string } | null>(null);
  const [elapsedMin, setElapsedMin] = useState(0);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [status, setStatus] = useState<'idle' | 'starting' | 'active' | 'stopped'>('idle');
  const pingRef = useRef<NodeJS.Timeout | null>(null);
  const alertRef = useRef<NodeJS.Timeout | null>(null);
  const startRef = useRef<Date | null>(null);
  const { user } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  const resolveContact = async () => {
    if (!contactId.trim()) return;
    const { data } = await supabase.from('profiles').select('id, display_name').or(`email.eq.${contactId.trim()},display_name.ilike.${contactId.trim()}`).limit(1).maybeSingle();
    if (data) { setResolvedContact({ id: data.id, name: data.display_name }); }
    else { alert('User not found. Enter their email or display name.'); }
  };

  const startWalk = async () => {
    if (!user) return;
    setStatus('starting');
    let lat: number | null = null, lng: number | null = null;
    try { const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })); lat = pos.coords.latitude; lng = pos.coords.longitude; } catch {}

    const { data } = await supabase.from('walk_sessions').insert({ user_id: user.id, contact_id: resolvedContact?.id || null, started_at: new Date().toISOString(), last_ping: new Date().toISOString(), location_lat: lat, location_lng: lng }).select().single();

    if (data) {
      setSessionId(data.id);
      setActive(true);
      setStatus('active');
      startRef.current = new Date();

      // Notify contact
      if (resolvedContact) {
        await supabase.from('notifications').insert({ user_id: resolvedContact.id, type: 'system', title: `${user.display_name} started a walk`, body: `They shared their location with you. You'll be alerted if they stop moving.`, link: '/connect' });
      }

      // Ping location every 2 minutes
      pingRef.current = setInterval(async () => {
        try { const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })); await supabase.from('walk_sessions').update({ last_ping: new Date().toISOString(), location_lat: pos.coords.latitude, location_lng: pos.coords.longitude }).eq('id', data.id); setLastPing(new Date()); } catch {}
        setElapsedMin(m => m + 2);
      }, 2 * 60 * 1000);

      // Alert if no ping for 10 minutes
      alertRef.current = setInterval(async () => {
        if (lastPing && Date.now() - lastPing.getTime() > 10 * 60 * 1000) {
          await supabase.from('walk_sessions').update({ status: 'alert_sent' }).eq('id', data.id);
          if (resolvedContact) { await supabase.from('notifications').insert({ user_id: resolvedContact.id, type: 'system', title: '⚠️ Check on your contact!', body: `${user.display_name} hasn't moved in 10 minutes. Please check on them.`, link: '/connect' }); }
        }
      }, 5 * 60 * 1000);
    }
  };

  const stopWalk = async () => {
    if (pingRef.current) clearInterval(pingRef.current);
    if (alertRef.current) clearInterval(alertRef.current);
    if (sessionId) { await supabase.from('walk_sessions').update({ ended_at: new Date().toISOString(), status: 'completed' }).eq('id', sessionId); }
    if (resolvedContact && user) { await supabase.from('notifications').insert({ user_id: resolvedContact.id, type: 'system', title: `${user.display_name} arrived safely`, body: 'Walk-with-me session ended.', link: '/connect' }); }
    setActive(false); setStatus('stopped'); setSessionId(null); setElapsedMin(0);
  };

  useEffect(() => { return () => { if (pingRef.current) clearInterval(pingRef.current); if (alertRef.current) clearInterval(alertRef.current); }; }, []);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/safety')} className="text-teal-500 text-sm">← Safety</button>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Walk With Me</h1>
      </div>

      <div className="card bg-harbor-50 dark:bg-harbor-900 border-harbor-200 dark:border-harbor-700">
        <p className="text-xs text-gray-600 dark:text-gray-300">Share your live location with a trusted contact while walking. If you stop moving for 10 minutes, they get an automatic alert.</p>
      </div>

      {status === 'stopped' ? (
        <div className="text-center py-8">
          <p className="text-4xl mb-2">✅</p>
          <p className="font-bold text-harbor-800 dark:text-white">Arrived safely</p>
          <p className="text-xs text-gray-500 mt-1">{resolvedContact?.name} was notified.</p>
          <button onClick={() => { setStatus('idle'); setResolvedContact(null); setContactId(''); }} className="btn-teal mt-4 text-sm">Start Another Walk</button>
        </div>
      ) : active ? (
        <div className="space-y-4">
          <div className={cn('card text-center py-8 border-2', 'border-teal-500 bg-teal-50 dark:bg-teal-900/10')}>
            <div className="w-4 h-4 bg-teal-500 rounded-full mx-auto animate-pulse mb-3" />
            <p className="text-lg font-bold text-teal-600">Walk Active</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{resolvedContact?.name} is watching</p>
            <p className="text-xs text-gray-400 mt-0.5">{elapsedMin > 0 ? `${elapsedMin} minutes` : 'Just started'}</p>
          </div>
          <button onClick={stopWalk} className="btn-teal w-full">I Arrived Safely</button>
          <a href="tel:911" className="btn-primary w-full text-center block">🚨 Emergency — Call 911</a>
        </div>
      ) : (
        <div className="space-y-4">
          {!resolvedContact ? (
            <div className="card space-y-3">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Who should watch over you?</p>
              <input type="text" value={contactId} onChange={e => setContactId(e.target.value)} className="input-field !py-2 text-sm" placeholder="Email or display name" />
              <button onClick={resolveContact} disabled={!contactId.trim()} className="btn-primary w-full text-sm disabled:opacity-50">Find Contact</button>
            </div>
          ) : (
            <div className="card space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{resolvedContact.name}</p>
                  <p className="text-xs text-gray-500">Will be notified if you stop moving</p>
                </div>
                <button onClick={() => setResolvedContact(null)} className="text-xs text-gray-400">✕</button>
              </div>
              <button onClick={startWalk} disabled={status === 'starting'} className="btn-teal w-full disabled:opacity-50">
                {status === 'starting' ? 'Starting...' : '🚶 Start Walk'}
              </button>
            </div>
          )}

          <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Emergency?</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <a href="tel:911" className="py-2 bg-red-500 text-white rounded-xl text-center text-sm font-medium">Call 911</a>
              <a href="tel:988" className="py-2 bg-purple-500 text-white rounded-xl text-center text-sm font-medium">Call 988</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
