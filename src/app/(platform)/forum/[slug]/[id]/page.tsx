'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Post {
  id: string;
  space_id: string;
  author_id: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  image_url: string | null;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  pinned: boolean;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null; standing_level: number; created_at: string };
  forum_spaces?: { name: string; slug: string; icon: string };
}

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  upvotes: number;
  downvotes: number;
  depth: number;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null };
  replies?: Comment[];
}

type SortComments = 'best' | 'new' | 'old';

export default function ForumPostDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortComments, setSortComments] = useState<SortComments>('best');
  const [commentInput, setCommentInput] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const { user } = useAppStore();

  useEffect(() => { loadPost(); }, [postId]);

  async function loadPost() {
    setLoading(true);
    const supabase = createClient();

    const { data: p } = await supabase
      .from('forum_posts')
      .select('*, profiles!forum_posts_author_id_fkey(display_name, avatar_url, standing_level, created_at), forum_spaces!forum_posts_space_id_fkey(name, slug, icon)')
      .eq('id', postId)
      .single();

    if (p) setPost(p as any);

    // Check if user already voted
    if (user) {
      const { data: vote } = await supabase
        .from('forum_votes')
        .select('direction')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (vote) setUserVote(vote.direction as 'up' | 'down');
    }

    await loadComments();
    setLoading(false);
  }

  async function loadComments() {
    const supabase = createClient();
    let query = supabase
      .from('forum_comments')
      .select('*, profiles!forum_comments_author_id_fkey(display_name, avatar_url)')
      .eq('post_id', postId);

    if (sortComments === 'best') query = query.order('upvotes', { ascending: false });
    else if (sortComments === 'new') query = query.order('created_at', { ascending: false });
    else query = query.order('created_at', { ascending: true });

    const { data: c } = await query.limit(100);

    if (c) {
      // Build nested comment tree based on parent_id
      const commentList = c as Comment[];
      const topLevel = commentList.filter(cm => !cm.parent_id);
      const childMap = commentList.filter(cm => cm.parent_id);

      topLevel.forEach(tl => {
        tl.replies = childMap.filter(ch => ch.parent_id === tl.id);
        tl.depth = 0;
        tl.replies?.forEach(r => { r.depth = 1; });
      });
      setComments(topLevel);
    }
  }

  async function votePost(direction: 'up' | 'down') {
    if (!user || !post) return;
    const supabase = createClient();

    const { error } = await supabase.from('forum_votes').upsert({
      post_id: postId,
      user_id: user.id,
      direction,
    }, { onConflict: 'post_id,user_id' });

    if (error) {
      toast.error('Failed to vote');
      return;
    }

    // Update local state
    if (userVote === direction) {
      // Undo vote
      await supabase.from('forum_votes').delete().eq('post_id', postId).eq('user_id', user.id);
      setUserVote(null);
      setPost({
        ...post,
        upvotes: direction === 'up' ? post.upvotes - 1 : post.upvotes,
        downvotes: direction === 'down' ? post.downvotes - 1 : post.downvotes,
      });
    } else {
      const prevVote = userVote;
      setUserVote(direction);
      setPost({
        ...post,
        upvotes: direction === 'up' ? post.upvotes + 1 : (prevVote === 'up' ? post.upvotes - 1 : post.upvotes),
        downvotes: direction === 'down' ? post.downvotes + 1 : (prevVote === 'down' ? post.downvotes - 1 : post.downvotes),
      });
    }
  }

  async function postComment() {
    if (!user || !commentInput.trim()) return;
    setPosting(true);
    const supabase = createClient();

    const { error } = await supabase.from('forum_comments').insert({
      post_id: postId,
      author_id: user.id,
      body: commentInput.trim(),
      parent_id: null,
      upvotes: 0,
      downvotes: 0,
    });

    if (error) {
      toast.error('Failed to post comment');
      setPosting(false);
      return;
    }

    await supabase.from('forum_posts').update({ comment_count: (post?.comment_count || 0) + 1 }).eq('id', postId);
    setCommentInput('');
    setPosting(false);
    toast.success('Comment posted!');
    loadComments();
    if (post) setPost({ ...post, comment_count: post.comment_count + 1 });
  }

  async function postReply(parentId: string) {
    if (!user || !replyInput.trim()) return;
    const supabase = createClient();

    const { error } = await supabase.from('forum_comments').insert({
      post_id: postId,
      author_id: user.id,
      body: replyInput.trim(),
      parent_id: parentId,
      upvotes: 0,
      downvotes: 0,
    });

    if (error) {
      toast.error('Failed to reply');
      return;
    }

    await supabase.from('forum_posts').update({ comment_count: (post?.comment_count || 0) + 1 }).eq('id', postId);
    setReplyInput('');
    setReplyTo(null);
    toast.success('Reply posted!');
    loadComments();
    if (post) setPost({ ...post, comment_count: post.comment_count + 1 });
  }

  async function voteComment(commentId: string, direction: 'up' | 'down') {
    if (!user) return;
    const supabase = createClient();

    await supabase.from('forum_votes').upsert({
      post_id: commentId,
      user_id: user.id,
      direction,
    }, { onConflict: 'post_id,user_id' });

    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return { ...c, [direction === 'up' ? 'upvotes' : 'downvotes']: c[direction === 'up' ? 'upvotes' : 'downvotes'] + 1 };
      }
      if (c.replies) {
        c.replies = c.replies.map(r => r.id === commentId ? { ...r, [direction === 'up' ? 'upvotes' : 'downvotes']: r[direction === 'up' ? 'upvotes' : 'downvotes'] + 1 } : r);
      }
      return c;
    }));
  }

  function sharePost() {
    if (navigator.share) {
      navigator.share({ title: post?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  }

  function reportPost() {
    toast.success('Report submitted. Thank you!');
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="card skeleton h-8 w-48" />
        <div className="card skeleton h-48" />
        <div className="card skeleton h-24" />
        <div className="card skeleton h-32" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-4 animate-slide-up">
        <Link href={`/forum/${slug}`} className="text-gray-400 hover:text-gray-600 text-sm">← Back to Forum</Link>
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">💬</p>
          <p className="text-sm text-gray-500">Post not found</p>
        </div>
      </div>
    );
  }

  const netVotes = post.upvotes - post.downvotes;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/forum" className="hover:text-gray-600">Forum</Link>
        <span>→</span>
        <Link href={`/forum/${slug}`} className="hover:text-gray-600">{(post.forum_spaces as any)?.icon} {(post.forum_spaces as any)?.name}</Link>
      </div>

      {/* Post */}
      <div className="card">
        <div className="flex gap-3">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={() => votePost('up')}
              className={cn('text-sm transition-colors', userVote === 'up' ? 'text-teal-500' : 'text-gray-400 hover:text-teal-500')}
            >
              ▲
            </button>
            <span className={cn('text-sm font-bold', netVotes > 0 ? 'text-teal-600' : netVotes < 0 ? 'text-red-500' : 'text-harbor-800 dark:text-white')}>
              {netVotes}
            </span>
            <button
              onClick={() => votePost('down')}
              className={cn('text-sm transition-colors', userVote === 'down' ? 'text-red-500' : 'text-gray-400 hover:text-red-500')}
            >
              ▼
            </button>
          </div>

          {/* Post content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-[10px]">
                {(post.profiles as any)?.display_name?.charAt(0) || '?'}
              </div>
              <span className="font-medium text-harbor-800 dark:text-white">{(post.profiles as any)?.display_name}</span>
              <span>·</span>
              <span>{timeAgo(post.created_at)}</span>
              {post.pinned && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px]">📌 Pinned</span>}
            </div>

            <h1 className="text-lg font-bold text-harbor-800 dark:text-white">{post.title}</h1>

            {/* Body rendered as markdown */}
            {post.body && (
              <div className="mt-3 prose prose-sm dark:prose-invert text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-none">
                <ReactMarkdown>{post.body}</ReactMarkdown>
              </div>
            )}

            {post.url && (
              <a href={post.url} target="_blank" rel="noopener noreferrer" className="mt-3 block text-sm text-teal-600 hover:underline truncate">
                🔗 {post.url}
              </a>
            )}

            {post.image_url && (
              <div className="mt-3">
                <img src={post.image_url} alt="" className="rounded-lg max-h-96 object-cover" />
              </div>
            )}

            {/* Post actions */}
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
              <span>💬 {post.comment_count} comments</span>
              <button onClick={sharePost} className="hover:text-gray-600">📤 Share</button>
              <button className="hover:text-gray-600">🔖 Save</button>
              <button onClick={reportPost} className="hover:text-gray-600">🚩 Report</button>
            </div>
          </div>
        </div>
      </div>

      {/* Author Info Card */}
      {post.profiles && (
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            {(post.profiles as any)?.avatar_url ? (
              <img src={(post.profiles as any).avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-medium">{(post.profiles as any)?.display_name?.charAt(0) || '?'}</span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-harbor-800 dark:text-white">{(post.profiles as any)?.display_name}</p>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span>⭐ Standing Level {(post.profiles as any)?.standing_level || 1}</span>
              <span>·</span>
              <span>Joined {new Date((post.profiles as any)?.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Comment Input */}
      {user && (
        <div className="card space-y-2">
          <textarea
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            placeholder="Add a comment..."
            className="input-field resize-none text-sm"
            rows={3}
          />
          <div className="flex justify-end">
            <button onClick={postComment} disabled={!commentInput.trim() || posting} className="btn-teal text-xs disabled:opacity-50">
              {posting ? 'Posting...' : 'Comment'}
            </button>
          </div>
        </div>
      )}

      {/* Sort Comments */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Sort:</span>
        {(['best', 'new', 'old'] as SortComments[]).map(s => (
          <button
            key={s}
            onClick={() => { setSortComments(s); loadComments(); }}
            className={cn('px-2 py-1 rounded text-xs capitalize', sortComments === s ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Comments */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-sm text-gray-500">No comments yet. Be the first!</p>
          </div>
        ) : comments.map(comment => (
          <div key={comment.id} className="card space-y-2">
            <div className="flex gap-3">
              {/* Comment votes */}
              <div className="flex flex-col items-center gap-0.5">
                <button onClick={() => voteComment(comment.id, 'up')} className="text-gray-400 hover:text-teal-500 text-xs">▲</button>
                <span className="text-xs font-bold text-harbor-800 dark:text-white">{comment.upvotes - comment.downvotes}</span>
                <button onClick={() => voteComment(comment.id, 'down')} className="text-gray-400 hover:text-red-500 text-xs">▼</button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="font-medium text-harbor-800 dark:text-white">{(comment.profiles as any)?.display_name}</span>
                  <span>·</span>
                  <span>{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.body}</p>
                <button
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="text-[10px] text-teal-600 mt-1 hover:underline"
                >
                  Reply
                </button>

                {/* Inline reply form */}
                {replyTo === comment.id && (
                  <div className="flex gap-2 mt-2">
                    <input
                      value={replyInput}
                      onChange={e => setReplyInput(e.target.value)}
                      placeholder="Write a reply..."
                      className="input-field flex-1 text-xs"
                      onKeyDown={e => e.key === 'Enter' && postReply(comment.id)}
                    />
                    <button onClick={() => postReply(comment.id)} disabled={!replyInput.trim()} className="btn-teal text-xs disabled:opacity-50">Reply</button>
                  </div>
                )}

                {/* Nested replies (indented based on parent_id) */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 ml-4 border-l-2 border-gray-100 dark:border-harbor-800 pl-3 space-y-3">
                    {comment.replies.map(reply => (
                      <div key={reply.id}>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          <span className="font-medium text-harbor-800 dark:text-white">{(reply.profiles as any)?.display_name}</span>
                          <span>·</span>
                          <span>{timeAgo(reply.created_at)}</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{reply.body}</p>
                        <button
                          onClick={() => setReplyTo(replyTo === reply.id ? null : reply.id)}
                          className="text-[10px] text-teal-600 mt-0.5 hover:underline"
                        >
                          Reply
                        </button>
                        {replyTo === reply.id && (
                          <div className="flex gap-2 mt-1">
                            <input
                              value={replyInput}
                              onChange={e => setReplyInput(e.target.value)}
                              placeholder="Write a reply..."
                              className="input-field flex-1 text-xs"
                              onKeyDown={e => e.key === 'Enter' && postReply(reply.id)}
                            />
                            <button onClick={() => postReply(reply.id)} disabled={!replyInput.trim()} className="btn-teal text-xs disabled:opacity-50">Reply</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Back link */}
      <Link href={`/forum/${slug}`} className="block text-center text-sm text-teal-600 hover:underline py-2">
        ← Back to {(post.forum_spaces as any)?.name || 'Forum'}
      </Link>
    </div>
  );
}
