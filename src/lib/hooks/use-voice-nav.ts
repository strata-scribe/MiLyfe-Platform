'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface VoiceNavState {
  isListening: boolean;
  isSupported: boolean;
  lastCommand: string | null;
  feedback: string | null;
}

const ROUTE_MAP: Record<string, string> = {
  // English commands
  home: '/home',
  city: '/city',
  health: '/health',
  wallet: '/wallet',
  shop: '/shop',
  connect: '/connect',
  messages: '/connect',
  chat: '/connect',
  vault: '/vault',
  rights: '/rights',
  media: '/media',
  learn: '/learn',
  career: '/career',
  business: '/business',
  guild: '/guild',
  family: '/family',
  feed: '/feed',
  housing: '/housing',
  rideshare: '/rideshare',
  profile: '/profile',
  settings: '/settings',
  notifications: '/notifications',
  support: '/support',
  safety: '/safety',
  // Spanish commands
  inicio: '/home',
  ciudad: '/city',
  salud: '/health',
  cartera: '/wallet',
  tienda: '/shop',
  conexión: '/connect',
  conexion: '/connect',
  derechos: '/rights',
  aprender: '/learn',
  carrera: '/career',
  negocio: '/business',
  negocios: '/business',
  gremio: '/guild',
  familia: '/family',
  vivienda: '/housing',
  viaje: '/rideshare',
};

// Patterns to match voice commands
const COMMAND_PATTERNS = [
  /(?:hey mi|hi mi|mi)\s*(?:,?\s*)(?:go to|open|show|navigate to|take me to|ir a|abrir|mostrar)\s+(.+)/i,
  /(?:go to|open|show|navigate to|take me to|ir a|abrir|mostrar)\s+(.+)/i,
  /^(.+)$/i, // Fallback: just the app name
];

function parseCommand(transcript: string): string | null {
  const cleaned = transcript.toLowerCase().trim();

  for (const pattern of COMMAND_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) {
      const target = match[1].trim().replace(/[.!?,]/g, '');
      // Check direct route map
      if (ROUTE_MAP[target]) return ROUTE_MAP[target];
      // Fuzzy match: check if any key starts with the target or target starts with the key
      for (const [key, route] of Object.entries(ROUTE_MAP)) {
        if (key.startsWith(target) || target.startsWith(key)) return route;
      }
    }
  }

  return null;
}

export function useVoiceNav(): VoiceNavState & {
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
} {
  const router = useRouter();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [state, setState] = useState<VoiceNavState>({
    isListening: false,
    isSupported: false,
    lastCommand: null,
    feedback: null,
  });

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    setState((s) => ({ ...s, isSupported: !!SpeechRecognition }));

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = localStorage.getItem('milyfe-lang') === 'es' ? 'es-US' : 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setState((s) => ({ ...s, lastCommand: transcript }));

      const route = parseCommand(transcript);
      if (route) {
        const appName = route.replace('/', '');
        setState((s) => ({ ...s, feedback: `Navigating to ${appName}...` }));
        router.push(route);
      } else {
        // Forward to Mi AI as a natural language command
        setState((s) => ({ ...s, feedback: `Asking Mi: "${transcript}"...` }));
        fetch('/api/mi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: transcript, history: [] }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.response) {
              setState((s) => ({ ...s, feedback: data.response.slice(0, 100) }));
              // Speak the response
              if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(data.response);
                utterance.lang = localStorage.getItem('milyfe-lang') === 'es' ? 'es-US' : 'en-US';
                utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);
              }
            }
          })
          .catch(() => {
            setState((s) => ({ ...s, feedback: `Didn't recognize: "${transcript}"` }));
          });
      }

      // Clear feedback after 6s (longer for AI responses)
      setTimeout(() => setState((s) => ({ ...s, feedback: null })), 6000);
    };

    recognition.onend = () => {
      setState((s) => ({ ...s, isListening: false }));
    };

    recognition.onerror = () => {
      setState((s) => ({ ...s, isListening: false, feedback: null }));
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [router]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setState((s) => ({ ...s, isListening: true, feedback: null }));
    } catch {
      // Already started
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setState((s) => ({ ...s, isListening: false }));
  }, []);

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  return { ...state, startListening, stopListening, toggleListening };
}
