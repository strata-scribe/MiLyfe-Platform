'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  city: string;
  neighborhood: string | null;
  mly_balance: number;
  standing_score: number;
  joined_at: string;
  followers_count: number;
  following_count: number;
  post_count: number;
  badges: string[];
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes: number;
  comment_count: number;
  type: 'text' | 'image' | 'poll' | 'event';
  created_at: string;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned_at: string;
}

type ProfileTab = 'posts' | 'badges' | 'activity';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ProfileTab>('posts');
  const [isFollowing, setIsFollowing] = useState(false);

  const { user } = useAppStore();
  const isOwnProfile = user?.id === userId;

  useEffect(() => { loadProfile(); }, [userId]);

  async function loadProfile() {
    setLoading(true);
    const supabase = createClient();

    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (p) setProfile(p as any);

    const { data: posts } = await supabase
      .from('social_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (posts) setPosts(posts);

    const { data: b } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    if (b) setBadges(b);

    // Check follow status
    if (user && user.id !== userId) {
      const { data: follow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();
      setIsFollowing(!!follow);
    }

    setLoading(false);
  }

  async function toggleFollow() {
    if (!user || !profile) return;
    const supabase = createClient();
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
      setProfile({ ...profile, followers_count: profile.followers_count - 1 });
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
      setProfile({ ...profile, followers_count: profile.followers_count + 1 });
    }
    setIsFollowing(!isFollowing);
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  }

  function standingLabel(score: number): { label: string; color: string } {
    if (score >= 90) return { label: 'Pillar', color: 'text-green-600' };
    if (score >= 70) return { label: 'Good', color: 'text-teal-600' };
    if (score >= 50) return { label: 'Neutral', color: 'text-gray-600' };
    return { label: 'Low', color: 'text-red-600' };
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="card skeleton h-48" />
        <div className="card skeleton h-32" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4 animate-slide-up">
        <Link href="/social" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
        <div className="card text-center py-8">
          <p className="text-sm text-gray-500">User not found</p>
        </div>
      </div>
    );
  }

  const standing = standingLabel(profile.standing_score || 75);

  return (
    <div className="space-y-4 animate-slide-up">
      <Link href="/social" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>

      {/* Profile Header */}
      <div className="card text-center space-y-3">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-teal-100 dark:bg-teal-900/30 mx-auto flex items-center justify-center">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-3xl">{profile.display_name.charAt(0)}</span>
          )}
        </div>

        <div>
          <h1 className="text-lg font-bold text-harbor-800 dark:text-white">{profile.display_name}</h1>
          <p className="text-xs text-gray-500">📍 {profile.neighborhood || profile.city}</p>
          <p className={cn('text-xs font-medium mt-1', standing.color)}>⭐ {standing.label} Standing</p>
        </div>

        {profile.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="flex justify-center gap-6">
          <div className="text-center">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">{profile.post_count || posts.length}</p>
            <p className="text-[10px] text-gray-500">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">{profile.followers_count || 0}</p>
            <p className="text-[10px] text-gray-500">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">{profile.following_count || 0}</p>
            <p className="text-[10px] text-gray-500">Following</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-mly-600">${profile.mly_balance?.toFixed(0)}</p>
            <p className="text-[10px] text-gray-500">MLY</p>
          </div>
        </div>

        {/* Actions */}
        {!isOwnProfile && user && (
          <div className="flex gap-2 justify-center">
            <button onClick={toggleFollow} className={cn('px-6 py-2 rounded-lg text-xs font-medium transition-all', isFollowing ? 'bg-gray-100 dark:bg-harbor-800 text-gray-600' : 'bg-teal-500 text-white')}>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <Link href="/connect" className="px-6 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-harbor-800 text-gray-600">Message</Link>
          </div>
        )}

        {/* Member since */}
        <p className="text-[10px] text-gray-400">Member since {new Date(profile.joined_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['posts', 'badges', 'activity'] as ProfileTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t} {t === 'badges' ? `(${badges.length})` : ''}</button>
        ))}
      </div>

      {/* Posts */}
      {tab === 'posts' && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No posts yet</p>
            </div>
          ) : posts.map(post => (
            <div key={post.id} className="card">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
              {post.image_url && (
                <div className="mt-2 aspect-video bg-gray-100 dark:bg-harbor-800 rounded-lg overflow-hidden">
                  <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>❤️ {post.likes}</span>
                <span>💬 {post.comment_count}</span>
                <span className="ml-auto">{timeAgo(post.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badges */}
      {tab === 'badges' && (
        <div className="space-y-2">
          {badges.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No badges earned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {badges.map(badge => (
                <div key={badge.id} className="card text-center py-3">
                  <p className="text-2xl">{badge.icon}</p>
                  <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">{badge.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{badge.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity */}
      {tab === 'activity' && (
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">📊</p>
          <p className="text-sm text-gray-500">Check their posts tab for recent activity</p>
          <p className="text-xs text-gray-400 mt-1">Contributions, votes, and community participation</p>
        </div>
      )}
    </div>
  );
}
