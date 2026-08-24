import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ForumView } from './forum-view';

export const metadata = { title: 'Forum' };

export default async function ForumPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [spacesRes, recentPostsRes] = await Promise.all([
    supabase.from('forum_spaces').select('*').order('post_count', { ascending: false }),
    supabase.from('forum_posts')
      .select('*, author:profiles!forum_posts_author_id_fkey(username, display_name, avatar_url), space:forum_spaces!forum_posts_space_id_fkey(name, slug, icon)')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <ForumView
      userId={user.id}
      spaces={spacesRes.data || []}
      recentPosts={recentPostsRes.data || []}
    />
  );
}
