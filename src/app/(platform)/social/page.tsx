'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Story {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  content: string;
  image_url: string | null;
  bg_color: string;
  expires_at: string;
  views: number;
  viewed: boolean;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  type: 'text' | 'image' | 'poll' | 'event' | 'repost';
  likes: number;
  comment_count: number;
  reposts: number;
  liked: boolean;
  reposted: boolean;
  bookmarked: boolean;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null };
  poll?: { options: { text: string; votes: number }[]; total_votes: number; voted_option: number | null };
}

type SocialTab = 'feed' | 'explore' | 'post' | 'settings';
type FeedAlgo = 'following' | 'community' | 'trending';

const STORY_COLORS = ['bg-gradient-to-br from-teal-500 to-blue-600', 'bg-gradient-to-br from-purple-500 to-pink-600', 'bg-gradient-to-br from-orange-500 to-red-600', 'bg-gradient-to-br from-green-500 to-teal-600', 'bg-gradient-to-br from-blue-500 to-purple-600'];
const REACTIONS = ['❤️', '🔥', '💯', '👏', '😂', '😮'];

export default function SocialPage() {
  const [tab, setTab] = useState<SocialTab>('feed');
  const [algo, setAlgo] = useState<FeedAlgo>('following');
  const [stories, setStories] = useState<Story[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  // Post form
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'poll'>('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [posting, setPosting] = useState(false);

  // Story form
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [storyColor, setStoryColor] = useState(STORY_COLORS[0]);

  // Settings
  const [algoPreference, setAlgoPreference] = useState<'chronological' | 'algorithmic' | 'community'>('algorithmic');

  const { user } = useAppStore();

  useEffect(() => { loadFeed(); }, [algo]);

  async function loadFeed() {
    setLoading(true);
    const supabase = createClient();

    // Stories
    const { data: s } = await supabase.from('social_stories').select('*').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(15);
    if (s) setStories(s as any);

    // Posts
    let query = supabase.from('social_posts').select('*, profiles!social_posts_user_id_fkey(display_name, avatar_url)');
    if (algo === 'trending') query = query.order('likes', { ascending: false });
    else query = query.order('created_at', { ascending: false });
    const { data: p } = await query.limit(20);
    if (p) setPosts(p as any);

    setLoading(false);
  }

  async function createPost() {
    if (!user || !postContent.trim()) return;
    setPosting(true);
    const supabase = createClient();
    const postData: any = {
      user_id: user.id, content: postContent.trim(), type: postType,
      likes: 0, comment_count: 0, reposts: 0,
    };
    if (postType === 'poll' && pollOptions.filter(Boolean).length >= 2) {
      postData.poll = { options: pollOptions.filter(Boolean).map(o => ({ text: o, votes: 0 })), total_votes: 0, voted_option: null };
    }
    await supabase.from('social_posts').insert(postData);
    setPostContent(''); setPollOptions(['', '']); setPosting(false);
    toast.success('Posted!');
    setTab('feed'); loadFeed();
  }

  async function createStory() {
    if (!user || !storyContent.trim()) return;
    const supabase = createClient();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('social_stories').insert({
      user_id: user.id, display_name: user.display_name,
      content: storyContent.trim(), bg_color: storyColor,
      expires_at: expiresAt, views: 0,
    });
    setStoryContent(''); setShowStoryForm(false);
    toast.success('Story posted for 24h!');
    loadFeed();
  }

  async function likePost(postId: string) {
    if (!user) return;
    const supabase = createClient();
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newLikes = post.liked ? post.likes - 1 : post.likes + 1;
    await supabase.from('social_posts').update({ likes: newLikes }).eq('id', postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes, liked: !p.liked } : p));
  }

  async function repost(postId: string) {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const supabase = createClient();
    await supabase.from('social_posts').update({ reposts: post.reposts + 1 }).eq('id', postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, reposts: p.reposts + 1, reposted: true } : p));
    toast.success('Reposted!');
  }

  async function votePoll(postId: string, optionIndex: number) {
    const supabase = createClient();
    const post = posts.find(p => p.id === postId);
    if (!post?.poll || post.poll.voted_option !== null) return;
    const updatedPoll = { ...post.poll };
    updatedPoll.options[optionIndex].votes += 1;
    updatedPoll.total_votes += 1;
    updatedPoll.voted_option = optionIndex;
    await supabase.from('social_posts').update({ poll: updatedPoll }).eq('id', postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, poll: updatedPoll } : p));
  }

  function viewStory(story: Story) {
    setActiveStory(story);
    setStoryProgress(0);
    // Auto-advance after 5 seconds
    const interval = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setActiveStory(null); return 0; }
        return prev + 2;
      });
    }, 100);
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  }

  // Story viewer (fullscreen-style)
  if (activeStory) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setActiveStory(null)}>
        <div className={cn('w-full max-w-sm h-[80vh] rounded-2xl flex flex-col items-center justify-center p-8 relative', activeStory.bg_color)}>
          {/* Progress bar */}
          <div className="absolute top-4 left-4 right-4 h-1 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${storyProgress}%` }} />
          </div>
          {/* Author */}
          <div className="absolute top-8 left-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">{activeStory.display_name.charAt(0)}</div>
            <span className="text-white text-xs font-medium">{activeStory.display_name}</span>
          </div>
          {/* Content */}
          <p className="text-white text-xl font-bold text-center leading-relaxed">{activeStory.content}</p>
          {/* Close */}
          <button onClick={() => setActiveStory(null)} className="absolute top-4 right-4 text-white/80 hover:text-white text-lg">✕</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiSocial</h1>
        <div className="flex gap-2">
          {user && <button onClick={() => setShowStoryForm(!showStoryForm)} className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">📸 Story</button>}
          {user && <button onClick={() => setTab('post')} className="btn-teal text-xs">+ Post</button>}
        </div>
      </div>

      {/* Stories Row */}
      {stories.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {user && (
            <button onClick={() => setShowStoryForm(true)} className="flex-shrink-0 w-16 text-center">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-teal-400 flex items-center justify-center text-lg mx-auto">+</div>
              <p className="text-[9px] text-gray-500 mt-1">Your Story</p>
            </button>
          )}
          {stories.map(story => (
            <button key={story.id} onClick={() => viewStory(story)} className="flex-shrink-0 w-16 text-center">
              <div className={cn('w-14 h-14 rounded-full flex items-center justify-center text-white text-sm mx-auto ring-2 ring-offset-2', story.viewed ? 'ring-gray-300' : 'ring-purple-500', story.bg_color || 'bg-teal-500')}>
                {story.display_name.charAt(0)}
              </div>
              <p className="text-[9px] text-gray-500 mt-1 truncate">{story.display_name.split(' ')[0]}</p>
            </button>
          ))}
        </div>
      )}

      {/* Story Form */}
      {showStoryForm && (
        <div className="card space-y-3 border-2 border-purple-200 dark:border-purple-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Create Story (24h)</h3>
          <textarea value={storyContent} onChange={e => setStoryContent(e.target.value)} placeholder="What's on your mind? (visible for 24 hours)" className="input-field resize-none" rows={2} maxLength={200} />
          <div className="flex gap-2">
            {STORY_COLORS.map(c => (
              <button key={c} onClick={() => setStoryColor(c)} className={cn('w-8 h-8 rounded-full', c, storyColor === c && 'ring-2 ring-offset-2 ring-teal-500')} />
            ))}
          </div>
          <button onClick={createStory} disabled={!storyContent.trim()} className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs font-medium disabled:opacity-50">Post Story</button>
        </div>
      )}

      {/* Algorithm Selector + Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['feed', 'explore', 'post', 'settings'] as SocialTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'settings' ? '⚙️' : t}</button>
        ))}
      </div>

      {/* Feed */}
      {tab === 'feed' && (
        <div className="space-y-3">
          {/* Algo toggle */}
          <div className="flex gap-2">
            {(['following', 'community', 'trending'] as FeedAlgo[]).map(a => (
              <button key={a} onClick={() => setAlgo(a)} className={cn('px-3 py-1 rounded-full text-xs capitalize', algo === a ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{a}</button>
            ))}
          </div>

          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-32" />) :
            posts.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">📱</p>
                <p className="text-sm text-gray-500">No posts yet. Follow people or post something!</p>
              </div>
            ) : posts.map(post => (
              <div key={post.id} className="card space-y-2">
                {/* Author */}
                <div className="flex items-center gap-2">
                  <Link href={`/social/${post.user_id}`} className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xs">
                    {(post.profiles as any)?.display_name?.charAt(0) || '?'}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/social/${post.user_id}`} className="text-sm font-medium text-harbor-800 dark:text-white hover:underline">{(post.profiles as any)?.display_name}</Link>
                    <p className="text-[10px] text-gray-400">{timeAgo(post.created_at)}</p>
                  </div>
                  <button className="text-gray-400 text-sm">···</button>
                </div>

                {/* Content */}
                <p className="text-sm text-harbor-800 dark:text-white whitespace-pre-wrap">{post.content}</p>

                {/* Image */}
                {post.image_url && (
                  <div className="aspect-video bg-gray-100 dark:bg-harbor-800 rounded-xl overflow-hidden">
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Poll */}
                {post.poll && (
                  <div className="space-y-1.5">
                    {post.poll.options.map((opt, i) => {
                      const pct = post.poll!.total_votes > 0 ? Math.round((opt.votes / post.poll!.total_votes) * 100) : 0;
                      const voted = post.poll!.voted_option !== null;
                      return (
                        <button key={i} onClick={() => !voted && votePoll(post.id, i)} disabled={voted} className="w-full relative">
                          <div className={cn('w-full py-2 px-3 rounded-lg border text-left text-xs transition-colors', voted ? 'border-gray-200 dark:border-harbor-700' : 'border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20')}>
                            {voted && <div className="absolute inset-0 bg-teal-50 dark:bg-teal-900/20 rounded-lg" style={{ width: `${pct}%` }} />}
                            <span className="relative z-10 flex justify-between">
                              <span>{opt.text}</span>
                              {voted && <span className="text-gray-500">{pct}%</span>}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    <p className="text-[10px] text-gray-400">{post.poll.total_votes} votes</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button onClick={() => likePost(post.id)} className={cn('flex items-center gap-1 text-xs transition-colors', post.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500')}>
                    {post.liked ? '❤️' : '🤍'} {post.likes > 0 ? post.likes : ''}
                  </button>
                  <Link href={`/social/${post.id}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-teal-500">
                    💬 {post.comment_count > 0 ? post.comment_count : ''}
                  </Link>
                  <button onClick={() => repost(post.id)} className={cn('flex items-center gap-1 text-xs', post.reposted ? 'text-green-500' : 'text-gray-500 hover:text-green-500')}>
                    🔄 {post.reposts > 0 ? post.reposts : ''}
                  </button>
                  <button className="text-xs text-gray-500 hover:text-mly-600">🔖</button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Explore */}
      {tab === 'explore' && (
        <div className="space-y-3">
          <input placeholder="Search people, topics, hashtags..." className="input-field" />
          <div className="flex gap-2 flex-wrap">
            {['#community', '#jax', '#mutual-aid', '#housing', '#wellness', '#food'].map(tag => (
              <button key={tag} className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded-full hover:bg-teal-50 hover:text-teal-600">{tag}</button>
            ))}
          </div>
          <div className="card text-center py-6">
            <p className="text-sm text-gray-500">Trending topics and discover will appear here</p>
          </div>
        </div>
      )}

      {/* Create Post */}
      {tab === 'post' && user && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xs">{user.display_name.charAt(0)}</div>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">{user.display_name}</p>
          </div>
          {/* Type selector */}
          <div className="flex gap-2">
            {([['text', '📝'], ['image', '🖼️'], ['poll', '📊']] as const).map(([t, icon]) => (
              <button key={t} onClick={() => setPostType(t)} className={cn('px-3 py-1.5 rounded-lg text-xs flex items-center gap-1', postType === t ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{icon} {t}</button>
            ))}
          </div>
          <textarea value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="What's happening in your community?" className="input-field resize-none" rows={4} />
          {postType === 'poll' && (
            <div className="space-y-1">
              {pollOptions.map((opt, i) => (
                <input key={i} value={opt} onChange={e => { const opts = [...pollOptions]; opts[i] = e.target.value; setPollOptions(opts); }} placeholder={`Option ${i + 1}`} className="input-field text-xs" />
              ))}
              {pollOptions.length < 4 && <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-[10px] text-teal-600">+ Add option</button>}
            </div>
          )}
          <button onClick={createPost} disabled={!postContent.trim() || posting} className="btn-teal w-full disabled:opacity-50">
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <div className="space-y-3">
          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-3">Feed Algorithm</h3>
            {[
              { value: 'chronological', label: 'Chronological', desc: 'See posts in order — newest first' },
              { value: 'algorithmic', label: 'Smart Feed', desc: 'Prioritize posts you\'ll likely engage with' },
              { value: 'community', label: 'Community First', desc: 'Prioritize local and mutual aid content' },
            ].map(opt => (
              <button key={opt.value} onClick={() => setAlgoPreference(opt.value as any)} className={cn('w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors', algoPreference === opt.value ? 'bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800' : 'hover:bg-gray-50 dark:hover:bg-harbor-900')}>
                <span className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5', algoPreference === opt.value ? 'border-teal-500' : 'border-gray-300')}>
                  {algoPreference === opt.value && <span className="w-2 h-2 rounded-full bg-teal-500" />}
                </span>
                <div>
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">{opt.label}</p>
                  <p className="text-[10px] text-gray-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Content Preferences</h3>
            {['Show trending content', 'Show reposts in feed', 'Show poll results before voting', 'Auto-play videos'].map(pref => (
              <div key={pref} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                <span className="text-xs text-harbor-800 dark:text-white">{pref}</span>
                <div className="w-9 h-5 rounded-full bg-teal-500 relative cursor-pointer">
                  <span className="absolute top-0.5 left-4 w-4 h-4 rounded-full bg-white shadow" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
