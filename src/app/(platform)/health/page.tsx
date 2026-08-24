import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HealthView } from './health-view';

export const metadata = { title: 'Health' };

export default async function HealthPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [checkinsRes, resourcesRes] = await Promise.all([
    supabase.from('health_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(14),
    supabase.from('health_resources')
      .select('*')
      .order('name', { ascending: true })
      .limit(20),
  ]);

  return (
    <HealthView
      userId={user.id}
      checkins={checkinsRes.data || []}
      resources={resourcesRes.data || []}
    />
  );
}
