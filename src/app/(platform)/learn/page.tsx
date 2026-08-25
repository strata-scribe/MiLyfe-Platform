import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LearnView } from './learn-view';

export const metadata = { title: 'Learn' };

export default async function LearnPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [pathsRes, enrollmentsRes, badgesRes] = await Promise.all([
    supabase
      .from('learn_paths')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('learn_enrollments')
      .select('*, learn_paths(*)')
      .eq('user_id', user.id)
      .neq('status', 'dropped'),
    supabase
      .from('learn_badges')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false }),
  ]);

  return (
    <LearnView
      userId={user.id}
      paths={pathsRes.data || []}
      enrollments={enrollmentsRes.data || []}
      badges={badgesRes.data || []}
    />
  );
}
