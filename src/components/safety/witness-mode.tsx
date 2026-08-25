'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Witness Mode — Audio recording that streams to encrypted storage.
 * Uses MediaRecorder API for browser-native audio capture.
 */
export function WitnessMode() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  async function startRecording() {
    setError(null);
    setAudioBlob(null);
    setSaved(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setDuration(0);

      intervalRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      setError('Microphone access denied. Enable it in browser settings.');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRecording(false);
  }

  async function saveRecording() {
    if (!audioBlob) return;

    // In production: upload to encrypted Supabase Storage
    // For MVP: save as downloadable file
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `witness-${new Date().toISOString().slice(0, 19)}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
  }

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <span>🎙️</span> Witness Mode
      </h3>
      <p className="text-sm text-muted-foreground">
        Record audio as evidence. The recording is yours — stored on your device, not shared with anyone unless you choose.
      </p>

      {!isRecording && !audioBlob && (
        <button
          onClick={startRecording}
          className="w-full rounded-md bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700"
        >
          Start Recording
        </button>
      )}

      {isRecording && (
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-lg font-mono font-bold">{formatDuration(duration)}</span>
          </div>
          <button
            onClick={stopRecording}
            className="w-full rounded-md border-2 border-red-500 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Stop Recording
          </button>
        </div>
      )}

      {audioBlob && !saved && (
        <div className="space-y-3">
          <div className="rounded-md bg-muted p-3 text-center">
            <p className="text-sm font-medium">Recording complete: {formatDuration(duration)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Size: {(audioBlob.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveRecording}
              className="flex-1 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground"
            >
              Save to Device
            </button>
            <button
              onClick={() => { setAudioBlob(null); setDuration(0); }}
              className="rounded-md border px-4 py-2.5 text-sm text-muted-foreground"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-center">
          <p className="text-sm text-green-700">Recording saved to your device ✓</p>
          <button
            onClick={() => { setAudioBlob(null); setSaved(false); setDuration(0); }}
            className="mt-2 text-xs text-green-600 hover:underline"
          >
            Record another
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <p className="text-xs text-muted-foreground">
        Two-party consent: In some states, recording others requires their consent.
        You are responsible for knowing your local laws.
      </p>
    </div>
  );
}
