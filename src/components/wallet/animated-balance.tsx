'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ParticleBurst } from './particle-stream';

interface AnimatedBalanceProps {
  value: number;
  label?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showDelta?: boolean;
}

/**
 * Animated number with cubic ease-out spring physics and floating delta tags.
 * Integrates with Framer Motion and respects accessibility settings.
 */
export function AnimatedBalance({
  value,
  label = '',
  color = '#ffffff',
  size = 'lg',
  showDelta = true
}: AnimatedBalanceProps) {
  const [displayed, setDisplayed] = useState(value);
  const [delta, setDelta] = useState<number | null>(null);
  const [burst, setBurst] = useState(false);
  const prevValueRef = useRef(value);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const prev = prevValueRef.current;
    const diff = value - prev;
    prevValueRef.current = value;

    if (diff !== 0) {
      if (showDelta) {
        setDelta(diff);
        const timer = setTimeout(() => setDelta(null), 2500);
        if (diff > 0) setBurst(true);
      }

      if (shouldReduceMotion) {
        setDisplayed(value);
        return;
      }

      const start = displayed;
      const change = value - start;
      const duration = 650; // ms
      const startTime = performance.now();

      function animate(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Smooth ease-out cubic curve
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayed(Math.round(start + change * eased));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }

      requestAnimationFrame(animate);
    }
  }, [value, shouldReduceMotion, showDelta]); // eslint-disable-line react-hooks/exhaustive-deps

  const sizeClasses = {
    sm: 'text-xl font-bold tracking-tight',
    md: 'text-2xl font-extrabold tracking-tight',
    lg: 'text-4xl font-extrabold tracking-tight'
  };

  return (
    <div className="relative inline-block text-center">
      <ParticleBurst active={burst} onComplete={() => setBurst(false)} count={25} />

      <motion.div
        key={value}
        initial={shouldReduceMotion ? false : { scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="flex items-center justify-center gap-1"
      >
        <p
          className={`tabular-nums transition-colors ${sizeClasses[size]}`}
          style={{ color }}
        >
          {displayed.toLocaleString()}
        </p>

        {/* Floating delta pill */}
        <AnimatePresence>
          {delta !== null && (
            <motion.span
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: -4, scale: 1 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={`absolute -top-3 right-0 -mr-6 rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow-sm ${
                delta > 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {label && <p className="text-xs text-muted-foreground mt-0.5">{label}</p>}
    </div>
  );
}

/**
 * UBI Celebration — shown when Universal Basic Income arrives
 */
export function UBICelebration({ amount, onDismiss }: { amount: number; onDismiss: () => void }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 p-5 text-center shadow-lg"
    >
      <ParticleBurst active={true} count={40} />
      <div className="text-4xl animate-bounce">🌱</div>
      <p className="mt-2 font-bold text-emerald-300">Your $MLY UBI Arrived!</p>
      <p className="text-3xl font-extrabold text-emerald-400 mt-0.5">+{amount} $MLY</p>
      <p className="text-xs text-slate-400 mt-1">Weekly universal basic income credited to spending</p>
      <button
        onClick={onDismiss}
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
      >
        Claim & Dismiss
      </button>
    </motion.div>
  );
}
