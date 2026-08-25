'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * Dark Mode Toggle — saves preference to localStorage, applies to <html> element.
 */
export function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Check stored preference or system preference
    const stored = localStorage.getItem('milyfe-theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  function toggle() {
    const newDark = !dark;
    setDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('milyfe-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('milyfe-theme', 'light');
    }
  }

  return (
    <button
      onClick={toggle}
      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
