import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SafetyView } from './safety-view';

export const metadata = { title: 'Safety' };

export default async function SafetyPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [contactsRes, activeActionsRes, activeTimerRes] = await Promise.all([
    supabase
      .from('safety_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order'),
    supabase
      .from('safety_actions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active'),
    supabase
      .from('walk_home_timers')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <SafetyView
      userId={user.id}
      contacts={contactsRes.data || []}
      activeActions={activeActionsRes.data || []}
      activeTimer={activeTimerRes.data}
    />
  );
}
