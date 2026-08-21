'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface RealtimeIssue {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  location_lat: number | null;
  location_lng: number | null;
  address: string | null;
  image_url: string | null;
  upvotes: number;
  created_at: string;
}

export function useRealtimeIssues() {
  const [issues, setIssues] = useState<RealtimeIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Fetch existing issues
    const fetchIssues = async () => {
      const { data, error } = await supabase
        .from('city_issues')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setIssues(data);
      }
      setLoading(false);
    };

    fetchIssues();

    // Subscribe to new/updated issues
    const channel = supabase
      .channel('city-issues-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'city_issues',
        },
        (payload) => {
          const newIssue = payload.new as RealtimeIssue;
          setIssues((prev) => [newIssue, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'city_issues',
        },
        (payload) => {
          const updated = payload.new as RealtimeIssue;
          setIssues((prev) =>
            prev.map((issue) => (issue.id === updated.id ? updated : issue))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { issues, loading };
}
