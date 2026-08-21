'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface Interaction {
  id: string;
  date: string;
  location: string | null;
  officer_name: string | null;
  badge_number: string | null;
  unit_number: string | null;
  interaction_type: string;
  description: string;
  outcome: string | null;
  created_at: string;
}

type View = 'active' | 'log' | 'form';

export default function PolicePage() {
  const [view, setView] = useState<View>('active');
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Badge capture form
  const [officerName, setOfficerName] = useState('');
  const [badgeNum, setBadgeNum] = useState('');
  const [unitNum, setUnitNum] = useState('');
  const [intType, setIntType] = useState('traffic_stop');
  const [description, setDescription] = useState('');
  const [outcome, setOutcome] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  // Load interaction history
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('police_interactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (data) setInteractions(data);
      setLoading(false);
    };
    load();
  }, [user, supabase, saving]);

  // Start silent recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // Upload to vault (private)
        if (user) {
          const fileName = `${user.id}/recording-${Date.now()}.webm`;
          await supabase.storage.from('vault').upload(fileName, blob);
        }
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch {
      alert('Microphone access denied. Enable it in browser settings to record.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Get location
  const captureLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
        () => setLocation('Location unavailable')
      );
    }
  };

  // Save interaction
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    await supabase.from('police_interactions').insert({
      user_id: user.id,
      location: location || null,
      officer_name: officerName.trim() || null,
      badge_number: badgeNum.trim() || null,
      unit_number: unitNum.trim() || null,
      interaction_type: intType,
      description: description.trim(),
      outcome: outcome.trim() || null,
    });

    setOfficerName(''); setBadgeNum(''); setUnitNum('');
    setDescription(''); setOutcome(''); setLocation('');
    setSaving(false);
    setView('log');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/rights')} className="text-teal-500 text-sm">← Rights</button>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Police Interaction</h1>
      </div>

      {/* Active Stop Mode */}
      {view === 'active' && (
        <div className="space-y-4">
          {/* Recording Control */}
          <div className={cn('card text-center py-6', recording && 'border-2 border-red-500 bg-red-50 dark:bg-red-900/10')}>
            {recording ? (
              <>
                <div className="w-4 h-4 bg-red-500 rounded-full mx-auto animate-pulse-soft mb-3" />
                <p className="text-lg font-bold text-red-600">Recording — {formatTime(recordingTime)}</p>
                <p className="text-xs text-gray-500 mt-1">Audio saving to your encrypted vault</p>
                <button onClick={stopRecording} className="mt-4 px-6 py-3 bg-red-500 text-white rounded-xl font-medium">
                  Stop Recording
                </button>
              </>
            ) : (
              <>
                <p className="text-3xl mb-2">🎙️</p>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Silent Record</p>
                <p className="text-xs text-gray-500 mt-1">One tap — records audio to your private vault</p>
                <button onClick={startRecording} className="mt-4 px-6 py-3 bg-harbor-800 text-white rounded-xl font-medium">
                  Start Recording
                </button>
              </>
            )}
          </div>

          {/* Your Rights Reminder */}
          <div className="card bg-harbor-800 text-white">
            <p className="text-sm font-bold mb-2">Say these words:</p>
            <div className="space-y-2 text-sm">
              <p>&quot;I do not consent to a search.&quot;</p>
              <p>&quot;I am invoking my right to remain silent.&quot;</p>
              <p>&quot;Am I free to go?&quot;</p>
              <p>&quot;I want a lawyer.&quot;</p>
            </div>
            <p className="text-xs text-harbor-300 mt-3">Then STOP TALKING. Anything you say can be used against you.</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { captureLocation(); setView('form'); }} className="card text-center py-4 hover:scale-105 transition-transform">
              <span className="text-2xl">📝</span>
              <p className="text-xs font-medium mt-1">Log This Stop</p>
            </button>
            <a href="tel:9043568371" className="card text-center py-4 hover:scale-105 transition-transform">
              <span className="text-2xl">📞</span>
              <p className="text-xs font-medium mt-1">Call Legal Aid</p>
            </a>
          </div>

          <button onClick={() => setView('log')} className="btn-primary w-full text-sm">
            View Interaction History ({interactions.length})
          </button>
        </div>
      )}

      {/* Badge Capture Form */}
      {view === 'form' && (
        <form onSubmit={handleSave} className="card space-y-3">
          <h2 className="font-medium text-harbor-800 dark:text-white">Log Interaction</h2>
          <p className="text-xs text-gray-500">Capture details while they&apos;re fresh. This stays private in your vault.</p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Officer Name</label>
              <input type="text" value={officerName} onChange={e => setOfficerName(e.target.value)} className="input-field !py-2 text-sm" placeholder="If known" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Badge #</label>
              <input type="text" value={badgeNum} onChange={e => setBadgeNum(e.target.value)} className="input-field !py-2 text-sm" placeholder="Badge number" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Unit/Car #</label>
              <input type="text" value={unitNum} onChange={e => setUnitNum(e.target.value)} className="input-field !py-2 text-sm" placeholder="Unit number" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Type</label>
              <select value={intType} onChange={e => setIntType(e.target.value)} className="input-field !py-2 text-sm">
                <option value="traffic_stop">Traffic Stop</option>
                <option value="pedestrian_stop">Walked Up</option>
                <option value="home_visit">At My Door</option>
                <option value="arrest">Arrest</option>
                <option value="protest">At Protest</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-0.5">What happened?</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field !py-2 text-sm resize-none h-20" placeholder="Describe the interaction..." required />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Outcome</label>
            <input type="text" value={outcome} onChange={e => setOutcome(e.target.value)} className="input-field !py-2 text-sm" placeholder="Warning, ticket, arrested, let go..." />
          </div>

          {location && <p className="text-xs text-gray-400">📍 Location captured: {location}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-teal flex-1 disabled:opacity-50">{saving ? 'Saving...' : 'Save to Vault'}</button>
            <button type="button" onClick={() => setView('active')} className="btn-primary flex-1">Cancel</button>
          </div>
        </form>
      )}

      {/* Interaction Log */}
      {view === 'log' && (
        <div className="space-y-3">
          <button onClick={() => setView('active')} className="text-xs text-teal-500">← Back to tools</button>
          <h2 className="text-sm font-medium text-gray-500">Your Interaction History</h2>

          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-20" />) :
          interactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No interactions logged. Good.</p>
            </div>
          ) : interactions.map(int => (
            <div key={int.id} className="card space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-harbor-800 dark:text-white capitalize">{int.interaction_type.replace('_', ' ')}</p>
                <span className="text-[10px] text-gray-400">{new Date(int.date).toLocaleDateString()}</span>
              </div>
              {int.badge_number && <p className="text-xs text-gray-500">Badge: {int.badge_number} {int.unit_number && `· Unit: ${int.unit_number}`}</p>}
              {int.officer_name && <p className="text-xs text-gray-500">Officer: {int.officer_name}</p>}
              <p className="text-xs text-gray-600 dark:text-gray-300">{int.description}</p>
              {int.outcome && <p className="text-xs text-teal-600">Outcome: {int.outcome}</p>}
              {int.location && <p className="text-[10px] text-gray-400">📍 {int.location}</p>}
            </div>
          ))}

          <p className="text-[10px] text-gray-400 text-center">All data stored privately. Exportable as PDF for your lawyer.</p>
        </div>
      )}
    </div>
  );
}
