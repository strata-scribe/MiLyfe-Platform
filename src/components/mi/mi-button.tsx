'use client';

import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

export function MiButton() {
  const { miOpen, toggleMi } = useAppStore();

  return (
    <button
      onClick={toggleMi}
      className={cn(
        'fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300',
        'bg-gradient-to-br from-harbor-800 via-teal-500 to-mly-500',
        'hover:scale-110 active:scale-95',
        miOpen && 'rotate-45 from-red-500 to-red-600 via-red-500'
      )}
      aria-label={miOpen ? 'Close Mi assistant' : 'Open Mi assistant'}
      aria-expanded={miOpen}
    >
      <span className="text-white text-lg font-bold">
        {miOpen ? '✕' : 'Mi'}
      </span>
    </button>
  );
}
