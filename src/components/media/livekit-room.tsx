'use client';

import { useState, useCallback } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  useTracks,
  ControlBar,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { cn } from '@/lib/utils/cn';
import '@livekit/components-styles';

interface MiLiveRoomProps {
  /** LiveKit server URL */
  serverUrl?: string;
  /** Room access token (generated server-side) */
  token?: string;
  /** Room name for display */
  roomName?: string;
  /** Audio only mode */
  audioOnly?: boolean;
  /** Callback when user disconnects */
  onDisconnect?: () => void;
  /** Custom className */
  className?: string;
}

/**
 * Production-ready video/audio room powered by LiveKit.
 * Used for: MiTV live streaming, /connect video calls, group meetings.
 * 
 * Requires a LiveKit server URL and access token.
 * Token generation should happen server-side via API route.
 */
export function MiLiveRoom({
  serverUrl,
  token,
  roomName = 'MiLyfe Room',
  audioOnly = false,
  onDisconnect,
  className,
}: MiLiveRoomProps) {
  const [connected, setConnected] = useState(false);

  // If no token/URL, show placeholder
  if (!serverUrl || !token) {
    return (
      <div className={cn('card text-center py-8', className)}>
        <p className="text-2xl mb-2">{audioOnly ? '🎙️' : '📹'}</p>
        <p className="text-sm font-medium text-harbor-800 dark:text-white">{roomName}</p>
        <p className="text-xs text-gray-500 mt-1">
          {audioOnly ? 'Voice room' : 'Video room'} — connecting...
        </p>
        <p className="text-[10px] text-gray-400 mt-2">
          Set LIVEKIT_URL and generate a token to enable real-time communication.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl overflow-hidden bg-black', className)}>
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect={true}
        onConnected={() => setConnected(true)}
        onDisconnected={() => {
          setConnected(false);
          onDisconnect?.();
        }}
        audio={true}
        video={!audioOnly}
        data-lk-theme="default"
        style={{ height: audioOnly ? '200px' : '400px' }}
      >
        {audioOnly ? (
          <AudioOnlyLayout roomName={roomName} />
        ) : (
          <VideoConference />
        )}
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function AudioOnlyLayout({ roomName }: { roomName: string }) {
  const tracks = useTracks([Track.Source.Microphone]);

  return (
    <div className="flex flex-col h-full bg-harbor-950">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-sm font-medium">{roomName}</p>
          <p className="text-gray-400 text-xs mt-1">{tracks.length} participant{tracks.length !== 1 ? 's' : ''}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {tracks.map((track) => (
              <div key={track.participant.sid} className="w-12 h-12 rounded-full bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center">
                <span className="text-white text-xs">{track.participant.name?.charAt(0) || '?'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ControlBar variation="minimal" />
    </div>
  );
}

/**
 * API route helper to generate LiveKit tokens.
 * Place this logic in: src/app/api/livekit/token/route.ts
 * 
 * Example:
 * ```ts
 * import { AccessToken } from 'livekit-server-sdk';
 * 
 * export async function POST(req: Request) {
 *   const { room, username } = await req.json();
 *   const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, { identity: username });
 *   token.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });
 *   return Response.json({ token: await token.toJwt() });
 * }
 * ```
 */
export const LIVEKIT_TOKEN_DOCS = 'See component file for API route example';
