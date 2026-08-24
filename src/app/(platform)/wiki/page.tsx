import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WikiView } from './wiki-view';

export const metadata = { title: 'Wiki' };

export default async function WikiPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: pages } = await supabase
    .from('wiki_pages')
    .select('*, author:profiles!wiki_pages_author_id_fkey(username, display_name)')
    .eq('published', true)
    .order('updated_at', { ascending: false })
    .limit(50);

  return (
    <WikiView
      userId={user.id}
      pages={pages || []}
    />
  );
}
