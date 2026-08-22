'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Recording {
  id: string;
  category: string | null;
  ai_category_suggestion: string | null;
  description: string | null;
  status: string;
  reward_mly: number;
  privacy_level: string;
  created_at: string;
}

const CATEGORIES = [
  { value: 'infrastructure', label: '🚧 Infrastructure', desc: 'Potholes, broken lights, damaged roads' },
  { value: 'safety', label: '🚨 Safety Concern', desc: 'Hazards, suspicious activity, unsafe conditions' },
  { value: 'police_encounter', label: '👮 Police Encounter', desc: 'Private — only you can access' },
  { value: 'community_win', label: '🎉 Community Win', desc: 'Good news, celebrations, progress' },
  { value: 'emergency', label: '🆘 Emergency', desc: 'Active danger — routes to 911 suggestion' },
  { value: 'other', label: '📹 Other', desc: 'General community documentation' },
];

const PRIVACY_LEVELS = [
  { value: 'public', label: 'Public', desc: 'Anyone can see' },
  { value: 'community', label: 'Community', desc: 'Only MiLyfe members' },
  { value: 'private', label: 'Private', desc: 'Only you + routed personnel' },
];

export default function RecordPage() {
  const [tab, setTab] = useState<'record' | 'my-recordings'>('record');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Upload form
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState('community');
  const [blurFaces, setBlurFaces] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const { user } = useAppStore();

  useEffect(() => {
    if (user) loadRecordings();
  }, [user]);

  async function loadRecordings() {
    const supabase = createClient();
    const { data } = await supabase
      .from('community_recordings')
      .select('*')
      .eq('recorder_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setRecordings(data);
    setLoading(false);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(1000); // Capture every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      alert('Camera/microphone permission required to record.');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function handleUpload() {
    if (!user || !recordedBlob || !category) return;
    setUploading(true);

    const supabase = createClient();
    const filename = `${user.id}/${Date.now()}.webm`;

    // Upload video
    const { error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(filename, recordedBlob);

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(filename);

    // Get GPS if available
    let lat: number | null = null;
    let lng: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // GPS not available
    }

    // Create recording record
    await supabase.from('community_recordings').insert({
      recorder_id: user.id,
      video_url: urlData.publicUrl,
      category,
      description: description.trim() || null,
      privacy_level: privacyLevel,
      faces_blurred: blurFaces,
      lat,
      lng,
    });

    // Reset state
    setRecordedBlob(null);
    setRecordedUrl(null);
    setCategory('');
    setDescription('');
    setDuration(0);
    setUploading(false);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
    loadRecordings();
  }

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">📹 Community Record</h1>
        <p className="text-xs text-gray-500">Record. Categorize. Get rewarded. Help your community.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('record')}
          className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-all', tab === 'record' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}
        >
          🔴 Record
        </button>
        <button
          onClick={() => setTab('my-recordings')}
          className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-all', tab === 'my-recordings' ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}
        >
          📋 My Recordings ({recordings.length})
        </button>
      </div>

      {uploadSuccess && (
        <div className="card bg-green-50 dark:bg-green-900/10 border-green-200 text-center py-3">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            ✓ Recording submitted! You&apos;ll be notified when it&apos;s reviewed and rewarded.
          </p>
        </div>
      )}

      {/* Record tab */}
      {tab === 'record' && (
        <div className="space-y-4">
          {/* Recording controls */}
          {!recordedBlob ? (
            <div className="card text-center py-8">
              {!isRecording ? (
                <>
                  <button
                    onClick={startRecording}
                    className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white text-2xl mx-auto flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-105"
                  >
                    ⏺
                  </button>
                  <p className="text-sm text-gray-500 mt-4">Tap to start recording</p>
                  <p className="text-xs text-gray-400 mt-1">Camera + microphone access required</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-red-500 text-white text-2xl mx-auto flex items-center justify-center animate-pulse">
                    🔴
                  </div>
                  <p className="text-lg font-bold text-red-600 mt-3">{formatDuration(duration)}</p>
                  <button
                    onClick={stopRecording}
                    className="mt-4 px-6 py-2 bg-harbor-800 text-white rounded-full text-sm font-medium"
                  >
                    ⏹ Stop Recording
                  </button>
                </>
              )}
            </div>
          ) : (
            // Post-recording: categorize and upload
            <div className="space-y-4">
              {/* Preview */}
              <div className="card p-0 overflow-hidden">
                <video
                  src={recordedUrl!}
                  controls
                  className="w-full aspect-video bg-black"
                />
                <div className="p-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Duration: {formatDuration(duration)}</span>
                  <button
                    onClick={() => { setRecordedBlob(null); setRecordedUrl(null); setDuration(0); }}
                    className="text-xs text-red-500 font-medium"
                  >
                    Discard & Re-record
                  </button>
                </div>
              </div>

              {/* Category selection */}
              <div className="card space-y-3">
                <h3 className="text-sm font-bold text-harbor-800 dark:text-white">What did you record?</h3>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-lg border transition-all',
                        category === cat.value
                          ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20'
                          : 'border-gray-200 dark:border-harbor-700 hover:border-gray-300'
                      )}
                    >
                      <p className="text-sm font-medium text-harbor-800 dark:text-white">{cat.label}</p>
                      <p className="text-xs text-gray-500">{cat.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              {category && (
                <div className="card space-y-3">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description (optional)..."
                    className="input-field resize-none"
                    rows={2}
                  />

                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">Privacy</label>
                    <div className="flex gap-2">
                      {PRIVACY_LEVELS.map((pl) => (
                        <button
                          key={pl.value}
                          onClick={() => setPrivacyLevel(pl.value)}
                          className={cn(
                            'flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all text-center',
                            privacyLevel === pl.value
                              ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 text-teal-700'
                              : 'border-gray-200 dark:border-harbor-700 text-gray-600'
                          )}
                        >
                          {pl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={blurFaces}
                      onChange={(e) => setBlurFaces(e.target.checked)}
                      className="rounded"
                    />
                    Blur faces (AI processing — may take longer)
                  </label>

                  {category === 'emergency' && (
                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                        🆘 If this is an active emergency, call 911 first. This recording will be flagged for priority review.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn-teal w-full"
                  >
                    {uploading ? '📤 Uploading...' : '📤 Submit Recording'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* My Recordings tab */}
      {tab === 'my-recordings' && (
        <div className="space-y-3">
          {loading ? (
            <div className="card skeleton h-32" />
          ) : recordings.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">📹</p>
              <p className="text-sm text-gray-500">No recordings yet.</p>
              <p className="text-xs text-gray-400 mt-1">Record something to help your community and earn $MLY.</p>
            </div>
          ) : recordings.map((rec) => (
            <div key={rec.id} className="card flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-harbor-800 flex items-center justify-center text-xl flex-shrink-0">
                {CATEGORIES.find(c => c.value === rec.category)?.label.split(' ')[0] || '📹'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white capitalize">
                  {rec.category?.replace(/_/g, ' ') || 'Uncategorized'}
                </p>
                <p className="text-xs text-gray-500 truncate">{rec.description || 'No description'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    rec.status === 'rewarded' ? 'bg-green-100 text-green-600' :
                    rec.status === 'routed' ? 'bg-blue-100 text-blue-600' :
                    rec.status === 'rejected' ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-600'
                  )}>
                    {rec.status}
                  </span>
                  {rec.reward_mly > 0 && (
                    <span className="text-xs text-green-600 font-medium">+${rec.reward_mly} MLY</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-400">{new Date(rec.created_at).toLocaleDateString()}</span>
            </div>
          ))}

          {/* Reward info */}
          <div className="card bg-mly-50 dark:bg-mly-900/10 border-mly-200 dark:border-mly-800">
            <h3 className="text-sm font-bold text-mly-700 dark:text-mly-400 mb-1">💰 How Rewards Work</h3>
            <ul className="text-xs text-mly-600 dark:text-mly-300 space-y-1">
              <li>• Infrastructure reports: $5-15 MLY (based on severity)</li>
              <li>• Safety reports: $10-25 MLY (verified by community)</li>
              <li>• Community wins: $5 MLY (shared to feed)</li>
              <li>• Recordings routed to proper personnel get bonus rewards</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
