'use client';

import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
  ControlBar,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { getLiveKitToken, LIVEKIT_URL, isLiveKitAvailable } from '@/lib/calls/livekit-config';

interface LiveKitVideoRoomProps {
  roomName: string;
  participantName: string;
  onDisconnect?: () => void;
  mode?: 'conference' | 'stream' | 'audio';
}

/**
 * LiveKit Video Room — used for:
 * - MiTV live streaming (mode="stream")
 * - Group calls / guild meetings (mode="conference")
 * - Audio rooms / radio (mode="audio")
 */
export function LiveKitVideoRoom({
  roomName,
  participantName,
  onDisconnect,
  mode = 'conference',
}: LiveKitVideoRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLiveKitAvailable()) {
      setError('LiveKit is not configured. Set NEXT_PUBLIC_LIVEKIT_URL in environment variables.');
      return;
    }

    getLiveKitToken(roomName, participantName).then((t) => {
      if (t) setToken(t);
      else setError('Failed to get access token');
    });
  }, [roomName, participantName]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-harbor-900 rounded-xl">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-gray-500 text-xs mt-2">Contact admin to configure LiveKit server.</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-64 bg-harbor-900 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
          <p className="text-white text-sm">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden bg-harbor-900">
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect={true}
        onDisconnected={onDisconnect}
        data-lk-theme="default"
        style={{ height: mode === 'audio' ? '200px' : '500px' }}
      >
        {mode === 'conference' && <VideoConference />}
        {mode === 'stream' && <StreamLayout />}
        {mode === 'audio' && <AudioOnlyLayout />}
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

/**
 * Stream layout — optimized for 1 broadcaster + many viewers
 */
function StreamLayout() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  return (
    <div className="relative h-full">
      <GridLayout tracks={tracks}>
        <ParticipantTile />
      </GridLayout>
      <div className="absolute bottom-0 left-0 right-0">
        <ControlBar variation="minimal" />
      </div>
    </div>
  );
}

/**
 * Audio-only layout — for radio DJ mode and walkie-talkie
 */
function AudioOnlyLayout() {
  const tracks = useTracks([Track.Source.Microphone]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {tracks.map((track) => (
          <div key={track.participant.sid} className="flex items-center gap-2 bg-harbor-800 rounded-full px-4 py-2">
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse" />
            <span className="text-sm text-white">{track.participant.name || 'Anonymous'}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-center">
        <ControlBar variation="minimal" controls={{ camera: false, screenShare: false }} />
      </div>
    </div>
  );
}
