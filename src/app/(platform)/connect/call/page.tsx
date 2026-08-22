'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { WebRTCSignaling } from '@/lib/calls/webrtc-signal';

interface CallState {
  status: 'idle' | 'calling' | 'ringing' | 'active' | 'ended';
  type: 'voice' | 'video';
  duration: number;
  peerId: string | null;
  peerName: string | null;
}

export default function CallPageWrapper() {
  return (
    <Suspense fallback={<div className="space-y-4 animate-pulse"><div className="h-8 bg-gray-200 dark:bg-harbor-800 rounded w-32" /><div className="h-64 bg-gray-200 dark:bg-harbor-800 rounded-xl" /></div>}>
      <CallPage />
    </Suspense>
  );
}

function CallPage() {
  const searchParams = useSearchParams();
  const calleeId = searchParams.get('user');
  const callType = (searchParams.get('type') || 'voice') as 'voice' | 'video';

  const [state, setState] = useState<CallState>({
    status: 'idle', type: callType, duration: 0, peerId: calleeId, peerName: null,
  });
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [callHistory, setCallHistory] = useState<any[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const signalingRef = useRef<WebRTCSignaling | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAppStore();

  useEffect(() => {
    loadHistory();
    if (calleeId) initCall();
    return () => { endCall(); };
  }, []);

  async function loadHistory() {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase.from('call_sessions')
      .select('*, caller:profiles!call_sessions_caller_id_fkey(display_name), callee:profiles!call_sessions_callee_id_fkey(display_name)')
      .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
      .order('created_at', { ascending: false }).limit(20);
    if (data) setCallHistory(data);
  }

  async function initCall() {
    if (!user || !calleeId) return;
    setState(s => ({ ...s, status: 'calling' }));

    // Get peer name
    const supabase = createClient();
    const { data: peer } = await supabase.from('profiles').select('display_name').eq('id', calleeId).single();
    if (peer) setState(s => ({ ...s, peerName: peer.display_name }));

    // Create call session
    await supabase.from('call_sessions').insert({ caller_id: user.id, callee_id: calleeId, type: callType });

    // Initialize real WebRTC signaling
    try {
      const signaling = new WebRTCSignaling({
        userId: user.id,
        peerId: calleeId,
        onRemoteStream: (stream: MediaStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
          // Connection established — start timer
          setState(s => ({ ...s, status: 'active' }));
          timerRef.current = setInterval(() => {
            setState(s => ({ ...s, duration: s.duration + 1 }));
          }, 1000);
        },
        onHangup: () => {
          endCall();
        },
        onStateChange: (connectionState: RTCPeerConnectionState) => {
          if (connectionState === 'connected') {
            setState(s => ({ ...s, status: 'active' }));
          }
        },
      });

      signalingRef.current = signaling;
      const localStream = await signaling.init(callType);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      // Initiate the call (send offer)
      await signaling.call();
    } catch (err) {
      console.error('Call initialization failed:', err);
      setState(s => ({ ...s, status: 'ended' }));
    }
  }

  function endCall() {
    if (signalingRef.current) {
      signalingRef.current.hangup();
      signalingRef.current.cleanup();
      signalingRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setState(s => ({ ...s, status: 'ended' }));
  }

  function toggleMute() {
    if (signalingRef.current) {
      const isMuted = signalingRef.current.toggleMute();
      setMuted(isMuted);
    }
  }

  function toggleVideo() {
    if (signalingRef.current) {
      const isOff = signalingRef.current.toggleVideo();
      setVideoOff(isOff);
    }
  }

  function formatDuration(s: number) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2, '0')}`; }

  // Active call UI
  if (state.status === 'calling' || state.status === 'active') {
    return (
      <div className="fixed inset-0 z-50 bg-harbor-900 flex flex-col items-center justify-between py-12">
        {/* Video displays */}
        {state.type === 'video' && (
          <>
            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-30" />
            <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-24 right-4 w-32 h-44 rounded-xl object-cover border-2 border-white/30 z-10" />
          </>
        )}

        {/* Call info */}
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-harbor-600 flex items-center justify-center text-3xl text-white mx-auto mb-4">
            {state.peerName?.charAt(0) || '?'}
          </div>
          <h2 className="text-xl font-bold text-white">{state.peerName || 'Calling...'}</h2>
          <p className="text-sm text-white/60 mt-1">
            {state.status === 'calling' ? 'Connecting...' :
             state.status === 'active' ? formatDuration(state.duration) : ''}
          </p>
          {state.status === 'calling' && (
            <div className="mt-4 flex justify-center gap-1">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: `${i*0.3}s` }} />)}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="relative z-10 flex items-center gap-6">
          <button onClick={toggleMute} className={cn('w-14 h-14 rounded-full flex items-center justify-center text-xl', muted ? 'bg-red-500 text-white' : 'bg-white/20 text-white')}>
            {muted ? '🔇' : '🎤'}
          </button>
          {state.type === 'video' && (
            <button onClick={toggleVideo} className={cn('w-14 h-14 rounded-full flex items-center justify-center text-xl', videoOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white')}>
              {videoOff ? '📷' : '📹'}
            </button>
          )}
          <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-2xl text-white shadow-lg shadow-red-500/30">
            📞
          </button>
        </div>
      </div>
    );
  }

  // Call history / idle state
  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Calls</h1>
        <p className="text-xs text-gray-500">Voice and video calls with community members</p>
      </div>

      {state.status === 'ended' && (
        <div className="card bg-green-50 dark:bg-green-900/10 text-center py-3">
          <p className="text-sm text-green-700 dark:text-green-400">Call ended · {formatDuration(state.duration)}</p>
        </div>
      )}

      <div className="card">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-3">Recent Calls</h3>
        {callHistory.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">No call history yet. Start a call from MiConnect.</p>
        ) : (
          <div className="space-y-2">
            {callHistory.map((call: any) => {
              const isOutgoing = call.caller_id === user?.id;
              const peerName = isOutgoing ? call.callee?.display_name : call.caller?.display_name;
              return (
                <div key={call.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                  <span className={cn('text-sm', isOutgoing ? 'text-blue-500' : call.status === 'missed' ? 'text-red-500' : 'text-green-500')}>
                    {isOutgoing ? '📤' : call.status === 'missed' ? '📵' : '📥'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-harbor-800 dark:text-white">{peerName}</p>
                    <p className="text-xs text-gray-400">{call.type} · {new Date(call.created_at).toLocaleString()}</p>
                  </div>
                  {call.duration_seconds > 0 && <span className="text-xs text-gray-400">{formatDuration(call.duration_seconds)}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
