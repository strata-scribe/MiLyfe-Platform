'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Wallet, PiggyBank, Heart, Sparkles } from 'lucide-react';
import { AnimatedBalance } from './animated-balance';
import { AmbientTokenFlow } from './particle-stream';

interface AliveWalletCardProps {
  balance: {
    spending: number;
    savings: number;
    community: number;
  };
}

export function AliveWalletCard({ balance }: AliveWalletCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const total = balance.spending + balance.savings + balance.community;

  const spendingPct = total > 0 ? (balance.spending / total) * 100 : 0;
  const savingsPct = total > 0 ? (balance.savings / total) * 100 : 0;
  const communityPct = total > 0 ? (balance.community / total) * 100 : 0;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 p-6 text-white border border-slate-750/70 shadow-2xl backdrop-blur-md"
    >
      {/* Subtle living ambient background particles */}
      <AmbientTokenFlow />

      {/* Radial glow backdrop */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-teal-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-pink-500/15 blur-3xl" />

      {/* Total Balance Hero */}
      <div className="relative z-10 text-center mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-700/60 mb-2">
          <Sparkles className="h-3 w-3 text-teal-400 animate-pulse" />
          <span>Total Balance</span>
        </div>
        <div>
          <AnimatedBalance value={total} color="#ffffff" size="lg" />
        </div>
        <p className="text-xs font-semibold tracking-wider text-teal-400 mt-1 uppercase">$MLY TOKENS</p>
      </div>

      {/* Spending Breakdown Ratio Bar */}
      <div className="relative z-10 mb-6 px-1">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-800/80 border border-slate-700/40">
          <motion.div
            className="bg-gradient-to-r from-teal-500 to-teal-400"
            initial={{ width: 0 }}
            animate={{ width: `${spendingPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            title={`Spending: ${Math.round(spendingPct)}%`}
          />
          <motion.div
            className="bg-gradient-to-r from-amber-400 to-yellow-400"
            initial={{ width: 0 }}
            animate={{ width: `${savingsPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            title={`Savings: ${Math.round(savingsPct)}%`}
          />
          <motion.div
            className="bg-gradient-to-r from-pink-500 to-rose-400"
            initial={{ width: 0 }}
            animate={{ width: `${communityPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            title={`Community: ${Math.round(communityPct)}%`}
          />
        </div>
      </div>

      {/* Category Pots (Spending, Savings, Community) */}
      <div className="relative z-10 grid grid-cols-3 gap-3">
        {/* Spending Pot */}
        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="rounded-xl bg-slate-800/40 p-3 text-center border border-teal-500/20 backdrop-blur-sm shadow-inner"
        >
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 mb-1.5">
            <Wallet className="h-4 w-4 text-teal-400" />
          </div>
          <AnimatedBalance value={balance.spending} label="Spending" color="#2dd4bf" size="sm" />
        </motion.div>

        {/* Savings Pot */}
        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="rounded-xl bg-slate-800/40 p-3 text-center border border-amber-500/20 backdrop-blur-sm shadow-inner"
        >
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 mb-1.5">
            <PiggyBank className="h-4 w-4 text-amber-400" />
          </div>
          <AnimatedBalance value={balance.savings} label="Savings" color="#facc15" size="sm" />
        </motion.div>

        {/* Community Pot */}
        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="rounded-xl bg-slate-800/40 p-3 text-center border border-pink-500/20 backdrop-blur-sm shadow-inner"
        >
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/15 mb-1.5">
            <Heart className="h-4 w-4 text-pink-400" />
          </div>
          <AnimatedBalance value={balance.community} label="Community" color="#f472b6" size="sm" />
        </motion.div>
      </div>
    </motion.div>
  );
}
