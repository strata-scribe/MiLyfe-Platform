import { createServerSupabase } from '@/lib/supabase/server';
import { NewsView } from './news-view';

export const metadata = { title: 'News' };

export default async function NewsPage() {
  const supabase = createServerSupabase();

  const [featuredRes, articlesRes] = await Promise.all([
    supabase.from('news_articles')
      .select('*, author:profiles!news_articles_author_id_fkey(username, display_name, avatar_url)')
      .eq('published', true)
      .eq('featured', true)
      .order('published_at', { ascending: false })
      .limit(3),
    supabase.from('news_articles')
      .select('*, author:profiles!news_articles_author_id_fkey(username, display_name, avatar_url)')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <NewsView
      featured={featuredRes.data || []}
      articles={articlesRes.data || []}
    />
  );
}
