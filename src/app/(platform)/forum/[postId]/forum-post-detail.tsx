'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUp, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const replySchema = z.object({
  body: z.string().min(1, 'Reply cannot be empty').max(5000),
});

interface ForumPostDetailProps {
  post: any;
  replies: any[];
  userId: string;
}

export function ForumPostDetail({ post, replies, userId }: ForumPostDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localUpvotes, setLocalUpvotes] = useState(post.upvotes);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [localReplies, setLocalReplies] = useState(replies);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ body: string }>({
    resolver: zodResolver(replySchema),
  });

  const author = post.profiles;
  const space = post.forum_spaces;

  async function handleUpvote() {
    if (hasUpvoted) return;
    const supabase = createClient();
    await supabase
      .from('forum_posts')
      .update({ upvotes: localUpvotes + 1 })
      .eq('id', post.id);
    setLocalUpvotes((v: number) => v + 1);
    setHasUpvoted(true);
  }

  async function handleReply(data: { body: string }) {
    startTransition(async () => {
      const supabase = createClient();
      const { data: newReply, error } = await supabase
        .from('forum_replies')
        .insert({
          post_id: post.id,
          author_id: userId,
          body: data.body,
        })
        .select('*, profiles!author_id(id, username, display_name, avatar_url)')
        .single();

      if (error) {
        toast.error(error.message);
      } else {
        setLocalReplies((prev) => [...prev, newReply]);
        // Update reply count
        await supabase
          .from('forum_posts')
          .update({ reply_count: localReplies.length + 1 })
          .eq('id', post.id);
        reset();
        toast.success('Reply posted');
      }
    });
  }

  async function handleReplyUpvote(replyId: string) {
    const supabase = createClient();
    setLocalReplies((prev) =>
      prev.map((r) => r.id === replyId ? { ...r, upvotes: r.upvotes + 1 } : r)
    );
    await supabase
      .from('forum_replies')
      .update({ upvotes: localReplies.find(r => r.id === replyId)!.upvotes + 1 })
      .eq('id', replyId);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href="/forum" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to Forum
      </Link>

      {/* Post */}
      <article className="rounded-lg border p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex items-center justify-center text-sm font-bold">
            {author?.avatar_url ? (
              <img src={author.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              author?.display_name?.slice(0, 2).toUpperCase() || '?'
            )}
          </div>
          <div>
            <Link href={`/profile/${author?.username}`} className="text-sm font-medium hover:underline">
              {author?.display_name || author?.username}
            </Link>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              {space && <> · <span className="capitalize">{space.icon} {space.name}</span></>}
            </p>
          </div>
        </div>

        {/* Title + Body */}
        <h1 className="text-xl font-bold mb-2">{post.title}</h1>
        <div className="text-sm whitespace-pre-wrap text-muted-foreground">{post.body}</div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t">
          <button
            onClick={handleUpvote}
            disabled={hasUpvoted}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              hasUpvoted ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <ArrowUp className="h-4 w-4" />
            {localUpvotes}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            {localReplies.length} replies
          </span>
        </div>
      </article>

      {/* Replies */}
      <div className="space-y-3">
        <h2 className="font-semibold">Replies ({localReplies.length})</h2>

        {localReplies.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No replies yet. Be the first.</p>
        )}

        {localReplies.map((reply) => {
          const replyAuthor = reply.profiles;
          return (
            <div key={reply.id} className="rounded-md border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-bold">
                  {replyAuthor?.avatar_url ? (
                    <img src={replyAuthor.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    replyAuthor?.display_name?.slice(0, 2).toUpperCase() || '?'
                  )}
                </div>
                <Link href={`/profile/${replyAuthor?.username}`} className="text-sm font-medium hover:underline">
                  {replyAuthor?.display_name || replyAuthor?.username}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
              <button
                onClick={() => handleReplyUpvote(reply.id)}
                className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowUp className="h-3 w-3" /> {reply.upvotes}
              </button>
            </div>
          );
        })}
      </div>

      {/* Reply form */}
      <div className="rounded-lg border p-4">
        <h3 className="font-medium mb-2">Reply</h3>
        <form onSubmit={handleSubmit(handleReply)} className="space-y-3">
          <textarea
            {...register('body')}
            placeholder="Write your reply..."
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y min-h-[80px]"
          />
          {errors.body && <p className="text-xs text-red-500">{errors.body.message}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isPending ? 'Posting...' : 'Post Reply'}
          </button>
        </form>
      </div>
    </div>
  );
}
