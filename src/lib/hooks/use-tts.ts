'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface TTSState {
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  currentIndex: number;
}

interface TTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}

/**
 * Hook for text-to-speech using the Web Speech API SpeechSynthesis.
 * Supports reading arrays of text (e.g., constitutional amendments) sequentially.
 */
export function useTTS(options: TTSOptions = {}) {
  const { lang = 'en-US', rate = 0.9, pitch = 1, onEnd } = options;
  const [state, setState] = useState<TTSState>({
    isSpeaking: false,
    isPaused: false,
    isSupported: false,
    currentIndex: -1,
  });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textsRef = useRef<string[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    setState((s) => ({
      ...s,
      isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    }));

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakNext = useCallback(() => {
    if (indexRef.current >= textsRef.current.length) {
      setState((s) => ({ ...s, isSpeaking: false, isPaused: false, currentIndex: -1 }));
      onEnd?.();
      return;
    }

    const text = textsRef.current[indexRef.current];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Try to find a good voice for the language
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang.split('-')[0];
    const preferred = voices.find(
      (v) => v.lang.startsWith(langPrefix) && v.localService
    ) || voices.find((v) => v.lang.startsWith(langPrefix));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      indexRef.current++;
      setState((s) => ({ ...s, currentIndex: indexRef.current }));
      speakNext();
    };

    utterance.onerror = () => {
      setState((s) => ({ ...s, isSpeaking: false, isPaused: false, currentIndex: -1 }));
    };

    utteranceRef.current = utterance;
    setState((s) => ({ ...s, currentIndex: indexRef.current }));
    window.speechSynthesis.speak(utterance);
  }, [lang, rate, pitch, onEnd]);

  /**
   * Speak a single text or an array of texts sequentially
   */
  const speak = useCallback(
    (texts: string | string[]) => {
      if (!state.isSupported) return;

      window.speechSynthesis.cancel();
      textsRef.current = Array.isArray(texts) ? texts : [texts];
      indexRef.current = 0;

      setState((s) => ({ ...s, isSpeaking: true, isPaused: false, currentIndex: 0 }));
      speakNext();
    },
    [state.isSupported, speakNext]
  );

  const stop = useCallback(() => {
    if (!state.isSupported) return;
    window.speechSynthesis.cancel();
    textsRef.current = [];
    indexRef.current = 0;
    setState((s) => ({ ...s, isSpeaking: false, isPaused: false, currentIndex: -1 }));
  }, [state.isSupported]);

  const pause = useCallback(() => {
    if (!state.isSupported) return;
    window.speechSynthesis.pause();
    setState((s) => ({ ...s, isPaused: true }));
  }, [state.isSupported]);

  const resume = useCallback(() => {
    if (!state.isSupported) return;
    window.speechSynthesis.resume();
    setState((s) => ({ ...s, isPaused: false }));
  }, [state.isSupported]);

  return { ...state, speak, stop, pause, resume };
}
