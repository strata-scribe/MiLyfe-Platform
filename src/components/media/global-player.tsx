'use client';

import { useRef, useEffect, useState } from 'react';
import { create } from 'zustand';
import { cn } from '@/lib/utils/cn';

// Global media state (persists across page navigations)
interface MediaState {
  track: { id: string; title: string; artist: string; src: string; thumbnail?: string | null; type: 'music' | 'podcast_episode' | 'radio_recording' } | null;
  playing: boolean;
  setTrack: (track: MediaState['track']) => void;
  setPlaying: (playing: boolean) => void;
  stop: () => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  track: null,
  playing: false,
  setTrack: (track) => set({ track, playing: true }),
  setPlaying: (playing) => set({ playing }),
  stop: () => set({ track: null, playing: false }),
}));

export function GlobalPlayer() {
  const { track, playing, setPlaying, stop } = useMediaStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  // Sync audio element with state
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track) return;

    el.src = track.src;
    el.load();
    if (playing) el.play().catch(() => {});
  }, [track?.id]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.play().catch(() => {});
    else el.pause();
  }, [playing]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTime = () => setCurrentTime(el.currentTime);
    const onMeta = () => setDuration(el.duration);
    const onEnd = () => setPlaying(false);

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnd);
    };
  }, [setPlaying]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    const bar = progressRef.current;
    if (!el || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    el.currentTime = pct * el.duration;
  };

  const formatTime = (s: number) => {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio ref={audioRef} preload="metadata" />
      <div className="fixed bottom-16 left-0 right-0 z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-2">
          <div className="bg-harbor-900 dark:bg-harbor-950 text-white rounded-2xl shadow-2xl border border-harbor-700 overflow-hidden">
            {/* Thin progress bar on top */}
            <div
              ref={progressRef}
              className="h-1 bg-harbor-700 cursor-pointer"
              onClick={handleSeek}
            >
              <div className="h-full bg-teal-400 transition-all" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5">
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-lg bg-harbor-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {track.thumbnail ? <img src={track.thumbnail} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">🎵</span>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{track.title}</p>
                <p className="text-[10px] text-harbor-300 truncate">{track.artist} · {formatTime(currentTime)}/{formatTime(duration)}</p>
              </div>

              {/* Controls */}
              <button onClick={() => setPlaying(!playing)} className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center hover:bg-teal-400 active:scale-95 transition-all">
                {playing ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                  <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>

              <button onClick={stop} className="w-8 h-8 flex items-center justify-center text-harbor-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
