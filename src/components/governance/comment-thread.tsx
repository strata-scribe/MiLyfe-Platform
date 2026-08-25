'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addProposalComment } from '@/lib/actions/governance';
import { FormField, textareaStyles, SubmitButton } from '@/components/ui/form-field';

const schema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(5000),
});

interface Comment {
  id: string;
  author_id: string;
  body: string;
  upvotes: number;
  created_at: string;
  profiles?: { username: string; display_name: string; avatar_url: string | null };
}

interface CommentThreadProps {
  proposalId: string;
  comments: Comment[];
  userId: string;
}

export function CommentThread({ proposalId, comments, userId }: CommentThreadProps) {
  const [isPending, startTransition] = useTransition();
  const [localComments, setLocalComments] = useState(comments);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ body: string }>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: { body: string }) {
    setError(null);
    startTransition(async () => {
      const result = await addProposalComment({
        proposal_id: proposalId,
        body: data.body,
      });
      if (result.error) {
        setError(result.error);
      } else {
        // Optimistic add
        setLocalComments(prev => [...prev, {
          id: crypto.randomUUID(),
          author_id: userId,
          body: data.body,
          upvotes: 0,
          created_at: new Date().toISOString(),
          profiles: { username: 'you', display_name: 'You', avatar_url: null },
        }]);
        reset();
      }
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Discussion ({localComments.length})</h3>

      {/* Comment list */}
      {localComments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first to weigh in.</p>
      ) : (
        <div className="space-y-3">
          {localComments.map((comment) => (
            <div key={comment.id} className="rounded-md border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span className="font-medium text-foreground">
                  {comment.profiles?.display_name || comment.profiles?.username || 'Member'}
                </span>
                <span>·</span>
                <span>{formatTimeAgo(comment.created_at)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <FormField label="" error={errors.body}>
          <textarea
            {...register('body')}
            placeholder="Share your thoughts on this proposal..."
            className={textareaStyles}
            rows={3}
          />
        </FormField>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <SubmitButton loading={isPending}>
          Post Comment
        </SubmitButton>
      </form>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
