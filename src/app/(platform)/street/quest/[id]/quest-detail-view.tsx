'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { claimQuest, submitQuestEvidence, verifyQuestClaim } from '@/lib/actions/street';
import { FormField, textareaStyles, SubmitButton } from '@/components/ui/form-field';

const evidenceSchema = z.object({
  evidence_text: z.string().min(10, 'Describe what you did (at least 10 chars)').max(2000),
});

interface QuestDetailViewProps {
  quest: any;
  userId: string;
  userClaim: any;
  allClaims: any[];
}

export function QuestDetailView({ quest, userId, userClaim, allClaims }: QuestDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isCreator = quest.creator_id === userId;
  const spotsLeft = quest.max_completions - quest.current_completions;
  const creator = quest.profiles;

  const { register, handleSubmit, formState: { errors } } = useForm<{ evidence_text: string }>({
    resolver: zodResolver(evidenceSchema),
  });

  function handleClaim() {
    startTransition(async () => {
      const result = await claimQuest(quest.id);
      if (result.error) toast.error(result.error);
      else { toast.success('Quest claimed!'); router.refresh(); }
    });
  }

  function handleSubmitEvidence(data: { evidence_text: string }) {
    startTransition(async () => {
      const result = await submitQuestEvidence({
        quest_id: quest.id,
        evidence_text: data.evidence_text,
        evidence_images: [],
      });
      if (result.error) toast.error(result.error);
      else { toast.success('Evidence submitted!'); router.refresh(); }
    });
  }

  function handleVerify(claimId: string, approved: boolean) {
    startTransition(async () => {
      const result = await verifyQuestClaim(claimId, approved);
      if (result.error) toast.error(result.error);
      else { toast.success(approved ? 'Approved! Reward sent.' : 'Rejected.'); router.refresh(); }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Link href="/street" className="text-sm text-muted-foreground hover:text-foreground">← Back to Street</Link>

      {/* Quest header */}
      <div className="rounded-lg border p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{quest.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span className="capitalize">{quest.category}</span>
              <span>·</span>
              <span className="capitalize">{quest.difficulty}</span>
              {quest.time_estimate_minutes && <><span>·</span><span>~{quest.time_estimate_minutes}min</span></>}
              {quest.location_text && <><span>·</span><span>📍 {quest.location_text}</span></>}
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-lg font-bold text-green-700">
            +{quest.reward_mly} $MLY
          </span>
        </div>

        <p className="mt-4 text-sm whitespace-pre-wrap">{quest.description}</p>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining</span>
          <span>·</span>
          <span>By {creator?.display_name || creator?.username}</span>
          {quest.expires_at && <><span>·</span><span>Expires {new Date(quest.expires_at).toLocaleDateString()}</span></>}
        </div>
      </div>

      {/* User actions */}
      {!isCreator && !userClaim && quest.status === 'open' && spotsLeft > 0 && (
        <button
          onClick={handleClaim}
          disabled={isPending}
          className="w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending ? 'Claiming...' : 'Accept This Quest'}
        </button>
      )}

      {/* User claimed — submit evidence */}
      {userClaim?.status === 'claimed' && (
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="font-semibold">Submit Your Evidence</h2>
          <p className="text-sm text-muted-foreground">Describe what you did to complete this quest.</p>
          <form onSubmit={handleSubmit(handleSubmitEvidence)} className="space-y-3">
            <FormField label="What did you do?" error={errors.evidence_text} required>
              <textarea {...register('evidence_text')} className={textareaStyles} rows={4} placeholder="I cleaned up the park by picking up 3 bags of trash along the trail..." />
            </FormField>
            <SubmitButton loading={isPending}>Submit Evidence</SubmitButton>
          </form>
        </div>
      )}

      {/* User submitted — waiting for verification */}
      {userClaim?.status === 'submitted' && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 text-center">
          <p className="font-medium text-yellow-800">Evidence submitted — waiting for verification</p>
          <p className="text-sm text-yellow-700 mt-1">The quest creator will review your submission.</p>
        </div>
      )}

      {/* User verified */}
      {userClaim?.status === 'verified' && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 text-center">
          <p className="text-2xl">🏆</p>
          <p className="font-medium text-green-800 mt-1">Quest completed! +{quest.reward_mly} $MLY earned</p>
        </div>
      )}

      {userClaim?.status === 'rejected' && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-center">
          <p className="font-medium text-red-800">Your submission was not approved</p>
          <p className="text-sm text-red-700 mt-1">You can try claiming again if spots are available.</p>
        </div>
      )}

      {/* Creator view — verify claims */}
      {isCreator && allClaims.length > 0 && (
        <div className="rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold">Claims ({allClaims.length})</h2>
          {allClaims.map((claim) => (
            <div key={claim.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {claim.profiles?.display_name || claim.profiles?.username}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  claim.status === 'verified' ? 'bg-green-100 text-green-700' :
                  claim.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                  claim.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {claim.status}
                </span>
              </div>
              {claim.evidence_text && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{claim.evidence_text}</p>
              )}
              {claim.status === 'submitted' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleVerify(claim.id, true)}
                    disabled={isPending}
                    className="flex-1 rounded-md bg-green-600 py-2 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Approve (+{quest.reward_mly} $MLY)
                  </button>
                  <button
                    onClick={() => handleVerify(claim.id, false)}
                    disabled={isPending}
                    className="rounded-md border border-red-200 px-3 py-2 text-xs text-red-600 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
