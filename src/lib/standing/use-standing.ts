'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { getStandingLevel, getLevelProgress, type StandingLevel } from './index';

interface StandingState {
  points: number;
  level: StandingLevel;
  progress: { current: StandingLevel; next: StandingLevel | null; progress: number };
  loading: boolean;
  breakdown: {
    checkins: number;
    issues: number;
    votes: number;
    content: number;
    transactions: number;
    guildTasks: number;
    courses: number;
    daysActive: number;
  };
}

/**
 * Hook to fetch and compute a user's community standing from Supabase
 */
export function useStanding(): StandingState {
  const { user } = useAppStore();
  const [state, setState] = useState<StandingState>({
    points: 0,
    level: getStandingLevel(0),
    progress: getLevelProgress(0),
    loading: true,
    breakdown: {
      checkins: 0,
      issues: 0,
      votes: 0,
      content: 0,
      transactions: 0,
      guildTasks: 0,
      courses: 0,
      daysActive: 0,
    },
  });

  useEffect(() => {
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const fetchStanding = async () => {
      const supabase = createClient();

      // Parallel queries for all activity counts
      const [
        { count: checkins },
        { count: issues },
        { count: votes },
        { count: content },
        { count: transactions },
        { count: guildTasks },
        { count: courses },
      ] = await Promise.all([
        supabase.from('health_checkins').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('city_issues').select('*', { count: 'exact', head: true }).eq('reporter_id', user.id),
        supabase.from('proposal_votes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('media_content').select('*', { count: 'exact', head: true }).eq('creator_id', user.id),
        supabase.from('mly_transactions').select('*', { count: 'exact', head: true }).eq('from_id', user.id),
        supabase.from('guild_tasks').select('*', { count: 'exact', head: true }).eq('completed_by', user.id).eq('status', 'completed'),
        supabase.from('course_progress').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
      ]);

      // Calculate days since joined
      const joinedDate = new Date(user.joined_at);
      const daysActive = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));

      const breakdown = {
        checkins: checkins || 0,
        issues: issues || 0,
        votes: votes || 0,
        content: content || 0,
        transactions: transactions || 0,
        guildTasks: guildTasks || 0,
        courses: courses || 0,
        daysActive: Math.min(daysActive, 365), // Cap at 365 days contribution
      };

      // Calculate total points
      const points =
        breakdown.checkins * 1 +
        breakdown.issues * 3 +
        breakdown.votes * 2 +
        breakdown.content * 5 +
        breakdown.transactions * 1 +
        breakdown.guildTasks * 5 +
        breakdown.courses * 10 +
        breakdown.daysActive * 1;

      const level = getStandingLevel(points);
      const progress = getLevelProgress(points);

      setState({ points, level, progress, loading: false, breakdown });
    };

    fetchStanding();
  }, [user]);

  return state;
}
