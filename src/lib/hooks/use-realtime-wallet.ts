'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Real-time wallet subscription.
 * Listens for changes to the user's wallet balance and transactions.
 */
export function useRealtimeWallet(userId: string, initialBalance: {
  spending: number;
  savings: number;
  community: number;
}) {
  const [balance, setBalance] = useState(initialBalance);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Subscribe to wallet balance changes
    const walletChannel = supabase
      .channel(`wallet-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setBalance({
            spending: updated.spending_balance,
            savings: updated.savings_balance,
            community: updated.community_balance,
          });
        },
      )
      .subscribe();

    // Subscribe to incoming transactions
    const txChannel = supabase
      .channel(`transactions-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          setLastTransaction(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(txChannel);
    };
  }, [userId]);

  return { balance, lastTransaction };
}
