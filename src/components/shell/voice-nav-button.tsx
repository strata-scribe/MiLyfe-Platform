'use client';

import { useVoiceNav } from '@/lib/hooks/use-voice-nav';
import { useTranslation } from 'react-i18next';

export function VoiceNavButton() {
  const { isSupported, isListening, feedback, toggleListening } = useVoiceNav();
  const { t } = useTranslation();

  if (!isSupported) return null;

  return (
    <>
      <button
        onClick={toggleListening}
        className={`p-2 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
        }`}
        aria-label={isListening ? t('voice.listening') : t('voice.command')}
        title={isListening ? t('voice.listening') : 'Voice navigation'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </button>

      {/* Feedback toast */}
      {(isListening || feedback) && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-sm shadow-xl animate-in fade-in slide-in-from-top-2"
          role="status"
          aria-live="polite"
        >
          {isListening && !feedback && (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {t('voice.listening')}
            </span>
          )}
          {feedback && <span>{feedback}</span>}
        </div>
      )}
    </>
  );
}
