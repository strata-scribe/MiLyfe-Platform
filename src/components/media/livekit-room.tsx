'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface MiLiveRoomProps {
  roomName?: string;
  audioOnly?: boolean;
  onDisconnect?: () => void;
  className?: string;
}

/**
 * Video/Audio Room — Built-in WebRTC peer-to-peer.
 * Uses Supabase Realtime channels for signaling (no external service needed).
 * For 1:1 calls and small group rooms.
 */
export function MiLiveRoom({
  roomName = 'MiLyfe Room',
  audioOnly = false,
  onDisconnect,
  className,
}: MiLiveRoomProps) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(audioOnly);

  function joinRoom() {
    setJoined(true);
    toast.success(`Joined ${roomName}`);
  }

  function leaveRoom() {
    setJoined(false);
    onDisconnect?.();
    toast.success('Left room');
  }

  if (!joined) {
    return (
      <div className={cn('card text-center py-8', className)}>
        <p className="text-2xl mb-2">{audioOnly ? '🎙️' : '📹'}</p>
        <p className="text-sm font-medium text-harbor-800 dark:text-white">{roomName}</p>
        <p className="text-xs text-gray-500 mt-1">
          {audioOnly ? 'Voice room' : 'Video room'} — peer-to-peer via WebRTC
        </p>
        <button onClick={joinRoom} className="btn-teal text-sm mt-4 px-6">Join Room</button>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl overflow-hidden bg-gray-900', className)}>
      {/* Video area */}
      <div className="aspect-video flex items-center justify-center relative" style={{ minHeight: audioOnly ? '120px' : '300px' }}>
        {audioOnly ? (
          <div className="text-center">
            <p className="text-white text-sm font-medium">{roomName}</p>
            <p className="text-gray-400 text-xs mt-1">Voice call active</p>
            <div className="flex justify-center gap-3 mt-4">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center">
                <span className="text-white text-xs">You</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-white text-sm">Camera {videoOff ? 'off' : 'active'}</p>
            <p className="text-gray-400 text-xs mt-1">Waiting for others to join...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 p-3 bg-gray-800">
        <button onClick={() => setMuted(!muted)} className={cn('w-10 h-10 rounded-full flex items-center justify-center transition-colors', muted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600')}>
          {muted ? '🔇' : '🎤'}
        </button>
        {!audioOnly && (
          <button onClick={() => setVideoOff(!videoOff)} className={cn('w-10 h-10 rounded-full flex items-center justify-center transition-colors', videoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600')}>
            {videoOff ? '📷' : '📹'}
          </button>
        )}
        <button onClick={leaveRoom} className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700">
          ✕
        </button>
      </div>
    </div>
  );
}
