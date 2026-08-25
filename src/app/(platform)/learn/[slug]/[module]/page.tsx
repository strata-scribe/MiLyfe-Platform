import { createServerSupabase } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ModuleContentView } from './module-content-view';

interface PageProps {
  params: { slug: string; module: string };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createServerSupabase();
  const { data: mod } = await supabase
    .from('learn_modules')
    .select('title')
    .eq('slug', params.module)
    .single();
  return { title: mod?.title || 'Module' };
}

export default async function ModulePage({ params }: PageProps) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get path
  const { data: path } = await supabase
    .from('learn_paths')
    .select('id, slug, title, color, helper_name')
    .eq('slug', params.slug)
    .single();
  if (!path) notFound();

  // Get module
  const { data: mod } = await supabase
    .from('learn_modules')
    .select('*')
    .eq('path_id', path.id)
    .eq('slug', params.module)
    .single();
  if (!mod) notFound();

  // Get user progress for this module
  const { data: progress } = await supabase
    .from('learn_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_id', mod.id)
    .maybeSingle();

  // Get all modules in path for nav
  const { data: allModules } = await supabase
    .from('learn_modules')
    .select('id, slug, title, sort_order')
    .eq('path_id', path.id)
    .eq('is_active', true)
    .order('sort_order');

  return (
    <ModuleContentView
      userId={user.id}
      path={path}
      module={mod}
      progress={progress}
      allModules={allModules || []}
    />
  );
}
