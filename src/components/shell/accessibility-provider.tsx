'use client';

import { useEffect, useState } from 'react';
import '@/lib/i18n';

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Apply saved font size
    const savedSize = localStorage.getItem('milyfe-font-size') || 'normal';
    applyFontSize(savedSize);

    // Apply reduced motion
    const reducedMotion = localStorage.getItem('milyfe-reduced-motion') === 'true';
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    }

    // Apply high contrast
    const highContrast = localStorage.getItem('milyfe-high-contrast') === 'true';
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  if (!mounted) return <>{children}</>;
  return <>{children}</>;
}

function applyFontSize(size: string) {
  const root = document.documentElement;
  root.classList.remove('text-sm-mode', 'text-lg-mode', 'text-xl-mode');
  switch (size) {
    case 'small': root.classList.add('text-sm-mode'); break;
    case 'large': root.classList.add('text-lg-mode'); break;
    case 'xl': root.classList.add('text-xl-mode'); break;
  }
}
