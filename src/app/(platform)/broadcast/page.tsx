'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useStanding } from '@/lib/standing/use-standing';
import { cn } from '@/lib/utils/cn';

interface Broadcast {
  id: string;
  sender_id: string;
  type: string;
  severity: string;
  title: string;
  body: string;
  geo_zone: string | null;
  acknowledged_count: number;
  expires_at: string;
  created_at: string;
  profiles?: { display_name: string };
}

const BROADCAST_TYPES = [
  { value: 'weather', label: '🌪️ Weather', color: 'bg-blue-500' },
  { value: 'safety', label: '🚨 Safety', color: 'bg-red-500' },
  { value: 'infrastructure', label: '🚧 Infrastructure', color: 'bg-amber-500' },
  { value: 'health', label: '🏥 Health', color: 'bg-green-500' },
  { value: 'community', label: '📢 Community', color: 'bg-purple-500' },
];

const SEVERITY_LEVELS = [
  { value: 'info', label: 'Info', icon: 'ℹ️', color: 'border-blue-300 bg-blue-50 dark:bg-blue-900/10' },
  { value: 'warning', label: 'Warning', icon: '⚠️', color: 'border-amber-300 bg-amber-50 dark:bg-amber-900/10' },
  { value: 'critical', label: 'Critical', icon: '🔴', color: 'border-red-300 bg-red-50 dark:bg-red-900/10' },
];

export default function BroadcastPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  // Create form
  const [type, setType] = useState('community');
  const [severity, setSeverity] = useState('info');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [geoZone, setGeoZone] = useState('');
  const [duration, setDuration] = useState('24');
  const [sending, setSending] = useState(false);

  const { user } = useAppStore();
  const { level } = useStanding();
  const canBroadcast = level.level >= 5;

  useEffect(() => {
    loadBroadcasts();
  }, []);

  async function loadBroadcasts() {
    const supabase = createClient();
    const { data } = await supabase
      .from('broadcasts')
      .select('*, profiles!broadcasts_sender_id_fkey(display_name)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (data) setBroadcasts(data as any);

    // Check which ones user has acknowledged
    if (user) {
      const { data: acks } = await supabase
        .from('broadcast_acks')
        .select('broadcast_id')
        .eq('user_id', user.id);
      if (acks) {
        setAcknowledged(new Set(acks.map((a) => a.broadcast_id)));
      }
    }
    setLoading(false);
  }

  async function handleAcknowledge(broadcastId: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('broadcast_acks').insert({
      broadcast_id: broadcastId,
      user_id: user.id,
    });
    setAcknowledged((prev) => { const next = new Set(Array.from(prev)); next.add(broadcastId); return next; });
    setBroadcasts((prev) =>
      prev.map((b) => b.id === broadcastId ? { ...b, acknowledged_count: b.acknowledged_count + 1 } : b)
    );
  }

  async function handleSendBroadcast() {
    if (!user || !title.trim() || !body.trim()) return;
    setSending(true);

    const supabase = createClient();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + parseInt(duration));

    const { error } = await supabase.from('broadcasts').insert({
      sender_id: user.id,
      type,
      severity,
      title: title.trim(),
      body: body.trim(),
      geo_zone: geoZone.trim() || null,
      expires_at: expiresAt.toISOString(),
    });

    if (!error) {
      setTitle('');
      setBody('');
      setGeoZone('');
      setShowCreate(false);
      loadBroadcasts();
    }
    setSending(false);
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Emergency Broadcasts</h1>
          <p className="text-xs text-gray-500">Community alerts and emergency notifications</p>
        </div>
        {canBroadcast && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-xs">
            📢 New Broadcast
          </button>
        )}
      </div>

      {/* Level requirement notice */}
      {!canBroadcast && user && (
        <div className="card bg-gray-50 dark:bg-harbor-900 border-gray-200 dark:border-harbor-700">
          <p className="text-xs text-gray-500">
            🔒 Broadcasting requires <strong>Level 5 (Leader)</strong> standing. 
            Your current level: {level.icon} {level.name}
          </p>
        </div>
      )}

      {/* Create form */}
      {showCreate && canBroadcast && (
        <div className="card space-y-4 border-2 border-red-200 dark:border-red-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">📢 Send Emergency Broadcast</h3>
          <p className="text-xs text-gray-500">This will notify all users in the selected area. Use responsibly.</p>

          {/* Type */}
          <div className="flex flex-wrap gap-2">
            {BROADCAST_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  type === t.value ? `${t.color} text-white` : 'bg-gray-100 dark:bg-harbor-800 text-gray-600'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Severity */}
          <div className="flex gap-2">
            {SEVERITY_LEVELS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSeverity(s.value)}
                className={cn(
                  'flex-1 py-2 rounded-lg border-2 text-xs font-medium transition-all',
                  severity === s.value ? s.color : 'border-gray-200 dark:border-harbor-700'
                )}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Alert title (short and clear)"
            className="input-field"
            maxLength={80}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What do people need to know? Include actions they should take."
            className="input-field resize-none"
            rows={3}
            maxLength={500}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Area (optional)</label>
              <input
                type="text"
                value={geoZone}
                onChange={(e) => setGeoZone(e.target.value)}
                placeholder="e.g. Northside, 32209"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Expires in</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input-field"
              >
                <option value="1">1 hour</option>
                <option value="6">6 hours</option>
                <option value="24">24 hours</option>
                <option value="72">3 days</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSendBroadcast}
              disabled={!title.trim() || !body.trim() || sending}
              className="btn-primary flex-1 !bg-red-600 hover:!bg-red-700"
            >
              {sending ? 'Sending...' : '🚨 Send Broadcast'}
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active broadcasts */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="card skeleton h-32" />)}
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-sm text-gray-500">No active alerts. All clear.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b) => {
            const severityInfo = SEVERITY_LEVELS.find((s) => s.value === b.severity);
            const typeInfo = BROADCAST_TYPES.find((t) => t.value === b.type);
            const isAcked = acknowledged.has(b.id);

            return (
              <div
                key={b.id}
                className={cn(
                  'card border-2 transition-all',
                  severityInfo?.color || 'border-gray-200',
                  isAcked && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('w-2 h-2 rounded-full', typeInfo?.color || 'bg-gray-400')} />
                      <span className="text-xs text-gray-500 capitalize">{b.type}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">
                        {b.profiles?.display_name || 'Community Leader'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{b.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{b.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {b.geo_zone && <span>📍 {b.geo_zone}</span>}
                      <span>👁️ {b.acknowledged_count} acknowledged</span>
                      <span>⏱️ Expires {new Date(b.expires_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Acknowledge button */}
                {user && !isAcked && (
                  <button
                    onClick={() => handleAcknowledge(b.id)}
                    className="mt-3 w-full py-2 text-xs font-medium bg-harbor-800 text-white rounded-lg hover:bg-harbor-700 transition-colors"
                  >
                    ✓ I've Seen This
                  </button>
                )}
                {isAcked && (
                  <p className="mt-2 text-xs text-green-600 text-center">✓ Acknowledged</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
