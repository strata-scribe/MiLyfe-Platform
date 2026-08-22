/**
 * LiveKit Configuration for MiLyfe
 * 
 * LiveKit handles:
 * - MiTV live streaming (1-to-many broadcast)
 * - Group video calls (guild meetings, study groups)
 * - Audio rooms (radio DJ, walkie-talkie mode)
 * - Screen sharing
 * 
 * The P2P WebRTC signaling (webrtc-signal.ts) is used for 1-to-1 calls.
 * LiveKit is used when we need an SFU (multiple participants).
 * 
 * Setup:
 * - Deploy LiveKit server (Docker) or use LiveKit Cloud free tier
 * - Set env vars: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
 */

export const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';

/**
 * Get a LiveKit access token from our API.
 * The API route handles token generation server-side using the API secret.
 */
export async function getLiveKitToken(roomName: string, participantName: string): Promise<string | null> {
  try {
    const response = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName, participantName }),
    });

    if (!response.ok) return null;
    const { token } = await response.json();
    return token;
  } catch {
    return null;
  }
}

/**
 * Check if LiveKit is configured and available
 */
export function isLiveKitAvailable(): boolean {
  return Boolean(LIVEKIT_URL);
}
