'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

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
  profiles?: { display_name: string; avatar_url: string | null };
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
  created_at: string;
  profiles?: { display_name: string };
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

  const { user } = useAppStore();

  useEffect(() => { loadPost(); }, [postId]);

  async function loadPost() {
    setLoading(true);
    const supabase = createClient();

    const { data: p } = await supabase
      .from('forum_posts')
      .select('*, profiles!forum_posts_author_id_fkey(display_name, avatar_url), forum_spaces!forum_posts_space_id_fkey(name, slug, icon)')
      .eq('id', postId)
      .single();
    if (p) setPost(p as any);

    await loadComments();
    setLoading(false);
  }

  async function loadComments() {
    const supabase = createClient();
    let query = supabase
      .from('forum_comments')
      .select('*, profiles!forum_comments_author_id_fkey(display_name)')
      .eq('post_id', postId);

    if (sortComments === 'best') query = query.order('upvotes', { ascending: false });
    else if (sortComments === 'new') query = query.order('created_at', { ascending: false });
    else query = query.order('created_at', { ascending: true });

    const { data: c } = await query.limit(50);
    if (c) {
      // Build nested tree
      const topLevel = (c as Comment[]).filter(cm => !cm.parent_id);
      const childMap = (c as Comment[]).filter(cm => cm.parent_id);
      topLevel.forEach(tl => {
        tl.replies = childMap.filter(ch => ch.parent_id === tl.id);
      });
      setComments(topLevel);
    }
  }

  async function postComment() {
    if (!user || !commentInput.trim()) return;
    setPosting(true);
    const supabase = createClient();
    await supabase.from('forum_comments').insert({
      post_id: postId, author_id: user.id, body: commentInput.trim(),
      parent_id: null, upvotes: 0, downvotes: 0,
    });
    await supabase.from('forum_posts').update({ comment_count: (post?.comment_count || 0) + 1 }).eq('id', postId);
    setCommentInput(''); setPosting(false);
    loadComments();
    if (post) setPost({ ...post, comment_count: post.comment_count + 1 });
  }

  async function postReply(parentId: string) {
    if (!user || !replyInput.trim()) return;
    const supabase = createClient();
    await supabase.from('forum_comments').insert({
      post_id: postId, author_id: user.id, body: replyInput.trim(),
      parent_id: parentId, upvotes: 0, downvotes: 0,
    });
    await supabase.from('forum_posts').update({ comment_count: (post?.comment_count || 0) + 1 }).eq('id', postId);
    setReplyInput(''); setReplyTo(null);
    loadComments();
    if (post) setPost({ ...post, comment_count: post.comment_count + 1 });
  }

  async function votePost(direction: 1 | -1) {
    if (!user || !post) return;
    const supabase = createClient();
    await supabase.from('forum_votes').upsert({
      user_id: user.id, target_type: 'post', target_id: postId, direction,
    }, { onConflict: 'user_id,target_type,target_id' });
    const field = direction === 1 ? 'upvotes' : 'downvotes';
    setPost({ ...post, [field]: post[field] + 1 });
  }

  async function voteComment(commentId: string, direction: 1 | -1) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('forum_votes').upsert({
      user_id: user.id, target_type: 'comment', target_id: commentId, direction,
    }, { onConflict: 'user_id,target_type,target_id' });
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, [direction === 1 ? 'upvotes' : 'downvotes']: c[direction === 1 ? 'upvotes' : 'downvotes'] + 1 } : c));
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
        <div className="card skeleton h-40" />
        <div className="card skeleton h-24" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-4 animate-slide-up">
        <Link href={`/forum/${slug}`} className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
        <div className="card text-center py-8">
          <p className="text-sm text-gray-500">Post not found</p>
        </div>
      </div>
    );
  }

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
          {/* Votes */}
          <div className="flex flex-col items-center gap-0.5">
            <button onClick={() => votePost(1)} className="text-gray-400 hover:text-teal-500 text-sm">▲</button>
            <span className="text-sm font-bold text-harbor-800 dark:text-white">{post.upvotes - post.downvotes}</span>
            <button onClick={() => votePost(-1)} className="text-gray-400 hover:text-red-500 text-sm">▼</button>
          </div>

          {/* Content */}
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

            {post.body && (
              <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {post.body}
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
              <button className="hover:text-gray-600">📤 Share</button>
              <button className="hover:text-gray-600">🔖 Save</button>
              <button className="hover:text-gray-600">🚩 Report</button>
            </div>
          </div>
        </div>
      </div>

      {/* Comment input */}
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

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Sort:</span>
        {(['best', 'new', 'old'] as SortComments[]).map(s => (
          <button key={s} onClick={() => { setSortComments(s); loadComments(); }} className={cn('px-2 py-1 rounded text-xs capitalize', sortComments === s ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{s}</button>
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
              <div className="flex flex-col items-center gap-0.5">
                <button onClick={() => voteComment(comment.id, 1)} className="text-gray-400 hover:text-teal-500 text-xs">▲</button>
                <span className="text-xs font-bold text-harbor-800 dark:text-white">{comment.upvotes - comment.downvotes}</span>
                <button onClick={() => voteComment(comment.id, -1)} className="text-gray-400 hover:text-red-500 text-xs">▼</button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="font-medium text-harbor-800 dark:text-white">{(comment.profiles as any)?.display_name}</span>
                  <span>·</span>
                  <span>{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.body}</p>
                <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} className="text-[10px] text-teal-600 mt-1 hover:underline">Reply</button>

                {/* Reply form */}
                {replyTo === comment.id && (
                  <div className="flex gap-2 mt-2">
                    <input value={replyInput} onChange={e => setReplyInput(e.target.value)} placeholder="Reply..." className="input-field flex-1 text-xs" onKeyDown={e => e.key === 'Enter' && postReply(comment.id)} />
                    <button onClick={() => postReply(comment.id)} disabled={!replyInput.trim()} className="btn-teal text-xs disabled:opacity-50">Reply</button>
                  </div>
                )}

                {/* Nested replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-2 ml-4 border-l-2 border-gray-100 dark:border-harbor-800 pl-3 space-y-2">
                    {comment.replies.map(reply => (
                      <div key={reply.id}>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          <span className="font-medium text-harbor-800 dark:text-white">{(reply.profiles as any)?.display_name}</span>
                          <span>·</span>
                          <span>{timeAgo(reply.created_at)}</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{reply.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
