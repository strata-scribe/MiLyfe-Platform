import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

/**
 * Generate LiveKit access tokens for video rooms.
 * Server-side only — uses LIVEKIT_API_SECRET.
 */
export async function POST(request: NextRequest) {
  const { roomName, participantName } = await request.json();

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'LiveKit not configured' },
      { status: 503 }
    );
  }

  if (!roomName || !participantName) {
    return NextResponse.json(
      { error: 'roomName and participantName are required' },
      { status: 400 }
    );
  }

  // Create access token
  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    ttl: '4h', // Token valid for 4 hours
  });

  // Grant permissions for the room
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const jwt = await token.toJwt();

  return NextResponse.json({ token: jwt });
}
