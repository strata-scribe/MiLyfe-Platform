import { createServerSupabase } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { PathDetailView } from './path-detail-view';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createServerSupabase();
  const { data: path } = await supabase
    .from('learn_paths')
    .select('title')
    .eq('slug', params.slug)
    .single();

  return { title: path?.title || 'Learn Path' };
}

export default async function PathDetailPage({ params }: PageProps) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: path } = await supabase
    .from('learn_paths')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();

  if (!path) notFound();

  const [modulesRes, enrollmentRes, progressRes] = await Promise.all([
    supabase
      .from('learn_modules')
      .select('*')
      .eq('path_id', path.id)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('learn_enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('path_id', path.id)
      .single(),
    supabase
      .from('learn_progress')
      .select('*')
      .eq('user_id', user.id)
      .in(
        'module_id',
        (await supabase.from('learn_modules').select('id').eq('path_id', path.id)).data?.map(
          (m) => m.id,
        ) || [],
      ),
  ]);

  return (
    <PathDetailView
      userId={user.id}
      path={path}
      modules={modulesRes.data || []}
      enrollment={enrollmentRes.data}
      progress={progressRes.data || []}
    />
  );
}
