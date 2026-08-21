'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

interface PlayerProps {
  src: string;
  type: 'video' | 'audio';
  title?: string;
  artist?: string;
  poster?: string | null;
  onEnded?: () => void;
  onPlay?: () => void;
  autoPlay?: boolean;
  className?: string;
}

export function MediaPlayer({ src, type, title, artist, poster, onEnded, onPlay, autoPlay, className }: PlayerProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  // Format time MM:SS or HH:MM:SS
  const formatTime = (s: number) => {
    if (isNaN(s)) return '0:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Play/pause toggle
  const togglePlay = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setPlaying(true);
      onPlay?.();
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [onPlay]);

  // Seek
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = mediaRef.current;
    const bar = progressRef.current;
    if (!el || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    el.currentTime = pct * el.duration;
  };

  // Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (mediaRef.current) {
      mediaRef.current.volume = v;
      setMuted(v === 0);
    }
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // Playback speed
  const cycleSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(playbackRate);
    const next = speeds[(idx + 1) % speeds.length];
    setPlaybackRate(next);
    if (mediaRef.current) mediaRef.current.playbackRate = next;
  };

  // Skip ±10s
  const skip = (seconds: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = Math.max(0, Math.min(mediaRef.current.duration, mediaRef.current.currentTime + seconds));
    }
  };

  // Auto-hide controls for video
  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (type === 'video' && playing) {
      hideTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': e.preventDefault(); skip(10); break;
        case 'ArrowLeft': e.preventDefault(); skip(-10); break;
        case 'ArrowUp': e.preventDefault(); setVolume(v => { const nv = Math.min(1, v + 0.1); if (mediaRef.current) mediaRef.current.volume = nv; return nv; }); break;
        case 'ArrowDown': e.preventDefault(); setVolume(v => { const nv = Math.max(0, v - 0.1); if (mediaRef.current) mediaRef.current.volume = nv; return nv; }); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 'm': e.preventDefault(); toggleMute(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlay]);

  // Time update listener
  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;

    const onTime = () => { if (!seeking) setCurrentTime(el.currentTime); };
    const onDuration = () => setDuration(el.duration);
    const onBuffer = () => {
      if (el.buffered.length > 0) {
        setBuffered(el.buffered.end(el.buffered.length - 1));
      }
    };
    const onEnd = () => { setPlaying(false); onEnded?.(); };
    const onPlayEvent = () => setPlaying(true);
    const onPauseEvent = () => setPlaying(false);

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onDuration);
    el.addEventListener('progress', onBuffer);
    el.addEventListener('ended', onEnd);
    el.addEventListener('play', onPlayEvent);
    el.addEventListener('pause', onPauseEvent);

    if (autoPlay) { el.play().catch(() => {}); }

    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onDuration);
      el.removeEventListener('progress', onBuffer);
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('play', onPlayEvent);
      el.removeEventListener('pause', onPauseEvent);
    };
  }, [seeking, autoPlay, onEnded]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  // ===== VIDEO PLAYER =====
  if (type === 'video') {
    return (
      <div
        ref={containerRef}
        className={cn('relative bg-black rounded-xl overflow-hidden group', fullscreen ? 'fixed inset-0 z-[100] rounded-none' : 'aspect-video', className)}
        onMouseMove={resetHideTimer}
        onMouseLeave={() => playing && setShowControls(false)}
        onClick={togglePlay}
      >
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          poster={poster || undefined}
          className="w-full h-full object-contain"
          playsInline
          preload="metadata"
        />

        {/* Play overlay (when paused) */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-harbor-800 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        )}

        {/* Controls overlay */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-12 transition-opacity duration-300',
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="relative h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/progress hover:h-2.5 transition-all"
            onClick={handleProgressClick}
          >
            <div className="absolute inset-y-0 left-0 bg-white/30 rounded-full" style={{ width: `${bufferProgress}%` }} />
            <div className="absolute inset-y-0 left-0 bg-teal-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-teal-400 rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity" style={{ left: `${progress}%`, marginLeft: '-7px' }} />
          </div>

          {/* Bottom controls */}
          <div className="flex items-center gap-3 text-white text-sm">
            <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform">
              {playing ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            <button onClick={() => skip(-10)} className="text-xs opacity-70 hover:opacity-100">-10s</button>
            <button onClick={() => skip(10)} className="text-xs opacity-70 hover:opacity-100">+10s</button>

            <span className="text-xs font-mono opacity-80">{formatTime(currentTime)} / {formatTime(duration)}</span>

            <div className="flex-1" />

            <button onClick={cycleSpeed} className="text-xs opacity-70 hover:opacity-100 font-medium">{playbackRate}x</button>

            <div className="flex items-center gap-1">
              <button onClick={toggleMute} className="opacity-70 hover:opacity-100">
                {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={handleVolumeChange} className="w-16 h-1 accent-teal-400" />
            </div>

            <button onClick={toggleFullscreen} className="opacity-70 hover:opacity-100">
              {fullscreen ? '⊖' : '⊕'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== AUDIO PLAYER =====
  return (
    <div className={cn('bg-white dark:bg-harbor-900 rounded-xl border border-gray-100 dark:border-harbor-700 p-4', className)}>
      <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={src} preload="metadata" />

      {/* Info + Controls */}
      <div className="flex items-center gap-4">
        {/* Album art / poster */}
        <div className="w-14 h-14 rounded-lg bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {poster ? <img src={poster} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🎵</span>}
        </div>

        <div className="flex-1 min-w-0">
          {title && <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{title}</p>}
          {artist && <p className="text-xs text-gray-500 truncate">{artist}</p>}

          {/* Progress */}
          <div className="mt-2">
            <div
              ref={progressRef}
              className="relative h-1.5 bg-gray-200 dark:bg-harbor-700 rounded-full cursor-pointer hover:h-2 transition-all"
              onClick={handleProgressClick}
            >
              <div className="absolute inset-y-0 left-0 bg-gray-300 dark:bg-harbor-600 rounded-full" style={{ width: `${bufferProgress}%` }} />
              <div className="absolute inset-y-0 left-0 bg-teal-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400 font-mono">{formatTime(currentTime)}</span>
              <span className="text-[10px] text-gray-400 font-mono">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <button onClick={() => skip(-10)} className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-harbor-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-harbor-800 transition-colors text-xs">
          -10
        </button>
        <button onClick={togglePlay} className="w-12 h-12 flex items-center justify-center rounded-full bg-teal-500 text-white shadow-lg hover:bg-teal-600 active:scale-95 transition-all">
          {playing ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        <button onClick={() => skip(10)} className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-harbor-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-harbor-800 transition-colors text-xs">
          +10
        </button>
        <button onClick={cycleSpeed} className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-harbor-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-harbor-800 transition-colors text-[10px] font-bold">
          {playbackRate}x
        </button>
        <div className="flex items-center gap-1">
          <button onClick={toggleMute} className="text-sm text-gray-400 hover:text-harbor-800 dark:hover:text-white">
            {muted || volume === 0 ? '🔇' : '🔊'}
          </button>
          <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={handleVolumeChange} className="w-16 h-1 accent-teal-500" />
        </div>
      </div>
    </div>
  );
}
