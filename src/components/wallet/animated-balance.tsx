'use client';

import { useEffect, useState } from 'react';

interface AnimatedBalanceProps {
  value: number;
  label: string;
  color: string;
  size?: 'sm' | 'lg';
}

/**
 * Animated number that springs to its target value.
 * Used for wallet balance display.
 */
export function AnimatedBalance({ value, label, color, size = 'lg' }: AnimatedBalanceProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    // Animate from current to target
    const start = displayed;
    const diff = value - start;
    if (diff === 0) return;

    const duration = 600; // ms
    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + diff * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="text-center">
      <p
        className={`font-bold tabular-nums ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}
        style={{ color }}
      >
        {displayed.toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

/**
 * UBI Celebration — shown when UBI just arrived
 */
export function UBICelebration({ amount, onDismiss }: { amount: number; onDismiss: () => void }) {
  return (
    <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 text-center animate-fade-in">
      <div className="text-3xl animate-bounce">🌱</div>
      <p className="mt-2 font-bold text-green-700">Your UBI arrived!</p>
      <p className="text-2xl font-bold text-green-600">+{amount} $MLY</p>
      <p className="text-sm text-green-600 mt-1">Weekly universal basic income</p>
      <button
        onClick={onDismiss}
        className="mt-3 text-xs text-green-500 hover:text-green-700"
      >
        Dismiss
      </button>
    </div>
  );
}
