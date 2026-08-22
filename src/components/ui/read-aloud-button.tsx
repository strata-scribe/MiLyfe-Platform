'use client';

import { useTTS } from '@/lib/hooks/use-tts';
import { useTranslation } from 'react-i18next';

interface ReadAloudButtonProps {
  /** Text(s) to read aloud — single string or array for sequential reading */
  texts: string | string[];
  /** Optional language override (defaults to current i18n lang) */
  lang?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className override */
  className?: string;
}

export function ReadAloudButton({ texts, lang, size = 'md', className }: ReadAloudButtonProps) {
  const { i18n, t } = useTranslation();
  const ttsLang = lang || (i18n.language === 'es' ? 'es-US' : 'en-US');
  const { isSpeaking, isPaused, isSupported, speak, stop, pause, resume } = useTTS({
    lang: ttsLang,
    rate: 0.85,
  });

  if (!isSupported) return null;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  if (!isSpeaking) {
    return (
      <button
        onClick={() => speak(texts)}
        className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40 font-medium transition-colors ${sizeClasses[size]} ${className || ''}`}
        aria-label={t('rights.readAloud')}
      >
        <span>🔊</span>
        <span>{t('rights.readAloud')}</span>
      </button>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className || ''}`}>
      <button
        onClick={isPaused ? resume : pause}
        className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 font-medium transition-colors ${sizeClasses[size]}`}
        aria-label={isPaused ? 'Resume' : 'Pause'}
      >
        <span>{isPaused ? '▶️' : '⏸️'}</span>
      </button>
      <button
        onClick={stop}
        className={`inline-flex items-center rounded-full bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 font-medium transition-colors ${sizeClasses[size]}`}
        aria-label={t('rights.stopReading')}
      >
        <span>⏹️</span>
        <span>{t('rights.stopReading')}</span>
      </button>
    </div>
  );
}
