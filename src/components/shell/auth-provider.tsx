'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAppStore();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Load initial session
    const loadSession = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        // Fetch profile from our profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            mly_balance: profile.mly_balance,
            city: profile.city,
            joined_at: profile.created_at,
          });
        } else {
          // Profile not created yet (fallback to auth metadata)
          setUser({
            id: authUser.id,
            email: authUser.email ?? '',
            display_name: authUser.user_metadata?.display_name ?? 'Neighbor',
            avatar_url: authUser.user_metadata?.avatar_url,
            mly_balance: 100,
            city: 'Jacksonville',
            joined_at: authUser.created_at,
          });
        }
      }
    };

    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              mly_balance: profile.mly_balance,
              city: profile.city,
              joined_at: profile.created_at,
            });
          }
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setUser, router]);

  return <>{children}</>;
}
