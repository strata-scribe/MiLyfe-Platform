'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { cacheProfileData, cacheWalletData, cacheResources } from '@/lib/offline/sync';

/**
 * Data Cacher — Silently caches critical data to Dexie on page load.
 * Runs once on mount. No UI. Enables offline viewing of cached data.
 */
export function DataCacher() {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    async function cacheData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const uid = user.id;
        // Cache profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, neighborhood')
          .eq('id', uid)
          .single();

        if (profile) {
          await cacheProfileData(profile);
        }

        // Cache wallet
        const { data: wallet } = await supabase
          .from('wallets')
          .select('user_id, spending_balance, savings_balance, community_balance')
          .eq('user_id', uid)
          .single();

        if (wallet) {
          await cacheWalletData({
            id: wallet.user_id,
            spending_balance: wallet.spending_balance,
            savings_balance: wallet.savings_balance,
            community_balance: wallet.community_balance,
          });
        }

        // Cache community resources
        const { data: resources } = await supabase
          .from('community_resources')
          .select('id, name, category, description, address, phone, latitude, longitude, confidence')
          .in('status', ['active', 'stale'])
          .limit(50);

        if (resources && resources.length > 0) {
          await cacheResources(resources);
        }
      } catch {
        // Silent failure — caching is best-effort
      }
    }

    cacheData();
  }, []);

  return null;
}
