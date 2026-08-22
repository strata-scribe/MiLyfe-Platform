'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  standing_level: number;
  mly_balance: number;
  neighborhood: string | null;
  joined_at: string;
  badges: string[];
}

interface UserPost {
  id: string;
  content: string;
  media_url: string | null;
  likes: number;
  comments_count: number;
  created_at: string;
}

interface MutualConnection {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [mutuals, setMutuals] = useState<MutualConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadProfile(); }, [userId]);

  async function loadProfile() {
    setLoading(true);
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (p) setProfile(p as any);

    const { data: userPosts } = await supabase.from('social_posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    if (userPosts) setPosts(userPosts as any);

    const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
    const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);

    if (user) {
      const { data: follow } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).single();
      if (follow) setIsFollowing(true);
    }
    setLoading(false);
  }

  async function toggleFollow() {
    if (!user) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
      setIsFollowing(false);
      setFollowerCount(c => c - 1);
      toast.success('Unfollowed');
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
      toast.success('Following!');
    }
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  }

  if (loading) return <div className="space-y-4 animate-slide-up"><div className="skeleton h-32 rounded-xl" /><div className="skeleton h-48 rounded-xl" /></div>;

  if (!profile) return (
    <div className="space-y-4 animate-slide-up">
      <Link href="/social" className="text-gray-400 text-sm">← Back</Link>
      <div className="card text-center py-8"><p className="text-gray-500">User not found</p></div>
    </div>
  );

  return (
    <div className="space-y-4 animate-slide-up">
      <Link href="/social" className="text-gray-400 text-sm">← Back to Social</Link>

      {/* Profile Header */}
      <div className="card text-center py-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-harbor-600 mx-auto flex items-center justify-center text-3xl text-white">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : profile.display_name?.charAt(0)}
        </div>
        <h1 className="text-lg font-bold text-harbor-800 dark:text-white mt-3">{profile.display_name}</h1>
        {profile.bio && <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">{profile.bio}</p>}
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
          <span>⭐ Level {profile.standing_level}</span>
          {profile.neighborhood && <><span>·</span><span>📍 {profile.neighborhood}</span></>}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center"><p className="text-lg font-bold text-harbor-800 dark:text-white">{posts.length}</p><p className="text-[10px] text-gray-400">Posts</p></div>
          <div className="text-center"><p className="text-lg font-bold text-harbor-800 dark:text-white">{followerCount}</p><p className="text-[10px] text-gray-400">Followers</p></div>
          <div className="text-center"><p className="text-lg font-bold text-harbor-800 dark:text-white">{followingCount}</p><p className="text-[10px] text-gray-400">Following</p></div>
        </div>

        {/* Actions */}
        {user && user.id !== userId && (
          <div className="flex justify-center gap-2 mt-4">
            <button onClick={toggleFollow} className={cn('px-6 py-2 rounded-lg text-sm font-medium', isFollowing ? 'bg-gray-100 dark:bg-harbor-800 text-gray-600' : 'btn-teal')}>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <Link href={`/connect?user=${userId}`} className="px-6 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-harbor-800 text-gray-600">Message</Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        <button onClick={() => setActiveTab('posts')} className={cn('flex-1 py-2 rounded-lg text-sm font-medium', activeTab === 'posts' ? 'bg-white dark:bg-harbor-800 shadow-sm text-harbor-800 dark:text-white' : 'text-gray-500')}>Posts</button>
        <button onClick={() => setActiveTab('about')} className={cn('flex-1 py-2 rounded-lg text-sm font-medium', activeTab === 'about' ? 'bg-white dark:bg-harbor-800 shadow-sm text-harbor-800 dark:text-white' : 'text-gray-500')}>About</button>
      </div>

      {activeTab === 'posts' && (
        posts.length === 0 ? (
          <div className="card text-center py-8"><p className="text-gray-500 text-sm">No posts yet</p></div>
        ) : posts.map(post => (
          <div key={post.id} className="card">
            <p className="text-sm text-gray-700 dark:text-gray-300">{post.content}</p>
            {post.media_url && <img src={post.media_url} alt="" className="mt-2 rounded-lg max-h-64 object-cover w-full" />}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span>❤️ {post.likes}</span>
              <span>💬 {post.comments_count}</span>
              <span className="ml-auto">{timeAgo(post.created_at)}</span>
            </div>
          </div>
        ))
      )}

      {activeTab === 'about' && (
        <div className="card space-y-3">
          <div><span className="text-xs text-gray-400">Member since</span><p className="text-sm text-harbor-800 dark:text-white">{new Date(profile.joined_at || profile.id).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p></div>
          <div><span className="text-xs text-gray-400">Standing Level</span><p className="text-sm text-harbor-800 dark:text-white">Level {profile.standing_level} — {['Newcomer','Neighbor','Active','Builder','Leader'][profile.standing_level - 1] || 'Member'}</p></div>
          {profile.neighborhood && <div><span className="text-xs text-gray-400">Neighborhood</span><p className="text-sm text-harbor-800 dark:text-white">{profile.neighborhood}</p></div>}
          {profile.badges && profile.badges.length > 0 && (
            <div><span className="text-xs text-gray-400">Badges</span><div className="flex flex-wrap gap-1 mt-1">{profile.badges.map((b, i) => <span key={i} className="px-2 py-0.5 bg-mly-100 text-mly-700 rounded text-xs">{b}</span>)}</div></div>
          )}
        </div>
      )}
    </div>
  );
}
