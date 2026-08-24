import { createServerSupabase } from '@/lib/supabase/server';
import { AppsView } from './apps-view';

export const metadata = { title: 'Apps' };

export default async function AppsPage() {
  const supabase = createServerSupabase();

  const { data: apps } = await supabase
    .from('apps')
    .select('*, developer:profiles!apps_developer_id_fkey(username, display_name)')
    .eq('status', 'published')
    .order('install_count', { ascending: false })
    .limit(30);

  return <AppsView apps={apps || []} />;
}
