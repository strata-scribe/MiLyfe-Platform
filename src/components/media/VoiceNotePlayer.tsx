'use client';

import * as React from 'react';
import { Play, Pause, FastForward, FileText, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

interface VoiceNotePlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  transcript?: string;
  waveform?: number[]; // Array of normalized values (0-1) for static visualization
}

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2];

export function VoiceNotePlayer({
  src,
  transcript,
  waveform = Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2), // Default random waveform if none provided
  className,
  ...props
}: VoiceNotePlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [speedIndex, setSpeedIndex] = React.useState(0);
  const [showTranscript, setShowTranscript] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);

  // Handle audio events
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleSpeed = () => {
    const nextIndex = (speedIndex + 1) % PLAYBACK_SPEEDS.length;
    setSpeedIndex(nextIndex);
    if (audioRef.current) {
      audioRef.current.playbackRate = PLAYBACK_SPEEDS[nextIndex];
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (parseFloat(e.target.value) / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      setProgress(parseFloat(e.target.value));
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-white dark:bg-harbor-900 border border-gray-200 dark:border-harbor-800 p-4 shadow-sm",
        className
      )}
      {...props}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <Button
          variant="default"
          size="icon"
          className="h-12 w-12 rounded-full shrink-0"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current ml-1" />
          )}
        </Button>

        {/* Waveform Visualization & Scrubber */}
        <div className="flex-1 flex flex-col gap-1 relative min-w-0">
          <div className="flex items-end h-8 gap-[2px] w-full relative group">
             {/* Invisible range input for accessibility and seeking */}
            <input
              type="range"
              min="0"
              max="100"
              value={progress || 0}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              aria-label="Seek time"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            />

            {waveform.map((barHeight, i) => {
              // Calculate if this bar should be filled based on progress
              const barProgress = (i / waveform.length) * 100;
              const isFilled = barProgress <= progress;

              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-full transition-colors duration-200",
                    isFilled
                      ? "bg-teal-500"
                      : "bg-gray-200 dark:bg-harbor-700"
                  )}
                  style={{
                    height: `${Math.max(15, barHeight * 100)}%`,
                  }}
                />
              );
            })}
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-100 dark:border-harbor-800">
        <div className="flex items-center gap-2">
          {/* Playback Speed */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-semibold rounded-lg"
            onClick={toggleSpeed}
            aria-label={`Playback speed: ${PLAYBACK_SPEEDS[speedIndex]}x`}
          >
            {PLAYBACK_SPEEDS[speedIndex]}x
          </Button>

          {/* Mute Toggle */}
           <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Transcript Toggle */}
        {transcript && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 text-xs rounded-lg gap-1.5",
              showTranscript && "bg-gray-100 dark:bg-harbor-800"
            )}
            onClick={() => setShowTranscript(!showTranscript)}
            aria-expanded={showTranscript}
            aria-controls="transcript-panel"
          >
            <FileText className="h-3.5 w-3.5" />
            Transcript
          </Button>
        )}
      </div>

      {/* Transcript Panel */}
      {transcript && showTranscript && (
        <div
          id="transcript-panel"
          className="mt-2 p-3 bg-gray-50 dark:bg-harbor-950/50 rounded-xl text-sm text-gray-700 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-harbor-800"
        >
          {transcript}
        </div>
      )}
    </div>
  );
}
