'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

export default function SettingsPage() {
  const { i18n } = useTranslation();
  const [fontSize, setFontSize] = useState('normal');
  const [language, setLanguage] = useState('en');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    setFontSize(localStorage.getItem('milyfe-font-size') || 'normal');
    setLanguage(localStorage.getItem('milyfe-lang') || 'en');
    setReducedMotion(localStorage.getItem('milyfe-reduced-motion') === 'true');
    setHighContrast(localStorage.getItem('milyfe-high-contrast') === 'true');
  }, []);

  const handleFontSize = (size: string) => {
    setFontSize(size);
    localStorage.setItem('milyfe-font-size', size);
    document.documentElement.classList.remove('text-sm-mode', 'text-lg-mode', 'text-xl-mode');
    if (size === 'small') document.documentElement.classList.add('text-sm-mode');
    if (size === 'large') document.documentElement.classList.add('text-lg-mode');
    if (size === 'xl') document.documentElement.classList.add('text-xl-mode');
  };

  const handleLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('milyfe-lang', lang);
    i18n.changeLanguage(lang);
  };

  const handleReducedMotion = (val: boolean) => {
    setReducedMotion(val);
    localStorage.setItem('milyfe-reduced-motion', String(val));
    document.documentElement.classList.toggle('reduce-motion', val);
  };

  const handleHighContrast = (val: boolean) => {
    setHighContrast(val);
    localStorage.setItem('milyfe-high-contrast', String(val));
    document.documentElement.classList.toggle('high-contrast', val);
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Accessibility & Language</h1>
        <p className="text-xs text-gray-500">Customize MiLyfe for your needs.</p>
      </div>

      {/* Language */}
      <section className="card space-y-3">
        <h2 className="text-sm font-medium text-harbor-800 dark:text-white">Language / Idioma</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { code: 'en', label: 'English', flag: '🇺🇸' },
            { code: 'es', label: 'Español', flag: '🇪🇸' },
          ].map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguage(lang.code)}
              className={cn('py-3 px-4 rounded-xl border-2 text-sm font-medium flex items-center gap-2 transition-all', language === lang.code ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-harbor-700')}
            >
              <span className="text-lg">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      </section>

      {/* Font Size */}
      <section className="card space-y-3">
        <h2 className="text-sm font-medium text-harbor-800 dark:text-white">Text Size</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: 'small', label: 'S', desc: 'Small' },
            { key: 'normal', label: 'M', desc: 'Normal' },
            { key: 'large', label: 'L', desc: 'Large' },
            { key: 'xl', label: 'XL', desc: 'Extra Large' },
          ].map(size => (
            <button
              key={size.key}
              onClick={() => handleFontSize(size.key)}
              className={cn('py-3 rounded-xl border-2 text-center transition-all', fontSize === size.key ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-harbor-700')}
            >
              <span className="text-lg font-bold">{size.label}</span>
              <p className="text-[10px] text-gray-500 mt-0.5">{size.desc}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">Preview: This text will change size based on your selection.</p>
      </section>

      {/* Reduced Motion */}
      <section className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Reduce Motion</p>
            <p className="text-xs text-gray-500">Minimize animations and transitions</p>
          </div>
          <button
            onClick={() => handleReducedMotion(!reducedMotion)}
            className={cn('w-12 h-7 rounded-full transition-colors relative', reducedMotion ? 'bg-teal-500' : 'bg-gray-300 dark:bg-harbor-700')}
            role="switch"
            aria-checked={reducedMotion}
          >
            <div className={cn('absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform', reducedMotion ? 'translate-x-5' : 'translate-x-0.5')} />
          </button>
        </div>
      </section>

      {/* High Contrast */}
      <section className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">High Contrast</p>
            <p className="text-xs text-gray-500">Maximum contrast for low vision</p>
          </div>
          <button
            onClick={() => handleHighContrast(!highContrast)}
            className={cn('w-12 h-7 rounded-full transition-colors relative', highContrast ? 'bg-teal-500' : 'bg-gray-300 dark:bg-harbor-700')}
            role="switch"
            aria-checked={highContrast}
          >
            <div className={cn('absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform', highContrast ? 'translate-x-5' : 'translate-x-0.5')} />
          </button>
        </div>
      </section>

      {/* Platform Info */}
      <section className="card space-y-2">
        <h2 className="text-sm font-medium text-harbor-800 dark:text-white">Platform</h2>
        <div className="space-y-1 text-xs text-gray-500">
          <p>MiLyfe v1.0</p>
          <p>Accessibility: WCAG 2.2 AA target</p>
          <p>Minimum touch target: 44px</p>
          <p>Font: Atkinson Hyperlegible</p>
          <p><a href="/constitution" className="text-teal-500 underline">Platform Constitution</a></p>
          <p><a href="/impact" className="text-teal-500 underline">Community Impact Dashboard</a></p>
        </div>
      </section>
    </div>
  );
}
