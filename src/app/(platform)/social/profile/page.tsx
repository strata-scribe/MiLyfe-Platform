'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { StandingBadge } from '@/components/ui/standing-badge';

interface SocialProfile { bio: string; website: string | null; banner_url: string | null; followers_count: number; following_count: number; post_count: number; }
interface Post { id: string; content: string; image_url: string | null; likes: number; comments_count: number; created_at: string; }
interface FollowUser { id: string; display_name: string; avatar_url: string | null; }

type ProfileTab = 'posts' | 'followers' | 'following';

export default function SocialProfilePage() {
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [tab, setTab] = useState<ProfileTab>('posts');
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState('');

  const { user } = useAppStore();

  useEffect(() => { if (user) loadProfile(); }, [user]);

  async function loadProfile() {
    const supabase = createClient();

    // Get or create social profile
    let { data: sp } = await supabase.from('social_profiles').select('*').eq('user_id', user!.id).single();
    if (!sp) {
      await supabase.from('social_profiles').insert({ user_id: user!.id, bio: '' });
      sp = { bio: '', website: null, banner_url: null, followers_count: 0, following_count: 0, post_count: 0 } as any;
    }
    setProfile(sp as any);
    setBio((sp as any)?.bio || '');

    // Get posts
    const { data: p } = await supabase.from('feed_posts').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20);
    if (p) setPosts(p);

    // Get followers
    const { data: frs } = await supabase.from('follows').select('follower_id, profiles!follows_follower_id_fkey(id, display_name, avatar_url)').eq('following_id', user!.id).limit(50);
    if (frs) setFollowers(frs.map((f: any) => f.profiles).filter(Boolean));

    // Get following
    const { data: fng } = await supabase.from('follows').select('following_id, profiles!follows_following_id_fkey(id, display_name, avatar_url)').eq('follower_id', user!.id).limit(50);
    if (fng) setFollowing(fng.map((f: any) => f.profiles).filter(Boolean));

    setLoading(false);
  }

  async function saveBio() {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('social_profiles').update({ bio: bio.trim() }).eq('user_id', user.id);
    setProfile(prev => prev ? { ...prev, bio: bio.trim() } : prev);
    setEditingBio(false);
  }

  async function unfollow(userId: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
    setFollowing(prev => prev.filter(f => f.id !== userId));
  }

  function timeAgo(d: string) { const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 60) return 'now'; if (s < 3600) return `${Math.floor(s/60)}m`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`; }

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-32 bg-gray-200 dark:bg-harbor-800 rounded-xl" /><div className="h-20 bg-gray-200 dark:bg-harbor-800 rounded-xl" /></div>;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Banner + Avatar */}
      <div className="relative">
        <div className="h-28 rounded-xl bg-gradient-to-br from-teal-400 via-harbor-600 to-purple-500 overflow-hidden">
          {profile?.banner_url && <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="absolute -bottom-8 left-4">
          <div className="w-16 h-16 rounded-full bg-white dark:bg-harbor-900 border-4 border-white dark:border-harbor-900 flex items-center justify-center text-2xl font-bold text-harbor-800 bg-gradient-to-br from-teal-100 to-harbor-100">
            {user?.display_name?.charAt(0) || '?'}
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="pt-10 px-1">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-harbor-800 dark:text-white">{user?.display_name}</h1>
            <p className="text-xs text-gray-500">@{user?.display_name?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
          </div>
          <StandingBadge compact />
        </div>

        {/* Bio */}
        {editingBio ? (
          <div className="mt-2 flex gap-2">
            <input value={bio} onChange={e => setBio(e.target.value)} placeholder="Write a bio..." className="input-field flex-1 !py-1.5 text-sm" maxLength={160} />
            <button onClick={saveBio} className="text-xs text-teal-600 font-medium">Save</button>
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {profile?.bio || <button onClick={() => setEditingBio(true)} className="text-gray-400 italic">Add a bio...</button>}
            {profile?.bio && <button onClick={() => setEditingBio(true)} className="ml-2 text-xs text-teal-600">✏️</button>}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-6 mt-3">
          <button onClick={() => setTab('posts')} className="text-center">
            <p className="text-lg font-bold text-harbor-800 dark:text-white">{profile?.post_count || posts.length}</p>
            <p className="text-xs text-gray-500">Posts</p>
          </button>
          <button onClick={() => setTab('followers')} className="text-center">
            <p className="text-lg font-bold text-harbor-800 dark:text-white">{profile?.followers_count || followers.length}</p>
            <p className="text-xs text-gray-500">Followers</p>
          </button>
          <button onClick={() => setTab('following')} className="text-center">
            <p className="text-lg font-bold text-harbor-800 dark:text-white">{profile?.following_count || following.length}</p>
            <p className="text-xs text-gray-500">Following</p>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['posts', 'followers', 'following'] as ProfileTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Posts */}
      {tab === 'posts' && (
        <div className="space-y-3">
          {posts.length === 0 ? <div className="card text-center py-6"><p className="text-xs text-gray-500">No posts yet. Share something on the feed!</p><Link href="/social" className="text-xs text-teal-600 mt-1 inline-block">Go to Feed →</Link></div> :
          posts.map(post => (
            <div key={post.id} className="card">
              <p className="text-sm text-harbor-800 dark:text-white">{post.content}</p>
              {post.image_url && <img src={post.image_url} alt="" className="w-full rounded-lg mt-2 max-h-48 object-cover" />}
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>❤️ {post.likes}</span>
                <span>💬 {post.comments_count}</span>
                <span>{timeAgo(post.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Followers */}
      {tab === 'followers' && (
        <div className="space-y-2">
          {followers.length === 0 ? <div className="card text-center py-6"><p className="text-xs text-gray-500">No followers yet.</p></div> :
          followers.map(f => (
            <div key={f.id} className="card flex items-center gap-3 !py-2.5">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-harbor-800 flex items-center justify-center text-sm font-bold">{f.display_name?.charAt(0) || '?'}</div>
              <p className="text-sm text-harbor-800 dark:text-white flex-1">{f.display_name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Following */}
      {tab === 'following' && (
        <div className="space-y-2">
          {following.length === 0 ? <div className="card text-center py-6"><p className="text-xs text-gray-500">Not following anyone yet.</p><Link href="/social" className="text-xs text-teal-600 mt-1 inline-block">Discover people →</Link></div> :
          following.map(f => (
            <div key={f.id} className="card flex items-center gap-3 !py-2.5">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-harbor-800 flex items-center justify-center text-sm font-bold">{f.display_name?.charAt(0) || '?'}</div>
              <p className="text-sm text-harbor-800 dark:text-white flex-1">{f.display_name}</p>
              <button onClick={() => unfollow(f.id)} className="text-xs text-gray-400 hover:text-red-500">Unfollow</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
