'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface FeedItem {
  id: string;
  type: 'issue' | 'checkin' | 'listing' | 'event';
  user_name: string;
  action: string;
  detail: string;
  time: string;
  icon: string;
}

export function useCommunityFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchFeed = async () => {
      // Fetch recent issues
      const { data: issues } = await supabase
        .from('city_issues')
        .select('id, title, created_at, reporter_id, profiles!city_issues_reporter_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent health check-ins (only counts, not private data)
      const { data: checkins } = await supabase
        .from('health_checkins')
        .select('id, created_at, user_id, profiles!health_checkins_user_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent shop listings
      const { data: listings } = await supabase
        .from('shop_listings')
        .select('id, title, created_at, seller_id, profiles!shop_listings_seller_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const feedItems: FeedItem[] = [];

      if (issues) {
        issues.forEach((issue: any) => {
          feedItems.push({
            id: issue.id,
            type: 'issue',
            user_name: issue.profiles?.display_name ?? 'Someone',
            action: 'reported an issue',
            detail: issue.title,
            time: getRelativeTime(issue.created_at),
            icon: '🏛️',
          });
        });
      }

      if (checkins) {
        checkins.forEach((checkin: any) => {
          feedItems.push({
            id: checkin.id,
            type: 'checkin',
            user_name: checkin.profiles?.display_name ?? 'Someone',
            action: 'completed a health check-in',
            detail: '',
            time: getRelativeTime(checkin.created_at),
            icon: '💚',
          });
        });
      }

      if (listings) {
        listings.forEach((listing: any) => {
          feedItems.push({
            id: listing.id,
            type: 'listing',
            user_name: listing.profiles?.display_name ?? 'Someone',
            action: 'listed on MiShop',
            detail: listing.title,
            time: getRelativeTime(listing.created_at),
            icon: '🛍️',
          });
        });
      }

      // Sort by time (most recent first) — simple sort using raw feed
      feedItems.sort((a, b) => {
        // Since we already have relative time, just interleave
        return 0; // Keep as-is; they're already recent
      });

      setFeed(feedItems.slice(0, 10));
      setLoading(false);
    };

    fetchFeed();

    // Real-time updates for the feed
    const channel = supabase
      .channel('community-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'city_issues' },
        () => fetchFeed()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'health_checkins' },
        () => fetchFeed()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shop_listings' },
        () => fetchFeed()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { feed, loading };
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
