import { createServerSupabase } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ListingDetailView } from './listing-detail-view';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createServerSupabase();
  const { data } = await supabase.from('marketplace_listings').select('title').eq('id', params.id).single();
  return { title: data?.title || 'Listing' };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: listing } = await supabase
    .from('marketplace_listings')
    .select('*, profiles!seller_id(id, username, display_name, avatar_url, neighborhood)')
    .eq('id', params.id)
    .single();

  if (!listing) notFound();

  return <ListingDetailView listing={listing} userId={user.id} />;
}
